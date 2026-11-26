/* build-fix.cjs — 修盒子 FIXBOX 构建脚本（零依赖）
   ------------------------------------------------------------
   输入：content/fixboxs/*.md（front-matter + 固定 10 段正文）
   输出：
     demo/fixboxs/fix/<slug>.html    教程页
     demo/fixboxs/data/articles.js   列表与搜索索引数据
   用法：
     node build-fix.cjs          # 构建
     node build-fix.cjs --check  # 校验产物是否与源文件一致
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const BT = String.fromCharCode(96); // 反引号

const ROOT = __dirname;
const SRC = path.join(ROOT, "content", "fixboxs");
const OUT = path.join(ROOT, "demo", "fixboxs");
const OUT_FIX = path.join(OUT, "fix");
const OUT_DATA = path.join(OUT, "data");
const FEEDBACK_ENDPOINT = process.env.FIXBOXS_FEEDBACK_ENDPOINT ||
  "https://dashboard.pc-fixboxs.yuanabd.cn/api/public/article-feedback";

/* 公式：KaTeX（MIT）本地文件，output: "mathml" —— 只输出浏览器原生 MathML，
   不需要加载 CSS/字体，预览与线上都不依赖外部资源。
   缺失时降级为原样文本，构建不会失败。 */
const KATEX = (function () {
  try { return require(path.join(ROOT, "admin", "vendor", "katex.min.js")); } catch (e) { return null; }
})();
/* 图标：Lucide（ISC）生成的图标数据，与后台共用同一份 */
const SITE_ICONS = (function () {
  try { return require(path.join(ROOT, "admin", "src", "icons-data.cjs")); } catch (e) { return {}; }
})();
function siteIcon(name, size) {
  var inner = SITE_ICONS[name];
  if (!inner) return "";
  var s = size || 16;
  return '<svg class="fx-ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    inner + "</svg>";
}
function renderMath(tex, display) {
  if (!KATEX) return null;
  try {
    return KATEX.renderToString(String(tex).trim(), {
      output: "mathml", displayMode: !!display, throwOnError: false, strict: false
    });
  } catch (e) { return null; }
}

/* 分类字典已外置到 content/taxonomy.json（原先硬编码在此处）。
   外置的意义：后台编辑器的 domain/category 下拉框与构建读**同一份数据**，
   避免两处各维护一份而漂移。校验规则见 content-lint.cjs 的 V4。 */
const TAXONOMY = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "taxonomy.json"), "utf8"));
const DOMAINS = {};
const CATS = {};
TAXONOMY.domains.forEach(function (d) {
  DOMAINS[d.id] = d.name;
  d.cats.forEach(function (c) { CATS[c.id] = c.name; });
});
/* ---------- 参考资料（第三方 SOP / 官方手册） ----------
   与「故障教程」同一个内容目录、同一条构建链，但渲染形态不同：
     · 目录里是参考手册而不是排障步骤，10 段骨架套不上；
     · 正文按「快速概览 / 分步骤 / 风险提示 / 原始 SOP」组织，原文链接原样保留；
     · 列表里标成「参考」并单独成组，避免读者误以为是本站原创排障结论。
   判定用两个信号：front-matter 的 kind: reference，或 domain 属于下面两个领域。
   两个信号都要认，是因为后台编辑器不一定总带上 kind 字段。 */
const REFERENCE_DOMAINS = ["ref-manual"];
const isReference = (meta) => meta.kind === "reference" || REFERENCE_DOMAINS.indexOf(meta.domain) >= 0;
/* 参考资料专属段落：单独渲染，不进目录的普通 h2 流程之外的「分步骤」步骤卡 */
const REFERENCE_SECTIONS = {
  overview: ["快速概览", "一句话结论"],
  steps: ["分步骤", "处理步骤"],
  risks: ["风险提示", "注意事项"],
  origin: ["原始 SOP", "原文链接"],
  who: ["适用对象", "适用 / 不适用"]
};

/* slug → 标题 映射，由主流程预扫描后填充，供「相关教程」生成可点击链接 */
const TITLES = {};
const PRIORITY = ["wifi-connected-but-no-internet","win-blackscreen-cursor","ip-conflict-locate-device",
  "router-admin-page-unreachable","win-bluescreen-read-code","home-network-all-offline","dns-broken-but-app-works",
  "win-forgot-password","win-slow-diagnose","win-c-drive-full-cleanup","wifi-adapter-missing","proxy-server-not-responding",
  "win-popup-ads-hijack","mac-fan-noise-overheat","deleted-file-recovery","win-stuck-on-boot-logo","dhcp-no-ip-169-254",
  "printer-offline","usb-drive-not-recognized","win-app-crash-missing-dll","wifi-ssid-not-found","malware-first-response",
  "router-wifi-leech-check","win-update-stuck","mac-storage-system-data","disk-clicking-failure","monitor-no-signal",
  "win-startup-apps-disable","remote-control-scam","proxy-tool-broke-network"];

/* ---------- 站点级聚合：所有「N 个领域 / N 篇」一律从这里派生 ----------
   2026-11-23：此前首页写 13 个领域、browse 写「12 个故障 + 2 个参考」、页脚写
   「全部 13 个领域」并链接了不存在的 #ref-field，三个口径互相矛盾。
   现在唯一事实来源是 content/taxonomy.json 的 domains + 本次实际构建出的文章：
   · 页脚、侧栏领域列表由 SITE.domains 生成；
   · 静态页（index/browse/...）里的计数占位由 syncStaticCounts() 在构建时写回；
   · 前端再从 articles.js 下发的 window.FX_META 校正一次（无刷新也一致）。 */
const SITE = {
  domains: TAXONOMY.domains.map(function (d) {
    return { id: d.id, name: d.name, count: 0, reference: REFERENCE_DOMAINS.indexOf(d.id) >= 0 };
  }),
  total: 0,
  guides: 0,
  references: 0,
  updated: "",
  bySlug: {},
  prevNext: {}
};
function siteDomainIndex(id) {
  for (var i = 0; i < SITE.domains.length; i++) if (SITE.domains[i].id === id) return i;
  return -1;
}
function siteFaultDomains() { return SITE.domains.filter(function (d) { return !d.reference; }); }
function siteRefDomains() { return SITE.domains.filter(function (d) { return d.reference; }); }
/* 页脚「按领域」：取文章数最多的 3 个故障领域 + 全部参考领域，全部由数据派生，
   不再手写死链（历史问题：ref-field 领域并不存在却写进了页脚）。 */
function footDomainItems(prefix) {
  var top = siteFaultDomains().slice().sort(function (a, b) {
    return b.count - a.count || siteDomainIndex(a.id) - siteDomainIndex(b.id);
  }).slice(0, 3);
  return top.concat(siteRefDomains()).map(function (d) {
    return '<li><a href="' + prefix + 'browse.html#' + d.id + '">' + esc(d.name) + "</a></li>";
  }).join("");
}

/* ---------- 共享 chrome：加载动画 + 转场幕布 + 临界样式 ---------- */
const CRITICAL = [
  '<style id="fx-critical">',
  'html.fx-entering body{opacity:0}',
  'html.fx-first:not(.fx-leaving) .fx-curtain{display:none}',
  '.fx-curtain{position:fixed;inset:0;z-index:9000;pointer-events:none;background:#A995FF;transform:translateY(100%);transition:transform .52s cubic-bezier(.65,0,.35,1)}',
  'html.fx-entering .fx-curtain{transform:translateY(0)}',
  'html.fx-entering.fx-ready .fx-curtain{transform:translateY(-100%)}',
  'html.fx-leaving .fx-curtain{transform:translateY(0)}',
  '.fx-preloader{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#A995FF}',
  '.fx-preloader.is-done{opacity:0;visibility:hidden;transition:opacity .5s,visibility .5s}',
  '@media (prefers-reduced-motion:reduce){.fx-preloader{display:none}html.fx-entering body{opacity:1!important}}',
  /* 兜底：主 JS 没加载/报错时，加载动画与转场幕布不能永远盖住页面（2026-11-24 评审）。
     正常路径下 JS 会在 1s 左右移除 preloader / 加 fx-ready，这几条动画不会生效。 */
  '.fx-preloader{animation:fxPreAutoHide .4s ease 2.8s forwards}',
  '@keyframes fxPreAutoHide{to{opacity:0;visibility:hidden}}',
  'html.fx-entering .fx-curtain{animation:fxCurtainAutoHide .5s cubic-bezier(.65,0,.35,1) 2.4s forwards}',
  '@keyframes fxCurtainAutoHide{to{transform:translateY(-100%)}}',
  'html.fx-entering body{animation:fxBodyAutoShow .3s ease 2.6s forwards}',
  '@keyframes fxBodyAutoShow{to{opacity:1;transform:none}}',
  '</style>',
].join("");
const BOOT = '<script id="fx-boot">try{if(sessionStorage.getItem("fx.seen")==="1"){document.documentElement.classList.add("fx-entering")}else{document.documentElement.classList.add("fx-first")}}catch(e){document.documentElement.classList.add("fx-first")}</script>';
const PRELOADER = '<div class="fx-preloader" data-fx-preloader role="status" aria-label="正在载入修盒子"><div class="fx-preloader__inner"><div class="fx-preloader__mark"><span class="fx-preloader__ring" aria-hidden="true"></span><span class="fx-preloader__ring fx-preloader__ring--inner" aria-hidden="true"></span><span class="fx-preloader__core" aria-hidden="true">修</span><span class="fx-preloader__dot fx-preloader__dot--a" aria-hidden="true"></span><span class="fx-preloader__dot fx-preloader__dot--b" aria-hidden="true"></span><span class="fx-preloader__dot fx-preloader__dot--c" aria-hidden="true"></span></div><p class="fx-preloader__text">正在打开修盒子…</p><div class="fx-preloader__bar" aria-hidden="true"><i></i></div></div></div><div class="fx-curtain" aria-hidden="true"></div>';
const CONNECTOR = '<div class="fx-connector" aria-hidden="true"></div>';
const READER_FEEDBACK = [
  '<div class="fx-feedback" data-fx-feedback>',
  '<div class="fx-feedback__intro"><span class="fx-feedback__eyebrow">读者反馈</span><h2>这篇教程解决你的问题了吗？</h2><p>点一下告诉我们结果。「没解决」可以指出问题段落，管理员会回到原文核对并更新。</p></div>',
  '<div class="fx-feedback__row" data-fx-feedback-actions><button class="fx-btn fx-btn--primary" type="button" data-fx-feedback-outcome="resolved">' + siteIcon("check", 14) + ' 解决了</button><button class="fx-btn fx-btn--ghost" type="button" data-fx-feedback-outcome="unresolved" aria-expanded="false">' + siteIcon("close", 13) + ' 没解决，反馈问题</button></div>',
  '<div class="fx-feedback__status" data-fx-feedback-status role="status" aria-live="polite" hidden></div>',
  '<form class="fx-feedback__form" data-fx-feedback-form hidden novalidate>',
  '<fieldset><legend>问题主要出在哪？</legend><div class="fx-feedback__types">',
  '<label class="fx-feedback__type"><input type="radio" name="issue_type" value="premise"><span>适用前提</span></label>',
  '<label class="fx-feedback__type"><input type="radio" name="issue_type" value="steps"><span>步骤或顺序</span></label>',
  '<label class="fx-feedback__type"><input type="radio" name="issue_type" value="command"><span>命令或脚本</span></label>',
  '<label class="fx-feedback__type"><input type="radio" name="issue_type" value="error"><span>报错或现象</span></label>',
  '<label class="fx-feedback__type"><input type="radio" name="issue_type" value="result"><span>修复结果</span></label>',
  '<label class="fx-feedback__type"><input type="radio" name="issue_type" value="source"><span>链接或资料</span></label>',
  '<label class="fx-feedback__type"><input type="radio" name="issue_type" value="other"><span>其他</span></label>',
  '</div></fieldset>',
  '<label class="fx-feedback__field"><span>具体是哪一段？</span><select data-fx-feedback-location><option value="整篇教程">整篇教程</option><option value="不确定具体位置">不确定具体位置</option></select></label>',
  '<label class="fx-feedback__field"><span>补充说明 <small>选填，最多 1200 字</small></span><textarea maxlength="1200" rows="4" placeholder="例如：第 3 步执行后提示找不到命令；或者按教程做完后问题仍然存在。"></textarea></label>',
  '<label class="fx-feedback__trap" aria-hidden="true">网站<input type="text" name="website" tabindex="-1" autocomplete="off"></label>',
  '<div class="fx-feedback__formacts"><button class="fx-btn fx-btn--primary" type="submit">提交反馈</button><button class="fx-btn fx-btn--ghost" type="button" data-fx-feedback-cancel>取消</button><a href="../wizard.html">先重新定位问题</a></div>',
  '</form></div>',
].join("");
/* 移动端抽屉导航：生成的文章页在 /fix/ 子目录，链接统一用 ../ 前缀（2026-10-24 移动端适配） */
const MOBILE_BURGER = '<button class="fx-burger" type="button" aria-expanded="false" aria-controls="fx-drawer" aria-label="打开菜单"><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span></button>';
const MOBILE_DRAWER = [
  '<div class="fx-drawer" id="fx-drawer" hidden>',
  '<div class="fx-drawer__backdrop" data-fx-drawer-close></div>',
  '<nav class="fx-drawer__panel" aria-label="站内导航" tabindex="-1">',
  '<div class="fx-drawer__head"><span class="fx-brand" aria-hidden="true"><span class="fx-brand__mark">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></span><button class="fx-drawer__x" type="button" data-fx-drawer-close aria-label="关闭菜单">' + siteIcon("close", 18) + "</button></div>",
  '<a class="fx-drawer__link" href="../index.html">首页</a>',
  '<a class="fx-drawer__link" href="../browse.html">领域</a>',
  '<a class="fx-drawer__link" href="../hardware.html">拆机图</a>',
  '<a class="fx-drawer__link" href="../wizard.html">症状向导</a>',
  '<a class="fx-drawer__link" href="../tools.html">工具</a>',
  '<a class="fx-drawer__link" href="../search.html">搜索教程</a>',
  '<a class="fx-drawer__link" href="../about.html">关于</a>',
  '<p class="fx-drawer__foot">修盒子 FIXBOX · 自助排障手册</p>',
  '</nav></div>',
].join("\n");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escAttr = (s) => esc(s).replace(/'/g, "&#39;");
const unquote = (s) => {
  s = String(s).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
};
const slugify = (s) => String(s).trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, "-").replace(/^-+|-+$/g, "");

/* front-matter 解析统一走 fx-frontmatter.cjs（与后台共用同一实现）。
   ------------------------------------------------------------
   历史：此处原先是一个手写正则解析器，它只认标量 / 行内数组 / 扁平列表三种形态，
   对 sources 的嵌套映射（- title: / url: / type:）解析错误：
   实测 30 篇共 109 条 url 全部被静默丢弃（解析结果为 "title: …" 字符串数组）。
   现改为引用共享模块，解析结果保留完整的对象结构，见 fx-frontmatter.test.cjs 的
   E1–E7 / R1 / R7 / R8 断言。 */
const fxFrontMatter = require("./fx-frontmatter.cjs");
function parseFrontMatter(text) {
  const r = fxFrontMatter.parse(text);
  /* 统一换行：Windows 检出（autocrlf）会把 \r 带进正文，
     不在这里归一的话 \r 会混进渲染出的 HTML（2026-10-24 实测 printer-offline 踩到）。 */
  return { meta: r.meta, body: r.body.replace(/\r\n/g, "\n") };
}

/* URL 白名单：正文由后台/内容源写入，渲染前只放行 http(s)、mailto 与相对地址，
   防止 markdown 里出现 javascript: / data: / vbscript: 之类的伪协议被拼进 href、src。
   （2026-11-24 评审：标题/正文最终都会进 innerHTML 与属性，必须在构建期兜一层。） */
function safeUrl(u, forImage) {
  const s = String(u == null ? "" : u).trim();
  if (!s) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    return forImage ? /^(https?:|data:image\/)/i.test(s) : /^(https?:|mailto:)/i.test(s);
  }
  return true; // 相对路径 / 锚点
}

function inline(s) {
  /* 先把行内代码与公式抽成占位符，再转义其余文本：
     否则代码里的 $x$、**、[]() 会被当成 Markdown 语法改写。 */
  const stash = [];
  let t = String(s);
  t = t.replace(new RegExp(BT + "([^" + BT + "]+)" + BT, "g"), function (_, code) {
    stash.push("<code>" + esc(code) + "</code>");
    return "\u0000" + (stash.length - 1) + "\u0000";
  });
  t = t.replace(/\$([^\s$](?:[^$\n]*[^\s$])?)\$/g, function (m, tex) {
    const h = renderMath(tex, false);
    if (!h) return m;
    stash.push('<span class="fx-math fx-math--inline">' + h + "</span>");
    return "\u0000" + (stash.length - 1) + "\u0000";
  });
  t = esc(t);
  // 行内图片：![替代文字](路径) —— 独立成行时由 mdToHtml 提升为 <figure>
  t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, imgSrc) {
    if (!safeUrl(imgSrc, true)) return alt;
    return '<img class="fx-img" src="' + imgSrc + '" alt="' + alt + '" loading="lazy" decoding="async">';
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, txt, href) {
    const ext = /^https?:/i.test(href);
    if (href === "#") return '<span class="fx-link" style="cursor:help">' + txt + "</span>";
    if (!safeUrl(href, false)) return txt;
    return '<a class="fx-link"' + (ext ? ' target="_blank" rel="noopener nofollow"' : "") + ' href="' + href + '">' + txt + "</a>";
  });
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  t = t.replace(/\u0000(\d+)\u0000/g, function (_, i) { return stash[Number(i)] || ""; });
  return t;
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const flushTable = function (buf) {
    if (!buf.length) return "";
    const rows = buf.filter(function (l) { return !/^\s*\|[\s:|-]+\|\s*$/.test(l); })
      .map(function (l) { return l.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map(function (c) { return inline(c.trim().replace(/\\\|/g, "|")); }); });
    if (!rows.length) return "";
    const head = rows[0].map(function (c) { return "<th>" + c + "</th>"; }).join("");
    const body = rows.slice(1).map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("");
    return '<div class="fx-table-wrap"><table class="fx-table"><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody></table></div>";
  };
  const fenceRe = new RegExp("^\\s*(" + BT + "{3,})\\s*([\\w-]*)\\s*$");
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(fenceRe);
    if (fence) {
      const closeRe = new RegExp("^\\s*" + fence[1] + "\\s*$");
      const buf = []; i++;
      while (i < lines.length && !closeRe.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      const code = buf.join("\n");
      const danger = /diskpart|format |clean |chkdsk \/f|rm -rf|reg delete|bcdedit|diskutil erase|mkfs|分区/i.test(code);
      /* 代码块：顶部固定「命令 / 风险」标签 + 复制按钮，底部留一个 aria-live 状态位，
         这样复制成功、复制失败都能被读屏念出来（此前只有成功时改按钮文字）。 */
      out.push('<div class="fx-cmd' + (danger ? " fx-cmd--danger" : "") + '">' +
        '<div class="fx-cmd__head">' +
        (danger ? '<span class="fx-cmd__warn">' + siteIcon("shieldAlert", 14) + ' 有数据风险，逐行核对再执行</span>' : '<span class="fx-cmd__label">命令</span>') +
        '<button class="fx-cmd__copy" type="button" data-fx-copy aria-label="复制命令">复制</button></div>' +
        "<pre><code>" + esc(code) + "</code></pre>" +
        '<span class="fx-cmd__status fx-vh" role="status" aria-live="polite"></span></div>');
      continue;
    }

    /* 独立公式：$$ … $$（支持单行与多行）→ MathML */
    if (/^\s*\$\$/.test(line)) {
      let tex = line.replace(/^\s*\$\$/, "");
      i++;
      if (!tex.trim()) {
        const buf = [];
        while (i < lines.length && !/^\s*\$\$\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        tex = buf.join("\n");
      } else {
        tex = tex.replace(/\$\$\s*$/, "");
      }
      const html = renderMath(tex, true);
      if (html) out.push('<div class="fx-math fx-math--block">' + html + "</div>");
      else out.push("<p>" + esc(tex.trim()) + "</p>");
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      out.push(flushTable(buf));
      continue;
    }
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      const raw = buf.join("\n");
      const kind = /⛔|有数据风险/.test(raw) ? "danger" : (/⚠|需谨慎/.test(raw) ? "caution" : "safe");
      const ico = kind === "danger" ? siteIcon("shieldAlert", 16) : (kind === "caution" ? siteIcon("warning", 16) : siteIcon("check", 16));
      out.push('<div class="fx-callout fx-callout--' + kind + '"><span class="fx-callout__ico" aria-hidden="true">' + ico + "</span><div>" +
        raw.split("\n").map(inline).join("<br>") + "</div></div>");
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = Math.min(h[1].length + 1, 4);
      const txt = h[2].trim();
      if (lvl <= 3) out.push("<h" + lvl + ' class="fx-h' + lvl + '" id="' + slugify(txt) + '">' + inline(txt) + "</h" + lvl + ">");
      else out.push('<h3 class="fx-h3" style="font-size:16.5px">' + inline(txt) + "</h3>");
      i++;
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        let txt = lines[i].replace(/^\s*\d+[.)]\s+/, "");
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i])) { txt += " " + lines[i].trim(); i++; }
        items.push("<li>" + inline(txt) + "</li>");
      }
      out.push('<ol class="fx-ol">' + items.join("") + "</ol>");
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [], checks = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        let txt = lines[i].replace(/^\s*[-*+]\s+/, "");
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*[-*+]\s+/.test(lines[i])) { txt += " " + lines[i].trim(); i++; }
        const m = txt.match(/^\[([ xX])\]\s*(.*)$/);   // 任务清单：- [ ] / - [x]
        if (m) {
          const on = m[1].toLowerCase() === "x";
          checks.push('<li class="fx-check' + (on ? " is-on" : "") + '"><span class="fx-check__box" aria-hidden="true">' + (on ? siteIcon("check", 11) : "") + "</span>" + inline(m[2]) + "</li>");
        } else items.push("<li>" + inline(txt) + "</li>");
      }
      if (items.length) out.push('<ul class="fx-ul">' + items.join("") + "</ul>");
      if (checks.length) out.push('<ul class="fx-checklist">' + checks.join("") + "</ul>");
      continue;
    }
    const figM = line.match(/^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (figM) {
      const alt = figM[1], figSrc = figM[2];
      i++;
      let cap = "";
      if (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*+]\s|\s*\d+[.)]\s|\s*>|\s*\||\s*!\[)/.test(lines[i])) {
        cap = inline(lines[i].trim());
        i++;
      }
      const credM = figSrc.match(/^([^\s]+)\s+"([^"]*)"$/);
      const realSrc = credM ? credM[1] : figSrc;
      const cred = credM ? credM[2] : "";
      if (!safeUrl(realSrc, true)) { continue; }
      out.push('<figure class="fx-fig"><button class="fx-fig__frame" type="button" data-fx-zoom aria-label="放大查看图片：' + escAttr(cap || alt || "教程配图") + '">' +
        '<img class="fx-img" src="' + escAttr(realSrc) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
        '<span class="fx-fig__zoom" aria-hidden="true">点击放大</span></button>' + ((cap || alt) ? '<figcaption class="fx-fig__cap">' + (cap || esc(alt)) + "</figcaption>" : "") +
        (cred ? '<div class="fx-fig__cred">图片来源：' + esc(cred) + "</div>" : "") + "</figure>");
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const buf = [line]; i++;
    while (i < lines.length && lines[i].trim() &&
           !/^(#{1,4}\s|\s*[-*+]\s|\s*\d+[.)]\s|\s*>|\s*\||\s*!\[)/.test(lines[i]) &&
           !new RegExp("^\\s*" + BT + "{3,}").test(lines[i])) { buf.push(lines[i]); i++; }
    out.push('<p class="fx-p">' + inline(buf.join(" ")) + "</p>");
  }
  return out.join("\n");
}

/* 小白一键修复卡片：Markdown 只负责声明脚本和适用边界，构建期读取真实 .bat 源码，
   确保下载文件、页面说明和可复制源码三者不会漂移。 */
function renderBatfix(md, slug) {
  const scriptMatch = String(md).match(/-\s*下载[：:]\s*\[([^\]]+)\]\((\.\.\/scripts\/[a-z0-9-]+\.bat)\)/i);
  if (!scriptMatch) {
    throw new Error("小白一键修复段落缺少 ../scripts/*.bat 下载链接");
  }
  const label = scriptMatch[1].trim();
  const href = scriptMatch[2];
  const rel = href.replace(/^\.\.\//, "");
  const sourcePath = path.join(OUT, rel);
  if (!fs.existsSync(sourcePath)) {
    throw new Error("脚本文件不存在：" + rel);
  }
  const source = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
  const filename = path.basename(rel);
  const details = [];
  String(md).split(/\r?\n/).forEach(function (line) {
    const m = line.match(/^-\s*([^：:]+)[：:]\s*(.+)$/);
    if (!m || /^下载$/.test(m[1].trim())) return;
    details.push({ label: m[1].trim(), value: m[2].trim() });
  });
  const codeId = "fx-bat-code-" + slug;
  const rows = details.map(function (item) {
    return '<li><b>' + esc(item.label) + '</b><span>' + inline(item.value) + "</span></li>";
  }).join("");
  const lines = source.split("\n").length;
  const sizeKb = (Buffer.byteLength(source) / 1024).toFixed(1);

  return [
    '<section class="fx-batfix" id="' + slugify("小白一键修复") + '" data-reveal>',
    '<div class="fx-batfix__head">',
    '<span class="fx-batfix__kicker">纯小白模式 · Windows</span>',
    '<h2 class="fx-h2">小白一键修复</h2>',
    '<p>不想研究原因，就下载脚本，右键选择“以管理员身份运行”。脚本执行前仍会再次确认。</p>',
    '</div>',
    '<div class="fx-batfix__actions">',
    '<a class="fx-btn fx-btn--primary fx-batfix__download" href="' + escAttr(href) + '" download="' + escAttr(filename) + '">',
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    '下载 ' + esc(label),
    '</a>',
    '<button class="fx-btn fx-btn--ghost" type="button" data-fx-copy data-fx-copy-target="' + codeId + '">复制全部脚本</button>',
    '</div>',
    '<div class="fx-batfix__body">',
    rows ? '<ul class="fx-batfix__facts">' + rows + "</ul>" : "",
    '<div class="fx-batfix__hint"><strong>运行方式：</strong>下载后先解压（如有），右键 BAT 文件 → 以管理员身份运行 → 阅读提示后选择 Y。浏览器若提示“不常见文件”，请先核对文件名与下方源码。若浏览器无法下载，点“复制全部脚本”，粘贴到记事本，保存类型选择“所有文件”，文件名以 .bat 结尾。</div>',
    '<div class="fx-batfix__meta"><span>' + esc(filename) + "</span><span>" + lines + " 行</span><span>" + sizeKb + " KB</span></div>",
    '<details class="fx-batfix__source"><summary>查看完整 BAT 源码</summary><pre><code id="' + codeId + '">' + esc(source) + "</code></pre></details>",
    '</div>',
    '</section>'
  ].join("");
}

function renderSteps(md) {
  const parts = md.split(/^###\s+/m).filter(function (x) { return x.trim(); });
  return parts.map(function (chunk, idx) {
    const nl = chunk.indexOf("\n");
    const title = (nl >= 0 ? chunk.slice(0, nl) : chunk).replace(/^步骤\s*\d+\s*[:：]\s*/, "").trim();
    const body = nl >= 0 ? chunk.slice(nl + 1) : "";
    let html = mdToHtml(body);
    html = html.replace(/<p class="fx-p"><strong>预期结果<\/strong>[:：]?\s*([\s\S]*?)<\/p>/g,
      '<div class="fx-step__expect"><b>预期结果：</b>$1</div>');
    html = html.replace(/<p class="fx-p"><strong>失败怎么办<\/strong>[:：]?\s*([\s\S]*?)<\/p>/g,
      '<details class="fx-step__fallback"><summary>失败怎么办？</summary><div>$1</div></details>');
    html = html.replace(/<p class="fx-p"><strong>目的<\/strong>[:：]?\s*([\s\S]*?)<\/p>/g,
      '<p class="fx-step__goal"><span class="fx-step__label">目的：</span>$1</p>');
    return '<li class="fx-step" data-fx-step data-step-id="s' + (idx + 1) + '">' +
      '<div class="fx-step__num" aria-hidden="true"></div>' +
      '<div class="fx-step__body"><div class="fx-step__head">' +
      '<h3 class="fx-step__title">' + inline(title) + "</h3>" +
      '<button class="fx-step__check" type="button" data-fx-check aria-pressed="false" aria-label="标记第 ' + (idx + 1) + ' 步已完成">○</button>' +
      "</div>" + html + "</div></li>";
  }).join("\n");
}

/* ---------- 领域强调色（与 js/fix.js 的 ACCENTS 保持一致，供相关教程卡片用） ---------- */
const DOMAIN_ACCENT = {
  "net-basic": "--fx-sky", "win-system": "--fx-sky", "router": "--fx-lav", "ip-dns": "--fx-lav",
  "win-app": "--fx-mint", "mac-system": "--fx-coral", "mac-app": "--fx-coral", "hardware": "--fx-sun",
  "peripheral": "--fx-mint", "proxy-vpn": "--fx-lav", "account-sec": "--fx-coral", "data-backup": "--fx-sun",
  "ref-manual": "--fx-sky"
};
function domainAccent(id) { return "var(" + (DOMAIN_ACCENT[id] || "--fx-mint") + ")"; }

/* ---------- 公共 chrome：head / 顶栏 / 页脚 ----------
   两个模板（故障教程 / 参考资料）共用同一套骨架，避免「改一处漏一处」。 */
function jsonLdScript(obj) {
  var escLt = String.fromCharCode(92) + "u003c";
  return '<script type="application/ld+json">' + JSON.stringify(obj).split("<").join(escLt) + "</script>";
}
function pageHead(o) {
  return [
    '<!DOCTYPE html>', '<html lang="zh-CN">', "<head>", '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="theme-color" content="#FBF6EC">',
    "<title>" + esc(o.title) + "</title>",
    '<meta name="description" content="' + escAttr(o.desc) + '">',
    o.canonical ? '<link rel="canonical" href="' + escAttr(o.canonical) + '">' : "",
    o.canonical ? '<meta property="og:type" content="article">' : "",
    o.canonical ? '<meta property="og:title" content="' + escAttr(o.title) + '">' : "",
    o.canonical ? '<meta property="og:description" content="' + escAttr(o.desc) + '">' : "",
    o.canonical ? '<meta property="og:url" content="' + escAttr(o.canonical) + '">' : "",
    o.canonical ? '<meta name="twitter:card" content="summary">' : "",
    o.robots ? '<meta name="robots" content="' + o.robots + '">' : "",
    "<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%2391E6C1'/%3E%3Ctext x='16' y='22' font-size='18' text-anchor='middle' fill='%230B3B2E' font-family='sans-serif'%3E%E4%BF%AE%3C/text%3E%3C/svg%3E\">",
    CRITICAL, BOOT,
    '<noscript><style>.fx-preloader,.fx-curtain{display:none!important}</style></noscript>',
    '<link rel="stylesheet" href="../../css/tokens.css">',
    '<link rel="stylesheet" href="../css/theme-fix.css">',
    '<link rel="stylesheet" href="../css/fix.css">',
    '<link rel="stylesheet" href="../css/fix-neu.css">',
    o.jsonld ? jsonLdScript(o.jsonld) : "",
    "</head>"
  ].filter(Boolean).join("\n");
}
function pageTopbar() {
  return [
    '<header class="fx-top"><div class="fx-top__inner">',
    '<a class="fx-brand" href="../index.html" aria-label="修盒子 FIXBOX 首页"><span class="fx-brand__mark" aria-hidden="true">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></a>',
    '<nav class="fx-nav" aria-label="主导航"><a href="../browse.html">领域</a><a href="../hardware.html">拆机图</a><a href="../wizard.html">症状向导</a><a href="../tools.html">工具</a><a href="../about.html">关于</a></nav>',
    '<a class="fx-topsearch" href="../search.html"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span>搜索教程</span><kbd>Ctrl K</kbd></a>',
    MOBILE_BURGER,
    "</div></header>"
  ].join("");
}
function pageFooter(fallbackUpdated) {
  var updated = SITE.updated || fallbackUpdated || "";
  var stats = SITE.total
    ? '<p class="fx-foot__stat">目前 <b data-fx-count-domains>' + SITE.domains.length + '</b> 个领域 · <b data-fx-count-all>' + SITE.total + "</b> 篇" +
      (SITE.references ? "（含 " + SITE.references + " 篇参考资料）" : "") + "</p>"
    : "";
  return [
    '<footer class="fx-foot"><div class="fx-wrap">',
    '<div class="fx-foot__inner">',
    '<div><a class="fx-brand" href="../index.html" style="margin-bottom:10px"><span class="fx-brand__mark" aria-hidden="true">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></a><p style="margin-top:10px;max-width:34ch">电脑与网络故障的自助排障手册。把「我电脑坏了」翻译成「照着做就能修好」。</p>' + stats + "</div>",
    '<div><h3>按领域</h3><ul><li><a href="../browse.html">全部 <span data-fx-count-domains>' + SITE.domains.length + "</span> 个领域</a></li>" + footDomainItems("../") + "</ul></div>",
    '<div><h3>常用</h3><ul><li><a href="../wizard.html">症状向导</a></li><li><a href="../tools.html">命令速查</a></li><li><a href="../search.html">搜索</a></li></ul></div>',
    '<div><h3>关于</h3><ul><li><a href="../about.html">关于本站</a></li><li><a href="../about.html#disclaimer">免责声明</a></li><li><a href="../about.html#privacy">隐私说明</a></li><li><a href="../about.html#feedback">纠错与反馈</a></li></ul></div>',
    "</div>",
    '<div class="fx-foot__legal"><span>© 2026 YUAN.ABD</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">赣ICP备2024031528号-2</a><span>本站内容仅供自助排查参考；涉及数据丢失风险的操作请先备份。</span><span style="margin-left:auto">最近更新：' + esc(updated) + "</span></div>",
    "</div></footer>"
  ].join("\n");
}

/* ---------- 正文可复用的区块 ---------- */
function renderToc(tocLinks) {
  if (!tocLinks) return "";
  return '<details class="fx-toc-m"><summary>' + siteIcon("list", 15) + " 本页目录</summary><ul>" + tocLinks + "</ul></details>";
}
function renderStepbar(hasSteps) {
  if (!hasSteps) return "";
  return '<div class="fx-stepbar" data-fx-stepbar>' +
    '<div class="fx-stepbar__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="本页步骤完成进度"><i data-fx-stepprog></i></div>' +
    '<span class="fx-stepbar__label" data-fx-progress-label>还没有勾选步骤</span>' +
    '<button class="fx-stepbar__reset" type="button" data-fx-step-reset hidden>重置进度</button>' +
    '<span class="fx-vh" role="status" aria-live="polite" data-fx-step-status></span></div>';
}
function renderRelated(relRaw, isRef) {
  var cards = relRaw.map(function (r) {
    var key = String(r).trim();
    var m = SITE.bySlug[key];
    if (m) {
      return '<a class="fx-relcard" href="../fix/' + escAttr(key) + '.html" style="--accent:' + domainAccent(m.domain) + '">' +
        '<span class="fx-relcard__path">' + esc(m.path || "") + "</span>" +
        '<b class="fx-relcard__t">' + esc(m.title) + "</b>" +
        '<span class="fx-relcard__meta">' + (m.time ? "⏱ " + esc(m.time) : "") +
        (m.risk ? '<em class="fx-relcard__risk">' + esc(m.risk) + "</em>" : "") + "</span></a>";
    }
    return '<a class="fx-relcard fx-relcard--search" href="../search.html?q=' + encodeURIComponent(key.replace(/-/g, " ")) + '">' +
      '<span class="fx-relcard__path">站内搜索</span><b class="fx-relcard__t">' + esc(key) + "</b>" +
      '<span class="fx-relcard__meta">暂无独立教程，先去搜索</span></a>';
  }).join("");
  if (!cards) return "";
  return '<h2 class="fx-h2">' + (isRef ? "相关资料" : "相关教程") + '</h2><div class="fx-related">' + cards + "</div>";
}
function renderPager(slug) {
  var pn = SITE.prevNext[slug];
  if (!pn) return "";
  var items = [];
  if (pn.prev) {
    items.push('<a class="fx-pager__item" rel="prev" href="../fix/' + escAttr(pn.prev.slug) + '.html">' +
      '<span class="fx-pager__k">' + siteIcon("chevronLeft", 14) + " 上一篇" + (pn.prev.domainName ? " · " + esc(pn.prev.domainName) : "") + "</span><b>" + esc(pn.prev.title) + "</b></a>");
  }
  if (pn.next) {
    items.push('<a class="fx-pager__item fx-pager__item--next" rel="next" href="../fix/' + escAttr(pn.next.slug) + '.html">' +
      '<span class="fx-pager__k">下一篇' + (pn.next.domainName ? " · " + esc(pn.next.domainName) : "") + " " + siteIcon("chevronRight", 14) + "</span><b>" + esc(pn.next.title) + "</b></a>");
  }
  return items.length ? '<nav class="fx-pager" aria-label="同领域的上一篇与下一篇">' + items.join("") + "</nav>" : "";
}
function articleSchema(meta, desc, isRef) {
  var slug = meta.slug || slugify(meta.title);
  var base = "https://pc-fixboxs.yuanabd.cn";
  var url = base + "/fix/" + slug + ".html";
  var dom = DOMAINS[meta.domain] || "";
  var article = {
    "@type": isRef ? "Article" : "TechArticle",
    "@id": url + "#article",
    "url": url,
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
    "headline": meta.title,
    "description": desc,
    "inLanguage": "zh-CN",
    "dateModified": meta.updated || undefined,
    "articleSection": dom || undefined,
    "keywords": (Array.isArray(meta.keywords) ? meta.keywords.join(", ") : "") || undefined,
    "isPartOf": { "@type": "WebSite", "@id": base + "/#website", "name": "修盒子 FIXBOX", "url": base + "/" },
    "publisher": { "@type": "Organization", "name": "修盒子 FIXBOX", "url": "https://www.yuanabd.cn/" }
  };
  var crumbs = [{ name: "首页", url: base + "/" }];
  if (dom) crumbs.push({ name: dom, url: base + "/browse.html#" + (meta.domain || "") });
  crumbs.push({ name: meta.title });
  return {
    "@context": "https://schema.org",
    "@graph": [article, {
      "@type": "BreadcrumbList",
      "itemListElement": crumbs.map(function (c, i) {
        var item = { "@type": "ListItem", "position": i + 1, "name": c.name };
        if (c.url) item.item = c.url;
        return item;
      })
    }]
  };
}

/* 区块拼接：丢掉空块，并把相邻的两个「虚线箭头」合并成一个。
   2026-11-24：没有 leadingRest 的文章会在「小白一键修复」和「分步骤」之间出现
   两个叠在一起的 CONNECTOR（移动端尤其明显）。 */
function joinBlocks(parts) {
  const out = [];
  parts.forEach(function (p) {
    if (!p) return;
    if (p === CONNECTOR && out[out.length - 1] === CONNECTOR) return;
    out.push(p);
  });
  return out.join("\n");
}

/* ---------- 页面主体：故障教程 / 参考资料共用 ----------
   阅读体验相关结构都在这里：步骤进度条、目录（桌面右栏 + 移动端折叠）、
   相关教程卡片网格、同领域上一篇/下一篇、更新信息。 */
function renderDoc(meta, body, forceReference) {
  var isRef = forceReference === true || isReference(meta);
  var slug = meta.slug || slugify(meta.title);
  var dom = DOMAINS[meta.domain] || meta.domain || "";
  var cat = CATS[meta.category] || meta.category || "";
  body = String(body).replace(/^\s*#\s+[^\n]*\n/, "");

  /* 前言（第一个 ## 之前的文字，如风险提示 blockquote）不是小节。 */
  var preIdx = body.search(/^##\s+/m);
  var preamble = preIdx >= 0 ? body.slice(0, preIdx).trim() : "";
  var preambleHtml = preamble ? '<div class="fx-preamble" data-reveal>' + mdToHtml(preamble) + "</div>" : "";
  var sections = (preIdx >= 0 ? body.slice(preIdx) : body)
    .split(/^##\s+/m).filter(function (x) { return x.trim(); });
  var blocks = {}, order = [];
  sections.forEach(function (sec) {
    var nl = sec.indexOf("\n");
    var name = (nl >= 0 ? sec.slice(0, nl) : sec).trim();
    blocks[name] = nl >= 0 ? sec.slice(nl + 1) : "";
    order.push(name);
  });

  var riskMap = { "安全": ["safe", siteIcon("check", 13) + " 安全"], "需谨慎": ["caution", siteIcon("warning", 13) + " 需谨慎"], "有数据风险": ["danger", siteIcon("shieldAlert", 13) + " 有数据风险"] };
  var rk = riskMap[meta.risk] || riskMap["需谨慎"];
  var osList = (Array.isArray(meta.os) ? meta.os : [meta.os]).filter(Boolean);
  /* 每一枚系统徽章单独取色：一篇文章可能同时列 Windows 与 macOS（此前统一取首个系统的颜色，
     会出现「Windows 10」徽章被染成 macOS 灰的情况）。 */
  var osBadgeKey = function (o) { return /mac/i.test(o) ? "macos" : (/路由|网络设备|光猫/i.test(o) ? "router" : "windows"); };
  var badges = osList.slice(0, 2).map(function (o) { return '<span class="fx-badge fx-badge--os" data-os="' + osBadgeKey(o) + '">' + esc(o) + "</span>"; }).join("") +
    (isRef ? '<span class="fx-badge fx-badge--ref">参考 SOP</span>' : (meta.difficulty ? '<span class="fx-badge fx-badge--level">' + esc(meta.difficulty) + "</span>" : "")) +
    (meta.time ? '<span class="fx-badge fx-badge--time">' + esc(meta.time) + "</span>" : "") +
    '<span class="fx-badge fx-badge--' + rk[0] + '">' + rk[1] + "</span>";

  var tocItem = function (n) { return '<li><a href="#' + slugify(n) + '">' + esc(n) + "</a></li>"; };
  var sectionHtml = function (n) {
    return '<section data-reveal><h2 class="fx-h2" id="' + slugify(n) + '">' + esc(n) + "</h2>" + mdToHtml(blocks[n]) + "</section>";
  };

  var desc = "", tocLinks = "", bodyHtml = "", feedbackHtml = "", relRaw = [], stepMd = "";

  if (isRef) {
    var overviewNames = ["快速概览", "一句话结论"].filter(function (n) { return blocks[n]; });
    var whoNames = ["适用对象", "适用 / 不适用"].filter(function (n) { return blocks[n]; });
    var riskNames = ["风险提示", "注意事项"].filter(function (n) { return blocks[n]; });
    var stepNames = ["分步骤", "处理步骤"].filter(function (n) { return blocks[n]; });
    var originNames = ["原始 SOP", "原文链接"].filter(function (n) { return blocks[n]; });
    var consumed = overviewNames.concat(whoNames, riskNames, stepNames, originNames);
    var overview = overviewNames.map(function (n) { return blocks[n]; }).join("\n");
    var who = whoNames.map(function (n) { return blocks[n]; }).join("\n");
    var risks = riskNames.map(function (n) { return blocks[n]; }).join("\n");
    stepMd = stepNames.map(function (n) { return blocks[n]; }).join("\n");
    var originMd = originNames.map(function (n) { return blocks[n]; }).join("\n");
    var rest = order.filter(function (n) { return consumed.indexOf(n) < 0; });
    var srcArr = Array.isArray(meta.sources) ? meta.sources : [];
    var sourcesHtml = srcArr.length ? '<ul class="fx-refs">' + srcArr.map(function (s) {
      if (!s || !s.url) return "";
      return '<li><a class="fx-link" href="' + escAttr(s.url) + '" target="_blank" rel="noopener nofollow">' +
        esc(s.title || s.url) + '</a><span class="fx-refs__meta">' + esc(String(s.type || "").toUpperCase()) + "</span></li>";
    }).join("") + "</ul>" : "";
    relRaw = (Array.isArray(meta.related) ? meta.related : [meta.related]).filter(Boolean).slice(0, 4);
    desc = String(overview).replace(new RegExp("[#*>" + BT + "]", "g"), "").replace(/\s+/g, " ").trim().slice(0, 110);

    tocLinks =
      (overview ? '<li><a href="#' + slugify("快速概览") + '">' + siteIcon("articles", 14) + ' 快速概览</a></li>' : "") +
      (who ? '<li><a href="#' + slugify("适用对象") + '">适用对象</a></li>' : "") +
      (risks ? '<li><a href="#' + slugify("风险提示") + '">风险提示</a></li>' : "") +
      (stepMd ? '<li><a href="#' + slugify("分步骤") + '">分步骤</a></li>' : "") +
      rest.map(tocItem).join("") +
      (originMd ? '<li><a href="#' + slugify("原始 SOP") + '">原始 SOP</a></li>' : "") +
      (sourcesHtml ? '<li><a href="#' + slugify("来源") + '">来源</a></li>' : "");

    bodyHtml = [
      preambleHtml,
      '<div class="fx-refbox" data-reveal>' + siteIcon("library", 16) + ' 本文是<b>参考资料</b>：处理方法整理自团队 SOP 与官方文档，原始链接在文末「原始 SOP」保留，可点击核对。</div>',
      overview ? '<div class="fx-conclusion" data-reveal><h2 id="' + slugify("快速概览") + '">📄 快速概览</h2>' + mdToHtml(overview) + "</div>" : "",
      who ? '<section data-reveal><h2 class="fx-h2" id="' + slugify("适用对象") + '">适用对象</h2>' + mdToHtml(who) + "</section>" : "",
      risks ? '<section data-reveal><h2 class="fx-h2" id="' + slugify("风险提示") + '">风险提示</h2>' + mdToHtml(risks) + "</section>" : "",
      stepMd ? CONNECTOR + '<section data-reveal><h2 class="fx-h2" id="' + slugify("分步骤") + '">分步骤</h2><p class="fx-section-note">手册步骤较多，建议勾选完成标记：进度只保存在本机浏览器，刷新后仍在。</p><ol class="fx-steps">' + renderSteps(stepMd) + "</ol></section>" : "",
      rest.map(sectionHtml).join("\n"),
      originMd ? '<section data-reveal><h2 class="fx-h2" id="' + slugify("原始 SOP") + '">原始 SOP（原文链接）</h2>' + mdToHtml(originMd) + "</section>" : "",
      sourcesHtml ? '<section data-reveal><h2 class="fx-h2" id="' + slugify("来源") + '">来源</h2>' + sourcesHtml + "</section>" : ""
    ].join("\n");

    feedbackHtml = [
      '<div class="fx-feedback fx-feedback--ref" data-fx-feedback-ref>',
      '<h2>这篇资料对你有帮助吗？</h2>',
      '<p>发现处理方法已经过时或有遗漏，请告诉我们，我们会回到原始 SOP 核对后更新。</p>',
      '<div class="fx-feedback__row"><a class="fx-btn fx-btn--primary" href="../about.html#feedback">' + siteIcon("thumbUp", 15) + ' 有帮助</a><a class="fx-btn fx-btn--ghost" href="../browse.html">' + siteIcon("close", 13) + ' 去看故障教程</a></div>',
      "</div>"
    ].join("");
  } else {
    var conclusion = blocks["一句话结论"] || "";
    var quickfix = blocks["30 秒快速排查"] || "";
    var batfixMd = blocks["小白一键修复"] || "";
    stepMd = blocks["分步骤"] || "";
    var restG = order.filter(function (n) {
      return n !== "一句话结论" && n !== "30 秒快速排查" && n !== "小白一键修复" &&
        n !== "分步骤" && n !== "相关教程";
    });
    var batfixHtml = batfixMd ? renderBatfix(batfixMd, slug) : "";
    var TRAILING_SECTIONS = ["适用 / 不适用", "开始前确认", "怎么确认修好了", "怎么确认处理好了",
      "还是不行？", "预防", "更新日志"];
    var LEADING_SECTIONS = ["合规提示"];
    var leadingRest = restG.filter(function (n) { return LEADING_SECTIONS.indexOf(n) >= 0; });
    var trailingRest = restG.filter(function (n) { return TRAILING_SECTIONS.indexOf(n) >= 0; })
      .sort(function (a, b) { return TRAILING_SECTIONS.indexOf(a) - TRAILING_SECTIONS.indexOf(b); });
    var middleRest = restG.filter(function (n) {
      return LEADING_SECTIONS.indexOf(n) < 0 && TRAILING_SECTIONS.indexOf(n) < 0;
    });
    var quickItems = quickfix.split(/\n/).filter(function (l) { return /^\s*(\d+[.)]|[-*+])\s+/.test(l); })
      .map(function (l) { return "<li>" + inline(l.replace(/^\s*(\d+[.)]|[-*+])\s+/, "")) + "</li>"; });
    relRaw = (Array.isArray(meta.related) ? meta.related : [meta.related]).filter(Boolean).slice(0, 4);
    desc = String(conclusion).replace(new RegExp("[#*>" + BT + "]", "g"), "").replace(/\s+/g, " ").trim().slice(0, 110);

    tocLinks =
      '<li><a href="#' + slugify("一句话结论") + '">' + siteIcon("lightbulb", 14) + " 一句话结论</a></li>" +
      (quickItems.length ? '<li><a href="#' + slugify("30 秒快速排查") + '">' + siteIcon("clock", 14) + " 30 秒快速排查</a></li>" : "") +
      (batfixHtml ? '<li><a href="#' + slugify("小白一键修复") + '">' + siteIcon("save", 14) + " 小白一键修复</a></li>" : "") +
      leadingRest.map(tocItem).join("") +
      (stepMd ? '<li><a href="#' + slugify("分步骤") + '">分步骤</a></li>' : "") +
      middleRest.concat(trailingRest).map(tocItem).join("");

    bodyHtml = joinBlocks([
      preambleHtml,
      '<div class="fx-conclusion" data-reveal><h2 id="' + slugify("一句话结论") + '">' + siteIcon("lightbulb", 20) + " 一句话结论</h2>" + mdToHtml(conclusion) + "</div>",
      quickItems.length ? '<div class="fx-quickfix" data-reveal><h2 id="' + slugify("30 秒快速排查") + '">' + siteIcon("clock", 20) + " 30 秒快速排查（先试这个）</h2><ol>" + quickItems.join("") + "</ol></div>" : "",
      batfixHtml,
      CONNECTOR,
      leadingRest.map(sectionHtml).join("\n"),
      stepMd ? CONNECTOR : "",
      stepMd ? '<section data-reveal><h2 class="fx-h2" id="' + slugify("分步骤") + '">分步骤</h2><p class="fx-section-note">按顺序做，做完一步点右侧「○」勾选。进度只保存在本机浏览器，刷新或下次打开都还在。</p><ol class="fx-steps">' + renderSteps(stepMd) + "</ol></section>" : "",
      middleRest.concat(trailingRest).map(sectionHtml).join("\n")
    ]);

    feedbackHtml = READER_FEEDBACK;
  }

  var tocAside = tocLinks ? '<aside class="fx-doc__toc" data-fx-toc aria-label="本页目录"><h3>本页目录</h3><ul>' + tocLinks + "</ul></aside>" : "";

  return [
    pageHead({
      title: meta.title + " · 修盒子 FIXBOX",
      desc: desc,
      robots: meta.index === "no" ? "noindex" : "",
      canonical: "https://pc-fixboxs.yuanabd.cn/fix/" + slug + ".html",
      jsonld: articleSchema(meta, desc, isRef)
    }),
    '<body data-slug="' + escAttr(slug) + '" data-kind="' + (isRef ? "reference" : "guide") + '"' +
      (isRef ? "" : ' data-feedback-endpoint="' + escAttr(FEEDBACK_ENDPOINT) + '"') + ">",
    PRELOADER,
    '<div class="fx-progress" aria-hidden="true"><div class="fx-progress__bar" data-fx-readbar></div></div>',
    '<a class="fx-skip" href="#main">跳到主要内容</a>',
    pageTopbar(),
    MOBILE_DRAWER,
    '<main id="main" class="fx-wrap">',
    '<div class="fx-doc">',
    '<aside class="fx-doc__nav" aria-label="领域导航"><h3>当前领域</h3><ul>' +
      SITE.domains.map(function (d) {
        return '<li><a href="../browse.html#' + d.id + '"' + (d.id === meta.domain ? ' aria-current="page"' : "") + ">" + esc(d.name) + "</a></li>";
      }).join("") + "</ul></aside>",
    '<article class="fx-article">',
    '<nav class="fx-crumb" aria-label="面包屑"><a href="../index.html">首页</a><span class="fx-crumb__sep">›</span><a href="../browse.html#' + escAttr(meta.domain || "") + '">' + esc(dom) + "</a>" +
      (cat ? '<span class="fx-crumb__sep">›</span><span>' + esc(cat) + "</span>" : "") + "</nav>",
    '<h1 class="fx-title">' + esc(meta.title) + "</h1>",
    '<div class="fx-meta">' + badges +
      '<span class="fx-meta__actions"><button class="fx-iconbtn" type="button" data-fx-fav aria-pressed="false">' + siteIcon("star", 14) + ' 收藏</button></span></div>',
    renderStepbar(stepMd),
    renderToc(tocLinks),
    bodyHtml,
    feedbackHtml,
    renderRelated(relRaw, isRef),
    renderPager(slug),
    '<p class="fx-updated">最后更新：' + esc(meta.updated || "—") + " · 复核：" + esc(meta.reviewer || "—") + "</p>",
    "</article>",
    tocAside,
    "</div>", "</main>",
    pageFooter(meta.updated),
    '<script src="../data/articles.js"></script>',
    '<script src="../js/fix.js"></script>',
    "</body>", "</html>"
  ].filter(Boolean).join("\n");
}

function renderArticle(meta, body) { return renderDoc(meta, body, false); }
function renderReference(meta, body) { return renderDoc(meta, body, true); }

function main() {
  if (!fs.existsSync(SRC)) { console.error("源目录不存在：" + SRC); process.exit(1); }
  fs.mkdirSync(OUT_FIX, { recursive: true });
  fs.mkdirSync(OUT_DATA, { recursive: true });
  /* ---------- 草稿隔离第 1 把锁：显式断言非递归枚举 ----------
     原先「子目录天然不进构建」依赖 readdirSync 的非递归行为，
     属于「偶然正确」：任何人把它改成 { recursive: true }（一次很自然的“改进”）
     都会让 _drafts/ 里的全部草稿被直接构建并发布到线上。
     这里把该不变量写成显式断言，改动枚举方式会立刻失败而不是静默发布。 */
  const entries = fs.readdirSync(SRC, { withFileTypes: true });
  const files = entries.filter(function (e) {
    return e.isFile() && e.name.endsWith(".md");
  }).map(function (e) { return e.name; }).sort();
  const subdirs = entries.filter(function (e) { return e.isDirectory(); }).map(function (e) { return e.name; });
  const RESERVED_DIRS = ["_drafts", "_archive", "_assets"];
  const unexpectedDirs = subdirs.filter(function (d) { return RESERVED_DIRS.indexOf(d) < 0; });
  if (unexpectedDirs.length) {
    console.error("[构建失败] content/fixboxs 下出现未登记的子目录：" + unexpectedDirs.join(", "));
    console.error("  子目录不会进入构建。若确需新增目录，请同步更新 build-fix.cjs 的 RESERVED_DIRS 与草稿隔离断言。");
    process.exitCode = 1;
  }
  if (subdirs.length) {
    console.log("  已隔离目录（不参与构建）：" + subdirs.join(", "));
  }

  /* ---------- 构建闸门：先跑内容校验（与后台共用同一实现） ----------
     校验规则见 content-lint.cjs（V1–V15）。这里只取 error 级：
     warning 不阻塞构建（例如指向「规划中文章」的 related，属于存量内容债，
     见 content-lint.cjs 中 V8 的说明与升级路径）。 */
  try {
    const lint = require("./content-lint.cjs");
    const lintRes = lint.lintAll();
    const lintErrors = lintRes.issues.filter(function (i) { return i.level === "error"; });
    if (lintErrors.length) {
      console.error("[构建失败] content-lint 发现 " + lintErrors.length + " 个错误：");
      lintErrors.slice(0, 20).forEach(function (i) {
        console.error("  ✗ [" + i.rule + "] " + i.file + " :: " + i.msg);
      });
      if (lintErrors.length > 20) console.error("  ... 另有 " + (lintErrors.length - 20) + " 项");
      process.exitCode = 1;
      return;
    }
  } catch (e) {
    console.error("[构建失败] content-lint 执行异常：" + e.message);
    process.exitCode = 1;
    return;
  }
  /* ---------- 第一遍：解析全部文章，汇总站点数据（领域 / 篇数 / 顺序） ---------- */
  const articles = [];
  const parsedAll = {};
  const docs = {};
  const errors = [];
  files.forEach(function (f) {
    const raw = fs.readFileSync(path.join(SRC, f), "utf8");
    const parsed = parseFrontMatter(raw);
    const meta = parsed.meta;
    if (!meta.slug) meta.slug = f.replace(/\.md$/, "");
    parsedAll[f] = { raw: raw, parsed: parsed, meta: meta };
    docs[meta.slug] = { meta: meta, body: parsed.body };
    if (meta.title) TITLES[meta.slug] = meta.title;
  });
  /* ---------- 失败策略：fail-closed ----------
     原先缺 title 时只 console.warn 后 return，构建 exit 0 —— 文章从站点静默消失。
     现改为收集全部错误，构建结束时统一以非零退出。 */
  files.forEach(function (f) {
    const entry = parsedAll[f];
    const parsed = entry.parsed, meta = entry.meta;
    if (!meta.title) { errors.push(f + "：缺少 title（该文章会从站点消失）"); return; }
    if (parsed.shapes && parsed.shapes.sources === "scalar") {
      errors.push(f + "：sources 被解析成标量，应为列表（front-matter 格式异常）");
    }
    const conclusion = isReference(meta)
      ? (parsed.body.match(/^##\s*(?:一句话结论|快速概览)\s*\n+([\s\S]*?)(?=\n##\s|$)/m) || [null, ""])[1]
      : (parsed.body.match(/^##\s*一句话结论\s*\n+([\s\S]*?)(?=\n##\s|$)/m) || [null, ""])[1];
    const summary = conclusion.replace(new RegExp("[#*>" + BT + "]", "g"), "").replace(/\s+/g, " ").trim().slice(0, 96);
    const osList = (Array.isArray(meta.os) ? meta.os : [meta.os]).filter(Boolean);
    const osGroup = [];
    if (/mac/i.test(osList.join(" "))) osGroup.push("macos");
    if (/windows|win/i.test(osList.join(" "))) osGroup.push("windows");
    if (["router", "net-basic", "ip-dns"].indexOf(meta.domain) >= 0) osGroup.push("network");
    if (isReference(meta)) osGroup.push("reference");
    const pr = PRIORITY.indexOf(meta.slug);
    articles.push({
      slug: meta.slug, title: meta.title,
      domain: meta.domain || "", domainName: DOMAINS[meta.domain] || "",
      category: meta.category || "", categoryName: CATS[meta.category] || "",
      path: (DOMAINS[meta.domain] || "") + (CATS[meta.category] ? " › " + CATS[meta.category] : ""),
      summary: summary,
      os: osList.map(function (o) { return { t: o, k: /mac/i.test(o) ? "macos" : (/路由|网络/.test(o) ? "router" : "windows") }; }),
      osGroup: osGroup,
      level: meta.difficulty || "", time: meta.time || "", risk: meta.risk || "需谨慎",
      symptoms: Array.isArray(meta.symptoms) ? meta.symptoms : [],
      keywords: Array.isArray(meta.keywords) ? meta.keywords : [],
      updated: meta.updated || "",
      /* 卡片跳转地址：列表页统一用 ./fix/<slug>.html。
         下发到数据里而不是写死在 JS，是为了将来页面挪位置只改构建、不改前端。 */
      detail_href: "./fix/" + meta.slug + ".html",
      kind: isReference(meta) ? "reference" : "guide",
      hot: pr >= 0 ? 31 - pr : 1
    });
  });

  /* ---------- 站点计数：唯一来源是 taxonomy.json + 本次实际构建的文章 ----------
     这里算完，页脚、侧栏、静态页计数占位、articles.js 里的 FX_META 全都引用同一份值，
     不会再出现「首页 13 个领域 / browse 12+2 / 页脚 13 个领域」这种口径分裂。 */
  SITE.total = articles.length;
  SITE.references = articles.filter(function (a) { return a.kind === "reference"; }).length;
  SITE.guides = SITE.total - SITE.references;
  SITE.domains.forEach(function (d) {
    d.count = articles.filter(function (a) { return a.domain === d.id; }).length;
  });
  SITE.updated = articles.map(function (a) { return a.updated; }).filter(Boolean).sort().pop() || "";
  articles.forEach(function (a) { SITE.bySlug[a.slug] = a; });

  /* ---------- 同领域上一篇 / 下一篇：按更新时间倒序，其次热度、标题 ---------- */
  SITE.domains.forEach(function (d) {
    const list = articles.filter(function (a) { return a.domain === d.id; })
      .sort(function (a, b) {
        if (a.updated !== b.updated) return String(b.updated).localeCompare(String(a.updated));
        if (a.hot !== b.hot) return b.hot - a.hot;
        return String(a.title).localeCompare(String(b.title), "zh");
      });
    list.forEach(function (a, i) {
      SITE.prevNext[a.slug] = {
        prev: i > 0 ? list[i - 1] : null,
        next: i < list.length - 1 ? list[i + 1] : null
      };
    });
  });

  if (errors.length) {
    console.error("");
    console.error("[构建失败] 发现 " + errors.length + " 个问题（构建未通过，不产生产物）：");
    errors.forEach(function (e) { console.error("  ✗ " + e); });
    console.error("");
    console.error("提示：修复以上问题后重新运行 node build-fix.cjs");
    process.exitCode = 1;
    return;
  }

  articles.sort(function (a, b) { return b.hot - a.hot; });

  /* ---------- 第二遍：用汇总后的 SITE 渲染文章页 ---------- */
  const checkMode = process.argv.includes("--check");
  let pageDrift = 0;
  articles.forEach(function (a) {
    const doc = docs[a.slug];
    if (!doc) return;
    const html = renderArticle(doc.meta, doc.body);
    const outFile = path.join(OUT_FIX, a.slug + ".html");
    if (checkMode) {
      const old = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : "";
      if (old !== html) pageDrift++;
    } else {
      fs.writeFileSync(outFile, html, "utf8");
    }
  });
  if (checkMode && pageDrift) {
    errors.push("有 " + pageDrift + " 篇文章页与模板渲染结果不一致（运行 node build-fix.cjs 重新生成）");
  }

  /* ---------- 草稿隔离第 2 把锁：产物侧双向对账 ----------
     不看实现怎么改，只看结果：产物里的 slug 集合必须与源目录顶层 slug 集合一致。
     多了 → 说明有草稿/非顶层内容泄漏进了构建；
     少了 → 说明有文章被静默丢弃（正是历史缺陷的真实后果）。 */
  const sourceSlugs = files.map(function (f) {
    const meta = parsedAll[f].meta;
    return meta.slug || f.replace(/\.md$/, "");
  }).sort();
  const builtSlugs = fs.existsSync(OUT_FIX)
    ? fs.readdirSync(OUT_FIX).filter(function (f) { return f.endsWith(".html"); })
        .map(function (f) { return f.replace(/\.html$/, ""); }).sort()
    : [];
  const leaked = builtSlugs.filter(function (s) { return sourceSlugs.indexOf(s) < 0; });
  const missing = sourceSlugs.filter(function (s) { return builtSlugs.indexOf(s) < 0; });
  if (leaked.length) {
    errors.push("产物中出现源目录之外的 slug（疑似草稿泄漏）：" + leaked.join(", "));
  }
  if (missing.length) {
    errors.push("源目录中的 slug 未产出页面：" + missing.join(", "));
  }

  /* ---------- lists 数据 + 站点元数据（前端计数占位、空态热门、领域筛选都读它） ---------- */
  const fxMeta = {
    updated: SITE.updated,
    total: SITE.total,
    guides: SITE.guides,
    references: SITE.references,
    domainCount: SITE.domains.length,
    faultDomainCount: siteFaultDomains().length,
    referenceDomainCount: siteRefDomains().length,
    domains: SITE.domains.map(function (d) {
      return {
        id: d.id, name: d.name, count: d.count,
        kind: d.reference ? "reference" : "guide",
        href: "./browse.html#" + d.id
      };
    })
  };
  fs.writeFileSync(path.join(OUT_DATA, "articles.js"),
    "/* 由 build-fix.cjs 生成，请勿手改。源：content/fixboxs/*.md */\nwindow.FX_ARTICLES = " +
    JSON.stringify(articles, null, 1) + ";\n" +
    "window.FX_META = " + JSON.stringify(fxMeta, null, 1) + ";\n", "utf8");

  /* ---------- 静态页计数占位：构建时写回，构建校验时对账 ----------
     index/browse/search/wizard/tools/about/hardware 是手写静态页，但「N 个领域 / N 篇」
     这类数字不再靠人记：构建把值写回 data-fx-count-* 占位，--check 模式只校验不写。 */
  const staticDrift = syncStaticPages(checkMode, articles);
  if (staticDrift.length) {
    if (checkMode) {
      errors.push("静态页占位（计数 / 无 JS 列表）未同步：" + staticDrift.join(", ") + "（运行 node build-fix.cjs 写回）");
    } else {
      console.log("  已同步静态页计数：" + staticDrift.join(", "));
    }
  }

  if (errors.length) {
    console.error("");
    console.error("[构建失败] 发现 " + errors.length + " 个问题：");
    errors.forEach(function (e) { console.error("  ✗ " + e); });
    console.error("");
    console.error("提示：修复以上问题后重新运行 node build-fix.cjs");
    process.exitCode = 1;
    return;
  }

  console.log((checkMode ? "校验" : "构建") + "完成：文章 " + articles.length + " 篇 · " +
    SITE.domains.length + " 个领域（" + siteFaultDomains().length + " 个故障领域 + " +
    siteRefDomains().length + " 个参考领域） · " + SITE.references + " 篇参考资料");
  if (articles.length) console.log("  示例：" + articles.slice(0, 3).map(function (a) { return a.slug; }).join(", "));
}

/* ---------- 静态页计数同步：把 --fx-* 占位里的数字改写为构建结果 ---------- */
const STATIC_PAGES = ["index.html", "browse.html", "search.html", "wizard.html", "tools.html", "about.html", "hardware.html"];
const COUNT_SLOTS = [
  { attr: "data-fx-count-all", value: function () { return String(SITE.total); } },
  { attr: "data-fx-count-domains", value: function () { return String(SITE.domains.length); } },
  { attr: "data-fx-count-fault-domains", value: function () { return String(siteFaultDomains().length); } },
  { attr: "data-fx-count-ref-domains", value: function () { return String(siteRefDomains().length); } },
  { attr: "data-fx-count-guides", value: function () { return String(SITE.guides); } },
  { attr: "data-fx-count-refs", value: function () { return String(SITE.references); } },
  { attr: "data-fx-updated", value: function () { return SITE.updated || ""; } }
];
function slotRe(attr) {
  return new RegExp("(<([a-zA-Z][\\w-]*)\\b[^>]*\\b" + attr + "\\b[^>]*>)[^<]*(</\\2>)", "g");
}
function domainSlotRe(id) {
  return new RegExp('(<([a-zA-Z][\\w-]*)\\b[^>]*\\bdata-fx-domain-count="' + id + '"[^>]*>)[^<]*(</\\2>)', "g");
}
/* ---------- 无 JS 兜底列表 ----------
   列表页的文章行由 fix.js 渲染；脚本不可用时整页只剩领域标题。
   这里在构建期把同一份数据写成 <noscript> 里的纯链接列表：
     · 有 JS：<noscript> 不渲染，正常走前端渲染，零额外开销；
     · 无 JS：仍能按领域看到全部教程并点进文章页。
   数据源仍是本次构建的 articles，不会与 articles.js 漂移。 */
function noscriptBody(key, arts) {
  var list;
  if (key === "hot") {
    list = arts.slice(0, 8);
  } else if (key === "search") {
    list = arts.slice(0, 10);
  } else {
    list = arts.filter(function (a) { return a.domain === key; });
  }
  if (!list.length) {
    return '<p class="fx-noscript-empty">该领域的教程正在陆续上线。</p>';
  }
  return '<ul class="fx-noscript-list">' + list.map(function (a) {
    return '<li><a href="./fix/' + escAttr(a.slug) + '.html">' + esc(a.title) + "</a>" +
      '<span class="fx-noscript-meta">' + esc(a.time || "") + (a.risk ? " · " + esc(a.risk) : "") + "</span></li>";
  }).join("") + "</ul>";
}
var NOSCRIPT_RE = /(<([a-zA-Z][\w-]*)\b[^>]*\bdata-fx-noscript="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g;

function syncStaticPages(checkMode, arts) {
  const changed = [];
  STATIC_PAGES.forEach(function (name) {
    const file = path.join(OUT, name);
    if (!fs.existsSync(file)) return;
    const html = fs.readFileSync(file, "utf8");
    let next = html;
    COUNT_SLOTS.forEach(function (slot) {
      next = next.replace(slotRe(slot.attr), function (m, open, tag, close) {
        return open + slot.value() + close;
      });
    });
    SITE.domains.forEach(function (d) {
      next = next.replace(domainSlotRe(d.id), function (m, open, tag, close) {
        return open + d.count + " 篇" + close;
      });
    });
    next = next.replace(NOSCRIPT_RE, function (m, open, tag, key, inner, close) {
      return open + noscriptBody(key, arts) + close;
    });
    if (next !== html) {
      changed.push(name);
      if (!checkMode) fs.writeFileSync(file, next, "utf8");
    }
  });
  return changed;
}

/* 供管理后台的预览接口复用同一套渲染器（admin server require 本模块时不会触发构建）。
   预览保真：后台「实时预览」看到的 HTML 与线上构建产物完全一致。 */
if (require.main === module) main();
module.exports = { mdToHtml: mdToHtml, slugify: slugify, renderArticle: renderArticle, renderReference: renderReference };
