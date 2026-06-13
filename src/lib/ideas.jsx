// tend — the Artist Date idea library.
// Reads the cohort's idea pool (`artist_date_ideas`, RLS gives shared ideas +
// your own) joined with your private per-idea state (`idea_state`: saved/done).
// Adding an idea inserts a row and auto-saves it. A realtime subscription on the
// pool means a friend's newly shared idea appears live.
import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'
import { useAuth } from './auth'
import { useCohort } from './cohort'

export function useIdeas() {
  const { session } = useAuth()
  const { membership } = useCohort()
  const uid = session?.user?.id ?? null
  const cohortId = membership?.cohort_id ?? null
  const active = Boolean(isConfigured && uid && cohortId)

  const [loading, setLoading] = useState(true)
  const [ideas, setIdeas] = useState([]) // unified shape (see below)

  const load = useCallback(async () => {
    if (!active) { setLoading(false); return }
    const [ideaRes, stateRes] = await Promise.all([
      supabase.from('artist_date_ideas')
        .select('id, created_by, title, category, cost, setting, social, shared, created_at')
        .eq('cohort_id', cohortId).order('created_at', { ascending: false }),
      supabase.from('idea_state').select('idea_id, saved, done').eq('user_id', uid),
    ])
    const rows = ideaRes.data ?? []
    const stateById = Object.fromEntries((stateRes.data ?? []).map((s) => [s.idea_id, s]))

    // creator names for the "from {name}" line
    const creatorIds = [...new Set(rows.map((r) => r.created_by))].filter((id) => id && id !== uid)
    let names = {}
    if (creatorIds.length) {
      const profRes = await supabase.from('profiles').select('id, display_name').in('id', creatorIds)
      names = Object.fromEntries((profRes.data ?? []).map((p) => [p.id, p.display_name || 'Friend']))
    }

    setIdeas(rows.map((r) => {
      const st = stateById[r.id]
      const createdByYou = r.created_by === uid
      return {
        id: r.id,
        title: r.title,
        createdByYou,
        by: createdByYou ? 'you' : (names[r.created_by] || 'Friend'),
        shared: r.shared,
        tags: { category: r.category, cost: r.cost, setting: r.setting, social: r.social },
        saved: Boolean(st?.saved),
        done: Boolean(st?.done),
      }
    }))
    setLoading(false)
  }, [active, uid, cohortId])

  useEffect(() => { load() }, [load])

  // Realtime: new/changed cohort ideas reload the pool.
  useEffect(() => {
    if (!active) return
    const channel = supabase.channel(`ideas:${cohortId}`)
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'artist_date_ideas', filter: `cohort_id=eq.${cohortId}` },
      () => load())
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [active, cohortId, load])

  // write my private saved/done for an idea
  const writeState = useCallback(async (idea, patch) => {
    const next = { saved: idea.saved, done: idea.done, ...patch }
    setIdeas((list) => list.map((i) => i.id === idea.id ? { ...i, ...next } : i))
    const res = await supabase.from('idea_state')
      .upsert({ user_id: uid, idea_id: idea.id, saved: next.saved, done: next.done, updated_at: new Date().toISOString() }, { onConflict: 'user_id,idea_id' })
    if (res.error) load()
  }, [uid, load])

  const toggleSave = useCallback((id) => {
    const idea = ideas.find((i) => i.id === id)
    if (idea) writeState(idea, { saved: !idea.saved })
  }, [ideas, writeState])

  const toggleDone = useCallback((id) => {
    const idea = ideas.find((i) => i.id === id)
    if (idea) writeState(idea, { done: !idea.done })
  }, [ideas, writeState])

  const addIdea = useCallback(async (draft) => {
    if (!active) return
    const title = (draft.title || '').trim()
    if (!title) return
    const { data, error } = await supabase.from('artist_date_ideas')
      .insert({
        cohort_id: cohortId, created_by: uid, title,
        category: draft.category, cost: draft.cost, setting: draft.setting, social: draft.social,
        shared: draft.shared,
      })
      .select('id').single()
    if (error) { load(); return }
    await supabase.from('idea_state')
      .upsert({ user_id: uid, idea_id: data.id, saved: true, done: false }, { onConflict: 'user_id,idea_id' })
    load()
  }, [active, uid, cohortId, load])

  return { ready: active, loading, ideas, toggleSave, toggleDone, addIdea }
}
