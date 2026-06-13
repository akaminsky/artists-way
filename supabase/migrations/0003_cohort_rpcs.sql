-- tend — cohort create / join RPCs
-- ===========================================================================
-- Why RPCs (not plain inserts from the client):
--   The `cohorts` RLS only lets MEMBERS read a cohort. A friend opening an
--   invite link is not a member yet, so they can't look up the cohort by its
--   invite_code to join it. These SECURITY DEFINER functions do the privileged
--   lookup + membership insert safely (running as the table owner, bypassing
--   RLS internally) while still keying everything off the caller's auth.uid().
-- ===========================================================================

-- Friendly 6-char invite code, no ambiguous characters (no 0/O/1/I/L).
-- Internal helper only — never exposed as an RPC (revoked from everyone; the
-- SECURITY DEFINER callers run as owner and can still use it).
create or replace function public.gen_invite_code()
returns text
language sql
volatile
set search_path = public
as $$
  select string_agg(
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789',
           (floor(random() * 31)::int) + 1, 1), '')
  from generate_series(1, 6);
$$;

-- Create a circle and join it in one atomic step. Generates a unique invite
-- code (retrying on the unlikely collision). Returns the new cohort row.
create or replace function public.create_cohort(p_name text)
returns public.cohorts
language plpgsql
security definer
set search_path = public
as $$
declare
  c     public.cohorts;
  code  text;
  tries int := 0;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  loop
    code := public.gen_invite_code();
    begin
      insert into public.cohorts (name, invite_code, created_by)
      values (coalesce(nullif(btrim(p_name), ''), 'Our Circle'), code, auth.uid())
      returning * into c;
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 5 then raise; end if;
    end;
  end loop;

  insert into public.memberships (cohort_id, user_id)
  values (c.id, auth.uid());

  return c;
end;
$$;

-- Join an existing circle by its invite code. Idempotent: re-joining is a
-- no-op that still returns the cohort. Returns the cohort row.
create or replace function public.join_cohort(p_code text)
returns public.cohorts
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.cohorts;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into c
  from public.cohorts
  where invite_code = upper(btrim(p_code));

  if not found then
    raise exception 'invalid_code';
  end if;

  insert into public.memberships (cohort_id, user_id)
  values (c.id, auth.uid())
  on conflict (cohort_id, user_id) do nothing;

  return c;
end;
$$;

-- Grants: keep these off the anonymous + public surface; signed-in users call
-- create/join via RPC. gen_invite_code is internal-only.
revoke execute on function public.gen_invite_code()   from anon, authenticated, public;
revoke execute on function public.create_cohort(text) from anon, public;
revoke execute on function public.join_cohort(text)   from anon, public;
grant  execute on function public.create_cohort(text) to authenticated;
grant  execute on function public.join_cohort(text)   to authenticated;
