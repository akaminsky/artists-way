// tend — cohort + membership context.
// Loads the signed-in user's circle (we assume one circle per person — five
// friends, one cohort) and exposes create / join. Sits inside <AuthProvider>.
// When Supabase isn't configured, it reports ready with no membership so the
// app falls back to the local prototype (App only gates on cohort when there
// is a real session anyway).
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'
import { useAuth } from './auth'
import { capturePendingInvite } from './invite'

const CohortContext = createContext(null)

export function CohortProvider({ children }) {
  const { session } = useAuth()
  const uid = session?.user?.id ?? null

  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState(null) // membership row (+ cohort)
  const [cohort, setCohort] = useState(null)

  // Grab any ?join= code into localStorage once, before any sign-in round-trip.
  useEffect(() => { capturePendingInvite() }, [])

  const load = useCallback(async () => {
    if (!isConfigured || !uid) {
      setMembership(null); setCohort(null); setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('memberships')
      .select('*, cohort:cohorts(*)')
      .eq('user_id', uid)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    setMembership(data ?? null)
    setCohort(data?.cohort ?? null)
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  // create/join return the cohort row but do NOT auto-refresh — the caller
  // decides when to enter the app (create shows a "share this link" step first,
  // so it calls refresh() only once the user is done with it).
  const createCohort = useCallback(async (name) => {
    const { data, error } = await supabase.rpc('create_cohort', { p_name: name })
    if (error) throw error
    return data
  }, [])

  const joinCohort = useCallback(async (code) => {
    const { data, error } = await supabase.rpc('join_cohort', { p_code: code })
    if (error) throw error
    return data
  }, [])

  // Update my own membership row (started_on for "set my week", paused_at for
  // pause/resume). Refreshes so the derived week updates everywhere.
  const updateMembership = useCallback(async (patch) => {
    if (!membership) return { error: new Error('no membership') }
    const { error } = await supabase.from('memberships').update(patch).eq('id', membership.id)
    if (!error) await load()
    return { error }
  }, [membership, load])

  // Leave the circle — delete my membership. membership becomes null, so App
  // falls back to Onboarding (create/join).
  const leaveCohort = useCallback(async () => {
    if (!membership) return { error: new Error('no membership') }
    const { error } = await supabase.from('memberships').delete().eq('id', membership.id)
    if (!error) await load()
    return { error }
  }, [membership, load])

  const value = {
    loading,
    membership,
    cohort,
    hasCohort: Boolean(membership),
    refresh: load,
    createCohort,
    joinCohort,
    updateMembership,
    leaveCohort,
  }
  return <CohortContext.Provider value={value}>{children}</CohortContext.Provider>
}

export function useCohort() {
  const ctx = useContext(CohortContext)
  if (!ctx) throw new Error('useCohort must be used within <CohortProvider>')
  return ctx
}
