/* ============================================================
   fix.js — 修盒子站点交互 v2（Demo，零依赖，渐进增强）
   ------------------------------------------------------------
   新增：
     [data-fx-preloader]  沉浸式加载动画（每会话仅一次）
     [data-fx-curtain]    页面转场幕布（进入 / 离开）
     [data-reveal]        滚动错落入场
     顶栏吸顶阴影、向导题目切换动画
   保留：
     [data-fx-search]     即时搜索          [data-fx-step]  步骤勾选 + 进度
     [data-fx-copy]       命令复制          [data-fx-toc]   本页目录高亮
     [data-fx-wizard]     症状向导          [data-fx-fav]   收藏
   所有能力在元素缺失时自动跳过；JS 失效时页面与内容仍完整可用。
   ============================================================ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var sess = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  root.classList.add("fx-js");

  /* ============ 0. 沉浸式加载动画 ============ */
  function initPreloader() {
    var el = $("[data-fx-preloader]");
    if (!el) return;
    if (reduce || sess.get("fx.seen") === "1") { el.parentNode && el.parentNode.removeChild(el); return; }
    sess.set("fx.seen", "1");
    var t0 = Date.now(), done = false;
    function finish() {
      if (done) return; done = true;
      var wait = Math.max(0, 950 - (Date.now() - t0));
      setTimeout(function () {
        el.classList.add("is-done");
        setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 620);
      }, wait);
    }
    if (doc.readyState === "complete") finish();
    else window.addEventListener("load", finish);
    setTimeout(finish, 2400); // 兜底，绝不因等待资源卡住页面
  }

  /* ============ 1. 页面转场 ============ */
  function initTransition() {
    // 进入：幕布已由 <head> 内联脚本盖住（.fx-entering），这里把它拉走
    if (root.classList.contains("fx-entering")) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { root.classList.add("fx-ready"); });
      });
      setTimeout(function () {
        root.classList.remove("fx-entering", "fx-ready");
      }, 1400);
    }
    // 离开：拦内链点击 → 拉幕布 → 跳转
    doc.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (!href || href.charAt(0) === "#" || /^(mailto|tel|javascript):/i.test(href)) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // 同页锚点
      if (reduce) return; // 减弱动效：直接跳转，不做转场
      e.preventDefault();
      root.classList.add("fx-leaving");
      setTimeout(function () { location.href = url.href; }, 430);
    }, true);
    // 从 bfcache 返回：清掉所有转场状态，避免「幕布卡住」
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      root.classList.remove("fx-entering", "fx-ready", "fx-leaving");
    });
  }

  /* ============ 2. 滚动错落入场 ============ */
  function initReveal() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("fx-in"); });
      return;
    }
    // 按父容器分组编号，实现「同一组内依次入场」
    var groups = new Map();
    els.forEach(function (el) {
      var p = el.parentElement;
      var n = groups.get(p) || 0;
      el.style.setProperty("--i", String(Math.min(n, 5)));
      groups.set(p, n + 1);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("fx-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    els.forEach(function (e) { io.observe(e); });
    /* 兜底：观察器若因任何原因没有触发（快速滚动、打印、渲染异常），
       3.5s 后强制显示全部内容——任何情况下都不允许内容永久不可见。 */
    setTimeout(function () {
      els.forEach(function (e) { e.classList.add("fx-in"); });
    }, 3500);
  }

  /* ============ 3. 顶栏吸顶阴影 ============ */
  function initTopbar() {
    var top = $(".fx-top");
    if (!top) return;
    var onScroll = function () { top.classList.toggle("is-stuck", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============ 4. 搜索：归一化 + 检索 ============ */
  function norm(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/[\uFF01-\uFF5E]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[\s\u3000]+/g, "")
      .replace(/[·・.,，。、!！?？:：;；'"“”‘’()（）\[\]【】{}<>\-_/\\|+~@#$%^&*=]/g, "");
  }
  function tokens(s) {
    var out = [], latin = s.match(/[a-z0-9]+/g) || [];
    for (var i = 0; i < latin.length; i++) out.push(latin[i]);
    var cjk = s.replace(/[a-z0-9]+/g, " ");
    for (var j = 0; j < cjk.length - 1; j++) out.push(cjk.slice(j, j + 2));
    if (cjk.length === 1) out.push(cjk);
    return out;
  }
  var FIELDS = [
    { key: "title", w: 10 }, { key: "symptoms", w: 6 }, { key: "keywords", w: 4 },
    { key: "summary", w: 2 }, { key: "category", w: 3 }
  ];
  var INDEX = null;
  function buildIndex() {
    if (INDEX) return INDEX;
    INDEX = (window.FX_ARTICLES || []).map(function (a) {
      var parts = FIELDS.map(function (f) { var v = a[f.key]; return norm(Array.isArray(v) ? v.join(" ") : (v || "")); });
      return { a: a, norm: parts, toks: parts.map(tokens) };
    });
    return INDEX;
  }
  function search(q, limit) {
    var nq = norm(q);
    if (!nq) return [];
    var qt = tokens(nq), res = [];
    buildIndex().forEach(function (row) {
      var score = 0;
      for (var f = 0; f < FIELDS.length; f++) {
        var fs = 0;
        if (row.norm[f].indexOf(nq) >= 0) fs += 8 + nq.length;
        var tf = row.toks[f], hits = 0;
        for (var i = 0; i < qt.length; i++) { for (var j = 0; j < tf.length; j++) if (tf[j] === qt[i]) { hits++; break; } }
        if (qt.length) fs += (hits / qt.length) * 6;
        if (fs > 0) score += fs * FIELDS[f].w;
      }
      if (score > 0) res.push({ a: row.a, score: score });
    });
    res.sort(function (x, y) { return y.score - x.score || (y.a.hot || 0) - (x.a.hot || 0); });
    return res.slice(0, limit || 20);
  }
  function highlight(text, q) {
    var nq = norm(q);
    if (!nq || !text) return text;
    var map = [], lower = "";
    for (var i = 0; i < text.length; i++) {
      var c = norm(text.charAt(i));
      if (!c) continue;
      lower += c;
      for (var k = 0; k < c.length; k++) map.push(i);
    }
    var spans = [], from = 0, at;
    while ((at = lower.indexOf(nq, from)) >= 0) { spans.push([map[at], map[at + nq.length - 1] + 1]); from = at + nq.length; }
    if (!spans.length) return text;
    var out = text;
    for (var j = spans.length - 1; j >= 0; j--) {
      out = out.slice(0, spans[j][0]) + "<mark>" + out.slice(spans[j][0], spans[j][1]) + "</mark>" + out.slice(spans[j][1]);
    }
    return out;
  }

  /* ============ 5. 搜索框绑定 ============ */
  function initSearch() {
    $$("[data-fx-search]").forEach(function (box) {
      var input = $("input", box);
      var panel = $("[data-fx-suggest]", box);
      var form = box.closest("form") || box;
      if (!input) return;
      var timer = 0, active = -1, items = [];

      function close() { if (panel) { panel.classList.remove("is-open"); panel.innerHTML = ""; } active = -1; items = []; }
      function render(q) {
        var hits = search(q, 6);
        if (!panel) return;
        if (!hits.length) {
          panel.innerHTML = '<div class="fx-suggest__label">没有找到匹配的教程</div>' +
            '<div class="fx-suggest__item" role="option" aria-disabled="true"><div><div class="fx-suggest__t">换个说法试试：没网、上不了网、开不了机、蓝屏</div>' +
            '<div class="fx-suggest__m">或用「症状向导」一步步定位</div></div></div>' +
            '<a class="fx-suggest__all" href="./wizard.html">开始症状向导 →</a>';
          panel.classList.add("is-open"); items = []; return;
        }
        var html = '<div class="fx-suggest__label">找到 ' + hits.length + ' 条相关教程</div>';
        hits.forEach(function (h, i) {
          html += '<a class="fx-suggest__item' + (i === 0 ? " is-active" : "") + '" role="option" href="./fix/' + h.a.slug + '.html">' +
            '<div><div class="fx-suggest__t">' + highlight(h.a.title, q) + '</div>' +
            '<div class="fx-suggest__m">' + (h.a.path || "") + ' · ' + (h.a.time || "") + '</div></div></a>';
        });
        html += '<a class="fx-suggest__all" href="./search.html?q=' + encodeURIComponent(q) + '">查看全部结果 →</a>';
        panel.innerHTML = html;
        panel.classList.add("is-open");
        items = $$(".fx-suggest__item", panel); active = 0;
      }
      input.addEventListener("input", function () {
        var q = input.value.trim();
        clearTimeout(timer);
        if (!q) { close(); return; }
        timer = setTimeout(function () { render(q); }, 180);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          if (!items.length) return;
          e.preventDefault();
          items[active] && items[active].classList.remove("is-active");
          active = e.key === "ArrowDown" ? (active + 1) % items.length : (active - 1 + items.length) % items.length;
          items[active].classList.add("is-active");
          items[active].scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter") {
          if (panel && panel.classList.contains("is-open") && items[active]) { e.preventDefault(); location.href = items[active].getAttribute("href"); }
        } else if (e.key === "Escape") { close(); input.blur(); }
      });
      input.addEventListener("focus", function () { if (input.value.trim()) render(input.value.trim()); });
      doc.addEventListener("click", function (e) { if (!box.contains(e.target)) close(); });
      if (form && form.tagName === "FORM") {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var q = input.value.trim();
          if (q) location.href = "./search.html?q=" + encodeURIComponent(q);
        });
      }
      doc.addEventListener("keydown", function (e) {
        var tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
          e.preventDefault();
          var target = $("[data-fx-search] input.fx-autofocus") || input;
          target.focus(); target.select && target.select();
        }
      });
    });
  }

  /* ============ 6. 搜索结果页 ============ */
  function initSearchPage() {
    var page = $("[data-fx-searchpage]");
    if (!page) return;
    var input = $("[data-fx-searchpage-input]");
    var list = $("[data-fx-results]");
    var empty = $("[data-fx-empty]");
    var count = $("[data-fx-count]");
    var filters = $$("[data-fx-filter]");
    var state = { q: "", os: "all", risk: "all" };

    function readURL() {
      var p = new URLSearchParams(location.search);
      state.q = p.get("q") || ""; state.os = p.get("os") || "all"; state.risk = p.get("risk") || "all";
      if (input) input.value = state.q;
      filters.forEach(function (b) { b.classList.toggle("is-on", state[b.getAttribute("data-fx-filter")] === b.getAttribute("data-value")); });
    }
    function applyFilters(rows) {
      return rows.filter(function (r) {
        var a = r.a;
        if (state.os !== "all" && !(a.osGroup || []).includes(state.os)) return false;
        if (state.risk !== "all" && a.risk !== state.risk) return false;
        return true;
      });
    }
    function card(r) {
      var a = r.a;
      return '<article class="fx-card" data-reveal style="--accent:var(--fx-mint)">' +
        '<div class="fx-card__top"><h3 class="fx-card__t"><a href="./fix/' + a.slug + '.html">' + highlight(a.title, state.q) + '</a></h3>' +
        '<div class="fx-card__badges">' + badges(a) + '</div></div>' +
        '<p class="fx-card__path">' + (a.path || "") + '</p>' +
        '<p class="fx-card__snippet">' + (a.summary || "") + '</p></article>';
    }
    function render() {
      var rows = applyFilters(search(state.q, 100));
      if (count) count.innerHTML = '「' + state.q + '」找到 <b>' + rows.length + '</b> 篇教程';
      if (list) list.innerHTML = rows.map(card).join("");
      if (empty) empty.hidden = rows.length > 0;
      revealNew(list);
    }
    function syncURL() {
      var p = new URLSearchParams();
      if (state.q) p.set("q", state.q);
      if (state.os !== "all") p.set("os", state.os);
      if (state.risk !== "all") p.set("risk", state.risk);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
    }
    if (input) input.addEventListener("input", function () { state.q = input.value.trim(); clearTimeout(input._t); input._t = setTimeout(function () { render(); syncURL(); }, 150); });
    filters.forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-fx-filter");
        state[k] = b.getAttribute("data-value");
        filters.filter(function (x) { return x.getAttribute("data-fx-filter") === k; }).forEach(function (x) { x.classList.toggle("is-on", x === b); });
        render(); syncURL();
      });
    });
    readURL();
    if (state.q) render(); else if (count) count.innerHTML = "输入关键词开始搜索，或先用「症状向导」定位问题";
  }
  // 动态插入的元素直接显示（入场用 CSS 动画，避免再等一次 IntersectionObserver）
  function revealNew(root2) {
    if (!root2) return;
    $$("[data-reveal]", root2).forEach(function (el, i) {
      el.style.setProperty("--i", String(Math.min(i, 8)));
      el.classList.add("fx-in");
    });
  }

  /* ============ 7. 徽章 ============ */
  var ACCENTS = { "net-basic": "--fx-sky", "win-system": "--fx-sky", "router": "--fx-lav", "ip-dns": "--fx-lav",
    "win-app": "--fx-mint", "mac-system": "--fx-coral", "mac-app": "--fx-coral", "hardware": "--fx-sun",
    "peripheral": "--fx-mint", "proxy-vpn": "--fx-lav", "account-sec": "--fx-coral", "data-backup": "--fx-sun",
    "ref-manual": "--fx-sky", "ref-field": "--fx-lav" };
  function accentOf(a) { return "var(" + (ACCENTS[a.domain] || "--fx-mint") + ")"; }
  function badges(a) {
    var h = "";
    (a.os || []).slice(0, 2).forEach(function (o) { h += '<span class="fx-badge fx-badge--os" data-os="' + (o.k || "windows") + '">' + o.t + '</span>'; });
    /* 参考资料（第三方 SOP / 官方手册）与本站原创教程区分开，避免读者误以为是本站排障结论 */
    if (a.kind === "reference") h += '<span class="fx-badge fx-badge--ref">参考 SOP</span>';
    if (a.level) h += '<span class="fx-badge fx-badge--level">' + a.level + '</span>';
    if (a.time) h += '<span class="fx-badge fx-badge--time">' + a.time + '</span>';
    h += riskBadge(a.risk);
    return h;
  }
  function riskBadge(risk) {
    var map = { "安全": ["safe", "✅ 安全"], "需谨慎": ["caution", "⚠ 需谨慎"], "有数据风险": ["danger", "⛔ 有数据风险"] };
    var m = map[risk] || map["需谨慎"];
    return '<span class="fx-badge fx-badge--' + m[0] + '">' + m[1] + '</span>';
  }
  function cardHtml(a) {
    return '<article class="fx-card" data-reveal style="--accent:' + accentOf(a) + '">' +
      '<div class="fx-card__top"><h3 class="fx-card__t"><a href="./fix/' + a.slug + '.html">' + a.title + '</a></h3>' +
      '<div class="fx-card__badges">' + badges(a) + '</div></div>' +
      '<p class="fx-card__path">' + (a.path || "") + '</p>' +
      '<p class="fx-card__snippet">' + (a.summary || "") + '</p></article>';
  }

  /* ============ 8. 首页 / 领域页列表 ============ */
  function initLists() {
    $$("[data-fx-list]").forEach(function (host) {
      var mode = host.getAttribute("data-fx-list");
      var limit = parseInt(host.getAttribute("data-limit") || "0", 10);
      var all = (window.FX_ARTICLES || []).slice();
      if (mode === "domain") {
        var dom = host.getAttribute("data-domain");
        all = all.filter(function (a) { return a.domain === dom; });
        if (!all.length) { host.innerHTML = '<p class="fx-card__path" style="padding:14px 2px">该领域教程正在陆续上线中。</p>'; return; }
      }
      if (mode === "hot") all.sort(function (a, b) { return (b.hot || 0) - (a.hot || 0); });
      if (mode === "new") all.sort(function (a, b) { return String(b.updated || "").localeCompare(String(a.updated || "")); });
      if (limit) all = all.slice(0, limit);
      if (mode === "hot") {
        host.innerHTML = all.map(function (a) {
          return '<a class="fx-hotitem" data-reveal href="./fix/' + a.slug + '.html"><span class="fx-hotitem__t">' + a.title + '</span>' +
            '<span class="fx-hotitem__badges">' + badges(a) + '</span></a>';
        }).join("");
      } else {
        host.innerHTML = all.map(cardHtml).join("");
      }
    });
    $$("[data-fx-count-all]").forEach(function (el) { el.textContent = (window.FX_ARTICLES || []).length; });
  }

  /* ============ 9. 步骤勾选 + 进度 ============ */
  function initSteps() {
    var steps = $$("[data-fx-step]");
    if (!steps.length) return;
    var docKey = "fx.steps." + (document.body.getAttribute("data-slug") || location.pathname);
    var saved = store.get(docKey) || {};
    steps.forEach(function (st) {
      var id = st.getAttribute("data-step-id");
      var btn = $("[data-fx-check]", st);
      function paint(on) {
        st.classList.toggle("is-done", on);
        if (btn) { btn.setAttribute("aria-pressed", on ? "true" : "false"); btn.innerHTML = on ? "✓" : "○"; }
      }
      paint(!!saved[id]);
      if (btn) btn.addEventListener("click", function () {
        saved[id] = !saved[id]; paint(saved[id]); store.set(docKey, saved); updateProgress();
      });
    });
    function updateProgress() {
      var done = steps.filter(function (s) { return s.classList.contains("is-done"); }).length;
      var bar = $("[data-fx-progress]");
      var label = $("[data-fx-progress-label]");
      if (bar) bar.style.width = Math.round((done / steps.length) * 100) + "%";
      if (label) label.textContent = done + "/" + steps.length + " 步";
    }
    updateProgress();
    var readbar = $("[data-fx-readbar]");
    if (readbar) {
      var onScroll = function () {
        var h = doc.documentElement.scrollHeight - window.innerHeight;
        readbar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + "%";
      };
      window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    }
  }

  /* ============ 10. 命令复制 ============ */
  function initCopy() {
    $$("[data-fx-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var block = btn.closest(".fx-cmd");
        var code = block && $("code", block);
        if (!code) return;
        var text = code.textContent.replace(/^\s*>\s?/gm, "");
        var done = function () {
          var old = btn.innerHTML;
          btn.innerHTML = "✓ 已复制"; btn.classList.add("is-done");
          setTimeout(function () { btn.innerHTML = old; btn.classList.remove("is-done"); }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
        else fallback(text, done);
      });
    });
    function fallback(text, done) {
      var ta = doc.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      doc.body.appendChild(ta); ta.select();
      try { doc.execCommand("copy"); done(); } catch (e) {}
      doc.body.removeChild(ta);
    }
  }

  /* ============ 11. 本页目录高亮 ============ */
  function initToc() {
    var toc = $("[data-fx-toc]");
    if (!toc || !("IntersectionObserver" in window)) return;
    var links = $$("a", toc);
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("is-active"); });
          var link = map[en.target.id];
          if (link) link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-84px 0px -70% 0px", threshold: 0 });
    Object.keys(map).forEach(function (id) { var el = doc.getElementById(id); if (el) io.observe(el); });
  }

  /* ============ 12. 收藏 ============ */
  function initFav() {
    var btn = $("[data-fx-fav]");
    if (!btn) return;
    var slug = document.body.getAttribute("data-slug") || location.pathname;
    var list = store.get("fx.fav") || [];
    function paint() {
      var on = list.indexOf(slug) >= 0;
      btn.classList.toggle("is-on", on);
      btn.innerHTML = on ? "★ 已收藏" : "☆ 收藏";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    paint();
    btn.addEventListener("click", function () {
      var i = list.indexOf(slug);
      if (i >= 0) list.splice(i, 1); else list.push(slug);
      store.set("fx.fav", list); paint();
    });
  }

  /* ============ 13. 症状向导 ============ */
  var WIZ = [
    { id: "device", q: "你的设备是什么？", hint: "选错了也没关系，后面可以返回重选。", opts: [
      { t: "Windows 电脑（台式或笔记本）", match: { os: "windows" } },
      { t: "Mac（MacBook / iMac / Mac mini）", match: { os: "macos" } },
      { t: "路由器、光猫等网络设备", match: { domain: "router" } },
      { t: "打印机、显示器等外设", match: { domain: "peripheral" } }
    ]},
    { id: "power", q: "现在能正常开机进系统吗？", hint: "这一题决定先修「开机」还是先修「使用中」。", opts: [
      { t: "能正常进系统", match: { tag: "usable" } },
      { t: "能开机，但进不去桌面", match: { slugs: ["win-stuck-on-boot-logo"] } },
      { t: "按电源键完全没反应 / 黑屏", match: { slugs: ["win-blackscreen-cursor"] } }
    ]},
    { id: "symptom", q: "最主要的问题是什么？", hint: "选最影响你的那个。", opts: [
      { t: "上不了网 / 网速很慢", match: { domain: "net-basic", slugs: ["wifi-connected-but-no-internet"] } },
      { t: "电脑卡顿、死机、蓝屏", match: { slugs: ["win-slow-diagnose", "win-bluescreen-read-code"] } },
      { t: "外设不工作（打印机 / 显示器 / U 盘）", match: { domain: "peripheral" } },
      { t: "发热、异响、硬盘报错", match: { slugs: ["mac-fan-noise-overheat", "disk-clicking-failure"] } },
      { t: "弹广告、疑似中毒、被远程控制", match: { domain: "account-sec" } },
      { t: "其他 / 说不清", match: {} }
    ]},
    { id: "scope", q: "网络问题是「所有设备都不行」还是「只有这一台」？", hint: "这决定了该查宽带还是查本机。", when: function (ans) { return (ans.device && /网络|路由/.test(ans.device)) || /上不了网/.test(ans.symptom || ""); }, opts: [
      { t: "家里所有设备都上不了网", match: { slugs: ["home-network-all-offline"] } },
      { t: "只有这一台设备不行", match: { slugs: ["wifi-connected-but-no-internet", "dns-broken-but-app-works"] } },
      { t: "不确定 / 没试过", match: { slugs: ["home-network-all-offline"] } }
    ]},
    { id: "link", q: "这台设备是 Wi-Fi 还是网线？", hint: "无线和有线要查的点不一样。", when: function (ans) { return /上不了网/.test(ans.symptom || ""); }, opts: [
      { t: "Wi-Fi 无线", match: { slugs: ["wifi-connected-but-no-internet", "wifi-ssid-not-found"] } },
      { t: "网线有线", match: { slugs: ["dhcp-no-ip-169-254"] } },
      { t: "都试过了", match: { slugs: ["wifi-adapter-missing"] } }
    ]},
    { id: "icon", q: "任务栏 / 菜单栏的网络图标显示什么？", hint: "看一眼图标就能少走很多弯路。", when: function (ans) { return /上不了网/.test(ans.symptom || ""); }, opts: [
      { t: "已连接，但打不开网页", match: { slugs: ["wifi-connected-but-no-internet", "dns-broken-but-app-works"] } },
      { t: "无连接 / 红叉 / 黄色叹号", match: { slugs: ["dhcp-no-ip-169-254", "wifi-adapter-missing"] } },
      { t: "Wi-Fi 列表里找不到自家网络", match: { slugs: ["wifi-ssid-not-found"] } }
    ]},
    { id: "recent", q: "最近装过或改过什么？", hint: "很多故障是「改了东西」之后才出现的。", opts: [
      { t: "装过代理 / VPN / 加速器 / 抓包工具", match: { domain: "proxy-vpn", slugs: ["proxy-tool-broke-network", "proxy-server-not-responding"] } },
      { t: "装过杀毒或「优化」软件", match: { slugs: ["malware-first-response"] } },
      { t: "改过网络设置 / 换过路由器", match: { slugs: ["router-admin-page-unreachable"] } },
      { t: "都没动过，突然就这样了", match: {} }
    ]}
  ];

  function initWizard() {
    var host = $("[data-fx-wizard]");
    if (!host) return;
    var stage = $("[data-fx-wiz-stage]", host) || host;
    var qEl = $("[data-fx-wiz-q]", host);
    var hintEl = $("[data-fx-wiz-hint]", host);
    var optsEl = $("[data-fx-wiz-opts]", host);
    var fill = $("[data-fx-wiz-fill]");
    var count = $("[data-fx-wiz-count]");
    var back = $("[data-fx-wiz-back]");
    var ans = {}, idx = 0;

    function questions() { return WIZ.filter(function (w) { return !w.when || w.when(ans); }); }
    function bump() {
      if (reduce || !stage) return;
      stage.classList.remove("fx-wiz__stage");
      void stage.offsetWidth;
      stage.classList.add("fx-wiz__stage");
    }
    function render() {
      var qs = questions();
      if (idx >= qs.length) return result();
      var w = qs[idx];
      qEl.textContent = w.q;
      hintEl.textContent = w.hint || "";
      if (fill) fill.style.width = Math.min(92, Math.round(((idx + 1) / 8) * 100)) + "%";
      if (count) count.textContent = "第 " + (idx + 1) + " 题";
      optsEl.innerHTML = w.opts.map(function (o, i) {
        return '<button class="fx-wiz__opt" type="button" data-i="' + i + '">' + o.t + "</button>";
      }).join("");
      $$("[data-i]", optsEl).forEach(function (b) {
        b.addEventListener("click", function () {
          var o = w.opts[parseInt(b.getAttribute("data-i"), 10)];
          ans[w.id] = o.t; idx++; render();
        });
      });
      if (back) back.hidden = idx === 0;
      bump();
    }
    function result() {
      var qs = questions();
      if (fill) fill.style.width = "100%";
      if (count) count.textContent = "完成";
      var score = {}, reasons = {};
      qs.forEach(function (w) {
        var chosen = w.opts.filter(function (o) { return o.t === ans[w.id]; })[0];
        if (!chosen) return;
        var m = chosen.match || {};
        (m.slugs || []).forEach(function (s) { score[s] = (score[s] || 0) + 5; reasons[s] = chosen.t; });
        buildIndex().forEach(function (row) {
          var a = row.a;
          if (m.domain && a.domain === m.domain) { score[a.slug] = (score[a.slug] || 0) + 2; reasons[a.slug] = reasons[a.slug] || chosen.t; }
          if (m.os && (a.osGroup || []).indexOf(m.os) >= 0) { score[a.slug] = (score[a.slug] || 0) + 2; reasons[a.slug] = reasons[a.slug] || chosen.t; }
        });
      });
      var ranked = Object.keys(score).map(function (s) { return { slug: s, n: score[s] }; })
        .sort(function (a, b) { return b.n - a.n; }).slice(0, 3)
        .map(function (x) { return { a: (window.FX_ARTICLES || []).filter(function (y) { return y.slug === x.slug; })[0], reason: reasons[x.slug] }; })
        .filter(function (x) { return x.a; });
      if (!ranked.length) ranked = (window.FX_ARTICLES || []).slice(0, 3).map(function (a) { return { a: a, reason: "" }; });

      qEl.textContent = "根据你的回答，建议先看这几篇";
      hintEl.textContent = "按推荐顺序从上往下试；第一篇通常就能解决大部分情况。";
      optsEl.innerHTML = '<div class="fx-wiz__result">' + ranked.map(function (r) {
        return '<a class="fx-card" data-reveal style="--accent:' + accentOf(r.a) + '" href="./fix/' + r.a.slug + '.html">' +
          '<div class="fx-card__top"><h3 class="fx-card__t">' + r.a.title + "</h3>" +
          '<div class="fx-card__badges">' + badges(r.a) + "</div></div>" +
          '<p class="fx-card__snippet">' + (r.a.summary || "") + "</p>" +
          (r.reason ? '<p class="fx-wiz__reason">推荐理由：你选择了「<b>' + r.reason + "</b>」</p>" : "") + "</a>";
      }).join("") + "</div>" +
      '<div class="fx-empty__links" style="margin-top:22px"><a class="fx-chip" href="./search.html">都不是？去搜索</a><a class="fx-chip" href="./browse.html">按领域浏览</a></div>';
      revealNew(optsEl);
      if (back) back.hidden = false;
      bump();
    }
    if (back) back.addEventListener("click", function () { if (idx > 0) { idx--; render(); } });
    render();
  }

  /* ============ 14. 首页氛围与指针交互 ============ */
  function initAtmosphere() {
    var host = $("[data-fx-atmosphere]");
    var progress = $("[data-fx-scroll-progress] i");
    var actors = $$("[data-fx-parallax]");
    var cards = $$(".fx-domains .fx-domain");
    if (!host && !progress && !actors.length && !cards.length) return;

    if (!reduce && host) {
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        var x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
        var y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
        host.style.setProperty("--mx", x + "%");
        host.style.setProperty("--my", y + "%");
      }, { passive: true });
    }

    if (!reduce) {
      cards.forEach(function (card) {
        card.setAttribute("data-fx-tilt", "");
        card.addEventListener("pointermove", function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          card.style.setProperty("--ry", ((px - .5) * 7).toFixed(2) + "deg");
          card.style.setProperty("--rx", ((py - .5) * -7).toFixed(2) + "deg");
          card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
          card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        }, { passive: true });
        card.addEventListener("pointerleave", function () {
          card.style.setProperty("--ry", "0deg");
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--mx", "50%");
          card.style.setProperty("--my", "0%");
        });
      });
    }

    var ticking = false;
    function paintScroll() {
      ticking = false;
      var y = window.scrollY || 0;
      root.classList.toggle("fx-scrolled", y > 80);
      if (progress) {
        var max = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
        progress.style.width = Math.min(100, (y / max) * 100) + "%";
      }
      if (!reduce) {
        actors.forEach(function (el) {
          var speed = parseFloat(el.getAttribute("data-fx-parallax")) || .1;
          el.style.transform = "translate3d(0," + Math.min(34, y * speed * .18).toFixed(2) + "px,0)";
        });
      }
    }
    function requestScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paintScroll);
    }
    window.addEventListener("scroll", requestScroll, { passive: true });
    paintScroll();
  }

  /* ============ 启动 ============ */
  function boot() {
    initPreloader();
    initTransition();
    initTopbar();
    initAtmosphere();
    initSearch();
    initSearchPage();
    initLists();
    initReveal();
    initSteps();
    initCopy();
    initToc();
    initFav();
    initWizard();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
