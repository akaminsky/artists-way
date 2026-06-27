// tend — Screen 4: Weekly check-in (per-field privacy).
// Each field can be Shared with the circle or kept Just for me. Default: only the
// mood is shared; everything else starts private. The full check-in is saved to a
// private table; only shared fields reach the circle (see tracking.saveCheckin).
import { useState, useEffect, useRef } from 'react'
import { C, SERIF, ACCENT, ON_ACCENT } from '../lib/theme'
import { Icon, MonoLabel, MoodGlyph } from '../components/primitives'
import { WEEK, MOODS } from '../data/seed'

const DEFAULT_SHARES = { mood: true, moodNote: false, forward: false, significant: false, share: false }
const EMPTY_DRAFT = { mood: '', moodNote: '', forward: '', significant: '', share: '', shares: { ...DEFAULT_SHARES } }

// A mood value that isn't one of the presets is a write-in.
const isCustomMood = (m) => !!m && !MOODS.some((x) => x.key === m)

// Small "who can see this" toggle that sits with each field's label.
function ShareToggle({ on, onClick }) {
  return (
    <button onClick={onClick} type="button"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0,
        background: on ? 'var(--rs-accent-soft, rgba(138,94,126,0.12))' : C.inset,
        border: `1px solid ${on ? ACCENT : C.hair}`, borderRadius: 999, padding: '5px 10px',
        WebkitTapHighlightColor: 'transparent',
      }}>
      <Icon name={on ? 'circle3' : 'moon'} size={12} stroke={on ? ACCENT : C.muted} sw={1.7} />
      <span style={{ fontFamily: SERIF, fontSize: 12.5, fontStyle: 'italic', color: on ? ACCENT : C.mid }}>
        {on ? 'Shared with circle' : 'Just for me'}
      </span>
    </button>
  )
}

// Hoisted so the textarea keeps focus while typing.
function FieldRow({ label, value, onChange, placeholder, rows = 3, shareOn, onToggleShare }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: C.ink }}>{label}</span>
        <ShareToggle on={shareOn} onClick={onToggleShare} />
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

export default function Checkin({ me, setMe, track, onClose, presetWeek }) {
  const t = track && track.ready ? track : null
  const isPast = presetWeek != null
  const [justSaved, setJustSaved] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [showCustom, setShowCustom] = useState(false) // write-your-own emotion input open
  const seeded = useRef(false)

  // Seed once. Backend: load the full private record for this/the past week.
  // Prototype: read the local me.checkin.
  useEffect(() => {
    if (seeded.current) return
    const apply = (c) => { setDraft(c); setShowCustom(isCustomMood(c.mood)) }
    if (t) {
      if (isPast) {
        seeded.current = true
        track.getCheckin(presetWeek).then((c) => { if (c) apply({ ...EMPTY_DRAFT, ...c, shares: { ...DEFAULT_SHARES, ...c.shares } }) })
        return
      }
      if (t.loading) return
      seeded.current = true
      if (t.checkin) apply({ ...EMPTY_DRAFT, ...t.checkin, shares: { ...DEFAULT_SHARES, ...t.checkin.shares } })
      return
    }
    // prototype
    seeded.current = true
    const c = me?.checkin
    if (c) apply({ ...EMPTY_DRAFT, mood: c.mood || '', moodNote: c.moodNote || '', forward: c.forward || '', significant: c.significant || '', share: c.win || c.share || '', shares: { ...DEFAULT_SHARES, ...(c.shares || {}) } })
  }, [t, t?.loading, t?.checkin, isPast, presetWeek])

  const weekN = isPast ? presetWeek : (t ? t.week : WEEK.n)
  const setVal = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const toggleShare = (key) => setDraft((d) => ({ ...d, shares: { ...d.shares, [key]: !d.shares[key] } }))
  const pickMood = (key) => { setShowCustom(false); setDraft((d) => ({ ...d, mood: d.mood === key ? '' : key })) }
  const moodIsCustom = isCustomMood(draft.mood)
  const customOpen = showCustom || moodIsCustom
  const openCustom = () => { setShowCustom(true); if (!moodIsCustom) setVal({ mood: '' }) }
  const anything = draft.mood || draft.moodNote || draft.forward || draft.significant || draft.share

  const save = async () => {
    if (t) {
      await t.saveCheckin({ values: draft, shares: draft.shares, week: isPast ? presetWeek : undefined })
    } else {
      setMe((m) => ({ ...m, checkin: { ...m.checkin, mood: draft.mood, moodNote: draft.moodNote, forward: draft.forward, significant: draft.significant, win: draft.share, shares: draft.shares, shared: true } }))
    }
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2200)
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
        <MonoLabel>{isPast ? `Week ${weekN} check-in` : 'Check-in before Sunday @ 19:00'}</MonoLabel>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 500, color: C.ink, lineHeight: 1.2, margin: '8px 0 0' }}>
          {isPast ? `Looking back on Week ${weekN}` : `How was your week ${weekN}?`}
        </h1>
        <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.mid, marginTop: 6 }}>
          A few honest lines. Each one is private unless you choose to share it.
        </p>
      </div>

      {/* Mood picker + its share toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: C.ink }}>Where are you, honestly?</span>
          <ShareToggle on={draft.shares.mood} onClick={() => toggleShare('mood')} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
          {MOODS.map((mood) => {
            const on = draft.mood === mood.key
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
          {/* write your own emotion */}
          <button onClick={openCustom}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '10px 14px', borderRadius: 13,
              background: customOpen ? 'rgba(138,124,134,0.16)' : C.card,
              border: `1.5px solid ${customOpen ? '#8A7C86' : C.hair}`,
              transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent',
            }}>
            <Icon name="pen" size={16} stroke={customOpen ? '#8A7C86' : C.muted} sw={1.7} />
            <span style={{ fontFamily: SERIF, fontSize: 15.5, fontStyle: 'italic', color: customOpen ? '#8A7C86' : C.mid, fontWeight: customOpen ? 500 : 400 }}>Something else</span>
          </button>
        </div>
        {customOpen && (
          <input
            type="text" value={moodIsCustom ? draft.mood : ''} onChange={(e) => setVal({ mood: e.target.value })}
            placeholder="name the feeling in your own words…" autoFocus maxLength={40}
            style={{
              width: '100%', background: C.card, border: `1px solid ${C.hair}`, borderRadius: 12,
              padding: '12px 14px', fontFamily: SERIF, fontSize: 15.5, fontStyle: 'italic', color: C.ink, outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
            }}
          />
        )}
      </div>

      <FieldRow label="Say more about how you're feeling" value={draft.moodNote} onChange={(v) => setVal({ moodNote: v })}
        placeholder="what's underneath the mood — a sentence or two…" rows={2}
        shareOn={draft.shares.moodNote} onToggleShare={() => toggleShare('moodNote')} />

      <FieldRow label="What I'm looking forward to" value={draft.forward} onChange={(v) => setVal({ forward: v })}
        placeholder="the week ahead, something you're circling toward…" rows={3}
        shareOn={draft.shares.forward} onToggleShare={() => toggleShare('forward')} />

      <FieldRow label="Anything significant for your recovery?" value={draft.significant} onChange={(v) => setVal({ significant: v })}
        placeholder="other issues this week you felt mattered for your recovery…" rows={3}
        shareOn={draft.shares.significant} onToggleShare={() => toggleShare('significant')} />

      <FieldRow label="Want to share something with the group?" value={draft.share} onChange={(v) => setVal({ share: v })}
        placeholder="a win, an insight, an aha moment, a reflection — anything…" rows={2}
        shareOn={draft.shares.share} onToggleShare={() => toggleShare('share')} />

      {/* Save */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 2 }}>
        <button onClick={save} disabled={!anything}
          style={{
            width: '100%', border: 'none', borderRadius: 14, padding: '15px',
            background: ACCENT, color: ON_ACCENT,
            fontFamily: SERIF, fontSize: 16.5, fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.22s ease', opacity: anything ? 1 : 0.5,
            boxShadow: '0 6px 16px rgba(138,94,126,0.22)',
          }}>
          {justSaved ? <><Icon name="check" size={17} stroke={ON_ACCENT} sw={2.2} /> Saved</> : 'Save check-in'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 18 }}>
          <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.muted }}>
            {justSaved ? (isPast ? 'kept.' : 'kept — see you Sunday.') : 'The circle only sees fields marked “Shared.”'}
          </span>
        </div>
      </div>
      </div>
    </div>
  )
}
