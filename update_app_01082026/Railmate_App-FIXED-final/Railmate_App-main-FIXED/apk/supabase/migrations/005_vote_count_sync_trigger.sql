-- ============================================================
-- Fix: verification_count / dispute_count were never updated
-- anywhere. voteOnReport() (api/community.ts) only writes to
-- report_votes; no trigger or Edge Function ever synced the
-- denormalized counts on community_reports. Result: optimistic
-- UI shows the new count, then reverts to 0 on refetch while
-- the green "confirmed" state persists (because current_user_vote
-- IS real, it's the count that was never wired up).
-- ============================================================

CREATE OR REPLACE FUNCTION sync_report_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- New vote inserted
  IF (TG_OP = 'INSERT') THEN
    IF NEW.vote_type = 'CONFIRM' THEN
      UPDATE community_reports
        SET verification_count = verification_count + 1
        WHERE id = NEW.report_id;
    ELSIF NEW.vote_type = 'DISPUTE' THEN
      UPDATE community_reports
        SET dispute_count = dispute_count + 1
        WHERE id = NEW.report_id;
    END IF;
    RETURN NEW;

  -- Vote removed (toggle-off in voteOnReport)
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.vote_type = 'CONFIRM' THEN
      UPDATE community_reports
        SET verification_count = GREATEST(0, verification_count - 1)
        WHERE id = OLD.report_id;
    ELSIF OLD.vote_type = 'DISPUTE' THEN
      UPDATE community_reports
        SET dispute_count = GREATEST(0, dispute_count - 1)
        WHERE id = OLD.report_id;
    END IF;
    RETURN OLD;

  -- Vote switched CONFIRM <-> DISPUTE via upsert onConflict
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.vote_type = NEW.vote_type THEN
      RETURN NEW; -- no change
    END IF;

    IF OLD.vote_type = 'CONFIRM' THEN
      UPDATE community_reports
        SET verification_count = GREATEST(0, verification_count - 1)
        WHERE id = OLD.report_id;
    ELSIF OLD.vote_type = 'DISPUTE' THEN
      UPDATE community_reports
        SET dispute_count = GREATEST(0, dispute_count - 1)
        WHERE id = OLD.report_id;
    END IF;

    IF NEW.vote_type = 'CONFIRM' THEN
      UPDATE community_reports
        SET verification_count = verification_count + 1
        WHERE id = NEW.report_id;
    ELSIF NEW.vote_type = 'DISPUTE' THEN
      UPDATE community_reports
        SET dispute_count = dispute_count + 1
        WHERE id = NEW.report_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_report_vote_counts ON report_votes;
CREATE TRIGGER trigger_sync_report_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON report_votes
  FOR EACH ROW EXECUTE FUNCTION sync_report_vote_counts();

-- One-time backfill: reconcile existing counts against actual vote rows,
-- in case any votes were cast before this trigger existed.
UPDATE community_reports cr
SET verification_count = COALESCE(v.confirm_count, 0),
    dispute_count = COALESCE(v.dispute_count, 0)
FROM (
  SELECT
    report_id,
    COUNT(*) FILTER (WHERE vote_type = 'CONFIRM') AS confirm_count,
    COUNT(*) FILTER (WHERE vote_type = 'DISPUTE') AS dispute_count
  FROM report_votes
  GROUP BY report_id
) v
WHERE cr.id = v.report_id;

NOTIFY pgrst, 'reload schema';
