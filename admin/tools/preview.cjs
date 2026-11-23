/* admin/tools/preview.cjs — 本地 UI 预览（无数据库）
   目的：views.cjs 是纯函数式 SSR，这里用真实内容文件造 fixture，
   把每个页面渲染成 HTML 并在 3025 端口起一个静态服务，供设计迭代时截图对比。
   生产不引用本文件。 */
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const fx = require(path.join(__dirname, "..", "..", "fx-frontmatter.cjs"));
const views = require("../src/views.cjs");

const ROOT = path.resolve(__dirname, "..", "..");
const CONTENT = path.join(ROOT, "content", "fixboxs");
const TAX = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "taxonomy.json"), "utf8"));

const USER = { user_id: 1, name: "袁昊明", email: "yuanhm0821@foxmail.com", is_root: true, csrf_token: "csrf-demo" };
const CSRF = "csrf-demo";
const common = { user: USER, roles: [{ role: "admin" }], csrf: CSRF, counts: { articles: 96, review: 14 } };

function readArticles() {
  return fs.readdirSync(CONTENT).filter(function (f) { return f.endsWith(".md") && !f.startsWith("_"); })
    .map(function (f) {
      const raw = fs.readFileSync(path.join(CONTENT, f), "utf8");
      const g = fx.parse(raw);
      const d = g.meta || {};
      return {
        slug: d.slug || f.replace(/\.md$/, ""), title: d.title || f,
        domain: d.domain || "", category: d.category || "",
        risk: d.risk || "", difficulty: d.difficulty || "", time: d.time || "",
        os: d.os || [], symptoms: d.symptoms || [], keywords: d.keywords || [],
        aliases: d.aliases || [], related: d.related || [], tools: d.tools || [],
        prerequisites: d.prerequisites || [],
        sources: Array.isArray(d.sources) ? d.sources : [],
        reviewer: d.reviewer || "", reviewed_at: d.reviewed_at || "",
        version: d.version || "1.0", updated: d.updated || "", status: d.status || "published",
        body: g.body || ""
      };
    });
}
const ARTICLES = readArticles();
const STATUS_ROT = ["published", "published", "draft", "in_review", "changes_requested", "published", "archived"];
ARTICLES.forEach(function (a, i) {
  if (!a.status || a.status === "published") a.status = STATUS_ROT[i % STATUS_ROT.length];
  a.sourcesCount = (a.sources || []).length;
});

const domains = TAX.domains.map(function (d) { return { id: d.id, name: d.name, cats: d.cats }; });
const risks = (TAX.enums && TAX.enums.risk) || [];
const statusCounts = {};
ARTICLES.forEach(function (a) { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

const byDomainMap = {};
ARTICLES.forEach(function (a) { byDomainMap[a.domain] = (byDomainMap[a.domain] || 0) + 1; });
function shortName(nm) {
  nm = String(nm).trim();
  const parts = nm.split(/\s+/);
  if (parts.length > 1) {
    const w = parts[1];
    return parts[0] + " " + (w.length <= 3 ? w : w.slice(0, 2));
  }
  return nm.length > 6 ? nm.slice(0, 6) : nm;
}
const byDomain = Object.keys(byDomainMap).map(function (k) {
  const d = TAX.domains.filter(function (x) { return x.id === k; })[0];
  return { id: k, name: d ? d.name : k, short: shortName(d ? d.name : k), n: byDomainMap[k] };
}).sort(function (a, b) { return b.n - a.n; });

const heat = [];
for (let i = 79; i >= 0; i--) {
  const d = new Date(Date.now() - i * 86400000);
  const n = [0, 0, 1, 3, 0, 0, 2, 6, 0, 0, 1][i % 11];
  heat.push({ n: n, level: n === 0 ? 0 : Math.min(4, n), label: (d.getMonth() + 1) + "月" + d.getDate() + "日" });
}
const pubTrend = [];
for (let i = 29; i >= 0; i--) {
  const d = new Date(Date.now() - i * 86400000);
  pubTrend.push({ label: (d.getMonth() + 1) + "/" + d.getDate(), n: [0, 1, 0, 0, 2, 0, 0, 1, 3][i % 9] });
}

/* 审核台的 iframe 要展示「线上同款」的整页 HTML：直接用 build 产物里的文章页，
   它的 ../ 相对资源（css/js/data）与线上完全一致，预览服务器再把 /asset/ 映射到站点目录。 */
function sitePageFor(slug) {
  const f = path.join(ROOT, "demo", "fixboxs", "fix", String(slug || "") + ".html");
  try { if (fs.statSync(f).isFile()) return "/asset/demo/fix/" + slug + ".html"; } catch (e) {}
  return "/asset/demo/index.html";
}

const pages = {};

/* ---------------- 工作台 ---------------- */
const stats = {
  inReview: statusCounts.in_review || 0, inReviewAll: statusCounts.in_review || 0,
  drafts: statusCounts.draft || 0, changesRequested: statusCounts.changes_requested || 0,
  published: statusCounts.published || 0, stale: 7, missingSources: ARTICLES.filter(function (a) { return !a.sourcesCount; }).length
};
const recent = ARTICLES.slice().sort(function (a, b) { return String(b.updated).localeCompare(String(a.updated)); }).slice(0, 8);
const stale = ARTICLES.slice(0, 6).map(function (a, i) { return Object.assign({}, a, { days: 182 + i * 13, reviewed_at: a.reviewed_at || "2026-04-11" }); });
const feedback = {
  stats: { resolved: 128, unresolved: 17, resolutionRate: 88, unresolved7: 9 },
  issues: [{ issue_type: "steps", n: 7 }, { issue_type: "command", n: 4 }, { issue_type: "premise", n: 3 }, { issue_type: "result", n: 2 }, { issue_type: "error", n: 1 }],
  articles: ARTICLES.slice(2, 10).map(function (a, i) { return { slug: a.slug, title: a.title, resolved: 12 - i, unresolved: 5 - (i % 4) }; }),
  recent: [
    { slug: ARTICLES[3].slug, title: ARTICLES[3].title, issue_type: "command", issue_location: "第 3 步 · netsh 命令", message: "执行到这一步提示「请求的操作需要提升」，管理员身份运行后仍然失败。", created_at: "2026-11-23T09:12:00" },
    { slug: ARTICLES[5].slug, title: ARTICLES[5].title, issue_type: "premise", issue_location: "适用 / 不适用", message: "我的是 Win11 24H2，按教程找不到这个设置项。", created_at: "2026-11-22T21:40:00" },
    { slug: ARTICLES[7].slug, title: ARTICLES[7].title, issue_type: "steps", issue_location: "第 2 步 · 重置代理", message: "重置后公司内网 VPN 连不上了，能补充怎么恢复吗？", created_at: "2026-11-22T14:05:00" }
  ]
};
pages.dashboard = views.dashboardPage(Object.assign({}, common, {
  stats: stats, recent: recent, stale: stale, byDomain: byDomain, byStatus: statusCounts,
  heat: heat, pubTrend: pubTrend, feedback: feedback, total: ARTICLES.length
}));

/* ---------------- 文章列表 ---------------- */
pages.articles = views.articlesPage(Object.assign({}, common, {
  items: ARTICLES.slice(0, 12), total: ARTICLES.length, filtered: 42, page: 2, pages: 4,
  domains: domains, risks: risks, statusCounts: statusCounts,
  filters: { status: "in_review", domain: "net-basic", q: "wifi" },
  rowCaps: { submit: true, publish: true, review: true, edit: true, archive: true }, canCreate: true,
  views: [{ name: "待我审核", querystring: "status=in_review", is_shared: true }, { name: "缺来源", querystring: "missing=sources" }]
}));

/* ---------------- 编辑器 ---------------- */
const ed = ARTICLES[0];
pages.editor = views.editorPage(Object.assign({}, common, {
  meta: ed, slug: ed.slug, body: ed.body, isExisting: true, taxonomy: TAX,
  canPublish: true, canManageTaxonomy: true, revCount: 6, contentHash: "a3f9c812dd04",
  comments: [
    { id: 11, author_name: "陈默", created_at: "2026-11-21T10:22:00", anchor: "第 3 步", body: "第 3 步的 netsh 命令在 Win11 上可能需要先重置 WinHTTP 代理，建议补一句。", resolved_at: null },
    { id: 12, author_name: "袁昊明", created_at: "2026-11-20T16:05:00", body: "已核对来源链接，微软文档 2026-11 仍有效。", resolved_at: "2026-11-20T16:20:00" }
  ]
}));
pages.editorNew = views.editorPage(Object.assign({}, common, {
  meta: {}, slug: "", body: "", isNew: true, isExisting: false, taxonomy: TAX, canPublish: false, canManageTaxonomy: true
}));

/* ---------------- 其他页 ---------------- */
pages.publish = views.publishPage(Object.assign({}, common, {
  jobs: [
    { id: 314, action: "publish", slug: "", status: "succeeded", created_at: "2026-11-23T10:02:11", started_at: "2026-11-23T10:02:11", finished_at: "2026-11-23T10:03:06" },
    { id: 313, action: "publish", slug: "wifi-connected-but-no-internet", status: "failed", created_at: "2026-11-22T18:40:00", started_at: "2026-11-22T18:40:00", finished_at: "2026-11-22T18:40:31", error: "build-fix.cjs 退出码 1：content-lint V6 失败（missing section 怎么确认修好了）" },
    { id: 312, action: "publish", slug: "", status: "succeeded", created_at: "2026-11-21T09:15:00", started_at: "2026-11-21T09:15:00", finished_at: "2026-11-21T09:16:12" }
  ], csrf: CSRF
}));
pages.users = views.usersPage(Object.assign({}, common, {
  users: [
    { id: 1, email: "yuanhm0821@foxmail.com", name: "袁昊明", roles: "admin", status: "active", is_root: true, last_login_at: "2026-11-23T09:02:00" },
    { id: 2, email: "chenmo@example.com", name: "陈默", roles: "editor", status: "active", scope_domain: "win-system", last_login_at: "2026-11-22T20:11:00" },
    { id: 3, email: "lin@example.com", name: "林晓", roles: "reviewer", status: "active", last_login_at: "2026-11-20T11:30:00" },
    { id: 4, email: "zhao@example.com", name: "赵一鸣", roles: "viewer", status: "disabled", last_login_at: "2026-10-02T08:00:00", pending_email: "zhaoym@example.com", pending_email_expires: "2026-11-30T00:00:00" }
  ],
  invites: [{ email: "new@example.com", role: "editor", created_at: "2026-11-19T10:00:00", expires_at: "2026-11-26T10:00:00" }],
  taxonomy: TAX
}));
pages.taxonomy = views.taxonomyPage(Object.assign({}, common, {
  taxonomy: TAX,
  usage: { domains: byDomainMap, cats: {} }
}));
pages.audit = views.auditPage(Object.assign({}, common, {
  logs: [
    { created_at: "2026-11-23T10:03:06", user_email: "yuanhm0821@foxmail.com", action: "publish.succeeded", target: "build 20261123", ip: "106.55.2.197", detail: { files: 96, duration: 55 } },
    { created_at: "2026-11-23T09:12:44", user_email: "chenmo@example.com", action: "article.update", target: "wifi-connected-but-no-internet", ip: "113.87.22.10", detail: { fields: ["body", "sources"] } },
    { created_at: "2026-11-23T09:02:01", user_email: "yuanhm0821@foxmail.com", action: "auth.login", target: "", ip: "113.87.22.10", detail: null }
  ]
}));
pages.media = views.mediaPage(Object.assign({}, common, {
  items: [
    { id: 1, filename: "win-dns-setting.webp", alt: "Windows 网络属性中「使用下面的 DNS 服务器地址」的位置", bytes: 184320, created_at: "2026-11-20", uploader_email: "chenmo@example.com", rel_path: "media/win-dns-setting.webp" },
    { id: 2, filename: "router-wan-status.webp", alt: "路由器后台 WAN 状态页显示已连接", bytes: 240640, created_at: "2026-11-19", uploader_email: "chenmo@example.com", rel_path: "media/router-wan-status.webp" },
    { id: 3, filename: "mac-proxy-settings.webp", alt: "", bytes: 91000, created_at: "2026-11-18", uploader_email: "yuanhm0821@foxmail.com", rel_path: "media/mac-proxy-settings.webp" }
  ]
}));
pages.sources = views.sourcesCheckPage(Object.assign({}, common, {
  job: { status: "done", finishedAt: "2026-11-22T20:00:00", report: {
    summary: { total: 230, ok: 211, dead: 4, blocked: 9, network: 3, server: 3 },
    urls: [
      { kind: "dead", status: 404, url: "https://support.microsoft.com/zh-cn/windows/old-page", articles: ["win-update-stuck"] },
      { kind: "blocked", status: 403, url: "https://www.dell.com/support/kbdoc/000132309", articles: ["driver-install-rollback"] },
      { kind: "server", status: 502, url: "https://consumer.huawei.com/cn/support/content/zh-cn00760444/", articles: ["wifi-ssid-not-found"] }
    ]
  } }
}));
pages.security = views.securityPage(Object.assign({}, common, { enabled: false }));
pages.login = views.loginPage({});
pages['login-error'] = views.loginPage({ error: "邮箱或密码不正确。" });

/* ---- 边界/空态与超长内容（UI 评审用：空态、截断、错误提示都要能看到） ---- */
pages['articles-empty'] = views.articlesPage(Object.assign({}, common, {
  items: [], total: 0, filtered: 0, page: 1, pages: 1,
  domains: domains, risks: risks, statusCounts: {}, canCreate: true,
  filters: { sort: "-updated" }, rowCaps: { submit: true, publish: true, review: true, edit: true, archive: true },
  views: []
}));
pages['articles-filtered-empty'] = views.articlesPage(Object.assign({}, common, {
  items: [], total: ARTICLES.length, filtered: 0, page: 1, pages: 1,
  domains: domains, risks: risks, statusCounts: statusCounts, canCreate: true,
  filters: { status: "in_review", domain: "net-basic", q: "不存在的关键词", sort: "-updated" },
  rowCaps: { submit: true, publish: true, review: true, edit: true, archive: true }, views: []
}));
pages['articles-error'] = views.articlesPage(Object.assign({}, common, {
  items: ARTICLES.slice(0, 3), total: ARTICLES.length, filtered: 3, page: 1, pages: 1,
  domains: domains, risks: risks, statusCounts: statusCounts, canCreate: true,
  filters: { sort: "-updated" }, rowCaps: { edit: true }, views: [],
  error: "wifi-connected-but-no-internet：当前状态（已发布）不允许退回修改"
}));
pages['articles-long'] = views.articlesPage(Object.assign({}, common, {
  items: ARTICLES.slice(0, 6).map(function (a, i) {
    return Object.assign({}, a, {
      title: i === 0 ? "Windows 11 更新后任务栏与开始菜单完全无响应、点击无反应、资源管理器反复重启且硬件加速相关的图形驱动疑似失效（超长标题截断测试）" : a.title,
      slug: i === 1 ? "a-very-long-slug-that-should-not-break-the-table-layout-at-all-really" : a.slug
    });
  }),
  total: 6, filtered: 6, page: 1, pages: 1, domains: domains, risks: risks,
  statusCounts: statusCounts, canCreate: false, filters: { sort: "-updated" }, views: []
}));
pages['review-empty'] = views.reviewPage(Object.assign({}, common, {
  queue: [], counts: { in_review: 0, changes_requested: 3 }, filter: "in_review",
  current: null, canPublish: true, canReview: true
}));
pages['analytics-empty'] = views.analyticsPage(Object.assign({}, common, {
  feedback: { stats: { resolved: 0, unresolved: 0, total: 0, unresolved7: 0, resolutionRate: 0 }, articles: [], recent: [], issues: [] },
  health: { published: 0, stale: 0, missingSources: 0, updated30: 0 }
}));
pages['media-empty'] = views.mediaPage(Object.assign({}, common, { items: [] }));
pages['sources-idle'] = views.sourcesCheckPage(Object.assign({}, common, { job: { status: "idle" } }));
pages['editor-error'] = views.editorPage(Object.assign({}, common, {
  meta: ARTICLES[0], slug: ARTICLES[0].slug, body: "", isExisting: true, taxonomy: TAX,
  canPublish: true, canManageTaxonomy: true, revCount: 0, contentHash: "a3f9c812dd04",
  comments: [], sections: { required: ["一句话结论", "分步骤"], missing: ["一句话结论", "分步骤"] },
  error: "内容校验未通过：正文缺少必要段落：## 一句话结论；参考资料[2]缺少 URL"
}));
pages['security-confirm'] = views.securityConfirmPage(Object.assign({}, common, {
  secret: "JBSWY3DPEHPK3PXP", uri: "otpauth://totp/%E4%BF%AE%E7%9B%92%E5%AD%90?secret=JBSWY3DPEHPK3PXP&issuer=fixbox",
  codes: null
}));
pages['security-codes'] = views.securityConfirmPage(Object.assign({}, common, {
  secret: "JBSWY3DPEHPK3PXP", uri: "otpauth://totp/x?secret=JBSWY3DPEHPK3PXP",
  codes: ["3F7K-92QD", "7M2P-XR4T", "9QWZ-1L8V", "5NJH-6BK3"], done: true
}));
pages.totp = views.totpChallengePage({ error: "验证码不正确，请重试（确认手机时间准确）" });
pages.changepw = views.changePasswordPage({ csrf: CSRF, forced: true });

/* ---------------- 审核台 / 数据分析 ---------------- */
const inReview = ARTICLES.filter(function (a) { return a.status === "in_review"; });
const queue = (inReview.length ? inReview : ARTICLES.slice(0, 4)).map(function (a) {
  const d = TAX.domains.filter(function (x) { return x.id === a.domain; })[0];
  return { slug: a.slug, title: a.title, status: a.status, domainName: d ? d.name : a.domain, updated: a.updated };
});
const cur = ARTICLES.filter(function (a) { return a.status === "in_review"; })[0] || ARTICLES[0];
pages.review = views.reviewPage(Object.assign({}, common, {
  queue: queue, counts: { in_review: queue.length, changes_requested: 14 }, filter: "in_review",
  current: {
    slug: cur.slug, meta: cur, comments: [
      { id: 1, author_name: "林晓", created_at: "2026-11-21T09:12:00", body: "第 3 步的命令在 Win11 上需要管理员权限，建议补一句。", resolved_at: "2026-11-21T10:00:00" },
      { id: 2, author_name: "陈默", created_at: "2026-11-22T16:40:00", body: "来源里的微软文档链接 404 了，换现行页面。", resolved_at: null }
    ],
    revCount: 5, sourcesCount: (cur.sources || []).length,
    domainName: (TAX.domains.filter(function (x) { return x.id === cur.domain; })[0] || {}).name || cur.domain,
    categoryName: "",
    sections: { required: ["一句话结论", "分步骤"], missing: [] }
  },
  /* iframe 用本预览服务器自己托管的站点页面（/asset/ 映射到 demo/fixboxs/）：
     不依赖另一个 8080 前端预览进程，DevTools 控制台里也不会出现跨进程的 404。 */
  previewUrl: sitePageFor(cur.slug),
  canPublish: true, canReview: true
}));
/* 边界：只有审核权限（无发布权限）时，结论条应只出现「退回修改」 */
pages['review-no-publish'] = views.reviewPage(Object.assign({}, common, {
  previewUrl: sitePageFor(cur.slug),
  queue: queue, counts: { in_review: queue.length, changes_requested: 0 }, filter: "in_review",
  current: {
    slug: cur.slug, meta: cur, comments: [], revCount: 2, sourcesCount: 1,
    domainName: "网络与上网", categoryName: "",
    sections: { required: ["一句话结论", "分步骤"], missing: ["分步骤"] }
  },
  canPublish: false, canReview: true
}));
pages.analytics = views.analyticsPage(Object.assign({}, common, {
  feedback: feedback,
  health: { published: 41, stale: 7, missingSources: 0, updated30: 12 }
}));

/* 输出 */
const OUT = path.join(ROOT, ".tmp-admin-preview");
fs.mkdirSync(OUT, { recursive: true });
Object.keys(pages).forEach(function (k) {
  /* 预览环境没有 media/ 目录：把 /media/<随机名>.<ext> 全部指到仓库里真实存在的一张示例图，
     这样媒体库页面不会整屏裂图、DevTools 控制台也不会出现 404 噪音（评审要求 0 error）。
     （旧代码后面还跟了一句 .replace(/\.webp"/g, '.webp"')，是自己替换自己的一次性残留，已删。） */
  const html = String(pages[k]).replace(/src="\/media\/[^"]*"/g, 'src="/asset/demo/img/hardware-poster.webp"');
  fs.writeFileSync(path.join(OUT, k + ".html"), html, "utf8");
});
console.log("rendered: " + Object.keys(pages).join(", "));

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
/* 只允许访问白名单根目录内的文件：本地工具同样不该因为 ../.. 读到仓库外的东西 */
function under(root, p) {
  const abs = path.resolve(p);
  const base = path.resolve(root);
  return abs === base || abs.startsWith(base + path.sep) ? abs : null;
}

http.createServer(function (req, res) {
  let u;
  try {
    u = decodeURIComponent(String(req.url || "/").split("?")[0]);
  } catch (e) {
    // 畸形百分号编码（/%E0%A4%A）会让 decodeURIComponent 抛错；旧实现会直接打断进程
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("bad request");
  }
  let file = null;
  if (u === "/") { res.writeHead(302, { Location: "/p/dashboard" }); return res.end(); }
  if (u.startsWith("/p/")) file = under(OUT, path.join(OUT, u.slice(3) + ".html"));
  else if (u.startsWith("/static/")) file = under(path.join(__dirname, "..", "public"), path.join(__dirname, "..", "public", u.slice(8)));
  else if (u.startsWith("/asset/demo/")) file = under(path.join(ROOT, "demo", "fixboxs"), path.join(ROOT, "demo", "fixboxs", u.slice(12)));
  else if (u.startsWith("/asset/")) {
    /* 站点产物里的相对路径最终会落到 /css、/js、/data、/img 这些「站点根」路径，
       而预览把整站挂在 /asset/ 下；这里优先找 demo/fixboxs，再回退 demo/。 */
    const rest = u.slice(7);
    const cand = path.join(ROOT, "demo", "fixboxs", rest);
    let exists = false;
    try { exists = fs.statSync(cand).isFile(); } catch (e) { exists = false; }
    file = exists ? under(path.join(ROOT, "demo", "fixboxs"), cand) : under(ROOT, path.join(ROOT, "demo", rest));
  }
  let ok = false;
  try { ok = !!file && fs.statSync(file).isFile(); } catch (e) { ok = false; }
  if (!ok) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("not found");
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(3025, function () { console.log("preview: http://localhost:3025/p/dashboard"); });