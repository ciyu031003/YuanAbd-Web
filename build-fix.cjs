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
const REFERENCE_DOMAINS = ["ref-manual", "ref-field"];
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
  '</style>',
].join("");
const BOOT = '<script id="fx-boot">try{if(sessionStorage.getItem("fx.seen")==="1"){document.documentElement.classList.add("fx-entering")}else{document.documentElement.classList.add("fx-first")}}catch(e){document.documentElement.classList.add("fx-first")}</script>';
const PRELOADER = '<div class="fx-preloader" data-fx-preloader role="status" aria-label="正在载入修盒子"><div class="fx-preloader__inner"><div class="fx-preloader__mark"><span class="fx-preloader__ring" aria-hidden="true"></span><span class="fx-preloader__ring fx-preloader__ring--inner" aria-hidden="true"></span><span class="fx-preloader__core" aria-hidden="true">修</span><span class="fx-preloader__dot fx-preloader__dot--a" aria-hidden="true"></span><span class="fx-preloader__dot fx-preloader__dot--b" aria-hidden="true"></span><span class="fx-preloader__dot fx-preloader__dot--c" aria-hidden="true"></span></div><p class="fx-preloader__text">正在打开修盒子…</p><div class="fx-preloader__bar" aria-hidden="true"><i></i></div></div></div><div class="fx-curtain" aria-hidden="true"></div>';
const CONNECTOR = '<div class="fx-connector" aria-hidden="true"></div>';
/* 移动端抽屉导航：生成的文章页在 /fix/ 子目录，链接统一用 ../ 前缀（2026-10-24 移动端适配） */
const MOBILE_BURGER = '<button class="fx-burger" type="button" aria-expanded="false" aria-controls="fx-drawer" aria-label="打开菜单"><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span></button>';
const MOBILE_DRAWER = [
  '<div class="fx-drawer" id="fx-drawer" hidden>',
  '<div class="fx-drawer__backdrop" data-fx-drawer-close></div>',
  '<nav class="fx-drawer__panel" aria-label="站内导航" tabindex="-1">',
  '<div class="fx-drawer__head"><span class="fx-brand" aria-hidden="true"><span class="fx-brand__mark">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></span><button class="fx-drawer__x" type="button" data-fx-drawer-close aria-label="关闭菜单">✕</button></div>',
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

function inline(s) {
  let t = esc(s);
  t = t.replace(new RegExp(BT + "([^" + BT + "]+)" + BT, "g"), "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, txt, href) {
    const ext = /^https?:/i.test(href);
    if (href === "#") return '<span class="fx-link" style="cursor:help">' + txt + "</span>";
    return '<a class="fx-link"' + (ext ? ' target="_blank" rel="noopener"' : "") + ' href="' + href + '">' + txt + "</a>";
  });
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
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
      out.push('<div class="fx-cmd' + (danger ? " fx-cmd--danger" : "") + '">' +
        "<pre><code>" + esc(code) + "</code></pre>" +
        '<button class="fx-cmd__copy" type="button" data-fx-copy aria-label="复制命令">复制</button></div>');
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
      const ico = kind === "danger" ? "⛔" : (kind === "caution" ? "⚠" : "✅");
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
          checks.push('<li class="fx-check' + (on ? " is-on" : "") + '"><span class="fx-check__box" aria-hidden="true">' + (on ? "✓" : "") + "</span>" + inline(m[2]) + "</li>");
        } else items.push("<li>" + inline(txt) + "</li>");
      }
      if (items.length) out.push('<ul class="fx-ul">' + items.join("") + "</ul>");
      if (checks.length) out.push('<ul class="fx-checklist">' + checks.join("") + "</ul>");
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const buf = [line]; i++;
    while (i < lines.length && lines[i].trim() &&
           !/^(#{1,4}\s|\s*[-*+]\s|\s*\d+[.)]\s|\s*>|\s*\|)/.test(lines[i]) &&
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

/* ---------- 参考资料页：与故障教程同一套 shell，但正文按手册形态渲染 ----------
   blockName(name) 容忍同义标题（例如「一句话结论」与「快速概览」并存）。 */
function refSection(body, names) {
  const sections = String(body).split(/^##\s+/m);
  for (const sec of sections) {
    const nl = sec.indexOf("\n");
    const name = (nl >= 0 ? sec.slice(0, nl) : sec).trim();
    if (names.indexOf(name) >= 0) return nl >= 0 ? sec.slice(nl + 1) : "";
  }
  return "";
}

/* 参考资料的分步骤：用 ## 分步骤 下的 ### 步骤 N，渲染成与教程同款步骤卡（无「失败怎么办」折叠时自动省略） */
function renderReference(meta, body) {
  const slug = meta.slug || slugify(meta.title);
  const dom = DOMAINS[meta.domain] || meta.domain || "";
  const cat = CATS[meta.category] || meta.category || "";
  body = String(body).replace(/^\s*#\s+[^\n]*\n/, "");

  /* 前言（第一个 ## 之前的文字，如风险提示 blockquote）不是小节。
     旧逻辑把它当成「name=首行」的幽灵小节，会渲染出空 <h2 id=""> 和空目录项。 */
  const preIdx = body.search(/^##\s+/m);
  const preamble = preIdx >= 0 ? body.slice(0, preIdx).trim() : "";
  const preambleHtml = preamble ? '<div data-reveal>' + mdToHtml(preamble) + "</div>" : "";
  const sections = (preIdx >= 0 ? body.slice(preIdx) : body)
    .split(/^##\s+/m).filter(function (x) { return x.trim(); });
  const blocks = {}, order = [];
  sections.forEach(function (sec) {
    const nl = sec.indexOf("\n");
    const name = (nl >= 0 ? sec.slice(0, nl) : sec).trim();
    blocks[name] = nl >= 0 ? sec.slice(nl + 1) : "";
    order.push(name);
  });
  const taken = function (names) {
    return order.filter(function (n) { return names.indexOf(n) >= 0; });
  };
  const overviewNames = taken(REFERENCE_SECTIONS.overview);
  const whoNames = taken(REFERENCE_SECTIONS.who);
  const riskNames = taken(REFERENCE_SECTIONS.risks);
  const stepNames = taken(REFERENCE_SECTIONS.steps);
  const originNames = taken(REFERENCE_SECTIONS.origin);
  const consumed = overviewNames.concat(whoNames, riskNames, stepNames, originNames);

  const overview = overviewNames.map(function (n) { return blocks[n]; }).join("\n");
  const who = whoNames.map(function (n) { return blocks[n]; }).join("\n");
  const risks = riskNames.map(function (n) { return blocks[n]; }).join("\n");
  const stepMd = stepNames.map(function (n) { return blocks[n]; }).join("\n");
  const originMd = originNames.map(function (n) { return blocks[n]; }).join("\n");

  const riskMap = { "安全": ["safe", "✅ 安全"], "需谨慎": ["caution", "⚠ 需谨慎"], "有数据风险": ["danger", "⛔ 有数据风险"] };
  const rk = riskMap[meta.risk] || riskMap["需谨慎"];
  const osList = (Array.isArray(meta.os) ? meta.os : [meta.os]).filter(Boolean);
  const osKey = /mac/i.test(osList.join(" ")) ? "macos" : "windows";
  const srcArr = Array.isArray(meta.sources) ? meta.sources : [];
  const badges = osList.slice(0, 2).map(function (o) { return '<span class="fx-badge fx-badge--os" data-os="' + osKey + '">' + esc(o) + "</span>"; }).join("") +
    '<span class="fx-badge fx-badge--ref">参考 SOP</span>' +
    (meta.time ? '<span class="fx-badge fx-badge--time">' + esc(meta.time) + "</span>" : "") +
    '<span class="fx-badge fx-badge--' + rk[0] + '">' + rk[1] + "</span>";

  // 原始 SOP 区块：front-matter 的 sources 由模板统一渲染，正文里若重复则不再输出
  const sourcesHtml = srcArr.length ? '<ul class="fx-refs">' + srcArr.map(function (s) {
    if (!s || !s.url) return "";
    return '<li><a class="fx-link" href="' + escAttr(s.url) + '" target="_blank" rel="noopener nofollow">' +
      esc(s.title || s.url) + '</a><span class="fx-refs__meta">' + esc(String(s.type || "").toUpperCase()) + "</span></li>";
  }).join("") + "</ul>" : "";

  const relRaw = (Array.isArray(meta.related) ? meta.related : [meta.related]).filter(Boolean).slice(0, 4);
  const related = relRaw.map(function (r) {
    const key = String(r).trim();
    if (TITLES[key]) return { href: "../fix/" + key + ".html", label: TITLES[key] };
    return { href: "../search.html?q=" + encodeURIComponent(key.replace(/-/g, " ")), label: key };
  });
  const concludeTxt = String(overview).replace(/[#*>`]/g, "").replace(/\s+/g, " ").trim();
  const desc = concludeTxt.slice(0, 110);

  const rest = order.filter(function (n) { return consumed.indexOf(n) < 0; });

  /* 目录条目桌面/移动端共用：桌面在右侧 aside，≤1180 收进文章开头的 details 手风琴 */
  const tocLinks =
    (overview ? '<li><a href="#' + slugify("一句话结论") + '">📄 快速概览</a></li>' : "") +
    (who ? '<li><a href="#' + slugify("适用对象") + '">适用对象</a></li>' : "") +
    (risks ? '<li><a href="#' + slugify("风险提示") + '">风险提示</a></li>' : "") +
    (stepMd ? '<li><a href="#' + slugify("分步骤") + '">分步骤</a></li>' : "") +
    rest.map(function (n) { return '<li><a href="#' + slugify(n) + '">' + esc(n) + "</a></li>"; }).join("") +
    (originMd ? '<li><a href="#' + slugify("原始 SOP") + '">原始 SOP</a></li>' : "") +
    (sourcesHtml ? '<li><a href="#' + slugify("来源") + '">来源</a></li>' : "");
  const tocMobile = tocLinks
    ? '<details class="fx-toc-m"><summary>📑 本页目录</summary><ul>' + tocLinks + "</ul></details>"
    : "";

  return [
    '<!DOCTYPE html>', '<html lang="zh-CN">', "<head>", '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="theme-color" content="#FBF6EC">',
    "<title>" + esc(meta.title) + " · 修盒子 FIXBOX</title>",
    '<meta name="description" content="' + escAttr(desc) + '">',
    '<meta name="robots" content="' + (meta.index === "no" ? "noindex" : "index,follow") + '">',
    "<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%2391E6C1'/%3E%3Ctext x='16' y='22' font-size='18' text-anchor='middle' fill='%230B3B2E'%20font-family='sans-serif'%3E%E4%BF%AE%3C/text%3E%3C/svg%3E\">",
    CRITICAL, BOOT,
    '<link rel="stylesheet" href="../../css/tokens.css">',
    '<link rel="stylesheet" href="../css/theme-fix.css">',
    '<link rel="stylesheet" href="../css/fix.css">',
    '<link rel="stylesheet" href="../css/fix-neu.css">',
    "</head>", '<body data-slug="' + escAttr(slug) + '" data-kind="reference">',
    PRELOADER,
    '<div class="fx-progress"><div class="fx-progress__bar" data-fx-readbar></div></div>',
    '<a class="fx-skip" href="#main">跳到主要内容</a>',
    '<header class="fx-top"><div class="fx-top__inner">',
    '<a class="fx-brand" href="../index.html" aria-label="修盒子 FIXBOX 首页"><span class="fx-brand__mark" aria-hidden="true">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></a>',
    '<nav class="fx-nav" aria-label="主导航"><a href="../browse.html">领域</a><a href="../hardware.html">拆机图</a><a href="../wizard.html">症状向导</a><a href="../tools.html">工具</a><a href="../about.html">关于</a></nav>',
    '<a class="fx-topsearch" href="../search.html"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span>搜索教程</span><kbd>Ctrl K</kbd></a>',
    MOBILE_BURGER,
    "</div></header>",
    MOBILE_DRAWER,
    '<main id="main" class="fx-wrap">', '<div class="fx-doc">',
    '<aside class="fx-doc__nav"><h3>当前领域</h3><ul>' +
      Object.keys(DOMAINS).map(function (k) { return '<li><a href="../browse.html#' + k + '"' + (k === meta.domain ? ' aria-current="page"' : "") + ">" + DOMAINS[k] + "</a></li>"; }).join("") +
      "</ul></aside>",
    "<article>",
    '<nav class="fx-crumb" aria-label="面包屑"><a href="../index.html">首页</a><span class="fx-crumb__sep">›</span><a href="../browse.html#' + escAttr(meta.domain || "") + '">' + esc(dom) + "</a>" +
      (cat ? '<span class="fx-crumb__sep">›</span><span>' + esc(cat) + "</span>" : "") + "</nav>",
    '<h1 class="fx-title">' + esc(meta.title) + "</h1>",
    '<div class="fx-meta">' + badges +
      '<span class="fx-meta__actions"><button class="fx-iconbtn" type="button" data-fx-fav aria-pressed="false">☆ 收藏</button></span></div>',
    tocMobile,
    preambleHtml,
    '<div class="fx-refbox">📚 本文是<b>参考资料</b>：处理方法整理自团队 SOP 与官方文档，原始链接在文末「原始 SOP」保留，可点击核对。</div>',
    (overview ? '<div class="fx-conclusion" data-reveal><h2>📄 快速概览</h2>' + mdToHtml(overview) + "</div>" : ""),
    (who ? '<section data-reveal><h2 class="fx-h2" id="' + slugify("适用对象") + '">适用对象</h2>' + mdToHtml(who) + "</section>" : ""),
    (risks ? '<section data-reveal><h2 class="fx-h2" id="' + slugify("风险提示") + '">风险提示</h2>' + mdToHtml(risks) + "</section>" : ""),
    (stepMd ? CONNECTOR + '<section data-reveal><h2 class="fx-h2" id="' + slugify("分步骤") + '">分步骤</h2><ol class="fx-steps">' + renderSteps(stepMd) + "</ol></section>" : ""),
    rest.map(function (n) { return '<section data-reveal><h2 class="fx-h2" id="' + slugify(n) + '">' + esc(n) + "</h2>" + mdToHtml(blocks[n]) + "</section>"; }).join("\n"),
    (originMd ? '<section data-reveal><h2 class="fx-h2" id="' + slugify("原始 SOP") + '">原始 SOP（原文链接）</h2>' + mdToHtml(originMd) + "</section>" : ""),
    (sourcesHtml ? '<section data-reveal><h2 class="fx-h2" id="' + slugify("来源") + '">来源</h2>' + sourcesHtml + "</section>" : ""),
    '<div class="fx-feedback"><h2>这篇资料对你有帮助吗？</h2><p>发现处理方法已经过时或有遗漏，请告诉我们，我们会回到原始 SOP 核对后更新。</p>',
    '<div class="fx-feedback__row"><a class="fx-btn fx-btn--primary" href="../about.html#feedback">👍 有帮助</a><a class="fx-btn fx-btn--ghost" href="../browse.html">✕ 去看故障教程</a></div></div>',
    (related.length ? '<h2 class="fx-h2">相关资料</h2><div class="fx-related">' + related.map(function (r) { return '<a href="' + r.href + '">' + esc(r.label) + "</a>"; }).join("") + "</div>" : ""),
    '<p class="fx-p" style="margin-top:28px;font-size:13.5px;color:var(--c-ink-300)">最后更新：' + esc(meta.updated || "") + " · 复核：" + esc(meta.reviewer || "") + "</p>",
    "</article>",
    '<aside class="fx-doc__toc" data-fx-toc><h3>本页目录</h3><ul>' + tocLinks + "</ul></aside>",
    "</div>", '<div style="height:60px"></div>', "</main>",
    '<footer class="fx-foot"><div class="fx-wrap">', '<div class="fx-foot__inner">',
    '<div><a class="fx-brand" href="../index.html" style="margin-bottom:10px"><span class="fx-brand__mark" aria-hidden="true">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></a><p style="margin-top:10px;max-width:34ch">电脑与网络故障的自助排障手册。把「我电脑坏了」翻译成「照着做就能修好」。</p></div>',
    '<div><h3>按领域</h3><ul><li><a href="../browse.html">全部 14 个领域</a></li><li><a href="../browse.html#net-basic">网络基础</a></li><li><a href="../browse.html#ref-manual">装机与运维手册</a></li><li><a href="../browse.html#ref-field">现场作业与工单</a></li></ul></div>',
    '<div><h3>常用</h3><ul><li><a href="../wizard.html">症状向导</a></li><li><a href="../tools.html">命令速查</a></li><li><a href="../search.html">搜索</a></li></ul></div>',
    '<div><h3>关于</h3><ul><li><a href="../about.html">关于本站</a></li><li><a href="../about.html#disclaimer">免责声明</a></li><li><a href="../about.html#privacy">隐私说明</a></li><li><a href="../about.html#feedback">纠错与反馈</a></li></ul></div>',
    "</div>",
    '<div class="fx-foot__legal"><span>© 2026 YUAN.ABD</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">赣ICP备2024031528号-2</a><span>本站内容仅供自助排查参考；涉及数据丢失风险的操作请先备份。</span><span style="margin-left:auto">最近更新：' + esc(meta.updated || "") + "</span></div>",
    "</div></footer>",
    '<script src="../data/articles.js"></script>', '<script src="../js/fix.js"></script>',
    "</body>", "</html>",
  ].join("\n");
}

function renderArticle(meta, body) {
  if (isReference(meta)) return renderReference(meta, body);
  const slug = meta.slug || slugify(meta.title);
  const dom = DOMAINS[meta.domain] || meta.domain || "";
  const cat = CATS[meta.category] || meta.category || "";
  // 去掉正文开头与页面标题重复的 H1
  body = body.replace(/^\s*#\s+[^\n]*\n/, "");
  /* 前言（第一个 ## 之前的文字，如风险提示 blockquote）不是小节。
     旧逻辑把它当成「name=首行」的幽灵小节，会渲染出空 <h2 id=""> 和空目录项。 */
  const preIdx = body.search(/^##\s+/m);
  const preamble = preIdx >= 0 ? body.slice(0, preIdx).trim() : "";
  const preambleHtml = preamble ? '<div data-reveal>' + mdToHtml(preamble) + "</div>" : "";
  const sections = (preIdx >= 0 ? body.slice(preIdx) : body)
    .split(/^##\s+/m).filter(function (x) { return x.trim(); });
  const blocks = {};
  const order = [];
  sections.forEach(function (sec) {
    const nl = sec.indexOf("\n");
    const name = (nl >= 0 ? sec.slice(0, nl) : sec).trim();
    blocks[name] = nl >= 0 ? sec.slice(nl + 1) : "";
    order.push(name);
  });
  const conclusion = blocks["一句话结论"] || "";
  const quickfix = blocks["30 秒快速排查"] || "";
  const batfixMd = blocks["小白一键修复"] || "";
  const stepMd = blocks["分步骤"] || "";
  // 「相关教程」由下方模板用 front-matter 的 related 渲染成可点击链接，正文同名段落不再重复输出
  const rest = order.filter(function (n) {
    return n !== "一句话结论" && n !== "30 秒快速排查" && n !== "小白一键修复" &&
      n !== "分步骤" && n !== "相关教程";
  });
  const batfixHtml = batfixMd ? renderBatfix(batfixMd, slug) : "";

  const riskMap = { "安全": ["safe", "✅ 安全"], "需谨慎": ["caution", "⚠ 需谨慎"], "有数据风险": ["danger", "⛔ 有数据风险"] };
  const rk = riskMap[meta.risk] || riskMap["需谨慎"];
  const osList = (Array.isArray(meta.os) ? meta.os : [meta.os]).filter(Boolean);
  const osKey = /mac/i.test(osList.join(" ")) ? "macos" : (/路由|网络设备/.test(osList.join(" ")) ? "router" : "windows");
  const badges = osList.slice(0, 2).map(function (o) { return '<span class="fx-badge fx-badge--os" data-os="' + osKey + '">' + esc(o) + "</span>"; }).join("") +
    (meta.difficulty ? '<span class="fx-badge fx-badge--level">' + esc(meta.difficulty) + "</span>" : "") +
    (meta.time ? '<span class="fx-badge fx-badge--time">' + esc(meta.time) + "</span>" : "") +
    '<span class="fx-badge fx-badge--' + rk[0] + '">' + rk[1] + "</span>";

  const quickItems = quickfix.split(/\n/).filter(function (l) { return /^\s*(\d+[.)]|[-*+])\s+/.test(l); })
    .map(function (l) { return "<li>" + inline(l.replace(/^\s*(\d+[.)]|[-*+])\s+/, "")) + "</li>"; });
  const relRaw = (Array.isArray(meta.related) ? meta.related : [meta.related]).filter(Boolean).slice(0, 4);
  const related = relRaw.map(function (r) {
    const key = String(r).trim();
    if (TITLES[key]) return { href: "../fix/" + key + ".html", label: TITLES[key] };
    return { href: "../search.html?q=" + encodeURIComponent(key.replace(/-/g, " ")), label: key };
  });
  const desc = String(conclusion).replace(/[#*>\x60]/g, "").replace(/\s+/g, " ").trim().slice(0, 110);

  /* 目录条目桌面/移动端共用：桌面在右侧 aside，≤1180 收进文章开头的 details 手风琴 */
  const tocLinks =
    '<li><a href="#' + slugify("一句话结论") + '">💡 一句话结论</a></li>' +
    (quickItems.length ? '<li><a href="#' + slugify("30 秒快速排查") + '">⚡ 30 秒快速排查</a></li>' : "") +
    (batfixHtml ? '<li><a href="#' + slugify("小白一键修复") + '">🧰 小白一键修复</a></li>' : "") +
    rest.map(function (n) { return '<li><a href="#' + slugify(n) + '">' + esc(n) + "</a></li>"; }).join("") +
    (stepMd ? '<li><a href="#' + slugify("分步骤") + '">分步骤</a></li>' : "");
  const tocMobile = tocLinks
    ? '<details class="fx-toc-m"><summary>📑 本页目录</summary><ul>' + tocLinks + "</ul></details>"
    : "";

  return [
'<!DOCTYPE html>', '<html lang="zh-CN">', "<head>", '<meta charset="UTF-8">',
'<meta name="viewport" content="width=device-width,initial-scale=1">',
'<meta name="theme-color" content="#FBF6EC">',
"<title>" + esc(meta.title) + " · 修盒子 FIXBOX</title>",
'<meta name="description" content="' + escAttr(desc) + '">',
"<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%2391E6C1'/%3E%3Ctext x='16' y='22' font-size='18' text-anchor='middle' fill='%230B3B2E' font-family='sans-serif'%3E%E4%BF%AE%3C/text%3E%3C/svg%3E\">",
CRITICAL, BOOT,
'<link rel="stylesheet" href="../../css/tokens.css">',
'<link rel="stylesheet" href="../css/theme-fix.css">',
'<link rel="stylesheet" href="../css/fix.css">',
  '<link rel="stylesheet" href="../css/fix-neu.css">',
"</head>", '<body data-slug="' + escAttr(slug) + '">',
PRELOADER,
'<div class="fx-progress"><div class="fx-progress__bar" data-fx-readbar></div></div>',
'<a class="fx-skip" href="#main">跳到主要内容</a>',
'<header class="fx-top"><div class="fx-top__inner">',
'<a class="fx-brand" href="../index.html" aria-label="修盒子 FIXBOX 首页"><span class="fx-brand__mark" aria-hidden="true">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></a>',
'<nav class="fx-nav" aria-label="主导航"><a href="../browse.html">领域</a><a href="../hardware.html">拆机图</a><a href="../wizard.html">症状向导</a><a href="../tools.html">工具</a><a href="../about.html">关于</a></nav>',
'<a class="fx-topsearch" href="../search.html"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span>搜索教程</span><kbd>Ctrl K</kbd></a>',
MOBILE_BURGER,
"</div></header>",
MOBILE_DRAWER,
'<main id="main" class="fx-wrap">', '<div class="fx-doc">',
'<aside class="fx-doc__nav"><h3>当前领域</h3><ul>' +
  Object.keys(DOMAINS).map(function (k) { return '<li><a href="../browse.html#' + k + '"' + (k === meta.domain ? ' aria-current="page"' : "") + ">" + DOMAINS[k] + "</a></li>"; }).join("") +
"</ul></aside>",
"<article>",
'<nav class="fx-crumb" aria-label="面包屑"><a href="../index.html">首页</a><span class="fx-crumb__sep">›</span><a href="../browse.html#' + escAttr(meta.domain || "") + '">' + esc(dom) + "</a>" +
  (cat ? '<span class="fx-crumb__sep">›</span><span>' + esc(cat) + "</span>" : "") + "</nav>",
'<h1 class="fx-title">' + esc(meta.title) + "</h1>",
'<div class="fx-meta">' + badges +
  '<span class="fx-meta__actions"><span style="font-size:13px;color:var(--c-ink-300)" data-fx-progress-label></span>' +
  '<button class="fx-iconbtn" type="button" data-fx-fav aria-pressed="false">☆ 收藏</button></span></div>',
tocMobile,
preambleHtml,
'<div class="fx-conclusion" data-reveal><h2>💡 一句话结论</h2>' + mdToHtml(conclusion) + "</div>",
(quickItems.length ? '<div class="fx-quickfix" data-reveal><h2>⚡ 30 秒快速排查（先试这个）</h2><ol>' + quickItems.join("") + "</ol></div>" : ""),
batfixHtml,
CONNECTOR,
rest.map(function (n) { return '<section data-reveal><h2 class="fx-h2" id="' + slugify(n) + '">' + esc(n) + "</h2>" + mdToHtml(blocks[n]) + "</section>"; }).join("\n"),
(stepMd ? CONNECTOR + '<section data-reveal><h2 class="fx-h2" id="' + slugify("分步骤") + '">分步骤</h2><ol class="fx-steps">' + renderSteps(stepMd) + "</ol></section>" : ""),
'<div class="fx-feedback"><h2>这篇教程解决你的问题了吗？</h2><p>你的反馈会帮我们改进内容——尤其是「照做之后没解决」的情况。</p>',
'<div class="fx-feedback__row"><a class="fx-btn fx-btn--primary" href="../about.html#feedback">✅ 解决了</a><a class="fx-btn fx-btn--ghost" href="../wizard.html">✕ 没解决，重新定位</a></div></div>',
(related.length ? '<h2 class="fx-h2">相关教程</h2><div class="fx-related">' + related.map(function (r) { return '<a href="' + r.href + '">' + esc(r.label) + "</a>"; }).join("") + "</div>" : ""),
'<p class="fx-p" style="margin-top:28px;font-size:13.5px;color:var(--c-ink-300)">最后更新：' + esc(meta.updated || "") + " · 复核：" + esc(meta.reviewer || "") + "</p>",
"</article>",
'<aside class="fx-doc__toc" data-fx-toc><h3>本页目录</h3><ul>' + tocLinks + "</ul></aside>",
"</div>", '<div style="height:60px"></div>', "</main>",
'<footer class="fx-foot"><div class="fx-wrap">', '<div class="fx-foot__inner">',
'<div><a class="fx-brand" href="../index.html" style="margin-bottom:10px"><span class="fx-brand__mark" aria-hidden="true">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></a><p style="margin-top:10px;max-width:34ch">电脑与网络故障的自助排障手册。把「我电脑坏了」翻译成「照着做就能修好」。</p></div>',
    '<div><h3>按领域</h3><ul><li><a href="../browse.html">全部 14 个领域</a></li><li><a href="../browse.html#net-basic">网络基础</a></li><li><a href="../browse.html#win-system">Windows 系统与开机</a></li><li><a href="../browse.html#data-backup">数据与备份</a></li></ul></div>',
'<div><h3>常用</h3><ul><li><a href="../wizard.html">症状向导</a></li><li><a href="../tools.html">命令速查</a></li><li><a href="../search.html">搜索</a></li></ul></div>',
'<div><h3>关于</h3><ul><li><a href="../about.html">关于本站</a></li><li><a href="../about.html#disclaimer">免责声明</a></li><li><a href="../about.html#privacy">隐私说明</a></li><li><a href="../about.html#feedback">纠错与反馈</a></li></ul></div>',
"</div>",
'<div class="fx-foot__legal"><span>© 2026 YUAN.ABD</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">赣ICP备2024031528号-2</a><span>本站内容仅供自助排查参考；涉及数据丢失风险的操作请先备份。</span><span style="margin-left:auto">最近更新：' + esc(meta.updated || "") + "</span></div>",
"</div></footer>",
'<script src="../data/articles.js"></script>', '<script src="../js/fix.js"></script>',
"</body>", "</html>",
].join("\n");
}

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

  const articles = [];
  const parsedAll = {};
  const errors = [];

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
  files.forEach(function (f) {
    const raw = fs.readFileSync(path.join(SRC, f), "utf8");
    const parsed = parseFrontMatter(raw);
    const meta = parsed.meta;
    if (!meta.slug) meta.slug = f.replace(/\.md$/, "");
    parsedAll[f] = { raw: raw, parsed: parsed, meta: meta };
    if (meta.title) TITLES[meta.slug] = meta.title;
  });
  /* ---------- 失败策略：fail-closed ----------
     原先缺 title 时只 console.warn 后 return，构建 exit 0 —— 文章从站点静默消失。
     现改为收集全部错误，构建结束时统一以非零退出。 */
  files.forEach(function (f) {
    const entry = parsedAll[f];
    const raw = entry.raw, parsed = entry.parsed, meta = entry.meta;
    if (!meta.title) { errors.push(f + "：缺少 title（该文章会从站点消失）"); return; }
    if (parsed.shapes && parsed.shapes.sources === "scalar") {
      errors.push(f + "：sources 被解析成标量，应为列表（front-matter 格式异常）");
    }
    const html = renderArticle(meta, parsed.body);
    fs.writeFileSync(path.join(OUT_FIX, meta.slug + ".html"), html, "utf8");
    const conclusion = isReference(meta)
      ? (parsed.body.match(/^##\s*(?:一句话结论|快速概览)\s*\n+([\s\S]*?)(?=\n##\s|$)/m) || [null, ""])[1]
      : (parsed.body.match(/^##\s*一句话结论\s*\n+([\s\S]*?)(?=\n##\s|$)/m) || [null, ""])[1];
    const summary = conclusion.replace(/[#*>\x60]/g, "").replace(/\s+/g, " ").trim().slice(0, 96);
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
  articles.sort(function (a, b) { return b.hot - a.hot; });

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

  fs.writeFileSync(path.join(OUT_DATA, "articles.js"),
    "/* 由 build-fix.cjs 生成，请勿手改。源：content/fixboxs/*.md */\nwindow.FX_ARTICLES = " +
    JSON.stringify(articles, null, 1) + ";\n", "utf8");

  if (errors.length) {
    console.error("");
    console.error("[构建失败] 发现 " + errors.length + " 个问题（构建未通过，不产生产物）：");
    errors.forEach(function (e) { console.error("  ✗ " + e); });
    console.error("");
    console.error("提示：修复以上问题后重新运行 node build-fix.cjs");
    process.exitCode = 1;
    return;
  }

  console.log((process.argv.includes("--check") ? "校验" : "构建") + "完成：文章 " + articles.length + " 篇");
  if (articles.length) console.log("  示例：" + articles.slice(0, 3).map(function (a) { return a.slug; }).join(", "));
}
/* 供管理后台的预览接口复用同一套渲染器（admin server require 本模块时不会触发构建）。
   预览保真：后台「实时预览」看到的 HTML 与线上构建产物完全一致。 */
if (require.main === module) main();
module.exports = { mdToHtml: mdToHtml, slugify: slugify };
