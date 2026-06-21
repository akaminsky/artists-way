// meraki — "a new week" prompt. Shown the first time you open the app on a new
// derived week (Sunday or any later day). Default is to move on; you can choose
// to stay on the week you were on a little longer (re-anchors started_on, the
// same move as Profile's set-week / resume). Dismissing = move on.
import { useEffect, useState } from 'react'
import { C, SERIF, SANS, ACCENT, ON_ACCENT } from '../lib/theme'
import { MonoLabel } from './primitives'
import { themeForWeek } from '../data/weeks'

export default function WeekTransitionSheet({ from, to, onContinue, onStay }) {
  const [enter, setEnter] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setEnter(true)) }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 26 }}>
      {/* scrim — tapping away = move on (the default) */}
      <div onClick={onContinue}
        style={{ position: 'absolute', inset: 0, background: 'rgba(28,24,20,0.30)', opacity: enter ? 1 : 0, transition: 'opacity 0.24s ease' }} />

      {/* card */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 340, background: C.bg,
        borderRadius: 22, boxShadow: '0 18px 50px rgba(28,24,20,0.24)',
        padding: '26px 26px 22px', textAlign: 'center',
        opacity: enter ? 1 : 0, transform: enter ? 'scale(1)' : 'scale(0.94)',
        transition: 'opacity 0.26s ease, transform 0.26s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <MonoLabel>✦ A new week</MonoLabel>
        </div>

        <div style={{ fontFamily: SANS, fontSize: 13, color: C.muted, marginBottom: 4 }}>
          You've moved into
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, color: C.ink, lineHeight: 1.1 }}>
          Week {to}
        </div>
        {themeForWeek(to) && (
          <div style={{ fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', color: C.mid, marginTop: 6, lineHeight: 1.4 }}>
            {themeForWeek(to)}
          </div>
        )}

        <p style={{ fontFamily: SANS, fontSize: 14, color: C.muted, lineHeight: 1.55, margin: '18px 4px 22px' }}>
          Ready to start it, or stay with Week {from} a little longer?
        </p>

        <button onClick={onContinue}
          style={{
            width: '100%', border: 'none', cursor: 'pointer', borderRadius: 13, padding: '14px 18px',
            background: ACCENT, color: ON_ACCENT, fontFamily: SERIF, fontSize: 16, fontWeight: 500,
            WebkitTapHighlightColor: 'transparent',
          }}>
          Start Week {to}
        </button>
        <button onClick={onStay}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 0 2px',
            fontFamily: SERIF, fontSize: 14.5, color: C.mid, WebkitTapHighlightColor: 'transparent',
          }}>
          Stay on Week {from}
        </button>
      </div>
    </div>
  )
}
