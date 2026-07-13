import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

const SECTIONS = [
  {
    label: 'Hero / Portada',
    fields: [
      { key: 'hero_title', label: 'Título (nombres)', type: 'text' },
      { key: 'hero_subtitle', label: 'Subtítulo', type: 'text' },
      { key: 'hero_date', label: 'Fecha', type: 'text' },
      { key: 'hero_location', label: 'Lugar', type: 'text' },
      { key: 'hero_image', label: 'Foto principal', type: 'image' },
    ],
  },
  {
    label: 'Nuestra Historia',
    fields: [
      { key: 'story_how_we_met_date', label: 'Fecha en que se conocieron', type: 'text' },
      { key: 'story_how_we_met', label: 'Cómo se conocieron', type: 'textarea' },
      { key: 'story_image_1', label: 'Foto juntos', type: 'image' },
      { key: 'story_proposal_date', label: 'Fecha del compromiso', type: 'text' },
      { key: 'story_proposal', label: 'Historia del compromiso', type: 'textarea' },
      { key: 'proposal_image', label: 'Foto del compromiso', type: 'image' },
      { key: 'story_family', label: 'Texto sobre mascotas', type: 'textarea' },
    ],
  },
  {
    label: 'Mascotas',
    fields: [
      { key: 'pet1_name', label: 'Nombre mascota 1', type: 'text' },
      { key: 'pet1_image', label: 'Foto mascota 1', type: 'image' },
      { key: 'pet2_name', label: 'Nombre mascota 2', type: 'text' },
      { key: 'pet2_image', label: 'Foto mascota 2', type: 'image' },
      { key: 'pet3_name', label: 'Nombre mascota 3', type: 'text' },
      { key: 'pet3_image', label: 'Foto mascota 3', type: 'image' },
    ],
  },
  {
    label: 'La Boda',
    fields: [
      { key: 'ceremony_time', label: 'Hora ceremonia', type: 'text' },
      { key: 'reception_time', label: 'Hora recepción', type: 'text' },
      { key: 'venue_name', label: 'Nombre del lugar', type: 'text' },
      { key: 'venue_address', label: 'Dirección', type: 'text' },
      { key: 'venue_description', label: 'Descripción del lugar', type: 'textarea' },
    ],
  },
  {
    label: 'Datos de transferencia',
    fields: [
      { key: 'bank_name', label: 'Banco', type: 'text' },
      { key: 'bank_account', label: 'N° cuenta', type: 'text' },
      { key: 'bank_rut', label: 'RUT', type: 'text' },
      { key: 'bank_email', label: 'Email', type: 'text' },
    ],
  },
]

function TextField({ fieldKey, label, type, value, onSave, token }) {
  const [val, setVal] = useState(value)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setVal(value) }, [value])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ key: fieldKey, value: val }),
      })
      onSave(fieldKey, val)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-field">
      <label className="form-label">{label}</label>
      <div className="content-field-row">
        {type === 'textarea' ? (
          <textarea className="input" rows={3} value={val} onChange={e => setVal(e.target.value)} />
        ) : (
          <input className="input" type="text" value={val} onChange={e => setVal(e.target.value)} />
        )}
        <button
          className="btn btn-secondary save-btn-inline"
          onClick={save}
          disabled={saving || val === value}
        >
          {saving ? '...' : 'Guardar'}
        </button>
      </div>
      {saved && <span className="saved-indicator">✓ Guardado</span>}
    </div>
  )
}

function ImageField({ fieldKey, label, currentUrl, onSave, token }) {
  const [val, setVal] = useState(currentUrl || '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setVal(currentUrl || '') }, [currentUrl])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ key: fieldKey, value: val }),
      })
      onSave(fieldKey, val)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-field">
      <label className="form-label">{label} — URL de imagen</label>
      {val && <img src={val} className="upload-preview" alt={label} onError={e => e.target.style.display='none'} />}
      <div className="content-field-row">
        <input
          className="input"
          type="url"
          placeholder="https://..."
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        <button
          className="btn btn-secondary save-btn-inline"
          onClick={save}
          disabled={saving || val === (currentUrl || '')}
        >
          {saving ? '...' : 'Guardar'}
        </button>
      </div>
      {saved && <span className="saved-indicator">✓ Guardado</span>}
      <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>Pega una URL pública (Google Photos, Dropbox, etc.)</span>
    </div>
  )
}

export default function ContentEditor() {
  const { token, content, updateContent, loadContent, contentLoaded } = useApp()
  const [loading, setLoading] = useState(!contentLoaded)

  useEffect(() => {
    if (!contentLoaded) {
      loadContent().then(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [contentLoaded, loadContent])

  if (loading) return <p className="text-muted">Cargando contenido...</p>

  return (
    <div>
      {SECTIONS.map(section => (
        <div key={section.label} className="content-section">
          <div className="content-section-title">{section.label}</div>
          {section.fields.map(field => (
            field.type === 'image' ? (
              <ImageField
                key={field.key}
                fieldKey={field.key}
                label={field.label}
                currentUrl={content[field.key] || ''}
                onSave={updateContent}
                token={token}
              />
            ) : (
              <TextField
                key={field.key}
                fieldKey={field.key}
                label={field.label}
                type={field.type}
                value={content[field.key] || ''}
                onSave={updateContent}
                token={token}
              />
            )
          ))}
        </div>
      ))}
    </div>
  )
}
