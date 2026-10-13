-- ============================================================
-- 004：双因素认证（TOTP）+ 恢复码
-- ============================================================
BEGIN;

-- 恢复码单独一张表：一次性、只存哈希（与密码同等待遇）
CREATE TABLE IF NOT EXISTS recovery_codes (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash  TEXT NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recovery_user ON recovery_codes(user_id);

-- 记录 2FA 通过标记（登录流程分两步）
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS totp_verified BOOLEAN NOT NULL DEFAULT false;

COMMIT;
