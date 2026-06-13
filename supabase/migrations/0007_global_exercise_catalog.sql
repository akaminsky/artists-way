-- tend/meraki — make the exercise catalog GLOBAL
-- ===========================================================================
-- One shared 12-week catalog for every cohort, instead of cohort-scoped rows
-- re-seeded per circle (every Artist's Way circle does the same 12 weeks).
-- Personal progress + answers stay per-user; exercise_progress KEEPS cohort_id
-- for the Circle's shared-read RLS — only the catalog (the prompts) goes global.
-- ===========================================================================

-- old policies reference exercises.cohort_id; drop them before the column
drop policy if exists exercises_select on public.exercises;
drop policy if exists exercises_write  on public.exercises;

-- drop the cohort scoping (also drops exercises_cohort_week_idx + the FK)
alter table public.exercises drop column cohort_id;

-- idempotent seed key (also serves week-ordered reads)
alter table public.exercises add constraint exercises_week_sort_key unique (week, sort);

-- any signed-in user can read the shared catalog; writes are seed/admin only
-- (no write policy → only the service role can author rows)
create policy exercises_select on public.exercises
  for select to authenticated using (true);
