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

const DOMAINS = {
  "net-basic": "网络基础", "win-system": "Windows 系统与开机", "router": "路由器与家庭网络",
  "ip-dns": "IP 与 DNS", "win-app": "Windows 软件与性能", "mac-system": "macOS 系统与开机",
  "mac-app": "macOS 软件与性能", "hardware": "硬件与主机", "peripheral": "外设",
  "proxy-vpn": "代理与 VPN", "account-sec": "账号与安全", "data-backup": "数据与备份"
};
const CATS = {
  "net-nowifi": "Wi-Fi 连不上", "net-connected-noint": "连上但上不了网", "net-adapter": "网卡与适配器",
  "win-boot": "开机与引导故障", "win-bluescreen": "蓝屏与死机", "win-update": "系统更新",
  "win-login": "登录与密码", "win-slow": "卡顿与性能", "win-startup": "开机启动",
  "win-storage": "磁盘空间", "win-app-crash": "软件打不开与闪退", "win-popup": "弹窗与主页劫持",
  "mac-thermal": "发热与风扇", "mac-disk-space": "储存空间",
  "ip-conflict": "IP 地址冲突", "ip-dhcp": "DHCP 与获取 IP", "ip-dns-fail": "DNS 解析",
  "rt-login": "路由器后台登录", "rt-qos": "蹭网与限速",
  "px-system": "系统代理", "px-capture": "抓包与加速工具冲突",
  "per-printer": "打印机", "per-display": "显示器", "per-usb": "U 盘与移动硬盘",
  "hw-disk": "硬盘与存储", "db-delete": "误删与恢复",
  "as-malware": "恶意软件", "as-phishing": "诈骗识别"
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
  return { meta: r.meta, body: r.body };
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

function renderArticle(meta, body) {
  const slug = meta.slug || slugify(meta.title);
  const dom = DOMAINS[meta.domain] || meta.domain || "";
  const cat = CATS[meta.category] || meta.category || "";
  // 去掉正文开头与页面标题重复的 H1
  body = body.replace(/^\s*#\s+[^\n]*\n/, "");
  const sections = body.split(/^##\s+/m).filter(function (x) { return x.trim(); });
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
  const stepMd = blocks["分步骤"] || "";
  // 「相关教程」由下方模板用 front-matter 的 related 渲染成可点击链接，正文同名段落不再重复输出
  const rest = order.filter(function (n) {
    return n !== "一句话结论" && n !== "30 秒快速排查" && n !== "分步骤" && n !== "相关教程";
  });

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

  return [
'<!DOCTYPE html>', '<html lang="zh-CN">', "<head>", '<meta charset="UTF-8">',
'<meta name="viewport" content="width=device-width,initial-scale=1">',
"<title>" + esc(meta.title) + " · 修盒子 FIXBOX</title>",
'<meta name="description" content="' + escAttr(desc) + '">',
"<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%2391E6C1'/%3E%3Ctext x='16' y='22' font-size='18' text-anchor='middle' fill='%230B3B2E' font-family='sans-serif'%3E%E4%BF%AE%3C/text%3E%3C/svg%3E\">",
CRITICAL, BOOT,
'<link rel="stylesheet" href="../../css/tokens.css">',
'<link rel="stylesheet" href="../css/theme-fix.css">',
'<link rel="stylesheet" href="../css/fix.css">',
"</head>", '<body data-slug="' + escAttr(slug) + '">',
PRELOADER,
'<div class="fx-progress"><div class="fx-progress__bar" data-fx-readbar></div></div>',
'<a class="fx-skip" href="#main">跳到主要内容</a>',
'<header class="fx-top"><div class="fx-top__inner">',
'<a class="fx-brand" href="../index.html" aria-label="修盒子 FIXBOX 首页"><span class="fx-brand__mark" aria-hidden="true">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></a>',
'<nav class="fx-nav" aria-label="主导航"><a href="../browse.html">领域</a><a href="../wizard.html">症状向导</a><a href="../tools.html">工具</a><a href="../about.html">关于</a></nav>',
'<a class="fx-topsearch" href="../search.html"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span>搜索教程</span><kbd>Ctrl K</kbd></a>',
"</div></header>",
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
'<div class="fx-conclusion" data-reveal><h2>💡 一句话结论</h2>' + mdToHtml(conclusion) + "</div>",
(quickItems.length ? '<div class="fx-quickfix" data-reveal><h2>⚡ 30 秒快速排查（先试这个）</h2><ol>' + quickItems.join("") + "</ol></div>" : ""),
CONNECTOR,
rest.map(function (n) { return '<section data-reveal><h2 class="fx-h2" id="' + slugify(n) + '">' + esc(n) + "</h2>" + mdToHtml(blocks[n]) + "</section>"; }).join("\n"),
(stepMd ? CONNECTOR + '<section data-reveal><h2 class="fx-h2" id="' + slugify("分步骤") + '">分步骤</h2><ol class="fx-steps">' + renderSteps(stepMd) + "</ol></section>" : ""),
'<div class="fx-feedback"><h2>这篇教程解决你的问题了吗？</h2><p>你的反馈会帮我们改进内容——尤其是「照做之后没解决」的情况。</p>',
'<div class="fx-feedback__row"><a class="fx-btn fx-btn--primary" href="../about.html#feedback">✅ 解决了</a><a class="fx-btn fx-btn--ghost" href="../wizard.html">✕ 没解决，重新定位</a></div></div>',
(related.length ? '<h2 class="fx-h2">相关教程</h2><div class="fx-related">' + related.map(function (r) { return '<a href="' + r.href + '">' + esc(r.label) + "</a>"; }).join("") + "</div>" : ""),
'<p class="fx-p" style="margin-top:28px;font-size:13.5px;color:var(--c-ink-300)">最后更新：' + esc(meta.updated || "") + " · 复核：" + esc(meta.reviewer || "") + "</p>",
"</article>",
'<aside class="fx-doc__toc" data-fx-toc><h3>本页目录</h3><ul>' +
  '<li><a href="#' + slugify("一句话结论") + '">💡 一句话结论</a></li>' +
  (quickItems.length ? '<li><a href="#' + slugify("30 秒快速排查") + '">⚡ 30 秒快速排查</a></li>' : "") +
  rest.map(function (n) { return '<li><a href="#' + slugify(n) + '">' + esc(n) + "</a></li>"; }).join("") +
  (stepMd ? '<li><a href="#' + slugify("分步骤") + '">分步骤</a></li>' : "") +
  "</ul></aside>",
"</div>", '<div style="height:60px"></div>', "</main>",
'<footer class="fx-foot"><div class="fx-wrap">', '<div class="fx-foot__inner">',
'<div><a class="fx-brand" href="../index.html" style="margin-bottom:10px"><span class="fx-brand__mark" aria-hidden="true">修</span><span class="fx-brand__text">修盒子<em>FIXBOX</em></span></a><p style="margin-top:10px;max-width:34ch">电脑与网络故障的自助排障手册。把「我电脑坏了」翻译成「照着做就能修好」。</p></div>',
'<div><h3>按领域</h3><ul><li><a href="../browse.html">全部 12 个领域</a></li><li><a href="../browse.html#net-basic">网络基础</a></li><li><a href="../browse.html#win-system">Windows 系统与开机</a></li><li><a href="../browse.html#data-backup">数据与备份</a></li></ul></div>',
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
  const files = fs.readdirSync(SRC).filter(function (f) { return f.endsWith(".md"); }).sort();
  const articles = [];
  const parsedAll = {};
  files.forEach(function (f) {
    const raw = fs.readFileSync(path.join(SRC, f), "utf8");
    const parsed = parseFrontMatter(raw);
    const meta = parsed.meta;
    if (!meta.slug) meta.slug = f.replace(/\.md$/, "");
    parsedAll[f] = { raw: raw, parsed: parsed, meta: meta };
    if (meta.title) TITLES[meta.slug] = meta.title;
  });
  files.forEach(function (f) {
    const entry = parsedAll[f];
    const raw = entry.raw, parsed = entry.parsed, meta = entry.meta;
    if (!meta.title) { console.warn("跳过（缺 title）：" + f); return; }
    const html = renderArticle(meta, parsed.body);
    fs.writeFileSync(path.join(OUT_FIX, meta.slug + ".html"), html, "utf8");
    const conclusion = (parsed.body.match(/^##\s*一句话结论\s*\n+([\s\S]*?)(?=\n##\s|$)/m) || [null, ""])[1];
    const summary = conclusion.replace(/[#*>\x60]/g, "").replace(/\s+/g, " ").trim().slice(0, 96);
    const osList = (Array.isArray(meta.os) ? meta.os : [meta.os]).filter(Boolean);
    const osGroup = [];
    if (/mac/i.test(osList.join(" "))) osGroup.push("macos");
    if (/windows|win/i.test(osList.join(" "))) osGroup.push("windows");
    if (["router", "net-basic", "ip-dns"].indexOf(meta.domain) >= 0) osGroup.push("network");
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
      hot: pr >= 0 ? 31 - pr : 1
    });
  });
  articles.sort(function (a, b) { return b.hot - a.hot; });
  fs.writeFileSync(path.join(OUT_DATA, "articles.js"),
    "/* 由 build-fix.cjs 生成，请勿手改。源：content/fixboxs/*.md */\nwindow.FX_ARTICLES = " +
    JSON.stringify(articles, null, 1) + ";\n", "utf8");
  console.log((process.argv.includes("--check") ? "校验" : "构建") + "完成：文章 " + articles.length + " 篇");
  if (articles.length) console.log("  示例：" + articles.slice(0, 3).map(function (a) { return a.slug; }).join(", "));
}
main();
