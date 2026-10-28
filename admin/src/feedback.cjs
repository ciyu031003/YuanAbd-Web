/* Anonymous article feedback: validation, abuse control and dashboard queries. */
"use strict";

const config = require("./config.cjs");
const db = require("./db.cjs");

const ISSUE_TYPES = {
  premise: "适用前提",
  steps: "步骤或顺序",
  command: "命令或脚本",
  error: "报错或现象",
  result: "修复结果",
  source: "链接或资料",
  other: "其他"
};

const buckets = new Map();

function normalizedOrigin(origin) {
  return String(origin || "").trim().replace(/\/+$/, "");
}

function isAllowedOrigin(origin) {
  const value = normalizedOrigin(origin);
  if (!value) return true;
  const allowed = config.feedback.allowedOrigins.map(normalizedOrigin);
  if (allowed.indexOf(value) >= 0) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(value);
}

function corsHeaders(origin) {
  const value = normalizedOrigin(origin);
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin"
  };
  if (value && isAllowedOrigin(value)) headers["Access-Control-Allow-Origin"] = value;
  return headers;
}

function limitedText(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function validate(payload) {
  payload = payload || {};
  const slug = limitedText(payload.slug, 160);
  const outcome = limitedText(payload.outcome, 20);
  const issueType = limitedText(payload.issue_type || payload.issueType, 30);
  const issueLocation = limitedText(payload.issue_location || payload.issueLocation, 180);
  const message = limitedText(payload.message, 1200);
  const pagePath = limitedText(payload.page_path || payload.pagePath, 320);
  const clientEventId = limitedText(payload.client_event_id || payload.clientEventId, 96);

  if (!/^[a-z0-9][a-z0-9-]{0,159}$/.test(slug)) {
    return { error: "文章标识无效" };
  }
  if (outcome !== "resolved" && outcome !== "unresolved") {
    return { error: "请选择反馈结果" };
  }
  if (outcome === "unresolved" && !ISSUE_TYPES[issueType]) {
    return { error: "请选择问题类型" };
  }
  if (!/^[A-Za-z0-9_-]{12,96}$/.test(clientEventId)) {
    return { error: "反馈标识无效，请刷新页面后重试" };
  }
  if (pagePath && !/^\/fix\/[a-z0-9-]+\.html$/.test(pagePath) && pagePath !== "/") {
    return { error: "页面来源无效" };
  }

  return {
    value: {
      slug,
      outcome,
      issueType: outcome === "unresolved" ? issueType : null,
      issueLocation: outcome === "unresolved" ? (issueLocation || "未指定具体位置") : null,
      message: outcome === "unresolved" && message ? message : null,
      pagePath: pagePath || null,
      clientEventId
    }
  };
}

function rateLimited(ip) {
  const key = String(ip || "unknown");
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.feedback.windowMs });
    return false;
  }
  current.count += 1;
  if (buckets.size > 5000) {
    buckets.forEach(function (item, itemKey) {
      if (item.resetAt <= now) buckets.delete(itemKey);
    });
  }
  return current.count > config.feedback.maxPerWindow;
}

async function record(value) {
  const result = await db.query(
    "INSERT INTO article_feedback " +
    "(slug, outcome, issue_type, issue_location, message, page_path, client_event_id) " +
    "VALUES ($1,$2,$3,$4,$5,$6,$7) " +
    "ON CONFLICT (client_event_id) DO NOTHING RETURNING id",
    [value.slug, value.outcome, value.issueType, value.issueLocation,
      value.message, value.pagePath, value.clientEventId]
  );
  return { duplicate: result.rows.length === 0 };
}

function emptyDashboard() {
  return {
    stats: { resolved: 0, unresolved: 0, total: 0, unresolved7: 0, resolutionRate: 0 },
    articles: [],
    recent: [],
    issues: []
  };
}

async function dashboardData() {
  const statsResult = await db.query(
    "SELECT " +
    "count(*) FILTER (WHERE outcome='resolved')::int AS resolved, " +
    "count(*) FILTER (WHERE outcome='unresolved')::int AS unresolved, " +
    "count(*)::int AS total, " +
    "count(*) FILTER (WHERE outcome='unresolved' AND created_at >= now() - interval '7 days')::int AS unresolved7 " +
    "FROM article_feedback"
  );
  const articleResult = await db.query(
    "SELECT f.slug, COALESCE(NULLIF(m.title, ''), f.slug) AS title, " +
    "count(*) FILTER (WHERE f.outcome='resolved')::int AS resolved, " +
    "count(*) FILTER (WHERE f.outcome='unresolved')::int AS unresolved, " +
    "count(*)::int AS total, max(f.created_at) AS last_feedback_at " +
    "FROM article_feedback f " +
    "LEFT JOIN articles_meta m ON m.slug = f.slug " +
    "GROUP BY f.slug, m.title " +
    "ORDER BY unresolved DESC, total DESC, last_feedback_at DESC LIMIT 50"
  );
  const recentResult = await db.query(
    "SELECT f.id, f.slug, COALESCE(NULLIF(m.title, ''), f.slug) AS title, " +
    "f.outcome, f.issue_type, f.issue_location, f.message, f.created_at " +
    "FROM article_feedback f " +
    "LEFT JOIN articles_meta m ON m.slug = f.slug " +
    "WHERE f.outcome='unresolved' " +
    "ORDER BY f.created_at DESC LIMIT 30"
  );
  const issueResult = await db.query(
    "SELECT issue_type, count(*)::int AS n FROM article_feedback " +
    "WHERE outcome='unresolved' GROUP BY issue_type ORDER BY n DESC, issue_type"
  );

  const stats = statsResult.rows[0] || emptyDashboard().stats;
  stats.resolutionRate = stats.total
    ? Math.round((stats.resolved / stats.total) * 100)
    : 0;
  return {
    stats: stats,
    articles: articleResult.rows,
    recent: recentResult.rows,
    issues: issueResult.rows
  };
}

module.exports = {
  ISSUE_TYPES: ISSUE_TYPES,
  isAllowedOrigin: isAllowedOrigin,
  corsHeaders: corsHeaders,
  validate: validate,
  rateLimited: rateLimited,
  record: record,
  emptyDashboard: emptyDashboard,
  dashboardData: dashboardData
};
