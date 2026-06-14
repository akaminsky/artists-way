// tend — private per-week notes ("notes to self").
// A running journal: add notes throughout the week (filed under your current
// derived week), read them back by week on You. Fully private (owner-only RLS),
// never shared with the circle. Optimistic add/delete with reconcile-on-error.
// In prototype mode (no Supabase) it keeps an in-memory list so the UI works.
import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'
import { useAuth } from './auth'
import { useCohort } from './cohort'
import { memberWeek } from './week'

export function useNotes() {
  const { session } = useAuth()
  const { membership } = useCohort()
  const uid = session?.user?.id ?? null
  const active = Boolean(isConfigured && uid)
  const week = memberWeek(membership?.started_on, membership?.paused_at)

  const [notes, setNotes] = useState([]) // [{ id, week, body, created_at }] newest first
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!active) { setLoading(false); return }
    const { data } = await supabase
      .from('notes')
      .select('id, week, body, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }, [active, uid])

  useEffect(() => { load() }, [load])

  // Add a note filed under a given week (defaults to your current week).
  const addNote = useCallback(async (body, forWeek = week) => {
    const text = (body || '').trim()
    if (!text) return
    const optimistic = { id: `tmp-${Date.now()}`, week: forWeek, body: text, created_at: new Date().toISOString() }
    setNotes((n) => [optimistic, ...n])
    if (!active) return
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: uid, week: forWeek, body: text })
      .select('id, week, body, created_at')
      .single()
    if (error) { load(); return }
    setNotes((n) => n.map((x) => (x.id === optimistic.id ? data : x)))
  }, [active, uid, week, load])

  const deleteNote = useCallback(async (id) => {
    setNotes((n) => n.filter((x) => x.id !== id))
    if (!active) return
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', uid)
    if (error) load()
  }, [active, uid, load])

  // grouped by week for the You tab
  const byWeek = {}
  for (const n of notes) (byWeek[n.week] ||= []).push(n)

  return { ready: active, loading, week, notes, byWeek, addNote, deleteNote }
}
