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
    var no = i + 1;
    return '<div class="row src-row" style="margin-bottom:8px">' +
      '<input type="text" name="src_title_' + i + '" aria-label="参考资料 ' + no + ' 标题（必填）" placeholder="标题（必填）" style="flex:2">' +
      '<input type="text" name="src_url_' + i + '" aria-label="参考资料 ' + no + ' URL（必填）" placeholder="https://…（必填）" style="flex:3">' +
      '<select name="src_type_' + i + '" aria-label="参考资料 ' + no + ' 类型" style="flex:1">' + opts + '</select>' +
      '<button class="btn btn--sm" type="button" data-src-remove aria-label="删除第 ' + no + ' 条参考资料">删除</button></div>';
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
      /* 预计阅读时长：中文按 400 字/分钟（与站内文章的口吻一致） */
      var rt = document.getElementById("rt");
      if (rt) rt.textContent = text.length ? "约 " + Math.max(1, Math.round(text.length / 400)) + " 分钟读完" : "";
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

  /* ---------------- 正文：插入骨架 / 插入图片 / 粘贴上传 ----------------
     注意：只保留真实存在的控件。旧代码里还有一个 [data-insert-image] 分支，
     但模板中从来没有这个属性（图片按钮用的是 [data-upload-image]），
     整段逻辑（两个 window.prompt）是永远执行不到的死代码，已删除。 */
  var skeletonBtn = document.querySelector("[data-insert-skeleton]");

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

  /* ---------------- 图片：上传 → 立即插入 Markdown ----------------
     上一版上传成功后只提示「去媒体库复制路径」，多两步且容易漏。
     现在服务端在 X-FX-JSON: 1 时返回 relPath，前端直接插到光标处。 */
  var uploadEndpoint = document.body.getAttribute("data-upload-endpoint");
  var pageCsrf = document.body.getAttribute("data-csrf");
  var imgFile = document.getElementById("fx-img-file");
  var uploadBtn = document.querySelector("[data-upload-image]");

  function note(msg, kind) {
    var el = document.getElementById("fx-upload-note");
    if (!el) {
      el = document.createElement("div");
      el.id = "fx-upload-note";
      el.style.cssText = "position:fixed;right:18px;bottom:58px;z-index:99;padding:9px 14px;border-radius:10px;" +
        "font-size:12.5px;font-weight:600;box-shadow:0 10px 30px -12px rgba(0,0,0,.4);transition:opacity .3s;max-width:320px";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.background = kind === "err" ? "var(--warn-weak)" : "var(--ok-weak)";
    el.style.color = kind === "err" ? "var(--warn)" : "var(--ok)";
    el.style.opacity = "1";
    clearTimeout(note._t);
    note._t = setTimeout(function () { el.style.opacity = "0"; }, 3200);
  }

  function uploadFile(file, altText) {
    if (!uploadEndpoint || !ta) return;
    var alt = altText || window.prompt("这张图说明什么？（alt 文本，必填）", "");
    if (!alt) { note("必须填写 alt 文本才能上传", "err"); return; }
    var fd = new FormData();
    fd.append("_csrf", pageCsrf || "");
    fd.append("alt", alt);
    fd.append("desensitized", "1");
    fd.append("file", file, file.name);
    note("正在上传 " + file.name + " …");
    fetch(uploadEndpoint, {
      method: "POST", body: fd, credentials: "same-origin",
      headers: { "X-FX-JSON": "1" }
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) { note((j && j.error) || "上传失败", "err"); return; }
        insertAtCursor("\n![" + alt + "](" + j.relPath + ")\n");
        note("已插入图片：" + j.relPath);
      })
      .catch(function () { note("上传失败（网络或会话过期），请改用媒体库", "err"); });
  }

  if (uploadBtn && imgFile) {
    uploadBtn.addEventListener("click", function () { imgFile.click(); });
    imgFile.addEventListener("change", function () {
      if (imgFile.files && imgFile.files[0]) uploadFile(imgFile.files[0]);
      imgFile.value = "";
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
  /* ---------------- 分栏预览：与线上构建共用同一套渲染引擎 ---------------- */
  var previewBtn = document.getElementById("preview-toggle");
  var previewBox = document.getElementById("md-preview");
  var previewOn = false, previewTimer = null, previewSeq = 0;

  function renderPreviewNow() {
    if (!previewOn || !ta || !previewBox) return;
    var seq = ++previewSeq;
    var f = document.getElementById("editor");
    var csrfEl = f && f.querySelector('[name="_csrf"]');
    if (!csrfEl) return;
    // 带上整张表单（标题 / 领域 / 风险 / 时间等），服务端据此渲染与线上一致的整页
    var fd = new FormData(f);
    fd.set("md", ta.value);
    previewBox.innerHTML = '<p class="muted">渲染中…</p>';
    fetch("/articles/preview", { method: "POST", body: fd, credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (seq !== previewSeq) return;   // 只采纳最新一次输入的渲染结果
        if (j.error) {
          /* 错误文本用 textContent 写入：服务端的渲染错误里可能带 Markdown 片段/文件名，
             拼进 innerHTML 等于给自己开一个自 XSS 的口子。 */
          previewBox.textContent = "";
          var p = document.createElement("p");
          p.className = "muted";
          p.textContent = "预览失败：" + j.error;
          previewBox.appendChild(p);
          return;
        }
        /* 2026-11-06：预览改为 iframe 承载线上整页 HTML ——
           段落顺序（分步骤在前）、卡片与步骤样式都与线上完全一致。 */
        var ifr = document.createElement("iframe");
        ifr.setAttribute("title", "文章预览");
        /* 只给 allow-scripts + allow-popups，**不给 allow-same-origin**：
           srcdoc 配合 allow-same-origin 时文档继承后台自身的源，
           正文 Markdown 里若混入 <script>，就能直接读写后台 DOM / 会话。
           去掉之后文档是 opaque origin，脚本照常运行但碰不到后台。 */
        ifr.setAttribute("sandbox", "allow-scripts allow-popups");
        ifr.style.cssText = "width:100%;height:74vh;min-height:520px;border:0;border-radius:12px;background:#fff;display:block";
        ifr.srcdoc = j.html || "";
        previewBox.innerHTML = "";
        previewBox.appendChild(ifr);
      })
      .catch(function () {
        if (seq !== previewSeq) return;
        previewBox.innerHTML = '<p class="muted">预览请求失败（网络）</p>';
      });
  }
  function setPreview(on) {
    previewOn = !!on;
    if (!previewBtn || !previewBox || !ta) return;
    previewBtn.setAttribute("aria-pressed", on ? "true" : "false");
    previewBtn.classList.toggle("btn--primary", on);
    var bd = ta.closest(".grp__bd");
    if (bd) bd.classList.toggle("previewing", on);
    previewBox.hidden = !on;
    if (on) renderPreviewNow();
  }
  if (previewBtn && previewBox && ta) {
    previewBtn.addEventListener("click", function () { setPreview(!previewOn); });
    ta.addEventListener("input", function () {
      if (!previewOn) return;
      if (previewTimer) clearTimeout(previewTimer);
      previewTimer = setTimeout(renderPreviewNow, 600);
    });
  }

  /* ---------------- 自动存草稿（仅已有文章；30s 心跳，脏了才发） ----------------
     与手动保存的差异：跳过 lint 闸门（草稿允许写到一半）与修订快照（避免噪音）；
     成功后把服务端返回的新 contentHash 写回 baseHash，防止手动保存误报 409。 */
  var form = document.getElementById("editor");
  if (form && ta && !/\/articles\/new$/.test(form.getAttribute("action") || "")) {
    var baseInput = form.querySelector('[name="baseHash"]');
    var autosaveBtn = document.getElementById("autosave-toggle");
    var autosavePaused = false;
    var autosaveOn = true;
    try { autosaveOn = localStorage.getItem("fx.autosave") !== "0"; } catch (e) {}
    var dirty = false;

    document.addEventListener("input", function () { dirty = true; }, true);
    form.addEventListener("submit", function () { dirty = false; });

    function paintAutosaveBtn() {
      if (!autosaveBtn) return;
      autosaveBtn.setAttribute("aria-pressed", autosaveOn ? "true" : "false");
      autosaveBtn.textContent = autosavePaused ? "自动保存：已停（版本冲突）" : (autosaveOn ? "自动保存：开" : "自动保存：关");
      autosaveBtn.classList.toggle("btn--primary", autosaveOn && !autosavePaused);
    }
    if (autosaveBtn) {
      autosaveBtn.addEventListener("click", function () {
        autosaveOn = !autosaveOn; autosavePaused = false;
        try { localStorage.setItem("fx.autosave", autosaveOn ? "1" : "0"); } catch (e) {}
        paintAutosaveBtn();
      });
      paintAutosaveBtn();
    }

    function autosaveFlash(msg, ok) {
      var el = document.getElementById("autosave-note");
      if (!el) {
        el = document.createElement("div");
        el.id = "autosave-note";
        el.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:99;padding:9px 14px;border-radius:12px;" +
          "font-size:12.5px;font-weight:600;box-shadow:0 10px 30px -12px rgba(0,0,0,.45);transition:opacity .4s";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.background = ok ? "var(--s-mint)" : "var(--s-coral)";
      el.style.color = ok ? "var(--i-mint)" : "var(--i-coral)";
      el.style.opacity = "1";
      clearTimeout(autosaveFlash._t);
      autosaveFlash._t = setTimeout(function () { el.style.opacity = "0"; }, 2200);
    }

    function doAutosave() {
      if (!autosaveOn || autosavePaused || document.hidden) { autosaveTick(); return; }
      if (!dirty) { autosaveTick(); return; }
      var fd = new FormData(form);
      fetch(form.getAttribute("action") + "/autosave", { method: "POST", body: fd, credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.ok) {
            dirty = false;
            /* app.js 的 beforeunload 守卫有自己的 dirty 标记：
               不同步清掉会导致「已经自动保存了，关页面还提示未保存」。 */
            if (window.FXAdmin && window.FXAdmin.markClean) window.FXAdmin.markClean();
            if (baseInput && j.hash) baseInput.value = j.hash;
            autosaveFlash("已自动保存 " + new Date().toLocaleTimeString("zh-CN", { hour12: false }), true);
          } else if (j.error && /被他人修改/.test(j.error)) {
            /* 409：说明别人在编辑同一篇，停掉自动保存避免互相覆盖 */
            autosavePaused = true;
            paintAutosaveBtn();
            autosaveFlash("他人已修改本文，自动保存已暂停", false);
          } else {
            autosaveFlash("自动保存失败：" + (j.error || "未知错误"), false);
          }
        })
        .catch(function () { autosaveFlash("自动保存失败（网络）", false); });
      autosaveTick();
    }
    function autosaveTick() { setTimeout(doAutosave, 30000); }
    autosaveTick();
  }
  /* ---------------- 正文快捷格式（工具条 + 快捷键） ----------------
     只做「围绕选区」的可靠变换：多行选中时逐行加前缀，单行/无选区时插入模板。
     不引入 Markdown 解析器，保持零依赖。 */
  (function () {
    if (!ta) return;
    var state = document.getElementById("autosave-state");

    function setState(text, tone) {
      if (!state) return;
      state.textContent = text;
      state.style.color = tone === "warn" ? "var(--warn)" : (tone === "ok" ? "var(--ok)" : "var(--ink-3)");
    }

    function lineBounds(v, s, e) {
      var start = v.lastIndexOf("\n", Math.max(0, s - 1)) + 1;
      var end = v.indexOf("\n", e);
      if (end < 0) end = v.length;
      return [start, end];
    }
    function wrap(mark) {
      var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
      var sel = v.slice(s, e) || "文本";
      var next = v.slice(0, s) + mark + sel + mark + v.slice(e);
      ta.value = next;
      ta.selectionStart = s + mark.length;
      ta.selectionEnd = s + mark.length + sel.length;
      ta.focus();
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
    function prefixLines(prefix) {
      var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
      var b = lineBounds(v, s, e);
      var block = v.slice(b[0], b[1]);
      var lines = block.split("\n");
      var numbered = prefix === "1. ";
      var next = lines.map(function (ln, i) {
        if (numbered) return (i + 1) + ". " + ln.replace(/^\d+\.\s+/, "");
        return prefix + ln.replace(new RegExp("^" + prefix.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&")), "");
      }).join("\n");
      ta.value = v.slice(0, b[0]) + next + v.slice(b[1]);
      ta.selectionStart = b[0];
      ta.selectionEnd = b[0] + next.length;
      ta.focus();
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
    function insertBlock(text) {
      var v = ta.value, s = ta.selectionStart;
      var before = v.slice(0, s);
      var pad = before && !/\n\n$/.test(before) ? (before.slice(-1) === "\n" ? "\n" : "\n\n") : "";
      insertAtCursor(pad + text);
    }

    var TEMPLATES = {
      table: "| 现象 | 先查什么 | 命令 / 操作 |\n|---|---|---|\n|  |  |  |",
      quote: "> 提示：\n"
    };

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-md]");
      if (!btn || !ta) return;
      var kind = btn.getAttribute("data-md");
      if (kind === "bold") wrap("**");
      else if (kind === "italic") wrap("*");
      else if (kind === "code") wrap("\u0060");
      else if (kind === "h2") prefixLines("## ");
      else if (kind === "ul") prefixLines("- ");
      else if (kind === "ol") prefixLines("1. ");
      else if (kind === "quote") prefixLines("> ");
      else if (kind === "table") insertBlock(TEMPLATES.table);
      else if (kind === "link") {
        var url = window.prompt("链接地址（站内可写 ./slug.html）", "./");
        if (!url) return;
        var vv = ta.value, ss = ta.selectionStart, ee = ta.selectionEnd;
        var txt = vv.slice(ss, ee) || "链接文字";
        var md = "[" + txt + "](" + url + ")";
        ta.value = vv.slice(0, ss) + md + vv.slice(ee);
        ta.selectionStart = ss + 1;
        ta.selectionEnd = ss + 1 + txt.length;
        ta.focus();
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    document.addEventListener("keydown", function (e) {
      /* 只有焦点在正文框里才处理格式快捷键：
         旧实现在焦点位于标题/领域等输入框时也拦 Ctrl+B / Ctrl+I，
         会在用户没看正文的时候悄悄改正文内容。 */
      if (!ta || document.activeElement !== ta) return;
      var mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); wrap("**"); }
      else if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); wrap("*"); }
      else if (mod && e.altKey && e.key === "2") { e.preventDefault(); prefixLines("## "); }
      else if (e.key === "Tab" && document.activeElement === ta) {
        e.preventDefault();
        var v = ta.value, s = ta.selectionStart;
        ta.value = v.slice(0, s) + "  " + v.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 2;
      }
    });

    // 输入即提示「未保存」；提交时置为「保存中」
    if (ta) {
      var t2 = null;
      ta.addEventListener("input", function () {
        setState("未保存…", "warn");
        clearTimeout(t2);
        t2 = setTimeout(function () { setState("未保存（30 秒后自动保存）", "warn"); }, 900);
      });
    }
    var form = document.getElementById("editor");
    if (form) form.addEventListener("submit", function () { setState("正在保存…"); });
  })();

})();