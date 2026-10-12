/* admin/src/server.cjs — HTTP 服务与路由（V2 阶段 1 的 ⑪–⑱） */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const config = require("./config.cjs");
const db = require("./db.cjs");
const auth = require("./auth.cjs");
const h = require("./http.cjs");
const views = require("./views.cjs");
const articles = require("./articles.cjs");
const publisher = require("./publish.cjs");
const invites = require("./invites.cjs");

const taxPath = path.join(config.repo.root, "content", "taxonomy.json");
function taxonomy() { return JSON.parse(fs.readFileSync(taxPath, "utf8")); }

/* 静态资源（仅 /static/*，只服务 public/ 下的白名单文件） */
const STATIC = {
  "/static/editor.js": { file: path.join(__dirname, "..", "public", "editor.js"), type: "application/javascript; charset=utf-8" }
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
  if (p === "/login" && method === "GET") {
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

  // ---- 以下全部需要登录 ----
  if (!sess) return redirect(res, "/login");

  // 强制改密（V2 §5.1.3）：除改密与登出外一律拦截
  if (sess.user.must_change_password && p !== "/change-password") {
    return redirect(res, "/change-password");
  }

  const pageOpts = { user: sess.user, roles: sess.roles, csrf: sess.user.csrf_token };

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

  // ---- 文章列表 ----
  if (p === "/" || p === "/articles") {
    const canCreate = await auth.can(sess.user, "article:create");
    const items = articles.listAll();
    // 与 DB 的状态合并（DB 是派生视图，文件为准）
    const metaRows = await db.query("SELECT slug, status FROM articles_meta");
    const statusBySlug = {};
    metaRows.rows.forEach(function (r) { statusBySlug[r.slug] = r.status; });
    items.forEach(function (a) {
      a.status = statusBySlug[a.slug] || (a.where === "draft" ? "draft" : (a.where === "archive" ? "archived" : "published"));
    });
    return html(res, 200, views.articlesPage(Object.assign({ items: items, canCreate: canCreate, notice: url.searchParams.get("notice") }, pageOpts)));
  }

  // ---- 新建 ----
  if (p === "/articles/new") {
    if (!await auth.can(sess.user, "article:create")) return html(res, 403, views.simplePage("没有权限", "你的角色不能新建文章。", pageOpts));
    if (method === "GET") {
      return html(res, 200, views.editorPage(Object.assign({
        isExisting: false, meta: { version: "1.0", risk: "需谨慎", difficulty: "入门" },
        body: articles.BODY_SKELETON, taxonomy: taxonomy()
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
      return html(res, 200, views.editorPage(Object.assign({
        isExisting: true, slug: slug, meta: art.meta, body: art.body,
        contentHash: art.contentHash, taxonomy: taxonomy(), canPublish: canPublish,
        notice: url.searchParams.get("notice")
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
  // 正文段落
  const need = ["一句话结论","30 秒快速排查","适用 / 不适用","开始前确认","分步骤","怎么确认修好了","还是不行？","预防","相关教程","更新日志"];
  const alts = { "怎么确认修好了": ["怎么确认修好了","怎么确认处理好了"] };
  const h2 = String(body || "").split(/\r?\n/).filter(function (l) { return /^##\s+/.test(l); })
    .map(function (l) { return l.replace(/^##\s+/, "").trim(); });
  need.forEach(function (n) {
    const list = alts[n] || [n];
    if (!h2.some(function (x) { return list.indexOf(x) >= 0; })) errs.push("正文缺少段落：## " + n);
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
