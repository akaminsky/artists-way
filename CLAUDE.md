# tend — project context

A calm, private mobile web app (PWA) for a 5-friend Artist's Way circle. It is a
support tool around weekly check-in calls and monthly in-person meetups, not a
social network. The five friends have all tried The Artist's Way solo and fallen
off after 1 to 3 weeks; the app exists to give them just enough visibility and
accountability to finish the 12 weeks together.

This is a personal passion project, not a business. Scope decisions should favor
"works well for 5 friends" over scale, growth, or generality.

## ⟶ RESUME HERE (next session)

Where we left off (session 3, June 13 2026): the **whole app now runs on
Supabase** (all six build-order steps + the Journey migration + a Profile screen),
THEN a **navigation/IA redesign** (5 tabs → 3: Today · Circle · You) and a
**You-page by-week redesign**. See the "Navigation (session 3 redesign)" section.

Live backend facts:
- Supabase project **project_ref `izdjwmulgneyoxrpddlj`**; MCP authenticated.
- Schema fully applied. Migrations: `0001` (initial — applied via dashboard,
  NOT in the ledger), `0002` (SECURITY DEFINER grant hardening), `0003` (cohort
  RPCs), `0004` (realtime: shared tables), `0005` (realtime: ideas), `0006`
  (`memberships.paused_at` for pause). The `0001` ledger gap is cosmetic.
- Exercise catalog seeded via `supabase/seed_exercises.sql` (re-runnable; targets
  the cohort by invite code). Source images live in `exercises/` which is
  **gitignored** (third-party material — not committed/published).
- `.env.local` is filled (URL + legacy anon key) so the app runs in backend
  mode. Auth URL config done in the dashboard: Site URL + redirect
  `http://localhost:5173/**`. Add the prod domain there too when we deploy.

**Where things stand — feature-complete + redesigned for kickoff.** Remaining/optional:
1. Push notifications (step 7) — fiddly, optional, don't let it block anything.
2. Editing PAST check-ins from You (editor only targets the current week now);
   avatar/timezone in Profile; cross-week morning-pages backfill.
3. Deploy + hosting decision (see Open questions) and buy/point a domain.
Before kickoff: have each friend set their real name + week in Profile.

Note: `.env.local` is for the *running app*; the MCP is for *us* to manage the
DB. Both point at the same project.

## Current state

The **front-end prototype is complete and runs**. All five screens are built,
ported faithfully from a Claude Design mockup (warm Resurface design system:
Fraunces serif + JetBrains Mono on parchment, plum accent `#8A5E7E`).

**Backend foundation is in (session 2).** Supabase chosen and scaffolded:
- Full schema + row-level security as a single paste-able migration:
  `supabase/migrations/0001_initial_schema.sql` (all tables, the shared/private
  split, recursion-safe `is_member` / `shares_cohort` SECURITY DEFINER helpers,
  and a signup trigger that auto-creates a `profiles` row).
- `src/lib/supabase.js` — client that **gracefully degrades**: with no
  `.env.local` it's `null`/`isConfigured=false` and the app runs in the old
  local-only mode, so nothing breaks until the project is wired.
- `src/lib/auth.jsx` — `AuthProvider` + `useAuth` (magic-link, session,
  profile fetch with retry). `src/screens/SignIn.jsx` — the magic-link screen.
- `App.jsx` gates on the session and shows an account/sign-out chip.
- `src/lib/week.js` — derives current week from a start date (see decision).
- Setup steps for the hosted project live in `supabase/README.md`.

**Step 2 shipped (session 3): cohort create / invite / join.**
- Migration `0003_cohort_rpcs.sql`: `create_cohort(name)` + `join_cohort(code)`
  SECURITY DEFINER RPCs (a non-member can't read `cohorts` under RLS, so the
  invite-code lookup has to happen in a definer fn), plus a server-side invite
  code generator. Grants locked to `authenticated`.
- `src/lib/cohort.jsx` — `CohortProvider`/`useCohort` (loads membership+cohort,
  exposes create/join/refresh). `src/lib/invite.js` — captures `?join=CODE` into
  localStorage so it survives the magic-link round-trip; builds invite URLs.
- `src/screens/Onboarding.jsx` — create-or-join, shown when signed in but
  membershipless; pre-fills the code from an invite link; post-create share
  screen. `App.jsx` gate: session → circle → app; account menu shows circle name
  + copy-invite.

**Step 3 done (session 3): private tracking writes.**
- `src/lib/tracking.jsx` — `useTracking()` reads/writes Morning Pages
  (`morning_pages`, per Mon–Sun calendar week), the Artist Date (`artist_dates`
  done + `artist_date_details.what_i_did` plan), AND the week's exercises
  (`exercise_progress` done + `exercise_answers` private answer), all for the
  user's derived week, optimistic with reconcile-on-error. `Today.jsx` uses
  `track` for all three cards (falls back to local `me` in prototype mode).
- `src/lib/week.js` gained `isoDate` / `weekdayIndexMon` / `currentWeekDates`.
- Exercise catalog seeded from the circle's actual 12-week task lists:
  `supabase/seed_exercises.sql` (103 rows, week-specific tasks only; recurring
  tools excluded). Re-runnable, targets the cohort by invite code; re-running
  resets that cohort's exercise progress (FK cascade), so be deliberate.

**Step 4 shipped (session 3): Circle reads real members, live.**
- `src/lib/circle.jsx` — `useCircle()` loads every membership joined to its
  profile + this week's shared progress (pages this calendar week, artist date
  done for their week, exercises done/total for their week, latest checkin
  mood), each on their own derived week. Realtime subscription on the cohort's
  shared tables reloads on any change. Only shared tables are read.
- `Group.jsx` uses it (same card UI); falls back to the local seed in prototype
  mode. Migration `0004_realtime_shared_tables.sql` adds the shared tables to
  the `supabase_realtime` publication (RLS still enforced on the stream).

**Step 5 shipped (session 3): weekly check-in persists.**
- `src/lib/tracking.jsx` loads + `saveCheckin`s `weekly_checkins` (mood,
  looking_forward, share_text) for the user's derived week. `Checkin.jsx` keeps a
  local draft seeded once from the saved row and only writes on "Share with the
  circle" — sharing = the row exists/updates and becomes visible to the circle;
  editing after sharing flips back to unshared. Realtime then updates Circle
  moods live.

**Step 6 shipped (session 3): Ideas library on the backend.**
- `src/lib/ideas.jsx` — `useIdeas()` reads the cohort pool (`artist_date_ideas`,
  RLS = shared ideas + your own) joined with private `idea_state` (saved/done);
  toggleSave/toggleDone upsert idea_state; addIdea inserts the idea + auto-saves
  it. Realtime on `artist_date_ideas` (migration `0005`) so a friend's shared
  idea appears live. `Ideas.jsx` uses a unified idea shape (same for backend +
  local seed), so the UI is unchanged.

**Journey ("You") migrated (session 3).** `src/lib/journey.jsx` — `useJourney()`
reads the user's full history across all weeks: mood arc (`weekly_checkins`),
past Artist Dates (`artist_dates` + private `artist_date_details`), and exercise
answers (`exercise_answers` joined to the catalog for week+label). `Journey.jsx`
uses it (falls back to local seed), editing an answer writes through + keeps it
done. This closed the gap where Today's writes didn't show on the You tab.

**Profile / settings shipped (session 3).** `src/screens/Profile.jsx` (full
screen from the account chip, gated in `App.jsx` via `showProfile`): edit display
name (`auth.updateProfile` → profiles.display_name + mono), **set your week**
(stepper rewrites started_on), **pause/resume** (`memberships.paused_at`, migration
`0006`; resume shifts started_on by the paused span — see `memberWeek`/`addDays`),
copy invite link, and **leave the circle** (`cohort.leaveCohort` deletes the
membership → App falls back to Onboarding). `useTracking`/`useCircle`/`useJourney`
all derive week via `memberWeek(started_on, paused_at)`; Circle exposes `paused`.

**Fully on the backend now.** Every screen (Today, You, Circle, Ideas, Check-in,
Profile) reads/writes Supabase with per-person weeks, the shared/private split,
and realtime. Local `me` (key `tend.me.v2`) only backs prototype mode (no
`.env.local`). What's left is optional: push (step 7), avatar/timezone, deploy.

### Navigation (session 3 redesign)
Bottom bar is **3 tabs: Today · Circle · You** (was 5). The IA maps to the two
jobs — *stay on track* (Today + You) and *be pulled along by the circle* (Circle):
- **Check-in folded into Circle**: compose prompt at the top of `Group.jsx`
  (CTA when unshared, "your check-in is in · {mood} · Edit" when shared); the
  Checkin screen is now a pushed full-screen (`App.jsx` `showCheckin`, `Checkin`
  takes an optional `onClose` back bar), launched from Circle and from a gentle
  Today nudge (Fri–Sun, only if unshared).
- **Ideas folded into the Artist Date card**: a "browse ideas" affordance on
  Today calls `openIdeas`; Ideas renders as an **app-level pushed screen**
  (`App.jsx` `showIdeas`, `className="app-frame"` + back bar — like Profile /
  Checkin, so it stays inside the 480px frame). `Ideas` takes an optional
  `onPick(idea)`; `App.pickIdea` fills the week's Artist Date plan
  (`saveArtistPlan`). NOTE: pushed screens MUST render as `.app-frame`, not a
  `position:fixed` overlay, or they escape the centered phone column.
- **Today grouped by cadence**: "Today" (Morning Pages) vs "This week" (Artist
  Date, Exercises, check-in nudge). The Morning Pages week strip is interactive
  (`PagesStrip` interactive + `maxIndex`) — tap any past/today day to backfill;
  future days locked. `tracking.toggleDay(index)`.
- **You ↔ Circle**: expanding your own Circle card shows a "Your journey ›" link
  (`goToYou` → switches to the You tab).

**You page redesigned to by-week (session 3).** `Journey.jsx` is now an OVERVIEW
(12-week mood arc + morning-pages bars, both tappable week-selectors) + a single
SELECTED-WEEK panel (mood, morning-pages 7-day strip, artist date, check-in
text, exercise answers) with ‹ › steppers. Defaults to current week; one week at
a time instead of a long per-section scroll. `useJourney` now also returns
`checkins`, `pagesByWeek`, `pagesDays` (per-week 7-day arrays), `pagesTotal`.
Check-in text is read-only here (the Checkin editor only targets the current
week) — exercise answers stay editable. All screens still exist; two just aren't
bottom tabs. Plan file: `~/.claude/plans/sharded-wondering-crab.md`.

### The five screens
1. **Today** (`src/screens/Today.jsx`) — Morning Pages (pure one-tap checkbox, no
   note), Artist Date for the week, and the week's exercise checklist. Checkbox
   completes; tapping the card body opens a private detail sheet to write a note
   or answer anytime.
2. **You** (`src/screens/Journey.jsx`) — your journey: 12-week mood arc, past
   Artist Dates, and your exercise answers (re-readable / editable).
3. **Circle** (`src/screens/Group.jsx`) — all 5 at a glance: each person's own
   current week, pages X/7, Artist Date done, exercises done, mood. No likes, no
   comments. The top "Week N / 12" pill is hidden here (it is *your* week; on
   Circle each person shows their own week per card).
4. **Ideas** (`src/screens/Ideas.jsx`) — Artist Date library. Toggle **Mine**
   (your bookmarked + added ideas) vs **Shared** (the group's pool). Bookmark to
   save, checkbox to mark done, category filter, "Add an idea" composer with tag
   pickers (category / cost / indoor-outdoor / solo-group) and a "share with the
   circle" toggle.
5. **Check-in** (`src/screens/Checkin.jsx`) — filled in before the weekly call:
   mood picker (Energized, Curious, Flowing, Stuck, Overwhelmed), "what I'm
   looking forward to," and an optional "Something to share" (a win, insight, aha
   moment, reflection, anything).

### Run it
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static dist/
npm run preview
```
Stack: Vite 6 + React 18 (plain JSX, no TypeScript), `vite-plugin-pwa`. Styling is
inline styles + `src/styles/tokens.css` (design tokens) + `src/styles/app.css`
(full-screen shell, safe-area insets). Accent is set via the `--rs-accent` CSS var
in `app.css`. Icons in `public/` were generated from `public/favicon.svg`.

### Structure
```
src/
  App.jsx              app shell: app bar, bottom tabs, detail sheet, localStorage persistence
  data/seed.js         all mock data (friends, exercises, ideas, your "ME" state)
  lib/theme.js         color (C) + font constants, ACCENT vars
  styles/              tokens.css (Resurface tokens) + app.css (shell)
  components/          primitives.jsx (Icon, Checkbox, Avatar, PagesStrip, MoodChip…), DetailSheet.jsx
  screens/             Today, Journey, Group, Ideas, Checkin
```

## Decisions already made (do not relitigate)

- **Web PWA, not native iOS.** Faster to build/change, works for friends who may
  not all have iPhones. Installable to home screen via Safari (Add to Home Screen).
- **Stack: Vite + React + Supabase.** Supabase chosen for the backend (Postgres,
  auth, row-level security, realtime, edge functions). Free tier covers 5 users
  many times over.
- **Auth: magic-link email.** No passwords. One tap on an email link at kickoff,
  then the session persists basically forever (silent refresh). Installing the PWA
  also helps the session stick.
- **No discussion forum.** Cut from the original spec. 5 friends who talk weekly
  and meet monthly do not need an async forum; it would feel dead. The Weekly
  Circle + check-in cover connection.
- **No likes/comments** on progress or check-ins. A little lightweight
  acknowledgment on shared wins *only* is allowed if wanted later (deferred).
- **Privacy by design.** Morning Pages happen outside the app (just a checkbox).
  Exercise answers and detail notes are private. Only completion counts, moods,
  check-ins, and chosen shared wins are visible to the circle.
- **No AI features.** (An earlier mention of "AI" came from text pasted by mistake;
  it was never wanted.)
- **Accent locked to plum `#8A5E7E`.** Chosen in the design tool.
- **Each person can be on a different week.** The program is self-paced; friends
  drift apart. Week is per-user, not per-cohort.
- **Week is derived from a start date** (resolved session 2). Each membership
  stores `started_on`; `current_week = clamp(1,12, floor((ref−started_on)/7)+1)`
  via `src/lib/week.js`. UPDATE (session 3): the Profile screen now lets you
  **set your week** (rewrites `started_on`) and **pause/resume** (a `paused_at`
  date freezes the week; resume shifts `started_on` by the paused span). `ref` =
  `paused_at || today` (see `memberWeek`). This addressed the old "week keeps
  ticking even if you fall behind" worry — you can pause or dial it back.
- **Seed all 12 weeks of exercises up front** (resolved session 2). The
  `exercises` catalog is cohort-scoped and any member can author rows. UPDATE
  (session 3): the circle decided to use the actual Artist's Way weekly task
  lists (condensed task summaries they sourced), not self-written prompts. All
  12 weeks seeded once via `supabase/seed_exercises.sql` — week-specific tasks
  only; the recurring tools (morning pages, weekly artist date, daily readings,
  check-in) are excluded because the app already tracks those separately. It's a
  private circle of 5; treat the catalog text as their personal-use material.

## Backend plan (start here tomorrow)

Core principle for the schema: **completion is shared, content is private.** Enforce
it by physically splitting shared "progress" tables (cohort members can read) from
private "content" tables (owner-only via row-level security), rather than relying on
the app to never leak a column.

### Proposed tables
Identity / group:
- `profiles`: id (auth uid), display_name, avatar, timezone
- `cohorts`: id, name, invite_code, created_by
- `memberships`: cohort_id, user_id, current_week, started_at

Daily tracking:
- `morning_pages` (shared): user_id, date, completed_at  ← just the tap
- `artist_dates` (shared): user_id, week, completed_at
- `artist_date_details` (private): user_id, week, what_i_did, optional shared_win

Exercises:
- `exercises` (catalog): week, prompt, order
- `exercise_progress` (shared): user_id, exercise_id, completed, source (in_app | off_app)
- `exercise_answers` (private, owner-only): user_id, exercise_id, answer

Weekly check-in (shared): `weekly_checkins`: user_id, week, mood, looking_forward,
optional share_text, created_at

Idea library:
- `artist_date_ideas`: cohort_id, created_by, title, category, cost, setting
  (indoor|outdoor), social (solo|group), shared (bool)
- `idea_state` (per user): user_id, idea_id, saved, done

Reactions: deferred (lightweight "saw this" on shared wins only, if wanted).

### How the prototype's `ME` maps to tables
`me.pages[]` → `morning_pages` rows. `me.artistDate` → `artist_dates` +
`artist_date_details`. `me.exercises` / `me.exerciseNotes` → `exercise_progress` /
`exercise_answers`. `me.checkin` → `weekly_checkins`. `me.ideas` / `me.addedIdeas`
→ `idea_state` / `artist_date_ideas`. The friends array becomes real rows joined
through `memberships`.

### Suggested build order
1. ✅ DONE (session 2). Schema + RLS, magic-link auth, session/profile context,
   sign-in screen, auth gate in `App.jsx`. The local `me` layer still backs the
   tracking screens until step 3; `App.jsx`'s `loadMe` stays until then.
2. ✅ DONE (session 3). Cohort + invite link + memberships (create a circle,
   join via link). See "Step 2 shipped" above.
3. ✅ DONE (session 3). Private tracking writes against the shared/private
   tables, same UI: Morning Pages, Artist Date, and exercises all backed by
   `src/lib/tracking.jsx`. Exercise catalog seeded (`supabase/seed_exercises.sql`).
4. ✅ DONE (session 3). Circle dashboard reading real members (realtime
   subscription so rows update live), each with their own derived week.
   `src/lib/circle.jsx` + `Group.jsx`.
5. ✅ DONE (session 3). Weekly check-in persistence (`weekly_checkins`),
   `tracking.jsx` + `Checkin.jsx`. Share = becomes visible to the circle.
6. ✅ DONE (session 3). Idea library as a shared table (`artist_date_ideas`) +
   per-user `idea_state`. `src/lib/ideas.jsx` + `Ideas.jsx`, realtime on the pool.
7. Push notifications LAST and optional (iOS web push requires the installed PWA;
   it is fiddly. Do not let it block anything. Group chat covers reminders for now).

## Open questions
- **Profile extras (screen now exists):** `Profile.jsx` covers name + week +
  pause + leave. Still TODO if wanted: avatar/`mono` picker, timezone, and
  (with push) notification prefs.
- **In-app exercise editing (nice-to-have):** the catalog is seeded once via
  `supabase/seed_exercises.sql`; there's no in-app editor yet, so tweaks to the
  prompt text come back through Claude / a re-seed. Build a small "edit this
  week's prompts" screen if the friends want to adjust wording themselves.
- **Linking a done idea to Artist Date history:** checking off an idea in the
  library could auto-create an entry in You → Artist Dates. Cleaner to wire once
  the backend exists.
- **Hosting:** RESOLVED — GitHub Pages. `.github/workflows/deploy.yml` builds on
  push to `main` and publishes `dist/` to Pages (base is `./` in vite.config; no
  router → no SPA 404 issue). `appBaseUrl()` in `src/lib/invite.js` derives the
  served URL (origin + dir) so invite links + the magic-link `emailRedirectTo`
  respect the subpath AND the custom domain.
  **PROD URL = `https://alexakaminsky.com/artists-way/`** — the account has a
  Pages **custom domain `alexakaminsky.com`**, so `akaminsky.github.io/*` 301s to
  it; the app serves at `alexakaminsky.com/artists-way/`. Supabase Auth allow-list
  + Site URL must use the **custom-domain** URL (`https://alexakaminsky.com/artists-way/**`),
  not the github.io one (which redirects away).
  **One-time go-live steps:** (1) repo secrets `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY` (Settings → Secrets → Actions); (2) Settings → Pages →
  source = GitHub Actions; (3) repo public (or Pro); (4) Supabase Auth → URL
  Configuration: Site URL + redirect `https://alexakaminsky.com/artists-way/**`
  (+ keep `http://localhost:5173/**` for dev); (5) run the workflow. As of last
  session the project Pages 404s → deploy not yet published.
- **Reactions on shared wins:** add a tiny acknowledgment or keep fully quiet.

## People in the prototype (placeholders)
You = "Ren"; friends = Maya, Dev, Priya, Jonah. Swap for the real 5 names and the
real current week when wiring up data.
