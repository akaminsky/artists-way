-- 0010_notes.sql — private per-week notes ("notes to self").
-- A running journal: jot anything for yourself throughout the week on the Week
-- tab; read them back by week on You. Fully private (owner-only) — never shared
-- with the circle, so there's no cohort_id and no shared-read policy.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week int not null check (week between 1 and 12),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);

create index if not exists notes_user_week_idx on public.notes (user_id, week);
