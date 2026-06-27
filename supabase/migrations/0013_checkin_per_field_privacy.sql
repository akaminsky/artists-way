-- 0013_checkin_per_field_privacy.sql
-- Per-field privacy for the weekly check-in, plus two new fields.
--
-- The privacy rule (CLAUDE.md): completion/shared content lives in cohort-readable
-- tables; private content must physically live OUTSIDE them — never a flag the app
-- is trusted to respect. So:
--   • weekly_checkins stays the SHARED table (cohort-readable). It only ever holds
--     the fields you chose to share — the circle literally cannot read the rest.
--   • weekly_checkin_details (NEW, owner-only) is the full check-in + a per-field
--     share flag. It's the source of truth for the composer and the You journal.
--
-- Two new fields: a mood note ("say more about how you're feeling") and
-- "anything significant for your recovery". Default sharing: only the mood is
-- shared by default; everything else starts private.

-- 1. New SHARED columns, so a field you DO choose to share can reach the circle.
alter table public.weekly_checkins
  add column if not exists mood_note text,
  add column if not exists significant_issues text;

-- 2. Private source-of-truth table (owner-only).
create table if not exists public.weekly_checkin_details (
  user_id                  uuid not null references auth.users(id) on delete cascade,
  week                     int  not null check (week between 1 and 12),
  mood                     text,
  mood_note                text,
  looking_forward          text,
  significant_issues       text,
  share_text               text,
  share_mood               boolean not null default true,
  share_mood_note          boolean not null default false,
  share_looking_forward    boolean not null default false,
  share_significant_issues boolean not null default false,
  share_share_text         boolean not null default false,
  updated_at               timestamptz not null default now(),
  primary key (user_id, week)
);

alter table public.weekly_checkin_details enable row level security;
create policy "wcd_select_own" on public.weekly_checkin_details
  for select using (auth.uid() = user_id);
create policy "wcd_insert_own" on public.weekly_checkin_details
  for insert with check (auth.uid() = user_id);
create policy "wcd_update_own" on public.weekly_checkin_details
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wcd_delete_own" on public.weekly_checkin_details
  for delete using (auth.uid() = user_id);

-- 3. Backfill: existing check-ins were fully shared, so seed each private record
--    from its shared row and mark every populated field as shared (preserving
--    exactly what the circle already sees). New fields start null/private.
insert into public.weekly_checkin_details
  (user_id, week, mood, looking_forward, share_text,
   share_mood, share_looking_forward, share_share_text)
select user_id, week, mood, looking_forward, share_text,
   (mood is not null), (looking_forward is not null), (share_text is not null)
from public.weekly_checkins
on conflict (user_id, week) do nothing;
