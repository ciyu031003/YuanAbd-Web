/* content-lint.cjs — 内容校验（V1–V15）
   ------------------------------------------------------------
   对应《管理后台系统实施方案 V2.0》下篇 §7.4。
   **同一实现供两处调用**：
     - 构建期：build-fix.cjs 在渲染前调用，失败即非零退出（fail-closed）
     - 后台：保存草稿 / 提交审核前调用
   两处共用一份规则，杜绝「后台说没问题、构建失败」。

   用法：
     node content-lint.cjs              # 校验全部，非零退出表示有「失败」级问题
     node content-lint.cjs --json       # 输出 JSON（供后台调用）
     node content-lint.cjs --file xxx.md
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const fx = require("./fx-frontmatter.cjs");

const ROOT = __dirname;
const SRC = path.join(ROOT, "content", "fixboxs");
const TAXONOMY_PATH = path.join(ROOT, "content", "taxonomy.json");

/* ---------- 分类字典（外置，替代硬编码） ---------- */
function loadTaxonomy() {
  const raw = JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf8"));
  const domainById = {}, catById = {}, catToDomain = {};
  raw.domains.forEach(function (d) {
    domainById[d.id] = d.name;
    d.cats.forEach(function (c) {
      catById[c.id] = c.name;
      catToDomain[c.id] = d.id;
    });
  });
  return { raw: raw, domainById: domainById, catById: catById, catToDomain: catToDomain };
}

/* ---------- 常量：正文段落与同义标题 ---------- */
// 注意：这是「一个标题」——「适用 / 不适用」中间是斜杠，斜杠两侧有空格。
// 历史坑：V1.0 方案把它当成两个标题，导致 validator 按 11 段实现而判死全部文章。
/* 必写段落（硬约束）：正文可以自由组织，但这两段是「能被读懂 + 能被照着做」的底线 */
const REQUIRED_SECTIONS = ["一句话结论", "分步骤"];
/* 参考资料（kind: reference / ref-* 领域）另有一套骨架：
   它们索引的是别人的 SOP 手册，用「快速概览」而不是「一句话结论」。
   两套骨架共用 V7（分步骤下必须有 ### 步骤 N）。 */
const REFERENCE_DOMAINS = ["ref-manual"];
const REFERENCE_SECTIONS = ["快速概览", "分步骤"];
const isReferenceMeta = function (meta) {
  return meta && (meta.kind === "reference" || REFERENCE_DOMAINS.indexOf(meta.domain) >= 0);
};
/* 建议段落（仅提示）：保持站内一致性，不阻塞发布 */
const SUGGESTED_SECTIONS = ["适用 / 不适用", "开始前确认", "怎么确认修好了", "还是不行？", "预防", "相关教程", "更新日志"];
/* 完整骨架（编辑器预置、新建时使用） */
const SECTION_TITLES = [
  "一句话结论", "30 秒快速排查", "适用 / 不适用", "开始前确认", "分步骤",
  "怎么确认修好了", "还是不行？", "预防", "相关教程", "更新日志"
];
// 同义标题白名单：两份写法都合法（29 篇用前者，1 篇用后者）。
// 这是「校验器必须容忍存量内容」的体现，不是「存量内容有缺陷」。
const SECTION_ALIASES = {
  "怎么确认修好了": ["怎么确认修好了", "怎么确认处理好了"],
  "分步骤": ["分步骤", "分步骤排查", "分步骤检查"],
  "开始前确认": ["开始前确认", "前置检查"]
};
function isSectionMatch(actual, canonical) {
  const alts = SECTION_ALIASES[canonical] || [canonical];
  return alts.indexOf(actual) >= 0;
}

/* ---------- 必填字段集合（外置概念：断言「集合」而非「总数」） ---------- */
// 「19 个字段」是当前快照，不是约束：加入 status/author/review_notes 后立刻会 >19。
// 因此这里断言的是「若干必填字段必须存在」，而不是「字段总数等于 19」。
const REQUIRED_FIELDS = [
  "title", "slug", "domain", "category", "os", "difficulty", "time", "risk",
  "symptoms", "keywords", "aliases", "updated", "version", "prerequisites",
  "tools", "related", "sources", "reviewer", "reviewed_at"
];
const ARRAY_FIELDS = ["os", "symptoms", "keywords", "aliases", "prerequisites", "tools", "related"];

const DANGER_RE = /diskpart|format |clean |chkdsk \/f|rm -rf|reg delete|bcdedit|diskutil erase|mkfs|分区/i;

/* ---------- 各条规则 ---------- */
function lintFile(fileName, opts) {
  const tax = opts.taxonomy;
  const full = path.join(SRC, fileName);
  const raw = fs.readFileSync(full, "utf8");
  const issues = [];
  const add = function (id, level, msg) { issues.push({ rule: id, level: level, file: fileName, msg: msg }); };

  // V1: front-matter 可解析（含 BOM 检测）
  if (raw.charCodeAt(0) === 0xFEFF) {
    add("V1", "error", "文件带 UTF-8 BOM，会导致 front-matter 解析失败（文章从站点消失）");
  }
  if (!/^---\r?\n/.test(raw.replace(/^\uFEFF/, ""))) {
    add("V1", "error", "缺少 front-matter（文件必须以 --- 开头）");
    return issues;
  }
  const parsed = fx.parse(raw);
  const meta = parsed.meta;
  if (!parsed.hasFm) { add("V1", "error", "front-matter 无法解析"); return issues; }

  // V2a: 必填字段齐全（断言集合，不断言总数）
  REQUIRED_FIELDS.forEach(function (k) {
    if (meta[k] === undefined || meta[k] === "" ||
        (Array.isArray(meta[k]) && meta[k].length === 0 && ["prerequisites", "tools", "related", "sources"].indexOf(k) < 0)) {
      if (meta[k] === undefined || meta[k] === "") add("V2a", "error", "缺少必填字段：" + k);
    }
  });
  // V2b: 数组字段类型正确
  ARRAY_FIELDS.forEach(function (k) {
    if (meta[k] !== undefined && !Array.isArray(meta[k])) {
      add("V2b", "error", "字段 " + k + " 应为数组，实际为 " + typeof meta[k]);
    }
  });
  // sources 必须是对象数组（可变字段：title/url 必有，type 可选）
  if (meta.sources !== undefined) {
    if (!Array.isArray(meta.sources)) {
      add("V2b", "error", "sources 应为对象数组（当前解析为 " + (parsed.shapes.sources || "未知") + "）");
    } else {
      meta.sources.forEach(function (s, i) {
        if (typeof s !== "object" || s === null) {
          add("V2b", "error", "sources[" + i + "] 应为对象 {title,url[,type]}");
          return;
        }
        if (!s.title) add("V2b", "error", "sources[" + i + "] 缺少 title");
        if (!s.url) add("V2b", "error", "sources[" + i + "] 缺少 url");
      });
    }
  }

  // V3: slug 格式（唯一性在跨文件层校验）
  if (meta.slug && !/^[a-z0-9-]+$/.test(meta.slug)) {
    add("V3", "error", "slug 只允许小写字母、数字与连字符：" + meta.slug);
  }

  // V4: domain / category 合法且从属正确
  if (meta.domain && !tax.domainById[meta.domain]) {
    add("V4", "error", "domain 不在分类表中：" + meta.domain);
  }
  if (meta.category) {
    if (!tax.catById[meta.category]) {
      add("V4", "error", "category 不在分类表中：" + meta.category);
    } else if (meta.domain && tax.catToDomain[meta.category] !== meta.domain) {
      add("V4", "error", "category " + meta.category + " 不属于 domain " + meta.domain +
        "（应属于 " + tax.catToDomain[meta.category] + "）");
    }
  }

  // V5: 枚举值
  const riskEnum = tax.raw.enums.risk;
  const diffEnum = tax.raw.enums.difficulty;
  if (meta.risk && riskEnum.indexOf(meta.risk) < 0) {
    add("V5", "error", "risk 取值非法：" + meta.risk + "（允许：" + riskEnum.join("/") + "）");
  }
  if (meta.difficulty && diffEnum.indexOf(meta.difficulty) < 0) {
    add("V5", "warn", "difficulty 取值不在建议集合：" + meta.difficulty);
  }

  // V6: 正文段落（2026-10-13 调整：正文改为自由写作）
  //
  // 背景：原先强制 10 段结构。但项目负责人明确「正文自由写作，后续会引入
  // 思维导图、图片等」，因此把硬约束收缩到最小可用集合：
  //   · V6a 必写段落（error）—— 少了会让文章无法被理解和检索，必须拦
  //   · V6b 建议段落（warn）—— 只提示，不阻塞发布
  // 注意：结构化字段（19 个 front-matter）依旧强校验，不受此调整影响。
  const h2 = [];
  String(parsed.body).split(/\r?\n/).forEach(function (l) {
    const m = l.match(/^##\s+(.+?)\s*$/);
    if (m) h2.push(m[1]);
  });
  const hasSection = function (canon) {
    return h2.some(function (a) { return isSectionMatch(a, canon); });
  };
  // 必写：至少要有一个「结论/概述」段和一个「怎么做」段
  const required = isReferenceMeta(meta) ? REFERENCE_SECTIONS : REQUIRED_SECTIONS;
  required.forEach(function (canon) {
    if (!hasSection(canon)) {
      add("V6a", "error", "正文缺少必要段落：## " + canon + "（其余段落可自由组织）");
    }
  });
  // 建议：保持知识库的一致性，但不拦（参考资料是索引手册，不套教程骨架，跳过）
  if (!isReferenceMeta(meta)) SUGGESTED_SECTIONS.forEach(function (canon) {
    if (!hasSection(canon)) {
      add("V6b", "warn", "建议补充段落：## " + canon);
    }
  });

  // V7: 分步骤下至少一个 ### 步骤 N
  const stepSection = String(parsed.body).split(/^##\s+/m).find(function (x) { return /^分步骤/.test(x.trim()); });
  if (stepSection) {
    if (!/^###\s+(步骤\s*\d+|第\s*\d+\s*步)/m.test(stepSection)) {
      add("V7", "error", "「分步骤」下未找到 ### 步骤 N（兼容「### 第 N 步」）");
    }
  }

  // V8: related 引用存在性（跨文件，在 lintAll 中补）
  // V9: sources URL 形态
  if (Array.isArray(meta.sources)) {
    meta.sources.forEach(function (s, i) {
      if (typeof s === "object" && s && s.url && !/^https:\/\//.test(s.url)) {
        add("V9", "warn", "sources[" + i + "].url 建议使用 https：" + s.url);
      }
    });
  }

  // V11: 非「安全」时应有风险提示块
  if (meta.risk && meta.risk !== "安全" && !isReferenceMeta(meta)) {
    const head = String(parsed.body).slice(0, 1200);
    if (!/^>\s*.*(风险|谨慎|备份|⛔|⚠)/m.test(head)) {
      add("V11", "warn", "risk 为「" + meta.risk + "」但正文开头未见风险提示块");
    }
  }

  // V12: 代理/VPN 领域应有合规提示块
  if (meta.domain === "proxy-vpn") {
    if (!/合规提示/.test(String(parsed.body))) {
      add("V12", "warn", "代理/VPN 类文章应含「合规提示」块（内容体系 §8.2 规则 7）");
    }
  }

  // V13: 复核时效
  if (meta.reviewed_at) {
    const d = new Date(meta.reviewed_at + "T00:00:00Z");
    if (!isNaN(d.getTime())) {
      const days = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (days > 365) add("V13", "warn", "reviewed_at 距今 " + days + " 天（>12 个月，建议复核）");
      else if (days > 180) add("V13", "info", "reviewed_at 距今 " + days + " 天（>180 天，进入复核窗口）");
    }
  }

  // V14: 数据完整性（sources 条数不得为 0 —— 后台保存最易破坏此项）
  if (Array.isArray(meta.sources) && meta.sources.length === 0) {
    add("V14", "error", "sources 为空：后台保存可能已清空来源链接");
  }

  return issues;
}

/* ---------- 跨文件规则 ---------- */
function lintAll(opts) {
  if (!fs.existsSync(SRC)) { console.error("源目录不存在：" + SRC); process.exit(1); }
  const files = fs.readdirSync(SRC, { withFileTypes: true })
    .filter(function (e) { return e.isFile() && e.name.endsWith(".md"); })
    .map(function (e) { return e.name; }).sort();

  const taxonomy = loadTaxonomy();
  const o = { taxonomy: taxonomy };
  let issues = [];
  const slugMap = {};

  files.forEach(function (f) {
    issues = issues.concat(lintFile(f, o));
    // 收集 slug 供 V3 唯一性与 V8 存在性使用
    const parsed = fx.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
    const slug = parsed.meta.slug || f.replace(/\.md$/, "");
    (slugMap[slug] = slugMap[slug] || []).push(f);
  });

  // V3: slug 全局唯一
  Object.keys(slugMap).forEach(function (s) {
    if (slugMap[s].length > 1) {
      slugMap[s].forEach(function (f) {
        issues.push({ rule: "V3", level: "error", file: f, msg: "slug 重复：" + s + "（同见于 " + slugMap[s].join(", ") + "）" });
      });
    }
  });

  // V8: related 引用的 slug 必须存在
  //
  // ⚠️ 当前级别为 warn（不是 error），这是一个**刻意的过渡决策**：
  //   存量 30 篇中有 30 条 related 指向「规划中但尚未撰写」的文章（19 个不同 slug）。
  //   若立刻改为 error，会一次性判死全部存量文章并阻塞发布。
  //   V2 §8.2 对此有明确要求：「content-lint 应先以『只报告不拦』的模式跑一遍，
  //   把存量问题列出来再决定哪些规则升级为硬失败」。
  //
  //   升级路径（待办）：
  //     1) 补齐这 19 篇（内容侧排期），或把确实不打算写的引用从 related 中移除；
  //     2) 然后把下面的 level 改为 "error"，并在 build-fix.cjs 的 lint 接入处生效。
  //   在那之前，本项以 warn 呈现，避免「校验器把线上内容判死」。
  const RELATED_DANGLING_LEVEL = "warn";
  files.forEach(function (f) {
    const parsed = fx.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
    const rel = parsed.meta.related;
    if (Array.isArray(rel)) {
      rel.forEach(function (r) {
        if (!slugMap[r]) {
          issues.push({ rule: "V8", level: RELATED_DANGLING_LEVEL, file: f, msg: "related 引用了尚未存在的 slug：" + r });
        }
      });
    }
  });

  return { files: files, issues: issues, slugCount: Object.keys(slugMap).length };
}

/* ---------- CLI ---------- */
if (require.main === module) {
  const argv = process.argv.slice(2);
  const jsonMode = argv.indexOf("--json") >= 0;
  const res = lintAll();
  const errors = res.issues.filter(function (i) { return i.level === "error"; });
  const warns = res.issues.filter(function (i) { return i.level === "warn"; });
  const infos = res.issues.filter(function (i) { return i.level === "info"; });

  if (jsonMode) {
    console.log(JSON.stringify({
      files: res.files.length, slugCount: res.slugCount,
      errors: errors, warns: warns, infos: infos,
      ok: errors.length === 0
    }, null, 2));
  } else {
    console.log("=== content-lint（V1–V15）===");
    console.log("扫描：" + res.files.length + " 篇");
    const byRule = {};
    res.issues.forEach(function (i) { byRule[i.rule] = (byRule[i.rule] || 0) + 1; });
    if (errors.length) {
      console.log("");
      console.log("【失败】" + errors.length + " 项：");
      errors.forEach(function (i) { console.log("  ✗ [" + i.rule + "] " + i.file + " :: " + i.msg); });
    }
    if (warns.length) {
      console.log("");
      console.log("【警告】" + warns.length + " 项：");
      warns.slice(0, 15).forEach(function (i) { console.log("  ! [" + i.rule + "] " + i.file + " :: " + i.msg); });
      if (warns.length > 15) console.log("  ... 另有 " + (warns.length - 15) + " 项");
    }
    if (infos.length) {
      console.log("");
      console.log("【提示】" + infos.length + " 项（不阻塞）");
    }
    console.log("");
    if (errors.length) {
      console.log("结果：失败（" + errors.length + " 个 error），退出码 1");
      process.exitCode = 1;
    } else {
      console.log("结果：通过 ✅ （0 error，" + warns.length + " warning，" + infos.length + " info）");
    }
  }
}

module.exports = {
  lintAll: lintAll, lintFile: lintFile, loadTaxonomy: loadTaxonomy, SRC: SRC,
  // 供后台复用：避免「后台校验」与「构建校验」两套规则各写一份而漂移
  REQUIRED_SECTIONS: REQUIRED_SECTIONS,
  SUGGESTED_SECTIONS: SUGGESTED_SECTIONS,
  SECTION_TITLES: SECTION_TITLES,
  SECTION_ALIASES: SECTION_ALIASES
};
