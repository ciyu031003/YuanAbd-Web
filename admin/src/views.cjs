
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

/* ---- 修订 diff（借鉴 WordPress 修订对比的行级高亮） ---- */
table.dif{font-family:var(--mono);font-size:12.5px;line-height:1.6}
table.dif td{padding:2px 10px;border-bottom:0;vertical-align:top;white-space:pre-wrap;word-break:break-word}
table.dif .dif-n{width:28px;text-align:right;color:var(--text-3);user-select:none;padding-right:6px}
tr.dif-same td{color:var(--text-2)}
tr.dif-del td{background:var(--danger-weak);color:var(--danger)}
tr.dif-add td{background:var(--ok-weak);color:var(--ok)}

/* ---- 审核评论线程 ---- */
.cmt{border:1px solid var(--border);border-radius:var(--r-md);padding:12px 14px;margin-bottom:10px;background:var(--bg-1)}
.cmt--done{background:var(--bg-2);opacity:.75}
.cmt__hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:var(--fs-sm);margin-bottom:6px}
.cmt__hd .muted{font-size:var(--fs-xs)}
.cmt__bd{color:var(--text-1);font-size:var(--fs-base);line-height:1.7;white-space:pre-wrap}
.cmt__ft{margin-top:8px;display:flex;justify-content:flex-end}

/* ---- 保存视图下拉 ---- */
details>summary::-webkit-details-marker{display:none}
/* ---- 媒体库 ---- */
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
.mcard{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-1)}
.mcard__img{height:140px;background:var(--bg-2);display:grid;place-items:center;overflow:hidden}
.mcard__img img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.mcard__bd{padding:10px 12px}
.mcard__alt{font-size:var(--fs-sm);color:var(--text-1);margin-bottom:4px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mcard__alt--missing{color:var(--danger);font-weight:600}
.mcard__ft{display:flex;gap:6px;padding:0 12px 12px;flex-wrap:wrap}

/* ---- 思维导图/复用：正文图片自适应 ---- */
.fx-body img{max-width:100%;height:auto}
/* ============================================================
   视觉优化（2026-10-13）
   依据本地 codex UI skills 的可迁移原则：
     · 「Space and scale create rhythm」—— 用留白与尺寸制造节奏，而非均匀网格
     · 「Typography stays modest」—— 排版克制，层级靠间距而非堆叠字重
     · 「Material stays subtle」—— 轻微纸感、柔和阴影、暖调底色
   问题定位（截图审计）：统计卡换行产生孤儿卡、表格日期被挤断行、
   空状态留下大片空洞、卡片全平无层次、图标字重不一致。
   ============================================================ */

/* ---- 1) 底色改为暖纸感，不是冷灰 ---- */
:root{
  --bg-0:#F6F5F2;          /* 暖白纸 */
  --bg-1:#FFFFFF;
  --bg-2:#F1EFEB;
  --bg-3:#E8E5DF;
  --border:#E7E4DE;
  --border-strong:#D6D2C9;
  --text-0:#1C1B19;
  --text-1:#3D3B37;
  --text-2:#6E6A63;
  --text-3:#9C978E;
  --brand:#4B47C7; --brand-hover:#403CB0; --brand-weak:#EFEEFB; --brand-border:#C9C6F0;
  --r-lg:14px; --r-md:9px;
  --shadow-1:0 1px 2px rgba(28,27,25,.04), 0 2px 8px rgba(28,27,25,.045);
  --shadow-2:0 2px 6px rgba(28,27,25,.06), 0 12px 28px rgba(28,27,25,.09);
}

/* ---- 2) 统计卡：固定 3 列，6 张卡整齐两行，杜绝孤儿 ---- */
.stats{grid-template-columns:repeat(3,1fr);gap:18px}
@media(max-width:1000px){.stats{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){.stats{grid-template-columns:1fr}}
.stat{padding:20px 22px;position:relative;overflow:hidden}
.stat::after{                       /* 极细的左侧强调线，用颜色区分语义且不吵 */
  content:"";position:absolute;left:0;top:18px;bottom:18px;width:3px;border-radius:0 3px 3px 0;
  background:var(--border-strong);opacity:.5;
}
.stat--warn::after{background:var(--warn);opacity:.75}
.stat--danger::after{background:var(--danger);opacity:.75}
.stat--ok::after{background:var(--ok);opacity:.75}
.stat--info::after{background:var(--info);opacity:.75}
.stat__k{font-size:13px;letter-spacing:.01em}
.stat__v{font-size:30px;font-weight:600;letter-spacing:-.02em;margin-top:6px;line-height:1.1}
.stat__h{font-size:12px;margin-top:4px}

/* ---- 3) 卡片：柔和层次 + 更克制的间距 ---- */
.card{border-radius:var(--r-lg);border-color:var(--border);box-shadow:var(--shadow-1)}
.card__hd{padding:16px 22px;background:transparent}
.card__bd{padding:22px}
.card__ft{padding:12px 22px;background:var(--bg-2);border-top-color:var(--border)}

/* ---- 4) 表格：日期/短列不折行，标题列给足空间 ---- */
table{font-size:14px}
th,td{padding:12px 18px}
thead th{background:var(--bg-2);color:var(--text-2);font-size:12.5px;letter-spacing:.02em}
td.tight,td.num,th.num{white-space:nowrap}
.tname{line-height:1.5}                    /* 标题可折行但行距舒展 */
.slug{font-size:11.5px;letter-spacing:.01em}

/* ---- 5) 空状态：撑满卡片，不留半截空洞 ---- */
.empty{padding:56px 24px;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.empty__ico{font-size:28px;opacity:.35;margin-bottom:12px}
.empty__t{font-weight:600;color:var(--text-1);margin-bottom:4px;font-size:14px}
.empty>div:last-child{font-size:13px}

/* ---- 6) 侧栏：图标统一optically等宽，字重一致 ---- */
.sidebar__brand{font-size:15px;letter-spacing:.01em}
.navitem{gap:11px;padding:9px 12px;font-size:13.5px;border-radius:var(--r-md)}
.navitem__ico{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;
  font-size:14px;line-height:1;opacity:.75;flex:none}
.navitem[aria-current="page"] .navitem__ico{opacity:1}
.sidebar__sec{font-size:11px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--text-3);padding:18px 14px 6px;font-weight:600}
.sidebar__brand .mark{width:30px;height:30px;border-radius:9px;font-size:14px}

/* ---- 7) 页头：标题与说明的节奏 ---- */
main>h1{font-size:24px;letter-spacing:-.01em;margin-bottom:6px}
main>h1+ .muted{margin-bottom:22px;display:block;line-height:1.7}

/* ---- 8) 顶栏面包屑更轻 ---- */
.crumbs{font-size:13px}
.topbar{padding:12px 26px;background:rgba(246,245,242,.88)}

/* ---- 9) 登录页：去掉局促，给足呼吸 ---- */
.login-wrap{max-width:376px;margin:12vh auto}
.login-wrap .card{padding:34px 32px;box-shadow:var(--shadow-2)}
.login-wrap h1{font-size:22px;margin-bottom:8px;letter-spacing:-.01em}

/* ---- 10) 微妙的纸纹（极低对比，避免噪点感） ---- */
body{
  background-image:radial-gradient(rgba(28,27,25,.018) 1px, transparent 1px);
  background-size:3px 3px;
}

/* ---- 工作台两栏：左宽右窄，避免右侧空洞 ---- */
.dash-cols{display:grid;grid-template-columns:1.35fr 1fr;gap:20px;align-items:start}
@media(max-width:1080px){.dash-cols{grid-template-columns:1fr}}
.dash-table td{padding:13px 18px}
.dash-table td:first-child{font-size:14px;line-height:1.55}

/* ---- 统计卡等高：避免第二行显得更空 ---- */
.stats{align-items:stretch}
.stat{display:flex;flex-direction:column;justify-content:center;min-height:104px}
.stat__k{order:1}
.stat__v{order:2}
.stat__h{order:3}

/* ---- 工作台右栏：空状态不应留大片空洞 ---- */
.dash-cols>.card{height:100%}
.dash-cols .empty{min-height:150px;padding:40px 24px}

/* ---- 标题与内容间距收紧，层级更清晰 ---- */
.card__hd h3{font-size:14.5px;letter-spacing:.005em}
.card__hd .muted{font-size:12px}
h1{margin-bottom:4px}

/* ---- 表格首列（标题）加粗但不过重 ---- */
.dash-table td:first-child,.tablewrap td:first-child{font-weight:500}
.link-strong{font-weight:600;letter-spacing:.005em}

/* ---- 徽章：更细腻的描边与内距 ---- */
.pill{padding:2px 10px;font-size:11.5px;letter-spacing:.01em}

/* ---- 按钮：更收敛的阴影与圆角 ---- */
.btn{font-size:13.5px;height:34px;border-radius:var(--r-md)}
.btn--sm{height:28px;font-size:12.5px}
.btn--primary{box-shadow:0 1px 2px rgba(75,71,199,.22)}

/* ---- 筛选栏：标签与控件间距统一 ---- */
form.card label{font-size:12.5px;margin-bottom:6px;color:var(--text-1)}
form.card input,form.card select{height:34px;font-size:13.5px}
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
    '<p class="muted" style="margin-top:-8px">请输入手机 App 上的 6 位验证码；也可使用一枚恢复码。</p>' + err +
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
