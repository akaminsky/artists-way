-- 0011_week_photos.sql — weekly photo "Memories".
-- Private-by-default photos attached to a program week. The image files live in
-- the `week-photos` Storage bucket; this table only holds metadata pointing at
-- them. Mirrors the app's model: owner-private unless `shared`, and a shared
-- photo is readable by cohort-mates (so it can appear in the Circle).
-- Additive only — safe to run against the populated production DB.

create table if not exists public.week_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  week int not null check (week between 1 and 12),
  storage_path text not null,
  shared boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.week_photos enable row level security;

-- read: always your own; cohort-mates only when you've shared it
create policy week_photos_select on public.week_photos
  for select using (user_id = auth.uid() or (shared and is_member(cohort_id)));
-- write: owner only (and must be a member of the cohort it's filed under)
create policy week_photos_insert on public.week_photos
  for insert with check (user_id = auth.uid() and is_member(cohort_id));
create policy week_photos_update on public.week_photos
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy week_photos_delete on public.week_photos
  for delete using (user_id = auth.uid());

create index if not exists week_photos_user_week_idx on public.week_photos (user_id, week);
create index if not exists week_photos_cohort_shared_idx on public.week_photos (cohort_id, shared);

-- realtime so a freshly shared photo shows up live in the Circle
alter publication supabase_realtime add table public.week_photos;

-- ── Storage: private bucket + object policies ────────────────────────────────
insert into storage.buckets (id, name, public)
values ('week-photos', 'week-photos', false)
on conflict (id) do nothing;

-- upload only into your own top-level folder ({uid}/{week}/{id}.jpg)
create policy week_photos_obj_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'week-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- read your own objects, or any object whose metadata row is shared in your cohort
create policy week_photos_obj_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'week-photos' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.week_photos wp
        where wp.storage_path = name and wp.shared and public.is_member(wp.cohort_id)
      )
    )
  );

-- delete only your own objects
create policy week_photos_obj_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'week-photos' and (storage.foldername(name))[1] = auth.uid()::text);
