// tend — shared primitives + icons (ported from the design prototype)
import { C, SERIF, MONO, ACCENT, ACCENT_SOFT, ON_ACCENT } from '../lib/theme'

// ── Line icons (1.6 stroke, calm) ─────────────────────
export function Icon({ name, size = 20, stroke = C.mid, sw = 1.6, fill = 'none', style = {} }) {
  const p = { fill, stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    sun:   <g {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g>,
    leaf:  <g {...p}><path d="M11 20C6 20 4 16 4 11 9 11 13 7 20 7c0 7-4 13-9 13Z"/><path d="M4 20c4-6 8-8 12-9"/></g>,
    circle3: <g {...p}><circle cx="12" cy="8" r="3"/><circle cx="6.5" cy="14" r="2.4"/><circle cx="17.5" cy="14" r="2.4"/></g>,
    pen:   <g {...p}><path d="M5 19l-1 1 1-4L16 5a2 2 0 0 1 3 3L8 19l-3 1"/><path d="M14 7l3 3"/></g>,
    feather: <g {...p}><path d="M20 4C13 4 7 9 5 17l-1 3 3-1c8-2 13-8 13-15Z"/><path d="M16 8l-7 7M11 13h6"/></g>,
    moon:  <g {...p}><path d="M20 14a8 8 0 1 1-9-11 6 6 0 0 0 9 11Z"/></g>,
    check: <g {...p}><path d="M5 12l4.5 4.5L19 7"/></g>,
    chevR: <g {...p}><path d="M9 6l6 6-6 6"/></g>,
    chevL: <g {...p}><path d="M15 6l-6 6 6 6"/></g>,
    x:     <g {...p}><path d="M6 6l12 12M18 6L6 18"/></g>,
    arrow: <g {...p}><path d="M5 12h14M13 6l6 6-6 6"/></g>,
    spark: <g {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6.5 6.5l3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3"/></g>,
    wave:  <g {...p}><path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M3 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></g>,
    knot:  <g {...p}><path d="M8 8c4 0 4 8 8 8M16 8c-4 0-4 8-8 8"/></g>,
    storm: <g {...p}><path d="M7 11a4 4 0 1 1 1-7.9A5 5 0 0 1 18 6a3.5 3.5 0 0 1-.5 7H7Z"/><path d="M10 16l-2 4M14 16l-2 4"/></g>,
    sprout: <g {...p}><path d="M12 21v-9"/><path d="M12 12c0-3 2.4-5.2 5.5-5.2C17.5 10 15.2 12 12 12Z"/><path d="M12 14c0-2.6-2-4.5-4.8-4.5C7.2 12.2 9.2 14 12 14Z"/></g>,
    bulb:  <g {...p}><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.9 1 1 1.7l.1.5h5l.1-.5c.1-.7.5-1.3 1-1.7A6 6 0 0 0 12 3Z"/></g>,
    bookmark: <g {...p}><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.6L5 21V4a1 1 0 0 1 1-1Z"/></g>,
    plus:  <g {...p}><path d="M12 5v14M5 12h14"/></g>,
    headphones: <g {...p}><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></g>,
    image: <g {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.4"/><path d="M5 17l4.5-4 3 2.5L16 11l3 3"/></g>,
    book:  <g {...p}><path d="M6 4h11a1 1 0 0 1 1 1v15H8a2 2 0 0 0-2 2Z"/><path d="M6 20a2 2 0 0 1 2-2h9"/></g>,
    // mood glyphs
    bolt:  <g {...p}><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/></g>,
    flame: <g {...p}><path d="M12 3c4 5 5 7 5 10a5 5 0 0 1-10 0c0-2 1-3.4 2.6-4.7C11 9.4 12 6.2 12 3Z"/></g>,
    cloud: <g {...p}><path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.4 11 3.5 3.5 0 0 1 17 18Z"/></g>,
    tear:  <g {...p}><path d="M12 3c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12Z"/></g>,
    eye:   <g {...p}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></g>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', ...style }}>{paths[name]}</svg>
}

export function MonoLabel({ children, color = C.muted, style = {} }) {
  return <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color, whiteSpace: 'nowrap', ...style }}>{children}</span>
}

export function Avatar({ mono, you = false, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: you ? ACCENT_SOFT : C.inset,
      border: you ? `1.5px solid ${ACCENT}` : `1px solid ${C.hair}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SERIF, fontSize: size * 0.42, fontWeight: 500,
      color: you ? ACCENT : C.mid,
    }}>{mono}</div>
  )
}

// Tap target >= 44; visual circle 28
export function Checkbox({ checked, onClick, size = 28 }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, margin: -8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}>
      <span style={{
        width: size, height: size, borderRadius: '50%',
        border: checked ? `1.5px solid ${ACCENT}` : `1.5px solid ${C.muted}`,
        background: checked ? ACCENT : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.22s ease-in-out',
        boxShadow: checked ? '0 1px 4px rgba(138,94,126,0.35)' : 'none',
      }}>
        <span style={{ transform: checked ? 'scale(1)' : 'scale(0.4)', opacity: checked ? 1 : 0, transition: 'all 0.22s ease-in-out' }}>
          <Icon name="check" size={size * 0.62} stroke={ON_ACCENT} sw={2.4} />
        </span>
      </span>
    </button>
  )
}

// 7-day pages strip; today gets a ring. When interactive, days up to maxIndex are
// tappable (to log/un-log that day); later days are locked + dimmed.
export function PagesStrip({ days, todayIndex = -1, letters, dot = 9, gap = 7, interactive = false, onToggle, maxIndex = 6 }) {
  const L = letters || ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div style={{ display: 'flex', gap }}>
      {days.map((on, i) => {
        const isToday = i === todayIndex
        const locked = i > maxIndex
        const node = (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: dot, height: dot, borderRadius: '50%',
              background: on ? ACCENT : 'transparent',
              border: on ? `1px solid ${ACCENT}` : `1px solid ${C.edge}`,
              boxShadow: isToday && !on ? `0 0 0 2px ${ACCENT_SOFT}` : 'none',
              transition: 'all 0.22s ease-in-out',
            }} />
            {letters && <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.06em', color: isToday ? ACCENT : C.muted, fontWeight: isToday ? 600 : 500 }}>{L[i]}</span>}
          </div>
        )
        return interactive && !locked
          ? <button key={i} onClick={(e) => { e.stopPropagation(); onToggle && onToggle(i) }}
              style={{ background: 'none', border: 'none', padding: '5px 3px', margin: '-5px -3px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>{node}</button>
          : <div key={i} style={locked ? { opacity: 0.4 } : undefined}>{node}</div>
      })}
    </div>
  )
}

export function MoodGlyph({ glyph, color, size = 16 }) {
  // glyph values are icon names (presets + 'pen' for write-ins); fall back to leaf.
  const known = ['spark', 'leaf', 'wave', 'feather', 'bolt', 'flame', 'cloud', 'moon', 'knot', 'tear', 'storm', 'eye', 'pen']
  return <Icon name={known.includes(glyph) ? glyph : 'leaf'} size={size} stroke={color} sw={1.7} />
}

// Mood pill rendered per the chosen style: 'dot' | 'word' | 'full'
export function MoodChip({ mood, style = 'full', small = false }) {
  if (!mood) return <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>—</span>
  const dot = <span style={{ width: 8, height: 8, borderRadius: '50%', background: mood.color, flexShrink: 0, boxShadow: `0 0 0 3px ${mood.color}1f` }} />
  if (style === 'dot') return dot
  if (style === 'word') return <span style={{ fontFamily: SERIF, fontSize: small ? 13 : 14, fontStyle: 'italic', color: mood.color }}>{mood.label.toLowerCase()}</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <MoodGlyph glyph={mood.glyph} color={mood.color} size={small ? 14 : 16} />
      <span style={{ fontFamily: SERIF, fontSize: small ? 13 : 14, fontStyle: 'italic', color: mood.color }}>{mood.label.toLowerCase()}</span>
    </span>
  )
}
