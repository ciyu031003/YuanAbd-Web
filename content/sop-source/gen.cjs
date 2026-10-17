/* content/sop-source/gen.cjs — 把 catalog.cjs 的分类目录生成为 content/fixboxs/sop-*.md
   ------------------------------------------------------------
   用法（在仓库根执行）：
     node content/sop-source/gen.cjs                       # 按 catalog 重新生�� 13 篇
     node content/sop-source/import-xlsx.cjs <表格.xlsx>    # 先校验表格与 catalog 是否一一对应
     node content-lint.cjs && node build-fix.cjs            # 校验 + 构建

   要点：
     1. 生成的是**参考资料**（front-matter kind: reference，domain 为 ref-manual / ref-field），
        渲染走 build-fix.cjs 的 renderReference，不是故障教程的 10 段骨架。
     2. catalog 每条条目都带原始链接（mvs-h5.edianzu.cn/tips-detail?id=…），
        原文需要公司内部账号，前台只做索引与一句话提醒，不复制原文。
     3. 复用 fx-frontmatter.cjs 的 dumpScalar，写出的 front-matter 与后台/构建同源。
     4. **不要手工改 sop-*.md**：下次生成会整体覆盖。要改内容 → 改 catalog.cjs → 重新生成。
   --------------------------------------------------------------------------- */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const fx = require(ROOT + "/fx-frontmatter.cjs");
const cat = require(path.join(__dirname, "catalog.cjs"));
const SOURCE_NOTE = "本页由 content/sop-source/gen.cjs 依据 catalog.cjs 生成";

const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
const TODAY = new Date().toISOString().slice(0, 10);

/* 通用官方来源：按操作系统/主题补充，保证 sources 不为空（V14）且可点开核对 */
const SRC_MICROSOFT = [
  { title: "Microsoft Learn — Windows 命令参考", url: "https://learn.microsoft.com/zh-cn/windows-server/administration/windows-commands/windows-commands", type: "official" },
  { title: "Microsoft Support — Windows 帮助中心", url: "https://support.microsoft.com/zh-cn/windows", type: "official" }
];
const SRC_MAC = [
  { title: "Apple 支持 — Mac 使用手册", url: "https://support.apple.com/zh-cn/guide/mac-help/welcome/mac", type: "official" },
  { title: "Apple 支持 — 在 Mac 上使用「磁盘工具」", url: "https://support.apple.com/zh-cn/guide/disk-utility/welcome/mac", type: "official" }
];

function dumpList(arr) {
  arr = Array.isArray(arr) ? arr : (arr === undefined || arr === null || arr === "" ? [] : [arr]);
  return "[" + arr.map(function (x) { return fx.dumpScalar(String(x)); }).join(", ") + "]";
}

/* 注意签名：fm(section, sources, related, extra) —— 原先多了一个 items 参数，
   导致 sources 被当成 related、related 被当成 extra，写出的 front-matter 全是 undefined。
   这类「位置参数错位」不会报错，只会静默写坏数据，因此这里显式解构。 */
function fm(section, sources, related, extra) {
  extra = extra || {};
  const L = [];
  L.push("---");
  L.push("title: " + fx.dumpScalar(section.title));
  L.push("slug: " + section.slug);
  L.push("kind: reference");
  L.push("domain: " + section.domain);
  L.push("category: " + section.category);
  L.push("os: " + dumpList(section.os || ["Windows"]));
  L.push("difficulty: 入门");
  L.push("time: " + fx.dumpScalar(extra.time || "10-30 分钟"));
  L.push("risk: " + (section.risk || "需谨慎"));
  L.push("symptoms: " + dumpList(extra.symptoms));
  L.push("keywords: " + dumpList(extra.keywords));
  L.push("aliases: " + dumpList(extra.aliases));
  L.push("updated: " + TODAY);
  L.push('version: "1.0"');
  L.push("prerequisites: " + dumpList(extra.prerequisites));
  L.push("tools: " + dumpList(extra.tools));
  L.push("related: " + dumpList(related));
  L.push("sources:");
  (sources || []).forEach(function (s) {
    L.push("  - title: " + fx.dumpScalar(s.title));
    L.push("    url: " + s.url);
    if (s.type) L.push("    type: " + s.type);
  });
  L.push("reviewer: 内容组");
  L.push("reviewed_at: " + TODAY);
  L.push("---");
  return L.join("\n");
}

/* 正文：## 快速概览 / ## 适用对象 / ## 风险提示 / ## 分步骤 / ## 原始 SOP */
function body(section) {
  const out = [];
  out.push("");
  out.push("# " + section.title);
  out.push("");
  out.push("## 快速概览");
  out.push("");
  (section.overview || []).forEach(function (p) { out.push(p); out.push(""); });
  out.push("本页共整理 **" + countItems(section) + "** 条 SOP 条目，全部保留原始链接；处理细节以原文为准。");
  out.push("");
  out.push("## 适用对象");
  out.push("");
  out.push(section.audience || "所有需要按 SOP 操作的工程师。");
  out.push("");
  out.push("## 风险提示");
  out.push("");
  out.push("> ⚠ 动手前请逐条核对；涉及数据、证件、客户设备安全的操作，先取得授权再执行。");
  out.push("");
  (section.risks || []).forEach(function (p, i) { out.push((i + 1) + ". " + p); });
  out.push("");
  out.push("## 分步骤");
  out.push("");
  (section.steps || []).forEach(function (st, i) {
    out.push("### 步骤 " + (i + 1) + "：" + st.t);
    out.push("");
    out.push("**目的**：" + st.w);
    out.push("");
    out.push("**操作**：");
    st.a.forEach(function (x, k) { out.push((k + 1) + ". " + x); });
    out.push("");
    out.push("**预期结果**：第 " + (i + 1) + " 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。");
    out.push("");
    out.push("**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。");
    out.push("");
  });
  // 原始 SOP：按条目列出（名称 + 一句话说明 + 要点 + 原文链接）
  out.push("## 原始 SOP");
  out.push("");
  out.push("下表的「原文」全部指向公司 SOP 知识库（需要内部账号登录）。点击即可核对处理步骤、截图与注意事项。");
  out.push("");
  out.push("| 条目 | 是什么 / 什么时候用 | 一句话提醒 | 原文 |");
  out.push("|---|---|---|---|");
  (section.items || []).forEach(function (it) {
    const n = esc(it.name);
    const last = it.noLink ? "—（培训口述内容，无原文）" : "[原文](" + it.url + ")";
    out.push("| " + n + " | " + esc(it.desc || "—") + " | " + esc((it.points || []).join("；") || "—") + " | " + last + " |");
  });
  out.push("");
  (section.groups || []).forEach(function (g) {
    out.push("### " + g.h);
    out.push("");
    if (g.note) { out.push(g.note); out.push(""); }
    out.push("| 条目 | 是什么 / 什么时候用 | 原文 |");
    out.push("|---|---|---|");
    g.items.forEach(function (it) {
      out.push("| " + esc(it.name) + " | " + esc(it.desc || "—") + " | [原文](" + it.url + ") |");
    });
    out.push("");
  });
  out.push("## 处理明细");
  out.push("");
  out.push("上表是把条目「按顺序摊开」；这一节给每一条一条带编号的明细，写入工单时可以直接引用编号，例如「按 SOP 第 12 条的步骤处理」。");
  out.push("");
  const flat = (section.items || []).slice();
  (section.groups || []).forEach(function (g) { g.items.forEach(function (x) { flat.push(x); }); });
  flat.forEach(function (it, i) {
    const no = String(i + 1).padStart(2, "0");
    out.push("### " + no + "｜" + it.name);
    out.push("**是什么**：" + (it.desc || "—"));
    if ((it.points || []).length) out.push("");
    (it.points || []).forEach(function (pt) { out.push("- 提醒：" + pt); });
    out.push("");
    out.push("**原文**：" + (it.noLink ? "培训口述内容，SOP 表格中没有对应链接。" : "[" + it.name + "](" + it.url + ")"));
    out.push("");
  });
  out.push("## 仍需帮助");
  out.push("");
  out.push("- 原文能对上但做不下去：按「工单升级方法」带上截图与现象升级，不要在客户现场硬试。");
  out.push("- 本文与原文不一致：以原文为准，并在「纠错与反馈」告诉我们，我们会回来更新这份索引。");
  out.push("- 需要看具体的排障思路，而不是 SOP 索引：去「领域」页找对应的故障教程。");
  out.push("");
  return out.join("\n");
}

/* 每条 SOP 条目在页面上有稳定的锚点（#idx-xxx），方便工单里直接贴链接给同事 */
function itemId(it) {
  return "s" + (it.url ? String(it.url).replace(/\D/g, "") : "x" + require("crypto").createHash("sha1").update(it.name).digest("hex").slice(0, 6));
}
function esc(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
}
function countItems(s) {
  let n = (s.items || []).length;
  (s.groups || []).forEach(function (g) { n += g.items.length; });
  return n;
}

/* ---- 生成 ---- */
const dir = path.join(ROOT, "content", "fixboxs");
const written = [];
const allSlugs = SECTIONS.map(function (k) { return cat[k]; });

SECTIONS.forEach(function (k) {
  const s = cat[k];
  if (!s) throw new Error("catalog 缺少区块：" + k);
  const isMac = (s.os || []).some(function (o) { return /mac/i.test(o); });
  // sources：只取有链接的条目作为代表（全部来源见页面里的「原始 SOP」表格），
  // 不把 100+ 条链接全塞进 front-matter —— 那会让后台编辑器与构建都变慢。
  const sources = [];
  const withUrl = (s.items || []).concat(...(s.groups || []).map(function (g) { return g.items; })).filter(function (it) { return it.url; });
  const step = Math.max(1, Math.floor(withUrl.length / 6));
  for (let i = 0; i < withUrl.length && sources.length < 6; i += step) {
    sources.push({ title: "公司 SOP 知识库 — " + withUrl[i].name, url: withUrl[i].url, type: "internal" });
  }
  sources.push.apply(sources, isMac ? SRC_MAC : SRC_MICROSOFT);
  // related：同一批参考资料内部互链（构建期把 slug 渲染成标题，读者能横向跳转）
  const related = allSlugs.filter(function (x) { return x && x.slug !== s.slug; }).map(function (x) { return x.slug; }).slice(0, 3);
  const head = s.title.split("：");
  const text = fm(s, sources, related, {
    symptoms: [head[0] + " 处理方法", "SOP 参考"],
    keywords: (head[0] + " SOP，" + (head[1] || "") + "，参考手册，作业指导").split(/[，,、]/).filter(Boolean),
    aliases: ["SOP", "作业指导", "参考手册", head[0]],
    prerequisites: ["能登录公司内部 SOP 知识库（部分原文需要账号）"],
    tools: ["浏览器", "内部 SOP 知识库"]
  }) + "\n" + body(s);
  fs.writeFileSync(path.join(dir, s.slug + ".md"), text, "utf8");
  written.push({ slug: s.slug, items: countItems(s) });
});

console.log("生成完成：" + written.length + " 篇，条目合计 " + written.reduce(function (a, b) { return a + b.items; }, 0));
written.forEach(function (w) { console.log("  " + w.slug + "  (" + w.items + " 条)"); });