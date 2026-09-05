/* ============================================================
   travel-gallery.js — 甜途 · 三维旋转画廊（Active Theory / ThreeUI 风格）
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
    { title: "甜途",      desc: "把走过的路，画成一座可旋转的城市画廊。" },
    { title: "北京",      desc: "故宫的红墙与长城的蜿蜒，在雪与银杏之间。" },
    { title: "上海",      desc: "黄浦江的镜面映着灯火，东方明珠把夜色点亮。" },
    { title: "成都",      desc: "竹影与盖碗茶，慢下来的日子才值得记住。" },
    { title: "杭州",      desc: "西湖的烟柳与断桥，把温柔藏进一湖月色。" },
    { title: "西安",      desc: "城墙下的灯火与兵马俑，历史的重量压在黄土上。" },
    { title: "重庆",      desc: "山城的灯火一层叠一层，洪崖洞把夜拉成长街。" }
  ];
  var n = cities.length;
  /* A1：900w 贴图（总体积 2.3MB → 0.5MB），3D 显示尺寸 900px 足够 */
  var images = [
    "./img/cover-900.webp", "./img/beijing-900.webp", "./img/shanghai-900.webp",
    "./img/chengdu-900.webp", "./img/hangzhou-900.webp", "./img/xian-900.webp",
    "./img/chongqing-900.webp"
  ];

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 760px)").matches;
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
    /* A2：大号城市名浮层在离开首屏后出现 */
    var cityname = document.querySelector(".stage__cityname");
    if (cityname) cityname.classList.toggle("is-on", currentP > 0.06);
  }
  function onScroll() {
    var rect = track.getBoundingClientRect();
    var total = track.offsetHeight - window.innerHeight;
    currentP = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
    updateHud();
    updateStageDim();
    if (domRender) domRender();
    if (typeof renderScene === "function") renderScene(performance.now());
  }
  function updateHud() {
    var idx = Math.round(currentP * (n - 1));
    if (hudCur) hudCur.textContent = String(idx + 1).padStart(2, "0");
    if (hudName) hudName.textContent = cities[idx].title;
    if (hudDesc) hudDesc.textContent = cities[idx].desc;
    dots.forEach(function (dot, j) { dot.classList.toggle("is-on", j === idx); });
    /* A2：大号城市名随帧切换（文本变化时滑入） */
    var cnEl = document.getElementById("cityName");
    if (cnEl) {
      if (cnEl.textContent !== cities[idx].title) {
        cnEl.textContent = cities[idx].title;
        var wrap = cnEl.parentElement;
        if (wrap) { wrap.classList.remove("swap"); void wrap.offsetWidth; wrap.classList.add("swap"); }
      }
      var ciEl = document.getElementById("cityIdx");
      if (ciEl) ciEl.textContent = String(idx + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
    }
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
  var domRender = null;

  /* ---------- 非 WebGL 降级：CSS 封面流（THREE 缺失或 WebGL 不可用时保底） ---------- */
  function initDomFallback() {
    var stage = document.getElementById("galleryStage");
    if (!stage) return;
    var wrap = document.createElement("div");
    wrap.className = "gallery-fallback";
    wrap.setAttribute("aria-hidden", "true");
    images.forEach(function (url, i) {
      var card = document.createElement("figure");
      card.className = "gallery-fallback__card" + (i === 0 ? " is-on" : "");
      var img = new Image();
      img.src = url;
      img.alt = "";
      img.loading = "lazy";
      img.decode && img.decode().catch(function(){});
      card.appendChild(img);
      var cap = document.createElement("figcaption");
      var b = document.createElement("b"); b.textContent = cities[i].title;
      var sp = document.createElement("span"); sp.textContent = cities[i].desc;
      cap.appendChild(b); cap.appendChild(sp);
      card.appendChild(cap);
      wrap.appendChild(card);
    });
    stage.appendChild(wrap);
    var cards = Array.prototype.slice.call(wrap.children);
    domRender = function () {
      var idx = Math.round(currentP * (n - 1));
      cards.forEach(function (c, j) { c.classList.toggle("is-on", j === idx); });
    };
    domRender();
  }

  /* 探测 WebGL：上下文创建失败则走 DOM 降级 */
  var webglOK = false;
  try {
    var probe = document.createElement("canvas");
    webglOK = !!(probe.getContext("webgl") || probe.getContext("experimental-webgl"));
  } catch (e) { webglOK = false; }

  if (THREE && webglOK) {
    var documentVisible = !document.hidden;
    var hostVisible = true;
    var startTime = null;

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      /* A5：移动端关 antialias + 限 pixelRatio，省一半 GPU */
      antialias: !isMobile
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.z = 21;

    var gallery = new THREE.Group();
    scene.add(gallery);

    var loader = new THREE.TextureLoader();
    var texReady = [];
    var textures = images.map(function (url, i) {
      var texture = loader.load(url, function () { texReady[i] = true; });
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

    /* A3：品牌渐变描边纹理（紫→深蓝→珊瑚 圆角框线） */
    function makeRoundBorder() {
      var c = document.createElement("canvas");
      c.width = 512; c.height = 308;
      var ctx = c.getContext("2d");
      var w = c.width, h = c.height, r = 26, lw = 5;
      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#A487BF");
      grad.addColorStop(0.52, "#4E4D93");
      grad.addColorStop(1, "#F88D82");
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(r, lw / 2);
      ctx.lineTo(w - r, lw / 2);
      ctx.quadraticCurveTo(w - lw / 2, lw / 2, w - lw / 2, r);
      ctx.lineTo(w - lw / 2, h - r);
      ctx.quadraticCurveTo(w - lw / 2, h - lw / 2, w - r, h - lw / 2);
      ctx.lineTo(r, h - lw / 2);
      ctx.quadraticCurveTo(lw / 2, h - lw / 2, lw / 2, h - r);
      ctx.lineTo(lw / 2, r);
      ctx.quadraticCurveTo(lw / 2, lw / 2, r, lw / 2);
      ctx.closePath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = lw;
      ctx.stroke();
      var t = new THREE.CanvasTexture(c);
      t.minFilter = THREE.LinearFilter;
      return t;
    }
    var roundBorder = makeRoundBorder();

    /* A4：倒影 mask（圆角 + 自上而下渐隐） */
    function makeMirrorMask() {
      var c = document.createElement("canvas");
      c.width = 512; c.height = 308;
      var ctx = c.getContext("2d");
      var w = c.width, h = c.height, r = 26;
      ctx.clearRect(0, 0, w, h);
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
      var fade = ctx.createLinearGradient(0, 0, 0, h);
      fade.addColorStop(0, "rgba(0,0,0,0.55)");
      fade.addColorStop(0.55, "rgba(0,0,0,0.12)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fade;
      ctx.fill();
      var t = new THREE.CanvasTexture(c);
      t.minFilter = THREE.LinearFilter;
      return t;
    }
    var mirrorMask = makeMirrorMask();

    var geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
    var panels = [];
    var panelAngles = [];
    var borders = [];   /* A3：正前方卡片品牌渐变描边 */
    var mirrors = [];   /* A4：卡片倒影 */
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

      /* A3：品牌渐变描边（圆角框线，随正前方淡入） */
      var bMat = new THREE.MeshBasicMaterial({
        map: roundBorder,
        alphaMap: roundBorder,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        toneMapped: false,
        depthWrite: false
      });
      var bMesh = new THREE.Mesh(geo, bMat);
      bMesh.position.copy(mesh.position);
      bMesh.rotation.y = mesh.rotation.y;
      bMesh.position.z += 0.012; /* 微抬避免 z-fighting */
      gallery.add(bMesh);
      borders.push(bMesh);

      /* A4：倒影（同纹理垂直翻转 + 渐隐 mask） */
      var mMat = new THREE.MeshBasicMaterial({
        map: textures[p],
        alphaMap: mirrorMask,
        opacity: 0,
        side: THREE.DoubleSide,
        toneMapped: false,
        transparent: true,
        depthWrite: false
      });
      var mMesh = new THREE.Mesh(geo, mMat);
      mMesh.rotation.y = mesh.rotation.y;
      gallery.add(mMesh);
      mirrors.push(mMesh);
    }

    /* 漂浮粒子（营造纵深与氛围；A5：移动端减半） */
    var pGeo = new THREE.BufferGeometry();
    var pCount = isMobile ? 120 : 240;
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

    /* A7：旋转目标角与当前角分离，插值平滑滚轮步进 */
    var currentRot = 0;

    function renderFrame(elapsed, p) {
      // 滚动驱动：正前方卡片随进度逐张切换
      var scrollRot = -p * STEP * (n - 1);
      var rock = reduceMotion ? 0 : Math.sin(elapsed * 0.25) * 0.06;
      /* A7：向目标角插值（reduced-motion 直接贴合） */
      currentRot += (scrollRot - currentRot) * (reduceMotion ? 1 : 0.09);
      gallery.rotation.y = currentRot + rock;
      var rot = currentRot + rock;

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
        var px = Math.sin(panelAngles[i]) * rr;
        var pz = Math.cos(panelAngles[i]) * rr;
        var py = reduceMotion ? 0 : Math.sin(elapsed * 0.6 + i) * 0.26;
        panels[i].position.x = px;
        panels[i].position.z = pz;
        panels[i].position.y = py;
        /* A1：贴图未就绪前整卡隐藏（防首帧空白/模糊） */
        var fade = texReady[i] ? 1 : 0;
        panels[i].material.opacity = (0.55 + 0.45 * falloff) * fade;

        /* A3：描边仅正前方淡入；跟随卡片位置 */
        borders[i].position.x = px; borders[i].position.z = pz + 0.012;
        borders[i].position.y = py;
        borders[i].scale.set(sc, sc, 1);
        borders[i].material.opacity = 0.85 * falloff * fade;

        /* A4：倒影贴在卡片正下方，翻转 + 随聚焦淡入 */
        mirrors[i].position.x = px;
        mirrors[i].position.z = pz;
        mirrors[i].position.y = py - CARD_H * sc - 0.14;
        mirrors[i].scale.set(sc, -sc, 1);
        mirrors[i].material.opacity = 0.16 * falloff * fade;
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
      /* A5：移动端 pixelRatio 上限 1.5 */
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
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
  } else {
    /* WebGL 不可用：纯 CSS 封面流保底（页面不再空白） */
    initDomFallback();
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
