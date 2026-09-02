/* ============================================================
   travel-download.js — 行迹门户「扫码下载」弹窗 v2
   点击 Android 下载弹出版本信息 + 更新日志 + 二维码 + 直装按钮；
   从 /api/version 拉取最新版本，失败时回落内置默认值。
   兜底：拦截所有指向 APK / downloads 的下载链接，确保弹出窗口而非直接下载。
   ============================================================ */
(function () {
  "use strict";

  var DEFAULT_URL = "https://travel-notes.yuanabd.cn/downloads/tiantu.apk";
  var DEFAULT_VERSION = "1.0.0";
  var DEFAULT_BUILD = "1";
  var DEFAULT_CHANGELOG = "移动端正式上线：离线浏览与自动同步、旅行记录、相册、旅行圈。";

  var modal = document.getElementById("dlModal");
  if (!modal) return;

  var activeEl = null;

  function $(id) { return document.getElementById(id); }

  function setText(id, val) {
    var el = $(id);
    if (el && val != null) el.textContent = val;
  }

  function applyManifest(m) {
    if (!m) return;
    var version = m.version || DEFAULT_VERSION;
    var build = String(m.buildNumber != null ? m.buildNumber : DEFAULT_BUILD);
    var url = m.downloadUrl || DEFAULT_URL;
    var changelog = m.changelog || DEFAULT_CHANGELOG;

    setText("dlVersion", version);
    setText("dlBuild", build);
    setText("dlChangelogVersion", version);
    setText("dlChangelog", changelog);

    var dl = $("dlDownload");
    if (dl) {
      dl.href = url;
      dl.setAttribute("download", "tiantu.apk");
      dl.setAttribute("target", "_blank");
      dl.setAttribute("rel", "noopener");
    }
    var link = $("dlCopyLink");
    if (link) link.setAttribute("data-copy", url);
  }

  function fetchManifest() {
    fetch("/api/version", { headers: { "Accept": "application/json" }, credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error("bad status"); return r.json(); })
      .then(applyManifest)
      .catch(function () { /* 保守：保留默认值 */ });
  }

  function openModal() {
    activeEl = document.activeElement;
    modal.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
    fetchManifest();
    var close = $("dlModalClose");
    if (close) close.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    if (activeEl && activeEl.focus) activeEl.focus();
  }

  // 兜底：拦截所有下载类链接，避免浏览器直接下载 APK
  var triggerSel = "[data-download-modal], [data-download], a[href*='/downloads/'], a[download]";
  var triggers = document.querySelectorAll(triggerSel);

  function isModalInternal(el) {
    if (!el) return false;
    if (el.id === "dlDownload") return true;
    return el.closest && el.closest("#dlModal");
  }

  triggers.forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (isModalInternal(el)) return; // 弹窗内下载按钮放行
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });
  });

  // 关闭：按钮 / 背景遮罩 / ESC
  var closeBtn = $("dlModalClose");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  var backdrop = $("dlModalBackdrop");
  if (backdrop) backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  // 复制下载链接
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-copy]") : null;
    if (!t) return;
    var url = t.getAttribute("data-copy") || DEFAULT_URL;
    function done() {
      var label = t.querySelector("span");
      if (label) { var old = label.textContent; label.textContent = "已复制 ✓"; setTimeout(function(){ label.textContent = old; }, 2000); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () { window.prompt("复制下载链接", url); });
    } else {
      window.prompt("复制下载链接", url);
    }
  });
})();
