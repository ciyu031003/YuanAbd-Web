/* ============================================================
   YUAN · ABD — 门户 Demo（第一版）动效引擎
   平滑滚动 / 油画场景背景 / 跟手笔刷 / 自定义光标 / 滚动揭示
   渐进增强：无 Lenis/GSAP 也保证内容可读
   ============================================================ */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  var SCENE_PALETTES = {
    portal: { bg: "#150f0a", accents: ["#d3a94f", "#2f6f74", "#8c6a3a", "#3c3a4a"] }
  };
  var sceneWraps = Array.prototype.slice.call(document.querySelectorAll(".scene-wrap"));

  /* 1) Lenis 平滑滚动 */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var rafLoop = function (t) { lenis.raf(t); requestAnimationFrame(rafLoop); };
      requestAnimationFrame(rafLoop);
    }
  }
  function scrollToTarget(sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  /* 2) 油画场景背景 */
  var paint = document.getElementById("paint");
  var pctx = paint.getContext("2d");
  var texture = document.createElement("canvas");
  var tctx = texture.getContext("2d");
  var PW = 0, PH = 0, TW = 0, TH = 0;
  var activeScene = "portal";
  var fadeT = 0, lastScene = "portal";
  var time = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  function shiftHex(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = clamp255(r + amt); g = clamp255(g + amt); b = clamp255(b + amt);
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  function buildTexture() {
    var pal = SCENE_PALETTES[activeScene] || SCENE_PALETTES.portal;
    TW = Math.ceil(PW * 1.24); TH = Math.ceil(PH * 1.24);
    texture.width = TW; texture.height = TH;
    tctx.clearRect(0, 0, TW, TH);
    tctx.fillStyle = pal.bg; tctx.fillRect(0, 0, TW, TH);
    var blobCount = Math.max(6, Math.round(TW / 150));
    for (var i = 0; i < blobCount; i++) {
      var cx = rand(0, TW), cy = rand(0, TH), r = rand(TW * 0.16, TW * 0.42);
      var c = pal.accents[i % pal.accents.length];
      var g = tctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, hexA(c, 0.42)); g.addColorStop(0.5, hexA(c, 0.20)); g.addColorStop(1, hexA(c, 0));
      tctx.fillStyle = g; tctx.beginPath(); tctx.arc(cx, cy, r, 0, Math.PI * 2); tctx.fill();
    }
    var dabCount = Math.round((TW * TH) / 2600);
    for (var d = 0; d < dabCount; d++) {
      var pal2 = SCENE_PALETTES[activeScene] || SCENE_PALETTES.portal;
      var bx = rand(0, TW), by = rand(0, TH), br = rand(6, 26);
      var base = pal2.accents[Math.floor(Math.random() * pal2.accents.length)];
      var col = shiftHex(base, rand(-18, 22)), ang = rand(0, Math.PI);
      tctx.save(); tctx.globalAlpha = rand(0.10, 0.30); tctx.fillStyle = col;
      tctx.translate(bx, by); tctx.rotate(ang);
      tctx.beginPath(); tctx.ellipse(0, 0, br, br * rand(0.32, 0.6), 0, 0, Math.PI * 2); tctx.fill(); tctx.restore();
    }
    tctx.globalAlpha = 1;
  }

  function resizePaint() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    PW = Math.round(window.innerWidth * dpr); PH = Math.round(window.innerHeight * dpr);
    paint.width = PW; paint.height = PH; buildTexture();
  }

  function drawGlow(x, y, r, col, alpha) {
    var g = pctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(col, alpha)); g.addColorStop(1, hexA(col, 0));
    pctx.fillStyle = g; pctx.beginPath(); pctx.arc(x, y, r, 0, Math.PI * 2); pctx.fill();
  }

  var scrollForParallax = 0;
  function paintFrame() {
    pctx.clearRect(0, 0, PW, PH);
    var pal = SCENE_PALETTES[activeScene] || SCENE_PALETTES.portal;
    pctx.fillStyle = pal.bg; pctx.fillRect(0, 0, PW, PH);
    var maxX = Math.max(0, TW - PW), maxY = Math.max(0, TH - PH);
    var s = scrollForParallax;
    var ox = -Math.abs(Math.sin(time * 0.00022)) * maxX * 0.5 - Math.sin(s * 0.004) * maxX * 0.2;
    var oy = -Math.abs(Math.cos(time * 0.00026)) * maxY * 0.5 - Math.sin(s * 0.0035) * maxY * 0.24;
    ox = Math.max(-maxX, Math.min(0, ox)); oy = Math.max(-maxY, Math.min(0, oy));
    pctx.drawImage(texture, ox, oy, TW, TH);
    var drift = time * 0.00035; var a = pal.accents;
    drawGlow(PW * (0.22 + 0.06 * Math.sin(drift)), PH * (0.3 + 0.05 * Math.cos(drift * 1.1)), PW * 0.38, a[0], 0.10);
    drawGlow(PW * (0.78 + 0.06 * Math.cos(drift * 0.9)), PH * (0.66 + 0.05 * Math.sin(drift * 1.3)), PW * 0.42, a[1], 0.09);
    drawGlow(PW * (0.5 + 0.1 * Math.sin(drift * 0.7)), PH * 0.36, PW * 0.3, a[2] || a[0], 0.06);
    if (fadeT > 0.001) { pctx.fillStyle = hexA(SCENE_PALETTES[activeScene].bg, fadeT); pctx.fillRect(0, 0, PW, PH); fadeT *= 0.92; }
    else fadeT = 0;
  }
  var _hiddenGated = false;
  function _gatedPause() {
    if (_hiddenGated) return;
    _hiddenGated = true;
  }
  function _gatedResume() {
    if (!_hiddenGated) return;
    _hiddenGated = false;
  }
  function paintLoop(t) {
    time = t || (performance.now ? performance.now() : Date.now());
    if (!_hiddenGated) { paintFrame(); requestAnimationFrame(paintLoop); }
  }

  function getActiveScene() {
    var center = window.innerHeight * 0.5;
    for (var i = 0; i < sceneWraps.length; i++) {
      var r = sceneWraps[i].getBoundingClientRect();
      if (r.top <= center && r.bottom >= center) return sceneWraps[i].getAttribute("data-scene");
    }
    return activeScene;
  }

  /* 3) 跟手油画笔刷轨迹 */
  var trail = document.getElementById("trail");
  var tctx2 = trail.getContext("2d");
  var TWID = 0, THT = 0;
  var dabs = [], lastPt = null;
  function resizeTrail() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    TWID = Math.round(window.innerWidth * dpr); THT = Math.round(window.innerHeight * dpr);
    trail.width = TWID; trail.height = THT;
  }
  function pushDab(x, y, col, r) {
    dabs.push({ x: x, y: y, r: r || rand(2.5, 6), ang: rand(0, Math.PI), col: col, life: 1 });
    if (dabs.length > 320) dabs.shift();
  }
  function onPointerMove(e) {
    var x = e.clientX, y = e.clientY;
    if (!lastPt) { lastPt = { x: x, y: y }; return; }
    var dx = x - lastPt.x, dy = y - lastPt.y, dist = Math.sqrt(dx * dx + dy * dy);
    var pal = SCENE_PALETTES[activeScene] || SCENE_PALETTES.portal;
    var col = pal.accents[Math.floor(Math.random() * pal.accents.length)];
    var steps = Math.min(10, Math.floor(dist / 5));
    for (var i = 1; i <= steps; i++) pushDab(lastPt.x + (dx * i) / (steps || 1), lastPt.y + (dy * i) / (steps || 1), col);
    lastPt = { x: x, y: y };
  }
  function trailFrame() {
    tctx2.clearRect(0, 0, TWID, THT);
    if (dabs.length === 0) return;
    var pal = SCENE_PALETTES[activeScene] || SCENE_PALETTES.portal;
    for (var i = 0; i < dabs.length; i++) {
      var d = dabs[i];
      if (d.life <= 0.02) { dabs.splice(i, 1); i--; continue; }
      d.life *= 0.95; d.r += 0.07;
      tctx2.save(); tctx2.globalAlpha = d.life * 0.34;
      tctx2.fillStyle = pal.accents[0]; tctx2.translate(d.x, d.y); tctx2.rotate(d.ang);
      tctx2.beginPath(); tctx2.ellipse(0, 0, d.r, d.r * 0.5, 0, 0, Math.PI * 2); tctx2.fill(); tctx2.restore();
    }
  }
  function trailLoop() {
    if (_hiddenGated) return;
    trailFrame(); requestAnimationFrame(trailLoop);
  }

  /* 4) 自定义光标 */
  var cursor = document.getElementById("cursor");
  var cDot = cursor.querySelector(".cursor__dot");
  var cRing = cursor.querySelector(".cursor__ring");
  var cLabel = cursor.querySelector(".cursor__label");
  var mx = -100, my = -100, rx = -100, ry = -100, seen = false;
  function cursorLoop() {
    if (_hiddenGated) return;
    rx += (mx - rx) * 0.22; ry += (my - ry) * 0.22;
    if (!seen) cursor.style.opacity = "0";
    var s = window.getComputedStyle(cursor);
    if (s.display !== "none") {
      cursor.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      cDot.style.transform = "translate3d(" + (mx - rx) + "px," + (my - ry) + "px,0)";
    }
    requestAnimationFrame(cursorLoop);
  }
  function onPointerMoveCursor(e) {
    mx = e.clientX; my = e.clientY;
    if (!seen) { rx = mx; ry = my; seen = true; cursor.style.opacity = "1"; }
  }
  function showLabel(text) { cLabel.textContent = text || ""; cursor.classList.add("is-active"); }

  function bindMagnetic() {
    Array.prototype.forEach.call(document.querySelectorAll(".btn, .work-card"), function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = "translate(" + ((e.clientX - r.left) / r.width - 0.5) * 9 + "px," + ((e.clientY - r.top) / r.height - 0.5) * 7 + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* 5) 滚动揭示 */
  function revealAll() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal], .line"), function (el) {
      el.classList.add("is-in");
      var inner = el.querySelector ? el.querySelector(".line__inner") : null;
      if (inner) inner.style.transitionDelay = "0.1s";
    });
  }
  var io = null;
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-reveal], .line"));
    if (!("IntersectionObserver" in window)) { revealAll(); return; }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    var lines = document.querySelectorAll(".line");
    Array.prototype.forEach.call(lines, function (l, i) {
      var inner = l.querySelector(".line__inner");
      if (inner) inner.style.transitionDelay = (0.15 + i * 0.12) + "s";
    });
    var heroLines = document.querySelectorAll(".portal-hero__title .line");
    setTimeout(function () { Array.prototype.forEach.call(heroLines, function (l) { l.classList.add("is-in"); }); }, 260);
    els.forEach(function (el) { io.observe(el); });
  }

  /* 6) GSAP 滚动驱动 */
  function initGsap() {
    if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    var hero = document.querySelector(".portal-hero");
    var index = document.querySelector(".portal-index");
    if (hero) {
      window.gsap.to(hero, { y: -70, opacity: 0.25, ease: "none",
        scrollTrigger: { trigger: "#portal", start: "top top", end: "bottom 40%", scrub: 0.8 } });
    }
    if (index) {
      window.gsap.fromTo(index, { y: 70, opacity: 0 },
        { y: 0, opacity: 1, ease: "none",
          scrollTrigger: { trigger: index, start: "top 85%", end: "top 40%", scrub: 0.7 } });
    }
  }

  /* 7) 事件绑定 */
  function bindNav() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-target]"), function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); scrollToTarget(a.getAttribute("data-target")); });
    });
  }
  function navActive(scene) {
    Array.prototype.forEach.call(document.querySelectorAll(".nav__dot"), function (d) {
      d.classList.toggle("is-active", d.getAttribute("data-target") === "#" + scene);
    });
  }
  function onScroll() {
    scrollForParallax = window.scrollY || 0;
    var sc = getActiveScene();
    navActive(sc);
  }
  function init() {
    resizePaint(); resizeTrail(); initReveal(); initGsap(); bindNav(); bindMagnetic();
    window.addEventListener("resize", function () { resizePaint(); resizeTrail(); });
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!reduceMotion) {
      requestAnimationFrame(paintLoop);
      if (!coarse) {
        requestAnimationFrame(cursorLoop); requestAnimationFrame(trailLoop);
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointermove", onPointerMoveCursor, { passive: true });
        document.addEventListener("pointerover", function (e) {
          var t = e.target.closest && e.target.closest(".btn, .work-card, a, button");
          if (t) showLabel(t.classList.contains("work-card") ? "打开作品" : "");
          else { cursor.classList.remove("is-active"); cLabel.textContent = ""; }
        });
      }
    }
    onScroll();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        _gatedPause();
      } else {
        _gatedResume();
        requestAnimationFrame(paintLoop);
        if (!coarse) { requestAnimationFrame(cursorLoop); requestAnimationFrame(trailLoop); }
      }
    }, { passive: true });
    var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
