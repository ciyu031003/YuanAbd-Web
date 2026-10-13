-- ============================================================
-- 002：协作功能（保存视图 / 修订历史 / 审核评论）
-- 对应 UI 调研优先清单第 7、9 项
-- ============================================================
BEGIN;

-- ---------- 保存视图：把每次重新勾选筛选变成一次点击 ----------
-- 借鉴 Payload 的 Query Presets：本人可存、可共享给团队。
CREATE TABLE IF NOT EXISTS saved_views (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  owner_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
  querystring TEXT NOT NULL,
  is_shared   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 同一用户下视图名唯一（共享视图按创建者区分）
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_views_name
  ON saved_views (owner_id, name);
CREATE INDEX IF NOT EXISTS idx_saved_views_shared ON saved_views(is_shared) WHERE is_shared;

-- ---------- 修订历史：每次保存留快照 ----------
-- 借鉴 WordPress revisions / Ghost version history。
-- 只存 front-matter 与正文（revision 表不参与构建，纯审计用途）。
CREATE TABLE IF NOT EXISTS revisions (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT NOT NULL,
  revision_no INTEGER NOT NULL,
  title       TEXT,
  status      TEXT,
  content     TEXT,          -- 完整文件内容（含 front-matter），便于精确回滚
  content_hash TEXT,
  author_id   BIGINT REFERENCES users(id),
  note        TEXT,          -- 本次改动说明
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug, revision_no)
);
CREATE INDEX IF NOT EXISTS idx_revisions_slug ON revisions(slug, revision_no DESC);

-- ---------- 审核评论：文章详情页的讨论线程 ----------
-- 借鉴 Sanity / Contentful 的字段级评论（此处简化为文章级线程）。
CREATE TABLE IF NOT EXISTS comments (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT NOT NULL,
  author_id   BIGINT NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  -- 允许指向具体字段或锚点，便于「就这一处提意见」
  anchor      TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by BIGINT REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug, created_at DESC);

COMMIT;
