-- =============================================================================
-- 005 · Contact inbox + demo-data seeding
-- =============================================================================
-- Safe to re-run. Run AFTER 004.
--
-- 1. contact_messages: real storage behind /contact (previously a mailto: link).
--    Inserts only; nobody can read the table through the public API.
-- 2. seed_demo_data(user_id): fills one account with realistic notes, decks,
--    quizzes, tasks, activity and notifications so the dashboard is not empty
--    on stage. Callable only with the service_role key.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. contact_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email      TEXT NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  topic      TEXT NOT NULL CHECK (char_length(topic) BETWEEN 2 AND 60),
  message    TEXT NOT NULL CHECK (char_length(message) BETWEEN 20 AND 5000),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  handled    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_insert_only" ON contact_messages;
CREATE POLICY "contact_insert_only" ON contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (handled = false);

-- No SELECT/UPDATE/DELETE policy on purpose: only service_role (dashboard) reads it.
REVOKE ALL ON contact_messages FROM anon, authenticated;
GRANT INSERT ON contact_messages TO anon, authenticated;
GRANT ALL ON contact_messages TO service_role;

CREATE INDEX IF NOT EXISTS contact_messages_created_idx
  ON contact_messages (created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. seed_demo_data
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seed_demo_data(target_user UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n1 UUID; n2 UUID; n3 UUID;
  d1 UUID; d2 UUID;
  q1 UUID; q2 UUID;
  i INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user) THEN
    RETURN 'No such user: ' || target_user;
  END IF;

  -- Clear previous demo rows for this user so the function can be re-run.
  DELETE FROM activity_log     WHERE user_id = target_user;
  DELETE FROM quiz_attempts    WHERE user_id = target_user;
  DELETE FROM quizzes          WHERE user_id = target_user;
  DELETE FROM flashcard_decks  WHERE user_id = target_user;
  DELETE FROM notes            WHERE user_id = target_user;
  DELETE FROM study_tasks      WHERE user_id = target_user;
  DELETE FROM notifications    WHERE user_id = target_user;

  -- Notes ------------------------------------------------------------------
  INSERT INTO notes (user_id, title, subject, source_type, is_favorite, tags, summary, content)
  VALUES (target_user, 'Photosynthesis: light & dark reactions', 'Biology', 'ai', true,
    '["biology","plants","exam"]',
    'Light reactions make ATP and NADPH in the thylakoids; the Calvin cycle uses them to fix CO2 into sugar.',
    E'# Photosynthesis\n\n## Light-dependent reactions\n- Occur in the **thylakoid membranes**\n- Water is split, releasing O2\n- Produce **ATP** and **NADPH**\n\n## Calvin cycle (light-independent)\n- Occurs in the **stroma**\n- Rubisco fixes CO2\n- Uses ATP + NADPH to build G3P (sugar)\n\n**Equation:** 6CO2 + 6H2O + light -> C6H12O6 + 6O2')
  RETURNING id INTO n1;

  INSERT INTO notes (user_id, title, subject, source_type, tags, content)
  VALUES (target_user, 'Big-O cheat sheet', 'Computer Science', 'manual',
    '["algorithms","exam"]',
    E'# Big-O quick reference\n\n| Complexity | Example |\n|---|---|\n| O(1) | hash lookup |\n| O(log n) | binary search |\n| O(n) | linear scan |\n| O(n log n) | merge sort |\n| O(n^2) | bubble sort |')
  RETURNING id INTO n2;

  INSERT INTO notes (user_id, title, subject, source_type, tags, content)
  VALUES (target_user, 'The French Revolution: causes', 'History', 'manual',
    '["history","essay"]',
    E'# Causes\n1. Fiscal crisis after costly wars\n2. Unequal Estates system\n3. Enlightenment ideas\n4. Bread shortages (1788-89)')
  RETURNING id INTO n3;

  -- Flashcards -------------------------------------------------------------
  INSERT INTO flashcard_decks (user_id, title, subject, description, note_id)
  VALUES (target_user, 'Photosynthesis essentials', 'Biology', 'Key terms for the midterm', n1)
  RETURNING id INTO d1;
  INSERT INTO flashcard_decks (user_id, title, subject, description, note_id)
  VALUES (target_user, 'Algorithms & complexity', 'Computer Science', 'Big-O and core data structures', n2)
  RETURNING id INTO d2;

  INSERT INTO flashcards (deck_id, user_id, front, back, hint, ease, interval_days, reviews, lapses, due_at, last_reviewed_at) VALUES
    (d1, target_user, 'Where do the light reactions occur?', 'Thylakoid membranes', 'Inside the chloroplast', 2.6, 6, 4, 0, NOW() + INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    (d1, target_user, 'What enzyme fixes CO2 in the Calvin cycle?', 'Rubisco', NULL, 2.5, 3, 3, 1, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '3 days'),
    (d1, target_user, 'Which molecules carry energy from the light reactions?', 'ATP and NADPH', NULL, 2.5, 0, 0, 0, NOW() - INTERVAL '1 hour', NULL),
    (d1, target_user, 'Where does the Calvin cycle take place?', 'The stroma', NULL, 2.4, 1, 2, 1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 day'),
    (d1, target_user, 'What gas is released when water is split?', 'Oxygen (O2)', NULL, 2.8, 12, 5, 0, NOW() + INTERVAL '9 days', NOW() - INTERVAL '3 days'),
    (d2, target_user, 'Time complexity of binary search?', 'O(log n)', 'Halves the search space', 2.7, 8, 4, 0, NOW() + INTERVAL '5 days', NOW() - INTERVAL '3 days'),
    (d2, target_user, 'Worst-case complexity of quicksort?', 'O(n^2)', 'Bad pivot choice', 2.5, 0, 0, 0, NOW() - INTERVAL '1 hour', NULL),
    (d2, target_user, 'Which structure gives O(1) average lookup?', 'Hash table', NULL, 2.5, 0, 0, 0, NOW() - INTERVAL '30 minutes', NULL),
    (d2, target_user, 'Space complexity of merge sort?', 'O(n)', NULL, 2.5, 2, 2, 0, NOW() + INTERVAL '1 day', NOW() - INTERVAL '1 day');

  -- Quizzes ----------------------------------------------------------------
  INSERT INTO quizzes (user_id, title, subject, topic, difficulty, question_count, note_id)
  VALUES (target_user, 'Photosynthesis check-in', 'Biology', 'Photosynthesis', 'medium', 3, n1)
  RETURNING id INTO q1;
  INSERT INTO quiz_questions (quiz_id, user_id, question, options, correct_index, explanation, position) VALUES
    (q1, target_user, 'Where do the light-dependent reactions happen?', '["Stroma","Thylakoid membrane","Mitochondrial matrix","Cytoplasm"]', 1, 'They depend on the pigments and electron transport chain embedded in the thylakoid membrane.', 0),
    (q1, target_user, 'Which enzyme fixes carbon dioxide?', '["ATP synthase","Catalase","Rubisco","Helicase"]', 2, 'Rubisco attaches CO2 to RuBP at the start of the Calvin cycle.', 1),
    (q1, target_user, 'What is the source of the oxygen released?', '["Carbon dioxide","Water","Glucose","NADPH"]', 1, 'Oxygen comes from the splitting (photolysis) of water.', 2);

  INSERT INTO quizzes (user_id, title, subject, topic, difficulty, question_count, note_id)
  VALUES (target_user, 'Complexity analysis', 'Computer Science', 'Big-O', 'easy', 2, n2)
  RETURNING id INTO q2;
  INSERT INTO quiz_questions (quiz_id, user_id, question, options, correct_index, explanation, position) VALUES
    (q2, target_user, 'Binary search runs in?', '["O(n)","O(log n)","O(n log n)","O(1)"]', 1, 'Each step halves the remaining range.', 0),
    (q2, target_user, 'Which sort is O(n log n) in the worst case?', '["Bubble sort","Insertion sort","Merge sort","Selection sort"]', 2, 'Merge sort always splits and merges in n log n.', 1);

  INSERT INTO quiz_attempts (quiz_id, user_id, answers, score, total, completed_at, created_at) VALUES
    (q1, target_user, '[1,0,1]', 2, 3, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
    (q1, target_user, '[1,2,1]', 3, 3, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    (q2, target_user, '[1,2]',   2, 2, NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day');

  -- Planner ----------------------------------------------------------------
  INSERT INTO study_tasks (user_id, title, description, subject, priority, status, due_at, duration_minutes, completed_at, sort_order) VALUES
    (target_user, 'Review photosynthesis flashcards', 'Clear the due queue', 'Biology', 'high', 'todo', NOW() + INTERVAL '6 hours', 25, NULL, 0),
    (target_user, 'Practice 10 complexity problems', NULL, 'Computer Science', 'medium', 'in_progress', NOW() + INTERVAL '1 day', 45, NULL, 1),
    (target_user, 'Outline French Revolution essay', 'Thesis + three arguments', 'History', 'medium', 'todo', NOW() + INTERVAL '3 days', 60, NULL, 2),
    (target_user, 'Read chapter 7', NULL, 'Biology', 'low', 'done', NOW() - INTERVAL '1 day', 30, NOW() - INTERVAL '1 day', 3);

  -- Activity: 12 consecutive days so streak, XP and analytics have shape -----
  FOR i IN 0..11 LOOP
    INSERT INTO activity_log (user_id, activity_type, label, metadata, xp, created_at) VALUES
      (target_user, 'flashcard', 'Reviewed flashcards', jsonb_build_object('minutes', 10 + (i % 4) * 5), 20 + (i % 3) * 5, NOW() - (i || ' days')::interval - INTERVAL '2 hours');
    IF i % 2 = 0 THEN
      INSERT INTO activity_log (user_id, activity_type, label, metadata, xp, created_at) VALUES
        (target_user, 'tutor', 'Asked the AI tutor', jsonb_build_object('minutes', 15), 15, NOW() - (i || ' days')::interval - INTERVAL '5 hours');
    END IF;
    IF i % 3 = 0 THEN
      INSERT INTO activity_log (user_id, activity_type, label, metadata, xp, created_at) VALUES
        (target_user, 'quiz', 'Completed a quiz', jsonb_build_object('minutes', 12), 40, NOW() - (i || ' days')::interval - INTERVAL '8 hours');
    END IF;
    IF i % 4 = 1 THEN
      INSERT INTO activity_log (user_id, activity_type, label, metadata, xp, created_at) VALUES
        (target_user, 'note', 'Created a note', jsonb_build_object('minutes', 20), 25, NOW() - (i || ' days')::interval - INTERVAL '10 hours');
    END IF;
  END LOOP;

  -- Notifications ----------------------------------------------------------
  INSERT INTO notifications (user_id, text, link, read) VALUES
    (target_user, '4 flashcards are due for review', '/dashboard/flashcards', false),
    (target_user, 'You are on a 12-day study streak. Keep it going!', '/dashboard/analytics', false),
    (target_user, 'A scholarship deadline is coming up', '/dashboard/scholarships', true);

  INSERT INTO user_settings (user_id) VALUES (target_user) ON CONFLICT (user_id) DO NOTHING;

  RETURN 'Demo data created for ' || target_user;
END;
$$;

REVOKE ALL ON FUNCTION seed_demo_data(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION seed_demo_data(UUID) TO service_role;

SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'contact_messages') AS contact_table,
  (SELECT count(*) FROM pg_proc WHERE proname = 'seed_demo_data')                       AS seed_function;
