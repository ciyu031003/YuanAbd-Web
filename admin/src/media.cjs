/* admin/src/media.cjs — 媒体库（V2 §6.4 上传安全）
   存储位置：demo/fixboxs/media/<随机名>.<ext>
     选这里的理由：demo/fixboxs 是站点源码目录，deploy-fixboxs.cjs 会整体复制到产物，
     nginx 也已对图片扩展名配了长缓存 —— 放这里不新增任何部署环节。
   元数据存 DB（media 表）：alt 文本、上传者、体积、哈希、尺寸。

   安全要点（逐条对应 V2 §6.4）：
     · 类型白名单（只接受 png/jpg/webp/gif/avif），拒绝 svg/html（可执行脚本）
     · 体积上限（默认 5MB）
     · 文件名随机生成，绝不使用用户提供的名字（防路径穿越与覆盖）
     · 写入前校验解析后的绝对路径仍在 media 目录内
     · 记录 sha256，便于查重与完整性核对
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./config.cjs");
const db = require("./db.cjs");

const MEDIA_DIR = path.join(config.repo.root, "demo", "fixboxs", "media");
const PUBLIC_PREFIX = "media/";   // 相对站点根

// 只接受真正的位图格式。**刻意不含 svg**：SVG 可内嵌脚本，是常见 XSS 载体。
const ALLOWED = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif"
};
const MAX_BYTES = 5 * 1024 * 1024;

function ensureDir() {
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

/* ---------- multipart/form-data 解析（只实现本项目需要的子集） ----------
   为什么不引第三方：本仓库后台依赖面刻意最小（V2 §7.3.1）。
   这里只处理「单个/多个文件 + 普通字段」，边界与头部按 RFC 7578 处理。 */
function parseMultipart(buffer, boundary) {
  const delim = Buffer.from("--" + boundary);
  const parts = [];
  let start = buffer.indexOf(delim);
  if (start < 0) return parts;
  start += delim.length;
  for (;;) {
    // 每个 part 以 CRLF 开头，直到下一个 delim
    if (buffer.slice(start, start + 2).toString() === "--") break;   // 结束标记
    start += 2; // skip CRLF
    const next = buffer.indexOf(delim, start);
    if (next < 0) break;
    const chunk = buffer.slice(start, next - 2); // 去掉尾部 CRLF
    const sep = chunk.indexOf("\r\n\r\n");
    if (sep > 0) {
      const rawHead = chunk.slice(0, sep).toString("utf8");
      const body = chunk.slice(sep + 4);
      const nameM = /name="([^"]*)"/.exec(rawHead);
      const fileM = /filename="([^"]*)"/.exec(rawHead);
      const typeM = /Content-Type:\s*([^\r\n]+)/i.exec(rawHead);
      parts.push({
        name: nameM ? nameM[1] : "",
        filename: fileM ? fileM[1] : null,
        contentType: typeM ? typeM[1].trim() : null,
        data: body
      });
    }
    start = next + delim.length;
  }
  return parts;
}

/* ---------- 保存文件 ---------- */
function saveBuffer(buf, contentType, originalName) {
  if (!ALLOWED[contentType]) {
    const e = new Error("不支持的文件类型：" + contentType + "（仅支持 PNG / JPEG / WebP / GIF / AVIF）");
    e.status = 400; throw e;
  }
  if (!buf || buf.length === 0) { const e = new Error("文件为空"); e.status = 400; throw e; }
  if (buf.length > MAX_BYTES) {
    const e = new Error("文件过大（" + (buf.length / 1024 / 1024).toFixed(1) + " MB），上限 " + (MAX_BYTES / 1024 / 1024) + " MB");
    e.status = 413; throw e;
  }
  ensureDir();
  const ext = ALLOWED[contentType];
  // 随机文件名：不使用用户提供的名字（防穿越/覆盖/中文编码问题）
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(6).toString("hex");
  const fname = stamp + "-" + rand + ext;
  const target = path.join(MEDIA_DIR, fname);
  // 双保险：解析后的路径必须仍在 media 目录内
  if (path.dirname(path.resolve(target)) !== path.resolve(MEDIA_DIR)) {
    const e = new Error("路径越界"); e.status = 400; throw e;
  }
  fs.writeFileSync(target, buf);
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  return {
    filename: fname,
    relPath: PUBLIC_PREFIX + fname,       // 用于 Markdown 引用（相对站点根）
    bytes: buf.length,
    sha256: sha,
    contentType: contentType
  };
}

/* ---------- 元数据读写 ---------- */
async function record(meta, userId) {
  const r = await db.query(
    "INSERT INTO media (filename, rel_path, alt, bytes, sha256, content_type, uploader_id, note) " +
    "VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
    [meta.filename, meta.relPath, meta.alt || null, meta.bytes, meta.sha256, meta.contentType, userId || null, meta.note || null]);
  return r.rows[0].id;
}

async function list(limit) {
  const r = await db.query(
    "SELECT m.*, u.email AS uploader_email FROM media m LEFT JOIN users u ON u.id = m.uploader_id " +
    "WHERE m.deleted_at IS NULL ORDER BY m.id DESC LIMIT $1",
    [limit || 100]);
  return r.rows;
}

async function getById(id) {
  const r = await db.query("SELECT * FROM media WHERE id = $1 AND deleted_at IS NULL", [id]);
  return r.rows[0] || null;
}

async function updateAlt(id, alt) {
  await db.query("UPDATE media SET alt = $2, updated_at = now() WHERE id = $1", [id, String(alt || "").trim()]);
}

/* 软删除：先标记，文件保留（避免误删后文章里的图片直接裂图） */
async function softDelete(id, userId) {
  await db.query("UPDATE media SET deleted_at = now(), deleted_by = $2 WHERE id = $1", [id, userId]);
}

/* 检查已被文章引用的媒体（删除前提示） */
async function findReferences(filename) {
  const dir = path.join(config.repo.root, config.repo.contentDir);
  const hits = [];
  if (!fs.existsSync(dir)) return hits;
  fs.readdirSync(dir).filter(function (f) { return f.endsWith(".md"); }).forEach(function (f) {
    const txt = fs.readFileSync(path.join(dir, f), "utf8");
    if (txt.indexOf(filename) >= 0) hits.push(f.replace(/\.md$/, ""));
  });
  return hits;
}

module.exports = {
  MEDIA_DIR: MEDIA_DIR, PUBLIC_PREFIX: PUBLIC_PREFIX, ALLOWED: ALLOWED, MAX_BYTES: MAX_BYTES,
  parseMultipart: parseMultipart, saveBuffer: saveBuffer,
  record: record, list: list, getById: getById, updateAlt: updateAlt,
  softDelete: softDelete, findReferences: findReferences
};
