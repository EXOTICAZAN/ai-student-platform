-- 008_courses.sql: AI learning paths, checks and certificates. Idempotent.
create extension if not exists pgcrypto;

create table if not exists public.course_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interests text[] not null default '{}', goal text not null, skill_level text not null check (skill_level in ('beginner','intermediate','advanced')),
  weekly_time integer not null check (weekly_time between 1 and 168), preferred_format text not null check (preferred_format in ('video','reading','mixed')), updated_at timestamptz not null default now()
);
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, profile_user_id uuid references public.course_profiles(user_id), title text not null, description text not null, skill_level text not null, estimated_duration text not null, created_at timestamptz not null default now()
);
create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade, position integer not null, title text not null, description text not null
);
create table if not exists public.course_videos (
  id uuid primary key default gen_random_uuid(), module_id uuid not null references public.course_modules(id) on delete cascade, position integer not null, title text not null, url text not null, duration text
);
create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, course_id uuid not null references public.courses(id) on delete cascade, module_id uuid not null references public.course_modules(id) on delete cascade, video_id uuid not null references public.course_videos(id) on delete cascade, completed_at timestamptz not null default now(), unique(user_id, video_id)
);
create table if not exists public.course_checks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, course_id uuid not null references public.courses(id) on delete cascade, module_id uuid not null references public.course_modules(id) on delete cascade, video_id uuid not null references public.course_videos(id) on delete cascade, questions jsonb not null, answers jsonb not null, score integer not null check (score between 0 and 100), passed boolean not null, submitted_at timestamptz not null default now()
);
create table if not exists public.course_certificates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, course_id uuid not null references public.courses(id) on delete cascade, certificate_id text not null unique, student_name text not null, completed_at timestamptz not null default now(), unique(user_id, course_id)
);

create index if not exists courses_user_idx on public.courses(user_id, created_at desc);
create index if not exists course_modules_course_idx on public.course_modules(course_id, position);
create index if not exists course_videos_module_idx on public.course_videos(module_id, position);
create index if not exists course_progress_course_idx on public.course_progress(user_id, course_id);
create index if not exists course_checks_video_idx on public.course_checks(user_id, video_id, submitted_at desc);

alter table public.course_profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_videos enable row level security;
alter table public.course_progress enable row level security;
alter table public.course_checks enable row level security;
alter table public.course_certificates enable row level security;

do $$ begin
  drop policy if exists "course_owner_profile" on public.course_profiles;
  drop policy if exists "course_owner_courses" on public.courses;
  drop policy if exists "course_owner_modules" on public.course_modules;
  drop policy if exists "course_owner_videos" on public.course_videos;
  drop policy if exists "course_owner_progress" on public.course_progress;
  drop policy if exists "course_owner_checks" on public.course_checks;
  drop policy if exists "course_owner_certificates" on public.course_certificates;
end $$;
create policy "course_owner_profile" on public.course_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "course_owner_courses" on public.courses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "course_owner_modules" on public.course_modules for all using (exists(select 1 from public.courses c where c.id=course_id and c.user_id=auth.uid())) with check (exists(select 1 from public.courses c where c.id=course_id and c.user_id=auth.uid()));
create policy "course_owner_videos" on public.course_videos for all using (exists(select 1 from public.course_modules m join public.courses c on c.id=m.course_id where m.id=module_id and c.user_id=auth.uid())) with check (exists(select 1 from public.course_modules m join public.courses c on c.id=m.course_id where m.id=module_id and c.user_id=auth.uid()));
create policy "course_owner_progress" on public.course_progress for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "course_owner_checks" on public.course_checks for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "course_owner_certificates" on public.course_certificates for all using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select, insert, update, delete on all tables in schema public to authenticated;
