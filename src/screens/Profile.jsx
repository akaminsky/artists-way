// tend — Profile & settings.
// Full-screen, reached from the account chip. A minimal settings-style page:
// grouped rows with hairline dividers (not shadowed cards). Edit your display
// name, set/pause your week (combined), copy the invite link, leave the circle,
// sign out.
import { useState } from 'react'
import { C, SERIF, SANS, MONO, ACCENT, ON_ACCENT } from '../lib/theme'
import { Icon, MonoLabel, Avatar } from '../components/primitives'
import { useAuth } from '../lib/auth'
import { useCohort } from '../lib/cohort'
import { isoDate, memberWeek, startedOnForWeek, TOTAL_WEEKS } from '../lib/week'
import { inviteUrl } from '../lib/invite'

const RED = '#B5645C'
const rowLabel = { fontFamily: SERIF, fontSize: 15.5, color: C.ink }
const rowValue = { fontFamily: SERIF, fontSize: 15, color: C.mid }
const accentText = { fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: ACCENT }

const Section = ({ title, children, footer }) => (
  <div style={{ marginTop: 24 }}>
    {title && <MonoLabel style={{ display: 'block', margin: '0 4px 8px' }}>{title}</MonoLabel>}
    <div style={{ background: C.card, border: `1px solid ${C.hair}`, borderRadius: 14, overflow: 'hidden' }}>
      {children}
    </div>
    {footer && (
      <p style={{ fontFamily: SERIF, fontSize: 12.5, fontStyle: 'italic', color: C.muted, margin: '8px 4px 0', lineHeight: 1.45 }}>{footer}</p>
    )}
  </div>
)

const Row = ({ children, onClick, first }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '13px 15px', borderTop: first ? 'none' : `1px solid ${C.hair}`,
    cursor: onClick ? 'pointer' : 'default', WebkitTapHighlightColor: 'transparent',
  }}>{children}</div>
)

export default function Profile({ onBack }) {
  const { profile, updateProfile, signOut, session } = useAuth()
  const { membership, cohort, updateMembership, leaveCohort } = useCohort()

  const [name, setName] = useState(profile?.display_name || '')
  const [nameSaved, setNameSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [busy, setBusy] = useState(false)

  const paused = Boolean(membership?.paused_at)
  const today = new Date()
  const week = memberWeek(membership?.started_on, membership?.paused_at)
  const dirty = Boolean(name.trim() && name.trim() !== (profile?.display_name || ''))

  const saveName = async () => {
    const n = name.trim()
    if (!n || busy) return
    setBusy(true)
    await updateProfile({ display_name: n, mono: n[0].toUpperCase() })
    setBusy(false)
    setNameSaved(true); setTimeout(() => setNameSaved(false), 1600)
  }

  // Set which week you're on by rewriting started_on, anchored to a Sunday so
  // program weeks stay aligned with the Sun–Sat calendar week.
  const setWeek = (n) => {
    if (n === week) return
    updateMembership({ started_on: startedOnForWeek(n, today) })
  }

  const pause = () => updateMembership({ paused_at: isoDate(today) })
  // Resume = re-anchor started_on so you land back on the week you froze at.
  const resume = () => updateMembership({ started_on: startedOnForWeek(week, today), paused_at: null })

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl(cohort.invite_code))
      setCopied(true); setTimeout(() => setCopied(false), 1600)
    } catch (e) { /* ignore */ }
  }

  const doLeave = async () => {
    setBusy(true)
    await leaveCohort()
    setBusy(false)
    onBack() // membership is gone → App falls back to Onboarding
  }

  const pausedSince = paused
    ? new Date(membership.paused_at + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : ''

  return (
    <div className="app-frame">
      {/* app bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top) + 14px) 18px 12px', flexShrink: 0 }}>
        <button onClick={onBack} aria-label="Back"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, margin: -6, display: 'flex' }}>
          <Icon name="chevL" size={22} stroke={C.mid} />
        </button>
        <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: C.ink }}>Profile & settings</span>
      </div>

      <div className="app-scroll" style={{ padding: '6px 20px 32px' }}>
        {/* identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
          <Avatar mono={(name || 'Y')[0].toUpperCase()} you size={48} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: C.ink }}>{profile?.display_name || 'You'}</div>
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{session?.user?.email}</div>
          </div>
        </div>

        {/* name */}
        <Section title="Name">
          <Row first>
            <input
              value={name} onChange={(e) => setName(e.target.value)} placeholder="what should the circle call you?" maxLength={40}
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', fontFamily: SERIF, fontSize: 15.5, color: C.ink, outline: 'none', padding: 0 }}
            />
            {nameSaved
              ? <span style={{ fontFamily: SANS, fontSize: 13, color: C.muted, flexShrink: 0 }}>Saved ✓</span>
              : dirty && (
                <button onClick={saveName} disabled={busy}
                  style={{ ...accentText, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Save</button>
              )}
          </Row>
        </Section>

        {/* week (set + pause combined) */}
        <Section title="Your week"
          footer={paused ? 'Resume to change your week.' : 'Sets which week’s exercises and artist date you see. Weeks run Sunday to Saturday.'}>
          <Row first>
            <span style={rowLabel}>{paused ? 'Frozen at' : 'Current week'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SmallStepper disabled={week <= 1 || paused} onClick={() => setWeek(week - 1)} icon="chevL" />
              <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 500, color: C.ink, minWidth: 62, textAlign: 'center' }}>Week {week}</span>
              <SmallStepper disabled={week >= TOTAL_WEEKS || paused} onClick={() => setWeek(week + 1)} icon="chevR" />
            </div>
          </Row>
          <Row onClick={paused ? resume : pause}>
            <span style={rowLabel}>{paused ? `Paused since ${pausedSince}` : 'Pause my weeks'}</span>
            <span style={accentText}>{paused ? 'Resume' : 'Pause'}</span>
          </Row>
        </Section>

        {/* circle */}
        <Section title="Circle">
          <Row first>
            <span style={rowLabel}>Circle</span>
            <span style={rowValue}>{cohort?.name}</span>
          </Row>
          <Row>
            <span style={rowLabel}>Invite code</span>
            <span style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.14em', color: ACCENT }}>{cohort?.invite_code}</span>
          </Row>
          <Row onClick={copyLink}>
            <span style={rowLabel}>Copy invite link</span>
            <span style={{ ...accentText, color: copied ? C.muted : ACCENT }}>{copied ? 'Copied ✓' : 'Copy'}</span>
          </Row>
        </Section>

        {/* account */}
        <Section title="Account">
          <Row first onClick={signOut}>
            <span style={rowLabel}>Sign out</span>
          </Row>
          {!confirmLeave ? (
            <Row onClick={() => setConfirmLeave(true)}>
              <span style={{ ...rowLabel, color: RED }}>Leave this circle</span>
            </Row>
          ) : (
            <div style={{ padding: '13px 15px', borderTop: `1px solid ${C.hair}` }}>
              <p style={{ fontFamily: SERIF, fontSize: 14.5, color: C.ink, margin: '0 0 11px', lineHeight: 1.5 }}>
                Leave <strong>{cohort?.name}</strong>? You can rejoin later with the invite code.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmLeave(false)} disabled={busy}
                  style={{ flex: 1, background: 'transparent', border: `1px solid ${C.hair}`, borderRadius: 12, padding: '11px', cursor: 'pointer', fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: C.mid }}>
                  Cancel
                </button>
                <button onClick={doLeave} disabled={busy}
                  style={{ flex: 1, background: RED, border: 'none', borderRadius: 12, padding: '11px', cursor: 'pointer', fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: ON_ACCENT, opacity: busy ? 0.6 : 1 }}>
                  Leave circle
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function SmallStepper({ disabled, onClick, icon }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        border: `1px solid ${C.edge}`, background: C.bg, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}>
      <Icon name={icon} size={17} stroke={ACCENT} sw={2} />
    </button>
  )
}
