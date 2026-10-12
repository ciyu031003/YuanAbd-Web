/* admin/src/seed-root.cjs — 创建 root 种子账号（V2 §5.1.2）
   关键要求：**不硬编码任何默认密码**。
   初始密码随机生成，只打印一次到 stdout（部署者本人是唯一知情人），
   数据库里只存 scrypt 哈希。 */
"use strict";
const crypto = require("crypto");
const db = require("./db.cjs");
const auth = require("./auth.cjs");

// 生成满足强度要求的高熵密码（24 字节 → base64url，约 32 字符）
function generateInitialPassword() {
  for (;;) {
    const pw = crypto.randomBytes(24).toString("base64url");
    if (auth.validatePasswordStrength(pw).length === 0) return pw;
  }
}

async function main() {
  await db.assertCorrectDatabase();
  const email = (process.argv[2] || process.env.ROOT_EMAIL || "root@yuanabd.cn").trim().toLowerCase();

  const existing = await db.query("SELECT id, email FROM users WHERE is_root = true");
  if (existing.rows.length) {
    console.log("");
    console.log("已存在 root 账号：" + existing.rows[0].email);
    console.log("（不会重复创建。如需重置密码，请使用 admin/src/reset-root-password.cjs）");
    console.log("");
    await db.pool.end();
    return;
  }

  const pw = generateInitialPassword();
  const hash = auth.hashPassword(pw);

  await db.tx(async function (client) {
    const u = await client.query(
      "INSERT INTO users (email, name, password_hash, is_root, status, must_change_password) " +
      "VALUES ($1, $2, $3, true, 'active', true) RETURNING id",
      [email, "root", hash]);
    await client.query(
      "INSERT INTO user_roles (user_id, role, scope_domain) VALUES ($1, 'root', NULL)", [u.rows[0].id]);
  });

  console.log("");
  console.log("════════════════════════════════════════════════════════════");
  console.log("  root 超管账号已创建");
  console.log("════════════════════════════════════════════════════════════");
  console.log("  邮箱：" + email);
  console.log("  初始密码：" + pw);
  console.log("");
  console.log("  ⚠️  该密码只显示这一次，请立即保存到密钥管理器。");
  console.log("  ⚠️  首次登录会强制要求修改密码。");
  console.log("  ⚠️  请勿把本段输出粘贴到任何会长期留存的日志里。");
  console.log("════════════════════════════════════════════════════════════");
  console.log("");
  await db.pool.end();
}
main().catch(function (e) { console.error("创建 root 失败：" + (e && e.message || e)); process.exit(1); });
