#!/usr/bin/env node
/**
 * dsh-patch-cordis-dispose.cjs — 修复 DSH 的 agent/disposed 崩溃
 * ---------------------------------------------------------------
 * 缺陷：fiber.dispose()（Cordis effect 拆除器）可能返回 undefined，
 *       但三处代码直接对它调用 .catch(...)，于是抛出
 *       TypeError: Cannot read properties of undefined (reading 'catch')
 *       触发路径：agent/disposed → removeScoped() / disposePrompt()
 * 修复：统一包成 Promise.resolve(fiber.dispose()).catch(...)
 *       （Cordis 自身也是这么写的：cordis/lib/index.js:1095）
 *
 * 用法：
 *   node dsh-patch-cordis-dispose.cjs --check    只检查，不修改
 *   node dsh-patch-cordis-dispose.cjs            应用补丁（自动备份）
 *
 * 注意：DSH Desktop 升级会覆盖 resources/app，升级后需重跑本脚本。
 */
"use strict";
const fs = require("fs");
const path = require("path");

const APP = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : "D:\\Program Files\\DSH Desktop\\resources\\app";
const NM = path.join(APP, "node_modules", "@deepseek-ai");

const TARGETS = [
  "dsh-tool-subagent/lib/index.js",
  "dsh-file-reference-local/lib/index.js",
  "dsh-file-reference-local/lib/types/index.js",
];

const FROM = "fiber.dispose().catch(";
const TO = "Promise.resolve(fiber.dispose()).catch(";

const checkOnly = process.argv.includes("--check");
let fixed = 0, already = 0, missing = 0;

for (const rel of TARGETS) {
  const file = path.join(NM, rel);
  if (!fs.existsSync(file)) { console.log("  跳过（文件不存在）: " + rel); missing++; continue; }
  const text = fs.readFileSync(file, "utf8");
  const hasBad = text.includes(FROM);
  const hasGood = text.includes(TO);
  if (hasGood && !hasBad) { console.log("  已修复: " + rel); already++; continue; }
  if (!hasBad) { console.log("  模式未找到（上游可能已改）: " + rel); missing++; continue; }
  if (checkOnly) { console.log("  需要修复: " + rel); fixed++; continue; }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  fs.copyFileSync(file, file + ".bak-" + stamp);
  const lines = text.split(String.fromCharCode(10)).map(function (line) {
    const idx = line.indexOf(FROM);
    if (idx === -1) return line;
    const before = line.slice(0, idx);
    if (before.endsWith("Promise.resolve(")) return line;
    return before + TO + line.slice(idx + FROM.length);
  });
  fs.writeFileSync(file, lines.join(String.fromCharCode(10)), "utf8");
  console.log("  已修复: " + rel + "  (备份 " + path.basename(file) + ".bak-" + stamp + ")");
  fixed++;
}

console.log("");
if (checkOnly) {
  console.log(fixed === 0 ? "全部已修复 OK" : fixed + " 个文件待修复");
} else {
  console.log("完成：本次修复 " + fixed + " 个，此前已修复 " + already + " 个" + (missing ? "，跳过 " + missing + " 个" : ""));
  if (fixed > 0) console.log("请重启 DSH Desktop 使补丁生效。");
}