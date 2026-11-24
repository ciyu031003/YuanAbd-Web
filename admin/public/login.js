/* admin/public/login.js — 认证页交互（电影镜头 + shadcn 风格组件增强）
   -----------------------------------------------------------------------------
   职责：
   1) 多场景轮播（仅登录页）：7.5s 交叉淡入、圆点/键盘切换、暂停、标签页隐藏暂停；
   2) 鼠标视差 + 登录卡高光（spotlight）；
   3) 密码显隐、大写锁定提示；
   4) 提交载入态：spinner + disabled + aria-busy + 读屏播报（15s 兜底恢复）；
   5) 验证码分格输入（参考 shadcn input-otp）：单输入框 + 视觉分格，
      支持数字过滤、退格、左右移动、恢复码模式切换；无 JS 时自动退化为普通输入框。
   CSP：由 /static/login.js 加载（script-src 'self'），页面无内联脚本。
   ============================================================================= */
(function () {
  "use strict";
  var cinema = document.querySelector("[data-lg-cinema]");
  if (!cinema) return;

  var mqReduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var mqFine = window.matchMedia ? window.matchMedia("(pointer: fine)") : null;
  var reduce = !!(mqReduce && mqReduce.matches);
  var fine = !!(mqFine && mqFine.matches);

  /* 轮播控件只有在 JS 可用时才有意义：先隐藏，增强成功后再显示 */
  cinema.setAttribute("data-lg-ready", "1");

  function announce(msg) {
    var live = document.getElementById("live");
    if (live) live.textContent = msg;
  }

  /* ================= 1. 场景轮播（仅多场景时启用） ================= */
  var carousel = (function () {
    var DUR = 7500;
    var scenes = Array.prototype.slice.call(cinema.querySelectorAll("[data-lg-scene]"));
    var dots = Array.prototype.slice.call(cinema.querySelectorAll("[data-lg-go]"));
    if (!scenes.length || dots.length < 2) return null;

    var caption = cinema.querySelector("[data-lg-caption]");
    var controls = cinema.querySelector("[data-lg-controls]");
    var pauseBtn = cinema.querySelector("[data-lg-pause]");
    var pauseLabel = cinema.querySelector("[data-lg-pause-label]");
    var progress = cinema.querySelector("[data-lg-progress]");
    var idx = 0, timer = null, captionTimer = null;
    var userPaused = false;
    var reduced = reduce;

    function isPaused() { return userPaused || reduced; }

    function restartProgress() {
      if (!progress) return;
      progress.classList.remove("is-run");
      progress.style.animationDuration = DUR + "ms";
      if (isPaused()) { progress.style.width = "0%"; return; }
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
        pauseBtn.setAttribute("aria-pressed", userPaused ? "true" : "false");
        pauseBtn.setAttribute("aria-label", userPaused ? "继续画面自动切换" : "暂停画面自动切换");
      }
      if (pauseLabel) pauseLabel.textContent = userPaused ? "播放" : "暂停";
    }
    function paintCaption(textNow) {
      var dot = dots[idx];
      if (!caption || !dot) return;
      var title = dot.getAttribute("data-lg-title") || "";
      var line = dot.getAttribute("data-lg-line") || "";
      var no = (idx + 1 < 10 ? "0" : "") + (idx + 1);
      var total = (dots.length < 10 ? "0" : "") + dots.length;
      function apply() {
        caption.innerHTML =
          '<span class="lg-caption__idx">' + no + " / " + total + "</span>" +
          '<span class="lg-caption__t"></span><span class="lg-caption__l"></span>';
        caption.querySelector(".lg-caption__t").textContent = title;
        caption.querySelector(".lg-caption__l").textContent = line;
        caption.classList.remove("is-out");
      }
      caption.classList.add("is-out");
      clearTimeout(captionTimer);
      if (textNow) { apply(); return; }
      captionTimer = setTimeout(apply, 460); // 略长于 CSS 的 .45s 淡出，避免半透明时闪跳
    }
    function go(i, userAction) {
      idx = ((i % scenes.length) + scenes.length) % scenes.length;
      scenes.forEach(function (s, si) { s.classList.toggle("is-on", si === idx); });
      paintControls();
      paintCaption(reduced); // 减少动态时直接换字，不做淡入淡出
      restartProgress();
      if (userAction) schedule();
    }
    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
    function schedule() {
      clearTimer();
      if (isPaused() || document.hidden) return;
      timer = setTimeout(function () { go(idx + 1, false); schedule(); }, DUR);
    }
    function setPaused(next) {
      userPaused = !!next;
      paintControls();
      if (isPaused()) { clearTimer(); restartProgress(); }
      else { restartProgress(); schedule(); }
    }
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i, true); }); });
    if (pauseBtn) pauseBtn.addEventListener("click", function () { setPaused(!userPaused); });
    if (controls) {
      controls.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        go(idx + (e.key === "ArrowRight" ? 1 : -1), true);
      });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        clearTimer();
        if (progress) progress.style.animationPlayState = "paused";
      } else if (!isPaused()) {
        if (progress) progress.style.animationPlayState = "";
        schedule();
        restartProgress();
      }
    });
    paintControls();
    restartProgress();
    schedule();

    return {
      setReduced: function (v) {
        reduced = v;
        if (reduced) { clearTimer(); restartProgress(); }
        else { restartProgress(); schedule(); }
      }
    };
  })();

  /* ================= 2. 鼠标视差 + 卡片高光 ================= */
  var parallax = (function () {
    if (!mqFine || !mqReduce) return null;
    var raf = null, tx = 0, ty = 0;
    function allowed() { return mqFine.matches && !mqReduce.matches; }
    cinema.addEventListener("pointermove", function (e) {
      if (!allowed()) return;
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

    Array.prototype.forEach.call(cinema.querySelectorAll("[data-lg-card]"), function (card) {
      card.addEventListener("pointermove", function (e) {
        if (!allowed()) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
        card.style.setProperty("--spot-y", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--spot-x", "72%");
        card.style.setProperty("--spot-y", "0%");
      });
    });

    return {
      reset: function () {
        cinema.style.setProperty("--lg-px", "0");
        cinema.style.setProperty("--lg-py", "0");
      }
    };
  })();

  /* ================= 3. 密码显隐 ================= */
  Array.prototype.forEach.call(cinema.querySelectorAll("[data-pw-toggle]"), function (btn) {
    var field = btn.closest(".lg-field") || btn.closest(".lg-input");
    var input = field ? field.querySelector("input") : null;
    if (!input) return;
    btn.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
      btn.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
      btn.setAttribute("title", show ? "隐藏密码" : "显示密码");
      input.focus({ preventScroll: true });
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
    });
  });

  /* 用户开始修正时清掉服务端返回的错误态，避免 aria-invalid 一直挂着 */
  Array.prototype.forEach.call(cinema.querySelectorAll('input[aria-invalid="true"]'), function (input) {
    input.addEventListener("input", function () {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    }, { once: true });
  });

  /* ================= 4. 大写锁定提示 ================= */
  Array.prototype.forEach.call(cinema.querySelectorAll('input[type="password"]'), function (input) {
    var field = input.closest(".lg-field");
    var hint = field ? field.querySelector("[data-lg-caps]") : null;
    if (!hint) return;
    function sync(e) {
      var on = false;
      try { on = !!(e && e.getModifierState && e.getModifierState("CapsLock")); } catch (err) {}
      // 常驻 live region：只改文本，视觉显隐交给 CSS（:empty）
      hint.textContent = on ? "已开启大写锁定" : "";
    }
    input.addEventListener("keydown", sync);
    input.addEventListener("keyup", sync);
    input.addEventListener("blur", function () { hint.textContent = ""; });
  });

  /* ================= 5. 提交载入态 ================= */
  Array.prototype.forEach.call(cinema.querySelectorAll("form[data-lg-form]"), function (form) {
    form.addEventListener("submit", function () {
      var btn = form.querySelector("[data-lg-submit]");
      if (!btn || btn.disabled) return;
      btn.classList.add("is-loading");
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      form.setAttribute("aria-busy", "true");
      announce("正在提交，请稍候…");
      /* 兜底：网络异常/被阻止跳转时不至于永久卡在加载态 */
      setTimeout(function () {
        btn.classList.remove("is-loading");
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        form.removeAttribute("aria-busy");
      }, 15000);
    });
  });

  /* ================= 6. 验证码分格输入（shadcn input-otp 语义） ================= */
  Array.prototype.forEach.call(cinema.querySelectorAll("[data-otp]"), function (wrap) {
    var input = wrap.querySelector(".lg-otp__input");
    var cells = Array.prototype.slice.call(wrap.querySelectorAll(".lg-otp__cells i"));
    var field = wrap.closest(".lg-field");
    if (!field) return;
    var sw = field.querySelector("[data-otp-switch]");
    var help = field.querySelector("[data-otp-help]");
    var hint = field.querySelector("[data-otp-hint]");
    if (!input || !cells.length) return;

    var stash = { code: "", recovery: "" };

    wrap.setAttribute("data-otp-ready", "1");
    if (sw) sw.hidden = false;

    function mode() { return wrap.getAttribute("data-mode") === "recovery" ? "recovery" : "code"; }
    function render() {
      var v = input.value || "";
      var m = mode();
      var len = m === "code" ? Math.min(v.length, cells.length) : 0;
      cells.forEach(function (c, i) {
        c.textContent = i < len ? v.charAt(i) : "";
        c.classList.toggle("is-filled", i < len);
        c.classList.toggle("is-active", i === len && document.activeElement === input && len < cells.length);
      });
    }
    function sanitize() {
      if (mode() !== "code") return;
      var digits = (input.value || "").replace(/\D+/g, "").slice(0, 6);
      if (digits !== input.value) input.value = digits;
    }
    function setMode(next) {
      var recovery = next === "recovery";
      stash[mode()] = input.value; // 记住当前模式已输入的内容
      wrap.setAttribute("data-mode", recovery ? "recovery" : "code");
      input.value = stash[next] || "";
      if (recovery) {
        input.removeAttribute("pattern");
        input.removeAttribute("inputmode");
        input.setAttribute("maxlength", "24");
        input.setAttribute("placeholder", "输入恢复码");
        if (help) help.textContent = "恢复码可在「账号安全」中生成，每枚只能使用一次。";
        if (hint) hint.textContent = "恢复码";
      } else {
        input.setAttribute("inputmode", "numeric");
        input.setAttribute("pattern", "[0-9]{6}");
        input.setAttribute("maxlength", "6");
        input.removeAttribute("placeholder");
        if (help) help.textContent = "验证码每 30 秒更新一次；也可以使用一枚恢复码。";
        if (hint) hint.textContent = "6 位数字";
      }
      if (sw) sw.textContent = recovery ? "使用验证码" : "使用恢复码";
      render();
      input.focus({ preventScroll: true });
    }

    input.addEventListener("input", function () { sanitize(); render(); });
    input.addEventListener("focus", render);
    input.addEventListener("blur", render);
    input.addEventListener("paste", function () { setTimeout(function () { sanitize(); render(); }, 0); });
    if (sw) {
      sw.addEventListener("click", function () { setMode(mode() === "recovery" ? "code" : "recovery"); });
    }
    // 服务端失败后回填的恢复码模式：同步按钮文案（hint/help 已由模板渲染）
    if (mode() === "recovery" && sw) sw.textContent = "使用验证码";
    render();
  });

  /* ================= 7. 系统偏好变化时即时响应 ================= */
  function onPrefChange() {
    if (carousel) carousel.setReduced(!!(mqReduce && mqReduce.matches));
    if (parallax && ((mqReduce && mqReduce.matches) || (mqFine && !mqFine.matches))) parallax.reset();
    cinema.style.setProperty("--lg-motion", (mqReduce && mqReduce.matches) ? "0" : "1");
  }
  if (mqReduce && mqReduce.addEventListener) mqReduce.addEventListener("change", onPrefChange);
  if (mqFine && mqFine.addEventListener) mqFine.addEventListener("change", onPrefChange);

  /* 页面不可见时暂停全部 CSS 动画（不只是停轮播计时器） */
  document.addEventListener("visibilitychange", function () {
    cinema.classList.toggle("is-hidden", document.hidden);
  });
})();
