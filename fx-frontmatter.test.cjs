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
let urlCount = 0, typeCount = 0, typeOfficial = 0, typeOpensource = 0, typeInternal = 0;
let rawUrlLines = 0, rawTypeLines = 0, rawTypeFiles = 0;
let rawOfficial = 0, rawOpensource = 0, rawInternal = 0;
let perFileSourceCounts = [];
const objectsWithType = [];

// ---- R1/R7/R8 逐篇 ----
files.forEach(function (f) {
  const full = path.join(SRC, f);
  const original = fs.readFileSync(full, "utf8");
  const fmEnd = original.indexOf("\n---", 4);
  const fmText = fmEnd >= 0 ? original.slice(0, fmEnd) : original;
  rawUrlLines += (fmText.match(/^\s+url:\s*\S+/gm) || []).length;
  const rawTypes = fmText.match(/^\s+type:\s*(\S+)/gm) || [];
  rawTypeLines += rawTypes.length;
  if (rawTypes.length) rawTypeFiles++;
  rawTypes.forEach(function (line) {
    const value = line.replace(/^\s+type:\s*/, "").trim();
    if (value === "official") rawOfficial++;
    if (value === "opensource") rawOpensource++;
    if (value === "internal") rawInternal++;
  });

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

  // R7: version 必须是可解析的字符串版本号，允许内容升级后递增
  check("R7", f + " version 为字符串版本号",
    typeof p1.meta.version === "string" && /^\d+\.\d+(?:\.\d+)?$/.test(p1.meta.version),
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
      if (item.type === "internal") typeInternal++;
      objectsWithType.push(f);
    }
  });
});


/* ---- R10/R11：换行风格与 BOM 保真（新增，2026-10-12） ----
   为什么必须测：仓库里 29 篇是 LF、1 篇（printer-offline.md）是 CRLF。
   若序列化器一律输出 LF，那一篇每次「无改动保存」都会整文件 diff —— 内容没变但历史全乱。
   这与 R8 是同一类问题，只是触发条件是换行风格而非字段值。 */
files.forEach(function (f) {
  const original = fs.readFileSync(path.join(SRC, f), "utf8");
  const p = fx.parse(original);
  const s = fx.serialize(p.meta, { original: p });
  const origEol = /\r\n/.test(original) ? "\r\n" : "\n";
  check("R10", f + " 换行风格保真", p.eol === origEol, "期望 " + JSON.stringify(origEol) + " 实得 " + JSON.stringify(p.eol));
  check("R11", f + " 序列化后换行风格一致", /\r\n/.test(s) === /\r\n/.test(original));
  const origBom = original.charCodeAt(0) === 0xFEFF;
  check("R12", f + " BOM 保真", (s.charCodeAt(0) === 0xFEFF) === origBom);
});

/* ---- R13：空值语义（针对后台表单提交） ----
   后台表单会把所有字段都提交上来，未填即空串。
   对已存在的文件，「空」必须解释为「本次未改动」，不能解释为「清空」。
   这条测的就是「全字段提交 + 部分为空 ⇒ 文件不变」。 */
files.forEach(function (f) {
  const original = fs.readFileSync(path.join(SRC, f), "utf8");
  const p = fx.parse(original);
  const metaWithEmpties = Object.assign({}, p.meta, { time: "", tools: [], prerequisites: [] });
  const cleaned = {};
  Object.keys(metaWithEmpties).forEach(function (k) {
    const v = metaWithEmpties[k];
    const isEmpty = (v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0));
    if (isEmpty) { if (p.meta[k] !== undefined) cleaned[k] = p.meta[k]; return; }
    cleaned[k] = v;
  });
  Object.keys(p.meta).forEach(function (k) { if (!(k in cleaned)) cleaned[k] = p.meta[k]; });
  const s2 = fx.serialize(cleaned, { original: p });
  check("R13", f + " 空值不改变文件", s2 === original);
});

// ---- E1 / E2：解析结果必须覆盖当前全文，而不是绑定某个历史文章数量 ----
check("E1", "sources.url 无遗漏", urlCount === rawUrlLines,
  "parsed " + urlCount + " / raw " + rawUrlLines);
check("E2", "sources.type 无遗漏", typeCount === rawTypeLines,
  "parsed " + typeCount + " / raw " + rawTypeLines);
check("E2b", "type 仅包含已登记取值",
  (typeOfficial + typeOpensource + typeInternal) === typeCount,
  "official " + typeOfficial + " + opensource " + typeOpensource + " + internal " + typeInternal + " / type " + typeCount);
check("E2c", "official 数量与原文一致", typeOfficial === rawOfficial,
  "parsed " + typeOfficial + " / raw " + rawOfficial);
check("E2d", "opensource 数量与原文一致", typeOpensource === rawOpensource,
  "parsed " + typeOpensource + " / raw " + rawOpensource);
check("E2e", "internal 数量与原文一致", typeInternal === rawInternal,
  "parsed " + typeInternal + " / raw " + rawInternal);

// ---- E3 补充：按当前原文动态统计，不再硬编码历史篇数 ----
const filesWithType = new Set(objectsWithType).size;
check("E3b", "含 type 的篇数与原文一致", filesWithType === rawTypeFiles,
  "parsed " + filesWithType + " / raw " + rawTypeFiles);
check("E3c", "不含 type 的篇数与原文一致",
  (files.length - filesWithType) === (files.length - rawTypeFiles),
  "parsed " + (files.length - filesWithType) + " / raw " + (files.length - rawTypeFiles));

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
console.log("url 总数：" + urlCount + "（front-matter 原始行 " + rawUrlLines + "）");
console.log("type 总数：" + typeCount + "（official " + typeOfficial + " + opensource " + typeOpensource + " + internal " + typeInternal + "）");
console.log("含 type 的篇数：" + filesWithType + " / 共 " + files.length);
console.log("");
console.log("通过：" + pass + "　失败：" + fail);
if (fail) {
  console.log("\n失败明细：");
  failures.slice(0, 40).forEach(function (x) { console.log("  ✗ " + x); });
  process.exitCode = 1;
} else {
  console.log("\n全部断言通过 ✅  （E1–E7 / R1 / R7 / R8）");
}
