# meraki

A calm, private companion for a 5-friend [Artist's Way](https://juliacameronlive.com/the-artists-way/)
circle — a mobile-first PWA, installable to the home screen.

It's a support tool around the weekly check-in calls and monthly meetups, **not a
social network**. The five friends had each tried The Artist's Way solo and fallen
off after a week or three; meraki gives them just enough visibility and
accountability to finish the 12 weeks together. Warm Resurface design system —
Fraunces + JetBrains Mono on parchment, plum accent — with full dark mode.

**Live:** https://alexakaminsky.com/artists-way/

## The app

Three tabs — **Week · Circle · You** — mapping to the two jobs: *stay on track*
(Week + You) and *be carried along by the circle* (Circle). Check-in and Ideas are
full-screen views pushed from those tabs.

### Week
Your solo practice for the current week, under a header that shows the date, your
live week number, and that week's Artist's Way theme.
- **Morning Pages** — one-tap completion on an interactive Sun–Sat strip; tap any
  past day to backfill.
- **Artist Date** — two private fields: the **plan** (what the date is, or pick one
  from the Ideas library) and a **"how it went"** reflection after the fact.
- **Exercises** — the week's checklist, with a private written answer per item and
  an optional Spotify chapter link to listen.
- **Notes** — a private running journal you read back by week on You.
- **Memories** — weekly photos, private by default, optionally shared to the circle.
- **A new week** — the first time you open the app in a new week, a gentle prompt
  asks whether to move on or linger on the current week (self-paced, no pressure).

### Circle
Everyone at a glance — each person on their **own** self-paced week — showing only
what's shared: pages this week, Artist Date done, exercises done, mood, the shared
parts of their check-in, and any shared photos. Updates live (realtime). No likes,
no comments. A **week picker** lets you look back at past weeks' check-ins, and
backfill your own if you missed one.

### You
Your journey across all 12 weeks: a mood arc + morning-pages bars that double as a
week navigator, and a per-week panel with your mood, pages, Artist Date + "how it
went", check-in (with a marker on the fields you shared), exercise answers, photos
(add to any past week), and notes.

### Check-in
Filled in before the weekly call:
- A **12-emotion mood picker** (two per emotion-wheel core — Surprise, Happy,
  Anger, Fear, Sad, Disgust) plus a **write-your-own** option.
- Fields: say more about the feeling · what you're looking forward to · anything
  significant for your recovery · something to share with the group.
- **Per-field privacy** — every field is independently *Shared with the circle* or
  *Just for me*. By default only the mood is shared.

### Ideas
The Artist Date library. Toggle **Mine** (your bookmarked + added) vs **Shared**
(the group's pool), bookmark to save, check off when done, filter by category, and
add your own with tags (category · cost · indoor/outdoor · solo/group) and a
"share with the circle" toggle.

### Profile & settings
Edit your display name, **set your week**, **pause/resume**, copy the invite link,
leave the circle, sign out.

## Principles

- **Completion is shared, content is private** — and it's enforced by *storage*,
  not app trust. Shared progress lives in cohort-readable tables; private writing
  (notes, exercise answers, artist-date plans/reflections, and any check-in field
  you keep to yourself) lives in owner-only tables with row-level security. The
  circle physically cannot read what you didn't share.
- **Self-paced** — each person's week is derived from their own start date
  (Sunday-anchored), so friends can drift apart and catch up.
- **No passwords** — magic-code (OTP) email sign-in.
- **Dark mode** follows your OS setting.

## Stack

Vite 6 + React 18 (plain JSX) + [Supabase](https://supabase.com) (Postgres, auth,
row-level security, realtime, Storage) + `vite-plugin-pwa`. Styling is inline
styles over CSS design tokens. Hosted on GitHub Pages (custom domain) via GitHub
Actions.

## Run it

```bash
npm install
npm run dev      # local dev at http://localhost:5173
npm run build    # static output in dist/
npm run preview  # serve the production build
```

With no `.env.local`, the app runs in a local-only **prototype mode** (seed data,
no login) so it works without a backend. To run against Supabase, create
`.env.local`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Backend setup lives in [`supabase/README.md`](supabase/README.md); schema +
row-level security are versioned in `supabase/migrations/`, and the global 12-week
exercise catalog seeds from `supabase/seed_exercises.sql`.

## Structure

```
src/
  App.jsx              app shell: app bar, 3 tabs, pushed screens, sheets, gates
  data/                seed.js (prototype data) · weeks.js (the 12 week themes)
  lib/
    supabase.js  auth.jsx  cohort.jsx      session, circle membership
    tracking.jsx circle.jsx journey.jsx    per-week reads/writes (you + the circle)
    notes.jsx  photos.jsx  ideas.jsx        notes, weekly photos, idea library
    week.js  invite.js  image.js  theme.js  derived week, invites, resize, colors
  components/          primitives.jsx, DetailSheet.jsx, WeekTransitionSheet.jsx, Photos.jsx
  screens/             Today (Week), Journey (You), Group (Circle), Checkin, Ideas, Profile, Onboarding, SignIn
  styles/              tokens.css (design tokens + dark mode) · app.css (shell)
supabase/
  migrations/          versioned schema + RLS (0001 … 0013)
  seed_exercises.sql   the global 12-week exercise catalog
```

## Deploy

Pushing to `main` builds via `.github/workflows/deploy.yml` and publishes `dist/`
to GitHub Pages — i.e. **a push to `main` is a production deploy** to the live
circle. Supabase credentials come from GitHub Actions secrets
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
