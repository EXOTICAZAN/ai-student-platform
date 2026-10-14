-- Pakistan Student Hub MVP: source-attributed reference catalogue and private tracking.
create table if not exists public.pakistan_admissions (
  id uuid primary key default gen_random_uuid(), institution text not null, city text, province text,
  degree text not null, field text, sector text check (sector in ('Public','Private')),
  deadline date, deadline_label text, eligibility text, tests text[] not null default '{}',
  official_url text not null, source_label text not null, last_verified_at timestamptz,
  is_reference boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.pakistan_admission_applications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  admission_id uuid references public.pakistan_admissions(id) on delete set null, reference_key text not null,
  institution_snapshot text not null,
  status text not null default 'planning' check (status in ('planning','applying','submitted','accepted','rejected','withdrawn')),
  notes text, updated_at timestamptz not null default now(), unique(user_id, reference_key)
);
create index if not exists pakistan_admissions_filters on public.pakistan_admissions(province, city, degree, sector);
alter table public.pakistan_admissions enable row level security;
alter table public.pakistan_admission_applications enable row level security;
drop policy if exists "authenticated read Pakistan admissions" on public.pakistan_admissions;
create policy "authenticated read Pakistan admissions" on public.pakistan_admissions for select to authenticated using (true);
drop policy if exists "owners read admission applications" on public.pakistan_admission_applications;
create policy "owners read admission applications" on public.pakistan_admission_applications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "owners insert admission applications" on public.pakistan_admission_applications;
create policy "owners insert admission applications" on public.pakistan_admission_applications for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "owners update admission applications" on public.pakistan_admission_applications;
create policy "owners update admission applications" on public.pakistan_admission_applications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "owners delete admission applications" on public.pakistan_admission_applications;
create policy "owners delete admission applications" on public.pakistan_admission_applications for delete to authenticated using (auth.uid() = user_id);
-- Intentionally no seed rows: reference data requires human curation and current verification before production use.
