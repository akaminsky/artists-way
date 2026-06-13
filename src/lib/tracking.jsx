// tend — personal tracking against the real tables (step 3).
// Covers Morning Pages, the Artist Date (checkbox + private plan), and the
// week's exercises (checklist + private answers). Reads/writes are scoped to
// the signed-in user and their cohort; the shared/private split lives in the DB
// (RLS), not here.
//
// useTracking() always runs, but only does anything when Supabase is configured
// and the user has a membership. In the local-prototype mode it returns
// { ready:false } and App falls back to the localStorage `me`.
import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'
import { useAuth } from './auth'
import { useCohort } from './cohort'
import { memberWeek, currentWeekDates, weekdayIndex } from './week'

export function useTracking() {
  const { session } = useAuth()
  const { membership } = useCohort()
  const uid = session?.user?.id ?? null
  const cohortId = membership?.cohort_id ?? null
  const startedOn = membership?.started_on ?? null
  const pausedOn = membership?.paused_at ?? null
  const active = Boolean(isConfigured && uid && cohortId)

  const week = memberWeek(startedOn, pausedOn)
  const weekDates = currentWeekDates()
  const todayIndex = weekdayIndex()
  const todayISO = weekDates[todayIndex]

  const [loading, setLoading] = useState(true)
  const [doneDates, setDoneDates] = useState(() => new Set()) // morning-pages dates
  const [artistDone, setArtistDone] = useState(false)
  const [artistPlan, setArtistPlan] = useState('')
  // exercises: catalog rows for the week, joined with this user's progress/answer
  const [exercises, setExercises] = useState([]) // [{ id, label, prompt, done, answer }]
  const [checkin, setCheckin] = useState(null) // weekly_checkins row for this week, or null

  const load = useCallback(async () => {
    if (!active) { setLoading(false); return }
    setLoading(true)

    const [pagesRes, adRes, detailRes, exRes, ciRes] = await Promise.all([
      supabase.from('morning_pages').select('date')
        .eq('user_id', uid).gte('date', weekDates[0]).lte('date', weekDates[6]),
      supabase.from('artist_dates').select('id')
        .eq('user_id', uid).eq('week', week).maybeSingle(),
      supabase.from('artist_date_details').select('what_i_did')
        .eq('user_id', uid).eq('week', week).maybeSingle(),
      supabase.from('exercises').select('id,label,prompt,sort')
        .eq('week', week).order('sort'),
      supabase.from('weekly_checkins').select('mood, looking_forward, share_text')
        .eq('user_id', uid).eq('week', week).maybeSingle(),
    ])

    setDoneDates(new Set((pagesRes.data ?? []).map((r) => r.date)))
    setArtistDone(Boolean(adRes.data))
    setArtistPlan(detailRes.data?.what_i_did ?? '')
    setCheckin(ciRes.data ?? null)

    // Pull this user's progress + answers for just this week's exercise ids.
    const catalog = exRes.data ?? []
    const ids = catalog.map((r) => r.id)
    let progress = new Set()
    let answers = {}
    if (ids.length) {
      const [prog, ans] = await Promise.all([
        supabase.from('exercise_progress').select('exercise_id')
          .eq('user_id', uid).eq('completed', true).in('exercise_id', ids),
        supabase.from('exercise_answers').select('exercise_id,answer')
          .eq('user_id', uid).in('exercise_id', ids),
      ])
      progress = new Set((prog.data ?? []).map((r) => r.exercise_id))
      answers = Object.fromEntries((ans.data ?? []).map((r) => [r.exercise_id, r.answer]))
    }
    setExercises(catalog.map((r) => ({
      id: r.id, label: r.label, prompt: r.prompt,
      done: progress.has(r.id), answer: answers[r.id] ?? '',
    })))

    setLoading(false)
    // weekDates is derived from "today" and stable within a render day; deps on
    // the primitives that actually change identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, uid, cohortId, week])

  useEffect(() => { load() }, [load])

  // ── Morning Pages: toggle a given day of the week (lets you backfill missed
  // days). Future days are refused — you can't have done tomorrow's pages. ──
  const toggleDay = useCallback(async (index) => {
    if (!active) return
    const dates = currentWeekDates()
    const dateISO = dates[index]
    if (!dateISO || index > weekdayIndex()) return
    const has = doneDates.has(dateISO)
    setDoneDates((prev) => {
      const next = new Set(prev)
      has ? next.delete(dateISO) : next.add(dateISO)
      return next
    })
    const res = has
      ? await supabase.from('morning_pages').delete().eq('user_id', uid).eq('date', dateISO)
      : await supabase.from('morning_pages')
          .upsert({ user_id: uid, cohort_id: cohortId, date: dateISO }, { onConflict: 'user_id,date', ignoreDuplicates: true })
    if (res.error) load()
  }, [active, doneDates, uid, cohortId, load])

  const toggleToday = useCallback(() => toggleDay(todayIndex), [toggleDay, todayIndex])

  // ── Artist Date: toggle done for the current program week ──
  const toggleArtistDate = useCallback(async () => {
    if (!active) return
    const next = !artistDone
    setArtistDone(next)
    const res = next
      ? await supabase.from('artist_dates')
          .upsert({ user_id: uid, cohort_id: cohortId, week }, { onConflict: 'user_id,week', ignoreDuplicates: true })
      : await supabase.from('artist_dates').delete().eq('user_id', uid).eq('week', week)
    if (res.error) load()
  }, [active, artistDone, uid, cohortId, week, load])

  // ── Artist Date: private plan/note ──
  const saveArtistPlan = useCallback(async (text) => {
    if (!active) return
    setArtistPlan(text)
    const res = await supabase.from('artist_date_details')
      .upsert({ user_id: uid, week, what_i_did: text, updated_at: new Date().toISOString() }, { onConflict: 'user_id,week' })
    if (res.error) load()
  }, [active, uid, week, load])

  // ── Exercises: toggle done (shared) ──
  const toggleExercise = useCallback(async (exerciseId) => {
    if (!active) return
    const cur = exercises.find((e) => e.id === exerciseId)
    const next = !(cur && cur.done)
    setExercises((list) => list.map((e) => e.id === exerciseId ? { ...e, done: next } : e))
    const res = next
      ? await supabase.from('exercise_progress')
          .upsert({ user_id: uid, cohort_id: cohortId, exercise_id: exerciseId, completed: true, source: 'in_app', updated_at: new Date().toISOString() }, { onConflict: 'user_id,exercise_id' })
      : await supabase.from('exercise_progress').delete().eq('user_id', uid).eq('exercise_id', exerciseId)
    if (res.error) load()
  }, [active, exercises, uid, cohortId, load])

  // ── Exercises: private written answer ──
  // Writing a non-empty answer also marks the exercise complete (one less tap).
  // Clearing an answer does NOT un-complete it.
  const saveExerciseAnswer = useCallback(async (exerciseId, text) => {
    if (!active) return
    const hasText = Boolean(text && text.trim())
    setExercises((list) => list.map((e) => e.id === exerciseId
      ? { ...e, answer: text, done: hasText ? true : e.done } : e))
    const ops = [
      supabase.from('exercise_answers')
        .upsert({ user_id: uid, exercise_id: exerciseId, answer: text, updated_at: new Date().toISOString() }, { onConflict: 'user_id,exercise_id' }),
    ]
    if (hasText) {
      ops.push(supabase.from('exercise_progress')
        .upsert({ user_id: uid, cohort_id: cohortId, exercise_id: exerciseId, completed: true, source: 'in_app', updated_at: new Date().toISOString() }, { onConflict: 'user_id,exercise_id' }))
    }
    const results = await Promise.all(ops)
    if (results.some((r) => r.error)) load()
  }, [active, uid, cohortId, load])

  // ── Weekly check-in: write becomes visible to the circle ──
  const saveCheckin = useCallback(async ({ mood, forward, win }) => {
    if (!active) return
    const next = { mood: mood || null, looking_forward: forward || null, share_text: win || null }
    setCheckin(next)
    const res = await supabase.from('weekly_checkins')
      .upsert({ user_id: uid, cohort_id: cohortId, week, ...next, updated_at: new Date().toISOString() }, { onConflict: 'user_id,week' })
    if (res.error) load()
  }, [active, uid, cohortId, week, load])

  const pages = weekDates.map((d) => doneDates.has(d))

  return {
    ready: active,
    loading,
    week,
    // weekly check-in
    checkin,
    saveCheckin,
    // morning pages
    pages,
    todayIndex,
    pagesDone: pages.filter(Boolean).length,
    toggleToday,
    toggleDay,
    // artist date
    artistDone,
    artistPlan,
    toggleArtistDate,
    saveArtistPlan,
    // exercises
    exercises,
    exercisesDone: exercises.filter((e) => e.done).length,
    toggleExercise,
    saveExerciseAnswer,
    refresh: load,
  }
}
