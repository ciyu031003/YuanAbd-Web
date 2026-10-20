/* js/hardware-3d.js — 笔记本 3D 拆解图（程序化低模，无外部模型文件）
   ============================================================================
   为什么是「程序化低模」而不是买 glTF 模型：
     · 公司自有机型（AH/AP/AS 等）市面上没有现成模型，买不到；
     · 定制写实模型单价 2k–15k，且写实风格与本站「黑描边 + 平涂」的插画语言冲突；
     · 用基础几何体拼装，零件位置/配色/联动关系全部可控，改一个数字就能调整。
   代价是细节不如写真模型——所以每个零件都配了「一句话作用 + 常见故障 + 教程链接」，
   让它在演示之外，真的能当工程师查零件位置用。

   依赖：只 import vendor/three/three.custom.min.js（tree-shaken，118.6 KB gzip）。
   加载：懒加载——首屏先显示静态海报图，滚到可视区才加载引擎；WebGL 不可用时保持海报。
   ============================================================================ */
(function () {
  "use strict";

  var THEME = { paper: "#FBF6EC", ink: "#1A1F2B", mint: "#7FE3C0", coral: "#FF8A6B",
                lav: "#A995FF", sun: "#FFD84D", sky: "#79CFFF", blush: "#FFC7D9" };

  /* ---------- 机型尺寸（单位 ≈ 1cm，按 14 寸笔记本等比） ---------- */
  var M = { W: 32, D: 22, H: 1.7, lidT: 0.65, lidD: 21, openDeg: -100 };

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var THREE = null;
  var state = { ready: false, loading: false, exploded: false, explodeT: 0,
                selected: null, autoRotate: true, dragging: false };

  var el = {};
  var scene, camera, renderer, raycaster, pointer;
  var parts = {};
  var pickables = [];
  /* 为了让整机完整入画：竖直方向约需 48 单位，fov 36° → 距离 ≈ 48 / (2·tan18°) ≈ 74 */
  var orbit = { theta: 0.66, phi: 1.02, radius: 74, target: { x: 0, y: 8.5, z: 0 } };
  var clockLast = 0;

  /* ============================================================
     一、纹理：键盘 / 屏幕 / 阴影都用 Canvas 现画，不额外占图片请求
     ============================================================ */
  function makeCanvas(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function canvasTexture(canvas) {
    var t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  /* 键盘面：深色键帽 + 银色底板，远看有结构、近看不糊 */
  function keyboardTexture() {
    var c = makeCanvas(1024, 440), g = c.getContext("2d");
    g.fillStyle = "#E9E4D9"; g.fillRect(0, 0, 1024, 440);
    var cols = 14, rows = 5, pad = 11;
    var cw = (1024 - pad * (cols + 1)) / cols;
    var ch = (440 - pad * (rows + 1)) / rows;
    for (var r = 0; r < rows; r++) {
      for (var i = 0; i < cols; i++) {
        var x = pad + i * (cw + pad), y = pad + r * (ch + pad), w = cw, h = ch;
        if (r === rows - 1 && i >= 3 && i <= 7) {           // 空格键
          if (i > 3) continue;
          w = cw * 5 + pad * 4;
        }
        g.fillStyle = "#2C3340"; roundRect(g, x, y, w, h, 7); g.fill();
        g.fillStyle = "rgba(255,255,255,.11)"; roundRect(g, x, y, w, h * 0.44, 7); g.fill();
      }
    }
    return canvasTexture(c);
  }

  /* 屏幕内容：品牌 + 假搜索框，演示时一眼看出这是「修盒子」 */
  function screenTexture() {
    var c = makeCanvas(1024, 640), g = c.getContext("2d");
    var grd = g.createLinearGradient(0, 0, 1024, 640);
    grd.addColorStop(0, "#FBF6EC"); grd.addColorStop(1, "#FFF6E2");
    g.fillStyle = grd; g.fillRect(0, 0, 1024, 640);

    g.fillStyle = THEME.mint; roundRect(g, 64, 52, 78, 78, 22); g.fill();
    g.fillStyle = THEME.ink;
    g.font = "bold 46px 'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("修", 103, 93);

    g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.font = "bold 40px 'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif";
    g.fillText("修盒子", 162, 92);
    g.fillStyle = "#7C63E8";
    g.font = "bold 18px ui-monospace,Menlo,monospace";
    g.fillText("FIXBOX", 162, 120);

    g.fillStyle = THEME.ink;
    g.font = "bold 50px 'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif";
    g.fillText("电脑 / 网络出问题了？", 64, 246);
    g.fillText("搜一下现象，跟着步骤修。", 64, 312);

    g.fillStyle = "#FFFFFF"; roundRect(g, 64, 364, 726, 90, 26); g.fill();
    g.strokeStyle = THEME.ink; g.lineWidth = 3; roundRect(g, 64, 364, 726, 90, 26); g.stroke();
    g.fillStyle = "#8A939E"; g.font = "26px 'Noto Sans SC','PingFang SC',sans-serif";
    g.fillText("描述你的故障，例如「连不上网」「开机黑屏」", 106, 421);

    var tags = ["连不上网", "开机蓝屏", "打印机脱机", "C 盘满"];
    var tx = 64;
    g.font = "24px 'Noto Sans SC','PingFang SC',sans-serif";
    tags.forEach(function (t, i) {
      var w = g.measureText(t).width + 48;
      g.fillStyle = ["#DFF6EC", "#EDE9FF", "#E1F2FF", "#FFF0CE"][i];
      roundRect(g, tx, 492, w, 54, 16); g.fill();
      g.fillStyle = THEME.ink; g.fillText(t, tx + 24, 529);
      tx += w + 18;
    });
    return canvasTexture(c);
  }

  function shadowTexture() {
    var c = makeCanvas(256, 256), g = c.getContext("2d");
    var grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    grd.addColorStop(0, "rgba(26,31,43,.34)");
    grd.addColorStop(0.55, "rgba(26,31,43,.15)");
    grd.addColorStop(1, "rgba(26,31,43,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return canvasTexture(c);
  }

  /* ============================================================
     二、建模工具
        · 每个 mesh 保留自己的材质（屏幕、键盘要有纹理，不能统一刷成零件色）
        · 每个 mesh 自动挂一条黑色描边 = 站点的「技术图纸」语言
        · 零件 = 一个 Group；高亮时对该组所有材质做 emissive + 描边加粗
     ============================================================ */
  function flatMat(hex) { return new THREE.MeshLambertMaterial({ color: new THREE.Color(hex) }); }

  function addMesh(parent, geo, mat, pos, opts) {
    opts = opts || {};
    var mesh = new THREE.Mesh(geo, mat);
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (opts.rot) mesh.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
    if (opts.scale) mesh.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
    parent.add(mesh);

    if (opts.edges !== false) {
      var line = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, 24),
        new THREE.LineBasicMaterial({ color: new THREE.Color(THEME.ink), transparent: true, opacity: 0.62 })
      );
      mesh.add(line);
      mesh.userData.edgeLine = line;
    }
    if (opts.partId) {
      mesh.userData.partId = opts.partId;
      pickables.push(mesh);
    }
    return mesh;
  }

  function registerPart(id, group) {
    var cfg = (window.FX_PARTS || []).filter(function (p) { return p.id === id; })[0] || {};
    var off = cfg.explode || [0, 4, 0];
    var meshes = [], mats = [], edges = [];
    group.traverse(function (o) {
      if (o.isMesh && o.userData.partId === id) {
        meshes.push(o);
        if (o.material) mats.push(o.material);
        if (o.userData.edgeLine) edges.push(o.userData.edgeLine);
      }
    });
    parts[id] = {
      id: id, group: group, meshes: meshes, mats: mats, edges: edges,
      base: group.position.clone(),
      offset: new THREE.Vector3(off[0], off[1], off[2])
    };
    return parts[id];
  }

  /* ============================================================
     三、搭模型
       坐标：x 左右（±16），z 前后（-11 后 / +11 前），y 向上
       设计上刻意不追求「像真机」，而是像一张能转的技术图纸。
     ============================================================ */
  function buildModel() {
    var root = new THREE.Group();

    /* ---- 底壳（固定不分解，作为整机的空间基准） ---- */
    var shell = flatMat("#CFC8B8");
    addMesh(root, new THREE.BoxGeometry(M.W, M.H, M.D), shell, [0, M.H / 2, 0]);
    // 底壳四角脚垫，增加「实物感」
    [[-13, 9], [13, 9], [-13, -9], [13, -9]].forEach(function (p) {
      addMesh(root, new THREE.CylinderGeometry(0.65, 0.65, 0.22, 14), flatMat("#B9B2A4"),
        [p[0], 0.1, p[1]], { edges: false });
    });

    /* ---- 键盘面 C 面 ---- */
    var deckG = new THREE.Group();
    addMesh(deckG, new THREE.BoxGeometry(M.W - 0.5, 0.28, M.D - 0.5), flatMat("#EFEAE0"),
      [0, M.H + 0.14, 0], { partId: "keyboard" });
    addMesh(deckG, new THREE.PlaneGeometry(27.6, 11.2), new THREE.MeshBasicMaterial({ map: keyboardTexture() }),
      [0, M.H + 0.29, -2.7], { rot: [-Math.PI / 2, 0, 0], partId: "keyboard", edges: false });
    addMesh(deckG, new THREE.PlaneGeometry(11.4, 7.0), flatMat("#DCD5C7"),
      [0, M.H + 0.29, 6.7], { rot: [-Math.PI / 2, 0, 0], partId: "keyboard" });
    root.add(deckG);
    registerPart("keyboard", deckG);

    /* ---- 电池 ---- */
    var batG = new THREE.Group();
    addMesh(batG, new THREE.BoxGeometry(19.6, 0.74, 8.8), flatMat("#7FE3C0"), [0, 0.8, 3.4], { partId: "battery" });
    addMesh(batG, new THREE.BoxGeometry(6.0, 0.34, 7.4), flatMat("#B9EEDC"), [-5.6, 1.34, 3.4], { partId: "battery" });
    addMesh(batG, new THREE.BoxGeometry(6.0, 0.34, 7.4), flatMat("#B9EEDC"), [5.6, 1.34, 3.4], { partId: "battery" });
    root.add(batG);
    registerPart("battery", batG);

    /* ---- 主板 ---- */
    var mbG = new THREE.Group();
    addMesh(mbG, new THREE.BoxGeometry(20.6, 0.24, 7.8), flatMat("#0F766E"), [0, 0.62, -6.4], { partId: "mainboard" });
    // 主板上的小元件（供电、接口芯片），让「主板」看起来有信息量
    [[-8.4, -7.6], [-5.6, -4.2], [2.2, -4.0], [9.0, -7.8], [9.6, -4.4]].forEach(function (p, i) {
      addMesh(mbG, new THREE.BoxGeometry(1.1 + (i % 2) * 0.7, 0.34, 1.0), flatMat("#0B5F58"),
        [p[0], 0.9, p[1]], { partId: "mainboard", edges: false });
    });
    root.add(mbG);
    registerPart("mainboard", mbG);

    /* ---- CPU + 散热 ---- */
    var cpuG = new THREE.Group();
    addMesh(cpuG, new THREE.BoxGeometry(3.4, 0.26, 3.4), flatMat("#FF8A6B"), [5.6, 0.86, -7.4], { partId: "cpu" });
    addMesh(cpuG, new THREE.BoxGeometry(4.8, 0.48, 4.8), flatMat("#D6D0C2"), [5.6, 1.24, -7.4], { partId: "cpu" });
    addMesh(cpuG, new THREE.BoxGeometry(7.6, 0.26, 0.92), flatMat("#C98B5E"), [1.4, 1.32, -7.4], { partId: "cpu", edges: false });
    addMesh(cpuG, new THREE.BoxGeometry(7.6, 0.26, 0.92), flatMat("#C98B5E"), [1.4, 1.32, -5.4], { partId: "cpu", edges: false });
    root.add(cpuG);
    registerPart("cpu", cpuG);

    /* ---- 风扇 ---- */
    var fanG = new THREE.Group();
    addMesh(fanG, new THREE.CylinderGeometry(2.95, 2.95, 0.44, 30), flatMat("#E4DED0"), [-6.4, 0.94, -7.4], { partId: "fan" });
    addMesh(fanG, new THREE.CylinderGeometry(2.6, 2.6, 0.16, 26), flatMat("#A995FF"), [-6.4, 1.17, -7.4], { partId: "fan", edges: false });
    for (var b = 0; b < 7; b++) {
      var ang = (b / 7) * Math.PI * 2;
      addMesh(fanG, new THREE.BoxGeometry(2.1, 0.08, 0.7), flatMat("#EDE9FF"),
        [-6.4 + Math.cos(ang) * 1.35, 1.24, -7.4 + Math.sin(ang) * 1.35],
        { rot: [0, -ang, 0], partId: "fan", edges: false });
    }
    root.add(fanG);
    registerPart("fan", fanG);

    /* ---- 内存（两条） ---- */
    var ramG = new THREE.Group();
    addMesh(ramG, new THREE.BoxGeometry(7.6, 0.34, 1.5), flatMat("#A995FF"), [6.4, 0.88, -2.9], { partId: "ram" });
    addMesh(ramG, new THREE.BoxGeometry(7.6, 0.34, 1.5), flatMat("#C8BCFF"), [6.4, 0.88, -1.0], { partId: "ram" });
    root.add(ramG);
    registerPart("ram", ramG);

    /* ---- 固态硬盘 ---- */
    var ssdG = new THREE.Group();
    addMesh(ssdG, new THREE.BoxGeometry(8.2, 0.34, 2.6), flatMat("#FFD84D"), [6.2, 0.88, 2.0], { partId: "ssd" });
    addMesh(ssdG, new THREE.BoxGeometry(3.4, 0.06, 1.2), flatMat("#FFF0CE"), [6.2, 1.07, 2.0], { partId: "ssd", edges: false });
    root.add(ssdG);
    registerPart("ssd", ssdG);

    /* ---- 无线网卡 ---- */
    var wifiG = new THREE.Group();
    addMesh(wifiG, new THREE.BoxGeometry(2.8, 0.2, 2.1), flatMat("#79CFFF"), [-7.6, 0.82, -2.2], { partId: "wifi" });
    addMesh(wifiG, new THREE.BoxGeometry(1.1, 0.14, 0.7), flatMat("#E1F2FF"), [-7.0, 0.97, -2.2], { partId: "wifi", edges: false });
    root.add(wifiG);
    registerPart("wifi", wifiG);

    /* ---- 扬声器 ---- */
    var spkG = new THREE.Group();
    addMesh(spkG, new THREE.BoxGeometry(2.3, 0.62, 6.6), flatMat("#FF9278"), [-14.2, 0.74, 2.2], { partId: "speaker" });
    addMesh(spkG, new THREE.BoxGeometry(2.3, 0.62, 6.6), flatMat("#FF9278"), [14.2, 0.74, 2.2], { partId: "speaker" });
    root.add(spkG);
    registerPart("speaker", spkG);

    /* ---- 接口 ---- */
    var portG = new THREE.Group();
    var portMat = flatMat("#B9B2A4");
    [[-16.06, 0.95, 4.8], [-16.06, 0.95, 2.4], [16.06, 0.95, 3.4], [16.06, 0.95, 1.1]].forEach(function (p) {
      addMesh(portG, new THREE.BoxGeometry(0.42, 0.44, 1.35), portMat, p, { partId: "ports", edges: false });
    });
    root.add(portG);
    registerPart("ports", portG);

    /* ---- 上盖 + 屏幕 ----
       铰链在机身最后缘（z = -D/2）。合盖时上盖平躺在键盘上方、屏幕朝下；
       绕 X 轴转 -100° 后，上盖立起来并略向后倾，屏幕正好朝向读者。
       ⚠️ 屏幕必须放在上盖的「下表面」（local -y），否则开盖后朝向背面。    */
    var lidG = new THREE.Group();
    lidG.position.set(0, M.H, -M.D / 2);
    lidG.rotation.x = M.openDeg * Math.PI / 180;

    // 外壳：local y ∈ [-lidT, 0]，上表面是外盖、下表面贴屏幕
    addMesh(lidG, new THREE.BoxGeometry(M.W, M.lidT, M.lidD), flatMat("#79CFFF"),
      [0, -M.lidT / 2, M.lidD / 2], { partId: "lid" });
    // 屏幕：法线朝 -Y（合盖时朝下），旋转后朝向读者
    addMesh(lidG, new THREE.PlaneGeometry(30.4, 19.2), flatMat("#1A1F2B"),
      [0, -M.lidT - 0.01, M.lidD / 2], { rot: [Math.PI / 2, 0, 0], partId: "lid", edges: false });
    addMesh(lidG, new THREE.PlaneGeometry(29.4, 18.2), new THREE.MeshBasicMaterial({ map: screenTexture() }),
      [0, -M.lidT - 0.02, M.lidD / 2], { rot: [Math.PI / 2, 0, 0], partId: "lid", edges: false });
    // 摄像头
    addMesh(lidG, new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10), flatMat("#1A1F2B"),
      [0, -M.lidT - 0.03, 1.6], { rot: [Math.PI / 2, 0, 0], partId: "lid", edges: false });
    root.add(lidG);
    registerPart("lid", lidG);

    /* ---- 铰链 + 屏线 ---- */
    var hingeG = new THREE.Group();
    [-9.6, 9.6].forEach(function (x) {
      addMesh(hingeG, new THREE.CylinderGeometry(0.44, 0.44, 6.6, 16), flatMat("#8A939E"),
        [x, M.H, -M.D / 2], { rot: [0, 0, Math.PI / 2], partId: "hinge" });
    });
    addMesh(hingeG, new THREE.BoxGeometry(1.6, 0.14, 3.6), flatMat("#FFC7D9"),
      [0, M.H - 0.1, -M.D / 2 + 2.0], { partId: "hinge" });
    root.add(hingeG);
    registerPart("hinge", hingeG);

    /* ---- 假阴影：不启用 shadowMap，省一半渲染开销 ---- */
    var sh = new THREE.Mesh(
      new THREE.PlaneGeometry(68, 60),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.02;
    root.add(sh);

    return root;
  }

  /* ============================================================
     四、场景 / 相机 / 渲染
     ============================================================ */
  function initScene(canvas) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 600);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xF5EDDC, 1.05));
    var key = new THREE.DirectionalLight(0xffffff, 1.45); key.position.set(16, 28, 20); scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-20, 12, -16); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    scene.add(buildModel());

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
  }

  function applyCamera() {
    var o = orbit, t = state.explodeT || 0;
    // 分解时相机自动后退并抬高，否则零件会飞出画面
    var radius = o.radius * (1 + 0.3 * t);
    var ty = o.target.y + 6.5 * t;
    camera.position.set(
      o.target.x + radius * Math.sin(o.phi) * Math.sin(o.theta),
      ty + radius * Math.cos(o.phi),
      o.target.z + radius * Math.sin(o.phi) * Math.cos(o.theta)
    );
    camera.lookAt(o.target.x, ty, o.target.z);
  }

  /* ============================================================
     五、交互：拖拽旋转 / 滚轮缩放 / 点击拾取
     ============================================================ */
  function bindInteractions(canvas) {
    var last = { x: 0, y: 0 }, moved = 0;

    function pt(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    }
    function pick(nx, ny) {
      pointer.set(nx * 2 - 1, -(ny * 2 - 1));
      raycaster.setFromCamera(pointer, camera);
      var hits = raycaster.intersectObjects(pickables, false);
      if (!hits.length) return null;
      var o = hits[0].object;
      while (o && !o.userData.partId) o = o.parent;
      return o ? o.userData.partId : null;
    }

    canvas.addEventListener("pointerdown", function (e) {
      state.dragging = true; moved = 0;
      var p = pt(e); last.x = p.x; last.y = p.y;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      var p = pt(e);
      if (!state.dragging) {
        canvas.style.cursor = pick(p.x, p.y) ? "pointer" : "grab";
        return;
      }
      var dx = p.x - last.x, dy = p.y - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      orbit.theta -= dx * 0.0055;
      orbit.phi = Math.max(0.22, Math.min(1.48, orbit.phi - dy * 0.005));
      last.x = p.x; last.y = p.y;
      state.autoRotate = false; syncAutoBtn();
      applyCamera();
    });
    function release(e) {
      state.dragging = false;
      if (canvas.releasePointerCapture && e && e.pointerId != null) {
        try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("pointerleave", function () { state.dragging = false; });

    /* 点击拾取：拖拽后位移超过阈值不算点击，避免转完视角误选零件 */
    canvas.addEventListener("click", function (e) {
      if (moved > 0.02) return;
      var p = pt(e);
      var hit = pick(p.x, p.y);
      if (hit) select(hit, { from3d: true });
    });

    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      orbit.radius = Math.max(36, Math.min(110, orbit.radius + e.deltaY * 0.05));
      applyCamera();
    }, { passive: false });

    // 触摸双指缩放
    var pinch = null;
    function dist2(t) {
      var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy) || 1;
    }
    canvas.addEventListener("touchstart", function (e) {
      if (e.touches.length === 2) pinch = { d: dist2(e.touches), r: orbit.radius };
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
      if (e.touches.length === 2 && pinch) {
        orbit.radius = Math.max(36, Math.min(110, pinch.r * (pinch.d / dist2(e.touches))));
        applyCamera(); e.preventDefault();
      }
    }, { passive: false });
    canvas.addEventListener("touchend", function () { pinch = null; }, { passive: true });
  }

  /* ============================================================
     六、选中 / 分解 / 面板联动
     ============================================================ */
  function highlight(id) {
    Object.keys(parts).forEach(function (k) {
      var p = parts[k], on = (k === id);
      p.mats.forEach(function (m) {
        if (!m.emissive) return;
        m.emissive.set(on ? new THREE.Color(0xffffff).multiplyScalar(0.16) : 0x000000);
      });
      p.edges.forEach(function (l) {
        l.material.opacity = on ? 1 : 0.62;
        l.material.color.set(on ? 0x000000 : THEME.ink);
      });
    });
  }

  function select(id, opts) {
    opts = opts || {};
    var prev = state.selected;
    state.selected = id;
    highlight(id);

    var cfg = (window.FX_PARTS || []).filter(function (p) { return p.id === id; })[0] || null;
    renderPanel(cfg);
    syncListButtons(id);

    if (id && prev !== id && !state.exploded && !reduceMotion) setExploded(true);
    if (opts.from3d && el.live) el.live.textContent = "已选中：" + (cfg ? cfg.name : id);
  }

  function setExploded(on) {
    state.exploded = !!on;
    if (el.explodeBtn) {
      el.explodeBtn.setAttribute("aria-pressed", on ? "true" : "false");
      el.explodeBtn.querySelector("[data-label]").textContent = on ? "组装回去" : "分解零件";
      el.explodeBtn.classList.toggle("is-on", on);
    }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderPanel(cfg) {
    if (!el.panelBody) return;
    if (!cfg) {
      el.panelBody.innerHTML =
        '<div class="hw-panel__empty">' +
        '<p class="hw-panel__hint">click to inspect</p>' +
        '<h3>点一下任意零件</h3>' +
        '<p>零件会从机身里分出来，这里显示它的作用、常见故障，以及对应的排障教程。</p>' +
        '<p class="hw-panel__kb"><b>也可以</b>直接点上面的零件清单——键盘和读屏器都能用。</p>' +
        '</div>';
      return;
    }
    el.panelBody.innerHTML =
      '<div class="hw-panel__head">' +
        '<span class="hw-panel__dot" style="background:' + cfg.color + '"></span>' +
        '<div><h3 class="hw-panel__name">' + esc(cfg.name) + '</h3>' +
        '<p class="hw-panel__en">' + esc(cfg.en || "") + '</p></div>' +
      '</div>' +
      '<p class="hw-panel__desc">' + esc(cfg.desc) + '</p>' +
      (cfg.kb ? '<p class="hw-panel__kb"><b>一眼记住</b>' + esc(cfg.kb) + '</p>' : "") +
      (cfg.faults && cfg.faults.length ? '<div class="hw-panel__block"><h4>常见故障</h4><ul>' +
        cfg.faults.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul></div>" : "") +
      (cfg.links && cfg.links.length ? '<div class="hw-panel__block"><h4>相关教程</h4><div class="hw-panel__links">' +
        cfg.links.map(function (l) {
          return '<a class="hw-link" href="' + l.href + '">' + esc(l.label) + '<span aria-hidden="true">→</span></a>';
        }).join("") + "</div></div>" : "");
  }

  function buildPartList() {
    if (!el.list) return;
    el.list.innerHTML = (window.FX_PARTS || []).map(function (p) {
      return '<button type="button" class="hw-part" data-part="' + p.id + '" aria-pressed="false">' +
        '<span class="hw-part__dot" style="background:' + p.color + '"></span>' +
        '<span class="hw-part__name">' + esc(p.name) + '</span></button>';
    }).join("");
    el.list.addEventListener("click", function (e) {
      var b = e.target.closest("[data-part]");
      if (b) select(b.getAttribute("data-part"));
    });
    el.list.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      var btns = Array.prototype.slice.call(el.list.querySelectorAll(".hw-part"));
      var i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      btns[e.key === "ArrowDown" ? Math.min(btns.length - 1, i + 1) : Math.max(0, i - 1)].focus();
    });
  }

  function syncListButtons(id) {
    if (!el.list) return;
    Array.prototype.forEach.call(el.list.querySelectorAll(".hw-part"), function (b) {
      var on = b.getAttribute("data-part") === id;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-on", on);
    });
  }

  function syncAutoBtn() {
    if (!el.rotateBtn) return;
    el.rotateBtn.classList.toggle("is-on", state.autoRotate);
    el.rotateBtn.setAttribute("aria-pressed", state.autoRotate ? "true" : "false");
  }

  /* ============================================================
     七、渲染循环
     ============================================================ */
  function frame(now) {
    if (!state.ready) return;
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - clockLast) / 1000 || 0.016);
    clockLast = now;

    if (state.autoRotate && !reduceMotion && !state.dragging) {
      orbit.theta += dt * 0.11;
      applyCamera();
    }

    var targetT = state.exploded ? 1 : 0;
    if (reduceMotion) state.explodeT = targetT;
    else state.explodeT += (targetT - state.explodeT) * Math.min(1, dt * 7);

    Object.keys(parts).forEach(function (k) {
      var p = parts[k];
      var v = p.offset.clone().multiplyScalar(state.explodeT);
      if (k === state.selected) {
        var dir = p.offset.lengthSq() > 0.001 ? p.offset.clone().normalize() : new THREE.Vector3(0, 1, 0);
        v.add(dir.multiplyScalar(0.9));
      }
      p.group.position.set(p.base.x + v.x, p.base.y + v.y, p.base.z + v.z);
    });

    applyCamera();
    renderer.render(scene, camera);
  }

  function resize() {
    if (!renderer || !el.stage) return;
    var r = el.stage.getBoundingClientRect();
    var w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 窄屏或竖屏时拉远，保证整机不出画
    orbit.radius = (w / h < 1.05) ? Math.max(orbit.radius, 96) : Math.max(56, orbit.radius);
    camera.updateProjectionMatrix();
    applyCamera();
  }

  /* ============================================================
     八、启动
     ============================================================ */
  async function boot() {
    if (state.ready) return;
    el.stage = document.getElementById("hw-stage");
    el.canvas = document.getElementById("hw-canvas");
    el.list = document.getElementById("hw-list");
    el.panelBody = document.getElementById("hw-panel");
    el.explodeBtn = document.getElementById("hw-explode");
    el.rotateBtn = document.getElementById("hw-rotate");
    el.resetBtn = document.getElementById("hw-reset");
    el.live = document.getElementById("hw-live");
    el.loader = document.getElementById("hw-loader");
    el.fallback = document.getElementById("hw-fallback");
    el.poster = document.getElementById("hw-poster");

    THREE = await import("../vendor/three/three.custom.min.js");

    try {
      initScene(el.canvas);
    } catch (err) {
      showFallback("浏览器未能初始化 WebGL：" + (err && err.message ? err.message : "未知原因"));
      return;
    }

    state.ready = true;
    buildPartList();
    bindInteractions(el.canvas);
    resize();
    window.addEventListener("resize", resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(el.stage);

    el.explodeBtn.addEventListener("click", function () { setExploded(!state.exploded); });
    el.rotateBtn.addEventListener("click", function () { state.autoRotate = !state.autoRotate; syncAutoBtn(); });
    el.resetBtn.addEventListener("click", function () {
      orbit.theta = 0.66; orbit.phi = 1.02; orbit.radius = 74;
      state.autoRotate = true; syncAutoBtn(); applyCamera(); select(null);
    });

    if (reduceMotion) state.autoRotate = false;
    syncAutoBtn();
    applyCamera();
    renderPanel(null);

    document.body.classList.add("hw-ready");
    if (el.loader) el.loader.hidden = true;
    clockLast = performance.now();
    requestAnimationFrame(frame);

    if (/[?&]demo=1/.test(location.search)) {
      setTimeout(function () { setExploded(true); select("battery"); }, 700);
    }
  }

  function showFallback(msg) {
    if (el.loader) el.loader.hidden = true;
    if (el.fallback) el.fallback.hidden = false;
    var note = document.getElementById("hw-fallback-note");
    if (note && msg) note.textContent = msg;
    document.body.classList.add("hw-fallback-on");
    buildPartList();
    renderPanel(null);
  }

  function lazyStart() {
    var start = function () {
      if (state.ready || state.loading) return;
      state.loading = true;
      if (el.loader) el.loader.hidden = false;
      boot().catch(function (err) {
        showFallback("3D 引擎加载失败：" + (err && err.message ? err.message : "网络或文件不可用"));
      });
    };
    var btn = document.getElementById("hw-start");
    if (btn) btn.addEventListener("click", start);
    if (window.IntersectionObserver && el.stage) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); start(); }
      }, { rootMargin: "300px" });
      io.observe(el.stage);
    } else {
      start();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lazyStart);
  else lazyStart();

  window.FXHardware = {
    select: select,
    explode: setExploded,
    get state() { return state; }
  };
})();
