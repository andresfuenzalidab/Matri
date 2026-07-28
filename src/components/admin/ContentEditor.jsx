import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

const SECTIONS = [
  {
    label: 'Hero / Portada',
    fields: [
      { key: 'hero_title', label: 'Título (nombres)', type: 'text' },
      { key: 'hero_subtitle', label: 'Subtítulo', type: 'text' },
      { key: 'hero_date', label: 'Fecha', type: 'text' },
      { key: 'hero_location', label: 'Lugar', type: 'text' },
      { key: 'hero_image', label: 'Foto principal (si no hay video)', type: 'image' },
      { key: 'hero_video', label: 'Video de portada (MP4)', type: 'video' },
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
      { key: 'story_subtitle', label: 'Subtítulo de la sección', type: 'text' },
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
    label: 'El Matrimonio',
    fields: [
      { key: 'ceremony_time', label: 'Hora ceremonia', type: 'text' },
      { key: 'reception_time', label: 'Hora recepción / fiesta', type: 'text' },
      { key: 'venue_name', label: 'Nombre del lugar', type: 'text' },
      { key: 'venue_address', label: 'Dirección', type: 'text' },
      { key: 'venue_description', label: 'Descripción del lugar', type: 'textarea' },
      { key: 'venue_maps_url', label: 'Link de Google Maps', type: 'text' },
      { key: 'dress_code_image', label: 'Imagen código de vestimenta', type: 'image' },
      { key: 'timeline_image', label: 'Imagen programa del día (timeline)', type: 'image' },
    ],
  },
  {
    label: 'RSVP',
    fields: [
      { key: 'rsvp_dietary_question', label: 'Pregunta restricción alimenticia (vacío = no mostrar)', type: 'text' },
      { key: 'rsvp_companion_question', label: 'Pregunta para acompañante (cuando máx = 1)', type: 'text' },
    ],
  },
  {
    label: 'Regalos — Encabezado',
    fields: [
      { key: 'gifts_section_label', label: 'Etiqueta pequeña (ej. "Luna de Miel")', type: 'text' },
      { key: 'gifts_section_title', label: 'Título principal', type: 'text' },
      { key: 'gifts_intro', label: 'Párrafo introductorio', type: 'textarea' },
      { key: 'gifts_thanks_message', label: 'Mensaje de gracias al confirmar regalo (usa {nombre} para el apodo)', type: 'text' },
    ],
  },
  {
    label: 'Configuración del sitio',
    fields: [
      { key: 'site_url', label: 'URL base del sitio (para enlaces en invitaciones y PDFs)', type: 'text' },
    ],
  },
  {
    label: 'MercadoPago (pago con tarjeta)',
    fields: [
      { key: 'mp_enabled', label: 'Habilitar opción de pago con tarjeta', type: 'toggle' },
      { key: 'mp_access_token', label: 'Access Token de MercadoPago', type: 'secret' },
      { key: 'mp_description', label: 'Descripción del pago (aparece en MercadoPago)', type: 'text' },
    ],
  },
  {
    label: 'Datos de transferencia',
    fields: [
      { key: 'bank_holder', label: 'Nombre titular', type: 'text' },
      { key: 'bank_name', label: 'Banco', type: 'text' },
      { key: 'bank_account', label: 'N° cuenta', type: 'text' },
      { key: 'bank_rut', label: 'RUT', type: 'text' },
      { key: 'bank_email', label: 'Email', type: 'text' },
    ],
  },
  {
    label: 'Música de fondo',
    fields: [
      { key: 'music_url', label: 'URL del archivo de música (MP3 directo)', type: 'text' },
    ],
  },
  {
    label: 'Video de fondo (mascotas)',
    fields: [
      { key: 'background_video_url', label: 'Video transparente de mascotas (WebM con canal alpha)', type: 'video' },
    ],
  },
  {
    label: 'Contacto — ¿Dudas?',
    fields: [
      { key: 'contact_groom_phone', label: 'Teléfono novio (ej. +56912345678)', type: 'text' },
      { key: 'contact_groom_label', label: 'Etiqueta botón novio', type: 'text' },
      { key: 'contact_bride_phone', label: 'Teléfono novia (ej. +56987654321)', type: 'text' },
      { key: 'contact_bride_label', label: 'Etiqueta botón novia', type: 'text' },
    ],
  },
]

function SecretField({ fieldKey, label, token }) {
  const [val, setVal] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!val.trim()) return
    setSaving(true)
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ key: fieldKey, value: val.trim() }),
      })
      setVal('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  return (
    <div className="content-field">
      <label className="form-label">{label}</label>
      <div className="content-field-row">
        <input className="input" type="password" placeholder="Pega el token aquí para actualizarlo"
          value={val} onChange={e => setVal(e.target.value)} />
        <button className="btn btn-secondary save-btn-inline" onClick={save}
          disabled={saving || !val.trim()}>
          {saving ? '...' : 'Guardar'}
        </button>
      </div>
      {saved && <span className="saved-indicator">✓ Guardado</span>}
      <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
        El token no se muestra una vez guardado. Déjalo vacío para no modificarlo.
      </span>
    </div>
  )
}

function ToggleField({ fieldKey, label, value, onSave, token }) {
  const [val, setVal] = useState(value === 'si')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setVal(value === 'si') }, [value])

  async function save(newVal) {
    setSaving(true)
    const strVal = newVal ? 'si' : 'no'
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ key: fieldKey, value: strVal }),
      })
      onSave(fieldKey, strVal)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  return (
    <div className="content-field">
      <label className="form-label">{label}</label>
      <div className="content-field-row">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
          <input type="checkbox" checked={val}
            onChange={e => { setVal(e.target.checked); save(e.target.checked) }}
            disabled={saving} />
          <span style={{ fontSize: '0.875rem' }}>{val ? 'Habilitado' : 'Deshabilitado'}</span>
        </label>
      </div>
      {saved && <span className="saved-indicator">✓ Guardado</span>}
      <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
        Requiere el secret <code>mp_access_token</code> configurado en el Worker de Cloudflare.
      </span>
    </div>
  )
}

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
    } finally { setSaving(false) }
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
        <button className="btn btn-secondary save-btn-inline" onClick={save}
          disabled={saving || val === value}>
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
    const normalized = normalizeImageUrl(val.trim())
    setVal(normalized)
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ key: fieldKey, value: normalized }),
      })
      onSave(fieldKey, normalized)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  const preview = normalizeImageUrl(val)
  return (
    <div className="content-field">
      <label className="form-label">{label} — URL de imagen</label>
      {preview && <img src={preview} className="upload-preview" alt={label} onError={e => e.target.style.display = 'none'} />}
      <div className="content-field-row">
        <input className="input" type="text"
          placeholder="https:// o link de Google Drive"
          value={val} onChange={e => setVal(e.target.value)} />
        <button className="btn btn-secondary save-btn-inline" onClick={save}
          disabled={saving || val.trim() === (currentUrl || '')}>
          {saving ? '...' : 'Guardar'}
        </button>
      </div>
      {saved && <span className="saved-indicator">✓ Guardado</span>}
      <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>Acepta URLs directas o links de Google Drive</span>
    </div>
  )
}

function VideoUploadField({ fieldKey, label, currentUrl, onSave, token }) {
  const [url, setUrl] = useState(currentUrl || '')
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => { setUrl(currentUrl || '') }, [currentUrl])

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
        const newUrl = data.url
        setUrl(newUrl)
        await saveUrl(newUrl)
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function saveUrl(val) {
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
    } finally { setSaving(false) }
  }

  return (
    <div className="content-field">
      <label className="form-label">{label}</label>
      {url && (
        <video src={url} controls muted
          style={{ width: '100%', maxHeight: 160, borderRadius: 6, marginBottom: '0.5rem' }} />
      )}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          {uploading ? 'Subiendo...' : url ? 'Cambiar video' : 'Subir video'}
          <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/mov"
            style={{ display: 'none' }} onChange={handleFile} disabled={uploading} />
        </label>
        {url && (
          <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }}
            onClick={() => { setUrl(''); saveUrl('') }}>
            Quitar
          </button>
        )}
      </div>
      {saved && <span className="saved-indicator">✓ Guardado</span>}
      <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
        MP4 para portada. WebM (con alpha) para el video de fondo de mascotas.
      </span>
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
          {section.fields.map(field => {
            if (field.type === 'secret') {
              return (
                <SecretField key={field.key} fieldKey={field.key} label={field.label} token={token} />
              )
            }
            if (field.type === 'toggle') {
              return (
                <ToggleField key={field.key} fieldKey={field.key} label={field.label}
                  value={content[field.key] || 'no'} onSave={updateContent} token={token} />
              )
            }
            if (field.type === 'image') {
              return (
                <ImageField key={field.key} fieldKey={field.key} label={field.label}
                  currentUrl={content[field.key] || ''} onSave={updateContent} token={token} />
              )
            }
            if (field.type === 'video') {
              return (
                <VideoUploadField key={field.key} fieldKey={field.key} label={field.label}
                  currentUrl={content[field.key] || ''} onSave={updateContent} token={token} />
              )
            }
            return (
              <TextField key={field.key} fieldKey={field.key} label={field.label}
                type={field.type} value={content[field.key] || ''}
                onSave={updateContent} token={token} />
            )
          })}
        </div>
      ))}
    </div>
  )
}
