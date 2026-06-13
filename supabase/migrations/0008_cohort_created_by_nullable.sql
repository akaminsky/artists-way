-- tend/meraki — fix cohorts.created_by constraint
-- ===========================================================================
-- created_by was NOT NULL but its FK is `on delete set null` — contradictory,
-- so deleting the account that created a cohort errored. Make it nullable: the
-- creator leaving just nulls created_by and the circle persists for the rest.
-- ===========================================================================
alter table public.cohorts alter column created_by drop not null;
