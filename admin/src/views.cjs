
/* admin/src/views.cjs — 服务端渲染模板（无模板引擎依赖）
   设计原则：产物是本项目自包含单文件风格 —— 内联 CSS，不引外部资源，
   因此 CSP 可以收得很紧（default-src 'self'）。 */
"use strict";
const h = require("./http.cjs");
const esc = h.esc;

const BASE_CSS = `
:root{
  /* ---- 语义色（借 Semi Design 的分层命名思路：用变量而非硬编码） ---- */
  --bg-0:#F7F8FA;      /* 页面底色 */
  --bg-1:#FFFFFF;      /* 卡片 */
  --bg-2:#F2F3F5;      /* 次级填充：表头、代码块 */
  --bg-3:#E8EAED;      /* hover 填充 */
  --border:#E5E7EB;
  --border-strong:#D1D5DB;

  --text-0:#111827;    /* 主文字  对比度 >15:1 */
  --text-1:#374151;    /* 次级                >10:1 */
  --text-2:#6B7280;    /* 辅助（仍达 AAA 于白底）>5.7:1 */
  --text-3:#9CA3AF;    /* 占位/禁用 */

  --brand:#4F46E5; --brand-hover:#4338CA; --brand-weak:#EEF2FF; --brand-border:#C7D2FE;
  --ok:#047857;      --ok-weak:#ECFDF5;   --ok-border:#A7F3D0;
  --warn:#B45309;    --warn-weak:#FFFBEB; --warn-border:#FDE68A;
  --danger:#B91C1C;  --danger-weak:#FEF2F2; --danger-border:#FECACA;
  --info:#1D4ED8;    --info-weak:#EFF6FF; --info-border:#BFDBFE;

  /* ---- 圆角分级（借 Semi：小控件 3 / 菜单 6 / 卡片 12） ---- */
  --r-sm:4px; --r-md:8px; --r-lg:12px; --r-full:999px;

  /* ---- 间距：8px 基数 ---- */
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px; --s6:32px;

  /* ---- 中文排版（AntD 14/22 为基准，正文行高放宽到 1.65） ---- */
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"PingFang SC","Microsoft YaHei",monospace;
  --fs-xs:12px; --fs-sm:13px; --fs-base:14px; --fs-md:16px; --fs-lg:20px; --fs-xl:26px;
  --lh:22px;

  --sidebar-w:232px;
  --shadow-1:0 1px 2px rgba(16,24,40,.04),0 1px 3px rgba(16,24,40,.06);
  --shadow-2:0 4px 12px rgba(16,24,40,.10),0 2px 4px rgba(16,24,40,.06);
  --focus:0 0 0 3px rgba(79,70,229,.28);
}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;font-family:var(--font);background:var(--bg-0);color:var(--text-0);
  font-size:var(--fs-base);line-height:1.65;-webkit-font-smoothing:antialiased}
/* 数字纵向对齐：统计、审计、表格里的数字必须等宽（AntD 明确推荐） */
.num,td.num,.stat__v,table td,table th{font-variant-numeric:tabular-nums}
a{color:var(--brand);text-decoration:none}
a:hover{text-decoration:underline}
h1{font-size:var(--fs-lg);line-height:1.4;margin:0 0 var(--s4);font-weight:600}
h2{font-size:var(--fs-md);margin:var(--s5) 0 var(--s3);font-weight:600}
h3{font-size:var(--fs-base);margin:var(--s4) 0 var(--s2);font-weight:600}
p{margin:0 0 var(--s3)}
hr{border:0;border-top:1px solid var(--border);margin:var(--s5) 0}

/* ================= 布局：侧栏 + 工作区 ================= */
.shell{display:grid;grid-template-columns:var(--sidebar-w) 1fr;min-height:100vh}
.sidebar{background:var(--bg-1);border-right:1px solid var(--border);display:flex;flex-direction:column;
  position:sticky;top:0;height:100vh;overflow-y:auto}
.sidebar__brand{display:flex;align-items:center;gap:var(--s2);padding:var(--s4) var(--s4) var(--s3);
  font-weight:600;font-size:var(--fs-base);color:var(--text-0);text-decoration:none}
.sidebar__brand:hover{text-decoration:none}
.sidebar__brand .mark{width:28px;height:28px;border-radius:var(--r-md);background:#91E6C1;color:#0B3B2E;
  display:grid;place-items:center;font-size:var(--fs-sm);font-weight:700;flex:none}
.sidebar__sec{padding:var(--s3) var(--s3) var(--s1);font-size:var(--fs-xs);font-weight:600;
  color:var(--text-3);letter-spacing:.04em}
.sidebar__nav{display:flex;flex-direction:column;gap:2px;padding:0 var(--s2)}
.navitem{display:flex;align-items:center;gap:var(--s3);padding:9px var(--s3);border-radius:var(--r-md);
  color:var(--text-1);text-decoration:none;font-size:var(--fs-base);min-height:38px}
.navitem:hover{background:var(--bg-2);text-decoration:none;color:var(--text-0)}
.navitem[aria-current="page"]{background:var(--brand-weak);color:var(--brand-hover);font-weight:600}
.navitem__ico{width:18px;text-align:center;flex:none;opacity:.9}
.navitem__badge{margin-left:auto;background:var(--bg-3);color:var(--text-1);border-radius:var(--r-full);
  padding:1px 7px;font-size:var(--fs-xs);font-weight:600}
.navitem[aria-current="page"] .navitem__badge{background:#fff;color:var(--brand-hover)}
.sidebar__foot{margin-top:auto;padding:var(--s3);border-top:1px solid var(--border)}
.me{display:flex;align-items:center;gap:var(--s2);font-size:var(--fs-sm);color:var(--text-2)}
.me__av{width:28px;height:28px;border-radius:var(--r-full);background:var(--brand-weak);color:var(--brand-hover);
  display:grid;place-items:center;font-weight:600;flex:none;font-size:var(--fs-xs)}

.work{display:flex;flex-direction:column;min-width:0}
.topbar{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.86);backdrop-filter:blur(8px);
  border-bottom:1px solid var(--border);padding:var(--s3) var(--s5);display:flex;align-items:center;gap:var(--s3)}
.crumbs{display:flex;align-items:center;gap:var(--s2);font-size:var(--fs-sm);color:var(--text-2);min-width:0}
.crumbs a{color:var(--text-2)}
.crumbs a:hover{color:var(--text-0)}
.crumbs__sep{color:var(--text-3)}
.crumbs__cur{color:var(--text-0);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.topbar__sp{flex:1}
main{padding:var(--s5);max-width:1600px;width:100%}

/* ================= 卡片与分区 ================= */
.card{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);
  padding:var(--s5);margin-bottom:var(--s4);box-shadow:var(--shadow-1)}
.card--flush{padding:0;overflow:hidden}
.card__hd{display:flex;align-items:center;gap:var(--s3);padding:var(--s4) var(--s5);
  border-bottom:1px solid var(--border);flex-wrap:wrap}
.card__hd h2,.card__hd h3{margin:0;font-size:var(--fs-base);font-weight:600}
.card__bd{padding:var(--s5)}
.card__ft{padding:var(--s3) var(--s5);border-top:1px solid var(--border);background:var(--bg-2);
  display:flex;align-items:center;gap:var(--s3)}

/* ================= 统计卡 ================= */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:var(--s4);margin-bottom:var(--s5)}
.stat{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);padding:var(--s4);
  box-shadow:var(--shadow-1);display:block;color:inherit;text-decoration:none;transition:border-color .15s}
.stat:hover{text-decoration:none;border-color:var(--brand-border);box-shadow:var(--shadow-2)}
.stat__k{font-size:var(--fs-sm);color:var(--text-2);display:flex;align-items:center;gap:6px}
.stat__v{font-size:var(--fs-xl);font-weight:600;line-height:1.25;margin-top:var(--s1)}
.stat__h{font-size:var(--fs-xs);color:var(--text-3);margin-top:2px}
.stat--warn .stat__v{color:var(--warn)} .stat--danger .stat__v{color:var(--danger)}
.stat--ok .stat__v{color:var(--ok)} .stat--info .stat__v{color:var(--info)}

/* ================= 表格 ================= */
.tablewrap{overflow-x:auto}
table{width:100%;border-collapse:separate;border-spacing:0;font-size:var(--fs-base)}
th,td{text-align:left;padding:10px var(--s4);border-bottom:1px solid var(--border);vertical-align:middle}
thead th{background:var(--bg-2);color:var(--text-2);font-weight:600;font-size:var(--fs-sm);
  position:sticky;top:0;white-space:nowrap;z-index:1}
thead th:first-child{border-top-left-radius:var(--r-md)}
thead th:last-child{border-top-right-radius:var(--r-md)}
tbody tr:hover td{background:var(--bg-2)}
tbody tr:last-child td{border-bottom:0}
td.tight{white-space:nowrap;width:1%}
.tname{font-weight:600;color:var(--text-0);display:block;margin-bottom:2px}
.slug{font-family:var(--mono);font-size:var(--fs-xs);color:var(--text-3)}
.sortlink{color:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:4px}
.sortlink:hover{color:var(--brand);text-decoration:none}

/* ================= 徽章 ================= */
.pill{display:inline-flex;align-items:center;gap:4px;padding:1px 9px;border-radius:var(--r-full);
  font-size:var(--fs-xs);font-weight:600;white-space:nowrap;border:1px solid transparent}
.pill--published{background:var(--ok-weak);color:var(--ok);border-color:var(--ok-border)}
.pill--draft{background:var(--warn-weak);color:var(--warn);border-color:var(--warn-border)}
.pill--in_review{background:var(--info-weak);color:var(--info);border-color:var(--info-border)}
.pill--changes_requested{background:var(--danger-weak);color:var(--danger);border-color:var(--danger-border)}
.pill--archived{background:var(--bg-3);color:var(--text-1);border-color:var(--border-strong)}
.pill--editor{background:var(--brand-weak);color:var(--brand-hover);border-color:var(--brand-border)}
.pill--admin{background:#FDF2F8;color:#9D174D;border-color:#FBCFE8}
.pill--reviewer{background:var(--warn-weak);color:var(--warn);border-color:var(--warn-border)}
.pill--viewer{background:var(--bg-3);color:var(--text-2)}
.pill--root{background:var(--brand);color:#fff;border-color:var(--brand)}

/* ================= 按钮 ================= */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 var(--s4);
  height:36px;border-radius:var(--r-md);border:1px solid var(--border-strong);background:var(--bg-1);
  color:var(--text-0);cursor:pointer;font:inherit;font-size:var(--fs-base);text-decoration:none;white-space:nowrap}
.btn:hover{background:var(--bg-2);text-decoration:none;border-color:var(--text-3)}
.btn:focus-visible{outline:none;box-shadow:var(--focus)}
.btn--primary{background:var(--brand);border-color:var(--brand);color:#fff}
.btn--primary:hover{background:var(--brand-hover);border-color:var(--brand-hover)}
.btn--danger{background:var(--danger);border-color:var(--danger);color:#fff}
.btn--danger:hover{background:#991B1B;border-color:#991B1B}
.btn--ghost{background:transparent;border-color:transparent;color:var(--text-1)}
.btn--ghost:hover{background:var(--bg-2);color:var(--text-0)}
.btn--sm{height:28px;padding:0 10px;font-size:var(--fs-sm);border-radius:var(--r-sm)}
.btn--block{width:100%}
.btn[disabled],.btn[aria-disabled="true"]{opacity:.5;cursor:not-allowed}
.btn--loading{position:relative;color:transparent!important}
.btn--loading::after{content:"";position:absolute;width:14px;height:14px;border-radius:50%;
  border:2px solid currentColor;border-top-color:transparent;animation:spin .7s linear infinite;color:#fff}
@keyframes spin{to{transform:rotate(360deg)}}

/* ================= 表单 ================= */
label{display:block;font-size:var(--fs-sm);font-weight:600;margin:0 0 6px;color:var(--text-1)}
label .req{color:var(--danger);margin-left:2px}
label .opt{color:var(--text-3);font-weight:400;margin-left:4px}
input[type=text],input[type=password],input[type=email],input[type=date],input[type=search],select,textarea{
  width:100%;padding:7px 11px;border:1px solid var(--border-strong);border-radius:var(--r-md);
  font:inherit;font-size:var(--fs-base);background:var(--bg-1);color:var(--text-0);min-height:36px}
input:hover,select:hover,textarea:hover{border-color:var(--text-3)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--brand);box-shadow:var(--focus)}
input[readonly]{background:var(--bg-2);color:var(--text-2)}
input[type=checkbox],input[type=radio]{width:16px;height:16px;min-height:0;accent-color:var(--brand);vertical-align:-2px}
textarea{font-family:var(--mono);font-size:var(--fs-sm);line-height:1.75;min-height:480px;resize:vertical}
.field{margin-bottom:var(--s4)}
.field__help{font-size:var(--fs-xs);color:var(--text-2);margin-top:5px;line-height:1.6}
.field__err{font-size:var(--fs-xs);color:var(--danger);margin-top:5px;font-weight:600}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:var(--s4)}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s4)}
@media(max-width:900px){.grid2,.grid3{grid-template-columns:1fr}}

/* 折叠分组：用原生 details，零 JS，键盘与读屏可用 */
details.grp{border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:var(--s4);background:var(--bg-1)}
details.grp>summary{cursor:pointer;padding:var(--s3) var(--s5);font-weight:600;font-size:var(--fs-base);
  list-style:none;display:flex;align-items:center;gap:var(--s2);border-radius:var(--r-lg)}
details.grp>summary::-webkit-details-marker{display:none}
details.grp>summary::before{content:"▸";color:var(--text-3);transition:transform .15s;display:inline-block}
details.grp[open]>summary::before{transform:rotate(90deg)}
details.grp>summary:hover{background:var(--bg-2)}
details.grp[open]>summary{border-bottom:1px solid var(--border);border-radius:var(--r-lg) var(--r-lg) 0 0}
details.grp .grp__bd{padding:var(--s5)}
.grp__hint{font-weight:400;color:var(--text-3);font-size:var(--fs-xs);margin-left:auto}

/* ================= 提示 / 反馈 ================= */
.alert{padding:10px var(--s4);border-radius:var(--r-md);margin:0 0 var(--s4);font-size:var(--fs-base);
  border:1px solid transparent;display:flex;gap:var(--s2);align-items:flex-start;line-height:1.6}
.alert--err{background:var(--danger-weak);border-color:var(--danger-border);color:var(--danger)}
.alert--ok{background:var(--ok-weak);border-color:var(--ok-border);color:var(--ok)}
.alert--info{background:var(--info-weak);border-color:var(--info-border);color:var(--info)}
.alert--warn{background:var(--warn-weak);border-color:var(--warn-border);color:var(--warn)}
.empty{padding:var(--s6) var(--s5);text-align:center;color:var(--text-2)}
.empty__ico{font-size:32px;opacity:.5;margin-bottom:var(--s3)}
.empty__t{font-weight:600;color:var(--text-1);margin-bottom:var(--s1)}
.muted{color:var(--text-2);font-size:var(--fs-sm)}
.kbd{font-family:var(--mono);background:var(--bg-2);border:1px solid var(--border-strong);
  border-radius:var(--r-sm);padding:1px 6px;font-size:var(--fs-xs)}
.row{display:flex;gap:var(--s3);flex-wrap:wrap;align-items:center}
.row--end{justify-content:flex-end}
.spread{display:flex;align-items:center;justify-content:space-between;gap:var(--s3);flex-wrap:wrap}

/* toast（原生 popover，不阻塞交互；配 aria-live 供读屏播报） */
[popover].toast{border:0;padding:0;background:transparent;margin:var(--s5) auto auto}
.toast__box{background:var(--text-0);color:#fff;padding:10px var(--s4);border-radius:var(--r-md);
  box-shadow:var(--shadow-2);font-size:var(--fs-base);max-width:420px}

/* 文章标题链接 */
.link-strong{font-weight:600;color:var(--text-0)}
.link-strong:hover{color:var(--brand)}

/* 编辑器双栏 */
.editor-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:var(--s4);align-items:start}
@media(max-width:1100px){.editor-grid{grid-template-columns:1fr}}
.editor-side{position:sticky;top:76px}
.toc{list-style:none;margin:0;padding:0;font-size:var(--fs-sm)}
.toc li{margin:2px 0}
.toc a{color:var(--text-1);display:block;padding:3px 0;border-left:2px solid transparent;padding-left:var(--s2)}
.toc a:hover{color:var(--brand);text-decoration:none;border-left-color:var(--brand)}
.meter{display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--text-2)}

/* 检查清单 */
.check{list-style:none;margin:0;padding:0}
.check li{display:flex;gap:var(--s2);padding:7px 0;border-bottom:1px dashed var(--border);font-size:var(--fs-sm);align-items:flex-start}
.check li:last-child{border-bottom:0}
.check__ic{flex:none;width:16px;text-align:center}
.check--ok .check__ic{color:var(--ok)}
.check--bad .check__ic{color:var(--danger)}
.check--warn .check__ic{color:var(--warn)}
.check a{color:var(--text-1)}

/* 分页 */
.pager{display:flex;align-items:center;gap:var(--s2);flex-wrap:wrap}
.pager__btn{min-width:32px;height:32px;padding:0 9px;display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--border-strong);border-radius:var(--r-md);background:var(--bg-1);color:var(--text-1);
  font-size:var(--fs-sm);text-decoration:none}
.pager__btn:hover{background:var(--bg-2);text-decoration:none}
.pager__btn[aria-current="page"]{background:var(--brand);border-color:var(--brand);color:#fff;font-weight:600}

/* 登录页 */
.login-wrap{max-width:392px;margin:10vh auto;padding:0 var(--s4)}
.login-wrap .card{padding:var(--s6)}
.login-foot{text-align:center;color:var(--text-2);font-size:var(--fs-xs);margin-top:var(--s4);line-height:1.7}

/* 移动端：侧栏转顶栏滚动条 */
.sidebar__toggle{display:none}
@media(max-width:820px){
  .shell{grid-template-columns:1fr}
  .sidebar{position:static;height:auto;flex-direction:row;align-items:center;overflow-x:auto;
    border-right:0;border-bottom:1px solid var(--border);padding:0 var(--s2)}
  .sidebar__brand{padding:var(--s3) var(--s2);flex:none}
  .sidebar__sec{display:none}
  .sidebar__nav{flex-direction:row;padding:0;gap:var(--s1)}
  .navitem{white-space:nowrap;min-height:40px}
  .navitem__badge{display:none}
  .sidebar__foot{display:none}
  .topbar{padding:var(--s2) var(--s4)}
  main{padding:var(--s4)}
  .editor-side{position:static}
}
`;

function layout(title, bodyHtml, opts) {
  opts = opts || {};
  const user = opts.user;
  const roles = opts.roles || [];
  const isAdmin = user && (user.is_root || roles.some(function(r){return r.role==="admin";}));
  const isReviewer = user && (user.is_root || roles.some(function(r){return r.role==="admin"||r.role==="reviewer";}));
  const cur = opts.current || "";

  // ---- 侧栏导航（借 AntD「左右布局」：固定导航 + 自适应工作区）----
  function navItem(href, ico, label, key, badge) {
    return '<a class="navitem" href="' + href + '"' + (cur === key ? ' aria-current="page"' : '') + '>' +
      '<span class="navitem__ico" aria-hidden="true">' + ico + '</span>' +
      '<span>' + esc(label) + '</span>' +
      (badge ? '<span class="navitem__badge">' + badge + '</span>' : '') +
      '</a>';
  }
  let nav = "";
  if (user) {
    nav = '<div class="sidebar__sec">内容</div><nav class="sidebar__nav">' +
      navItem("/dashboard", "◧", "工作台", "dashboard") +
      navItem("/articles", "☰", "文章", "articles", opts.counts && opts.counts.articles) +
      navItem("/articles/new", "＋", "新建文章", "new") +
      '</nav>' +
      (isReviewer ? '<div class="sidebar__sec">协作</div><nav class="sidebar__nav">' +
        navItem("/audit", "◷", "审计日志", "audit") +
        navItem("/publish", "⇪", "发布", "publish") + '</nav>' :
        '<div class="sidebar__sec">协作</div><nav class="sidebar__nav">' +
        navItem("/publish", "⇪", "发布", "publish") + '</nav>') +
      (isAdmin ? '<div class="sidebar__sec">管理</div><nav class="sidebar__nav">' +
        navItem("/users", "☺", "账号", "users") + '</nav>' : "");
  }

  let sidebar = "";
  if (user) {
    const initial = (user.name || user.email || "?").slice(0,1).toUpperCase();
    const rolePill = user.is_root ? '<span class="pill pill--root">root</span>'
      : roles.map(function(r){return '<span class="pill pill--'+esc(r.role)+'">'+esc(r.role)+'</span>';}).join(' ');
    sidebar = '<aside class="sidebar">' +
      '<a class="sidebar__brand" href="/dashboard"><span class="mark" aria-hidden="true">修</span>内容后台</a>' +
      nav +
      '<div class="sidebar__foot">' +
        '<div class="me"><span class="me__av" aria-hidden="true">' + esc(initial) + '</span>' +
          '<span style="min-width:0;overflow:hidden;text-overflow:ellipsis"><strong style="display:block;color:var(--text-0)">' + esc(user.name || user.email) + '</strong>' + rolePill + '</span>' +
        '</div>' +
        '<div class="row" style="margin-top:10px;gap:6px">' +
          '<a class="btn btn--sm btn--ghost" href="/change-password">修改密码</a>' +
          '<form method="post" action="/logout" style="display:inline">' +
            '<input type="hidden" name="_csrf" value="' + esc(opts.csrf||"") + '">' +
            '<button class="btn btn--sm btn--ghost" type="submit">退出</button>' +
          '</form>' +
        '</div>' +
      '</div></aside>';
  }

  // ---- 面包屑 ----
  // opts.crumbs: [{label, href}]，最后一项视为当前页
  let crumbs = "";
  const cs = opts.crumbs || [];
  if (cs.length) {
    crumbs = '<nav class="crumbs" aria-label="面包屑">' + cs.map(function(c, i) {
      const last = i === cs.length - 1;
      return (i > 0 ? '<span class="crumbs__sep" aria-hidden="true">/</span>' : '') +
        (last || !c.href ? '<span class="crumbs__cur">' + esc(c.label) + '</span>'
                        : '<a href="' + esc(c.href) + '">' + esc(c.label) + '</a>');
    }).join("") + '</nav>';
  }

  const topbar = (user && cs.length)
    ? '<div class="topbar">' + crumbs + '<span class="topbar__sp"></span>' + (opts.actions || "") + '</div>'
    : (user && opts.actions ? '<div class="topbar"><span class="topbar__sp"></span>' + opts.actions + '</div>' : "");

  const inner = opts.nav === false
    ? bodyHtml
    : '<div class="shell">' + sidebar + '<div class="work">' + topbar + '<main>' + bodyHtml + '</main></div></div>';

  // 无障碍：toast 与提示用 aria-live 播报（Popover API 不会自动向读屏宣告）
  return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<meta name="robots" content="noindex,nofollow">\n' +
    '<title>' + esc(title) + ' · 修盒子内容后台</title>\n' +
    '<style>' + BASE_CSS + '</style>\n</head>\n<body>\n' +
    '<div id="live" aria-live="polite" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"></div>' +
    inner +
    '\n<script src="/static/app.js" defer></script>\n</body>\n</html>';
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
  const f = opts.filters || {};
  const items = opts.items || [];
  const canCreate = opts.canCreate;

  // 保留当前筛选条件、只覆盖指定字段 —— 用于分页/排序链接
  function qs(over) {
    const base = {
      status: f.status || "", domain: f.domain || "", risk: f.risk || "",
      q: f.q || "", stale: f.stale ? "1" : "", missing: f.missing || "",
      sort: f.sort || "-updated", page: ""
    };
    Object.keys(over || {}).forEach(function (k) { base[k] = over[k]; });
    const parts = [];
    Object.keys(base).forEach(function (k) {
      if (base[k] === "" || base[k] === undefined || base[k] === null) return;
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(base[k]));
    });
    return parts.length ? "?" + parts.join("&") : "";
  }

  // 表头排序链接（服务端排序，不用 JS）
  function th(key, label) {
    const curKey = (f.sort || "-updated").replace(/^-/, "");
    const isCur = curKey === key;
    const descNow = (f.sort || "-updated").charAt(0) === "-";
    const next = (isCur && !descNow) ? "-" + key : key;
    const arrow = isCur ? (descNow ? " ↓" : " ↑") : "";
    return "<th><a class=\"sortlink\" href=\"" + qs({ sort: next, page: "" }) + "\">" + esc(label) + arrow + "</a></th>";
  }

  const rows = items.map(function (a) {
    return "<tr>" +
      "<td><a class=\"link-strong\" href=\"/articles/" + esc(a.slug) + "\">" + esc(a.title || a.slug) + "</a>" +
        "<div class=\"slug\">" + esc(a.slug) + "</div>" +
        ((a.sourcesCount || 0) < 1 ? '<span class="pill pill--changes_requested" title="缺少参考资料">缺来源</span>' : "") +
      "</td>" +
      "<td><span class=\"pill pill--" + esc(a.status) + "\">" + esc(statusLabel(a.status)) + "</span></td>" +
      "<td>" + esc(a.domainName || a.domain || "") + '<div class=\"muted\">' + esc(a.category || "") + "</div></td>" +
      "<td>" + esc(a.risk || "") + '<div class=\"muted\">' + esc(a.difficulty || "") + "</div></td>" +
      "<td class=\"num\">" + (a.sourcesCount || 0) + "</td>" +
      "<td class=\"muted num\">" + esc(a.updated || "") + "</td>" +
      "<td class=\"tight\"><a class=\"btn btn--sm\" href=\"/articles/" + esc(a.slug) + "\">编辑</a></td>" +
      "</tr>";
  }).join("");

  // 空状态必须区分成因（Carbon 的空状态指南）：筛选后为空 vs 首次为空
  const hasFilter = !!(f.status || f.domain || f.risk || f.q || f.stale || f.missing);
  const emptyRow = hasFilter
    ? '<tr><td colspan="7" class="empty"><div class="empty__ico">⌕</div>' +
      '<div class="empty__t">没有符合条件的文章</div>' +
      '<div>试试放宽筛选条件</div>' +
      '<div style="margin-top:12px"><a class="btn" href="/articles">清除全部筛选</a></div></td></tr>'
    : '<tr><td colspan="7" class="empty"><div class="empty__ico">□</div>' +
      '<div class="empty__t">还没有文章</div>' +
      (canCreate ? '<div style="margin-top:12px"><a class="btn btn--primary" href="/articles/new">新建第一篇</a></div>' : "") +
      "</td></tr>";

  // 分页条
  let pager = "";
  if ((opts.pages || 1) > 1) {
    const cur = opts.page || 1, totalPages = opts.pages || 1;
    const nums = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - cur) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== "…") nums.push("…");
    }
    pager = '<div class="pager">' +
      (cur > 1 ? '<a class="pager__btn" href="' + qs({ page: cur - 1 }) + '">上一页</a>' : '<span class="pager__btn" aria-disabled="true">上一页</span>') +
      nums.map(function (n) {
        return n === "…" ? '<span class="pager__btn" aria-disabled="true">…</span>'
          : '<a class="pager__btn" href="' + qs({ page: n }) + '"' + (n === cur ? ' aria-current="page"' : "") + ">" + n + "</a>";
      }).join("") +
      (cur < totalPages ? '<a class="pager__btn" href="' + qs({ page: cur + 1 }) + '">下一页</a>' : '<span class="pager__btn" aria-disabled="true">下一页</span>') +
      '<span class="muted" style="margin-left:8px">共 ' + (opts.filtered || 0) + ' 篇</span>' +
      "</div>";
  }

  // 筛选栏（GET 表单 -> 状态进 URL）
  const domainOpts = '<option value="">全部领域</option>' + (opts.domains || []).map(function (d) {
    return '<option value="' + esc(d.id) + '"' + (f.domain === d.id ? " selected" : "") + ">" + esc(d.name) + "</option>";
  }).join("");
  const riskOpts = '<option value="">全部风险</option>' + (opts.risks || []).map(function (r) {
    return '<option value="' + esc(r) + '"' + (f.risk === r ? " selected" : "") + ">" + esc(r) + "</option>";
  }).join("");
  const statusOpts = [["", "全部状态"], ["published", "已发布"], ["draft", "草稿"], ["in_review", "审核中"], ["changes_requested", "退回修改"], ["archived", "归档"]]
    .map(function (p) { return '<option value="' + p[0] + '"' + (f.status === p[0] ? " selected" : "") + ">" + p[1] + "</option>"; }).join("");

  return layout("文章",
    '<div class="spread" style="margin-bottom:16px">' +
      "<div><h1 style=\"margin:0\">文章" +
        (opts.filtered !== opts.total ? "<span class=\"muted\" style=\"font-weight:400;font-size:14px\"> 筛选出 " + opts.filtered + " / 共 " + opts.total + "</span>" : "<span class=\"muted\" style=\"font-weight:400;font-size:14px\"> 共 " + (opts.total || 0) + " 篇</span>") +
      "</h1></div>" +
      (canCreate ? '<a class="btn btn--primary" href="/articles/new">＋ 新建文章</a>' : "") +
    "</div>" +
    (opts.notice ? '<div class="alert alert--ok">' + esc(opts.notice) + "</div>" : "") +

    '<form class="card" method="get" action="/articles" style="padding:14px 20px">' +
      '<div class="row" style="gap:12px;align-items:flex-end">' +
        '<div style="flex:2;min-width:180px"><label for="q">搜索</label>' +
          '<input id="q" name="q" type="search" value="' + esc(f.q || "") + '" placeholder="标题或 slug"></div>' +
        '<div style="flex:1;min-width:130px"><label for="status">状态</label><select id="status" name="status">' + statusOpts + "</select></div>" +
        '<div style="flex:1;min-width:130px"><label for="domain">领域</label><select id="domain" name="domain">' + domainOpts + "</select></div>" +
        '<div style="flex:1;min-width:110px"><label for="risk">风险</label><select id="risk" name="risk">' + riskOpts + "</select></div>" +
        '<input type="hidden" name="sort" value="' + esc(f.sort || "-updated") + '">' +
        '<button class="btn" type="submit">筛选</button>' +
        (hasFilter ? '<a class="btn btn--ghost" href="/articles">清除</a>' : "") +
      "</div>" +
      '<div class="row" style="margin-top:10px;gap:8px">' +
        '<a class="btn btn--sm' + (f.stale ? " btn--primary" : "") + '" href="' + qs({ stale: f.stale ? "" : "1", page: "" }) + '">超 180 天未复核</a>' +
        '<a class="btn btn--sm' + (f.missing === "sources" ? " btn--primary" : "") + '" href="' + qs({ missing: f.missing === "sources" ? "" : "sources", page: "" }) + '">缺参考资料</a>' +
      "</div>" +
    "</form>" +

    '<div class="card card--flush">' +
      '<div class="tablewrap"><table><thead><tr>' +
        "<th>标题</th>" + th("status", "状态") + th("domain", "领域 / 分类") + th("risk", "风险 / 难度") +
        th("sourcesCount", "来源") + th("updated", "更新") + "<th></th>" +
      "</tr></thead><tbody>" + (rows || emptyRow) + "</tbody></table></div>" +
      (pager ? '<div class="card__ft">' + pager + "</div>" : "") +
    "</div>",
    Object.assign({ current: "articles", crumbs: [{ label: "文章" }] }, opts));
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
  const typeOptionsHtml = typeOptsFor(null);
  // ---- 字段分组（借 AntD/Arco 的「渐进式披露」：19 个字段不平铺）----
  // 前两组默认展开（高频必填），后两组默认折叠（低频/维护性字段）。
  // 用原生 <details>，零 JS，键盘与读屏天然可用。
  const F = {
    title: m.title || "", slug: opts.slug || m.slug || "",
    domain: m.domain || "", category: m.category || "",
    difficulty: m.difficulty || "", risk: m.risk || "", time: m.time || "",
    os: arrVal("os"), symptoms: arrVal("symptoms"), keywords: arrVal("keywords"),
    aliases: arrVal("aliases"), related: arrVal("related"),
    prerequisites: arrVal("prerequisites"), tools: arrVal("tools"),
    reviewer: m.reviewer || "", reviewed_at: m.reviewed_at || "",
    version: m.version || "1.0", updated: m.updated || "", status: m.status || "draft"
  };

  function inp(id, name, val, attrs) {
    return '<input id="' + id + '" name="' + name + '" type="text" value="' + esc(val) + '" ' + (attrs || "") + ">";
  }
  function field(label, forId, control, help, required) {
    return '<div class="field" id="f-' + forId + '">' +
      '<label for="' + forId + '">' + esc(label) + (required ? '<span class="req">*</span>' : '') + '</label>' +
      control +
      (help ? '<div class="field__help">' + help + '</div>' : "") +
      "</div>";
  }

  // ---- 发布前检查清单（研究结论：把 19 字段的复杂度从「写作时」挪到「发布前」）----
  function checklist() {
    const chk = [];
    const add = function (ok, label, target, level) { chk.push({ ok: ok, label: label, target: target, level: level || (ok ? "ok" : "bad") }); };
    add(!!F.title, "填写标题", "title");
    add(!!F.slug, "填写 slug", "slug");
    add(!!F.domain && !!F.category, "选择领域与分类", "domain");
    // 服务端传入的是 taxonomy.json 的解析结果，enums 在顶层（不是 tax.raw.enums）
    const riskEnum = (tax.enums && tax.enums.risk) || [];
    add(riskEnum.indexOf(F.risk) >= 0, "选择风险等级", "risk");
    const sym = F.symptoms ? F.symptoms.split(",").filter(function (x) { return x.trim(); }).length : 0;
    add(sym >= 3, "症状词 ≥ 3（当前 " + sym + "）", "symptoms", sym >= 3 ? "ok" : "warn");
    const kw = F.keywords ? F.keywords.split(",").filter(function (x) { return x.trim(); }).length : 0;
    add(kw >= 5, "关键词 ≥ 5（当前 " + kw + "）", "keywords", kw >= 5 ? "ok" : "warn");
    const al = F.aliases ? F.aliases.split(",").filter(function (x) { return x.trim(); }).length : 0;
    add(al >= 2, "别名 ≥ 2（当前 " + al + "）", "aliases", al >= 2 ? "ok" : "warn");
    const rel = F.related ? F.related.split(",").filter(function (x) { return x.trim(); }).length : 0;
    add(rel >= 2, "相关教程 ≥ 2（当前 " + rel + "）", "related", rel >= 2 ? "ok" : "warn");
    add(sources.length >= 1, "至少 1 条参考资料（当前 " + sources.length + "）", "src-list", sources.length >= 1 ? "ok" : "bad");
    // 正文 10 段（带同义标题白名单）
    const need = ["一句话结论", "30 秒快速排查", "适用 / 不适用", "开始前确认", "分步骤", "怎么确认修好了", "还是不行？", "预防", "相关教程", "更新日志"];
    const alts = { "怎么确认修好了": ["怎么确认修好了", "怎么确认处理好了"] };
    const bt = String(opts.body || "");
    const miss = need.filter(function (n) {
      const list = alts[n] || [n];
      return !list.some(function (x) { return bt.indexOf("## " + x) >= 0; });
    });
    add(miss.length === 0, miss.length ? "正文缺 " + miss.length + " 个段落：" + miss.join("、") : "正文 10 段齐全", "body", miss.length ? "bad" : "ok");
    const bad = chk.filter(function (c) { return c.level === "bad"; }).length;
    const warn = chk.filter(function (c) { return c.level === "warn"; }).length;
    const head = bad
      ? '<div class="alert alert--err" style="margin-bottom:12px">有 ' + bad + " 项必须修复，否则构建会失败</div>"
      : (warn ? '<div class="alert alert--warn" style="margin-bottom:12px">有 ' + warn + " 项建议完善（不阻塞发布）</div>"
              : '<div class="alert alert--ok" style="margin-bottom:12px">全部检查通过</div>');
    return head + '<ul class="check">' + chk.map(function (c) {
      const ico = c.level === "ok" ? "✓" : (c.level === "warn" ? "!" : "✗");
      return '<li class="check--' + c.level + '"><span class="check__ic">' + ico + "</span>" +
        '<a href="#f-' + c.target + '" data-jump="' + c.target + '">' + esc(c.label) + "</a></li>";
    }).join("") + "</ul>";
  }

  // ---- 正文段落导航（从 textarea 现算，前端渲染进侧栏）----
  const tocHost = '<ul class="toc" id="toc"><li class="muted">加载中…</li></ul>';

  const body = '<form method="post" action="' + (isNew ? "/articles/new" : "/articles/" + esc(opts.slug)) + '" id="editor" data-dirty-guard>' +
    '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
    '<input type="hidden" name="baseHash" value="' + esc(opts.contentHash || "") + '">' +
    '<div class="spread" style="margin-bottom:16px">' +
      '<div><h1 style="margin:0">' + (isNew ? "新建文章" : esc(m.title || opts.slug)) + "</h1>" +
        (opts.contentHash ? '<div class="muted">版本 <span class="kbd">' + esc(opts.contentHash.slice(0, 12)) + "</span> · 他人已修改时保存会提示冲突</div>" : "") +
      "</div>" +
      '<div class="row"><a class="btn" href="/articles">返回</a>' +
        '<button class="btn" type="submit" name="action" value="save">保存草稿</button>' + buttons + "</div>" +
    "</div>" +

    '<div class="editor-grid">' +
      // ============ 左：字段 + 正文 ============
      '<div>' +

      // 组 1：核心（默认展开）
      '<details class="grp" open><summary>核心信息（必填）<span class="grp__hint">标题 / slug / 分类 / 风险</span></summary><div class="grp__bd">' +
        field("标题", "title", '<input id="title" name="title" type="text" value="' + esc(F.title) + '" required maxlength="60">', "用户在搜索结果里看到的就是这句，尽量含症状词。", true) +
        field("slug（URL 标识）", "slug", '<input id="slug" name="slug" type="text" value="' + esc(F.slug) + '" ' + (isNew ? "required" : "readonly") + ' pattern="[a-z0-9-]+">',
          isNew ? "仅小写字母、数字、连字符。<strong>发布后不应再改</strong>（URL 稳定性）。" : "已发布文章的 slug 不建议修改。", true) +
        '<div class="grid2">' +
          field("领域", "domain", '<select id="domain" name="domain" required><option value="">请选择</option>' + domOpts + '</select>', null, true) +
          field("分类", "category", '<select id="category" name="category" required><option value="">请选择</option>' + catOpts + '</select>', "分类需属于所选领域。", true) +
        '</div>' +
        '<div class="grid3">' +
          field("难度", "difficulty", '<select id="difficulty" name="difficulty">' + diffOpts + '</select>') +
          field("风险等级", "risk", '<select id="risk" name="risk" required>' + riskOpts + '</select>', null, true) +
          field("预计耗时", "time", inp("time", "time", F.time, 'placeholder="15-30 分钟"')) +
        '</div>' +
        field("适用系统", "os", inp("os", "os", F.os, 'placeholder="Windows 10, Windows 11"'), "逗号分隔。") +
      '</div></details>' +

      // 组 2：正文
      '<details class="grp" open><summary>正文（Markdown · 10 段结构）<span class="grp__hint">右侧为段落导航</span></summary><div class="grp__bd">' +
        '<p class="muted" style="margin-top:0">固定段落：一句话结论 / 30 秒快速排查 / 适用 / 不适用 / 开始前确认 / 分步骤 / 怎么确认修好了 / 还是不行？ / 预防 / 相关教程 / 更新日志</p>' +
        '<textarea id="body" name="body" spellcheck="false" data-toc-source>' + esc(opts.body || "") + '</textarea>' +
        '<div class="meter" style="margin-top:6px"><span id="wc">—</span><span>中文按字符计</span></div>' +
      '</div></details>' +

      // 组 3：检索（默认展开——知识库站点的核心）
      '<details class="grp" open><summary>检索与关联<span class="grp__hint">决定用户能不能搜到</span></summary><div class="grp__bd">' +
        field("症状词", "symptoms", inp("symptoms", "symptoms", F.symptoms), "用户会怎么描述这个问题？<strong>≥3 条</strong>，逗号分隔。", true) +
        field("关键词", "keywords", inp("keywords", "keywords", F.keywords), "<strong>≥5 条</strong>，含口语词与常见错别字。", true) +
        field("别名 / 口语说法", "aliases", inp("aliases", "aliases", F.aliases), "<strong>≥2 条</strong>，影响口语召回。", true) +
        field("相关教程 slug", "related", inp("related", "related", F.related), "<strong>≥2 条</strong>，逗号分隔；指向尚未撰写的文章会降级为搜索链接。", true) +
      '</div></details>' +

      // 组 4：参考资料
      '<details class="grp" open><summary>参考资料（sources）<span class="grp__hint">当前 ' + sources.length + ' 条</span></summary><div class="grp__bd">' +
        '<p class="muted" style="margin-top:0">每条含标题与 URL（均必填），类型可选。<strong>保存时不会丢失</strong>；若条数减少，系统会拦下并回滚。</p>' +
        '<div id="src-list">' + sourceRows + '</div>' +
        '<button class="btn btn--sm" type="button" id="src-add">＋ 添加一条</button>' +
      '</div></details>' +

      // 组 5：维护信息（默认折叠）
      '<details class="grp"><summary>维护与复核<span class="grp__hint">复核周期 / 版本</span></summary><div class="grp__bd">' +
        '<div class="grid2">' +
          field("复核人", "reviewer", inp("reviewer", "reviewer", F.reviewer)) +
          field("复核日期", "reviewed_at", '<input id="reviewed_at" name="reviewed_at" type="date" value="' + esc(F.reviewed_at) + '">', "超过 12 个月会提示复核。") +
        '</div>' +
        '<div class="grid3">' +
          field("版本", "version", inp("version", "version", F.version)) +
          field("更新日期", "updated", '<input id="updated" name="updated" type="date" value="' + esc(F.updated) + '">') +
          field("状态", "status", '<select id="status" name="status">' +
            ["draft", "in_review", "changes_requested", "published", "archived"].map(function (s) {
              return '<option value="' + s + '"' + (F.status === s ? " selected" : "") + ">" + esc(statusLabel(s)) + "</option>";
            }).join("") + "</select>") +
        '</div>' +
      '</div></details>' +

      // 组 6：前置条件与工具（默认折叠）
      '<details class="grp"><summary>前置条件与工具<span class="grp__hint">低频字段</span></summary><div class="grp__bd">' +
        field("前置条件", "prerequisites", inp("prerequisites", "prerequisites", F.prerequisites), "逗号分隔，会渲染进「开始前确认」区块。") +
        field("所需工具", "tools", inp("tools", "tools", F.tools), "逗号分隔。") +
      '</div></details>' +

      '<div class="row row--end" style="margin-bottom:24px">' +
        '<button class="btn" type="submit" name="action" value="save">保存草稿</button>' + buttons +
      "</div>" +
      '</div>' +

      // ============ 右：检查清单 + 段落导航 ============
      '<div class="editor-side">' +
        '<div class="card" style="padding:16px"><h3 style="margin-top:0">发布前检查</h3>' + checklist() + '</div>' +
        '<div class="card" style="padding:16px"><h3 style="margin-top:0">段落导航</h3>' + tocHost + '</div>' +
      "</div>" +
    "</div>" +
    "</form>" +
    '<template id="src-type-options">' + typeOptionsHtml + "</template>";

  return layout((isNew ? "新建文章" : "编辑：" + (m.title || opts.slug)), err + ok + body,
    Object.assign({
      current: "articles",
      crumbs: isNew ? [{ label: "文章", href: "/articles" }, { label: "新建" }]
                     : [{ label: "文章", href: "/articles" }, { label: m.title || opts.slug }]
    }, opts));
}
function dashboardPage(opts) {
  const s = opts.stats || {};
  function stat(key, label, hint, kind, href) {
    const v = s[key] === undefined ? 0 : s[key];
    const cls = (v > 0 && kind) ? (" stat--" + kind) : "";
    const tag = href ? "a" : "div";
    return "<" + tag + " class=\"stat" + cls + "\"" + (href ? " href=\"" + href + "\"" : "") + ">" +
      "<div class=\"stat__k\">" + esc(label) + "</div>" +
      "<div class=\"stat__v\">" + v + "</div>" +
      (hint ? "<div class=\"stat__h\">" + esc(hint) + "</div>" : "") +
      "</" + tag + ">";
  }

  const recentRows = (opts.recent || []).map(function (a) {
    return "<tr><td><a class=\"link-strong\" href=\"/articles/" + esc(a.slug) + "\">" + esc(a.title || a.slug) + "</a>" +
      "<div class=\"slug\">" + esc(a.slug) + "</div></td>" +
      "<td><span class=\"pill pill--" + esc(a.status) + "\">" + esc(statusLabel(a.status)) + "</span></td>" +
      "<td class=\"muted\">" + esc(a.updated || "") + "</td>" +
      "<td class=\"muted\">" + esc(a.reviewer || "—") + "</td></tr>";
  }).join("");

  const staleRows = (opts.stale || []).slice(0, 6).map(function (a) {
    const days = (a.days === null || a.days === undefined) ? "—" : (a.days + " 天");
    return "<tr><td><a class=\"link-strong\" href=\"/articles/" + esc(a.slug) + "\">" + esc(a.title || a.slug) + "</a></td>" +
      "<td class=\"num\">" + esc(days) + "</td>" +
      "<td class=\"muted\">" + esc(a.reviewed_at || "从未复核") + "</td></tr>";
  }).join("");

  const emptyStale = '<tr><td colspan="3" class="empty"><div class="empty__ico">✓</div>' +
    '<div class="empty__t">全部在复核周期内</div><div>没有超过 180 天未复核的文章</div></td></tr>';

  return layout("工作台",
    "<h1>工作台</h1>" +
    "<p class=\"muted\" style=\"margin-top:-8px\">只放能触发动作的信息：待办、陈旧内容、结构缺失。装饰性统计一律不放。</p>" +
    "<div class=\"stats\">" +
      stat("inReview", "待我审核", "状态为「审核中」", "info", "/articles?status=in_review") +
      stat("drafts", "草稿", "尚未发布", "warn", "/articles?status=draft") +
      stat("changesRequested", "退回修改", "需要作者处理", "danger", "/articles?status=changes_requested") +
      stat("published", "已发布", "线上可访问", "ok", "/articles?status=published") +
      stat("stale", "超 180 天未复核", "知识库健康度", "warn", "/articles?stale=1") +
      stat("missingSources", "缺参考资料", "sources 少于 1 条", "danger", "/articles?missing=sources") +
    "</div>" +
    "<div class=\"grid2\" style=\"align-items:start\">" +
      "<div class=\"card card--flush\">" +
        "<div class=\"card__hd\"><h3>最近编辑</h3><span class=\"topbar__sp\"></span>" +
        "<a class=\"btn btn--sm\" href=\"/articles\">全部文章</a></div>" +
        '<div class="tablewrap"><table><thead><tr><th>标题</th><th>状态</th><th>更新</th><th>复核</th></tr></thead><tbody>' +
        (recentRows || '<tr><td colspan="4" class="empty">暂无内容</td></tr>') +
        "</tbody></table></div>" +
      "</div>" +
      "<div class=\"card card--flush\">" +
        "<div class=\"card__hd\"><h3>陈旧内容（建议复核）</h3></div>" +
        '<div class="tablewrap"><table><thead><tr><th>标题</th><th>距上次复核</th><th>上次复核</th></tr></thead><tbody>' +
        (staleRows || emptyStale) +
        "</tbody></table></div>" +
      "</div>" +
    "</div>",
    Object.assign({ current: "dashboard", crumbs: [{ label: "工作台" }] }, opts));
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
    '<div class="card card--flush"><div class="tablewrap"><table>' +
    "<thead><tr><th>#</th><th>动作</th><th>状态</th><th>创建时间</th><th>耗时</th><th>错误</th></tr></thead><tbody>" +
    (jobs || '<tr><td colspan="6" class="empty"><div class="empty__ico">⇪</div><div class="empty__t">还没有发布记录</div><div>点击上方「立即发布」会在此显示每一步的进度</div></td></tr>') +
    "</tbody></table></div></div>",
    Object.assign({ current: "publish", crumbs: [{ label: "发布" }] }, opts));
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
    Object.assign({ current: "users", crumbs: [{ label: "账号" }] }, opts));
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
    (rows || '<tr><td colspan="6" class="empty"><div class="empty__ico">◷</div><div class="empty__t">暂无审计记录</div><div>登录、发布等操作会记录在此</div></td></tr>') +
    "</tbody></table></div>",
    Object.assign({ current: "audit", crumbs: [{ label: "审计日志" }] }, opts));
}

function simplePage(title, msg, opts) {
  return layout(title, '<div class="card"><h1>' + esc(title) + "</h1><p>" + esc(msg) + '</p><a class="btn" href="/articles">返回文章列表</a></div>', opts);
}

module.exports = {
  layout: layout, loginPage: loginPage, changePasswordPage: changePasswordPage,
  articlesPage: articlesPage, editorPage: editorPage, publishPage: publishPage,
  usersPage: usersPage, auditPage: auditPage, simplePage: simplePage, dashboardPage: dashboardPage,
  statusLabel: statusLabel
};
