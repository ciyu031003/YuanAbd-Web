/* admin/public/editor.js — 编辑器页交互（无依赖，渐进增强）
   元素缺失即跳过；CSP 允许 'self' 脚本，因此以独立文件引入而非内联。 */
(function () {
  "use strict";

  // ---- sources 可增删条目 ----
  var addBtn = document.getElementById("src-add");
  var list = document.getElementById("src-list");
  var tpl = document.getElementById("src-type-options");

  // 字段名带索引，与已有行不冲突（找当前最大索引 +1）
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

  // ---- 领域联动分类 ----
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

  // ---- 离开页面前提示未保存（编辑器表单） ----
  var form = document.getElementById("editor");
  if (form) {
    var dirty = false;
    form.addEventListener("input", function () { dirty = true; });
    form.addEventListener("submit", function () { dirty = false; });
    window.addEventListener("beforeunload", function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    });
  }
})();
