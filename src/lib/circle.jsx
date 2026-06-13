// tend — the Circle: every member's shared progress, live.
// Reads each membership joined to its profile, plus this week's shared progress
// (morning pages, artist date, exercises, latest mood). Each person is on their
// OWN derived week. A realtime subscription on the cohort's shared tables
// reloads the view when anyone's progress changes.
//
// Only the SHARED tables are read here — never the private writing. The DB's RLS
// is what guarantees that; this hook just doesn't ask for it.
import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'
import { useAuth } from './auth'
import { useCohort } from './cohort'
import { memberWeek, currentWeekDates } from './week'

export function useCircle() {
  const { session } = useAuth()
  const { membership } = useCohort()
  const uid = session?.user?.id ?? null
  const cohortId = membership?.cohort_id ?? null
  const active = Boolean(isConfigured && uid && cohortId)

  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])

  const load = useCallback(async () => {
    if (!active) { setLoading(false); return }
    const weekDates = currentWeekDates()

    const [memRes, mpRes, adRes, exRes, epRes, wcRes] = await Promise.all([
      supabase.from('memberships').select('user_id, started_on, paused_at, joined_at').eq('cohort_id', cohortId),
      supabase.from('morning_pages').select('user_id, date').eq('cohort_id', cohortId).gte('date', weekDates[0]).lte('date', weekDates[6]),
      supabase.from('artist_dates').select('user_id, week').eq('cohort_id', cohortId),
      supabase.from('exercises').select('id, week').eq('cohort_id', cohortId),
      supabase.from('exercise_progress').select('user_id, exercise_id').eq('cohort_id', cohortId).eq('completed', true),
      supabase.from('weekly_checkins').select('user_id, week, mood, looking_forward, share_text, created_at').eq('cohort_id', cohortId),
    ])

    const memberships = memRes.data ?? []
    const userIds = memberships.map((m) => m.user_id)
    let profiles = {}
    if (userIds.length) {
      const profRes = await supabase.from('profiles').select('id, display_name, mono, avatar').in('id', userIds)
      profiles = Object.fromEntries((profRes.data ?? []).map((p) => [p.id, p]))
    }

    // pages this calendar week, counted per user
    const pagesByUser = {}
    for (const r of (mpRes.data ?? [])) pagesByUser[r.user_id] = (pagesByUser[r.user_id] || 0) + 1

    // artist date done, keyed by user+week (each person's own week)
    const adSet = new Set((adRes.data ?? []).map((r) => `${r.user_id}:${r.week}`))

    // exercise catalog: id→week, and total exercises per week
    const exWeek = {}
    const exTotalByWeek = {}
    for (const r of (exRes.data ?? [])) {
      exWeek[r.id] = r.week
      exTotalByWeek[r.week] = (exTotalByWeek[r.week] || 0) + 1
    }
    // exercises done, counted per user+week
    const exDoneByUserWeek = {}
    for (const r of (epRes.data ?? [])) {
      const w = exWeek[r.exercise_id]
      if (w == null) continue
      const k = `${r.user_id}:${w}`
      exDoneByUserWeek[k] = (exDoneByUserWeek[k] || 0) + 1
    }

    // latest mood per user+week
    const moodByUserWeek = {}
    for (const r of (wcRes.data ?? [])) {
      const k = `${r.user_id}:${r.week}`
      const prev = moodByUserWeek[k]
      if (!prev || new Date(r.created_at) > new Date(prev.created_at)) moodByUserWeek[k] = r
    }

    const list = memberships.map((m) => {
      const prof = profiles[m.user_id] || {}
      const week = memberWeek(m.started_on, m.paused_at)
      const name = prof.display_name || 'Friend'
      const mono = prof.mono || (name ? name[0].toUpperCase() : '?')
      const ci = moodByUserWeek[`${m.user_id}:${week}`]
      return {
        id: m.user_id,
        name,
        mono,
        you: m.user_id === uid,
        week,
        paused: Boolean(m.paused_at),
        pages: pagesByUser[m.user_id] || 0,
        artistDate: adSet.has(`${m.user_id}:${week}`),
        exercises: exDoneByUserWeek[`${m.user_id}:${week}`] || 0,
        exercisesTotal: exTotalByWeek[week] || 0,
        mood: ci?.mood || '',
        lookingForward: ci?.looking_forward || '',
        shareText: ci?.share_text || '',
      }
    })
    // you first, then alphabetical
    list.sort((a, b) => (a.you === b.you ? a.name.localeCompare(b.name) : a.you ? -1 : 1))

    setMembers(list)
    setLoading(false)
  }, [active, uid, cohortId])

  useEffect(() => { load() }, [load])

  // Realtime: any change to the cohort's shared tables → reload.
  useEffect(() => {
    if (!active) return
    const channel = supabase.channel(`circle:${cohortId}`)
    for (const table of ['morning_pages', 'artist_dates', 'exercise_progress', 'weekly_checkins', 'memberships']) {
      channel.on('postgres_changes',
        { event: '*', schema: 'public', table, filter: `cohort_id=eq.${cohortId}` },
        () => load())
    }
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [active, cohortId, load])

  return { ready: active, loading, members, refresh: load }
}
