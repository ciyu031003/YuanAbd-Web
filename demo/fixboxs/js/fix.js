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

  /* ============ 3b. 移动端抽屉导航 ============ */
  function initMobileNav() {
    var burger = $(".fx-burger"), drawer = $(".fx-drawer");
    if (!burger || !drawer) return;
    var panel = $(".fx-drawer__panel", drawer);
    var open = false, closeT = 0;
    function setOpen(v) {
      if (v === open) return;
      open = v;
      clearTimeout(closeT);
      burger.setAttribute("aria-expanded", v ? "true" : "false");
      burger.setAttribute("aria-label", v ? "关闭菜单" : "打开菜单");
      if (v) {
        drawer.hidden = false;
        /* 双 rAF 保证 transition 生效：先以 translateX(103%) 入场，再滑入 */
        requestAnimationFrame(function () { requestAnimationFrame(function () { drawer.classList.add("is-open"); }); });
        doc.body.style.overflow = "hidden";
        setTimeout(function () {
          var cur = panel && panel.querySelector('[aria-current="page"]');
          if (cur) cur.focus({ preventScroll: true });
        }, 360);
      } else {
        drawer.classList.remove("is-open");
        doc.body.style.overflow = "";
        closeT = setTimeout(function () { drawer.hidden = true; }, 380);
      }
    }
    burger.addEventListener("click", function () { setOpen(!open); });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("[data-fx-drawer-close]")) { setOpen(false); return; }
      if (e.target.closest("a")) setOpen(false);
    });
    /* 打开抽屉时把焦点圈在面板内（Tab 不跑到遮罩后面的正文），Esc 关闭并还给汉堡按钮 */
    doc.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "Escape") { setOpen(false); burger.focus(); return; }
      if (e.key !== "Tab" || !panel) return;
      var focusables = $$("a[href],button:not([disabled])", panel).filter(function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0;
      });
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
    /* bfcache 返回时若抽屉还挂着，强制复位 */
    window.addEventListener("pageshow", function (e) { if (e.persisted) setOpen(false); });
  }

  /* ============ 3c. 回到顶部（长页面通用；JS 注入，无 JS 时不出现） ============ */
  function initToTop() {
    if ($(".fx-totop")) return;
    var btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "fx-totop";
    btn.setAttribute("aria-label", "回到顶部");
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
    doc.body.appendChild(btn);
    var ticking = false;
    function paint() {
      ticking = false;
      btn.classList.toggle("is-show", (window.scrollY || 0) > 480);
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    btn.addEventListener("click", function () {
      if (reduce) { window.scrollTo(0, 0); return; }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    paint();
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
    var cjk = s.replace(/[a-z0-9]+/g, " ").replace(/\s+/g, "");
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
  /* 高亮前先做 HTML 转义：articles.js 的标题/摘要来自内容源，直接进 innerHTML
     会在标题含 < & " 时破坏标记（内容由后台写入，属于可被利用的注入面）。
     返回的是**已转义**的 HTML 片段，调用方不要再转义一次。 */
  function highlight(text, q) {
    text = String(text == null ? "" : text);
    var nq = norm(q);
    if (!nq) return escHtml(text);
    var map = [], lower = "";
    for (var i = 0; i < text.length; i++) {
      var c = norm(text.charAt(i));
      if (!c) continue;
      lower += c;
      for (var k = 0; k < c.length; k++) map.push(i);
    }
    var spans = [], from = 0, at;
    while ((at = lower.indexOf(nq, from)) >= 0) { spans.push([map[at], map[at + nq.length - 1] + 1]); from = at + nq.length; }
    if (!spans.length) return escHtml(text);
    var out = "", prev = 0;
    for (var j = 0; j < spans.length; j++) {
      out += escHtml(text.slice(prev, spans[j][0])) + "<mark>" + escHtml(text.slice(spans[j][0], spans[j][1])) + "</mark>";
      prev = spans[j][1];
    }
    return out + escHtml(text.slice(prev));
  }

  /* ============ 5. 搜索框绑定 ============ */
  function initSearch() {
    $$("[data-fx-search]").forEach(function (box) {
      var input = $("input", box);
      var panel = $("[data-fx-suggest]", box);
      /* 2026-11-24：首页的 <form> 是 [data-fx-search] 的**子**节点，
         closest("form") 取不到它，导致 submit 处理器从未绑定：
         点「搜索」走的是浏览器原生提交，跳到 index.html?q=…（结果页根本没打开）。
         先向上找，再向下找。 */
      var form = box.closest("form") || $("form", box);
      if (!input) return;
      var timer = 0, active = -1, items = [];

      function setExpanded(on) {
        input.setAttribute("aria-expanded", on ? "true" : "false");
        if (!on) input.removeAttribute("aria-activedescendant");
      }
      function close() {
        if (panel) { panel.classList.remove("is-open"); panel.innerHTML = ""; }
        active = -1; items = []; setExpanded(false);
      }
      function markActive() {
        items.forEach(function (el, i) {
          el.classList.toggle("is-active", i === active);
          el.setAttribute("aria-selected", i === active ? "true" : "false");
        });
        if (items[active]) input.setAttribute("aria-activedescendant", items[active].id);
        else input.removeAttribute("aria-activedescendant");
      }
      function render(q) {
        var hits = search(q, 6);
        if (!panel) return;
        if (!hits.length) {
          panel.innerHTML = '<div class="fx-suggest__label">没有找到匹配的教程</div>' +
            '<div class="fx-suggest__item" role="option" aria-disabled="true"><div><div class="fx-suggest__t">换个说法试试：没网、上不了网、开不了机、蓝屏</div>' +
            '<div class="fx-suggest__m">或用「症状向导」一步步定位</div></div></div>' +
            '<a class="fx-suggest__all" href="./wizard.html">开始症状向导 →</a>';
          panel.classList.add("is-open");
          items = []; active = -1; setExpanded(true);
          return;
        }
        var html = '<div class="fx-suggest__label">找到 ' + hits.length + ' 条相关教程</div>';
        hits.forEach(function (h, i) {
          html += '<a class="fx-suggest__item" id="' + (panel.id || "fx-sg") + '-' + i + '" role="option" aria-selected="false" href="./fix/' + escHtml(h.a.slug) + '.html">' +
            '<div><div class="fx-suggest__t">' + highlight(h.a.title, q) + '</div>' +
            '<div class="fx-suggest__m">' + escHtml(h.a.path || "") + ' · ' + escHtml(h.a.time || "") + '</div></div></a>';
        });
        html += '<a class="fx-suggest__all" href="./search.html?q=' + encodeURIComponent(q) + '">查看全部结果 →</a>';
        panel.innerHTML = html;
        panel.classList.add("is-open");
        items = $$(".fx-suggest__item", panel);
        active = items.length ? 0 : -1;
        markActive();
        setExpanded(true);
      }
      input.addEventListener("input", function () {
        var q = input.value.trim();
        clearTimeout(timer);
        if (!q) { close(); return; }
        timer = setTimeout(function () { render(q); }, 200);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          if (!items.length) return;
          e.preventDefault();
          active = e.key === "ArrowDown" ? (active + 1) % items.length : (active - 1 + items.length) % items.length;
          markActive();
          items[active].scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter") {
          /* 有高亮建议 → 打开建议；没有（还没渲染 / 无匹配）→ 交给搜索页，
             不能因为建议面板没准备好就把 Enter 丢掉。 */
          e.preventDefault();
          if (panel && panel.classList.contains("is-open") && items[active]) location.href = items[active].getAttribute("href");
          else if (input.value.trim()) location.href = "./search.html?q=" + encodeURIComponent(input.value.trim());
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
        /* 搜索框本体（58–66px 高）里真正的 input 只有 30px 高，点空白处不会聚焦。
           这里把「点框内非控件区域」也转成聚焦输入框，触屏上整块都是有效热区。 */
        form.addEventListener("click", function (e) {
          if (e.target.closest && e.target.closest("input,button,a,label,kbd,select")) return;
          input.focus();
        });
      }
    });
    /* 全局快捷键只绑一次（原先写在 forEach 里：页面有两个搜索框就会重复绑定）。 */
    doc.addEventListener("keydown", function (e) {
      var t = e.target || {};
      var tag = (t.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || t.isContentEditable) return;
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        var first = $("[data-fx-search] input");
        if (!first) return;
        e.preventDefault();
        first.focus(); first.select && first.select();
      }
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
    var domainSelect = $("[data-fx-domain-select]");
    var state = { q: "", os: "all", risk: "all", domain: "all" };

    var meta = fxMeta();
    if (domainSelect && meta) {
      domainSelect.innerHTML = '<option value="all">全部领域</option>' + meta.domains.map(function (d) {
        return '<option value="' + escHtml(d.id) + '">' + escHtml(d.name) + '（' + d.count + '）</option>';
      }).join("");
    }
    var OS_VALUES = ["windows", "macos", "network", "reference"];
    var RISK_VALUES = ["安全", "需谨慎", "有数据风险"];
    function readURL() {
      var p = new URLSearchParams(location.search);
      /* 白名单：URL 里的筛选参数会被拼进结果文案与筛选态，
         任意值既产生 0 结果的怪状态，也让「状态文案」变成不可控输入。 */
      state.q = p.get("q") || "";
      state.os = OS_VALUES.indexOf(p.get("os")) >= 0 ? p.get("os") : "all";
      state.risk = RISK_VALUES.indexOf(p.get("risk")) >= 0 ? p.get("risk") : "all";
      var domParam = p.get("domain");
      state.domain = (meta && meta.domains.some(function (d) { return d.id === domParam; })) ? domParam : "all";
      if (input) input.value = state.q;
      filters.forEach(function (b) {
        var on = state[b.getAttribute("data-fx-filter")] === b.getAttribute("data-value");
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (domainSelect) domainSelect.value = state.domain;
    }
    function hasFilter() { return state.os !== "all" || state.risk !== "all" || state.domain !== "all"; }
    function applyFilters(rows) {
      return rows.filter(function (r) {
        var a = r.a;
        if (state.os !== "all" && (a.osGroup || []).indexOf(state.os) < 0) return false;
        if (state.risk !== "all" && a.risk !== state.risk) return false;
        if (state.domain !== "all" && a.domain !== state.domain) return false;
        return true;
      });
    }
    function card(r) {
      var a = r.a, href = escHtml(detailHref(a));
      /* 命中只发生在「症状 / 关键词」时，标题和摘要里看不到高亮，容易让人以为没匹配上。
         这里补一行「匹配症状」，把命中的原始说法显示出来并高亮。 */
      var hit = "";
      if (state.q) {
        var qn = norm(state.q);
        var visible = norm((a.title || "") + " " + (a.summary || ""));
        var hitWords = [].concat(a.symptoms || [], a.keywords || []).filter(function (v) {
          return norm(v).indexOf(qn) >= 0;
        });
        if (hitWords.length && visible.indexOf(qn) < 0) {
          hit = '<p class="fx-card__hit">匹配症状：' + highlight(hitWords.slice(0, 3).join(" / "), state.q) + "</p>";
        }
      }
      return '<article class="fx-card fx-card--link" style="--accent:' + accentOf(a) + '">' +
        '<div class="fx-card__top"><h3 class="fx-card__t"><a class="fx-card__link" href="' + href + '">' + highlight(a.title, state.q) + '</a></h3>' +
        '<div class="fx-card__badges">' + badges(a) + '</div></div>' +
        '<p class="fx-card__path">' + escHtml(a.path || "") + '</p>' +
        (hit || '<p class="fx-card__snippet">' + highlight(a.summary || "", state.q) + "</p>") +
        '<a class="fx-card__cover" href="' + href + '" tabindex="-1" aria-hidden="true"></a></article>';
    }
    /* 注意：这段结果会以 innerHTML 写进 [data-fx-count]，
       state.risk / state.domain 直接来自 URL 查询参数 —— 必须转义，
       否则 search.html?risk=<img onerror=…> 就是反射型 XSS（2026-11-24 评审发现）。 */
    function filterNote() {
      var bits = [];
      if (state.os !== "all") bits.push("系统筛选");
      if (state.risk !== "all") bits.push("风险：" + escHtml(state.risk));
      if (state.domain !== "all") {
        var dm = (meta ? meta.domains : []).filter(function (d) { return d.id === state.domain; })[0];
        bits.push("领域：" + escHtml(dm ? dm.name : state.domain));
      }
      return bits.length ? '（' + bits.join(" · ") + '）' : "";
    }
    function render() {
      var rows;
      if (state.q) rows = applyFilters(search(state.q, 200));
      else rows = applyFilters(fxArticles().slice().sort(function (a, b) { return (b.hot || 0) - (a.hot || 0); }).map(function (a) { return { a: a, score: 0 }; }));
      if (count) {
        if (state.q) count.innerHTML = '「' + escHtml(state.q) + '」找到 <b>' + rows.length + '</b> 篇' + filterNote();
        else count.innerHTML = '共 <b>' + rows.length + '</b> 篇' + filterNote() + '，按常见程度排序';
      }
      if (list) list.innerHTML = rows.map(card).join("");
      if (empty) empty.hidden = rows.length > 0;
      revealNew(list);
    }
    function syncURL() {
      var p = new URLSearchParams();
      if (state.q) p.set("q", state.q);
      if (state.os !== "all") p.set("os", state.os);
      if (state.risk !== "all") p.set("risk", state.risk);
      if (state.domain !== "all") p.set("domain", state.domain);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
    }
    function resultLinks() { return list ? $$(".fx-card__link", list) : []; }
    function focusResult(i) {
      var links = resultLinks();
      if (!links.length) return;
      links[Math.max(0, Math.min(links.length - 1, i))].focus();
    }
    if (input) {
      input.addEventListener("input", function () {
        state.q = input.value.trim();
        clearTimeout(input._t);
        input._t = setTimeout(function () { render(); syncURL(); }, 200);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); focusResult(0); }
        else if (e.key === "Escape" && (input.value || state.q)) { input.value = ""; state.q = ""; render(); syncURL(); }
      });
    }
    /* 结果列表内 ↑↓ 移动焦点、Enter 打开（链接原生行为），Esc 回搜索框 */
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && list && list.contains(e.target)) { if (input) { input.focus(); input.select && input.select(); } return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (!list || !list.contains(e.target)) return;
      var links = resultLinks();
      var idx = links.indexOf(e.target);
      if (idx < 0) return;
      e.preventDefault();
      focusResult(idx + (e.key === "ArrowDown" ? 1 : -1));
    });
    filters.forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-fx-filter");
        state[k] = b.getAttribute("data-value");
        filters.filter(function (x) { return x.getAttribute("data-fx-filter") === k; }).forEach(function (x) {
          x.classList.toggle("is-on", x === b);
          x.setAttribute("aria-pressed", x === b ? "true" : "false"); // 屏幕阅读器需要按下态，不能只靠 .is-on
        });
        render(); syncURL();
      });
    });
    if (domainSelect) {
      domainSelect.addEventListener("change", function () {
        state.domain = domainSelect.value;
        render(); syncURL();
      });
    }
    var emptyHot = $("[data-fx-empty-hot]");
    if (emptyHot) {
      emptyHot.innerHTML = fxArticles().slice()
        .sort(function (a, b) { return (b.hot || 0) - (a.hot || 0); })
        .slice(0, 4)
        .map(function (a) { return '<a class="fx-chip" href="' + escHtml(detailHref(a)) + '">' + escHtml(a.title) + "</a>"; })
        .join("");
    }
    readURL();
    if (state.q || hasFilter()) render();
    else if (count) count.innerHTML = "共 <b>" + fxArticles().length + "</b> 篇教程，输入关键词开始筛选；也可以按系统 / 领域 / 风险筛选。";
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
    (a.os || []).slice(0, 2).forEach(function (o) { h += '<span class="fx-badge fx-badge--os" data-os="' + escHtml(o.k || "windows") + '">' + escHtml(o.t) + '</span>'; });
    /* 参考资料（第三方 SOP / 官方手册）与本站原创教程区分开，避免读者误以为是本站排障结论 */
    if (a.kind === "reference") h += '<span class="fx-badge fx-badge--ref">参考 SOP</span>';
    if (a.level) h += '<span class="fx-badge fx-badge--level">' + escHtml(a.level) + '</span>';
    if (a.time) h += '<span class="fx-badge fx-badge--time">' + escHtml(a.time) + '</span>';
    h += riskBadge(a.risk);
    return h;
  }
  function riskBadge(risk) {
    var map = { "安全": ["safe", "✅ 安全"], "需谨慎": ["caution", "⚠ 需谨慎"], "有数据风险": ["danger", "⛔ 有数据风险"] };
    var m = map[risk] || map["需谨慎"];
    return '<span class="fx-badge fx-badge--' + m[0] + '">' + m[1] + '</span>';
  }
  /* 教程卡片的跳转地址。
     历史问题：整张卡片在悬停时会上浮、边框变色，看起来「整块可点」，
     但真正能点的只有标题那一行字，点卡片空白处没有任何反应（用户实测踩到）。
     现在同一地址写两处：
       · 标题链接正常可点 / 可键盘聚焦 / 右键「在新标签页打开」
       · 卡片 ::after 铺满整块，让点击、悬停都落在链接上
     地址随数据下发（detail_href），因为首页是 ./fix/…、领域页与搜索页也是 ./fix/…，
     但万一将来有人把页面挪到子目录，构建期改一处即可，不用改 JS。 */
  function detailHref(a) { return a.detail_href || ("./fix/" + a.slug + ".html"); }
  function cardHtml(a) {
    var href = escHtml(detailHref(a));
    return '<article class="fx-card fx-card--link" data-reveal style="--accent:' + accentOf(a) + '">' +
      '<div class="fx-card__top"><h3 class="fx-card__t"><a class="fx-card__link" href="' + href + '">' + escHtml(a.title) + '</a></h3>' +
      '<div class="fx-card__badges">' + badges(a) + '</div></div>' +
      '<p class="fx-card__path">' + escHtml(a.path || "") + '</p>' +
      '<p class="fx-card__snippet">' + escHtml(a.summary || "") + '</p>' +
      '<a class="fx-card__cover" href="' + href + '" tabindex="-1" aria-hidden="true"></a></article>';
  }

  /* ============ 8. 首页 / 领域页列表 ============ */
  function initLists() {
    $$("[data-fx-list]").forEach(function (host) {
      var mode = host.getAttribute("data-fx-list");
      var limit = parseInt(host.getAttribute("data-limit") || "0", 10);
      var all = fxArticles().slice();
      if (mode === "domain" || mode === "domain-rows") {
        var dom = host.getAttribute("data-domain");
        all = all.filter(function (a) { return a.domain === dom; });
        if (!all.length) {
          host.innerHTML = '<p class="fx-domain-empty">该领域的教程正在陆续上线，先去 <a href="./wizard.html">症状向导</a> 定位问题。</p>';
          return;
        }
      }
      if (mode === "hot") all.sort(function (a, b) { return (b.hot || 0) - (a.hot || 0); });
      if (mode === "new") all.sort(function (a, b) { return String(b.updated || "").localeCompare(String(a.updated || "")); });
      if (limit) all = all.slice(0, limit);
      if (mode === "hot") host.innerHTML = all.map(hotHtml).join("");
      else if (mode === "domain-rows") host.innerHTML = all.map(rowHtml).join("");
      else host.innerHTML = all.map(cardHtml).join("");
    });
    $$("[data-fx-count-all]").forEach(function (el) { el.textContent = fxArticles().length; });
  }
  /* 「大家都在修」：编号 + 标题 + 面包屑/耗时 + 风险，扫读时先看标题，再看要不要点 */
  function hotHtml(a) {
    return '<a class="fx-hotitem" data-reveal href="' + escHtml(detailHref(a)) + '">' +
      '<span class="fx-hotitem__t">' + escHtml(a.title) + '</span>' +
      '<span class="fx-hotitem__path">' + escHtml(a.path || "") + (a.time ? ' · ' + escHtml(a.time) : "") + '</span>' +
      '<span class="fx-hotitem__badges">' + riskBadge(a.risk) + '</span>' +
      '<span class="fx-hotitem__arrow" aria-hidden="true">→</span></a>';
  }
  /* 领域页的紧凑索引行：标题 + 风险/耗时 + 一行简介，比两列大卡片更适合「按索引找」 */
  function rowHtml(a) {
    return '<a class="fx-rowitem" data-reveal href="' + escHtml(detailHref(a)) + '" style="--accent:' + accentOf(a) + '">' +
      '<span class="fx-rowitem__t">' + escHtml(a.title) + '</span>' +
      '<span class="fx-rowitem__meta">' + riskBadge(a.risk) +
        (a.time ? '<span class="fx-rowitem__time">' + escHtml(a.time) + '</span>' : "") +
        (a.level ? '<span class="fx-rowitem__level">' + escHtml(a.level) + '</span>' : "") +
        (a.kind === "reference" ? '<span class="fx-badge fx-badge--ref">参考</span>' : "") + '</span>' +
      '<span class="fx-rowitem__sum">' + escHtml(a.summary || "") + '</span>' +
      '<span class="fx-rowitem__arrow" aria-hidden="true">→</span></a>';
  }

  /* ============ 9. 步骤勾选 + 进度（localStorage 持久化） ============ */
  function initSteps() {
    var steps = $$("[data-fx-step]");
    var readbar = $("[data-fx-readbar]");
    if (readbar) {
      /* 每帧最多写一次 width：长文（3.8 万 px 的 SOP 页）滚动时不要每个 scroll 事件都触发布局 */
      var readTicking = false;
      var onScroll = function () {
        if (readTicking) return;
        readTicking = true;
        requestAnimationFrame(function () {
          readTicking = false;
          var h = doc.documentElement.scrollHeight - window.innerHeight;
          readbar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + "%";
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    }
    if (!steps.length) return;
    var docKey = "fx.steps." + (document.body.getAttribute("data-slug") || location.pathname);
    var saved = store.get(docKey) || {};
    var bar = $("[data-fx-stepprog]");
    var track = $(".fx-stepbar__track");
    var label = $("[data-fx-progress-label]");
    var status = $("[data-fx-step-status]");
    var reset = $("[data-fx-step-reset]");
    var box = $("[data-fx-stepbar]");

    function announce(msg) { if (status) status.textContent = msg; }
    function paint(st, btn, on) {
      st.classList.toggle("is-done", on);
      if (btn) {
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.innerHTML = on ? "✓" : "○";
        var n = st.getAttribute("data-step-id") || "";
        btn.setAttribute("aria-label", on ? "取消第 " + n.replace(/^s/, "") + " 步的完成标记" : "标记第 " + n.replace(/^s/, "") + " 步已完成");
      }
    }
    function updateProgress() {
      var done = steps.filter(function (s) { return s.classList.contains("is-done"); }).length;
      var total = steps.length;
      var pct = Math.round((done / total) * 100);
      if (bar) bar.style.width = pct + "%";
      if (track) track.setAttribute("aria-valuenow", String(pct));
      if (label) {
        if (!done) label.textContent = "已完成 0 / " + total + " 步 · 点步骤右侧「○」开始勾选";
        else if (done === total) label.textContent = "全部 " + total + " 步已完成，建议按「怎么确认修好了」验收";
        else label.textContent = "已完成 " + done + " / " + total + " 步（" + pct + "%） · 还剩 " + (total - done) + " 步";
      }
      if (reset) reset.hidden = done === 0;
      if (box) box.classList.toggle("is-done-all", done === total);
    }
    steps.forEach(function (st) {
      var id = st.getAttribute("data-step-id");
      var btn = $("[data-fx-check]", st);
      paint(st, btn, !!saved[id]);
      if (btn) btn.addEventListener("click", function () {
        saved[id] = !saved[id];
        paint(st, btn, saved[id]);
        store.set(docKey, saved);
        updateProgress();
        announce("第 " + String(id).replace(/^s/, "") + " 步" + (saved[id] ? "已标记完成" : "已取消完成标记"));
      });
    });
    if (reset) reset.addEventListener("click", function () {
      saved = {};
      store.set(docKey, saved);
      steps.forEach(function (st) {
        var btn = $("[data-fx-check]", st);
        paint(st, btn, false);
      });
      updateProgress();
      announce("本页步骤进度已重置");
    });
    updateProgress();
  }

  /* ============ 10. 命令复制（成功 / 失败都有明确反馈） ============ */
  function initCopy() {
    function feedback(btn, ok) {
      var cmd = btn.closest ? btn.closest(".fx-cmd") : null;
      var status = cmd ? $(".fx-cmd__status", cmd) : null;
      var label = btn.getAttribute("data-label") || btn.textContent.replace(/\s+/g, "").trim();
      btn.setAttribute("data-label", label);
      btn.textContent = ok ? "✓ 已复制" : "✕ 复制失败";
      btn.classList.toggle("is-done", ok);
      btn.classList.toggle("is-fail", !ok);
      if (status) status.textContent = ok ? "命令已复制到剪贴板" : "复制失败，请手动选中命令后复制";
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(function () {
        btn.textContent = label;
        btn.classList.remove("is-done", "is-fail");
        if (status) status.textContent = "";
      }, ok ? 1600 : 3600);
    }
    function fallbackCopy(text) {
      return new Promise(function (resolve, reject) {
        var ta = doc.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.opacity = "0";
        doc.body.appendChild(ta);
        ta.select();
        try {
          var ok = doc.execCommand("copy");
          doc.body.removeChild(ta);
          if (ok) resolve(); else reject(new Error("copy-command-rejected"));
        } catch (e) {
          doc.body.removeChild(ta);
          reject(e);
        }
      });
    }
    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
      }
      return fallbackCopy(text);
    }
    $$("[data-fx-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetId = btn.getAttribute("data-fx-copy-target");
        var block = btn.closest ? btn.closest(".fx-cmd") : null;
        var code = targetId ? doc.getElementById(targetId) : (block && $("code", block));
        if (!code) { feedback(btn, false); return; }
        var text = code.textContent.replace(/^\s*>\s?/gm, "");
        copyText(text).then(function () { feedback(btn, true); }, function () { feedback(btn, false); });
      });
    });
  }

  /* ============ 11. 本页目录高亮（滚动监听，桌面目录与移动端目录同步） ============ */
  function initToc() {
    var toc = $("[data-fx-toc]");
    var mobile = $(".fx-toc-m");
    var desktopLinks = toc ? $$("a", toc) : [];
    var mobileLinks = mobile ? $$("a", mobile) : [];
    var all = desktopLinks.concat(mobileLinks);
    if (!all.length) return;
    var targets = desktopLinks.concat(mobileLinks).map(function (a) {
      var id = decodeURIComponent((a.getAttribute("href") || "").slice(1));
      return { id: id, el: doc.getElementById(id) };
    }).filter(function (t, i, arr) {
      if (!t.el) return false;
      return arr.map(function (x) { return x.id; }).indexOf(t.id) === i;
    });
    if (!targets.length) return;
    var stick = parseInt(getComputedStyle(root).getPropertyValue("--fx-navy"), 10) || 66;
    var ticking = false;
    function setActive(id) {
      all.forEach(function (a) {
        var on = decodeURIComponent((a.getAttribute("href") || "").slice(1)) === id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
      });
    }
    function paint() {
      ticking = false;
      /* 视口顶部留出吸顶头部的高度：最后一条「已越过阅读线」的标题就是当前段落 */
      var offset = stick + 28;
      var cur = targets[0].id;
      targets.forEach(function (t) { if (t.el.getBoundingClientRect().top <= offset) cur = t.id; });
      var atBottom = (window.scrollY || 0) + window.innerHeight >= doc.documentElement.scrollHeight - 4;
      if (atBottom) cur = targets[targets.length - 1].id;
      setActive(cur);
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener("resize", paint, { passive: true });
    all.forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = decodeURIComponent((a.getAttribute("href") || "").slice(1));
        var el = doc.getElementById(id);
        if (!el) return;
        e.preventDefault();
        var top = el.getBoundingClientRect().top + (window.scrollY || 0) - (stick + 16);
        window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
        if (history.replaceState) history.replaceState(null, "", "#" + id);
        setActive(id);
        if (mobile && mobile.open) mobile.open = false;
      });
    });
    paint();
  }

  /* ============ 12. 收藏 ============ */
  /* ============ 12a. Reader feedback ============ */
  function initFeedback() {
    var box = $("[data-fx-feedback]");
    if (!box) return;
    var actions = $("[data-fx-feedback-actions]", box);
    var form = $("[data-fx-feedback-form]", box);
    var statusEl = $("[data-fx-feedback-status]", box);
    var locationSelect = $("[data-fx-feedback-location]", box);
    var typeInputs = $$('input[name="issue_type"]', box);
    var outcomeButtons = $$("[data-fx-feedback-outcome]", box);
    var submitButton = $('button[type="submit"]', form);
    var cancelButton = $("[data-fx-feedback-cancel]", box);
    var trap = $('input[name="website"]', box);
    var slug = document.body.getAttribute("data-slug") || "";
    var endpoint = document.body.getAttribute("data-feedback-endpoint") || "";
    var sentKey = "fx.feedback." + slug;
    var eventId = newEventId();

    function newEventId() {
      try {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
          return window.crypto.randomUUID();
        }
      } catch (e) {}
      var out = "";
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
      for (var i = 0; i < 32; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
      return out + String(Date.now());
    }

    function status(message, kind) {
      statusEl.hidden = !message;
      statusEl.textContent = message || "";
      statusEl.className = "fx-feedback__status" + (kind ? " is-" + kind : "");
    }

    function complete(message) {
      box.classList.add("is-sent");
      if (actions) actions.hidden = true;
      if (form) form.hidden = true;
      status(message, "ok");
    }

    function setBusy(busy) {
      outcomeButtons.forEach(function (button) { button.disabled = busy; });
      if (submitButton) submitButton.disabled = busy;
      box.setAttribute("aria-busy", busy ? "true" : "false");
    }

    function addLocations() {
      if (!locationSelect) return;
      var seen = {};
      Array.prototype.forEach.call(locationSelect.options, function (option) {
        seen[option.value] = true;
      });
      $$("article h2, article .fx-step__title").forEach(function (node) {
        if (node.closest(".fx-feedback")) return;
        var text = String(node.textContent || "").replace(/\s+/g, " ").trim();
        if (!text || text.length > 100 || seen[text]) return;
        seen[text] = true;
        var option = document.createElement("option");
        option.value = text;
        option.textContent = text;
        locationSelect.appendChild(option);
      });
    }

    function post(payload) {
      if (!endpoint) return Promise.reject(new Error("反馈接口未配置"));
      return fetch(endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) throw new Error(data.error || "提交失败，请稍后再试");
          return data;
        });
      });
    }

    function send(outcome, issueType, issueLocation, message) {
      setBusy(true);
      status("正在提交反馈…");
      return post({
        slug: slug,
        outcome: outcome,
        issue_type: issueType || "",
        issue_location: issueLocation || "",
        message: message || "",
        page_path: location.pathname,
        client_event_id: eventId
      }).then(function (data) {
        sess.set(sentKey, outcome);
        complete(data.message || (outcome === "resolved" ? "谢谢你确认问题已解决。" : "反馈已收到，我们会核对这篇文章。"));
      }).catch(function (error) {
        setBusy(false);
        status(error && error.message ? error.message : "提交失败，请稍后再试", "err");
      });
    }

    outcomeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var outcome = button.getAttribute("data-fx-feedback-outcome");
        if (outcome === "resolved") {
          send("resolved");
          return;
        }
        form.hidden = false;
        button.setAttribute("aria-expanded", "true");
        addLocations();
        status("请选择问题类型，再指出具体位置。");
        var first = typeInputs[0];
        if (first) first.focus();
      });
    });

    if (cancelButton) cancelButton.addEventListener("click", function () {
      form.hidden = true;
      status("");
      var unresolved = $('[data-fx-feedback-outcome="unresolved"]', box);
      if (unresolved) unresolved.setAttribute("aria-expanded", "false");
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (trap && trap.value) return;
      var selected = typeInputs.filter(function (input) { return input.checked; })[0];
      if (!selected) {
        status("请先选择问题主要出在哪里。", "err");
        if (typeInputs[0]) typeInputs[0].focus();
        return;
      }
      var textarea = $("textarea", form);
      send(
        "unresolved",
        selected.value,
        locationSelect ? locationSelect.value : "不确定具体位置",
        textarea ? textarea.value.trim() : ""
      );
    });

    var previous = sess.get(sentKey);
    if (previous) {
      complete(previous === "resolved" ? "本页面本次访问已确认解决，感谢反馈。" : "本页面本次访问已提交未解决反馈。");
    }
  }

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
    var dotsEl = $("[data-fx-wiz-dots]", host);
    var back = $("[data-fx-wiz-back]", host);
    var ans = {}, idx = 0, done = false;

    function questions() { return WIZ.filter(function (w) { return !w.when || w.when(ans); }); }
    function bump() {
      if (reduce || !stage) return;
      stage.classList.remove("fx-wiz__stage");
      void stage.offsetWidth;
      stage.classList.add("fx-wiz__stage");
    }
    function paintDots(total) {
      if (!dotsEl) return;
      var html = "";
      for (var i = 0; i < total; i++) {
        var cls = "fx-wiz__dot";
        if (done || i < idx) cls += " is-done";
        else if (i === idx) cls += " is-current";
        html += '<span class="' + cls + '" aria-hidden="true"></span>';
      }
      dotsEl.innerHTML = html;
    }
    function paintProgress(total) {
      var pct = done ? 100 : Math.round((idx / total) * 100);
      if (fill) fill.style.width = (pct < 6 ? 6 : pct) + "%";
      if (count) count.textContent = done ? "完成 · 共 " + total + " 题" : "第 " + (idx + 1) + " / " + total + " 题 · " + pct + "%";
      paintDots(total);
    }
    /* 题目总数是按前面答案动态变化的（选了 Mac 就不会问「所有设备都上不了网」那类题）。
       原先进度写死 WIZ.length（7），实际只有 4–6 题，导致「第 2 / 7 题」到结果页
       还显示「共 7 题」——数字与实际不符（2026-11-24 评审发现）。 */
    function render(opts) {
      done = false;
      var qs = questions();
      if (idx >= qs.length) return result();
      var w = qs[idx];
      qEl.textContent = w.q;
      hintEl.textContent = w.hint || "";
      paintProgress(qs.length);
      /* 键盘/读屏用户点完选项后，被点的按钮已从 DOM 移除，焦点会掉回 body。
         把焦点移到题目标题（tabindex=-1）上，读屏能立刻读到下一题。 */
      if (opts && opts.focus) qEl.focus({ preventScroll: false });
      optsEl.innerHTML = w.opts.map(function (o, i) {
        return '<button class="fx-wiz__opt" type="button" data-i="' + i + '">' + o.t + "</button>";
      }).join("");
      $$("[data-i]", optsEl).forEach(function (b) {
        b.addEventListener("click", function () {
          var o = w.opts[parseInt(b.getAttribute("data-i"), 10)];
          ans[w.id] = o.t;
          /* 返回上一题改了答案后，后面题目的旧答案不再可信：只保留已经答到的这一题 */
          qs.slice(idx + 1).forEach(function (q2) { delete ans[q2.id]; });
          idx++;
          render({ focus: true });
        });
      });
      if (back) back.hidden = idx === 0;
      bump();
    }
    function result() {
      done = true;
      var qs = questions();
      paintProgress(qs.length);
      var score = {}, reasons = {};
      qs.forEach(function (w) {
        var chosen = w.opts.filter(function (o) { return o.t === ans[w.id]; })[0];
        if (!chosen) return;
        var m = chosen.match || {};
        var note = chosen.t;
        (m.slugs || []).forEach(function (s) {
          score[s] = (score[s] || 0) + 5;
          (reasons[s] = reasons[s] || []).push(note);
        });
        buildIndex().forEach(function (row) {
          var a = row.a;
          if (m.domain && a.domain === m.domain) { score[a.slug] = (score[a.slug] || 0) + 2; (reasons[a.slug] = reasons[a.slug] || []).push(note); }
          if (m.os && (a.osGroup || []).indexOf(m.os) >= 0) { score[a.slug] = (score[a.slug] || 0) + 2; (reasons[a.slug] = reasons[a.slug] || []).push(note); }
        });
      });
      var ranked = Object.keys(score).map(function (s) { return { slug: s, n: score[s] }; })
        .sort(function (a, b) { return b.n - a.n; }).slice(0, 3)
        .map(function (x) {
          return {
            a: fxArticles().filter(function (y) { return y.slug === x.slug; })[0],
            reason: (reasons[x.slug] || []).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).slice(0, 2)
          };
        })
        .filter(function (x) { return x.a; });
      if (!ranked.length) ranked = fxArticles().slice(0, 3).map(function (a) { return { a: a, reason: [] }; });

      qEl.textContent = "根据你的回答，建议先看这 " + ranked.length + " 篇";
      hintEl.textContent = "按推荐顺序从上往下试，第一篇通常就能解决大部分情况；理由来自你刚才选的现象。";
      optsEl.innerHTML = '<div class="fx-wiz__result">' + ranked.map(function (r, i) {
        return '<a class="fx-card fx-card--link" data-reveal style="--accent:' + accentOf(r.a) + '" href="' + escHtml(detailHref(r.a)) + '">' +
          '<div class="fx-card__top"><h3 class="fx-card__t">' + (i === 0 ? '<span class="fx-wiz__rank">首选</span>' : "") + escHtml(r.a.title) + "</h3>" +
          '<div class="fx-card__badges">' + badges(r.a) + "</div></div>" +
          '<p class="fx-card__snippet">' + escHtml(r.a.summary || "") + "</p>" +
          (r.reason.length ? '<p class="fx-wiz__reason">推荐理由：你选择了「<b>' + escHtml(r.reason.join("」「")) + "</b>」</p>" : "") + "</a>";
      }).join("") + "</div>" +
        '<div class="fx-wiz__actions">' +
        '<button class="fx-btn fx-btn--ghost" type="button" data-fx-wiz-restart>↺ 重新开始</button>' +
        '<a class="fx-chip" href="./browse.html">按领域浏览</a>' +
        '<a class="fx-chip" href="./search.html">直接搜索</a></div>';
      revealNew(optsEl);
      var restart = $("[data-fx-wiz-restart]", optsEl);
      if (restart) restart.addEventListener("click", function () { ans = {}; idx = 0; render({ focus: true }); });
      if (back) back.hidden = false;
      bump();
    }
    if (back) back.addEventListener("click", function () { if (idx > 0) { idx--; render({ focus: true }); } });
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

  /* ============ 15. 站点计数与领域导航（数据源：构建下发的 window.FX_META） ============ */
  function fxMeta() { return window.FX_META || null; }
  function fxArticles() { return window.FX_ARTICLES || []; }
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function initCounts() {
    var m = fxMeta();
    function put(attr, val) { $$("[" + attr + "]").forEach(function (el) { el.textContent = val; }); }
    if (!m) { put("data-fx-count-all", fxArticles().length); return; }
    put("data-fx-count-all", m.total);
    put("data-fx-count-domains", m.domainCount);
    put("data-fx-count-fault-domains", m.faultDomainCount);
    put("data-fx-count-ref-domains", m.referenceDomainCount);
    put("data-fx-count-guides", m.guides);
    put("data-fx-count-refs", m.references);
    if (m.updated) put("data-fx-updated", m.updated);
    (m.domains || []).forEach(function (d) {
      $$('[data-fx-domain-count="' + d.id + '"]').forEach(function (el) { el.textContent = d.count + " 篇"; });
    });
  }
  /* 领域页顶部吸顶领域条：由 taxonomy 派生，锚点 URL 仍然可用（#domain-id） */
  function initDomainNav() {
    var nav = $("[data-fx-domainnav]");
    var m = fxMeta();
    if (!nav || !m || !m.domains) return;
    nav.innerHTML = m.domains.map(function (d) {
      return '<a class="fx-domnav__item' + (d.kind === "reference" ? " fx-domnav__item--ref" : "") +
        '" href="#' + escHtml(d.id) + '">' + escHtml(d.name) + '<span aria-hidden="true">' + escHtml(String(d.count)) + '</span></a>';
    }).join("");
    var links = $$("a", nav);
    var sections = m.domains.map(function (d) { return doc.getElementById(d.id); }).filter(Boolean);
    if (!sections.length) return;
    var ticking = false;
    function paint() {
      ticking = false;
      var offset = 150;
      var cur = sections[0].id;
      sections.forEach(function (el) { if (el.getBoundingClientRect().top <= offset) cur = el.id; });
      links.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + cur;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      var active = nav.querySelector(".is-active");
      if (reduce || !active) return;
      var left = active.offsetLeft - nav.offsetLeft - 16;
      if (Math.abs(nav.scrollLeft - left) > 60) nav.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener("resize", paint, { passive: true });
    paint();
  }

  /* ============ 16. 图片灯箱：Esc 关闭、焦点回到触发元素、尊重 reduced-motion ============ */
  function initLightbox() {
    var triggers = $$("[data-fx-zoom]");
    if (!triggers.length) return;
    var box = null, imgEl = null, capEl = null, closeBtn = null, lastFocus = null;
    function build() {
      box = doc.createElement("div");
      box.className = "fx-lightbox";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.setAttribute("aria-label", "图片预览");
      box.hidden = true;
      box.innerHTML = '<div class="fx-lightbox__backdrop" data-fx-lb-close></div>' +
        '<figure class="fx-lightbox__figure"><img class="fx-lightbox__img" alt=""><figcaption class="fx-lightbox__cap"></figcaption></figure>' +
        '<button class="fx-lightbox__close" type="button" data-fx-lb-close aria-label="关闭图片预览">✕</button>';
      doc.body.appendChild(box);
      imgEl = $(".fx-lightbox__img", box);
      capEl = $(".fx-lightbox__cap", box);
      closeBtn = $(".fx-lightbox__close", box);
      box.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest("[data-fx-lb-close]")) close();
      });
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "Tab") { e.preventDefault(); closeBtn.focus(); }
    }
    function open(trigger) {
      if (!box) build();
      var img = $("img", trigger);
      if (!img) return;
      lastFocus = trigger;
      imgEl.src = img.currentSrc || img.getAttribute("src");
      imgEl.alt = img.getAttribute("alt") || "";
      capEl.textContent = img.getAttribute("alt") || "";
      box.hidden = false;
      doc.body.style.overflow = "hidden";
      root.classList.add("fx-lb-open");
      requestAnimationFrame(function () { box.classList.add("is-open"); });
      closeBtn.focus({ preventScroll: true });
      doc.addEventListener("keydown", onKey);
    }
    function close() {
      if (!box || box.hidden) return;
      box.hidden = true;
      box.classList.remove("is-open");
      doc.body.style.overflow = "";
      root.classList.remove("fx-lb-open");
      doc.removeEventListener("keydown", onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    doc.addEventListener("click", function (e) {
      var trigger = e.target.closest ? e.target.closest("[data-fx-zoom]") : null;
      if (!trigger) return;
      e.preventDefault();
      open(trigger);
    });
  }

  /* ============ 启动 ============ */
  function boot() {
    initPreloader();
    initTransition();
    initTopbar();
    initMobileNav();
    initToTop();
    initCounts();
    initAtmosphere();
    initSearch();
    initSearchPage();
    initLists();
    initDomainNav();
    initReveal();
    initSteps();
    initCopy();
    initToc();
    initFeedback();
    initFav();
    initWizard();
    initLightbox();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
