/* admin/src/publish.cjs — 单并发发布队列（V2 D4 / §7.2）
   串行执行：git commit → build → 产物化 → 原子切换 → 全量校验
   为什么必须串行：构建目录共享、部署是整目录切换，并行会互相踩踏。 */
"use strict";
const { execFile } = require("child_process");
const path = require("path");
const db = require("./db.cjs");
const config = require("./config.cjs");

let running = false;

/* 入队：写 publish_jobs（DB 层的部分唯一索引保证同时最多一个 running） */
async function enqueue(slug, action, userId) {
  const r = await db.query(
    "INSERT INTO publish_jobs (slug, action, status, created_by) VALUES ($1,$2,'queued',$3) RETURNING id, status",
    [slug, action || "publish", userId || null]);
  // 异步触发消费（不阻塞 HTTP 响应）
  setImmediate(function () { drain(); });
  return r.rows[0];
}

function run(cmd, args, opts) {
  return new Promise(function (resolve) {
    execFile(cmd, args, Object.assign({ cwd: config.repo.root, timeout: 300000, maxBuffer: 8 * 1024 * 1024 }, opts || {}),
      function (err, stdout, stderr) {
        resolve({ ok: !err, code: err ? (err.code || 1) : 0, stdout: String(stdout || ""), stderr: String(stderr || ""), error: err ? String(err.message) : null });
      });
  });
}

/* 消费队列：一次只处理一个 */
async function drain() {
  if (running) return;
  if (!config.publish.enabled) return;
  running = true;
  try {
    for (;;) {
      // 取一个排队中的任务
      const q = await db.query("SELECT id FROM publish_jobs WHERE status = 'queued' ORDER BY id LIMIT 1");
      if (!q.rows.length) break;
      const id = q.rows[0].id;
      // 置为 running（部分唯一索引兜底：已有 running 时会抛错，此时让出）
      try {
        await db.query("UPDATE publish_jobs SET status='running', started_at=now(), steps='[]'::jsonb WHERE id=$1 AND status='queued'", [id]);
      } catch (e) { break; }
      await execute(id);
    }
  } finally {
    running = false;
  }
}

async function step(id, name, detail) {
  await db.query(
    "UPDATE publish_jobs SET steps = COALESCE(steps,'[]'::jsonb) || $2::jsonb WHERE id = $1",
    [id, JSON.stringify([{ step: name, at: new Date().toISOString(), detail: detail || null }])]);
}

async function execute(id) {
  const steps = [];
  const log = [];
  const fail = async function (stage, detail) {
    await db.query("UPDATE publish_jobs SET status='failed', error=$2, log=$3, finished_at=now() WHERE id=$1",
      [id, stage + "：" + String(detail).slice(0, 800), log.join("\n").slice(0, 20000)]);
  };
  try {
    // 1) git commit（内容变更留痕；无变更则跳过）
    if (config.publish.enabled) {
      await step(id, "git-add");
      const add = await run("git", ["add", "content"]);
      log.push("$ git add content\n" + add.stdout + add.stderr);
      const st = await run("git", ["status", "--porcelain", "content"]);
      if (st.stdout.trim()) {
        await step(id, "git-commit");
        const msg = "content: 后台发布（" + new Date().toISOString().slice(0, 19) + "）";
        const ci = await run("git", ["-c", "user.name=" + config.publish.gitAuthorName,
          "-c", "user.email=" + config.publish.gitAuthorEmail, "commit", "-m", msg]);
        log.push("$ git commit\n" + ci.stdout + ci.stderr);
        if (!ci.ok) { await fail("git-commit", ci.stderr || ci.error); return; }
      } else {
        log.push("（内容无变更，跳过 commit）");
      }
    }

    // 2) 构建（含 content-lint 闸门，fail-closed）
    await step(id, "build");
    const build = await run("node", ["build-fix.cjs"]);
    log.push("$ node build-fix.cjs\n" + build.stdout + build.stderr);
    if (!build.ok) { await fail("build", build.stderr || build.stdout); return; }

    // 3) 产物化
    await step(id, "artifact");
    const art = await run("node", ["deploy-fixboxs.cjs"]);
    log.push("$ node deploy-fixboxs.cjs\n" + art.stdout + art.stderr);
    if (!art.ok) { await fail("artifact", art.stderr || art.stdout); return; }

    // 4) 原子切换
    await step(id, "switch");
    const tgz = path.join(config.repo.root, "dist-fixboxs.tgz");
    const tar = await run("tar", ["-czf", tgz, "-C", path.join(config.repo.root, "dist", "fixboxs"), "."]);
    log.push("$ tar\n" + tar.stdout + tar.stderr);
    if (!tar.ok) { await fail("tar", tar.stderr || tar.error); return; }
    const sw = await run("bash", [path.join(config.repo.root, "atomic-switch.sh"), tgz, "/var/www/fixboxs"],
      { cwd: config.repo.root });
    log.push("$ atomic-switch.sh\n" + sw.stdout + sw.stderr);
    if (!sw.ok) { await fail("switch", sw.stderr || sw.stdout); return; }

    // 5) 线上全量校验
    await step(id, "verify");
    const vf = await run("bash", [path.join(config.repo.root, "verify-live.sh"),
      "--dir", path.join(config.repo.root, "dist", "fixboxs"), "--domain", "pc-fixboxs.yuanabd.cn"],
      { cwd: config.repo.root });
    log.push("$ verify-live.sh\n" + vf.stdout + vf.stderr);
    if (!vf.ok) { await fail("verify", vf.stderr || vf.stdout); return; }

    // 6) 可选 push（备份；失败不阻塞发布 —— V2 §7.1 第 8 步）
    if (config.publish.push) {
      await step(id, "git-push");
      const ps = await run("git", ["push", "origin", "main"]);
      log.push("$ git push\n" + ps.stdout + ps.stderr);
      if (!ps.ok) log.push("（push 失败，不阻塞发布；后台可重试）");
    }

    await db.query("UPDATE publish_jobs SET status='succeeded', log=$2, finished_at=now() WHERE id=$1",
      [id, log.join("\n").slice(0, 20000)]);
  } catch (e) {
    await fail("exception", e && e.stack || String(e));
  }
}

function start() {
  if (!config.publish.enabled) {
    console.log("[publish] 已禁用（PUBLISH_ENABLED=false）");
    return;
  }
  // 启动时把残留的 running 置回 queued（进程重启导致的中断）
  db.query("UPDATE publish_jobs SET status='queued', started_at=NULL WHERE status='running'")
    .then(function () { return drain(); })
    .catch(function (e) { console.error("[publish] 启动清理失败：" + e.message); });
  setInterval(function () { drain().catch(function () {}); }, 8000);
  console.log("[publish] 队列已启动（轮询 8s，单并发）");
}

module.exports = { enqueue: enqueue, drain: drain, start: start, run: run };
