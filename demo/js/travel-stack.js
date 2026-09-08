/* ============================================================
   travel-stack.js — 甜途 · XMind 式滚动堆叠卡
   1) 卡片 sticky 逐张落桌；被覆盖时缩小 / 下沉 / 压暗
   2) 落位瞬间给卡片打 .is-live —— 内部序号 / 标签 / 标题 /
      文字 / chips / 图片以弹簧曲线交错跳入（见 travel.css）
   rAF 节流；prefers-reduced-motion 时完全静止。
   压暗通过 .scard::after 的 opacity（--stack-dim）完成，
   只走合成器路径，避免每帧 filter 触发整卡重绘。
   ============================================================ */
(function () {
  "use strict";

  var stack = document.getElementById("featureStack");
  if (!stack) return;
  var items = Array.prototype.slice.call(stack.querySelectorAll(".stack__item"));
  if (!items.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  /* 每张卡随机 ±3° 初始倾角：进入视口时「散落」，落定后回正（模拟落在桌上） */
  var rots = items.map(function () { return (Math.random() * 6 - 3); });

  var ticking = false;
  var vh = window.innerHeight;

  /* 卡片落到吸顶线附近的进度：1 = 已落位，0 = 还在半屏之下 */
  function arrival(rect) {
    var line = 90; /* 与 --nav-h + 14px 吸顶线近似 */
    var d = rect.top - line;
    var span = Math.max(vh * 0.5, 1);
    return Math.max(0, Math.min(1, 1 - d / span));
  }

  function update() {
    ticking = false;
    vh = window.innerHeight;
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var card = item.firstElementChild;
      if (!card) continue;
      var rect = item.getBoundingClientRect();
      var next = items[i + 1];

      /* 覆盖进度：后一张盖住前一张的比例（决定缩小/下沉/压暗） */
      var progress = 0;
      if (next) {
        var nrect = next.getBoundingClientRect();
        progress = Math.max(0, Math.min(1, (rect.bottom - nrect.top) / (rect.height || 1)));
      }

      var scale = 1 - progress * 0.055;
      var shift = progress * -14;
      var rot = rots[i] * (1 - arrival(rect));
      card.style.transform = "rotate(" + rot.toFixed(2) + "deg) scale(" + scale.toFixed(4) + ") translateY(" + shift.toFixed(1) + "px)";
      card.style.setProperty("--stack-dim", (progress * 0.16).toFixed(3));

      /* 落位 → 弹跳入场并保持；退回半屏之下 → 复位（再次靠近可重放） */
      var arr = arrival(rect);
      var isLive = arr > 0.4 && progress < 0.9;
      var isGone = arr < 0.06;
      if (isLive) {
        if (item.classList.contains("is-live") === false) {
          /* 强制重排一帧，保证重复触发时过渡可靠重启 */
          void card.offsetWidth;
          item.classList.add("is-live");
        }
      } else if (isGone && item.classList.contains("is-live")) {
        item.classList.remove("is-live");
      }
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
