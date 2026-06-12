// tend — Screen 3: Group dashboard
import { C, SERIF, ACCENT } from '../lib/theme'
import { Icon, MonoLabel, Avatar, MoodChip } from '../components/primitives'
import { WEEK, FRIENDS, EXERCISES, moodByKey } from '../data/seed'

// Locked to the design defaults (mood = glyph + word, layout = cards).
const MOOD_STYLE = 'full'

export default function Group({ me }) {
  const you = {
    id: 'you', name: me.name, mono: me.mono, you: true, week: WEEK.n,
    pages: me.pages.filter(Boolean).length,
    artistDate: me.artistDate.done,
    exercises: Object.values(me.exercises).filter(Boolean).length,
    mood: me.checkin.mood,
  }
  const people = [you, ...FRIENDS]
  const exTotal = EXERCISES.length

  const MiniStrip = ({ n }) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < n ? ACCENT : 'transparent', border: `1px solid ${i < n ? ACCENT : C.edge}` }} />
      ))}
    </div>
  )

  const Stat = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <MonoLabel>{label}</MonoLabel>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 18 }}>{children}</div>
    </div>
  )

  const Person = ({ p }) => {
    const mood = moodByKey(p.mood)
    return (
      <div style={{
        background: C.card, borderRadius: 14,
        boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
        padding: '16px 18px',
      }}>
        {/* name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar mono={p.mono} you={p.you} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: C.ink }}>{p.name}</span>
              {p.you && <MonoLabel color={ACCENT}>you</MonoLabel>}
            </div>
            <MonoLabel style={{ display: 'block', marginTop: 3 }}>Week {p.week} / {WEEK.total}</MonoLabel>
          </div>
          <MoodChip mood={mood} style={MOOD_STYLE} small />
        </div>
        {/* stats */}
        <div style={{ display: 'flex', gap: 22, marginTop: 15, paddingLeft: 52 }}>
          <Stat label="Pages">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <MiniStrip n={p.pages} />
              <span style={{ fontFamily: SERIF, fontSize: 14, color: C.mid }}>{p.pages}/7</span>
            </div>
          </Stat>
          <Stat label="Date">
            {p.artistDate
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="check" size={15} stroke={ACCENT} sw={2.2} /><span style={{ fontFamily: SERIF, fontSize: 14, color: C.ink }}>done</span></span>
              : <span style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: C.muted }}>not yet</span>}
          </Stat>
          <Stat label="Work">
            <span style={{ fontFamily: SERIF, fontSize: 14, color: C.mid }}>{p.exercises}/{exTotal}</span>
          </Stat>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '6px 20px 24px' }}>
      <div style={{ padding: '6px 2px 16px' }}>
        <MonoLabel>The circle · 5 friends</MonoLabel>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 500, color: C.ink, lineHeight: 1.2, margin: '8px 0 0' }}>
          How everyone’s tending
        </h1>
        <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.mid, marginTop: 6 }}>
          No scores, no nudges — just so you can hold each other.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {people.map((p) => <Person key={p.id} p={p} />)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22, opacity: 0.8 }}>
        <Icon name="circle3" size={15} stroke={C.muted} />
        <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.muted }}>Sunday’s call brings you back together.</span>
      </div>
    </div>
  )
}
