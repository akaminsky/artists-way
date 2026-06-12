// tend — Detail sheet (private note / answer). Slides up over the app.
import { useState, useEffect, useRef } from 'react'
import { C, SERIF, ACCENT } from '../lib/theme'
import { Icon, MonoLabel } from './primitives'

export default function DetailSheet({ detail, onSave, onClose }) {
  const [note, setNote] = useState(detail.note || '')
  const [saved, setSaved] = useState(false)
  const [enter, setEnter] = useState(false)
  const taRef = useRef(null)

  useEffect(() => { requestAnimationFrame(() => setEnter(true)) }, [])

  const close = () => { setEnter(false); setTimeout(onClose, 240) }
  const save = () => {
    onSave(note)
    setSaved(true)
    setTimeout(() => { setSaved(false); close() }, 850)
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* scrim */}
      <div onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(28,24,20,0.28)', opacity: enter ? 1 : 0, transition: 'opacity 0.24s ease' }} />
      {/* sheet */}
      <div style={{
        position: 'relative', background: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', padding: '14px 24px calc(28px + env(safe-area-inset-bottom))',
        transform: enter ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1)',
        maxHeight: '86%', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: C.edge, margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <MonoLabel>{detail.kicker}</MonoLabel>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, margin: -4 }}>
            <Icon name="x" size={18} stroke={C.muted} />
          </button>
        </div>

        <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, fontStyle: 'normal', color: C.ink, lineHeight: 1.25, margin: '2px 0 10px' }}>{detail.title}</h2>

        {detail.prompt && (
          <p style={{ fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', color: C.mid, lineHeight: 1.5, marginBottom: 18 }}>{detail.prompt}</p>
        )}

        <textarea
          ref={taRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={detail.placeholder || 'a sentence, a feeling, a question…'}
          style={{
            flex: 1, minHeight: 150, resize: 'none', width: '100%',
            background: C.card, border: `1px solid ${C.hair}`, borderRadius: 14,
            padding: '16px 16px', fontFamily: SERIF, fontSize: 16.5, lineHeight: 1.6, color: C.ink,
            outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <Icon name="moon" size={14} stroke={C.muted} />
          <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.muted, flex: 1 }}>private — only you can see this</span>
          <button onClick={save} disabled={saved}
            style={{
              border: 'none', cursor: 'pointer', borderRadius: 12, padding: '11px 20px',
              background: saved ? 'transparent' : ACCENT, color: saved ? ACCENT : C.card,
              fontFamily: SERIF, fontSize: 15, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'all 0.22s ease',
            }}>
            {saved ? <><Icon name="check" size={15} stroke={ACCENT} sw={2.2} /> kept</> : 'Keep'}
          </button>
        </div>
      </div>
    </div>
  )
}
