/* admin/src/reset-root-password.cjs — root 密码离线恢复（V2 §5.1.4）
   设计：不引入 SMTP，不用邮件找回。忘记 root 密码时，由能在服务器上执行命令的人重置。
   这少了一个「邮件凭据 / 失败面 / 攻击面」，代价是恢复凭据必须由你妥善保存。 */
"use strict";
const crypto = require("crypto");
const db = require("./db.cjs");
const auth = require("./auth.cjs");

function generateInitialPassword() {
  for (;;) {
    const pw = crypto.randomBytes(24).toString("base64url");
    if (auth.validatePasswordStrength(pw).length === 0) return pw;
  }
}

async function main() {
  await db.assertCorrectDatabase();
  const r = await db.query("SELECT id, email FROM users WHERE is_root = true");
  if (!r.rows.length) { console.error("未找到 root 账号，请先运行 seed-root.cjs"); process.exit(1); }
  const pw = generateInitialPassword();
  await db.query("UPDATE users SET password_hash=$2, must_change_password=true, failed_logins=0, locked_until=NULL, status='active', updated_at=now() WHERE id=$1",
    [r.rows[0].id, auth.hashPassword(pw)]);
  await auth.destroyAllSessionsForUser(r.rows[0].id);
  await db.query("INSERT INTO audit_log (user_id, user_email, action, target, detail) VALUES ($1,$2,'root.password.reset',$2,'{}'::jsonb)",
    [r.rows[0].id, r.rows[0].email]);
  console.log("");
  console.log("════════════════════════════════════════════════════════════");
  console.log("  root 密码已重置");
  console.log("  邮箱：" + r.rows[0].email);
  console.log("  新密码：" + pw);
  console.log("  全部会话已失效；下次登录将强制改密。");
  console.log("════════════════════════════════════════════════════════════");
  console.log("");
  await db.pool.end();
}
main().catch(function (e) { console.error("重置失败：" + (e && e.message || e)); process.exit(1); });
