-- =============================================================================
-- 007_dashboard_stats_auth.sql — close a cross-user read.
--
-- get_user_dashboard_stats() and get_weekly_study_minutes() are SECURITY
-- DEFINER, so they bypass RLS. Both took any target_user_id and never checked
-- it against the caller, and Postgres grants EXECUTE to PUBLIC by default, so
-- anyone holding the public anon key could read another user's XP, streak and
-- activity counts if they knew the user's UUID.
--
-- This migration:
--   1. Rejects any call whose target_user_id is not the caller (auth.uid()).
--      auth.uid() is NULL for anon and for service_role requests, so both are
--      rejected too.
--   2. Revokes EXECUTE from PUBLIC and anon, then grants it back to
--      authenticated (the app calls these through supabase.rpc() as a signed-in
--      user) and service_role.
--
-- Idempotent. Run after 006, in its own SQL editor tab. Re-run it if 002 is
-- ever re-run, because 002 re-grants EXECUTE to anon.
-- =============================================================================

-- 1a. Dashboard stats ------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(target_user_id UUID)
RETURNS TABLE (
  total_xp            BIGINT,
  level               INTEGER,
  streak_days         INTEGER,
  ai_usage            BIGINT,
  notes_count         BIGINT,
  decks_count         BIGINT,
  cards_due           BIGINT,
  tasks_done          BIGINT,
  tasks_open          BIGINT,
  quizzes_taken       BIGINT,
  avg_accuracy        NUMERIC,
  minutes_this_week   BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_day  DATE;
  v_streak    INTEGER := 0;
BEGIN
  IF target_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(SUM(xp), 0) INTO total_xp
  FROM activity_log WHERE user_id = target_user_id;

  -- 1000 XP per level, floor of 1.
  level := GREATEST(1, FLOOR(total_xp::numeric / 1000) + 1)::integer;

  SELECT COUNT(*) INTO ai_usage
  FROM activity_log
  WHERE user_id = target_user_id AND activity_type = 'tutor';

  SELECT COUNT(*) INTO notes_count FROM notes WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO decks_count FROM flashcard_decks WHERE user_id = target_user_id;

  SELECT COUNT(*) INTO cards_due
  FROM flashcards WHERE user_id = target_user_id AND due_at <= NOW();

  SELECT COUNT(*) INTO tasks_done
  FROM study_tasks WHERE user_id = target_user_id AND status = 'done';

  SELECT COUNT(*) INTO tasks_open
  FROM study_tasks WHERE user_id = target_user_id AND status <> 'done';

  SELECT COUNT(*), COALESCE(ROUND(AVG(score::numeric / NULLIF(total, 0) * 100), 1), 0)
  INTO quizzes_taken, avg_accuracy
  FROM quiz_attempts WHERE user_id = target_user_id;

  -- activity_log has no duration column; study time lives in the
  -- JSONB metadata written by logActivity().
  SELECT COALESCE(SUM((a.metadata ->> 'minutes')::bigint), 0)
  INTO minutes_this_week
  FROM activity_log a
  WHERE a.user_id = target_user_id
    AND a.created_at >= date_trunc('week', NOW())
    AND a.metadata ->> 'minutes' ~ '^[0-9]+$';

  -- Streak: consecutive days ending today or yesterday.
  SELECT MAX(created_at::date) INTO v_last_day
  FROM activity_log WHERE user_id = target_user_id;

  IF v_last_day IS NOT NULL AND v_last_day >= CURRENT_DATE - 1 THEN
    SELECT COUNT(*)::integer INTO v_streak
    FROM (
      SELECT created_at::date AS d,
             created_at::date - (ROW_NUMBER() OVER (ORDER BY created_at::date))::integer AS grp
      FROM (SELECT DISTINCT created_at::date FROM activity_log WHERE user_id = target_user_id) dd
    ) grouped
    WHERE grouped.grp = (
      SELECT g2.grp FROM (
        SELECT created_at::date AS d,
               created_at::date - (ROW_NUMBER() OVER (ORDER BY created_at::date))::integer AS grp
        FROM (SELECT DISTINCT created_at::date FROM activity_log WHERE user_id = target_user_id) d3
      ) g2 WHERE g2.d = v_last_day
    );
  END IF;

  streak_days := v_streak;

  RETURN NEXT;
END;
$$;

-- 1b. Weekly minutes -------------------------------------------------------
-- Rewritten from LANGUAGE sql to plpgsql so it can run the same ownership check.
CREATE OR REPLACE FUNCTION get_weekly_study_minutes(target_user_id UUID)
RETURNS TABLE (day TEXT, day_index INTEGER, minutes BIGINT, xp BIGINT, events BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF target_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH week AS (
    SELECT generate_series(0, 6) AS offset
  ),
  days AS (
    SELECT
      to_char(CURRENT_DATE - (6 - w.offset) * INTERVAL '1 day', 'Dy') AS day,
      w.offset AS day_index,
      (CURRENT_DATE - (6 - w.offset)) AS d
    FROM week w
  )
  SELECT
    days.day,
    days.day_index::integer,
    COALESCE(SUM((a.metadata ->> 'minutes')::bigint), 0)::bigint,
    COALESCE(SUM(a.xp), 0)::bigint,
    COUNT(a.id)::bigint
  FROM days
  LEFT JOIN activity_log a
    ON a.user_id = target_user_id AND a.created_at::date = days.d
  GROUP BY days.day, days.day_index
  ORDER BY days.day_index;
END;
$$;

-- 2. Lock down EXECUTE -----------------------------------------------------
REVOKE ALL ON FUNCTION get_user_dashboard_stats(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION get_weekly_study_minutes(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_weekly_study_minutes(UUID) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

-- Verification: both should show authenticated/service_role only, no anon.
SELECT p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
WHERE p.proname IN ('get_user_dashboard_stats', 'get_weekly_study_minutes')
  AND p.pronamespace = 'public'::regnamespace;
