// tend — Screen 1: Daily home (the solo practice, by cadence: today + this week)
import { useState } from 'react'
import { C, SERIF, ACCENT, ACCENT_SOFT } from '../lib/theme'
import { Icon, MonoLabel, Checkbox, PagesStrip } from '../components/primitives'
import { WEEK, DATE, DAY_LETTERS, EXERCISES } from '../data/seed'
import { audioForWeek } from '../data/chapters'
import { weekdayIndex } from '../lib/week'

const noteStamp = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function Today({ me, setMe, track, notes, name, openDetail, openCheckin, openIdeas }) {
  // Morning Pages + Artist Date read/write the backend when it's live (`track`);
  // otherwise they fall back to the local prototype `me`. Exercises are still on
  // `me` — they migrate in the next sub-step (they need the cohort catalog).
  const t = track && track.ready ? track : null
  const displayName = name || me.name

  // Morning Pages
  const pages = t ? t.pages : me.pages
  const pagesTodayIndex = t ? t.todayIndex : me.todayIndex
  const pagesDone = t ? t.pagesDone : me.pages.filter(Boolean).length
  const todayDone = pages[pagesTodayIndex]
  const toggleToday = t
    ? t.toggleToday
    : () => setMe((m) => {
        const p = m.pages.slice(); p[m.todayIndex] = !p[m.todayIndex]
        return { ...m, pages: p }
      })
  // tap any past/today dot in the strip to log it (catch up on a missed day)
  const toggleDay = t
    ? t.toggleDay
    : (i) => setMe((m) => {
        if (i > m.todayIndex) return m
        const p = m.pages.slice(); p[i] = !p[i]
        return { ...m, pages: p }
      })
  const missedDay = pages.slice(0, pagesTodayIndex).some((d) => !d)

  // Artist Date
  const adDone = t ? t.artistDone : me.artistDate.done
  const adPlan = t ? t.artistPlan : me.artistDate.plan
  const toggleAD = t
    ? t.toggleArtistDate
    : () => setMe((m) => ({ ...m, artistDate: { ...m.artistDate, done: !m.artistDate.done } }))
  const saveADPlan = t
    ? t.saveArtistPlan
    : (note) => setMe((m) => ({ ...m, artistDate: { ...m.artistDate, plan: note } }))

  // Exercises: from the cohort catalog when live, else the local seed list.
  const exItems = t
    ? t.exercises
    : EXERCISES.map((ex) => ({ id: ex.id, label: ex.label, prompt: ex.prompt, done: !!me.exercises[ex.id], answer: me.exerciseNotes[ex.id] || '' }))
  const exDone = t ? t.exercisesDone : Object.values(me.exercises).filter(Boolean).length
  const exWeek = t ? t.week : WEEK.n
  const toggleEx = t
    ? t.toggleExercise
    : (id) => setMe((m) => ({ ...m, exercises: { ...m.exercises, [id]: !m.exercises[id] } }))
  const saveExAnswer = t
    ? t.saveExerciseAnswer
    : (id, note) => setMe((m) => ({
        ...m,
        exerciseNotes: { ...m.exerciseNotes, [id]: note },
        // a non-empty answer also marks it done (mirrors the backend behavior)
        exercises: { ...m.exercises, [id]: note && note.trim() ? true : m.exercises[id] },
      }))

  // Notes: a private running journal for the week (Week tab to write, You to
  // read back by week). Works on the backend; harmless no-op in prototype mode.
  const thisWeekNotes = notes ? (notes.byWeek[exWeek] || []) : []
  const [noteDraft, setNoteDraft] = useState('')
  const addNote = () => {
    const text = noteDraft.trim()
    if (!text || !notes) return
    notes.addNote(text, exWeek)
    setNoteDraft('')
  }

  // Weekly check-in nudge: a gentle cross-link as Sunday's call nears (Fri–Sun),
  // only while you haven't shared yet. The check-in's real home is Circle.
  const checkedIn = t
    ? Boolean(t.checkin && (t.checkin.mood || t.checkin.looking_forward || t.checkin.share_text))
    : Boolean(me.checkin.shared)
  // Thu–Sat (Sunday-first index 4–6), as Sunday's call approaches
  const showCheckinNudge = Boolean(openCheckin) && weekdayIndex() >= 4 && !checkedIn

  const Card = ({ children, onClick, style = {} }) => (
    <div onClick={onClick} style={{
      background: C.card, borderRadius: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
      padding: '18px 18px', cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  )

  const CardTitle = ({ icon, children, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={19} stroke={ACCENT} sw={1.7} />
      <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: C.ink }}>{children}</span>
      {label && <MonoLabel style={{ marginLeft: 2 }}>{label}</MonoLabel>}
    </div>
  )

  const SectionLabel = ({ children }) => (
    <MonoLabel style={{ display: 'block', margin: '6px 2px -4px' }}>{children}</MonoLabel>
  )

  return (
    <div style={{ padding: '6px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Title block */}
      <div style={{ padding: '6px 2px 2px' }}>
        <MonoLabel>{DATE.weekday} · {DATE.day}</MonoLabel>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 500, color: C.ink, lineHeight: 1.2, margin: '8px 0 0' }}>
          Good morning, {displayName}.
        </h1>
        <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.mid, marginTop: 6 }}>
          A quiet page is waiting.
        </p>
      </div>

      <SectionLabel>Today</SectionLabel>

      {/* Morning Pages — just a checkbox, no writing */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <CardTitle icon="sun">Morning Pages</CardTitle>
            <p style={{ fontFamily: SERIF, fontSize: 14.5, fontStyle: 'italic', color: C.mid, margin: '8px 0 0', lineHeight: 1.45 }}>
              {todayDone ? 'Done for today. Future-you will be glad.' : 'Three pages, longhand, first thing.'}
            </p>
          </div>
          <Checkbox checked={todayDone} onClick={toggleToday} />
        </div>
        <div style={{ height: 1, background: C.hair, margin: '16px 0 14px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <PagesStrip days={pages} todayIndex={pagesTodayIndex} letters={DAY_LETTERS}
            interactive onToggle={toggleDay} maxIndex={pagesTodayIndex} />
          <MonoLabel>{pagesDone} / 7 this week</MonoLabel>
        </div>
        {missedDay && (
          <p style={{ fontFamily: SERIF, fontSize: 12.5, fontStyle: 'italic', color: C.muted, margin: '11px 0 0' }}>
            Missed a day? Tap it to log it.
          </p>
        )}
      </Card>

      <SectionLabel>This week</SectionLabel>

      {/* Listen to this week's chapter (Spotify audiobook) */}
      {audioForWeek(exWeek) && (
        <a href={audioForWeek(exWeek)} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
            background: C.card, borderRadius: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
            padding: '14px 18px', WebkitTapHighlightColor: 'transparent' }}>
          <Icon name="headphones" size={20} stroke={ACCENT} sw={1.7} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 500, color: C.ink }}>Listen to this week’s chapter</div>
            <div style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.mid, marginTop: 2 }}>The Artist’s Way on Spotify</div>
          </div>
          <Icon name="arrow" size={16} stroke={C.edge} style={{ flexShrink: 0 }} />
        </a>
      )}

      {/* Artist Date */}
      <Card onClick={() => openDetail({
        kicker: 'Artist Date · this week', title: 'Where will you take yourself?',
        prompt: 'One solo outing, just for delight. A museum, a fabric store, a long walk somewhere new.',
        placeholder: 'my plan for this week…', note: adPlan || '',
        save: saveADPlan,
      })}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <CardTitle icon="feather" label="Artist date" />
            <p style={{ fontFamily: SERIF, fontSize: adPlan ? 16 : 14.5, fontStyle: 'italic', color: adPlan ? C.ink : C.mid, margin: '8px 0 0', lineHeight: 1.45 }}>
              {adPlan || 'Where will you take yourself this week?'}
            </p>
          </div>
          <Checkbox checked={adDone} onClick={toggleAD} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
          {!adPlan && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="pen" size={13} stroke={C.muted} />
              <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.muted, whiteSpace: 'nowrap' }}>tap to plan it</span>
            </span>
          )}
          <button onClick={(e) => { e.stopPropagation(); openIdeas() }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, WebkitTapHighlightColor: 'transparent' }}>
            <Icon name="bulb" size={14} stroke={ACCENT} sw={1.7} />
            <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: ACCENT, whiteSpace: 'nowrap' }}>browse ideas</span>
          </button>
        </div>
      </Card>

      {/* This week's work */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <CardTitle icon="leaf">This week’s exercises</CardTitle>
          <MonoLabel>{exDone} / {exItems.length}</MonoLabel>
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 13.5, fontStyle: 'italic', color: C.mid, margin: '7px 0 4px' }}>
          Week {exWeek}{!t ? ` — ${WEEK.title}` : ''}.
        </p>
        {exItems.length === 0 ? (
          <p style={{ fontFamily: SERIF, fontSize: 14.5, fontStyle: 'italic', color: C.muted, margin: '12px 0 2px', lineHeight: 1.45 }}>
            {t && t.loading ? 'Gathering this week’s work…' : 'No exercises set for this week yet.'}
          </p>
        ) : (
          <div style={{ marginTop: 8 }}>
            {exItems.map((ex, i) => {
              const done = ex.done
              return (
                <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.hair}` }}>
                  <Checkbox checked={done} onClick={() => toggleEx(ex.id)} size={22} />
                  <button onClick={() => openDetail({
                    kicker: `Week ${exWeek} · exercise ${i + 1}`, title: ex.label, prompt: ex.prompt,
                    placeholder: 'work it out here…', note: ex.answer || '',
                    save: (note) => saveExAnswer(ex.id, note),
                  })}
                    style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                    <span style={{ fontFamily: SERIF, fontSize: 15.5, lineHeight: 1.35, color: done ? C.muted : C.ink, textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(154,145,131,0.6)' }}>{ex.label}</span>
                  </button>
                  {ex.answer && <Icon name="pen" size={13} stroke={C.muted} style={{ flexShrink: 0 }} />}
                  <Icon name="chevR" size={15} stroke={C.edge} style={{ flexShrink: 0 }} />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Notes — a private running journal for the week */}
      <Card>
        <CardTitle icon="book">Notes</CardTitle>
        <p style={{ fontFamily: SERIF, fontSize: 14.5, fontStyle: 'italic', color: C.mid, margin: '8px 0 0', lineHeight: 1.45 }}>
          A private space — jot anything for yourself this week. Only you ever see these.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 13 }}>
          <textarea
            value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={2}
            placeholder="a thought, a line, something you noticed…"
            style={{ resize: 'none', width: '100%', background: C.bg, border: `1px solid ${C.hair}`, borderRadius: 12,
              padding: '11px 13px', fontFamily: SERIF, fontSize: 15, lineHeight: 1.5, color: C.ink, outline: 'none' }}
          />
          <button onClick={addNote} disabled={!noteDraft.trim()}
            style={{ alignSelf: 'flex-start', border: 'none', borderRadius: 11, padding: '9px 17px',
              background: noteDraft.trim() ? ACCENT : C.inset, color: noteDraft.trim() ? C.card : C.muted,
              fontFamily: SERIF, fontSize: 14.5, fontWeight: 500, cursor: noteDraft.trim() ? 'pointer' : 'default',
              WebkitTapHighlightColor: 'transparent' }}>
            Add note
          </button>
        </div>
        {thisWeekNotes.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {thisWeekNotes.map((n, i) => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: i === 0 ? 0 : 12, borderTop: i === 0 ? 'none' : `1px solid ${C.hair}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: SERIF, fontSize: 15, color: C.ink, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{n.body}</p>
                  <MonoLabel style={{ display: 'block', marginTop: 5 }}>{noteStamp(n.created_at)}</MonoLabel>
                </div>
                <button onClick={() => notes.deleteNote(n.id)} aria-label="Delete note"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 20, lineHeight: 1, padding: '0 2px', WebkitTapHighlightColor: 'transparent' }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* gentle cross-link to the check-in (its home is Circle) as the call nears */}
      {showCheckinNudge && (
        <button onClick={openCheckin}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: ACCENT_SOFT, border: `1px dashed ${ACCENT}`, borderRadius: 14, padding: '14px',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          <Icon name="pen" size={15} stroke={ACCENT} sw={1.7} />
          <span style={{ fontFamily: SERIF, fontSize: 14.5, fontWeight: 500, color: ACCENT }}>Sunday’s call is coming — share your check-in</span>
        </button>
      )}
    </div>
  )
}
