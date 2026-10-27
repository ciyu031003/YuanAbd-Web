/* deploy-fixboxs.cjs — 生成可独立部署的站点产物 dist/fixboxs/
   ------------------------------------------------------------
   为什么需要：
     demo/fixboxs/ 在仓库内引用共享令牌层 ../css/tokens.css（单一真源）。
     部署到服务器时站点要自包含，因此构建期把共享层复制进产物并改写引用。
   用法：
     node deploy-fixboxs.cjs
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "demo", "fixboxs");
const SHARED = path.join(ROOT, "demo", "css");
const OUT = path.join(ROOT, "dist", "fixboxs");

function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

rmrf(OUT);
copyDir(SRC, OUT);

// 1) 复制共享令牌层，使产物自包含
fs.mkdirSync(path.join(OUT, "css"), { recursive: true });
fs.copyFileSync(path.join(SHARED, "tokens.css"), path.join(OUT, "css", "tokens.css"));

// 2) 改写 tokens.css 引用：按「页面相对产物根」的深度决定前缀
//    根目录页（index/browse/...）→ ./css/tokens.css
//    fix/ 子目录页          → ../css/tokens.css
let patched = 0;
for (const f of walk(OUT).filter(function (p) { return p.endsWith(".html"); })) {
  const depth = path.relative(OUT, f).split(path.sep).length - 1;
  const prefix = depth === 0 ? "./" : "../";
  let html = fs.readFileSync(f, "utf8");
  const before = html;
  html = html.replace(/href="(?:\.\.\/|\.\/)*css\/tokens\.css"/g, 'href="' + prefix + 'css/tokens.css"');
  if (html !== before) { fs.writeFileSync(f, html, "utf8"); patched++; }
}

// 3) vendor 引擎也按内容哈希打版本。
//    为什么单独处理：three.custom.min.js 不是从 HTML 引用，而是 hardware-3d.js 里的动态 import。
//    不给它打版本，nginx 的 30 天 immutable 缓存会让「换引擎」对老用户永远不生效。
//    ⚠️ 必须在下面计算 ASSETS 版本号之前改写，否则 hardware-3d.js 的 ?v= 会与真实内容不一致。
const crypto = require("crypto");
const VENDOR = path.join(OUT, "vendor", "three", "three.custom.min.js");
if (fs.existsSync(VENDOR)) {
  const vhash = crypto.createHash("md5").update(fs.readFileSync(VENDOR)).digest("hex").slice(0, 8);
  const target = path.join(OUT, "js", "hardware-3d.js");
  if (fs.existsSync(target)) {
    let js = fs.readFileSync(target, "utf8");
    const before = js;
    js = js.replace(/"\.\.\/vendor\/three\/three\.custom\.min\.js(?:\?v=[a-f0-9]+)?"/,
      '"../vendor/three/three.custom.min.js?v=' + vhash + '"');
    if (js !== before) {
      fs.writeFileSync(target, js, "utf8");
      console.log("  引擎版本号：three.custom.min.js@" + vhash);
    }
  }
}

// 4) 资源版本号：按内容哈希给 css/js/数据文件打 ?v=，使长缓存可安全开启
//    （与仓库既有的 bump-asset-versions 思路一致，但这里按内容自动计算）
const ASSETS = ["css/tokens.css", "css/theme-fix.css", "css/fix.css", "css/fix-neu.css", "css/fix-atmosphere.css",
  "css/hardware.css", "js/fix.js", "js/hardware-3d.js", "data/articles.js", "data/hardware-parts.js"];
const SCRIPTS = path.join(OUT, "scripts");
if (fs.existsSync(SCRIPTS)) {
  walk(SCRIPTS).filter(function (p) { return p.endsWith(".bat"); }).forEach(function (p) {
    ASSETS.push(path.relative(OUT, p).split(path.sep).join("/"));
  });
}
const versions = {};
for (const rel of ASSETS) {
  const p = path.join(OUT, rel);
  if (fs.existsSync(p)) {
    versions[rel] = crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex").slice(0, 8);
  }
}
let stamped = 0;
for (const f of walk(OUT).filter(function (p) { return p.endsWith(".html"); })) {
  const depth = path.relative(OUT, f).split(path.sep).length - 1;
  const prefix = depth === 0 ? "./" : "../";
  let html = fs.readFileSync(f, "utf8");
  const before = html;
  for (const rel of ASSETS) {
    if (!versions[rel]) continue;
    // 产物来自干净副本，属性里本就没有查询串，直接做精确字符串替换即可
    const from = '"' + prefix + rel + '"';
    const to = '"' + prefix + rel + '?v=' + versions[rel] + '"';
    html = html.split(from).join(to);
  }
  if (html !== before) { fs.writeFileSync(f, html, "utf8"); stamped++; }
}
// 5) 自检：所有本地资源引用都能解析到真实文件
const problems = [];
for (const f of walk(OUT).filter(function (p) { return p.endsWith(".html"); })) {
  const html = fs.readFileSync(f, "utf8");
  const refs = []
    .concat([...html.matchAll(/(?:href|src)="((?:\.\.\/|\.\/)[^"#?]+)"/g)].map(function (m) { return m[1]; }));
  for (const r of refs) {
    const target = path.resolve(path.dirname(f), r.split("?")[0]);
    if (!fs.existsSync(target)) problems.push(path.relative(OUT, f) + " -> " + r);
  }
}
const files = walk(OUT);
const bytes = files.reduce(function (n, p) { return n + fs.statSync(p).size; }, 0);
console.log("产物目录：" + path.relative(ROOT, OUT));
console.log("文件数：" + files.length + "　总体积：" + (bytes / 1024 / 1024).toFixed(2) + " MB");
console.log("tokens 引用改写：" + patched + " 个 HTML");
console.log("资源版本号：" + Object.keys(versions).map(function (k) { return k + "@" + versions[k]; }).join("  "));
console.log("已打版本号：" + stamped + " 个 HTML");
console.log("本地资源断链：" + (problems.length ? "\n  " + problems.slice(0, 20).join("\n  ") : "0 ✅"));
if (problems.length) process.exitCode = 1;
