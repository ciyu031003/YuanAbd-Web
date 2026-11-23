/* admin/src/workflow.cjs — 文章状态机与 URL 辅助（纯函数，可单测）
   -----------------------------------------------------------------------------
   为什么单独成文件：
   1) 状态流转规则原先写在 server.cjs 的路由闭包里，任何「列表行内按钮 / 批量条 /
      审核台结论」的合法性判断都无法脱离数据库单测，规则漂移也没有测试兜底；
   2) 重定向查询串原先在各处手写 `backTo + (backTo.indexOf("?")>=0?"&":"?") + "error=" + ...`,
      漏掉 encodeURIComponent 或多加一个 ? 就产生 404/重复参数。这里统一成 withQuery()。
   本文件不 require 任何其它模块，测试里可直接加载。 */
"use strict";

/* 目标状态 → 允许的来源状态、所需能力、按钮文案。
   这是列表页按钮、批量操作、审核台结论三处共用的**唯一真源**。 */
const STATUS_TRANSITIONS = {
  in_review:         { from: ["draft"],                          cap: "article:submit",  label: "提交审核" },
  published:         { from: ["draft", "in_review"],             cap: "article:publish", label: "发布" },
  changes_requested: { from: ["in_review"],                      cap: "article:review",  label: "退回修改" },
  draft:             { from: ["changes_requested", "in_review", "archived"], cap: "article:edit", label: "转回草稿" },
  archived:          { from: ["published", "draft"],             cap: "article:archive", label: "归档" }
};

const STATUS_LABELS = {
  published: "已发布", draft: "草稿", in_review: "审核中",
  changes_requested: "退回修改", archived: "归档"
};

function transitionFor(to) {
  return STATUS_TRANSITIONS[to] || null;
}

function statusLabel(s) {
  return STATUS_LABELS[s] || s || "未知";
}

/* 当前状态能否流转到 to。current 必须来自数据库（articles_meta.status），
   文件 front-matter 的 status 只作为 DB 没有记录时的兜底。 */
function canTransition(current, to) {
  const rule = transitionFor(to);
  if (!rule) return false;
  return rule.from.indexOf(String(current || "draft")) >= 0;
}

function transitionLabel(to) {
  const rule = transitionFor(to);
  return rule ? rule.label : "更新";
}

/* 拼接查询串：path 可以已经带 ?（例如 /review?status=changes_requested），
   值为空/undefined/null 的参数会被丢弃。所有值都做 encodeURIComponent。
   拼出来的 URL 永远只有一个 ?，且不会出现 && 或结尾的 &。 */
function withQuery(pathname, params) {
  const base = String(pathname || "/");
  const hashAt = base.indexOf("#");
  const hash = hashAt >= 0 ? base.slice(hashAt) : "";
  let p = hashAt >= 0 ? base.slice(0, hashAt) : base;
  const parts = [];
  Object.keys(params || {}).forEach(function (k) {
    const v = params[k];
    if (v === undefined || v === null || v === "") return;
    parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
  });
  const qs = parts.join("&");
  if (!qs) return p + hash;
  return p + (p.indexOf("?") >= 0 ? (p.endsWith("?") || p.endsWith("&") ? "" : "&") : "?") + qs + hash;
}

/* 审核台「返回哪个 tab」：只认两个合法值，其它一律回到待审核。
   这样 error/notice 返回时不会因为随意传入的 status 参数跳到不存在的队列。 */
function reviewBackTo(filter) {
  return filter === "changes_requested" ? "/review?status=changes_requested" : "/review";
}

/* 分页页码：非数字、0、负数、超过总页数都收敛到 [1, pages]。 */
function clampPage(page, pages) {
  const total = Math.max(1, parseInt(pages, 10) || 1);
  const n = parseInt(page, 10);
  if (!n || n < 1) return 1;
  return Math.min(n, total);
}

module.exports = {
  STATUS_TRANSITIONS: STATUS_TRANSITIONS,
  STATUS_LABELS: STATUS_LABELS,
  transitionFor: transitionFor,
  transitionLabel: transitionLabel,
  statusLabel: statusLabel,
  canTransition: canTransition,
  withQuery: withQuery,
  reviewBackTo: reviewBackTo,
  clampPage: clampPage
};
