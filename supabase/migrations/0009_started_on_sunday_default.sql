-- meraki — Sunday-anchored weeks
-- ===========================================================================
-- Weeks run Sunday→Saturday for everyone. Anchor new memberships' started_on to
-- the Sunday on/before the join date, so each person's program week lines up
-- with the Sun–Sat calendar week (Today/Circle "this week" == the You-page week
-- bucket). create_cohort / join_cohort insert without specifying started_on, so
-- they pick up this default. extract(dow): Sunday = 0.
-- "Set my week" + resume re-anchor to a Sunday in the app (startedOnForWeek).
-- ===========================================================================
alter table public.memberships
  alter column started_on set default (current_date - extract(dow from current_date)::int);
