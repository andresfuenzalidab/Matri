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
export default function PhotoCarouselManager({ endpoint, introText, confirmNoun }) {
  const { token } = useApp()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newBadge, setNewBadge] = useState('')
  const [saving, setSaving] = useState(false)

  const [editId, setEditId] = useState(null)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editBadge, setEditBadge] = useState('')
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
        }),
      })
      if (res.ok) {
        const row = await res.json()
        setPhotos(prev => [...prev, row])
        setNewUrl(''); setNewTitle(''); setNewBadge(''); setShowCreate(false)
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
  }

  async function handleSaveEdit(photo) {
    setEditSaving(true)
    const image_url = normalizeImageUrl(editUrl.trim())
    const caption = joinCaption(editTitle, editBadge)
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ id: photo.id, image_url, caption, order_idx: photo.order_idx }),
      })
      if (res.ok) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, image_url, caption } : p))
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
                      style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
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
