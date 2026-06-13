// tend — Screen 5: Artist Date ideas (your backlog + the shared well)
import { useState } from 'react'
import { C, SERIF, SANS, MONO, ACCENT, ACCENT_SOFT } from '../lib/theme'
import { Icon, Checkbox, MonoLabel } from '../components/primitives'
import { IDEAS, IDEA_CATEGORIES, IDEA_COSTS, IDEA_SETTINGS, IDEA_SOCIAL } from '../data/seed'
import { useIdeas } from '../lib/ideas'

const EMPTY_DRAFT = { title: '', category: 'Nature', cost: 'Free', setting: 'Indoor', social: 'Solo', shared: true }

// Local prototype → the same unified idea shape the backend hook returns.
function localIdeas(me) {
  return [...me.addedIdeas, ...IDEAS].map((i) => ({
    id: i.id, title: i.title,
    createdByYou: i.by === 'you', by: i.by,
    shared: i.shared !== false,
    tags: i.tags,
    saved: !!me.ideas[i.id]?.saved,
    done: !!me.ideas[i.id]?.done,
  }))
}

export default function Ideas({ me, setMe, onPick }) {
  const api = useIdeas()
  const backend = api.ready

  const [view, setView] = useState('mine')   // 'mine' (your ideas) | 'shared' (the group's pool)
  const [filter, setFilter] = useState('All')
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  const ideas = backend ? api.ideas : localIdeas(me)

  const toggleSave = backend
    ? api.toggleSave
    : (id) => setMe((m) => ({ ...m, ideas: { ...m.ideas, [id]: { ...(m.ideas[id] || {}), saved: !m.ideas[id]?.saved } } }))
  const toggleDone = backend
    ? api.toggleDone
    : (id) => setMe((m) => ({ ...m, ideas: { ...m.ideas, [id]: { ...(m.ideas[id] || {}), done: !m.ideas[id]?.done } } }))

  const saveDraft = () => {
    if (!draft.title.trim()) return
    if (backend) {
      api.addIdea(draft)
    } else {
      const id = 'u' + Date.now()
      const idea = { id, title: draft.title.trim(), by: 'you', shared: draft.shared, tags: { category: draft.category, cost: draft.cost, setting: draft.setting, social: draft.social } }
      setMe((m) => ({ ...m, addedIdeas: [idea, ...m.addedIdeas], ideas: { ...m.ideas, [id]: { saved: true, done: false } } }))
    }
    setDraft(EMPTY_DRAFT)
    setComposing(false)
    setView('mine')
  }

  const base = view === 'mine' ? ideas.filter((i) => i.saved) : ideas.filter((i) => i.shared)
  const list = (filter === 'All' ? base : base.filter((i) => i.tags.category === filter))
    .slice()
    // done ones sink to the bottom
    .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))

  // ── small inline pieces (no text inputs inside → safe to define here) ──
  const Card = ({ children, style = {} }) => (
    <div style={{
      background: C.card, borderRadius: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
      padding: '16px', ...style,
    }}>{children}</div>
  )

  const Pill = ({ on, onClick, children }) => (
    <button onClick={onClick} style={{
      fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: 'pointer',
      padding: '7px 13px', borderRadius: 12, whiteSpace: 'nowrap',
      background: on ? ACCENT_SOFT : C.card,
      border: `1.5px solid ${on ? ACCENT : C.hair}`,
      color: on ? ACCENT : C.mid, transition: 'all 0.18s ease', WebkitTapHighlightColor: 'transparent',
    }}>{children}</button>
  )

  const TagGroup = ({ label, options, value, onChange }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <MonoLabel>{label}</MonoLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {options.map((o) => <Pill key={o} on={value === o} onClick={() => onChange(o)}>{o}</Pill>)}
      </div>
    </div>
  )

  const IdeaCard = ({ idea }) => {
    const { done, saved } = idea
    const { category, cost, setting, social } = idea.tags
    return (
      <Card style={{ opacity: done ? 0.62 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Checkbox checked={done} onClick={() => toggleDone(idea.id)} size={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: SERIF, fontSize: 16.5, fontWeight: 500, lineHeight: 1.35, color: done ? C.muted : C.ink, textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(154,145,131,0.6)' }}>
              {idea.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 8px', marginTop: 8 }}>
              <MonoLabel>{category} · {cost} · {setting} · {social}</MonoLabel>
            </div>
            <div style={{ marginTop: 7 }}>
              {idea.createdByYou
                ? <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: ACCENT }}>your idea</span>
                : <span style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.muted }}>from {idea.by}</span>}
            </div>
          </div>
          <button onClick={() => toggleSave(idea.id)} title={saved ? 'Saved' : 'Save to your backlog'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, margin: -6, flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
            <Icon name="bookmark" size={20} stroke={saved ? ACCENT : C.muted} fill={saved ? ACCENT : 'none'} sw={1.7} />
          </button>
        </div>
        {onPick && (
          <button onClick={() => onPick(idea)}
            style={{ marginTop: 12, width: '100%', border: `1px solid ${ACCENT}`, borderRadius: 11, padding: '10px',
              background: ACCENT_SOFT, color: ACCENT, fontFamily: SERIF, fontSize: 14.5, fontWeight: 500, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            Use for this week
          </button>
        )}
      </Card>
    )
  }

  const Toggle = ({ id, children }) => {
    const on = view === id
    return (
      <button onClick={() => setView(id)} style={{
        flex: 1, cursor: 'pointer', borderRadius: 9, border: 'none', padding: '9px 0',
        background: on ? C.card : 'transparent',
        boxShadow: on ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
        fontFamily: SANS, fontSize: 13.5, fontWeight: on ? 600 : 500,
        color: on ? C.ink : C.mid, transition: 'all 0.18s ease', WebkitTapHighlightColor: 'transparent',
      }}>{children}</button>
    )
  }

  return (
    <div style={{ padding: '6px 20px 24px' }}>
      {/* title */}
      <div style={{ padding: '6px 2px 16px' }}>
        <MonoLabel>Artist dates · the library</MonoLabel>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 500, color: C.ink, lineHeight: 1.2, margin: '8px 0 0' }}>
          Ideas to draw from
        </h1>
        <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.mid, marginTop: 6 }}>
          Keep what calls to you. Share what you love.
        </p>
      </div>

      {/* Saved / The well toggle */}
      <div style={{ display: 'flex', background: C.inset, borderRadius: 12, padding: 4, gap: 4, marginBottom: 14 }}>
        <Toggle id="mine">Mine</Toggle>
        <Toggle id="shared">Shared</Toggle>
      </div>

      {/* category filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {['All', ...IDEA_CATEGORIES].map((c) => <Pill key={c} on={filter === c} onClick={() => setFilter(c)}>{c}</Pill>)}
      </div>

      {/* add an idea */}
      {!composing ? (
        <button onClick={() => setComposing(true)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'transparent', border: `1.5px dashed ${C.edge}`, borderRadius: 14, padding: '14px',
          cursor: 'pointer', marginBottom: 16, WebkitTapHighlightColor: 'transparent',
        }}>
          <Icon name="plus" size={17} stroke={ACCENT} sw={1.9} />
          <span style={{ fontFamily: SERIF, fontSize: 15.5, fontWeight: 500, color: ACCENT }}>Add an idea</span>
        </button>
      ) : (
        /* plain div (not the inline <Card> component) so the text input below
           keeps focus while typing */
        <div style={{
          background: C.card, borderRadius: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
          padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <input
            autoFocus value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="what's the outing?"
            style={{ width: '100%', background: C.bg, border: `1px solid ${C.hair}`, borderRadius: 11, padding: '12px 14px', fontFamily: SERIF, fontSize: 16.5, color: C.ink, outline: 'none' }}
          />
          <TagGroup label="Category" options={IDEA_CATEGORIES} value={draft.category} onChange={(v) => setDraft((d) => ({ ...d, category: v }))} />
          <TagGroup label="Cost" options={IDEA_COSTS} value={draft.cost} onChange={(v) => setDraft((d) => ({ ...d, cost: v }))} />
          <TagGroup label="Setting" options={IDEA_SETTINGS} value={draft.setting} onChange={(v) => setDraft((d) => ({ ...d, setting: v }))} />
          <TagGroup label="On your own / together" options={IDEA_SOCIAL} value={draft.social} onChange={(v) => setDraft((d) => ({ ...d, social: v }))} />

          <button onClick={() => setDraft((d) => ({ ...d, shared: !d.shared }))}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, WebkitTapHighlightColor: 'transparent' }}>
            <Checkbox checked={draft.shared} onClick={() => setDraft((d) => ({ ...d, shared: !d.shared }))} size={22} />
            <span style={{ fontFamily: SERIF, fontSize: 15, color: C.ink }}>Share with the circle</span>
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setComposing(false); setDraft(EMPTY_DRAFT) }}
              style={{ flex: 1, background: 'transparent', border: `1px solid ${C.hair}`, borderRadius: 12, padding: '12px', cursor: 'pointer', fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: C.mid }}>
              Cancel
            </button>
            <button onClick={saveDraft} disabled={!draft.title.trim()}
              style={{ flex: 1, background: ACCENT, border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer', fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: C.card, opacity: draft.title.trim() ? 1 : 0.5 }}>
              Keep it
            </button>
          </div>
        </div>
      )}

      {/* list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.length === 0 && (
          <Card>
            <p style={{ fontFamily: SERIF, fontSize: 14.5, fontStyle: 'italic', color: C.muted, textAlign: 'center' }}>
              {view === 'mine' ? 'Nothing here yet — bookmark shared ideas, or add your own.' : 'No shared ideas yet.'}
            </p>
          </Card>
        )}
        {list.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
      </div>
    </div>
  )
}
