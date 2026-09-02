/* ============================================================
   drift-wall.js — 行迹 · 记忆画廊（React DriftWall 的 vanilla 移植）
   原型：倾斜 3D 照片墙 + 相邻列反向无限漂移 + 指针视差 + 悬停点亮
   用法：
     <div class="drift-wall" data-drift-wall='{ "columns": 5, "items": [...] }'></div>
   配置（均可省略，见 DEFAULTS）：columns / tileWidth / tileHeight / gap /
     radius / tilt / turn / roll / perspective / depth / speed / direction /
     variance / parallax / pauseOnHover / dim / fade / grayscale / overlay / items
   与原型的差异：
     - 悬停点亮走 CSS :hover/:focus-visible，不再逐帧 elementFromPoint
     - 离开视口 / 切后台自动停帧；prefers-reduced-motion 时完全静止
   ============================================================ */
(function () {
  "use strict";

  var DEFAULTS = {
    columns: 5,
    tileWidth: 240,
    tileHeight: 158,
    gap: 18,
    tilt: 14,
    turn: -12,
    roll: 0,
    perspective: 1200,
    depth: 120,
    speed: 36,
    direction: "up",
    variance: 0.45,
    parallax: 0.6,
    pauseOnHover: false,
    dim: 0.55,
    fade: 0.55,
    grayscale: false,
    overlay: "#180a14"
  };

  function columnFactor(index, variance) {
    var pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
    return 1 + variance * pseudo;
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function DriftWall(root) {
    var config = {};
    try {
      var raw = root.getAttribute("data-drift-wall");
      if (raw) config = JSON.parse(raw);
    } catch (err) {
      if (window.console) console.warn("drift-wall: 配置解析失败", err);
    }
    var options = {};
    Object.keys(DEFAULTS).forEach(function (key) {
      options[key] = config[key] !== undefined ? config[key] : DEFAULTS[key];
    });
    var items = Array.isArray(config.items) && config.items.length
      ? config.items
      : [];

    var plane = root.querySelector(".drift-wall__plane");
    if (!plane) {
      plane = document.createElement("div");
      plane.className = "drift-wall__plane";
      root.appendChild(plane);
    }
    if (!items.length) return;

    /* 视觉参数写入 CSS 变量（尺寸/遮罩/压暗等） */
    var rootStyle = root.style;
    rootStyle.setProperty("--dw-tile-w", options.tileWidth + "px");
    rootStyle.setProperty("--dw-tile-h", options.tileHeight + "px");
    rootStyle.setProperty("--dw-gap", options.gap + "px");
    rootStyle.setProperty("--dw-radius", "16px");
    rootStyle.setProperty("--dw-perspective", options.perspective + "px");
    rootStyle.setProperty("--dw-dim", String(options.dim));
    rootStyle.setProperty("--dw-gray", options.grayscale ? "1" : "0");
    rootStyle.setProperty("--dw-overlay", options.overlay);
    rootStyle.setProperty("--dw-edge", Math.max(0, (1 - options.fade) * 100) + "%");

    var columns = Math.max(1, options.columns | 0);
    var unit = options.tileHeight + options.gap;
    var dirSign = options.direction === "up" ? 1 : -1;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var tracks = [];
    var columnMeta = [];
    var baseVelocities = [];
    var offsets = [];
    var velocities = [];

    function buildColumns() {
      plane.innerHTML = "";
      tracks = [];
      columnMeta = [];
      baseVelocities = [];
      offsets = [];
      velocities = [];

      var buckets = [];
      for (var c = 0; c < columns; c++) buckets.push([]);
      items.forEach(function (item, i) { buckets[i % columns].push(item); });

      for (var col = 0; col < columns; col++) {
        var colItems = buckets[col].length ? buckets[col] : items.slice(0, 1);
        var copyHeight = Math.max(unit, colItems.length * unit);

        var colEl = document.createElement("div");
        colEl.className = "drift-wall__col";
        var track = document.createElement("div");
        track.className = "drift-wall__track";

        var copies = copyCount(copyHeight);
        for (var copyIndex = 0; copyIndex < copies; copyIndex++) {
          colItems.forEach(function (item, itemIndex) {
            var tile = document.createElement("div");
            tile.className = "drift-wall__tile";
            tile.dataset.col = String(col);
            var inner = document.createElement("span");
            inner.className = "drift-wall__inner";
            var img = document.createElement("img");
            img.src = item.image;
            img.alt = "";
            img.loading = "lazy";
            img.decoding = "async";
            img.draggable = false;
            var overlay = document.createElement("span");
            overlay.className = "drift-wall__overlay";
            inner.appendChild(img);
            inner.appendChild(overlay);
            tile.appendChild(inner);
            track.appendChild(tile);
          });
        }

        colEl.appendChild(track);
        plane.appendChild(colEl);
        tracks.push(track);
        columnMeta.push({ copyHeight: copyHeight, copies: copies });
        baseVelocities.push(
          options.speed * columnFactor(col, options.variance) * dirSign * (col % 2 === 0 ? 1 : -1)
        );
        offsets.push(copyHeight * ((col * 0.37) % 1));
        velocities.push(0);
        track.style.transform = "translate3d(0, " + (-offsets[col]).toFixed(2) + "px, 0)";
      }
    }

    var containerHeight = root.clientHeight || 600;
    function copyCount(copyHeight) {
      return Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
    }

    function applyPlaneTransform(px, py) {
      plane.style.transform =
        "translate(-50%, -50%) scale(1.18) " +
        "rotateX(" + (options.tilt + py) + "deg) rotateY(" + (options.turn + px) + "deg) rotateZ(" + options.roll + "deg) " +
        "translateZ(" + (-options.depth) + "px)";
    }

    /* ---------- 指针状态 ---------- */
    var pointer = { x: 0, y: 0 };
    var pointerDamped = { x: 0, y: 0 };
    var hoveredCol = -1;
    var wallHovered = false;

    root.addEventListener("pointermove", function (e) {
      if (options.parallax > 0 && !reduced) {
        var rect = root.getBoundingClientRect();
        pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
        pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
      }
      var tile = e.target && e.target.closest ? e.target.closest("[data-col]") : null;
      hoveredCol = tile ? Number(tile.dataset.col) : -1;
    }, { passive: true });

    root.addEventListener("pointerleave", function () {
      wallHovered = false;
      hoveredCol = -1;
      pointer.x = 0;
      pointer.y = 0;
    });
    root.addEventListener("pointerenter", function () {
      wallHovered = true;
    });

    /* ---------- 主循环（离屏 / 后台自动停帧） ---------- */
    var rafId = null;
    var lastTs = null;
    var inView = true;

    function animate(ts) {
      rafId = null;
      if (lastTs === null) lastTs = ts;
      var dt = clamp(ts - lastTs, 0, 50) / 1000;
      lastTs = ts;

      var maxTilt = options.parallax * 8;
      var targetX = pointer.x * maxTilt;
      var targetY = -pointer.y * maxTilt;
      var damp = 1 - Math.exp(-dt / 0.12);
      pointerDamped.x += (targetX - pointerDamped.x) * damp;
      pointerDamped.y += (targetY - pointerDamped.y) * damp;
      applyPlaneTransform(pointerDamped.x, pointerDamped.y);

      var globalPause = wallHovered && options.pauseOnHover;
      for (var c = 0; c < tracks.length; c++) {
        var meta = columnMeta[c];
        if (!meta) continue;
        var factor = globalPause || hoveredCol === c ? 0 : 1;
        var target = baseVelocities[c] * factor;
        var ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
        velocities[c] += (target - velocities[c]) * ease;
        var next = offsets[c] + velocities[c] * dt;
        next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
        offsets[c] = next;
        tracks[c].style.transform = "translate3d(0, " + (-next).toFixed(2) + "px, 0)";
      }

      rafId = requestAnimationFrame(animate);
    }

    function start() {
      if (reduced || rafId !== null || !inView || document.hidden) return;
      lastTs = null;
      rafId = requestAnimationFrame(animate);
    }

    function stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTs = null;
    }

    applyPlaneTransform(0, 0);

    if (reduced) {
      root.classList.add("drift-wall--static");
    } else {
      start();

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop();
        else start();
      }, { passive: true });

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          inView = entries[0] && entries[0].isIntersecting;
          if (inView) start();
          else stop();
        }, { threshold: 0 }).observe(root);
      }

      var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
      var onReduceChange = function (e) {
        reduced = e.matches;
        if (reduced) {
          stop();
          root.classList.add("drift-wall--static");
        } else {
          root.classList.remove("drift-wall--static");
          start();
        }
      };
      if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", onReduceChange);
      else if (reduceMQ.addListener) reduceMQ.addListener(onReduceChange);
    }

    /* ---------- 高度变化 → 复制份数变化时重建 ---------- */
    if ("ResizeObserver" in window) {
      new ResizeObserver(function (entries) {
        var height = entries[0].contentRect.height || 600;
        if (Math.abs(height - containerHeight) < 8) return;
        containerHeight = height;
        var needsRebuild = columnMeta.some(function (meta) {
          return copyCount(meta.copyHeight) !== meta.copies;
        });
        if (needsRebuild) buildColumns();
      }).observe(root);
    }

    buildColumns();
  }

  function initAll() {
    var roots = document.querySelectorAll("[data-drift-wall]");
    Array.prototype.forEach.call(roots, function (root) {
      if (!root.__driftWall) {
        root.__driftWall = true;
        DriftWall(root);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
