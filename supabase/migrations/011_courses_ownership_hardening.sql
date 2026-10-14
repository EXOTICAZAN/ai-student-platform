-- 011_courses_ownership_hardening.sql: keep child course records tied to the owner's course.
-- The original policies scoped progress/checks/certificates by user_id, but did not
-- require their course_id (or module/video) to belong to that user.

drop policy if exists "course_owner_progress" on public.course_progress;
drop policy if exists "course_owner_checks" on public.course_checks;
drop policy if exists "course_owner_certificates" on public.course_certificates;

create policy "course_owner_progress" on public.course_progress
  for all using (
    user_id = auth.uid()
    and exists (
      select 1 from public.course_modules m
      join public.courses c on c.id = m.course_id
      join public.course_videos v on v.module_id = m.id
      where m.id = course_progress.module_id
        and v.id = course_progress.video_id
        and c.id = course_progress.course_id
        and c.user_id = auth.uid()
    )
  ) with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.course_modules m
      join public.courses c on c.id = m.course_id
      join public.course_videos v on v.module_id = m.id
      where m.id = course_progress.module_id
        and v.id = course_progress.video_id
        and c.id = course_progress.course_id
        and c.user_id = auth.uid()
    )
  );

create policy "course_owner_checks" on public.course_checks
  for all using (
    user_id = auth.uid()
    and exists (
      select 1 from public.course_modules m
      join public.courses c on c.id = m.course_id
      join public.course_videos v on v.module_id = m.id
      where m.id = course_checks.module_id
        and v.id = course_checks.video_id
        and c.id = course_checks.course_id
        and c.user_id = auth.uid()
    )
  ) with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.course_modules m
      join public.courses c on c.id = m.course_id
      join public.course_videos v on v.module_id = m.id
      where m.id = course_checks.module_id
        and v.id = course_checks.video_id
        and c.id = course_checks.course_id
        and c.user_id = auth.uid()
    )
  );

create policy "course_owner_certificates" on public.course_certificates
  for all using (
    user_id = auth.uid()
    and exists (select 1 from public.courses c where c.id = course_certificates.course_id and c.user_id = auth.uid())
  ) with check (
    user_id = auth.uid()
    and exists (select 1 from public.courses c where c.id = course_certificates.course_id and c.user_id = auth.uid())
  );
