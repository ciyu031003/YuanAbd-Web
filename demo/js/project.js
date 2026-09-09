/* ============================================================
   project.js — 项目落地页（甜途 / 学习工作台）交互
   登录跳转到对应 Web 端登录页；下载跳转到对应产品真实 APK
   年份自动更新
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Toast ---------- */
  function toast(message, opts) {
    opts = opts || {};
    var host = document.body;
    var box = host.querySelector(".toast");
    if (!box) {
      box = document.createElement("div");
      box.className = "toast";
      box.setAttribute("aria-live", "polite");
      host.appendChild(box);
    }
    box.innerHTML = "";
    var txt = document.createElement("span");
    txt.className = "toast__text";
    txt.textContent = message;
    box.appendChild(txt);
    if (opts.detail) {
      var d = document.createElement("span");
      d.className = "toast__detail";
      d.textContent = opts.detail;
      box.appendChild(d);
    }
    box.classList.add("is-on");
    clearTimeout(box._t);
    box._t = setTimeout(function () { box.classList.remove("is-on"); }, 3200);
  }

  /* ---------- 域名判断：本落地页属于「学习工作台」还是「甜途」 ---------- */
  function domainFromPage() {
    return location.hostname.indexOf("learn") > -1 ? "learn.yuanabd.cn" : "travel-notes.yuanabd.cn";
  }

  /* ---------- 登录：跳转到对应产品 Web 端登录页 ---------- */
  var LOGIN_PROTOCOL = "https";
  // 可选：域名/SSL 就绪前临时指向服务器 IP（正式环境保持 null）
  var LOGIN_BASE = null;
  function loginUrl() {
    var base = LOGIN_BASE || domainFromPage();
    return LOGIN_PROTOCOL + "://" + base + "/login";
  }

  /* ---------- 应用内页面：已登录用户「进入空间」的目标 ---------- */
  function appUrl(path) {
    var base = LOGIN_BASE || domainFromPage();
    return LOGIN_PROTOCOL + "://" + base + path;
  }

  /* ---------- 下载：跳转到对应产品真实客户端安装包 ---------- */
  var DOWNLOAD_PROTOCOL = "https";
  var DOWNLOAD_BASE = null; // 可选：临时指向服务器 IP
  // 部署于服务器的真实安装包地址（由 Nginx 静态托管）
  var DOWNLOAD_TRAVEL = "/downloads/tiantu.apk";                    // 甜途 Android APK
  var DOWNLOAD_LEARN = "/download/learn-workbench-v1.0.0.apk";      // 学习工作台 Android APK
  function downloadUrl() {
    var isLearn = domainFromPage().indexOf("learn") > -1;
    var base = DOWNLOAD_BASE || domainFromPage();
    var path = isLearn ? DOWNLOAD_LEARN : DOWNLOAD_TRAVEL;
    return DOWNLOAD_PROTOCOL + "://" + base + path;
  }

  function isDemoHost() {
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname) || location.port === "8080";
  }

  /* ---------- 登录入口：锚点/按钮均跳转到真实登录页 ---------- */
  document.querySelectorAll("[data-login]").forEach(function (el) {
    if (el.tagName === "A") el.setAttribute("href", loginUrl());
    el.addEventListener("click", function (e) {
      if (isDemoHost()) {
        e.preventDefault();
        toast("Demo 环境", { detail: "登录入口将在部署后启用" });
        return;
      }
      // 跟随元素当前 href：未登录 → 登录页；已登录（refreshLoginState 已换链接）→ 应用
      window.location.href = (el.tagName === "A" && el.getAttribute("href")) || el.getAttribute("data-app-url") || loginUrl();
    });
  });

  /* ---------- 登录态检测：已登录用户把「登录」入口换成「进入空间」 ---------- */
  function refreshLoginState() {
    if (isDemoHost()) return;
    var isLearn = domainFromPage().indexOf("learn") > -1;
    var checkUrl = isLearn ? "/api/auth/me" : "/api/check-auth";
    var target = appUrl(isLearn ? "/dashboard" : "/travel");
    fetch(checkUrl, { headers: { "Accept": "application/json" }, credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error("bad status"); return r.json(); })
      .then(function (data) {
        var authed = isLearn ? !!(data && data.user) : !!(data && data.authenticated);
        if (!authed) return; // 未登录保持默认登录入口
        document.querySelectorAll("[data-login]").forEach(function (el) {
          if (el.tagName === "A") el.setAttribute("href", target);
          el.setAttribute("data-app-url", target);
          if (el.textContent && el.textContent.trim() === "登录") el.textContent = "进入空间";
        });
      })
      .catch(function () { /* 检测失败保持默认 */ });
  }
  refreshLoginState();
  window.addEventListener("pageshow", function (e) { if (e.persisted) refreshLoginState(); });

  /* ---------- 下载入口：锚点直接可用；按钮由 JS 触发 ---------- */
  document.querySelectorAll("[data-download]").forEach(function (el) {
    if (el.tagName === "A") {
      el.setAttribute("href", downloadUrl());
      el.setAttribute("download", "");
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    }
    el.addEventListener("click", function (e) {
      if (isDemoHost()) {
        e.preventDefault();
        toast("Demo 环境", { detail: "下载将在部署后启用，线上可下载" });
        return;
      }
      if (el.tagName === "A") return; // 生产环境：锚点走原生 href 下载
      e.preventDefault();
      window.location.href = downloadUrl();
    });
  });

  /* ---------- 年份 ---------- */
  function init() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
