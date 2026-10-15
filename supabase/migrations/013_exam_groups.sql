-- Exam Prep study groups. Safe to re-run; all access is through the authenticated Supabase session.
create table if not exists public.exam_groups (
  id uuid primary key default gen_random_uuid(),
  exam_key text not null,
  exam_name text not null,
  title text not null,
  description text not null default '',
  province text,
  city text,
  created_by uuid not null references auth.users(id) on delete cascade,
  max_members integer not null default 50 check (max_members between 2 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  member_count integer not null default 0 check (member_count >= 0)
);
create table if not exists public.exam_group_members (
  group_id uuid not null references public.exam_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create table if not exists public.exam_group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.exam_groups(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  resource_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.exam_groups add column if not exists member_count integer not null default 0;
create or replace function public.exam_group_member_count() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.exam_groups set member_count = member_count + 1 where id = new.group_id;
  elsif tg_op = 'DELETE' then update public.exam_groups set member_count = greatest(0, member_count - 1) where id = old.group_id;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $$;
drop trigger if exists exam_group_member_count_trigger on public.exam_group_members;
create trigger exam_group_member_count_trigger after insert or delete on public.exam_group_members for each row execute function public.exam_group_member_count();
update public.exam_groups g set member_count = (select count(*) from public.exam_group_members m where m.group_id = g.id);
create index if not exists exam_groups_exam_key_created_at on public.exam_groups(exam_key, created_at desc);
create index if not exists exam_groups_search on public.exam_groups using gin (to_tsvector('simple', title || ' ' || description || ' ' || exam_name));
create index if not exists exam_group_members_user_id on public.exam_group_members(user_id);
create index if not exists exam_group_posts_group_created_at on public.exam_group_posts(group_id, created_at desc);

alter table public.exam_groups enable row level security;
alter table public.exam_group_members enable row level security;
alter table public.exam_group_posts enable row level security;
drop policy if exists "authenticated read exam groups" on public.exam_groups;
create policy "authenticated read exam groups" on public.exam_groups for select to authenticated using (true);
drop policy if exists "owners create exam groups" on public.exam_groups;
create policy "owners create exam groups" on public.exam_groups for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "owners update exam groups" on public.exam_groups;
create policy "owners update exam groups" on public.exam_groups for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
drop policy if exists "owners delete exam groups" on public.exam_groups;
create policy "owners delete exam groups" on public.exam_groups for delete to authenticated using (auth.uid() = created_by);
drop policy if exists "members read memberships" on public.exam_group_members;
create policy "members read memberships" on public.exam_group_members for select to authenticated using (auth.uid() = user_id or exists (select 1 from public.exam_groups g where g.id = group_id and g.created_by = auth.uid()));
drop policy if exists "users join groups" on public.exam_group_members;
create policy "users join groups" on public.exam_group_members for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.exam_groups g where g.id = group_id));
drop policy if exists "users leave groups" on public.exam_group_members;
create policy "users leave groups" on public.exam_group_members for delete to authenticated using (auth.uid() = user_id or exists (select 1 from public.exam_groups g where g.id = group_id and g.created_by = auth.uid()));
drop policy if exists "members read posts" on public.exam_group_posts;
create policy "members read posts" on public.exam_group_posts for select to authenticated using (exists (select 1 from public.exam_group_members m where m.group_id = exam_group_posts.group_id and m.user_id = auth.uid()));
drop policy if exists "members create posts" on public.exam_group_posts;
create policy "members create posts" on public.exam_group_posts for insert to authenticated with check (auth.uid() = author_id and exists (select 1 from public.exam_group_members m where m.group_id = exam_group_posts.group_id and m.user_id = auth.uid()));
drop policy if exists "authors update posts" on public.exam_group_posts;
create policy "authors update posts" on public.exam_group_posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "authors delete posts" on public.exam_group_posts;
create policy "authors delete posts" on public.exam_group_posts for delete to authenticated using (auth.uid() = author_id);
grant select, insert, update, delete on public.exam_groups, public.exam_group_members, public.exam_group_posts to authenticated;
