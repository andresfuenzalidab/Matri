import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

const EMPTY = { title: '', content: '', date_label: '', image_url: '' }

export default function StoryManager() {
  const { token } = useApp()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY)
  const [editSaving, setEditSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/story', { headers: { 'X-Invite-Token': token } })
      if (res.ok) setSections(await res.json())
      else setError('No se pudieron cargar las secciones.')
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const row = await res.json()
        setSections(prev => [...prev, row])
        setForm(EMPTY)
        setShowCreate(false)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al crear sección.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta sección de la historia?')) return
    try {
      const res = await fetch(`/api/admin/story?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Invite-Token': token },
      })
      if (res.ok) setSections(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  function startEdit(section) {
    setEditId(section.id)
    setEditForm({
      title: section.title || '',
      content: section.content || '',
      date_label: section.date_label || '',
      image_url: section.image_url || '',
    })
  }

  async function handleSaveEdit(section) {
    setEditSaving(true)
    try {
      const res = await fetch('/api/admin/story', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ id: section.id, ...editForm, order_idx: section.order_idx }),
      })
      if (res.ok) {
        setSections(prev => prev.map(s => s.id === section.id ? { ...s, ...editForm } : s))
        setEditId(null)
      } else {
        setError('Error al guardar.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setEditSaving(false)
    }
  }

  async function moveSection(idx, direction) {
    const newSections = [...sections]
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= newSections.length) return
    ;[newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]]
    setSections(newSections)

    await Promise.all([
      fetch('/api/admin/story', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...newSections[idx], id: newSections[idx].id, order_idx: idx }),
      }),
      fetch('/api/admin/story', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...newSections[swapIdx], id: newSections[swapIdx].id, order_idx: swapIdx }),
      }),
    ])
  }

  return (
    <div>
      {error && <p className="form-error">{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? 'Cancelar' : '+ Nueva sección'}
        </button>
      </div>

      {showCreate && (
        <form className="create-form" onSubmit={handleCreate}>
          <div className="create-form-title">Nueva sección</div>
          <div className="form-field">
            <label className="form-label">Título *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-field">
            <label className="form-label">Fecha / etiqueta (opcional)</label>
            <input className="input" placeholder="ej. Enero 2020" value={form.date_label} onChange={e => setForm(f => ({ ...f, date_label: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Texto</label>
            <textarea className="input" rows={3} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">URL de imagen (opcional)</label>
            <input className="input" placeholder="https://... o URL de Google Drive" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving || !form.title.trim()}>
            {saving ? 'Guardando...' : 'Crear sección'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : sections.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No hay secciones. Crea la primera.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sections.map((section, idx) => (
            <div key={section.id} className="create-form" style={{ margin: 0 }}>
              {editId === section.id ? (
                <div>
                  <div className="form-field">
                    <label className="form-label">Título</label>
                    <input className="input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Fecha / etiqueta</label>
                    <input className="input" value={editForm.date_label} onChange={e => setEditForm(f => ({ ...f, date_label: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Texto</label>
                    <textarea className="input" rows={3} value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">URL de imagen</label>
                    <input className="input" value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} />
                    {normalizeImageUrl(editForm.image_url) && (
                      <img src={normalizeImageUrl(editForm.image_url)} alt="" style={{ height: 80, objectFit: 'cover', borderRadius: 4, marginTop: 6 }} onError={e => e.target.style.display = 'none'} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => handleSaveEdit(section)} disabled={editSaving}>
                      {editSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setEditId(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {normalizeImageUrl(section.image_url) && (
                    <img src={normalizeImageUrl(section.image_url)} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>{section.title}</strong>
                    {section.date_label && <span style={{ fontSize: '0.75rem', opacity: 0.55, marginLeft: '0.5rem' }}>{section.date_label}</span>}
                    {section.content && <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem', marginBottom: 0 }}>{section.content.substring(0, 80)}{section.content.length > 80 ? '…' : ''}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ padding: '2px 6px' }} onClick={() => moveSection(idx, -1)} disabled={idx === 0}>↑</button>
                    <button className="btn btn-ghost" style={{ padding: '2px 6px' }} onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>↓</button>
                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => startEdit(section)}>Editar</button>
                    <button className="btn btn-ghost" style={{ color: '#c0392b', fontSize: '0.75rem' }} onClick={() => handleDelete(section.id)}>Eliminar</button>
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
