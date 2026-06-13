// tend — magic-link sign-in.
// Shown only when Supabase is configured and there is no session. One field,
// one tap on the emailed link, then the session persists basically forever.
import { useState } from 'react'
import { C, SERIF, SANS, MONO, ACCENT } from '../lib/theme'
import { useAuth } from '../lib/auth'

export default function SignIn() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  async function send(e) {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true); setError('')
    try {
      const { error } = await signIn(email.trim())
      if (error) setError(error.message)
      else setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-frame" style={{ justifyContent: 'center' }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 30px', maxWidth: 440, width: '100%', margin: '0 auto',
      }}>
        <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>
          meraki<span style={{ color: ACCENT }}>.</span>
        </span>

        {!sent ? (
          <>
            <p style={{ fontFamily: SERIF, fontSize: 16.5, fontStyle: 'italic', color: C.mid, lineHeight: 1.55, margin: '14px 0 16px' }}>
              A Greek word for doing something with soul, creativity, or love —
              putting a piece of yourself into your work, and acting with passion
              and devotion.
            </p>
            <p style={{ fontFamily: SERIF, fontSize: 16.5, fontStyle: 'italic', color: C.mid, lineHeight: 1.55, margin: '0 0 30px' }}>
              That’s the spirit of twelve weeks of The Artist’s Way, walked
              together. Enter your email and we’ll send a link to sign in — no
              password to remember.
            </p>

            <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="email" inputMode="email" autoComplete="email" autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={{
                  width: '100%', background: C.card, border: `1px solid ${C.edge}`, borderRadius: 14,
                  padding: '15px 16px', fontFamily: SERIF, fontSize: 17, color: C.ink, outline: 'none',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                }}
              />
              <button
                type="submit" disabled={!valid || busy}
                style={{
                  width: '100%', border: 'none', borderRadius: 14, padding: '15px',
                  background: ACCENT, color: C.card, fontFamily: SERIF, fontSize: 16.5, fontWeight: 500,
                  cursor: valid && !busy ? 'pointer' : 'default', opacity: valid && !busy ? 1 : 0.5,
                  transition: 'opacity 0.2s ease', boxShadow: '0 6px 16px rgba(138,94,126,0.22)',
                }}>
                {busy ? 'Sending…' : 'Send me a link'}
              </button>
              {error && (
                <span style={{ fontFamily: SANS, fontSize: 13, color: '#B5645C', textAlign: 'center' }}>{error}</span>
              )}
            </form>
          </>
        ) : (
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT }}>
              Check your email
            </span>
            <p style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, lineHeight: 1.55, margin: 0 }}>
              We sent a sign-in link to <strong style={{ fontWeight: 600 }}>{email.trim()}</strong>.
              Open it on this device and you’re in.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              style={{ alignSelf: 'flex-start', marginTop: 4, background: 'none', border: 'none', padding: 0,
                fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: C.mid, cursor: 'pointer' }}>
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
