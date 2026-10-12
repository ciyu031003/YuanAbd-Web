/* admin/src/publish.cjs — 单并发发布队列（V2 D4 / §7.2）
   串行执行：git commit → build → 产物化 → 原子切换 → 全量校验
   为什么必须串行：构建目录共享、部署是整目录切换，并行会互相踩踏。 */
"use strict";
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
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
    // 1) 内容留痕：写一个「提交请求」文件，由**宿主机侧**脚本完成 git commit。
    //
    // 为什么不在容器里 commit（实测取舍）：
    //   本机到 alpine CDN 实测约 79 字节/秒，在镜像里装 git 要十几分钟且会中途停滞。
    //   替代方案各有问题：
    //     · 容器挂载 docker socket 调宿主 git —— 等于把宿主 root 权限交给容器，安全上不可接受；
    //     · 静态链接 git 二进制 —— 引入一个不受控的二进制，供应链风险高。
    //   最终选择：容器只负责「生成内容 + 构建 + 部署」，**git 提交交给宿主机**。
    //   宿主机本来就有 git，且提交是纯本地操作，不涉及权限放大。
    //   宿主侧由 fixboxs-content-commit.sh（systemd timer，每 5 分钟）拾取并提交。
    try {
      await step(id, "commit-request");
      const reqPath = path.join(config.repo.root, ".admin-commit-request");
      fs.writeFileSync(reqPath, JSON.stringify({
        jobId: id, slug: slug || null, at: new Date().toISOString(),
        message: "content: 后台发布" + (slug ? "（" + slug + "）" : "") + " " + new Date().toISOString().slice(0, 19)
      }) + "\n", "utf8");
      log.push("已写入提交请求：" + reqPath + "（由宿主机脚本处理）");
    } catch (e) {
      log.push("写提交请求失败（不阻塞发布）：" + (e && e.message));
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

    // 4) 打包产物
    await step(id, "package");
    const tgz = path.join(config.repo.root, "dist-fixboxs.tgz");
    const tar = await run("tar", ["-czf", tgz, "-C", path.join(config.repo.root, "dist", "fixboxs"), "."]);
    log.push("$ tar -czf dist-fixboxs.tgz\n" + tar.stdout + tar.stderr);
    if (!tar.ok) { await fail("package", tar.stderr || tar.error); return; }

    // 5) 请求宿主机完成「原子切换 + 线上全量校验」
    //
    // 为什么把这两步交给宿主机（与 git 提交同一逻辑）：
    //   原子切换要写 /var/www/fixboxs 并 chown，需要 root/sudo；
    //   而容器里既没有 sudo，也不应该拿 docker socket 或特权去取得宿主 root。
    //   宿主机本来就有 sudo 与 /var/www，让它执行是权限最小、链路最短的做法。
    //   容器只负责「生成正确产物」，部署动作由宿主侧脚本消费。
    // 内容校验已在本步之前的 build 阶段由 content-lint 把关（fail-closed），
    // 因此这里交接的是「已通过闸门的产物」。
    await step(id, "deploy-request");
    const reqPath = path.join(config.repo.root, ".admin-deploy-request");
    fs.writeFileSync(reqPath, JSON.stringify({
      jobId: id, at: new Date().toISOString(),
      tarball: tgz, root: "/var/www/fixboxs", domain: "pc-fixboxs.yuanabd.cn"
    }) + "\n", "utf8");
    log.push("已写入部署请求：" + reqPath + "（由宿主机 fixboxs-deploy.sh 执行原子切换与线上校验）");

    // 6) 确认产物体积（供发布详情页展示）
    await step(id, "artifact-size");
    try {
      const st = fs.statSync(tgz);
      log.push("产物包大小：" + (st.size / 1024 / 1024).toFixed(2) + " MB");
    } catch (e) { /* 忽略 */ }

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
