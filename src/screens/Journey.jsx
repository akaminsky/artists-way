// tend — Screen 2: Focus on you (your journey).
// IA: a 12-week OVERVIEW on top (mood arc + morning-pages bars) that doubles as
// a week navigator — tap a week to open everything for that week below (mood,
// morning pages, artist date, check-in, exercise answers). One week at a time.
import { useState } from 'react'
import { C, SERIF, MONO, ACCENT } from '../lib/theme'
import { Icon, MonoLabel, MoodChip } from '../components/primitives'
import { PhotoStrip } from '../components/Photos'
import { WEEK, JOURNEY, EXERCISES, moodByKey } from '../data/seed'
import { useJourney } from '../lib/journey'

export default function Journey({ me, setMe, notes, photos, openDetail }) {
  const j = useJourney()
  const backend = j.ready
  const currentWeek = backend ? j.week : WEEK.n
  const [selWeek, setSelWeek] = useState(null)
  const viewWeek = selWeek ?? currentWeek

  // ── mood per week (1..12); future weeks stay empty ──
  const moodForWeek = (w) => {
    if (w > currentWeek) return null
    if (backend) return j.moods[w] || null
    if (w < WEEK.n) return JOURNEY.moods[w] || null
    if (w === WEEK.n) return me.checkin.mood || null
    return null
  }

  // ── history (real backend, or the local seed) ──
  let artistDates, reflections
  if (backend) {
    artistDates = j.artistDates
    reflections = j.reflections
  } else {
    artistDates = []
    if (me.artistDate.plan) artistDates.push({ week: WEEK.n, place: me.artistDate.plan, done: me.artistDate.done })
    JOURNEY.artistDates.forEach((d) => artistDates.push(d))
    const liveRefs = EXERCISES
      .filter((ex) => (me.exerciseNotes[ex.id] || '').trim())
      .map((ex) => ({ id: ex.id, week: WEEK.n, title: ex.label, answer: me.exerciseNotes[ex.id], live: true }))
    const pastRefs = JOURNEY.reflections.map((r) => ({ ...r, answer: me.pastEdits[r.id] || r.answer }))
    reflections = [...liveRefs, ...pastRefs]
  }

  const saveReflection = (r, note) => {
    if (backend) { j.saveAnswer(r.id, note); return }
    if (r.live) setMe((m) => ({ ...m, exerciseNotes: { ...m.exerciseNotes, [r.id]: note } }))
    else setMe((m) => ({ ...m, pastEdits: { ...m.pastEdits, [r.id]: note } }))
  }

  const pagesByWeek = backend ? j.pagesByWeek : { [currentWeek]: me.pages.filter(Boolean).length }
  const pagesTotal = backend ? j.pagesTotal : me.pages.filter(Boolean).length
  const checkins = backend
    ? j.checkins
    : ((me.checkin.mood || me.checkin.forward || me.checkin.win)
        ? [{ week: currentWeek, mood: me.checkin.mood, lookingForward: me.checkin.forward, shareText: me.checkin.win }]
        : [])

  // ── the selected week's pieces ──
  const wMood = moodByKey(moodForWeek(viewWeek))
  const wPagesCount = pagesByWeek[viewWeek] || 0
  const wDate = artistDates.find((d) => d.week === viewWeek)
  const wCheckin = checkins.find((c) => c.week === viewWeek)
  const wRefs = reflections.filter((r) => r.week === viewWeek)
  const wNotes = notes ? (notes.byWeek[viewWeek] || []) : []
  const wPhotos = photos ? (photos.byWeek[viewWeek] || []) : []
  const future = viewWeek > currentWeek

  const Card = ({ children, onClick, style = {} }) => (
    <div onClick={onClick} style={{
      background: C.card, borderRadius: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
      padding: '18px', cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  )

  const Block = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <MonoLabel>{label}</MonoLabel>
      {children}
    </div>
  )
  const dash = <span style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.muted }}>—</span>

  return (
    <div style={{ padding: '6px 20px 24px' }}>
      {/* title */}
      <div style={{ padding: '6px 2px 16px' }}>
        <MonoLabel>Week {currentWeek} of {WEEK.total}</MonoLabel>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 500, color: C.ink, lineHeight: 1.2, margin: '8px 0 0' }}>
          Your journey
        </h1>
        <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.mid, marginTop: 6 }}>
          One week at a time.
        </p>
      </div>

      {/* ── Overview: mood arc + pages bars, both navigate ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <MonoLabel>Mood &amp; pages</MonoLabel>
          <span style={{ fontFamily: SERIF, fontSize: 12, fontStyle: 'italic', color: C.muted }}>tap a week</span>
        </div>

        {/* mood dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {Array.from({ length: WEEK.total }).map((_, i) => {
            const w = i + 1
            const mood = moodByKey(moodForWeek(w))
            const sel = w === viewWeek
            const isFuture = w > currentWeek
            return (
              <button key={w} onClick={() => setSelWeek(w)}
                style={{ flex: 1, background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', display: 'flex', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}>
                <span style={{
                  width: 11, height: 11, borderRadius: '50%',
                  background: mood ? mood.color : 'transparent',
                  border: mood ? `1px solid ${mood.color}` : `1px solid ${isFuture ? C.edge : C.muted}`,
                  opacity: isFuture ? 0.5 : 1,
                  boxShadow: sel ? `0 0 0 3px ${mood ? mood.color + '33' : ACCENT_RING}` : 'none',
                }} />
              </button>
            )
          })}
        </div>

        {/* pages bars + week numbers */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }}>
          {Array.from({ length: WEEK.total }).map((_, i) => {
            const w = i + 1
            const count = pagesByWeek[w] || 0
            const sel = w === viewWeek
            const isFuture = w > currentWeek
            const fill = Math.round((count / 7) * 30)
            return (
              <button key={w} onClick={() => setSelWeek(w)}
                style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ width: 8, height: 30, borderRadius: 4, background: C.inset, position: 'relative', overflow: 'hidden', opacity: isFuture ? 0.5 : 1 }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: fill, background: ACCENT, borderRadius: 4, transition: 'height 0.3s ease' }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 8.5, color: sel ? ACCENT : C.muted, fontWeight: sel ? 700 : 500 }}>{w}</span>
              </button>
            )
          })}
        </div>

        <div style={{ height: 1, background: C.hair, margin: '14px 0 12px' }} />
        <span style={{ fontFamily: SERIF, fontSize: 13.5, fontStyle: 'italic', color: C.mid }}>
          {pagesTotal} {pagesTotal === 1 ? 'morning' : 'mornings'} tended so far.
        </span>
      </Card>

      {/* ── Selected week ── */}
      <Card>
        {/* week header with steppers */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Stepper disabled={viewWeek <= 1} onClick={() => setSelWeek(Math.max(1, viewWeek - 1))} icon="chevL" />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: C.ink }}>Week {viewWeek}</span>
            {viewWeek === currentWeek && <MonoLabel color={ACCENT} style={{ display: 'block', marginTop: 2 }}>this week</MonoLabel>}
          </div>
          <Stepper disabled={viewWeek >= WEEK.total} onClick={() => setSelWeek(Math.min(WEEK.total, viewWeek + 1))} icon="chevR" />
        </div>

        {future ? (
          <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.muted, textAlign: 'center', padding: '8px 0' }}>
            Week {viewWeek} is still ahead.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* compact summary: the numbers already live in the overview above */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginTop: -2 }}>
              {wMood && <MoodChip mood={wMood} />}
              <span style={{ fontFamily: SERIF, fontSize: 13.5, color: C.mid }}>{wPagesCount}/7 pages</span>
            </div>

            <Block label="Artist date">
              {wDate ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ flex: 1, fontFamily: SERIF, fontSize: 15.5, color: C.ink, lineHeight: 1.35 }}>{wDate.place}</span>
                    {wDate.done
                      ? <Icon name="check" size={16} stroke={ACCENT} sw={2.2} />
                      : <MonoLabel>planned</MonoLabel>}
                  </div>
                  {wDate.reflection && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={ciSubLabel}>How it went</span>
                      <p style={ciBody}>{wDate.reflection}</p>
                    </div>
                  )}
                </div>
              ) : dash}
            </Block>

            <Block label="Check-in">
              {wCheckin && (wCheckin.moodNote || wCheckin.lookingForward || wCheckin.significant || wCheckin.shareText) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {wCheckin.moodNote && <CiLine label="How you're feeling" body={wCheckin.moodNote} shared={wCheckin.shared?.moodNote} />}
                  {wCheckin.lookingForward && <CiLine label="Looking forward to" body={wCheckin.lookingForward} shared={wCheckin.shared?.forward} />}
                  {wCheckin.significant && <CiLine label="Significant for your recovery" body={wCheckin.significant} shared={wCheckin.shared?.significant} />}
                  {wCheckin.shareText && <CiLine label="To share with the group" body={wCheckin.shareText} shared={wCheckin.shared?.share} />}
                </div>
              ) : dash}
            </Block>

            <Block label={`Exercises${wRefs.length ? ` · ${wRefs.length}` : ''}`}>
              {wRefs.length === 0 ? dash : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {wRefs.map((r) => (
                    <button key={r.id} onClick={() => openDetail({
                      kicker: `Week ${r.week} · exercise`, title: r.title, prompt: '',
                      placeholder: 'your answer…', note: r.answer,
                      save: (note) => saveReflection(r, note),
                    })}
                      style={{ textAlign: 'left', background: C.bg, border: `1px solid ${C.hair}`, borderRadius: 11, padding: '12px 14px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: C.ink, lineHeight: 1.3 }}>{r.title}</span>
                        <Icon name="chevR" size={15} stroke={C.edge} style={{ flexShrink: 0 }} />
                      </div>
                      <p style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: (r.answer || '').trim() ? C.mid : C.muted, lineHeight: 1.5, margin: '6px 0 0',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {(r.answer || '').trim() || 'Done — tap to add a note'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </Block>

            <Block label={`Photos${wPhotos.length ? ` · ${wPhotos.length}` : ''}`}>
              {/* On the journal (You), you can add a photo to this week or any
                  past week (a memory is often uploaded later) — but not a future
                  week. Future / prototype mode stays read-only. */}
              {photos?.ready && !future ? (
                <PhotoStrip photos={wPhotos} onAdd={(file) => photos.addPhoto(file, viewWeek)}
                  onToggleShare={photos.toggleShare} onDelete={photos.deletePhoto} size={64} />
              ) : wPhotos.length === 0 ? dash : (
                <PhotoStrip photos={wPhotos} onToggleShare={photos.toggleShare} onDelete={photos.deletePhoto} size={64} />
              )}
            </Block>

            <Block label={`Notes${wNotes.length ? ` · ${wNotes.length}` : ''}`}>
              {wNotes.length === 0 ? dash : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {wNotes.map((n) => (
                    <div key={n.id} style={{ background: C.bg, border: `1px solid ${C.hair}`, borderRadius: 11, padding: '11px 13px' }}>
                      <p style={{ fontFamily: SERIF, fontSize: 14.5, color: C.ink, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{n.body}</p>
                      <MonoLabel style={{ display: 'block', marginTop: 6 }}>{noteStamp(n.created_at)}</MonoLabel>
                    </div>
                  ))}
                </div>
              )}
            </Block>
          </div>
        )}
      </Card>
    </div>
  )
}

const noteStamp = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// Check-in sub-parts on the selected-week card: a soft italic caption over the
// text, so "looking forward to" and "shared" read the same and are clearly named.
const ciSubLabel = { fontFamily: SERIF, fontSize: 12.5, fontStyle: 'italic', color: C.muted, letterSpacing: '0.01em' }
const ciBody = { fontFamily: SERIF, fontSize: 15, color: C.ink, lineHeight: 1.5, margin: 0 }

// One labeled line of your check-in, with a small marker when it was shared with
// the circle (everything else stays private to this journal).
function CiLine({ label, body, shared }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={ciSubLabel}>{label}</span>
        {shared && <MonoLabel color={ACCENT}>shared</MonoLabel>}
      </div>
      <p style={ciBody}>{body}</p>
    </div>
  )
}

const ACCENT_RING = 'rgba(138,94,126,0.22)'

function Stepper({ disabled, onClick, icon }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, border: `1px solid ${C.edge}`, background: C.bg,
        cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.4 : 1, WebkitTapHighlightColor: 'transparent' }}>
      <Icon name={icon} size={19} stroke={ACCENT} sw={2} />
    </button>
  )
}
