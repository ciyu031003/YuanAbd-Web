/* admin/src/db.cjs — PostgreSQL 连接池（使用 pg 驱动） */
"use strict";
const { Pool } = require("pg");
const config = require("./config.cjs");

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: config.db.max,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
  // 共享实例上不给应用账号任何额外权限；statement_timeout 防止慢查询拖累同机其他应用
  statement_timeout: 15000,
  application_name: "yuanabd-pc-fixboxs-admin"
});

pool.on("error", function (e) {
  console.error("[db] 连接池异常：" + e.message);
});

async function query(sql, params) {
  return pool.query(sql, params);
}

async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await fn(client);
    await client.query("COMMIT");
    return r;
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw e;
  } finally {
    client.release();
  }
}

/* 启动自检（V2 上篇 §4.2 的 D 项）：防止环境变量配错连上别人的库 */
async function assertCorrectDatabase() {
  const r = await query("SELECT current_database() AS db");
  const actual = r.rows[0].db;
  if (actual !== config.db.database) {
    console.error("[db] 严重错误：连接到了错误的数据库");
    console.error("  期望：" + config.db.database);
    console.error("  实际：" + actual);
    process.exit(1);
  }
  return actual;
}

async function healthcheck() {
  try {
    const r = await query("SELECT 1 AS ok");
    return r.rows.length === 1;
  } catch (e) { return false; }
}

module.exports = { pool: pool, query: query, tx: tx, assertCorrectDatabase: assertCorrectDatabase, healthcheck: healthcheck };
