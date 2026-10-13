-- ============================================================
-- 003：媒体库
-- 文件本体存 demo/fixboxs/media/（随站点产物发布，nginx 已配长缓存）
-- 本表只存元数据：alt 文本、上传者、体积、哈希。
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS media (
  id           BIGSERIAL PRIMARY KEY,
  filename     TEXT NOT NULL UNIQUE,
  rel_path     TEXT NOT NULL,           -- 相对站点根，如 media/20261013-ab12cd.png
  alt          TEXT,                    -- 无障碍必填：描述「这张图说明什么」
  note         TEXT,                    -- 脱敏自检备注
  bytes        BIGINT NOT NULL DEFAULT 0,
  sha256       TEXT,
  content_type TEXT,
  uploader_id  BIGINT REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,             -- 软删除：避免文章里的图片直接裂图
  deleted_by   BIGINT REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_alive ON media(id) WHERE deleted_at IS NULL;

COMMIT;
