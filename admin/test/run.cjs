"use strict";

/* admin/test/run.cjs — 后台单元测试（零依赖，node test/run.cjs）
   ---------------------------------------------------------------------------
   覆盖三层：
     1) 纯函数：反馈校验、状态机、URL 拼接、分页收敛（不碰 DB / 文件系统）
     2) 渲染层：每个页面必须能独立渲染、转义用户内容、HTML 结构合法
     3) 边界：审核队列为空 / 无发布权限 / 来源体检报告残缺 / 登录页嵌套
   说明：views.cjs 是纯函数式 SSR，所以「转义」和「结构」可以在这里硬断言，
   不需要起服务、也不需要数据库。 */
const assert = require("assert");
const path = require("path");
const fs = require("fs");

process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-only";
process.env.FEEDBACK_ALLOWED_ORIGINS = "https://pc-fixboxs.yuanabd.cn";

/* articles.cjs / server.cjs 会从「仓库根」读 fx-frontmatter、content-lint、taxonomy，
   默认 REPO_ROOT 是生产挂载点 /srv/fixboxs/repo；本地跑测试要指到仓库根。 */
const REPO_ROOT = path.resolve(__dirname, "..", "..");
process.env.REPO_ROOT = process.env.REPO_ROOT || REPO_ROOT;

/* 内容目录指到 admin 下的临时目录（跑完删除）：
   这样可以直接验证「草稿在 _drafts/ → 发布后文件被移进构建目录」这类
   必须真实读写文件的行为，而不会碰仓库里真正的内容（content/** 不在本次写入范围）。 */
const TMP_CONTENT = "admin/.tmp-admin-test-content";
process.env.CONTENT_DIR = TMP_CONTENT;
process.env.DRAFTS_DIR = "_drafts";
process.env.ARCHIVE_DIR = "_archive";
const TMP_ABS = path.join(REPO_ROOT, TMP_CONTENT);
/* 开跑前先清一次：上一次失败中断会留下 _drafts 夹具，导致「slug 已存在」误报。
   测试必须幂等 —— 无论上一次是否正常结束，这一次都从干净目录开始。 */
try { fs.rmSync(TMP_ABS, { recursive: true, force: true }); } catch (e) { /* 首次运行没有该目录 */ }

const feedback = require(path.join(__dirname, "..", "src", "feedback.cjs"));
const views = require(path.join(__dirname, "..", "src", "views.cjs"));
const workflow = require(path.join(__dirname, "..", "src", "workflow.cjs"));
const articles = require(path.join(__dirname, "..", "src", "articles.cjs"));

let count = 0;
function test(name, fn) {
  try {
    fn();
    count++;
  } catch (e) {
    console.error("\n✗ 失败：" + name);
    throw e;
  }
}

function validEventId() {
  return "feedback-event-0001";
}

const USER = { user_id: 1, email: "root@example.com", name: "管理员", is_root: true };
const CSRF = "csrf";

/* 统一断言：这段用户内容在 HTML 里必须以转义形式出现，且不能有生效的标签/事件属性 */
function assertEscaped(html, label) {
  assert.ok(html.indexOf("<script>alert(1)</script>") < 0, label + "：存在未转义 <script>");
  assert.ok(html.indexOf("&lt;script&gt;alert(1)&lt;/script&gt;") >= 0, label + "：未按预期转义 <script>");
  assert.ok(!/\son\w+="alert\(1\)"/.test(html), label + "：存在未转义事件属性");
  assert.ok(!/href="javascript:/i.test(html), label + "：存在 javascript: 链接");
}

const XSS = '<script>alert(1)</script>';
const XSS_ATTR = '"><img src=x onerror="alert(1)">';

/* =========================================================================
   1. 反馈校验 / CORS（原有覆盖，保持不变）
   ========================================================================= */
const resolved = feedback.validate({
  slug: "win-update-enable",
  outcome: "resolved",
  client_event_id: validEventId()
});
assert.strictEqual(resolved.error, undefined);
assert.strictEqual(resolved.value.issueType, null);

const unresolved = feedback.validate({
  slug: "win-update-enable",
  outcome: "unresolved",
  issue_type: "steps",
  issue_location: "分步骤",
  message: "执行第三步后设置窗口没有打开",
  page_path: "/fix/win-update-enable.html",
  client_event_id: validEventId()
});
assert.strictEqual(unresolved.error, undefined);
assert.strictEqual(unresolved.value.issueLocation, "分步骤");

assert.match(feedback.validate({
  slug: "win-update-enable",
  outcome: "unresolved",
  client_event_id: validEventId()
}).error, /问题类型/);
assert.match(feedback.validate({
  slug: "../secret",
  outcome: "resolved",
  client_event_id: validEventId()
}).error, /文章标识/);
assert.match(feedback.validate({
  slug: "win-update-enable",
  outcome: "resolved",
  page_path: "https://evil.example/",
  client_event_id: validEventId()
}).error, /页面来源/);

assert.strictEqual(feedback.isAllowedOrigin("https://pc-fixboxs.yuanabd.cn"), true);
assert.strictEqual(feedback.isAllowedOrigin("http://127.0.0.1:8080"), true);
assert.strictEqual(feedback.isAllowedOrigin("https://evil.example"), false);
assert.strictEqual(
  feedback.corsHeaders("https://pc-fixboxs.yuanabd.cn")["Access-Control-Allow-Origin"],
  "https://pc-fixboxs.yuanabd.cn"
);

/* =========================================================================
   2. 状态机（workflow.cjs）
   -------------------------------------------------------------------------
   这是「审核台通过 / 列表行内发布」两条路径共用的唯一规则来源，
   边界必须钉死：非法来源状态不能流转、未知目标状态不能流转。
   ========================================================================= */
test("状态机：合法流转", function () {
  assert.strictEqual(workflow.canTransition("draft", "in_review"), true);
  assert.strictEqual(workflow.canTransition("draft", "published"), true);
  assert.strictEqual(workflow.canTransition("in_review", "published"), true);
  assert.strictEqual(workflow.canTransition("in_review", "changes_requested"), true);
  assert.strictEqual(workflow.canTransition("changes_requested", "draft"), true);
  assert.strictEqual(workflow.canTransition("published", "archived"), true);
});

test("状态机：非法流转被拒", function () {
  // 已发布不能直接「提交审核」或「退回」——必须先经草稿/审核态
  assert.strictEqual(workflow.canTransition("published", "in_review"), false);
  assert.strictEqual(workflow.canTransition("published", "changes_requested"), false);
  assert.strictEqual(workflow.canTransition("archived", "published"), false);
  assert.strictEqual(workflow.canTransition("draft", "changes_requested"), false);
  // 未知目标状态
  assert.strictEqual(workflow.canTransition("draft", "deleted"), false);
  assert.strictEqual(workflow.transitionFor("deleted"), null);
});

test("状态机：所需能力与文案", function () {
  assert.strictEqual(workflow.transitionFor("published").cap, "article:publish");
  assert.strictEqual(workflow.transitionFor("changes_requested").cap, "article:review");
  assert.strictEqual(workflow.transitionFor("in_review").cap, "article:submit");
  assert.strictEqual(workflow.transitionLabel("archived"), "归档");
  assert.strictEqual(workflow.transitionLabel("nope"), "更新");   // 未知状态不能拼出 undefined
});

test("状态标签：未知值有兜底", function () {
  assert.strictEqual(workflow.statusLabel("published"), "已发布");
  assert.strictEqual(workflow.statusLabel("weird"), "weird");
  assert.strictEqual(workflow.statusLabel(null), "未知");
  // 视图层与状态机层必须给出同一个标签（两处漂移会让界面自相矛盾）
  assert.strictEqual(views.statusLabel("changes_requested"), workflow.statusLabel("changes_requested"));
});

/* =========================================================================
   3. URL / 分页辅助
   ========================================================================= */
test("withQuery：只有查询串时用 ?，已有查询串时用 &", function () {
  assert.strictEqual(workflow.withQuery("/review", { notice: "已通过" }), "/review?notice=%E5%B7%B2%E9%80%9A%E8%BF%87");
  assert.strictEqual(
    workflow.withQuery("/review?status=changes_requested", { error: "x y" }),
    "/review?status=changes_requested&error=x%20y"
  );
});

test("withQuery：空值被丢弃，不产生 ?& 或结尾 &", function () {
  assert.strictEqual(workflow.withQuery("/articles", { notice: "", error: null, slug: undefined }), "/articles");
  assert.strictEqual(workflow.withQuery("/articles", { notice: "a", error: "" }), "/articles?notice=a");
  assert.strictEqual(workflow.withQuery("/articles?status=draft", {}), "/articles?status=draft");
  // 值里的 & # 必须编码，否则会把参数切断
  assert.strictEqual(workflow.withQuery("/a", { q: "a&b#c" }), "/a?q=a%26b%23c");
});

test("withQuery：锚点保留在末尾", function () {
  assert.strictEqual(workflow.withQuery("/articles/x#comments", { notice: "ok" }), "/articles/x?notice=ok#comments");
});

test("reviewBackTo：只认两个队列，其余回待审核", function () {
  assert.strictEqual(workflow.reviewBackTo("changes_requested"), "/review?status=changes_requested");
  assert.strictEqual(workflow.reviewBackTo("in_review"), "/review");
  assert.strictEqual(workflow.reviewBackTo("../evil"), "/review");
  assert.strictEqual(workflow.reviewBackTo(""), "/review");
});

test("clampPage：非法/越界页码收敛", function () {
  assert.strictEqual(workflow.clampPage("3", 5), 3);
  assert.strictEqual(workflow.clampPage("999", 5), 5);
  assert.strictEqual(workflow.clampPage("0", 5), 1);
  assert.strictEqual(workflow.clampPage("-2", 5), 1);
  assert.strictEqual(workflow.clampPage("abc", 5), 1);
  assert.strictEqual(workflow.clampPage(undefined, 5), 1);
  assert.strictEqual(workflow.clampPage("2", 0), 1);   // 总页数兜底为 1
});

/* =========================================================================
   4. 文件层安全：slug 白名单（路径穿越）
   ========================================================================= */
test("assertSafeSlug：拒绝路径穿越与非法字符", function () {
  ["../secret", "..", "a/b", "A-B", "a b", "", "x".repeat(81), "a.md", ".hidden"]
    .forEach(function (bad) {
      assert.throws(function () { articles.assertSafeSlug(bad); }, /slug 非法/, "应拒绝：" + JSON.stringify(bad));
    });
  ["win-update-enable", "a", "a1-b2", "x".repeat(80)].forEach(function (ok) {
    assert.doesNotThrow(function () { articles.assertSafeSlug(ok); }, "应放行：" + ok);
  });
});

/* =========================================================================
   4b. 文件层行为（临时目录夹具）：草稿创建 → 发布移动 → 归档
   -------------------------------------------------------------------------
   这条覆盖本次评审的 P0：「审核台/列表点发布后，文件必须从 _drafts/ 移进构建目录」。
   旧实现只改 DB 状态 + 入队，草稿永远留在 _drafts/，站点上根本没有这篇。
   ========================================================================= */
const TAX_FOR_FIXTURE = {
  title: "测试文章", slug: "test-move-draft", domain: "win", category: "c1",
  risk: "需谨慎", difficulty: "入门", updated: "2026-01-01",
  sources: [{ title: "来源", url: "https://example.com/a" }]
};
const BODY = "## 一句话结论\n\n结论\n\n## 分步骤\n\n### 步骤 1\n\n内容\n";

test("createDraft：落到 _drafts/，且 slug 冲突时报 409", function () {
  fs.mkdirSync(path.join(TMP_ABS, "_drafts"), { recursive: true });
  const created = articles.createDraft("test-move-draft", TAX_FOR_FIXTURE, BODY);
  assert.strictEqual(created.where, "draft");
  assert.ok(fs.existsSync(path.join(TMP_ABS, "_drafts", "test-move-draft.md")), "草稿应写入 _drafts/");
  assert.ok(!fs.existsSync(path.join(TMP_ABS, "test-move-draft.md")), "草稿不应直接进构建目录");
  assert.throws(function () { articles.createDraft("test-move-draft", TAX_FOR_FIXTURE, BODY); }, function (e) {
    return e.status === 409;
  });
});

test("publish：把 _drafts/ 的文件移进构建目录（移动而非复制）", function () {
  const out = articles.publish("test-move-draft", TAX_FOR_FIXTURE, BODY);
  assert.strictEqual(out.where, "published");
  const top = path.join(TMP_ABS, "test-move-draft.md");
  assert.ok(fs.existsSync(top), "发布后顶层目录应有该文件（构建才会包含它）");
  assert.ok(!fs.existsSync(path.join(TMP_ABS, "_drafts", "test-move-draft.md")), "_drafts 里的副本必须删掉");
  const raw = fs.readFileSync(top, "utf8");
  assert.ok(/status:\s*published/.test(raw), "front-matter 应写入 status: published");
  assert.strictEqual(articles.locate("test-move-draft").where, "published");
});

test("archive：移到 _archive/ 且保留原文件不重复", function () {
  const out = articles.archive("test-move-draft");
  assert.strictEqual(out.where, "archive");
  assert.ok(fs.existsSync(path.join(TMP_ABS, "_archive", "test-move-draft.md")));
  assert.ok(!fs.existsSync(path.join(TMP_ABS, "test-move-draft.md")), "归档应从顶层移走");
});

test("publish 从归档位置也能搬回构建目录（不留双份）", function () {
  const out = articles.publish("test-move-draft", TAX_FOR_FIXTURE, BODY);
  assert.strictEqual(out.where, "published");
  assert.ok(fs.existsSync(path.join(TMP_ABS, "test-move-draft.md")));
  assert.ok(!fs.existsSync(path.join(TMP_ABS, "_archive", "test-move-draft.md")), "归档副本必须删掉，否则构建会读到两份");
});

test("listAll：返回搜索文本且按更新时间倒序", function () {
  articles.createDraft("test-second-draft", Object.assign({}, TAX_FOR_FIXTURE, { slug: "test-second-draft", updated: "2026-02-02", keywords: ["蓝屏", "0x0000007B"], symptoms: ["开机蓝屏"], aliases: ["蓝屏死机"] }), BODY);
  const list = articles.listAll(true);
  assert.ok(list.length >= 2, "临时内容目录应有夹具文章");
  list.forEach(function (a) { assert.strictEqual(typeof a.searchText, "string"); });
  const second = list.filter(function (a) { return a.slug === "test-second-draft"; })[0];
  assert.ok(second && second.searchText.indexOf("0x0000007B") >= 0, "searchText 应包含关键词/症状/别名");
  for (let i = 1; i < list.length; i++) {
    assert.ok(String(list[i - 1].updated || "") >= String(list[i].updated || ""), "listAll 应按 updated 倒序");
  }
  // 缓存不得把「调用方的 sort」带回去：两次调用拿到的数组不能是同一个引用
  const a1 = articles.listAll();
  const a2 = articles.listAll();
  assert.notStrictEqual(a1, a2);
});

/* =========================================================================
   5. 工作台 / 审核台 / 数据分析渲染与转义（原有覆盖 + 扩充）
   ========================================================================= */
const dashboardHtml = views.dashboardPage({
  user: USER, roles: [{ role: "root" }], csrf: CSRF,
  total: 82,
  stats: { published: 82, missingSources: 0, stale: 0 },
  recent: [],
  stale: [],
  byDomain: [],
  byStatus: { published: 82, draft: 0, in_review: 0, changes_requested: 0, archived: 0 },
  heat: [],
  pubTrend: [],
  feedback: {
    stats: { resolved: 12, unresolved: 8, total: 20, unresolved7: 3, resolutionRate: 60 },
    articles: [{
      slug: "win-store-not-opening", title: "微软商店打不开", resolved: 2,
      unresolved: 4, total: 6, last_feedback_at: "2026-10-27T08:30:00.000Z"
    }],
    recent: [{
      id: 1, slug: "win-store-not-opening", title: "微软商店打不开",
      issue_type: "steps", issue_location: "分步骤", message: XSS,
      created_at: "2026-10-27T08:30:00.000Z"
    }],
    issues: [{ issue_type: "steps", n: 4 }]
  }
});

/* 工作台：待办优先 + 反馈摘要（详细内容已移到独立的数据分析页） */
assert.match(dashboardHtml, /今日待办/);
assert.match(dashboardHtml, /queue-card/);
assert.match(dashboardHtml, /已解决/);
assert.match(dashboardHtml, /未解决/);
assert.match(dashboardHtml, /60%/);
assert.doesNotMatch(dashboardHtml, /<script>alert\(1\)<\/script>/);

const reviewHtml = views.reviewPage({
  user: USER, roles: [{ role: "root" }], csrf: CSRF,
  queue: [{ slug: "win-store-not-opening", title: "<b>待审文章</b>", status: "in_review", domainName: "Windows", updated: "2026-11-23" }],
  counts: { in_review: 1, changes_requested: 0 }, filter: "in_review",
  current: {
    slug: "win-store-not-opening",
    meta: { title: "微软商店打不开", status: "in_review", risk: "需谨慎", difficulty: "入门", time: "10-30 分钟", updated: XSS },
    comments: [{ id: 9, author_name: XSS_ATTR, created_at: "2026-11-22T16:40:00Z", body: XSS, resolved_at: null }],
    revCount: 3, sourcesCount: 2, domainName: "Windows 软件与性能", categoryName: "应用商店",
    sections: { required: ["一句话结论", "分步骤"], missing: ["分步骤"] }
  },
  canPublish: true, canReview: true
});
assert.match(reviewHtml, /审核队列/);
assert.match(reviewHtml, /发布前检查/);
assert.match(reviewHtml, /review-decide/);
assert.match(reviewHtml, /&lt;b&gt;待审文章&lt;\/b&gt;/);
assert.doesNotMatch(reviewHtml, /<b>待审文章<\/b>/);
assertEscaped(reviewHtml, "审核台");

test("审核台：队列为空时渲染空态而不是崩溃", function () {
  const html = views.reviewPage({
    user: USER, roles: [{ role: "root" }], csrf: CSRF, queue: [], counts: {},
    filter: "in_review", current: null, canPublish: true, canReview: true
  });
  assert.match(html, /队列已清空/);
  assert.match(html, /去文章列表/);
  assert.doesNotMatch(html, /review-decide/, "没有当前稿件时不应渲染结论表单");
  assert.doesNotMatch(html, /<iframe/, "没有当前稿件时不应渲染预览 iframe");
});

test("审核台：权限决定按钮可见性（不能渲染点了会 403 的按钮）", function () {
  const noPublish = views.reviewPage({
    user: USER, roles: [{ role: "editor" }], csrf: CSRF,
    queue: [{ slug: "s", title: "t", status: "in_review" }], counts: { in_review: 1 },
    filter: "in_review",
    current: { slug: "s", meta: { title: "t", status: "in_review" }, comments: [], revCount: 0, sourcesCount: 0, sections: { required: [], missing: [] } },
    canPublish: false, canReview: true
  });
  assert.doesNotMatch(noPublish, /value="approve"/, "无发布权限时不应出现「通过并发布」");
  assert.match(noPublish, /value="reject"/, "有审核权限时应能退回");
  assert.match(noPublish, /发布需要 reviewer/, "应说明为什么没有发布按钮");

  const noReview = views.reviewPage({
    user: USER, roles: [{ role: "editor" }], csrf: CSRF,
    queue: [{ slug: "s", title: "t", status: "in_review" }], counts: { in_review: 1 },
    filter: "in_review",
    current: { slug: "s", meta: { title: "t", status: "in_review" }, comments: [], revCount: 0, sourcesCount: 0, sections: { required: [], missing: [] } },
    canPublish: true, canReview: false
  });
  assert.doesNotMatch(noReview, /value="reject"/, "无审核权限时不应出现「退回修改」");
  assert.match(noReview, /value="approve"/);
});

test("审核台：tab 用 <nav> 而不是 role=tablist（子元素是链接）", function () {
  const html = views.reviewPage({
    user: USER, roles: [{ role: "root" }], csrf: CSRF, queue: [], counts: {},
    filter: "in_review", current: null, canPublish: true, canReview: true
  });
  assert.doesNotMatch(html, /role="tablist"/);
  assert.match(html, /<nav class="statustabs" aria-label="审核队列">/);
});

const analyticsHtml = views.analyticsPage({
  user: USER, roles: [{ role: "root" }], csrf: CSRF,
  feedback: {
    stats: { resolved: 12, unresolved: 8, total: 20, unresolved7: 3, resolutionRate: 60 },
    articles: [{ slug: "win-store-not-opening", title: "微软商店打不开", resolved: 2, unresolved: 4 }],
    recent: [{ id: 1, slug: "win-store-not-opening", title: "微软商店打不开", issue_type: "steps", issue_location: "分步骤", message: XSS, created_at: "2026-10-27T08:30:00.000Z" }],
    issues: [{ issue_type: "steps", n: 4 }]
  },
  health: { published: 82, stale: 1, missingSources: 0, updated30: 5 }
});
assert.match(analyticsHtml, /问题类型分布/);
assert.match(analyticsHtml, /文章位置/);
assert.match(analyticsHtml, /分步骤/);
assert.match(analyticsHtml, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(analyticsHtml, /<script>alert\(1\)<\/script>/);

test("数据分析：零数据时不出现 NaN/undefined", function () {
  const html = views.analyticsPage({
    user: USER, roles: [{ role: "root" }], csrf: CSRF,
    feedback: { stats: { resolved: 0, unresolved: 0, total: 0, unresolved7: 0, resolutionRate: 0 }, articles: [], recent: [], issues: [] },
    health: {}
  });
  assert.doesNotMatch(html, /NaN/);
  assert.doesNotMatch(html, /undefined/);
  assert.match(html, /还没有反馈数据/);
  assert.match(html, /还没有读者反馈/);
});

/* =========================================================================
   6. 文章列表：错误回显、转义、分页、空态
   ========================================================================= */
const listCommon = {
  user: USER, roles: [{ role: "root" }], csrf: CSRF,
  domains: [{ id: "win", name: "Windows", cats: [{ id: "c1", name: "分类一" }] }],
  risks: ["安全", "需谨慎"],
  statusCounts: { published: 1, draft: 0, in_review: 0, changes_requested: 0, archived: 0 },
  rowCaps: { submit: true, publish: true, review: true, edit: true, archive: true },
  views: [], canCreate: true, total: 1, filtered: 1, page: 1, pages: 1
};
const articlesHtml = views.articlesPage(Object.assign({}, listCommon, {
  items: [{ slug: "win-store-not-opening", title: XSS, status: "in_review", domain: "win", category: "c1", risk: "需谨慎", difficulty: "入门", sourcesCount: 0, updated: "2026-11-23" }],
  filters: { q: XSS_ATTR, status: "in_review", sort: "-updated" },
  error: "某篇文章：当前状态（已发布）不允许退回修改"
}));
assertEscaped(articlesHtml, "文章列表");
assert.match(articlesHtml, /当前状态（已发布）不允许退回修改/, "列表页必须显示 error（原先只有 notice 出口）");
assert.match(articlesHtml, /class="alert alert--err"/);
assert.match(articlesHtml, /aria-label="选择：/, "批量勾选框需要可访问名称");

test("文章列表：筛选为空与无文章是两种空态", function () {
  const filteredEmpty = views.articlesPage(Object.assign({}, listCommon, {
    items: [], total: 12, filtered: 0, filters: { q: "不存在" }
  }));
  assert.match(filteredEmpty, /没有符合条件的文章/);
  assert.match(filteredEmpty, /清除全部筛选/);

  const empty = views.articlesPage(Object.assign({}, listCommon, {
    items: [], total: 0, filtered: 0, filters: {}
  }));
  assert.match(empty, /还没有文章/);
  assert.match(empty, /新建第一篇/);
});

test("文章列表：自己的保存视图可删除，别人的不可删", function () {
  const own = views.articlesPage(Object.assign({}, listCommon, {
    items: [], total: 0, filtered: 0, filters: {},
    views: [{ id: 3, name: "待我审核", querystring: "status=in_review", owner_id: 1, is_shared: false }]
  }));
  assert.match(own, /action="\/views\/delete"/, "自己的视图应能删除（/views/delete 此前没有入口）");
  assert.match(own, /name="id" value="3"/);
  assert.match(own, /aria-label="删除视图「待我审核」"/);

  const shared = views.articlesPage(Object.assign({}, listCommon, {
    items: [], total: 0, filtered: 0, filters: {},
    views: [{ id: 4, name: "团队视图", querystring: "status=draft", owner_id: 99, is_shared: true }]
  }));
  assert.doesNotMatch(shared, /action="\/views\/delete"/, "别人的共享视图不应出现删除按钮");
});

test("文章列表：分页链接保留筛选条件", function () {
  const html = views.articlesPage(Object.assign({}, listCommon, {
    items: [{ slug: "a", title: "A", status: "draft", domain: "win", category: "c1", sourcesCount: 1, updated: "2026-11-01" }],
    total: 60, filtered: 60, page: 2, pages: 3,
    filters: { status: "draft", q: "win", sort: "-updated" }
  }));
  // 查询串里的 & 必须以 &amp; 出现在属性里（裸 & 在 HTML 里不合法）
  assert.match(html, /href="\?status=draft&amp;q=win/);
  assert.match(html, /aria-current="page"/);
});

/* =========================================================================
   7. 编辑器：结构合法（不嵌套 form / 锚点存在 / 控件有名字）
   ========================================================================= */
const editorHtml = views.editorPage({
  user: USER, roles: [{ role: "root" }], csrf: CSRF,
  meta: {
    title: "微软商店打不开", slug: "win-store-not-opening", domain: "win", category: "c1",
    risk: "需谨慎", difficulty: "入门", status: "in_review",
    sources: [{ title: "来源一", url: "https://example.com/a" }]
  },
  slug: "win-store-not-opening", body: "## 一句话结论\n\n结论\n\n## 分步骤\n\n### 步骤 1",
  isExisting: true, canPublish: true, canManageTaxonomy: true, revCount: 2,
  contentHash: "abcdef1234567890",
  taxonomy: {
    domains: [{ id: "win", name: "Windows", cats: [{ id: "c1", name: "分类一" }] }],
    enums: { risk: ["安全", "需谨慎"], difficulty: ["入门", "进阶"], sourceType: ["官方文档", "社区"] }
  },
  comments: [{ id: 3, author_name: "陈默", created_at: "2026-11-21T10:22:00Z", body: "补充一句", resolved_at: null }],
  sections: { required: ["一句话结论", "分步骤"], missing: [] }
});

test("编辑器：不得嵌套 <form>（内层会被解析器丢弃）", function () {
  const opens = (editorHtml.match(/<form\b/g) || []).length;
  const closes = (editorHtml.match(/<\/form>/g) || []).length;
  assert.strictEqual(opens, closes, "form 开闭标签必须配对：" + opens + " vs " + closes);
  // 评论表单必须在文章主表单结束之后
  const mainFormEnd = editorHtml.indexOf("</form>");
  const commentForm = editorHtml.indexOf('action="/articles/win-store-not-opening/comments"');
  assert.ok(commentForm > mainFormEnd, "评论表单不能出现在主编辑表单内部");
  // 精确断言：主表单内部不能出现第二个 <form>
  const mainStart = editorHtml.indexOf('id="editor"');
  const firstClose = editorHtml.indexOf("</form>", mainStart);
  const inside = editorHtml.slice(mainStart, firstClose);
  assert.strictEqual((inside.match(/<form\b/g) || []).length, 0, "主表单内部出现了 <form>");
});

test("编辑器：检查清单的锚点指向真实存在的元素", function () {
  const ids = {};
  let m;
  const re = /\sid="([^"]+)"/g;
  while ((m = re.exec(editorHtml))) ids[m[1]] = true;
  const hrefRe = /href="#([^"]+)"/g;
  let count2 = 0;
  while ((m = hrefRe.exec(editorHtml))) {
    assert.ok(ids[m[1]], "锚点 #" + m[1] + " 没有对应的元素 id");
    count2++;
  }
  assert.ok(count2 > 0, "编辑器页应有检查清单锚点");
});

test("编辑器：状态是只读展示（不能通过表单绕过工作流）", function () {
  assert.doesNotMatch(editorHtml, /<select id="status"/, "状态不应是可提交的表单控件");
  assert.match(editorHtml, /状态由审核\/发布流程控制/);
});

test("编辑器：参考资料与命令面板控件都有可访问名称", function () {
  assert.match(editorHtml, /aria-label="参考资料 1 标题（必填）"/);
  assert.match(editorHtml, /aria-label="参考资料 1 URL（必填）"/);
  assert.match(editorHtml, /aria-label="参考资料 1 类型"/);
  assert.match(editorHtml, /aria-label="搜索文章或页面"/);
  assert.match(editorHtml, /role="combobox"/);
});

/* =========================================================================
   8. 登录 / 改密 / 2FA / 媒体 / 来源体检
   ========================================================================= */
test("登录页：div 开闭数量一致（原先少关一层 .login-page）", function () {
  const html = views.loginPage({ error: "邮箱或密码不正确。" });
  const opens = (html.match(/<div\b/g) || []).length;
  const closes = (html.match(/<\/div>/g) || []).length;
  assert.strictEqual(opens, closes, "登录页 <div> 未配平：" + opens + " vs " + closes);
  assert.match(html, /邮箱或密码不正确/);
});

test("登录页 · 电影镜头：四幅场景 + 可访问的切换控件 + 外部脚本（无内联处理器）", function () {
  const html = views.loginPage({});
  // 四幅内联 SVG 场景，且初始只有第一幅点亮
  assert.strictEqual((html.match(/class="lg-scene(?: is-on)?"/g) || []).length, 4);
  assert.strictEqual((html.match(/class="lg-scene is-on"/g) || []).length, 1);
  assert.strictEqual((html.match(/data-lg-go="/g) || []).length, 4);
  assert.strictEqual((html.match(/aria-label="切换到第 \d 幅画面：/g) || []).length, 4);
  // 暂停控件与进度条
  assert.match(html, /data-lg-pause/);
  assert.match(html, /data-lg-progress/);
  // 脚本走 /static（CSP script-src 'self'），不得有内联事件处理器
  assert.match(html, /<script src="\/static\/login\.js" defer><\/script>/);
  assert.doesNotMatch(html, /onclick=|onload=|onerror=/);
  // 密码可见性切换（可访问名称 + aria-pressed）
  assert.match(html, /data-pw-toggle[^>]*aria-pressed="false"[^>]*aria-label="显示密码"/);
  // 表单字段仍保持原有 name，登录行为不变
  assert.match(html, /name="email"/);
  assert.match(html, /name="password"/);
  assert.match(html, /action="\/login"/);
  // 页面只有一个 h1，且场景层对读屏隐藏
  assert.strictEqual((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /class="lg-stage" aria-hidden="true"/);
});

test("激活链接页：表单提交到 /activate 并带上一次性 token（原先提交到 /change-password，邀请无法激活）", function () {
  const html = views.changePasswordPage({ csrf: "", forced: true, activateToken: "inv-token-123" });
  assert.match(html, /action="\/activate"/);
  assert.match(html, /name="t" value="inv-token-123"/);
  assert.match(html, /设置密码并激活/);
  assert.doesNotMatch(html, /name="current"/);
  assert.match(html, /class="lg-cinema/);
});

test("2FA 验证页：使用电影镜头外壳且保留一次性验证码输入语义", function () {
  const html = views.totpChallengePage({ error: "验证码不正确" });
  assert.match(html, /class="lg-cinema/);
  assert.match(html, /name="code"/);
  assert.match(html, /autocomplete="one-time-code"/);
  assert.match(html, /验证码不正确/);
  const opens = (html.match(/<div\b/g) || []).length;
  const closes = (html.match(/<\/div>/g) || []).length;
  assert.strictEqual(opens, closes, "2FA 页 <div> 未配平");
});

test("改密页：强制改密时不显示「当前密码」输入", function () {
  const forced = views.changePasswordPage({ csrf: CSRF, forced: true });
  assert.doesNotMatch(forced, /name="current"/);
  const normal = views.changePasswordPage({ csrf: CSRF });
  assert.match(normal, /name="current"/);
});

test("2FA 绑定页：复制按钮走 data-copy（内联 onclick 会被 CSP 拦掉）", function () {
  const html = views.securityConfirmPage({ secret: "JBSWY3DPEHPK3PXP", uri: "otpauth://totp/x?secret=JBSWY3DPEHPK3PXP", csrf: CSRF });
  assert.doesNotMatch(html, /onclick=/, "页面里不应有内联事件处理器（CSP script-src 'self'）");
  assert.match(html, /data-copy-from="secret"/);
  assert.match(html, /复制/);
});

test("媒体库：空态与复制/改 alt 按钮", function () {
  const empty = views.mediaPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, items: [] });
  assert.match(empty, /还没有图片/);
  assert.doesNotMatch(empty, /<img /, "空媒体库不应渲染图片");
  const one = views.mediaPage({
    user: USER, roles: [{ role: "root" }], csrf: CSRF,
    items: [{ id: 7, filename: "20260101-abcdef123456.webp", alt: XSS_ATTR, bytes: 2048, created_at: "2026-11-20", rel_path: "media/20260101-abcdef123456.webp", uploader_email: "a@b.c" }]
  });
  assert.match(one, /data-copy="media\/20260101-abcdef123456\.webp"/);
  assert.match(one, /data-setalt="7"/);
  assert.ok(one.indexOf('alt="' + XSS_ATTR + '"') < 0, "alt 属性必须转义");
});

test("来源体检：报告残缺时降级而不是崩溃", function () {
  const html = views.sourcesCheckPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, job: { status: "done", report: { urls: null } } });
  assert.match(html, /还没有体检记录/);
  const idle = views.sourcesCheckPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, job: { status: "idle" } });
  assert.match(idle, /开始体检/);
  const full = views.sourcesCheckPage({
    user: USER, roles: [{ role: "root" }], csrf: CSRF, showAll: true,
    job: { status: "done", finishedAt: "2026-11-22T20:00:00Z", report: {
      summary: { total: 2, ok: 1, dead: 1, blocked: 0, network: 0, server: 0 },
      urls: [
        { kind: "dead", status: 404, url: "javascript:alert(1)", articles: ["a"] },
        { kind: "ok", status: 200, url: "https://example.com/x", articles: null }
      ]
    } }
  });
  assert.doesNotMatch(full, /href="javascript:/i, "外部链接必须过协议白名单");
  assert.match(full, /href="https:\/\/example\.com\/x"/);
});

/* =========================================================================
   9. 账号 / 审计 / 领域与分类：转义与可访问名称
   ========================================================================= */
test("侧栏：权限决定入口（非管理员看不到账号/领域，但能看到账号安全）", function () {
  const admin = views.dashboardPage({
    user: { user_id: 1, name: "管理员", email: "r@e.c", is_root: true }, roles: [{ role: "root" }], csrf: CSRF,
    total: 0, stats: {}, recent: [], stale: [], byDomain: [], byStatus: {}, heat: [], pubTrend: [],
    feedback: { stats: {}, articles: [], recent: [], issues: [] }
  });
  assert.match(admin, /href="\/users"/);
  assert.match(admin, /href="\/taxonomy"/);
  assert.match(admin, /data-can-admin="1"/);

  const editor = views.dashboardPage({
    user: { user_id: 2, name: "编辑", email: "e@e.c", is_root: false }, roles: [{ role: "editor" }], csrf: CSRF,
    total: 0, stats: {}, recent: [], stale: [], byDomain: [], byStatus: {}, heat: [], pubTrend: [],
    feedback: { stats: {}, articles: [], recent: [], issues: [] }
  });
  assert.doesNotMatch(editor, /href="\/users"/, "editor 不应看到账号管理入口");
  assert.doesNotMatch(editor, /href="\/taxonomy"/, "editor 不应看到领域管理入口");
  assert.doesNotMatch(editor, /href="\/audit"/, "editor 不应看到审计入口");
  assert.match(editor, /href="\/security"/, "账号安全（2FA）是每个用户的设置，必须可见");
  assert.match(editor, /data-can-admin="0"/);
});

test("账号页：邀请可撤销（未使用的邀请才有按钮）", function () {
  const html = views.usersPage({
    user: USER, roles: [{ role: "root" }], csrf: CSRF, users: [],
    invites: [
      { id: 11, email: "pending@example.com", role: "editor", created_at: "2026-11-19T10:00:00", expires_at: "2099-01-01T00:00:00", used_at: null, revoked_at: null },
      { id: 12, email: "used@example.com", role: "editor", created_at: "2026-11-19T10:00:00", expires_at: "2099-01-01T00:00:00", used_at: "2026-11-20T00:00:00", revoked_at: null }
    ],
    taxonomy: { domains: [] }
  });
  assert.match(html, /action="\/invites\/11\/revoke"/);
  assert.match(html, /aria-label="撤销发给 pending@example.com 的邀请"/);
  assert.doesNotMatch(html, /action="\/invites\/12\/revoke"/, "已使用的邀请不应出现撤销按钮");
});

test("账号页：邮箱/姓名转义，邀请表单有 label", function () {
  const html = views.usersPage({
    user: USER, roles: [{ role: "root" }], csrf: CSRF,
    users: [{ id: 1, email: XSS, name: XSS_ATTR, roles: "admin, editor", status: "active", is_root: false, last_login_at: "2026-11-23T09:02:00" }],
    invites: [{ email: XSS, role: "editor", created_at: "2026-11-19T10:00:00", expires_at: "2026-11-26T10:00:00" }],
    taxonomy: { domains: [{ id: "win", name: "Windows", cats: [] }] }
  });
  assertEscaped(html, "账号页");
  assert.match(html, /<label for="ie">邮箱<\/label>/);
  assert.match(html, /<label for="ir">角色<\/label>/);
});

test("审计页：detail 以 JSON 文本转义输出", function () {
  const html = views.auditPage({
    user: USER, roles: [{ role: "root" }], csrf: CSRF,
    logs: [{ created_at: "2026-11-23T10:03:06", user_email: XSS, action: "publish.succeeded", target: XSS_ATTR, ip: "1.2.3.4", detail: { note: XSS } }]
  });
  assertEscaped(html, "审计页");
});

test("领域与分类：分类名输入框有 label + 唯一 id", function () {
  const html = views.taxonomyPage({
    user: USER, roles: [{ role: "root" }], csrf: CSRF,
    taxonomy: { domains: [{ id: "win", name: "Windows", cats: [{ id: "c1", name: "应用商店" }] }], enums: {} },
    usage: { domains: { win: 3 }, cats: { c1: 2 } }
  });
  assert.match(html, /id="cat-name-win-c1"/);
  assert.match(html, /aria-label="分类「应用商店」的名称"/);
  assert.match(html, /aria-label="删除分类「应用商店」"/);
});

/* =========================================================================
   10. 全站级结构断言：重复 id / aria 引用 / 表单内控件命名
   ========================================================================= */
function allPages() {
  const pages = {
    dashboard: views.dashboardPage({
      user: USER, roles: [{ role: "root" }], csrf: CSRF, total: 0,
      stats: {}, recent: [], stale: [], byDomain: [], byStatus: {}, heat: [], pubTrend: [],
      feedback: { stats: {}, articles: [], recent: [], issues: [] }
    }),
    articles: articlesHtml,
    editor: editorHtml,
    review: reviewHtml,
    analytics: analyticsHtml,
    publish: views.publishPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, jobs: [] }),
    users: views.usersPage({
      user: USER, roles: [{ role: "root" }], csrf: CSRF, users: [], invites: [],
      taxonomy: { domains: [], cats: [] }
    }),
    taxonomy: views.taxonomyPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, taxonomy: { domains: [], enums: {} }, usage: {} }),
    audit: views.auditPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, logs: [] }),
    media: views.mediaPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, items: [] }),
    sources: views.sourcesCheckPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, job: {} }),
    security: views.securityPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, enabled: false }),
    login: views.loginPage({}),
    simple: views.simplePage("页面不存在", "找不到该地址。", { user: USER, roles: [{ role: "root" }], csrf: CSRF }),
    revisions: views.revisionsPage({ user: USER, roles: [{ role: "root" }], csrf: CSRF, slug: "a", revisions: [] }),
    diff: views.revisionDiffPage({
      user: USER, roles: [{ role: "root" }], csrf: CSRF, slug: "a",
      rev: { revision_no: 2, created_at: "2026-11-01T00:00:00Z", author_email: "a@b.c" },
      rows: [{ t: "same", a: "x" }, { t: "add", b: "y" }, { t: "del", a: "z" }], hasCurrent: false
    })
  };
  return pages;
}

test("全站：同一页面内 id 不重复", function () {
  Object.keys(allPages()).forEach(function (name) {
    const html = allPages()[name];
    const seen = Object.create(null);
    const re = /\sid="([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) {
      assert.ok(!seen[m[1]], name + " 页出现重复 id：" + m[1]);
      seen[m[1]] = true;
    }
  });
});

test("全站：aria-controls / aria-labelledby / aria-activedescendant 指向存在的 id", function () {
  Object.keys(allPages()).forEach(function (name) {
    const html = allPages()[name];
    const ids = Object.create(null);
    let m;
    const idRe = /\sid="([^"]+)"/g;
    while ((m = idRe.exec(html))) ids[m[1]] = true;
    const refRe = /(aria-controls|aria-labelledby|aria-describedby|aria-activedescendant|for)="([^"]*)"/g;
    while ((m = refRe.exec(html))) {
      const attr = m[1], val = m[2];
      if (!val) continue;
      val.split(/\s+/).forEach(function (v) {
        if (!v) return;
        assert.ok(ids[v], name + " 页 " + attr + "=" + v + " 指向不存在的 id");
      });
    }
  });
});

test("全站：表单控件（除隐藏/按钮/文件）都有可访问名称", function () {
  Object.keys(allPages()).forEach(function (name) {
    const html = allPages()[name];
    const labelFor = Object.create(null);
    const ids = Object.create(null);
    let m;
    const idRe = /\sid="([^"]+)"/g;
    while ((m = idRe.exec(html))) ids[m[1]] = true;
    const labRe = /<label[^>]*\sfor="([^"]+)"/g;
    while ((m = labRe.exec(html))) labelFor[m[1]] = true;
    const tagRe = /<(input|select|textarea)((?:[^>"]|"[^"]*")*)>/g;
    while ((m = tagRe.exec(html))) {
      const raw = m[1] + " " + m[2];
      if (/type="(hidden|submit|button|checkbox|radio|file)"/.test(raw)) continue;
      if (/aria-label=|aria-labelledby=/.test(raw)) continue;
      const idM = /\sid="([^"]+)"/.exec(raw);
      if (idM && labelFor[idM[1]]) continue;
      assert.fail(name + " 页有缺少可访问名称的控件：" + m[0].slice(0, 120));
    }
  });
});

/* =========================================================================
   11. formToMeta（服务端表单解析）—— 延迟加载，避免依赖 DB 启动
   ========================================================================= */
test("formToMeta：按索引收集 sources，缺字段不错位", function () {
  const server = require(path.join(__dirname, "..", "src", "server.cjs"));
  const meta = server.formToMeta({
    title: "  标题  ", slug: "a-b", domain: "win", category: "c1",
    os: "Windows 11, Windows 10", risk: "需谨慎", difficulty: "入门",
    src_title_0: "只有标题", src_url_0: "",
    src_title_1: "", src_url_1: "https://example.com/b",
    src_type_1: "官方文档",
    src_title_3: "第三行", src_url_3: "https://example.com/c"
  });
  assert.strictEqual(meta.title, "标题");
  assert.strictEqual(meta.slug, "a-b");
  assert.deepStrictEqual(meta.os, ["Windows 11", "Windows 10"]);
  assert.strictEqual(meta.sources.length, 3);
  assert.strictEqual(meta.sources[0].title, "只有标题");
  assert.strictEqual(meta.sources[0].url, "");
  assert.strictEqual(meta.sources[1].url, "https://example.com/b");
  assert.strictEqual(meta.sources[1].type, "官方文档");
  assert.strictEqual(meta.sources[2].title, "第三行", "中间缺行不能让后面的行错位");
  // 只有 URL 没有标题的行也要保留（校验阶段会报「缺少标题」，但不能静默丢弃）
  const onlyUrl = server.formToMeta({ src_url_0: "https://example.com/d" });
  assert.strictEqual(onlyUrl.sources.length, 1);
  assert.strictEqual(onlyUrl.sources[0].title, "");
});

/* 清理临时夹具目录：测试不应该在仓库里留下垃圾 */
try { fs.rmSync(TMP_ABS, { recursive: true, force: true }); } catch (e) { /* 忽略 */ }

console.log("admin tests: ok (" + count + " 组断言通过)");
