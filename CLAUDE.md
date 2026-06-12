# tend — project context

A calm, private mobile web app (PWA) for a 5-friend Artist's Way circle. It is a
support tool around weekly check-in calls and monthly in-person meetups, not a
social network. The five friends have all tried The Artist's Way solo and fallen
off after 1 to 3 weeks; the app exists to give them just enough visibility and
accountability to finish the 12 weeks together.

This is a personal passion project, not a business. Scope decisions should favor
"works well for 5 friends" over scale, growth, or generality.

## Current state (as of the first build session)

The **front-end prototype is complete and runs**. All five screens are built,
ported faithfully from a Claude Design mockup (warm Resurface design system:
Fraunces serif + JetBrains Mono on parchment, plum accent `#8A5E7E`).

**Data is local only.** Your own progress persists in `localStorage` (key
`tend.me.v2`); the four friends and the idea library are mock data in
`src/data/seed.js`. The next phase is the backend.

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
  drift apart. Week is per-user, not per-cohort (see open question below).

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
1. Supabase project + `profiles` + magic-link auth; replace the `loadMe`
   localStorage layer in `App.jsx` with a session + profile fetch.
2. Cohort + invite link + memberships (create a circle, join via link).
3. Private tracking writes (Morning Pages, Artist Date, exercises) against the
   shared/private tables; keep the exact same UI.
4. Circle dashboard reading real members (realtime subscription so rows update
   live), each with their own current_week.
5. Weekly check-in persistence.
6. Idea library as a shared table + per-user idea_state.
7. Push notifications LAST and optional (iOS web push requires the installed PWA;
   it is fiddly. Do not let it block anything. Group chat covers reminders for now).

## Open questions to resolve tomorrow
- **Per-user week:** manual "start the next week" advance (matches self-paced
  reality) vs derived from a per-user start date. Leaning manual advance stored on
  `memberships.current_week`.
- **Seeding the 12 weeks of exercises:** the friends should type their own week's
  tasks into the `exercises` catalog (do not reproduce the book's copyrighted text;
  keeps it accurate). Decide: seed all 12 up front, or week by week.
- **Linking a done idea to Artist Date history:** checking off an idea in the
  library could auto-create an entry in You → Artist Dates. Cleaner to wire once
  the backend exists.
- **Hosting:** GitHub Pages (like the other `.github.io` projects) serves the
  static frontend fine; Supabase is the backend. Confirm where to deploy.
- **Reactions on shared wins:** add a tiny acknowledgment or keep fully quiet.

## People in the prototype (placeholders)
You = "Ren"; friends = Maya, Dev, Priya, Jonah. Swap for the real 5 names and the
real current week when wiring up data.
