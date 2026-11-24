/* admin/public/login.js — 登录页「电影镜头」交互
   -----------------------------------------------------------------------------
   职责：
   1) 四幅插画自动轮播（7.5s），交叉淡入由 CSS 负责；
   2) 圆点手动切换 + 键盘左右键（焦点在控制组时）；
   3) 暂停/播放；标签页隐藏时暂停计时，重新可见后继续；
   4) 鼠标视差（仅精确指针设备，幅度很小，避免眩晕）；
   5) 密码显示/隐藏切换；
   6) prefers-reduced-motion：不自动轮播、不做视差（CSS 同时关闭动画）。
   CSP：本文件由 /static/login.js 加载（script-src 'self'），页面无内联脚本。 */
(function () {
  "use strict";
  var cinema = document.querySelector("[data-lg-cinema]");
  if (!cinema) return;

  var DUR = 7500;
  var scenes = Array.prototype.slice.call(cinema.querySelectorAll("[data-lg-scene]"));
  var dots = Array.prototype.slice.call(cinema.querySelectorAll("[data-lg-go]"));
  var caption = cinema.querySelector("[data-lg-caption]");
  var controls = cinema.querySelector("[data-lg-controls]");
  var pauseBtn = cinema.querySelector("[data-lg-pause]");
  var pauseLabel = cinema.querySelector("[data-lg-pause-label]");
  var progress = cinema.querySelector("[data-lg-progress]");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var idx = 0;
  var timer = null;
  var paused = reduce;
  var captionTimer = null;

  function restartProgress() {
    if (!progress) return;
    progress.classList.remove("is-run");
    progress.style.animationDuration = DUR + "ms";
    if (paused) {
      progress.style.width = "0%";
      return;
    }
    // 强制回流后重新触发进度动画
    void progress.offsetWidth;
    progress.classList.add("is-run");
  }

  function paintControls() {
    dots.forEach(function (d, i) {
      var on = i === idx;
      d.classList.toggle("is-on", on);
      d.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (pauseBtn) {
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseBtn.setAttribute("aria-label", paused ? "继续画面自动切换" : "暂停画面自动切换");
    }
    if (pauseLabel) pauseLabel.textContent = paused ? "播放" : "暂停";
  }

  function paintCaption() {
    var dot = dots[idx];
    if (!caption || !dot) return;
    var title = dot.getAttribute("data-lg-title") || "";
    var line = dot.getAttribute("data-lg-line") || "";
    var no = (idx + 1 < 10 ? "0" : "") + (idx + 1);
    var total = (dots.length < 10 ? "0" : "") + dots.length;
    caption.classList.add("is-out");
    clearTimeout(captionTimer);
    captionTimer = setTimeout(function () {
      caption.innerHTML =
        '<span class="lg-caption__idx">' + no + " / " + total + "</span>" +
        '<span class="lg-caption__t"></span><span class="lg-caption__l"></span>';
      caption.querySelector(".lg-caption__t").textContent = title;
      caption.querySelector(".lg-caption__l").textContent = line;
      caption.classList.remove("is-out");
    }, 260);
  }

  function go(i, userAction) {
    if (!scenes.length) return;
    idx = ((i % scenes.length) + scenes.length) % scenes.length;
    scenes.forEach(function (s, si) { s.classList.toggle("is-on", si === idx); });
    paintControls();
    paintCaption();
    restartProgress();
    if (userAction) schedule();
  }

  function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
  function schedule() {
    clearTimer();
    if (paused || reduce || document.hidden) return;
    timer = setTimeout(function () { go(idx + 1, false); schedule(); }, DUR);
  }

  function setPaused(next) {
    paused = !!next;
    paintControls();
    if (paused) { clearTimer(); restartProgress(); }
    else { restartProgress(); schedule(); }
  }

  /* 圆点切换 */
  dots.forEach(function (d, i) {
    d.addEventListener("click", function () { go(i, true); });
  });
  /* 暂停 / 播放 */
  if (pauseBtn) {
    pauseBtn.addEventListener("click", function () { setPaused(!paused); });
  }
  /* 键盘：焦点在控制组内时，左右键切换 */
  if (controls) {
    controls.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      go(idx + (e.key === "ArrowRight" ? 1 : -1), true);
    });
  }
  /* 标签页隐藏时暂停计时（不改变用户选择） */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { clearTimer(); if (progress) progress.style.animationPlayState = "paused"; }
    else {
      if (progress) progress.style.animationPlayState = "";
      schedule();
      if (!paused) restartProgress();
    }
  });
  /* 鼠标视差：只改 CSS 变量，场景容器统一位移，幅度 ±10px */
  if (fine && !reduce) {
    var raf = null, tx = 0, ty = 0;
    cinema.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      tx = (e.clientX / window.innerWidth - 0.5) * 20;
      ty = (e.clientY / window.innerHeight - 0.5) * 14;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        cinema.style.setProperty("--lg-px", tx.toFixed(2));
        cinema.style.setProperty("--lg-py", ty.toFixed(2));
      });
    });
    cinema.addEventListener("pointerleave", function () {
      cinema.style.setProperty("--lg-px", "0");
      cinema.style.setProperty("--lg-py", "0");
    });
  }

  /* 密码显示 / 隐藏 */
  var pwToggle = cinema.querySelector("[data-pw-toggle]");
  var pwInput = document.getElementById("password");
  if (pwToggle && pwInput) {
    pwToggle.addEventListener("click", function () {
      var show = pwInput.type === "password";
      pwInput.type = show ? "text" : "password";
      pwToggle.setAttribute("aria-pressed", show ? "true" : "false");
      pwToggle.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
      pwToggle.setAttribute("title", show ? "隐藏密码" : "显示密码");
      pwInput.focus({ preventScroll: true });
      try { pwInput.setSelectionRange(pwInput.value.length, pwInput.value.length); } catch (err) {}
    });
  }

  /* 动效关闭时也允许手动切换：保留圆点，不自动轮播 */
  paintControls();
  if (!reduce) { restartProgress(); schedule(); }
  else if (progress) { progress.style.width = "100%"; progress.style.opacity = "0.25"; }
})();
