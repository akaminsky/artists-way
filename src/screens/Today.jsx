// tend — Screen 1: Daily home
import { C, SERIF, ACCENT } from '../lib/theme'
import { Icon, MonoLabel, Checkbox, PagesStrip } from '../components/primitives'
import { WEEK, DATE, DAY_LETTERS, EXERCISES } from '../data/seed'

export default function Today({ me, setMe, openDetail }) {
  const pagesDone = me.pages.filter(Boolean).length
  const todayDone = me.pages[me.todayIndex]
  const exDone = Object.values(me.exercises).filter(Boolean).length

  const toggleToday = () => setMe((m) => {
    const pages = m.pages.slice(); pages[m.todayIndex] = !pages[m.todayIndex]
    return { ...m, pages }
  })
  const toggleAD = () => setMe((m) => ({ ...m, artistDate: { ...m.artistDate, done: !m.artistDate.done } }))
  const toggleEx = (id) => setMe((m) => ({ ...m, exercises: { ...m.exercises, [id]: !m.exercises[id] } }))

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

  return (
    <div style={{ padding: '6px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Title block */}
      <div style={{ padding: '6px 2px 2px' }}>
        <MonoLabel>{DATE.weekday} · {DATE.day}</MonoLabel>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 500, color: C.ink, lineHeight: 1.2, margin: '8px 0 0' }}>
          Good morning, {me.name}.
        </h1>
        <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.mid, marginTop: 6 }}>
          A quiet page is waiting.
        </p>
      </div>

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
          <PagesStrip days={me.pages} todayIndex={me.todayIndex} letters={DAY_LETTERS} />
          <MonoLabel>{pagesDone} / 7 this week</MonoLabel>
        </div>
      </Card>

      {/* Artist Date */}
      <Card onClick={() => openDetail({
        kicker: 'Artist Date · this week', title: 'Where will you take yourself?',
        prompt: 'One solo outing, just for delight. A museum, a fabric store, a long walk somewhere new.',
        placeholder: 'my plan for this week…', note: me.artistDate.plan || '',
        save: (note) => setMe((m) => ({ ...m, artistDate: { ...m.artistDate, plan: note } })),
      })}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <CardTitle icon="feather" label="Artist date" />
            <p style={{ fontFamily: SERIF, fontSize: me.artistDate.plan ? 16 : 14.5, fontStyle: 'italic', color: me.artistDate.plan ? C.ink : C.mid, margin: '8px 0 0', lineHeight: 1.45 }}>
              {me.artistDate.plan || 'Where will you take yourself this week?'}
            </p>
          </div>
          <Checkbox checked={me.artistDate.done} onClick={toggleAD} />
        </div>
        {!me.artistDate.plan && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <Icon name="pen" size={13} stroke={C.muted} />
            <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.muted, whiteSpace: 'nowrap' }}>tap to plan it</span>
          </div>
        )}
      </Card>

      {/* This week's work */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <CardTitle icon="leaf">This week’s exercises</CardTitle>
          <MonoLabel>{exDone} / {EXERCISES.length}</MonoLabel>
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 13.5, fontStyle: 'italic', color: C.mid, margin: '7px 0 4px' }}>
          Week {WEEK.n} — {WEEK.title}.
        </p>
        <div style={{ marginTop: 8 }}>
          {EXERCISES.map((ex, i) => {
            const done = me.exercises[ex.id]
            return (
              <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.hair}` }}>
                <Checkbox checked={done} onClick={() => toggleEx(ex.id)} size={22} />
                <button onClick={() => openDetail({
                  kicker: `Week ${WEEK.n} · exercise ${i + 1}`, title: ex.label, prompt: ex.prompt,
                  placeholder: 'work it out here…', note: me.exerciseNotes[ex.id] || '',
                  save: (note) => setMe((m) => ({ ...m, exerciseNotes: { ...m.exerciseNotes, [ex.id]: note } })),
                })}
                  style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                  <span style={{ fontFamily: SERIF, fontSize: 15.5, lineHeight: 1.35, color: done ? C.muted : C.ink, textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(154,145,131,0.6)' }}>{ex.label}</span>
                </button>
                {me.exerciseNotes[ex.id] && <Icon name="pen" size={13} stroke={C.muted} style={{ flexShrink: 0 }} />}
                <Icon name="chevR" size={15} stroke={C.edge} style={{ flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
