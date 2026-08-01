-- ============================================================
-- RailMate Bangladesh — Community Reporting + Delay Aggregates
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS community_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  train_id            UUID REFERENCES trains(id) ON DELETE SET NULL,
  station_id          UUID REFERENCES stations(id) ON DELETE SET NULL,
  report_type         VARCHAR(30) NOT NULL,
  description         TEXT,
  delay_minutes       SMALLINT,
  crowd_level         VARCHAR(30),
  coach_number        VARCHAR(20),
  condition_rating    SMALLINT,
  condition_note      TEXT,
  photo_url           TEXT,
  journey_date        DATE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  verification_count  INTEGER NOT NULL DEFAULT 0,
  dispute_count       INTEGER NOT NULL DEFAULT 0,
  helpful_count       INTEGER NOT NULL DEFAULT 0,
  comment_count       INTEGER NOT NULL DEFAULT 0,
  reported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_reports_status_check
    CHECK (status IN ('ACTIVE', 'VERIFIED', 'DISPUTED', 'ARCHIVED')),
  CONSTRAINT community_reports_type_check
    CHECK (report_type IN ('DELAY', 'CROWD', 'PLATFORM', 'SCHEDULE', 'GENERAL', 'ACCIDENT')),
  CONSTRAINT community_reports_delay_check
    CHECK (delay_minutes IS NULL OR delay_minutes BETWEEN 1 AND 300),
  CONSTRAINT community_reports_condition_check
    CHECK (condition_rating IS NULL OR condition_rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_community_reports_train_date
  ON community_reports(train_id, journey_date);
CREATE INDEX IF NOT EXISTS idx_community_reports_status_date
  ON community_reports(status, journey_date);
CREATE INDEX IF NOT EXISTS idx_community_reports_user
  ON community_reports(user_id, reported_at DESC);

CREATE TABLE IF NOT EXISTS report_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type   VARCHAR(10) NOT NULL CHECK (vote_type IN ('CONFIRM', 'DISPUTE')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_report_votes_report
  ON report_votes(report_id);

CREATE TABLE IF NOT EXISTS report_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_comments_report
  ON report_comments(report_id, created_at);

ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read community reports"
  ON community_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated insert community reports"
  ON community_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own community reports"
  ON community_reports FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public read report votes"
  ON report_votes FOR SELECT USING (true);
CREATE POLICY "Users manage own report votes"
  ON report_votes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read report comments"
  ON report_comments FOR SELECT USING (true);
CREATE POLICY "Users insert own report comments"
  ON report_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_community_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_community_reports_updated_at ON community_reports;
CREATE TRIGGER trigger_community_reports_updated_at
  BEFORE UPDATE ON community_reports
  FOR EACH ROW EXECUTE FUNCTION update_community_reports_updated_at();

CREATE OR REPLACE VIEW public_delay_aggregates AS
SELECT
  t.number AS train_number,
  t.name_en,
  t.name_bn,
  cr.journey_date,
  COUNT(*) FILTER (WHERE cr.report_type = 'DELAY') AS delay_report_count,
  AVG(cr.delay_minutes) FILTER (WHERE cr.report_type = 'DELAY') AS avg_delay_minutes
FROM community_reports cr
JOIN trains t ON t.id = cr.train_id
WHERE cr.status IN ('ACTIVE', 'VERIFIED')
  AND cr.journey_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY t.number, t.name_en, t.name_bn, cr.journey_date;

-- ─── Storage: report-photos bucket ───────────────────────────────────────────
-- Required by uploadReportPhoto() in api/community.ts.
-- Without this bucket the photo upload call always fails with a 404.
-- Public bucket: photos are embedded in community cards visible to all users.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos',
  'report-photos',
  true,
  5242880,  -- 5MB limit per photo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload to their own folder (user_id/*)
CREATE POLICY "Auth users upload own report photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'report-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read for all report photos (they appear in community feed)
CREATE POLICY "Public read report photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'report-photos');
