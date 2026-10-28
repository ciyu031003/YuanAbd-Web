"use strict";

const assert = require("assert");
const path = require("path");

process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-only";
process.env.FEEDBACK_ALLOWED_ORIGINS = "https://pc-fixboxs.yuanabd.cn";

const feedback = require(path.join(__dirname, "..", "src", "feedback.cjs"));
const views = require(path.join(__dirname, "..", "src", "views.cjs"));

function validEventId() {
  return "feedback-event-0001";
}

function run() {
  const resolved = feedback.validate({
    slug: "win-update-enable",
    outcome: "resolved",
    client_event_id: validEventId()
  });
  assert.strictEqual(resolved.error, undefined);
  assert.strictEqual(resolved.value.issueType, null);

  const unresolved = feedback.validate({
    slug: "win-update-enable",
    outcome: "unresolved",
    issue_type: "steps",
    issue_location: "分步骤",
    message: "执行第三步后设置窗口没有打开",
    page_path: "/fix/win-update-enable.html",
    client_event_id: validEventId()
  });
  assert.strictEqual(unresolved.error, undefined);
  assert.strictEqual(unresolved.value.issueLocation, "分步骤");

  assert.match(feedback.validate({
    slug: "win-update-enable",
    outcome: "unresolved",
    client_event_id: validEventId()
  }).error, /问题类型/);
  assert.match(feedback.validate({
    slug: "../secret",
    outcome: "resolved",
    client_event_id: validEventId()
  }).error, /文章标识/);
  assert.match(feedback.validate({
    slug: "win-update-enable",
    outcome: "resolved",
    page_path: "https://evil.example/",
    client_event_id: validEventId()
  }).error, /页面来源/);

  assert.strictEqual(feedback.isAllowedOrigin("https://pc-fixboxs.yuanabd.cn"), true);
  assert.strictEqual(feedback.isAllowedOrigin("http://127.0.0.1:8080"), true);
  assert.strictEqual(feedback.isAllowedOrigin("https://evil.example"), false);
  assert.strictEqual(
    feedback.corsHeaders("https://pc-fixboxs.yuanabd.cn")["Access-Control-Allow-Origin"],
    "https://pc-fixboxs.yuanabd.cn"
  );

  const html = views.dashboardPage({
    user: { user_id: 1, email: "root@example.com", name: "管理员", is_root: true },
    roles: [{ role: "root" }],
    csrf: "csrf",
    total: 82,
    stats: { published: 82, missingSources: 0, stale: 0 },
    recent: [],
    stale: [],
    byDomain: [],
    byStatus: { published: 82, draft: 0, in_review: 0, changes_requested: 0, archived: 0 },
    heat: [],
    pubTrend: [],
    feedback: {
      stats: { resolved: 12, unresolved: 8, total: 20, unresolved7: 3, resolutionRate: 60 },
      articles: [{
        slug: "win-store-not-opening", title: "微软商店打不开", resolved: 2,
        unresolved: 4, total: 6, last_feedback_at: "2026-10-27T08:30:00.000Z"
      }],
      recent: [{
        id: 1, slug: "win-store-not-opening", title: "微软商店打不开",
        issue_type: "steps", issue_location: "分步骤", message: "<script>alert(1)</script>",
        created_at: "2026-10-27T08:30:00.000Z"
      }],
      issues: [{ issue_type: "steps", n: 4 }]
    }
  });

  assert.match(html, /feedback-kpis/);
  assert.match(html, /已解决/);
  assert.match(html, /未解决/);
  assert.match(html, /60%/);
  assert.match(html, /文章位置/);
  assert.match(html, /分步骤/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);

  console.log("admin feedback tests: ok");
}

run();
