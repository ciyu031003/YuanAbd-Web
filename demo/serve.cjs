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
    // HTML 不强缓存，静态资源缓存 1 小时（本地预览；生产可用 hash + immutable）
    const cache = isHtml
      ? "no-cache"
      : (COMPRESSIBLE.includes(ext) ? "public, max-age=3600" : "public, max-age=86400");

    const headers = {
      "Content-Type": type,
      "Cache-Control": cache,
      "X-Content-Type-Options": "nosniff",
      "Content-Length": st.size,
    };

    fs.readFile(filePath, (rerr, data) => {
      if (rerr) { res.writeHead(500); res.end("read error"); return; }

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
