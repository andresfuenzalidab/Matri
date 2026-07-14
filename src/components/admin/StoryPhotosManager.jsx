import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

export default function StoryPhotosManager() {
  const { token } = useApp()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newCaption, setNewCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editUrl, setEditUrl] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/story-photos', { headers: { 'X-Invite-Token': token } })
      if (res.ok) setPhotos(await res.json())
      else setError('No se pudieron cargar las fotos.')
    } catch { setError('Error de conexión.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newUrl.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/story-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ image_url: normalizeImageUrl(newUrl.trim()), caption: newCaption.trim() }),
      })
      if (res.ok) {
        const row = await res.json()
        setPhotos(prev => [...prev, row])
        setNewUrl(''); setNewCaption(''); setShowCreate(false)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al agregar foto.')
      }
    } catch { setError('Error de conexión.') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta foto del carrusel?')) return
    try {
      const res = await fetch(`/api/admin/story-photos?id=${id}`, {
        method: 'DELETE', headers: { 'X-Invite-Token': token },
      })
      if (res.ok) setPhotos(prev => prev.filter(p => p.id !== id))
    } catch { setError('Error al eliminar.') }
  }

  function startEdit(photo) {
    setEditId(photo.id)
    setEditUrl(photo.image_url || '')
    setEditCaption(photo.caption || '')
  }

  async function handleSaveEdit(photo) {
    setEditSaving(true)
    try {
      const res = await fetch('/api/admin/story-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ id: photo.id, image_url: normalizeImageUrl(editUrl.trim()), caption: editCaption.trim(), order_idx: photo.order_idx }),
      })
      if (res.ok) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, image_url: normalizeImageUrl(editUrl.trim()), caption: editCaption.trim() } : p))
        setEditId(null)
      } else { setError('Error al guardar.') }
    } catch { setError('Error de conexión.') }
    finally { setEditSaving(false) }
  }

  async function movePhoto(idx, direction) {
    const newPhotos = [...photos]
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= newPhotos.length) return
    ;[newPhotos[idx], newPhotos[swapIdx]] = [newPhotos[swapIdx], newPhotos[idx]]
    setPhotos(newPhotos)
    await Promise.all([
      fetch('/api/admin/story-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...newPhotos[idx], order_idx: idx }),
      }),
      fetch('/api/admin/story-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...newPhotos[swapIdx], order_idx: swapIdx }),
      }),
    ])
  }

  return (
    <div>
      <p style={{ fontSize: '0.85rem', opacity: 0.65, marginBottom: '1rem' }}>
        Fotos del carrusel al final de "Nuestra Historia". Acepta URLs directas o links de Google Drive.
      </p>
      {error && <p className="form-error">{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? 'Cancelar' : '+ Agregar foto'}
        </button>
      </div>

      {showCreate && (
        <form className="create-form" onSubmit={handleCreate}>
          <div className="create-form-title">Nueva foto</div>
          <div className="form-field">
            <label className="form-label">URL de imagen *</label>
            <input className="input" placeholder="https://... o URL de Google Drive" value={newUrl} onChange={e => setNewUrl(e.target.value)} required />
            {normalizeImageUrl(newUrl) && (
              <img src={normalizeImageUrl(newUrl)} alt="" style={{ height: 80, objectFit: 'cover', borderRadius: 4, marginTop: 6 }} onError={e => e.target.style.display = 'none'} />
            )}
          </div>
          <div className="form-field">
            <label className="form-label">Leyenda (opcional)</label>
            <input className="input" placeholder="ej. Nuestra primera foto juntos" value={newCaption} onChange={e => setNewCaption(e.target.value)} />
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
          {photos.map((photo, idx) => (
            <div key={photo.id} className="create-form" style={{ margin: 0 }}>
              {editId === photo.id ? (
                <div>
                  <div className="form-field">
                    <label className="form-label">URL de imagen</label>
                    <input className="input" value={editUrl} onChange={e => setEditUrl(e.target.value)} />
                    {normalizeImageUrl(editUrl) && (
                      <img src={normalizeImageUrl(editUrl)} alt="" style={{ height: 80, objectFit: 'cover', borderRadius: 4, marginTop: 6 }} onError={e => e.target.style.display = 'none'} />
                    )}
                  </div>
                  <div className="form-field">
                    <label className="form-label">Leyenda</label>
                    <input className="input" value={editCaption} onChange={e => setEditCaption(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => handleSaveEdit(photo)} disabled={editSaving}>{editSaving ? 'Guardando...' : 'Guardar'}</button>
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
                    {photo.caption
                      ? <span style={{ fontSize: '0.875rem' }}>{photo.caption}</span>
                      : <span style={{ fontSize: '0.8rem', opacity: 0.45 }}>Sin leyenda</span>}
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
          ))}
        </div>
      )}
    </div>
  )
}
