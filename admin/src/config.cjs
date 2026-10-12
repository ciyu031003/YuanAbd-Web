/* admin/src/config.cjs — 配置（全部来自环境变量，不硬编码任何密钥） */
"use strict";

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error("[配置错误] 缺少必需的环境变量：" + name);
    console.error("  提示：本服务不在代码中内置任何默认密钥。请通过部署环境注入。");
    process.exit(1);
  }
  return v;
}

function optional(name, dflt) {
  const v = process.env[name];
  return (v === undefined || v === "") ? dflt : v;
}

const config = {
  // ---- 服务 ----
  port: parseInt(optional("ADMIN_PORT", "3020"), 10),
  host: optional("ADMIN_HOST", "0.0.0.0"),
  publicUrl: optional("ADMIN_PUBLIC_URL", "https://admin.pc-fixboxs.yuanabd.cn"),

  // ---- 数据库（独立库，最小权限角色） ----
  db: {
    host: optional("DB_HOST", "127.0.0.1"),
    port: parseInt(optional("DB_PORT", "5432"), 10),
    database: optional("DB_NAME", "yuanabd_pc_fixboxs"),
    user: optional("DB_USER", "yuanabd_pc_fixboxs_app"),
    password: required("DB_PASSWORD"),
    // 连接池上限：小后台，不需要大池
    max: parseInt(optional("DB_POOL_MAX", "8"), 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  },

  // ---- 会话 ----
  session: {
    cookieName: optional("SESSION_COOKIE", "fx_admin_sid"),
    // 空闲过期 / 绝对过期（V2 §5.7）
    idleMs: parseInt(optional("SESSION_IDLE_MS", String(12 * 3600 * 1000)), 10),   // 12h
    absoluteMs: parseInt(optional("SESSION_ABS_MS", String(7 * 24 * 3600 * 1000)), 10), // 7d
    // 生产环境必须 true（自签证书场景可在内网调试时关掉）
    secure: optional("SESSION_SECURE", "true") === "true"
  },

  // ---- 内容仓库（后台写文件的唯一落点） ----
  repo: {
    root: optional("REPO_ROOT", "/srv/fixboxs/repo"),
    contentDir: optional("CONTENT_DIR", "content/fixboxs"),
    draftsDir: optional("DRAFTS_DIR", "_drafts"),
    archiveDir: optional("ARCHIVE_DIR", "_archive")
  },

  // ---- 发布 ----
  publish: {
    // 单并发队列（V2 §7.2）：串行执行 commit → build → 产物化 → 原子切换 → 全量校验
    enabled: optional("PUBLISH_ENABLED", "true") === "true",
    buildCmd: optional("PUBLISH_BUILD_CMD", "node build-fix.cjs"),
    artifactCmd: optional("PUBLISH_ARTIFACT_CMD", "node deploy-fixboxs.cjs"),
    gitAuthorName: optional("GIT_AUTHOR_NAME", "fixboxs-admin"),
    gitAuthorEmail: optional("GIT_AUTHOR_EMAIL", "admin@yuanabd.cn"),
    // 发布后是否 git push（备份）。失败不阻塞发布（V2 §7.1 第 8 步）
    push: optional("PUBLISH_PUSH", "false") === "true"
  },

  // ---- 安全 ----
  security: {
    // 登录限流：5 次 / 15 分钟 / IP（V2 §6.3）
    loginMaxAttempts: parseInt(optional("LOGIN_MAX_ATTEMPTS", "5"), 10),
    loginWindowMs: parseInt(optional("LOGIN_WINDOW_MS", String(15 * 60 * 1000)), 10),
    // 密码策略（V2 §5.1.3）
    passwordMinLength: parseInt(optional("PASSWORD_MIN_LENGTH", "12"), 10),
    // 初始密码打印后是否强制删除安装标记
    // 反代后取真实 IP 需要信任 X-Forwarded-For
    trustProxy: optional("TRUST_PROXY", "true") === "true"
  },

  env: optional("NODE_ENV", "development")
};

if (config.env === "production" && !config.session.secure) {
  console.error("[配置错误] 生产环境必须开启 SESSION_SECURE（否则会话 Cookie 会走明文）");
  process.exit(1);
}

module.exports = config;
