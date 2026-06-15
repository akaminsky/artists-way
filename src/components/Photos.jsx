// meraki — photo thumbnails + a lightbox viewer, shared by Week / You / Circle.
// Owner mode (pass onToggleShare + onDelete) shows share/delete in the viewer and,
// with onAdd, an "add photo" tile. Read-only mode (omit them) just shows + enlarges
// — used for other people's shared photos on the Circle tab.
import { useRef, useState } from 'react'
import { C, SERIF, MONO, ACCENT } from '../lib/theme'
import { Icon } from './primitives'

export function PhotoStrip({ photos = [], onAdd, onToggleShare, onDelete, size = 72 }) {
  const fileRef = useRef(null)
  const [openId, setOpenId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const canAdd = Boolean(onAdd)
  const owner = Boolean(onToggleShare || onDelete)
  const open = photos.find((p) => p.id === openId) || null

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setUploading(true)
    try { await onAdd(file) } finally { setUploading(false) }
  }

  const tile = { width: size, height: size, borderRadius: 12, flexShrink: 0, objectFit: 'cover', display: 'block' }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((p) => (
          <button key={p.id} onClick={() => setOpenId(p.id)}
            style={{ position: 'relative', padding: 0, border: 'none', background: C.inset, borderRadius: 12, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            {p.url
              ? <img src={p.url} alt="" style={tile} />
              : <div style={{ ...tile, background: C.inset }} />}
            {p.shared && (
              <span style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '1px 6px',
                fontFamily: MONO, fontSize: 8, fontWeight: 600, letterSpacing: '0.06em', color: ACCENT }}>SHARED</span>
            )}
          </button>
        ))}

        {canAdd && (
          <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading}
            style={{ width: size, height: size, borderRadius: 12, flexShrink: 0, border: `1px dashed ${C.edge}`, background: C.bg,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              cursor: uploading ? 'default' : 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <Icon name={uploading ? 'image' : 'plus'} size={18} stroke={C.muted} />
            <span style={{ fontFamily: SERIF, fontSize: 11.5, fontStyle: 'italic', color: C.muted }}>{uploading ? 'adding…' : 'add'}</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
      </div>

      {open && (
        <div onClick={() => setOpenId(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(28,24,20,0.82)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {open.url && (
              <img src={open.url} alt="" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 14 }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {owner && onToggleShare && (
                <button onClick={() => onToggleShare(open.id)}
                  style={{ border: 'none', borderRadius: 11, padding: '10px 16px', cursor: 'pointer',
                    background: open.shared ? 'rgba(255,255,255,0.16)' : ACCENT, color: open.shared ? '#FBF6EB' : '#FBF6EB',
                    fontFamily: SERIF, fontSize: 14.5, fontWeight: 500, WebkitTapHighlightColor: 'transparent' }}>
                  {open.shared ? 'Shared with the circle ✓ · tap to make private' : 'Share with the circle'}
                </button>
              )}
              {owner && onDelete && (
                <button onClick={() => { onDelete(open.id); setOpenId(null) }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: '#E7B7B1', WebkitTapHighlightColor: 'transparent' }}>
                  Delete
                </button>
              )}
              <button onClick={() => setOpenId(null)} aria-label="Close"
                style={{ marginLeft: owner && onDelete ? 0 : 'auto', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                <Icon name="x" size={22} stroke="#FBF6EB" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
