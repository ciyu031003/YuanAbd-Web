/* content/sop-source/import-xlsx.cjs — 校验《新人故障类目SOP.xlsx》与 catalog.cjs 是否一一对应
   ------------------------------------------------------------
   为什么需要它：catalog.cjs 是手工整理的「单一真源」，而 SOP 表格是公司那边在持续更新的。
   表格一更新，这里就会报出「表格里有、catalog 里没有」的条目，提醒补进 catalog 后重新生成。

   用法：
     node content/sop-source/import-xlsx.cjs <SOP.xlsx>
   退出码：0 = 全部覆盖；2 = 有缺失（需要人工补 catalog）
   --------------------------------------------------------------------------- */
"use strict";
const path = require("path");
const { readXlsx } = require(path.join(__dirname, "xlsx.cjs"));
const cat = require(path.join(__dirname, "catalog.cjs"));

const file = process.argv[2];
if (!file) {
  console.error("用法：node content/sop-source/import-xlsx.cjs <新人故障类目SOP.xlsx>");
  process.exit(1);
}

const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
const inCatalog = new Set();
SECTIONS.forEach(function (k) {
  const s = cat[k];
  (s.items || []).forEach(function (it) { inCatalog.add(it.name.replace(/：$/, "")); });
  (s.groups || []).forEach(function (g) { g.items.forEach(function (it) { inCatalog.add(it.name.replace(/：$/, "")); }); });
});

/* 表格结构：4 个工作表；「所有技术」「培训用」是 Windows/macOS 双栏 + BadCase/客户类两列，
   「自学类」是单栏，这三个拼起来就是全部条目；「工程师现场作业标准」是现场流程。 */
const sheets = readXlsx(file);
const names = new Set();
const push = function (name) {
  if (!name) return;
  const n = String(name).trim().replace(/：$/, "");
  // 表格里的列标题不是条目
  if (!n || n === "名称" || n === "链接" || n === "BadCase" || n === "客户类") return;
  names.add(n);
};
sheets.forEach(function (sh) {
  sh.rows.forEach(function (r, i) {
    if (!r) return;
    if (sh.name === "所有技术" || sh.name === "培训用") {
      push(r[1]); push(r[4]); push(r[6]); push(r[8]);
    } else if (sh.name === "自学类") {
      if (i === 0) return; // 表头
      push(r[1]);
    } else if (sh.name === "工程师现场作业标准") {
      if (i === 0) return;
      push(String(r[0] || "").split("：")[0]);
      // 第二列是「易点云修机贴士+xxx：链接」形式的自由文本
      String(r[4] || "").split(/https?:/).forEach(function (chunk, k) {
        if (k === 0) return;
        const m = chunk.match(/\s([^\s0-9]\S*)$/);
        if (m) push(m[1]);
      });
    }
  });
});

const missing = [];
names.forEach(function (n) { if (!inCatalog.has(n)) missing.push(n); });

console.log("表格条目：" + names.size + "　catalog 条目：" + inCatalog.size);
if (missing.length) {
  console.log("\n[需要补进 catalog] 表格里有、catalog 里没有的 " + missing.length + " 条：");
  missing.forEach(function (n) { console.log("  - " + n); });
  process.exit(2);
}
console.log("覆盖检查通过 ✅ 表格里的每一条都在 catalog 中（或有明确的 noLink 说明）。");
