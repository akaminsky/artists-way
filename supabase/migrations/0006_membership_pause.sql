-- tend — self-paced pause for memberships
-- ===========================================================================
-- When paused_at is set, the member's program week is FROZEN: week derivation
-- uses paused_at as the reference date instead of today. On resume the app
-- shifts started_on forward by the paused duration and clears paused_at, so the
-- week continues exactly where it left off (think: a vacation week).
-- "Set my week" just rewrites started_on, so there's no separate current_week
-- column to keep in sync.
-- ===========================================================================
alter table public.memberships add column if not exists paused_at date;
comment on column public.memberships.paused_at is
  'When set, program week is frozen at this date (self-paced pause). Cleared on resume with started_on shifted by the paused duration.';
