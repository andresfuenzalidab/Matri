import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

export default function VenuePhotosManager() {
  const { token } = useApp()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [adding, setAdding] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/venue-photos', { headers: { 'X-Invite-Token': token } })
      if (res.ok) setPhotos(await res.json())
      else setError('No se pudieron cargar las fotos.')
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!imageUrl.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/admin/venue-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ image_url: imageUrl.trim(), caption: caption.trim() || null }),
      })
      if (res.ok) {
        const photo = await res.json()
        setPhotos(prev => [...prev, photo])
        setImageUrl('')
        setCaption('')
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al agregar foto.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta foto del lugar?')) return
    try {
      const res = await fetch(`/api/admin/venue-photos?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Invite-Token': token },
      })
      if (res.ok) setPhotos(prev => prev.filter(p => p.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  return (
    <div>
      {error && <p className="form-error">{error}</p>}

      <form className="create-form" onSubmit={handleAdd} style={{ marginBottom: '1.5rem' }}>
        <div className="create-form-title">Agregar foto del lugar</div>
        <div className="form-field">
          <label className="form-label">URL de imagen *</label>
          <input
            className="input"
            placeholder="https://... o URL de Google Drive"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            required
          />
          {normalizeImageUrl(imageUrl) && (
            <img
              src={normalizeImageUrl(imageUrl)}
              alt=""
              style={{ height: 100, objectFit: 'cover', borderRadius: 4, marginTop: 6 }}
              onError={e => e.target.style.display = 'none'}
            />
          )}
        </div>
        <div className="form-field">
          <label className="form-label">Descripción (opcional)</label>
          <input
            className="input"
            placeholder="ej. Jardín principal"
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={adding || !imageUrl.trim()}>
          {adding ? 'Agregando...' : 'Agregar foto'}
        </button>
      </form>

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : photos.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '1rem', opacity: 0.5 }}>No hay fotos aún.</p>
      ) : (
        <div className="venue-collage" style={{ marginTop: 0 }}>
          {photos.map(photo => (
            <div key={photo.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', aspectRatio: '4/3', background: 'var(--color-neutral-200)' }}>
              <img
                src={normalizeImageUrl(photo.image_url)}
                alt={photo.caption || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => e.target.style.display = 'none'}
              />
              {photo.caption && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.45)', color: 'white',
                  fontSize: '0.7rem', padding: '0.3rem 0.5rem',
                }}>
                  {photo.caption}
                </div>
              )}
              <button
                onClick={() => handleDelete(photo.id)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  background: 'rgba(0,0,0,0.6)', color: 'white',
                  border: 'none', borderRadius: '50%', width: 24, height: 24,
                  cursor: 'pointer', fontSize: 12, lineHeight: 1,
                }}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
