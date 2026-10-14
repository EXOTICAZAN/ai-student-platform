-- 009_courses_check_sessions.sql: server-owned, single-use knowledge-check sessions.
create table if not exists public.course_check_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  video_id uuid not null references public.course_videos(id) on delete cascade,
  questions jsonb not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists course_check_sessions_user_expiry_idx on public.course_check_sessions(user_id, expires_at);
create index if not exists course_check_sessions_video_idx on public.course_check_sessions(user_id, video_id, expires_at);

alter table public.course_check_sessions enable row level security;
drop policy if exists "course_check_sessions_no_client_access" on public.course_check_sessions;
create policy "course_check_sessions_no_client_access" on public.course_check_sessions
  for all to authenticated using (false) with check (false);

revoke all on table public.course_check_sessions from anon, authenticated;
grant all on table public.course_check_sessions to service_role;
