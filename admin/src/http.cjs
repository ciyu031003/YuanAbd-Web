/* admin/src/http.cjs — 极简 HTTP 工具（无框架依赖）
   V2 §7.3.1：依赖面限定在最小范围。HTTP/路由/模板都用 Node 内置能力，
   只把 pg 与 gray-matter 作为依赖。 */
"use strict";
const crypto = require("crypto");

function parseCookies(header) {
  const out = {};
  (header || "").split(";").forEach(function (part) {
    const i = part.indexOf("=");
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function cookieHeader(name, value, opts) {
  opts = opts || {};
  let s = name + "=" + encodeURIComponent(value);
  s += "; Path=" + (opts.path || "/");
  if (opts.maxAge !== undefined) s += "; Max-Age=" + Math.floor(opts.maxAge / 1000);
  if (opts.httpOnly !== false) s += "; HttpOnly";
  if (opts.secure) s += "; Secure";
  s += "; SameSite=" + (opts.sameSite || "Lax");
  return s;
}

function clearCookieHeader(name, opts) {
  opts = opts || {};
  return name + "=; Path=" + (opts.path || "/") + "; Max-Age=0; HttpOnly; SameSite=Strict" +
    (opts.secure ? "; Secure" : "");
}

async function readBody(req, limitBytes) {
  const max = limitBytes || 2 * 1024 * 1024;
  return new Promise(function (resolve, reject) {
    let size = 0; const chunks = [];
    req.on("data", function (c) {
      size += c.length;
      if (size > max) { reject(Object.assign(new Error("请求体过大"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks).toString("utf8")); });
    req.on("error", reject);
  });
}

/* 读取原始请求体（二进制）：媒体上传用。与 readBody 的区别是不做 utf8 解码。 */
async function readBodyRaw(req, limitBytes) {
  const max = limitBytes || 8 * 1024 * 1024;
  return new Promise(function (resolve, reject) {
    let size = 0; const chunks = [];
    req.on("data", function (c) {
      size += c.length;
      if (size > max) { reject(Object.assign(new Error("请求体过大"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}
function parseForm(body) {
  const out = {};
  String(body || "").split("&").forEach(function (kv) {
    if (!kv) return;
    const i = kv.indexOf("=");
    const k = decodeURIComponent((i < 0 ? kv : kv.slice(0, i)).replace(/\+/g, " "));
    const v = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " "));
    out[k] = v;
  });
  return out;
}

function send(res, status, body, headers) {
  const h = Object.assign({ "Content-Type": "text/html; charset=utf-8" }, headers || {});
  res.writeHead(status, h);
  res.end(body);
}

function sendJson(res, status, obj, headers) {
  send(res, status, JSON.stringify(obj), Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers || {}));
}

/* HTML 转义（所有用户内容输出前必须过这里） */
function esc(s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escAttr(s) { return esc(s); }

/* 后台专属安全头（V2 §6.1） */
function securityHeaders(extra) {
  return Object.assign({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",                     // 后台不允许被 iframe 嵌入
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    // 后台是自包含页面（无外部资源），可以用很严的 CSP
    "Content-Security-Policy": [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",          // 内联样式（模板内联，无外部 CSS 依赖）
      "script-src 'self'",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "object-src 'none'"
    ].join("; "),
    "X-Robots-Tag": "noindex, nofollow, noarchive"  // 后台不被搜索引擎收录
  }, extra || {});
}

/* 从反代头取真实 IP（V2 §6.3 限流要用真实 IP） */
function clientIp(req, trustProxy) {
  if (trustProxy) {
    const xff = req.headers["x-forwarded-for"];
    if (xff) return String(xff).split(",")[0].trim();
    const xr = req.headers["x-real-ip"];
    if (xr) return String(xr).trim();
  }
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

function randomToken(bytes) { return crypto.randomBytes(bytes || 32).toString("base64url"); }

module.exports = {
  parseCookies: parseCookies, cookieHeader: cookieHeader, clearCookieHeader: clearCookieHeader,
  readBody: readBody, readBodyRaw: readBodyRaw, parseForm: parseForm,
  send: send, sendJson: sendJson, esc: esc, escAttr: escAttr,
  securityHeaders: securityHeaders, clientIp: clientIp, randomToken: randomToken
};
