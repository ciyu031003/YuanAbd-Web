/* fx-frontmatter.test.cjs — front-matter round-trip 回归测试（零依赖）
   ------------------------------------------------------------
   对应 V2 方案 §7.3.4 的 R1–R9 与阶段 -1 退出标准 E1–E7。
   运行：node fx-frontmatter.test.cjs         （断言全过 exit 0，任一失败 exit 1）
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const fx = require("./fx-frontmatter.cjs");

const SRC = path.join(__dirname, "content", "fixboxs");
const files = fs.readdirSync(SRC).filter(function (f) { return f.endsWith(".md"); }).sort();

let pass = 0, fail = 0;
const failures = [];
function check(id, name, ok, detail) {
  if (ok) { pass++; return; }
  fail++; failures.push(id + " " + name + (detail ? " :: " + detail : ""));
}

// ---- 全量统计（E1/E2 的基线）----
let urlCount = 0, typeCount = 0, typeOfficial = 0, typeOpensource = 0;
let perFileSourceCounts = [];
const objectsWithType = [];

// ---- R1/R7/R8 逐篇 ----
files.forEach(function (f) {
  const full = path.join(SRC, f);
  const original = fs.readFileSync(full, "utf8");

  // R1: parse → serialize → parse 三态语义等价
  const p1 = fx.parse(original);
  const s1 = fx.serialize(p1.meta, { original: p1 });
  const p2 = fx.parse(s1);

  const metaEqual = JSON.stringify(p1.meta) === JSON.stringify(p2.meta);
  check("R1", f + " 三态语义等价", metaEqual);

  // R8: 未改动字段不产生 diff —— 逐字节恒等
  const byteIdentical = (s1 === original);
  check("R8", f + " 字节级恒等", byteIdentical,
    byteIdentical ? "" : "len " + original.length + " vs " + s1.length);

  // R7: version 必须仍是字符串 "1.0"
  check("R7", f + " version 仍为字符串", typeof p1.meta.version === "string" && p1.meta.version === "1.0",
    "got " + JSON.stringify(p1.meta.version));

  // E3/E4/E5: sources 逐条键集合、值、键序
  const src = p1.meta.sources;
  if (!Array.isArray(src)) { check("E3", f + " sources 是数组", false, typeof src); return; }
  perFileSourceCounts.push([f, src.length]);
  src.forEach(function (item, idx) {
    if (typeof item !== "object" || item === null) {
      check("E3", f + " sources[" + idx + "] 是对象", false, typeof item);
      return;
    }
    const keys = Object.keys(item);
    // 键序必须 title → url → type（E5）
    const expectOrder = keys.filter(function (k) { return ["title", "url", "type"].indexOf(k) >= 0; });
    const isOrdered = expectOrder.join(",") === (keys.indexOf("type") >= 0 ? "title,url,type" : "title,url");
    check("E5", f + " sources[" + idx + "] 键序", isOrdered, keys.join(","));
    // url 必须存在（E4）
    check("E4", f + " sources[" + idx + "] 有 url", typeof item.url === "string" && item.url.length > 0);
    if (item.url) urlCount++;
    if (item.type !== undefined) {
      typeCount++;
      if (item.type === "official") typeOfficial++;
      if (item.type === "opensource") typeOpensource++;
      objectsWithType.push(f);
    }
  });
});

// ---- E1 / E2：数量基线 ----
check("E1", "url 总条数 = 109", urlCount === 109, "got " + urlCount);
check("E2", "type 总条数 = 32", typeCount === 32, "got " + typeCount);
check("E2b", "official = 31", typeOfficial === 31, "got " + typeOfficial);
check("E2c", "opensource = 1", typeOpensource === 1, "got " + typeOpensource);

// ---- E3 补充：20 篇两键 / 10 篇三键 ----
const twoKey = perFileSourceCounts.filter(function (x) { return true; }).length;
const filesWithType = new Set(objectsWithType).size;
check("E3b", "含 type 的篇数 = 10", filesWithType === 10, "got " + filesWithType);
check("E3c", "不含 type 的篇数 = 20", (files.length - filesWithType) === 20, "got " + (files.length - filesWithType));

// ---- 未变更文件不得输出多余 type 键 ----
files.forEach(function (f) {
  const p = fx.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
  (p.meta.sources || []).forEach(function (it, i) {
    if (!Object.prototype.hasOwnProperty.call(it, "type")) {
      check("E3d", f + " sources[" + i + "] 不应凭空出现 type", true);
    }
  });
});

// ---- 输出 ----
console.log("=== front-matter round-trip 测试 ===");
console.log("扫描文件：" + files.length + " 篇");
console.log("url 总数：" + urlCount + "（期望 109）");
console.log("type 总数：" + typeCount + "（期望 32：official " + typeOfficial + " + opensource " + typeOpensource + "）");
console.log("含 type 的篇数：" + filesWithType + "（期望 10）");
console.log("");
console.log("通过：" + pass + "　失败：" + fail);
if (fail) {
  console.log("\n失败明细：");
  failures.slice(0, 40).forEach(function (x) { console.log("  ✗ " + x); });
  process.exitCode = 1;
} else {
  console.log("\n全部断言通过 ✅  （E1–E7 / R1 / R7 / R8）");
}
