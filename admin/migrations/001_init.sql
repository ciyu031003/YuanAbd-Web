-- ============================================================
-- 管理后台业务库表结构（yuanabd_pc_fixboxs）
-- 对应 V2 下篇 §4 / §7
-- 原则：**只存业务态**。正文与 front-matter 的唯一真源是 content/fixboxs/*.md
-- ============================================================
BEGIN;

-- ---------- 用户 ----------
CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  email           TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL DEFAULT '',
  password_hash   TEXT        NOT NULL,
  is_root         BOOLEAN     NOT NULL DEFAULT false,
  status          TEXT        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','disabled')),
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  totp_secret     TEXT,
  totp_enabled    BOOLEAN     NOT NULL DEFAULT false,
  failed_logins   INTEGER     NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  created_by      BIGINT      REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 全库最多一个 root（不靠应用层自觉）
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_single_root ON users ((is_root)) WHERE is_root;

-- ---------- 角色与作用域 ----------
CREATE TABLE IF NOT EXISTS user_roles (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT   NOT NULL CHECK (role IN ('root','admin','reviewer','editor','viewer')),
  scope_domain TEXT,
  granted_by  BIGINT REFERENCES users(id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, scope_domain)
);

-- ---------- 会话（只存 token 哈希，不存明文） ----------
CREATE TABLE IF NOT EXISTS sessions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT   NOT NULL UNIQUE,
  csrf_token  TEXT   NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ---------- 邀请（root 分发账号） ----------
CREATE TABLE IF NOT EXISTS invites (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT   NOT NULL,
  role        TEXT   NOT NULL CHECK (role IN ('admin','reviewer','editor','viewer')),
  scope_domain TEXT,
  token_hash  TEXT   NOT NULL UNIQUE,
  created_by  BIGINT NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);

-- ---------- 文章业务态（不含正文；本表是派生视图，可随时从 content/ 重建） ----------
CREATE TABLE IF NOT EXISTS articles_meta (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  domain      TEXT,
  category    TEXT,
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','in_review','changes_requested','published','archived')),
  content_hash TEXT,
  author_id   BIGINT REFERENCES users(id),
  reviewer_id BIGINT REFERENCES users(id),
  review_notes TEXT,
  archived_at TIMESTAMPTZ,
  superseded_by TEXT,
  file_path   TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles_meta(status);
CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles_meta(domain);

-- ---------- 审计日志（append-only，见末尾权限收敛） ----------
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id),
  user_email  TEXT,
  action      TEXT NOT NULL,
  target      TEXT,
  detail      JSONB,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_detail ON audit_log USING GIN (detail jsonb_path_ops);

-- ---------- 发布任务 ----------
CREATE TABLE IF NOT EXISTS publish_jobs (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT,
  action      TEXT NOT NULL DEFAULT 'publish'
              CHECK (action IN ('publish','archive','revert','backfill')),
  status      TEXT NOT NULL DEFAULT 'queued'
              CHECK (status IN ('queued','running','succeeded','failed')),
  steps       JSONB,
  log         TEXT,
  error       TEXT,
  created_by  BIGINT REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);
-- 单并发（V2 D4）：DB 层兜底，同一时刻最多一个 running
CREATE UNIQUE INDEX IF NOT EXISTS uq_publish_one_running
  ON publish_jobs ((status)) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_publish_created ON publish_jobs(created_at DESC);

-- ---------- 站点设置 ----------
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_by  BIGINT REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 迁移版本 ----------
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
