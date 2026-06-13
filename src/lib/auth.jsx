// tend — auth + session context.
// Magic-link only (no passwords). Wraps the app, exposes the current session,
// the signed-in user's profile, and sign-in / sign-out. When Supabase isn't
// configured this provider reports `ready` with no session, and App falls back
// to the local prototype.
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'
import { appBaseUrl } from './invite'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)

  // Load the current session on mount and subscribe to changes (login via the
  // email link, token refresh, sign-out).
  useEffect(() => {
    if (!isConfigured) { setReady(true); return }
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  // Fetch (or wait for) the profile row whenever the user changes. The row is
  // created by a DB trigger on signup; we retry briefly in case we win the race.
  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) { setProfile(null); return }
    let active = true

    async function loadProfile(attempt = 0) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()
      if (!active) return
      if (data) { setProfile(data); return }
      if (attempt < 4) setTimeout(() => loadProfile(attempt + 1), 400)
    }
    loadProfile()
    return () => { active = false }
  }, [session?.user?.id])

  const signIn = useCallback(async (email) => {
    if (!isConfigured) throw new Error('Supabase not configured')
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: appBaseUrl() },
    })
  }, [])

  const signOut = useCallback(async () => {
    if (isConfigured) await supabase.auth.signOut()
  }, [])

  // Update the signed-in user's own profile row (display name, etc.).
  const updateProfile = useCallback(async (patch) => {
    const uid = session?.user?.id
    if (!isConfigured || !uid) return { error: new Error('not signed in') }
    const { data, error } = await supabase
      .from('profiles').update(patch).eq('id', uid).select().single()
    if (!error && data) setProfile(data)
    return { data, error }
  }, [session?.user?.id])

  const value = {
    configured: isConfigured,
    ready,
    session,
    user: session?.user ?? null,
    profile,
    setProfile,
    updateProfile,
    signIn,
    signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
