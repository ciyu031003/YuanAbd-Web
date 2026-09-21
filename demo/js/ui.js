/* ============================================================
   ui.js — 精美组件层交互（Phase 2）
   ------------------------------------------------------------
   零依赖、可延迟加载、渐进增强。所有能力均通过 data-* 属性按需启用，
   元素缺失时对应逻辑自动跳过，因此同一份文件可安全用于三个站点。

   提供的能力（与 css/components.css 一一对应）：
     [data-spotlight]      指针跟随光斑（写入 --mx / --my）
     [data-ripple]         点击涟漪
     [data-fade]           图片解码后渐显（含 .ui-card__media img）
     [data-copy]           复制到剪贴板并切换按钮状态
     [data-seg]            分段控件滑块跟随（技法 6）
     [data-modal]          弹窗从触发原点缩放（写入 --ox / --oy）
     .ui-field             浮动标签的 is-filled 状态
     [data-skel]           数据就绪后移除骨架屏
     window.UI.toast()     统一提示堆栈（按需创建容器）

   无障碍：所有效果均为视觉增强，不改变语义、焦点顺序与可访问名称。
   减弱动效：动效由 CSS 层统一降级，本文件不做额外分支。
   ============================================================ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var fine = window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* 标记 JS 已启用：CSS 中依赖 .js 的初始隐藏态以此为准（禁用 JS 时内容仍可见） */
  root.classList.add("js");

  function on(el, type, fn, opts) { if (el && el.addEventListener) el.addEventListener(type, fn, opts); }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ---------- 1. 指针光斑 ---------- */
  function initSpotlight() {
    var nodes = $$("[data-spotlight]");
    if (!nodes.length || !fine || reduce) return;
    var raf = 0, pending = null;
    function flush() {
      raf = 0;
      if (!pending) return;
      var r = pending.el.getBoundingClientRect();
      if (!r.width) return;
      pending.el.style.setProperty("--mx", ((pending.x - r.left) / r.width * 100).toFixed(2) + "%");
      pending.el.style.setProperty("--my", ((pending.y - r.top) / r.height * 100).toFixed(2) + "%");
      pending = null;
    }
    nodes.forEach(function (el) {
      on(el, "pointermove", function (e) {
        pending = { el: el, x: e.clientX, y: e.clientY };
        if (!raf) raf = requestAnimationFrame(flush);
      }, { passive: true });
    });
  }

  /* ---------- 2. 点击涟漪 ---------- */
  function initRipple() {
    var nodes = $$("[data-ripple]");
    if (!nodes.length || reduce) return;
    nodes.forEach(function (el) {
      on(el, "pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        var r = el.getBoundingClientRect();
        var size = Math.max(r.width, r.height) * 2;
        var span = doc.createElement("span");
        span.className = "ui-ripple";
        span.style.cssText = "position:absolute;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%) scale(0);" +
          "background:radial-gradient(circle,color-mix(in srgb,var(--brand) 45%,transparent) 0%,transparent 70%);" +
          "width:" + size + "px;height:" + size + "px;" +
          "left:" + (e.clientX - r.left) + "px;top:" + (e.clientY - r.top) + "px;" +
          "transition:transform .55s cubic-bezier(.22,1,.36,1),opacity .55s linear;opacity:.85;z-index:0";
        if (getComputedStyle(el).position === "static") el.style.position = "relative";
        var overflow = getComputedStyle(el).overflow;
        if (overflow === "visible") el.style.overflow = "hidden";
        el.appendChild(span);
        requestAnimationFrame(function () {
          span.style.transform = "translate(-50%,-50%) scale(1)";
          span.style.opacity = "0";
        });
        setTimeout(function () { if (span.parentNode) span.parentNode.removeChild(span); }, 620);
      }, { passive: true });
    });
  }

  /* ---------- 3. 图片渐显 ---------- */
  function loadImage(img) {
    var reveal = function () { img.classList.add("is-loaded"); };
    if (img.complete && img.naturalWidth > 0) { reveal(); return; }
    if (img.decode) {
      img.decode().then(reveal, reveal);
    } else {
      on(img, "load", reveal, { once: true });
      on(img, "error", reveal, { once: true });
    }
  }
  function initFade() {
    var imgs = $$("[data-fade], .ui-card__media img");
    imgs.forEach(loadImage);
  }

  /* ---------- 4. 复制按钮 ---------- */
  function initCopy() {
    $$("[data-copy]").forEach(function (btn) {
      if (!btn.hasAttribute("data-copy-orig-label")) {
        btn.setAttribute("data-copy-orig-label", btn.getAttribute("aria-label") || "复制");
      }
      var restore = null;
      function done() {
        btn.classList.add("is-done");
        btn.setAttribute("aria-label", btn.getAttribute("data-copy-label") || "已复制链接");
        clearTimeout(restore);
        restore = setTimeout(function () {
          btn.classList.remove("is-done");
          btn.setAttribute("aria-label", btn.getAttribute("data-copy-orig-label"));
        }, 2000);
      }
      function fail() { UI.toast({ type: "error", text: "复制失败，请手动选择链接" }); }
      function legacyCopy(text) {
        var ta = doc.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
        doc.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = doc.execCommand("copy"); } catch (err) { ok = false; }
        doc.body.removeChild(ta);
        return ok;
      }
      on(btn, "click", function () {
        var text = btn.getAttribute("data-copy") || "";
        if (!text) return;
        /* 优先异步剪贴板 API；缺失或被策略拒绝（无用户手势/非安全上下文）时
           退回 execCommand，两者都失败才提示——避免静默无反馈。 */
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {
            legacyCopy(text) ? done() : fail();
          });
        } else {
          legacyCopy(text) ? done() : fail();
        }
      });
    });
  }

  /* ---------- 5. 分段控件 ---------- */
  function syncSeg(seg) {
    var thumb = $(".ui-seg__thumb", seg);
    var active = $('[aria-selected="true"]', seg) || $(".ui-seg__item", seg);
    if (!thumb || !active) return;
    thumb.style.width = active.offsetWidth + "px";
    thumb.style.transform = "translateX(" + (active.offsetLeft - 4) + "px)";
  }
  function initSeg() {
    var segs = $$("[data-seg]");
    if (!segs.length) return;
    segs.forEach(function (seg) {
      var items = $$(".ui-seg__item", seg);
      if (!items.length) return;
      if (!$('[aria-selected="true"]', seg)) items[0].setAttribute("aria-selected", "true");
      items.forEach(function (item) {
        on(item, "click", function () {
          items.forEach(function (o) { o.setAttribute("aria-selected", String(o === item)); });
          syncSeg(seg);
          seg.dispatchEvent(new CustomEvent("seg:change", {
            bubbles: true, detail: { value: item.getAttribute("data-value") || item.textContent.trim() },
          }));
        });
      });
      syncSeg(seg);
      /* 字体/尺寸变化后重新对齐 */
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { syncSeg(seg); });
      on(window, "resize", function () { syncSeg(seg); }, { passive: true });
    });
  }

  /* ---------- 6. 弹窗原点缩放 + 下拉关闭 ---------- */
  function initModalOrigin() {
    $$("[data-modal]").forEach(function (panel) {
      var name = panel.getAttribute("data-modal");
      on(doc, "click", function (e) {
        if (!e.target.closest) return;
        var trigger = e.target.closest('[data-modal-trigger="' + name + '"]');
        if (!trigger) return;
        /* 参考系 = 最近的 fixed/absolute 祖先（即弹窗覆盖层）；找不到则退回视口。
           面板自身往往不是定位元素，用它当参考系会算出离谱的百分比。 */
        var frame = null, node = panel.parentElement;
        while (node && node !== doc.body) {
          var pos = getComputedStyle(node).position;
          if (pos === "fixed" || pos === "absolute") { frame = node; break; }
          node = node.parentElement;
        }
        var fr = frame ? frame.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        var tr = trigger.getBoundingClientRect();
        if (!fr.width || !fr.height) return;
        var mx = tr.left + tr.width / 2, my = tr.top + tr.height / 2;
        panel.style.setProperty("--ox", (Math.max(0, Math.min(1, (mx - fr.left) / fr.width)) * 100).toFixed(2) + "%");
        panel.style.setProperty("--oy", (Math.max(0, Math.min(1, (my - fr.top) / fr.height)) * 100).toFixed(2) + "%");
      }, true);
    });
  }
  function initDragClose() {
    if (!fine && !("ontouchstart" in window)) return;
    $$("[data-modal-drag]").forEach(function (panel) {
      var startY = 0, dy = 0, active = false;
      var handle = panel.getAttribute("data-modal-drag") || panel;
      var el = handle === "self" ? panel : $(handle, panel) || panel;
      on(el, "pointerdown", function (e) {
        if (e.pointerType === "mouse") return;         /* 仅触屏下拉，避免与桌面交互冲突 */
        if (panel.scrollTop > 2) return;               /* 内容已滚动时不接管手势 */
        active = true; startY = e.clientY; dy = 0;
        panel.style.transition = "none";
      });
      on(el, "pointermove", function (e) {
        if (!active) return;
        dy = Math.max(0, e.clientY - startY);
        panel.style.transform = "translateY(" + dy + "px)";
      }, { passive: true });
      var end = function () {
        if (!active) return;
        active = false;
        panel.style.transition = "";
        if (dy > 90) {
          panel.style.transform = "";
          var closer = $("[data-modal-close]", panel);
          if (closer) closer.click();
        } else {
          panel.style.transform = "";
        }
        dy = 0;
      };
      on(el, "pointerup", end); on(el, "pointercancel", end);
    });
  }

  /* ---------- 7. 浮动标签 ---------- */
  function initFields() {
    $$(".ui-field").forEach(function (field) {
      var input = $("input, textarea", field);
      if (!input) return;
      var sync = function () {
        field.classList.toggle("is-filled", !!input.value || input.value === "0");
      };
      on(input, "input", sync); on(input, "change", sync);
      sync();
    });
  }

  /* ---------- 8. 骨架屏收尾 ---------- */
  function initSkeleton() {
    $$("[data-skel]").forEach(function (host) {
      var done = function () {
        $$(".ui-skel", host).forEach(function (s) { s.classList.add("is-done"); });
        host.removeAttribute("data-skel");
      };
      if (host.getAttribute("data-skel") === "ready") done();
    });
  }

  /* ---------- 9. 提示堆栈 ---------- */
  var toastHost = null;
  function ensureToastHost() {
    if (toastHost && doc.body.contains(toastHost)) return toastHost;
    toastHost = doc.createElement("div");
    toastHost.className = "ui-toasts";
    toastHost.setAttribute("role", "status");
    toastHost.setAttribute("aria-live", "polite");
    doc.body.appendChild(toastHost);
    return toastHost;
  }
  var ICONS = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
  };
  function toast(opts) {
    opts = opts || {};
    var host = ensureToastHost();
    while (host.children.length >= 3) host.removeChild(host.firstChild);
    var el = doc.createElement("div");
    el.className = "ui-toast" + (opts.type === "error" ? " ui-toast--error" : "");
    el.setAttribute("role", opts.type === "error" ? "alert" : "status");
    var kind = opts.type === "error" ? "error" : (opts.type === "info" ? "info" : "ok");
    el.innerHTML =
      '<span class="ui-toast__icon">' + ICONS[kind] + "</span>" +
      '<span><span class="ui-toast__text"></span>' +
      (opts.detail ? '<span class="ui-toast__detail"></span>' : "") + "</span>";
    $(".ui-toast__text", el).textContent = opts.text || "";
    if (opts.detail) $(".ui-toast__detail", el).textContent = opts.detail;
    host.appendChild(el);
    var life = typeof opts.duration === "number" ? opts.duration : 2600;
    var timer = setTimeout(close, life);
    function close() {
      clearTimeout(timer);
      el.classList.add("is-out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }
    on(el, "click", close);
    return { close: close, el: el };
  }

  /* ---------- 10. 统一导出 ---------- */
  var UI = {
    toast: toast,
    seg: { sync: function (seg) { syncSeg(seg); } },
    fade: initFade,
  };
  window.UI = UI;

  function init() {
    initSpotlight();
    initRipple();
    initFade();
    initCopy();
    initSeg();
    initModalOrigin();
    initDragClose();
    initFields();
    initSkeleton();
    /* 让页面其余脚本可在初始化完成后接管（如替换骨架屏、推提示） */
    doc.dispatchEvent(new CustomEvent("ui:ready"));
  }

  if (doc.readyState === "loading") on(doc, "DOMContentLoaded", init);
  else init();
})();
