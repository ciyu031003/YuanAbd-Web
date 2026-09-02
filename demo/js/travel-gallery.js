/* ============================================================
   travel-gallery.js — 行迹 · 三维旋转画廊（Active Theory / ThreeUI 风格）
   参考：
   - ThreeUI <Gallery />：编辑感卡片 + 环绕轨道
   - 用户附图：卡片环绕成一圈，滚动/旋转时当前城市卡片「放大到眼前」，
     其余卡片退回两侧 / 后方（coverflow）
   实现：
   - 7 张城市图片排成一圈，面向外侧（圆角卡片）
   - 滚动驱动整环旋转；处于正前方的卡片被放大并推向镜头，其余缩小退后
   - 高斯衰减：仅正前方卡片弹出，邻卡明显缩小，突出层次
   - 轻微呼吸缩放 + 慢速摇摆 + 漂浮粒子，营造活感
   依赖：three@0.149（window.THREE，可选）、Lenis（可选，优雅降级）
   分离：页面流（滚动/HUD/弹出）不依赖 Three.js；缺少 THREE 时仅跳过 3D 渲染。
   ============================================================ */
(function () {
  "use strict";

  var track = document.getElementById("galleryTrack");
  var canvas = document.getElementById("galleryCanvas");
  if (!track || !canvas) return;

  var hudCur = document.getElementById("hudCur");
  var hudName = document.getElementById("hudName");
  var hudDesc = document.getElementById("hudDesc");
  var hudDots = document.getElementById("hudDots");
  var totalEl = document.querySelector(".hud__total");

  var cities = [
    { title: "行迹",      desc: "把走过的路，画成一座可旋转的城市画廊。" },
    { title: "北京",      desc: "故宫的红墙与长城的蜿蜒，在雪与银杏之间。" },
    { title: "上海",      desc: "黄浦江的镜面映着灯火，东方明珠把夜色点亮。" },
    { title: "成都",      desc: "竹影与盖碗茶，慢下来的日子才值得记住。" },
    { title: "杭州",      desc: "西湖的烟柳与断桥，把温柔藏进一湖月色。" },
    { title: "西安",      desc: "城墙下的灯火与兵马俑，历史的重量压在黄土上。" },
    { title: "重庆",      desc: "山城的灯火一层叠一层，洪崖洞把夜拉成长街。" }
  ];
  var n = cities.length;
  var images = [
    "./img/cover.webp", "./img/beijing.webp", "./img/shanghai.webp",
    "./img/chengdu.webp", "./img/hangzhou.webp", "./img/xian.webp",
    "./img/chongqing.webp"
  ];

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- 相册滚动长度 = 帧数 * 视口高 ---------- */
  track.style.height = (n * 100) + "vh";
  if (totalEl) totalEl.textContent = String(n).padStart(2, "0");

  /* ---------- HUD 圆点 ---------- */
  var dots = [];
  if (hudDots) {
    for (var i = 0; i < n; i++) {
      var d = document.createElement("span");
      d.className = "hud__dot" + (i === 0 ? " is-on" : "");
      hudDots.appendChild(d);
      dots.push(d);
    }
  }

  /* ---------- 滚动驱动 HUD ---------- */
  var currentP = 0;
  var galleryTitle = document.querySelector(".gallery-title");
  var stageHint = document.querySelector(".stage__hint");
  function updateStageDim() {
    /* 进入画廊后，主标题让位给城市画面；开始滚动即收起滚动提示 */
    if (galleryTitle) galleryTitle.classList.toggle("is-dim", currentP > 0.045);
    if (stageHint) stageHint.classList.toggle("is-dim", currentP > 0.02);
  }
  function onScroll() {
    var rect = track.getBoundingClientRect();
    var total = track.offsetHeight - window.innerHeight;
    currentP = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
    updateHud();
    updateStageDim();
    if (typeof renderScene === "function") renderScene(performance.now());
  }
  function updateHud() {
    var idx = Math.round(currentP * (n - 1));
    if (hudCur) hudCur.textContent = String(idx + 1).padStart(2, "0");
    if (hudName) hudName.textContent = cities[idx].title;
    if (hudDesc) hudDesc.textContent = cities[idx].desc;
    dots.forEach(function (dot, j) { dot.classList.toggle("is-on", j === idx); });
  }
  onScroll();

  var ticking = false;
  function schedule() {
    if (ticking) return;
    ticking = true;
    var run = function () { ticking = false; onScroll(); };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
    else setTimeout(run, 16);
  }
  if (typeof window.lenis !== "undefined" && window.lenis) window.lenis.on("scroll", schedule);
  window.addEventListener("scroll", schedule, { passive: true });

  /* ============================================================
     Three.js Gallery（仅在 window.THREE 可用时启用）
     ============================================================ */
  var THREE = window.THREE;
  var renderScene = null;
  var disposed = false;

  if (THREE) {
    var documentVisible = !document.hidden;
    var hostVisible = true;
    var startTime = null;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.z = 21;

    var gallery = new THREE.Group();
    scene.add(gallery);

    var loader = new THREE.TextureLoader();
    var textures = images.map(function (url) {
      var texture = loader.load(url);
      texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return texture;
    });

    /* 参数：环半径 / 卡片尺寸 / 缩放脉冲 / 前推量 */
    var N = n;
    var STEP = (Math.PI * 2) / N;
    var TAU = Math.PI * 2;
    var CARD_W = 5.2;
    var CARD_H = 3.2;
    var RING_R = 9;          // 环绕半径
    var MIN_SCALE = 0.46;    // 后方卡片缩放
    var MAX_SCALE = 1.34;    // 正前方卡片缩放（放大到眼前）
    var PUSH = 2.7;          // 正前方卡片向镜头推进量
    var FALLOFF = 0.42;      // 高斯衰减宽度（越小越聚焦正前方）

    /* 圆角卡片遮罩（白色=不透明，黑色=透明），贴合 PlaneGeometry UV */
    function makeRoundMask() {
      var c = document.createElement("canvas");
      c.width = 512; c.height = 308;
      var ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      var w = c.width, h = c.height, r = 26;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fillStyle = "#fff";
      ctx.fill();
      var t = new THREE.CanvasTexture(c);
      t.minFilter = THREE.LinearFilter;
      return t;
    }
    var roundMask = makeRoundMask();

    var geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
    var panels = [];
    var panelAngles = [];
    for (var p = 0; p < N; p++) {
      var mat = new THREE.MeshBasicMaterial({
        map: textures[p],
        alphaMap: roundMask,
        opacity: 0.55,
        side: THREE.DoubleSide,
        toneMapped: false,
        transparent: true
      });
      var mesh = new THREE.Mesh(geo, mat);
      var ang = p * STEP;
      panelAngles.push(ang);
      mesh.position.set(Math.sin(ang) * RING_R, 0, Math.cos(ang) * RING_R);
      mesh.rotation.y = ang; // 面朝外（正前方朝向相机）
      gallery.add(mesh);
      panels.push(mesh);
    }

    /* 漂浮粒子（营造纵深与氛围） */
    var pGeo = new THREE.BufferGeometry();
    var pCount = 240;
    var pPos = new Float32Array(pCount * 3);
    for (var q = 0; q < pCount; q++) {
      pPos[q * 3]     = (Math.random() - 0.5) * 30;
      pPos[q * 3 + 1] = (Math.random() - 0.5) * 12;
      pPos[q * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    var pMat = new THREE.PointsMaterial({
      color: 0xbfa6ff, size: 0.09, transparent: true, opacity: 0.5, depthWrite: false
    });
    var particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    function renderFrame(elapsed, p) {
      // 滚动驱动：正前方卡片随进度逐张切换
      var scrollRot = -p * STEP * (n - 1);
      var rock = reduceMotion ? 0 : Math.sin(elapsed * 0.25) * 0.06;
      var rot = scrollRot + rock;
      gallery.rotation.y = rot;

      // 整体呼吸（缓慢变大变小）
      var breathe = reduceMotion ? 0 : Math.sin(elapsed * 0.55) * 0.012;
      gallery.scale.setScalar(1 + breathe); gallery.position.set(0.9, -0.45, 0);

      for (var i = 0; i < N; i++) {
        var world = panelAngles[i] + rot;
        var w = (world % TAU + TAU * 1.5) % TAU - Math.PI;   // 归一化到 [-PI, PI]
        var falloff = Math.exp(-(w * w) / FALLOFF);          // 1=正前方, 0=正后方
        var sc = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * falloff;
        panels[i].scale.set(sc, sc, 1);

        // 正前方卡片沿径向推向镜头，其余保持/退后
        var rr = RING_R + PUSH * falloff;
        panels[i].position.x = Math.sin(panelAngles[i]) * rr;
        panels[i].position.z = Math.cos(panelAngles[i]) * rr;
        panels[i].position.y = reduceMotion ? 0 : Math.sin(elapsed * 0.6 + i) * 0.26;
        panels[i].material.opacity = 0.55 + 0.45 * falloff;
      }

      particles.rotation.y = elapsed * 0.03;
      particles.rotation.x = Math.sin(elapsed * 0.2) * 0.05;
      renderer.render(scene, camera);
    }

    renderScene = function (now) {
      if (disposed) return;
      if (startTime === null) startTime = now;
      renderFrame((now - startTime) / 1000, currentP);
    };

    function tick(now) {
      if (disposed) return;
      renderScene(now);
      if (!documentVisible || !hostVisible) return;
      window.requestAnimationFrame(tick);
    }

    function start() {
      if (reduceMotion) { renderScene(performance.now()); return; }
      if (documentVisible && hostVisible) window.requestAnimationFrame(tick);
    }

    function host() { return document.getElementById("galleryStage"); }
    function resize() {
      var b = (host() || track).getBoundingClientRect();
      var width = Math.max(1, Math.round(b.width));
      var height = Math.max(1, Math.round(b.height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderScene(performance.now());
    }

    window.addEventListener("resize", resize);
    resize();
    start();

    document.addEventListener("visibilitychange", function () {
      documentVisible = !document.hidden;
      if (documentVisible) start();
    }, { passive: true });

    if ("IntersectionObserver" in window) {
      var visIO = new IntersectionObserver(function (entries) {
        var on = entries[0] && entries[0].isIntersecting;
        hostVisible = !!on;
        if (hostVisible && documentVisible) start();
      }, { threshold: 0 });
      visIO.observe(host() || track);
    }
  }

  /* ---------- 关于 / 下载：XMind 弹出卡片揭示 ---------- */
  var outroCards = Array.prototype.slice.call(document.querySelectorAll(".outro-card"));
  outroCards.forEach(function (c, idx) {
    c.style.setProperty("--pop-delay", (idx * 0.14).toFixed(2) + "s");
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    outroCards.forEach(function (c) { io.observe(c); });
  } else {
    outroCards.forEach(function (c) { c.classList.add("is-in"); });
  }


  /* ---------- 登录 mock：2-3s 循环动效（模拟视频） ---------- */
  var loginStatuses = Array.prototype.slice.call(document.querySelectorAll("[data-login-status]"));
  var loginMsgs = ["正在验证…", "登录成功 ✓", "欢迎回来 ✦"];
  var li = 0;
  if (loginStatuses.length) {
    setInterval(function () {
      li = (li + 1) % loginMsgs.length;
      loginStatuses.forEach(function (el) { el.textContent = loginMsgs[li]; });
    }, 1300);
  }

  /* ---------- 导航跳到关于 / 下载 ---------- */
  function scrollToOutro(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (typeof window.lenis !== "undefined" && window.lenis) window.lenis.scrollTo(el, { duration: 1.4 });
    else el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  document.querySelectorAll("[data-nav]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var k = a.getAttribute("data-nav");
      if (k === "about") scrollToOutro("outroAbout");
      else if (k === "download") scrollToOutro("outroDownload");
    });
  });
})();
