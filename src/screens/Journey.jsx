// tend — Screen 2: Focus on you (your journey)
import { C, SERIF, MONO, ACCENT } from '../lib/theme'
import { Icon, MonoLabel } from '../components/primitives'
import { WEEK, JOURNEY, EXERCISES, MOODS, moodByKey } from '../data/seed'

export default function Journey({ me, setMe, openDetail }) {
  // ── mood per week (1..12); weeks 1-3 history, 4 live, rest pending ──
  const moodForWeek = (w) => {
    if (w < WEEK.n) return JOURNEY.moods[w] || null
    if (w === WEEK.n) return me.checkin.mood || null
    return null
  }

  // ── artist dates: live current week (if planned) + history ──
  const artistDates = []
  if (me.artistDate.plan) artistDates.push({ week: WEEK.n, place: me.artistDate.plan, done: me.artistDate.done })
  JOURNEY.artistDates.forEach((d) => artistDates.push(d))

  // ── exercises: live answered this week + history ──
  const liveRefs = EXERCISES
    .filter((ex) => (me.exerciseNotes[ex.id] || '').trim())
    .map((ex) => ({ id: ex.id, week: WEEK.n, title: ex.label, answer: me.exerciseNotes[ex.id], live: true }))
  const pastRefs = JOURNEY.reflections.map((r) => ({ ...r, answer: me.pastEdits[r.id] || r.answer }))
  const reflections = [...liveRefs, ...pastRefs]

  const Card = ({ children, onClick, style = {} }) => (
    <div onClick={onClick} style={{
      background: C.card, borderRadius: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
      padding: '18px', cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  )

  const SectionLabel = ({ icon, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 2px 12px' }}>
      <Icon name={icon} size={16} stroke={ACCENT} sw={1.7} />
      <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: C.ink }}>{children}</span>
    </div>
  )

  return (
    <div style={{ padding: '6px 20px 24px' }}>
      {/* title */}
      <div style={{ padding: '6px 2px 18px' }}>
        <MonoLabel>Your journey · week {WEEK.n} of {WEEK.total}</MonoLabel>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 500, color: C.ink, lineHeight: 1.2, margin: '8px 0 0' }}>
          Looking back
        </h1>
        <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.mid, marginTop: 6 }}>
          The trail you’ve left for future-you.
        </p>
      </div>

      {/* ── Mood, week by week ── */}
      <SectionLabel icon="sprout">Your mood, week by week</SectionLabel>
      <Card style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 0 }}>
          {Array.from({ length: WEEK.total }).map((_, i) => {
            const w = i + 1
            const mood = moodByKey(moodForWeek(w))
            const isNow = w === WEEK.n
            const future = w > WEEK.n
            return (
              <div key={w} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <span style={{
                  width: 11, height: 11, borderRadius: '50%',
                  background: mood ? mood.color : 'transparent',
                  border: mood ? `1px solid ${mood.color}` : `1px solid ${future ? C.edge : C.muted}`,
                  opacity: future ? 0.5 : 1,
                  boxShadow: isNow ? `0 0 0 3px ${mood ? mood.color + '22' : 'rgba(154,145,131,0.18)'}` : 'none',
                }} />
                <span style={{ fontFamily: MONO, fontSize: 8, color: isNow ? ACCENT : C.muted, fontWeight: isNow ? 600 : 500 }}>{w}</span>
              </div>
            )
          })}
        </div>
        <div style={{ height: 1, background: C.hair, margin: '15px 0 13px' }} />
        {/* legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px 14px' }}>
          {MOODS.map((m) => (
            <span key={m.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
              <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.mid }}>{m.label.toLowerCase()}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* ── Artist dates ── */}
      <SectionLabel icon="feather">Artist dates</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
        {artistDates.map((d, i) => (
          <Card key={i} style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 34, flexShrink: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em', color: C.muted }}>WK</span>
                <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: ACCENT, lineHeight: 1 }}>{d.week}</span>
              </div>
              <div style={{ width: 1, height: 30, background: C.hair, flexShrink: 0 }} />
              <span style={{ fontFamily: SERIF, fontSize: 15.5, color: C.ink, lineHeight: 1.35, flex: 1 }}>{d.place}</span>
              {d.done
                ? <Icon name="check" size={16} stroke={ACCENT} sw={2.2} style={{ flexShrink: 0 }} />
                : <MonoLabel>planned</MonoLabel>}
            </div>
          </Card>
        ))}
      </div>

      {/* ── Exercises ── */}
      <SectionLabel icon="pen">Exercises</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reflections.length === 0 && (
          <Card style={{ padding: '18px' }}>
            <p style={{ fontFamily: SERIF, fontSize: 14.5, fontStyle: 'italic', color: C.muted, textAlign: 'center' }}>Your answers will gather here as you go.</p>
          </Card>
        )}
        {reflections.map((r) => (
          <Card key={r.week + '-' + r.id} onClick={() => openDetail({
            kicker: `Week ${r.week} · exercise`, title: r.title, prompt: '',
            placeholder: 'your answer…', note: r.answer,
            save: (note) => {
              if (r.live) setMe((m) => ({ ...m, exerciseNotes: { ...m.exerciseNotes, [r.id]: note } }))
              else setMe((m) => ({ ...m, pastEdits: { ...m.pastEdits, [r.id]: note } }))
            },
          })}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <MonoLabel>Week {r.week}{r.live ? ' · this week' : ''}</MonoLabel>
              <Icon name="chevR" size={15} stroke={C.edge} />
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 500, color: C.ink, lineHeight: 1.3, marginBottom: 6 }}>{r.title}</div>
            <p style={{ fontFamily: SERIF, fontSize: 14.5, fontStyle: 'italic', color: C.mid, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.answer}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
