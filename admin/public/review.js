/* admin/public/review.js — 审核台键盘流（J/K 切换、A 通过、R 退回）
   只在审核台引入；页面没有队列时自动跳过。 */
(function () {
  "use strict";
  var items = Array.prototype.slice.call(document.querySelectorAll("a.rq-item"));
  if (!items.length) return;
  var idx = items.findIndex(function (a) { return a.getAttribute("aria-current") === "page"; });

  function typing(e) {
    var t = e.target;
    return t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
  }
  function blocked() {
    return !!document.querySelector("dialog[open]");
  }
  function go(delta) {
    var next = idx + delta;
    if (next < 0 || next >= items.length) return;
    window.location.href = items[next].href;
  }
  function approve() {
    var btn = document.querySelector('#review-decide button[name="decision"][value="approve"]') ||
      document.querySelector('.review-bar button[value="approve"]');
    if (btn) btn.click();
  }
  function reject() {
    var note = document.getElementById("rnote");
    if (!note) return;
    note.focus({ preventScroll: true });
    try { note.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
    if (note.setSelectionRange) {
      try { note.setSelectionRange(note.value.length, note.value.length); } catch (e) {}
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (typing(e) || blocked()) return;
    var k = String(e.key || "").toLowerCase();
    if (k === "j" || e.key === "ArrowDown") { e.preventDefault(); go(1); }
    else if (k === "k" || e.key === "ArrowUp") { e.preventDefault(); go(-1); }
    else if (k === "a") { e.preventDefault(); approve(); }
    else if (k === "r") { e.preventDefault(); reject(); }
  });
})();
