/* ============================================================
   project.js — 项目落地页（行迹 / 学习工作台）交互
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

  /* ---------- 域名判断：本落地页属于「学习工作台」还是「行迹」 ---------- */
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

  /* ---------- 下载：跳转到对应产品真实客户端安装包 ---------- */
  var DOWNLOAD_PROTOCOL = "https";
  var DOWNLOAD_BASE = null; // 可选：临时指向服务器 IP
  // 部署于服务器的真实安装包地址（由 Nginx 静态托管）
  var DOWNLOAD_TRAVEL = "/downloads/tiantu.apk";                    // 行迹 Android APK
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
      window.location.href = loginUrl();
    });
  });

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
