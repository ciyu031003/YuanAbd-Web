/* admin/src/auth.cjs — 密码、会话、CSRF、RBAC（V2 下篇 §5/§6） */
"use strict";
const crypto = require("crypto");
const config = require("./config.cjs");
const db = require("./db.cjs");

/* ------------------------------------------------------------
   密码哈希：scrypt（Node 内置，无需第三方）
   为什么可用：scrypt 是内存硬函数，抗 GPU 暴力破解；
   Node 内置实现无需引入 argon2 原生模块（那会带来编译依赖）。
   参数：N=2^15, r=8, p=1 —— 约 32MB 内存/次，单次约 50-100ms，适合后台登录频率。
   ------------------------------------------------------------ */
const SCRYPT = { N: 32768, r: 8, p: 1, keylen: 64 };

function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(plain, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 128 * 1024 * 1024 });
  return "scrypt$" + SCRYPT.N + "$" + SCRYPT.r + "$" + SCRYPT.p + "$" + salt.toString("base64") + "$" + dk.toString("base64");
}

function verifyPassword(plain, stored) {
  try {
    const p = String(stored).split("$");
    if (p[0] !== "scrypt") return false;
    const N = parseInt(p[1], 10), r = parseInt(p[2], 10), pp = parseInt(p[3], 10);
    const salt = Buffer.from(p[4], "base64");
    const expect = Buffer.from(p[5], "base64");
    const dk = crypto.scryptSync(plain, salt, expect.length, { N: N, r: r, p: pp, maxmem: 128 * 1024 * 1024 });
    return crypto.timingSafeEqual(dk, expect);
  } catch (e) { return false; }
}

/* 弱密码检测（V2 §5.1.3：不命中弱密码表）
   注意：不能只做「精确匹配弱密码表」——实测 "password123456" 这种
   「常见词 + 数字后缀」的写法会漏网。因此改为**子串 + 模式**双重判定。 */
const WEAK_WORDS = [
  "password", "passwd", "qwerty", "qwertyuiop", "administrator", "admin",
  "letmein", "welcome", "iloveyou", "monkey", "dragon", "sunshine",
  "yuanabd", "fixboxs", "abc123", "123456", "111111", "000000"
];
// 纯重复/顺序字符（如 aaaaaaaa / 123456789012）
function isTrivialSequence(pw) {
  const s = String(pw);
  if (/^(.)\1+$/.test(s)) return true;                       // 全部同一字符
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 6 && "0123456789".indexOf(digits) >= 0) return true;  // 连续数字
  const lower = s.toLowerCase();
  if (/abcdefgh|qwertyui|asdfghjk/.test(lower)) return true;
  return false;
}
function validatePasswordStrength(pw) {
  const errs = [];
  if (typeof pw !== "string" || pw.length < config.security.passwordMinLength) {
    errs.push("密码长度至少 " + config.security.passwordMinLength + " 位");
  }
  if (pw && pw.length > 200) errs.push("密码过长");
  if (pw) {
    const lower = String(pw).toLowerCase();
    const hit = WEAK_WORDS.find(function (w) { return lower.indexOf(w) >= 0; });
    if (hit) errs.push("密码包含常见词「" + hit + "」，请更换");
    else if (isTrivialSequence(pw)) errs.push("密码为简单重复或连续字符，请更换");
  }
  // 至少三类字符中的两类
  if (pw) {
    const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(function (re) { return re.test(pw); }).length;
    if (kinds < 3) errs.push("密码需包含大写字母、小写字母、数字、符号中的至少 3 类");
  }
  return errs;
}

/* ---------------- 2FA 待验证票（登录第二步用） ----------------
   只存在内存里，5 分钟过期，且绑定用户 —— 重启即失效，不落盘。 */
const pendingTotp = new Map();   // token -> { userId, expiresAt, ip, ua }
function createPendingTotp(userId, ip, ua) {
  const t = crypto.randomBytes(24).toString("base64url");
  pendingTotp.set(t, { userId: userId, expiresAt: Date.now() + 5 * 60 * 1000, ip: ip, ua: ua });
  // 顺手清理过期项，避免内存无限增长
  const now = Date.now();
  pendingTotp.forEach(function (v, k) { if (v.expiresAt < now) pendingTotp.delete(k); });
  return t;
}
function takePendingTotp(token) {
  if (!token) return null;
  const v = pendingTotp.get(token);
  pendingTotp.delete(token);            // 一次性：取出即作废
  if (!v || v.expiresAt < Date.now()) return null;
  return v;
}
function peekPendingTotp(token) {
  const v = pendingTotp.get(token || "");
  if (!v || v.expiresAt < Date.now()) return null;
  return v;
}
/* ---------------- 会话 ---------------- */
function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

async function createSession(userId, ip, ua) {
  const token = crypto.randomBytes(32).toString("base64url");   // 明文只回给浏览器
  const csrf = crypto.randomBytes(24).toString("base64url");
  const now = Date.now();
  await db.query(
    "INSERT INTO sessions (user_id, token_hash, csrf_token, ip, user_agent, expires_at, absolute_expires_at) " +
    "VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [userId, sha256(token), csrf, ip || null, (ua || "").slice(0, 300),
     new Date(now + config.session.idleMs), new Date(now + config.session.absoluteMs)]
  );
  return { token: token, csrf: csrf };
}

async function getSession(token) {
  if (!token) return null;
  const r = await db.query(
    "SELECT s.id, s.user_id, s.csrf_token, s.expires_at, s.absolute_expires_at, " +
    "       u.email, u.name, u.is_root, u.status, u.must_change_password " +
    "FROM sessions s JOIN users u ON u.id = s.user_id " +
    "WHERE s.token_hash = $1", [sha256(token)]);
  if (!r.rows.length) return null;
  const row = r.rows[0];
  const now = Date.now();
  if (new Date(row.expires_at).getTime() < now || new Date(row.absolute_expires_at).getTime() < now) {
    await db.query("DELETE FROM sessions WHERE id = $1", [row.id]);
    return null;
  }
  if (row.status !== "active") return null;
  // 滑动续期（空闲窗口）
  await db.query("UPDATE sessions SET last_seen_at = now(), expires_at = $2 WHERE id = $1",
    [row.id, new Date(now + config.session.idleMs)]);
  return row;
}

async function destroySession(token) {
  if (!token) return;
  await db.query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
}
// 改密/停用后踢掉该用户全部会话（V2 §5.7）
async function destroyAllSessionsForUser(userId) {
  await db.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
}

/* ---------------- RBAC（服务端强制） ---------------- */
/* 角色优先级：root > admin > reviewer > editor > viewer
   注意：这里只做「角色 → 能力」映射；具体路由的校验在 routes 层逐条调用 can()。 */
const CAP = {
  root:     ["article:create","article:edit","article:submit","article:review","article:publish","article:archive","user:manage","audit:read","settings:write","rollback"],
  admin:    ["article:create","article:edit","article:submit","article:review","article:publish","article:archive","user:manage","audit:read","settings:write","rollback"],
  reviewer: ["article:edit","article:submit","article:review","article:publish","article:archive","audit:read"],
  editor:   ["article:create","article:edit","article:submit"],
  viewer:   []
};

async function getRoles(userId) {
  const r = await db.query("SELECT role, scope_domain FROM user_roles WHERE user_id = $1", [userId]);
  return r.rows;
}

async function can(user, capability) {
  if (!user) return false;
  if (user.is_root) return true;              // root 拥有一切
  const roles = await getRoles(user.user_id);
  for (const r of roles) {
    const caps = CAP[r.role] || [];
    if (caps.indexOf(capability) >= 0) return true;
  }
  return false;
}

/* 作用域校验：编辑者可能被限定只能改某个领域 */
async function canEditDomain(user, domain) {
  if (!user) return false;
  if (user.is_root) return true;
  const roles = await getRoles(user.user_id);
  const scoped = roles.filter(function (r) { return r.scope_domain; });
  if (!scoped.length) return true;             // 无作用域限制 = 不限
  return scoped.some(function (r) { return r.scope_domain === domain; });
}

/* ---------------- CSRF ---------------- */
function verifyCsrf(session, provided) {
  if (!session || !provided) return false;
  const a = Buffer.from(String(session.csrf_token));
  const b = Buffer.from(String(provided));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ---------------- 登录限流（V2 §6.3） ---------------- */
const attempts = new Map();  // ip -> { count, resetAt }
function recordAttempt(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) { attempts.set(ip, { count: 1, resetAt: now + config.security.loginWindowMs }); return 1; }
  rec.count++;
  return rec.count;
}
function isRateLimited(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (rec.resetAt < Date.now()) { attempts.delete(ip); return false; }
  return rec.count >= config.security.loginMaxAttempts;
}
function clearAttempts(ip) { attempts.delete(ip); }

/* ---------------- 审计 ---------------- */
async function audit(user, action, target, detail, ip) {
  try {
    await db.query(
      "INSERT INTO audit_log (user_id, user_email, action, target, detail, ip) VALUES ($1,$2,$3,$4,$5,$6)",
      [user ? user.user_id : null, user ? user.email : null, action, target || null,
       detail ? JSON.stringify(detail) : null, ip || null]
    );
  } catch (e) {
    console.error("[audit] 写审计失败：" + e.message);
  }
}

module.exports = {
  createPendingTotp: createPendingTotp, takePendingTotp: takePendingTotp, peekPendingTotp: peekPendingTotp,
  hashPassword: hashPassword, verifyPassword: verifyPassword, validatePasswordStrength: validatePasswordStrength,
  createSession: createSession, getSession: getSession, destroySession: destroySession,
  destroyAllSessionsForUser: destroyAllSessionsForUser,
  can: can, canEditDomain: canEditDomain, getRoles: getRoles, CAP: CAP,
  verifyCsrf: verifyCsrf,
  recordAttempt: recordAttempt, isRateLimited: isRateLimited, clearAttempts: clearAttempts,
  audit: audit, sha256: sha256
};
