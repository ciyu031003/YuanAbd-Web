/* ============================================================
   motion.js — 共享动效架构（渐进增强）
   职责：平滑滚动 / 文本遮罩揭示 / 滚动触发 / 磁吸 / 倾斜 /
         计数器 / 视差 / 滚动进度 / 自定义光标 / 导航状态
   依赖（可选）：GSAP + ScrollTrigger + Lenis（CDN），缺失时优雅降级
   ============================================================ */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  var hasGsap = typeof window.gsap !== "undefined";
  var hasST = hasGsap && typeof window.ScrollTrigger !== "undefined";

  /* ---------- 1) Lenis 平滑滚动 + GSAP 协调 ---------- */
  var lenis = null;
  function initLenis() {
    if (reduceMotion || typeof window.Lenis === "undefined") return;
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    window.lenis = lenis; // 供页面（如旅行画廊）做 Lenis 感知的平滑滚动
    if (hasGsap && hasST) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function rafLoop(t) { lenis.raf(t); requestAnimationFrame(rafLoop); })(0);
    }
  }
  function scrollToTarget(sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  /* ---------- 2) 文本拆分 ----------
     仅作用于「纯文本、无子元素」的 [data-split]，包成单个遮罩行。
     多行标题请用显式 .mask> .mask__inner 结构，保证换行不丢。 */
  function splitSingle(el) {
    if (el.children.length > 0) return;
    var text = el.textContent.trim();
    if (!text) return;
    el.textContent = "";
    var wrap = document.createElement("span");
    wrap.className = "mask";
    var inner = document.createElement("span");
    inner.className = "mask__inner";
    inner.textContent = text;
    wrap.appendChild(inner);
    el.appendChild(wrap);
  }
  function initSplit() {
    document.querySelectorAll("[data-split]").forEach(splitSingle);
  }

  /* ---------- 3) 滚动揭示 ---------- */
  function revealAll() {
    document.querySelectorAll("[data-reveal], .mask, .line").forEach(function (el) { el.classList.add("is-in"); });
  }
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    var masks = Array.prototype.slice.call(document.querySelectorAll(".mask, .line"));
    if (!("IntersectionObserver" in window)) { revealAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
    masks.forEach(function (m) { io.observe(m); });
    // 首屏标题自动登场
    setTimeout(function () {
      document.querySelectorAll(".hero .mask, .hero .line, .hero [data-reveal]").forEach(function (el) {
        el.classList.add("is-in");
      });
    }, 240);
  }

  /* ---------- 4) 计数器 ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-count-suffix") || "";
    var decimals = (String(target).split(".")[1] || "").length;
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val)) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }
  function initCounters() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (reduceMotion) { en.target.textContent = en.target.getAttribute("data-count") + (en.target.getAttribute("data-count-suffix") || ""); }
          else animateCount(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5) 磁吸 ---------- */
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.getAttribute("data-magnetic")) || 9;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * strength;
        var y = ((e.clientY - r.top) / r.height - 0.5) * strength;
        el.style.transform = "translate(" + x + "px," + y + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- 6) 倾斜 ---------- */
  function initTilt() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateX(" + (-y * 4) + "deg) rotateY(" + (x * 4) + "deg) translateY(-4px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- 7) 视差 ---------- */
  function initParallax() {
    if (!hasGsap || !hasST || reduceMotion) return;
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.2;
      window.gsap.to(el, {
        y: "-=" + (speed * 100), ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* ---------- 8) 滚动进度 + 导航状态 ---------- */
  function initScrollFx() {
    var bar = document.querySelector(".scroll-progress");
    var nav = document.querySelector(".nav");
    function onScroll() {
      var y = window.scrollY || 0;
      var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      if (bar) bar.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
      if (nav) nav.classList.toggle("is-scrolled", y > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 9) 自定义光标 ---------- */
  function initCursor() {
    var cursor = document.querySelector(".cursor");
    if (!cursor || reduceMotion || !finePointer) return;
    var dot = cursor.querySelector(".cursor__dot");
    var ring = cursor.querySelector(".cursor__ring");
    var mx = -100, my = -100, rx = -100, ry = -100, seen = false;
    function loop() {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      if (!seen) cursor.style.opacity = "0";
      cursor.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      if (dot) dot.style.transform = "translate3d(" + (mx - rx) + "px," + (my - ry) + "px,0)";
      requestAnimationFrame(loop);
    }
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!seen) { rx = mx; ry = my; seen = true; cursor.style.opacity = "1"; }
    }, { passive: true });
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest && e.target.closest("a, button, [data-magnetic], [data-tilt], .card, .work");
      if (t) cursor.classList.add("is-active"); else cursor.classList.remove("is-active");
    });
    requestAnimationFrame(loop);
  }

  /* ---------- 10) 锚点 + 事件 ---------- */
  function initNav() {
    document.querySelectorAll("a[href^='#']").forEach(function (a) {
      var sel = a.getAttribute("href");
      if (sel.length > 1) {
        a.addEventListener("click", function (e) {
          var t = document.querySelector(sel);
          if (t) { e.preventDefault(); scrollToTarget(sel); }
        });
      }
    });
  }
  function setYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  function init() {
    initLenis();
    initSplit();
    initReveal();
    initCounters();
    initMagnetic();
    initTilt();
    initParallax();
    initScrollFx();
    initCursor();
    initNav();
    setYear();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
