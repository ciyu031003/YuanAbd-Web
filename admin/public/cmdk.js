/* admin/public/cmdk.js — 全局命令面板（Ctrl / Cmd + K）
   设计取舍：
   · 用原生 <dialog>.showModal()：自动 inert 背景、Esc 关闭、焦点陷阱由浏览器保证；
   · 数据走 /api/search（服务端已做权限过滤），前端只负责渲染与键盘导航；
   · 静态页面作为「无输入时」的默认结果，输入后优先文章（最高频动作）；
   · 不做模糊搜索的伪实现：后端已经按标题/slug 子串匹配，这里只按返回顺序展示。 */
(function () {
  "use strict";
  var dlg = document.getElementById("fx-cmdk");
  if (!dlg) return;
  var input = document.getElementById("fx-cmdk-input");
  var list = document.getElementById("fx-cmdk-list");
  var timer = null;
  var seq = 0;
  var items = [];
  var active = -1;

  var canReview = document.body.getAttribute("data-can-review") === "1";
  var canAdmin = document.body.getAttribute("data-can-admin") === "1";
  /* need 字段用于按权限过滤：不给无权限的人展示「点了会 403」的入口。
     旧实现只过滤了审核台，reviewer/editor 搜「账号」会出现他们打不开的页面。 */
  var PAGES = [
    { t: "工作台", d: "统计、待办与数据面板", href: "/dashboard" },
    { t: "审核台", d: "逐篇审核、退回与通过", href: "/review", need: "review" },
    { t: "文章列表", d: "筛选全部文章", href: "/articles" },
    { t: "新建文章", d: "从骨架开始写", href: "/articles/new" },
    { t: "数据分析", d: "读者反馈与内容健康度", href: "/analytics" },
    { t: "媒体库", d: "上传与引用图片", href: "/media" },
    { t: "来源体检", d: "批量探测外链可用性", href: "/sources-check" },
    { t: "发布队列", d: "手动发布与历史记录", href: "/publish" },
    { t: "账号与角色", d: "邀请成员、分配权限", href: "/users", need: "admin" },
    { t: "领域与分类", d: "维护 taxonomy", href: "/taxonomy", need: "admin" },
    { t: "审计日志", d: "谁在什么时候改了什么", href: "/audit", need: "review" },
    { t: "账号安全", d: "双因素认证与改密", href: "/security" }
  ];
  function allowed(p) {
    if (p.need === "review") return canReview;
    if (p.need === "admin") return canAdmin;
    return true;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function hl(text, q) {
    var s = esc(text);
    if (!q) return s;
    var needle = q.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
    try { return s.replace(new RegExp("(" + needle + ")", "ig"), "<mark>$1</mark>"); } catch (e) { return s; }
  }

  function render(groups, q) {
    items = [];
    var html = "";
    groups.forEach(function (g) {
      if (!g.items.length) return;
      html += '<div class="cmdk__group">' + esc(g.label) + "</div>";
      g.items.forEach(function (it) {
        var idx = items.length;
        items.push(it);
        html += '<a class="cmdk__item" role="option" id="cmdk-opt-' + idx + '" data-idx="' + idx + '" href="' + esc(it.href) + '">' +
          "<span><b>" + hl(it.t, q) + "</b>" + (it.d ? ' <span class="muted">' + esc(it.d) + "</span>" : "") + "</span>" +
          (it.meta ? '<span class="muted">' + esc(it.meta) + "</span>" : "") +
          "</a>";
      });
    });
    if (!items.length) {
      html = '<div class="cmdk__empty">没有匹配结果。试试标题里的关键词，或输入 ? 看全部页面。</div>';
    }
    list.innerHTML = html;
    active = items.length ? 0 : -1;
    paint();
  }

  function paint() {
    Array.prototype.forEach.call(list.querySelectorAll(".cmdk__item"), function (el, i) {
      var on = i === active;
      el.setAttribute("aria-selected", on ? "true" : "false");
      if (on && el.scrollIntoView) {
        try { el.scrollIntoView({ block: "nearest" }); } catch (e) {}
      }
    });
    if (input) input.setAttribute("aria-activedescendant", active >= 0 ? "cmdk-opt-" + active : "");
  }

  function pageGroup(q) {
    var needle = (q || "").toLowerCase();
    return {
      label: "页面",
      items: PAGES.filter(function (p) {
        if (!allowed(p)) return false;
        if (!needle) return true;
        return (p.t + " " + p.d).toLowerCase().indexOf(needle) >= 0;
      }).map(function (p) { return { t: p.t, d: p.d, href: p.href }; })
    };
  }

  function mapArticle(a) {
    return {
      t: a.title || a.slug,
      d: a.slug,
      href: "/articles/" + a.slug,
      meta: (a.statusLabel || "") + (a.domainName ? " · " + a.domainName : "")
    };
  }

  function search(q) {
    var my = ++seq;
    render([pageGroup(q), { label: "文章", items: [] }], q);
    if (!q) {
      fetch("/api/search?limit=6", { credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (my !== seq) return;
          render([{ label: "最近编辑", items: (j.recent || []).map(mapArticle) }, pageGroup("")], "");
        })
        .catch(function () {});
      return;
    }
    fetch("/api/search?q=" + encodeURIComponent(q), { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (my !== seq) return;
        var arts = (j.articles || []).map(mapArticle);
        render([{ label: "文章", items: arts }, pageGroup(q)], q);
      })
      .catch(function () {
        if (my !== seq) return;
        render([pageGroup(q)], q);
      });
  }

  function open() {
    if (dlg.open) return;
    dlg.showModal();
    if (input) {
      input.value = "";
      /* aria-expanded 必须随面板状态变化：模板里写死 true 时，
         面板关闭后读屏仍会播报「已展开」，属于无效状态。 */
      input.setAttribute("aria-expanded", "true");
      input.focus();
    }
    search("");
  }
  function close() { if (dlg.open) dlg.close(); }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cmdk-open]");
    if (b) { e.preventDefault(); open(); }
  });
  document.addEventListener("keydown", function (e) {
    var key = (e.key || "").toLowerCase();
    if ((e.ctrlKey || e.metaKey) && key === "k") {
      e.preventDefault();
      if (dlg.open) close(); else open();
    }
  });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  dlg.addEventListener("close", function () {
    items = [];
    active = -1;
    if (input) {
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
  });

  if (input) {
    input.addEventListener("input", function () {
      clearTimeout(timer);
      var v = input.value.trim();
      timer = setTimeout(function () { search(v); }, 140);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (items.length) { active = (active + 1) % items.length; paint(); } }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (items.length) { active = (active - 1 + items.length) % items.length; paint(); } }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (active >= 0 && items[active]) window.location.href = items[active].href;
      }
    });
  }
  list.addEventListener("mousemove", function (e) {
    var it = e.target.closest(".cmdk__item");
    if (!it) return;
    var idx = parseInt(it.getAttribute("data-idx"), 10);
    if (idx !== active) { active = idx; paint(); }
  });
  list.addEventListener("click", function () { close(); });
  window.FXCmdk = { open: open, close: close };
})();
