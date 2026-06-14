// tend — your journey ("You" screen): your own history across all 12 weeks.
// Reads the mood arc (weekly_checkins), past Artist Dates (artist_dates +
// the private artist_date_details), and your exercise answers (exercise_answers
// joined to the cohort catalog for week + label). Everything here is YOURS —
// private content plus your own shared rows — so no cross-member reads.
import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'
import { useAuth } from './auth'
import { useCohort } from './cohort'
import { memberWeek } from './week'

export function useJourney() {
  const { session } = useAuth()
  const { membership } = useCohort()
  const uid = session?.user?.id ?? null
  const cohortId = membership?.cohort_id ?? null
  const active = Boolean(isConfigured && uid && cohortId)
  const startedOn = membership?.started_on ?? null
  const week = memberWeek(startedOn, membership?.paused_at)

  const [loading, setLoading] = useState(true)
  const [moods, setMoods] = useState({})           // { week: moodKey }
  const [artistDates, setArtistDates] = useState([]) // [{ week, place, done }]
  const [reflections, setReflections] = useState([]) // [{ id(exercise_id), week, title, answer }]
  const [checkins, setCheckins] = useState([])       // [{ week, mood, lookingForward, shareText }]
  const [pagesByWeek, setPagesByWeek] = useState({}) // { week: count 0..7 }
  const [pagesDays, setPagesDays] = useState({})     // { week: [7 booleans] }
  const [pagesTotal, setPagesTotal] = useState(0)

  const load = useCallback(async () => {
    if (!active) { setLoading(false); return }
    const [wcRes, adRes, adDetRes, exRes, ansRes, progRes, mpRes] = await Promise.all([
      supabase.from('weekly_checkins').select('week, mood, looking_forward, share_text, created_at').eq('user_id', uid),
      supabase.from('artist_dates').select('week').eq('user_id', uid),
      supabase.from('artist_date_details').select('week, what_i_did').eq('user_id', uid),
      supabase.from('exercises').select('id, week, label'),
      supabase.from('exercise_answers').select('exercise_id, answer').eq('user_id', uid),
      supabase.from('exercise_progress').select('exercise_id, completed').eq('user_id', uid),
      supabase.from('morning_pages').select('date').eq('user_id', uid),
    ])

    // morning pages bucketed by program week (anchored on started_on), keeping
    // both the per-week count and which of the 7 days were done.
    const startMid = startedOn ? new Date(startedOn + 'T00:00:00') : null
    const daysByWeek = {}
    let total = 0
    if (startMid) {
      for (const r of (mpRes.data ?? [])) {
        const days = Math.floor((new Date(r.date + 'T00:00:00') - startMid) / 86400000)
        const wk = Math.floor(days / 7) + 1
        if (wk >= 1 && wk <= 12) {
          if (!daysByWeek[wk]) daysByWeek[wk] = [false, false, false, false, false, false, false]
          daysByWeek[wk][((days % 7) + 7) % 7] = true
          total += 1
        }
      }
    }
    const counts = {}
    for (const [wk, arr] of Object.entries(daysByWeek)) counts[wk] = arr.filter(Boolean).length
    setPagesByWeek(counts)
    setPagesDays(daysByWeek)
    setPagesTotal(total)

    // latest check-in per week → mood arc + the full check-in archive
    const ciByWeek = {}
    for (const r of (wcRes.data ?? [])) {
      const prev = ciByWeek[r.week]
      if (!prev || new Date(r.created_at) > new Date(prev.created_at)) ciByWeek[r.week] = r
    }
    const moodByWeek = {}
    for (const r of Object.values(ciByWeek)) if (r.mood) moodByWeek[r.week] = r.mood
    setMoods(moodByWeek)
    setCheckins(Object.values(ciByWeek)
      .map((r) => ({ week: r.week, mood: r.mood || '', lookingForward: r.looking_forward || '', shareText: r.share_text || '' }))
      .filter((c) => c.mood || c.lookingForward || c.shareText)
      .sort((a, b) => b.week - a.week))

    // artist dates: any week that's marked done or has a written note
    const doneWeeks = new Set((adRes.data ?? []).map((r) => r.week))
    const detailByWeek = {}
    for (const r of (adDetRes.data ?? [])) if ((r.what_i_did || '').trim()) detailByWeek[r.week] = r.what_i_did
    const adWeeks = new Set([...doneWeeks, ...Object.keys(detailByWeek).map(Number)])
    setArtistDates([...adWeeks]
      .map((w) => ({ week: w, place: detailByWeek[w] || 'Artist date', done: doneWeeks.has(w) }))
      .sort((a, b) => b.week - a.week))

    // reflections: every exercise you've either checked done OR written an
    // answer for, joined to its catalog label + week. (Was answers-only, which
    // hid exercises you checked off without writing a note.)
    const exById = Object.fromEntries((exRes.data ?? []).map((e) => [e.id, e]))
    const answerById = {}
    for (const a of (ansRes.data ?? [])) if ((a.answer || '').trim()) answerById[a.exercise_id] = a.answer
    const doneIds = new Set((progRes.data ?? []).filter((p) => p.completed).map((p) => p.exercise_id))
    const refIds = new Set([...Object.keys(answerById), ...doneIds])
    setReflections([...refIds]
      .map((id) => {
        const ex = exById[id]
        return ex ? { id, week: ex.week, title: ex.label, answer: answerById[id] || '', done: doneIds.has(id) } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.week - a.week || a.title.localeCompare(b.title)))

    setLoading(false)
  }, [active, uid, cohortId, startedOn])

  useEffect(() => { load() }, [load])

  // Edit an answer from the journey. A non-empty answer keeps it marked done
  // (mirrors Today); clearing the note keeps a still-done exercise in the list
  // (only drops it if it was there for the answer alone).
  const saveAnswer = useCallback(async (exerciseId, text) => {
    if (!active) return
    const hasText = Boolean(text && text.trim())
    setReflections((list) => list
      .map((r) => r.id === exerciseId ? { ...r, answer: hasText ? text : '' } : r)
      .filter((r) => r.done || (r.answer || '').trim()))
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

  return { ready: active, loading, week, moods, artistDates, reflections, checkins, pagesByWeek, pagesDays, pagesTotal, saveAnswer, refresh: load }
}
