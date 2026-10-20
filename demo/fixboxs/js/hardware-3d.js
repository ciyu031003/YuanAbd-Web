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


  /* ============================================================
     一·B、程序化贴图库
     ------------------------------------------------------------
     全部用 Canvas 现画，不引入任何图片资源：
       PCB 走线与焊盘 / CPU 顶盖刻字 / 内存颗粒与金手指 / 硬盘标签 /
       电源外壳与风扇网 / 显卡导风罩 / 拉丝金属 / 冲孔网板 / 风扇叶片
     尺寸统一 512 或 1024，按 key 缓存，避免每个 mesh 重复生成。
     ============================================================ */
  var TEX = {};

  function makeTex(key, w, h, draw) {
    if (TEX[key]) return TEX[key];
    var c = makeCanvas(w, h);
    draw(c.getContext("2d"), w, h);
    TEX[key] = canvasTexture(c);
    return TEX[key];
  }

  function texMat(key, w, h, draw, opts) {
    var o = opts || {};
    return new THREE.MeshLambertMaterial(Object.assign({ map: makeTex(key, w, h, draw) }, o));
  }

  function noise(g, w, h, n, alpha, light) {
    for (var i = 0; i < n; i++) {
      g.fillStyle = "rgba(" + (light ? "255,255,255," : "0,0,0,") + (Math.random() * alpha).toFixed(3) + ")";
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
  }

  /* 主板：深绿阻焊 + 走线 + 焊盘 + 元件 + 丝印 */
  function drawPCB(g, w, h) {
    g.fillStyle = "#0A4F49"; g.fillRect(0, 0, w, h);
    noise(g, w, h, 900, 0.06, false);
    // 走线（曼哈顿布线，像真的 PCB）
    for (var i = 0; i < 46; i++) {
      var x = Math.random() * w, y = Math.random() * h;
      g.strokeStyle = "rgba(120,210,180," + (0.12 + Math.random() * 0.2).toFixed(2) + ")";
      g.lineWidth = 1 + Math.random() * 1.6;
      g.beginPath(); g.moveTo(x, y);
      for (var s = 0; s < 4; s++) {
        if (Math.random() > 0.5) x += (Math.random() - 0.5) * 120; else y += (Math.random() - 0.5) * 120;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    // 焊盘
    for (var p = 0; p < 90; p++) {
      g.fillStyle = Math.random() > 0.45 ? "#C9A227" : "#B8C4C0";
      var r = 1.4 + Math.random() * 2.2;
      g.beginPath(); g.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2); g.fill();
    }
    // 芯片与电容
    for (var ch = 0; ch < 16; ch++) {
      var cw = 16 + Math.random() * 60, chh = 12 + Math.random() * 34;
      var cx = Math.random() * (w - cw), cy = Math.random() * (h - chh);
      g.fillStyle = "#121D1A"; g.fillRect(cx, cy, cw, chh);
      g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.strokeRect(cx + .5, cy + .5, cw - 1, chh - 1);
      // 引脚
      g.fillStyle = "#8E9A96";
      for (var pin = 0; pin < Math.floor(cw / 6); pin++) {
        g.fillRect(cx + 3 + pin * 6, cy - 2, 2, 3);
        g.fillRect(cx + 3 + pin * 6, cy + chh - 1, 2, 3);
      }
    }
    // 丝印
    g.fillStyle = "rgba(235,245,240,.5)";
    g.font = "bold 11px ui-monospace,monospace";
    ["CPU_FAN", "SATA0", "PCIE1", "DIMM_A1", "ATX_PWR", "M.2_1", "PCH", "USB3_1"].forEach(function (t, i) {
      g.fillText(t, 20 + (i % 4) * 120, 26 + Math.floor(i / 4) * 460);
    });
    // 螺丝孔
    for (var k = 0; k < 4; k++) {
      g.fillStyle = "#0A4F49"; g.beginPath(); g.arc(30 + k * (w - 60) / 3, h - 24, 13, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#C9A227"; g.lineWidth = 3; g.stroke();
    }
  }

  /* CPU 顶盖：拉丝金属 + 刻字 + 角标 */
  function drawChip(g, w, h) {
    var grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, "#D8DDE3"); grd.addColorStop(.5, "#AEB6BE"); grd.addColorStop(1, "#C6CDD4");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 260; i++) {
      g.strokeStyle = "rgba(255,255,255," + (Math.random() * .16).toFixed(2) + ")";
      g.lineWidth = 1; g.beginPath();
      var y = Math.random() * h; g.moveTo(0, y); g.lineTo(w, y + (Math.random() - .5) * 3); g.stroke();
    }
    g.fillStyle = "rgba(30,36,44,.62)";
    g.font = "bold 22px ui-monospace,monospace"; g.textAlign = "center";
    g.fillText("CPU", w / 2, h * 0.36);
    g.font = "13px ui-monospace,monospace";
    g.fillText("SOCKET LGA1700", w / 2, h * 0.52);
    g.fillText("SR 2.5GHz · 65W", w / 2, h * 0.62);
    g.font = "10px ui-monospace,monospace";
    g.fillText("MADE IN CHINA", w / 2, h * 0.76);
    // 左下角定位三角
    g.fillStyle = "rgba(30,36,44,.5)";
    g.beginPath(); g.moveTo(18, h - 18); g.lineTo(18, h - 52); g.lineTo(52, h - 18); g.closePath(); g.fill();
  }

  /* 内存条：绿PCB + 黑颗粒 + 金手指 */
  function drawRAM(g, w, h) {
    g.fillStyle = "#14532D"; g.fillRect(0, 0, w, h);
    noise(g, w, h, 400, .07, false);
    var chips = 8, cw = w / chips;
    for (var i = 0; i < chips; i++) {
      g.fillStyle = "#1A1F2B";
      g.fillRect(i * cw + cw * .12, h * .2, cw * .76, h * .5);
      g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
      g.strokeRect(i * cw + cw * .12 + .5, h * .2 + .5, cw * .76 - 1, h * .5 - 1);
    }
    // 金手指
    g.fillStyle = "#C9A227"; g.fillRect(0, h - 26, w, 26);
    g.strokeStyle = "rgba(0,0,0,.32)"; g.lineWidth = 2;
    for (var p = 0; p < 40; p++) { g.beginPath(); g.moveTo(p * (w / 40), h - 26); g.lineTo(p * (w / 40), h); g.stroke(); }
    // 标签
    g.fillStyle = "#EDE9FF"; g.fillRect(w * .05, h * .06, w * .9, h * .1);
    g.fillStyle = "#5B4BC4"; g.font = "bold 16px ui-monospace,monospace";
    g.fillText("DDR4 3200  8GB", w * .07, h * .145);
  }

  /* 硬盘：金属上盖 + 标签 + 螺丝 */
  function drawHDD(g, w, h) {
    var grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#CFD6DD"); grd.addColorStop(1, "#AAB2BA");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    noise(g, w, h, 700, .05, true);
    // 中间标签
    g.fillStyle = "#F2F5F8"; g.fillRect(24, 40, w - 48, h - 96);
    g.strokeStyle = "rgba(26,31,43,.3)"; g.lineWidth = 2; g.strokeRect(24, 40, w - 48, h - 96);
    g.fillStyle = "#1A1F2B"; g.font = "bold 24px ui-monospace,monospace";
    g.fillText("3.5 inch HDD  7200RPM", 44, 88);
    g.font = "14px ui-monospace,monospace"; g.fillStyle = "#4A5361";
    g.fillText("SATA 6Gb/s · 1TB", 44, 116);
    // 条码
    for (var i = 0; i < 46; i++) {
      g.fillStyle = "#1A1F2B";
      g.fillRect(44 + i * 8, 140, 2 + (i % 3) * 2, 54);
    }
    g.font = "12px ui-monospace,monospace"; g.fillStyle = "#5A636F";
    g.fillText("SN 8XK2-4471-QP", 44, 216);
    // 螺丝孔
    [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]].forEach(function (p) {
      g.fillStyle = "#8E9AA6"; g.beginPath(); g.arc(p[0], p[1], 10, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#5A636F"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(p[0] - 5, p[1]); g.lineTo(p[0] + 5, p[1]); g.stroke();
    });
  }

  /* 电源：深灰钢壳 + 风扇网 + 铭牌 */
  function drawPSU(g, w, h) {
    g.fillStyle = "#3A4350"; g.fillRect(0, 0, w, h);
    noise(g, w, h, 800, .06, true);
    // 风扇网
    var cx = w * .5, cy = h * .42, R = Math.min(w, h) * .3;
    g.fillStyle = "#2A313D"; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(180,190,200,.35)"; g.lineWidth = 2;
    for (var i = 0; i < 9; i++) {
      g.beginPath(); g.arc(cx, cy, R * (0.2 + i * 0.09), 0, Math.PI * 2); g.stroke();
    }
    for (var a = 0; a < 12; a++) {
      g.beginPath(); g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a / 12 * Math.PI * 2) * R, cy + Math.sin(a / 12 * Math.PI * 2) * R);
      g.stroke();
    }
    // 铭牌
    g.fillStyle = "#E8EAED"; g.fillRect(16, h - 78, w - 32, 60);
    g.fillStyle = "#1A1F2B"; g.font = "bold 15px ui-monospace,monospace";
    g.fillText("500W  80PLUS", 28, h - 52);
    g.font = "11px ui-monospace,monospace"; g.fillStyle = "#4A5361";
    g.fillText("+12V 38A   +5V 18A", 28, h - 32);
  }

  /* 显卡导风罩：黑壳 + 通风槽 + 品牌条 */
  function drawGPUShroud(g, w, h) {
    g.fillStyle = "#232A36"; g.fillRect(0, 0, w, h);
    noise(g, w, h, 600, .05, true);
    for (var i = 0; i < 14; i++) {
      g.fillStyle = "rgba(0,0,0,.45)";
      g.fillRect(20 + i * 34, 20, 18, h - 40);
    }
    g.fillStyle = "#FF9278"; g.fillRect(0, h * .42, w, 10);
    g.fillStyle = "rgba(255,255,255,.14)"; g.font = "bold 18px ui-monospace,monospace";
    g.fillText("GRAPHICS", 24, h - 26);
  }

  /* 拉丝金属（可带色） */
  function drawBrushed(g, w, h, base, dark) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 700; i++) {
      g.strokeStyle = "rgba(" + (dark ? "0,0,0," : "255,255,255,") + (Math.random() * .1).toFixed(3) + ")";
      g.lineWidth = 1;
      var y = Math.random() * h;
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    }
  }

  /* 冲孔网板（机箱前面板 / 侧板散热孔） */
  function drawVent(g, w, h, base) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    var step = 26;
    for (var y = step / 2; y < h; y += step) {
      for (var x = step / 2; x < w; x += step) {
        g.fillStyle = "rgba(0,0,0,.55)";
        g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,255,255,.10)";
        g.beginPath(); g.arc(x, y + 2, 5, 0, Math.PI * 2); g.fill();
      }
    }
  }

  /* 风扇正面：外框 + 扇叶 + 轴心 */
  function drawFan(g, w, h, ring, blade) {
    g.fillStyle = ring; g.fillRect(0, 0, w, h);
    var cx = w / 2, cy = h / 2, R = w * .46;
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    for (var i = 0; i < 9; i++) {
      var a0 = i / 9 * Math.PI * 2, a1 = a0 + 0.46;
      g.fillStyle = blade;
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, R * .95, a0, a1);
      g.closePath(); g.fill();
      g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 2; g.stroke();
    }
    g.fillStyle = "#2A313D"; g.beginPath(); g.arc(cx, cy, R * .26, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.arc(cx, cy, R * .12, 0, Math.PI * 2); g.fill();
    // 四角螺丝位
    [[8, 8], [w - 8, 8], [8, h - 8], [w - 8, h - 8]].forEach(function (p) {
      g.fillStyle = "rgba(0,0,0,.4)"; g.beginPath(); g.arc(p[0], p[1], 9, 0, Math.PI * 2); g.fill();
    });
  }

  /* M.2 固态：绿色窄板 + 主控 + 闪存颗粒 + 金手指 */
  function drawM2(g, w, h) {
    g.fillStyle = "#14653C"; g.fillRect(0, 0, w, h);
    noise(g, w, h, 300, .07, false);
    g.fillStyle = "#1A1F2B"; g.fillRect(w * .06, h * .18, w * .16, h * .64);   // 主控
    g.fillStyle = "#131A24"; g.fillRect(w * .28, h * .14, w * .2, h * .72);    // 闪存
    g.fillStyle = "#131A24"; g.fillRect(w * .54, h * .14, w * .2, h * .72);
    g.fillStyle = "#0B3B24"; g.fillRect(w * .78, h * .2, w * .16, h * .6);
    g.fillStyle = "#C9A227"; g.fillRect(w * .955, h * .3, w * .045, h * .4);
    g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2;
    for (var i = 0; i < 10; i++) {
      g.beginPath(); g.moveTo(w * .955, h * .3 + i * h * .04); g.lineTo(w, h * .3 + i * h * .04); g.stroke();
    }
    g.fillStyle = "#EDE9FF"; g.font = "bold 18px ui-monospace,monospace";
    g.fillText("M.2 NVMe  1TB", w * .07, h * .12);
  }

  /* 风扇（用于圆柱面，简化为环形扇叶图案） */
  function drawFanShort(g, w, h) { drawFan(g, w, h, "#3A4350", "#A995FF"); }

  /* 方形冲孔网（联想前脸 / 侧板） */
  function drawPerf(g, w, h, base, dense) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    var step = dense ? 16 : 24;
    for (var y = step / 2; y < h; y += step) {
      for (var x = step / 2; x < w; x += step) {
        g.fillStyle = "rgba(0,0,0,.72)";
        roundRect(g, x - 5, y - 5, 10, 10, 2.5); g.fill();
        g.fillStyle = "rgba(255,255,255,.06)";
        roundRect(g, x - 5, y - 3, 10, 3, 1.5); g.fill();
      }
    }
  }

  /* 六边形蜂巢网（惠普后置风扇 / 惠普前脸） */
  function drawHoneycomb(g, w, h, base, radius) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    var r = radius || 15, dx = r * 1.74, dy = r * 1.5;
    for (var row = 0, y = r; y < h + r; row++, y += dy) {
      for (var x = (row % 2 ? dx / 2 : 0) + r; x < w + dx; x += dx) {
        g.beginPath();
        for (var i = 0; i < 6; i++) {
          var a = Math.PI / 180 * (60 * i - 30);
          var px = x + r * Math.cos(a), py = y + r * Math.sin(a);
          i ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.closePath();
        g.fillStyle = "rgba(0,0,0,.78)"; g.fill();
        g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1.5; g.stroke();
      }
    }
  }

  /* 横向格栅（戴尔前脸 / 顶部散热） */
  function drawSlots(g, w, h, base, gap) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    var step = gap || 22;
    for (var y = step / 2; y < h; y += step) {
      g.fillStyle = "rgba(0,0,0,.72)";
      roundRect(g, 8, y - 3.5, w - 16, 7, 3.5); g.fill();
      g.fillStyle = "rgba(255,255,255,.06)";
      roundRect(g, 8, y - 3.5, w - 16, 2, 1); g.fill();
    }
  }

  /* 深色 PCB（联想 T560 这类黑板） */
  function drawPCBDark(g, w, h) {
    g.fillStyle = "#141A20"; g.fillRect(0, 0, w, h);
    noise(g, w, h, 800, .08, true);
    for (var i = 0; i < 60; i++) {
      var x = Math.random() * w, y = Math.random() * h;
      g.strokeStyle = "rgba(150,170,190," + (0.06 + Math.random() * 0.12).toFixed(2) + ")";
      g.lineWidth = 1 + Math.random();
      g.beginPath(); g.moveTo(x, y);
      for (var s2 = 0; s2 < 4; s2++) {
        if (Math.random() > 0.5) x += (Math.random() - 0.5) * 140; else y += (Math.random() - 0.5) * 140;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    for (var p = 0; p < 110; p++) {
      g.fillStyle = Math.random() > 0.5 ? "#C9A227" : "#9AA4AE";
      g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1.2 + Math.random() * 2, 0, Math.PI * 2); g.fill();
    }
    for (var ch = 0; ch < 20; ch++) {
      var cw = 14 + Math.random() * 52, chh = 10 + Math.random() * 30;
      var cx = Math.random() * (w - cw), cy = Math.random() * (h - chh);
      g.fillStyle = "#0A0E12"; g.fillRect(cx, cy, cw, chh);
      g.strokeStyle = "rgba(255,255,255,.10)"; g.lineWidth = 1; g.strokeRect(cx + .5, cy + .5, cw - 1, chh - 1);
    }
    g.fillStyle = "rgba(220,230,240,.42)";
    g.font = "bold 12px ui-monospace,monospace";
    ["DIMM_A1", "DIMM_B1", "PCIE_X16", "M.2_1", "SATA0", "CPU_FAN", "ATX_PWR", "T560 MB"].forEach(function (t, i) {
      g.fillText(t, 22 + (i % 4) * 240, 40 + Math.floor(i / 4) * 900);
    });
  }

  /* 内存马甲：黑色金属 + 蓝色电路纹 + 品牌条 + 标签 */
  function drawRamHeatsink(g, w, h) {
    var grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, "#2A3038"); grd.addColorStop(.45, "#3A424D"); grd.addColorStop(1, "#232830");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    noise(g, w, h, 400, .05, true);
    // 蓝色电路纹
    g.strokeStyle = "rgba(60,140,220,.55)"; g.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      g.beginPath();
      var y = 60 + i * 18;
      g.moveTo(40, y); g.lineTo(150 + i * 12, y); g.lineTo(190 + i * 12, y - 14); g.lineTo(300, y - 14);
      g.stroke();
      g.fillStyle = "rgba(80,170,255,.75)";
      g.beginPath(); g.arc(300, y - 14, 3, 0, Math.PI * 2); g.fill();
    }
    // 竖排品牌条
    g.fillStyle = "#C8D0DA";
    for (var k = 0; k < 4; k++) g.fillRect(60, 150 + k * 26, 120, 7);
    // 标签
    g.save();
    g.translate(w * .62, h * .42); g.rotate(Math.PI / 2);
    g.fillStyle = "#F2F5F8"; g.fillRect(0, 0, 220, 90);
    g.fillStyle = "#1A1F2B"; g.font = "bold 20px ui-monospace,monospace";
    g.fillText("Lenovo", 16, 32);
    g.font = "13px ui-monospace,monospace"; g.fillStyle = "#4A5361";
    g.fillText("8GB 1Rx8 PC4-3200AA", 16, 56);
    g.fillText("FRU PN:5M30V06967", 16, 76);
    g.restore();
    // 金手指
    g.fillStyle = "#C9A227"; g.fillRect(0, h - 30, w, 30);
    g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2;
    for (var p2 = 0; p2 < 26; p2++) { g.beginPath(); g.moveTo(p2 * (w / 26), h - 30); g.lineTo(p2 * (w / 26), h); g.stroke(); }
  }

  /* 电池：外壳 + 警示标签 */
  function drawBattery(g, w, h) {
    g.fillStyle = "#0F766E"; g.fillRect(0, 0, w, h);
    noise(g, w, h, 300, .05, true);
    g.strokeStyle = "rgba(255,255,255,.16)"; g.lineWidth = 2;
    for (var i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, h * i / 5); g.lineTo(w, h * i / 5); g.stroke(); }
    g.fillStyle = "#F2F7F5"; g.fillRect(w * .12, h * .28, w * .76, h * .44);
    g.fillStyle = "#0F766E"; g.font = "bold 20px ui-monospace,monospace";
    g.fillText("Li-ion  BATTERY", w * .15, h * .42);
    g.font = "13px ui-monospace,monospace"; g.fillStyle = "#2F6B64";
    g.fillText("51Wh  11.4V", w * .15, h * .52);
    g.fillStyle = "#B23E1C"; g.font = "bold 12px ui-monospace,monospace";
    g.fillText("DO NOT PUNCTURE", w * .15, h * .62);
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
    state.fadeSoft = [];

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
    addMesh(batG, new THREE.BoxGeometry(19.6, 0.74, 8.8), texMat("battery", 1024, 460, drawBattery), [0, 0.8, 3.4], { partId: "battery" });
    addMesh(batG, new THREE.BoxGeometry(6.0, 0.34, 7.4), flatMat("#B9EEDC"), [-5.6, 1.34, 3.4], { partId: "battery" });
    addMesh(batG, new THREE.BoxGeometry(6.0, 0.34, 7.4), flatMat("#B9EEDC"), [5.6, 1.34, 3.4], { partId: "battery" });
    root.add(batG);
    registerPart("battery", batG);

    var mbG = new THREE.Group();
    addMesh(mbG, new THREE.BoxGeometry(20.6, 0.24, 7.8), texMat("pcb", 1024, 512, drawPCB), [0, 0.62, -6.4], { partId: "mainboard" });
    [[-8.4, -7.6], [-5.6, -4.2], [2.2, -4.0], [9.0, -7.8], [9.6, -4.4]].forEach(function (p, i) {
      addMesh(mbG, new THREE.BoxGeometry(1.1 + (i % 2) * 0.7, 0.34, 1.0), flatMat("#0B5F58"), [p[0], 0.9, p[1]], { partId: "mainboard", edges: false });
    });
    root.add(mbG);
    registerPart("mainboard", mbG);

    var cpuG = new THREE.Group();
    addMesh(cpuG, new THREE.BoxGeometry(3.4, 0.26, 3.4), texMat("chip", 512, 512, drawChip), [5.6, 0.86, -7.4], { partId: "cpu" });
    addMesh(cpuG, new THREE.BoxGeometry(4.8, 0.48, 4.8), flatMat("#D6D0C2"), [5.6, 1.24, -7.4], { partId: "cpu" });
    addMesh(cpuG, new THREE.BoxGeometry(7.6, 0.26, 0.92), flatMat("#C98B5E"), [1.4, 1.32, -7.4], { partId: "cpu", edges: false });
    addMesh(cpuG, new THREE.BoxGeometry(7.6, 0.26, 0.92), flatMat("#C98B5E"), [1.4, 1.32, -5.4], { partId: "cpu", edges: false });
    root.add(cpuG);
    registerPart("cpu", cpuG);

    var fanG = new THREE.Group();
    addMesh(fanG, new THREE.CylinderGeometry(2.95, 2.95, 0.44, 30), texMat("fan", 512, 512, drawFanShort), [-6.4, 0.94, -7.4], { partId: "fan" });
    addMesh(fanG, new THREE.CylinderGeometry(2.6, 2.6, 0.16, 26), flatMat("#A995FF"), [-6.4, 1.17, -7.4], { partId: "fan", edges: false });
    for (var b = 0; b < 7; b++) {
      var ang = (b / 7) * Math.PI * 2;
      addMesh(fanG, new THREE.BoxGeometry(2.1, 0.08, 0.7), flatMat("#EDE9FF"),
        [-6.4 + Math.cos(ang) * 1.35, 1.24, -7.4 + Math.sin(ang) * 1.35], { rot: [0, -ang, 0], partId: "fan", edges: false });
    }
    root.add(fanG);
    registerPart("fan", fanG);

    var ramG = new THREE.Group();
    addMesh(ramG, new THREE.BoxGeometry(7.6, 0.34, 1.5), texMat("ram", 1024, 256, drawRAM), [6.4, 0.88, -2.9], { partId: "ram" });
    addMesh(ramG, new THREE.BoxGeometry(7.6, 0.34, 1.5), texMat("ram", 1024, 256, drawRAM), [6.4, 0.88, -1.0], { partId: "ram" });
    root.add(ramG);
    registerPart("ram", ramG);

    var ssdG = new THREE.Group();
    addMesh(ssdG, new THREE.BoxGeometry(8.2, 0.34, 2.6), texMat("m2ssd", 1024, 320, drawM2), [6.2, 0.88, 2.0], { partId: "ssd" });
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

  var BRAND = {
    lenovo: { badge: "#E2231A", bezel: "#1B1F25", chassis: "#1A1E24", accent: "#E2231A", face: "lenovo", glass: true,  psuTop: true  },
    dell:   { badge: "#0672CB", bezel: "#1E232A", chassis: "#232830", accent: "#0672CB", face: "dell",   glass: false, psuTop: false },
    hp:     { badge: "#0096D6", bezel: "#2A3038", chassis: "#3C434D", accent: "#0096D6", face: "hp",     glass: false, psuTop: true  }
  };

  /* 三家的内部布局差异——这是「爆炸图不能长得一样」的关键：
     · 联想 刃7000K：标准 ATX 思路，塔式侧吹散热，前后直通风道，电源上置，底部硬盘笼
     · 戴尔 OptiPlex：定制主板更靠前，下压式散热 + 塑料导风罩，硬盘笼可上翻，电源下置，无光驱位
     · 惠普 ProDesk：主板靠后，下压式散热 + 前置进风道，前置抽拉硬盘（绿卡扣），电源上置，保留光驱位 */
  var LAYOUT = {
    lenovo: {
      boardY: 23.5, boardZ: -2.5, boardH: 27,
      cpuY: 27.0, cpuZ: -6.5, cooler: "tower",
      gpuY: 15.2, gpuZ: 1.5,
      hddY: 5.0, hddZ: 12.5, hddTilt: 0, hddRail: "#2F7BD8",
      oddY: 35.0, oddZ: 6.5, hasOdd: true,
      duct: false, frontDuct: false
    },
    dell: {
      boardY: 22.0, boardZ: -3.6, boardH: 25,
      cpuY: 25.4, cpuZ: -7.6, cooler: "down",
      gpuY: 13.4, gpuZ: 2.4,
      hddY: 8.2, hddZ: 8.4, hddTilt: -0.32, hddRail: "#2F7BD8",
      oddY: 32.6, oddZ: 3.0, hasOdd: false,
      duct: true, frontDuct: false
    },
    hp: {
      boardY: 24.4, boardZ: -1.0, boardH: 26,
      cpuY: 27.8, cpuZ: -4.4, cooler: "down",
      gpuY: 16.0, gpuZ: 0.6,
      hddY: 5.2, hddZ: 13.4, hddTilt: 0, hddRail: "#3DBE54",
      oddY: 35.0, oddZ: 7.0, hasOdd: true,
      duct: false, frontDuct: true
    }
  };

  /* 机箱前脸：三个品牌各是一种「一眼能认出」的开孔方式
     · 联想 刃7000K：大面积方形冲孔网 + 左侧竖向 I/O 条
     · 戴尔 OptiPlex：横向格栅 + 中部银色腰带 + 圆形徽标
     · 惠普 Pavilion：蜂巢/六边形孔 + 左侧银色竖条 + 顶部光驱挡板 */
  function frontFaceTexture(brand) {
    if (brand.face === "lenovo") return { key: "face-lenovo", draw: function (g, w, h) { drawPerf(g, w, h, "#1A1E24", false); } };
    if (brand.face === "hp")     return { key: "face-hp",     draw: function (g, w, h) { drawHoneycomb(g, w, h, "#2A3038", 8); } };
    return { key: "face-dell", draw: function (g, w, h) { drawSlots(g, w, h, "#1E232A"); } };
  }

  function buildTower(brandId) {
    var B = BRAND[brandId] || BRAND.lenovo;
    var root = new THREE.Group();
    var wall = flatMat(B.chassis);
    state.fadeMats = [wall];
    state.fadeSoft = [];

    /* ---------- 机箱骨架：五块薄板围出框架，右侧敞开 ---------- */
    addMesh(root, new THREE.BoxGeometry(0.7, T.H, T.D), wall, [-T.W / 2 + 0.35, T.H / 2, 0]);
    addMesh(root, new THREE.BoxGeometry(T.W, 0.7, T.D), wall, [0, T.H - 0.35, 0]);
    addMesh(root, new THREE.BoxGeometry(T.W, 0.7, T.D), wall, [0, 0.35, 0]);
    addMesh(root, new THREE.BoxGeometry(T.W, T.H, 0.7), wall, [0, T.H / 2, -T.D / 2 + 0.35]);

    /* ---------- 顶部散热孔 ---------- */
    addMesh(root, new THREE.BoxGeometry(T.W - 2.2, 0.05, 16),
      texMat("topVent", 512, 512, function (g, w, h) { drawSlots(g, w, h, B.chassis, 14); }, {}),
      [0.4, T.H - 0.02, -6], { edges: false });

    /* ---------- 后部：I/O 挡板 + 扩展槽挡片 + 六边形风扇网 ---------- */
    var rearG = new THREE.Group();
    var zr = -T.D / 2 + 0.72;
    addMesh(rearG, new THREE.BoxGeometry(6.6, 4.6, 0.12), flatMat("#8E959E"), [-4.4, 31, zr], { edges: false });
    // 主板后置接口（色块表达：USB 蓝/黑、网口、音频）
    [[-6.6, 32.4, "#1B4F9C"], [-6.6, 31.4, "#1B4F9C"], [-5.4, 32.4, "#2A3038"], [-5.4, 31.4, "#2A3038"],
     [-4.2, 32.4, "#2B6B2F"], [-4.2, 31.4, "#8E959E"]].forEach(function (p) {
      addMesh(rearG, new THREE.BoxGeometry(0.85, 0.62, 0.16), flatMat(p[2]), [p[0], p[1], zr + 0.06], { edges: false });
    });
    // 扩展槽挡片
    for (var sl = 0; sl < 6; sl++) {
      addMesh(rearG, new THREE.BoxGeometry(11.6, 1.65, 0.14), flatMat("#7A828C"),
        [3.4, 12 + sl * 1.75, zr], { edges: true });
    }
    // 后置风扇六边形网
    addMesh(rearG, new THREE.CylinderGeometry(5.0, 5.0, 0.1, 26),
      texMat("hexRear", 512, 512, function (g, w, h) { drawHoneycomb(g, w, h, "#151A20", 14); }, {}),
      [-4.5, 30, T.D / -2 + 0.76], { rot: [Math.PI / 2, 0, 0], edges: false });
    root.add(rearG);

    /* ---------- 侧板：联想是玻璃（能直接看到内部），戴尔/惠普是冲孔钢板 ---------- */
    var sideG = new THREE.Group();
    if (B.glass) {
      var glassMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color("#243040"), transparent: true, opacity: 0.34, depthWrite: false
      });
      glassMat.userData.baseOpacity = 0.34;
      addMesh(sideG, new THREE.BoxGeometry(0.28, T.H - 1.0, T.D - 1.0), glassMat,
        [T.W / 2 - 0.2, T.H / 2, 0], { partId: "side-panel" });
      // 玻璃边缘的金属包边
      var rim = flatMat("#151A20");
      addMesh(sideG, new THREE.BoxGeometry(0.34, 1.2, T.D - 1.0), rim, [T.W / 2 - 0.18, 2.2, 0], { partId: "side-panel", edges: false });
      addMesh(sideG, new THREE.BoxGeometry(0.34, 1.2, T.D - 1.0), rim, [T.W / 2 - 0.18, T.H - 2.2, 0], { partId: "side-panel", edges: false });
    } else {
      addMesh(sideG, new THREE.BoxGeometry(0.7, T.H - 0.8, T.D - 0.8),
        texMat("sideSteel", 512, 512, function (g, w, h) { drawPerf(g, w, h, "#3A414B", true); }, {}),
        [T.W / 2 - 0.35, T.H / 2, 0], { partId: "side-panel" });
      // 免工具拉手
      addMesh(sideG, new THREE.BoxGeometry(0.9, 3.2, 5.2), flatMat("#2A3038"),
        [T.W / 2 - 0.1, T.H - 5, -14], { partId: "side-panel" });
    }
    root.add(sideG);
    registerPart("side-panel", sideG);
    parts["side-panel"].mats.forEach(function (m) {
      if (m.userData.baseOpacity) state.fadeSoft.push(m);
    });

    /* ---------- 前面板 ---------- */
    var bezG = new THREE.Group();
    var zf = T.D / 2 - 0.6;
    addMesh(bezG, new THREE.BoxGeometry(T.W - 0.4, T.H - 0.8, 1.2),
      texMat("bezelMetal", 512, 512, function (g, w, h) { drawBrushed(g, w, h, B.bezel, true); }, {}),
      [0, T.H / 2, zf], { partId: "front-bezel" });

    var ff = frontFaceTexture(B);
    // 前脸开孔面板（贴在前面板正面）
    addMesh(bezG, new THREE.BoxGeometry(T.W - 2.6, B.face === "hp" ? 20 : 24, 0.14),
      texMat(ff.key, 512, 512, ff.draw, {}),
      [B.face === "lenovo" ? 0.9 : 0, B.face === "hp" ? 19 : 22, zf + 0.62], { partId: "front-bezel", edges: false });

    if (B.face === "lenovo") {
      // 左侧竖向 I/O 条 + 底部电源键
      addMesh(bezG, new THREE.BoxGeometry(1.9, 12, 0.2), flatMat("#101418"), [-7.2, 26, zf + 0.64], { partId: "front-bezel", edges: false });
      [[-7.2, 30.5], [-7.2, 28.9]].forEach(function (p) {
        addMesh(bezG, new THREE.BoxGeometry(1.0, 0.55, 0.24), flatMat("#2B3038"), [p[0], p[1], zf + 0.72], { partId: "front-bezel", edges: false });
      });
      addMesh(bezG, new THREE.BoxGeometry(0.9, 0.5, 0.24), flatMat("#2B3038"), [-7.2, 26.4, zf + 0.72], { partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.CylinderGeometry(0.85, 0.85, 0.32, 20), flatMat("#C8CDD6"),
        [-7.2, 5.6, zf + 0.66], { rot: [Math.PI / 2, 0, 0], partId: "front-bezel", edges: false });
      // 左上红色徽标带
      addMesh(bezG, new THREE.BoxGeometry(0.9, 6.4, 0.16), flatMat(B.accent), [-7.2, 18, zf + 0.66], { partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.BoxGeometry(4.2, 1.0, 0.16), flatMat("#E7E9EC"), [-4.6, 34.4, zf + 0.64], { partId: "front-bezel", edges: false });
    } else if (B.face === "hp") {
      // 左侧银色竖条 + 顶部光驱挡板 + 上部 I/O
      addMesh(bezG, new THREE.BoxGeometry(3.0, 34, 0.2), flatMat("#9AA2AC"), [-6.9, 20, zf + 0.64], { partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.BoxGeometry(14.6, 4.0, 0.24), flatMat("#22282F"), [1.0, 33.6, zf + 0.66], { partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.BoxGeometry(14.6, 4.0, 0.24), flatMat("#22282F"), [1.0, 28.4, zf + 0.66], { partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.BoxGeometry(2.6, 1.0, 0.22), flatMat("#2B3038"), [-5.4, 35.6, zf + 0.74], { partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.CylinderGeometry(0.8, 0.8, 0.3, 18), flatMat("#C8CDD6"),
        [-2.4, 35.6, zf + 0.7], { rot: [Math.PI / 2, 0, 0], partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.BoxGeometry(2.2, 1.6, 0.16), flatMat(B.badge), [4.6, 35.4, zf + 0.7], { partId: "front-bezel", edges: false });
    } else {
      // 戴尔：中部银色腰带 + 圆形徽标 + 顶部 I/O
      addMesh(bezG, new THREE.BoxGeometry(16.4, 3.2, 0.2), flatMat("#9AA2AC"), [0, 24.6, zf + 0.64], { partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.CylinderGeometry(1.8, 1.8, 0.24, 22), flatMat(B.badge),
        [0, 24.6, zf + 0.76], { rot: [Math.PI / 2, 0, 0], partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.BoxGeometry(3.4, 0.9, 0.2), flatMat("#2B3038"), [-5.6, 35.2, zf + 0.7], { partId: "front-bezel", edges: false });
      addMesh(bezG, new THREE.CylinderGeometry(0.8, 0.8, 0.3, 18), flatMat("#C8CDD6"),
        [-2.6, 35.2, zf + 0.72], { rot: [Math.PI / 2, 0, 0], partId: "front-bezel", edges: false });
    }
    root.add(bezG);
    registerPart("front-bezel", bezG);

    /* ---------- 内部布局：三家不一样，按 LAYOUT 取参数 ---------- */
    var L = LAYOUT[brandId] || LAYOUT.lenovo;
    var mbx = -T.W / 2 + 1.1;
    var dY = L.boardY - 23.5, dZ = L.boardZ + 2.5;

    /* ---------- 主板（深色 PCB，带插槽、电容、芯片组散热片、M.2 散热片） ---------- */
    var mbG = new THREE.Group();
    addMesh(mbG, new THREE.BoxGeometry(0.55, L.boardH, 23),
      texMat("pcbDark", 1024, 1024, drawPCBDark), [mbx, L.boardY, L.boardZ], { partId: "mainboard" });
    // PCIe x16 槽
    addMesh(mbG, new THREE.BoxGeometry(1.0, 1.1, 12), flatMat("#1A1F27"), [mbx + 0.6, 15.2 + dY, 1.5 + dZ], { partId: "mainboard", edges: false });
    // DIMM 插槽 ×4
    for (var d = 0; d < 4; d++) {
      addMesh(mbG, new THREE.BoxGeometry(1.1, 0.5, 13), flatMat("#20262E"),
        [mbx + 0.55, 13.6 + dY, 2.5 + dZ], { partId: "mainboard", edges: false });
    }
    // 芯片组散热片 + M.2 散热片
    addMesh(mbG, new THREE.BoxGeometry(0.8, 6, 6), flatMat("#161A20"), [mbx + 0.9, 18.5 + dY, 6.5 + dZ], { partId: "mainboard" });
    addMesh(mbG, new THREE.BoxGeometry(0.7, 3.0, 9), flatMat("#161A20"), [mbx + 0.9, 25.5 + dY, 5.5 + dZ], { partId: "mainboard" });
    addMesh(mbG, new THREE.BoxGeometry(0.05, 0.8, 5.5), flatMat("#C8CDD6"), [mbx + 1.28, 25.5 + dY, 5.5 + dZ], { partId: "mainboard", edges: false });
    // 电容
    for (var cp = 0; cp < 10; cp++) {
      addMesh(mbG, new THREE.CylinderGeometry(0.62, 0.62, 1.7, 12), flatMat("#2C333C"),
        [mbx + 1.0, 11 + (cp % 5) * 1.2 + dY, -10 + Math.floor(cp / 5) * 3.4 + dZ],
        { rot: [0, 0, Math.PI / 2], partId: "mainboard", edges: false });
    }
    // 24pin 供电口
    addMesh(mbG, new THREE.BoxGeometry(1.2, 4.2, 1.6), flatMat("#D8DEE6"), [mbx + 1.0, 10.5 + dY, 8.5 + dZ], { partId: "mainboard", edges: false });
    root.add(mbG);
    registerPart("mainboard", mbG);

    /* ---------- CPU + 散热器：联想塔式侧吹，戴尔/惠普下压式 ---------- */
    var cpuG = new THREE.Group();
    var cx = mbx + 0.9, cy = L.cpuY, cz = L.cpuZ;
    addMesh(cpuG, new THREE.BoxGeometry(0.5, 5.4, 5.4), flatMat("#3A4048"), [cx, cy, cz], { partId: "cpu" });

    if (L.cooler === "tower") {
      // 塔式：底座 + 22 片鳍片 + 4 热管端头 + 侧挂风扇
      addMesh(cpuG, new THREE.BoxGeometry(7.4, 1.0, 7.4), flatMat("#B9BFC7"), [cx + 3.7, cy - 1.8, cz], { partId: "cpu" });
      for (var fin = 0; fin < 22; fin++) {
        addMesh(cpuG, new THREE.BoxGeometry(6.6, 0.16, 7.0), flatMat(fin % 2 ? "#AEB4BC" : "#C4CAD2"),
          [cx + 3.7, cy - 0.6 + fin * 0.46, cz], { partId: "cpu", edges: false });
      }
      for (var hpp = 0; hpp < 4; hpp++) {
        addMesh(cpuG, new THREE.CylinderGeometry(0.32, 0.32, 8.2, 10), flatMat("#C98B5E"),
          [cx + 3.7, cy - 1.1, cz - 2.7 + hpp * 1.75], { rot: [Math.PI / 2, 0, 0], partId: "cpu", edges: false });
      }
      addMesh(cpuG, new THREE.BoxGeometry(1.0, 7.0, 7.0),
        texMat("cpuFan", 256, 256, function (g, w, h) { drawFan(g, w, h, "#20262E", "#3E4753"); }, {}),
        [cx + 7.7, cy + 3.5, cz], { partId: "cpu" });
    } else {
      // 下压式（品牌机常见）：矮散热块 + 放射状鳍片 + 顶置风扇
      addMesh(cpuG, new THREE.BoxGeometry(9.6, 0.5, 9.6), flatMat("#C4CAD2"), [cx + 4.4, cy - 1.7, cz], { partId: "cpu" });
      for (var rf = 0; rf < 15; rf++) {
        addMesh(cpuG, new THREE.BoxGeometry(0.3, 3.0, 9.0), flatMat(rf % 2 ? "#AEB4BC" : "#C9CFD6"),
          [cx + 0.3 + rf * 0.62, cy - 0.1, cz], { partId: "cpu", edges: false });
      }
      addMesh(cpuG, new THREE.BoxGeometry(9.6, 1.3, 9.6),
        texMat("cpuFanDown", 256, 256, function (g, w, h) { drawFan(g, w, h, "#20262E", "#39414C"); }, {}),
        [cx + 4.4, cy + 1.9, cz], { partId: "cpu" });
      // 四角固定柱
      [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]].forEach(function (o) {
        addMesh(cpuG, new THREE.CylinderGeometry(0.28, 0.28, 3.4, 8), flatMat("#8E959E"),
          [cx + 4.4 + o[0], cy + 0.1, cz + o[1]], { partId: "cpu", edges: false });
      });
    }

    // 戴尔：后置风扇 → CPU 的塑料导风罩（这是戴尔塔式最标志性的一件东西）
    if (L.duct) {
      var ductMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color("#232A33"), transparent: true, opacity: 0.52, side: THREE.DoubleSide
      });
      ductMat.userData.baseOpacity = 0.52;
      addMesh(cpuG, new THREE.BoxGeometry(12.0, 9.2, 12.4), ductMat,
        [cx + 3.6, cy + 1.2, cz - 6.4], { partId: "cpu" });
      state.fadeSoft.push(ductMat);
    }
    // 惠普：前部进风道（把冷风从前面板引到 CPU）
    if (L.frontDuct) {
      addMesh(cpuG, new THREE.BoxGeometry(13.0, 1.2, 16.0), flatMat("#2A3038"),
        [cx + 5.0, cy + 5.2, cz + 9.0], { partId: "cpu", edges: true });
      addMesh(cpuG, new THREE.BoxGeometry(13.0, 6.0, 0.8), flatMat("#2A3038"),
        [cx + 5.0, cy + 2.4, cz + 16.6], { partId: "cpu", edges: true });
    }
    root.add(cpuG);
    registerPart("cpu", cpuG);
    parts["cpu"].mats.forEach(function (m) { if (m.userData.baseOpacity) state.fadeSoft.push(m); });

    /* ---------- 内存（黑色马甲 + 蓝色丝印） ---------- */
    var ramG = new THREE.Group();
    [-1.0, 1.4].forEach(function (zz) {
      addMesh(ramG, new THREE.BoxGeometry(3.4, 13.2, 1.0),
        texMat("ramHS", 512, 1024, drawRamHeatsink), [mbx + 2.4, L.boardY + 3.5, 1.6 + dZ + zz * 1.1], { partId: "ram" });
    });
    root.add(ramG);
    registerPart("ram", ramG);

    /* ---------- 独立显卡（双风扇 + 导风罩 + 热管） ---------- */
    var gpuG = new THREE.Group();
    var gx = -2.4, gy = L.gpuY, gz = L.gpuZ;
    addMesh(gpuG, new THREE.BoxGeometry(11.4, 0.8, 24), flatMat("#161A20"), [gx, gy, gz], { partId: "gpu" });
    addMesh(gpuG, new THREE.BoxGeometry(11.0, 3.6, 23.4),
      texMat("gpuShroud2", 1024, 512, drawGPUShroud), [gx, gy - 2.0, gz], { partId: "gpu" });
    [-7.0, 7.0].forEach(function (zz) {
      addMesh(gpuG, new THREE.CylinderGeometry(4.6, 4.6, 0.5, 24),
        texMat("gpuFan", 256, 256, function (g, w, h) { drawFan(g, w, h, "#20262E", "#2E3540"); }, {}),
        [gx + 2.0, gy - 3.9, gz + zz], { rot: [Math.PI / 2, 0, 0], partId: "gpu", edges: false });
    });
    addMesh(gpuG, new THREE.BoxGeometry(0.3, 5.2, 12), flatMat("#8E959E"), [gx - 5.7, gy - 1.4, gz], { partId: "gpu" });
    for (var gh = 0; gh < 3; gh++) {
      addMesh(gpuG, new THREE.CylinderGeometry(0.28, 0.28, 22, 8), flatMat("#C98B5E"),
        [gx + 4.6, gy - 1.0, gz], { rot: [Math.PI / 2, 0, 0], partId: "gpu", edges: false });
    }
    root.add(gpuG);
    registerPart("gpu", gpuG);

    /* ---------- 机械硬盘：联想底部笼 / 戴尔可上翻笼 / 惠普前置抽拉（绿卡扣） ---------- */
    var hddG = new THREE.Group();
    var hx = brandId === "hp" ? 0.6 : (brandId === "dell" ? 1.6 : 0.6);
    addMesh(hddG, new THREE.BoxGeometry(10, 2.6, 14.7),
      texMat("hdd", 1024, 512, drawHDD), [hx, L.hddY, L.hddZ], { partId: "hdd" });
    // 免工具卡扣（戴尔是蓝色快拆，惠普是绿色）
    addMesh(hddG, new THREE.BoxGeometry(1.2, 1.6, 3.0), flatMat(L.hddRail), [hx - 5.0, L.hddY + 0.4, L.hddZ - 6.3], { partId: "hdd", edges: false });
    addMesh(hddG, new THREE.BoxGeometry(1.2, 1.6, 3.0), flatMat(L.hddRail), [hx + 5.0, L.hddY + 0.4, L.hddZ - 6.3], { partId: "hdd", edges: false });
    // 笼/托架
    addMesh(hddG, new THREE.BoxGeometry(11.6, 0.5, 16), flatMat("#2A3038"), [hx, L.hddY - 1.6, L.hddZ], { partId: "hdd", edges: false });
    if (brandId === "dell") {
      // 上翻式：笼体带转轴，整体略微倾斜，和联想/惠普的固定笼区分开
      addMesh(hddG, new THREE.BoxGeometry(11.6, 6.4, 0.5), flatMat("#333A44"), [hx, L.hddY + 1.6, L.hddZ + 7.4], { partId: "hdd", edges: false });
      hddG.rotation.x = L.hddTilt;
    } else if (brandId === "hp") {
      // 抽拉式：前方两个绿色导轨卡子
      addMesh(hddG, new THREE.BoxGeometry(1.4, 3.2, 12), flatMat(L.hddRail), [hx - 5.6, L.hddY + 0.2, L.hddZ], { partId: "hdd", edges: false });
      addMesh(hddG, new THREE.BoxGeometry(11.8, 1.2, 1.0), flatMat("#2A3038"), [hx, L.hddY + 1.4, L.hddZ + 7.6], { partId: "hdd", edges: false });
    }
    root.add(hddG);
    registerPart("hdd", hddG);

    /* ---------- 固态硬盘（M.2 条） ---------- */
    var ssdG = new THREE.Group();
    addMesh(ssdG, new THREE.BoxGeometry(8.0, 0.8, 2.2),
      texMat("m2ssd2", 1024, 320, drawM2), [0.6, L.hddY + 4.4, L.hddZ], { partId: "ssd" });
    root.add(ssdG);
    registerPart("ssd", ssdG);

    /* ---------- 电源 + 线束 ---------- */
    var psuG = new THREE.Group();
    var psuY = B.psuTop ? 33.5 : 6.6;
    addMesh(psuG, new THREE.BoxGeometry(15, 8.6, 14),
      texMat("psuCase", 1024, 512, drawPSU), [0, psuY, -13], { partId: "psu" });
    addMesh(psuG, new THREE.CylinderGeometry(3.6, 3.6, 0.3, 22),
      texMat("psuGrille", 256, 256, function (g, w, h) { drawHoneycomb(g, w, h, "#22282F", 10); }, {}),
      [0, psuY, -5.9], { rot: [Math.PI / 2, 0, 0], partId: "psu", edges: false });
    // 线束：24pin + 显卡供电
    addMesh(psuG, new THREE.BoxGeometry(1.6, 1.6, 14), flatMat("#1A1F27"), [5.6, psuY - 1, -8], { partId: "psu", edges: false });
    addMesh(psuG, new THREE.BoxGeometry(1.2, 1.2, 18), flatMat("#1A1F27"), [4.2, psuY - 3, -6], { partId: "psu", edges: false });
    root.add(psuG);
    registerPart("psu", psuG);

    /* ---------- 机箱风扇 ---------- */
    var fanG = new THREE.Group();
    var fanY = B.psuTop ? 17 : 30;
    addMesh(fanG, new THREE.CylinderGeometry(5.2, 5.2, 1.4, 26),
      texMat("caseFan2", 512, 512, function (g, w, h) { drawFan(g, w, h, "#1E242B", "#39414C"); }, {}),
      [-4.5, fanY, -20], { rot: [Math.PI / 2, 0, 0], partId: "case-fan" });
    root.add(fanG);
    registerPart("case-fan", fanG);

    /* ---------- 光驱位 / 扩展位：联想与惠普保留 5.25 位，戴尔已取消，改成第二硬盘托架 ---------- */
    var oddG = new THREE.Group();
    if (L.hasOdd) {
      addMesh(oddG, new THREE.BoxGeometry(14.6, 4.2, 17), flatMat("#252B33"), [-1, L.oddY, L.oddZ], { partId: "odd" });
      addMesh(oddG, new THREE.BoxGeometry(13.2, 0.5, 15.6), flatMat("#313842"), [-1, L.oddY + 2.2, L.oddZ], { partId: "odd", edges: false });
      addMesh(oddG, new THREE.BoxGeometry(13.0, 3.4, 0.4), flatMat("#2A3038"), [1.0, L.oddY, L.oddZ + 8.4], { partId: "odd", edges: false });
    } else {
      addMesh(oddG, new THREE.BoxGeometry(13.2, 0.6, 15.0), flatMat("#333A44"), [0, L.oddY, L.oddZ], { partId: "odd" });
      addMesh(oddG, new THREE.BoxGeometry(10.0, 2.6, 14.0), texMat("hdd", 1024, 512, drawHDD), [0, L.oddY + 2.0, L.oddZ], { partId: "odd" });
      addMesh(oddG, new THREE.BoxGeometry(11.0, 0.6, 1.2), flatMat("#333A44"), [0, L.oddY + 3.6, L.oddZ - 7.0], { partId: "odd", edges: false });
    }
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
      (cfg.links && cfg.links.length ? '<div class="hw-panel__block"><h4>相关排障教程</h4><div class="hw-panel__links">' +
        cfg.links.map(function (l) {
          return '<a class="hw-link" href="' + l.href + '">' + esc(l.label) + '<span aria-hidden="true">→</span></a>';
        }).join("") + "</div></div>" : "") +
      sopBlock(cfg.id);
  }

  /* 按当前机型给出拆装 SOP 直达：零件级 + 机型总览两条 */
  function sopBlock(partId) {
    var dev = device();
    var S = window.FX_SOP || {};
    var part = (S.map && S.map[partId]) || null;
    var over = (S.overview && S.overview[dev.id]) || S.default;
    var rows = [];
    if (part) rows.push({ href: part.href, label: part.label, kind: "part" });
    // 同一篇文章不重复出现：零件级链接已经更具体，就不再叠一条总览
    if (over && (!part || over.href !== part.href)) {
      rows.push({ href: over.href, label: over.label, kind: "overview" });
    }
    if (!rows.length) return "";
    return '<div class="hw-sop">' +
      '<p class="hw-sop__label">按机型 · 拆装 SOP <span class="hw-sop__model">' + esc(dev.name) + (dev.sub ? " " + esc(dev.sub.split(" · ")[0]) : "") + '</span></p>' +
      rows.map(function (r) {
        return '<a class="hw-sop__link" href="' + r.href + '">' + esc(r.label) + '<span aria-hidden="true">→</span></a>';
      }).join("") +
      '<p class="hw-sop__hint">换件前先核对本机型的非标件说明（电源针脚、前置排线），再动手。</p>' +
      '</div>';
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

    // 机箱骨架与侧板随分解淡出（否则深色大板会把内部零件全挡住）
    (state.fadeMats || []).forEach(function (m) {
      m.transparent = true;
      m.opacity = 1 - 0.93 * state.explodeT;
      m.depthWrite = state.explodeT < 0.3;
    });
    (state.fadeSoft || []).forEach(function (m) {
      m.transparent = true;
      m.opacity = 1 - 0.62 * state.explodeT;
      m.depthWrite = state.explodeT < 0.3;
    });

    applyCamera();
    renderer.render(scene, camera);
  }

  /* 全屏舞台时，右侧悬浮窗会盖住画面一部分。
     用相机视口偏移把模型整体往左推半个面板宽，模型就不会躲在面板后面，
     比「缩小模型」更划算——画面利用率更高。 */
  function applyViewOffset() {
    if (!camera || !renderer) return;
    var el2 = renderer.domElement;
    var w = el2.clientWidth, h = el2.clientHeight;
    var panelW = 0;
    if (window.innerWidth > 1120 && state.windowOpen !== false) panelW = 372;
    if (panelW && w > 760) {
      camera.setViewOffset(w, h, panelW / 2, 0, w, h);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  }

  function resize() {
    if (!renderer || !el.stage) return;
    var r = el.stage.getBoundingClientRect();
    var w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    applyViewOffset();
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
    el.window = document.getElementById("hw-window");
    el.windowClose = document.getElementById("hw-window-close");
    el.windowOpen = document.getElementById("hw-window-open");

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

    // 悬浮详情窗：收起 / 展开
    function setWindowOpen(open) {
      if (!el.window) return;
      el.window.classList.toggle("is-hidden", !open);
      if (el.windowOpen) el.windowOpen.hidden = !!open;
      state.windowOpen = !!open;
      // 收起后把画面重新居中
      requestAnimationFrame(applyViewOffset);
    }
    if (el.windowClose) el.windowClose.addEventListener("click", function () { setWindowOpen(false); if (el.windowOpen) el.windowOpen.focus(); });
    if (el.windowOpen) el.windowOpen.addEventListener("click", function () { setWindowOpen(true); });

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