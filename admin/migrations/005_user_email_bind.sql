-- ============================================================
-- 005 · root 为其他用户换绑邮箱（验证码确认）
-- 流程：root 在账号页发起 → 系统向新邮箱发 6 位验证码 →
--       验证通过后 pending_email 才正式替换 users.email（登录标识）
-- 安全：验证码只存 SHA-256 哈希；限 5 次尝试；10 分钟过期；一次性
-- ============================================================
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email            TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email_code_hash  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email_expires    TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email_attempts   INTEGER NOT NULL DEFAULT 0;

COMMIT;
