-- tend — enable realtime on the shared idea pool
-- ===========================================================================
-- So a friend's newly shared Artist Date idea shows up in everyone's library
-- live. RLS still applies on the stream (members only receive shared ideas, or
-- their own). idea_state stays private + unpublished — it's per-user and only
-- its owner mutates it, so a local optimistic update is enough. Idempotent.
-- ===========================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'artist_date_ideas'
  ) then
    alter publication supabase_realtime add table public.artist_date_ideas;
  end if;
end $$;
