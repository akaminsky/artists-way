// tend — Screen 3: Group dashboard
import { useState } from 'react'
import { C, SERIF, ACCENT } from '../lib/theme'
import { Icon, MonoLabel, Avatar, MoodChip } from '../components/primitives'
import { PhotoStrip } from '../components/Photos'
import { WEEK, FRIENDS, EXERCISES, moodByKey } from '../data/seed'
import { useCircle } from '../lib/circle'

// Locked to the design defaults (mood = glyph + word, layout = cards).
const MOOD_STYLE = 'full'

export default function Group({ me, openCheckin, openCheckinForWeek, goToYou }) {
  const circle = useCircle()
  const [openId, setOpenId] = useState(null)
  // Look-back: null = "This week" (the live dashboard); a number = that past
  // program week, showing everyone's check-in for it. Only when the backend's live.
  const [viewWeek, setViewWeek] = useState(null)
  const maxWeek = circle.ready ? circle.maxWeek : WEEK.n
  const canLookBack = circle.ready && maxWeek > 1
  const stepBack = () => setViewWeek((w) => (w == null ? maxWeek - 1 : Math.max(1, w - 1)))
  const stepFwd = () => setViewWeek((w) => (w == null ? null : w >= maxWeek - 1 ? null : w + 1))

  // Real members when the backend's live; otherwise the local prototype seed.
  const people = circle.ready
    ? circle.members
    : [
        {
          id: 'you', name: me.name, mono: me.mono, you: true, week: WEEK.n,
          pages: me.pages.filter(Boolean).length,
          artistDate: me.artistDate.done,
          exercises: Object.values(me.exercises).filter(Boolean).length,
          exercisesTotal: EXERCISES.length,
          mood: me.checkin.mood,
        },
        ...FRIENDS.map((f) => ({ ...f, exercisesTotal: EXERCISES.length })),
      ]
  const gathering = circle.ready && circle.loading && people.length === 0

  // Your own check-in status, for the compose prompt at the top of Circle.
  const mine = people.find((p) => p.you)
  const myCheckedIn = Boolean(mine && (mine.mood || mine.lookingForward || mine.shareText))
  const myMood = moodByKey(mine?.mood)

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
    const expandable = Boolean(p.lookingForward || p.shareText || (p.photos && p.photos.length))
    const open = openId === p.id
    return (
      <div onClick={expandable ? () => setOpenId(open ? null : p.id) : undefined}
        style={{
          background: C.card, borderRadius: 14,
          boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
          padding: '16px 18px', cursor: expandable ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
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
          {expandable && (
            <Icon name="chevR" size={16} stroke={C.edge}
              style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
          )}
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
            <span style={{ fontFamily: SERIF, fontSize: 14, color: C.mid }}>{p.exercises}/{p.exercisesTotal}</span>
          </Stat>
        </div>
        {/* expanded check-in: looking-forward + something shared */}
        {open && (
          <div style={{ marginTop: 16, paddingTop: 14, paddingLeft: 52, borderTop: `1px solid ${C.hair}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {p.lookingForward && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <MonoLabel>Looking forward to</MonoLabel>
                <span style={{ fontFamily: SERIF, fontSize: 15, color: C.ink, lineHeight: 1.5 }}>{p.lookingForward}</span>
              </div>
            )}
            {p.shareText && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <MonoLabel>Sharing with the circle</MonoLabel>
                <span style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.ink, lineHeight: 1.5 }}>“{p.shareText}”</span>
              </div>
            )}
            {p.photos && p.photos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <MonoLabel>Memories</MonoLabel>
                <PhotoStrip photos={p.photos} size={60} />
              </div>
            )}
            {p.you && goToYou && (
              <button onClick={(e) => { e.stopPropagation(); goToYou() }}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, WebkitTapHighlightColor: 'transparent' }}>
                <span style={{ fontFamily: SERIF, fontSize: 13.5, fontStyle: 'italic', color: ACCENT }}>Your journey</span>
                <Icon name="chevR" size={14} stroke={ACCENT} />
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // A past-week check-in card (look-back view). No live pages/date/work stats —
  // those only mean something for the current week — just that week's check-in.
  const PastPerson = ({ p }) => {
    const ci = (circle.ready && circle.checkinByWeek[`${p.id}:${viewWeek}`]) || null
    const has = Boolean(ci && (ci.mood || ci.lookingForward || ci.shareText || (ci.photos && ci.photos.length)))
    const mood = moodByKey(ci?.mood)
    const seed = ci ? { mood: ci.mood, forward: ci.lookingForward, win: ci.shareText } : {}
    return (
      <div style={{
        background: C.card, borderRadius: 14,
        boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)', padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar mono={p.mono} you={p.you} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: C.ink }}>{p.name}</span>
              {p.you && <MonoLabel color={ACCENT}>you</MonoLabel>}
            </div>
            <MonoLabel style={{ display: 'block', marginTop: 3 }}>Week {viewWeek} / {WEEK.total}</MonoLabel>
          </div>
          {ci?.mood && <MoodChip mood={mood} style={MOOD_STYLE} small />}
        </div>

        {has ? (
          <div style={{ marginTop: 16, paddingTop: 14, paddingLeft: 52, borderTop: `1px solid ${C.hair}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ci.lookingForward && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <MonoLabel>Looking forward to</MonoLabel>
                <span style={{ fontFamily: SERIF, fontSize: 15, color: C.ink, lineHeight: 1.5 }}>{ci.lookingForward}</span>
              </div>
            )}
            {ci.shareText && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <MonoLabel>Sharing with the circle</MonoLabel>
                <span style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.ink, lineHeight: 1.5 }}>“{ci.shareText}”</span>
              </div>
            )}
            {ci.photos && ci.photos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <MonoLabel>Memories</MonoLabel>
                <PhotoStrip photos={ci.photos} size={60} />
              </div>
            )}
            {p.you && openCheckinForWeek && (
              <button onClick={() => openCheckinForWeek(viewWeek, seed)}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, WebkitTapHighlightColor: 'transparent' }}>
                <span style={{ fontFamily: SERIF, fontSize: 13.5, fontStyle: 'italic', color: ACCENT }}>Edit your check-in</span>
                <Icon name="chevR" size={14} stroke={ACCENT} />
              </button>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 14, paddingTop: 12, paddingLeft: 52, borderTop: `1px solid ${C.hair}` }}>
            {p.you && openCheckinForWeek ? (
              <button onClick={() => openCheckinForWeek(viewWeek, seed)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, WebkitTapHighlightColor: 'transparent' }}>
                <Icon name="pen" size={15} stroke={ACCENT} sw={1.7} />
                <span style={{ fontFamily: SERIF, fontSize: 14, color: ACCENT }}>Add your check-in for Week {viewWeek}</span>
              </button>
            ) : (
              <span style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: C.muted }}>No check-in</span>
            )}
          </div>
        )}
      </div>
    )
  }

  const StepBtn = ({ onClick, disabled, icon }) => (
    <button onClick={onClick} disabled={disabled}
      style={{ background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer', padding: 4, display: 'flex', opacity: disabled ? 0.3 : 1, WebkitTapHighlightColor: 'transparent' }}>
      <Icon name={icon} size={18} stroke={C.mid} />
    </button>
  )

  return (
    <div style={{ padding: '6px 20px 24px' }}>
      <div style={{ padding: '6px 2px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <MonoLabel>{people.length} {people.length === 1 ? 'friend' : 'friends'}</MonoLabel>
            <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 500, color: C.ink, lineHeight: 1.2, margin: '8px 0 0' }}>
              Your circle
            </h1>
          </div>
          {canLookBack && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, flexShrink: 0 }}>
              <StepBtn onClick={stepBack} disabled={viewWeek != null && viewWeek <= 1} icon="chevL" />
              <span style={{ fontFamily: SERIF, fontSize: 14, color: C.ink, minWidth: 64, textAlign: 'center' }}>
                {viewWeek == null ? 'This week' : `Week ${viewWeek}`}
              </span>
              <StepBtn onClick={stepFwd} disabled={viewWeek == null} icon="chevR" />
            </div>
          )}
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.mid, marginTop: 6 }}>
          {viewWeek == null ? 'Where everyone is this week.' : `Looking back at Week ${viewWeek}.`}
        </p>
      </div>

      {/* Your weekly check-in — composed here, where the circle lives */}
      {viewWeek == null && openCheckin && (
        !myCheckedIn ? (
          <button onClick={openCheckin}
            style={{ width: '100%', textAlign: 'left', background: C.card, borderRadius: 14, border: 'none',
              boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)', padding: '16px 18px',
              cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, WebkitTapHighlightColor: 'transparent' }}>
            <Icon name="pen" size={19} stroke={ACCENT} sw={1.7} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SERIF, fontSize: 16.5, fontWeight: 500, color: C.ink }}>Share your check-in</div>
              <div style={{ fontFamily: SERIF, fontSize: 13.5, fontStyle: 'italic', color: C.mid, marginTop: 2 }}>Before Sunday’s check-in — how was your week?</div>
            </div>
            <Icon name="chevR" size={16} stroke={C.edge} />
          </button>
        ) : (
          <button onClick={openCheckin}
            style={{ width: '100%', textAlign: 'left', background: 'none', border: `1px solid ${C.edge}`, borderRadius: 14,
              padding: '12px 16px', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, WebkitTapHighlightColor: 'transparent' }}>
            <Icon name="check" size={15} stroke={ACCENT} sw={2.2} />
            <span style={{ fontFamily: SERIF, fontSize: 14, color: C.mid }}>Your check-in is in{myMood ? ' · ' : ''}</span>
            {myMood && <MoodChip mood={myMood} style="word" small />}
            <span style={{ marginLeft: 'auto', fontFamily: SERIF, fontSize: 13.5, fontStyle: 'italic', color: ACCENT }}>Edit</span>
          </button>
        )
      )}

      {gathering ? (
        <p style={{ fontFamily: SERIF, fontSize: 14.5, fontStyle: 'italic', color: C.muted, textAlign: 'center', marginTop: 28 }}>
          Gathering the circle…
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {viewWeek == null
            ? people.map((p) => <Person key={p.id} p={p} />)
            : people.map((p) => <PastPerson key={p.id} p={p} />)}
        </div>
      )}

      {viewWeek == null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22, opacity: 0.8 }}>
          <Icon name="circle3" size={15} stroke={C.muted} />
          <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.muted }}>Sunday’s check-in brings you back together.</span>
        </div>
      )}
    </div>
  )
}
