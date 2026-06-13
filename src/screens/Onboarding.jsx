// tend — first run after sign-in, when you're not in a circle yet.
// Two doors: start a circle (you get a link to share) or join one (paste the
// code, or it's pre-filled from an invite link). Same warm, centered language
// as the sign-in screen.
import { useState } from 'react'
import { C, SERIF, SANS, MONO, ACCENT, ACCENT_SOFT } from '../lib/theme'
import { useCohort } from '../lib/cohort'
import { getPendingInvite, clearPendingInvite, inviteUrl } from '../lib/invite'

const field = {
  width: '100%', background: C.card, border: `1px solid ${C.edge}`, borderRadius: 14,
  padding: '15px 16px', fontFamily: SERIF, fontSize: 17, color: C.ink, outline: 'none',
  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', boxSizing: 'border-box',
}
const primaryBtn = (enabled) => ({
  width: '100%', border: 'none', borderRadius: 14, padding: '15px',
  background: ACCENT, color: C.card, fontFamily: SERIF, fontSize: 16.5, fontWeight: 500,
  cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.5,
  transition: 'opacity 0.2s ease', boxShadow: '0 6px 16px rgba(138,94,126,0.22)',
})
const linkBtn = {
  alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0,
  fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: C.mid, cursor: 'pointer',
}

export default function Onboarding() {
  const { createCohort, joinCohort, refresh } = useCohort()
  const pending = getPendingInvite()

  // If an invite code is waiting, drop straight into the join door.
  const [mode, setMode] = useState(pending ? 'join' : 'choose') // choose | create | join | created
  const [name, setName] = useState('')
  const [code, setCode] = useState(pending || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null) // the new cohort row
  const [copied, setCopied] = useState(false)

  function friendlyError(err) {
    const m = (err?.message || '').toLowerCase()
    if (m.includes('invalid_code')) return "That code didn't match a circle. Check it and try again."
    if (m.includes('not_authenticated')) return 'Please sign in again.'
    if (m.includes('duplicate') || m.includes('unique')) return "You're already in this circle."
    return err?.message || 'Something went wrong.'
  }

  async function doCreate(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const cohort = await createCohort(name.trim())
      setCreated(cohort)
      setMode('created')
    } catch (err) {
      setError(friendlyError(err))
    } finally { setBusy(false) }
  }

  async function doJoin(e) {
    e.preventDefault()
    if (busy || !code.trim()) return
    setBusy(true); setError('')
    try {
      await joinCohort(code.trim())
      clearPendingInvite()
      await refresh() // membership now exists → App swaps to the main tabs
    } catch (err) {
      setError(friendlyError(err))
      setBusy(false) // stay on screen to retry
    }
  }

  async function enterApp() {
    clearPendingInvite()
    await refresh()
  }

  async function copyLink() {
    const url = inviteUrl(created.invite_code)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (e) { /* clipboard blocked; the link is shown to copy by hand */ }
  }

  return (
    <div className="app-frame" style={{ justifyContent: 'center' }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 30px', maxWidth: 440, width: '100%', margin: '0 auto',
      }}>
        <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>
          tend<span style={{ color: ACCENT }}>.</span>
        </span>

        {/* ── Choose a door ─────────────────────────────── */}
        {mode === 'choose' && (
          <>
            <p style={{ fontFamily: SERIF, fontSize: 16.5, fontStyle: 'italic', color: C.mid, lineHeight: 1.5, margin: '14px 0 28px' }}>
              You're in. Start your circle and invite the others, or join the one
              a friend already started.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => { setMode('create'); setError('') }} style={primaryBtn(true)}>
                Start a circle
              </button>
              <button onClick={() => { setMode('join'); setError('') }}
                style={{
                  width: '100%', border: `1px solid ${C.edge}`, borderRadius: 14, padding: '15px',
                  background: C.card, color: C.ink, fontFamily: SERIF, fontSize: 16.5, fontWeight: 500, cursor: 'pointer',
                }}>
                Join a circle
              </button>
            </div>
          </>
        )}

        {/* ── Create ────────────────────────────────────── */}
        {mode === 'create' && (
          <>
            <p style={{ fontFamily: SERIF, fontSize: 16.5, fontStyle: 'italic', color: C.mid, lineHeight: 1.5, margin: '14px 0 26px' }}>
              Name your circle. You can call it anything — your names, an inside
              joke, the season you're starting in.
            </p>
            <form onSubmit={doCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                autoFocus value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Our Circle" maxLength={60} style={field}
              />
              <button type="submit" disabled={busy} style={primaryBtn(!busy)}>
                {busy ? 'Creating…' : 'Create circle'}
              </button>
              {error && <span style={{ fontFamily: SANS, fontSize: 13, color: '#B5645C', textAlign: 'center' }}>{error}</span>}
            </form>
            <button onClick={() => { setMode('choose'); setError('') }} style={{ ...linkBtn, marginTop: 16 }}>
              ← Back
            </button>
          </>
        )}

        {/* ── Join ──────────────────────────────────────── */}
        {mode === 'join' && (
          <>
            <p style={{ fontFamily: SERIF, fontSize: 16.5, fontStyle: 'italic', color: C.mid, lineHeight: 1.5, margin: '14px 0 26px' }}>
              {pending
                ? 'You were invited to a circle. Tap to join.'
                : 'Enter the invite code a friend shared with you.'}
            </p>
            <form onSubmit={doJoin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                autoFocus={!pending} value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC234" autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                style={{ ...field, fontFamily: MONO, fontSize: 20, letterSpacing: '0.18em', textAlign: 'center' }}
              />
              <button type="submit" disabled={busy || !code.trim()} style={primaryBtn(!busy && !!code.trim())}>
                {busy ? 'Joining…' : 'Join circle'}
              </button>
              {error && <span style={{ fontFamily: SANS, fontSize: 13, color: '#B5645C', textAlign: 'center' }}>{error}</span>}
            </form>
            <button onClick={() => { setMode('choose'); setError(''); clearPendingInvite() }} style={{ ...linkBtn, marginTop: 16 }}>
              ← Back
            </button>
          </>
        )}

        {/* ── Created: share the link ───────────────────── */}
        {mode === 'created' && created && (
          <>
            <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, display: 'block', marginTop: 22 }}>
              {created.name}
            </span>
            <p style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, lineHeight: 1.55, margin: '10px 0 22px' }}>
              Your circle is ready. Share this link with the others — opening it
              drops them straight in.
            </p>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: 4, background: ACCENT_SOFT,
              border: `1px solid ${C.edge}`, borderRadius: 14, padding: '14px 16px', marginBottom: 14,
            }}>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>
                Invite code
              </span>
              <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.2em', color: ACCENT, fontWeight: 500 }}>
                {created.invite_code}
              </span>
            </div>

            <button onClick={copyLink} style={{ ...primaryBtn(true), marginBottom: 10 }}>
              {copied ? 'Link copied ✓' : 'Copy invite link'}
            </button>
            <button onClick={enterApp} style={{ ...linkBtn, alignSelf: 'center', fontSize: 15 }}>
              Continue to tend →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
