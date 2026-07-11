-- ============================================================
-- NEXT BOOST — Feature Migration
-- Adds: Twitter/X support, streak milestones, expanded
--       achievements, affiliate tiers, leaderboard badges
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. TWITTER/X PLATFORM ─────────────────────────────────
-- Add 'twitter' and 'retweet' to the tasks table constraints
-- (Only needed if you have CHECK constraints on platform/type)
-- If your tasks table uses TEXT columns with no CHECK constraint,
-- nothing is needed here — Twitter tasks will work immediately.

-- Example: if you have a check constraint, alter it:
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_platform_check;
-- ALTER TABLE tasks ADD CONSTRAINT tasks_platform_check
--   CHECK (platform IN ('tiktok','instagram','youtube','discord','twitch','website','twitter'));
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;
-- ALTER TABLE tasks ADD CONSTRAINT tasks_type_check
--   CHECK (type IN ('follow','like','view','join','website','retweet'));


-- ── 2. STREAK MILESTONE BONUSES ───────────────────────────
-- The frontend already computes streak bonuses client-side.
-- Make sure your claim_daily_bonus RPC returns { streak, points_earned }.
-- If your current function already returns those fields, no change needed.

-- Add current_streak to profiles if not present:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- Update claim_daily_bonus to track current_streak properly
-- (replace only if your function doesn't already track streaks)
CREATE OR REPLACE FUNCTION claim_daily_bonus()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile profiles%ROWTYPE;
  v_last_claim date;
  v_today date := current_date;
  v_streak int;
  v_base_pts int := 10;
  v_bonus_pts int := 0;
  v_total_pts int;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id FOR UPDATE;
  v_last_claim := (v_profile.last_daily_claim)::date;

  IF v_last_claim = v_today THEN
    RETURN jsonb_build_object('error','Already claimed today');
  END IF;

  -- Streak: consecutive if claimed yesterday, else reset
  IF v_last_claim = v_today - 1 THEN
    v_streak := COALESCE(v_profile.current_streak, 0) + 1;
  ELSE
    v_streak := 1;
  END IF;

  -- Streak milestone bonuses
  IF    v_streak >= 100 THEN v_bonus_pts := 150;
  ELSIF v_streak >= 60  THEN v_bonus_pts := 100;
  ELSIF v_streak >= 30  THEN v_bonus_pts := 60;
  ELSIF v_streak >= 14  THEN v_bonus_pts := 30;
  ELSIF v_streak >= 7   THEN v_bonus_pts := 15;
  ELSIF v_streak >= 3   THEN v_bonus_pts := 5;
  END IF;

  v_total_pts := v_base_pts + v_bonus_pts;

  UPDATE profiles SET
    points = points + v_total_pts,
    last_daily_claim = v_today,
    current_streak = v_streak,
    longest_streak = GREATEST(COALESCE(longest_streak,0), v_streak)
  WHERE id = v_user_id;

  INSERT INTO point_ledger (user_id, delta, reason, meta)
  VALUES (v_user_id, v_total_pts, 'daily_bonus', jsonb_build_object('streak', v_streak, 'bonus', v_bonus_pts));

  RETURN jsonb_build_object(
    'points_earned', v_total_pts,
    'streak', v_streak,
    'streak_bonus', v_bonus_pts
  );
END;
$$;

-- check_daily_bonus: returns whether already claimed + current streak
CREATE OR REPLACE FUNCTION check_daily_bonus()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile profiles%ROWTYPE;
  v_today date := current_date;
  v_streak int;
  v_bonus int := 0;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  v_streak := COALESCE(v_profile.current_streak, 0);

  IF    v_streak >= 100 THEN v_bonus := 150;
  ELSIF v_streak >= 60  THEN v_bonus := 100;
  ELSIF v_streak >= 30  THEN v_bonus := 60;
  ELSIF v_streak >= 14  THEN v_bonus := 30;
  ELSIF v_streak >= 7   THEN v_bonus := 15;
  ELSIF v_streak >= 3   THEN v_bonus := 5;
  END IF;

  RETURN jsonb_build_object(
    'claimed_today', (v_profile.last_daily_claim)::date = v_today,
    'streak', v_streak,
    'streak_bonus', v_bonus,
    'longest_streak', COALESCE(v_profile.longest_streak, 0)
  );
END;
$$;


-- ── 3. LEADERBOARD VIEWS — expose top_badge & streak ──────
-- Add top_badge, top_badge_title, current_streak, achievements_count
-- to your leaderboard views. Adjust view names to match yours.

-- Assumes you have a view called 'leaderboard'. Drop and recreate:
DROP VIEW IF EXISTS leaderboard CASCADE;
CREATE VIEW leaderboard AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.avatar_color,
  p.points,
  p.current_streak,
  p.longest_streak,
  COALESCE(tc.tasks_completed, 0) AS tasks_completed,
  -- Top badge: most recent earned achievement icon
  (SELECT a.icon FROM user_achievements ua
   JOIN achievements a ON a.id = ua.achievement_id
   WHERE ua.user_id = p.id
   ORDER BY ua.earned_at DESC LIMIT 1) AS top_badge,
  (SELECT a.title FROM user_achievements ua
   JOIN achievements a ON a.id = ua.achievement_id
   WHERE ua.user_id = p.id
   ORDER BY ua.earned_at DESC LIMIT 1) AS top_badge_title,
  (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = p.id) AS achievements_count,
  RANK() OVER (ORDER BY p.points DESC) AS rank
FROM profiles p
LEFT JOIN (
  SELECT owner_id, COUNT(*) AS tasks_completed
  FROM completions WHERE status = 'approved'
  GROUP BY owner_id
) tc ON tc.owner_id = p.id;

-- weekly_leaderboard
DROP VIEW IF EXISTS weekly_leaderboard CASCADE;
CREATE VIEW weekly_leaderboard AS
SELECT
  p.id, p.username, p.display_name, p.avatar_color, p.current_streak,
  COALESCE(wk.weekly_points, 0) AS weekly_points,
  COALESCE(tc.tasks_completed, 0) AS tasks_completed,
  (SELECT a.icon FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=p.id ORDER BY ua.earned_at DESC LIMIT 1) AS top_badge,
  (SELECT a.title FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=p.id ORDER BY ua.earned_at DESC LIMIT 1) AS top_badge_title,
  (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id=p.id) AS achievements_count,
  RANK() OVER (ORDER BY COALESCE(wk.weekly_points,0) DESC) AS rank
FROM profiles p
LEFT JOIN (
  SELECT user_id, SUM(delta) AS weekly_points FROM point_ledger
  WHERE created_at >= date_trunc('week', now()) GROUP BY user_id
) wk ON wk.user_id = p.id
LEFT JOIN (
  SELECT owner_id, COUNT(*) AS tasks_completed FROM completions WHERE status='approved' GROUP BY owner_id
) tc ON tc.owner_id = p.id;

-- daily_leaderboard
DROP VIEW IF EXISTS daily_leaderboard CASCADE;
CREATE VIEW daily_leaderboard AS
SELECT
  p.id, p.username, p.display_name, p.avatar_color, p.current_streak,
  COALESCE(dy.daily_points, 0) AS daily_points,
  COALESCE(tc.tasks_completed, 0) AS tasks_completed,
  (SELECT a.icon FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=p.id ORDER BY ua.earned_at DESC LIMIT 1) AS top_badge,
  (SELECT a.title FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=p.id ORDER BY ua.earned_at DESC LIMIT 1) AS top_badge_title,
  (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id=p.id) AS achievements_count,
  RANK() OVER (ORDER BY COALESCE(dy.daily_points,0) DESC) AS rank
FROM profiles p
LEFT JOIN (
  SELECT user_id, SUM(delta) AS daily_points FROM point_ledger
  WHERE created_at >= date_trunc('day', now()) GROUP BY user_id
) dy ON dy.user_id = p.id
LEFT JOIN (
  SELECT owner_id, COUNT(*) AS tasks_completed FROM completions WHERE status='approved' GROUP BY owner_id
) tc ON tc.owner_id = p.id;


-- ── 4. AFFILIATE / L2 REFERRALS ───────────────────────────
-- Track who referred whom, including L2 chain
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);

-- Point ledger reason for L2 rewards
-- (your existing point_ledger table just needs 'referral_l2_reward' as a reason string — no schema change)

-- Update use_referral_code to also pay L2 bonus to grandparent referrer
CREATE OR REPLACE FUNCTION use_referral_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_referrer profiles%ROWTYPE;
  v_grandparent_id uuid;
  v_user profiles%ROWTYPE;
  v_bonus int;
  v_l2_bonus int := 0;
  v_tier_l1 int;
  v_tier_l2 int;
  v_l1_count int;
BEGIN
  SELECT * INTO v_user FROM profiles WHERE id = v_user_id;
  IF v_user.referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('error','You have already used a referral code');
  END IF;
  IF v_user.created_at < now() - interval '7 days' THEN
    RETURN jsonb_build_object('error','Referral codes can only be applied within 7 days of signup');
  END IF;

  SELECT * INTO v_referrer FROM profiles WHERE referral_code = upper(p_code);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','Invalid referral code');
  END IF;
  IF v_referrer.id = v_user_id THEN
    RETURN jsonb_build_object('error','You cannot use your own referral code');
  END IF;

  -- Tier bonus for referrer based on their L1 count
  SELECT COUNT(*) INTO v_l1_count FROM profiles WHERE referred_by = v_referrer.id;
  IF    v_l1_count >= 50 THEN v_tier_l1 := 100; v_tier_l2 := 25;
  ELSIF v_l1_count >= 20 THEN v_tier_l1 := 75;  v_tier_l2 := 15;
  ELSIF v_l1_count >= 5  THEN v_tier_l1 := 60;  v_tier_l2 := 10;
  ELSE                        v_tier_l1 := 50;  v_tier_l2 := 0;
  END IF;
  v_bonus := v_tier_l1;

  -- Mark this user as referred
  UPDATE profiles SET referred_by = v_referrer.id WHERE id = v_user_id;

  -- Award L1 bonus to referrer
  UPDATE profiles SET points = points + v_bonus,
    referral_count = COALESCE(referral_count,0) + 1
  WHERE id = v_referrer.id;
  INSERT INTO point_ledger (user_id, delta, reason, meta)
  VALUES (v_referrer.id, v_bonus, 'referral_reward',
    jsonb_build_object('referred_user', v_user_id));

  -- Award L1 signup bonus to new user
  UPDATE profiles SET points = points + 50 WHERE id = v_user_id;
  INSERT INTO point_ledger (user_id, delta, reason, meta)
  VALUES (v_user_id, 50, 'referral_signup_bonus',
    jsonb_build_object('referrer', v_referrer.id));

  -- L2: if referrer was themselves referred, pay grandparent
  IF v_referrer.referred_by IS NOT NULL AND v_tier_l2 > 0 THEN
    v_grandparent_id := v_referrer.referred_by;
    UPDATE profiles SET points = points + v_tier_l2 WHERE id = v_grandparent_id;
    INSERT INTO point_ledger (user_id, delta, reason, meta)
    VALUES (v_grandparent_id, v_tier_l2, 'referral_l2_reward',
      jsonb_build_object('l1_referrer', v_referrer.id, 'l2_user', v_user_id));
  END IF;

  RETURN jsonb_build_object('bonus', 50, 'referrer_bonus', v_bonus);
END;
$$;


-- ── 5. EXPANDED ACHIEVEMENTS ──────────────────────────────
-- Insert new achievements (skip if already exists via ON CONFLICT)
-- Assumes achievements table has: id, title, description, icon, points_reward, requirement_type, requirement_value

INSERT INTO achievements (title, description, icon, points_reward, requirement_type, requirement_value)
VALUES
  -- Twitter/X achievements
  ('First X Task',      'Complete your first Twitter/X task',        '🐦', 10,  'twitter_tasks', 1),
  ('X Enthusiast',      'Complete 10 Twitter/X tasks',               '🐦', 30,  'twitter_tasks', 10),
  ('Twitter Pro',       'Complete 50 Twitter/X tasks',               '🐦', 100, 'twitter_tasks', 50),

  -- Streak achievements
  ('3-Day Streak',      'Log in and claim bonus 3 days in a row',    '🔥', 10,  'streak',        3),
  ('Week Warrior',      'Maintain a 7-day login streak',             '🔥', 25,  'streak',        7),
  ('Two-Week Grind',    'Maintain a 14-day login streak',            '🔥', 50,  'streak',        14),
  ('Monthly Habit',     'Maintain a 30-day login streak',            '🔥', 100, 'streak',        30),
  ('Two Months Strong', 'Maintain a 60-day login streak',            '🔥', 200, 'streak',        60),
  ('100-Day Legend',    'Maintain a 100-day login streak',           '💯', 500, 'streak',        100),

  -- Referral tier achievements
  ('First Referral',    'Refer your first friend',                   '🤝', 20,  'referrals',     1),
  ('Team Builder',      'Refer 5 friends (Booster tier)',            '🚀', 75,  'referrals',     5),
  ('Network Grower',    'Refer 20 friends (Grower tier)',            '📈', 200, 'referrals',     20),
  ('Referral Elite',    'Refer 50 friends (Elite tier)',             '👑', 500, 'referrals',     50),
  ('L2 Earner',         'Earn points from a Level 2 referral',       '🌐', 30,  'l2_referrals',  1),

  -- Task volume milestones
  ('Task Centurion',    'Complete 100 tasks total',                  '💪', 150, 'tasks',         100),
  ('Task Machine',      'Complete 250 tasks total',                  '⚙️', 300, 'tasks',         250),
  ('Task Legend',       'Complete 500 tasks total',                  '🏅', 750, 'tasks',         500),

  -- Points earned milestones
  ('Point Collector',   'Earn 1,000 points total',                   '💰', 50,  'points_earned', 1000),
  ('Point Hoarder',     'Earn 5,000 points total',                   '💰', 150, 'points_earned', 5000),
  ('Point Tycoon',      'Earn 25,000 points total',                  '💎', 500, 'points_earned', 25000),

  -- Platform diversity
  ('Multi-Platform',    'Complete tasks on 3 different platforms',   '🌍', 50,  'platforms',     3),
  ('Platform Master',   'Complete tasks on all 5 platforms',         '🎮', 150, 'platforms',     5),

  -- Posting tasks
  ('Task Creator',      'Post your first task',                      '📤', 20,  'tasks_posted',  1),
  ('Prolific Poster',   'Post 10 tasks',                             '📤', 100, 'tasks_posted',  10),
  ('Content Empire',    'Post 50 tasks',                             '🏰', 400, 'tasks_posted',  50)

ON CONFLICT (title) DO NOTHING;

