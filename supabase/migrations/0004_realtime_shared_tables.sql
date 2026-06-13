-- tend — enable realtime on the shared progress tables
-- ===========================================================================
-- The Circle screen subscribes to these so members' cards update live. RLS is
-- still enforced on realtime, so each member only receives changes to rows they
-- can already read (their cohort's shared progress). Private tables
-- (artist_date_details, exercise_answers, idea_state) are deliberately NOT
-- published — nobody should stream another person's private writing.
-- Idempotent: only adds tables not already in the publication.
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array['morning_pages','artist_dates','exercise_progress','weekly_checkins','memberships'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
