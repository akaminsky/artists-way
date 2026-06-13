-- tend — initial schema
-- ===========================================================================
-- Core principle: COMPLETION IS SHARED, CONTENT IS PRIVATE.
-- This is enforced physically: shared "progress" tables (cohort members can
-- read) are kept separate from private "content" tables (owner-only via RLS),
-- so a leak would require a schema change, not just a forgotten WHERE clause.
--
-- Apply this in the Supabase dashboard: SQL Editor -> paste -> Run.
-- Safe to run on a fresh project. Re-running is not supported (no IF NOT EXISTS
-- on policies); reset the schema first if you need to re-apply.
-- ===========================================================================

-- --------------------------------------------------------------------------
-- Identity / group
-- --------------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  mono         text,                       -- single-letter avatar fallback
  avatar       text,                       -- optional emoji or image url
  timezone     text default 'Europe/Amsterdam',
  created_at   timestamptz not null default now()
);

create table public.cohorts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique,        -- short code embedded in the join link
  created_by  uuid not null references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.memberships (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references cohorts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  -- Week is DERIVED from this date (self-paced): the day they began Week 1.
  -- current_week = clamp(1, 12, floor((today - started_on) / 7) + 1).
  started_on date not null default current_date,
  role       text not null default 'member',
  joined_at  timestamptz not null default now(),
  unique (cohort_id, user_id)
);
create index memberships_cohort_idx on memberships(cohort_id);
create index memberships_user_idx   on memberships(user_id);

-- --------------------------------------------------------------------------
-- Daily / weekly tracking
--   *_shared  tables: visible to the whole cohort (completion counts only)
--   *_private tables: owner-only (the actual writing)
-- --------------------------------------------------------------------------

-- Morning Pages: just the tap. One row per day done. (shared)
create table public.morning_pages (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  cohort_id    uuid not null references cohorts(id) on delete cascade,
  date         date not null,
  completed_at timestamptz not null default now(),
  unique (user_id, date)
);
create index morning_pages_cohort_idx on morning_pages(cohort_id);

-- Artist Date done for the week. (shared)
create table public.artist_dates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  cohort_id    uuid not null references cohorts(id) on delete cascade,
  week         int not null,
  completed_at timestamptz not null default now(),
  unique (user_id, week)
);
create index artist_dates_cohort_idx on artist_dates(cohort_id);

-- What the Artist Date actually was. (private, owner-only)
create table public.artist_date_details (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  week       int not null,
  what_i_did text,
  note       text,
  updated_at timestamptz not null default now(),
  unique (user_id, week)
);

-- Exercise catalog: each cohort types its own week's prompts (no book text).
-- All 12 weeks live here once seeded.
create table public.exercises (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references cohorts(id) on delete cascade,
  week       int not null,
  label      text not null,
  prompt     text,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);
create index exercises_cohort_week_idx on exercises(cohort_id, week);

-- Did the exercise (in the app, or off-app on paper). (shared)
create table public.exercise_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  cohort_id   uuid not null references cohorts(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  completed   boolean not null default true,
  source      text not null default 'in_app',  -- 'in_app' | 'off_app'
  updated_at  timestamptz not null default now(),
  unique (user_id, exercise_id)
);
create index exercise_progress_cohort_idx on exercise_progress(cohort_id);

-- The written answer to an exercise. (private, owner-only)
create table public.exercise_answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  answer      text,
  updated_at  timestamptz not null default now(),
  unique (user_id, exercise_id)
);

-- Weekly check-in, filled before the call. Shared with the circle by design
-- (mood + looking-forward + an optional something-to-share). (shared)
create table public.weekly_checkins (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  cohort_id        uuid not null references cohorts(id) on delete cascade,
  week             int not null,
  mood             text,
  looking_forward  text,
  share_text       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, week)
);
create index weekly_checkins_cohort_idx on weekly_checkins(cohort_id);

-- --------------------------------------------------------------------------
-- Artist Date idea library (the shared "well")
-- --------------------------------------------------------------------------

create table public.artist_date_ideas (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references cohorts(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  category   text,                         -- Nature | Culture | Making | Music | Food | Quiet
  cost       text,                         -- Free | Low | $$
  setting    text,                         -- Indoor | Outdoor
  social     text,                         -- Solo | Group
  shared     boolean not null default true,-- false = private "Mine" idea
  created_at timestamptz not null default now()
);
create index artist_date_ideas_cohort_idx on artist_date_ideas(cohort_id);

-- Per-user state for an idea: bookmarked and/or done. (private to the user)
create table public.idea_state (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  idea_id    uuid not null references artist_date_ideas(id) on delete cascade,
  saved      boolean not null default false,
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, idea_id)
);

-- ===========================================================================
-- Helper functions (SECURITY DEFINER so they bypass RLS internally and avoid
-- the infinite-recursion trap of a memberships policy that reads memberships).
-- Defined here, after the tables exist, because `language sql` bodies are
-- parsed and validated at creation time.
-- ===========================================================================

-- Is the current user a member of this cohort?
create or replace function public.is_member(p_cohort uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    where m.cohort_id = p_cohort
      and m.user_id = auth.uid()
  );
$$;

-- Does the current user share any cohort with p_other? (lets circle members
-- read each other's profile name/avatar, and nothing else.)
create or replace function public.shares_cohort(p_other uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from memberships a
    join memberships b on a.cohort_id = b.cohort_id
    where a.user_id = auth.uid()
      and b.user_id = p_other
  );
$$;

-- ===========================================================================
-- Row-Level Security
-- ===========================================================================

alter table public.profiles            enable row level security;
alter table public.cohorts             enable row level security;
alter table public.memberships         enable row level security;
alter table public.morning_pages       enable row level security;
alter table public.artist_dates        enable row level security;
alter table public.artist_date_details enable row level security;
alter table public.exercises           enable row level security;
alter table public.exercise_progress   enable row level security;
alter table public.exercise_answers    enable row level security;
alter table public.weekly_checkins     enable row level security;
alter table public.artist_date_ideas   enable row level security;
alter table public.idea_state          enable row level security;

-- ---- profiles ----  own + same-cohort can read; only you can write yours
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or shares_cohort(id));
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---- cohorts ----  members read; anyone signed in can create one
create policy cohorts_select on public.cohorts
  for select using (is_member(id) or created_by = auth.uid());
create policy cohorts_insert on public.cohorts
  for insert with check (created_by = auth.uid());
create policy cohorts_update on public.cohorts
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

-- ---- memberships ----  see members of your cohorts; only manage your own row
create policy memberships_select on public.memberships
  for select using (user_id = auth.uid() or is_member(cohort_id));
create policy memberships_insert on public.memberships
  for insert with check (user_id = auth.uid());
create policy memberships_update on public.memberships
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy memberships_delete on public.memberships
  for delete using (user_id = auth.uid());

-- ---- shared tracking: read if it's yours OR you share the cohort; write only yours ----

create policy morning_pages_select on public.morning_pages
  for select using (user_id = auth.uid() or is_member(cohort_id));
create policy morning_pages_write on public.morning_pages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and is_member(cohort_id));

create policy artist_dates_select on public.artist_dates
  for select using (user_id = auth.uid() or is_member(cohort_id));
create policy artist_dates_write on public.artist_dates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and is_member(cohort_id));

create policy exercise_progress_select on public.exercise_progress
  for select using (user_id = auth.uid() or is_member(cohort_id));
create policy exercise_progress_write on public.exercise_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and is_member(cohort_id));

create policy weekly_checkins_select on public.weekly_checkins
  for select using (user_id = auth.uid() or is_member(cohort_id));
create policy weekly_checkins_write on public.weekly_checkins
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and is_member(cohort_id));

-- ---- private content: owner-only, full stop ----

create policy artist_date_details_all on public.artist_date_details
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy exercise_answers_all on public.exercise_answers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy idea_state_all on public.idea_state
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- exercises catalog: any cohort member can read and author ----
create policy exercises_select on public.exercises
  for select using (is_member(cohort_id));
create policy exercises_write on public.exercises
  for all using (is_member(cohort_id)) with check (is_member(cohort_id));

-- ---- idea library: members read shared ideas (and their own private ones) ----
create policy artist_date_ideas_select on public.artist_date_ideas
  for select using (is_member(cohort_id) and (shared or created_by = auth.uid()));
create policy artist_date_ideas_insert on public.artist_date_ideas
  for insert with check (created_by = auth.uid() and is_member(cohort_id));
create policy artist_date_ideas_update on public.artist_date_ideas
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy artist_date_ideas_delete on public.artist_date_ideas
  for delete using (created_by = auth.uid());

-- ===========================================================================
-- Auto-create a profile row when a user signs up.
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, mono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'display_name', new.email), 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Lock down the SECURITY DEFINER helpers so they aren't loosely exposed as RPC
-- endpoints (PostgREST exposes public functions at /rest/v1/rpc/<name>).
--   - handle_new_user is a trigger; it fires regardless of EXECUTE grants, so
--     revoke from everyone — it should never be callable directly.
--   - is_member / shares_cohort are called inside RLS policies in the querying
--     user's own context, so `authenticated` MUST keep EXECUTE or the policies
--     break. Only drop anon/public (where auth.uid() is null anyway).
-- ===========================================================================

revoke execute on function public.handle_new_user()  from anon, authenticated, public;
revoke execute on function public.is_member(uuid)     from anon, public;
revoke execute on function public.shares_cohort(uuid) from anon, public;
