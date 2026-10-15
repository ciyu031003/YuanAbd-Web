
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


/* ---------------- 图标集（内联 SVG） ----------------
   为什么改掉原来的 emoji/字形图标（◔ ✎ ↩ ✓ ◷ ! ▢ ☰ ＋ ☺ ⚿）：
     · UI 规范把 "Emoji as icons" 明确列为反模式：跨平台字形不一致、
       无法跟随 currentColor、无法精确控制笔画粗细、读屏行为不可控
     · 内联 SVG 零额外请求、任意 DPI 清晰、currentColor 自动继承文字色
   统一 24×24 viewBox + stroke 1.8 + round 端点，视觉重量一致。 */
const ICONS = {
  dashboard: "M3 12h7V3H3v9Zm11 9h7v-9h-7v9ZM3 21h7v-6H3v6Zm11-12h7V3h-7v6Z",
  articles:  "M4 5h16M4 12h16M4 19h10",
  plus:      "M12 5v14M5 12h14",
  media:     "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6",
  audit:     "M12 7v5l3 2M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z",
  publish:   "M12 19V5M5 12l7-7 7 7",
  users:     "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6",
  taxonomy:  "M3 6h6l2 3h10M4 19h7l2-3h7",
  security:  "M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3ZM9.5 12l2 2 3.5-3.5",
  review:    "M12 3a9 9 0 1 0 9 9M12 7v5l3 2",
  draft:     "M4 20h4l10-10-4-4L4 16v4ZM14 6l4 4",
  rejected:  "M9 14l6-6M9 8l6 6M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z",
  check:     "M4 12.5l5 5L20 6.5",
  warning:   "M12 8v5M12 17h.01M10.3 3.9L2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  empty:     "M3 7h18v13H3zM3 7l2-4h14l2 4M9 12h6",
  logout:    "M15 12H4M8 8l-4 4 4 4M14 4h5v16h-5",
  key:       "M15 8a4 4 0 1 0-3.5 4L10 13.5V16H7.5l-1 1v2.5H4V17l7-7A4 4 0 0 1 15 8Z",
  external:  "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  search:    "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  chart:     "M4 20V10M10 20V4M16 20v-7M22 20H2",
  clock:     "M12 7v5l3 2M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z",
  inbox:     "M3 12h5l1.5 3h5L16 12h5M3 12l2.5-7h13L21 12v7H3v-7Z"
};

/* 渲染一个图标。name 不存在时返回空串（不抛错，避免一个笔误炸整页）。
   默认 aria-hidden：本站所有图标的含义都有可见文字标签，图标属于装饰。 */
function icon(name, size, cls) {
  const d = ICONS[name];
  if (!d) return "";
  const s = size || 20;
  return '<svg class="fx-icon' + (cls ? " " + cls : "") + '" width="' + s + '" height="' + s + '" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="' + d + '"/></svg>';
}

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
  --ink:#1A1714;
  --ink-2:#4A443D;             /* 次文字不浅于此 */
  --ink-3:#5A5249;

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

/* ============================================================
   撞色 / 数据看板（参考图 2、图 3）
   ------------------------------------------------------------
   图 2 提供「结构」：问候语 + 统计卡带环比徽章 + 热力网格 + 柱状图 + 通知流
   图 3 提供「色彩」：每张卡一个彩色底，深色文字压在亮色上，饱和度高
   本文档落地两者，并保持拟态的光影语言。

   文字对比度实测（底色 #F2E8E0）：
     主文字 #1A1714 14.8:1 AAA ｜ 次 #3D3833 9.6:1 AAA
     辅助   #4A443D  8.0:1 AAA ｜ 占位 #5A5249 6.4:1 AA
   六个撞色底上的文字对比度均在 8.7–11:1，全部达标。
   ============================================================ */

:root{
  /* 撞色磁贴：tint 为卡底，deep 为强调/指示，ink 为卡上文字 */
  --t-indigo:#E4E7FF; --d-indigo:#3B4BC8; --i-indigo:#26296E;
  --t-mint:#DDF5EC;   --d-mint:#1F9E76;   --i-mint:#0D4A36;
  --t-amber:#FDEFD3;  --d-amber:#C78510;  --i-amber:#5C3D05;
  --t-coral:#FFE4DC;  --d-coral:#DB5A38;  --i-coral:#6B2614;
  --t-sky:#DCEFFF;    --d-sky:#1F7FC4;    --i-sky:#0F3E63;
  --t-violet:#EEE0FF; --d-violet:#7B45C9; --i-violet:#3A1A66;

  --up:#1F9E76; --down:#DB5A38;   /* 环比涨跌 */
}

/* ---------------- 问候语头部（图2 顶部） ---------------- */
.dash-hello{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;
  flex-wrap:wrap;margin-bottom:22px}
.dash-hello h1{font-size:27px;margin-bottom:4px}
.dash-hello__date{font-size:12.5px;color:var(--ink-2);font-weight:600}
.dash-hello__acts{display:flex;gap:10px;align-items:center}

/* ---------------- 彩色统计磁贴（图2 统计卡 + 图3 撞色） ---------------- */
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:26px}
@media(max-width:1040px){.tiles{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){.tiles{grid-template-columns:1fr}}
.tile{
  position:relative;border-radius:22px;padding:20px 22px;display:block;
  color:inherit;text-decoration:none;overflow:hidden;
  box-shadow:var(--raise-sm);
  transition:box-shadow .22s var(--neu-ease), transform .22s var(--neu-ease);
}
.tile:hover{text-decoration:none;transform:translateY(-3px);box-shadow:var(--raise)}
.tile:active{transform:translateY(0)}
.tile__hd{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;
  letter-spacing:.01em;opacity:.95}
.tile__ico{width:26px;height:26px;border-radius:9px;display:grid;place-items:center;
  font-size:13px;background:rgba(255,255,255,.72);flex:none}
.tile__v{font-size:36px;font-weight:800;line-height:1.1;margin-top:10px;
  letter-spacing:-.035em;font-family:var(--mono)}
.tile__h{font-size:11.5px;margin-top:5px;opacity:.8;font-weight:600}
.tile__spark{display:flex;align-items:flex-end;gap:3px;height:30px;margin-top:12px}
.tile__spark i{flex:1;border-radius:2px;background:currentColor;opacity:.32}
.tile__spark i.on{opacity:.85}
/* 环比徽章 */
.tile__delta{position:absolute;right:18px;top:18px;font-size:11px;font-weight:800;
  padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.78);
  display:inline-flex;align-items:center;gap:3px}

/* 六色分布 */
.tile--indigo{background:linear-gradient(140deg,#EDEFFF,var(--t-indigo));color:var(--i-indigo)}
.tile--indigo .tile__ico{color:var(--d-indigo)}
.tile--mint{background:linear-gradient(140deg,#E9FAF3,var(--t-mint));color:var(--i-mint)}
.tile--mint .tile__ico{color:var(--d-mint)}
.tile--amber{background:linear-gradient(140deg,#FFF7E6,var(--t-amber));color:var(--i-amber)}
.tile--amber .tile__ico{color:var(--d-amber)}
.tile--coral{background:linear-gradient(140deg,#FFEFEA,var(--t-coral));color:var(--i-coral)}
.tile--coral .tile__ico{color:var(--d-coral)}
.tile--sky{background:linear-gradient(140deg,#EAF5FF,var(--t-sky));color:var(--i-sky)}
.tile--sky .tile__ico{color:var(--d-sky)}
.tile--violet{background:linear-gradient(140deg,#F5ECFF,var(--t-violet));color:var(--i-violet)}
.tile--violet .tile__ico{color:var(--d-violet)}

/* ---------------- 图表卡（纯 CSS 柱状图 / 环形图，不引图表库） ---------------- */
.chart{display:flex;align-items:flex-end;gap:7px;height:130px;padding:8px 0}
.chart__col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;
  align-items:center;gap:6px;height:100%}
.chart__bar{
  width:100%;border-radius:7px 7px 4px 4px;
  background:linear-gradient(180deg,var(--d-indigo),color-mix(in srgb,var(--d-indigo) 62%,#fff));
  transition:filter .18s;
}
.chart__bar--muted{background:linear-gradient(180deg,#CFC6BB,#E2DAD0)}
.chart__bar--hot{background:linear-gradient(180deg,var(--d-amber),#E8B84E)}
.chart__bar--good{background:linear-gradient(180deg,var(--d-mint),#5FCBA6)}
.chart__col:hover .chart__bar{filter:brightness(1.08)}
.chart__lab{font-size:10.5px;color:var(--ink-2);font-weight:600}
.chart__val{font-size:10.5px;font-weight:700;color:var(--ink);font-family:var(--mono)}

/* 环形图（用 conic-gradient，零依赖） */
.donut{width:128px;height:128px;border-radius:50%;position:relative;flex:none;
  box-shadow:var(--raise-sm)}
.donut::after{content:"";position:absolute;inset:26px;border-radius:50%;
  background:var(--base);box-shadow:var(--inset-sm)}
.donut__c{position:absolute;inset:0;display:grid;place-items:center;z-index:2;text-align:center}
.donut__n{font-size:21px;font-weight:800;font-family:var(--mono);letter-spacing:-.03em}
.donut__l{font-size:10px;color:var(--ink-2);font-weight:600}
.legend{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px;min-width:0;flex:1}
.legend li{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--ink-1);
  font-weight:600}
.legend__dot{width:10px;height:10px;border-radius:3px;flex:none}
.legend__n{margin-left:auto;font-family:var(--mono);font-weight:700;color:var(--ink)}

/* 热力网格（图2 出勤率） */
.heat{display:grid;grid-template-columns:repeat(10,1fr);gap:5px}
.heat i{aspect-ratio:1;border-radius:6px;background:#E6DCD1;box-shadow:var(--inset-sm)}
.heat i[data-l="1"]{background:#CFE3FB}
.heat i[data-l="2"]{background:#A6CCF7}
.heat i[data-l="3"]{background:#6FA9EE}
.heat i[data-l="4"]{background:#3B7FD4}

/* 进度条 */
.bar{height:9px;border-radius:999px;background:#E6DCD1;box-shadow:var(--inset-sm);overflow:hidden}
.bar > i{display:block;height:100%;border-radius:999px;
  background:linear-gradient(90deg,var(--d-indigo),#6C7BE8)}

/* 通知流（图2 右侧） */
.feed{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.feed li{display:flex;gap:11px;align-items:flex-start;font-size:12.5px}
.feed__av{width:30px;height:30px;border-radius:50%;flex:none;display:grid;place-items:center;
  font-size:11px;font-weight:800;box-shadow:var(--raise-sm)}
.feed__t{color:var(--ink);font-weight:600;line-height:1.5}
.feed__m{color:var(--ink-2);font-size:11.5px}

/* ---- 图表卡等高与热力图铺满（避免一侧留大片空白）---- */
.chart--tall{height:196px}
.heat--wide{grid-template-columns:repeat(40,1fr);gap:5px}
@media(max-width:1100px){.heat--wide{grid-template-columns:repeat(20,1fr)}}
@media(max-width:900px){.heat--wide{grid-template-columns:repeat(10,1fr)}}
/* 热力格不强制正方，避免 80 个格子撑出大片空白 */
.heat--wide i{aspect-ratio:auto;height:26px}
.heat--wide i{border-radius:7px}

/* 图表标签：最多一行，超出用省略号（避免撑破柱宽） */
.chart__lab{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}

/* ---- 主视觉横幅（参考图3 的大面积渐变卡）----
   用高饱和渐变提供"色彩震撼"，但文字压在最亮的区域，
   对比度实测 > 7:1，不会牺牲可读性。 */
.hero{
  display:flex;align-items:center;gap:28px;flex-wrap:wrap;
  border-radius:26px;padding:26px 30px;margin-bottom:22px;
  background:linear-gradient(120deg,#A9F0D1 0%,#8FD9F5 46%,#A9B8FF 100%);
  color:#0C2B26;box-shadow:var(--raise);
  position:relative;overflow:hidden;
}
.hero::after{  /* 一层柔光，避免大面积纯色显得平 */
  content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 140% at 88% 10%,rgba(255,255,255,.55),transparent 58%);
}
.hero__main{position:relative;z-index:1;min-width:0}
.hero__k{font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.78}
.hero__n{font-size:54px;font-weight:800;line-height:1;letter-spacing:-.045em;
  font-family:var(--mono);margin:8px 0 6px}
.hero__sub{font-size:12.5px;font-weight:600;opacity:.8}
.hero__side{position:relative;z-index:1;margin-left:auto;display:flex;gap:26px;flex-wrap:wrap}
.hero__m{min-width:104px}
.hero__m b{display:block;font-size:23px;font-weight:800;font-family:var(--mono);letter-spacing:-.03em}
.hero__m span{font-size:11.5px;font-weight:600;opacity:.78}
@media(max-width:700px){ .hero__n{font-size:42px} .hero__side{margin-left:0} }

/* ============================================================
   撞色扩展层（2026-10-14）
   ------------------------------------------------------------
   背景：拟态皮肤上线后，只有工作台是彩色的，文章 / 编辑器 / 媒体库 /
   账号 / 审计 / 发布 / 登录全部是同一片暖米白，读起来单调、也分不清
   「我现在在哪一屏」。这一层在**不改动拟态光影语言**的前提下补三件事：
     1) 每个页面一个语义主色（--pg / --pg-s / --pg-i），贯穿页头、表头、
        主按钮、链接与选中态；
     2) 每个内容区块一个色系（编辑器分组、状态徽章、角色徽章）；
     3) 补齐此前只有标记、没有样式的组件：媒体网格、评论线程、差异对比。

   颜色全部沿用工作台已实测的六色（文字对比度 8.7–11:1）：
     靛蓝=结构/主操作   薄荷=已完成   琥珀=待办   珊瑚=风险   天蓝=信息   紫=创作
   ============================================================ */
:root{
  --c-indigo:#3B4BC8; --s-indigo:#E4E7FF; --i-indigo:#26296E;
  --c-mint:#1F9E76;   --s-mint:#DDF5EC;   --i-mint:#0D4A36;
  --c-amber:#C78510;  --s-amber:#FDEFD3;  --i-amber:#5C3D05;
  --c-coral:#DB5A38;  --s-coral:#FFE4DC;  --i-coral:#6B2614;
  --c-sky:#1F7FC4;    --s-sky:#DCEFFF;    --i-sky:#0F3E63;
  --c-violet:#7B45C9; --s-violet:#EEE0FF; --i-violet:#3A1A66;
  /* 页面主色（默认靛蓝；由 <body data-accent> 覆盖） */
  --pg:var(--c-indigo); --pg-s:var(--s-indigo); --pg-i:var(--i-indigo);
}
body[data-accent="indigo"]{--pg:var(--c-indigo);--pg-s:var(--s-indigo);--pg-i:var(--i-indigo)}
body[data-accent="mint"]  {--pg:var(--c-mint);  --pg-s:var(--s-mint);  --pg-i:var(--i-mint)}
body[data-accent="amber"] {--pg:var(--c-amber); --pg-s:var(--s-amber); --pg-i:var(--i-amber)}
body[data-accent="coral"] {--pg:var(--c-coral); --pg-s:var(--s-coral); --pg-i:var(--i-coral)}
body[data-accent="sky"]   {--pg:var(--c-sky);   --pg-s:var(--s-sky);   --pg-i:var(--i-sky)}
body[data-accent="violet"]{--pg:var(--c-violet);--pg-s:var(--s-violet);--pg-i:var(--i-violet)}

/* ---------------- 页头：每屏一块带主色的题头 ---------------- */
.page-head{
  display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;
  padding:18px 22px;margin:0 0 20px;border-radius:var(--r-card);
  background:var(--base);box-shadow:var(--raise);
  position:relative;overflow:hidden;
}
.page-head::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;
  background:var(--pg)}
.page-head__ico{
  width:48px;height:48px;border-radius:15px;flex:none;
  display:grid;place-items:center;font-size:21px;font-weight:800;
  background:var(--pg-s);color:var(--pg-i);box-shadow:var(--raise-sm);
}
.page-head__main{min-width:0;flex:1}
.page-head h1{font-size:23px;line-height:1.25;margin:0 0 4px}
.page-head__sub{font-size:12.5px;color:var(--ink-2);font-weight:600;line-height:1.6}
.page-head__acts{margin-left:auto;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.page-head__chip{
  display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:var(--r-full);
  font-size:11.5px;font-weight:700;background:var(--pg-s);color:var(--pg-i);
}
@media(max-width:620px){
  .page-head{padding:16px}
  .page-head__ico{width:40px;height:40px;border-radius:13px;font-size:18px}
  .page-head h1{font-size:20px}
  .page-head__acts{margin-left:0;width:100%}
}

/* ---------------- 卡片：题头图标 + 主色轨 ---------------- */
.card__hd .card__ico{
  width:30px;height:30px;border-radius:10px;flex:none;display:grid;place-items:center;
  font-size:14px;background:var(--pg-s);color:var(--pg-i);box-shadow:var(--raise-sm);
}
.card--accent{box-shadow:var(--raise),inset 4px 0 0 var(--pg)}

/* ---------------- 主按钮与链接跟随页面主色 ---------------- */
.btn--primary{background:var(--pg);box-shadow:var(--raise-sm),0 0 0 1px rgba(0,0,0,.06)}
.btn--primary:hover{background:var(--pg);filter:brightness(.93);box-shadow:var(--raise)}
.btn--primary:active{filter:brightness(.88)}
.btn--tint{background:var(--pg-s);color:var(--pg-i);box-shadow:var(--inset-sm)}
.btn--tint:hover{color:var(--pg-i);box-shadow:var(--raise-sm)}
a.link-strong{font-weight:600;color:var(--pg-i)}
a.link-strong:hover{color:var(--pg);text-decoration:underline;text-underline-offset:3px}

/* ---------------- 表格：表头带主色，行悬停带色 ---------------- */
thead th{background:var(--pg-s);color:var(--pg-i)}
tbody tr:hover td{background:var(--pg-s)}
tbody tr:hover td:first-child{box-shadow:inset 3px 0 0 var(--pg),inset 0 -1px 0 rgba(214,200,189,.45)}
.tablewrap table.dif{font-family:var(--mono);font-size:12.5px}

/* ---------------- 状态 / 角色徽章：实心撞色 ---------------- */
.pill{padding:4px 11px}
.pill--published{background:var(--s-mint);color:var(--i-mint)}
.pill--draft{background:var(--s-amber);color:var(--i-amber)}
.pill--in_review{background:var(--s-indigo);color:var(--i-indigo)}
.pill--changes_requested{background:var(--s-coral);color:var(--i-coral)}
.pill--archived{background:#E6DCD1;color:#4A443D}
.pill--admin,.pill--root{background:var(--s-violet);color:var(--i-violet)}
.pill--reviewer{background:var(--s-sky);color:var(--i-sky)}
.pill--editor{background:var(--s-mint);color:var(--i-mint)}
.pill--viewer{background:#E6DCD1;color:#4A443D}

/* ---------------- 侧栏：分组配色 + 选中态着色 ---------------- */
.sidebar__sec{white-space:nowrap}
.sidebar__sec::before{content:"";width:7px;height:7px;border-radius:3px;background:var(--c-indigo);
  display:inline-block;vertical-align:middle;margin-right:7px}
.sidebar__sec--collab::before{background:var(--c-amber)}
.sidebar__sec--admin::before{background:var(--c-violet)}
.navitem--content .navitem__ico{color:var(--c-indigo)}
.navitem--collab .navitem__ico{color:var(--c-amber)}
.navitem--admin .navitem__ico{color:var(--c-violet)}
.navitem--content[aria-current="page"]{background:var(--s-indigo);color:var(--i-indigo)}
.navitem--content[aria-current="page"] .navitem__ico,
.navitem--content[aria-current="page"] .navitem__badge{color:var(--i-indigo)}
.navitem--content[aria-current="page"]::after{background:var(--c-indigo);box-shadow:0 0 6px var(--c-indigo)}
.navitem--collab[aria-current="page"]{background:var(--s-amber);color:var(--i-amber)}
.navitem--collab[aria-current="page"] .navitem__ico,
.navitem--collab[aria-current="page"] .navitem__badge{color:var(--i-amber)}
.navitem--collab[aria-current="page"]::after{background:var(--c-amber);box-shadow:0 0 6px var(--c-amber)}
.navitem--admin[aria-current="page"]{background:var(--s-violet);color:var(--i-violet)}
.navitem--admin[aria-current="page"] .navitem__ico,
.navitem--admin[aria-current="page"] .navitem__badge{color:var(--i-violet)}
.navitem--admin[aria-current="page"]::after{background:var(--c-violet);box-shadow:0 0 6px var(--c-violet)}
.sidebar__brand .mark{background:linear-gradient(135deg,var(--c-indigo),var(--c-violet));color:#fff;
  box-shadow:var(--raise-sm)}

/* ---------------- 编辑器：分组色轨 + 常驻操作条 ---------------- */
details.grp{--gc:var(--pg);--gs:var(--pg-s);--gi:var(--pg-i)}
details.grp.grp--core{--gc:var(--c-indigo);--gs:var(--s-indigo);--gi:var(--i-indigo)}
details.grp.grp--body{--gc:var(--c-violet);--gs:var(--s-violet);--gi:var(--i-violet)}
details.grp.grp--search{--gc:var(--c-sky);--gs:var(--s-sky);--gi:var(--i-sky)}
details.grp.grp--src{--gc:var(--c-mint);--gs:var(--s-mint);--gi:var(--i-mint)}
details.grp.grp--maint{--gc:var(--c-amber);--gs:var(--s-amber);--gi:var(--i-amber)}
details.grp.grp--prep{--gc:var(--c-coral);--gs:var(--s-coral);--gi:var(--i-coral)}
details.grp.grp--comments{--gc:var(--c-violet);--gs:var(--s-violet);--gi:var(--i-violet)}
details.grp[open]{box-shadow:var(--raise),inset 5px 0 0 var(--gc)}
details.grp[open]>summary{color:var(--gi)}
details.grp[open]>summary::before{background:var(--gc);box-shadow:0 0 7px var(--gc)}
details.grp:not([open])>summary::before{background:#CFC3B7}
.editor-actions{
  position:sticky;top:58px;z-index:18;display:flex;gap:10px;align-items:center;flex-wrap:wrap;
  padding:10px 14px;margin:0 0 20px;border-radius:var(--r-btn);
  background:var(--base);box-shadow:var(--raise);
}
.editor-actions .sp{flex:1}
@media(max-width:860px){.editor-actions{position:static}}

/* ---------------- 媒体库网格（此前只有标记、没有样式）---------------- */
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(258px,1fr));gap:18px}
.mcard{
  display:flex;flex-direction:column;overflow:hidden;
  background:var(--base);border-radius:var(--r-card);box-shadow:var(--raise);
}
.mcard__img{
  aspect-ratio:16/10;display:grid;place-items:center;overflow:hidden;
  background:var(--base-2);box-shadow:var(--inset-sm);
}
.mcard__img img{width:100%;height:100%;object-fit:cover;display:block}
.mcard__bd{padding:14px 16px 4px}
.mcard__alt{
  font-size:12.5px;font-weight:600;color:var(--ink);line-height:1.55;margin-bottom:6px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.mcard__alt--missing{color:var(--c-coral)}
.mcard__ft{
  display:flex;gap:8px;align-items:center;flex-wrap:wrap;
  padding:12px 16px 16px;margin-top:auto;box-shadow:inset 0 1px 0 rgba(214,200,189,.5);
}
@media(max-width:620px){.mgrid{grid-template-columns:1fr}}

/* ---------------- 审核评论线程（此前只有标记、没有样式）---------------- */
.cmt{background:var(--base);border-radius:var(--r-btn);box-shadow:var(--raise-sm);
  padding:14px 16px;margin-bottom:12px}
.cmt--done{box-shadow:var(--inset-sm);background:var(--s-mint)}
.cmt__hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12.5px;margin-bottom:6px}
.cmt__bd{font-size:13.5px;color:var(--ink);line-height:1.7}
.cmt__ft{display:flex;justify-content:flex-end;margin-top:10px}

/* ---------------- 修订差异（此前只有标记、没有样式）---------------- */
.dif-same td{color:var(--ink-2)}
.dif-del td{background:var(--s-coral);color:var(--i-coral)}
.dif-add td{background:var(--s-mint);color:var(--i-mint)}
.dif-n{width:34px;text-align:center;font-weight:800;color:var(--ink-3)}

/* ---------------- 工作台明细两列 ---------------- */
.dash-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
@media(max-width:1100px){.dash-cols{grid-template-columns:1fr}}

/* ---------------- 筛选状态条 ---------------- */
.filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.filters__chip{
  display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:var(--r-full);
  font-size:12px;font-weight:700;background:var(--pg-s);color:var(--pg-i);box-shadow:var(--inset-sm);
}
.filters__chip a{color:var(--pg-i);opacity:.7;font-weight:800}
.filters__chip a:hover{opacity:1}
.dot{width:8px;height:8px;border-radius:3px;flex:none;display:inline-block;margin-right:7px;vertical-align:middle}

/* ---------------- 无障碍工具类 ---------------- */
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* ---------------- 登录页：撞色边与品牌键帽 ---------------- */
.login-wrap .card{position:relative;overflow:hidden}
.login-wrap .card::before{content:"";position:absolute;left:0;right:0;top:0;height:7px;
  background:linear-gradient(90deg,var(--c-mint),var(--c-sky),var(--c-violet),var(--c-amber))}
.login-brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}
.login-brand .mark{width:44px;height:44px;border-radius:14px;flex:none;display:grid;place-items:center;
  font-size:18px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--c-indigo),var(--c-violet));
  box-shadow:var(--raise-sm)}
.login-brand b{display:block;font-size:16px}
.login-brand span{font-size:11.5px;color:var(--ink-2);font-weight:600}

/* 移动端：品牌名不换行、分组标签隐藏（拟态层新增的规则在媒体查询之后，
   必须在末尾再声明一次，否则 860px 断点会被覆盖） */
@media(max-width:860px){
  .sidebar__sec{display:none}
  .sidebar__brand{white-space:nowrap;flex:none;padding:0 8px 0 0}
}

/* ============================================================
   2026-10 refresh: pure-white neumorphism + stronger navigation
   ============================================================ */
:root{
  --base:#FFFFFF;
  --base-2:#F4F6F9;
  --hi:#FFFFFF;
  --lo:#D7DDE6;
  --ink:#121821;
  --ink-2:#3E4958;
  --ink-3:#657181;
  --raise:-5px -5px 12px rgba(255,255,255,.98), 5px 6px 15px rgba(126,139,158,.24);
  --raise-sm:-2px -2px 6px rgba(255,255,255,.98), 3px 3px 9px rgba(126,139,158,.22);
  --raise-lg:-8px -8px 20px rgba(255,255,255,.98), 9px 10px 24px rgba(126,139,158,.26);
  --inset:inset 4px 4px 10px rgba(126,139,158,.22), inset -4px -4px 10px rgba(255,255,255,.98);
  --inset-sm:inset 2px 2px 6px rgba(126,139,158,.2), inset -2px -2px 6px rgba(255,255,255,.98);
  --inset-deep:inset 6px 6px 14px rgba(126,139,158,.24), inset -6px -6px 14px rgba(255,255,255,.98);
}
body{background:#fff}
.sidebar{background:#fff;border-right:1px solid #E8ECF2}
.sidebar__brand{font-weight:800;color:#0B1220}
.sidebar__sec{font-weight:800;color:#344054;letter-spacing:.12em}
.navitem{color:#1E293B;font-weight:700;background:#fff}
.navitem:hover{color:#0B1220}
.navitem[aria-current="page"]{font-weight:800}
.navitem__ico{color:#475467;font-weight:800}
.navitem__badge{color:#344054;font-weight:800}
.me strong{font-weight:800}
.topbar{background:#fff}
.card,.page-head,.editor-actions,details.grp{background:#fff}
tbody tr{background:#fff}
tbody tr:hover td{background:#F5F7FA}
.mcard,.cmt{background:#fff}

/* Login: full-screen stage with restrained motion and geometric background. */
.login-body{background:#fff}
.login-page{
  min-height:100dvh;display:grid;place-items:center;position:relative;overflow:hidden;
  padding:32px 20px;
  background:
    linear-gradient(135deg,rgba(228,231,255,.92) 0%,rgba(255,255,255,.97) 36%,rgba(221,245,236,.78) 68%,rgba(253,239,211,.78) 100%);
}
.login-page::before{
  content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:radial-gradient(rgba(38,41,110,.13) 1px,transparent 1.2px);
  background-size:12px 12px;
  mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.28) 64%,transparent 100%);
}
.login-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.login-bg i{position:absolute;display:block;border-radius:18px;border:1px solid rgba(38,41,110,.12);
  box-shadow:0 22px 55px -42px rgba(18,24,33,.6)}
.login-bg i:nth-child(1){width:180px;height:180px;left:6%;top:12%;transform:rotate(18deg);
  background:linear-gradient(135deg,rgba(169,149,255,.28),rgba(228,231,255,.76));
  animation:fxLoginDriftA 13s ease-in-out infinite}
.login-bg i:nth-child(2){width:112px;height:112px;right:9%;top:16%;transform:rotate(-12deg);
  background:linear-gradient(135deg,rgba(31,158,118,.2),rgba(221,245,236,.9));
  animation:fxLoginDriftB 11s ease-in-out infinite}
.login-bg i:nth-child(3){width:240px;height:56px;left:12%;bottom:11%;transform:rotate(-8deg);
  background:linear-gradient(90deg,rgba(253,239,211,.9),rgba(199,133,16,.18));
  animation:fxLoginDriftA 15s ease-in-out infinite reverse}
.login-bg i:nth-child(4){width:120px;height:120px;right:14%;bottom:8%;transform:rotate(22deg);
  background:linear-gradient(135deg,rgba(31,127,196,.18),rgba(220,239,255,.9));
  animation:fxLoginDriftB 14s ease-in-out infinite}
.login-page .login-wrap{width:min(100%,430px);margin:0;padding:0;position:relative;z-index:2}
.login-page .login-wrap .card{padding:38px 34px;border-radius:28px;box-shadow:0 30px 80px -48px rgba(26,41,74,.65),var(--raise);
  animation:fxLoginPanel .68s cubic-bezier(.16,1,.3,1) both}
.login-page .login-wrap .card::before{height:8px}
.login-page .login-brand .mark{animation:fxLoginMark 3.8s ease-in-out infinite}
.login-page .login-wrap .btn--primary{position:relative;overflow:hidden}
.login-page .login-wrap .btn--primary::after{
  content:"";position:absolute;inset:0;transform:translateX(-120%);
  background:linear-gradient(100deg,transparent 20%,rgba(255,255,255,.44) 50%,transparent 80%);
  animation:fxLoginShine 3.8s ease-in-out infinite;
}
.login-foot{text-align:center;color:var(--ink-2);font-size:11.5px;margin-top:18px;line-height:1.7}
@keyframes fxLoginPanel{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none}}
@keyframes fxLoginMark{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(-3deg)}}
@keyframes fxLoginShine{0%,55%{transform:translateX(-120%)}85%,100%{transform:translateX(130%)}}
@keyframes fxLoginDriftA{0%,100%{translate:0 0}50%{translate:10px -14px}}
@keyframes fxLoginDriftB{0%,100%{translate:0 0}50%{translate:-12px 12px}}

/* Taxonomy management page. */
.tax-intro{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:20px;align-items:start}
.tax-create{display:grid;grid-template-columns:1fr 1.2fr auto;gap:14px;align-items:end}
.tax-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.tax-card{background:#fff;border-radius:var(--r-card);box-shadow:var(--raise);padding:20px;min-width:0}
.tax-card__hd{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.tax-card__dot{width:10px;height:10px;border-radius:4px;background:var(--tax-c,var(--pg));flex:none}
.tax-card__id{font-family:var(--mono);font-size:11px;color:var(--ink-3);margin-left:auto}
.tax-domain-form{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-bottom:14px}
.tax-cats{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.tax-cat{display:flex;gap:8px;align-items:center;flex-wrap:wrap;
  padding:9px;border-radius:14px;background:#F8FAFC;box-shadow:var(--inset-sm)}
.tax-cat__edit{display:flex;align-items:center;gap:8px;flex:1;min-width:220px}
.tax-cat__edit input{min-height:34px;padding:6px 10px;font-size:12.5px}
.tax-cat__id{font-family:var(--mono);font-size:10.5px;color:var(--ink-3);margin-top:2px;width:100%}
.tax-add{border-top:1px solid #E8ECF2;padding-top:14px}
.tax-add summary{cursor:pointer;font-size:12.5px;font-weight:800;color:var(--pg-i)}
.tax-add__grid{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-top:12px}
.tax-stat{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--ink-2)}
@media(max-width:1040px){.tax-intro,.tax-grid{grid-template-columns:1fr}}
@media(max-width:620px){
  .tax-create,.tax-domain-form,.tax-cat,.tax-add__grid{grid-template-columns:1fr}
  .login-page{padding:20px 14px}
  .login-page .login-wrap .card{padding:30px 22px}
}
@media(prefers-reduced-motion:reduce){
  .login-bg i,.login-page .login-wrap .card,.login-page .login-brand .mark,.login-page .login-wrap .btn--primary::after{animation:none!important}
}

/* ============================================================
   依据 UI/UX 规范落地的可达性与交互修正
   （来源：ui-ux-pro-max skill 的 ux / icons / chart 域）
   ============================================================ */

/* ---- 图标：内联 SVG 基础样式 ---- */
.fx-icon{display:inline-block;vertical-align:-0.18em;flex:none;
  /* 描边图标在小尺寸下用非缩放笔画更清晰 */
  shape-rendering:geometricPrecision}
.navitem .fx-icon{color:inherit}
.page-head__ico .fx-icon,.card__ico .fx-icon,.empty__ico .fx-icon{color:inherit}

/* ---- 规范 P1：所有可交互元素必须有可见焦点环 ----
   原先只有 .btn 有 focus-visible，链接/导航/卡片/分页都缺。
   这是规范里标为 CRITICAL 的项：键盘用户必须能看见焦点在哪。 */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
summary:focus-visible,
[tabindex]:focus-visible{
  outline:3px solid var(--accent);
  outline-offset:2px;
  border-radius:10px;
}
/* 卡片/磁贴这类整块可点区域，焦点环画在内侧避免被裁切 */
.tile:focus-visible,.stat:focus-visible{outline-offset:-3px}

/* ---- 规范 P2：可点击元素一律 cursor:pointer ---- */
.btn,button,.navitem,.tile,.stat,a,.pager__btn,.fx-chip,summary,
input[type=checkbox],input[type=radio],select,label[for]{cursor:pointer}
.btn[disabled],button[disabled]{cursor:not-allowed}

/* ---- 规范 P1：触控目标不小于 44×44（移动端）----
   桌面端保持紧凑，触屏设备上放大命中区。 */
@media (pointer:coarse){
  .btn{min-height:44px}
  .btn--sm{min-height:40px}
  .navitem{min-height:48px}
  .pager__btn{min-width:44px;height:44px}
  input,select{min-height:44px}
  /* 小图标按钮的命中区外扩，但不改变视觉尺寸 */
  .check a,.toc a{padding-top:10px;padding-bottom:10px}
}

/* ---- 规范 P2：正文行高 1.5–1.75；正文不小于 12px ---- */
body{line-height:1.6}
.field__help,.muted{line-height:1.6;font-size:12px}
.cmt__bd{line-height:1.7}
.check li{line-height:1.55}
td,th{line-height:1.5}

/* ---- 规范 P2：过渡 150–300ms，且不针对 width/height（会触发布局抖动）---- */
.btn,.navitem,.tile,.stat,.fx-chip,.pager__btn{
  transition-property:box-shadow,transform,color,background-color,border-color;
  transition-duration:200ms;
  transition-timing-function:cubic-bezier(.34,1.56,.64,1);
}

/* ---- 规范 P2：加载反馈（骨架屏 + aria-busy），避免界面"冻住" ---- */
.skeleton{
  background:linear-gradient(90deg,var(--bg-2) 25%,var(--bg-3) 37%,var(--bg-2) 63%);
  background-size:400% 100%;
  animation:sk 1.4s ease infinite;
  border-radius:8px;color:transparent!important;user-select:none;
}
@keyframes sk{0%{background-position:100% 50%}100%{background-position:0 50%}}
[aria-busy="true"]{position:relative}
/* 表格加载时给整块加轻微降透明，明确"正在刷新" */
[aria-busy="true"] .tablewrap{opacity:.55;transition:opacity .2s}

/* ---- 规范 P2：错误必须对读屏可见（role=alert / aria-live）---- */
.alert--err{font-weight:600}
.field__err{display:flex;align-items:center;gap:6px}

/* ---- 规范：尊重 reduced-motion（动画全部关闭，但保留最终态）---- */
@media (prefers-reduced-motion:reduce){
  .skeleton{animation:none;background:var(--bg-2)}
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
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
  function navItem(href, ico, label, key, badge, sec) {
    return '<a class="navitem navitem--' + (sec || "content") + '" href="' + href + '"' + (cur === key ? ' aria-current="page"' : '') + '>' +
      '<span class="navitem__ico" aria-hidden="true">' + ico + '</span>' +
      '<span>' + esc(label) + '</span>' +
      (badge ? '<span class="navitem__badge">' + badge + '</span>' : '') +
      '</a>';
  }
  let nav = "";
  if (user) {
    nav = '<div class="sidebar__sec">内容</div><nav class="sidebar__nav">' +
      navItem("/dashboard", icon("dashboard"), "工作台", "dashboard", null, "content") +
      navItem("/articles", icon("articles"), "文章", "articles", opts.counts && opts.counts.articles, "content") +
      navItem("/articles/new", icon("plus"), "新建文章", "new", null, "content") +
      navItem("/media", icon("media"), "媒体库", "media", null, "content") +
      '</nav>' +
      (isReviewer ? '<div class="sidebar__sec sidebar__sec--collab">协作</div><nav class="sidebar__nav">' +
        navItem("/audit", icon("audit"), "审计日志", "audit", null, "collab") +
        navItem("/publish", icon("publish"), "发布", "publish", null, "collab") + '</nav>' :
        '<div class="sidebar__sec sidebar__sec--collab">协作</div><nav class="sidebar__nav">' +
        navItem("/publish", icon("publish"), "发布", "publish", null, "collab") + '</nav>') +
      (isAdmin ? '<div class="sidebar__sec sidebar__sec--admin">管理</div><nav class="sidebar__nav">' +
        navItem("/users", icon("users"), "账号", "users", null, "admin") +
        navItem("/taxonomy", icon("taxonomy"), "领域与分类", "taxonomy", null, "admin") +
        navItem("/security", icon("security"), "账号安全", "security", null, "admin") + '</nav>' : "");
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
    '<body class="' + esc(opts.bodyClass || "") + '" data-accent="' + esc(opts.accent || "indigo") + '" data-upload-endpoint="/media/upload" data-csrf="' + esc(opts.csrf || "") + '">\n' +
    '<div id="live" aria-live="polite" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip(0 0 0 0)"></div>' +
    inner +
    '\n<script src="/static/app.js" defer></script>\n' +
    // 页面级脚本：editor.js 只在编辑器页引入（元素缺失即跳过，见 public/editor.js）。
    // 修复：该文件此前在 server.cjs 有路由、却没有任何页面引用，
    //       导致正文导航、骨架插入、图片上传、领域联动、快捷键、字数统计全部失效。
    (opts.scripts || []).map(function (src) {
      return '<script src="' + esc(src) + '" defer></script>\n';
    }).join("") +
    '</body>\n</html>';
}
function statusLabel(s) {
  return ({ published: "已发布", draft: "草稿", in_review: "审核中",
            changes_requested: "退回修改", archived: "归档" })[s] || s || "未知";
}

/* ---------------- 统一页头 ----------------
   拟态皮肤上线后各页标题都是一行裸 <h1>，既没有层次也没有颜色。
   这里统一成「色块图标 + 标题 + 说明 + 操作区」的题头，颜色跟随 body[data-accent]。 */
function pageHead(opts) {
  opts = opts || {};
  return '<div class="page-head">' +
    (opts.ico ? '<div class="page-head__ico">' + icon(opts.ico, 22) + "</div>" : "") +
    '<div class="page-head__main">' +
      "<h1>" + esc(opts.title || "") + "</h1>" +
      (opts.sub ? '<div class="page-head__sub">' + opts.sub + "</div>" : "") +
    "</div>" +
    (opts.acts ? '<div class="page-head__acts">' + opts.acts + "</div>" : "") +
    "</div>";
}

function loginPage(opts) {
  opts = opts || {};
  const err = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";
  const info = opts.info ? '<div class="alert alert--info" role="status">' + esc(opts.info) + "</div>" : "";
  return layout("登录",
    '<div class="login-page">' +
    '<div class="login-bg" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
    '<div class="login-wrap"><div class="card">' +
    '<div class="login-brand"><span class="mark" aria-hidden="true">修</span>' +
      '<span><b>修盒子 · 内容后台</b><span>FIXBOX 内容协作与发布</span></span></div>' +
    "<h1>登录内容后台</h1>" +
    '<p class="muted" style="margin:0 0 22px">仅限内部编辑人员使用。账号由管理员分发。</p>' +
    err + info +
    '<form method="post" action="/login">' +
    '<label for="email">邮箱</label><input id="email" name="email" type="email" required autocomplete="username" autofocus>' +
    '<label for="password">密码</label><input id="password" name="password" type="password" required autocomplete="current-password">' +
    '<div style="margin-top:20px"><button class="btn btn--primary" type="submit" style="width:100%">登录</button></div>' +
    "</form></div>" +
    '<p class="muted" style="text-align:center">账号信息仅用于内容协作。请勿分享登录凭据。</p></div>',
    { nav: false, accent: "indigo", bodyClass: "login-body" });
}

function changePasswordPage(opts) {
  opts = opts || {};
  const err = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";
  const forced = opts.forced ? '<div class="alert alert--info" role="status">这是首次登录（或密码已被重置），必须先设置新密码才能继续。</div>' : "";
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
  // 领域 → 色系：给列表加一个可扫读的色点（沿用工作台六色）
  const DOM_COLOR = {
    "net-basic": "sky", "win-system": "indigo", "router": "mint", "ip-dns": "violet",
    "win-app": "amber", "mac-system": "coral", "mac-app": "coral", "hardware": "indigo",
    "peripheral": "mint", "proxy-vpn": "amber", "account-sec": "coral", "data-backup": "sky"
  };
  function domColor(id) { return DOM_COLOR[id] || "indigo"; }

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
      '<td><span class="dot" style="background:var(--c-' + domColor(a.domain) + ')"></span>' +
        esc(domName(a.domain)) + '<div class="muted">' + esc(catName(a.category)) + "</div></td>" +
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
    : '<tr><td colspan="7" class="empty"><div class="empty__ico">' + icon("empty", 24) + "</div>" +
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

  // 生效中的筛选用彩色胶囊回显——原先只能靠「清除」按钮猜测当前过滤了什么
  function chip(label, href) {
    return '<span class="filters__chip">' + esc(label) +
      '<a href="' + href + '" aria-label="移除筛选：' + esc(label) + '" title="移除该筛选">✕</a></span>';
  }
  const chips = [];
  if (f.q) chips.push(chip("搜索：" + f.q, qs({ q: "", page: "" })));
  if (f.status) chips.push(chip("状态：" + statusLabel(f.status), qs({ status: "", page: "" })));
  if (f.domain) chips.push(chip("领域：" + domName(f.domain), qs({ domain: "", page: "" })));
  if (f.risk) chips.push(chip("风险：" + f.risk, qs({ risk: "", page: "" })));
  if (f.stale) chips.push(chip("超 180 天未复核", qs({ stale: "", page: "" })));
  if (f.missing) chips.push(chip("缺参考资料", qs({ missing: "", page: "" })));
  const activeFilters = chips.length
    ? '<div class="filters">' + chips.join("") +
      '<a class="btn btn--sm btn--ghost" href="/articles">全部清除</a></div>'
    : "";

  return layout("文章",
    pageHead({
      ico: "articles",
      title: "文章",
      sub: (opts.filtered !== opts.total
              ? "筛选出 <strong>" + (opts.filtered || 0) + "</strong> / 共 " + (opts.total || 0) + " 篇"
              : "共 <strong>" + (opts.total || 0) + "</strong> 篇")
            + " · 内容真源为 content/fixboxs/*.md，发布即提交并构建",
      acts: (canCreate ? '<a class="btn btn--primary" href="/articles/new">＋ 新建文章</a>' : "")
    }) +
    (opts.notice ? '<div class="alert alert--ok" role="status">' + esc(opts.notice) + "</div>" : "") +

    activeFilters +
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
    Object.assign({ current: "articles", accent: "indigo", crumbs: [{ label: "文章" }] }, opts));
}
function editorPage(opts) {
  const m = opts.meta || {};
  const isNew = !opts.isExisting;
  const tax = opts.taxonomy;
  const err = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";
  const ok = opts.notice ? '<div class="alert alert--ok" role="status">' + esc(opts.notice) + "</div>" : "";

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
      // 用 SVG 替代 ✓ / ! / ✗ 字形：字形在不同平台字重不一致，SVG 笔画统一
      const icoName = c.level === "ok" ? "check" : (c.level === "warn" ? "warning" : "rejected");
      return '<li class="check--' + c.level + '"><span class="check__ic">' + icon(icoName, 14) + "</span>" +
        '<a href="#f-' + c.target + '" data-jump="' + c.target + '">' + esc(c.label) + "</a></li>";
    }).join("") + "</ul>";
  }

  // ---- 正文段落导航（从 textarea 现算，前端渲染进侧栏）----
  const tocHost = '<ul class="toc" id="toc"><li class="muted">加载中…</li></ul>';

  const body = '<form method="post" action="' + (isNew ? "/articles/new" : "/articles/" + esc(opts.slug)) + '" id="editor" data-dirty-guard>' +
    '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
    '<input type="hidden" name="baseHash" value="' + esc(opts.contentHash || "") + '">' +
    pageHead({
      ico: isNew ? "plus" : "draft",
      title: isNew ? "新建文章" : (m.title || opts.slug),
      sub: isNew
        ? "保存后写入 content/fixboxs/_drafts/，不会影响线上；发布才进入构建"
        : '<span class="pill pill--' + esc(F.status) + '">' + esc(statusLabel(F.status)) + "</span>"
          + (opts.contentHash ? ' <span class="kbd">' + esc(opts.contentHash.slice(0, 12)) + "</span> · 他人已修改时保存会提示冲突" : "")
    }) +
    // 常驻操作条：长表单滚到一半也能直接保存/发布（原先只能滚回页首）
    '<div class="editor-actions">' +
      '<a class="btn btn--sm" href="/articles">返回</a>' +
      (opts.canManageTaxonomy ? '<a class="btn btn--sm" href="/taxonomy">领域与分类</a>' : "") +
      (isNew ? "" : '<a class="btn btn--sm" href="/articles/' + esc(opts.slug) + '/revisions">修订历史' + (opts.revCount ? " (" + opts.revCount + ")" : "") + "</a>") +
      '<span class="sp"></span>' +
      '<button class="btn" type="submit" name="action" value="save">保存草稿</button>' + buttons +
    "</div>" +

    '<div class="editor-grid">' +
      // ============ 左：字段 + 正文 ============
      '<div>' +

      // 组 1：核心（默认展开）
      '<details class="grp grp--core" open><summary>核心信息（必填）<span class="grp__hint">标题 / slug / 分类 / 风险</span></summary><div class="grp__bd">' +
        field("标题", "title", '<input id="title" name="title" type="text" value="' + esc(F.title) + '" required maxlength="60">', "用户在搜索结果里看到的就是这句，尽量含症状词。", true) +
        field("slug（URL 标识）", "slug", '<input id="slug" name="slug" type="text" value="' + esc(F.slug) + '" ' + (isNew ? "required" : "readonly") + ' pattern="[a-z0-9-]+">',
          isNew ? "仅小写字母、数字、连字符。<strong>发布后不应再改</strong>（URL 稳定性）。" : "已发布文章的 slug 不建议修改。", true) +
        '<div class="grid2">' +
          field("领域", "domain", '<select id="domain" name="domain" required><option value="">请选择</option>' + domOpts + '</select>', null, true) +
          field("分类", "category", '<select id="category" name="category" required><option value="">请选择</option>' + catOpts + '</select>',
            "分类需属于所选领域。" + (opts.canManageTaxonomy ? ' <a class="link-strong" href="/taxonomy">新增或修改</a>' : ""), true) +
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
      '<details class="grp grp--body" open><summary>正文（Markdown · 自由写作）<span class="grp__hint">右侧为段落导航</span></summary><div class="grp__bd">' +
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
      '<details class="grp grp--search" open><summary>检索与关联<span class="grp__hint">决定用户能不能搜到</span></summary><div class="grp__bd">' +
        field("症状词", "symptoms", inp("symptoms", "symptoms", F.symptoms), "用户会怎么描述这个问题？<strong>≥3 条</strong>，逗号分隔。", true) +
        field("关键词", "keywords", inp("keywords", "keywords", F.keywords), "<strong>≥5 条</strong>，含口语词与常见错别字。", true) +
        field("别名 / 口语说法", "aliases", inp("aliases", "aliases", F.aliases), "<strong>≥2 条</strong>，影响口语召回。", true) +
        field("相关教程 slug", "related", inp("related", "related", F.related), "<strong>≥2 条</strong>，逗号分隔；指向尚未撰写的文章会降级为搜索链接。", true) +
      '</div></details>' +

      // 组 4：参考资料
      '<details class="grp grp--src" open><summary>参考资料（sources）<span class="grp__hint">当前 ' + sources.length + ' 条</span></summary><div class="grp__bd">' +
        '<p class="muted" style="margin-top:0">每条含标题与 URL（均必填），类型可选。<strong>保存时不会丢失</strong>；若条数减少，系统会拦下并回滚。</p>' +
        '<div id="src-list">' + sourceRows + '</div>' +
        '<button class="btn btn--sm" type="button" id="src-add">＋ 添加一条</button>' +
      '</div></details>' +

      // 组 5：维护信息（默认折叠）
      '<details class="grp grp--maint"><summary>维护与复核<span class="grp__hint">复核周期 / 版本</span></summary><div class="grp__bd">' +
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
      '<details class="grp grp--prep"><summary>前置条件与工具<span class="grp__hint">低频字段</span></summary><div class="grp__bd">' +
        field("前置条件", "prerequisites", inp("prerequisites", "prerequisites", F.prerequisites), "逗号分隔，会渲染进「开始前确认」区块。") +
        field("所需工具", "tools", inp("tools", "tools", F.tools), "逗号分隔。") +
      '</div></details>' +

      '<div class="row row--end" style="margin-bottom:24px">' +
        '<button class="btn" type="submit" name="action" value="save">保存草稿</button>' + buttons +
      "</div>" +
      '</div>' +

      // ============ 右：检查清单 + 段落导航 ============
      '<div class="editor-side">' +
        '<div class="card card--accent" style="padding:16px">' +
          '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico">' + icon("check") + '</span><h3>发布前检查</h3></div>' +
          checklist() + '</div>' +
        '<div class="card" style="padding:16px">' +
          '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico" aria-hidden="true">¶</span><h3>段落导航</h3></div>' +
          tocHost + '</div>' +
      "</div>" +
    "</div>" +
    commentsBlock({ slug: opts.slug, comments: opts.comments || [], csrf: opts.csrf }) +
    "</form>" +
    '<template id="src-type-options">' + typeOptionsHtml + "</template>";

  return layout((isNew ? "新建文章" : "编辑：" + (m.title || opts.slug)), err + ok + body,
    Object.assign({
      current: "articles",
      accent: "violet",
      scripts: ["/static/editor.js"],
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
    pageHead({
      ico: "clock", title: "修订历史",
      sub: "每次保存都会留一份完整快照（含 front-matter），最多保留最近 30 版。",
      acts: '<a class="btn" href="/articles/' + esc(opts.slug) + '">返回文章</a>'
    }) +
    '<div class=\"card card--flush\"><div class=\"tablewrap\"><table>' +
    "<thead><tr><th>版本</th><th>时间</th><th>作者</th><th>说明</th><th>体积</th><th></th></tr></thead><tbody>" +
    (rows || '<tr><td colspan=\"6\" class=\"empty\"><div class=\"empty__ico\">' + icon("clock", 24) + '</div><div class=\"empty__t\">还没有修订记录</div><div>从本功能上线后开始的每次保存都会被记录</div></td></tr>') +
    "</tbody></table></div></div>",
    Object.assign({ current: "articles", accent: "violet", crumbs: [{ label: "文章", href: "/articles" }, { label: opts.slug, href: "/articles/" + opts.slug }, { label: "修订历史" }] }, opts));
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
    pageHead({
      ico: "⇄", title: "v" + esc(opts.rev.revision_no) + " → 当前",
      sub: "作者 " + esc(opts.rev.author_email || "—") + " · " + esc(String(opts.rev.created_at || "").slice(0, 19).replace("T", " ")),
      acts: '<a class="btn" href="/articles/' + esc(opts.slug) + '/revisions">返回历史</a>' +
            '<a class="btn" href="/articles/' + esc(opts.slug) + '">打开文章</a>'
    }) +
    '<div class=\"row\" style=\"gap:12px;margin-bottom:12px\">' +
      '<span class=\"pill pill--published\">+' + nAdd + ' 行</span>' +
      '<span class=\"pill pill--changes_requested\">−' + nDel + ' 行</span>' +
      (opts.hasCurrent ? "" : '<span class=\"pill pill--archived\">文章已不存在，无法对比</span>') +
    "</div>" +
    '<div class=\"card card--flush\"><div class=\"tablewrap\"><table class=\"dif\">' +
    "<tbody>" + (rows || '<tr><td class=\"empty\">无差异</td></tr>') + "</tbody></table></div></div>",
    Object.assign({ current: "articles", accent: "violet", crumbs: [{ label: "文章", href: "/articles" }, { label: opts.slug, href: "/articles/" + opts.slug }, { label: "修订对比" }] }, opts));
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
  return '<details class=\"grp grp--comments\"' + (list.length ? " open" : "") + '><summary>审核评论' +
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
  const TILE_COLORS = ["indigo", "mint", "amber", "coral", "sky", "violet"];

  // ---- 问候语（参考图2 顶部）----
  function greeting() {
    const h = new Date().getHours();
    const word = h < 6 ? "夜深了" : (h < 12 ? "早上好" : (h < 18 ? "下午好" : "晚上好"));
    return word;
  }
  const now = new Date();
  const dateStr = now.getFullYear() + " 年 " + (now.getMonth() + 1) + " 月 " + now.getDate() + " 日";
  const who = (opts.user && (opts.user.name || opts.user.email)) || "";

  // ---- 彩色统计磁贴（图2 结构 + 图3 撞色）----
  // 每个磁贴一个色系，颜色**承载语义**而不是随机装饰：
  //   靛蓝=待我处理  薄荷=健康  琥珀=需关注  珊瑚=有问题  天蓝=已上线  紫=其他
  function tile(key, label, hint, ico, color, href) {
    const v = s[key] === undefined ? 0 : s[key];
    const tag = href ? "a" : "div";
    // 迷你柱：值为 0 时压平变淡（对应图3「断电」语义），有值则高低起伏
    const shape = [0.45, 0.7, 0.4, 0.85, 0.55, 0.95, 0.6, 0.42, 0.75, 0.5];
    const bars = shape.map(function (b, i) {
      const h = v > 0 ? Math.round(b * 100) : Math.round(22 + (i % 3) * 4);
      return '<i class="' + (v > 0 ? "on" : "") + '" style="height:' + h + '%"></i>';
    }).join("");
    return "<" + tag + " class=\"tile tile--" + color + "\"" + (href ? " href=\"" + href + "\"" : "") + ">" +
      '<div class="tile__hd"><span class="tile__ico" aria-hidden="true">' + ico + "</span>" + esc(label) + "</div>" +
      '<div class="tile__v">' + v + "</div>" +
      (hint ? '<div class="tile__h">' + esc(hint) + "</div>" : "") +
      '<div class="tile__spark">' + bars + "</div>" +
      "</" + tag + ">";
  }

  // ---- 领域分布柱状图（真实数据，非装饰）----
  const byDomain = opts.byDomain || [];
  const maxDom = byDomain.reduce(function (m, d) { return Math.max(m, d.n); }, 1);
  const domainBars = byDomain.slice(0, 8).map(function (d) {
    const pct = Math.max(6, Math.round(d.n / maxDom * 100));
    return '<div class="chart__col" title="' + esc(d.name) + "：" + d.n + ' 篇">' +
      '<div class="chart__val">' + d.n + "</div>" +
      '<div class="chart__bar" style="height:' + pct + '%"></div>' +
      '<div class="chart__lab">' + esc(d.short || d.name) + "</div></div>";
  }).join("");

  // ---- 状态分布环形图（conic-gradient，零依赖）----
  const st = opts.byStatus || { published: 0, draft: 0, in_review: 0, changes_requested: 0, archived: 0 };
  const stTotal = Object.keys(st).reduce(function (a, k) { return a + st[k]; }, 0) || 1;
  const ST_COLORS = { published: "#1F9E76", draft: "#C78510", in_review: "#3B4BC8", changes_requested: "#DB5A38", archived: "#A99E93" };
  const ST_LABELS = { published: "已发布", draft: "草稿", in_review: "审核中", changes_requested: "退回", archived: "归档" };
  let acc = 0;
  const segs = [], legend = [];
  ["published", "draft", "in_review", "changes_requested", "archived"].forEach(function (k) {
    const n = st[k] || 0;
    if (!n) return;
    const from = acc / stTotal * 360;
    acc += n;
    const to = acc / stTotal * 360;
    segs.push(ST_COLORS[k] + " " + from.toFixed(1) + "deg " + to.toFixed(1) + "deg");
    legend.push('<li><span class="legend__dot" style="background:' + ST_COLORS[k] + '"></span>' +
      ST_LABELS[k] + '<span class="legend__n">' + n + "</span></li>");
  });
  const donutStyle = segs.length ? ("background:conic-gradient(" + segs.join(",") + ")") : "background:#E6DCD1";

  // ---- 近 12 周更新热力（真实数据，来自 front-matter 的 updated）----
  const heat = opts.heat || [];
  const heatCells = heat.map(function (c) {
    return '<i data-l="' + (c.level || 0) + '" title="' + esc(c.label) + '：' + c.n + ' 篇更新"></i>';
  }).join("");

  const recentRows = (opts.recent || []).map(function (a) {
    return "<tr><td><a class=\"link-strong\" href=\"/articles/" + esc(a.slug) + "\">" + esc(a.title || a.slug) + "</a>" +
      '<div class="slug">' + esc(a.slug) + "</div></td>" +
      '<td><span class="pill pill--' + esc(a.status) + '">' + esc(statusLabel(a.status)) + "</span></td>" +
      '<td class="muted tight">' + esc(a.updated || "") + "</td>" +
      '<td class="muted tight">' + esc(a.reviewer || "—") + "</td></tr>";
  }).join("");

  const staleRows = (opts.stale || []).slice(0, 6).map(function (a) {
    const days = (a.days === null || a.days === undefined) ? "—" : (a.days + " 天");
    return "<tr><td><a class=\"link-strong\" href=\"/articles/" + esc(a.slug) + "\">" + esc(a.title || a.slug) + "</a></td>" +
      '<td class="num tight">' + esc(days) + "</td>" +
      '<td class="muted tight">' + esc(a.reviewed_at || "从未复核") + "</td></tr>";
  }).join("");

  const emptyStale = '<tr><td colspan="3" class="empty">' + '<div class="empty__ico">' + icon("check", 24) + '</div>' + '' +
    '<div class="empty__t">全部在复核周期内</div><div>没有超过 180 天未复核的文章</div></td></tr>';

  return layout("工作台",
    // ---- 问候头部 ----
    '<div class="dash-hello">' +
      '<div><h1>' + greeting() + "，" + esc(who) + "！</h1>" +
        // total 由服务端作为顶层参数传入（不是 stats 的字段）—— 曾误读 s.total 导致恒显示 0
        '<div class="dash-hello__date">' + dateStr + " · 共 " + (opts.total || 0) + ' 篇文章</div></div>' +
      '<div class="dash-hello__acts">' +
        '<a class="btn btn--sm" href="/articles?missing=sources">检查结构</a>' +
        '<a class="btn btn--sm" href="/media">媒体库</a>' +
        '<a class="btn btn--primary" href="/articles/new">＋ 新建文章</a>' +
      "</div>" +
    "</div>" +

    // ---- 主视觉横幅（图3 结构：一张高饱和渐变大卡领衔）----
    // 指标都是真实派生值，不是装饰：来源覆盖率与复核覆盖率
    (function () {
      const tot = opts.total || 0;
      const withSrc = Math.max(0, tot - (s.missingSources || 0));
      const srcPct = tot ? Math.round(withSrc / tot * 100) : 0;
      const pub = s.published || 0;
      const okRev = Math.max(0, pub - (s.stale || 0));
      const revPct = pub ? Math.round(okRev / pub * 100) : 0;
      return '<div class="hero">' +
        '<div class="hero__main">' +
          '<div class="hero__k">知识库总量</div>' +
          '<div class="hero__n">' + tot + '</div>' +
          '<div class="hero__sub">篇教程 · 其中 ' + pub + ' 篇已上线</div>' +
        '</div>' +
        '<div class="hero__side">' +
          '<div class="hero__m"><b>' + srcPct + '%</b><span>来源覆盖率</span></div>' +
          '<div class="hero__m"><b>' + revPct + '%</b><span>复核在有效期内</span></div>' +
          '<div class="hero__m"><b>' + (s.missingSources || 0) + '</b><span>缺参考资料</span></div>' +
        '</div>' +
      '</div>';
    })() +

    // ---- 彩色磁贴 ----
    '<div class="tiles">' +
      tile("inReview", "待我审核", "需要我给出结论", icon("review"), "indigo", "/articles?status=in_review") +
      tile("drafts", "我的草稿", "尚未提交", icon("draft"), "amber", "/articles?status=draft") +
      tile("changesRequested", "退回修改", "需要我处理", icon("rejected"), "coral", "/articles?status=changes_requested") +
      tile("published", "已发布", "线上可访问", icon("check"), "mint", "/articles?status=published") +
      tile("stale", "超 180 天未复核", "知识库健康度", icon("clock"), "violet", "/articles?stale=1") +
      tile("missingSources", "缺参考资料", "sources 少于 1 条", icon("warning"), "sky", "/articles?missing=sources") +
    "</div>" +

    // ---- 数据看板：领域分布 + 状态构成 + 更新活动 ----
    // 布局要点：柱状图与环形图并排且等高（避免一侧留大片空白）；
    // 热力网格信息密度大，单独占满一行。
    '<div class="grid2" style="gap:20px;align-items:stretch">' +
      '<div class="card" style="display:flex;flex-direction:column">' +
        '<div class="card__hd"><span class="card__ico" aria-hidden="true" style="background:var(--s-sky);color:var(--i-sky)">▤</span><h3>各领域文章数</h3><span class="topbar__sp"></span>' +
        '<span class="muted">按篇数排序</span></div>' +
        '<div class="card__bd" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end">' +
          (domainBars ? '<div class="chart chart--tall">' + domainBars + "</div>"
                       : '<div class="empty"><div class="empty__ico">▤</div><div class="empty__t">暂无数据</div></div>') +
        "</div>" +
      "</div>" +
      '<div class="card" style="display:flex;flex-direction:column">' +
        '<div class="card__hd"><span class="card__ico" aria-hidden="true" style="background:var(--s-mint);color:var(--i-mint)">◕</span><h3>状态构成</h3><span class="topbar__sp"></span>' +
        '<span class="muted">共 ' + stTotal + ' 篇</span></div>' +
        '<div class="card__bd" style="flex:1;display:flex;flex-direction:column;justify-content:center">' +
          '<div class="row" style="gap:26px;align-items:center;flex-wrap:nowrap">' +
            '<div class="donut" style="' + donutStyle + '">' +
              '<div class="donut__c"><div><div class="donut__n">' + stTotal + '</div>' +
              '<div class="donut__l">篇</div></div></div></div>' +
            '<ul class="legend">' + (legend.join("") || '<li class="muted">暂无数据</li>') + "</ul>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>" +

    // ---- 更新活动热力图（占满一行）----
    '<div class="card">' +
      '<div class="card__hd"><span class="card__ico" aria-hidden="true" style="background:var(--s-indigo);color:var(--i-indigo)">▦</span><h3>更新活动</h3><span class="topbar__sp"></span>' +
      '<span class="muted">最近 80 天 · 颜色越深当天更新越多</span></div>' +
      '<div class="card__bd"><div class="heat heat--wide">' + (heatCells || "") + "</div></div>" +
    "</div>" +
    // ---- 明细表 ----
    '<div class="dash-cols" style="margin-top:20px">' +
      '<div class="card card--flush">' +
        '<div class="card__hd"><span class="card__ico" style="background:var(--s-violet);color:var(--i-violet)">' + icon("draft", 16) + '</span>' + '<h3>最近编辑</h3><span class="topbar__sp"></span>' +
        '<a class="btn btn--sm" href="/articles">全部文章</a></div>' +
        '<div class="tablewrap"><table class="dash-table"><thead><tr>' +
        '<th style="width:auto">标题</th><th class="tight">状态</th><th class="tight">更新</th><th class="tight">复核</th>' +
        "</tr></thead><tbody>" +
        (recentRows || '<tr><td colspan="4" class="empty"><div class="empty__ico">' + icon("empty", 24) + '</div>' + '<div class="empty__t">暂无内容</div><div>新建第一篇文章后会出现在这里</div></td></tr>') +
        "</tbody></table></div>" +
      "</div>" +
      '<div class="card card--flush">' +
        '<div class="card__hd"><span class="card__ico" style="background:var(--s-amber);color:var(--i-amber)">' + icon("clock", 16) + '</span>' + '<h3>陈旧内容</h3><span class="muted" style="font-size:12px">超 180 天未复核</span></div>' +
        '<div class="tablewrap"><table class="dash-table"><thead><tr>' +
        '<th style="width:auto">标题</th><th class="tight">距上次</th><th class="tight">上次复核</th>' +
        "</tr></thead><tbody>" +
        (staleRows || emptyStale) +
        "</tbody></table></div>" +
      "</div>" +
    "</div>",
    Object.assign({ current: "dashboard", accent: "indigo", crumbs: [{ label: "工作台" }] }, opts));
}
function publishPage(opts) {
  // 状态与动作原先直接显示英文枚举（succeeded / publish / archive）
  const JOB_STATUS = { succeeded: "成功", failed: "失败", running: "进行中", queued: "排队中" };
  const JOB_ACTION = { publish: "发布", archive: "归档", revert: "回滚" };
  const jobs = opts.jobs.map(function (j) {
    const dur = j.finished_at && j.started_at
      ? Math.round((new Date(j.finished_at) - new Date(j.started_at)) / 1000) + "s" : "—";
    const cls = j.status === "succeeded" ? "pill--published" : (j.status === "failed" ? "pill--changes_requested" : "pill--draft");
    return "<tr><td>#" + j.id + "</td>" +
      "<td>" + esc(JOB_ACTION[j.action] || j.action) + ' <span class="muted">' + esc(j.slug || "") + "</span></td>" +
      '<td><span class="pill ' + cls + '">' + esc(JOB_STATUS[j.status] || j.status) + "</span></td>" +
      "<td>" + esc(String(j.created_at || "").slice(0,19).replace("T"," ")) + "</td>" +
      "<td>" + dur + "</td>" +
      "<td>" + (j.error ? '<span style="color:#DC2626">' + esc(String(j.error).slice(0,140)) + "</span>" : "") + "</td></tr>";
  }).join("");
  return layout("发布",
    pageHead({
      ico: "publish", title: "发布队列",
      sub: "发布是串行的：同一时刻只允许一个任务运行（构建目录共享、部署是整目录切换）。",
      acts: '<span class="page-head__chip">手动发布通道</span>'
    }) +
    (opts.notice ? '<div class="alert alert--ok" role="status">' + esc(opts.notice) + "</div>" : "") +
    (opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "") +
    '<div class="card card--accent">' +
    '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico">' + icon("publish") + '</span><h3>手动触发一次完整发布</h3></div>' +
    '<form method="post" action="/publish">' +
    '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
    "<p>走完整链路：构建 → 产物化 → 原子切换 → 线上全量校验。</p>" +
    '<button class="btn btn--primary" type="submit">立即发布</button>' +
    '<span class="muted" style="margin-left:10px">发布不会修改内容本身。</span></form></div>' +
    '<div class="card card--flush"><div class="tablewrap"><table>' +
    "<thead><tr><th>#</th><th>动作</th><th>状态</th><th>创建时间</th><th>耗时</th><th>错误</th></tr></thead><tbody>" +
    (jobs || '<tr><td colspan="6" class="empty">' + '<div class="empty__ico">' + icon("publish", 24) + '</div>' + '<div class="empty__t">还没有发布记录</div><div>点击上方「立即发布」会在此显示每一步的进度</div></td></tr>') +
    "</tbody></table></div></div>",
    Object.assign({ current: "publish", accent: "mint", crumbs: [{ label: "发布" }] }, opts));
}

function usersPage(opts) {
  // 角色与限定领域原先直接显示英文 slug（admin / editor / net-basic），
  // 对非技术管理员不友好 —— 统一翻成中文再展示。
  const ROLE_LABEL = { admin: "管理员", editor: "编辑", reviewer: "审核", viewer: "只读" };
  const domNameById = {};
  ((opts.taxonomy && opts.taxonomy.domains) || []).forEach(function (d) { domNameById[d.id] = d.name; });
  function roleLabel(r) { return ROLE_LABEL[r] || r || ""; }
  const rows = opts.users.map(function (u) {
    const rl = roleLabel(u.roles || "");
    const scoped = u.scope_domain
      ? ' <span class="muted">（限定 ' + esc(domNameById[u.scope_domain] || u.scope_domain) + "）</span>" : "";
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
    return "<tr><td>" + esc(v.email) + "</td><td>" + esc(roleLabel(v.role)) + "</td><td>" + st + "</td>" +
      "<td>" + esc(String(v.created_at || "").slice(0,19).replace("T"," ")) + "</td></tr>";
  }).join("");
  const domOpts = opts.taxonomy.domains.map(function (d) {
    return '<option value="' + esc(d.id) + '">' + esc(d.name) + "</option>";
  }).join("");
  return layout("账号",
    pageHead({
      ico: "users", title: "账号与角色",
      sub: "账号只能由管理员创建（无自助注册）。新建后生成一次性激活链接，被邀请人首次登录必须改密。",
      acts: '<span class="page-head__chip">当前 ' + (opts.users || []).length + ' 个账号</span>'
    }) +
    (opts.notice ? '<div class="alert alert--ok" role="status">' + esc(opts.notice) + "</div>" : "") +
    (opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "") +
    (opts.inviteLink ? '<div class="alert alert--info" role="status"><strong>一次性激活链接（只显示这一次，请立即复制）：</strong><br><code style="word-break:break-all">' + esc(opts.inviteLink) + '</code><br><span class="muted">有效期 ' + opts.inviteHours + ' 小时；一次性；可由管理员撤销。</span></div>' : "") +
    '<div class="card card--accent">' +
    '<div class="card__hd" style="padding:0 0 14px"><span class="card__ico">' + icon("plus") + '</span><h3>创建账号（分发邀请）</h3></div>' +
    '<form method="post" action="/users/invite">' +
    '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
    '<div class="grid3"><div><label for="ie">邮箱</label><input id="ie" name="email" type="email" required></div>' +
    '<div><label for="ir">角色</label><select id="ir" name="role">' +
    '<option value="editor">editor（可建/改/提交审核）</option><option value="reviewer">reviewer（可审核/发布）</option>' +
    '<option value="admin">admin（管理员）</option><option value="viewer">viewer（只读）</option></select></div>' +
    '<div><label for="isd">限定领域（可选）</label><select id="isd" name="scope_domain"><option value="">不限制</option>' + domOpts + '</select></div></div>' +
    '<div style="margin-top:14px"><button class="btn btn--primary" type="submit">创建并生成激活链接</button></div></form></div>' +
    '<div class="card card--flush">' +
    '<div class="card__hd"><span class="card__ico">' + icon("articles") + '</span><h3>现有账号</h3><span class="topbar__sp"></span><span class="muted">' + (opts.users || []).length + ' 人</span></div>' +
    '<div class="tablewrap"><table>' +
    "<thead><tr><th>邮箱</th><th>姓名</th><th>角色</th><th>状态</th><th>最近登录</th><th>操作</th></tr></thead><tbody>" +
    (rows || '<tr><td colspan="6" class="empty">' + '<div class="empty__ico">' + icon("users", 24) + '</div>' + '<div class="empty__t">暂无账号</div><div>用上方表单邀请第一位编辑</div></td></tr>') +
    "</tbody></table></div></div>" +
    '<div class="card card--flush">' +
    '<div class="card__hd"><span class="card__ico" aria-hidden="true">↪</span><h3>邀请记录</h3></div>' +
    '<div class="tablewrap"><table>' +
    "<thead><tr><th>邮箱</th><th>角色</th><th>状态</th><th>创建</th></tr></thead><tbody>" +
    (invites || '<tr><td colspan="4" class="empty"><div class="empty__ico">↪</div><div class="empty__t">暂无邀请</div></td></tr>') +
    "</tbody></table></div></div>",
    Object.assign({ current: "users", accent: "coral", crumbs: [{ label: "账号" }] }, opts));
}

function taxonomyPage(opts) {
  const tax = opts.taxonomy || { domains: [], enums: {} };
  const usage = opts.usage || { domains: {}, cats: {} };
  const tints = ["sky", "mint", "violet", "amber", "coral", "indigo"];
  const domains = (tax.domains || []).map(function (d, i) {
    const tint = tints[i % tints.length];
    const domCount = usage.domains[d.id] || 0;
    const cats = (d.cats || []).map(function (cat) {
      return '<div class="tax-cat">' +
        '<form class="tax-cat__edit" method="post" action="/taxonomy/category">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
          '<input type="hidden" name="action" value="save">' +
          '<input type="hidden" name="domain_id" value="' + esc(d.id) + '">' +
          '<input type="hidden" name="id" value="' + esc(cat.id) + '">' +
          '<input type="text" name="name" value="' + esc(cat.name) + '" maxlength="40" required>' +
          '<button class="btn btn--sm" type="submit">保存</button>' +
        '</form>' +
        '<form method="post" action="/taxonomy/category">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
          '<input type="hidden" name="action" value="delete">' +
          '<input type="hidden" name="domain_id" value="' + esc(d.id) + '">' +
          '<input type="hidden" name="id" value="' + esc(cat.id) + '">' +
          '<button class="btn btn--sm btn--danger" type="submit" data-confirm="删除分类「' + esc(cat.name) + '」？已有文章引用时系统会阻止。" data-confirm-danger data-confirm-ok="删除">删除</button>' +
        '</form>' +
        '<div class="tax-cat__id">' + esc(cat.id) + ' · ' + (usage.cats[cat.id] || 0) + ' 篇</div>' +
      '</div>';
    }).join("");

    return '<section class="tax-card" style="--tax-c:var(--c-' + tint + ')">' +
      '<div class="tax-card__hd">' +
        '<span class="tax-card__dot"></span>' +
        '<strong>' + esc(d.name) + '</strong>' +
        '<span class="tax-stat">' + domCount + ' 篇文章</span>' +
        '<span class="tax-card__id">' + esc(d.id) + '</span>' +
      '</div>' +
      '<form class="tax-domain-form" method="post" action="/taxonomy/domain">' +
        '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
        '<input type="hidden" name="action" value="save">' +
        '<input type="hidden" name="id" value="' + esc(d.id) + '">' +
        '<div><label for="dn-' + esc(d.id) + '">领域名称</label><input id="dn-' + esc(d.id) + '" type="text" name="name" value="' + esc(d.name) + '" maxlength="40" required></div>' +
        '<button class="btn" type="submit">保存名称</button>' +
      '</form>' +
      '<div class="row" style="justify-content:space-between;margin-bottom:14px">' +
        '<span class="muted">ID 用于文章数据和 URL 关联，创建后不可修改。</span>' +
        '<form method="post" action="/taxonomy/domain">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
          '<input type="hidden" name="action" value="delete">' +
          '<input type="hidden" name="id" value="' + esc(d.id) + '">' +
          '<button class="btn btn--sm btn--danger" type="submit" data-confirm="删除领域「' + esc(d.name) + '」及其下分类？已有文章引用时系统会阻止。" data-confirm-danger data-confirm-ok="删除">删除领域</button>' +
        '</form>' +
      '</div>' +
      '<div class="tax-cats">' + (cats || '<div class="muted">该领域还没有分类，可在下方添加。</div>') + '</div>' +
      '<details class="tax-add">' +
        '<summary>＋ 添加分类</summary>' +
        '<form class="tax-add__grid" method="post" action="/taxonomy/category">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
          '<input type="hidden" name="action" value="create">' +
          '<input type="hidden" name="domain_id" value="' + esc(d.id) + '">' +
          '<div><label for="ci-' + esc(d.id) + '">分类 ID</label><input id="ci-' + esc(d.id) + '" type="text" name="id" pattern="[a-z0-9][a-z0-9-]{1,63}" placeholder="例如 win-driver" required></div>' +
          '<div><label for="cn-' + esc(d.id) + '">分类名称</label><input id="cn-' + esc(d.id) + '" type="text" name="name" maxlength="40" placeholder="例如 驱动与设备" required></div>' +
          '<button class="btn btn--primary" type="submit">添加</button>' +
        '</form>' +
      '</details>' +
    '</section>';
  }).join("");

  return layout("领域与分类",
    pageHead({
      ico: "taxonomy", title: "领域与分类",
      sub: "这里维护的是文章编辑器下拉框和站点构建共用的 taxonomy.json。文章已经使用的分类不会被误删。",
      acts: '<a class="btn btn--sm" href="/articles/new">去新建文章</a>'
    }) +
    (opts.notice ? '<div class="alert alert--ok" role="status">' + esc(opts.notice) + "</div>" : "") +
    (opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "") +
    '<div class="tax-intro">' +
      '<div class="card card--accent">' +
        '<div class="card__hd" style="padding:0 0 14px"><span class="card__ico">' + icon("plus") + '</span><h3>新增领域</h3></div>' +
        '<form class="tax-create" method="post" action="/taxonomy/domain">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
          '<input type="hidden" name="action" value="create">' +
          '<div><label for="new-domain-id">领域 ID</label><input id="new-domain-id" name="id" type="text" pattern="[a-z0-9][a-z0-9-]{1,63}" placeholder="例如 cloud-service" required></div>' +
          '<div><label for="new-domain-name">显示名称</label><input id="new-domain-name" name="name" type="text" maxlength="40" placeholder="例如 云服务与账号" required></div>' +
          '<button class="btn btn--primary" type="submit">创建领域</button>' +
        '</form>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico" aria-hidden="true">i</span><h3>维护规则</h3></div>' +
        '<p class="muted" style="margin:0 0 8px">ID 创建后不可修改；显示名称可以随时调整。</p>' +
        '<p class="muted" style="margin:0 0 8px">删除前会检查文章引用，避免生成断链或编辑器无法读取。</p>' +
        '<p class="muted" style="margin:0">保存后，新建/编辑文章页面会立即读取最新分类。</p>' +
      '</div>' +
    '</div>' +
    '<div class="tax-grid">' + (domains || '<div class="card empty"><div class="empty__t">还没有领域</div></div>') + '</div>',
    Object.assign({ current: "taxonomy", accent: "violet", crumbs: [{ label: "管理" }, { label: "领域与分类" }] }, opts));
}

function auditPage(opts) {
  // 动作 → 语义色：登录=琥珀、内容=靛蓝、账号=珊瑚、评论=天蓝、发布=薄荷
  const rows = opts.logs.map(function (l) {
    const a = String(l.action || "");
    const tint = a.indexOf("auth") === 0 ? "amber" : (a.indexOf("user") === 0 ? "coral"
      : (a.indexOf("comment") === 0 ? "sky" : (a.indexOf("publish") === 0 ? "mint" : "indigo")));
    return "<tr><td>" + esc(String(l.created_at || "").slice(0,19).replace("T"," ")) + "</td>" +
      "<td>" + esc(l.user_email || "—") + "</td>" +
      '<td><span class="pill" style="background:var(--s-' + tint + ');color:var(--i-' + tint + ')">' + esc(l.action) + "</span></td>" +
      "<td>" + esc(l.target || "") + "</td>" +
      "<td>" + esc(l.ip || "") + "</td>" +
      '<td class="muted">' + esc(l.detail ? JSON.stringify(l.detail).slice(0,160) : "") + "</td></tr>";
  }).join("");
  return layout("审计日志",
    pageHead({
      ico: "clock", title: "审计日志",
      sub: "登录、增删改、发布、改权限等关键动作全部记录（append-only，不可篡改）。",
      acts: '<span class="page-head__chip">最近 ' + (opts.logs || []).length + ' 条</span>'
    }) +
    '<div class="card card--flush"><div class="tablewrap"><table>' +
    "<thead><tr><th>时间</th><th>操作者</th><th>动作</th><th>对象</th><th>IP</th><th>详情</th></tr></thead><tbody>" +
    (rows || '<tr><td colspan="6" class="empty">' + '<div class="empty__ico">' + icon("clock", 24) + '</div>' + '<div class="empty__t">暂无审计记录</div><div>登录、发布等操作会记录在此</div></td></tr>') +
    "</tbody></table></div></div>",
    Object.assign({ current: "audit", accent: "amber", crumbs: [{ label: "审计日志" }] }, opts));
}

/* ---------------- 媒体库页 ---------------- */
/* ---------------- 2FA 设置页 ---------------- */
function securityPage(opts) {
  const err = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";
  const ok = opts.notice ? '<div class="alert alert--ok" role="status">' + esc(opts.notice) + "</div>" : "";
  const body = opts.enabled
    ? '<div class="alert alert--ok" role="status">双因素认证已开启。登录时需要输入手机 App 上的 6 位验证码。</div>' +
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
    pageHead({
      ico: "security", title: "账号安全",
      sub: "为管理员账号开启双因素认证，降低密码泄露后的风险。",
      acts: '<span class="page-head__chip">' + (opts.enabled ? "2FA 已开启" : "2FA 未开启") + "</span>"
    }) + err + ok +
    '<div class="card card--accent">' +
      '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico">' + icon("security") + '</span><h3>双因素认证（TOTP）</h3></div>' + body + "</div>" +
    '<div class="card">' +
      '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico">' + icon("draft") + '</span><h3>修改密码</h3></div>' +
      '<p class="muted">定期更换密码，或怀疑泄露时立即更换。</p>' +
      '<a class="btn" href="/change-password">修改密码</a></div>',
    Object.assign({ current: "security", accent: "violet", crumbs: [{ label: "账号安全" }] }, opts));
}

/* ---------------- 2FA 绑定确认页 ---------------- */
function securityConfirmPage(opts) {
  const err = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";
  if (opts.done) {
    const codes = (opts.codes || []).map(function (c) { return '<span class="kbd">' + esc(c) + "</span>"; }).join(" ");
    return layout("2FA 已开启",
      '<div class="card"><h1>双因素认证已开启</h1>' +
      '<div class="alert alert--warn" role="status">下面这些<strong>恢复码只显示这一次</strong>。手机丢失时用它登录。请立即保存到密码管理器或打印出来。</div>' +
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
  const err = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";
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
  const err = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";
  const ok = opts.notice ? '<div class="alert alert--ok" role="status">' + esc(opts.notice) + "</div>" : "";
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
    pageHead({
      ico: "media", title: "媒体库",
      sub: "图片随内容一起版本化；上传必须填写 alt，并确认已脱敏。",
      acts: '<span class="page-head__chip">' + items.length + " 个文件</span>"
    }) +
    err + ok +
    '<div class="card card--accent">' +
      '<div class="card__hd" style="padding:0 0 14px"><span class="card__ico">' + icon("plus") + '</span><h3>上传图片</h3></div>' +
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
           : '<div class="card"><div class="empty">' + '<div class="empty__ico">' + icon("media", 24) + '</div>' + '<div class="empty__t">还没有图片</div><div>上传后可在编辑器里用「插入图片」引用</div></div></div>'),
    Object.assign({ current: "media", accent: "sky", crumbs: [{ label: "媒体库" }] }, opts));
}

function simplePage(title, msg, opts) {
  return layout(title, '<div class="card"><h1>' + esc(title) + "</h1><p>" + esc(msg) + '</p><a class="btn" href="/articles">返回文章列表</a></div>', opts);
}

module.exports = {
  layout: layout, loginPage: loginPage, changePasswordPage: changePasswordPage,
  articlesPage: articlesPage, editorPage: editorPage, publishPage: publishPage,
  usersPage: usersPage, taxonomyPage: taxonomyPage, auditPage: auditPage, simplePage: simplePage, dashboardPage: dashboardPage,
  revisionsPage: revisionsPage, revisionDiffPage: revisionDiffPage, commentsBlock: commentsBlock, viewsBar: viewsBar,
  mediaPage: mediaPage,
  securityPage: securityPage, securityConfirmPage: securityConfirmPage, totpChallengePage: totpChallengePage,
  statusLabel: statusLabel
};
