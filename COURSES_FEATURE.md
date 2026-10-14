# Courses feature

Run `supabase/migrations/008_courses.sql` after migration 007, then run `supabase/migrations/009_courses_check_sessions.sql`. Then run `supabase/migrations/011_courses_ownership_hardening.sql` to tie progress, checks and certificates to the authenticated user's course tree. Both are idempotent. The second migration creates a server-owned, single-use session store with RLS, indexes, and service-role-only access for pending knowledge checks.

## Flow

1. A signed-in student opens **Courses** in the dashboard sidebar and submits interests, desired outcome, skill level, weekly time, and preferred format.
2. `POST /api/courses/generate` validates and rate-limits the request, stores the profile, asks the shared Groq JSON layer for a course, sanitizes every YouTube URL, and persists the course tree.
3. Lessons link to YouTube in a new tab. A student requests an AI-generated three-question check and must submit it before that lesson is marked complete.
4. `POST /api/courses/check` verifies ownership and rate-limits both actions. Generate stores the full question set (including answer keys) in a short-lived server-side session and returns only a session ID plus sanitized questions. Submit accepts that session ID and answers, grades against the stored keys without trusting client questions or asking the model to grade, consumes the session once, stores the result, and advances progress only for a passing score (70%). Upstream errors are logged but replaced with generic client errors.
5. When every video is passed, a certificate row is created with the student name, date, and certificate ID. The certificate card uses the browser print dialog for PDF/download-friendly output; no binary certificate is generated.

The feature uses the existing Supabase SSR client, shared Groq generation layer, and in-memory/Upstash-compatible rate limiter. Set the normal Supabase and `GROQ_API_KEY` environment variables; do not add course-specific secrets.
