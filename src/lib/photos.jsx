// meraki — weekly photo "Memories" (your own).
// Private by default; a per-photo `shared` flag exposes it to the circle. Files
// live in the `week-photos` Storage bucket at `{uid}/{week}/{id}.jpg`; this hook
// reads the metadata rows for the signed-in user and resolves a short-lived
// signed URL for each so the private bucket can be displayed. Optimistic
// add/delete/share. Wired in App.jsx, passed to Today + Journey (like useNotes).
import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'
import { useAuth } from './auth'
import { useCohort } from './cohort'
import { memberWeek } from './week'
import { resizeImage } from './image'

const BUCKET = 'week-photos'
const SIGNED_TTL = 60 * 60 // 1 hour

async function signRows(rows) {
  if (!rows.length) return []
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.storage_path), SIGNED_TTL)
  const urlByPath = Object.fromEntries((data ?? []).map((s) => [s.path, s.signedUrl]))
  return rows.map((r) => ({ ...r, url: urlByPath[r.storage_path] || null }))
}

export function usePhotos() {
  const { session } = useAuth()
  const { membership } = useCohort()
  const uid = session?.user?.id ?? null
  const cohortId = membership?.cohort_id ?? null
  const active = Boolean(isConfigured && uid && cohortId)
  const week = memberWeek(membership?.started_on, membership?.paused_at)

  const [photos, setPhotos] = useState([]) // [{ id, week, storage_path, shared, created_at, url }]
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!active) { setLoading(false); return }
    const { data } = await supabase
      .from('week_photos')
      .select('id, week, storage_path, shared, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: true })
    setPhotos(await signRows(data ?? []))
    setLoading(false)
  }, [active, uid])

  useEffect(() => { load() }, [load])

  // Add a photo to a given week (defaults to your current week): resize → upload
  // → insert the metadata row → splice in with a signed URL.
  const addPhoto = useCallback(async (file, forWeek = week) => {
    if (!active || !file) return { error: new Error('not ready') }
    const blob = await resizeImage(file)
    const id = crypto.randomUUID()
    const path = `${uid}/${forWeek}/${id}.jpg`
    const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
    if (up.error) return { error: up.error }
    const { data, error } = await supabase
      .from('week_photos')
      .insert({ id, user_id: uid, cohort_id: cohortId, week: forWeek, storage_path: path, shared: false })
      .select('id, week, storage_path, shared, created_at')
      .single()
    if (error || !data) {
      await supabase.storage.from(BUCKET).remove([path]) // don't orphan the file
      return { error: error || new Error('insert failed') }
    }
    const [signed] = await signRows([data])
    setPhotos((p) => [...p, signed])
    return { data: signed }
  }, [active, uid, cohortId, week])

  const deletePhoto = useCallback(async (id) => {
    const target = photos.find((p) => p.id === id)
    setPhotos((p) => p.filter((x) => x.id !== id))
    if (!active || !target) return
    await supabase.from('week_photos').delete().eq('id', id).eq('user_id', uid)
    await supabase.storage.from(BUCKET).remove([target.storage_path])
  }, [active, uid, photos])

  const toggleShare = useCallback(async (id) => {
    const target = photos.find((p) => p.id === id)
    if (!target) return
    const next = !target.shared
    setPhotos((p) => p.map((x) => (x.id === id ? { ...x, shared: next } : x)))
    if (!active) return
    const { error } = await supabase.from('week_photos').update({ shared: next }).eq('id', id).eq('user_id', uid)
    if (error) load()
  }, [active, uid, photos, load])

  const byWeek = {}
  for (const p of photos) (byWeek[p.week] ||= []).push(p)

  return { ready: active, loading, week, photos, byWeek, addPhoto, deletePhoto, toggleShare }
}
