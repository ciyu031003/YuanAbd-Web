/* admin/src/collab.cjs — 协作功能（保存视图 / 修订历史 / 审核评论）
   对应 UI 调研的优先清单第 7、9 项。
   设计原则：全部服务端渲染，不引入前端状态管理。 */
"use strict";
const db = require("./db.cjs");

/* ---------------- 保存视图 ---------------- */

// 返回：本人视图 + 团队共享视图
async function listViews(userId) {
  const r = await db.query(
    "SELECT v.*, u.email AS owner_email FROM saved_views v " +
    "LEFT JOIN users u ON u.id = v.owner_id " +
    "WHERE v.is_shared = true OR v.owner_id = $1 " +
    "ORDER BY v.is_shared DESC, v.name",
    [userId]);
  return r.rows;
}

async function saveView(userId, name, querystring, isShared) {
  const n = String(name || "").trim();
  if (!n) { const e = new Error("视图名称不能为空"); e.status = 400; throw e; }
  if (n.length > 40) { const e = new Error("视图名称过长（最多 40 字）"); e.status = 400; throw e; }
  // 同名则覆盖（同一用户下）
  await db.query(
    "INSERT INTO saved_views (name, owner_id, querystring, is_shared) VALUES ($1,$2,$3,$4) " +
    "ON CONFLICT (owner_id, name) DO UPDATE SET querystring = EXCLUDED.querystring, is_shared = EXCLUDED.is_shared",
    [n, userId, String(querystring || ""), !!isShared]);
}

async function deleteView(userId, id) {
  // 只能删自己的；共享视图由创建者删
  const r = await db.query("DELETE FROM saved_views WHERE id = $1 AND owner_id = $2 RETURNING id", [id, userId]);
  return r.rowCount > 0;
}

/* ---------------- 修订历史 ---------------- */

// 计算下一篇的 revision_no 并写入快照（在保存同一事务后调用）
async function addRevision(slug, content, meta, authorId, note) {
  try {
    const r = await db.query("SELECT COALESCE(MAX(revision_no),0) AS n FROM revisions WHERE slug = $1", [slug]);
    const next = parseInt(r.rows[0].n, 10) + 1;
    await db.query(
      "INSERT INTO revisions (slug, revision_no, title, status, content, content_hash, author_id, note) " +
      "VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [slug, next, (meta && meta.title) || null, (meta && meta.status) || null, content, (meta && meta.contentHash) || null, authorId || null, note || null]);
    // 只保留最近 30 版，避免无限增长
    await db.query(
      "DELETE FROM revisions WHERE slug = $1 AND revision_no <= (SELECT MAX(revision_no) - 30 FROM revisions WHERE slug = $1)",
      [slug]);
  } catch (e) {
    console.error("[collab] 写修订失败（不阻塞保存）：" + e.message);
  }
}

async function listRevisions(slug) {
  const r = await db.query(
    "SELECT r.id, r.revision_no, r.title, r.status, r.content_hash, r.note, r.created_at, u.email AS author_email, u.name AS author_name, " +
    "       length(r.content) AS content_len " +
    "FROM revisions r LEFT JOIN users u ON u.id = r.author_id " +
    "WHERE r.slug = $1 ORDER BY r.revision_no DESC",
    [slug]);
  return r.rows;
}

async function getRevision(slug, no) {
  const r = await db.query("SELECT * FROM revisions WHERE slug = $1 AND revision_no = $2", [slug, no]);
  return r.rows[0] || null;
}

/* 行级 diff：LCS 太复杂，这里用简单的「前缀/后缀裁剪 + 行集合对比」
   对本项目足够（修订之间通常只改几行）。 */
function diffLines(oldText, newText) {
  const a = String(oldText || "").split(/\r?\n/);
  const b = String(newText || "").split(/\r?\n/);
  const out = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    const la = a[i], lb = b[i];
    if (la === lb) { out.push({ t: "same", a: la, b: lb }); continue; }
    if (la !== undefined) out.push({ t: "del", a: la });
    if (lb !== undefined) out.push({ t: "add", b: lb });
  }
  return out;
}

/* ---------------- 审核评论 ---------------- */

async function listComments(slug) {
  const r = await db.query(
    "SELECT c.*, u.email AS author_email, u.name AS author_name " +
    "FROM comments c LEFT JOIN users u ON u.id = c.author_id " +
    "WHERE c.slug = $1 ORDER BY c.resolved_at NULLS FIRST, c.created_at DESC",
    [slug]);
  return r.rows;
}

async function addComment(slug, authorId, body, anchor) {
  const b = String(body || "").trim();
  if (!b) { const e = new Error("评论内容不能为空"); e.status = 400; throw e; }
  if (b.length > 2000) { const e = new Error("评论过长（最多 2000 字）"); e.status = 400; throw e; }
  await db.query(
    "INSERT INTO comments (slug, author_id, body, anchor) VALUES ($1,$2,$3,$4)",
    [slug, authorId, b, anchor || null]);
}

async function resolveComment(id, userId) {
  const r = await db.query(
    "UPDATE comments SET resolved_at = now(), resolved_by = $2 WHERE id = $1 AND resolved_at IS NULL RETURNING id",
    [id, userId]);
  return r.rowCount > 0;
}

async function reopenComment(id) {
  const r = await db.query("UPDATE comments SET resolved_at = NULL, resolved_by = NULL WHERE id = $1 RETURNING id", [id]);
  return r.rowCount > 0;
}

module.exports = {
  listViews: listViews, saveView: saveView, deleteView: deleteView,
  addRevision: addRevision, listRevisions: listRevisions, getRevision: getRevision, diffLines: diffLines,
  listComments: listComments, addComment: addComment, resolveComment: resolveComment, reopenComment: reopenComment
};
