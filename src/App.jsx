// tend — app shell: app bar, screens, bottom tabs, detail sheet.
// Single device, full viewport (the design prototype showed four phones on a
// presentation stage; this is one real instance you install to the home screen).
import { useState, useEffect } from 'react'
import { C, SERIF, SANS, MONO, ACCENT } from './lib/theme'
import { Icon } from './components/primitives'
import DetailSheet from './components/DetailSheet'
import Today from './screens/Today'
import Journey from './screens/Journey'
import Group from './screens/Group'
import Ideas from './screens/Ideas'
import Checkin from './screens/Checkin'
import { ME, WEEK } from './data/seed'

const ME_KEY = 'tend.me.v2'

function loadMe() {
  try {
    const raw = localStorage.getItem(ME_KEY)
    if (raw) return { ...structuredClone(ME), ...JSON.parse(raw) }
  } catch (e) { /* ignore */ }
  return structuredClone(ME)
}

const TABS = [
  { id: 'today',   label: 'Today',    icon: 'sun' },
  { id: 'you',     label: 'You',      icon: 'sprout' },
  { id: 'group',   label: 'Circle',   icon: 'circle3' },
  { id: 'ideas',   label: 'Ideas',    icon: 'bulb' },
  { id: 'checkin', label: 'Check-in', icon: 'pen' },
]

export default function App() {
  const [me, setMe] = useState(loadMe)
  const [tab, setTab] = useState('today')
  const [detail, setDetail] = useState(null)

  // persist my data locally (swapped for a backend in the next phase)
  useEffect(() => {
    try { localStorage.setItem(ME_KEY, JSON.stringify(me)) } catch (e) { /* ignore */ }
  }, [me])

  return (
    <div className="app-frame">
      {/* app bar (sits below the OS status bar via safe-area inset) */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(env(safe-area-inset-top) + 14px) 22px 12px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>
          tend<span style={{ color: ACCENT }}>.</span>
        </span>
        {/* The week pill is *your* week — only on your own screens. On Circle,
            each person can be on a different week (shown per card instead). */}
        {tab !== 'group' && (
          <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.mid, background: C.inset, borderRadius: 8, padding: '5px 9px', whiteSpace: 'nowrap' }}>
            Week {WEEK.n} / {WEEK.total}
          </span>
        )}
      </div>

      {/* scroll content */}
      <div className="app-scroll">
        {tab === 'today' && <Today me={me} setMe={setMe} openDetail={setDetail} />}
        {tab === 'you' && <Journey me={me} setMe={setMe} openDetail={setDetail} />}
        {tab === 'group' && <Group me={me} />}
        {tab === 'ideas' && <Ideas me={me} setMe={setMe} />}
        {tab === 'checkin' && <Checkin me={me} setMe={setMe} />}
      </div>

      {/* bottom tabs */}
      <div style={{
        display: 'flex', flexShrink: 0, background: C.card, borderTop: `1px solid ${C.hair}`,
        padding: '8px 16px calc(env(safe-area-inset-bottom) + 10px)', boxShadow: '0 -2px 12px rgba(0,0,0,0.03)',
      }}>
        {TABS.map((t) => {
          const on = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '6px 0', WebkitTapHighlightColor: 'transparent' }}>
              <Icon name={t.icon} size={22} stroke={on ? ACCENT : C.muted} sw={on ? 1.9 : 1.6} />
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: on ? 600 : 500, color: on ? ACCENT : C.muted, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* detail sheet */}
      {detail && (
        <DetailSheet
          detail={detail}
          onSave={(note) => detail.save && detail.save(note)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
