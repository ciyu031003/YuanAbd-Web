/* ============================================================
   check-sources.cjs — 修盒子来源外链体检（CLI 与内容后台共用）
   ------------------------------------------------------------
   · 收集 content/fixboxs/*.md 的 front-matter sources[].url
     与正文 Markdown 外链（http/https），去重后并发探测。
   · 探测用 GET（部分站点拒绝 HEAD）；UA 伪装普通浏览器；
     8s 超时；最多 5 跳重定向；拿到响应头即断开，不下载正文。
   · 服务器部署在广州（腾讯云），探测结果天然近似「大陆读者
     能不能打开」的视角——被墙/反爬都会在这里现形。
   · 分类口径（与 2026-10-27 审计一致）：
       ok        2xx / 3xx 末跳
       dead      404 / 410（确认死链，应换现行页面）
       blocked   401/403/405/412/429/999（疑似反爬，需人工复核）
       network   超时 / ECONNRESET / ENOTFOUND / EAI_AGAIN 等
                 （疑似被墙或网络异常，大陆服务器视角）
       server    其余 5xx / 4xx（站点侧问题）
   · 只读不改文件。结果对象同时供 CLI 打印与后台页面渲染。
   · 用法：
       node check-sources.cjs                # 人类可读报告
       node check-sources.cjs --json        # 仅输出 JSON
       node check-sources.cjs --only-bad    # 只打印非 ok 条目
   · 退出码：发现 dead 类链接时为 2，否则 0（便于 CI / 部署闸门）。
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, "content", "fixboxs");
const fx = require(path.join(ROOT, "fx-frontmatter.cjs"));

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const CONCURRENCY = 8;

/* ---------- 收集：url -> { articles: Set<slug>, where: Set<"fm"|"body"> } ---------- */
function collect() {
  const map = new Map();
  const files = fs.readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    let meta = null;
    let body = raw;
    try {
      const parsed = fx.parse(raw);
      meta = parsed.meta;
      body = parsed.body;
    } catch (e) {
      meta = null;
    }
    const add = (url, where) => {
      if (!/^https?:\/\//i.test(url)) return; // 只看外链；站内 ./x.html 由 lint 与构建负责
      if (!map.has(url)) map.set(url, { articles: new Set(), where: new Set() });
      map.get(url).articles.add(slug);
      map.get(url).where.add(where);
    };
    if (meta && Array.isArray(meta.sources)) {
      for (const s of meta.sources) {
        if (s && typeof s.url === "string") add(s.url.trim(), "fm");
      }
    }
    const linkRe = /\]\((https?:\/\/[^)\s]+)/g;
    let m;
    while ((m = linkRe.exec(body))) add(m[1].replace(/[).,]+$/, ""), "body");
  }
  return map;
}

/* ---------- 单条探测：跟随重定向，返回 { status, ms, finalUrl, error } ---------- */
function probe(url, redirectsLeft) {
  return new Promise((resolve) => {
    const started = Date.now();
    let settled = false;
    let mod;
    try {
      mod = /^https:/i.test(url) ? https : http;
    } catch (e) {
      return resolve({ status: 0, ms: 0, finalUrl: url, error: "invalid-url" });
    }
    let u;
    try {
      u = new URL(url);
    } catch (e) {
      return resolve({ status: 0, ms: 0, finalUrl: url, error: "invalid-url" });
    }
    const req = mod.request(u, {
      method: "GET",
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      timeout: TIMEOUT_MS,
      rejectUnauthorized: false, // 只测可达性，不校验证书链（过期证书也算「站点有问题」而非网络不可达）
    }, (res) => {
      const code = res.statusCode || 0;
      // 重定向：交给下一跳（Location 可能是相对路径）
      if (code >= 300 && code < 400 && res.headers.location && redirectsLeft > 0) {
        res.resume(); // 丢弃 body
        let next;
        try {
          next = new URL(res.headers.location, u).toString();
        } catch (e) {
          settled = true;
          return resolve({ status: code, ms: Date.now() - started, finalUrl: url, error: "bad-redirect" });
        }
        if (/^https?:/i.test(next)) {
          // 先消耗本响应再探下一跳
          res.resume();
          probe(next, redirectsLeft - 1).then((r) => {
            resolve({ status: r.status, ms: Date.now() - started, finalUrl: next, error: r.error });
          });
          return;
        }
      }
      res.resume(); // 拿到状态码即可，断开不下载
      settled = true;
      resolve({ status: code, ms: Date.now() - started, finalUrl: url, error: null });
    });
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", (e) => {
      if (settled) return;
      settled = true;
      const code = e && (e.code || e.message || "error");
      resolve({ status: 0, ms: Date.now() - started, finalUrl: url, error: String(code) });
    });
    req.end();
  });
}

/* ---------- 分类 ---------- */
function classify(r) {
  if (r.error === "timeout" || /^E[A-Z]+$/.test(r.error || "") || r.error === "timeout") return "network";
  if (r.error) return "network";
  if (r.status >= 200 && r.status < 300) return "ok";
  if (r.status >= 300 && r.status < 400) return "ok"; // 末跳仍是 3xx：按可达处理，标状态供人工看
  if (r.status === 404 || r.status === 410) return "dead";
  if (r.status === 401 || r.status === 403 || r.status === 405 || r.status === 412 || r.status === 429 || r.status === 999) return "blocked";
  if (r.status >= 500) return "server";
  return "server";
}

/* ---------- 并发池 ---------- */
function pool(items, worker, concurrency) {
  concurrency = concurrency || CONCURRENCY;
  return new Promise((resolve) => {
    const results = new Array(items.length);
    let idx = 0;
    let done = 0;
    function next() {
      if (idx >= items.length) {
        if (done >= items.length) resolve(results);
        return;
      }
      const i = idx++;
      worker(items[i], i).then((r) => {
        results[i] = r;
        done++;
        next();
      });
    }
    for (let k = 0; k < Math.min(concurrency, items.length); k++) next();
  });
}

/* ---------- 主流程 ---------- */
async function run() {
  const map = collect();
  const urls = [...map.keys()];
  if (process.env.FX_CHECK_DEBUG) console.error("[debug] urls:", urls.length);
  const probed = await pool(urls, async (url) => {
    const r = await probe(url, MAX_REDIRECTS);
    if (process.env.FX_CHECK_DEBUG) console.error("[debug]", r.status, r.error || "", url.slice(0, 60));
    const info = map.get(url);
    return {
      url: url,
      status: r.status,
      ms: r.ms,
      error: r.error,
      finalUrl: r.finalUrl !== url ? r.finalUrl : undefined,
      kind: classify(r),
      articles: [...info.articles].sort(),
      where: [...info.where].sort(),
    };
  });
  probed.sort((a, b) => a.url.localeCompare(b.url));
  const summary = { total: probed.length, ok: 0, dead: 0, blocked: 0, network: 0, server: 0 };
  for (const p of probed) summary[p.kind]++;
  return { ranAt: new Date().toISOString(), summary: summary, urls: probed };
}

/* ---------- CLI ---------- */
module.exports = { run: run, classify: classify, probe: probe, collect: collect, pool: pool };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const onlyBad = argv.includes("--only-bad");
  run().then((rep) => {
    if (asJson) {
      console.log(JSON.stringify(rep, null, 2));
      process.exitCode = rep.summary.dead > 0 ? 2 : 0;
      return;
    }
    const label = { ok: "正常", dead: "死链", blocked: "疑似反爬", network: "疑似被墙/网络", server: "服务端错误" };
    console.log("=== 修盒子来源外链体检 ===");
    console.log("时间：", rep.ranAt, " 共", rep.summary.total, "条");
    console.log(
      "正常", rep.summary.ok,
      "｜死链", rep.summary.dead,
      "｜疑似反爬", rep.summary.blocked,
      "｜疑似被墙/网络", rep.summary.network,
      "｜服务端错误", rep.summary.server
    );
    const bad = rep.urls.filter((u) => u.kind !== "ok");
    for (const u of (onlyBad ? bad : rep.urls)) {
      console.log("[" + label[u.kind] + "] " + u.status + (u.error ? "/" + u.error : "") + " " + u.url);
      console.log("        文章：" + u.articles.join(", "));
    }
    if (rep.summary.dead > 0) {
      console.log("\n发现", rep.summary.dead, "条死链（404/410），请换成现行官方页面。");
      process.exitCode = 2;
      return;
    }
    console.log("\n无确认死链。blocked/network 条目属「需人工复核」，不代表可删。");
    process.exitCode = 0;
  }).catch((e) => {
    console.error("体检失败：", e);
    process.exitCode = 1;
  });
}
