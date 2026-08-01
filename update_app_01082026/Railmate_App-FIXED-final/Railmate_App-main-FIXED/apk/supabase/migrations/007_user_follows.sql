-- ============================================================
-- 007_user_follows.sql
--
-- Task 3: "Following" tab in app/(tabs)/community.tsx has been cosmetic
-- — no follows table existed, so the tab applied no filter. This adds
-- the table + RLS backing the Follow/Unfollow button (in the Task 2
-- badge-preview modal) and the Following feed filter.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followed_id),
  CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> followed_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed ON user_follows(followed_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- A user can see a follow row if they're on either side of it (needed
-- so both "who do I follow" and "who follows me" / follower-count
-- lookups work without a service role).
CREATE POLICY "Users read own follow relationships"
  ON user_follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = followed_id);

-- A user can only create a follow row where THEY are the follower —
-- prevents forging a follow on someone else's behalf.
CREATE POLICY "Users insert own follows"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- A user can only delete (unfollow) their own follow rows.
CREATE POLICY "Users delete own follows"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

NOTIFY pgrst, 'reload schema';
