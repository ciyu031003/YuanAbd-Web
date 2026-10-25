/* admin/src/server.cjs — HTTP 服务与路由（V2 阶段 1 的 ⑪–⑱） */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./config.cjs");
const db = require("./db.cjs");
const auth = require("./auth.cjs");
const h = require("./http.cjs");
const views = require("./views.cjs");
const articles = require("./articles.cjs");
const publisher = require("./publish.cjs");
const invites = require("./invites.cjs");
const collab = require("./collab.cjs");
const media = require("./media.cjs");
const totp = require("./totp.cjs");
const mailer = require("./mailer.cjs");

const taxPath = path.join(config.repo.root, "content", "taxonomy.json");
function taxonomy() { return JSON.parse(fs.readFileSync(taxPath, "utf8")); }
function writeTaxonomy(tax) {
  tax.updated = new Date().toISOString().slice(0, 10);
  const tmp = taxPath + ".tmp-" + process.pid;
  try { fs.copyFileSync(taxPath, taxPath + ".bak"); } catch (_) {}
  fs.writeFileSync(tmp, JSON.stringify(tax, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, taxPath);
}
function taxonomyId(value) {
  const id = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id)) {
    throw new Error("ID 只能使用小写字母、数字和连字符，长度 2-64 位");
  }
  return id;
}
function taxonomyName(value) {
  const name = String(value || "").trim();
  if (!name || name.length > 40) throw new Error("名称不能为空，且不能超过 40 个字");
  return name;
}
function taxonomyUsage() {
  const domains = {}, cats = {};
  articles.listAll().forEach(function (article) {
    if (article.domain) domains[article.domain] = (domains[article.domain] || 0) + 1;
    if (article.category) cats[article.category] = (cats[article.category] || 0) + 1;
  });
  return { domains: domains, cats: cats };
}
function taxonomyRedirect(res, notice, error) {
  const qs = error ? "error=" + encodeURIComponent(error) : "notice=" + encodeURIComponent(notice || "已保存");
  return redirect(res, "/taxonomy?" + qs);
}

/* 正文段落规则：从 content-lint.cjs 读取，保证后台与构建同一套规则 */
function sectionRules() {
  try {
    const lint = require(path.join(config.repo.root, "content-lint.cjs"));
    return { required: lint.REQUIRED_SECTIONS, suggested: lint.SUGGESTED_SECTIONS, aliases: lint.SECTION_ALIASES };
  } catch (e) {
    return { required: ["一句话结论", "分步骤"], suggested: [], aliases: {} };
  }
}

/* 静态资源（仅 /static/*，只服务 public/ 下的白名单文件）
   白名单而非目录映射：避免路径穿越，也让「可对外文件」一目了然。 */
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const STATIC = {
  "/static/editor.js": { file: path.join(PUBLIC_DIR, "editor.js"), type: "application/javascript; charset=utf-8" },
  "/static/app.js": { file: path.join(PUBLIC_DIR, "app.js"), type: "application/javascript; charset=utf-8" }
};

function html(res, status, body) {
  h.send(res, status, body, h.securityHeaders({ "Content-Type": "text/html; charset=utf-8" }));
}
function redirect(res, to) {
  h.send(res, 302, "", h.securityHeaders({ Location: to }));
}

/* 当前登录用户（从会话 Cookie 解析） */
async function currentUser(req) {
  const cookies = h.parseCookies(req.headers.cookie);
  const token = cookies[config.session.cookieName];
  if (!token) return null;
  const s = await auth.getSession(token);
  if (!s) return null;
  const roles = await auth.getRoles(s.user_id);
  return { user: s, roles: roles, token: token };
}

/* 读取全部文章并与 DB 状态合并（DB 是派生视图，文件为准） */
async function loadArticlesWithStatus() {
  const items = articles.listAll();
  const metaRows = await db.query("SELECT slug, status FROM articles_meta");
  const statusBySlug = {};
  metaRows.rows.forEach(function (r) { statusBySlug[r.slug] = r.status; });
  items.forEach(function (a) {
    a.status = statusBySlug[a.slug] || (a.where === "draft" ? "draft" : (a.where === "archive" ? "archived" : "published"));
  });
  return items;
}

/* 统一的路由上下文 */
function ctx(req) {
  return {
    ip: h.clientIp(req, config.security.trustProxy),
    ua: req.headers["user-agent"] || ""
  };
}

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;
  const method = req.method;
  const c = ctx(req);

  // ---- 静态资源 ----
  if (STATIC[p]) {
    const s = STATIC[p];
    if (!fs.existsSync(s.file)) return h.send(res, 404, "not found", h.securityHeaders());
    return h.send(res, 200, fs.readFileSync(s.file, "utf8"),
      h.securityHeaders({ "Content-Type": s.type, "Cache-Control": "public, max-age=300" }));
  }

  // ---- 健康检查（供 nginx/监控探测；不泄露内部信息） ----
  if (p === "/healthz") {
    const ok = await db.healthcheck();
    return h.sendJson(res, ok ? 200 : 503, { ok: ok }, h.securityHeaders());
  }

  const sess = await currentUser(req);

  // ---- 登录 ----
  // HEAD 与 GET 同等处理：否则 HEAD /login 会落入「未登录 -> 跳 /login」形成重定向环，
  // 导致健康检查/监控/抓取工具（含 curl -I）报 "too many redirects"。
  if (p === "/login" && (method === "GET" || method === "HEAD")) {
    if (sess) return redirect(res, "/articles");
    return html(res, 200, views.loginPage({}));
  }
  if (p === "/login" && method === "POST") {
    // 限流（V2 §6.3）
    if (auth.isRateLimited(c.ip)) {
      await auth.audit(null, "login.ratelimited", null, { ip: c.ip }, c.ip);
      return html(res, 429, views.loginPage({ error: "尝试次数过多，请 15 分钟后再试。" }));
    }
    const form = h.parseForm(await h.readBody(req, 16 * 1024));
    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");
    const r = await db.query(
      "SELECT id, email, name, password_hash, is_root, status, must_change_password, failed_logins, locked_until " +
      "FROM users WHERE lower(email) = $1", [email]);
    const u = r.rows[0];
    // 统一的失败响应，避免账号枚举
    const fail = async function (reason) {
      auth.recordAttempt(c.ip);
      await auth.audit(null, "login.failed", email, { reason: reason, ip: c.ip }, c.ip);
      return html(res, 401, views.loginPage({ error: "邮箱或密码不正确。" }));
    };
    if (!u) return fail("no-such-user");
    if (u.status !== "active") return fail("disabled");
    if (u.locked_until && new Date(u.locked_until) > new Date()) return fail("locked");
    if (!auth.verifyPassword(password, u.password_hash)) {
      // 单账号失败计数（V2 §6.3）
      const n = (u.failed_logins || 0) + 1;
      const lock = n >= config.security.loginMaxAttempts ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await db.query("UPDATE users SET failed_logins = $2, locked_until = $3 WHERE id = $1", [u.id, n, lock]);
      return fail("bad-password");
    }
    // 密码正确。若该用户开启了 2FA，先不建完整会话，进入第二步验证。
    //
    // 关键安全点：会话在这里**尚未创建**，只是记一个短时效的「待验证」标记。
    // 因此即使有人拿到密码，也无法绕过第二步取到有效会话。
    const tr = await db.query("SELECT totp_enabled FROM users WHERE id = $1", [u.id]);
    if (tr.rows[0] && tr.rows[0].totp_enabled) {
      auth.clearAttempts(c.ip);
      await db.query("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = $1", [u.id]);
      const pending = await auth.createPendingTotp(u.id, c.ip, c.ua);
      await auth.audit({ user_id: u.id, email: u.email }, "login.totp_required", null, null, c.ip);
      const pc = h.cookieHeader("fx_totp_pending", pending, {
        secure: config.session.secure, maxAge: 5 * 60 * 1000, httpOnly: true, sameSite: "Lax"
      });
      return h.send(res, 302, "", h.securityHeaders({ Location: "/login/totp", "Set-Cookie": pc }));
    }
    // 成功
    auth.clearAttempts(c.ip);
    await db.query("UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = now() WHERE id = $1", [u.id]);
    const s = await auth.createSession(u.id, c.ip, c.ua);
    await auth.audit({ user_id: u.id, email: u.email }, "login.success", null, null, c.ip);
    const cookie = h.cookieHeader(config.session.cookieName, s.token, {
      secure: config.session.secure, maxAge: config.session.absoluteMs, httpOnly: true, sameSite: "Lax"
    });
    return h.send(res, 302, "", h.securityHeaders({
      Location: u.must_change_password ? "/change-password" : "/articles",
      "Set-Cookie": cookie
    }));
  }

  // ---- 登录第二步：2FA 验证 ----
  if (p === "/login/totp") {
    const cookies2 = h.parseCookies(req.headers.cookie);
    const pendTok = cookies2["fx_totp_pending"];
    const pend = auth.peekPendingTotp(pendTok);
    if (!pend) {
      return redirect(res, "/login");
    }
    if (method === "GET") {
      return html(res, 200, views.totpChallengePage({ csrf: "" }));
    }
    const form = h.parseForm(await h.readBody(req, 8192));
    // 限流同样适用，防止暴力猜 6 位码
    if (auth.isRateLimited(c.ip)) {
      await auth.audit(null, "totp.ratelimited", null, { ip: c.ip }, c.ip);
      return html(res, 429, views.totpChallengePage({ error: "尝试次数过多，请稍后再试。" }));
    }
    const used = auth.takePendingTotp(pendTok);
    if (!used) return redirect(res, "/login");
    const ur = await db.query("SELECT id, email, name, is_root, status, must_change_password, totp_secret, totp_enabled FROM users WHERE id = $1", [used.userId]);
    const u2 = ur.rows[0];
    if (!u2 || u2.status !== "active" || !u2.totp_enabled) return redirect(res, "/login");
    const code = String(form.code || "").trim();
    let okCode = totp.verify(u2.totp_secret, code);
    // 恢复码：一次性，用后作废
    if (!okCode && code.length >= 8) {
      const hh = totp.hashCode(code);
      const rr = await db.query("SELECT id FROM recovery_codes WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL", [u2.id, hh]);
      if (rr.rows.length) {
        await db.query("UPDATE recovery_codes SET used_at = now() WHERE id = $1", [rr.rows[0].id]);
        okCode = true;
        await auth.audit({ user_id: u2.id, email: u2.email }, "totp.recovery_used", null, null, c.ip);
      }
    }
    if (!okCode) {
      auth.recordAttempt(c.ip);
      await auth.audit({ user_id: u2.id, email: u2.email }, "totp.failed", null, null, c.ip);
      // 校验失败要重新走第一步（pending 已作废），避免无限重试
      const np = await auth.createPendingTotp(u2.id, c.ip, c.ua);
      const pc2 = h.cookieHeader("fx_totp_pending", np, { secure: config.session.secure, maxAge: 5 * 60 * 1000, httpOnly: true, sameSite: "Lax" });
      return h.send(res, 401, views.totpChallengePage({ error: "验证码不正确，请重试（确认手机时间准确）" }), h.securityHeaders({
        "Content-Type": "text/html; charset=utf-8", "Set-Cookie": pc2
      }));
    }
    // 通过：建立正式会话
    auth.clearAttempts(c.ip);
    await db.query("UPDATE users SET last_login_at = now(), failed_logins = 0, locked_until = NULL WHERE id = $1", [u2.id]);
    const s2 = await auth.createSession(u2.id, c.ip, c.ua);
    await auth.audit({ user_id: u2.id, email: u2.email }, "login.success", null, { via: "totp" }, c.ip);
    const ck = h.cookieHeader(config.session.cookieName, s2.token, {
      secure: config.session.secure, maxAge: config.session.absoluteMs, httpOnly: true, sameSite: "Lax"
    });
    const clr = "fx_totp_pending=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax";
    return h.send(res, 302, "", h.securityHeaders({
      Location: u2.must_change_password ? "/change-password" : "/articles",
      "Set-Cookie": [ck, clr]
    }));
  }
  // ---- 登出 ----
  if (p === "/logout" && method === "POST") {
    if (sess) {
      const form = h.parseForm(await h.readBody(req, 4096));
      if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", sess));
      await auth.audit(sess.user, "logout", null, null, c.ip);
      await auth.destroySession(sess.token);
    }
    return h.send(res, 302, "", h.securityHeaders({
      Location: "/login",
      "Set-Cookie": h.clearCookieHeader(config.session.cookieName, { secure: config.session.secure })
    }));
  }

  // ---- 邀请激活（未登录可访问，token 校验） ----
  if (p === "/activate" && method === "GET") {
    const token = url.searchParams.get("t") || "";
    const inv = await invites.verify(token);
    if (!inv) return html(res, 400, views.simplePage("激活链接无效", "链接无效、已过期或已被使用。请联系管理员重新生成。", {}));
    return html(res, 200, views.changePasswordPage({ csrf: "", forced: true, activateToken: token }));
  }
  if (p === "/activate" && method === "POST") {
    const form = h.parseForm(await h.readBody(req, 64 * 1024));
    const inv = await invites.verify(form.t || "");
    if (!inv) return html(res, 400, views.simplePage("激活链接无效", "链接无效、已过期或已被使用。", {}));
    const errs = auth.validatePasswordStrength(form.password);
    if (form.password !== form.password2) errs.push("两次输入的密码不一致");
    if (errs.length) return html(res, 400, views.changePasswordPage({ error: errs.join("；"), forced: true, activateToken: form.t }));
    const created = await invites.consume(form.t, form.password);
    await auth.audit(null, "user.activated", created.email, { role: created.role }, c.ip);
    return html(res, 200, views.simplePage("账号已激活", "密码设置成功，请返回登录页登录。", {}));
  }

  // ---- 媒体文件：公开可读（文章正文里的图片，读者也要能看到） ----
  // 必须在鉴权门槛之前处理；文件名用严格正则白名单，路径穿越一律 404。
    // 直接服务媒体文件（绕过 nginx 的静态规则，便于本地/容器内一致；线上由 nginx 直接命中）
  if (p.indexOf("/media/") === 0 && method === "GET") {
    const name = p.slice("/media/".length);
    // 只允许「日期-随机hex.扩展名」这一种形态，杜绝路径穿越
    if (!/^[0-9]{8}-[0-9a-f]{12}\.(png|jpg|webp|gif|avif)$/.test(name)) {
      return h.send(res, 404, "not found", h.securityHeaders());
    }
    const full = path.join(media.MEDIA_DIR, name);
    if (!fs.existsSync(full)) return h.send(res, 404, "not found", h.securityHeaders());
    const ext = name.split(".").pop();
    const type = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif" }[ext] || "application/octet-stream";
    return h.send(res, 200, fs.readFileSync(full), h.securityHeaders({ "Content-Type": type, "Cache-Control": "public, max-age=2592000, immutable" }));
  }


  // ---- 以下全部需要登录 ----
  if (!sess) return redirect(res, "/login");

  // 强制改密（V2 §5.1.3）：除改密与登出外一律拦截
  if (sess.user.must_change_password && p !== "/change-password") {
    return redirect(res, "/change-password");
  }

  const pageOpts = { user: sess.user, roles: sess.roles, csrf: sess.user.csrf_token };

  /* ---------------- 文章状态流转（行内快捷操作 / 批量操作共用） ----------------
     统一在这里定义「哪些流转合法、需要什么能力」，列表页与路由都引用同一份，
     避免「界面上给了按钮、路由却拒绝」的两套规则漂移。 */
  const STATUS_TRANSITIONS = {
    in_review:         { from: ["draft"], cap: "article:submit",  label: "提交审核" },
    published:         { from: ["draft", "in_review"], cap: "article:publish", label: "发布" },
    changes_requested: { from: ["in_review"], cap: "article:review", label: "退回修改" },
    draft:             { from: ["changes_requested", "in_review", "archived"], cap: "article:edit", label: "转回草稿" },
    archived:          { from: ["published", "draft"], cap: "article:archive", label: "归档" }
  };
  /* 对单篇执行状态流转：校验合法性 + 权限 + 领域范围，返回 {ok, reason}。
     发布走完整链路（更新 reviewer、入发布队列），其余只改状态。 */
  async function applyStatusTransition(slug, to, user, ip) {
    const rule = STATUS_TRANSITIONS[to];
    if (!rule) return { ok: false, reason: "未知的目标状态：" + to };
    let art;
    try { art = articles.read(slug); } catch (e) { return { ok: false, reason: "文章不存在" }; }
    if (rule.from.indexOf(art.meta.status || "draft") < 0) {
      return { ok: false, reason: "当前状态（" + (views.statusLabel ? views.statusLabel(art.meta.status) : art.meta.status) + "）不允许" + rule.label };
    }
    if (!await auth.can(user, rule.cap)) return { ok: false, reason: "没有「" + rule.label + "」权限" };
    if (!await auth.canEditDomain(user, art.meta.domain)) return { ok: false, reason: "超出可编辑领域" };
    if (to === "published") {
      await db.query("UPDATE articles_meta SET status='published', reviewer_id=$2, updated_at=now() WHERE slug=$1", [slug, user.user_id]);
      await publisher.enqueue(slug, "publish", user.user_id);
    } else {
      await db.query("UPDATE articles_meta SET status=$2, updated_at=now() WHERE slug=$1", [slug, to]);
    }
    await auth.audit(user, "article.status." + to, slug, { from: art.meta.status || "draft" }, ip);
    return { ok: true };
  }


  // ---- 改密 ----
  if (p === "/change-password") {
    if (method === "GET") {
      return html(res, 200, views.changePasswordPage({ csrf: sess.user.csrf_token, forced: sess.user.must_change_password }));
    }
    const form = h.parseForm(await h.readBody(req, 64 * 1024));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.changePasswordPage({ csrf: sess.user.csrf_token, error: "CSRF 校验失败" }));
    if (!sess.user.must_change_password) {
      const r = await db.query("SELECT password_hash FROM users WHERE id = $1", [sess.user.user_id]);
      if (!auth.verifyPassword(String(form.current || ""), r.rows[0].password_hash)) {
        return html(res, 400, views.changePasswordPage({ csrf: sess.user.csrf_token, error: "当前密码不正确" }));
      }
    }
    const errs = auth.validatePasswordStrength(form.password);
    if (form.password !== form.password2) errs.push("两次输入的密码不一致");
    if (errs.length) return html(res, 400, views.changePasswordPage({ csrf: sess.user.csrf_token, error: errs.join("；"), forced: sess.user.must_change_password }));
    await db.query("UPDATE users SET password_hash = $2, must_change_password = false, updated_at = now() WHERE id = $1",
      [sess.user.user_id, auth.hashPassword(form.password)]);
    // 改密即失效该用户全部会话（V2 §5.7），然后为新会话重新签发
    await auth.destroyAllSessionsForUser(sess.user.user_id);
    const s = await auth.createSession(sess.user.user_id, c.ip, c.ua);
    await auth.audit(sess.user, "password.changed", null, null, c.ip);
    return h.send(res, 302, "", h.securityHeaders({
      Location: "/articles",
      "Set-Cookie": h.cookieHeader(config.session.cookieName, s.token, {
        secure: config.session.secure, maxAge: config.session.absoluteMs, httpOnly: true, sameSite: "Lax"
      })
    }));
  }

  // ---- 工作台（行动仪表盘） ----
  // 只统计能触发动作的信息（研究结论：不要虚荣指标）
  if (p === "/dashboard") {
    const all = await loadArticlesWithStatus();
    // 每篇的负责人（author_id / reviewer_id）——「待我审核」必须按当前用户过滤，
    // 否则给的是全站总数，等于没有待办。
    // 注意：me / isMine 曾在一次重构中丢失定义，导致本路由运行时报
    // ReferenceError（模块能加载不代表路由能跑）。这里补回并加兜底。
    const ownerRows = await db.query("SELECT slug, author_id, reviewer_id FROM articles_meta");
    const owners = {};
    ownerRows.rows.forEach(function (r) { owners[r.slug] = r; });
    const me = sess.user.user_id;
    const isMine = function (a) {
      const o = owners[a.slug];
      return !!o && (o.author_id === me || o.reviewer_id === me);
    };
    const today = Date.now();
    const daysSince = function (d) {
      if (!d) return null;
      const t = new Date(String(d) + "T00:00:00Z").getTime();
      if (isNaN(t)) return null;
      return Math.floor((today - t) / 86400000);
    };
    const stats = {
      // 「待我审核」「我的草稿」按当前用户过滤 —— 给全站总数等于没给待办
      inReview: all.filter(function (a) { return a.status === "in_review" && (me === null || isMine(a)); }).length,
      inReviewAll: all.filter(function (a) { return a.status === "in_review"; }).length,
      drafts: all.filter(function (a) { return a.status === "draft" && (me === null || isMine(a)); }).length,
      changesRequested: all.filter(function (a) { return a.status === "changes_requested" && (me === null || isMine(a)); }).length,
      published: all.filter(function (a) { return a.status === "published"; }).length,
      stale: all.filter(function (a) {
        if (a.status !== "published") return false;
        const d = daysSince(a.reviewed_at);
        return d === null || d > 180;
      }).length,
      missingSources: all.filter(function (a) { return (a.sourcesCount || 0) < 1; }).length
    };
    const recent = all.slice().sort(function (a, b) {
      return String(b.updated || "").localeCompare(String(a.updated || ""));
    }).slice(0, 8);
    const stale = all.filter(function (a) {
      if (a.status !== "published") return false;
      const d = daysSince(a.reviewed_at);
      return d === null || d > 180;
    }).map(function (a) {
      return Object.assign({}, a, { days: daysSince(a.reviewed_at) });
    }).sort(function (a, b) {
      return (b.days === null ? 99999 : b.days) - (a.days === null ? 99999 : a.days);
    });
    // ---- 数据看板所需聚合（全部来自真实数据，不做假图表）----
    const tax = taxonomy();
    const domName = {}, domShort = {};
    (tax.domains || []).forEach(function (d) {
      domName[d.id] = d.name;
      // 图上标签位置有限，取前 4 个字符
      // 图上标签位置有限（约 6 个中文字宽）。规则：
      //   · 含空格：首词 + 次词前 2 字 —— 例如 "Windows 系统与开机" -> "Windows 系统"
      //     只用首词会撞车（两个域名都叫 "Windows"），必须保留区分度
      //   · 纯中文：取前 6 字，避免 "路由器与家" 这类断在半截的读法
      const nm = String(d.name).trim();
      const parts = nm.split(/\s+/);
      if (parts.length > 1) {
        // 次词 ≤3 字符（如 VPN、DNS）时保留整词，避免切成 "VP"
        const w = parts[1];
        const second = w.length <= 3 ? w : w.slice(0, 2);
        domShort[d.id] = second ? (parts[0] + " " + second) : parts[0];
      } else {
        domShort[d.id] = nm.length > 6 ? nm.slice(0, 6) : nm;
      }
    });
    const domCount = {};
    all.forEach(function (a) {
      const k = a.domain || "未分类";
      domCount[k] = (domCount[k] || 0) + 1;
    });
    const byDomain = Object.keys(domCount).map(function (k) {
      return { id: k, name: domName[k] || k, short: domShort[k] || k, n: domCount[k] };
    }).sort(function (a, b) { return b.n - a.n; });

    const byStatus = { published: 0, draft: 0, in_review: 0, changes_requested: 0, archived: 0 };
    all.forEach(function (a) {
      const k = a.status || "draft";
      if (byStatus[k] === undefined) byStatus[k] = 0;
      byStatus[k]++;
    });

    // 近 80 天更新活动：按 front-matter 的 updated 逐日统计
    // 说明：这是「内容被更新的密度」，不是访问量 —— 后台没有埋点，不编造流量数据
    const dayMs = 86400000;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const perDay = {};
    all.forEach(function (a) {
      if (!a.updated) return;
      const t = new Date(String(a.updated) + "T00:00:00").getTime();
      if (isNaN(t)) return;
      const key = Math.floor((t - todayStart.getTime()) / dayMs);
      perDay[key] = (perDay[key] || 0) + 1;
    });
    const maxDay = Object.keys(perDay).reduce(function (m, k) { return Math.max(m, perDay[k]); }, 1);
    const heat = [];
    for (let i = 79; i >= 0; i--) {
      const n = perDay[-i] || 0;
      const level = n === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(n / maxDay * 4)));
      const d = new Date(todayStart.getTime() - i * dayMs);
      heat.push({ n: n, level: level, label: (d.getMonth() + 1) + "月" + d.getDate() + "日" });
    }

    // ---- 发布节奏（近 30 天成功发布次数，来自 publish_jobs 真实记录）----
    const pubTrend = [];
    try {
      const tr = await db.query(
        "SELECT to_char(date_trunc('day', finished_at), 'YYYY-MM-DD') AS d, count(*)::int AS n " +
        "FROM publish_jobs WHERE status='succeeded' AND finished_at > now() - interval '30 days' " +
        "GROUP BY 1");
      const byDay = {};
      tr.rows.forEach(function (r) { byDay[r.d] = r.n; });
      const dayMs = 86400000;
      const start = new Date(); start.setHours(0, 0, 0, 0);
      for (let i = 29; i >= 0; i--) {
        const d = new Date(start.getTime() - i * dayMs);
        const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        pubTrend.push({ label: (d.getMonth() + 1) + "/" + d.getDate(), n: byDay[key] || 0 });
      }
    } catch (e) { /* publish_jobs 表不可用时降级为空图，不阻塞工作台 */ }

    return html(res, 200, views.dashboardPage(Object.assign({
      stats: stats, recent: recent, stale: stale,
      byDomain: byDomain, byStatus: byStatus, heat: heat,
      pubTrend: pubTrend,
      total: all.length
    }, pageOpts)));
  }

  // ---- Taxonomy management ----
  if (p === "/taxonomy") {
    if (!await auth.can(sess.user, "settings:write")) {
      return html(res, 403, views.simplePage("没有权限", "只有管理员可以维护领域与分类。", pageOpts));
    }
    const usage = await taxonomyUsage();
    return html(res, 200, views.taxonomyPage(Object.assign({
      taxonomy: taxonomy(), usage: usage,
      notice: url.searchParams.get("notice"), error: url.searchParams.get("error")
    }, pageOpts)));
  }

  if (p === "/taxonomy/domain" && method === "POST") {
    if (!await auth.can(sess.user, "settings:write")) {
      return html(res, 403, views.simplePage("没有权限", "只有管理员可以维护领域与分类。", pageOpts));
    }
    const form = h.parseForm(await h.readBody(req, 32 * 1024));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return taxonomyRedirect(res, null, "CSRF 校验失败");
    try {
      const tax = taxonomy();
      const action = String(form.action || "save");
      if (action === "create") {
        const id = taxonomyId(form.id);
        const name = taxonomyName(form.name);
        if (tax.domains.some(function (d) { return d.id === id; })) throw new Error("该领域 ID 已存在");
        tax.domains.push({ id: id, name: name, cats: [] });
        writeTaxonomy(tax);
        await auth.audit(sess.user, "taxonomy.domain.create", id, { name: name }, c.ip);
        return taxonomyRedirect(res, "领域已创建");
      }

      const id = String(form.id || "");
      const domain = tax.domains.filter(function (d) { return d.id === id; })[0];
      if (!domain) throw new Error("领域不存在");

      if (action === "delete") {
        const usage = await taxonomyUsage();
        const catIds = (domain.cats || []).map(function (cat) { return cat.id; });
        const used = (usage.domains[id] || 0) + catIds.reduce(function (n, catId) { return n + (usage.cats[catId] || 0); }, 0);
        if (used > 0) throw new Error("该领域下仍有 " + used + " 篇文章，不能删除");
        tax.domains = tax.domains.filter(function (d) { return d.id !== id; });
        writeTaxonomy(tax);
        await auth.audit(sess.user, "taxonomy.domain.delete", id, { name: domain.name }, c.ip);
        return taxonomyRedirect(res, "领域已删除");
      }

      domain.name = taxonomyName(form.name);
      writeTaxonomy(tax);
      await auth.audit(sess.user, "taxonomy.domain.update", id, { name: domain.name }, c.ip);
      return taxonomyRedirect(res, "领域名称已更新");
    } catch (e) {
      return taxonomyRedirect(res, null, e.message);
    }
  }

  if (p === "/taxonomy/category" && method === "POST") {
    if (!await auth.can(sess.user, "settings:write")) {
      return html(res, 403, views.simplePage("没有权限", "只有管理员可以维护领域与分类。", pageOpts));
    }
    const form = h.parseForm(await h.readBody(req, 32 * 1024));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return taxonomyRedirect(res, null, "CSRF 校验失败");
    try {
      const tax = taxonomy();
      const action = String(form.action || "save");
      const domain = tax.domains.filter(function (d) { return d.id === String(form.domain_id || ""); })[0];
      if (!domain) throw new Error("所属领域不存在");
      if (!Array.isArray(domain.cats)) domain.cats = [];

      if (action === "create") {
        const id = taxonomyId(form.id);
        const name = taxonomyName(form.name);
        if (tax.domains.some(function (d) {
          return (d.cats || []).some(function (cat) { return cat.id === id; });
        })) throw new Error("该分类 ID 已存在");
        domain.cats.push({ id: id, name: name });
        writeTaxonomy(tax);
        await auth.audit(sess.user, "taxonomy.category.create", id, { domain: domain.id, name: name }, c.ip);
        return taxonomyRedirect(res, "分类已创建");
      }

      const id = String(form.id || "");
      const cat = domain.cats.filter(function (item) { return item.id === id; })[0];
      if (!cat) throw new Error("分类不存在");

      if (action === "delete") {
        const usage = await taxonomyUsage();
        if ((usage.cats[id] || 0) > 0) throw new Error("该分类下仍有 " + usage.cats[id] + " 篇文章，不能删除");
        domain.cats = domain.cats.filter(function (item) { return item.id !== id; });
        writeTaxonomy(tax);
        await auth.audit(sess.user, "taxonomy.category.delete", id, { domain: domain.id, name: cat.name }, c.ip);
        return taxonomyRedirect(res, "分类已删除");
      }

      cat.name = taxonomyName(form.name);
      writeTaxonomy(tax);
      await auth.audit(sess.user, "taxonomy.category.update", id, { domain: domain.id, name: cat.name }, c.ip);
      return taxonomyRedirect(res, "分类名称已更新");
    } catch (e) {
      return taxonomyRedirect(res, null, e.message);
    }
  }

  // ---- 文章列表（筛选 / 排序 / 分页全部走 URL 查询参数） ----
  // 为什么用 URL 而非 JS 状态：可刷新、可分享、可收藏、可后退（WordPress/Directus 的标准做法）
  if (p === "/" || p === "/articles") {
    const canCreate = await auth.can(sess.user, "article:create");
    let items = await loadArticlesWithStatus();

    // 筛选
    const qStatus = url.searchParams.get("status") || "";
    const qDomain = url.searchParams.get("domain") || "";
    const qRisk = url.searchParams.get("risk") || "";
    const qSearch = (url.searchParams.get("q") || "").trim();
    const qStale = url.searchParams.get("stale") === "1";
    const qMissing = url.searchParams.get("missing") || "";
    const qSort = url.searchParams.get("sort") || "-updated";

    const total = items.length;
    /* 状态 tab 的计数：必须在筛选前算好（下面 items 会被逐个 filter 覆盖） */
    const statusCounts = { published: 0, draft: 0, in_review: 0, changes_requested: 0, archived: 0 };
    items.forEach(function (a) {
      const k = a.status || "draft";
      if (statusCounts[k] === undefined) statusCounts[k] = 0;
      statusCounts[k]++;
    });
    const daysSince2 = function (d) {
      if (!d) return null;
      const t = new Date(String(d) + "T00:00:00Z").getTime();
      return isNaN(t) ? null : Math.floor((Date.now() - t) / 86400000);
    };
    if (qStatus) items = items.filter(function (a) { return a.status === qStatus; });
    if (qDomain) items = items.filter(function (a) { return a.domain === qDomain; });
    if (qRisk) items = items.filter(function (a) { return a.risk === qRisk; });
    if (qStale) items = items.filter(function (a) { const d = daysSince2(a.reviewed_at); return a.status === "published" && (d === null || d > 180); });
    if (qMissing === "sources") items = items.filter(function (a) { return (a.sourcesCount || 0) < 1; });
    if (qSearch) {
      const needle = qSearch.toLowerCase();
      items = items.filter(function (a) {
        return (a.title || "").toLowerCase().indexOf(needle) >= 0 ||
               (a.slug || "").toLowerCase().indexOf(needle) >= 0;
      });
    }

    // 排序
    const desc = qSort.charAt(0) === "-";
    const key = desc ? qSort.slice(1) : qSort;
    items.sort(function (a, b) {
      let x = a[key], y = b[key];
      if (key === "sourcesCount") { x = a.sourcesCount; y = b.sourcesCount; }
      if (typeof x === "number" && typeof y === "number") return desc ? y - x : x - y;
      const r = String(x || "").localeCompare(String(y || ""));
      return desc ? -r : r;
    });

    // 分页（非技术用户场景一律分页，不用无限滚动）
    const perPage = 20;
    const pageNo = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const filtered = items.length;
    const pages = Math.max(1, Math.ceil(filtered / perPage));
    const pageItems = items.slice((pageNo - 1) * perPage, pageNo * perPage);

    const savedViews = await collab.listViews(sess.user.user_id);
    const currentQs = url.searchParams.toString().replace(/(^|&)notice=[^&]*/g, "").replace(/^&/, "");
    /* 行内快捷操作/批量条的按钮可见性：按当前用户的真实能力渲染（路由层仍会逐条校验） */
    const rowCaps = {
      submit: await auth.can(sess.user, "article:submit"),
      review: await auth.can(sess.user, "article:review"),
      publish: await auth.can(sess.user, "article:publish"),
      edit: await auth.can(sess.user, "article:edit"),
      archive: await auth.can(sess.user, "article:archive")
    };
    return html(res, 200, views.articlesPage(Object.assign({
      items: pageItems, canCreate: canCreate, views: savedViews, currentQs: currentQs,
      total: total, filtered: filtered, page: pageNo, pages: pages, perPage: perPage,
      statusCounts: statusCounts, rowCaps: rowCaps,
      filters: { status: qStatus, domain: qDomain, risk: qRisk, q: qSearch, stale: qStale, missing: qMissing, sort: qSort },
      domains: taxonomy().domains, risks: taxonomy().enums.risk,
      notice: url.searchParams.get("notice")
    }, pageOpts)));
  }


  // ---- 新建 ----
  if (p === "/articles/new") {
    if (!await auth.can(sess.user, "article:create")) return html(res, 403, views.simplePage("没有权限", "你的角色不能新建文章。", pageOpts));
    if (method === "GET") {
      return html(res, 200, views.editorPage(Object.assign({
        isExisting: false, meta: { version: "1.0", risk: "需谨慎", difficulty: "入门" },
        body: articles.BODY_SKELETON, taxonomy: taxonomy(), sections: sectionRules(),
        canManageTaxonomy: await auth.can(sess.user, "settings:write")
      }, pageOpts)));
    }
    // POST 新建
    const form = h.parseForm(await h.readBody(req, 3 * 1024 * 1024));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    try {
      const meta = formToMeta(form);
      const r = articles.createDraft(meta.slug, meta, form.body);
      await db.query(
        "INSERT INTO articles_meta (slug, title, domain, category, status, content_hash, author_id, file_path) " +
        "VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (slug) DO UPDATE SET title=$2, content_hash=$6, updated_at=now()",
        [meta.slug, meta.title, meta.domain, meta.category, "draft", r.contentHash, sess.user.user_id, "drafts"]);
      await auth.audit(sess.user, "article.create", meta.slug, { title: meta.title }, c.ip);
      return redirect(res, "/articles/" + meta.slug + "?notice=" + encodeURIComponent("草稿已创建"));
    } catch (e) {
      return html(res, e.status || 500, views.editorPage(Object.assign({
        isExisting: false, meta: formToMeta(form), body: form.body,
        taxonomy: taxonomy(), error: e.message
      }, pageOpts)));
    }
  }

  /* ---------------- 预览（编辑器实时分栏） ----------------
     复用站点构建的同一套 mdToHtml，保证「预览所见 = 线上所见」。
     只做渲染不做写盘，CSRF 走表单字段；输出为站点同款 HTML 片段。 */
  if (p === "/articles/preview" && method === "POST") {
    if (!await auth.can(sess.user, "article:edit")) return h.sendJson(res, 403, { error: "没有权限" }, h.securityHeaders());
    const form = h.parseForm(await h.readBody(req, 512 * 1024));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return h.sendJson(res, 403, { error: "CSRF 校验失败" }, h.securityHeaders());
    try {
      const siteBuild = require(path.join(config.repo.root, "build-fix.cjs"));
      const html = siteBuild.mdToHtml(String(form.md || ""));
      return h.sendJson(res, 200, { html: html }, h.securityHeaders());
    } catch (e) {
      return h.sendJson(res, 500, { error: "渲染失败：" + e.message }, h.securityHeaders());
    }
  }

  /* ---------------- 自动存草稿（编辑器每 30s 调一次） ----------------
     与手动保存的差异：跳过 lint 闸门（草稿允许写到一半）与修订快照（避免噪音），
     保存成功后把新的 contentHash 返还给页面，防止下一次手动保存误报 409 冲突。 */
  const mAutosave = p.match(/^\/articles\/([a-z0-9-]+)\/autosave$/);
  if (mAutosave && method === "POST") {
    const slug = mAutosave[1];
    let art;
    try { art = articles.read(slug); } catch (e) { return h.sendJson(res, 404, { error: "文章不存在" }, h.securityHeaders()); }
    if (!await auth.can(sess.user, "article:edit")) return h.sendJson(res, 403, { error: "没有权限" }, h.securityHeaders());
    if (!await auth.canEditDomain(sess.user, art.meta.domain)) return h.sendJson(res, 403, { error: "超出可编辑领域" }, h.securityHeaders());
    const form = h.parseForm(await h.readBody(req, 3 * 1024 * 1024));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return h.sendJson(res, 403, { error: "CSRF 校验失败" }, h.securityHeaders());
    try {
      const meta = formToMeta(form, art.meta);
      const saved = articles.save(slug, meta, form.body, { baseHash: form.baseHash || null });
      await db.query("UPDATE articles_meta SET title=$2, domain=$3, category=$4, content_hash=$5, updated_at=now() WHERE slug=$1",
        [slug, meta.title, meta.domain, meta.category, saved.contentHash]);
      await auth.audit(sess.user, "article.autosave", slug, null, c.ip);
      return h.sendJson(res, 200, { ok: true, hash: saved.contentHash, at: new Date().toISOString() }, h.securityHeaders());
    } catch (e) {
      return h.sendJson(res, e.status || 500, { error: e.message }, h.securityHeaders());
    }
  }

  /* ---------------- 行内快捷状态流转（列表页单篇按钮） ---------------- */
  const mRowStatus = p.match(/^\/articles\/([a-z0-9-]+)\/status$/);
  if (mRowStatus && method === "POST") {
    const form = h.parseForm(await h.readBody(req, 8192));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    const r = await applyStatusTransition(mRowStatus[1], String(form.to || ""), sess.user, c.ip);
    if (!r.ok) return redirect(res, "/articles?error=" + encodeURIComponent(mRowStatus[1] + "：" + r.reason));
    return redirect(res, "/articles?notice=" + encodeURIComponent("已" + (STATUS_TRANSITIONS[String(form.to || "")] || { label: "更新" }).label + "：" + mRowStatus[1]));
  }

  /* ---------------- 批量状态流转（列表页多选） ----------------
     逐篇校验：合法且有权力的执行，其余跳过并计数 —— 一条不合法不至于整批失败。 */
  if (p === "/articles/batch-status" && method === "POST") {
    const form = h.parseForm(await h.readBody(req, 256 * 1024));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    const to = String(form.to || "");
    const slugs = Array.isArray(form.slugs) ? form.slugs : (form.slugs ? [form.slugs] : []);
    if (!slugs.length) return redirect(res, "/articles?error=" + encodeURIComponent("没有勾选任何文章"));
    let done = 0;
    const skipped = [];
    for (const slug of slugs.slice(0, 100)) {
      const r = await applyStatusTransition(String(slug), to, sess.user, c.ip);
      if (r.ok) done++; else skipped.push(slug + "（" + r.reason + "）");
    }
    const msg = "批量" + (STATUS_TRANSITIONS[to] ? STATUS_TRANSITIONS[to].label : "更新") + "：成功 " + done + " 篇" +
      (skipped.length ? "，跳过 " + skipped.length + " 篇：" + skipped.slice(0, 3).join("；") + (skipped.length > 3 ? " 等" : "") : "");
    return redirect(res, "/articles?" + (done ? "notice=" : "error=") + encodeURIComponent(msg));
  }

  // ---- 单篇：编辑 / 保存 / 发布 ----
  const mArticle = p.match(/^\/articles\/([a-z0-9-]+)$/);
  if (mArticle) {
    const slug = mArticle[1];
    let art;
    try { art = articles.read(slug); } catch (e) {
      return html(res, 404, views.simplePage("文章不存在", "找不到 slug 为 " + slug + " 的文章。", pageOpts));
    }
    if (!await auth.can(sess.user, "article:edit")) return html(res, 403, views.simplePage("没有权限", "你的角色不能编辑文章。", pageOpts));
    if (!await auth.canEditDomain(sess.user, art.meta.domain)) {
      return html(res, 403, views.simplePage("超出编辑范围", "你的账号被限定在特定领域，不能编辑「" + (art.meta.domain || "") + "」下的文章。", pageOpts));
    }

    if (method === "GET") {
      const canPublish = await auth.can(sess.user, "article:publish");
      const cmts = await collab.listComments(slug);
      let revCount = 0;
      try { const rv = await collab.listRevisions(slug); revCount = rv.length; } catch (e) {}
      return html(res, 200, views.editorPage(Object.assign({
        isExisting: true, slug: slug, meta: art.meta, body: art.body,
        contentHash: art.contentHash, taxonomy: taxonomy(), canPublish: canPublish,
        comments: cmts, revCount: revCount, sections: sectionRules(),
        canManageTaxonomy: await auth.can(sess.user, "settings:write"),
        notice: url.searchParams.get("notice"), error: url.searchParams.get("error")
      }, pageOpts)));
    }

    // POST 保存 / 发布
    const form = h.parseForm(await h.readBody(req, 3 * 1024 * 1024));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    const action = form.action === "publish" ? "publish" : "save";
    if (action === "publish" && !await auth.can(sess.user, "article:publish")) {
      return html(res, 403, views.simplePage("没有权限", "你的角色不能发布。", pageOpts));
    }
    // 内容校验（与构建共用同一实现）
    try {
      const lint = require(path.join(config.repo.root, "content-lint.cjs"));
      const meta = formToMeta(form, art.meta);
      // 用临时写入校验更准：这里先做字段级校验
      const r = await lintFileCheck(meta, form.body, slug);
      if (r.length) throw Object.assign(new Error("内容校验未通过：" + r.join("；")), { status: 400 });
    } catch (e) {
      if (e.status === 400) {
        return html(res, 400, views.editorPage(Object.assign({
          isExisting: true, slug: slug, meta: formToMeta(form, art.meta), body: form.body,
          contentHash: art.contentHash, taxonomy: taxonomy(), error: e.message,
          canPublish: await auth.can(sess.user, "article:publish")
        }, pageOpts)));
      }
    }
    try {
      const meta = formToMeta(form, art.meta);
      // 保存前记录 sources 数量，用于 V14 式保护
      const beforeSources = Array.isArray(art.meta.sources) ? art.meta.sources.length : 0;
      const saved = articles.save(slug, meta, form.body, { baseHash: form.baseHash || null });
      const after = articles.read(slug);
      const afterSources = Array.isArray(after.meta.sources) ? after.meta.sources.length : 0;
      if (afterSources < beforeSources) {
        // 回滚到保存前（防止后台写坏 sources）
        fs.writeFileSync(articles.locate(slug).file, art.raw, "utf8");
        throw Object.assign(new Error("保存被拦下：sources 数量从 " + beforeSources + " 减少到 " + afterSources + "（疑似数据损坏）"), { status: 400 });
      }
      if (action === "publish") {
        articles.publish(slug, meta, form.body);
        await db.query("UPDATE articles_meta SET status='published', content_hash=$2, reviewer_id=$3, updated_at=now() WHERE slug=$1",
          [slug, saved.contentHash, sess.user.user_id]);
        const job = await publisher.enqueue(slug, "publish", sess.user.user_id);
        await auth.audit(sess.user, "article.publish", slug, { jobId: job.id }, c.ip);
        return redirect(res, "/publish?notice=" + encodeURIComponent("已发布并加入发布队列（任务 #" + job.id + "）"));
      }
      await db.query("UPDATE articles_meta SET title=$2, domain=$3, category=$4, content_hash=$5, updated_at=now() WHERE slug=$1",
        [slug, meta.title, meta.domain, meta.category, saved.contentHash]);
      // 修订快照（含完整文件内容，便于精确回滚）
      await collab.addRevision(slug, fs.readFileSync(articles.locate(slug).file, "utf8"),
        { title: meta.title, status: "saved", contentHash: saved.contentHash }, sess.user.user_id, "保存");
      await auth.audit(sess.user, "article.save", slug, { sources: afterSources }, c.ip);
      return redirect(res, "/articles/" + slug + "?notice=" + encodeURIComponent("已保存"));
    } catch (e) {
      const code = e.status || 500;
      return html(res, code, views.editorPage(Object.assign({
        isExisting: true, slug: slug, meta: formToMeta(form, art.meta), body: form.body,
        contentHash: art.contentHash, taxonomy: taxonomy(), error: e.message,
        canPublish: await auth.can(sess.user, "article:publish")
      }, pageOpts)));
    }
  }

  // ---- 保存视图：新建/删除 ----
  if (p === "/views/save" && method === "POST") {
    const form = h.parseForm(await h.readBody(req, 8192));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    try {
      await collab.saveView(sess.user.user_id, form.name, form.qs || "", form.is_shared === "1");
      await auth.audit(sess.user, "view.save", form.name, { qs: form.qs }, c.ip);
      return redirect(res, "/articles?" + String(form.qs || "").replace(/^\?/, "") + (form.qs ? "&" : "") + "notice=" + encodeURIComponent("视图已保存"));
    } catch (e) {
      return redirect(res, "/articles?error=" + encodeURIComponent(e.message));
    }
  }
  if (p === "/views/delete" && method === "POST") {
    const form = h.parseForm(await h.readBody(req, 4096));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    await collab.deleteView(sess.user.user_id, parseInt(form.id, 10));
    await auth.audit(sess.user, "view.delete", form.id, null, c.ip);
    return redirect(res, "/articles?notice=" + encodeURIComponent("视图已删除"));
  }

  // ---- 修订历史 ----
  const mRev = p.match(/^\/articles\/([a-z0-9-]+)\/revisions$/);
  if (mRev) {
    const slug = mRev[1];
    if (!await auth.can(sess.user, "article:edit")) return html(res, 403, views.simplePage("没有权限", "你的角色不能查看文章历史。", pageOpts));
    const revs = await collab.listRevisions(slug);
    // 与当前版本的 diff
    let art = null;
    try { art = articles.read(slug); } catch (e) { /* 已删除的文章 */ }
    return html(res, 200, views.revisionsPage(Object.assign({
      slug: slug, revisions: revs, current: art ? art.raw : null
    }, pageOpts)));
  }

  // ---- 单篇修订对比 ----
  const mRevDiff = p.match(/^\/articles\/([a-z0-9-]+)\/revisions\/(\d+)$/);
  if (mRevDiff) {
    const slug = mRevDiff[1], no = parseInt(mRevDiff[2], 10);
    if (!await auth.can(sess.user, "article:edit")) return html(res, 403, views.simplePage("没有权限", "你的角色不能查看修订。", pageOpts));
    const rev = await collab.getRevision(slug, no);
    if (!rev) return html(res, 404, views.simplePage("修订不存在", "找不到该版本。", pageOpts));
    let cur = null;
    try { cur = articles.read(slug); } catch (e) {}
    const rows = collab.diffLines(rev.content, cur ? cur.raw : "");
    return html(res, 200, views.revisionDiffPage(Object.assign({
      slug: slug, rev: rev, rows: rows, hasCurrent: !!cur
    }, pageOpts)));
  }

  // ---- 审核评论 ----
  const mComment = p.match(/^\/articles\/([a-z0-9-]+)\/comments$/);
  if (mComment && method === "POST") {
    const slug = mComment[1];
    if (!await auth.can(sess.user, "article:edit")) return html(res, 403, views.simplePage("没有权限", "你的角色不能评论。", pageOpts));
    const form = h.parseForm(await h.readBody(req, 16 * 1024));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    try {
      await collab.addComment(slug, sess.user.user_id, form.body, form.anchor || null);
      await auth.audit(sess.user, "comment.add", slug, null, c.ip);
    } catch (e) {
      return redirect(res, "/articles/" + slug + "?error=" + encodeURIComponent(e.message));
    }
    return redirect(res, "/articles/" + slug + "#comments");
  }

  // ---- 解决 / 重新打开评论 ----
  const mResolve = p.match(/^\/comments\/(\d+)\/(resolve|reopen)$/);
  if (mResolve && method === "POST") {
    const id = parseInt(mResolve[1], 10);
    if (!await auth.can(sess.user, "article:edit")) return html(res, 403, views.simplePage("没有权限", "你的角色不能处理评论。", pageOpts));
    const form = h.parseForm(await h.readBody(req, 4096));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    if (mResolve[2] === "resolve") await collab.resolveComment(id, sess.user.user_id);
    else await collab.reopenComment(id);
    await auth.audit(sess.user, "comment." + mResolve[2], String(id), null, c.ip);
    return redirect(res, "/articles/" + (form.slug || "") + "#comments");
  }
  // ---- 媒体库 ----
  if (p === "/media") {
    if (!await auth.can(sess.user, "article:edit")) return html(res, 403, views.simplePage("没有权限", "你的角色不能管理媒体。", pageOpts));
    const items = await media.list(200);
    return html(res, 200, views.mediaPage(Object.assign({
      items: items,
      notice: url.searchParams.get("notice"), error: url.searchParams.get("error")
    }, pageOpts)));
  }
  // 上传
  if (p === "/media/upload" && method === "POST") {
    if (!await auth.can(sess.user, "article:edit")) return html(res, 403, views.simplePage("没有权限", "你的角色不能上传媒体。", pageOpts));
    const ctype = req.headers["content-type"] || "";
    const bm = /boundary=(.+)$/.exec(ctype);
    if (!bm) return redirect(res, "/media?error=" + encodeURIComponent("请求格式不正确（需要 multipart/form-data）"));
    const raw = await h.readBodyRaw(req, media.MAX_BYTES + 1024 * 1024);
    const parts = media.parseMultipart(raw, bm[1].trim());
    const getField = function (n) { const f = parts.find(function (x) { return x.name === n && x.filename === null; }); return f ? f.data.toString("utf8").trim() : ""; };
    const filePart = parts.find(function (x) { return x.filename !== null; });
    // CSRF
    if (!auth.verifyCsrf(sess.user, getField("_csrf"))) {
      return redirect(res, "/media?error=" + encodeURIComponent("CSRF 校验失败"));
    }
    if (!filePart || !filePart.data || filePart.data.length === 0) {
      return redirect(res, "/media?error=" + encodeURIComponent("请选择文件"));
    }
    const alt = getField("alt");
    const desensitized = getField("desensitized");
    if (!alt) return redirect(res, "/media?error=" + encodeURIComponent("alt 文本是必填的（无障碍要求）"));
    if (!desensitized) return redirect(res, "/media?error=" + encodeURIComponent("请确认图片已脱敏"));
    try {
      const saved = media.saveBuffer(filePart.data, filePart.contentType, filePart.filename);
      saved.alt = alt;
      const id = await media.record(saved, sess.user.user_id);
      await auth.audit(sess.user, "media.upload", saved.filename, { bytes: saved.bytes, alt: alt }, c.ip);
      return redirect(res, "/media?notice=" + encodeURIComponent("已上传：" + saved.relPath));
    } catch (e) {
      return redirect(res, "/media?error=" + encodeURIComponent(e.message));
    }
  }

  // 修改 alt
  const mAlt = p.match(/^\/media\/(\d+)\/alt$/);
  if (mAlt && method === "POST") {
    if (!await auth.can(sess.user, "article:edit")) return html(res, 403, views.simplePage("没有权限", "你的角色不能修改媒体。", pageOpts));
    const form = h.parseForm(await h.readBody(req, 8192));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return redirect(res, "/media?error=" + encodeURIComponent("CSRF 校验失败"));
    await media.updateAlt(parseInt(mAlt[1], 10), form.alt);
    await auth.audit(sess.user, "media.alt", mAlt[1], { alt: form.alt }, c.ip);
    return redirect(res, "/media?notice=" + encodeURIComponent("alt 已更新"));
  }

  // 删除（软删除 + 引用检查）
  const mDel = p.match(/^\/media\/(\d+)\/delete$/);
  if (mDel && method === "POST") {
    if (!await auth.can(sess.user, "article:edit")) return html(res, 403, views.simplePage("没有权限", "你的角色不能删除媒体。", pageOpts));
    const form = h.parseForm(await h.readBody(req, 4096));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return redirect(res, "/media?error=" + encodeURIComponent("CSRF 校验失败"));
    const m = await media.getById(parseInt(mDel[1], 10));
    if (!m) return redirect(res, "/media?error=" + encodeURIComponent("文件不存在"));
    const refs = await media.findReferences(m.filename);
    if (refs.length) {
      return redirect(res, "/media?error=" + encodeURIComponent("该图片仍被 " + refs.length + " 篇文章引用（" + refs.slice(0,3).join("、") + "…），请先在文章中移除引用"));
    }
    await media.softDelete(m.id, sess.user.user_id);
    await auth.audit(sess.user, "media.delete", m.filename, null, c.ip);
    return redirect(res, "/media?notice=" + encodeURIComponent("已删除（文件保留，可恢复）"));
  }
  // ---- 2FA 设置页 ----
  if (p === "/security") {
    const r2 = await db.query("SELECT totp_enabled FROM users WHERE id = $1", [sess.user.user_id]);
    const enabled = !!(r2.rows[0] && r2.rows[0].totp_enabled);
    return html(res, 200, views.securityPage(Object.assign({
      enabled: enabled,
      notice: url.searchParams.get("notice"), error: url.searchParams.get("error")
    }, pageOpts)));
  }

  // 开始绑定：生成密钥并展示（此时尚未启用）
  if (p === "/security/totp/start" && method === "POST") {
    const form = h.parseForm(await h.readBody(req, 4096));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return redirect(res, "/security?error=" + encodeURIComponent("CSRF 校验失败"));
    const secret = totp.generateSecret();
    await db.query("UPDATE users SET totp_secret = $2, totp_enabled = false WHERE id = $1", [sess.user.user_id, secret]);
    await auth.audit(sess.user, "totp.start", null, null, c.ip);
    return redirect(res, "/security/confirm");
  }

  // 确认绑定：校验一次验证码后启用，并展示恢复码（只显示一次）
  if (p === "/security/confirm") {
    const r2 = await db.query("SELECT totp_secret, totp_enabled FROM users WHERE id = $1", [sess.user.user_id]);
    const row = r2.rows[0] || {};
    if (!row.totp_secret) return redirect(res, "/security?error=" + encodeURIComponent("请先生成密钥"));
    if (method === "GET") {
      const uri = totp.otpauthURL(row.totp_secret, sess.user.email, "修盒子内容后台");
      const codes = null;
      return html(res, 200, views.securityConfirmPage(Object.assign({
        secret: row.totp_secret, uri: uri, codes: codes
      }, pageOpts)));
    }
    const form = h.parseForm(await h.readBody(req, 8192));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return redirect(res, "/security?error=" + encodeURIComponent("CSRF 校验失败"));
    if (!totp.verify(row.totp_secret, form.code)) {
      const uri = totp.otpauthURL(row.totp_secret, sess.user.email, "修盒子内容后台");
      return html(res, 400, views.securityConfirmPage(Object.assign({
        secret: row.totp_secret, uri: uri, codes: null, error: "验证码不正确，请重试（确认手机时间是否准确）"
      }, pageOpts)));
    }
    // 启用并生成恢复码
    const codes = totp.generateRecoveryCodes(8);
    await db.tx(async function (client) {
      await client.query("UPDATE users SET totp_enabled = true WHERE id = $1", [sess.user.user_id]);
      await client.query("DELETE FROM recovery_codes WHERE user_id = $1", [sess.user.user_id]);
      for (const c of codes) {
        await client.query("INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1,$2)", [sess.user.user_id, totp.hashCode(c)]);
      }
    });
    await auth.audit(sess.user, "totp.enabled", null, null, c.ip);
    const uri = totp.otpauthURL(row.totp_secret, sess.user.email, "修盒子内容后台");
    return html(res, 200, views.securityConfirmPage(Object.assign({
      secret: row.totp_secret, uri: uri, codes: codes, done: true
    }, pageOpts)));
  }

  // 关闭 2FA（需要验证码或密码）
  if (p === "/security/totp/disable" && method === "POST") {
    const form = h.parseForm(await h.readBody(req, 8192));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return redirect(res, "/security?error=" + encodeURIComponent("CSRF 校验失败"));
    const r2 = await db.query("SELECT totp_enabled FROM users WHERE id = $1", [sess.user.user_id]);
    if (r2.rows[0] && r2.rows[0].totp_enabled && !await auth.can(sess.user, "user:manage")) {
      return redirect(res, "/security?error=" + encodeURIComponent("关闭 2FA 需要管理员权限"));
    }
    await db.query("UPDATE users SET totp_enabled = false, totp_secret = NULL WHERE id = $1", [sess.user.user_id]);
    await db.query("DELETE FROM recovery_codes WHERE user_id = $1", [sess.user.user_id]);
    await auth.audit(sess.user, "totp.disabled", null, null, c.ip);
    return redirect(res, "/security?notice=" + encodeURIComponent("已关闭双因素认证"));
  }
  // ---- 发布队列 ----
  if (p === "/publish") {
    if (method === "POST") {
      const form = h.parseForm(await h.readBody(req, 4096));
      if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
      if (!await auth.can(sess.user, "article:publish")) return html(res, 403, views.simplePage("没有权限", "你的角色不能发布。", pageOpts));
      const job = await publisher.enqueue(null, "publish", sess.user.user_id);
      await auth.audit(sess.user, "publish.manual", null, { jobId: job.id }, c.ip);
      return redirect(res, "/publish?notice=" + encodeURIComponent("已加入发布队列（任务 #" + job.id + "）"));
    }
    const jobs = (await db.query("SELECT * FROM publish_jobs ORDER BY id DESC LIMIT 30")).rows;
    return html(res, 200, views.publishPage(Object.assign({
      jobs: jobs, notice: url.searchParams.get("notice"), error: url.searchParams.get("error")
    }, pageOpts)));
  }

  // ---- 账号管理 ----
  if (p === "/users") {
    if (!await auth.can(sess.user, "user:manage")) return html(res, 403, views.simplePage("没有权限", "只有管理员可以管理账号。", pageOpts));
    const users = (await db.query(
      "SELECT u.id, u.email, u.name, u.is_root, u.status, u.last_login_at, " +
      "       u.pending_email, u.pending_email_expires, " +
      "       (SELECT string_agg(ur.role, ', ') FROM user_roles ur WHERE ur.user_id = u.id) AS roles, " +
      "       (SELECT ur2.scope_domain FROM user_roles ur2 WHERE ur2.user_id = u.id AND ur2.scope_domain IS NOT NULL LIMIT 1) AS scope_domain " +
      "FROM users u ORDER BY u.is_root DESC, u.id")).rows;
    const invs = (await db.query("SELECT * FROM invites ORDER BY id DESC LIMIT 30")).rows;
    return html(res, 200, views.usersPage(Object.assign({
      users: users, invites: invs, taxonomy: taxonomy(),
      notice: url.searchParams.get("notice"), error: url.searchParams.get("error"),
      inviteLink: url.searchParams.get("link"), inviteHours: 72
    }, pageOpts)));
  }

  if (p === "/users/invite" && method === "POST") {
    if (!await auth.can(sess.user, "user:manage")) return html(res, 403, views.simplePage("没有权限", "只有管理员可以分发账号。", pageOpts));
    const form = h.parseForm(await h.readBody(req, 8192));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    try {
      const inv = await invites.create({
        email: String(form.email || "").trim().toLowerCase(),
        role: form.role, scope_domain: form.scope_domain || null,
        createdBy: sess.user.user_id
      });
      await auth.audit(sess.user, "user.invite", inv.email, { role: inv.role }, c.ip);
      const link = config.publicUrl + "/activate?t=" + inv.token;
      return redirect(res, "/users?link=" + encodeURIComponent(link) + "&notice=" + encodeURIComponent("邀请已创建"));
    } catch (e) {
      return redirect(res, "/users?error=" + encodeURIComponent(e.message));
    }
  }

  /* ---------------- root 为用户换绑邮箱（验证码确认，2026-10-24） ----------------
     两步：bind = 生成验证码并寄到新邮箱（只写 pending_*，不动登录邮箱）；
           verify = 对方把验证码告知 root，root 输入后校验通过才正式替换 email。
     email 是登录标识，替换前必须证明新邮箱真实可用 —— 这就是验证码的意义。 */
  const mEmailBind = p.match(/^\/users\/(\d+)\/email\/bind$/);
  if (mEmailBind && method === "POST") {
    if (!await auth.can(sess.user, "user:manage")) return h.sendJson(res, 403, { error: "只有管理员可以操作" }, h.securityHeaders());
    const form = h.parseForm(await h.readBody(req, 8192));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return h.sendJson(res, 403, { error: "CSRF 校验失败" }, h.securityHeaders());
    const id = parseInt(mEmailBind[1], 10);
    const newEmail = String(form.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return h.sendJson(res, 400, { error: "邮箱格式不正确" }, h.securityHeaders());
    const t = await db.query("SELECT id, email, name, pending_email FROM users WHERE id = $1", [id]);
    if (!t.rows.length) return h.sendJson(res, 404, { error: "账号不存在" }, h.securityHeaders());
    const u = t.rows[0];
    if (newEmail === u.email) return h.sendJson(res, 400, { error: "新邮箱与当前登录邮箱相同" }, h.securityHeaders());
    // 新邮箱不得与他人现有登录邮箱重复
    const dup = await db.query("SELECT id FROM users WHERE lower(email) = $1 AND id <> $2", [newEmail, id]);
    if (dup.rows.length) return h.sendJson(res, 400, { error: "该邮箱已被其他账号使用" }, h.securityHeaders());
    try {
      const code = mailer.generateCode();
      await mailer.sendBindCode(newEmail, code, u.name);
      await db.query(
        "UPDATE users SET pending_email=$2, pending_email_code_hash=$3, " +
        "pending_email_expires = now() + ($4 || ' minutes')::interval, pending_email_attempts=0, updated_at=now() WHERE id=$1",
        [id, newEmail, mailer.hashCode(code), String(config.mail.codeTtlMin)]);
      await auth.audit(sess.user, "user.email.bind_request", u.email, { to: newEmail }, c.ip);
      return h.sendJson(res, 200, {
        ok: true,
        message: "验证码已发送至 " + newEmail + "（" + config.mail.codeTtlMin + " 分钟内有效）。请对方查收后把验证码告诉你，再点击「验证并绑定」。"
      }, h.securityHeaders());
    } catch (e) {
      return h.sendJson(res, e.status || 500, { error: e.message }, h.securityHeaders());
    }
  }

  const mEmailVerify = p.match(/^\/users\/(\d+)\/email\/verify$/);
  if (mEmailVerify && method === "POST") {
    if (!await auth.can(sess.user, "user:manage")) return h.sendJson(res, 403, { error: "只有管理员可以操作" }, h.securityHeaders());
    const form = h.parseForm(await h.readBody(req, 8192));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return h.sendJson(res, 403, { error: "CSRF 校验失败" }, h.securityHeaders());
    const id = parseInt(mEmailVerify[1], 10);
    const code = String(form.code || "").trim();
    const t = await db.query(
      "SELECT id, email, name, pending_email, pending_email_code_hash, pending_email_expires, pending_email_attempts " +
      "FROM users WHERE id = $1", [id]);
    if (!t.rows.length) return h.sendJson(res, 404, { error: "账号不存在" }, h.securityHeaders());
    const u = t.rows[0];
    if (!u.pending_email || !u.pending_email_code_hash) return h.sendJson(res, 400, { error: "没有待验证的邮箱，请先发送验证码" }, h.securityHeaders());
    if (new Date(u.pending_email_expires) < new Date()) {
      await db.query("UPDATE users SET pending_email=NULL, pending_email_code_hash=NULL, pending_email_attempts=0 WHERE id=$1", [id]);
      return h.sendJson(res, 400, { error: "验证码已过期，请重新发送" }, h.securityHeaders());
    }
    if (u.pending_email_attempts >= 5) {
      await db.query("UPDATE users SET pending_email=NULL, pending_email_code_hash=NULL, pending_email_attempts=0 WHERE id=$1", [id]);
      return h.sendJson(res, 400, { error: "错误次数过多，验证已作废，请重新发送验证码" }, h.securityHeaders());
    }
    const given = mailer.hashCode(code);
    const stored = String(u.pending_email_code_hash);
    const ok = given.length === stored.length &&
      crypto.timingSafeEqual(Buffer.from(given), Buffer.from(stored));
    if (!ok) {
      await db.query("UPDATE users SET pending_email_attempts = pending_email_attempts + 1 WHERE id=$1", [id]);
      await auth.audit(sess.user, "user.email.verify_failed", u.email, { to: u.pending_email }, c.ip);
      const left = 5 - (u.pending_email_attempts + 1);
      return h.sendJson(res, 400, { error: "验证码不正确（剩余尝试次数：" + Math.max(0, left) + "）" }, h.securityHeaders());
    }
    // 正式替换登录邮箱。WHERE 带排他条件兜底并发（极小概率：验证期间该邮箱被别人占用）
    const done = await db.query(
      "UPDATE users SET email=$2, pending_email=NULL, pending_email_code_hash=NULL, " +
      "pending_email_expires=NULL, pending_email_attempts=0, updated_at=now() " +
      "WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.email=$2 AND u2.id<>$1) RETURNING email",
      [id, u.pending_email]);
    if (!done.rows.length) return h.sendJson(res, 409, { error: "该邮箱刚被其他账号占用，请换一个" }, h.securityHeaders());
    await auth.audit(sess.user, "user.email.bind_success", u.email, { from: u.email, to: u.pending_email }, c.ip);
    return h.sendJson(res, 200, {
      ok: true,
      message: "已绑定：" + u.pending_email + "。该用户下次登录请使用新邮箱（密码不变）。"
    }, h.securityHeaders());
  }

  const mToggle = p.match(/^\/users\/(\d+)\/toggle$/);
  if (mToggle && method === "POST") {
    if (!await auth.can(sess.user, "user:manage")) return html(res, 403, views.simplePage("没有权限", "只有管理员可以管理账号。", pageOpts));
    const form = h.parseForm(await h.readBody(req, 4096));
    if (!auth.verifyCsrf(sess.user, form._csrf)) return html(res, 403, views.simplePage("请求被拒绝", "CSRF 校验失败。", pageOpts));
    const id = parseInt(mToggle[1], 10);
    const t = await db.query("SELECT id, is_root, status, email FROM users WHERE id = $1", [id]);
    if (!t.rows.length) return redirect(res, "/users?error=" + encodeURIComponent("账号不存在"));
    if (t.rows[0].is_root) return redirect(res, "/users?error=" + encodeURIComponent("root 账号不可停用"));
    const next = t.rows[0].status === "active" ? "disabled" : "active";
    await db.query("UPDATE users SET status = $2, updated_at = now() WHERE id = $1", [id, next]);
    if (next === "disabled") await auth.destroyAllSessionsForUser(id);
    await auth.audit(sess.user, "user.toggle", t.rows[0].email, { status: next }, c.ip);
    return redirect(res, "/users?notice=" + encodeURIComponent("已" + (next === "active" ? "启用" : "停用")));
  }

  // ---- 审计 ----
  if (p === "/audit") {
    if (!await auth.can(sess.user, "audit:read")) return html(res, 403, views.simplePage("没有权限", "你的角色不能查看审计日志。", pageOpts));
    const logs = (await db.query("SELECT * FROM audit_log ORDER BY id DESC LIMIT 200")).rows;
    return html(res, 200, views.auditPage(Object.assign({ logs: logs }, pageOpts)));
  }

  return html(res, 404, views.simplePage("页面不存在", "找不到该地址。", sess ? pageOpts : {}));
}

/* 表单 → meta（每个字段都做类型规整） */
function formToMeta(form, base) {
  base = base || {};
  const arr = function (v) {
    return String(v || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  };
  // sources：按带索引的字段名收集（src_title_N / src_url_N / src_type_N）。
  // 不用「三个平行数组按位置对齐」——某行缺字段时会错位，把 URL 配到别的行上。
  const sources = [];
  const srcIdx = new Set();
  Object.keys(form).forEach(function (k) {
    const m = /^src_(title|url|type)_(\d+)$/.exec(k);
    if (m) srcIdx.add(parseInt(m[2], 10));
  });
  Array.from(srcIdx).sort(function (a, b) { return a - b; }).forEach(function (i) {
    const t = String(form["src_title_" + i] || "").trim();
    const u = String(form["src_url_" + i] || "").trim();
    if (!t && !u) return;                       // 整行留空则忽略
    const item = { title: t, url: u };
    const ty = String(form["src_type_" + i] || "").trim();
    if (ty) item.type = ty;                     // 只在有值时才输出 type
    sources.push(item);
  });
  // 兼容旧式无索引字段名（避免旧表单/脚本提交时丢数据）
  if (!sources.length && (form.src_title || form.src_url)) {
    const toArr = function (x) { return Array.isArray(x) ? x : (x ? [x] : []); };
    const titles = toArr(form.src_title), urls = toArr(form.src_url), types = toArr(form.src_type);
    for (let i = 0; i < Math.max(titles.length, urls.length); i++) {
      const t = String(titles[i] || "").trim();
      const u = String(urls[i] || "").trim();
      if (!t && !u) continue;
      const item = { title: t, url: u };
      const ty = String(types[i] || "").trim();
      if (ty) item.type = ty;
      sources.push(item);
    }
  }
  return {
    title: String(form.title || "").trim(),
    slug: String(form.slug || base.slug || "").trim(),
    domain: String(form.domain || "").trim(),
    category: String(form.category || "").trim(),
    os: arr(form.os),
    difficulty: String(form.difficulty || "").trim(),
    time: String(form.time || "").trim(),
    risk: String(form.risk || "").trim(),
    symptoms: arr(form.symptoms),
    keywords: arr(form.keywords),
    aliases: arr(form.aliases),
    updated: String(form.updated || "").trim(),
    version: String(form.version || "1.0"),
    prerequisites: arr(form.prerequisites),
    tools: arr(form.tools),
    related: arr(form.related),
    sources: sources,
    reviewer: String(form.reviewer || "").trim(),
    reviewed_at: String(form.reviewed_at || "").trim()
  };
}

/* 单篇 lint（复用站点同一份规则，仅取 error 级） */
async function lintFileCheck(meta, body, slug) {
  const lint = require(path.join(config.repo.root, "content-lint.cjs"));
  const issues = lint.lintFile(slug + ".md", { taxonomy: lint.loadTaxonomy() });
  // 表单里的 meta 尚未落盘，lintFile 读的是旧文件；因此这里额外做几项针对表单值的检查
  const errs = [];
  const tax = lint.loadTaxonomy();
  if (!meta.title) errs.push("标题不能为空");
  if (!tax.domainById[meta.domain]) errs.push("领域无效");
  if (!tax.catById[meta.category]) errs.push("分类无效");
  else if (tax.catToDomain[meta.category] !== meta.domain) errs.push("分类不属于所选领域");
  if (tax.raw.enums.risk.indexOf(meta.risk) < 0) errs.push("风险取值非法");
  if (!meta.sources.length) errs.push("至少需要 1 条参考资料");
  meta.sources.forEach(function (s, i) {
    if (!s.title) errs.push("参考资料[" + (i + 1) + "]缺少标题");
    if (!s.url) errs.push("参考资料[" + (i + 1) + "]缺少 URL");
    else if (!/^https:\/\//.test(s.url)) errs.push("参考资料[" + (i + 1) + "]的 URL 需以 https:// 开头");
  });
  // 正文段落（2026-10-13：正文改为自由写作）
  // 只硬性要求两个底线段落，其余段落自由组织。
  // 与 content-lint.cjs 的 V6a/V6b 保持一致 —— 两处都要改，否则会出现
  // 「后台说能发、构建失败」或反之。这里复用 lint 模块的常量，避免再次分叉。
  let req = ["一句话结论", "分步骤"];
  let alts = { "怎么确认修好了": ["怎么确认修好了", "怎么确认处理好了"] };
  try {
    const lintMod = require(path.join(config.repo.root, "content-lint.cjs"));
    if (lintMod.REQUIRED_SECTIONS) req = lintMod.REQUIRED_SECTIONS;
    if (lintMod.SECTION_ALIASES) alts = lintMod.SECTION_ALIASES;
  } catch (e) { /* 用上面的默认值兜底 */ }
  const h2 = String(body || "").split(/\r?\n/).filter(function (l) { return /^##\s+/.test(l); })
    .map(function (l) { return l.replace(/^##\s+/, "").trim(); });
  req.forEach(function (n) {
    const list = alts[n] || [n];
    if (!h2.some(function (x) { return list.indexOf(x) >= 0; })) {
      errs.push("正文缺少必要段落：## " + n + "（其余段落可自由组织）");
    }
  });
  return errs;
}

const server = http.createServer(function (req, res) {
  handle(req, res).catch(function (e) {
    console.error("[server] 未处理异常：" + (e && e.stack || e));
    try { h.send(res, 500, "服务器内部错误", h.securityHeaders()); } catch (_) {}
  });
});

async function start() {
  await db.assertCorrectDatabase();      // 防止连错库（V2 §4.2 D 项）
  await db.query("SELECT 1");            // 探活
  publisher.start();                     // 启动发布队列消费者
  server.listen(config.port, config.host, function () {
    console.log("[admin] 已启动 http://" + config.host + ":" + config.port);
    console.log("[admin] 数据库：" + config.db.database + " @ " + config.db.host + ":" + config.db.port);
    console.log("[admin] 内容仓库：" + config.repo.root);
    console.log("[admin] 环境：" + config.env + "；会话 Cookie secure=" + config.session.secure);
  });
}

if (require.main === module) start();

module.exports = { server: server, start: start, formToMeta: formToMeta };
