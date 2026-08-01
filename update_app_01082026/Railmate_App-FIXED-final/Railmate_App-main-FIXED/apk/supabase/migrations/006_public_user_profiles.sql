-- ============================================================
-- 006_public_user_profiles.sql
--
-- Problem: 001_initial_schema.sql locks `users` SELECT down to
--   "Users read own profile" (auth.uid() = id). That's correct for
--   phone/email/premium_expires_at, but it also silently blocks every
--   embedded `user:users(...)` join the app already relies on for
--   OTHER people's rows — community feed cards, report-detail
--   verifiers/comments, leaderboard, and the new badge-preview modal
--   (Task 2) all try to read another user's display_name/avatar_url/
--   trust_score and currently get `null` back under RLS, not an error.
--
-- Fix: do NOT widen the RLS policy on `users` itself (that would be a
-- row-level allow, and RLS cannot restrict which *columns* come back —
-- a client doing `select('*')` against a widened `users` policy would
-- get phone/email/premium_expires_at too). Instead, expose a narrow
-- VIEW containing only the columns that are safe for any authenticated
-- user to see about any other user, and leave the base table policy
-- untouched.
--
-- NOTE on `verification_count`: the Task 2 brief asked for
-- id, display_name, avatar_url, trust_score, report_count,
-- verification_count. `verification_count` does NOT exist on `users`
-- — it's a per-report counter on `community_reports` (see
-- 002_community_delay_schema.sql / 003_fix_schema_drift.sql). The
-- users table's actual "how much has this person contributed" column
-- is `report_count` (already public-safe), so that's what this view
-- exposes; there is no per-user verification_count to expose. Also
-- included: `is_trusted`, since comments-discussion.tsx / report cards
-- already need it for the "Trusted Reporter" badge and it's no more
-- sensitive than trust_score.
-- ============================================================

CREATE OR REPLACE VIEW public.user_public_profiles AS
SELECT
  id,
  display_name,
  avatar_url,
  trust_score,
  report_count,
  is_trusted
FROM public.users;

-- Explicitly NOT included, on purpose: phone, email, push_token,
-- premium_expires_at, is_premium, is_banned, language_pref, theme_pref,
-- helpful_vote_count (internal), created_at/updated_at.

-- This view is created by the migration role (which owns `users` and
-- has BYPASSRLS), so it bypasses the restrictive base-table RLS policy
-- for the columns it exposes. The base `users` table's own RLS is
-- UNCHANGED — direct queries against `users` remain locked to
-- "auth.uid() = id" for everyone. Only these 6 columns, for any row,
-- are reachable via the view.
GRANT SELECT ON public.user_public_profiles TO authenticated;

-- No anon access — RailMate requires auth for community features.
REVOKE SELECT ON public.user_public_profiles FROM anon;

NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------------
-- user_badges: this table is queried in app/badges-reputation.tsx and
-- in the new badge-preview modal (Task 2), but it was never created by
-- a tracked migration in this repo (it exists in the live DB from
-- manual/dashboard setup — same kind of drift as the `push_token`
-- column on `users`). Badges aren't sensitive, and Task 2 explicitly
-- needs other users' earned badges to render, so make sure read access
-- is public-to-authenticated regardless of whatever policy is already
-- there. Guarded with IF EXISTS / DROP-then-CREATE so this migration
-- is safe to run whether or not RLS was already configured on it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_badges') THEN
    EXECUTE 'ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Any authenticated user reads badges" ON public.user_badges';
    EXECUTE 'CREATE POLICY "Any authenticated user reads badges" ON public.user_badges FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
END $$;
