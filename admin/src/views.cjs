
/* admin/src/views.cjs — 服务端渲染模板（无模板引擎依赖）
   设计原则：产物是本项目自包含单文件风格 —— 内联 CSS，不引外部资源，
   因此 CSP 可以收得很紧（default-src 'self'）。 */
"use strict";
const fs = require("fs");
const path = require("path");
const h = require("./http.cjs");
const esc = h.esc;

/* 界面层 v3（2026-11）：在 v2 新拟物层之上做「白卡 + 细边 + 轻投影」的结构化修订。
   单独成文件是为了让设计调整不必在 1000+ 行的 BASE_CSS 里翻找；启动时读入并内联，
   保持「产物是自包含单文件、CSP 只允许 'self'」的既有约束。 */
let V3_CSS = "";
try {
  V3_CSS = fs.readFileSync(path.join(__dirname, "ui-v3.css"), "utf8");
} catch (e) {
  /* 缺少样式文件时降级到 v2 皮肤，而不是让整个后台启动失败 */
  console.error("[views] 未能加载 ui-v3.css，已回退到 v2 样式：" + e.message);
}

/* 登录页的四幅内联 SVG 插画（静态结构；切换/视差由 public/login.js 驱动） */
const LOGIN_SCENES = require("./login-scenes.cjs");

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
/* 图标数据来自 Lucide（ISC，https://lucide.dev）。生成脚本：admin/tools/gen-icons.cjs
   —— 手绘 path 换成开源图标库：24×24 网格、2px 描边、圆角端点，跨平台一致。 */
const ICONS = require("./icons-data.cjs");

/* 渲染一个图标。name 不存在时返回空串（不抛错，避免一个笔误炸整页）。
   默认 aria-hidden：本站所有图标的含义都有可见文字标签，图标属于装饰。 */
/* 外部链接 href 白名单：只放行 http/https。
   为什么需要：转义只能防「提前闭合属性」，防不了 `javascript:` 这类协议。
   来源体检的 URL 来自外部探测报告，属于「不可信输入」，必须过这里。 */
function safeHref(u) {
  const s = String(u === undefined || u === null ? "" : u).trim();
  return /^https?:\/\//i.test(s) ? s : "#";
}

function icon(name, size, cls) {
  const inner = ICONS[name];
  if (!inner) return "";
  const s = size || 20;
  return '<svg class="fx-icon' + (cls ? " " + cls : "") + '" width="' + s + '" height="' + s + '" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    inner + "</svg>";
}

const BASE_CSS = `
/* ============================================================
   ⚠ 分层说明（2026-11 评审补充）
   ---------------------------------------------------------------------------
   本文件是 v2「新拟物」皮肤，运行时按 BASE_CSS → V3_CSS 的顺序内联进 <style>，
   因此 ui-v3.css 里同名选择器会**覆盖**这里。保留 BASE_CSS 的目的是兜底：
   ui-v3.css 加载失败（或将来要回退皮肤）时后台仍可用、可读。

   已被 ui-v3.css 完全覆盖、无需在 v3 上继续维护的组件组（改样式请改 v3）：
     .sidebar / .navitem / .topbar / .work        —— 骨架与导航
     .card / .card__hd / .card__bd / .card__ft     —— 卡片
     .page-head                                    —— 页头（v2 是裸 h1，v3 才有题头）
     .btn / .btn--primary / .btn--ghost / .btn--sm —— 按钮
     input / select / textarea / label             —— 表单控件
     table / thead th / tbody td                   —— 表格
     .pill / .alert / .empty / .kbd                —— 徽章、提示、空态
     .pager__btn / .statustab / .filters__chip     —— 分页与筛选
     .editor-actions / .md-toolbar / .meter        —— 编辑器工具条

   未使用的组件样式已直接删除（不要“留着以后用”）：
     .stat* / .spark / .tiles / .tile* / .feed* / .heat--wide /
     .chart__bar--muted|hot|good / .btn--tint / .btn--block / .tax-list / .field__err
   判断依据：渲染后的 15 个页面 HTML 里没有任何对应 class。
   ============================================================ */
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

/* ============ 统计卡（已废弃） ============
   v3 用 .kpistrip（数据条）+ .hero（总览横幅）替代了 .stat 系列统计卡，
   模板里已经没有任何 .stat/.stat__k/.spark 标记。整段删除，避免「看着有、
   改了半天才发现根本没渲染」的死代码。相关清理也覆盖 .stat 在媒体查询里的残留引用。 */

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
/* 原先这里写的是 td:nth-last-child(-n+3) —— 对只有 3 列的明细表，
   等于「所有列都不许换行」，中文长标题因此撑破表格（工作台陈旧内容表、数据分析反馈表）。
   改成只锁语义上「不该折行」的短列：数字 / 日期 / 状态（.num / .tight）。 */
.tablewrap .num,.tablewrap .tight{white-space:nowrap}
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

/* ---------------- 图表卡（纯 CSS 柱状图 / 环形图，不引图表库） ---------------- */
.chart{display:flex;align-items:flex-end;gap:7px;height:130px;padding:8px 0}
.chart__col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;
  align-items:center;gap:6px;height:100%}
.chart__bar{
  width:100%;border-radius:7px 7px 4px 4px;
  background:linear-gradient(180deg,var(--d-indigo),color-mix(in srgb,var(--d-indigo) 62%,#fff));
  transition:filter .18s;
}
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

/* ---- 图表卡等高（避免一侧留大片空白）----
   .feed（通知流）与 .heat--wide（40 列宽热力图）已随模板改版废弃，
   模板里统一用 .heat（10 列自适应）—— 死规则已删除。 */
.chart--tall{height:196px}

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

/* ---- 规范：尊重 reduced-motion（动画全部关闭，但保留最终态）---- */
@media (prefers-reduced-motion:reduce){
  .skeleton{animation:none;background:var(--bg-2)}
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
}

/* ============================================================
   移动端增强（2026-10-24）
   ------------------------------------------------------------
   放在文件末尾：860px 断点在此之前的层（拟态 refresh 层）里
   有重复声明，只有放最后才能稳定覆盖。
   ============================================================ */
@media (max-width:860px){
  /* 顶栏导航条吸顶：滚到页面任何位置都能切换（原先是 static，会滚走） */
  .sidebar{position:sticky;top:0;z-index:30;background:#fff;
    box-shadow:0 6px 18px -12px rgba(18,24,33,.4);
    scrollbar-width:none}
  .sidebar::-webkit-scrollbar{display:none}
  .navitem{padding:9px 12px;font-size:13.5px;flex:none}
  /* 面包屑过长时省略，不把右侧操作按钮挤出屏幕 */
  .crumbs{min-width:0;flex:1;overflow:hidden;flex-wrap:nowrap;white-space:nowrap}
  .crumbs a,.crumbs__cur{overflow:hidden;text-overflow:ellipsis}
  .topbar{flex-wrap:wrap;row-gap:8px}
  /* 卡片与磁贴内边距收窄，窄屏把宽度让给内容 */
  main{padding:0 16px 44px}
  .topbar{padding:12px 16px}
  .card{padding:16px;border-radius:18px}
  .card--flush{padding:0}
  .card__hd{padding:14px 16px 10px}
  .card__bd{padding:0 16px 16px}
  .card__ft{padding:12px 16px}
  .stat,.tile{padding:16px}
  .login-wrap h1{font-size:20px}
  /* 表格横向滚动更顺滑 */
  .tablewrap{-webkit-overflow-scrolling:touch}
}
/* iOS 聚焦自动放大：小屏上输入类字号 ≥16px */
@media (max-width:640px){
  input,select,textarea{font-size:16px}
}

/* ============================================================
   UI 优化（2026-10-24 第二批）：状态 tab / 批量条 / 行内操作 / 预览分栏
   ============================================================ */
/* ---- 状态筛选 tab（替代下拉，带计数、可扫读） ---- */
.statustabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.statustab{
  display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:var(--r-full);
  font-size:13px;font-weight:600;color:var(--ink-2);background:var(--base);
  box-shadow:var(--raise-sm);text-decoration:none;
  transition:box-shadow .18s cubic-bezier(.34,1.56,.64,1),color .18s,transform .18s;
}
.statustab:hover{box-shadow:var(--raise);color:var(--ink);transform:translateY(-1px)}
.statustab b{font-family:var(--mono);font-size:12px;font-weight:800;color:var(--ink-3)}
.statustab::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--lo);flex:none}
.statustab--mint::before{background:var(--c-mint)}
.statustab--amber::before{background:var(--c-amber)}
.statustab--indigo::before{background:var(--c-indigo)}
.statustab--coral::before{background:var(--c-coral)}
.statustab--gray::before{background:var(--ink-3)}
.statustab.is-on{box-shadow:var(--inset-sm);color:var(--ink);font-weight:700}
.statustab.is-on b{color:var(--pg)}
/* ---- 批量操作条（勾选后亮起） ---- */
.batchbar{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding:10px 14px;border-radius:var(--r-btn);background:var(--base);
  box-shadow:var(--inset-sm);margin-bottom:14px;font-size:13px;
}
.batchbar__count{font-weight:700;color:var(--ink-3);min-width:64px}
.batchbar select{min-height:36px;max-width:180px}
/* ---- 行内快捷操作 ---- */
.rowacts{display:flex;gap:6px;align-items:center;flex-wrap:nowrap;white-space:nowrap}
.inlineact{display:inline-flex;margin:0}
.inlineact .btn{min-height:32px;padding:0 11px;font-size:12.5px}
@media (max-width:860px){
  /* 窄屏：快捷操作收进下一行，避免横向挤压标题列 */
  .rowacts{flex-direction:column;align-items:stretch;white-space:normal;max-width:150px}
  .batchbar select{flex:1}
}
/* ---- 编辑器：分栏预览 ---- */
.md-preview{
  border-radius:var(--r-btn);padding:14px 16px;background:var(--base-2);
  box-shadow:var(--inset-sm);font-size:14px;line-height:1.75;color:var(--ink);
  overflow:auto;max-height:70vh;
}
.md-preview h2{font-size:17px;margin:14px 0 8px}
.md-preview h3{font-size:15px;margin:12px 0 6px}
.md-preview p{margin:8px 0}
.md-preview ul,.md-preview ol{margin:8px 0;padding-left:20px}
.md-preview li{margin:4px 0}
.md-preview code{font-family:var(--mono);font-size:12.5px;background:var(--base);border-radius:6px;padding:1px 6px}
.md-preview pre{background:var(--base);border-radius:10px;padding:12px 14px;overflow:auto;margin:10px 0}
.md-preview pre code{background:none;padding:0}
.md-preview blockquote{margin:10px 0;padding:10px 14px;border-left:4px solid var(--pg);border-radius:10px;background:var(--base)}
.md-preview table{border-collapse:collapse;width:100%;margin:10px 0;font-size:13px}
.md-preview th,.md-preview td{border:1px solid var(--lo);padding:6px 10px;text-align:left}
.md-preview img{max-width:100%;border-radius:10px}
/* 分栏：textarea 与预览并排（窄屏自动退化为上下） */
.grp__bd.previewing{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
.grp__bd.previewing #body{min-height:420px}
.grp__bd.previewing .meter{grid-column:1 / -1}
@media (max-width:1100px){
  .grp__bd.previewing{grid-template-columns:1fr}
  .grp__bd.previewing #body{min-height:280px}
}
/* 2026-11-06：预览改为 iframe 承载线上整页，容器要给它完整高度 */
.grp__bd.previewing .md-preview{height:72vh;min-height:520px;padding:0;overflow:hidden}
#body{transition:none}
.grp__bd.previewing .md-preview{position:sticky;top:76px}
/* ---- 发布节奏趋势图（复用图表柱，弱化空柱） ---- */
.chart--trend{height:110px;gap:4px}
.chart--trend .chart__bar{opacity:.4}
.chart--trend .chart__bar--on{opacity:1}
.chart--trend .chart__lab{font-size:9.5px}

/* ---- 读者反馈分析 ---- */
.feedback-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin:20px 0}
.feedback-kpi{
  --fk:var(--c-indigo);--fks:var(--s-indigo);--fki:var(--i-indigo);
  position:relative;overflow:hidden;min-width:0;padding:18px 19px 17px;border-radius:var(--r-card);
  background:var(--base);box-shadow:var(--raise);
}
.feedback-kpi::after{content:"";position:absolute;right:-22px;bottom:-30px;width:92px;height:92px;
  border-radius:50%;background:var(--fks);opacity:.8}
.feedback-kpi--mint{--fk:var(--c-mint);--fks:var(--s-mint);--fki:var(--i-mint)}
.feedback-kpi--coral{--fk:var(--c-coral);--fks:var(--s-coral);--fki:var(--i-coral)}
.feedback-kpi--amber{--fk:var(--c-amber);--fks:var(--s-amber);--fki:var(--i-amber)}
.feedback-kpi__top{display:flex;align-items:center;gap:9px;color:var(--ink-2);font-size:12.5px;font-weight:700}
.feedback-kpi__ico{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;
  color:var(--fki);background:var(--fks);box-shadow:var(--raise-sm);position:relative;z-index:1}
.feedback-kpi__n{position:relative;z-index:1;margin-top:12px;font-family:var(--mono);
  font-size:30px;line-height:1;font-weight:800;color:var(--fki)}
.feedback-kpi__h{position:relative;z-index:1;margin-top:7px;font-size:11.5px;color:var(--ink-3)}
.feedback-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:20px;align-items:start}
.feedback-issues{display:flex;gap:7px;flex-wrap:wrap;padding:12px 16px 0}
.feedback-issue-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:var(--r-full);
  background:var(--s-coral);color:var(--i-coral);font-size:11px;font-weight:700}
.feedback-issue-chip b{font-family:var(--mono)}
.feedback-feed{display:flex;flex-direction:column}
.feedback-articles{display:flex;flex-direction:column}
.feedback-article-row{
  display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;
  padding:14px 17px;border-bottom:1px solid rgba(214,200,189,.55)
}
.feedback-article-row:last-child{border-bottom:0}
.feedback-article-row__title{min-width:0}
.feedback-article-row__title a{display:block;font-size:13.5px;font-weight:700;color:var(--ink);
  overflow-wrap:anywhere;line-height:1.55}
.feedback-article-row__title .slug{margin-top:3px}
.feedback-article-counts{display:flex;align-items:center;gap:7px;flex:none}
.feedback-article-count{
  min-width:56px;padding:5px 8px;border-radius:9px;text-align:center;
  font-size:10.5px;font-weight:700;background:var(--s-mint);color:var(--i-mint)
}
.feedback-article-count--unresolved{background:var(--s-coral);color:var(--i-coral)}
.feedback-article-count b{display:block;font-family:var(--mono);font-size:16px;line-height:1.2}
.feedback-item{padding:14px 18px;border-bottom:1px solid rgba(214,200,189,.55)}
.feedback-item:last-child{border-bottom:0}
.feedback-item__hd{display:flex;align-items:flex-start;gap:9px;flex-wrap:wrap}
.feedback-item__hd a{font-size:13.5px;font-weight:700;color:var(--i-coral);min-width:0;overflow-wrap:anywhere}
.feedback-item__time{margin-left:auto;color:var(--ink-3);font-size:11px;font-family:var(--mono)}
.feedback-item__loc{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:7px;font-size:11.5px;color:var(--ink-2)}
.feedback-item__loc strong{color:var(--ink);font-weight:700}
.feedback-item__msg{margin:7px 0 0;color:var(--ink-2);font-size:12.5px;line-height:1.7;overflow-wrap:anywhere}
.feedback-inline-empty{padding:28px 18px;text-align:center;color:var(--ink-3);font-size:12.5px}
@media(max-width:1100px){
  .feedback-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
  .feedback-grid{grid-template-columns:1fr}
}
@media(max-width:620px){
  .feedback-kpis{grid-template-columns:1fr;gap:12px}
  .feedback-kpi{padding:15px 16px}
  .feedback-kpi__n{font-size:26px}
  .feedback-article-row{grid-template-columns:1fr;gap:9px}
  .feedback-article-counts{justify-content:flex-start}
}

/* ============================================================
   深色模式（跟随系统 prefers-color-scheme）
   ------------------------------------------------------------
   只覆盖令牌与少量硬编码底色；组件全部引用变量，自动适配。
   拟态阴影方向不变：暗色下高光压暗、投影加深。
   ============================================================ */
@media (prefers-color-scheme: dark){
  :root{
    color-scheme:dark;
    --base:#161B22; --base-2:#10151C;
    --hi:#232C37; --lo:#0B0F14;
    --raise:-5px -5px 12px rgba(255,255,255,.035), 5px 6px 15px rgba(0,0,0,.55);
    --raise-sm:-2px -2px 6px rgba(255,255,255,.03), 3px 3px 9px rgba(0,0,0,.5);
    --raise-lg:-8px -8px 20px rgba(255,255,255,.04), 9px 10px 24px rgba(0,0,0,.6);
    --inset:inset 4px 4px 10px rgba(0,0,0,.5), inset -4px -4px 10px rgba(255,255,255,.03);
    --inset-sm:inset 2px 2px 6px rgba(0,0,0,.45), inset -2px -2px 6px rgba(255,255,255,.03);
    --inset-deep:inset 6px 6px 14px rgba(0,0,0,.55), inset -6px -6px 14px rgba(255,255,255,.03);
    --ink:#E7ECF3; --ink-2:#AEB8C4; --ink-3:#7E8996;
    --accent:#8A9BFF; --accent-deep:#A6B3FF;
    --warn:#FF7A54;
    --c-indigo:#8FA0FF; --s-indigo:#232946; --i-indigo:#C3CBFF; --t-indigo:#232946; --d-indigo:#8FA0FF;
    --c-mint:#3DD598;   --s-mint:#12332B;   --i-mint:#9FE8CD;   --t-mint:#12332B;   --d-mint:#3DD598;
    --c-amber:#F2B94B;  --s-amber:#3A2E14;  --i-amber:#FFD98A;  --t-amber:#3A2E14;  --d-amber:#F2B94B;
    --c-coral:#FF8A6B;  --s-coral:#3D211B;  --i-coral:#FFC0AE;  --t-coral:#3D211B;  --d-coral:#FF8A6B;
    --c-sky:#5FB7FF;    --s-sky:#12293D;    --i-sky:#A8D8FF;    --t-sky:#12293D;    --d-sky:#5FB7FF;
    --c-violet:#B98AFF; --s-violet:#2B2140; --i-violet:#D9C2FF; --t-violet:#2B2140; --d-violet:#B98AFF;
  }
  body{background:var(--base)}
  .sidebar{background:var(--base);border-right:1px solid rgba(255,255,255,.07)}
  .sidebar__brand{color:var(--ink)}
  .sidebar__sec{color:var(--ink-3)}
  .navitem{background:var(--base);color:var(--ink-2)}
  .navitem:hover{color:var(--ink)}
  .navitem__ico{color:var(--ink-3)}
  .navitem__badge{color:var(--ink-2)}
  .topbar{background:var(--base)}
  .card,.page-head,.editor-actions,details.grp,.mcard,.cmt,.tax-card{background:var(--base)}
  tbody tr{background:var(--base)}
  tbody tr:hover td{background:var(--base-2)}
  .login-body{background:var(--base)}
    .tax-add{border-top-color:rgba(255,255,255,.08)}
  .pill--archived,.pill--viewer{background:#2A3039;color:#AAB4C0}
  .alert--err{color:#FFB4A0}
  .alert--warn{color:#EFC98A}
  .alert--info{color:#9FB4E8}
  .check--warn .check__ic{color:#E8C077}
  .hero{filter:saturate(.82) brightness(.94)}
  .donut{box-shadow:var(--raise)}
  /* 热力格：暗色下的蓝色梯度（0 级用凹槽底色） */
  .heat i[data-l="0"]{background:var(--base-2)}
  .heat i[data-l="1"]{background:#1E3350}
  .heat i[data-l="2"]{background:#274568}
  .heat i[data-l="3"]{background:#33598A}
  .heat i[data-l="4"]{background:#4E7FC0}
  /* 表格斑马/边框微调 */
  table td,table th{border-bottom-color:rgba(255,255,255,.06)}
  .card__ft{box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
  .me,.pill{box-shadow:none}
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
    /* 导航按「工作动线」而非系统模块分组：
         写内容 → 审内容 → 看数据；管理类收进最后一组，减少日常干扰。
       「待审」徽章只在有可审稿件时出现，空队列不制造焦虑。 */
    const reviewBadge = opts.counts && opts.counts.review;
    nav = '<div class="sidebar__sec">写作</div><nav class="sidebar__nav">' +
      navItem("/dashboard", icon("dashboard"), "工作台", "dashboard", null, "content") +
      navItem("/articles", icon("articles"), "文章", "articles", opts.counts && opts.counts.articles, "content") +
      navItem("/articles/new", icon("plus"), "新建文章", "new", null, "content") +
      navItem("/media", icon("media"), "媒体库", "media", null, "content") +
      '</nav>' +
      '<div class="sidebar__sec">协作</div><nav class="sidebar__nav">' +
      (isReviewer ? navItem("/review", icon("review"), "审核台", "review", reviewBadge, "collab") : "") +
      navItem("/publish", icon("publish"), "发布", "publish", null, "collab") +
      navItem("/analytics", icon("chart"), "数据分析", "analytics", null, "collab") +
      navItem("/sources-check", icon("search"), "来源体检", "sources", null, "collab") +
      (isReviewer ? navItem("/audit", icon("audit"), "审计日志", "audit", null, "collab") : "") +
      '</nav>' +
      (isAdmin ? '<div class="sidebar__sec">管理</div><nav class="sidebar__nav">' +
        navItem("/users", icon("users"), "账号", "users", null, "admin") +
        navItem("/taxonomy", icon("taxonomy"), "领域与分类", "taxonomy", null, "admin") + '</nav>' : "");
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
          /* 账号安全（2FA）是每个登录用户自己的设置，不能只挂在 admin 分组里 ——
             否则 reviewer/editor 从界面上根本进不去（虽然路由是允许的）。 */
          '<a class="btn btn--sm btn--ghost" href="/security">账号安全</a>' +
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

  /* 顶部条固定包含「全局搜索入口」：后台最常用的动作是「找到某一篇」，
     它不该依赖先进某个列表页再筛选。Ctrl/Cmd+K 打开命令面板。 */
  const cmdkBtn = user
    ? '<button class="cmdbtn" type="button" data-cmdk-open aria-label="搜索文章与跳转（Ctrl 或 Cmd 加 K）">' +
        icon("search", 14) + '<span>搜索 / 跳转</span><kbd>Ctrl K</kbd></button>'
    : "";
  const kbdBtn = user
    ? '<button class="kbd-btn" type="button" data-kbd-help aria-label="查看快捷键（问号键）" title="快捷键（?）">?</button>'
    : "";
  const topbar = user
    ? '<div class="topbar">' + crumbs + '<span class="topbar__sp"></span>' + cmdkBtn + kbdBtn + (opts.actions || "") + '</div>'
    : "";

  const inner = opts.nav === false
    ? bodyHtml
    : '<div class="shell">' + sidebar + '<div class="work">' + topbar + '<main>' + bodyHtml + '</main></div></div>';

  /* ---------------- 全局命令面板（Ctrl/Cmd+K） ----------------
     纯前端渲染、数据来自 /api/search（服务端只返回当前用户可见的文章摘要）。
     没有它时，找一篇老文章要先点进列表再筛选三层，是后台里最高频的摩擦点。 */
  const cmdk = user
    ? '<dialog class="cmdk" id="fx-cmdk" aria-label="搜索与跳转">' +
        '<div class="cmdk__panel">' +
          /* 搜索框必须有可访问名称：placeholder 只是提示，读屏把它当「空名输入框」。
             role=combobox + aria-autocomplete 是「输入即过滤列表」的标准语义。 */
          '<input class="cmdk__input" id="fx-cmdk-input" type="search" role="combobox" aria-autocomplete="list" aria-label="搜索文章或页面" placeholder="搜索文章标题 / slug，或输入页面名称…" autocomplete="off" aria-controls="fx-cmdk-list" aria-expanded="false">' +
          '<div class="cmdk__list" id="fx-cmdk-list" role="listbox" aria-label="结果"></div>' +
          '<div class="cmdk__foot"><span>↑↓ 选择</span><span>Enter 打开</span><span>Esc 关闭</span><span style="margin-left:auto">输入 ? 查看全部页面</span></div>' +
        '</div></dialog>'
    : "";

  /* 快捷键帮助：第一次用的人不知道有哪些键盘捷径，集中放一处可查 */
  const kbdHelp = user
    ? '<dialog id="kbd-help" class="kbd-help" aria-labelledby="kbd-help-title">' +
        '<header class="kbd-help__hd"><h2 id="kbd-help-title">快捷键</h2>' +
          '<button class="btn btn--sm" type="button" data-kbd-close>关闭（Esc）</button></header>' +
        '<dl class="kbd-help__list">' +
          "<div><dt><kbd>Ctrl</kbd><kbd>K</kbd></dt><dd>搜索文章 / 跳转页面（命令面板）</dd></div>" +
          "<div><dt><kbd>Ctrl</kbd><kbd>S</kbd></dt><dd>保存当前文章（编辑器内）</dd></div>" +
          "<div><dt><kbd>J</kbd><kbd>K</kbd></dt><dd>切换审核队列里的上一篇 / 下一篇</dd></div>" +
          "<div><dt><kbd>A</kbd></dt><dd>通过并发布（审核台）</dd></div>" +
          "<div><dt><kbd>R</kbd></dt><dd>退回修改，并跳到意见输入框（审核台）</dd></div>" +
          "<div><dt><kbd>?</kbd></dt><dd>打开 / 关闭这个帮助</dd></div>" +
          "<div><dt><kbd>Esc</kbd></dt><dd>关闭弹层；在全屏分栏里退出</dd></div>" +
        "</dl></dialog>"
    : "";

  // 无障碍：toast 与提示用 aria-live 播报（Popover API 不会自动向读屏宣告）
  return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<meta name="color-scheme" content="light dark">\n' +
    '<meta name="robots" content="noindex,nofollow">\n' +
    '<title>' + esc(title) + ' · 修盒子内容后台</title>\n' +
    '<style>' + BASE_CSS + V3_CSS + '</style>\n</head>\n' +
    // data-* 供 editor.js 读取（上传接口与 CSRF），避免把令牌写进内联脚本（CSP 更严）
    '<body class="' + esc(opts.bodyClass || "") + '" data-accent="' + esc(opts.accent || "indigo") + '" data-upload-endpoint="/media/upload" data-csrf="' + esc(opts.csrf || "") + '" data-can-review="' + (isReviewer ? "1" : "0") + '" data-can-admin="' + (isAdmin ? "1" : "0") + '">\n' +
    '<div id="live" role="status" aria-live="polite" class="sr-only"></div>' +
    '<noscript><div style="margin:0 0 14px;padding:10px 14px;border:1px solid var(--line);border-left:3px solid var(--warn);border-radius:8px;background:var(--warn-weak);color:var(--warn);font-size:13px">浏览器禁用了 JavaScript：文章可以正常读写，但命令面板、分栏预览、图片上传与自动保存不可用。</div></noscript>' +
    inner +
    cmdk +
    kbdHelp +
    '\n<script src="/static/app.js" defer></script>\n' +
    (user ? '<script src="/static/cmdk.js" defer></script>\n' : '') +
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

/* ---------------- 认证页共用外壳 ----------------
   登录、强制改密、2FA 验证共用同一套「电影镜头」舞台与玻璃卡：
   同一视觉语言让登录链路里的每一步都不会突然变成一张朴素白卡。
   opts.scene 选择静态背景（0-3），缺省用第 1 幅。 */
/* 流星层：参考 shadcn 生态动态组件（MagicUI meteors）的实现思路，
   用纯 CSS 变量 + 关键帧表达，不引入 canvas/第三方脚本。
   n 颗，位置/时长/延迟由确定性随机生成，刷新不跳动。 */
function lgMeteors(n, seed) {
  let x = (seed || 3) * 9301 + 49297;
  const r = function () { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  const out = [];
  for (let i = 0; i < (n || 16); i++) {
    const left = (r() * 120 - 10).toFixed(1);
    const dur = (5.5 + r() * 5).toFixed(2);
    const delay = (-r() * 12).toFixed(2);
    const len = Math.round(80 + r() * 130);
    const op = (0.25 + r() * 0.5).toFixed(2);
    out.push('<i style="--meteor-x:' + left + "%;--md:" + dur + "s;--mdl:" + delay + "s;--ml:" + len + "px;--mo:" + op + '"></i>');
  }
  return '<div class="lg-meteors" aria-hidden="true">' + out.join("") + "</div>";
}

/* 卡片外壳：旋转的锥形光晕（border beam）+ 跟随鼠标的高光（spotlight） */
function lgCardWrap(cardHtml) {
  return '<div class="lg-card-wrap">' +
    '<span class="lg-card-glow" aria-hidden="true"></span>' +
    '<div class="lg-card" data-lg-card>' + cardHtml + "</div>" +
  "</div>";
}

function lgStage(inner, opts) {
  opts = opts || {};
  return '<div class="lg-stage" aria-hidden="true">' +
    (inner || "") +
    (opts.meteors ? lgMeteors(opts.meteors, opts.seed || 3) : "") +
    '<div class="lg-leak"></div>' +
    '<div class="lg-shade"></div>' +
    '<svg class="lg-grain" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<filter id="lg-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>' +
      '<feColorMatrix type="saturate" values="0"/></filter>' +
      '<rect width="100%" height="100%" filter="url(#lg-noise)"/>' +
    "</svg>" +
    '<div class="lg-vignette"></div>' +
  "</div>";
}

function lgTopbar() {
  return '<header class="lg-top">' +
    '<span class="lg-top__brand"><span class="lg-top__mark" aria-hidden="true">修</span>' +
      '<span class="lg-top__name">修盒子<em>FIXBOX</em></span></span>' +
    '<span class="lg-top__meta">内容协作与发布后台</span>' +
  "</header>";
}

function lgEyeButton() {
  return '<button class="lg-eye" type="button" data-pw-toggle aria-pressed="false" aria-label="显示密码" title="显示密码">' +
    '<svg class="lg-eye__on" viewBox="0 0 20 20" aria-hidden="true"><path d="M1.8 10S4.9 4.6 10 4.6 18.2 10 18.2 10 15.1 15.4 10 15.4 1.8 10 1.8 10Z"/><circle cx="10" cy="10" r="2.6"/></svg>' +
    '<svg class="lg-eye__off" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3l14 14"/><path d="M8.1 4.9A7.7 7.7 0 0 1 10 4.6c5.1 0 8.2 5.4 8.2 5.4a15 15 0 0 1-2.6 3.2"/><path d="M5.4 6.4A15.6 15.6 0 0 0 1.8 10s3.1 5.4 8.2 5.4a8.4 8.4 0 0 0 3.2-.6"/></svg>' +
  "</button>";
}

function lgBrandBlock() {
  return '<div class="lg-brand">' +
    '<span class="lg-brand__mark" aria-hidden="true">修</span>' +
    '<span class="lg-brand__txt"><b>修盒子 · 内容后台</b><span>FIXBOX CONTENT STUDIO</span></span>' +
  "</div>";
}

/* 单场景认证页（强制改密 / 2FA 验证）：无轮播控件，只有静止插画 + 玻璃卡 */
function authPage(title, cardHtml, opts) {
  opts = opts || {};
  const scene = LOGIN_SCENES[opts.scene || 0];
  return layout(title,
    '<div class="lg-cinema lg-cinema--single" data-lg-cinema>' +
      lgStage('<div class="lg-scenes"><div class="lg-scene is-on">' + scene.svg + "</div></div>", { meteors: 12, seed: (opts.scene || 0) + 11 }) +
      lgTopbar() +
      '<div class="lg-side">' + lgCardWrap(cardHtml) +
        '<p class="lg-foot">登录行为会写入审计日志 · 请勿分享账号凭据</p>' +
      "</div>" +
    "</div>",
    { nav: false, accent: "indigo", bodyClass: "login-body lg-page", csrf: opts.csrf, scripts: ["/static/login.js"] });
}

function loginPage(opts) {
  opts = opts || {};
  const info = opts.info ? '<div class="alert alert--info" role="status">' + esc(opts.info) + "</div>" : "";

  /* ---------------- 电影镜头式登录 ----------------
     设计说明：
       · 舞台是四幅内联 SVG 插画，7.5s 自动换景 + 交叉淡入 + 缓慢运镜（Ken Burns）；
       · 右侧玻璃卡承载表单：任何画面下都保证可读、可填、可键盘操作；
       · 切换、视差、暂停由 /static/login.js 驱动（CSP 只允许 'self' 脚本，无内联脚本）；
       · 用户暂停 / 系统 reduced-motion / 标签页隐藏时停止自动轮播。 */
  const scenesHtml = LOGIN_SCENES.map(function (s, i) {
    return '<div class="lg-scene' + (i === 0 ? " is-on" : "") + '" data-lg-scene="' + i + '">' + s.svg + "</div>";
  }).join("");

  const dotsHtml = LOGIN_SCENES.map(function (s, i) {
    return '<button class="lg-dot' + (i === 0 ? " is-on" : "") + '" type="button" data-lg-go="' + i + '"' +
      ' aria-pressed="' + (i === 0 ? "true" : "false") + '" aria-label="切换到第 ' + (i + 1) + " 幅画面：" + esc(s.title) + '"' +
      ' data-lg-title="' + esc(s.title) + '" data-lg-line="' + esc(s.line) + '">' +
      "<i></i></button>";
  }).join("");

  const pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
  const captionText = function (s, i) {
    return '<span class="lg-caption__idx">' + pad2(i + 1) + " / " + pad2(LOGIN_SCENES.length) + "</span>" +
      '<span class="lg-caption__t">' + esc(s.title) + "</span>" +
      '<span class="lg-caption__l">' + esc(s.line) + "</span>";
  };

  return layout("登录",
    '<div class="lg-cinema" data-lg-cinema>' +
      /* 舞台：四幅画面 + 流星 + 暖光 + 颗粒 + 暗角 */
      lgStage('<div class="lg-scenes" data-lg-scenes>' + scenesHtml + "</div>", { meteors: 18, seed: 7 }) +

      /* 顶部品牌条 */
      '<header class="lg-top">' +
        '<span class="lg-top__brand"><span class="lg-top__mark" aria-hidden="true">修</span>' +
          '<span class="lg-top__name">修盒子<em>FIXBOX</em></span></span>' +
        '<span class="lg-top__meta">内容协作与发布后台</span>' +
      "</header>" +

      /* 左侧画面说明 */
      '<div class="lg-caption" data-lg-caption aria-hidden="true">' + captionText(LOGIN_SCENES[0], 0) + "</div>" +

      /* 画面控制：圆点 + 暂停 + 进度 */
      '<div class="lg-controls" data-lg-controls role="group" aria-label="登录页画面切换">' +
        '<div class="lg-dots">' + dotsHtml + "</div>" +
        '<button class="lg-pause" type="button" data-lg-pause aria-pressed="false" aria-label="暂停画面自动切换">' +
          '<svg class="lg-pause__ico lg-pause__ico--pause" viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3" width="2.6" height="10" rx="1"/><rect x="9.4" y="3" width="2.6" height="10" rx="1"/></svg>' +
          '<svg class="lg-pause__ico lg-pause__ico--play" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.4v9.2c0 .8.9 1.3 1.6.9l7-4.6c.6-.4.6-1.4 0-1.8l-7-4.6C5.9 2.1 5 2.6 5 3.4Z"/></svg>' +
          "<span data-lg-pause-label>暂停</span></button>" +
        '<div class="lg-progress" aria-hidden="true"><i data-lg-progress></i></div>' +
      "</div>" +

      /* 右侧表单卡（结构参考 shadcn login-02 / login-04：FieldGroup + FieldLabel +
         FieldDescription + 带 Spinner 的提交按钮；视觉沿用本项目的玻璃卡） */
      '<div class="lg-side">' +
        lgCardWrap(
          lgBrandBlock() +
          '<h1 class="lg-title">登录内容后台</h1>' +
          '<p class="lg-sub">继续编辑、审核与发布修盒子的排障教程。</p>' +
          (opts.error ? '<div class="alert alert--err" role="alert" id="login-error">' + esc(opts.error) + "</div>" : "") +
          info +
          '<form method="post" action="/login" class="lg-form" data-no-pending data-lg-form>' +
            '<input type="hidden" name="_csrf" value="' + esc(opts.csrf || "") + '">' +
            '<div class="lg-fieldgroup">' +
              '<div class="lg-field">' +
                '<div class="lg-field__head"><label for="email">邮箱</label></div>' +
                '<div class="lg-input">' +
                  '<span class="lg-input__ico" aria-hidden="true"><svg viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="2.4"/><path d="m3.4 6 6.6 5 6.6-5"/></svg></span>' +
                  '<input id="email" name="email" type="email" required autocomplete="username" autofocus placeholder="you@example.com" spellcheck="false"' +
                    (opts.error ? ' aria-invalid="true" aria-describedby="login-error"' : "") + ">" +
                "</div>" +
                '<p class="lg-field__desc">使用管理员分配的邮箱登录。</p>' +
              "</div>" +
              '<div class="lg-field">' +
                '<div class="lg-field__head"><label for="password">密码</label>' +
                  '<span class="lg-field__hint">忘记密码请联系管理员</span></div>' +
                '<div class="lg-input">' +
                  '<span class="lg-input__ico" aria-hidden="true"><svg viewBox="0 0 20 20"><rect x="4" y="9" width="12" height="8.4" rx="2.2"/><path d="M7 9V6.6a3 3 0 0 1 6 0V9"/><circle cx="10" cy="13.2" r="1.2"/></svg></span>' +
                  '<input id="password" name="password" type="password" required autocomplete="current-password" placeholder="请输入密码"' +
                    (opts.error ? ' aria-invalid="true" aria-describedby="login-error"' : "") + ">" +
                  lgEyeButton() +
                "</div>" +
                '<p class="lg-caps" data-lg-caps aria-live="polite"></p>' +
              "</div>" +
            "</div>" +
            '<button class="lg-submit" type="submit" data-lg-submit>' +
              '<span class="lg-submit__label">进入后台</span>' +
              '<span class="lg-spinner" aria-hidden="true"></span>' +
              '<svg class="lg-submit__arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11"/><path d="m11 5 5 5-5 5"/></svg>' +
            "</button>" +
          "</form>" +
          '<div class="lg-card__foot">' +
            '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6 16 5v5.2c0 3.6-2.4 6.4-6 7.4-3.6-1-6-3.8-6-7.4V5l6-2.4Z"/><path d="m7.6 9.8 1.8 1.8 3.2-3.4"/></svg>' +
            "<span>仅限内部编辑人员 · 账号由管理员分发</span>" +
            '<span class="lg-card__ver">v2.9</span>' +
          "</div>"
        ) +
        '<p class="lg-foot">登录行为会写入审计日志 · 请勿分享账号凭据</p>' +
      "</div>" +
    "</div>",
    { nav: false, accent: "indigo", bodyClass: "login-body lg-page", scripts: ["/static/login.js"] });
}

function changePasswordPage(opts) {
  opts = opts || {};
  const lockIco = '<span class="lg-input__ico" aria-hidden="true"><svg viewBox="0 0 20 20"><rect x="4" y="9" width="12" height="8.4" rx="2.2"/><path d="M7 9V6.6a3 3 0 0 1 6 0V9"/><circle cx="10" cy="13.2" r="1.2"/></svg></span>';
  const keyIco = '<span class="lg-input__ico" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="7" cy="10" r="3.2"/><path d="M10.2 10h6.4"/><path d="M14 10v2.6"/><path d="M16.6 10v3.6"/></svg></span>';
  const err = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";
  const forced = opts.forced
    ? '<div class="alert alert--info" role="status">' +
        (opts.activateToken
          ? "欢迎加入。请先设置登录密码，设置后账号即被激活。"
          : "这是首次登录（或密码已被重置），必须先设置新密码才能继续。") +
      "</div>"
    : "";
  const action = opts.activateToken ? "/activate" : "/change-password";
  const hidden = (opts.csrf ? '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' : "") +
    (opts.activateToken ? '<input type="hidden" name="t" value="' + esc(opts.activateToken) + '">' : "");

  function pwField(id, label, name, placeholder, help) {
    return '<div class="lg-field">' +
      '<div class="lg-field__head"><label for="' + id + '">' + esc(label) + "</label>" +
        (help ? '<span class="lg-field__hint">' + help + "</span>" : "") + "</div>" +
      '<div class="lg-input">' + lockIco +
        '<input id="' + id + '" name="' + name + '" type="password" required autocomplete="new-password" placeholder="' + esc(placeholder) + '">' +
        lgEyeButton() +
      "</div></div>";
  }

  const card = lgBrandBlock() +
    '<h1 class="lg-title">' + (opts.activateToken ? "设置登录密码" : "设置新密码") + "</h1>" +
    '<p class="lg-sub">' +
      (opts.activateToken
        ? "设置后即可用这个密码登录修盒子内容后台。"
        : "为保护内容安全，请设置一个足够强的密码。") +
    "</p>" +
    forced + err +
    '<form method="post" action="' + action + '" class="lg-form" data-no-pending data-lg-form>' +
      hidden +
      (opts.forced ? "" :
        '<div class="lg-field">' +
          '<div class="lg-field__head"><label for="current">当前密码</label></div>' +
          '<div class="lg-input">' + keyIco +
            '<input id="current" name="current" type="password" required autocomplete="current-password" placeholder="当前使用的密码">' +
          "</div></div>") +
      pwField("np", "新密码", "password", "至少 12 位") +
      pwField("np2", "确认新密码", "password2", "再输入一次") +
      '<p class="lg-rule">至少 12 位；需包含大写字母、小写字母、数字、符号中的至少 3 类；不得含常见词。</p>' +
      '<button class="lg-submit" type="submit" data-lg-submit>' +
        '<span class="lg-submit__label">' + (opts.activateToken ? "设置密码并激活" : "保存并继续") + "</span>" +
        '<span class="lg-spinner" aria-hidden="true"></span>' +
        '<svg class="lg-submit__arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11"/><path d="m11 5 5 5-5 5"/></svg>' +
      "</button>" +
    "</form>" +
    '<div class="lg-card__foot">' +
      '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6 16 5v5.2c0 3.6-2.4 6.4-6 7.4-3.6-1-6-3.8-6-7.4V5l6-2.4Z"/><path d="m7.6 9.8 1.8 1.8 3.2-3.4"/></svg>' +
      "<span>" + (opts.activateToken ? "一次性激活链接 · 设置后失效" : "改动会写入审计日志") + "</span>" +
    "</div>";

  return authPage(opts.activateToken ? "激活账号" : "修改密码", card, { csrf: opts.csrf, scene: 1 });
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
    return "<th><a class=\"sortlink\" href=\"" + esc(qs({ sort: next, page: "" })) + "\">" + esc(label) + arrow + "</a></th>";
  }

  /* 行内快捷操作 + 批量能力的公共前置（rows / 批量条 / 状态 tab 都要用，必须先于 rows 定义） */
  const rc = opts.rowCaps || {};
  const csrf = opts.csrf || "";
  function quickActs(a) {
    const st = a.status || "draft";
    const acts = [];
    if (st === "draft" && rc.submit) acts.push(["in_review", "提交审核", "btn--ghost"]);
    if (st === "in_review" && rc.publish) acts.push(["published", "发布", "btn--primary"]);
    if (st === "in_review" && rc.review) acts.push(["changes_requested", "退回", "btn--ghost"]);
    if (st === "changes_requested" && rc.edit) acts.push(["draft", "重新打开", "btn--ghost"]);
    if (!acts.length) return "";
    return acts.map(function (x) {
      return '<form class="inlineact" method="post" action="/articles/' + esc(a.slug) + '/status">' +
        '<input type="hidden" name="_csrf" value="' + esc(csrf) + '">' +
        '<input type="hidden" name="to" value="' + x[0] + '">' +
        '<button class="btn btn--sm ' + x[2] + '" type="submit">' + x[1] + "</button></form>";
    }).join("");
  }
  const canBatch = !!(rc.submit || rc.publish || rc.review || rc.edit || rc.archive);
  const colN = canBatch ? 8 : 7;

  const rows = items.map(function (a) {
    const acts = quickActs(a);
    return "<tr>" +
      (canBatch ? '<td class="tight batch-cell"><input type="checkbox" name="slugs" value="' + esc(a.slug) + '" form="fx-batch" aria-label="选择：' + esc(a.title || a.slug) + '"></td>' : "") +
      "<td><a class=\"link-strong\" href=\"/articles/" + esc(a.slug) + "\">" + esc(a.title || a.slug) + "</a>" +
        '<div class="slug">' + esc(a.slug) + "</div>" +
        ((a.sourcesCount || 0) < 1 ? '<span class="pill pill--changes_requested" title="缺少参考资料">缺来源</span>' : "") +
      "</td>" +
      "<td><span class=\"pill pill--" + esc(a.status) + "\">" + esc(statusLabel(a.status)) + "</span></td>" +
      '<td><span class="dot" style="background:var(--c-' + domColor(a.domain) + ')"></span>' +
        esc(domName(a.domain)) + '<div class="muted">' + esc(catName(a.category)) + "</div></td>" +
      "<td>" + esc(a.risk || "") + '<div class=\"muted\">' + esc(a.difficulty || "") + "</div></td>" +
      "<td class=\"num\">" + (a.sourcesCount || 0) + "</td>" +
      "<td class=\"muted num\">" + esc(a.updated || "") + "</td>" +
      '<td class="tight rowacts">' + (acts || "") +
        '<a class="btn btn--sm" href="/articles/' + esc(a.slug) + '">' + (a.status === "draft" ? "继续写" : "编辑") + "</a>" +
        '<a class="btn btn--sm btn--ghost" href="/articles/' + esc(a.slug) + '/preview-page" target="_blank" rel="noopener" title="用线上同一引擎渲染整页预览">预览</a></td>' +
      "</tr>";
  }).join("");

  // 空状态必须区分成因（Carbon 的空状态指南）：筛选后为空 vs 首次为空
  const hasFilter = !!(f.status || f.domain || f.risk || f.q || f.stale || f.missing);
  const emptyRow = hasFilter
    ? '<tr><td colspan="' + (canBatch ? 8 : 7) + '" class="empty"><div class="empty__ico">⌕</div>' +
      '<div class="empty__t">没有符合条件的文章</div>' +
      '<div>试试放宽筛选条件</div>' +
      '<div style="margin-top:12px"><a class="btn" href="/articles">清除全部筛选</a></div></td></tr>'
    : '<tr><td colspan="' + (canBatch ? 8 : 7) + '" class="empty"><div class="empty__ico">' + icon("empty", 24) + "</div>" +
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
      (cur > 1 ? '<a class="pager__btn" href="' + esc(qs({ page: cur - 1 })) + '">上一页</a>' : '<span class="pager__btn" aria-disabled="true">上一页</span>') +
      nums.map(function (n) {
        return n === "…" ? '<span class="pager__btn" aria-disabled="true">…</span>'
          : '<a class="pager__btn" href="' + esc(qs({ page: n })) + '"' + (n === cur ? ' aria-current="page"' : "") + ">" + n + "</a>";
      }).join("") +
      (cur < totalPages ? '<a class="pager__btn" href="' + esc(qs({ page: cur + 1 })) + '">下一页</a>' : '<span class="pager__btn" aria-disabled="true">下一页</span>') +
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
  /* 状态筛选从下拉改为可扫读的彩色 tab（2026-10-24 UI 优化）：
     带计数、当前项高亮，比「点开下拉才知道有什么状态」直观得多。 */
  const sc = opts.statusCounts || {};
  const STATUS_TABS = [["", "全部", null], ["published", "已发布", "mint"], ["draft", "草稿", "amber"],
    ["in_review", "审核中", "indigo"], ["changes_requested", "退回修改", "coral"], ["archived", "归档", "gray"]];
  const statusTabs = '<nav class="statustabs" aria-label="按状态筛选">' +
    STATUS_TABS.map(function (t) {
      const n = t[0] === "" ? (opts.total || 0) : (sc[t[0]] || 0);
      const on = (f.status || "") === t[0];
      return '<a class="statustab' + (t[2] ? " statustab--" + t[2] : "") + (on ? " is-on" : "") + '" href="' + esc(qs({ status: t[0], page: "" })) + '"' +
        (on ? ' aria-current="page"' : "") + ">" + t[1] + "<b>" + n + "</b></a>";
    }).join("") + "</nav>";

  /* 行内快捷操作：按「当前状态 → 允许的下一步」渲染一个小按钮；
     权限由服务端路由再次校验，这里只做展示过滤（不给没权限的人看按钮）。 */
  /* 批量操作：勾选后工具条亮起；目标动作只列出当前用户有权执行的流转 */
  const BATCH_ACTS = [["in_review", "提交审核", "article:submit"], ["published", "发布", "article:publish"],
    ["changes_requested", "退回修改", "article:review"], ["draft", "转回草稿", "article:edit"], ["archived", "归档", "article:archive"]];
  const batchOpts = BATCH_ACTS.filter(function (x) { return rc[{ "article:submit": "submit", "article:publish": "publish", "article:review": "review", "article:edit": "edit", "article:archive": "archive" }[x[2]]]; })
    .map(function (x) { return '<option value="' + x[0] + '">' + x[1] + "</option>"; }).join("");
  const batchBar = canBatch
    ? '<form id="fx-batch" class="batchbar" method="post" action="/articles/batch-status" data-batchbar>' +
      '<input type="hidden" name="_csrf" value="' + esc(csrf) + '">' +
      '<span class="batchbar__count" data-batch-count>未勾选</span>' +
      '<span class="batchbar__hint">勾选下方文章后，可批量提交审核 / 发布 / 退回</span>' +
      '<select name="to" aria-label="批量目标状态">' + batchOpts + "</select>" +
      '<button class="btn btn--sm btn--primary" type="submit" disabled data-batch-apply>应用到所选</button>' +
      '<button class="btn btn--sm" type="button" data-batch-clear disabled>取消选择</button>' +
      "</form>"
    : "";

  // 生效中的筛选用彩色胶囊回显——原先只能靠「清除」按钮猜测当前过滤了什么
  function chip(label, href) {
    return '<span class="filters__chip">' + esc(label) +
      '<a href="' + esc(href) + '" aria-label="移除筛选：' + esc(label) + '" title="移除该筛选">✕</a></span>';
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

  /* 内容流程条：第一次用也能一眼看到「写草稿 → 审核 → 发布」以及每步有多少篇 */
  const flowbar = '<section class="flowbar" aria-label="内容流程">' +
    '<a class="flowbar__step" href="' + esc(qs({ status: "draft", page: "" })) + '"><b>1</b>' +
      '<span>写草稿<em>' + (sc.draft || 0) + ' 篇待处理</em></span></a>' +
    '<span class="flowbar__arrow" aria-hidden="true">→</span>' +
    '<a class="flowbar__step" href="/review"><b>2</b>' +
      '<span>提交审核<em>' + (sc.in_review || 0) + ' 篇待审</em></span></a>' +
    '<span class="flowbar__arrow" aria-hidden="true">→</span>' +
    '<a class="flowbar__step" href="' + esc(qs({ status: "published", page: "" })) + '"><b>3</b>' +
      '<span>发布上线<em>' + (sc.published || 0) + ' 篇已上线</em></span></a>' +
    '<span class="sp"></span>' +
    '<span class="flowbar__tip">草稿点「提交审核」→ 审核台给结论 → 通过后发布</span>' +
    (canCreate ? '<a class="btn btn--sm btn--primary" href="/articles/new">＋ 写一篇文章</a>' : "") +
  "</section>";

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
    /* error 原先没有渲染出口：行内「发布/退回」失败时服务端 302 回 /articles?error=…，
       页面却只显示 notice，用户点了没反应也看不到原因。 */
    (opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "") +

    activeFilters +
    flowbar +
    viewsBar({ views: opts.views || [], currentQs: opts.currentQs || "", csrf: opts.csrf, userId: opts.user && opts.user.user_id }) +
    statusTabs +
    batchBar +
    '<form class="card" method="get" action="/articles" style="padding:14px 20px">' +
      '<div class="row" style="gap:12px;align-items:flex-end">' +
        '<div style="flex:2;min-width:180px"><label for="q">搜索</label>' +
          '<input id="q" name="q" type="search" value="' + esc(f.q || "") + '" placeholder="标题或 slug"></div>' +
        '<div style="flex:1;min-width:130px"><label for="domain">领域</label><select id="domain" name="domain">' + domainOpts + "</select></div>" +
        '<div style="flex:1;min-width:110px"><label for="risk">风险</label><select id="risk" name="risk">' + riskOpts + "</select></div>" +
        '<input type="hidden" name="status" value="' + esc(f.status || "") + '">' +
        '<input type="hidden" name="sort" value="' + esc(f.sort || "-updated") + '">' +
        '<button class="btn" type="submit">筛选</button>' +
        (hasFilter ? '<a class="btn btn--ghost" href="/articles">清除</a>' : "") +
      "</div>" +
      '<div class="row" style="margin-top:10px;gap:8px">' +
        '<a class="btn btn--sm' + (f.stale ? " btn--primary" : "") + '" href="' + esc(qs({ stale: f.stale ? "" : "1", page: "" })) + '">超 180 天未复核</a>' +
        '<a class="btn btn--sm' + (f.missing === "sources" ? " btn--primary" : "") + '" href="' + esc(qs({ missing: f.missing === "sources" ? "" : "sources", page: "" })) + '">缺参考资料</a>' +
      "</div>" +
    "</form>" +

    '<div class="card card--flush">' +
      '<div class="tablewrap"><table class="table--articles"><thead><tr>' +
        (canBatch ? '<th class="tight batch-cell"><input type="checkbox" id="batch-all" form="fx-batch" aria-label="全选本页"></th>' : "") +
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
  /* 每行的三个控件用 aria-label 带出行号（序号信息对读屏用户是必需的：
     「标题」出现 N 次，若不说明第几行，读屏里无法区分）。 */
  const sourceRows = sources.map(function (s, idx) {
    const no = idx + 1;
    return '<div class="row src-row" style="margin-bottom:8px">' +
      '<input type="text" name="src_title_' + idx + '" aria-label="参考资料 ' + no + " 标题（必填）" + '" placeholder="标题（必填）" value="' + esc(s.title || "") + '" style="flex:2">' +
      '<input type="text" name="src_url_' + idx + '" aria-label="参考资料 ' + no + " URL（必填）" + '" placeholder="https://…（必填）" value="' + esc(s.url || "") + '" style="flex:3">' +
      '<select name="src_type_' + idx + '" aria-label="参考资料 ' + no + ' 类型" style="flex:1">' + typeOptsFor(s.type) + "</select>" +
      '<button class="btn btn--sm" type="button" data-src-remove aria-label="删除第 ' + no + ' 条参考资料">删除</button></div>';
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
      /* 锚点必须指向真实存在的 id：
         field() 生成的包裹层是 f-<name>，但「正文」与「参考资料」不是 field() 生成的
         （分别是 textarea#body 与 div#src-list），拼成 #f-body / #f-src-list 是不存在的锚点
         （禁用 JS 时点了不动）。editor.js 的 data-jump 也读这个 id。 */
      const anchor = (c.target === "body" || c.target === "src-list") ? c.target : "f-" + c.target;
      return '<li class="check--' + c.level + '" data-chk="' + esc(c.target) + '"><span class="check__ic">' + icon(icoName, 14) + "</span>" +
        '<a href="#' + anchor + '" data-jump="' + anchor + '">' + esc(c.label) + "</a></li>";
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

    /* 写作步骤引导：第一次用也知道「先写正文 → 补信息 → 预览保存」 */
    '<div class="write-guide" id="write-guide">' +
      '<div class="write-guide__steps">' +
        '<a class="wg-step" href="#body" data-jump="body"><b>1</b><span>写正文<em>先写「一句话结论」+「分步骤」，其余自由组织</em></span></a>' +
        '<a class="wg-step" href="#f-title" data-jump="f-title"><b>2</b><span>补必填信息<em>标题、URL 标识、领域分类、≥1 条参考资料</em></span></a>' +
        '<button class="wg-step" type="button" data-fs-open><b>3</b><span>预览并保存<em>左侧原文、右侧实时渲染，确认后再保存/提交</em></span></button>' +
      "</div>" +
      '<p class="write-guide__tip">不确定从哪开始？先写正文，其它信息可以在发布前再补。必填项没补齐时，右侧检查清单会列出来。</p>' +
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
        /* 正文工具条：把最高频的 Markdown 结构变成一键插入。
           之前只有「插入骨架」和「插入图片」两个按钮，写正文要记语法。 */
        '<div class="md-toolbar" role="toolbar" aria-label="Markdown 快捷格式">' +
          '<button class="btn btn--icon" type="button" data-md="h2" title="二级标题（Ctrl+Alt+2）" aria-label="插入二级标题">' + icon("heading2", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-md="bold" title="加粗（Ctrl+B）" aria-label="加粗">' + icon("bold", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-md="italic" title="斜体（Ctrl+I）" aria-label="斜体">' + icon("italic", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-md="code" title="行内代码" aria-label="行内代码">' + icon("code", 16) + "</button>" +
          '<span class="md-toolbar__sep"></span>' +
          '<button class="btn btn--icon" type="button" data-md="ul" title="无序列表" aria-label="无序列表">' + icon("list", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-md="ol" title="有序步骤" aria-label="有序步骤">' + icon("ordered", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-md="quote" title="引用 / 提示块" aria-label="插入引用提示块">' + icon("quote", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-md="table" title="插入排查表" aria-label="插入排查表">' + icon("table", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-md="link" title="插入链接" aria-label="插入链接">' + icon("link", 16) + "</button>" +
          '<span class="md-toolbar__sep"></span>' +
          '<button class="btn btn--icon" type="button" data-insert-skeleton title="插入建议的段落骨架" aria-label="插入段落骨架">' + icon("template", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-formula-open title="插入 LaTeX 公式" aria-label="插入公式">' + icon("formula", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-media-open title="从图片库选择" aria-label="从图片库选择图片">' + icon("library", 16) + "</button>" +
          '<button class="btn btn--icon" type="button" data-upload-image title="上传图片（也可直接粘贴/拖入）" aria-label="上传图片">' + icon("imagePlus", 16) + "</button>" +
          '<input type="file" id="fx-img-file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden>' +
          '<span class="md-toolbar__sep"></span>' +
          '<button class="btn btn--icon" type="button" data-fs-open title="全屏分栏：左侧可编辑原文，右侧实时渲染" aria-label="打开全屏分栏预览">' + icon("fullscreen", 16) + "</button>" +
          '<span class="md-toolbar__hint">支持拖入 / 粘贴图片 · Ctrl+S 保存</span>' +
        '</div>' +
        /* 正文图片清单：上传/粘贴后立刻显示路径 + 缩略图，点路径打开原图 */
        '<div id="fx-uploads" class="fx-uploads" hidden aria-label="正文中的图片"></div>' +
        /* 正文框的可访问名称：视觉上分组标题已经说明「正文」，但读屏进入 textarea 时
           没有 label 只会播报「多行文本」——用 sr-only label 补齐，不占版面。 */
        '<label class="sr-only" for="body">正文（Markdown）</label>' +
        '<textarea id="body" name="body" spellcheck="false" data-toc-source>' + esc(opts.body || "") + '</textarea>' +
        '<div class="meter" style="margin-top:6px"><span id="wc">—</span><span id="rt"></span><span id="autosave-state">未修改</span>' +
          (isNew ? "" : '<button class="btn btn--sm" type="button" id="autosave-toggle" aria-pressed="true" style="min-height:26px;padding:0 10px;font-size:12px;margin-left:8px">自动保存：开</button>') +
        "</div>" +
      '</div></details>' +

      // 组 3：检索（默认展开——知识库站点的核心）
      '<details class="grp grp--search"><summary>检索与关联（发布前补充）<span class="grp__hint">决定用户能不能搜到，可先空着</span></summary><div class="grp__bd">' +
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
          /* 状态不再是表单控件：它由「提交审核 / 通过 / 退回 / 归档」这些工作流动作驱动。
             给下拉框时，editor 角色可以直接选 published 写进 front-matter，
             等于绕过审核与发布队列（DB 状态又不会跟着变，两边立刻不一致）。 */
          field("当前状态", "status-ro",
            '<div class="readonly-pill" id="status-ro"><span class="pill pill--' + esc(F.status) + '">' + esc(statusLabel(F.status)) + "</span>" +
            '<span class="field__help">状态由审核/发布流程控制，不在这里修改。</span></div>') +
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
          '<div id="publish-check">' + checklist() + "</div></div>" +
        '<div class="card" style="padding:16px">' +
          '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico">' + icon("list") + '</span><h3>段落导航</h3></div>' +
          tocHost + '</div>' +
      "</div>" +
    "</div>" +

    /* 常驻底部操作条：长表单滚到任何位置都能保存/提交/预览 */
    '<div class="writebar" id="writebar">' +
      '<div class="writebar__state">' +
        '<b id="writebar-title">' + (isNew ? "开始写草稿" : "当前状态：" + esc(statusLabel(F.status))) + "</b>" +
        '<span id="writebar-hint" class="muted">' + (isNew ? "保存后会进入草稿，再提交审核" : "必填项补齐后可提交审核 · Ctrl+S 保存") + "</span>" +
      "</div>" +
      '<span class="sp"></span>' +
      '<a class="btn btn--sm btn--ghost" href="#body" data-jump="body">跳到正文</a>' +
      '<button class="btn btn--sm" type="button" data-fs-open>全屏分栏</button>' +
      '<button class="btn btn--sm" type="submit" name="action" value="save">保存草稿</button>' +
      buttons +
      (!isNew && opts.canSubmit && F.status === "draft"
        ? '<button class="btn btn--sm btn--primary" type="submit" form="status-form">提交审核</button>' : "") +
      (!isNew && opts.canReview && F.status === "in_review"
        ? '<a class="btn btn--sm btn--primary" href="/review">去审核</a>' : "") +
    "</div>" +
    "</form>" +
    /* 「提交审核」用独立表单（嵌套 form 非法），按钮用 form= 关联 */
    (!isNew && opts.canSubmit
      ? '<form id="status-form" method="post" action="/articles/' + esc(opts.slug) + '/status" hidden>' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
          '<input type="hidden" name="to" value="in_review">' +
        "</form>" : "") +
    /* 评论区必须在 </form> 之后：commentsBlock 里自身是若干 <form>（发表评论 / 标记已解决），
       嵌套 form 是非法 HTML，浏览器会直接丢掉内层 form 标签 ——
       结果是「发表评论」实际提交了整张文章表单，「标记已解决」不会带 slug/csrf。 */
    commentsBlock({ slug: opts.slug, comments: opts.comments || [], csrf: opts.csrf }) +
    /* 全屏分栏编辑器（原生 <dialog>：自带焦点圈定、Esc 关闭、顶层渲染）
       左侧原文可直接改，右侧用与线上同一套引擎实时渲染；textarea 不参与表单提交，
       内容实时同步回 #body，保存时仍是同一张表单。 */
    '<dialog id="fs-editor" class="fs-editor" aria-labelledby="fs-title">' +
      '<header class="fs-editor__bar">' +
        '<span class="fs-editor__dot" aria-hidden="true"></span>' +
        '<h2 class="fs-editor__title" id="fs-title">全屏分栏 · 左侧原文 / 右侧渲染</h2>' +
        '<span class="fs-editor__status" id="fs-status" role="status" aria-live="polite">已同步</span>' +
        '<span class="sp"></span>' +
        '<button class="btn btn--sm" type="button" id="fs-save" title="保存草稿（Ctrl+S）">保存草稿</button>' +
        '<button class="btn btn--sm" type="button" id="fs-close" aria-label="退出全屏分栏（Esc）">退出</button>' +
      '</header>' +
      '<div class="fs-editor__body">' +
        '<section class="fs-editor__pane fs-editor__pane--src">' +
          '<div class="fs-editor__panehd"><label for="fs-source">原文（Markdown，可直接编辑）</label>' +
            '<span class="muted" id="fs-count"></span></div>' +
          '<textarea id="fs-source" spellcheck="false" aria-describedby="fs-count"></textarea>' +
        '</section>' +
        '<section class="fs-editor__pane fs-editor__pane--prev">' +
          '<div class="fs-editor__panehd"><span>渲染结果（与线上同一引擎）</span>' +
            '<span class="muted">随输入自动刷新</span></div>' +
          '<div class="fs-editor__prev" id="fs-preview"><p class="muted" style="padding:18px">打开后开始渲染…</p></div>' +
        '</section>' +
      '</div>' +
    '</dialog>' +

    /* 插入公式：插入 $…$ / $$…$$，右侧渲染结果里由构建同款引擎转成 MathML */
    '<dialog id="fx-formula" class="fx-dialog" aria-labelledby="fx-formula-title">' +
      '<header class="fx-dialog__hd"><h2 id="fx-formula-title">插入公式</h2>' +
        '<button class="btn btn--sm" type="button" data-formula-close>关闭（Esc）</button></header>' +
      '<div class="fx-dialog__bd">' +
        '<label for="fx-formula-tex">LaTeX 公式</label>' +
        '<textarea id="fx-formula-tex" rows="4" spellcheck="false" placeholder="例如：E=mc^2、\\frac{a}{b}、\\sum_{i=1}^{n} i"></textarea>' +
        '<div class="fx-formula__mode" role="radiogroup" aria-label="公式排版">' +
          '<label><input type="radio" name="fx-formula-mode" value="inline" checked> 行内公式 <code>$…$</code></label>' +
          '<label><input type="radio" name="fx-formula-mode" value="block"> 独立公式 <code>$$…$$</code></label>' +
        "</div>" +
        '<p class="muted" style="margin:8px 0 0">支持 LaTeX 语法；插入后在右侧渲染结果里实时预览。</p>' +
      "</div>" +
      '<footer class="fx-dialog__ft"><button class="btn btn--sm" type="button" data-formula-close>取消</button>' +
        '<button class="btn btn--sm btn--primary" type="button" data-formula-insert>插入公式</button></footer>' +
    "</dialog>" +

    /* 图片库：不用重新上传，直接从已上传素材里挑 */
    '<dialog id="fx-media" class="fx-dialog fx-media-picker" aria-labelledby="fx-media-title">' +
      '<header class="fx-dialog__hd"><h2 id="fx-media-title">从图片库选择</h2>' +
        '<button class="btn btn--sm" type="button" data-media-close>关闭（Esc）</button></header>' +
      '<div class="fx-dialog__bd">' +
        ((opts.mediaItems || []).length
          ? '<div class="fx-media__grid">' + (opts.mediaItems || []).map(function (m) {
            return '<button type="button" class="fx-media__item" data-media-path="../media/' + esc(m.filename) + '" data-media-alt="' + esc(m.alt || "") + '">' +
              '<img src="/media/' + esc(m.filename) + '" alt="' + esc(m.alt || "") + '" loading="lazy">' +
              '<span class="fx-media__name">' + esc(m.alt || m.filename) + "</span></button>";
          }).join("") + "</div>"
          : '<div class="empty"><div class="empty__ico">' + icon("media", 24) + "</div>" +
            '<div class="empty__t">图片库还没有图片</div><div>用工具栏的「上传图片」或直接粘贴 / 拖入图片</div></div>') +
      "</div>" +
      '<footer class="fx-dialog__ft"><a class="btn btn--sm btn--ghost" href="/media">打开媒体库</a>' +
        '<button class="btn btn--sm" type="button" data-media-close>取消</button></footer>' +
    "</dialog>" +

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
      ico: "save", title: "v" + esc(opts.rev.revision_no) + " → 当前",
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
  const me = opts.userId;
  const chips = views.map(function (v) {
    const active = (v.querystring || "") === cur;
    const href = "/articles" + (v.querystring ? "?" + esc(v.querystring) : "");
    /* 只有自己的视图能删（服务端 deleteView 也按 owner_id 过滤）。
       旧实现里有 /views/delete 路由却没有任何入口 —— 保存错了只能一直留着。 */
    const canDelete = me && v.owner_id === me;
    const del = canDelete
      ? '<form method="post" action="/views/delete" style="display:inline">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf || "") + '">' +
          '<input type="hidden" name="id" value="' + esc(v.id) + '">' +
          '<button class="viewchip__del" type="submit" aria-label="删除视图「' + esc(v.name) + '」" title="删除该视图" data-confirm="删除视图「' + esc(v.name) + '」？不会影响文章。" data-confirm-ok="删除">✕</button>' +
        "</form>"
      : "";
    return '<span class="viewchip' + (active ? " viewchip--on" : "") + '">' +
      '<a class=\"btn btn--sm' + (active ? " btn--primary" : "") + '" href="' + href + '\">' +
      esc(v.name) + (v.is_shared ? " · 共享" : "") + "</a>" + del + "</span>";
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
  const fb = opts.feedback || {};
  /* 命名为 fbs 而不是 fs：fs 是本文件顶部 require 的 node 模块，
     在函数里重新声明同名变量会把它遮蔽掉（将来在这里用 fs 会静默拿到一个统计对象）。 */
  const fbs = fb.stats || {};

  function greeting() {
    const h = new Date().getHours();
    return h < 6 ? "夜深了" : (h < 12 ? "早上好" : (h < 18 ? "下午好" : "晚上好"));
  }
  const now = new Date();
  const dateStr = now.getFullYear() + " 年 " + (now.getMonth() + 1) + " 月 " + now.getDate() + " 日";
  const who = (opts.user && (opts.user.name || opts.user.email)) || "";
  const total = opts.total || 0;

  /* ---------------- 今日待办 ----------------
     工作台的第一职责是回答「我现在该干什么」，所以把可执行的四类待办提到最上面，
     数字直接链到对应列表（审核台 / 筛选后的文章列表）。 */
  function queueItem(key, label, hint, tone, href) {
    const v = s[key] === undefined ? 0 : s[key];
    return '<a class="queue-item" data-tone="' + tone + '" href="' + href + '">' +
      '<span class="queue-item__k">' + esc(label) + "</span>" +
      '<span class="queue-item__v">' + v + "</span>" +
      '<span class="queue-item__h">' + esc(hint) + "</span></a>";
  }
  const queue = '<section class="queue-card" aria-label="今日待办">' +
    '<div class="queue-card__hd">' + icon("inbox", 16) + '<h2>今日待办</h2>' +
      '<span class="muted">按「需要我处理」的顺序排列，点数字直达</span>' +
      '<span class="topbar__sp"></span>' +
      '<a class="btn btn--sm" href="/review">进入审核台</a></div>' +
    '<div class="queue-list">' +
      queueItem("inReview", "待我审核", "等我给出结论", "indigo", "/review") +
      queueItem("changesRequested", "退回修改", "等作者改完再交", "coral", "/articles?status=changes_requested") +
      queueItem("drafts", "我的草稿", "还没提交审核", "amber", "/articles?status=draft") +
      queueItem("missingSources", "缺参考资料", "发布前的硬性检查", "sky", "/articles?missing=sources") +
    "</div></section>";

  /* ---------------- 第一次使用也看得懂的 3 步流程 ----------------
     工作台是登录后的第一屏：先用一句话说明「写 → 审 → 发」，
     并且每一步都能直接点进去，减少摸索成本。 */
  const flowguide = '<section class="flowguide" aria-label="内容流程：从写作到上线">' +
    '<div class="flowguide__hd"><b>怎么用：从写到上线 3 步</b>' +
      '<span class="muted">第一次用先看这里；每一步都可以直接点进去</span></div>' +
    '<ol class="flowguide__steps">' +
      '<li><b>1</b><div><strong>写草稿</strong><span>「文章 → 新建文章」，先写正文，再补必填信息</span></div>' +
        '<a class="btn btn--sm" href="/articles/new">去写</a></li>' +
      '<li><b>2</b><div><strong>提交审核</strong><span>文章页点「提交审核」，审核台读完给结论</span></div>' +
        '<a class="btn btn--sm" href="/review">审核台</a></li>' +
      '<li><b>3</b><div><strong>发布上线</strong><span>审核通过后点「保存并发布」，自动构建并切换</span></div>' +
        '<a class="btn btn--sm" href="/publish">发布页</a></li>' +
    "</ol></section>";

  /* ---------------- 总览横幅（真实派生指标） ---------------- */
  const published = s.published || 0;
  const withSrc = Math.max(0, total - (s.missingSources || 0));
  const srcPct = total ? Math.round(withSrc / total * 100) : 0;
  const okRev = Math.max(0, published - (s.stale || 0));
  const revPct = published ? Math.round(okRev / published * 100) : 0;
  const hero = '<div class="hero">' +
    '<div class="hero__main">' +
      '<div class="hero__k">知识库总量</div>' +
      '<div class="hero__n">' + total + '</div>' +
      '<div class="hero__sub">篇教程 · 其中 ' + published + ' 篇已上线</div>' +
    "</div>" +
    '<div class="hero__side">' +
      '<div class="hero__m"><b>' + srcPct + '%</b><span>来源覆盖率</span></div>' +
      '<div class="hero__m"><b>' + revPct + '%</b><span>复核在有效期内</span></div>' +
      '<div class="hero__m"><b>' + (s.stale || 0) + '</b><span>超 180 天未复核</span></div>' +
    "</div></div>";

  /* ---------------- 领域分布（横向条，比竖柱更易读中文标签） ---------------- */
  const byDomain = opts.byDomain || [];
  const maxDom = byDomain.reduce(function (m, d) { return Math.max(m, d.n); }, 1);
  const domainRows = byDomain.slice(0, 10).map(function (d) {
    const pct = Math.max(3, Math.round(d.n / maxDom * 100));
    return '<a class="hbar" href="/articles?domain=' + encodeURIComponent(d.id) + '" title="' + esc(d.name) + "：" + d.n + ' 篇">' +
      '<span class="hbar__lab">' + esc(d.short || d.name) + "</span>" +
      '<span class="hbar__track"><i style="width:' + pct + '%"></i></span>' +
      '<span class="hbar__n">' + d.n + "</span></a>";
  }).join("");

  /* ---------------- 状态构成（环形图，零依赖） ---------------- */
  const st = opts.byStatus || { published: 0, draft: 0, in_review: 0, changes_requested: 0, archived: 0 };
  const stTotal = Object.keys(st).reduce(function (a, k) { return a + st[k]; }, 0) || 1;
  const ST_COLORS = { published: "#157F5B", draft: "#D79B24", in_review: "#2F49C8", changes_requested: "#C0441D", archived: "#A99E93" };
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
  const donutStyle = segs.length ? ("background:conic-gradient(" + segs.join(",") + ")") : "background:var(--surface-3)";

  /* ---------------- 更新热力 ---------------- */
  const heat = opts.heat || [];
  const heatCells = heat.map(function (c) {
    return '<i data-l="' + (c.level || 0) + '" title="' + esc(c.label) + "：" + c.n + ' 篇更新"></i>';
  }).join("");
  const heatSum = heat.reduce(function (a, c) { return a + (c.n || 0); }, 0);

  /* ---------------- 发布节奏 ---------------- */
  const trend = opts.pubTrend || [];
  const totalPub = trend.reduce(function (a, d) { return a + d.n; }, 0);
  const maxPub = trend.reduce(function (m, d) { return Math.max(m, d.n); }, 1);
  const trendBars = trend.map(function (d) {
    const pct = d.n === 0 ? 3 : Math.max(12, Math.round(d.n / maxPub * 100));
    /* 标签必须转义：虽然当前是服务端按日期生成的 "10/26"，
       但同一段数据将来可能来自 publish_jobs 的其它字段 —— 不转义就是一个属性注入点。 */
    return '<div class="chart__col" title="' + esc(d.label) + "：发布 " + (d.n || 0) + ' 次">' +
      '<div class="chart__val">' + (d.n || "") + "</div>" +
      '<div class="chart__bar' + (d.n ? " chart__bar--on" : "") + '" style="height:' + pct + '%"></div>' +
      '<div class="chart__lab">' + esc(d.label) + "</div></div>";
  }).join("");

  /* ---------------- 读者反馈摘要（详情进数据分析页） ---------------- */
  const fbCard = '<div class="card">' +
    '<div class="card__hd"><span class="card__ico">' + icon("chart", 15) + '</span><h3>读者反馈</h3>' +
      '<span class="topbar__sp"></span><span class="muted">文章页底部「这篇教程解决你的问题了吗？」</span>' +
      '<a class="btn btn--sm" href="/analytics" style="margin-left:10px">查看数据分析</a></div>' +
    '<div class="card__bd"><div class="kpistrip" style="margin:0">' +
      '<div class="kpistrip__c"><div class="kpistrip__k">已解决</div><div class="kpistrip__v">' + (fbs.resolved || 0) + '</div></div>' +
      '<div class="kpistrip__c"><div class="kpistrip__k">未解决</div><div class="kpistrip__v">' + (fbs.unresolved || 0) + '</div></div>' +
      '<div class="kpistrip__c"><div class="kpistrip__k">解决率</div><div class="kpistrip__v">' + (fbs.resolutionRate || 0) + '<small>%</small></div></div>' +
      '<div class="kpistrip__c"><div class="kpistrip__k">近 7 天未解决</div><div class="kpistrip__v">' + (fbs.unresolved7 || 0) + '</div></div>' +
    "</div></div></div>";

  /* ---------------- 明细表 ---------------- */
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
  const emptyStale = '<tr><td colspan="3" class="empty"><div class="empty__ico">' + icon("check", 22) + '</div>' +
    '<div class="empty__t">全部在复核周期内</div><div>没有超过 180 天未复核的文章</div></td></tr>';

  return layout("工作台",
    '<div class="dash-hello">' +
      '<div><h1>' + greeting() + "，" + esc(who) + "</h1>" +
        '<div class="dash-hello__date">' + dateStr + " · 共 " + total + " 篇文章 · 今日建议先看「今日待办」</div></div>" +
      '<div class="dash-hello__acts">' +
        '<a class="btn" href="/review">审核台</a>' +
        '<a class="btn" href="/analytics">数据分析</a>' +
        '<a class="btn btn--primary" href="/articles/new">＋ 新建文章</a>' +
      "</div>" +
    "</div>" +

    queue + flowguide + hero +

    '<div class="grid2" style="align-items:stretch">' +
      '<div class="card" style="margin-bottom:18px">' +
        '<div class="card__hd"><span class="card__ico">' + icon("taxonomy", 15) + '</span><h3>各领域文章数</h3>' +
          '<span class="topbar__sp"></span><span class="muted">点击进入该领域列表</span></div>' +
        '<div class="card__bd">' + (domainRows || '<div class="muted">暂无数据</div>') + "</div>" +
      "</div>" +
      '<div class="card" style="margin-bottom:18px;display:flex;flex-direction:column">' +
        '<div class="card__hd"><span class="card__ico">' + icon("chart", 15) + '</span><h3>状态构成</h3>' +
          '<span class="topbar__sp"></span><span class="muted">共 ' + stTotal + ' 篇</span></div>' +
        '<div class="card__bd" style="flex:1;display:flex;align-items:center">' +
          '<div class="row" style="gap:24px;align-items:center;flex-wrap:nowrap">' +
            '<div class="donut" style="' + donutStyle + '"><div class="donut__c"><div><div class="donut__n">' +
              stTotal + '</div><div class="donut__l">篇</div></div></div></div>' +
            '<ul class="legend">' + (legend.join("") || '<li class="muted">暂无数据</li>') + "</ul>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>" +

    '<div class="grid2" style="align-items:stretch">' +
      '<div class="card">' +
        '<div class="card__hd"><span class="card__ico">' + icon("clock", 15) + '</span><h3>更新活动</h3>' +
          '<span class="topbar__sp"></span><span class="muted">最近 80 天 · 共 ' + heatSum + ' 次更新</span></div>' +
        '<div class="card__bd"><div class="heat">' + (heatCells || "") + "</div></div>" +
      "</div>" +
      '<div class="card">' +
        '<div class="card__hd"><span class="card__ico">' + icon("publish", 15) + '</span><h3>发布节奏</h3>' +
          '<span class="topbar__sp"></span><span class="muted">近 30 天成功 ' + totalPub + ' 次</span>' +
          '<a class="btn btn--sm" href="/publish" style="margin-left:10px">发布页</a></div>' +
        '<div class="card__bd"><div class="chart chart--trend">' + (trendBars || '<span class="muted">暂无发布记录</span>') + "</div></div>" +
      "</div>" +
    "</div>" +

    fbCard +

    '<div class="dash-cols">' +
      '<div class="card card--flush">' +
        '<div class="card__hd"><span class="card__ico">' + icon("draft", 15) + '</span><h3>最近编辑</h3>' +
          '<span class="topbar__sp"></span><a class="btn btn--sm" href="/articles">全部文章</a></div>' +
        '<div class="tablewrap"><table class="dash-table"><thead><tr>' +
        '<th style="width:auto">标题</th><th class="tight">状态</th><th class="tight">更新</th><th class="tight">复核</th>' +
        "</tr></thead><tbody>" +
        (recentRows || '<tr><td colspan="4" class="empty"><div class="empty__ico">' + icon("empty", 22) +
          '</div><div class="empty__t">暂无内容</div><div>新建第一篇文章后会出现在这里</div></td></tr>') +
        "</tbody></table></div>" +
      "</div>" +
      '<div class="card card--flush">' +
        '<div class="card__hd"><span class="card__ico">' + icon("warning", 15) + '</span><h3>陈旧内容</h3>' +
          '<span class="muted" style="font-size:11.5px">超 180 天未复核</span></div>' +
        '<div class="tablewrap"><table class="dash-table"><thead><tr>' +
        '<th style="width:auto">标题</th><th class="tight">距上次</th><th class="tight">上次复核</th>' +
        "</tr></thead><tbody>" + (staleRows || emptyStale) + "</tbody></table></div>" +
      "</div>" +
    "</div>",
    Object.assign({ current: "dashboard", accent: "indigo", crumbs: [{ label: "工作台" }] }, opts));
}
function publishPage(opts) {
  // 状态与动作原先直接显示英文枚举（succeeded / publish / archive）
  const JOB_STATUS = { succeeded: "成功", failed: "失败", running: "进行中", queued: "排队中" };
  const JOB_ACTION = { publish: "发布", archive: "归档", revert: "回滚" };
  const jobRows = opts.jobs.map(function (j) {
    const dur = j.finished_at && j.started_at
      ? Math.round((new Date(j.finished_at) - new Date(j.started_at)) / 1000) + "s" : "—";
    const cls = j.status === "succeeded" ? "pill--published" : (j.status === "failed" ? "pill--changes_requested" : "pill--draft");
    return "<tr><td>#" + j.id + "</td>" +
      "<td>" + esc(JOB_ACTION[j.action] || j.action) + ' <span class="muted">' + esc(j.slug || "") + "</span></td>" +
      '<td><span class="pill ' + cls + '">' + esc(JOB_STATUS[j.status] || j.status) + "</span></td>" +
      '<td class="num tight">' + esc(String(j.created_at || "").slice(0,19).replace("T"," ")) + "</td>" +
      '<td class="num tight">' + dur + "</td>" +
      "<td>" + (j.error ? '<span style="color:var(--warn)">' + esc(String(j.error).slice(0,140)) + "</span>" : "") + "</td></tr>";
  });
  /* 发布记录默认只显示最近 8 条，更早的折叠起来：历史多了以后页面不会无限拉长 */
  const JOB_HEAD = "<thead><tr><th>任务</th><th>类型</th><th>状态</th><th>时间</th><th>耗时</th><th>问题</th></tr></thead>";
  const recentJobs = jobRows.slice(0, 8).join("");
  const olderJobs = jobRows.slice(8);
  const jobsTable = '<div class="card card--flush">' +
    '<div class="tablewrap"><table>' + JOB_HEAD + "<tbody>" +
      (jobRows.length ? recentJobs
        : '<tr><td colspan="6" class="empty">' + '<div class="empty__ico">' + icon("publish", 24) + '</div>' +
          '<div class="empty__t">还没有发布记录</div><div>点击上方「立即发布到线上」后，这里会显示进度与结果</div></td></tr>') +
    "</tbody></table></div>" +
    (olderJobs.length
      ? '<details class="more-jobs"><summary>查看更早的 ' + olderJobs.length + " 条发布记录</summary>" +
        '<div class="tablewrap"><table>' + JOB_HEAD + "<tbody>" + olderJobs.join("") + "</tbody></table></div></details>"
      : "") +
    (jobRows.length ? '<div class="card__ft muted" style="font-size:11.5px">共 ' + jobRows.length + " 条记录，默认显示最近 8 条</div>" : "") +
    "</div>";
  return layout("发布",
    pageHead({
      ico: "publish", title: "发布到线上",
      sub: "把最新内容同步到公开站点：生成网站 → 替换线上文件 → 自动检查。同一时刻只跑一个任务。",
      acts: '<span class="page-head__chip">手动发布通道</span>'
    }) +
    (opts.notice ? '<div class="alert alert--ok" role="status">' + esc(opts.notice) + "</div>" : "") +
    (opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "") +
    '<div class="card card--accent">' +
    '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico">' + icon("publish") + "</span><h3>发布到线上</h3>" +
      '<span class="topbar__sp"></span><span class="muted">不改文章内容，只更新公开站点</span></div>' +
    '<ol class="publish-steps">' +
      "<li><b>1</b><div><strong>生成网站</strong><span>把文章编译成网页文件</span></div></li>" +
      "<li><b>2</b><div><strong>替换线上文件</strong><span>整目录一次性切换，读者不会看到半成品</span></div></li>" +
      "<li><b>3</b><div><strong>自动检查</strong><span>逐页访问线上地址，确认都能打开</span></div></li>" +
    "</ol>" +
    '<form method="post" action="/publish" class="publish-act">' +
    '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
    '<button class="btn btn--primary" type="submit">立即发布到线上</button>' +
    '<span class="muted">通常 1–2 分钟完成，期间可以继续写文章。</span></form></div>' +
    jobsTable,
    Object.assign({ current: "publish", accent: "mint", crumbs: [{ label: "发布" }] }, opts));
}

function usersPage(opts) {
  // 角色与限定领域原先直接显示英文 slug（admin / editor / net-basic），
  // 对非技术管理员不友好 —— 统一翻成中文再展示。
  const ROLE_LABEL = { admin: "管理员", editor: "编辑", reviewer: "审核", viewer: "只读" };
  const domNameById = {};
  ((opts.taxonomy && opts.taxonomy.domains) || []).forEach(function (d) { domNameById[d.id] = d.name; });
  /* roles 来自 string_agg，可能是 null（无角色）或 "admin, editor" 这样的串：
     未知值原样返回即可，但不能返回 undefined（会渲染成字面量 "undefined"）。 */
  function roleLabel(r) {
    const key = String(r === undefined || r === null ? "" : r).trim();
    if (!key) return "—";
    return ROLE_LABEL[key] || key;
  }
  const rows = opts.users.map(function (u) {
    const rl = roleLabel(u.roles || "");
    const scoped = u.scope_domain
      ? ' <span class="muted">（限定 ' + esc(domNameById[u.scope_domain] || u.scope_domain) + "）</span>" : "";
    /* 待验证邮箱徽章：root 发过验证码但尚未完成验证时可见（含过期标记） */
    const pending = u.pending_email
      ? '<div class="slug" title="验证通过后才会替换登录邮箱">待验证：' + esc(u.pending_email) +
        (u.pending_email_expires && new Date(u.pending_email_expires) < new Date() ? "（已过期）" : "") + "</div>"
      : "";
    const action =
      '<button class="btn btn--sm" type="button" data-email-bind data-id="' + u.id + '" data-email="' + esc(u.email) + '" data-name="' + esc(u.name || "") + '" data-csrf="' + esc(opts.csrf) + '">换绑邮箱</button>' +
      (u.is_root ? "" :
        '<form method="post" action="/users/' + u.id + '/toggle" style="display:inline">' +
        '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
        '<button class="btn btn--sm" type="submit">' + (u.status === "active" ? "停用" : "启用") + "</button></form>");
    return "<tr><td>" + esc(u.email) + (u.is_root ? ' <span class="pill pill--admin">root</span>' : "") + pending + "</td>" +
      "<td>" + esc(u.name || "") + "</td>" +
      "<td>" + esc(rl) + scoped + "</td>" +
      '<td><span class="pill ' + (u.status === "active" ? "pill--published" : "pill--archived") + '">' + (u.status === "active" ? "启用" : "停用") + "</span></td>" +
      '<td class="num tight">' + (esc(String(u.last_login_at || "").slice(0,19).replace("T"," ")) || "—") + "</td>" +
      '<td class="rowacts">' + action + "</td></tr>";
  }).join("");
  const invites = opts.invites.map(function (v) {
    const expired = v.expires_at ? new Date(v.expires_at) < new Date() : false;
    const st = v.used_at ? "已使用" : (v.revoked_at ? "已撤销" : (expired ? "已过期" : "待使用"));
    /* 未使用、未撤销的邀请才需要撤销入口（链接泄露时止损） */
    const revoke = (!v.used_at && !v.revoked_at)
      ? '<form method="post" action="/invites/' + esc(v.id) + '/revoke" style="display:inline">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
          '<button class="btn btn--sm btn--ghost" type="submit" aria-label="撤销发给 ' + esc(v.email) + ' 的邀请"' +
          ' data-confirm="撤销后该激活链接立即失效（对方点开会提示链接无效）。"' +
          ' data-confirm-ok="撤销邀请">撤销</button></form>'
      : "";
    return "<tr><td>" + esc(v.email) + "</td><td>" + esc(roleLabel(v.role)) + "</td>" +
      '<td class="tight">' + st + "</td>" +
      '<td class="num tight">' + esc(String(v.created_at || "").slice(0,19).replace("T"," ")) + "</td>" +
      '<td class="rowacts">' + revoke + "</td></tr>";
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
    (opts.inviteLink ? '<div class="alert alert--info" role="status"><strong>一次性激活链接（只显示这一次，请立即复制）：</strong><br><code style="word-break:break-all">' + esc(opts.inviteLink) + '</code><br><span class="muted">有效期 ' + (opts.inviteHours || 72) + ' 小时；一次性；可由管理员撤销。</span></div>' : "") +
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
    '<thead><tr><th>邮箱</th><th>角色</th><th class="tight">状态</th><th class="num tight">创建</th><th></th></tr></thead><tbody>' +
    (invites || '<tr><td colspan="5" class="empty"><div class="empty__ico">↪</div><div class="empty__t">暂无邀请</div></td></tr>') +
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
      const catInputId = "cat-name-" + d.id + "-" + cat.id;
      return '<div class="tax-cat">' +
        '<form class="tax-cat__edit" method="post" action="/taxonomy/category">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
          '<input type="hidden" name="action" value="save">' +
          '<input type="hidden" name="domain_id" value="' + esc(d.id) + '">' +
          '<input type="hidden" name="id" value="' + esc(cat.id) + '">' +
          /* 每个分类一个唯一 id：否则读屏只听到一串「编辑框」，分不清在改哪个分类。 */
          '<input id="' + esc(catInputId) + '" type="text" name="name" value="' + esc(cat.name) + '" maxlength="40" required aria-label="分类「' + esc(cat.name) + "」的名称" + '">' +
          '<button class="btn btn--sm" type="submit">保存</button>' +
        '</form>' +
        '<form method="post" action="/taxonomy/category">' +
          '<input type="hidden" name="_csrf" value="' + esc(opts.csrf) + '">' +
          '<input type="hidden" name="action" value="delete">' +
          '<input type="hidden" name="domain_id" value="' + esc(d.id) + '">' +
          '<input type="hidden" name="id" value="' + esc(cat.id) + '">' +
          '<button class="btn btn--sm btn--danger" type="submit" aria-label="删除分类「' + esc(cat.name) + '」" data-confirm="删除分类「' + esc(cat.name) + '」？已有文章引用时系统会阻止。" data-confirm-danger data-confirm-ok="删除">删除</button>' +
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
          '<button class="btn btn--sm btn--danger" type="submit" aria-label="删除领域「' + esc(d.name) + '」及其下分类" data-confirm="删除领域「' + esc(d.name) + '」及其下分类？已有文章引用时系统会阻止。" data-confirm-danger data-confirm-ok="删除">删除领域</button>' +
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
    return '<tr><td class="num tight">' + esc(String(l.created_at || "").slice(0,19).replace("T"," ")) + "</td>" +
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
    '<label for="secret">密钥（手动输入用）</label>' +
    /* 复制按钮走 data-copy（app.js 里统一处理）：
       内联 onclick 会被后台的 CSP（script-src 'self'，无 unsafe-inline）拦掉，
       表现为「按钮点了没反应」，且控制台只有一行 CSP 违规。 */
    '<div class="row"><input type="text" readonly value="' + esc(opts.secret) + '" style="font-family:var(--mono)" id="secret">' +
    '<button class="btn" type="button" data-copy-from="secret">复制</button></div>' +
    '<label for="otpauth-uri" style="margin-top:14px">otpauth 链接（可贴到二维码生成器）</label>' +
    '<input id="otpauth-uri" type="text" readonly value="' + esc(opts.uri) + '" style="font-family:var(--mono);font-size:12px">' +
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
  const shieldIco = '<span class="lg-input__ico" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M10 2.6 16 5v5.2c0 3.6-2.4 6.4-6 7.4-3.6-1-6-3.8-6-7.4V5l6-2.4Z"/><path d="m7.4 9.8 1.9 1.9 3.4-3.6"/></svg></span>';
  const err = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";
  /* 分格验证码输入：结构参考 shadcn 的 InputOTP（单输入框 + 视觉分格），
     无 JS 时自动退化成普通输入框（cells/切换按钮由 CSS+JS 增强）。 */
  const otpCells = new Array(6).fill("<i></i>").join("");
  const mode = opts.otpMode === "recovery" ? "recovery" : "code";
  const recovery = mode === "recovery";
  const card = lgBrandBlock() +
    '<h1 class="lg-title">双因素验证</h1>' +
    '<p class="lg-sub">请输入身份验证器上的 6 位验证码。手机不在身边时，也可以使用一枚恢复码。</p>' +
    err +
    '<form method="post" action="/login/totp" class="lg-form" data-no-pending data-lg-form>' +
      '<input type="hidden" name="_csrf" value="' + esc(opts.csrf || "") + '">' +
      '<div class="lg-field">' +
        '<div class="lg-field__head"><label for="code" id="otp-label">验证码</label>' +
          '<span class="lg-field__hint" data-otp-hint>' + (recovery ? "恢复码" : "6 位数字") + "</span></div>" +
        '<div class="lg-otp" data-otp data-mode="' + mode + '">' +
          '<input id="code" name="code" class="lg-otp__input" type="text"' +
            (recovery ? ' maxlength="24" placeholder="输入恢复码"' : ' inputmode="numeric" pattern="[0-9]{6}" maxlength="6"') +
            ' autocomplete="one-time-code" required autofocus' +
            ' aria-labelledby="otp-label" aria-describedby="otp-help">' +
          '<div class="lg-otp__cells" aria-hidden="true">' + otpCells + "</div>" +
        "</div>" +
        '<p class="lg-field__desc" id="otp-help" data-otp-help>' +
          (recovery ? "恢复码可在「账号安全」中生成，每枚只能使用一次。" : "验证码每 30 秒更新一次；也可以使用一枚恢复码。") +
        "</p>" +
        '<button class="lg-otp__switch" type="button" data-otp-switch hidden>' +
          (recovery ? "使用验证码" : "使用恢复码") + "</button>" +
      "</div>" +
      '<button class="lg-submit" type="submit" data-lg-submit>' +
        '<span class="lg-submit__label">验证并进入</span>' +
        '<span class="lg-spinner" aria-hidden="true"></span>' +
        '<svg class="lg-submit__arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11"/><path d="m11 5 5 5-5 5"/></svg>' +
      "</button>" +
    "</form>" +
    '<div class="lg-card__foot">' +
      '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6 16 5v5.2c0 3.6-2.4 6.4-6 7.4-3.6-1-6-3.8-6-7.4V5l6-2.4Z"/><path d="m7.6 9.8 1.8 1.8 3.2-3.4"/></svg>' +
      "<span>验证失败 5 次会暂时锁定，请确认手机时间准确</span>" +
    "</div>";
  return authPage("双因素验证", card, { csrf: opts.csrf, scene: 3 });
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

function sourcesCheckPage(opts) {
  const job = opts.job || { status: "idle" };
  /* report 来自 check-sources.cjs（另一个模块）且可能是一轮旧任务留下的对象：
     缺 summary / urls 时不能让整页 500，退化为「没有可展示的结果」。 */
  const rawRep = job.report;
  const rep = rawRep && rawRep.summary && Array.isArray(rawRep.urls) ? rawRep : null;
  const summary = rep ? rep.summary : null;
  const csrf = opts.csrf || "";
  const KIND_LABEL = { ok: "正常", dead: "死链", blocked: "疑似反爬", network: "疑似被墙/网络", server: "服务端错误" };
  const KIND_PILL = { ok: "published", dead: "changes_requested", blocked: "draft", network: "in_review", server: "changes_requested" };

  let body = pageHead({
    ico: "search", title: "来源体检",
    sub: "批量探测全部文章的来源外链与正文外链。服务器在广州，探测结果≈大陆读者能否打开。",
    acts: summary ? '<span class="page-head__chip">' + (summary.total || 0) + " 条外链</span>" : ""
  });

  if (job.status === "running") {
    body += '<div class="alert alert--info" role="status" data-srcpoll>' +
      "体检进行中（开始于 " + esc(String(job.startedAt || "").slice(0, 19).replace("T", " ")) + "）——共几百条外链，约需 1-3 分钟，本页会自动刷新。" +
      "</div>";
  } else if (job.status === "error") {
    body += '<div class="alert alert--err" role="alert">上一轮体检失败：' + esc(job.error || "未知错误") + "</div>";
  }

  const startForm = '<form method="post" action="/sources-check/run" style="display:inline">' +
    '<input type="hidden" name="_csrf" value="' + esc(csrf) + '">' +
    '<button class="btn btn--primary" type="submit"' + (job.status === "running" ? " disabled" : "") + ">" +
    (rep ? "重新体检" : "开始体检") + "</button></form>";

  if (!rep && job.status !== "running") {
    body += '<div class="card card--accent">' +
      '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico">' + icon("search") + '</span><h3>还没有体检记录</h3></div>' +
      '<p class="muted" style="margin:0 0 16px">体检只读不改：收集 front-matter 的 sources 与正文外链，逐条 GET 探测（8 秒超时、最多 5 跳重定向、并发 8），把结果分成「正常 / 死链 / 疑似反爬 / 疑似被墙 / 服务端错误」。</p>' +
      startForm + "</div>";
    return layout("来源体检", body, Object.assign({ current: "sources", accent: "sky", crumbs: [{ label: "来源体检" }] }, opts));
  }

  if (rep) {
    const s = summary;
    const pill = function (kind, label, count) {
      return '<span class="pill pill--' + KIND_PILL[kind] + '">' + label + " " + count + "</span>";
    };
    body += '<div class="card">' +
      '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico">' + icon("chart") + '</span><h3>体检结果</h3></div>' +
      '<p class="muted" style="margin:0 0 12px">完成于 ' + esc(String(job.finishedAt || "").slice(0, 19).replace("T", " ")) + " · 共 " + s.total + " 条</p>" +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px">' +
        pill("ok", "正常", s.ok) + pill("dead", "死链", s.dead) +
        pill("blocked", "疑似反爬", s.blocked) + pill("network", "疑似被墙/网络", s.network) +
        pill("server", "服务端错误", s.server) +
      "</div>" +
      '<div class="row row--end" style="gap:10px">' + startForm +
        '<a class="btn btn--sm" href="' + (opts.showAll ? "/sources-check" : "/sources-check?all=1") + '">' +
        (opts.showAll ? "只看问题项" : "显示全部 " + s.total + " 条") + "</a>" +
      "</div></div>";

    const rows = rep.urls.filter(function (u) { return opts.showAll || u.kind !== "ok"; });
    const trs = rows.map(function (u) {
      const kindLabel = KIND_LABEL[u.kind] || "其他";
      const kindPill = KIND_PILL[u.kind] || "archived";
      return "<tr>" +
        '<td><span class="pill pill--' + kindPill + '">' + esc(kindLabel) + "</span></td>" +
        "<td>" + (u.status ? u.status : "—") + (u.error ? '<div class="muted" style="font-size:12px">' + esc(u.error) + "</div>" : "") + "</td>" +
        '<td style="max-width:34em;word-break:break-all"><a href="' + esc(safeHref(u.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(u.url) + "</a>" +
          (u.finalUrl && u.finalUrl !== u.url ? '<div class="muted" style="font-size:12px">→ ' + esc(u.finalUrl) + "</div>" : "") + "</td>" +
        "<td>" + (Array.isArray(u.articles) ? u.articles : []).map(function (slug) {
          return '<a href="/articles/' + esc(slug) + '">' + esc(slug) + "</a>";
        }).join(", ") + "</td>" +
        "</tr>";
    }).join("");
    body += '<div class="card">' +
      '<div class="card__hd" style="padding:0 0 12px"><span class="card__ico">' + icon("articles") + '</span><h3>' +
      (opts.showAll ? "全部外链" : "问题项（" + rows.length + " 条）") + "</h3></div>" +
      (trs
        ? '<table><thead><tr><th>分类</th><th>状态</th><th>外链</th><th>涉及文章</th></tr></thead><tbody>' + trs + "</tbody></table>"
        : '<div class="empty"><div class="empty__ico">' + icon("check", 24) + '</div><div class="empty__t">没有问题项</div><div>全部外链可达，或仅为需人工复核的反爬/网络类。</div></div>') +
      "</div>";
    body += '<div class="card"><p class="muted" style="margin:0">' +
      "口径：<b>死链（404/410）</b>应换成现行官方页面；<b>疑似反爬 / 疑似被墙</b>不代表可删——微软、厂商支持页对脚本请求普遍返回 403，浏览器通常可达，处理前请先人工打开确认；<b>服务端错误</b>多半是对方站点临时问题，过段时间复测。</p></div>";
  }

  return layout("来源体检", body, Object.assign({ current: "sources", accent: "sky", crumbs: [{ label: "来源体检" }] }, opts));
}

/* ---------------- 审核台 ----------------
   为什么单独做一页，而不是「列表 + 编辑器」两页来回跳：
   审核是「读 → 判断 → 给结论」的连续动作，跳页会丢掉上下文。
   这里左队列、右全文、下操作区，一次评审不离开页面；
   建议/退回意见直接写成文章评论（和编辑器里的评论区同一份数据）。 */
function reviewPage(opts) {
  const csrf = opts.csrf || "";
  const queue = opts.queue || [];
  const cur = opts.current || null;
  const counts = opts.counts || {};
  const filter = opts.filter || "in_review";
  const notice = opts.notice ? '<div class="alert alert--ok" role="status">' + esc(opts.notice) + "</div>" : "";
  const error = opts.error ? '<div class="alert alert--err" role="alert">' + esc(opts.error) + "</div>" : "";

  /* 注意：这里不要用 role="tablist"。tablist 要求子元素是 role="tab" 并配 aria-selected，
     而这两个是**导航链接**（改变 URL 后整页重渲染），用 <nav> + aria-current 才是正确语义。 */
  const tabs = '<nav class="statustabs" aria-label="审核队列">' +
    '<a class="statustab' + (filter === "in_review" ? " is-on" : "") + '" href="/review"' + (filter === "in_review" ? ' aria-current="page"' : "") + ">待审核<b>" + (counts.in_review || 0) + "</b></a>" +
    '<a class="statustab' + (filter === "changes_requested" ? " is-on" : "") + '" href="/review?status=changes_requested"' + (filter === "changes_requested" ? ' aria-current="page"' : "") + ">退回修改<b>" + (counts.changes_requested || 0) + "</b></a>" +
    "</nav>";

  const queueHtml = queue.length
    ? queue.map(function (it) {
        const on = cur && cur.slug === it.slug;
        return '<a class="rq-item' + (on ? " is-on" : "") + '" href="/review?status=' + encodeURIComponent(filter) + "&slug=" + encodeURIComponent(it.slug) + '"' + (on ? ' aria-current="page"' : "") + ">" +
          '<span class="rq-item__t">' + esc(it.title || it.slug) + "</span>" +
          '<span class="rq-item__m">' +
            '<span class="pill pill--' + esc(it.status) + '">' + esc(statusLabel(it.status)) + "</span>" +
            (it.domainName ? "<span>" + esc(it.domainName) + "</span>" : "") +
            (it.updated ? '<span class="mono">' + esc(it.updated) + "</span>" : "") +
          "</span></a>";
      }).join("")
    : '<div class="rq-empty">' +
        (filter === "in_review" ? "当前没有待审核的文章。作者提交审核后会出现在这里。" : "没有退回修改中的文章。") +
      "</div>";

  const queueCard = '<aside class="review-queue" aria-label="审核队列">' +
    '<div class="review-queue__hd">' + icon("review", 15) + "<h2>审核队列</h2>" +
      '<span class="muted" style="margin-left:auto">' + queue.length + " 篇</span></div>" +
    '<div class="review-queue__list">' + queueHtml + "</div></aside>";

  if (!cur) {
    return layout("审核台",
      pageHead({ ico: "review", title: "审核台", sub: "读全文、看检查项、一次给出结论。退回意见会写成文章评论，作者在编辑器里能看到。",
        acts: '<span class="page-head__chip">待审核 ' + (counts.in_review || 0) + " 篇</span>" }) +
      notice + error + tabs +
      '<div class="review-grid">' + queueCard +
        '<div class="review-main">' +
          '<div class="card"><div class="empty" style="padding-bottom:14px">' +
            '<div class="empty__ico">' + icon("review", 24) + "</div>" +
            '<div class="empty__t">现在没有待审核的文章</div>' +
            "<div>作者提交审核后会自动出现在左侧队列；可以先看看审核要做什么。</div>" +
          "</div>" +
          '<ol class="review-tips">' +
            "<li><b>1</b><div><strong>读全文</strong><span>结论是否说清、步骤能否照做、命令是否需要管理员权限</span></div></li>" +
            "<li><b>2</b><div><strong>看检查项</strong><span>必要段落、参考资料、配图 alt 是否齐全</span></div></li>" +
            "<li><b>3</b><div><strong>给结论</strong><span>通过＝自动发布；退回＝意见会变成作者看得见的评论</span></div></li>" +
          "</ol>" +
          '<div style="display:flex;gap:8px;justify-content:flex-end;padding:0 18px 16px"><a class="btn btn--sm" href="/articles">去文章列表</a>' +
            '<a class="btn btn--sm" href="/articles/new">写一篇新文章</a></div>' +
          "</div></div></div>",
      Object.assign({ current: "review", accent: "indigo", crumbs: [{ label: "审核台" }] }, opts));
  }

  const m = cur.meta || {};
  const sec = cur.sections || {};
  const required = sec.required || [];
  const missing = sec.missing || [];
  const present = required.filter(function (n) { return missing.indexOf(n) < 0; });
  const srcN = cur.sourcesCount || 0;
  const canPublish = !!opts.canPublish;
  const canReview = !!opts.canReview;

  const checkRows = required.map(function (n) {
    const ok = missing.indexOf(n) < 0;
    return '<li class="check--' + (ok ? "ok" : "bad") + '"><span class="check__ic">' +
      icon(ok ? "check" : "rejected", 13) + "</span><span>" + esc(n) + (ok ? "" : "（正文缺少该段落）") + "</span></li>";
  }).join("") +
    '<li class="check--' + (srcN ? "ok" : "bad") + '"><span class="check__ic">' +
      icon(srcN ? "check" : "rejected", 13) + "</span><span>参考资料 " + srcN + " 条" + (srcN ? "" : "（发布前应至少 1 条）") + "</span></li>" +
    '<li class="check--' + (cur.revCount ? "ok" : "warn") + '"><span class="check__ic">' +
      icon(cur.revCount ? "check" : "warning", 13) + "</span><span>修订记录 " + (cur.revCount || 0) + " 版</span></li>";

  const metaTable = '<table class="meta-table"><tbody>' +
    "<tr><th>领域</th><td>" + esc(cur.domainName || m.domain || "—") + "</td></tr>" +
    "<tr><th>分类</th><td>" + esc(cur.categoryName || m.category || "—") + "</td></tr>" +
    "<tr><th>风险</th><td>" + esc(m.risk || "—") + " · " + esc(m.difficulty || "—") + " · " + esc(m.time || "—") + "</td></tr>" +
    "<tr><th>适用</th><td>" + esc((Array.isArray(m.os) ? m.os.join(" / ") : m.os) || "—") + "</td></tr>" +
    "<tr><th>更新</th><td>" + esc(m.updated || "—") + " · 复核 " + esc(m.reviewed_at || "未复核") + "</td></tr>" +
    "<tr><th>slug</th><td class=\"mono\">" + esc(cur.slug) + "</td></tr>" +
    "</tbody></table>";

  const comments = (cur.comments || []).map(function (c) {
    return '<div class="cmt' + (c.resolved_at ? " cmt--done" : "") + '">' +
      '<div class="cmt__hd"><strong>' + esc(c.author_name || c.author_email || "—") + "</strong>" +
        '<span class="muted">' + esc(String(c.created_at || "").slice(0, 16).replace("T", " ")) + "</span>" +
        (c.resolved_at ? '<span class="pill pill--published">已解决</span>' : "") + "</div>" +
      '<div class="cmt__bd">' + esc(c.body).replace(/\n/g, "<br>") + "</div></div>";
  }).join("");

  const decideForm = '<form method="post" action="/review/decision" id="review-decide">' +
    '<input type="hidden" name="_csrf" value="' + esc(csrf) + '">' +
    '<input type="hidden" name="slug" value="' + esc(cur.slug) + '">' +
    '<input type="hidden" name="status" value="' + esc(filter) + '">' +
    '<label for="rnote">审核意见（退回时必填，会作为评论记录）</label>' +
    '<textarea id="rnote" name="note" style="min-height:96px;font-family:inherit;font-size:13px" placeholder="例如：第 3 步的 netsh 命令需要管理员权限，请补充说明；来源里微软文档链接已失效，换当前页面。"></textarea>' +
    '<div class="review-act" style="margin-top:12px">' +
      (canPublish ? '<button class="btn btn--primary" type="submit" name="decision" value="approve">通过并发布</button>' : '<span class="review-note">你的角色可以给意见，但发布需要 reviewer / admin 权限。</span>') +
      (canReview ? '<button class="btn btn--danger" type="submit" name="decision" value="reject">退回修改</button>' : "") +
      '<span class="review-note">通过 = 立即入发布队列；退回 = 状态变为「退回修改」并通知作者。</span>' +
    "</div></form>";

  const docCard = '<section class="review-doc">' +
    '<div class="review-doc__hd">' +
      "<h2>" + esc(m.title || cur.slug) + "</h2>" +
      '<span class="pill pill--' + esc(m.status || "in_review") + '">' + esc(statusLabel(m.status || "in_review")) + "</span>" +
      '<a class="btn btn--sm" href="/articles/' + esc(cur.slug) + '">打开编辑器</a>' +
      '<a class="btn btn--sm" href="/articles/' + esc(cur.slug) + '/revisions">修订历史</a>' +
      /* 不再加 role="button"：它是一个在新标签页打开链接的 <a>，读屏报「按钮」会误导用户预期。 */
      '<a class="btn btn--sm" href="/articles/' + esc(cur.slug) + '/preview-page" target="_blank" rel="noopener">新窗口预览</a>' +
    "</div>" +
    '<iframe title="文章预览" src="' + esc(opts.previewUrl || ("/articles/" + cur.slug + "/preview-page")) + '" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>' +
  "</section>";

  const sideCards = '<div class="review-side">' +
    '<div class="card" style="margin:0"><div class="card__hd"><span class="card__ico">' + icon("check", 15) + '</span><h3>发布前检查</h3>' +
      '<span class="topbar__sp"></span><span class="muted">' + present.length + "/" + required.length + " 必备段落</span></div>" +
      '<div class="card__bd">' + metaTable + '<ul class="check" style="margin-top:12px">' + checkRows + "</ul></div></div>" +
    '<div class="card" style="margin:0"><div class="card__hd"><span class="card__ico">' + icon("review", 15) + '</span><h3>审核结论</h3></div>' +
      '<div class="card__bd">' + decideForm + "</div></div>" +
    "</div>";

  const commentCard = comments
    ? '<div class="card"><div class="card__hd"><span class="card__ico">' + icon("draft", 15) + '</span><h3>历史审核意见</h3></div><div class="card__bd">' + comments + "</div></div>"
    : "";

  return layout("审核台",
    pageHead({ ico: "review", title: "审核台",
      sub: "左侧队列 · 右侧全文 · 下方结论。通过后自动入发布队列；退回意见会写成文章评论。",
      acts: '<span class="page-head__chip">待审核 ' + (counts.in_review || 0) + " 篇</span>" }) +
    notice + error + tabs +
    '<div class="kbd-hint" aria-label="审核快捷键">' +
      "<span>键盘操作</span><kbd>J</kbd><kbd>K</kbd> 切换队列 · <kbd>A</kbd> 通过并发布 · " +
      "<kbd>R</kbd> 退回并填意见 · <kbd>?</kbd> 全部快捷键</div>" +
    '<div class="review-grid">' + queueCard +
      '<div class="review-main">' + docCard + sideCards + commentCard + "</div>" +
    "</div>" +
    /* 常驻结论条：长文读到一半也能直接给结论，不必滚回底部的表单。
       form 属性把按钮关联到页面里的 #review-decide，textarea 仍在原位置。 */
    '<div class="review-bar">' +
      '<span class="review-bar__t">正在审核：<b>' + esc(m.title || cur.slug) + "</b></span>" +
      '<span class="topbar__sp"></span>' +
      /* 两个按钮都必须按能力渲染：旧实现无条件渲染「退回修改」，
         只有 review 权限的人看到能点、点了却被服务端 403 打回。 */
      (canReview ? '<button class="btn btn--danger" type="submit" form="review-decide" name="decision" value="reject" data-review-reject>退回修改</button>' : "") +
      (canPublish ? '<button class="btn btn--primary" type="submit" form="review-decide" name="decision" value="approve">通过并发布</button>' : "") +
    "</div>" +
    '<div style="height:64px"></div>',
    Object.assign({ current: "review", accent: "indigo", crumbs: [{ label: "审核台" }], scripts: ["/static/review.js"] }, opts));
}

/* ---------------- 数据分析 ----------------
   页面职责：回答「内容有没有真的帮到人」。
   数据来源是文章页的匿名反馈（无 IP、无指纹），以及内容本身的健康度。
   这里不做「访问量」之类的虚荣指标 —— 后台没有埋点，就不编造。 */
function analyticsPage(opts) {
  const fb = opts.feedback || {};
  const fbs = fb.stats || {};   // 同上：不要遮蔽 fs 模块
  const health = opts.health || {};
  const issueLabels = { premise: "适用前提", steps: "步骤或顺序", command: "命令或脚本",
    error: "报错或现象", result: "修复结果", source: "链接或资料", other: "其他" };
  const issues = fb.issues || [];
  const issueTotal = issues.reduce(function (a, i) { return a + (i.n || 0); }, 0) || 1;

  const issueRows = issues.map(function (item) {
    const pct = Math.round((item.n || 0) / issueTotal * 100);
    return '<div class="hbar" title="' + esc(issueLabels[item.issue_type] || "其他") + "：" + item.n + ' 条">' +
      '<span class="hbar__lab">' + esc(issueLabels[item.issue_type] || "其他") + "</span>" +
      '<span class="hbar__track"><i style="width:' + Math.max(3, pct) + '%"></i></span>' +
      '<span class="hbar__n">' + (item.n || 0) + "</span></div>";
  }).join("");

  const articleRows = (fb.articles || []).map(function (item) {
    return '<tr><td><a class="link-strong" href="/articles/' + esc(item.slug) + '">' + esc(item.title || item.slug) + "</a>" +
      '<div class="slug">' + esc(item.slug) + "</div></td>" +
      '<td class="num">' + (item.resolved || 0) + "</td>" +
      '<td class="num">' + (item.unresolved || 0) + "</td></tr>";
  }).join("");

  const recentItems = (fb.recent || []).map(function (item) {
    return '<div class="feedback-item">' +
      '<div class="feedback-item__hd"><span class="pill pill--changes_requested">未解决</span>' +
        '<a href="/articles/' + esc(item.slug) + '">' + esc(item.title || item.slug) + "</a>" +
        '<span class="feedback-item__time">' + esc(String(item.created_at || "").slice(0, 16).replace("T", " ")) + "</span></div>" +
      '<div class="feedback-item__loc"><span>问题类型：<strong>' + esc(issueLabels[item.issue_type] || "其他") + "</strong></span>" +
        "<span>文章位置：<strong>" + esc(item.issue_location || "未指定") + "</strong></span></div>" +
      '<p class="feedback-item__msg">' + esc(item.message || "读者只标记了问题位置，没有填写补充说明。") + "</p></div>";
  }).join("");

  const healthCards = '<div class="kpistrip">' +
    '<div class="kpistrip__c"><div class="kpistrip__k">已发布</div><div class="kpistrip__v">' + (health.published || 0) + '</div></div>' +
    '<div class="kpistrip__c"><div class="kpistrip__k">超 180 天未复核</div><div class="kpistrip__v">' + (health.stale || 0) + '</div></div>' +
    '<div class="kpistrip__c"><div class="kpistrip__k">缺参考资料</div><div class="kpistrip__v">' + (health.missingSources || 0) + '</div></div>' +
    '<div class="kpistrip__c"><div class="kpistrip__k">近 30 天有更新</div><div class="kpistrip__v">' + (health.updated30 || 0) + '</div></div>' +
  "</div>";

  return layout("数据分析",
    pageHead({ ico: "chart", title: "数据分析",
      sub: "读者反馈（匿名，不记录 IP 与设备）+ 内容健康度。反馈里的问题位置会指向具体段落，便于回到原文核对。",
      acts: '<a class="btn btn--sm" href="/dashboard">回工作台</a>' }) +
    '<div class="feedback-kpis">' +
      '<div class="feedback-kpi feedback-kpi--mint"><div class="feedback-kpi__top"><span class="feedback-kpi__ico">' + icon("check", 14) + '</span>已解决</div>' +
        '<div class="feedback-kpi__n">' + (fbs.resolved || 0) + '</div><div class="feedback-kpi__h">累计有效反馈</div></div>' +
      '<div class="feedback-kpi feedback-kpi--coral"><div class="feedback-kpi__top"><span class="feedback-kpi__ico">' + icon("warning", 14) + '</span>未解决</div>' +
        '<div class="feedback-kpi__n">' + (fbs.unresolved || 0) + '</div><div class="feedback-kpi__h">附问题位置与说明</div></div>' +
      '<div class="feedback-kpi"><div class="feedback-kpi__top"><span class="feedback-kpi__ico">' + icon("chart", 14) + '</span>解决率</div>' +
        '<div class="feedback-kpi__n">' + (fbs.resolutionRate || 0) + '%</div><div class="feedback-kpi__h">已解决 / 全部反馈</div></div>' +
      '<div class="feedback-kpi feedback-kpi--amber"><div class="feedback-kpi__top"><span class="feedback-kpi__ico">' + icon("clock", 14) + '</span>近 7 天未解决</div>' +
        '<div class="feedback-kpi__n">' + (fbs.unresolved7 || 0) + '</div><div class="feedback-kpi__h">建议优先回原文核对</div></div>' +
    "</div>" +
    healthCards +
    '<div class="feedback-grid">' +
      '<div class="card"><div class="card__hd"><span class="card__ico">' + icon("chart", 15) + '</span><h3>问题类型分布</h3>' +
        '<span class="topbar__sp"></span><span class="muted">共 ' + issueTotal + " 条</span></div>" +
        '<div class="card__bd">' + (issueRows || '<div class="muted">还没有反馈数据。</div>') + "</div></div>" +
      '<div class="card"><div class="card__hd"><span class="card__ico">' + icon("articles", 15) + '</span><h3>反馈最多的文章</h3>' +
        '<span class="topbar__sp"></span><span class="muted">按未解决数排序</span></div>' +
        '<div class="tablewrap"><table><thead><tr><th>文章</th><th class="tight">已解决</th><th class="tight">未解决</th></tr></thead><tbody>' +
        (articleRows || '<tr><td colspan="3" class="empty"><div class="empty__t">还没有读者反馈</div><div>文章页收到反馈后会自动汇总到这里</div></td></tr>') +
        "</tbody></table></div></div>" +
    "</div>" +
    '<div class="card"><div class="card__hd"><span class="card__ico">' + icon("inbox", 15) + '</span><h3>最近未解决反馈</h3>' +
      '<span class="topbar__sp"></span><span class="muted">最多显示 12 条</span></div>' +
      '<div class="card__bd">' + (recentItems || '<div class="muted">暂无未解决反馈。</div>') + "</div></div>",
    Object.assign({ current: "analytics", accent: "violet", crumbs: [{ label: "数据分析" }] }, opts));
}

function simplePage(title, msg, opts) {
  return layout(title, '<div class="card"><h1>' + esc(title) + "</h1><p>" + esc(msg) + '</p><a class="btn" href="/articles">返回文章列表</a></div>', opts);
}

module.exports = {
  safeHref: safeHref,
  layout: layout, loginPage: loginPage, changePasswordPage: changePasswordPage,
  articlesPage: articlesPage, editorPage: editorPage, publishPage: publishPage,
  usersPage: usersPage, taxonomyPage: taxonomyPage, auditPage: auditPage, simplePage: simplePage, dashboardPage: dashboardPage,
  reviewPage: reviewPage, analyticsPage: analyticsPage,
  revisionsPage: revisionsPage, revisionDiffPage: revisionDiffPage, commentsBlock: commentsBlock, viewsBar: viewsBar,
  mediaPage: mediaPage, sourcesCheckPage: sourcesCheckPage,
  securityPage: securityPage, securityConfirmPage: securityConfirmPage, totpChallengePage: totpChallengePage,
  statusLabel: statusLabel
};
