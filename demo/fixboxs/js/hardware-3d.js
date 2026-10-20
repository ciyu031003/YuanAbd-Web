/* js/hardware-3d.js — 硬件 3D 拆解图（笔记本 + 联想/戴尔/惠普 塔式主机）
   ============================================================================
   为什么是「程序化低模」而不是买 glTF 模型：
     · 品牌机（ThinkCentre / OptiPlex / ProDesk）市面上没有现成模型可买；
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

  /* ---------- 笔记本尺寸（单位 ≈ 1cm，按 14 寸等比） ---------- */
  var M = { W: 32, D: 22, H: 1.7, lidT: 0.65, lidD: 21, openDeg: -100 };
  /* ---------- 塔式主机尺寸（标准中塔近似值） ---------- */
  var T = { W: 18, H: 40, D: 42 };

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var THREE = null;
  var state = { ready: false, loading: false, exploded: false, explodeT: 0,
                selected: null, autoRotate: true, dragging: false, device: "laptop" };

  var el = {};
  var scene, camera, renderer, raycaster, pointer, modelRoot;
  var parts = {};
  var pickables = [];
  var orbit = { theta: 0.66, phi: 1.02, radius: 74, target: { x: 0, y: 8.5, z: 0 } };
  var clockLast = 0;

  /* 每种机型的相机预设：塔式更高更窄，要退得更远、视点抬更高 */
  var CAM = {
    laptop: { radius: 74, targetY: 8.5, phi: 1.02, theta: 0.66 },
    tower:  { radius: 100, targetY: 20, phi: 1.06, theta: 0.5 }
  };
  /* 分解后的取景不能靠猜系数：按「分解后包围球」算相机距离与视点，
     否则每加一个零件/改一次位移就要手调，稍不注意零件就飞出画面。 */
  /* 实测几何范围来定相机，而不是用零件组的坐标。
     ⚠️ 踩过的坑：塔式主机的零件组都建在原点、网格用绝对坐标，
        所以「组的 position」根本代表不了零件的实际位置——
        按它算包围盒会得到 center.y=0、半径偏小，一分解就怼到镜头前。
     正确做法：临时把所有零件摆到分解位 → 遍历网格取世界坐标 + 自身包围球 → 量出真实范围。 */
  function computeExplodeFraming() {
    var keys = Object.keys(parts);
    if (!keys.length) return;
    var saved = {};
    keys.forEach(function (k) {
      saved[k] = parts[k].group.position.clone();
      parts[k].group.position.copy(parts[k].base).add(parts[k].offset);
    });
    modelRoot.updateMatrixWorld(true);

    var pts = [], radii = [];
    var v = new THREE.Vector3();
    modelRoot.traverse(function (o) {
      if (!o.isMesh || o.userData.noFrame) return;
      o.getWorldPosition(v);
      pts.push(v.clone());
      if (o.geometry) {
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        var bs = o.geometry.boundingSphere;
        if (bs) radii.push(bs.radius);
      }
    });

    keys.forEach(function (k) { parts[k].group.position.copy(saved[k]); });
    modelRoot.updateMatrixWorld(true);
    if (!pts.length) return;

    var min = { x: Infinity, y: Infinity, z: Infinity }, max = { x: -Infinity, y: -Infinity, z: -Infinity };
    pts.forEach(function (p) {
      min.x = Math.min(min.x, p.x); max.x = Math.max(max.x, p.x);
      min.y = Math.min(min.y, p.y); max.y = Math.max(max.y, p.y);
      min.z = Math.min(min.z, p.z); max.z = Math.max(max.z, p.z);
    });
    var c = new THREE.Vector3((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
    state.explodeCenter = c;

    // 包围球：中心到最远网格中心 + 该网格自身半径
    var far = 0;
    pts.forEach(function (p, i) {
      far = Math.max(far, p.distanceTo(c) + (radii[i] || 6));
    });
    // 36° 竖直视角，半角 18°，留一点余量
    var fit = far / Math.sin(23 * Math.PI / 180);
    state.explodeRadius = Math.max(CAM[device().kind].radius * 1.05, fit);
  }

  function devices() { return window.FX_DEVICES || []; }
  function device() { return devices().filter(function (d) { return d.id === state.device; })[0] || devices()[0]; }
  function currentParts() { var d = device(); return (d && d.parts) || []; }
  function partCfg(id) { return currentParts().filter(function (p) { return p.id === id; })[0] || null; }

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

  function keyboardTexture() {
    var c = makeCanvas(1024, 440), g = c.getContext("2d");
    g.fillStyle = "#E9E4D9"; g.fillRect(0, 0, 1024, 440);
    var cols = 14, rows = 5, pad = 11;
    var cw = (1024 - pad * (cols + 1)) / cols;
    var ch = (440 - pad * (rows + 1)) / rows;
    for (var r = 0; r < rows; r++) {
      for (var i = 0; i < cols; i++) {
        var x = pad + i * (cw + pad), y = pad + r * (ch + pad), w = cw, h = ch;
        if (r === rows - 1 && i >= 3 && i <= 7) { if (i > 3) continue; w = cw * 5 + pad * 4; }
        g.fillStyle = "#2C3340"; roundRect(g, x, y, w, h, 7); g.fill();
        g.fillStyle = "rgba(255,255,255,.11)"; roundRect(g, x, y, w, h * 0.44, 7); g.fill();
      }
    }
    return canvasTexture(c);
  }

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
     ============================================================ */
  function flatMat(hex) { return new THREE.MeshLambertMaterial({ color: new THREE.Color(hex) }); }

  function addMesh(parent, geo, mat, pos, opts) {
    opts = opts || {};
    var mesh = new THREE.Mesh(geo, mat);
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (opts.rot) mesh.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
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
    var cfg = partCfg(id) || {};
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
  }

  function addShadow(root, w, h) {
    var sh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.02;
    sh.userData.noFrame = true;   // 假阴影不参与相机取景（否则 90×86 的平面会把镜头顶得很远）
    root.add(sh);
  }

  /* ============================================================
     三、笔记本建模
     ============================================================ */
  function buildLaptop() {
    var root = new THREE.Group();
    state.fadeMats = [];

    var shell = flatMat("#CFC8B8");
    addMesh(root, new THREE.BoxGeometry(M.W, M.H, M.D), shell, [0, M.H / 2, 0]);
    [[-13, 9], [13, 9], [-13, -9], [13, -9]].forEach(function (p) {
      addMesh(root, new THREE.CylinderGeometry(0.65, 0.65, 0.22, 14), flatMat("#B9B2A4"), [p[0], 0.1, p[1]], { edges: false });
    });

    var deckG = new THREE.Group();
    addMesh(deckG, new THREE.BoxGeometry(M.W - 0.5, 0.28, M.D - 0.5), flatMat("#EFEAE0"), [0, M.H + 0.14, 0], { partId: "keyboard" });
    addMesh(deckG, new THREE.PlaneGeometry(27.6, 11.2), new THREE.MeshBasicMaterial({ map: keyboardTexture() }),
      [0, M.H + 0.29, -2.7], { rot: [-Math.PI / 2, 0, 0], partId: "keyboard", edges: false });
    addMesh(deckG, new THREE.PlaneGeometry(11.4, 7.0), flatMat("#DCD5C7"), [0, M.H + 0.29, 6.7], { rot: [-Math.PI / 2, 0, 0], partId: "keyboard" });
    root.add(deckG);
    registerPart("keyboard", deckG);

    var batG = new THREE.Group();
    addMesh(batG, new THREE.BoxGeometry(19.6, 0.74, 8.8), flatMat("#7FE3C0"), [0, 0.8, 3.4], { partId: "battery" });
    addMesh(batG, new THREE.BoxGeometry(6.0, 0.34, 7.4), flatMat("#B9EEDC"), [-5.6, 1.34, 3.4], { partId: "battery" });
    addMesh(batG, new THREE.BoxGeometry(6.0, 0.34, 7.4), flatMat("#B9EEDC"), [5.6, 1.34, 3.4], { partId: "battery" });
    root.add(batG);
    registerPart("battery", batG);

    var mbG = new THREE.Group();
    addMesh(mbG, new THREE.BoxGeometry(20.6, 0.24, 7.8), flatMat("#0F766E"), [0, 0.62, -6.4], { partId: "mainboard" });
    [[-8.4, -7.6], [-5.6, -4.2], [2.2, -4.0], [9.0, -7.8], [9.6, -4.4]].forEach(function (p, i) {
      addMesh(mbG, new THREE.BoxGeometry(1.1 + (i % 2) * 0.7, 0.34, 1.0), flatMat("#0B5F58"), [p[0], 0.9, p[1]], { partId: "mainboard", edges: false });
    });
    root.add(mbG);
    registerPart("mainboard", mbG);

    var cpuG = new THREE.Group();
    addMesh(cpuG, new THREE.BoxGeometry(3.4, 0.26, 3.4), flatMat("#FF8A6B"), [5.6, 0.86, -7.4], { partId: "cpu" });
    addMesh(cpuG, new THREE.BoxGeometry(4.8, 0.48, 4.8), flatMat("#D6D0C2"), [5.6, 1.24, -7.4], { partId: "cpu" });
    addMesh(cpuG, new THREE.BoxGeometry(7.6, 0.26, 0.92), flatMat("#C98B5E"), [1.4, 1.32, -7.4], { partId: "cpu", edges: false });
    addMesh(cpuG, new THREE.BoxGeometry(7.6, 0.26, 0.92), flatMat("#C98B5E"), [1.4, 1.32, -5.4], { partId: "cpu", edges: false });
    root.add(cpuG);
    registerPart("cpu", cpuG);

    var fanG = new THREE.Group();
    addMesh(fanG, new THREE.CylinderGeometry(2.95, 2.95, 0.44, 30), flatMat("#E4DED0"), [-6.4, 0.94, -7.4], { partId: "fan" });
    addMesh(fanG, new THREE.CylinderGeometry(2.6, 2.6, 0.16, 26), flatMat("#A995FF"), [-6.4, 1.17, -7.4], { partId: "fan", edges: false });
    for (var b = 0; b < 7; b++) {
      var ang = (b / 7) * Math.PI * 2;
      addMesh(fanG, new THREE.BoxGeometry(2.1, 0.08, 0.7), flatMat("#EDE9FF"),
        [-6.4 + Math.cos(ang) * 1.35, 1.24, -7.4 + Math.sin(ang) * 1.35], { rot: [0, -ang, 0], partId: "fan", edges: false });
    }
    root.add(fanG);
    registerPart("fan", fanG);

    var ramG = new THREE.Group();
    addMesh(ramG, new THREE.BoxGeometry(7.6, 0.34, 1.5), flatMat("#A995FF"), [6.4, 0.88, -2.9], { partId: "ram" });
    addMesh(ramG, new THREE.BoxGeometry(7.6, 0.34, 1.5), flatMat("#C8BCFF"), [6.4, 0.88, -1.0], { partId: "ram" });
    root.add(ramG);
    registerPart("ram", ramG);

    var ssdG = new THREE.Group();
    addMesh(ssdG, new THREE.BoxGeometry(8.2, 0.34, 2.6), flatMat("#FFD84D"), [6.2, 0.88, 2.0], { partId: "ssd" });
    addMesh(ssdG, new THREE.BoxGeometry(3.4, 0.06, 1.2), flatMat("#FFF0CE"), [6.2, 1.07, 2.0], { partId: "ssd", edges: false });
    root.add(ssdG);
    registerPart("ssd", ssdG);

    var wifiG = new THREE.Group();
    addMesh(wifiG, new THREE.BoxGeometry(2.8, 0.2, 2.1), flatMat("#79CFFF"), [-7.6, 0.82, -2.2], { partId: "wifi" });
    addMesh(wifiG, new THREE.BoxGeometry(1.1, 0.14, 0.7), flatMat("#E1F2FF"), [-7.0, 0.97, -2.2], { partId: "wifi", edges: false });
    root.add(wifiG);
    registerPart("wifi", wifiG);

    var spkG = new THREE.Group();
    addMesh(spkG, new THREE.BoxGeometry(2.3, 0.62, 6.6), flatMat("#FF9278"), [-14.2, 0.74, 2.2], { partId: "speaker" });
    addMesh(spkG, new THREE.BoxGeometry(2.3, 0.62, 6.6), flatMat("#FF9278"), [14.2, 0.74, 2.2], { partId: "speaker" });
    root.add(spkG);
    registerPart("speaker", spkG);

    var portG = new THREE.Group();
    var portMat = flatMat("#B9B2A4");
    [[-16.06, 0.95, 4.8], [-16.06, 0.95, 2.4], [16.06, 0.95, 3.4], [16.06, 0.95, 1.1]].forEach(function (p) {
      addMesh(portG, new THREE.BoxGeometry(0.42, 0.44, 1.35), portMat, p, { partId: "ports", edges: false });
    });
    root.add(portG);
    registerPart("ports", portG);

    var lidG = new THREE.Group();
    lidG.position.set(0, M.H, -M.D / 2);
    lidG.rotation.x = M.openDeg * Math.PI / 180;
    addMesh(lidG, new THREE.BoxGeometry(M.W, M.lidT, M.lidD), flatMat("#79CFFF"), [0, -M.lidT / 2, M.lidD / 2], { partId: "lid" });
    addMesh(lidG, new THREE.PlaneGeometry(30.4, 19.2), flatMat("#1A1F2B"), [0, -M.lidT - 0.01, M.lidD / 2], { rot: [Math.PI / 2, 0, 0], partId: "lid", edges: false });
    addMesh(lidG, new THREE.PlaneGeometry(29.4, 18.2), new THREE.MeshBasicMaterial({ map: screenTexture() }), [0, -M.lidT - 0.02, M.lidD / 2], { rot: [Math.PI / 2, 0, 0], partId: "lid", edges: false });
    root.add(lidG);
    registerPart("lid", lidG);

    var hingeG = new THREE.Group();
    [-9.6, 9.6].forEach(function (x) {
      addMesh(hingeG, new THREE.CylinderGeometry(0.44, 0.44, 6.6, 16), flatMat("#8A939E"), [x, M.H, -M.D / 2], { rot: [0, 0, Math.PI / 2], partId: "hinge" });
    });
    addMesh(hingeG, new THREE.BoxGeometry(1.6, 0.14, 3.6), flatMat("#FFC7D9"), [0, M.H - 0.1, -M.D / 2 + 2.0], { partId: "hinge" });
    root.add(hingeG);
    registerPart("hinge", hingeG);

    addShadow(root, 68, 60);
    return root;
  }

  /* ============================================================
     四、塔式主机建模（联想 / 戴尔 / 惠普）
        坐标：x 左右（±9），y 向上（0–40），z 前后（-21 后 / +21 前）
        右侧（+x）是免工具侧板；拆掉后从右侧看内部结构。
     ============================================================ */
  var BRAND = {
    lenovo: { badge: "#E2231A", bezel: "#2E3644", chassis: "#3A4350", accent: "#E2231A", psuTop: true,  face: "lenovo" },
    dell:   { badge: "#0672CB", bezel: "#232936", chassis: "#2A303C", accent: "#0672CB", psuTop: false, face: "dell" },
    hp:     { badge: "#0096D6", bezel: "#39424F", chassis: "#4A5260", accent: "#0096D6", psuTop: true,  face: "hp" }
  };

  function buildTower(brandId) {
    var B = BRAND[brandId] || BRAND.lenovo;
    var root = new THREE.Group();
    var wall = flatMat(B.chassis);
    /* 机箱骨架在分解时淡出：深色板子会把里面的零件全挡住，
       这是「分解图看不清」最直接的原因。淡出后零件立刻可读。 */
    state.fadeMats = [wall];

    /* ---- 机箱骨架：五块薄板围出框架，右侧敞开（侧板可拆） ---- */
    addMesh(root, new THREE.BoxGeometry(0.7, T.H, T.D), wall, [-T.W / 2 + 0.35, T.H / 2, 0]);
    addMesh(root, new THREE.BoxGeometry(T.W, 0.7, T.D), wall, [0, T.H - 0.35, 0]);
    addMesh(root, new THREE.BoxGeometry(T.W, 0.7, T.D), wall, [0, 0.35, 0]);
    addMesh(root, new THREE.BoxGeometry(T.W, T.H, 0.7), wall, [0, T.H / 2, -T.D / 2 + 0.35]);

    /* ---- 侧板（可拆） ---- */
    var sideG = new THREE.Group();
    addMesh(sideG, new THREE.BoxGeometry(0.7, T.H - 0.8, T.D - 0.8), flatMat("#8A939E"),
      [T.W / 2 - 0.35, T.H / 2, 0], { partId: "side-panel" });
    // 侧板上的散热孔阵列（用小方块表达，避免纹理）
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 4; c++) {
        addMesh(sideG, new THREE.BoxGeometry(0.12, 0.9, 0.9), flatMat("#6E7784"),
          [T.W / 2 - 0.02, 30 + r * 1.3, -6 + c * 1.3], { partId: "side-panel", edges: false });
      }
    }
    root.add(sideG);
    registerPart("side-panel", sideG);

    /* ---- 前面板 + 品牌标识 ---- */
    var bezG = new THREE.Group();
    addMesh(bezG, new THREE.BoxGeometry(T.W - 0.4, T.H - 0.8, 1.2), flatMat(B.bezel),
      [0, T.H / 2, T.D / 2 - 0.6], { partId: "front-bezel" });
    // 电源键
    addMesh(bezG, new THREE.CylinderGeometry(0.85, 0.85, 0.4, 18), flatMat("#C8CDD6"),
      [4.9, T.H - 5.0, T.D / 2 + 0.1], { rot: [Math.PI / 2, 0, 0], partId: "front-bezel", edges: false });
    // 品牌图标（简易：色块 + 两条杠，避免伪造真实 logo 的商标细节）
    addMesh(bezG, new THREE.BoxGeometry(2.6, 2.6, 0.26), flatMat(B.badge),
      [-6.2, T.H - 5.4, T.D / 2 + 0.1], { partId: "front-bezel", edges: false });
    root.add(bezG);
    // 前面板细节（挂在 bezG 下，跟着前面板一起分解）
    (function () {
      var sub = new THREE.Group(); sub.userData.partId = "front-bezel";
      bezG.add(sub);
      var holder = sub;
      var zf = T.D / 2 + 0.14;
      var dark = flatMat("#1A1F2B");
      if (B.face === "lenovo") {
        addMesh(holder, new THREE.BoxGeometry(1.2, 9.5, 0.3), flatMat(B.accent), [-7.6, T.H - 8.5, zf], { partId: "front-bezel", edges: false });
        addMesh(holder, new THREE.BoxGeometry(13.5, 2.8, 0.28), flatMat("#222936"), [-1.2, T.H - 3.4, zf], { partId: "front-bezel", edges: false });
        for (var i = 0; i < 4; i++) addMesh(holder, new THREE.BoxGeometry(13.5, 0.5, 0.22), flatMat("#20262F"), [0.4, 9 - i * 1.2, zf], { partId: "front-bezel", edges: false });
      } else if (B.face === "dell") {
        for (var j = 0; j < 7; j++) addMesh(holder, new THREE.BoxGeometry(14.5, 0.62, 0.24), flatMat("#171C25"), [0, 5.4 + j * 1.25, zf], { partId: "front-bezel", edges: false });
        addMesh(holder, new THREE.CylinderGeometry(1.9, 1.9, 0.3, 22), flatMat(B.badge), [0, T.H - 5.2, zf], { rot: [Math.PI / 2, 0, 0], partId: "front-bezel", edges: false });
        addMesh(holder, new THREE.BoxGeometry(13, 1.1, 0.22), flatMat("#171C25"), [0, T.H - 3.2, zf], { partId: "front-bezel", edges: false });
      } else {
        addMesh(holder, new THREE.BoxGeometry(16.2, 15.5, 0.34), flatMat("#8C949F"), [0, 9.4, zf], { partId: "front-bezel" });
        addMesh(holder, new THREE.BoxGeometry(4.0, 2.0, 0.22), flatMat(B.badge), [-5.4, T.H - 6.6, zf + 0.1], { partId: "front-bezel", edges: false });
        addMesh(holder, new THREE.BoxGeometry(13.5, 2.8, 0.28), flatMat("#303844"), [-1.2, T.H - 3.4, zf], { partId: "front-bezel", edges: false });
        for (var k = 0; k < 3; k++) addMesh(holder, new THREE.BoxGeometry(12, 0.45, 0.2), flatMat("#6E7784"), [0, 15 - k * 1.0, zf], { partId: "front-bezel", edges: false });
      }
      addMesh(holder, new THREE.BoxGeometry(3.2, 0.8, 0.3), dark, [B.face === "dell" ? 0 : 3.4, T.H - 9.4, zf], { partId: "front-bezel", edges: false });
      addMesh(holder, new THREE.CylinderGeometry(0.3, 0.3, 0.28, 12), flatMat("#C8CDD6"),
        [B.face === "dell" ? 5.6 : 6.2, T.H - 9.4, zf], { rot: [Math.PI / 2, 0, 0], partId: "front-bezel", edges: false });
    })();
    registerPart("front-bezel", bezG);

    /* ---- 主板（竖装，贴在左内壁） ---- */
    var mbG = new THREE.Group();
    addMesh(mbG, new THREE.BoxGeometry(0.6, 26, 22), flatMat("#0F766E"), [-T.W / 2 + 1.1, 24, -3], { partId: "mainboard" });
    [[-8.0, 32, 4], [-8.0, 20, 6], [-8.0, 14, -10], [-8.0, 30, -12]].forEach(function (p, i) {
      addMesh(mbG, new THREE.BoxGeometry(1.1, 1.6 + (i % 2), 2.2), flatMat("#0B5F58"), [p[0], p[1], p[2]], { partId: "mainboard", edges: false });
    });
    root.add(mbG);
    registerPart("mainboard", mbG);

    /* ---- CPU + 下压式散热器 ---- */
    var cpuG = new THREE.Group();
    addMesh(cpuG, new THREE.BoxGeometry(0.5, 4.4, 4.4), flatMat("#FF8A6B"), [-7.9, 28, -8], { partId: "cpu" });
    addMesh(cpuG, new THREE.BoxGeometry(7.2, 7.2, 7.2), flatMat("#D6D0C2"), [-4.0, 28, -8], { partId: "cpu" });
    for (var f = 0; f < 4; f++) {
      addMesh(cpuG, new THREE.BoxGeometry(7.6, 0.5, 6.4), flatMat("#C0B9AA"), [-4.0, 25.4 + f * 1.5, -8], { partId: "cpu", edges: false });
    }
    addMesh(cpuG, new THREE.BoxGeometry(0.8, 6.4, 6.4), flatMat("#A995FF"), [-0.2, 28, -8], { partId: "cpu", edges: false });
    root.add(cpuG);
    registerPart("cpu", cpuG);

    /* ---- 内存（两条，竖直插在主板槽上） ---- */
    var ramG = new THREE.Group();
    addMesh(ramG, new THREE.BoxGeometry(3.0, 13, 0.8), flatMat("#A995FF"), [-6.6, 27, 2], { partId: "ram" });
    addMesh(ramG, new THREE.BoxGeometry(3.0, 13, 0.8), flatMat("#C8BCFF"), [-6.6, 27, 4.2], { partId: "ram" });
    root.add(ramG);
    registerPart("ram", ramG);

    /* ---- 独立显卡（水平插在 PCIe 槽，向 +x 伸出） ---- */
    var gpuG = new THREE.Group();
    addMesh(gpuG, new THREE.BoxGeometry(11, 1.0, 24), flatMat("#2A3040"), [-2.6, 15.6, 0], { partId: "gpu" });
    addMesh(gpuG, new THREE.BoxGeometry(10.4, 3.4, 12), flatMat("#FF9278"), [-2.6, 14.2, 2], { partId: "gpu" });
    addMesh(gpuG, new THREE.CylinderGeometry(3.2, 3.2, 0.6, 22), flatMat("#3A4350"),
      [-2.0, 11.9, -3], { rot: [Math.PI / 2, 0, 0], partId: "gpu", edges: false });
    addMesh(gpuG, new THREE.CylinderGeometry(3.2, 3.2, 0.6, 22), flatMat("#3A4350"),
      [-2.0, 11.9, 5], { rot: [Math.PI / 2, 0, 0], partId: "gpu", edges: false });
    root.add(gpuG);
    registerPart("gpu", gpuG);

    /* ---- 机械硬盘（3.5 寸，前下方硬盘笼） ---- */
    var hddG = new THREE.Group();
    addMesh(hddG, new THREE.BoxGeometry(10, 2.6, 14.7), flatMat("#FFD84D"), [0.5, 5.2, 13], { partId: "hdd" });
    addMesh(hddG, new THREE.BoxGeometry(10.4, 0.5, 15.2), flatMat("#C9AD3C"), [0.5, 3.7, 13], { partId: "hdd", edges: false });
    root.add(hddG);
    registerPart("hdd", hddG);

    /* ---- 固态硬盘（2.5 寸，硬盘笼上层） ---- */
    var ssdG = new THREE.Group();
    addMesh(ssdG, new THREE.BoxGeometry(7, 0.8, 10), flatMat("#7FE3C0"), [0.5, 9.4, 13], { partId: "ssd" });
    root.add(ssdG);
    registerPart("ssd", ssdG);

    /* ---- 电源（联想/惠普在上后方，戴尔在下方） ---- */
    var psuG = new THREE.Group();
    var psuY = B.psuTop ? 34 : 6;
    addMesh(psuG, new THREE.BoxGeometry(15, 8.6, 14), flatMat("#A995FF"), [0, psuY, -13], { partId: "psu" });
    addMesh(psuG, new THREE.CylinderGeometry(2.4, 2.4, 0.4, 20), flatMat("#8A7FD6"),
      [0, psuY, -6.1], { rot: [Math.PI / 2, 0, 0], partId: "psu", edges: false });
    // 出线束
    addMesh(psuG, new THREE.BoxGeometry(1.6, 1.6, 10), flatMat("#C8BCFF"), [5.5, psuY - 1, -8], { partId: "psu", edges: false });
    root.add(psuG);
    registerPart("psu", psuG);

    /* ---- 机箱风扇（后置排气） ---- */
    var fanG = new THREE.Group();
    var fanY = B.psuTop ? 17 : 30;
    addMesh(fanG, new THREE.CylinderGeometry(5.2, 5.2, 1.4, 26), flatMat("#E4DED0"),
      [-4.5, fanY, -20], { rot: [Math.PI / 2, 0, 0], partId: "case-fan" });
    addMesh(fanG, new THREE.CylinderGeometry(4.6, 4.6, 0.4, 24), flatMat("#79CFFF"),
      [-4.5, fanY, -19.4], { rot: [Math.PI / 2, 0, 0], partId: "case-fan", edges: false });
    for (var bl = 0; bl < 7; bl++) {
      var a2 = (bl / 7) * Math.PI * 2;
      addMesh(fanG, new THREE.BoxGeometry(3.6, 0.12, 1.2), flatMat("#E1F2FF"),
        [-4.5 + Math.cos(a2) * 2.2, fanY + Math.sin(a2) * 2.2, -19.3],
        { rot: [0, 0, a2], partId: "case-fan", edges: false });
    }
    root.add(fanG);
    registerPart("case-fan", fanG);

    /* ---- 光驱位 / 扩展位 ---- */
    var oddG = new THREE.Group();
    addMesh(oddG, new THREE.BoxGeometry(14.6, 4.2, 17), flatMat("#FFC7D9"), [-1, 35, 7], { partId: "odd" });
    addMesh(oddG, new THREE.BoxGeometry(12.0, 0.4, 15), flatMat("#FFDCE8"), [-1, 37.2, 7], { partId: "odd", edges: false });
    root.add(oddG);
    registerPart("odd", oddG);

    addShadow(root, 90, 86);
    return root;
  }

  /* ============================================================
     五、场景 / 相机 / 渲染
     ============================================================ */
  function initScene(canvas) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 700);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xF5EDDC, 1.05));
    var key = new THREE.DirectionalLight(0xffffff, 1.45); key.position.set(20, 34, 24); scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-24, 14, -18); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
  }

  function applyCamera() {
    var o = orbit, t = state.explodeT || 0;
    var tx = o.target.x, ty = o.target.y, tz = o.target.z;
    var radius = o.radius;
    if (t > 0.001 && state.explodeCenter) {
      tx = o.target.x + (state.explodeCenter.x - o.target.x) * t;
      ty = o.target.y + (state.explodeCenter.y - o.target.y) * t;
      tz = o.target.z + (state.explodeCenter.z - o.target.z) * t;
      radius = o.radius + (state.explodeRadius - o.radius) * t;
    }
    camera.position.set(
      tx + radius * Math.sin(o.phi) * Math.sin(o.theta),
      ty + radius * Math.cos(o.phi),
      tz + radius * Math.sin(o.phi) * Math.cos(o.theta)
    );
    camera.lookAt(tx, ty, tz);
  }

  function applyCamPreset() {
    var cfg = CAM[device().kind] || CAM.laptop;
    orbit.radius = cfg.radius;
    orbit.target = { x: 0, y: cfg.targetY, z: 0 };
    orbit.phi = cfg.phi;
    orbit.theta = cfg.theta;
    applyCamera();
  }

  /* ============================================================
     六、交互
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
      if (!state.dragging) { canvas.style.cursor = pick(p.x, p.y) ? "pointer" : "grab"; return; }
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

    canvas.addEventListener("click", function (e) {
      if (moved > 0.02) return;
      var p = pt(e);
      var hit = pick(p.x, p.y);
      if (hit) select(hit, { from3d: true });
    });

    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      var min = device().kind === "tower" ? 50 : 36;
      var max = device().kind === "tower" ? 170 : 110;
      orbit.radius = Math.max(min, Math.min(max, orbit.radius + e.deltaY * 0.05));
      applyCamera();
    }, { passive: false });

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
        orbit.radius = Math.max(50, Math.min(170, pinch.r * (pinch.d / dist2(e.touches))));
        applyCamera(); e.preventDefault();
      }
    }, { passive: false });
    canvas.addEventListener("touchend", function () { pinch = null; }, { passive: true });
  }

  /* ============================================================
     七、选中 / 分解 / 面板联动
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
      });
    });
  }

  function select(id, opts) {
    opts = opts || {};
    var prev = state.selected;
    state.selected = id;
    highlight(id);
    var cfg = partCfg(id);
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
    el.list.innerHTML = currentParts().map(function (p) {
      return '<button type="button" class="hw-part" data-part="' + p.id + '" aria-pressed="false">' +
        '<span class="hw-part__dot" style="background:' + p.color + '"></span>' +
        '<span class="hw-part__name">' + esc(p.name) + '</span></button>';
    }).join("");
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
     八、机型切换：重建场景（释放旧几何，避免显存泄漏）
     ============================================================ */
  function disposeRoot(root) {
    if (!root) return;
    root.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) {
          if (m.map && m.map.dispose) m.map.dispose();
          m.dispose();
        });
      }
    });
    scene.remove(root);
  }

  function rebuild(deviceId) {
    state.device = deviceId || "laptop";
    var dev = device();
    disposeRoot(modelRoot);
    parts = {};
    pickables = [];
    modelRoot = dev.kind === "tower" ? buildTower(dev.id) : buildLaptop();
    scene.add(modelRoot);

    state.exploded = false;
    state.explodeT = 0;
    state.selected = null;
    setExploded(false);
    computeExplodeFraming();
    applyCamPreset();

    // 海报 / 说明 / 清单 / 面板 同步
    if (el.poster) el.poster.src = dev.poster;
    if (el.intro) el.intro.textContent = dev.intro || "";
    buildPartList();
    renderPanel(null);

    // 机型 tab 状态
    if (el.devices) {
      Array.prototype.forEach.call(el.devices.querySelectorAll("[data-device]"), function (b) {
        var on = b.getAttribute("data-device") === state.device;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.setAttribute("tabindex", on ? "0" : "-1");
      });
    }
  }

  /* ============================================================
     九、渲染循环
     ============================================================ */
  function frame(now) {
    if (!state.ready) return;
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - clockLast) / 1000 || 0.016);
    clockLast = now;

    if (state.autoRotate && !reduceMotion && !state.dragging) {
      orbit.theta += dt * 0.11;
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

    // 机箱骨架随分解淡出
    (state.fadeMats || []).forEach(function (m) {
      m.transparent = true;
      m.opacity = 1 - 0.8 * state.explodeT;
      m.depthWrite = state.explodeT < 0.35;
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
    // 窄屏拉远，保证整机不出画（塔式本来就高，需要退更多）
    var minR = device().kind === "tower" ? 120 : 96;
    if (w / h < 1.05) orbit.radius = Math.max(orbit.radius, minR);
    camera.updateProjectionMatrix();
    applyCamera();
  }

  /* ============================================================
     十、启动
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
    el.intro = document.getElementById("hw-intro");
    el.devices = document.getElementById("hw-devices");

    THREE = await import("../vendor/three/three.custom.min.js");

    try {
      initScene(el.canvas);
    } catch (err) {
      showFallback("浏览器未能初始化 WebGL：" + (err && err.message ? err.message : "未知原因"));
      return;
    }

    state.ready = true;
    bindInteractions(el.canvas);

    // 机型切换
    if (el.devices) {
      el.devices.addEventListener("click", function (e) {
        var b = e.target.closest("[data-device]");
        if (b && b.getAttribute("data-device") !== state.device) rebuild(b.getAttribute("data-device"));
      });
      el.devices.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var btns = Array.prototype.slice.call(el.devices.querySelectorAll("[data-device]"));
        var i = btns.indexOf(document.activeElement);
        if (i < 0) return;
        e.preventDefault();
        var next = e.key === "ArrowRight" ? Math.min(btns.length - 1, i + 1) : Math.max(0, i - 1);
        btns[next].focus();
        btns[next].click();
      });
    }

    // 零件清单（事件只绑一次，内容随机型重建）
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

    el.explodeBtn.addEventListener("click", function () { setExploded(!state.exploded); });
    el.rotateBtn.addEventListener("click", function () { state.autoRotate = !state.autoRotate; syncAutoBtn(); });
    el.resetBtn.addEventListener("click", function () {
      applyCamPreset();
      state.autoRotate = true; syncAutoBtn(); select(null);
    });

    // URL 指定初始机型：?d=tower-lenovo 之类
    var m = location.search.match(/[?&]d=([a-z-]+)/);
    var startId = m && devices().some(function (d) { return d.id === m[1]; }) ? m[1] : "laptop";
    rebuild(startId);

    resize();
    window.addEventListener("resize", resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(el.stage);

    if (reduceMotion) state.autoRotate = false;
    syncAutoBtn();
    renderPanel(null);

    document.body.classList.add("hw-ready");
    if (el.loader) el.loader.hidden = true;
    clockLast = performance.now();
    requestAnimationFrame(frame);

    if (/[?&]demo=1/.test(location.search)) {
      setTimeout(function () { setExploded(true); select(currentParts()[3] && currentParts()[3].id); }, 700);
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
    device: function (id) { if (state.ready) rebuild(id); },
    get state() { return state; }
  };
})();