// tend — Supabase client.
// Gracefully degrades: if the project isn't configured yet (no .env.local),
// `supabase` is null and `isConfigured` is false, so the app falls back to the
// original localStorage prototype instead of crashing. The moment you add the
// two VITE_SUPABASE_* vars and restart `npm run dev`, the backend turns on.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && anonKey)

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,      // keep the session in localStorage
        autoRefreshToken: true,    // silent refresh so magic-link login sticks
        detectSessionInUrl: true,  // pick up the token when the email link lands
      },
    })
  : null
