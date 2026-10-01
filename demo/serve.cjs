/* ============================================================
   serve.cjs — 本地预览静态服务器（增强版）
   - gzip 压缩（文本类资源）
   - Cache-Control 缓存策略（HTML no-cache，静态资源 max-age）
   - 完整 MIME 映射（含 .mjs/.webp/.woff2/.json/.svg）
   仅用于本地预览 demo 目录；生产由 Nginx 承担同类职责。
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = __dirname;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function contentType(ext) {
  return MIME[ext] || "application/octet-stream";
}

const COMPRESSIBLE = [".html", ".css", ".js", ".mjs", ".json", ".svg", ".txt", ".map"];

/* 确定性截图模式（仅本地预览）：请求带 ?test=1 时注入样式，冻结全部动画/过渡/揭示态，
   并强制字体与图片渲染策略稳定，使多次截图可逐像素比较，用于重构回归校验。
   生产环境不会命中（Nginx 不注入任何内容）。 */
const TEST_FREEZE = `<style id="dsh-test-freeze">
*,*::before,*::after{animation:none!important;transition:none!important}
html{scroll-behavior:auto!important}
[data-reveal],.split .ch,.mask__inner,.line__inner{opacity:1!important;transform:none!important}
.grain,.cursor{display:none!important}
</style>`;

http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("method not allowed");
    return;
  }

  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split("?")[0]); }
  catch { res.writeHead(400); res.end("bad request"); return; }
  if (urlPath === "/") urlPath = "/index.html";

  /* ---------- 本地样例 API（仅本地预览；线上由应用后端提供） ----------
     苦旅会根据 /api/public/stats 覆盖「数据一瞥」的静态数值，失败则保留静态值。
     线上该接口为 200（实测返回 {"total","todayNew","avgSalary","cityCount",
     "fetchedAt","platformCount"}）；本地原本没有，导致预览拿不到活数据，
     且每次资源回归都多一条 404 噪音。这里返回**同形状**的样例数据，
     数值用页面内置的静态兜底值，保证本地预览与静态值一致。 */
  if (urlPath === "/api/public/stats") {
    const body = JSON.stringify({
      total: 3279,
      todayNew: 334,
      avgSalary: 14000,
      cityCount: 47,
      platformCount: 19,
      fetchedAt: new Date().toISOString(),
    });
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(req.method === "HEAD" ? undefined : body);
    return;
  }
  const testMode = /(?:^|&)test=1(?:&|$)/.test((req.url.split("?")[1] || ""));

  // 解析后必须仍位于站点根目录内（防目录穿越：处理 .. 与兄弟目录前缀）
  const root = path.resolve(ROOT);
  const filePath = path.resolve(root, "." + urlPath);
  const safe = filePath === root || filePath.startsWith(root + path.sep);
  if (!safe) { res.writeHead(403); res.end("forbidden"); return; }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 not found: " + urlPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = contentType(ext);
    const isHtml = ext === ".html";
    // 本地预览一律 no-store：改完源码刷新即生效。
    // （曾对 CSS/JS 设 max-age=3600，导致改动后仍取到旧样式，回归比对结论被污染。）
    // 生产环境的长缓存由 Nginx 负责，与本文件无关。
    const cache = "no-store";

    const headers = {
      "Content-Type": type,
      "Cache-Control": cache,
      "Pragma": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Content-Length": st.size,
    };

    fs.readFile(filePath, (rerr, data) => {
      if (rerr) { res.writeHead(500); res.end("read error"); return; }

      // 确定性截图模式：把冻结样式注入到 <head> 之后（仅注入一次，正文不变）
      if (testMode && isHtml && !data.includes("dsh-test-freeze")) {
        const html = data.toString("utf8");
        const at = html.indexOf("<head>");
        data = Buffer.from(
          at >= 0
            ? html.slice(0, at + 6) + TEST_FREEZE + html.slice(at + 6)
            : TEST_FREEZE + html,
          "utf8"
        );
      }

      const acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
      const gz = COMPRESSIBLE.includes(ext) && acceptsGzip && Buffer.byteLength(data) > 512;
      if (gz) {
        const out = zlib.gzipSync(data);
        headers["Content-Encoding"] = "gzip";
        headers["Content-Length"] = out.length;
        headers["Vary"] = "Accept-Encoding";
        res.writeHead(200, headers);
        res.end(req.method === "HEAD" ? undefined : out);
      } else {
        res.writeHead(200, headers);
        res.end(req.method === "HEAD" ? undefined : data);
      }
    });
  });
}).listen(8080, () => console.log("serving on http://localhost:8080"));
