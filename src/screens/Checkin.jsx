// tend — Screen 4: Weekly check-in
import { useState, useEffect, useRef } from 'react'
import { C, SERIF, ACCENT } from '../lib/theme'
import { Icon, MonoLabel, MoodGlyph } from '../components/primitives'
import { WEEK, MOODS } from '../data/seed'

// Hoisted to module scope so the textarea keeps focus while typing
// (defining it inside the screen would remount the field on every keystroke).
function Field({ label, optional, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: C.ink }}>{label}</span>
        {optional && <MonoLabel>optional</MonoLabel>}
      </div>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{
          resize: 'none', width: '100%', background: C.card, border: `1px solid ${C.hair}`, borderRadius: 14,
          padding: '14px 15px', fontFamily: SERIF, fontSize: 16, lineHeight: 1.55, color: C.ink, outline: 'none',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
        }}
      />
    </div>
  )
}

export default function Checkin({ me, setMe, track, onClose }) {
  // Backend mode keeps a local draft, seeded once from the saved row, and only
  // writes to the circle on "Share". Local mode reads/writes me.checkin directly.
  const t = track && track.ready ? track : null
  const [justShared, setJustShared] = useState(false)
  const [draft, setDraft] = useState({ mood: '', forward: '', win: '' })
  const [draftShared, setDraftShared] = useState(false)
  const seeded = useRef(false)

  useEffect(() => {
    if (!t || seeded.current || t.loading) return
    seeded.current = true
    if (t.checkin) {
      setDraft({ mood: t.checkin.mood || '', forward: t.checkin.looking_forward || '', win: t.checkin.share_text || '' })
      setDraftShared(true)
    }
  }, [t, t?.loading, t?.checkin])

  const ci = t ? { ...draft, shared: draftShared } : me.checkin
  const weekN = t ? t.week : WEEK.n

  const setCI = (patch) => {
    if (t) { setDraft((d) => ({ ...d, ...patch })); setDraftShared(false) }
    else setMe((m) => ({ ...m, checkin: { ...m.checkin, ...patch, shared: false } }))
  }
  const pickMood = (key) => {
    if (t) { setDraft((d) => ({ ...d, mood: d.mood === key ? '' : key })); setDraftShared(false) }
    else setMe((m) => ({ ...m, checkin: { ...m.checkin, mood: m.checkin.mood === key ? '' : key, shared: false } }))
  }
  const share = async () => {
    if (t) { await t.saveCheckin({ mood: draft.mood, forward: draft.forward, win: draft.win }); setDraftShared(true) }
    else setMe((m) => ({ ...m, checkin: { ...m.checkin, shared: true } }))
    setJustShared(true)
    setTimeout(() => setJustShared(false), 2200)
  }

  return (
    <div className={onClose ? 'app-frame' : undefined}>
      {onClose && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top) + 14px) 18px 4px', flexShrink: 0 }}>
          <button onClick={onClose} aria-label="Back"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, margin: -6, display: 'flex' }}>
            <Icon name="chevL" size={22} stroke={C.mid} />
          </button>
        </div>
      )}
      <div className={onClose ? 'app-scroll' : undefined} style={{ padding: '6px 20px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ padding: '6px 2px 0' }}>
        <MonoLabel>Check-in before Sunday @ 19:00</MonoLabel>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 500, color: C.ink, lineHeight: 1.2, margin: '8px 0 0' }}>
          How was your week {weekN}?
        </h1>
        <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.mid, marginTop: 6 }}>
          A few honest lines. Only what you choose is shared.
        </p>
      </div>

      {/* Mood picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: C.ink }}>Where are you, honestly?</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
          {MOODS.map((mood) => {
            const on = ci.mood === mood.key
            return (
              <button key={mood.key} onClick={() => pickMood(mood.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '10px 14px', borderRadius: 13,
                  background: on ? `${mood.color}1c` : C.card,
                  border: `1.5px solid ${on ? mood.color : C.hair}`,
                  transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent',
                }}>
                <MoodGlyph glyph={mood.glyph} color={on ? mood.color : C.muted} size={17} />
                <span style={{ fontFamily: SERIF, fontSize: 15.5, fontStyle: 'italic', color: on ? mood.color : C.mid, fontWeight: on ? 500 : 400 }}>{mood.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Field label="What I'm looking forward to" value={ci.forward} onChange={(v) => setCI({ forward: v })}
        placeholder="the week ahead, something you’re circling toward…" rows={3} />

      <Field label="Want to share something with the group?" optional value={ci.win} onChange={(v) => setCI({ win: v })}
        placeholder="a win, an insight, an aha moment, a reflection — anything…" rows={2} />

      {/* Share */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 2 }}>
        <button onClick={share} disabled={!ci.mood && !ci.forward && !ci.win}
          style={{
            width: '100%', border: 'none', borderRadius: 14, padding: '15px',
            background: ci.shared ? C.inset : ACCENT, color: ci.shared ? ACCENT : C.card,
            fontFamily: SERIF, fontSize: 16.5, fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.22s ease', opacity: (!ci.mood && !ci.forward && !ci.win) ? 0.5 : 1,
            boxShadow: ci.shared ? 'none' : '0 6px 16px rgba(138,94,126,0.22)',
          }}>
          {ci.shared ? <><Icon name="check" size={17} stroke={ACCENT} sw={2.2} /> Shared with the circle</> : 'Share with the circle'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 18 }}>
          {justShared
            ? <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: ACCENT }}>kept — see you Sunday.</span>
            : <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.muted }}>You can change this any time before Sunday evening.</span>}
        </div>
      </div>
      </div>
    </div>
  )
}
