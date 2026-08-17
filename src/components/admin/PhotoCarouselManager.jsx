import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

/** "Título" and "Etiqueta" are stored on the wire as one "Título|Etiqueta"
 *  caption — the carousel components split on the pipe — but the admin edits
 *  them as two plain fields instead of asking anyone to type the pipe. */
function splitCaption(caption) {
  const [title = '', badge = ''] = (caption || '').split('|')
  return { title: title.trim(), badge: badge.trim() }
}
function joinCaption(title, badge) {
  const t = title.trim(), b = badge.trim()
  return b ? `${t}|${b}` : t
}

const DEFAULT_FOCAL = '50% 50%'
const FOCAL_POINTS = [
  { value: '0% 0%',     label: 'Arriba a la izquierda' },
  { value: '50% 0%',    label: 'Arriba al centro' },
  { value: '100% 0%',   label: 'Arriba a la derecha' },
  { value: '0% 50%',    label: 'Centro a la izquierda' },
  { value: DEFAULT_FOCAL, label: 'Centro' },
  { value: '100% 50%',  label: 'Centro a la derecha' },
  { value: '0% 100%',   label: 'Abajo a la izquierda' },
  { value: '50% 100%',  label: 'Abajo al centro' },
  { value: '100% 100%', label: 'Abajo a la derecha' },
]

/**
 * Which part of the photo survives the crop. The carousel always fills its
 * box with `object-fit: cover`, so a subject off-center gets cut off unless
 * something can move the visible window — this is that something, plus a
 * live preview at the carousel's real aspect ratio.
 */
function FocalPointField({ url, value, onChange, aspectRatio }) {
  const preview = normalizeImageUrl(url)
  const current = value || DEFAULT_FOCAL

  return (
    <div className="form-field">
      <label className="form-label">Encuadre de la foto</label>
      <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {preview && (
          <div style={{
            width: 150, aspectRatio, borderRadius: 4, overflow: 'hidden',
            flexShrink: 0, background: 'var(--color-neutral-200)',
          }}>
            <img src={preview} alt="" style={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: current, display: 'block',
            }} onError={e => e.target.style.display = 'none'} />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 30px)', gridTemplateRows: 'repeat(3, 30px)', gap: 4 }}>
          {FOCAL_POINTS.map(fp => (
            <button
              key={fp.value}
              type="button"
              title={fp.label}
              aria-label={fp.label}
              onClick={() => onChange(fp.value)}
              style={{
                width: 30, height: 30, borderRadius: 4, cursor: 'pointer', padding: 0,
                border: `1.5px solid ${current === fp.value ? 'var(--color-accent)' : 'var(--color-divider)'}`,
                background: current === fp.value ? 'color-mix(in srgb, var(--color-accent) 16%, white)' : 'transparent',
              }}
            >
              {current === fp.value && (
                <span style={{ display: 'block', width: 6, height: 6, margin: '0 auto', borderRadius: '50%', background: 'var(--color-accent)' }} />
              )}
            </button>
          ))}
        </div>
      </div>
      <span style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block', marginTop: '0.35rem' }}>
        Elige qué parte de la foto se mantiene visible al recortarla para el carrusel.
      </span>
    </div>
  )
}

/** Upload button + URL fallback, shared by the add form and the edit form. */
function ImagePicker({ url, onChange, token }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'X-Invite-Token': token },
        body: form,
      })
      if (res.ok) {
        const data = await res.json()
        onChange(data.url)
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const preview = normalizeImageUrl(url)
  return (
    <div className="form-field">
      <label className="form-label">Imagen *</label>
      {preview && (
        <img src={preview} alt="" style={{ height: 90, objectFit: 'cover', borderRadius: 4, marginBottom: 6, display: 'block' }}
          onError={e => e.target.style.display = 'none'} />
      )}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.4rem' }}>
        <label className="btn btn-secondary" style={{ cursor: uploading ? 'wait' : 'pointer', fontSize: '0.8rem' }}>
          {uploading ? 'Subiendo...' : 'Subir imagen'}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={handleFile} disabled={uploading} />
        </label>
      </div>
      <input className="input" placeholder="…o pega una URL / link de Google Drive"
        value={url} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

/**
 * Shared CRUD for both photo carousels ("Nuestra Historia" and "El lugar") —
 * same fields, same reordering, same upload path, so the two admin tabs
 * behave identically instead of one lagging the other's features.
 */
export default function PhotoCarouselManager({ endpoint, introText, confirmNoun, aspectRatio = '1/1' }) {
  const { token } = useApp()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newBadge, setNewBadge] = useState('')
  const [newFocal, setNewFocal] = useState(DEFAULT_FOCAL)
  const [saving, setSaving] = useState(false)

  const [editId, setEditId] = useState(null)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editBadge, setEditBadge] = useState('')
  const [editFocal, setEditFocal] = useState(DEFAULT_FOCAL)
  const [editSaving, setEditSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(endpoint, { headers: { 'X-Invite-Token': token } })
      if (res.ok) setPhotos(await res.json())
      else setError('No se pudieron cargar las fotos.')
    } catch { setError('Error de conexión.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e) {
    e.preventDefault()
    if (!newUrl.trim()) return
    setSaving(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({
          image_url: normalizeImageUrl(newUrl.trim()),
          caption: joinCaption(newTitle, newBadge),
          focal_point: newFocal,
        }),
      })
      if (res.ok) {
        const row = await res.json()
        setPhotos(prev => [...prev, row])
        setNewUrl(''); setNewTitle(''); setNewBadge(''); setNewFocal(DEFAULT_FOCAL); setShowCreate(false)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al agregar foto.')
      }
    } catch { setError('Error de conexión.') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm(`¿Eliminar ${confirmNoun}?`)) return
    try {
      const res = await fetch(`${endpoint}?id=${id}`, {
        method: 'DELETE', headers: { 'X-Invite-Token': token },
      })
      if (res.ok) setPhotos(prev => prev.filter(p => p.id !== id))
    } catch { setError('Error al eliminar.') }
  }

  function startEdit(photo) {
    const { title, badge } = splitCaption(photo.caption)
    setEditId(photo.id)
    setEditUrl(photo.image_url || '')
    setEditTitle(title)
    setEditBadge(badge)
    setEditFocal(photo.focal_point || DEFAULT_FOCAL)
  }

  async function handleSaveEdit(photo) {
    setEditSaving(true)
    const image_url = normalizeImageUrl(editUrl.trim())
    const caption = joinCaption(editTitle, editBadge)
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ id: photo.id, image_url, caption, order_idx: photo.order_idx, focal_point: editFocal }),
      })
      if (res.ok) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, image_url, caption, focal_point: editFocal } : p))
        setEditId(null)
      } else { setError('Error al guardar.') }
    } catch { setError('Error de conexión.') }
    finally { setEditSaving(false) }
  }

  async function movePhoto(idx, direction) {
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= photos.length) return
    const next = [...photos]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    setPhotos(next)
    await Promise.all([
      fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...next[idx], order_idx: idx }),
      }),
      fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...next[swapIdx], order_idx: swapIdx }),
      }),
    ])
  }

  return (
    <div>
      <p style={{ fontSize: '0.85rem', opacity: 0.65, marginBottom: '1rem' }}>{introText}</p>
      {error && <p className="form-error">{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? 'Cancelar' : '+ Agregar foto'}
        </button>
      </div>

      {showCreate && (
        <form className="create-form" onSubmit={handleCreate}>
          <div className="create-form-title">Nueva foto</div>
          <ImagePicker url={newUrl} onChange={setNewUrl} token={token} />
          {normalizeImageUrl(newUrl) && (
            <FocalPointField url={newUrl} value={newFocal} onChange={setNewFocal} aspectRatio={aspectRatio} />
          )}
          <div className="form-field">
            <label className="form-label">Título (opcional)</label>
            <input className="input" placeholder="ej. El jardín principal" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Etiqueta (opcional, ej. una fecha o lugar breve)</label>
            <input className="input" placeholder="ej. 2024" value={newBadge} onChange={e => setNewBadge(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving || !newUrl.trim()}>
            {saving ? 'Guardando...' : 'Agregar'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : photos.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No hay fotos. Agrega la primera.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {photos.map((photo, idx) => {
            const { title, badge } = splitCaption(photo.caption)
            return (
              <div key={photo.id} className="create-form" style={{ margin: 0 }}>
                {editId === photo.id ? (
                  <div>
                    <ImagePicker url={editUrl} onChange={setEditUrl} token={token} />
                    <FocalPointField url={editUrl} value={editFocal} onChange={setEditFocal} aspectRatio={aspectRatio} />
                    <div className="form-field">
                      <label className="form-label">Título</label>
                      <input className="input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Etiqueta</label>
                      <input className="input" value={editBadge} onChange={e => setEditBadge(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" onClick={() => handleSaveEdit(photo)} disabled={editSaving}>
                        {editSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => setEditId(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <img
                      src={normalizeImageUrl(photo.image_url)}
                      alt=""
                      style={{ width: 72, height: 54, objectFit: 'cover', objectPosition: photo.focal_point || DEFAULT_FOCAL, borderRadius: 4, flexShrink: 0 }}
                      onError={e => e.target.style.display = 'none'}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {title
                        ? <span style={{ fontSize: '0.875rem' }}>{title}</span>
                        : <span style={{ fontSize: '0.8rem', opacity: 0.45 }}>Sin título</span>}
                      {badge && <div style={{ fontSize: '0.72rem', opacity: 0.55 }}>{badge}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      <button className="btn btn-ghost" style={{ padding: '2px 6px' }} onClick={() => movePhoto(idx, -1)} disabled={idx === 0}>↑</button>
                      <button className="btn btn-ghost" style={{ padding: '2px 6px' }} onClick={() => movePhoto(idx, 1)} disabled={idx === photos.length - 1}>↓</button>
                      <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => startEdit(photo)}>Editar</button>
                      <button className="btn btn-ghost" style={{ color: '#c0392b', fontSize: '0.75rem' }} onClick={() => handleDelete(photo.id)}>Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
