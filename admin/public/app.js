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
  /* markClean：自动保存成功后由 editor.js 调用，避免离开页面时误报「未保存」 */
  window.FXAdmin = { toast: toast, confirm: confirmAction, markClean: function () { dirty = false; } };

  /* ---------------- 服务端提示转 toast ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    var n = document.querySelector("[data-toast]");
    if (n) toast(n.getAttribute("data-toast"), n.getAttribute("data-toast-kind") || "ok");
  });

  /* ---------------- 移动端：让当前页的导航项滚进可视区 ---------------- */
  /* 顶栏导航条在窄屏是横向滚动条，当前页的按钮可能滑出视野之外 */
  document.addEventListener("DOMContentLoaded", function () {
    var cur = document.querySelector('.sidebar .navitem[aria-current="page"]');
    if (cur && cur.scrollIntoView) {
      try { cur.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {}
    }
  });

  /* ---------------- 列表页批量操作条（勾选亮起 / 全选 / 模态确认） ---------------- */
  (function () {
    var bar = document.querySelector("[data-batchbar]");
    if (!bar) return;
    var count = bar.querySelector("[data-batch-count]");
    var apply = bar.querySelector("[data-batch-apply]");
    var clear = bar.querySelector("[data-batch-clear]");
    var all = document.getElementById("batch-all");
    function checked() {
      return Array.prototype.slice.call(document.querySelectorAll('input[name="slugs"]:checked'));
    }
    function paint() {
      var n = checked().length;
      if (count) count.textContent = n ? "已选 " + n + " 篇" : "未勾选";
      if (apply) apply.disabled = n === 0;
      if (clear) clear.disabled = n === 0;
      if (all) {
        var total = document.querySelectorAll('input[name="slugs"]').length;
        all.checked = n > 0 && n === total;
        all.indeterminate = n > 0 && n < total;
      }
    }
    document.addEventListener("change", function (e) {
      if (e.target && e.target.name === "slugs") paint();
    });
    if (all) all.addEventListener("change", function () {
      Array.prototype.forEach.call(document.querySelectorAll('input[name="slugs"]'), function (b) { b.checked = all.checked; });
      paint();
    });
    if (clear) clear.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll('input[name="slugs"]'), function (b) { b.checked = false; });
      paint();
    });
    bar.addEventListener("submit", function (e) {
      var n = checked().length;
      if (!n) { e.preventDefault(); return; }
      var target = bar.querySelector('select[name="to"]');
      var label = target && target.selectedOptions[0] ? target.selectedOptions[0].textContent : "该操作";
      e.preventDefault();
      confirmAction({
        title: "批量" + label,
        body: "将对已选 " + n + " 篇执行「" + label + "」。" + (target && target.value === "published" ? "发布操作会逐篇进入发布队列并触发站点构建。" : "状态变化会写入审计日志。"),
        okText: label
      }).then(function (ok) {
        if (ok) bar.submit();
      });
    });
    paint();
  })();

  /* ---------------- root 为用户换绑邮箱（发码 → 验证，两步模态） ----------------
     流程：root 填新邮箱 → 系统寄 6 位验证码给对方 → 对方把验证码告知 root →
     root 输入验证码 → 校验通过后新邮箱才正式替换登录邮箱。
     路由层有 CSRF / 权限 / 频控 / 尝试次数限制，这里只负责把流程走顺。 */
  (function () {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-email-bind]");
      if (!btn) return;
      openBindModal({
        userId: btn.getAttribute("data-id"),
        curEmail: btn.getAttribute("data-email") || "",
        userName: btn.getAttribute("data-name") || "",
        csrf: btn.getAttribute("data-csrf") || ""
      });
    });

    function post(url, data) {
      var fd = new FormData();
      Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
      return fetch(url, { method: "POST", body: fd, credentials: "same-origin" })
        .then(function (r) { return r.json().catch(function () { return { error: "响应异常，请刷新重试" }; }); });
    }

    function openBindModal(o) {
      var dlg = document.createElement("dialog");
      dlg.style.cssText = "border:0;border-radius:16px;padding:0;max-width:460px;width:92vw;box-shadow:0 18px 50px -18px rgba(16,24,40,.5)";
      dlg.innerHTML =
        '<form method="dialog" style="padding:22px">' +
        '<h3 style="margin:0 0 6px;font-size:16px">换绑邮箱 · ' + (o.userName || o.curEmail) + "</h3>" +
        '<p style="margin:0 0 14px;color:var(--ink-3);font-size:12.5px;line-height:1.7">当前登录邮箱：' + o.curEmail +
        "。绑定成功后该用户将改用新邮箱登录（密码不变）。</p>" +
        '<div data-step1>' +
        '<label style="font-size:13px;font-weight:700;display:block;margin-bottom:6px">新邮箱</label>' +
        '<input type="email" required autocomplete="off" style="width:100%;padding:9px 12px;border:1px solid var(--lo);border-radius:10px;font:inherit;background:var(--base-2);color:var(--ink)">' +
        '<p style="margin:10px 0 0;color:var(--ink-3);font-size:12px">点击「发送验证码」后，系统向该邮箱寄出 6 位验证码（10 分钟内有效）。</p>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
        '<button class="btn" value="cancel" type="submit">取消</button>' +
        '<button class="btn btn--primary" type="button" data-send>发送验证码</button></div></div>' +
        '<div data-step2 hidden>' +
        '<p data-sentto style="margin:0 0 12px;font-size:13px;color:var(--i-mint);background:var(--s-mint);border-radius:10px;padding:10px 12px"></p>' +
        '<label style="font-size:13px;font-weight:700;display:block;margin-bottom:6px">验证码（6 位）</label>' +
        '<input inputmode="numeric" maxlength="6" autocomplete="one-time-code" style="width:100%;padding:9px 12px;border:1px solid var(--lo);border-radius:10px;font:inherit;letter-spacing:8px;text-align:center;background:var(--base-2);color:var(--ink)">' +
        '<p style="margin:10px 0 0;color:var(--ink-3);font-size:12px">请对方查收邮件后把验证码告诉你，输错 5 次验证作废。</p>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;align-items:center;flex-wrap:wrap">' +
        '<button class="btn btn--sm" type="button" data-resend disabled>重新发送（60s）</button>' +
        '<span style="flex:1"></span>' +
        '<button class="btn" value="cancel" type="submit">关闭</button>' +
        '<button class="btn btn--primary" type="button" data-verify disabled>验证并绑定</button></div></div>' +
        '<p data-msg style="margin:12px 0 0;font-size:12.5px;color:var(--warn);min-height:1.2em"></p>' +
        "</form>";
      document.body.appendChild(dlg);
      var step1 = dlg.querySelector("[data-step1]");
      var step2 = dlg.querySelector("[data-step2]");
      var emailIn = dlg.querySelector('input[type="email"]');
      var codeIn = dlg.querySelector('[data-step2] input');
      var sendBtn = dlg.querySelector("[data-send]");
      var resendBtn = dlg.querySelector("[data-resend]");
      var verifyBtn = dlg.querySelector("[data-verify]");
      var msg = dlg.querySelector("[data-msg]");
      var sentTo = dlg.querySelector("[data-sentto]");
      var targetEmail = "";
      var countdownT = null;

      dlg.addEventListener("close", function () { if (countdownT) clearInterval(countdownT); dlg.remove(); });
      /* 回车触发主按钮，而不是隐式提交把对话框当「取消」关掉 */
      dlg.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        if (!step2.hidden) { if (!verifyBtn.disabled) verifyBtn.click(); }
        else sendBtn.click();
      });

      function msg_(t, ok) { msg.textContent = t || ""; msg.style.color = ok ? "var(--i-mint)" : "var(--warn)"; }
      function countdown(sec) {
        var left = sec;
        resendBtn.disabled = true;
        clearInterval(countdownT);
        countdownT = setInterval(function () {
          left--;
          if (left <= 0) { clearInterval(countdownT); resendBtn.disabled = false; resendBtn.textContent = "重新发送"; }
          else resendBtn.textContent = "重新发送（" + left + "s）";
        }, 1000);
      }

      function doSend(email, btn) {
        btn.disabled = true; msg_("正在发送…");
        post("/users/" + o.userId + "/email/bind", { _csrf: o.csrf, email: email })
          .then(function (j) {
            if (j.error) { msg_(j.error); btn.disabled = false; return; }
            targetEmail = email;
            msg_(j.message || "已发送", true);
            sentTo.textContent = "✉ 验证码已发送至 " + email;
            step1.hidden = true; step2.hidden = false;
            codeIn.focus();
            countdown(60);
          })
          .catch(function () { msg_("发送失败（网络）"); btn.disabled = false; });
      }
      sendBtn.addEventListener("click", function () {
        var email = emailIn.value.trim().toLowerCase();
        if (!email) { msg_("请填写新邮箱"); return; }
        doSend(email, sendBtn);
      });
      resendBtn.addEventListener("click", function () {
        if (!targetEmail) return;
        doSend(targetEmail, resendBtn);
      });
      codeIn.addEventListener("input", function () {
        verifyBtn.disabled = codeIn.value.replace(/\D/g, "").length !== 6;
      });
      verifyBtn.addEventListener("click", function () {
        var code = codeIn.value.replace(/\D/g, "");
        if (code.length !== 6) { msg_("请输入 6 位验证码"); return; }
        verifyBtn.disabled = true; msg_("正在验证…");
        post("/users/" + o.userId + "/email/verify", { _csrf: o.csrf, code: code })
          .then(function (j) {
            if (j.error) { msg_(j.error); verifyBtn.disabled = false; return; }
            msg_(j.message || "绑定成功", true);
            setTimeout(function () { window.location.reload(); }, 1400);
          })
          .catch(function () { msg_("验证失败（网络）"); verifyBtn.disabled = false; });
      });
      dlg.showModal();
    }
  })();

  /* ---------------- 来源体检：任务后台运行中时自动刷新 ---------------- */
  (function () {
    "use strict";
    if (!document.querySelector("[data-srcpoll]")) return;
    setTimeout(function () { window.location.reload(); }, 6000);
  })();
})();
