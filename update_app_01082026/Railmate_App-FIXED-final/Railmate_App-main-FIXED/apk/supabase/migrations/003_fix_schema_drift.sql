-- Apply community_reports columns that may be missing in live DB
ALTER TABLE community_reports
  ADD COLUMN IF NOT EXISTS crowd_level VARCHAR(30),
  ADD COLUMN IF NOT EXISTS coach_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS condition_rating SMALLINT,
  ADD COLUMN IF NOT EXISTS condition_note TEXT,
  ADD COLUMN IF NOT EXISTS verification_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispute_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

-- Add saved_at column to saved_routes (app code references this column)
ALTER TABLE saved_routes
  ADD COLUMN IF NOT EXISTS saved_at TIMESTAMPTZ DEFAULT NOW();

-- Add helpful_vote_count to users (profile screen uses this)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS helpful_vote_count INTEGER DEFAULT 0;

-- Add is_trusted to users if missing
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT false;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
