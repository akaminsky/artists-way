// tend — Profile & settings.
// Full-screen, reached from the account chip. Edit your display name, set which
// week you're on, pause/resume the program (week stops advancing while paused —
// e.g. a vacation), copy the invite link, and leave the circle.
import { useState } from 'react'
import { C, SERIF, SANS, MONO, ACCENT, ACCENT_SOFT } from '../lib/theme'
import { Icon, MonoLabel, Avatar } from '../components/primitives'
import { useAuth } from '../lib/auth'
import { useCohort } from '../lib/cohort'
import { isoDate, addDays, memberWeek, TOTAL_WEEKS } from '../lib/week'
import { inviteUrl } from '../lib/invite'

const RED = '#B5645C'

const card = {
  background: C.card, borderRadius: 14, padding: 18,
  boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
}

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
  const refDate = paused ? new Date(membership.paused_at + 'T00:00:00') : today
  const week = memberWeek(membership?.started_on, membership?.paused_at)

  const saveName = async () => {
    const n = name.trim()
    if (!n || busy) return
    setBusy(true)
    await updateProfile({ display_name: n, mono: n[0].toUpperCase() })
    setBusy(false)
    setNameSaved(true); setTimeout(() => setNameSaved(false), 1600)
  }

  // Set which week you're on by rewriting started_on relative to the reference
  // date (today, or the pause date while paused).
  const setWeek = (n) => {
    const clamped = Math.min(TOTAL_WEEKS, Math.max(1, n))
    if (clamped === week) return
    updateMembership({ started_on: isoDate(addDays(refDate, -(clamped - 1) * 7)) })
  }

  const pause = () => updateMembership({ paused_at: isoDate(today) })

  const resume = () => {
    const todayMid = new Date(isoDate(today) + 'T00:00:00')
    const pausedDate = new Date(membership.paused_at + 'T00:00:00')
    const daysPaused = Math.max(0, Math.round((todayMid - pausedDate) / 86400000))
    const newStart = isoDate(addDays(new Date(membership.started_on + 'T00:00:00'), daysPaused))
    updateMembership({ started_on: newStart, paused_at: null })
  }

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

  const SectionLabel = ({ children }) => (
    <MonoLabel style={{ display: 'block', margin: '22px 2px 10px' }}>{children}</MonoLabel>
  )

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <Avatar mono={(name || 'Y')[0].toUpperCase()} you size={48} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: C.ink }}>{profile?.display_name || 'You'}</div>
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{session?.user?.email}</div>
          </div>
        </div>

        {/* name */}
        <SectionLabel>Your name</SectionLabel>
        <div style={card}>
          <input
            value={name} onChange={(e) => setName(e.target.value)} placeholder="what should the circle call you?" maxLength={40}
            style={{ width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.hair}`, borderRadius: 11, padding: '12px 14px', fontFamily: SERIF, fontSize: 16.5, color: C.ink, outline: 'none' }}
          />
          <button onClick={saveName} disabled={busy || !name.trim() || name.trim() === profile?.display_name}
            style={{ marginTop: 12, width: '100%', border: 'none', borderRadius: 12, padding: '12px', background: ACCENT, color: C.card, fontFamily: SERIF, fontSize: 15.5, fontWeight: 500,
              cursor: 'pointer', opacity: (busy || !name.trim() || name.trim() === profile?.display_name) ? 0.5 : 1 }}>
            {nameSaved ? 'Saved ✓' : 'Save name'}
          </button>
        </div>

        {/* week */}
        <SectionLabel>Which week are you on?</SectionLabel>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Stepper disabled={week <= 1 || paused} onClick={() => setWeek(week - 1)} icon="chevL" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, color: C.ink }}>Week {week}</div>
              <MonoLabel style={{ display: 'block', marginTop: 2 }}>of {TOTAL_WEEKS}</MonoLabel>
            </div>
            <Stepper disabled={week >= TOTAL_WEEKS || paused} onClick={() => setWeek(week + 1)} icon="chevR" />
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 13.5, fontStyle: 'italic', color: C.muted, margin: '14px 0 0', lineHeight: 1.45, textAlign: 'center' }}>
            {paused ? 'Resume to change your week.' : 'Sets which week’s exercises and artist date you see.'}
          </p>
        </div>

        {/* pause */}
        <SectionLabel>Taking a break?</SectionLabel>
        <div style={card}>
          {!paused ? (
            <>
              <p style={{ fontFamily: SERIF, fontSize: 15, color: C.ink, margin: '0 0 4px', lineHeight: 1.5 }}>
                Going away for a bit? Pause and your week won’t advance until you’re back.
              </p>
              <button onClick={pause}
                style={{ marginTop: 12, width: '100%', border: `1px solid ${C.edge}`, borderRadius: 12, padding: '12px', background: C.bg, color: C.ink, fontFamily: SERIF, fontSize: 15.5, fontWeight: 500, cursor: 'pointer' }}>
                Pause my weeks
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: ACCENT_SOFT, borderRadius: 9, padding: '6px 10px' }}>
                <Icon name="moon" size={15} stroke={ACCENT} />
                <span style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: ACCENT }}>Paused since {pausedSince} — frozen at week {week}</span>
              </div>
              <button onClick={resume}
                style={{ marginTop: 14, width: '100%', border: 'none', borderRadius: 12, padding: '12px', background: ACCENT, color: C.card, fontFamily: SERIF, fontSize: 15.5, fontWeight: 500, cursor: 'pointer' }}>
                Resume
              </button>
            </>
          )}
        </div>

        {/* circle */}
        <SectionLabel>Your circle</SectionLabel>
        <div style={card}>
          <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 500, color: C.ink }}>{cohort?.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <MonoLabel>Invite code</MonoLabel>
            <span style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.14em', color: ACCENT }}>{cohort?.invite_code}</span>
          </div>
          <button onClick={copyLink}
            style={{ marginTop: 12, width: '100%', border: `1px solid ${C.edge}`, borderRadius: 12, padding: '12px', background: C.bg, color: C.ink, fontFamily: SERIF, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            {copied ? 'Link copied ✓' : 'Copy invite link'}
          </button>
        </div>

        {/* danger zone */}
        <SectionLabel>Leaving</SectionLabel>
        <div style={card}>
          {!confirmLeave ? (
            <button onClick={() => setConfirmLeave(true)}
              style={{ width: '100%', background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: RED, textAlign: 'left' }}>
              Leave this circle
            </button>
          ) : (
            <>
              <p style={{ fontFamily: SERIF, fontSize: 15, color: C.ink, margin: '0 0 12px', lineHeight: 1.5 }}>
                Leave <strong>{cohort?.name}</strong>? You can rejoin later with the invite code.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmLeave(false)} disabled={busy}
                  style={{ flex: 1, background: 'transparent', border: `1px solid ${C.hair}`, borderRadius: 12, padding: '12px', cursor: 'pointer', fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: C.mid }}>
                  Cancel
                </button>
                <button onClick={doLeave} disabled={busy}
                  style={{ flex: 1, background: RED, border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer', fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: C.card, opacity: busy ? 0.6 : 1 }}>
                  Leave circle
                </button>
              </div>
            </>
          )}
        </div>

        {/* sign out */}
        <button onClick={signOut}
          style={{ marginTop: 22, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SERIF, fontSize: 14.5, fontStyle: 'italic', color: C.mid }}>
          Sign out
        </button>
      </div>
    </div>
  )
}

function Stepper({ disabled, onClick, icon }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        border: `1px solid ${C.edge}`, background: C.bg, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}>
      <Icon name={icon} size={20} stroke={ACCENT} sw={2} />
    </button>
  )
}
