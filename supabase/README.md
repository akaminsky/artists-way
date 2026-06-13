# tend — backend setup

The backend is Supabase (hosted Postgres + magic-link auth + row-level
security). The app **runs without it** in local-only prototype mode; the steps
below turn the real backend on.

## One-time setup (≈10 minutes)

1. **Create a project** at https://supabase.com (free tier is plenty for 5
   people). Pick a region near you (Frankfurt / EU) and a database password
   (save it; you won't need it day to day).

2. **Run the schema.** In the project: **SQL Editor → New query →** paste the
   entire contents of `supabase/migrations/0001_initial_schema.sql` → **Run**.
   You should see "Success. No rows returned." This creates every table, the
   row-level-security policies, and the signup trigger.

3. **Get your keys.** **Project Settings → API**, copy:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon / public** key (the long one labeled `anon` `public`)

4. **Configure the app.** In the repo root:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and paste your two values. Then restart the dev server
   (`npm run dev`). The app now shows the sign-in screen instead of local mode.

5. **Email links.** Magic-link works out of the box on the built-in Supabase
   mailer for low volume. For reliability later, set a real SMTP sender under
   **Authentication → Emails**. Also add your deployed URL (and
   `http://localhost:5173`) under **Authentication → URL Configuration →
   Redirect URLs** so the email link returns to the right place.

## How privacy is enforced

Completion is **shared**, content is **private** — and it's enforced by the
database, not the UI:

- **Shared tables** (`morning_pages`, `artist_dates`, `exercise_progress`,
  `weekly_checkins`) — readable by anyone in your cohort. They hold only
  completion counts, moods, and the check-in you choose to share.
- **Private tables** (`artist_date_details`, `exercise_answers`, `idea_state`)
  — readable only by you. The actual writing never leaves your account.

Even if the app had a bug, RLS would refuse to return a friend's private rows.

## What's wired so far

- [x] Schema + RLS (all tables) — `migrations/0001_initial_schema.sql`
- [x] Supabase client with graceful fallback — `src/lib/supabase.js`
- [x] Magic-link auth + session/profile context — `src/lib/auth.jsx`
- [x] Sign-in screen + account/sign-out chip
- [ ] Create-a-circle + invite link + join (cohort/membership UI)
- [ ] Tracking writes against the tables (Morning Pages, Artist Date, exercises)
- [ ] Circle dashboard reading real members (realtime)
- [ ] Check-in persistence
- [ ] Idea library as a shared table
- [ ] Push notifications (last, optional)
