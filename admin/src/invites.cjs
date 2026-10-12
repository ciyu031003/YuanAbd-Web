/* admin/src/invites.cjs — 账号分发（V2 §5.2）
   root/admin 创建账号 → 生成一次性激活链接 → 被邀请人设置密码 → 首次登录必须改密 */
"use strict";
const crypto = require("crypto");
const db = require("./db.cjs");
const auth = require("./auth.cjs");

const INVITE_TTL_HOURS = 72;

function newToken() { return crypto.randomBytes(32).toString("base64url"); }

async function create(opts) {
  const email = String(opts.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    const e = new Error("邮箱格式不正确"); e.status = 400; throw e;
  }
  const allowed = ["admin", "reviewer", "editor", "viewer"];
  if (allowed.indexOf(opts.role) < 0) { const e = new Error("角色非法"); e.status = 400; throw e; }

  // 已存在同邮箱的启用账号 → 拒绝（避免重复账号）
  const exist = await db.query("SELECT id, status FROM users WHERE lower(email) = $1", [email]);
  if (exist.rows.length && exist.rows[0].status === "active") {
    const e = new Error("该邮箱已有启用中的账号"); e.status = 409; throw e;
  }

  const token = newToken();
  const expires = new Date(Date.now() + INVITE_TTL_HOURS * 3600 * 1000);
  await db.query(
    "INSERT INTO invites (email, role, scope_domain, token_hash, created_by, expires_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [email, opts.role, opts.scope_domain || null, auth.sha256(token), opts.createdBy, expires]
  );
  return { email: email, role: opts.role, token: token, expiresAt: expires };
}

/* 校验激活 token：必须存在、未使用、未撤销、未过期 */
async function verify(token) {
  if (!token || typeof token !== "string" || token.length < 20) return null;
  const r = await db.query(
    "SELECT * FROM invites WHERE token_hash = $1 AND used_at IS NULL AND revoked_at IS NULL AND expires_at > now()",
    [auth.sha256(token)]);
  return r.rows[0] || null;
}

/* 消费激活 token：创建账号 + 角色，标记 token 已用。
   在事务内完成，避免「token 用了但账号没建成」。 */
async function consume(token, password) {
  const inv = await verify(token);
  if (!inv) { const e = new Error("激活链接无效或已过期"); e.status = 400; throw e; }

  return db.tx(async function (client) {
    // 二次确认（并发下防止重复消费）
    const lock = await client.query(
      "SELECT id FROM invites WHERE id = $1 AND used_at IS NULL AND revoked_at IS NULL FOR UPDATE", [inv.id]);
    if (!lock.rows.length) { const e = new Error("激活链接已被使用"); e.status = 400; throw e; }

    const hash = auth.hashPassword(password);
    // 若该邮箱已有被停用的账号，则复用并重置密码；否则新建
    const exist = await client.query("SELECT id FROM users WHERE lower(email) = $1", [inv.email]);
    let userId;
    if (exist.rows.length) {
      userId = exist.rows[0].id;
      await client.query(
        "UPDATE users SET password_hash = $2, status = 'active', must_change_password = true, " +
        "failed_logins = 0, locked_until = NULL, updated_at = now() WHERE id = $1", [userId, hash]);
      await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
    } else {
      const ins = await client.query(
        "INSERT INTO users (email, name, password_hash, is_root, status, must_change_password, created_by) " +
        "VALUES ($1, $2, $3, false, 'active', true, $4) RETURNING id",
        [inv.email, inv.email.split("@")[0], hash, inv.created_by]);
      userId = ins.rows[0].id;
    }
    await client.query(
      "INSERT INTO user_roles (user_id, role, scope_domain, granted_by) VALUES ($1,$2,$3,$4) " +
      "ON CONFLICT (user_id, role, scope_domain) DO NOTHING",
      [userId, inv.role, inv.scope_domain || null, inv.created_by]);
    await client.query("UPDATE invites SET used_at = now() WHERE id = $1", [inv.id]);
    return { id: userId, email: inv.email, role: inv.role };
  });
}

async function revoke(token) {
  const inv = await verify(token);
  if (!inv) return false;
  await db.query("UPDATE invites SET revoked_at = now() WHERE id = $1", [inv.id]);
  return true;
}

module.exports = { create: create, verify: verify, consume: consume, revoke: revoke, INVITE_TTL_HOURS: INVITE_TTL_HOURS };
