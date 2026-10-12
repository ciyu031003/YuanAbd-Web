/* admin/src/migrate.cjs — 迁移执行器（V2 §4；迁移只操作本库） */
"use strict";
const fs = require("fs");
const path = require("path");
const db = require("./db.cjs");

async function main() {
  await db.assertCorrectDatabase();
  const dir = path.join(__dirname, "..", "migrations");
  const files = fs.readdirSync(dir).filter(function (f) { return f.endsWith(".sql"); }).sort();

  // 保证版本表存在
  await db.query("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const done = new Set((await db.query("SELECT version FROM schema_migrations")).rows.map(function (r) { return r.version; }));

  let applied = 0;
  for (const f of files) {
    if (done.has(f)) { console.log("  跳过（已应用）：" + f); continue; }
    const sql = fs.readFileSync(path.join(dir, f), "utf8");
    // 安全检查：共享实例上禁止全库级操作
    if (/DROP\s+DATABASE/i.test(sql)) throw new Error("迁移含 DROP DATABASE，拒绝执行：" + f);
    if (/pg_dumpall/i.test(sql)) throw new Error("迁移含 pg_dumpall，拒绝执行：" + f);
    process.stdout.write("  应用 " + f + " ... ");
    await db.query(sql);
    await db.query("INSERT INTO schema_migrations (version) VALUES ($1)", [f]);
    console.log("完成");
    applied++;
  }
  console.log("");
  console.log(applied ? "已应用 " + applied + " 个迁移。" : "无新迁移。");

  // 审计日志 append-only：收回应用角色对 audit_log 的 UPDATE/DELETE
  // 注意：本连接就是应用角色，无法 REVOKE 自己（也没必要）——
  // 该项由 db-init 脚本以超级用户执行，见 README。
  await db.pool.end();
}
main().catch(function (e) {
  console.error("迁移失败：" + (e && e.message || e));
  process.exit(1);
});
