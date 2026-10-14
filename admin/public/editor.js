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
    /* 原先是 var(--brand-weak)，但这个变量在样式表里从未定义，
       导致「点检查项跳转并高亮字段」静默失效（背景被置为无效值）。
       改用页面主色浅底 --pg-s，高亮同时跟随当前页面的撞色。 */
    box.style.background = "var(--pg-s)";
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

  /* ---------------- 正文：插入骨架 / 插入图片 / 粘贴上传 ---------------- */
  var skeletonBtn = document.querySelector("[data-insert-skeleton]");
  var imageBtn = document.querySelector("[data-insert-image]");

  function insertAtCursor(text) {
    if (!ta) return;
    var s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }

  var SKELETON = [
    "## 一句话结论", "", "", "",
    "## 30 秒快速排查", "", "1. ", "",
    "## 适用 / 不适用", "", "**适用：**", "", "- ", "", "**不适用：**", "", "- ", "",
    "## 开始前确认", "", "- [ ] ", "",
    "## 分步骤", "", "### 步骤 1：", "", "**目的**：", "", "**操作**：", "", "**预期结果**：", "", "**失败怎么办**：", "",
    "## 怎么确认修好了", "", "1. ", "",
    "## 还是不行？", "", "", "",
    "## 预防", "", "1. ", "",
    "## 更新日志", "", "| 日期 | 版本 | 变更 | 作者 |", "|---|---|---|---|",
    "| " + new Date().toISOString().slice(0, 10) + " | 1.0 | 初版 |  |", ""
  ].join("\n");

  if (skeletonBtn) {
    skeletonBtn.addEventListener("click", function () {
      if (ta && ta.value.trim()) {
        if (!confirm("正文里已有内容，插入骨架会追加到末尾。继续？")) return;
        insertAtCursor("\n\n" + SKELETON);
      } else {
        insertAtCursor(SKELETON);
      }
      if (typeof renderToc === "function") renderToc();
    });
  }

  // 插入图片：优先尝试从剪贴板读，否则提示去媒体库复制路径
  if (imageBtn) {
    imageBtn.addEventListener("click", function () {
      var md = window.prompt("粘贴图片路径（在媒体库里点「复制路径」得到），例如 media/20261013-ab12cd.png", "media/");
      if (!md) return;
      var alt = window.prompt("替代文本 alt（必填，描述这张图说明什么）", "");
      if (!alt) { alert("alt 文本是必填的（无障碍要求）"); return; }
      insertAtCursor("\n![" + alt + "](" + md + ")\n");
    });
  }

  /* 拖拽 / 粘贴图片：直接走上传接口，成功后把 Markdown 插到光标处。
     需要页面提供 data-upload-endpoint 与 data-csrf。 */
  var uploadEndpoint = document.body.getAttribute("data-upload-endpoint");
  var pageCsrf = document.body.getAttribute("data-csrf");

  function uploadFile(file) {
    if (!uploadEndpoint || !ta) return;
    var alt = window.prompt("这张图说明什么？（alt 文本，必填）", "");
    if (!alt) { alert("必须填写 alt 文本才能上传"); return; }
    var fd = new FormData();
    fd.append("_csrf", pageCsrf || "");
    fd.append("alt", alt);
    fd.append("desensitized", "1");
    fd.append("file", file, file.name);
    var note = document.createElement("div");
    note.className = "alert alert--info";
    note.textContent = "正在上传 " + file.name + " …";
    var host = document.getElementById("editor") || document.body;
    host.parentNode.insertBefore(note, host);
    fetch(uploadEndpoint, { method: "POST", body: fd, credentials: "same-origin" })
      .then(function () {
        note.className = "alert alert--ok";
        note.textContent = "已上传。请在媒体库复制路径后插入，或刷新本页查看。";
        setTimeout(function () { note.remove(); }, 4000);
      })
      .catch(function () {
        note.className = "alert alert--err";
        note.textContent = "上传失败，请改用媒体库页面上传。";
      });
  }

  if (ta && uploadEndpoint) {
    ta.addEventListener("paste", function (ev) {
      var items = (ev.clipboardData || {}).items || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf("image/") === 0) {
          ev.preventDefault();
          uploadFile(items[i].getAsFile());
          return;
        }
      }
    });
    ta.addEventListener("dragover", function (ev) { ev.preventDefault(); });
    ta.addEventListener("drop", function (ev) {
      var files = (ev.dataTransfer || {}).files || [];
      if (files.length && files[0].type.indexOf("image/") === 0) {
        ev.preventDefault();
        uploadFile(files[0]);
      }
    });
  }
})();
