
/* admin/src/views.cjs — 服务端渲染模板（无模板引擎依赖）
   设计原则：产物是本项目自包含单文件风格 —— 内联 CSS，不引外部资源，
   因此 CSP 可以收得很紧（default-src 'self'）。 */
"use strict";
const h = require("./http.cjs");
const esc = h.esc;

const BASE_CSS = `
:root{
  --bg:#FAFAF9; --surface:#FFFFFF; --border:#E4E4E7; --fg:#18181B; --fg-muted:#71717A;
  --brand:#4F46E5; --brand-600:#4338CA; --ok:#059669; --warn:#D97706; --danger:#DC2626;
  --radius:10px; --touch:44px;
}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",sans-serif;
  background:var(--bg);color:var(--fg);font-size:15px;line-height:1.6}
a{color:var(--brand);text-decoration:none}
a:hover{text-decoration:underline}
header.top{background:var(--surface);border-bottom:1px solid var(--border);padding:0 20px;
  display:flex;align-items:center;gap:20px;height:56px;position:sticky;top:0;z-index:10}
header.top .brand{font-weight:700;display:flex;align-items:center;gap:8px}
header.top .brand .mark{width:26px;height:26px;border-radius:7px;background:#91E6C1;color:#0B3B2E;
  display:grid;place-items:center;font-size:14px}
header.top nav{display:flex;gap:16px;font-size:14px}
header.top .spacer{flex:1}
header.top .who{font-size:13px;color:var(--fg-muted);display:flex;align-items:center;gap:8px}
main{max-width:1080px;margin:0 auto;padding:24px 20px 60px}
main.wide{max-width:1400px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px}
h1{font-size:22px;margin:0 0 16px}
h2{font-size:17px;margin:24px 0 12px}
h3{font-size:15px;margin:18px 0 8px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:top}
th{font-weight:600;color:var(--fg-muted);font-size:12.5px}
tr:hover td{background:#FAFAFA}
label{display:block;font-size:13px;font-weight:600;margin:14px 0 5px;color:#3F3F46}
input[type=text],input[type=password],input[type=email],input[type=date],select,textarea{
  width:100%;padding:9px 11px;border:1px solid var(--border);border-radius:8px;font:inherit;
  background:#fff;min-height:var(--touch)}
textarea{min-height:420px;font-family:ui-monospace,Consolas,"Courier New",monospace;font-size:13.5px;line-height:1.65}
input:focus,select:focus,textarea:focus{outline:2px solid var(--brand);outline-offset:1px;border-color:var(--brand)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 15px;
  border-radius:8px;border:1px solid var(--border);background:#fff;color:var(--fg);cursor:pointer;
  font:inherit;min-height:var(--touch);text-decoration:none}
.btn:hover{background:#F4F4F5;text-decoration:none}
.btn--primary{background:var(--brand);border-color:var(--brand);color:#fff}
.btn--primary:hover{background:var(--brand-600)}
.btn--danger{background:var(--danger);border-color:var(--danger);color:#fff}
.btn--sm{min-height:34px;padding:5px 11px;font-size:13px}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
.muted{color:var(--fg-muted);font-size:13px}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600}
.pill--published{background:#D1FAE5;color:#065F46}
.pill--draft{background:#FEF3C7;color:#92400E}
.pill--in_review{background:#DBEAFE;color:#1E40AF}
.pill--changes_requested{background:#FFE4E6;color:#9F1239}
.pill--archived{background:#E5E7EB;color:#374151}
.pill--editor{background:#E0E7FF;color:#3730A3}
.pill--admin{background:#FCE7F3;color:#9D174D}
.pill--reviewer{background:#FEF3C7;color:#92400E}
.pill--viewer{background:#F3F4F6;color:#4B5563}
.alert{padding:11px 14px;border-radius:8px;margin:0 0 16px;font-size:14px}
.alert--err{background:#FEF2F2;border:1px solid #FECACA;color:#991B1B}
.alert--ok{background:#F0FDF4;border:1px solid #BBF7D0;color:#166534}
.alert--info{background:#EFF6FF;border:1px solid #BFDBFE;color:#1E40AF}
.login-wrap{max-width:400px;margin:8vh auto;padding:0 20px}
.login-wrap .card{padding:28px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
@media(max-width:720px){.grid2,.grid3{grid-template-columns:1fr}}
.empty{padding:36px;text-align:center;color:var(--fg-muted)}
.kbd{font-family:ui-monospace,monospace;background:#F4F4F5;border:1px solid var(--border);
  border-radius:5px;padding:1px 6px;font-size:12.5px}
`;

function layout(title, bodyHtml, opts) {
  opts = opts || {};
  const user = opts.user;
  const roles = opts.roles || [];
  const isAdmin = user && (user.is_root || roles.some(function(r){return r.role==="admin";}));
  const isReviewer = user && (user.is_root || roles.some(function(r){return r.role==="admin"||r.role==="reviewer";}));
  const nav = opts.nav === false ? "" :
    '<nav><a href="/articles">文章</a>' +
    (isReviewer ? '<a href="/audit">审计</a>' : '') +
    (isAdmin ? '<a href="/users">账号</a>' : '') +
    '<a href="/publish">发布</a></nav>';
  let who = "";
  if (user) {
    const roleHtml = user.is_root ? '<span class="pill pill--admin">root</span>'
      : roles.map(function(r){return '<span class="pill pill--'+esc(r.role)+'">'+esc(r.role)+'</span>';}).join(' ');
    who = '<span class="who">' + esc(user.name || user.email) + ' ' + roleHtml + '</span>' +
      '<form method="post" action="/logout" style="display:inline">' +
      '<input type="hidden" name="_csrf" value="' + esc(opts.csrf||"") + '">' +
      '<button class="btn btn--sm" type="submit">退出</button></form>';
  }
  return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<meta name="robots" content="noindex,nofollow">\n' +
    '<title>' + esc(title) + ' · 修盒子内容后台</title>\n' +
    '<style>' + BASE_CSS + '</style>\n</head>\n<body>\n' +
    (opts.nav === false ? "" : '<header class="top"><span class="brand"><span class="mark" aria-hidden="true">修</span>内容后台</span>' + nav + '<span class="spacer"></span>' + who + '</header>') +
    '\n<main class="' + (opts.wide ? "wide" : "") + '">\n' + bodyHtml + '\n</main>\n</body>\n</html>';
}

function statusLabel(s) {
  return ({ published: "已发布", draft: "草稿", in_review: "审核中",
            changes_requested: "退回修改", archived: "归档" })[s] || s || "未知";
}

function loginPage(opts) {
  opts = opts || {};
  const err = opts.error ? '<div class="alert alert--err">' + esc(opts.error) + "</div>" : "";
  const info = opts.info ? '<div class="alert alert--info">' + esc(opts.info) + "</div>" : "";
  return layout("登录",
    '<div class="login-wrap"><div class="card">' +
    "<h1>登录内容后台</h1>" +
    '<p class="muted" style="margin-top:-8px">仅限内部编辑人员使用。账号由管理员分发。</p>' +
    err + info +
    '<form method="post" action="/login">' +
    '<label for="email">邮箱</label><input id="email" name="email" type="email" required autocomplete="username" autofocus>' +
    '<label for="password">密码</label><input id="password" name="password" type="password" required autocomplete="current-password">' +
    '<div style="margin-top:20px"><button class="btn btn--primary" type="submit" style="width:100%">登录</button></div>' +
    "</form></div>" +
    '<p class="muted" style="text-align:center">账号信息仅用于内容协作。请勿分享登录凭据。</p></div>',
    { nav: false });
}

function changePasswordPage(opts) {
  opts = opts || {};
  const err = opts.error ? '<div class="alert alert--err">' + esc(opts.error) + "</div>" : "";
  const forced = opts.forced ? '<div class="alert alert--info">这是首次登录（或密码已被重置），必须先设置新密码才能继续。</div>' : "";
  const curField = opts.forced ? "" :
    '<label for="current">当前密码</label><input id="current" name="current" type="password" required autocomplete="current-password">';
  return layout("修改密码",
    '<div class="login-wrap"><div class="card"><h1>设置新密码</h1>' + forced + err +
    '<form method="post" action="/change-password">' +
    '<input type="hidden" name="_csrf" value="' + esc(opts.csrf||"") + '">' +
    curField +
    '<label for="np">新密码</label><input id="np" name="password" type="password" required autocomplete="new-password">' +
    '<label for="np2">确认新密码</label><input id="np2" name="password2" type="password" required autocomplete="new-password">' +
    '<p class="muted" style="margin-top:8px">至少 12 位；需包含大写字母、小写字母、数字、符号中的至少 3 类；不得含常见词。</p>' +
    '<div style="margin-top:18px"><button class="btn btn--primary" type="submit" style="width:100%">保存并继续</button></div>' +
    "</form></div></div>",
    { nav: false, csrf: opts.csrf, user: null });
}

function articlesPage(opts) {
  const rows = opts.items.map(function (a) {
    const pill = '<span class="pill pill--' + esc(a.status) + '">' + esc(statusLabel(a.status)) + "</span>";
    const whereLabel = a.where === "published" ? "已发布" : (a.where === "draft" ? "草稿" : "归档");
    return '<tr><td><a href="/articles/' + esc(a.slug) + '">' + esc(a.title || a.slug) + "</a>" +
      '<div class="muted">' + esc(a.slug) + "</div></td>" +
      "<td>" + pill + "</td>" +
      "<td>" + esc(a.domain || "") + '<div class="muted">' + esc(a.category || "") + "</div></td>" +
      "<td>" + esc(a.risk || "") + '<div class="muted">' + esc(a.difficulty || "") + "</div></td>" +
      "<td>" + esc(a.updated || "") + "</td>" +
      "<td>" + a.sourcesCount + "</td>" +
      "<td>" + whereLabel + "</td></tr>";
  }).join("");
  return layout("文章",
    '<div class="row" style="justify-content:space-between;margin-bottom:14px"><h1 style="margin:0">文章（' + opts.items.length + '）</h1>' +
    (opts.canCreate ? '<a class="btn btn--primary" href="/articles/new">新建文章</a>' : "") + "</div>" +
    (opts.notice ? '<div class="alert alert--ok">' + esc(opts.notice) + "</div>" : "") +
    '<div class="card" style="padding:0;overflow:auto"><table>' +
    "<thead><tr><th>标题</th><th>状态</th><th>领域 / 分类</th><th>风险 / 难度</th><th>更新</th><th>来源</th><th>位置</th></tr></thead><tbody>" +
    (rows || '<tr><td colspan="7" class="empty">暂无文章</td></tr>') +
    "</tbody></table></div>",
    opts);
}
function editorPage(opts) {
  const m = opts.meta || {};
  const isNew = !opts.isExisting;
  const tax = opts.taxonomy;
  const err = opts.error ? '<div class="alert alert--err">' + esc(opts.error) + "</div>" : "";
  const ok = opts.notice ? '<div class="alert alert--ok">' + esc(opts.notice) + "</div>" : "";

  const domOpts = tax.domains.map(function (d) {
    return '<option value="' + esc(d.id) + '"' + (m.domain === d.id ? " selected" : "") + ">" + esc(d.name) + "</option>";
  }).join("");
  const catOpts = tax.domains.flatMap(function (d) {
    return d.cats.map(function (c) {
      return '<option value="' + esc(c.id) + '" data-dom="' + esc(d.id) + '"' +
        (m.category === c.id ? " selected" : "") + ">" + esc(d.name) + " › " + esc(c.name) + "</option>";
    });
  }).join("");
  const riskOpts = tax.enums.risk.map(function (r) {
    return '<option value="' + esc(r) + '"' + (m.risk === r ? " selected" : "") + ">" + esc(r) + "</option>";
  }).join("");
  const diffOpts = tax.enums.difficulty.map(function (r) {
    return '<option value="' + esc(r) + '"' + (m.difficulty === r ? " selected" : "") + ">" + esc(r) + "</option>";
  }).join("");
  const arrVal = function (k) { return Array.isArray(m[k]) ? m[k].join(", ") : (m[k] || ""); };
  const sources = Array.isArray(m.sources) ? m.sources : [];
  const typeOptsFor = function (sel) {
    return '<option value="">（无）</option>' + tax.enums.sourceType.map(function (t) {
      return '<option value="' + esc(t) + '"' + (sel === t ? " selected" : "") + ">" + esc(t) + "</option>";
    }).join("");
  };
  // 字段名带索引（src_title_0 / src_url_0 / src_type_0）：
  // 原先用无索引的 src_title/src_url/src_type 三个数组「按位置对齐」，
  // 一旦某一项缺失（例如某行没填类型），数组会错位，把 URL 配到别的行上。
  // 带索引后每行自成一个三元组，缺项也不会串行。
  const sourceRows = sources.map(function (s, idx) {
    return '<div class="row src-row" style="margin-bottom:8px">' +
      '<input type="text" name="src_title_' + idx + '" placeholder="标题（必填）" value="' + esc(s.title || "") + '" style="flex:2">' +
      '<input type="text" name="src_url_' + idx + '" placeholder="https://…（必填）" value="' + esc(s.url || "") + '" style="flex:3">' +
      '<select name="src_type_' + idx + '" style="flex:1">' + typeOptsFor(s.type) + "</select>" +
      '<button class="btn btn--sm" type="button" data-src-remove>删除</button></div>';
  }).join("");
  const buttons = (opts.canPublish && !isNew)
    ? '<button class="btn btn--primary" type="submit" name="action" value="publish">保存并发布</button>' : "";
  // 供前端新增 source 行使用的类型下拉（通过 data 属性传给 editor.js，避免内联脚本）
  const typeOptionsHtml = typeOptsFor(null);

  const body = '<form method="post" action="' + (isNew ? "/articles/new" : "/articles/" + esc(opts.slug)) + '" id="editor">' +
    '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
    '<input type="hidden" name="baseHash" value="' + esc(opts.contentHash || "") + '">' +
    '<div class="row" style="justify-content:space-between;margin-bottom:12px"><h1 style="margin:0">' +
      (isNew ? "新建文章" : esc(m.title || opts.slug)) + '</h1><div class="row">' +
      '<a class="btn" href="/articles">返回列表</a>' + buttons +
      '<button class="btn" type="submit" name="action" value="save">保存草稿</button></div></div>' +
    (opts.contentHash ? '<p class="muted">当前版本：<span class="kbd">' + esc(opts.contentHash.slice(0,12)) + '</span>（乐观锁：他人已修改时保存会提示冲突）</p>' : "") +
    '<div class="grid2">' +
    '<div class="card"><h2 style="margin-top:0">基本字段</h2>' +
    '<label for="title">标题</label><input id="title" name="title" type="text" value="' + esc(m.title || "") + '" required maxlength="60">' +
    '<label for="slug">slug</label><input id="slug" name="slug" type="text" value="' + esc(opts.slug || m.slug || "") + '" ' + (isNew ? "required" : "readonly") + ' pattern="[a-z0-9-]+">' +
    (isNew ? '<p class="muted">仅小写字母、数字、连字符。发布后不应再改（URL 稳定性）。</p>' : "") +
    '<div class="grid2"><div><label for="domain">领域</label><select id="domain" name="domain" required><option value="">请选择</option>' + domOpts + '</select></div>' +
    '<div><label for="category">分类</label><select id="category" name="category" required><option value="">请选择</option>' + catOpts + '</select></div></div>' +
    '<div class="grid3"><div><label for="difficulty">难度</label><select id="difficulty" name="difficulty">' + diffOpts + '</select></div>' +
    '<div><label for="risk">风险</label><select id="risk" name="risk" required>' + riskOpts + '</select></div>' +
    '<div><label for="time">耗时</label><input id="time" name="time" type="text" value="' + esc(m.time || "") + '" placeholder="15-30 分钟"></div></div>' +
    '<label for="os">适用系统（逗号分隔）</label><input id="os" name="os" type="text" value="' + esc(arrVal("os")) + '" placeholder="Windows 10, Windows 11"></div>' +
    '<div class="card"><h2 style="margin-top:0">检索与关联</h2>' +
    '<label for="symptoms">症状（逗号分隔，≥3）</label><input id="symptoms" name="symptoms" type="text" value="' + esc(arrVal("symptoms")) + '">' +
    '<label for="keywords">关键词（逗号分隔，≥5）</label><input id="keywords" name="keywords" type="text" value="' + esc(arrVal("keywords")) + '">' +
    '<label for="aliases">别名 / 口语词（逗号分隔，≥2）</label><input id="aliases" name="aliases" type="text" value="' + esc(arrVal("aliases")) + '">' +
    '<label for="related">相关教程 slug（逗号分隔，≥2）</label><input id="related" name="related" type="text" value="' + esc(arrVal("related")) + '">' +
    '<div class="grid2"><div><label for="reviewer">复核人</label><input id="reviewer" name="reviewer" type="text" value="' + esc(m.reviewer || "") + '"></div>' +
    '<div><label for="reviewed_at">复核日期</label><input id="reviewed_at" name="reviewed_at" type="date" value="' + esc(m.reviewed_at || "") + '"></div></div>' +
    '<div class="grid3"><div><label for="version">版本</label><input id="version" name="version" type="text" value="' + esc(m.version || "1.0") + '"></div>' +
    '<div><label for="updated">更新日期</label><input id="updated" name="updated" type="date" value="' + esc(m.updated || "") + '"></div>' +
    '<div><label for="status">状态</label><select id="status" name="status">' +
    ["draft","in_review","changes_requested","published","archived"].map(function (s) {
      return '<option value="' + s + '"' + (m.status === s ? " selected" : "") + ">" + esc(statusLabel(s)) + "</option>";
    }).join("") + "</select></div></div></div></div>" +
    '<div class="card"><h2 style="margin-top:0">参考资料（sources）</h2>' +
    '<p class="muted">每条含标题与 URL（必填），类型可选。这是「官方来源」的承载字段，保存时不会丢失。</p>' +
    '<div id="src-list">' + sourceRows + '</div>' +
    '<button class="btn btn--sm" type="button" id="src-add">+ 添加一条</button></div>' +
    '<div class="card"><h2 style="margin-top:0">前置条件 / 工具</h2>' +
    '<label for="prerequisites">前置条件（逗号分隔）</label><input id="prerequisites" name="prerequisites" type="text" value="' + esc(arrVal("prerequisites")) + '">' +
    '<label for="tools">工具（逗号分隔）</label><input id="tools" name="tools" type="text" value="' + esc(arrVal("tools")) + '"></div>' +
    '<div class="card"><h2 style="margin-top:0">正文（Markdown，10 段结构）</h2>' +
    '<p class="muted">固定段落：一句话结论 / 30 秒快速排查 / 适用 / 不适用 / 开始前确认 / 分步骤 / 怎么确认修好了 / 还是不行？ / 预防 / 相关教程 / 更新日志</p>' +
    '<textarea name="body" spellcheck="false">' + esc(opts.body || "") + "</textarea></div>" +
    '<div class="row" style="justify-content:flex-end"><button class="btn" type="submit" name="action" value="save">保存草稿</button>' + buttons + "</div></form>" +
    '<template id="src-type-options">' + typeOptionsHtml + "</template>" +
    '<script src="/static/editor.js" defer></script>';

  return layout((isNew ? "新建文章" : "编辑：" + (m.title || opts.slug)), err + ok + body, Object.assign({ wide: true }, opts));
}
function publishPage(opts) {
  const jobs = opts.jobs.map(function (j) {
    const dur = j.finished_at && j.started_at
      ? Math.round((new Date(j.finished_at) - new Date(j.started_at)) / 1000) + "s" : "—";
    const cls = j.status === "succeeded" ? "pill--published" : (j.status === "failed" ? "pill--changes_requested" : "pill--draft");
    return "<tr><td>#" + j.id + "</td>" +
      "<td>" + esc(j.action) + ' <span class="muted">' + esc(j.slug || "") + "</span></td>" +
      '<td><span class="pill ' + cls + '">' + esc(j.status) + "</span></td>" +
      "<td>" + esc(String(j.created_at || "").slice(0,19).replace("T"," ")) + "</td>" +
      "<td>" + dur + "</td>" +
      "<td>" + (j.error ? '<span style="color:#DC2626">' + esc(String(j.error).slice(0,140)) + "</span>" : "") + "</td></tr>";
  }).join("");
  return layout("发布",
    "<h1>发布队列</h1>" +
    '<p class="muted">发布是串行的：同一时刻只允许一个任务运行（构建目录共享、部署是整目录切换）。</p>' +
    (opts.notice ? '<div class="alert alert--ok">' + esc(opts.notice) + "</div>" : "") +
    (opts.error ? '<div class="alert alert--err">' + esc(opts.error) + "</div>" : "") +
    '<div class="card"><form method="post" action="/publish">' +
    '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
    "<p>手动触发一次完整发布（构建 → 产物化 → 原子切换 → 线上全量校验）。</p>" +
    '<button class="btn btn--primary" type="submit">立即发布</button>' +
    '<span class="muted" style="margin-left:10px">发布不会修改内容本身。</span></form></div>' +
    '<div class="card" style="padding:0;overflow:auto"><table>' +
    "<thead><tr><th>#</th><th>动作</th><th>状态</th><th>创建时间</th><th>耗时</th><th>错误</th></tr></thead><tbody>" +
    (jobs || '<tr><td colspan="6" class="empty">暂无发布记录</td></tr>') +
    "</tbody></table></div>",
    opts);
}

function usersPage(opts) {
  const rows = opts.users.map(function (u) {
    const rl = u.roles || "";
    const scoped = u.scope_domain ? ' <span class="muted">(限定 ' + esc(u.scope_domain) + ")</span>" : "";
    const action = u.is_root ? '<span class="muted">不可操作</span>' :
      '<form method="post" action="/users/' + u.id + '/toggle" style="display:inline">' +
      '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
      '<button class="btn btn--sm" type="submit">' + (u.status === "active" ? "停用" : "启用") + "</button></form>";
    return "<tr><td>" + esc(u.email) + (u.is_root ? ' <span class="pill pill--admin">root</span>' : "") + "</td>" +
      "<td>" + esc(u.name || "") + "</td>" +
      "<td>" + esc(rl) + scoped + "</td>" +
      '<td><span class="pill ' + (u.status === "active" ? "pill--published" : "pill--archived") + '">' + (u.status === "active" ? "启用" : "停用") + "</span></td>" +
      "<td>" + (esc(String(u.last_login_at || "").slice(0,19).replace("T"," ")) || "—") + "</td>" +
      "<td>" + action + "</td></tr>";
  }).join("");
  const invites = opts.invites.map(function (v) {
    const st = v.used_at ? "已使用" : (v.revoked_at ? "已撤销" : (new Date(v.expires_at) < new Date() ? "已过期" : "待使用"));
    return "<tr><td>" + esc(v.email) + "</td><td>" + esc(v.role) + "</td><td>" + st + "</td>" +
      "<td>" + esc(String(v.created_at || "").slice(0,19).replace("T"," ")) + "</td></tr>";
  }).join("");
  const domOpts = opts.taxonomy.domains.map(function (d) {
    return '<option value="' + esc(d.id) + '">' + esc(d.name) + "</option>";
  }).join("");
  return layout("账号",
    "<h1>账号与角色</h1>" +
    '<p class="muted">账号只能由管理员创建（无自助注册）。新建后生成一次性激活链接，被邀请人首次登录必须改密。</p>' +
    (opts.notice ? '<div class="alert alert--ok">' + esc(opts.notice) + "</div>" : "") +
    (opts.error ? '<div class="alert alert--err">' + esc(opts.error) + "</div>" : "") +
    (opts.inviteLink ? '<div class="alert alert--info"><strong>一次性激活链接（只显示这一次，请立即复制）：</strong><br><code style="word-break:break-all">' + esc(opts.inviteLink) + '</code><br><span class="muted">有效期 ' + opts.inviteHours + ' 小时；一次性；可由管理员撤销。</span></div>' : "") +
    '<div class="card"><h2 style="margin-top:0">创建账号（分发邀请）</h2><form method="post" action="/users/invite">' +
    '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
    '<div class="grid3"><div><label for="ie">邮箱</label><input id="ie" name="email" type="email" required></div>' +
    '<div><label for="ir">角色</label><select id="ir" name="role">' +
    '<option value="editor">editor（可建/改/提交审核）</option><option value="reviewer">reviewer（可审核/发布）</option>' +
    '<option value="admin">admin（管理员）</option><option value="viewer">viewer（只读）</option></select></div>' +
    '<div><label for="isd">限定领域（可选）</label><select id="isd" name="scope_domain"><option value="">不限制</option>' + domOpts + '</select></div></div>' +
    '<div style="margin-top:14px"><button class="btn btn--primary" type="submit">创建并生成激活链接</button></div></form></div>' +
    '<div class="card" style="padding:0;overflow:auto"><h2 style="margin:16px 16px 10px">现有账号</h2><table>' +
    "<thead><tr><th>邮箱</th><th>姓名</th><th>角色</th><th>状态</th><th>最近登录</th><th>操作</th></tr></thead><tbody>" +
    (rows || '<tr><td colspan="6" class="empty">暂无账号</td></tr>') +
    "</tbody></table></div>" +
    '<div class="card" style="padding:0;overflow:auto"><h2 style="margin:16px 16px 10px">邀请记录</h2><table>' +
    "<thead><tr><th>邮箱</th><th>角色</th><th>状态</th><th>创建</th></tr></thead><tbody>" +
    (invites || '<tr><td colspan="4" class="empty">暂无邀请</td></tr>') +
    "</tbody></table></div>",
    opts);
}

function auditPage(opts) {
  const rows = opts.logs.map(function (l) {
    return "<tr><td>" + esc(String(l.created_at || "").slice(0,19).replace("T"," ")) + "</td>" +
      "<td>" + esc(l.user_email || "—") + "</td>" +
      '<td><span class="kbd">' + esc(l.action) + "</span></td>" +
      "<td>" + esc(l.target || "") + "</td>" +
      "<td>" + esc(l.ip || "") + "</td>" +
      '<td class="muted">' + esc(l.detail ? JSON.stringify(l.detail).slice(0,160) : "") + "</td></tr>";
  }).join("");
  return layout("审计日志",
    "<h1>审计日志</h1>" +
    '<p class="muted">登录、增删改、发布、改权限等关键动作全部记录（append-only）。</p>' +
    '<div class="card" style="padding:0;overflow:auto"><table>' +
    "<thead><tr><th>时间</th><th>操作者</th><th>动作</th><th>对象</th><th>IP</th><th>详情</th></tr></thead><tbody>" +
    (rows || '<tr><td colspan="6" class="empty">暂无日志</td></tr>') +
    "</tbody></table></div>",
    opts);
}

function simplePage(title, msg, opts) {
  return layout(title, '<div class="card"><h1>' + esc(title) + "</h1><p>" + esc(msg) + '</p><a class="btn" href="/articles">返回文章列表</a></div>', opts);
}

module.exports = {
  layout: layout, loginPage: loginPage, changePasswordPage: changePasswordPage,
  articlesPage: articlesPage, editorPage: editorPage, publishPage: publishPage,
  usersPage: usersPage, auditPage: auditPage, simplePage: simplePage,
  statusLabel: statusLabel
};
