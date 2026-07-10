-- ============================================================
-- NEXT BOOST — v2 Feature Migration
-- Adds: trust_score, is_verified, verified_creator badges,
--       mutual_promises table
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. TRUST SCORE & VERIFIED BADGE on profiles ───────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Trust score is automatically computed from:
--   tasks_completed, tasks_posted, current_streak, account_age, report_rate
-- You can run a scheduled job or trigger to update it.
-- Simple manual formula (run periodically):
CREATE OR REPLACE FUNCTION recalc_trust_scores()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET trust_score = LEAST(100, GREATEST(0,
    -- Base from completions (max 40pts)
    LEAST(40, COALESCE((
      SELECT COUNT(*) FROM completions WHERE user_id = profiles.id AND status = 'approved'
    ), 0) * 2)
    -- Posting activity (max 20pts)
    + LEAST(20, COALESCE(tasks_posted, 0) * 4)
    -- Streak bonus (max 20pts)
    + LEAST(20, COALESCE(current_streak, 0))
    -- Account age bonus (max 10pts — 1pt per 7 days)
    + LEAST(10, EXTRACT(DAY FROM NOW() - created_at)::int / 7)
    -- Points earned proxy (max 10pts)
    + LEAST(10, GREATEST(0, COALESCE(points, 0) / 100))
  ));
END;
$$;

-- Run it once now:
SELECT recalc_trust_scores();

-- To run automatically, set up a pg_cron job (if available):
-- SELECT cron.schedule('recalc-trust', '0 * * * *', 'SELECT recalc_trust_scores()');

-- Expose trust_score and is_verified in leaderboard views:
-- (re-run your existing leaderboard view CREATE OR REPLACE to add these columns)
-- Example — add to your leaderboard view SELECT:
--   p.trust_score, p.is_verified


-- ── 2. MUTUAL FOLLOW-BACK PROMISE TABLE ───────────────────
CREATE TABLE IF NOT EXISTS mutual_promises (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (from_user, to_user)
);

-- RLS
ALTER TABLE mutual_promises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own promises" ON mutual_promises;
CREATE POLICY "Users can manage own promises" ON mutual_promises
  FOR ALL USING (auth.uid() = from_user);

DROP POLICY IF EXISTS "Users can see promises about them" ON mutual_promises;
CREATE POLICY "Users can see promises about them" ON mutual_promises
  FOR SELECT USING (auth.uid() = to_user OR auth.uid() = from_user);


-- ── 3. EXPOSE trust_score + is_verified in leaderboard views ──
-- Update the leaderboard view to include these fields.
-- Replace 'your_existing_leaderboard_view_definition' with your actual view.
-- Example (adjust to match your existing view):
/*
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id, p.username, p.display_name, p.avatar_url, p.avatar_color,
  p.points, p.tasks_posted, p.top_badge, p.top_badge_title,
  p.current_streak, p.achievements_count, p.followers_count,
  p.trust_score, p.is_verified,           -- NEW
  COALESCE(tc.tasks_completed, 0) AS tasks_completed,
  RANK() OVER (ORDER BY p.points DESC) AS rank
FROM profiles p
LEFT JOIN (
  SELECT owner_id, COUNT(*) AS tasks_completed
  FROM completions WHERE status='approved' GROUP BY owner_id
) tc ON tc.owner_id = p.id;
*/


-- ── 4. GROWTH PACKAGES — no schema changes needed ─────────
-- Growth packages are posted via multiple post_task() RPC calls client-side.
-- No new tables required.


-- ── DONE ─────────────────────────────────────────────────
-- Summary of changes:
-- profiles.trust_score    INTEGER 0-100 (auto-computed)
-- profiles.is_verified    BOOLEAN (set manually by admin)
-- mutual_promises         Table for follow-back promises
-- recalc_trust_scores()   Function to recompute trust scores
