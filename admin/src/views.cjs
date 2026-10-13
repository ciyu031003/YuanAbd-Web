
/* admin/src/views.cjs — 服务端渲染模板（无模板引擎依赖）
   设计原则：产物是本项目自包含单文件风格 —— 内联 CSS，不引外部资源，
   因此 CSP 可以收得很紧（default-src 'self'）。 */
"use strict";
const h = require("./http.cjs");
const esc = h.esc;

/* 正文段落规则的兜底值。
   真实值由服务端从 content-lint.cjs 注入（opts.sections），
   以保证「后台校验」与「构建校验」永远同一套规则；
   这里的默认值只在极端情况下生效（例如单独渲染某个页面做测试）。 */
const REQUIRED_SECTIONS = ["一句话结论", "分步骤"];
const SUGGESTED_SECTIONS = ["适用 / 不适用", "开始前确认", "怎么确认修好了", "还是不行？", "预防", "相关教程", "更新日志"];
const SECTION_ALIASES = { "怎么确认修好了": ["怎么确认修好了", "怎么确认处理好了"] };

const BASE_CSS = `
/* ============================================================
   新拟物（Neumorphism / Soft UI）后台设计系统
   依据项目负责人提供的 7 张参考图逐字落地：
     · 底色暖米白，卡片与背景**同色**，只靠阴影成形（这是拟态的核心）
     · 凸起 = 左上亮 + 右下暗；凹陷 = inset 双向
     · 圆角分级：卡片 24 / 按键 16 / 旋钮与指示灯为正圆
     · 钴蓝 #2F4BD0 **只给**按下、开启、当前项、关键数据
     · 拟物感只给可交互元素；正文与表格保持平整（否则会糊）
     · 状态变化 120–300ms 弹簧回弹
   ============================================================ */
:root{
  /* ---- 底座 ---- */
  --base:#F2E8E0;              /* 暖米白底 */
  --base-2:#EDE2D8;            /* 略深一层（凹陷底） */
  --hi:#FFFFFF;                /* 亮阴影 */
  --lo:#D6C8BD;                /* 暗阴影 */

  /* ---- 凸起 / 凹陷 ---- */
  --raise:-6px -6px 14px var(--hi), 6px 6px 14px var(--lo);
  --raise-sm:-3px -3px 8px var(--hi), 3px 3px 8px var(--lo);
  --raise-lg:-10px -10px 24px var(--hi), 10px 10px 24px var(--lo);
  --inset:inset 4px 4px 10px var(--lo), inset -4px -4px 10px var(--hi);
  --inset-sm:inset 2px 2px 6px var(--lo), inset -2px -2px 6px var(--hi);
  --inset-deep:inset 6px 6px 14px var(--lo), inset -6px -6px 14px var(--hi);

  /* ---- 强调色：只用于「按下 / 开启 / 当前 / 关键数据」 ---- */
  --accent:#2F4BD0;
  --accent-soft:#5C74E0;
  --accent-deep:#243CA8;
  --warn:#E2552D;              /* 朱橙，少量 */
  --ok:#2E9E6B;
  --info:#2F4BD0;

  /* ---- 文字 ---- */
  --ink:#23201D;
  --ink-2:#6E655E;             /* 次文字不浅于此 */
  --ink-3:#9A9089;

  /* ---- 圆角 ---- */
  --r-card:24px; --r-btn:16px; --r-chip:14px; --r-full:999px;
  --s1:6px; --s2:10px; --s3:14px; --s4:20px; --s5:28px; --s6:40px;

  /* ---- 字体：无衬线 + 数字等宽 ---- */
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"PingFang SC",monospace;
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;font-family:var(--font);background:var(--base);color:var(--ink);
  font-size:14.5px;line-height:1.65;-webkit-font-smoothing:antialiased;
}
h1,h2,h3{margin:0;font-weight:700;letter-spacing:-.01em;color:var(--ink)}
h1{font-size:26px;line-height:1.3}
h2{font-size:17px}
h3{font-size:15px}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:none;color:var(--accent-deep)}
.num,td.num,.stat__v,.mono{font-variant-numeric:tabular-nums;font-family:var(--mono)}

/* ============ 布局 ============ */
.shell{display:grid;grid-template-columns:246px 1fr;min-height:100vh}
.sidebar{
  background:var(--base);padding:22px 16px;display:flex;flex-direction:column;
  position:sticky;top:0;height:100vh;overflow-y:auto;
}
.sidebar__brand{
  display:flex;align-items:center;gap:12px;padding:6px 10px 22px;color:var(--ink);
  font-weight:700;font-size:15.5px;letter-spacing:-.005em;
}
.sidebar__brand .mark{
  width:38px;height:38px;border-radius:12px;background:var(--base);
  box-shadow:var(--raise-sm);display:grid;place-items:center;
  font-size:15px;color:var(--accent);font-weight:700;flex:none;
}
.sidebar__sec{
  font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-3);padding:18px 12px 8px;
}
.sidebar__nav{display:flex;flex-direction:column;gap:10px}

/* ---- 导航项 = 实体键帽（参考图 01）---- */
.navitem{
  display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:var(--r-btn);
  background:var(--base);box-shadow:var(--raise-sm);color:var(--ink-2);
  font-size:14px;font-weight:500;text-decoration:none;
  transition:box-shadow .18s cubic-bezier(.34,1.56,.64,1), color .18s, transform .18s;
}
.navitem:hover{box-shadow:var(--raise);color:var(--ink);transform:translateY(-1px)}
.navitem:active{box-shadow:var(--inset-sm);transform:translateY(0)}
/* 当前项：保持「按下」并亮蓝色指示灯 */
.navitem[aria-current="page"]{
  box-shadow:var(--inset-sm);color:var(--accent);font-weight:700;
}
.navitem[aria-current="page"] .navitem__ico{color:var(--accent)}
.navitem__ico{
  width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;
  font-size:15px;color:var(--ink-3);flex:none;
}
.navitem__badge{
  margin-left:auto;font-size:11px;font-weight:700;padding:2px 8px;border-radius:var(--r-full);
  background:var(--base);box-shadow:var(--inset-sm);color:var(--ink-2);
}
.navitem[aria-current="page"] .navitem__badge{color:var(--accent)}
/* 点亮指示灯 */
.navitem[aria-current="page"]::after{
  content:"";width:6px;height:6px;border-radius:50%;background:var(--accent);
  box-shadow:0 0 6px var(--accent-soft);flex:none;margin-left:6px;
}

.sidebar__foot{margin-top:auto;padding-top:18px}
.me{display:flex;align-items:center;gap:11px;padding:12px;border-radius:var(--r-btn);
  background:var(--base);box-shadow:var(--raise-sm)}
.me__av{width:34px;height:34px;border-radius:50%;background:var(--base);
  box-shadow:var(--inset-sm);display:grid;place-items:center;font-weight:700;
  color:var(--accent);font-size:13px;flex:none}

/* ---- 工作区 ---- */
.work{display:flex;flex-direction:column;min-width:0}
.topbar{
  position:sticky;top:0;z-index:20;padding:18px 30px;background:var(--base);
  display:flex;align-items:center;gap:14px;
}
.crumbs{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--ink-2)}
.crumbs a{color:var(--ink-2)} .crumbs a:hover{color:var(--accent)}
.crumbs__sep{color:var(--ink-3)}
.crumbs__cur{color:var(--ink);font-weight:700}
.topbar__sp{flex:1}
main{padding:0 30px 60px;max-width:1560px;width:100%}

/* ============ 卡片：与底色同色，靠阴影成形 ============ */
.card{
  background:var(--base);border:0;border-radius:var(--r-card);padding:24px;
  box-shadow:var(--raise);margin-bottom:22px;
}
.card--flush{padding:0;overflow:hidden}
.card__hd{
  display:flex;align-items:center;gap:12px;padding:20px 24px 14px;flex-wrap:wrap;
}
.card__hd h3{font-size:15px}
.card__bd{padding:0 24px 24px}
.card__ft{padding:16px 24px;box-shadow:inset 0 1px 0 rgba(214,200,189,.5)}

/* ============ 统计卡 + 迷你柱状图 ============ */
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:26px}
@media(max-width:1040px){.stats{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){.stats{grid-template-columns:1fr}}
.stat{
  background:var(--base);border-radius:var(--r-card);padding:20px 22px;
  box-shadow:var(--raise);display:block;color:inherit;text-decoration:none;
  transition:box-shadow .2s cubic-bezier(.34,1.56,.64,1), transform .2s;
}
.stat:hover{box-shadow:var(--raise-lg);transform:translateY(-2px)}
.stat:active{box-shadow:var(--inset-sm);transform:translateY(0)}
.stat__k{font-size:12.5px;color:var(--ink-2);display:flex;align-items:center;gap:7px;
  font-weight:600;letter-spacing:.01em}
.stat__v{font-size:34px;font-weight:700;line-height:1.15;margin-top:8px;
  letter-spacing:-.03em;font-family:var(--mono);color:var(--ink)}
.stat__h{font-size:11.5px;color:var(--ink-3);margin-top:4px}
.stat--ok .stat__v,.stat--on .stat__v{color:var(--accent)}   /* 关键数据用钴蓝 */
.stat--warn .stat__v{color:var(--warn)}
.stat--danger .stat__v{color:var(--warn)}

/* 迷你柱状图：关闭态灰、开启态钴蓝（参考图 03） */
.spark{display:flex;align-items:flex-end;gap:4px;height:34px;margin-top:12px}
.spark i{flex:1;border-radius:3px;background:var(--lo);opacity:.55;
  transition:background .3s, opacity .3s}
.stat--on .spark i,.stat--ok .spark i{background:var(--accent);opacity:.85}

/* ============ 按钮：键帽 ============ */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  padding:0 18px;height:40px;border:0;border-radius:var(--r-btn);
  background:var(--base);color:var(--ink-2);box-shadow:var(--raise-sm);
  font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;text-decoration:none;white-space:nowrap;
  transition:box-shadow .16s cubic-bezier(.34,1.56,.64,1), color .16s, transform .16s;
}
.btn:hover{box-shadow:var(--raise);color:var(--ink);transform:translateY(-1px)}
.btn:active,.btn:focus:active{box-shadow:var(--inset-sm);transform:translateY(0)}
.btn:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.btn--primary{background:var(--accent);color:#fff;box-shadow:var(--raise-sm),0 0 0 1px rgba(47,75,208,.25)}
.btn--primary:hover{background:var(--accent-deep);color:#fff;box-shadow:var(--raise)}
.btn--primary:active{box-shadow:var(--inset-sm)}
.btn--danger{color:var(--warn)} .btn--danger:hover{color:#B93D19}
.btn--ghost{box-shadow:none;color:var(--ink-2)} .btn--ghost:hover{box-shadow:var(--raise-sm)}
.btn--sm{height:32px;padding:0 13px;font-size:12.5px;border-radius:12px}
.btn--block{width:100%}
.btn[disabled]{opacity:.5;cursor:not-allowed;box-shadow:var(--inset-sm)}
.btn--loading{color:transparent!important;position:relative}
.btn--loading::after{content:"";position:absolute;width:15px;height:15px;border-radius:50%;
  border:2px solid var(--accent);border-top-color:transparent;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ============ 表单：凹陷槽 ============ */
label{display:block;font-size:12.5px;font-weight:600;color:var(--ink-2);margin:0 0 7px}
label .req{color:var(--warn);margin-left:2px}
label .opt{color:var(--ink-3);font-weight:400;margin-left:4px}
input[type=text],input[type=password],input[type=email],input[type=date],input[type=search],select,textarea{
  width:100%;padding:11px 14px;border:0;border-radius:var(--r-btn);
  background:var(--base);box-shadow:var(--inset);color:var(--ink);
  font:inherit;font-size:14px;min-height:44px;
  transition:box-shadow .16s;
}
input::placeholder,textarea::placeholder{color:var(--ink-3)}
input:focus,select:focus,textarea:focus{
  outline:none;box-shadow:var(--inset),0 0 0 3px rgba(47,75,208,.16);
}
input[readonly]{box-shadow:var(--inset-sm);color:var(--ink-2)}
input[type=file]{padding:9px 12px;font-size:13px}
input[type=checkbox],input[type=radio]{
  width:18px;height:18px;min-height:0;accent-color:var(--accent);vertical-align:-3px;
}
select{appearance:none;background-image:none;cursor:pointer}
textarea{font-family:var(--mono);font-size:13px;line-height:1.8;min-height:460px;resize:vertical}
.field{margin-bottom:20px}
.field__help{font-size:11.5px;color:var(--ink-3);margin-top:6px;line-height:1.6}
.field__err{font-size:11.5px;color:var(--warn);margin-top:6px;font-weight:600}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
@media(max-width:900px){.grid2,.grid3{grid-template-columns:1fr}}

/* 折叠分组：凹陷面板 */
details.grp{background:var(--base);border-radius:var(--r-card);margin-bottom:22px;box-shadow:var(--raise)}
details.grp>summary{
  cursor:pointer;padding:18px 24px;font-weight:700;font-size:14.5px;
  list-style:none;display:flex;align-items:center;gap:11px;color:var(--ink);
  border-radius:var(--r-card);
}
details.grp>summary::-webkit-details-marker{display:none}
details.grp>summary::before{
  content:"";width:9px;height:9px;border-radius:50%;background:var(--lo);
  box-shadow:var(--inset-sm);flex:none;transition:background .2s, box-shadow .2s;
}
details.grp[open]>summary::before{background:var(--accent);box-shadow:0 0 7px var(--accent-soft)}
details.grp .grp__bd{padding:0 24px 24px}
.grp__hint{font-weight:500;color:var(--ink-3);font-size:11.5px;margin-left:auto}

/* ============ 表格：保持平整（拟物只给可交互元素） ============ */
.tablewrap{overflow-x:auto;border-radius:var(--r-btn)}
table{width:100%;border-collapse:separate;border-spacing:0;font-size:13.5px}
th,td{text-align:left;padding:13px 18px;vertical-align:middle;border:0}
thead th{
  color:var(--ink-2);font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  background:var(--base-2);white-space:nowrap;
}
thead th:first-child{border-radius:var(--r-btn) 0 0 var(--r-btn)}
thead th:last-child{border-radius:0 var(--r-btn) var(--r-btn) 0}
tbody tr{background:var(--base)}
tbody td{box-shadow:inset 0 -1px 0 rgba(214,200,189,.45)}
tbody tr:last-child td{box-shadow:none}
tbody tr:hover td{background:var(--base-2)}
td.tight,th.tight{white-space:nowrap;width:1%}
.tname{font-weight:600;color:var(--ink);display:block;line-height:1.5}
.slug{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.sortlink{color:inherit;display:inline-flex;align-items:center;gap:4px}
.sortlink:hover{color:var(--accent)}

/* ============ 徽章：微凸小键帽 ============ */
.pill{
  display:inline-flex;align-items:center;gap:5px;padding:3px 11px;border-radius:var(--r-full);
  font-size:11.5px;font-weight:700;white-space:nowrap;background:var(--base);
  box-shadow:var(--raise-sm);color:var(--ink-2);
}
.pill::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.75}
.pill--published{color:var(--ok)}
.pill--draft{color:#9A7B3A}
.pill--in_review{color:var(--accent)}
.pill--changes_requested{color:var(--warn)}
.pill--archived{color:var(--ink-3)}
.pill--editor,.pill--reviewer,.pill--viewer,.pill--admin,.pill--root{color:var(--ink-2)}
.pill--root{color:var(--accent)}

/* ============ 提示 ============ */
.alert{
  padding:14px 18px;border-radius:var(--r-btn);margin-bottom:20px;font-size:13.5px;
  background:var(--base);box-shadow:var(--raise-sm);display:flex;gap:11px;align-items:flex-start;
  line-height:1.65;color:var(--ink-2);border-left:4px solid var(--lo);
}
.alert--err{border-left-color:var(--warn);color:#8E3A1C}
.alert--ok{border-left-color:var(--ok);color:#1F6E4A}
.alert--info{border-left-color:var(--accent);color:#2A3E8F}
.alert--warn{border-left-color:var(--warn);color:#8E3A1C}

/* ============ 空状态 ============ */
.empty{padding:52px 24px;min-height:200px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;color:var(--ink-2);text-align:center}
.empty__ico{
  width:56px;height:56px;border-radius:50%;background:var(--base);box-shadow:var(--inset);
  display:grid;place-items:center;font-size:20px;color:var(--ink-3);margin-bottom:16px;
}
.empty__t{font-weight:700;color:var(--ink);margin-bottom:5px;font-size:14.5px}
.muted{color:var(--ink-2);font-size:12.5px}
.kbd{font-family:var(--mono);background:var(--base-2);border-radius:8px;padding:2px 8px;
  font-size:11.5px;color:var(--ink-2);box-shadow:var(--inset-sm)}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.row--end{justify-content:flex-end}
.spread{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}

/* ============ Toast ============ */
[popover].toast{border:0;padding:0;background:transparent;margin:28px auto auto}
.toast__box{
  background:var(--base);color:var(--ink);padding:14px 20px;border-radius:var(--r-btn);
  box-shadow:var(--raise-lg);font-size:13.5px;font-weight:600;max-width:440px;
}

/* ============ 编辑器 ============ */
.editor-grid{display:grid;grid-template-columns:minmax(0,1fr) 306px;gap:22px;align-items:start}
@media(max-width:1120px){.editor-grid{grid-template-columns:1fr}}
.editor-side{position:sticky;top:84px}
.toc{list-style:none;margin:0;padding:0;font-size:13px}
.toc li{margin:3px 0}
.toc a{color:var(--ink-2);display:block;padding:6px 10px;border-radius:10px}
.toc a:hover{color:var(--accent);box-shadow:var(--inset-sm);background:var(--base)}
.meter{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink-3)}

/* 检查清单 */
.check{list-style:none;margin:0;padding:0}
.check li{display:flex;gap:10px;padding:9px 0;font-size:12.5px;align-items:flex-start;
  box-shadow:inset 0 -1px 0 rgba(214,200,189,.4)}
.check li:last-child{box-shadow:none}
.check__ic{width:18px;height:18px;border-radius:50%;flex:none;display:grid;place-items:center;
  font-size:10px;font-weight:700;box-shadow:var(--inset-sm);color:var(--ink-3)}
.check--ok .check__ic{color:var(--ok)}
.check--bad .check__ic{color:var(--warn)}
.check--warn .check__ic{color:#9A7B3A}
.check a{color:var(--ink-2)}
.check a:hover{color:var(--accent)}

/* ============ 分页 ============ */
.pager{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.pager__btn{
  min-width:36px;height:36px;padding:0 12px;display:inline-flex;align-items:center;justify-content:center;
  border-radius:12px;background:var(--base);box-shadow:var(--raise-sm);color:var(--ink-2);
  font-size:13px;text-decoration:none;font-weight:600;
}
.pager__btn:hover{box-shadow:var(--raise);color:var(--ink)}
.pager__btn[aria-current="page"]{box-shadow:var(--inset-sm);color:var(--accent)}

/* ============ 登录页 ============ */
.login-wrap{max-width:392px;margin:11vh auto;padding:0 20px}
.login-wrap .card{padding:38px 32px;box-shadow:var(--raise-lg);border-radius:28px}
.login-wrap h1{font-size:23px;margin-bottom:8px}
.login-foot{text-align:center;color:var(--ink-3);font-size:11.5px;margin-top:18px;line-height:1.7}

/* ============ 移动端：侧栏转顶栏 ============ */
@media(max-width:860px){
  .shell{grid-template-columns:1fr}
  .sidebar{position:static;height:auto;flex-direction:row;align-items:center;
    overflow-x:auto;padding:12px 14px;gap:10px}
  .sidebar__brand{padding:0 8px 0 0}
  .sidebar__sec{display:none}
  .sidebar__nav{flex-direction:row;gap:8px}
  .navitem{white-space:nowrap;padding:10px 13px}
  .navitem[aria-current="page"]::after{display:none}
  .sidebar__foot{display:none}
  .topbar{padding:14px 20px}
  main{padding:0 20px 48px}
  .editor-side{position:static}
}

/* ============ 弹簧入场（120–300ms，轻微回弹） ============ */
@keyframes fx-rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.stat,.card,.grp{animation:fx-rise .26s cubic-bezier(.34,1.56,.64,1) both}
@media(prefers-reduced-motion:reduce){
  .stat,.card,.grp{animation:none}
  *{transition-duration:.01ms!important}
}

/* ---- 修正：页头标题与说明的间距（原先 h1 与副标题贴在一起） ---- */
main > h1,main > h1:first-child{margin-top:0;margin-bottom:8px}
main > h1 + p,main > .spread + p{margin-top:0}
.spread h1{margin:0}
.spread + p.muted{margin-top:-6px}

/* ---- 修正：表格列宽约束，日期/复核列不得折行 ---- */
.tablewrap table{min-width:720px}
.tablewrap td:nth-last-child(-n+3),.tablewrap th:nth-last-child(-n+3){white-space:nowrap}
.dash-table{min-width:640px}
.dash-table td,.dash-table th{padding:14px 18px}
.dash-table td:first-child{min-width:240px}
.dash-table td:nth-child(2),.dash-table td:nth-child(3),.dash-table td:nth-child(4){white-space:nowrap}

/* ---- 修正：spread 头部与说明的节奏 ---- */
.spread{align-items:flex-start}
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
      navItem("/media", "▢", "媒体库", "media") +
      '</nav>' +
      (isReviewer ? '<div class="sidebar__sec">协作</div><nav class="sidebar__nav">' +
        navItem("/audit", "◷", "审计日志", "audit") +
        navItem("/publish", "⇪", "发布", "publish") + '</nav>' :
        '<div class="sidebar__sec">协作</div><nav class="sidebar__nav">' +
        navItem("/publish", "⇪", "发布", "publish") + '</nav>') +
      (isAdmin ? '<div class="sidebar__sec">管理</div><nav class="sidebar__nav">' +
        navItem("/users", "☺", "账号", "users") +
        navItem("/security", "⚿", "账号安全", "security") + '</nav>' : "");
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
    '<style>' + BASE_CSS + '</style>\n</head>\n' +
    // data-* 供 editor.js 读取（上传接口与 CSRF），避免把令牌写进内联脚本（CSP 更严）
    '<body data-upload-endpoint="/media/upload" data-csrf="' + esc(opts.csrf || "") + '">\n' +
    '<div id="live" aria-live="polite" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip(0 0 0 0)"></div>' +
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
    '<p class="muted" style="margin:0 0 22px">仅限内部编辑人员使用。账号由管理员分发。</p>' +
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

  // 领域/分类的中文名映射。原先列表直接显示 slug（data-backup / db-delete），
  // 既不美观也不易懂 —— 这里按 taxonomy 翻译。
  const domById = {}, catById = {};
  (opts.domains || []).forEach(function (d) {
    domById[d.id] = d.name;
    (d.cats || []).forEach(function (c) { catById[c.id] = c.name; });
  });
  function domName(id) { return domById[id] || id || ""; }
  function catName(id) { return catById[id] || id || ""; }

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
      "<td>" + esc(domName(a.domain)) + '<div class="muted">' + esc(catName(a.category)) + "</div></td>" +
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

    viewsBar({ views: opts.views || [], currentQs: opts.currentQs || "", csrf: opts.csrf }) +
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
  // 段落规则由服务端注入，避免与 content-lint.cjs 分叉
  const REQ_SEC = (opts.sections && opts.sections.required) || REQUIRED_SECTIONS;
  const SUG_SEC = (opts.sections && opts.sections.suggested) || SUGGESTED_SECTIONS;
  const ALIASES = (opts.sections && opts.sections.aliases) || SECTION_ALIASES;
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
    // 正文段落（2026-10-13：正文改为自由写作）
    // 只硬性要求两个底线段落；其余段落仅提示，不阻塞发布。
    const bt = String(opts.body || "");
    const hasSec = function (n) {
      const list = ALIASES[n] || [n];
      return list.some(function (x) { return bt.indexOf("## " + x) >= 0; });
    };
    const missReq = REQ_SEC.filter(function (n) { return !hasSec(n); });
    add(missReq.length === 0,
        missReq.length ? "正文缺少必要段落：" + missReq.join("、") : "必要段落齐全（其余可自由组织）",
        "body", missReq.length ? "bad" : "ok");
    const missSug = SUG_SEC.filter(function (n) { return !hasSec(n); });
    if (missSug.length) {
      add(false, "建议补充段落：" + missSug.join("、"), "body", "warn");
    }
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
        (isNew ? "" : '<a class="btn" href="/articles/' + esc(opts.slug) + '/revisions">修订历史' + (opts.revCount ? " (" + opts.revCount + ")" : "") + "</a>") +
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

      // 组 2：正文（自由写作）
      // 2026-10-13 调整：正文从「强制 10 段结构」改为自由写作，
      // 以便后续引入思维导图、图片等非段落化内容。
      // 结构化能力（检索与关联等 front-matter 字段）保持不变。
      '<details class="grp" open><summary>正文（Markdown · 自由写作）<span class="grp__hint">右侧为段落导航</span></summary><div class="grp__bd">' +
        '<p class="muted" style="margin-top:0">正文可自由组织，支持任意 Markdown、图片与思维导图。' +
          '只需包含 <strong>' + REQ_SEC.map(function (s) { return "「" + esc(s) + "」"; }).join(" 与 ") + "</strong> 两个必要段落即可发布。" +
          '建议保留：' + SUG_SEC.map(function (s) { return esc(s); }).join(" / ") + "（仅提示，不阻塞）。</p>" +
        '<div class="row" style="margin-bottom:8px;gap:6px">' +
          '<button class="btn btn--sm" type="button" data-insert-skeleton>插入完整骨架</button>' +
          '<button class="btn btn--sm" type="button" data-insert-image>插入图片</button>' +
          '<span class="muted" style="font-size:12px">或在编辑器内直接粘贴/拖入图片</span>' +
        '</div>' +
        '<textarea id="body" name="body" spellcheck="false" data-toc-source>' + esc(opts.body || "") + '</textarea>' +
        '<div class="meter" style="margin-top:6px"><span id="wc">—</span><span>中文按字符计 · Ctrl/Cmd+S 保存</span></div>' +
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
    commentsBlock({ slug: opts.slug, comments: opts.comments || [], csrf: opts.csrf }) +
    "</form>" +
    '<template id="src-type-options">' + typeOptionsHtml + "</template>";

  return layout((isNew ? "新建文章" : "编辑：" + (m.title || opts.slug)), err + ok + body,
    Object.assign({
      current: "articles",
      crumbs: isNew ? [{ label: "文章", href: "/articles" }, { label: "新建" }]
                     : [{ label: "文章", href: "/articles" }, { label: m.title || opts.slug }]
    }, opts));
}
/* ---------------- 修订历史页 ---------------- */
function revisionsPage(opts) {
  const rows = (opts.revisions || []).map(function (r, i) {
    const t = String(r.created_at || "").slice(0, 19).replace("T", " ");
    const label = r.revision_no === (opts.revisions[0] ? opts.revisions[0].revision_no : -1) ? "最新" : ("v" + r.revision_no);
    return "<tr><td class=\"tight\"><span class=\"kbd\">" + label + "</span></td>" +
      "<td class=\"muted num\">" + esc(t) + "</td>" +
      "<td>" + esc(r.author_name || r.author_email || "—") + "</td>" +
      "<td>" + esc(r.note || "") + "</td>" +
      "<td class=\"muted num\">" + (r.content_len || 0) + " 字节</td>" +
      "<td class=\"tight\"><a class=\"btn btn--sm\" href=\"/articles/" + esc(opts.slug) + "/revisions/" + r.revision_no + "\">与当前对比</a></td></tr>";
  }).join("");
  return layout("修订历史",
    "<div class=\"spread\" style=\"margin-bottom:16px\"><h1 style=\"margin:0\">修订历史</h1>" +
      '<a class=\"btn\" href=\"/articles/' + esc(opts.slug) + '\">返回文章</a></div>' +
    '<p class=\"muted\">每次保存都会留一份完整快照（含 front-matter），最多保留最近 30 版。</p>' +
    '<div class=\"card card--flush\"><div class=\"tablewrap\"><table>' +
    "<thead><tr><th>版本</th><th>时间</th><th>作者</th><th>说明</th><th>体积</th><th></th></tr></thead><tbody>" +
    (rows || '<tr><td colspan=\"6\" class=\"empty\"><div class=\"empty__ico\">◷</div><div class=\"empty__t\">还没有修订记录</div><div>从本功能上线后开始的每次保存都会被记录</div></td></tr>') +
    "</tbody></table></div></div>",
    Object.assign({ current: "articles", crumbs: [{ label: "文章", href: "/articles" }, { label: opts.slug, href: "/articles/" + opts.slug }, { label: "修订历史" }] }, opts));
}

/* ---------------- 修订对比页（行级 diff） ---------------- */
function revisionDiffPage(opts) {
  const rows = (opts.rows || []).map(function (r) {
    if (r.t === "same") return '<tr class=\"dif-same\"><td class=\"dif-n\"></td><td colspan=\"2\">' + esc(r.a || "") + "</td></tr>";
    if (r.t === "del") return '<tr class=\"dif-del\"><td class=\"dif-n\">−</td><td colspan=\"2\">' + esc(r.a || "") + "</td></tr>";
    return '<tr class=\"dif-add\"><td class=\"dif-n\">+</td><td colspan=\"2\">' + esc(r.b || "") + "</td></tr>";
  }).join("");
  const nAdd = (opts.rows || []).filter(function (r) { return r.t === "add"; }).length;
  const nDel = (opts.rows || []).filter(function (r) { return r.t === "del"; }).length;
  return layout("修订对比",
    "<div class=\"spread\" style=\"margin-bottom:16px\"><div><h1 style=\"margin:0\">v" + esc(opts.rev.revision_no) + " → 当前</h1>" +
      '<div class=\"muted\">作者 ' + esc(opts.rev.author_email || "—") + " · " + esc(String(opts.rev.created_at || "").slice(0, 19).replace("T", " ")) + "</div></div>" +
      '<div class=\"row\"><a class=\"btn\" href=\"/articles/' + esc(opts.slug) + '/revisions\">返回历史</a>' +
      '<a class=\"btn\" href=\"/articles/' + esc(opts.slug) + '\">打开文章</a></div></div>' +
    '<div class=\"row\" style=\"gap:12px;margin-bottom:12px\">' +
      '<span class=\"pill pill--published\">+' + nAdd + ' 行</span>' +
      '<span class=\"pill pill--changes_requested\">−' + nDel + ' 行</span>' +
      (opts.hasCurrent ? "" : '<span class=\"pill pill--archived\">文章已不存在，无法对比</span>') +
    "</div>" +
    '<div class=\"card card--flush\"><div class=\"tablewrap\"><table class=\"dif\">' +
    "<tbody>" + (rows || '<tr><td class=\"empty\">无差异</td></tr>') + "</tbody></table></div></div>",
    Object.assign({ current: "articles", crumbs: [{ label: "文章", href: "/articles" }, { label: opts.slug, href: "/articles/" + opts.slug }, { label: "修订对比" }] }, opts));
}

/* ---------------- 审核评论区块（嵌入编辑器页） ---------------- */
function commentsBlock(opts) {
  const list = opts.comments || [];
  const items = list.map(function (c) {
    const resolved = !!c.resolved_at;
    return '<div class=\"cmt' + (resolved ? " cmt--done" : "") + '\">' +
      '<div class=\"cmt__hd\"><strong>' + esc(c.author_name || c.author_email || "—") + "</strong>" +
        '<span class=\"muted\">' + esc(String(c.created_at || "").slice(0, 16).replace("T", " ")) + "</span>" +
        (c.anchor ? '<span class=\"kbd\">' + esc(c.anchor) + "</span>" : "") +
        (resolved ? '<span class=\"pill pill--published\">已解决</span>' : "") +
      "</div>" +
      '<div class=\"cmt__bd\">' + esc(c.body).replace(/\n/g, "<br>") + "</div>" +
      '<div class=\"cmt__ft\"><form method=\"post\" action=\"/comments/' + c.id + (resolved ? "/reopen" : "/resolve") + '\">' +
        '<input type=\"hidden\" name=\"_csrf\" value=\"' + esc(opts.csrf || "") + '\">' +
        '<input type=\"hidden\" name=\"slug\" value=\"' + esc(opts.slug) + '\">' +
        '<button class=\"btn btn--sm btn--ghost\" type=\"submit\">' + (resolved ? "重新打开" : "标记已解决") + "</button>" +
      "</form></div></div>";
  }).join("");
  return '<details class=\"grp\"' + (list.length ? " open" : "") + '><summary>审核评论' +
      '<span class=\"grp__hint\">' + list.length + ' 条' + (list.filter(function (c) { return !c.resolved_at; }).length ? "（" + list.filter(function (c) { return !c.resolved_at; }).length + " 条未解决）" : "") + "</span></summary>" +
    '<div class=\"grp__bd\" id=\"comments\">' +
      (items || '<p class=\"muted\" style=\"margin-top:0\">还没有评论。审核意见写在这里，比在聊天工具里说更不容易丢。</p>') +
      '<form method=\"post\" action=\"/articles/' + esc(opts.slug) + '/comments\" style=\"margin-top:16px\">' +
        '<input type=\"hidden\" name=\"_csrf\" value=\"' + esc(opts.csrf || "") + '\">' +
        '<label for=\"cmtbody\">新增评论</label>' +
        '<textarea id=\"cmtbody\" name=\"body\" style=\"min-height:90px;font-family:inherit;font-size:14px\" placeholder=\"例如：第 3 步的命令需要管理员权限，请补充说明。\"></textarea>' +
        '<div class=\"row row--end\" style=\"margin-top:10px\"><button class=\"btn btn--primary\" type=\"submit\">发表评论</button></div>' +
      "</form>" +
    "</div></details>";
}

/* ---------------- 保存视图工具条 ---------------- */
function viewsBar(opts) {
  const views = opts.views || [];
  const cur = opts.currentQs || "";
  const chips = views.map(function (v) {
    const active = (v.querystring || "") === cur;
    return '<a class=\"btn btn--sm' + (active ? " btn--primary" : "") + '" href=\"/articles' + (v.querystring ? "?" + v.querystring : "") + '\">' +
      esc(v.name) + (v.is_shared ? " · 共享" : "") + "</a>";
  }).join("");
  return '<div class=\"row\" style=\"gap:8px;margin-bottom:12px\">' +
    '<span class=\"muted\">保存的视图：</span>' +
    (chips || '<span class=\"muted\">（无）</span>') +
    '<details style=\"display:inline-block;position:relative\">' +
      '<summary class=\"btn btn--sm\" style=\"list-style:none;cursor:pointer\">＋ 保存当前筛选</summary>' +
      '<div class=\"card\" style=\"position:absolute;z-index:30;width:280px;padding:14px;margin-top:6px\">' +
        '<form method=\"post\" action=\"/views/save\">' +
          '<input type=\"hidden\" name=\"_csrf\" value=\"' + esc(opts.csrf || "") + '\">' +
          '<input type=\"hidden\" name=\"qs\" value=\"' + esc(cur) + '\">' +
          '<label for=\"vname\">视图名称</label>' +
          '<input id=\"vname\" name=\"name\" type=\"text\" required maxlength=\"40\" placeholder=\"例如：待我审核\">' +
          '<label style=\"margin-top:10px\"><input type=\"checkbox\" name=\"is_shared\" value=\"1\"> 共享给团队</label>' +
          '<div class=\"row row--end\" style=\"margin-top:12px\"><button class=\"btn btn--primary btn--sm\" type=\"submit\">保存</button></div>' +
        "</form>" +
      "</div></details>" +
  "</div>";
}

function dashboardPage(opts) {
  const s = opts.stats || {};
  // 统计卡：数值用等宽字体；底部加迷你柱状图。
  // 参考图 03 的语义 —— 值为 0 时柱子是灰的（"断电"），>0 时转钴蓝（"通电"）。
  // 这样扫一眼就知道哪块有事，而不是只看数字。
  function spark(on) {
    // 用固定形状的 12 根柱子表达"趋势感"，高度由值派生（0 时压平）
    const bars = [0.42, 0.6, 0.35, 0.72, 0.5, 0.85, 0.62, 0.44, 0.78, 0.55, 0.9, 0.66];
    return "<div class=\"spark\">" + bars.map(function (b) {
      const h = on ? Math.round(b * 100) : Math.round(b * 34);
      return "<i style=\"height:" + h + "%\"></i>";
    }).join("") + "</div>";
  }
  function stat(key, label, hint, kind, href) {
    const v = s[key] === undefined ? 0 : s[key];
    const cls = (v > 0 && kind) ? (" stat--on stat--" + kind) : "";
    const tag = href ? "a" : "div";
    return "<" + tag + " class=\"stat" + cls + "\"" + (href ? " href=\"" + href + "\"" : "") + ">" +
      "<div class=\"stat__k\">" + esc(label) + "</div>" +
      "<div class=\"stat__v\">" + v + "</div>" +
      (hint ? "<div class=\"stat__h\">" + esc(hint) + "</div>" : "") +
      spark(v > 0) +
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
    "<p class=\"muted\" style=\"margin:0 0 24px\">只放能触发动作的信息：待办、陈旧内容、结构缺失。装饰性统计一律不放。</p>" +
    "<div class=\"stats\">" +
      // 「待我审核 / 我的草稿 / 退回修改」按当前用户过滤（待办语义）；
      // 已发布与陈旧度是全局指标，与个人无关，保持全站口径。
      stat("inReview", "待我审核", (s.inReviewAll && s.inReviewAll !== s.inReview)
            ? ("我相关 " + s.inReview + " 篇 · 全站 " + s.inReviewAll + " 篇") : "状态为「审核中」", "info", "/articles?status=in_review") +
      stat("drafts", "我的草稿", "尚未发布", "warn", "/articles?status=draft") +
      stat("changesRequested", "退回修改", "需要我处理", "danger", "/articles?status=changes_requested") +
      stat("published", "已发布", "线上可访问", "ok", "/articles?status=published") +
      stat("stale", "超 180 天未复核", "知识库健康度", "warn", "/articles?stale=1") +
      stat("missingSources", "缺参考资料", "sources 少于 1 条", "danger", "/articles?missing=sources") +
    "</div>" +
    // 两栏：左栏更宽（标题需要空间），右栏窄且等高 —— 避免右侧留下大片空洞
    "<div class=\"dash-cols\">" +
      "<div class=\"card card--flush\">" +
        "<div class=\"card__hd\"><h3>最近编辑</h3><span class=\"topbar__sp\"></span>" +
        "<a class=\"btn btn--sm\" href=\"/articles\">全部文章</a></div>" +
        '<div class="tablewrap"><table class="dash-table"><thead><tr>' +
        '<th style="width:auto">标题</th><th class="tight">状态</th><th class="tight">更新</th><th class="tight">复核</th>' +
        "</tr></thead><tbody>" +
        (recentRows || '<tr><td colspan="4" class="empty"><div class="empty__ico">□</div><div class="empty__t">暂无内容</div><div>新建第一篇文章后会出现在这里</div></td></tr>') +
        "</tbody></table></div>" +
      "</div>" +
      "<div class=\"card card--flush\">" +
        "<div class=\"card__hd\"><h3>陈旧内容</h3><span class=\"muted\" style=\"font-size:12px\">超 180 天未复核</span></div>" +
        '<div class="tablewrap"><table class="dash-table"><thead><tr>' +
        '<th style="width:auto">标题</th><th class="tight">距上次</th><th class="tight">上次复核</th>' +
        "</tr></thead><tbody>" +
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

/* ---------------- 媒体库页 ---------------- */
/* ---------------- 2FA 设置页 ---------------- */
function securityPage(opts) {
  const err = opts.error ? '<div class="alert alert--err">' + esc(opts.error) + "</div>" : "";
  const ok = opts.notice ? '<div class="alert alert--ok">' + esc(opts.notice) + "</div>" : "";
  const body = opts.enabled
    ? '<div class="alert alert--ok">双因素认证已开启。登录时需要输入手机 App 上的 6 位验证码。</div>' +
      '<form method="post" action="/security/totp/disable">' +
        '<input type="hidden" name="_csrf" value="' + esc(opts.csrf || "") + '">' +
        '<button class="btn" type="submit" data-confirm="关闭后，仅凭密码即可登录，安全性会下降。" data-confirm-ok="关闭">关闭双因素认证</button>' +
      "</form>"
    : '<p class="muted">开启后，登录需要「密码 + 手机 App 上的 6 位验证码」。' +
      '即使密码泄露，攻击者也无法登录。root 与 admin 账号建议开启。</p>' +
      '<form method="post" action="/security/totp/start">' +
        '<input type="hidden" name="_csrf" value="' + esc(opts.csrf || "") + '">' +
        '<button class="btn btn--primary" type="submit">开始设置</button>' +
      "</form>";
  return layout("账号安全",
    "<h1>账号安全</h1>" + err + ok +
    '<div class="card"><h3 style="margin-top:0">双因素认证（TOTP）</h3>' + body + "</div>" +
    '<div class="card"><h3 style="margin-top:0">修改密码</h3>' +
      '<p class="muted">定期更换密码，或怀疑泄露时立即更换。</p>' +
      '<a class="btn" href="/change-password">修改密码</a></div>',
    Object.assign({ current: "security", crumbs: [{ label: "账号安全" }] }, opts));
}

/* ---------------- 2FA 绑定确认页 ---------------- */
function securityConfirmPage(opts) {
  const err = opts.error ? '<div class="alert alert--err">' + esc(opts.error) + "</div>" : "";
  if (opts.done) {
    const codes = (opts.codes || []).map(function (c) { return '<span class="kbd">' + esc(c) + "</span>"; }).join(" ");
    return layout("2FA 已开启",
      '<div class="card"><h1>双因素认证已开启</h1>' +
      '<div class="alert alert--warn">下面这些<strong>恢复码只显示这一次</strong>。手机丢失时用它登录。请立即保存到密码管理器或打印出来。</div>' +
      '<div style="font-size:16px;line-height:2.2">' + codes + "</div>" +
      '<p class="muted">每个恢复码只能使用一次。用完可在本页重新生成。</p>' +
      '<a class="btn btn--primary" href="/security">完成</a></div>',
      Object.assign({ current: "security", crumbs: [{ label: "账号安全", href: "/security" }, { label: "已开启" }] }, opts));
  }
  // 表单里的文本二维码：不引外部二维码库，直接把 otpauth URI 与密钥展示出来，
  // 用户可以手动输入密钥（所有标准 App 都支持），或把 URI 复制到二维码生成器。
  return layout("绑定 2FA",
    '<div class="card"><h1>绑定验证器</h1>' + err +
    '<ol style="line-height:2">' +
      "<li>在手机上安装任意 TOTP 应用（Google Authenticator / Microsoft Authenticator / 1Password 等）</li>" +
      "<li>选择「手动输入密钥」，粘贴下面的密钥</li>" +
      "<li>把 App 显示的 6 位验证码填到下面</li>" +
    "</ol>" +
    '<label>密钥（手动输入用）</label>' +
    '<div class="row"><input type="text" readonly value="' + esc(opts.secret) + '" style="font-family:var(--mono)" id="secret">' +
    '<button class="btn" type="button" onclick="navigator.clipboard.writeText(document.getElementById(\'secret\').value)">复制</button></div>' +
    '<label style="margin-top:14px">otpauth 链接（可贴到二维码生成器）</label>' +
    '<input type="text" readonly value="' + esc(opts.uri) + '" style="font-family:var(--mono);font-size:12px">' +
    '<form method="post" action="/security/confirm" style="margin-top:20px">' +
      '<input type="hidden" name="_csrf" value="' + esc(opts.csrf || "") + '">' +
      '<label for="code">验证码（6 位数字）</label>' +
      '<input id="code" name="code" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required style="max-width:200px;font-family:var(--mono);font-size:18px;letter-spacing:4px">' +
      '<div style="margin-top:16px"><button class="btn btn--primary" type="submit">确认并开启</button></div>' +
    "</form></div>",
    Object.assign({ current: "security", crumbs: [{ label: "账号安全", href: "/security" }, { label: "绑定" }] }, opts));
}

/* ---------------- 2FA 验证页（登录第二步） ---------------- */
function totpChallengePage(opts) {
  const err = opts.error ? '<div class="alert alert--err">' + esc(opts.error) + "</div>" : "";
  return layout("双因素验证",
    '<div class="login-wrap"><div class="card">' +
    "<h1>双因素验证</h1>" +
    '<p class="muted" style="margin:0 0 20px">请输入手机 App 上的 6 位验证码；也可使用一枚恢复码。</p>' + err +
    '<form method="post" action="/login/totp">' +
      '<input type="hidden" name="_csrf" value="' + esc(opts.csrf || "") + '">' +
      '<label for="code">验证码 / 恢复码</label>' +
      '<input id="code" name="code" type="text" required autofocus autocomplete="one-time-code" style="font-family:var(--mono);font-size:18px;letter-spacing:3px">' +
      '<div style="margin-top:16px"><button class="btn btn--primary" type="submit" style="width:100%">验证</button></div>' +
    "</form></div></div>",
    { nav: false, user: null });
}

function mediaPage(opts) {
  const items = opts.items || [];
  const err = opts.error ? '<div class="alert alert--err">' + esc(opts.error) + "</div>" : "";
  const ok = opts.notice ? '<div class="alert alert--ok">' + esc(opts.notice) + "</div>" : "";
  const cards = items.map(function (m) {
    const hasAlt = !!(m.alt && String(m.alt).trim());
    return '<div class="mcard">' +
      '<div class="mcard__img"><img src="/media/' + esc(m.filename) + '" alt="' + esc(m.alt || "") + '" loading="lazy"></div>' +
      '<div class="mcard__bd">' +
        (hasAlt
          ? '<div class="mcard__alt">' + esc(m.alt) + "</div>"
          : '<div class="mcard__alt mcard__alt--missing">缺 alt 文本</div>') +
        '<div class="muted" style="font-size:12px">' + esc(m.filename) + "</div>" +
        '<div class="muted" style="font-size:12px">' + Math.round((m.bytes || 0) / 1024) + " KB · " + esc(String(m.created_at || "").slice(0, 10)) + " · " + esc(m.uploader_email || "—") + "</div>" +
      "</div>" +
      '<div class="mcard__ft">' +
        '<button class="btn btn--sm" type="button" data-copy="' + esc(m.rel_path) + '">复制路径</button>' +
        '<button class="btn btn--sm" type="button" data-setalt="' + m.id + '" data-cur="' + esc(m.alt || "") + '">改 alt</button>' +
        '<form method="post" action="/media/' + m.id + '/delete" style="display:inline">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf || "") + '">' +
          '<button class="btn btn--sm btn--ghost" type="submit" data-confirm="删除后文章里的引用会裂图。文件本体保留，可恢复。" data-confirm-danger data-confirm-ok="删除">删除</button>' +
        "</form>" +
      "</div></div>";
  }).join("");
  return layout("媒体库",
    '<div class="spread" style="margin-bottom:16px"><h1 style="margin:0">媒体库</h1>' +
      '<span class="muted">' + items.length + ' 个文件</span></div>' +
    err + ok +
    '<div class="card">' +
      "<h3 style=\"margin-top:0\">上传图片</h3>" +
      '<form method="post" action="/media/upload" enctype="multipart/form-data">' +
        '<input type="hidden" name="_csrf" value="' + esc(opts.csrf || "") + '">' +
        '<div class="grid2">' +
          '<div><label for="file">选择图片<span class="req">*</span></label>' +
            '<input id="file" type="file" name="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" required>' +
            '<div class="field__help">支持 PNG / JPEG / WebP / GIF / AVIF，单个不超过 5 MB。<strong>不接受 SVG</strong>（可内嵌脚本）。</div></div>' +
          '<div><label for="alt">替代文本 alt<span class="req">*</span></label>' +
            '<input id="alt" name="alt" type="text" required maxlength="120" placeholder="例如：Windows 网络设置里 DNS 服务器分配的位置">' +
            '<div class="field__help">描述<strong>这张图要说明什么</strong>，不是「截图」。读屏用户与图片加载失败时靠它理解内容。</div></div>' +
        '</div>' +
        '<div style="margin-top:12px"><label style="font-weight:400"><input type="checkbox" name="desensitized" value="1" required> 我已确认图中已脱敏（MAC 地址、序列号、Wi-Fi 名称、公网 IP、真实用户名、邮箱、二维码）</label></div>' +
        '<div class="row row--end" style="margin-top:14px"><button class="btn btn--primary" type="submit">上传</button></div>' +
      "</form>" +
    "</div>" +
    (cards ? '<div class="mgrid">' + cards + "</div>"
           : '<div class="card"><div class="empty"><div class="empty__ico">▢</div><div class="empty__t">还没有图片</div><div>上传后可在编辑器里用「插入图片」引用</div></div></div>'),
    Object.assign({ current: "media", crumbs: [{ label: "媒体库" }] }, opts));
}

function simplePage(title, msg, opts) {
  return layout(title, '<div class="card"><h1>' + esc(title) + "</h1><p>" + esc(msg) + '</p><a class="btn" href="/articles">返回文章列表</a></div>', opts);
}

module.exports = {
  layout: layout, loginPage: loginPage, changePasswordPage: changePasswordPage,
  articlesPage: articlesPage, editorPage: editorPage, publishPage: publishPage,
  usersPage: usersPage, auditPage: auditPage, simplePage: simplePage, dashboardPage: dashboardPage,
  revisionsPage: revisionsPage, revisionDiffPage: revisionDiffPage, commentsBlock: commentsBlock, viewsBar: viewsBar,
  mediaPage: mediaPage,
  securityPage: securityPage, securityConfirmPage: securityConfirmPage, totpChallengePage: totpChallengePage,
  statusLabel: statusLabel
};
