# tend — project context

A calm, private mobile web app (PWA) for a 5-friend Artist's Way circle. It is a
support tool around weekly check-in calls and monthly in-person meetups, not a
social network. The five friends have all tried The Artist's Way solo and fallen
off after 1 to 3 weeks; the app exists to give them just enough visibility and
accountability to finish the 12 weeks together.

This is a personal passion project, not a business. Scope decisions should favor
"works well for 5 friends" over scale, growth, or generality.

## ⟶ RESUME HERE (next session)

> ## ⚠️ LIVE WITH REAL USERS — DO NOT WIPE THE DB, DO NOT PUSH UNASKED
> As of ~June 15 2026 meraki **kicked off and has real users** (the 5-friend
> circle, actively using it; early feedback positive). The DB now holds real
> accounts, cohorts, morning-pages history, notes, check-ins, and answers.
>
> **Two hard rules now that it's live:**
> 1. **Never commit or push without Alexa explicitly asking, each time.** A push
>    to `main` is a production deploy to real users. Make + verify edits, leave
>    them uncommitted, and wait for her go-ahead. (Earlier in dev I pushed after
>    each change — no longer the default.)
> 2. **Never** run destructive SQL (truncate / delete-all / drop-with-data /
>    `delete from auth.users` / cascading re-seed) like we did in test sessions —
>    if a task seems to need it, STOP and confirm first. Treat every schema
>    change as a **data migration**: additive and backward-safe by default (add
>    nullable columns / new tables; backfill explicitly; avoid renames/drops that
>    lose data). New migrations → `supabase/migrations/` (next is `0011`), safe to
>    run against a populated prod DB.

**Session 4 (June 14 2026) — the big pre-kickoff blocker is CLEARED.** Two things
shipped, both live:
1. **Custom SMTP + code-based sign-in.** Magic *links* can't reach an installed
   iOS PWA (Mail opens Safari, a separate context — the PWA session never lands).
   Switched to a magic *code* (OTP): enter email → type the 6-digit code back
   into the app → `verifyOtp` makes the session in-context, no redirect. Custom
   SMTP is live via **Resend** (domain `send.alexakaminsky.com`, DNS on Namecheap;
   `smtp.resend.com:465`, user `resend`, sender `noreply@send.alexakaminsky.com`).
   This also unlocked email-template editing (Supabase blocks it until custom SMTP
   exists); the Magic Link + Confirm signup templates now include `{{ .Token }}`.
   `auth.jsx` has `verifyOtp`; `SignIn.jsx` has the code field
   (`autocomplete="one-time-code"`). Tested working from the installed PWA. **Do
   NOT enable Google/Apple OAuth** — their redirect reintroduces the same
   bounce-to-Safari problem the code flow solved.
2. **A notes feature + a broad UX/IA pass.** NEW **private notes journal**
   (migration `0010`, owner-only `notes` table; `src/lib/notes.jsx` `useNotes`):
   write notes on the Week tab throughout the week, read them back by week on You.
   Fully private. Plus a round of IA/copy cleanups (all live):
   - **Today tab renamed "Week N"** (live derived week).
   - **Week page IA redesign** (`Today.jsx`): week-anchored header (date · "Week N"
     · the Artist's Way **theme** from new `src/data/weeks.js`); the standalone
     Spotify chapter card folded into the Exercises card as a "♪ listen" link;
     cards reordered Morning Pages → Exercises → Artist Date → Notes; removed the
     old "Today"/"This week" section separators; **header date is now LIVE**
     (`new Date()`) — was a hardcoded `DATE` mock in seed.js ("Thursday June 11");
     Artist-Date plan text no longer italic when it's your real plan (italic only
     for the placeholder/subtitles).
   - **You page IA redesign** (`Journey.jsx`): split numbers from words — the
     selected-week panel dropped its duplicate Mood + Morning-pages blocks
     (those live in the all-weeks overview); they're now a compact "mood · X/7
     pages" line in the week header, and the panel focuses on Artist date /
     Check-in / Exercises / Notes. Also: You now lists exercises you *checked off*
     (not just answered), and the check-in shows labeled "Looking forward to" /
     "Shared with the group" lines. Plainer header copy.
   - **Check-in composer** field renamed "Want to share something with the group?".
   - **Circle header** plainer: "Your circle / Where everyone is this week."
   - **Profile redesigned as a settings page** (`Profile.jsx`): grouped rows with
     hairline dividers instead of 5 shadowed cards; **set-week + pause/resume
     combined** into one "Your week" group; Sign out + Leave under "Account".

**DB wiped clean at end of session 4** — 0 users/cohorts/rows; the 103-row global
exercise catalog preserved. **That was the LAST wipe** — the circle has since
kicked off and the DB now holds real user data (see the LIVE WITH REAL USERS
banner at the top of this section). Also note: at kickoff every friend is a
brand-new signup, so the **"Confirm signup" email template** (not just "Magic
Link") must carry the branded code HTML + `{{ .Token }}`; deliverability still
needs the SPF + bounce-MX records finished in Resend/Namecheap (DKIM + DMARC are
live; new sending domain means mark-as-not-spam helps early reputation).

Where we left off (session 3, June 13–14 2026): the app is **renamed `meraki`,
fully on Supabase, redesigned (3 tabs), and DEPLOYED LIVE.** This session: built
the whole backend (steps 2–6 + Journey + Profile), did the IA redesign (5→3 tabs:
Today · Circle · You) + You-page by-week redesign, **deployed to GitHub Pages**,
renamed tend→meraki, **wiped the DB of all test data**, made the **exercise
catalog global**, and added **Sunday-anchored weeks** + **per-week Spotify
audiobook links**. App is empty of users/cohorts (clean slate) but the global
catalog is pre-seeded and waiting for kickoff.

**LIVE AT: `https://alexakaminsky.com/artists-way/`** (GitHub Pages custom domain).

Live backend facts:
- Supabase project **project_ref `izdjwmulgneyoxrpddlj`**; MCP authenticated.
- Schema fully applied. Migrations: `0001` (initial — applied via dashboard,
  NOT in the ledger), `0002` (SECURITY DEFINER grant hardening), `0003` (cohort
  RPCs), `0004` (realtime: shared tables), `0005` (realtime: ideas), `0006`
  (`memberships.paused_at` for pause), `0007` (**exercise catalog made GLOBAL** —
  dropped `exercises.cohort_id`; one shared 12-week set for every cohort; reads
  open to authenticated, writes seed-only), `0008` (`cohorts.created_by` made
  nullable — fixed a NOT-NULL vs `on delete set null` contradiction that errored
  when a cohort creator's account was deleted), `0009` (**started_on defaults to
  the Sunday on/before join** — `current_date - dow` — so weeks run Sun–Sat for
  everyone), `0010` (**private per-week `notes` table** — owner-only RLS, no
  cohort_id, never shared; backs the notes journal), `0011` (**`week_photos`
  table + private `week-photos` Storage bucket** — weekly photo "Memories",
  private by default with a `shared` flag readable by the circle; files in
  Storage, signed-URL display, client-side resize via `src/lib/image.js`; UI in
  the Week "Memories" card, the You per-week panel, and the Circle expanded card).
  The `0001` ledger gap is cosmetic.
- Exercise catalog is **global + already seeded** (103 rows, all 12 weeks) via
  `supabase/seed_exercises.sql` (re-runnable; upserts on `(week, sort)` so it
  never deletes progress). No per-cohort re-seeding — new circles inherit it.
  `exercise_progress` still carries `cohort_id` for the Circle's shared-read RLS;
  only the catalog (prompts) is global. App queries select exercises by `week`
  only (no cohort filter). Source images live in `exercises/` which is
  **gitignored** (third-party material — not committed/published).
- `.env.local` is filled (URL + legacy anon key) for local dev. Prod build gets
  the same vars from **GitHub Actions secrets** (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`). Auth URL config (Supabase → Auth → URL
  Configuration): redirect allow-list includes `http://localhost:5173/**` AND
  `https://alexakaminsky.com/artists-way/**` (the prod custom domain; the
  github.io URL 301s to it). `appBaseUrl()` derives the served URL so invite
  links + magic-link redirect respect the subpath.

**Deploy:** `.github/workflows/deploy.yml` builds on push to `main` → GitHub
Pages. Repo is public, Pages source = GitHub Actions. PROD = the custom domain
above. Icon is `m.` (regenerated from `public/favicon.svg`).

**⚑ NEXT SESSION — the one real pre-kickoff TODO: custom SMTP for email.** The
magic-link email still uses Supabase's default shared SMTP (rate-limited to a
few/hour, lands in spam). Before 5 friends sign in at kickoff, set up custom SMTP
(Supabase → Auth → SMTP) via Resend or Postmark + verify `alexakaminsky.com`
(DNS records). Also (optional, 2 min): brand the magic-link **email template**
(Auth → Email Templates → Magic Link) — drafted meraki copy is in the session
chat. The in-app sign-in screen + wordmark already say meraki.

Other remaining/optional (none blocking):
- Open signup (`shouldCreateUser` default true) — anyone with the URL can make an
  account; RLS isolates data. Lock to known emails if wanted.
- Leaving a circle orphans your rows (not deleted); editing PAST check-ins from
  You isn't wired (editor targets current week); avatar/timezone in Profile;
  cross-week morning-pages backfill; push notifications (step 7).
- A real **meraki app icon** (current `m.` is a serif letter on parchment).

**At kickoff:** each friend opens the live URL → magic-link sign in → first person
creates the circle, others join via the invite link → everyone sets their name +
week in Profile. The week-1 exercises + Spotify chapter link are already there.

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
  via `src/lib/week.js`. UPDATE (session 3): Profile lets you **set your week**
  and **pause/resume** (`paused_at` freezes the week; `ref = paused_at || today`).
  UPDATE (session 3, late): **weeks run SUNDAY→SATURDAY for everyone.**
  `started_on` is anchored to a Sunday (DB default `current_date - dow`; app
  helpers `sundayOf`/`startedOnForWeek` for set-week + resume), so each person's
  PROGRAM week == the Sun–Sat CALENDAR week. This fixed a real inconsistency
  where Today/Circle counted morning pages by calendar week but You bucketed by
  program week — now all three count the same 7 days. `currentWeekDates` +
  `weekdayIndex` are Sunday-first; `DAY_LETTERS` = S M T W T F S. Resume
  re-anchors to the frozen week (Sunday-aligned) rather than shifting by raw days.
- **Seed all 12 weeks of exercises up front** (resolved session 2). UPDATE
  (session 3, late): the catalog is now **GLOBAL** (migration `0007`) — one
  shared set for every cohort, not cohort-scoped, and **seeded once** via
  `supabase/seed_exercises.sql`; writes are seed/admin-only (no in-app authoring).
  The circle uses the actual Artist's Way weekly task lists (condensed summaries
  they sourced), week-specific tasks only; the recurring tools (morning pages,
  weekly artist date, daily readings, check-in) are excluded because the app
  tracks those separately. Private circle of 5; treat the catalog text as their
  personal-use material.

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
