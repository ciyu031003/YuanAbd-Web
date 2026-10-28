-- ============================================================
-- 006: Anonymous reader feedback for published articles
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS article_feedback (
  id               BIGSERIAL PRIMARY KEY,
  slug             TEXT NOT NULL,
  outcome          TEXT NOT NULL CHECK (outcome IN ('resolved','unresolved')),
  issue_type       TEXT CHECK (issue_type IN (
                     'premise','steps','command','error','result','source','other'
                   )),
  issue_location   TEXT,
  message          TEXT,
  page_path        TEXT,
  client_event_id  TEXT NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_feedback_created
  ON article_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_feedback_slug_created
  ON article_feedback(slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_feedback_outcome_created
  ON article_feedback(outcome, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_feedback_issue
  ON article_feedback(issue_type)
  WHERE outcome = 'unresolved';

COMMIT;
