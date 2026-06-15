// tend — app shell: app bar, screens, bottom tabs, detail sheet.
// Single device, full viewport (the design prototype showed four phones on a
// presentation stage; this is one real instance you install to the home screen).
import { useState, useEffect } from 'react'
import { C, SERIF, SANS, MONO, ACCENT } from './lib/theme'
import { Icon, Avatar } from './components/primitives'
import DetailSheet from './components/DetailSheet'
import Today from './screens/Today'
import Journey from './screens/Journey'
import Group from './screens/Group'
import Checkin from './screens/Checkin'
import Ideas from './screens/Ideas'
import SignIn from './screens/SignIn'
import Onboarding from './screens/Onboarding'
import Profile from './screens/Profile'
import { ME, WEEK } from './data/seed'
import { useAuth } from './lib/auth'
import { useCohort } from './lib/cohort'
import { useTracking } from './lib/tracking'
import { useNotes } from './lib/notes'
import { usePhotos } from './lib/photos'
import { inviteUrl } from './lib/invite'

const ME_KEY = 'tend.me.v2'

function loadMe() {
  try {
    const raw = localStorage.getItem(ME_KEY)
    if (raw) return { ...structuredClone(ME), ...JSON.parse(raw) }
  } catch (e) { /* ignore */ }
  return structuredClone(ME)
}

const TABS = [
  { id: 'today', label: 'Today',  icon: 'sun' },
  { id: 'group', label: 'Circle', icon: 'circle3' },
  { id: 'you',   label: 'You',    icon: 'sprout' },
]

// brand splash, shown while we resolve session / cohort
function Splash() {
  return (
    <div className="app-frame" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, color: C.muted }}>
        meraki<span style={{ color: ACCENT }}>.</span>
      </span>
    </div>
  )
}

export default function App() {
  const { configured, ready, session, profile, signOut } = useAuth()
  const { loading: cohortLoading, hasCohort, cohort } = useCohort()
  const track = useTracking()
  const notes = useNotes()
  const photos = usePhotos()
  const [me, setMe] = useState(loadMe)
  const [tab, setTab] = useState('today')
  const [detail, setDetail] = useState(null)
  const [acct, setAcct] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showCheckin, setShowCheckin] = useState(false)
  const [showIdeas, setShowIdeas] = useState(false)

  const openCheckin = () => setShowCheckin(true)
  const openIdeas = () => setShowIdeas(true)
  const goToYou = () => setTab('you')
  // picking an idea fills this week's Artist Date plan, then closes the picker
  const pickIdea = (idea) => {
    if (track.ready) track.saveArtistPlan(idea.title)
    else setMe((m) => ({ ...m, artistDate: { ...m.artistDate, plan: idea.title } }))
    setShowIdeas(false)
  }
  const copyInvite = async () => {
    if (!cohort) return
    try { await navigator.clipboard.writeText(inviteUrl(cohort.invite_code)); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch (e) { /* ignore */ }
  }

  // persist my data locally (the tracking screens move to the backend next;
  // for now their state still lives here so the app keeps working).
  useEffect(() => {
    try { localStorage.setItem(ME_KEY, JSON.stringify(me)) } catch (e) { /* ignore */ }
  }, [me])

  // Gates (only when a Supabase project is configured; otherwise the app runs
  // in the original local-only prototype mode).
  //   no session            → sign in
  //   session, no circle    → create or join a circle
  //   session + circle      → the app
  if (configured && !ready) return <Splash />
  if (configured && !session) return <SignIn />
  if (configured && cohortLoading) return <Splash />
  if (configured && !hasCohort) return <Onboarding />
  if (configured && showProfile) return <Profile onBack={() => setShowProfile(false)} />
  if (configured && showCheckin) return <Checkin me={me} setMe={setMe} track={track} onClose={() => setShowCheckin(false)} />
  if (showIdeas) return (
    <div className="app-frame">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top) + 14px) 18px 4px', flexShrink: 0 }}>
        <button onClick={() => setShowIdeas(false)} aria-label="Back"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, margin: -6, display: 'flex' }}>
          <Icon name="chevL" size={22} stroke={C.mid} />
        </button>
        <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: C.ink }}>Ideas</span>
      </div>
      <div className="app-scroll">
        <Ideas me={me} setMe={setMe} onPick={pickIdea} />
      </div>
    </div>
  )

  // Display name for the account chip: real profile when signed in, else "you".
  const myName = profile?.display_name || ME.name
  const myMono = profile?.mono || (myName ? myName[0].toUpperCase() : 'R')
  // Your real derived week (honors pause); falls back to the seed in prototype mode.
  const myWeek = track.ready ? track.week : WEEK.n

  return (
    <div className="app-frame">
      {/* app bar (sits below the OS status bar via safe-area inset) */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(env(safe-area-inset-top) + 14px) 22px 12px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>
          meraki<span style={{ color: ACCENT }}>.</span>
        </span>
        {/* Right cluster: the week pill (your week — only on your own screens;
            on Circle each person shows their own week per card) + account chip. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          {tab !== 'group' && (
            <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.mid, background: C.inset, borderRadius: 8, padding: '5px 9px', whiteSpace: 'nowrap' }}>
              Week {myWeek} / {WEEK.total}
            </span>
          )}
          {configured && (
            <button onClick={() => setAcct((v) => !v)} aria-label="Account"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', display: 'flex' }}>
              <Avatar mono={myMono} you size={30} />
            </button>
          )}
          {acct && (
            <>
              {/* tap-away backdrop */}
              <div onClick={() => setAcct(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 41, minWidth: 180,
                background: C.card, border: `1px solid ${C.edge}`, borderRadius: 14,
                boxShadow: '0 10px 30px rgba(28,24,20,0.14)', padding: 14,
              }}>
                {/* identity */}
                <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: C.ink }}>{myName}</div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session?.user?.email}
                </div>
                {cohort && (
                  <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, marginTop: 2 }}>in {cohort.name}</div>
                )}
                {/* menu — uniform rows */}
                <div style={{ marginTop: 12, paddingTop: 6, borderTop: `1px solid ${C.hair}`, display: 'flex', flexDirection: 'column' }}>
                  {[
                    { key: 'profile', label: 'Profile & settings', onClick: () => { setAcct(false); setShowProfile(true) } },
                    cohort && { key: 'invite', label: copied ? 'Invite link copied ✓' : 'Copy invite link', onClick: copyInvite },
                    { key: 'signout', label: 'Sign out', onClick: () => { setAcct(false); signOut() } },
                  ].filter(Boolean).map((item) => (
                    <button key={item.key} onClick={item.onClick}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '9px 0', cursor: 'pointer',
                        fontFamily: SERIF, fontSize: 14.5, color: C.ink, WebkitTapHighlightColor: 'transparent' }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* scroll content */}
      <div className="app-scroll">
        {tab === 'today' && <Today me={me} setMe={setMe} track={track} notes={notes} photos={photos} name={myName} openDetail={setDetail} openCheckin={openCheckin} openIdeas={openIdeas} />}
        {tab === 'you' && <Journey me={me} setMe={setMe} notes={notes} photos={photos} openDetail={setDetail} />}
        {tab === 'group' && <Group me={me} openCheckin={openCheckin} goToYou={goToYou} />}
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
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: on ? 600 : 500, color: on ? ACCENT : C.muted, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                {t.id === 'today' ? `Week ${myWeek}` : t.label}
              </span>
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
