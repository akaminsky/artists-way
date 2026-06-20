-- 0012_acknowledged_week.sql — "ready to move to the next week?" prompt.
-- Weeks are DERIVED from started_on (self-paced, no stored counter). To ask each
-- person — the first time they open the app on a new week — whether they want to
-- move on or linger, we record the highest week they've explicitly acknowledged.
-- When the derived week climbs above this, the app shows the prompt once.
--
-- Nullable + no backfill on purpose: NULL means "not yet initialized", and the
-- app silently sets it to the member's current derived week on first open, so
-- nobody gets a spurious prompt the moment this ships. Continuing writes the new
-- week here; "stay" re-anchors started_on (same mechanic as set-week / resume)
-- and leaves this at the week they're holding, so it asks again next week.

alter table public.memberships
  add column if not exists acknowledged_week int
    check (acknowledged_week between 1 and 12);
