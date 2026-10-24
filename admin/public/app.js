/* admin/public/app.js — 共享交互原语（零依赖）
   设计依据：
   · <dialog>.showModal() 是唯一真正模态的原语（自动 inert 背景）——用于确认框
   · popover="manual" 用于 toast（auto 会被误点关闭）
   · toast 必须配 aria-live 区域，因为 Popover API 不会向读屏宣告内容出现
   · 破坏性操作的确认框要求输入名称二次确认
   本文件不引入任何第三方库。 */
(function () {
  "use strict";

  /* ---------------- 读屏播报 ---------------- */
  var live = document.getElementById("live");
  function announce(msg) {
    if (live) { live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 30); }
  }

  /* ---------------- Toast ---------------- */
  function toast(msg, kind) {
    var pop = document.createElement("div");
    pop.setAttribute("popover", "manual");
    pop.className = "toast";
    var box = document.createElement("div");
    box.className = "toast__box";
    box.textContent = msg;
    if (kind === "error") box.style.background = "#B91C1C";
    pop.appendChild(box);
    document.body.appendChild(pop);
    try { pop.showPopover(); } catch (e) { /* 老浏览器降级为普通元素 */ }
    announce(msg);
    setTimeout(function () {
      try { pop.hidePopover(); } catch (e) {}
      pop.remove();
    }, 3200);
  }

  /* ---------------- 确认框（原生 dialog） ---------------- */
  function confirmAction(opts) {
    return new Promise(function (resolve) {
      var dlg = document.createElement("dialog");
      dlg.style.cssText = "border:0;border-radius:12px;padding:0;max-width:420px;width:92vw;box-shadow:0 12px 32px rgba(16,24,40,.18)";
      var needType = opts.requireText || "";
      dlg.innerHTML =
        '<form method="dialog" style="padding:20px">' +
        '<h3 style="margin:0 0 8px;font-size:16px">' + (opts.title || "确认操作") + "</h3>" +
        '<p style="margin:0 0 14px;color:#374151;line-height:1.7">' + (opts.body || "") + "</p>" +
        (needType
          ? '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">请输入「' + needType + '」以确认</label>' +
            '<input type="text" id="__cf" autocomplete="off" style="width:100%;padding:7px 11px;border:1px solid #D1D5DB;border-radius:8px;font:inherit">'
          : "") +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">' +
        '<button class="btn" value="cancel" type="submit">取消</button>' +
        '<button class="btn ' + (opts.danger ? "btn--danger" : "btn--primary") + '" value="ok" type="submit"' +
        (needType ? " disabled" : "") + ">" + (opts.okText || "确认") + "</button>" +
        "</div></form>";
      document.body.appendChild(dlg);
      var input = dlg.querySelector("#__cf");
      var okBtn = dlg.querySelector('button[value="ok"]');
      if (input) {
        input.addEventListener("input", function () { okBtn.disabled = input.value.trim() !== needType; });
        setTimeout(function () { input.focus(); }, 20);
      }
      dlg.addEventListener("close", function () {
        var ok = dlg.returnValue === "ok";
        dlg.remove();
        resolve(ok);
      });
      // Esc 关闭时 returnValue 为空 -> 视为取消
      dlg.showModal();
    });
  }

  /* ---------------- 表单提交 pending 态 ----------------
     UI 规范要求：提交后必须立刻有反馈，不能"点完没反应"。
     除了按钮转圈，还给表单加 aria-busy，让读屏用户也知道正在处理。 */
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (f.hasAttribute("data-no-pending")) return;
    var btn = f.querySelector('button[type="submit"]:not([value])') || f.querySelector('button[type="submit"]');
    setTimeout(function () {
      if (btn) {
        btn.classList.add("btn--loading");
        btn.disabled = true;
        // 保留可访问名称，同时告知状态
        if (!btn.getAttribute("aria-label")) {
          btn.setAttribute("aria-label", (btn.textContent || "提交").trim() + "，处理中");
        }
      }
      f.setAttribute("aria-busy", "true");
      announce("正在提交，请稍候");
    }, 0);
  }, true);

  /* ---------------- 表格筛选/排序时的忙碌提示 ----------------
     这些是 GET 导航，浏览器会重载页面；给点击目标一个即时视觉反馈，
     避免"点了没反应"的错觉（尤其慢网络下）。 */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href*="?"], a.pager__btn, a.sortlink');
    if (!a || a.target === "_blank") return;
    a.setAttribute("aria-busy", "true");
    a.style.opacity = ".6";
  }, true);

  /* ---------------- 破坏性按钮确认 ---------------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-confirm]");
    if (!el) return;
    if (el.__confirmed) { el.__confirmed = false; return; }
    e.preventDefault();
    confirmAction({
      title: el.getAttribute("data-confirm-title") || "确认操作",
      body: el.getAttribute("data-confirm"),
      danger: el.hasAttribute("data-confirm-danger"),
      okText: el.getAttribute("data-confirm-ok") || "确认",
      requireText: el.getAttribute("data-confirm-type") || ""
    }).then(function (ok) {
      if (!ok) return;
      el.__confirmed = true;
      if (el.tagName === "A") { window.location.href = el.href; }
      else if (el.form) { el.form.submit(); }
      else { el.click(); }
    });
  });

  /* ---------------- 未保存警告 ---------------- */
  var dirty = false;
  document.addEventListener("input", function (e) {
    var f = e.target.closest("form[data-dirty-guard]");
    if (f) dirty = true;
  });
  document.addEventListener("submit", function () { dirty = false; });
  window.addEventListener("beforeunload", function (e) {
    if (!dirty) return;
    e.preventDefault(); e.returnValue = "";
  });

  /* ---------------- 暴露给内联使用 ---------------- */
  window.FXAdmin = { toast: toast, confirm: confirmAction };

  /* ---------------- 移动端：让当前页的导航项滚进可视区 ---------------- */
  /* 顶栏导航条在窄屏是横向滚动条，当前页的按钮可能滑出视野之外 */
  document.addEventListener("DOMContentLoaded", function () {
    var cur = document.querySelector('.sidebar .navitem[aria-current="page"]');
    if (cur && cur.scrollIntoView) {
      try { cur.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {}
    }
  });

  /* ---------------- 服务端提示转 toast ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    var n = document.querySelector("[data-toast]");
    if (n) toast(n.getAttribute("data-toast"), n.getAttribute("data-toast-kind") || "ok");
  });
})();
