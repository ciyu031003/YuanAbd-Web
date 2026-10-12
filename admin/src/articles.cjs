/* admin/src/articles.cjs — 文章读写层（V2 §7.3）
   关键不变量：**解析与序列化同源** —— 直接复用站点构建用的 fx-frontmatter.cjs，
   不另写一份解析器。这样后台写出的文件与手工编辑的文件在格式上必然一致。 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./config.cjs");

// 与站点构建共用同一实现（路径相对仓库根）
const REPO_ROOT = config.repo.root;
const fx = require(path.join(REPO_ROOT, "fx-frontmatter.cjs"));

const CONTENT_DIR = path.join(REPO_ROOT, config.repo.contentDir);
const DRAFTS_DIR = path.join(CONTENT_DIR, config.repo.draftsDir);
const ARCHIVE_DIR = path.join(CONTENT_DIR, config.repo.archiveDir);

function ensureDirs() {
  [CONTENT_DIR, DRAFTS_DIR, ARCHIVE_DIR].forEach(function (d) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function contentHash(text) {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 32);
}

/* 安全校验 slug：只允许小写字母/数字/连字符，防目录穿越 */
function assertSafeSlug(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,80}$/.test(slug)) {
    const e = new Error("slug 非法（只允许小写字母、数字、连字符）");
    e.status = 400;
    throw e;
  }
}

function fileFor(slug, where) {
  assertSafeSlug(slug);
  const base = where === "draft" ? DRAFTS_DIR : (where === "archive" ? ARCHIVE_DIR : CONTENT_DIR);
  const full = path.join(base, slug + ".md");
  // 双保险：确保解析后的路径仍在该目录内
  if (path.dirname(path.resolve(full)) !== path.resolve(base)) {
    const e = new Error("路径越界"); e.status = 400; throw e;
  }
  return full;
}

/* 定位文章实际所在位置 */
function locate(slug) {
  assertSafeSlug(slug);
  if (fs.existsSync(fileFor(slug, "draft"))) return { where: "draft", file: fileFor(slug, "draft") };
  if (fs.existsSync(fileFor(slug, "published"))) return { where: "published", file: fileFor(slug, "published") };
  if (fs.existsSync(fileFor(slug, "archive"))) return { where: "archive", file: fileFor(slug, "archive") };
  return null;
}

/* 读取一篇（返回 meta/body/hash/where） */
function read(slug) {
  const loc = locate(slug);
  if (!loc) { const e = new Error("文章不存在：" + slug); e.status = 404; throw e; }
  const raw = fs.readFileSync(loc.file, "utf8");
  const parsed = fx.parse(raw);
  return {
    slug: slug, where: loc.where, raw: raw, meta: parsed.meta, body: parsed.body,
    contentHash: contentHash(raw)
  };
}

/* 列出全部（文章列表页用；只读 front-matter 头，不读正文） */
function listAll() {
  ensureDirs();
  const out = [];
  function scan(dir, where) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir, { withFileTypes: true })
      .filter(function (e) { return e.isFile() && e.name.endsWith(".md"); })
      .forEach(function (e) {
        const full = path.join(dir, e.name);
        const raw = fs.readFileSync(full, "utf8");
        const parsed = fx.parse(raw);
        out.push({
          slug: parsed.meta.slug || e.name.replace(/\.md$/, ""),
          title: parsed.meta.title || "",
          domain: parsed.meta.domain || "",
          category: parsed.meta.category || "",
          risk: parsed.meta.risk || "",
          difficulty: parsed.meta.difficulty || "",
          updated: parsed.meta.updated || "",
          reviewer: parsed.meta.reviewer || "",
          reviewed_at: parsed.meta.reviewed_at || "",
          sourcesCount: Array.isArray(parsed.meta.sources) ? parsed.meta.sources.length : 0,
          where: where,
          file: e.name,
          contentHash: contentHash(raw)
        });
      });
  }
  scan(CONTENT_DIR, "published");
  scan(DRAFTS_DIR, "draft");
  scan(ARCHIVE_DIR, "archive");
  return out.sort(function (a, b) { return (b.updated || "").localeCompare(a.updated || ""); });
}

/* 保存（乐观锁 + 最小改写序列化）
   opts.baseHash: 客户端读到的 contentHash；不一致 → 409
   若原文存在，则用最小改写策略：未变更字段逐字节保留（保证 R8） */
function save(slug, meta, body, opts) {
  opts = opts || {};
  ensureDirs();
  const loc = locate(slug);
  let original = null;

  if (loc) {
    original = read(slug);
    if (opts.baseHash && original.contentHash !== opts.baseHash) {
      const e = new Error("内容已被他人修改，请重新加载后再保存");
      e.status = 409;
      e.detail = { currentHash: original.contentHash, yourHash: opts.baseHash };
      throw e;
    }
  } else if (opts.baseHash) {
    const e = new Error("文章不存在，无法按给定版本保存"); e.status = 409; throw e;
  }

  // 序列化：有原文走最小改写；新文件走全新生成
  let text;
  if (original) {
    const parsedOrig = fx.parse(original.raw);
    // 空值语义化（最容易写错的一处）：
    //   表单会把所有字段都提交上来，未填即空串/空数组。
    //   对**已存在的文件**，「空」必须解释为「本次未改动」，而不是「清空」。
    //   否则同时踩两个坑：
    //     · 原文有的字段被删掉（例如 time 消失 → 后续行整段错位）
    //     · 原文没有的字段被写成 time: ""（凭空多出内容 → 满屏 diff）
    //   规则：值为空 → 回退到原文的值；原文也没有 → 不写入。
    const cleaned = {};
    Object.keys(meta).forEach(function (k) {
      const v = meta[k];
      const isEmpty = (v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0));
      if (isEmpty) {
        if (parsedOrig.meta[k] !== undefined) cleaned[k] = parsedOrig.meta[k];
        return;
      }
      cleaned[k] = v;
    });
    // 原文有、本次 meta 未提供的字段也必须保留（不能被静默丢弃）
    Object.keys(parsedOrig.meta).forEach(function (k) {
      if (!(k in cleaned)) cleaned[k] = parsedOrig.meta[k];
    });
    text = fx.serialize(cleaned, { original: parsedOrig, body: body === undefined ? parsedOrig.body : body });
  } else {
    // 新建：生成规范 front-matter（19 字段顺序）+ 10 段骨架
    const ordered = {};
    NEW_FIELD_ORDER.forEach(function (k) { if (meta[k] !== undefined && meta[k] !== "") ordered[k] = meta[k]; });
    Object.keys(meta).forEach(function (k) { if (!(k in ordered) && meta[k] !== undefined && meta[k] !== "") ordered[k] = meta[k]; });
    text = fx.serialize(ordered, { original: { lines: [], shapes: {}, meta: {}, body: "" }, body: body || BODY_SKELETON });
  }

  const target = loc ? loc.file : fileFor(slug, opts.where === "published" ? "published" : "draft");
  fs.writeFileSync(target, text, "utf8");
  return { slug: slug, where: loc ? loc.where : (opts.where || "draft"), file: target, contentHash: contentHash(text) };
}

/* 新建草稿（固定落到 _drafts/，绝不直接进构建） */
function createDraft(slug, meta, body) {
  ensureDirs();
  assertSafeSlug(slug);
  if (locate(slug)) { const e = new Error("slug 已存在：" + slug); e.status = 409; throw e; }
  return save(slug, meta || {}, body || BODY_SKELETON, { where: "draft" });
}

/* 发布：把草稿移动到顶层（构建输入），并写入发布态字段 */
function publish(slug, meta, body) {
  const loc = locate(slug);
  if (!loc) { const e = new Error("文章不存在：" + slug); e.status = 404; throw e; }
  const parsed = fx.parse(fs.readFileSync(loc.file, "utf8"));
  const merged = Object.assign({}, parsed.meta, meta || {});
  merged.status = "published";
  const now = new Date().toISOString().slice(0, 10);
  merged.updated = now;
  if (!merged.published_at) merged.published_at = now;
  const dst = fileFor(slug, "published");
  const text = fx.serialize(merged, { original: fx.parse(fs.readFileSync(loc.file, "utf8")), body: body === undefined ? parsed.body : body });
  fs.writeFileSync(dst, text, "utf8");
  if (loc.where === "draft" && fs.existsSync(loc.file)) fs.unlinkSync(loc.file);  // 移动而非复制
  return { slug: slug, where: "published", file: dst, contentHash: contentHash(text) };
}

/* 归档（内容体系 §7.5：归档 ≠ 删除，URL 必须保留） */
function archive(slug, supersededBy) {
  const loc = locate(slug);
  if (!loc) { const e = new Error("文章不存在：" + slug); e.status = 404; throw e; }
  const raw = fs.readFileSync(loc.file, "utf8");
  const parsed = fx.parse(raw);
  const merged = Object.assign({}, parsed.meta, {
    status: "archived",
    archived_at: new Date().toISOString().slice(0, 10)
  });
  if (supersededBy) merged.superseded_by = supersededBy;
  const dst = fileFor(slug, "archive");
  const text = fx.serialize(merged, { original: parsed, body: parsed.body });
  fs.writeFileSync(dst, text, "utf8");
  if (loc.file !== dst && fs.existsSync(loc.file)) fs.unlinkSync(loc.file);
  return { slug: slug, where: "archive", file: dst, contentHash: contentHash(text) };
}

/* 19 字段的规范顺序（新建时用） */
const NEW_FIELD_ORDER = [
  "title","slug","domain","category","os","difficulty","time","risk",
  "symptoms","keywords","aliases","updated","version","prerequisites",
  "tools","related","sources","reviewer","reviewed_at"
];

/* 10 段正文骨架（与站点实际使用的小节标题一致） */
const BODY_SKELETON = [
  "",
  "## 一句话结论",
  "",
  "（用一句话说清先做什么）",
  "",
  "## 30 秒快速排查",
  "",
  "1. ",
  "",
  "## 适用 / 不适用",
  "",
  "**适用：**",
  "",
  "- ",
  "",
  "**不适用（请转对应文章）：**",
  "",
  "- ",
  "",
  "## 开始前确认",
  "",
  "- [ ] ",
  "",
  "## 分步骤",
  "",
  "### 步骤 1：",
  "",
  "**目的**：",
  "",
  "**操作**：",
  "",
  "**预期结果**：",
  "",
  "**失败怎么办**：",
  "",
  "## 怎么确认修好了",
  "",
  "1. ",
  "",
  "## 还是不行？",
  "",
  "| 情况 | 下一步 |",
  "|---|---|",
  "|  |  |",
  "",
  "## 预防",
  "",
  "1. ",
  "",
  "## 相关教程",
  "",
  "（由 front-matter 的 related 渲染，此处无需重复）",
  "",
  "## 更新日志",
  "",
  "| 日期 | 版本 | 变更 | 作者/审核 |",
  "|---|---|---|---|",
  "| " + new Date().toISOString().slice(0, 10) + " | 1.0 | 初版 |  |",
  ""
].join("\n");

module.exports = {
  ensureDirs: ensureDirs, locate: locate, read: read, listAll: listAll,
  save: save, createDraft: createDraft, publish: publish, archive: archive,
  contentHash: contentHash, assertSafeSlug: assertSafeSlug,
  CONTENT_DIR: CONTENT_DIR, DRAFTS_DIR: DRAFTS_DIR, ARCHIVE_DIR: ARCHIVE_DIR,
  NEW_FIELD_ORDER: NEW_FIELD_ORDER, BODY_SKELETON: BODY_SKELETON
};
