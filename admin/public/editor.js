/* admin/public/editor.js — 编辑器页交互（零依赖，渐进增强）
   元素缺失即跳过；CSP 允许 'self' 脚本，因此以独立文件引入而非内联。 */
(function () {
  "use strict";

  /* ---------------- sources 可增删条目 ---------------- */
  var addBtn = document.getElementById("src-add");
  var list = document.getElementById("src-list");
  var tpl = document.getElementById("src-type-options");

  function nextIndex() {
    var max = -1;
    if (list) {
      Array.prototype.forEach.call(list.querySelectorAll('input[name^="src_title_"]'), function (el) {
        var m = /src_title_(\d+)/.exec(el.name);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
    }
    return max + 1;
  }
  function rowHtml() {
    var opts = tpl ? tpl.innerHTML : '<option value="">（无）</option>';
    var i = nextIndex();
    return '<div class="row src-row" style="margin-bottom:8px">' +
      '<input type="text" name="src_title_' + i + '" placeholder="标题（必填）" style="flex:2">' +
      '<input type="text" name="src_url_' + i + '" placeholder="https://…（必填）" style="flex:3">' +
      '<select name="src_type_' + i + '" style="flex:1">' + opts + '</select>' +
      '<button class="btn btn--sm" type="button" data-src-remove>删除</button></div>';
  }
  if (addBtn && list) {
    addBtn.addEventListener("click", function () {
      list.insertAdjacentHTML("beforeend", rowHtml());
    });
    list.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-src-remove]");
      if (!btn) return;
      var row = btn.closest(".src-row");
      if (row) row.remove();
    });
  }

  /* ---------------- 领域联动分类 ---------------- */
  var domSel = document.getElementById("domain");
  var catSel = document.getElementById("category");
  if (domSel && catSel) {
    var sync = function () {
      var v = domSel.value;
      Array.prototype.forEach.call(catSel.options, function (o) {
        if (!o.value) return;
        o.hidden = o.getAttribute("data-dom") !== v;
      });
      var sel = catSel.selectedOptions[0];
      if (sel && sel.hidden) catSel.value = "";
    };
    domSel.addEventListener("change", sync);
    sync();
  }

  /* ---------------- 正文：段落导航 + 字数统计 ---------------- */
  var ta = document.querySelector("[data-toc-source]");
  var toc = document.getElementById("toc");
  var wc = document.getElementById("wc");

  function renderToc() {
    if (!ta) return;
    var lines = ta.value.split(/\r?\n/);
    var items = [];
    for (var i = 0; i < lines.length; i++) {
      var m = /^##\s+(.+?)\s*$/.exec(lines[i]);
      if (m) items.push({ title: m[1], line: i });
    }
    if (wc) {
      var text = ta.value.replace(/\s/g, "");
      wc.textContent = "正文 " + text.length + " 字 / " + ta.value.split(/\r?\n/).length + " 行";
    }
    if (!toc) return;
    if (!items.length) { toc.innerHTML = '<li class="muted">正文里还没有「## 段落」</li>'; return; }
    toc.innerHTML = items.map(function (it) {
      return '<li><a href="#" data-line="' + it.line + '">' + it.title.replace(/[<>&]/g, "") + "</a></li>";
    }).join("");
  }

  if (toc) {
    toc.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-line]");
      if (!a || !ta) return;
      e.preventDefault();
      var target = parseInt(a.getAttribute("data-line"), 10);
      var lines = ta.value.split(/\r?\n/);
      var pos = 0;
      for (var i = 0; i < target && i < lines.length; i++) pos += lines[i].length + 1;
      ta.focus();
      ta.setSelectionRange(pos, pos);
      var lh = parseFloat(getComputedStyle(ta).lineHeight) || 22;
      ta.scrollTop = Math.max(0, target * lh - lh * 3);
    });
  }

  if (ta) {
    var timer = null;
    ta.addEventListener("input", function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(renderToc, 250);
    });
    renderToc();
  }

  /* ---------------- 检查清单：点击跳转到对应字段 ---------------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-jump]");
    if (!a) return;
    var id = a.getAttribute("data-jump");
    var el = document.getElementById(id) || document.getElementById("f-" + id);
    if (!el) return;
    e.preventDefault();
    var det = el.closest("details");
    if (det) det.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el.focus) { try { el.focus({ preventScroll: true }); } catch (err) { el.focus(); } }
    var box = el.closest(".field") || el;
    box.style.transition = "background .2s";
    box.style.background = "var(--brand-weak)";
    setTimeout(function () { box.style.background = ""; }, 900);
  });

  /* ---------------- 快捷键：Ctrl/Cmd+S 保存 ---------------- */
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      var form = document.getElementById("editor");
      if (!form) return;
      e.preventDefault();
      var btn = form.querySelector('button[name="action"][value="save"]');
      if (btn) btn.click();
    }
  });
})();
