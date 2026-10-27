/* 修盒子 BAT 模块回归测试：文章声明、脚本存在性、安全边界与基本批处理结构。 */
"use strict";
const fs = require("fs");
const path = require("path");
const fx = require("./fx-frontmatter.cjs");

const ROOT = __dirname;
const CONTENT = path.join(ROOT, "content", "fixboxs");
const SCRIPTS = path.join(ROOT, "demo", "fixboxs", "scripts");
const LINK_RE = /-\s*下载[：:]\s*\[[^\]]+\]\((\.\.\/scripts\/[a-z0-9-]+\.bat)\)/i;
const FORBIDDEN = [
  /\bdiskpart\b/i,
  /\bformat\s+[a-z]:/i,
  /\bclean\s+all\b/i,
  /\bdel\s+[^\r\n]*[a-z]:\\\*\.\*/i,
  /\brd\s+\/s\s+\/q\s+[a-z]:\\?(\s|$)/i,
  /\b(?:curl|wget|bitsadmin|certutil)\b/i,
  /\breg\s+delete\s+[^\r\n]*(?:HKLM|HKEY_LOCAL_MACHINE)[^\r\n]*\/f\s*$/im,
  /^shutdown\b(?![^\r\n]*\/t\s+\d+)/im
];

const failures = [];
const linked = new Set();
let batfixArticles = 0;
const files = fs.readdirSync(CONTENT).filter(function (f) { return f.endsWith(".md"); }).sort();

files.forEach(function (file) {
  const raw = fs.readFileSync(path.join(CONTENT, file), "utf8");
  const parsed = fx.parse(raw);
  if (!parsed.body.includes("小白一键修复")) return;
  batfixArticles++;
  const match = parsed.body.match(LINK_RE);
  if (!match) {
    failures.push(file + "：小白一键修复段落缺少合法 BAT 链接");
    return;
  }
  const rel = match[1].replace("../", "");
  const full = path.join(ROOT, "demo", "fixboxs", rel);
  if (!fs.existsSync(full)) {
    failures.push(file + "：脚本不存在 " + rel);
    return;
  }
  linked.add(rel);
});

const scripts = fs.existsSync(SCRIPTS)
  ? fs.readdirSync(SCRIPTS).filter(function (f) { return f.endsWith(".bat"); }).sort()
  : [];
if (!scripts.length) failures.push("scripts 目录中没有 BAT 文件");

scripts.forEach(function (name) {
  const rel = "scripts/" + name;
  if (!linked.has(rel)) failures.push(name + "：未被任何文章引用");
  const raw = fs.readFileSync(path.join(SCRIPTS, name), "utf8").replace(/\r\n/g, "\n");
  if (!/^@echo off\n/i.test(raw)) failures.push(name + "：缺少 @echo off");
  if (!/\nchcp 65001 >nul\n/i.test(raw)) failures.push(name + "：缺少 UTF-8 代码页设置");
  if (!/\nchoice\s+\/C\s+YN/i.test(raw)) failures.push(name + "：缺少执行前确认");
  if (!/\npause\b/i.test(raw)) failures.push(name + "：结束时没有 pause");
  FORBIDDEN.forEach(function (re) {
    if (re.test(raw)) failures.push(name + "：命中高风险命令规则 " + re);
  });
  if (/fltmc >nul 2>&1/i.test(raw) && !/Start-Process[^\n]+-Verb RunAs/i.test(raw)) {
    failures.push(name + "：管理员脚本缺少 UAC 自提升");
  }
});

console.log("=== 修盒子 BAT 模块测试 ===");
console.log("文章：" + files.length + " 篇；BAT 文章：" + batfixArticles + " 篇；脚本：" + scripts.length + " 个");
if (failures.length) {
  console.log("失败：" + failures.length);
  failures.forEach(function (f) { console.log("  ✗ " + f); });
  process.exitCode = 1;
} else {
  console.log("通过 ✅ 下载链接、引用关系与安全边界一致");
}
