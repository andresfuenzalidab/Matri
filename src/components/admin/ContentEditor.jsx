import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import { parseTimelineItems, DEFAULT_TIMELINE_ITEMS } from '../../utils/timelineItems.js'
import TimelineIcon, { TIMELINE_ICON_OPTIONS, DEFAULT_ICON } from '../TimelineIcons.jsx'

const SECTIONS = [
  {
    label: 'Sobre de entrada (lo primero que se ve)',
    fields: [
      { key: 'envelope_logo_image', label: 'Logo del sobre (PNG con fondo transparente)', type: 'image' },
      { key: 'envelope_seal_image', label: 'Sello de cera (PNG con fondo transparente, opcional)', type: 'image' },
      { key: 'envelope_cta_text', label: 'Texto del botón para abrir', type: 'text' },
    ],
  },
  {
    label: 'Hero / Portada',
    fields: [
      { key: 'hero_title', label: 'Título (nombres)', type: 'text' },
      { key: 'hero_date', label: 'Fecha en texto (ej. Viernes 6 de noviembre de 2026)', type: 'text' },
      { key: 'hero_image', label: 'Foto principal (para el PDF de la invitación)', type: 'image' },
      { key: 'hero_video', label: 'Video de portada (MP4)', type: 'video' },
      { key: 'countdown_bg_image', label: 'Imagen de fondo del contador', type: 'image' },
      { key: 'flower_vine_left', label: 'Flores laterales (PNG fondo blanco o transparente)', type: 'image' },
      { key: 'section_divider_image', label: 'Separador entre secciones (PNG sin fondo — si está vacío se usa un adorno dibujado)', type: 'image' },
    ],
  },
  {
    label: 'Fecha y citación (calendario)',
    fields: [
      { key: 'wedding_date', label: 'Fecha del matrimonio (YYYY-MM-DD) — usada por el calendario y la cuenta regresiva', type: 'text' },
      { key: 'calendar_decor_image', label: 'Imagen decorativa junto al calendario (PNG sin fondo, opcional)', type: 'image' },
      { key: 'citation_card_title', label: 'Título de la tarjeta de citación', type: 'text' },
      { key: 'citation_note', label: 'Nota extra en la tarjeta (para todos los invitados)', type: 'textarea' },
    ],
  },
  {
    label: 'Nuestra Historia',
    fields: [
      { key: 'story_heading', label: 'Título de la sección', type: 'text' },
      { key: 'story_subtitle', label: 'Subtítulo', type: 'text' },
      { key: 'story_body', label: 'Historia completa (párrafos separados por líneas)', type: 'textarea' },
    ],
  },
  {
    label: 'Preguntas Frecuentes (FAQ)',
    fields: [
      { key: 'faq_heading', label: 'Título de la sección', type: 'text' },
      {
        key: 'faq_items',
        label: 'Preguntas y respuestas (JSON)\nEjemplo: [{"q":"¿Habrá transporte?","a":"Sí, contaremos con buses..."}]',
        type: 'textarea',
      },
    ],
  },
  {
    label: 'El Matrimonio',
    fields: [
      { key: 'ceremony_time', label: 'Hora ceremonia', type: 'text' },
      { key: 'reception_time', label: 'Hora recepción / fiesta', type: 'text' },
      { key: 'venue_name', label: 'Nombre del lugar', type: 'text' },
      { key: 'venue_address', label: 'Dirección', type: 'text' },
      { key: 'wedding_day_off_tip', label: 'Recomendación (solo se muestra a invitados a todo el día)', type: 'text' },
      { key: 'wedding_end_time', label: 'Hora de término del evento (HH:MM, ej. 03:00 — para el calendario)', type: 'text' },
      { key: 'venue_maps_url', label: 'Link de Google Maps', type: 'text' },
      { key: 'venue_map_title', label: 'Título del plano del lugar', type: 'text' },
      { key: 'venue_map_image', label: 'Imagen del plano / mapa del lugar', type: 'image' },
      { key: 'dress_code_image', label: 'Imagen código de vestimenta', type: 'image' },
    ],
  },
  {
    label: 'Programa del día (timeline)',
    fields: [
      { key: 'timeline_title', label: 'Título de la sección', type: 'text' },
      { key: 'timeline_items', label: 'Momentos del día', type: 'timeline' },
    ],
  },
  {
    label: 'RSVP',
    fields: [
      { key: 'rsvp_card_image', label: 'Imagen decorativa de la tarjeta RSVP (PNG sin fondo)', type: 'image' },
      { key: 'rsvp_envelope_image', label: 'Sobre donde se deposita la respuesta (PNG sin fondo, opcional)', type: 'image' },
      { key: 'rsvp_dietary_question', label: 'Pregunta restricción alimenticia (vacío = no mostrar)', type: 'text' },
      { key: 'rsvp_companion_question', label: 'Pregunta para acompañante (si la invitación no nombra uno)', type: 'text' },
      { key: 'rsvp_deadline', label: 'Fecha límite para confirmar (YYYY-MM-DD, ej. 2026-10-15)', type: 'text' },
      { key: 'rsvp_thanks_attending', label: 'Mensaje confirmación asistencia (usa {NOMBRE})', type: 'textarea' },
      { key: 'rsvp_thanks_declined', label: 'Mensaje confirmación no asistencia (usa {NOMBRE})', type: 'textarea' },
    ],
  },
  {
    label: 'Emails (confirmaciones)',
    fields: [
      { key: 'email_from', label: 'Email de envío (verificado en Resend)', type: 'text' },
      { key: 'email_to', label: 'Email de los novios (recibe notificaciones)', type: 'text' },
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
      { key: 'bank_type', label: 'Tipo de cuenta (ej. Cuenta Vista)', type: 'text' },
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
    label: 'Videos de las secciones',
    fields: [
      { key: 'background_video_url', label: 'Video del contador (gato del timer)', type: 'video' },
      { key: 'description_video_url', label: 'Video de información del lugar (perro)', type: 'video' },
      { key: 'dresscode_video_url', label: 'Video del código de vestimenta', type: 'video' },
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

/**
 * Editor for the programme of the day. Each row becomes one stop on the
 * timeline, with its own icon; empty means "show the default programme".
 */
function TimelineField({ fieldKey, label, value, onSave, token }) {
  const [items, setItems] = useState(() => parseTimelineItems(value))
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setItems(parseTimelineItems(value)) }, [value])

  async function save(updated) {
    setSaving(true)
    const str = JSON.stringify(updated)
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ key: fieldKey, value: str }),
      })
      onSave(fieldKey, str)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  function update(idx, field, val) {
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  }

  function move(idx, delta) {
    const target = idx + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setItems(next)
  }

  function add() {
    setItems([...items, { icon: DEFAULT_ICON, time: '', title: '', note: '' }])
  }

  function remove(idx) {
    const next = items.filter((_, i) => i !== idx)
    setItems(next)
    save(next)
  }

  function loadDefaults() { setItems(DEFAULT_TIMELINE_ITEMS.map(it => ({ ...it }))) }

  return (
    <div className="content-field">
      <label className="form-label">{label}</label>

      {items.map((it, i) => (
        <div key={i} className="timeline-editor-row">
          <div className="timeline-editor-preview" aria-hidden="true">
            <TimelineIcon name={it.icon} className="timeline-editor-icon" />
          </div>
          <div className="timeline-editor-fields">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select className="input" style={{ flex: '1 1 140px' }}
                value={it.icon} onChange={e => update(i, 'icon', e.target.value)}>
                {TIMELINE_ICON_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
              <input className="input" style={{ flex: '0 0 90px' }} placeholder="17:00"
                value={it.time} onChange={e => update(i, 'time', e.target.value)} />
            </div>
            <input className="input" placeholder="Título (ej. Ceremonia)"
              value={it.title} onChange={e => update(i, 'title', e.target.value)} />
            <input className="input" placeholder="Descripción corta (opcional)"
              value={it.note} onChange={e => update(i, 'note', e.target.value)} />
          </div>
          <div className="timeline-editor-actions">
            <button type="button" className="btn btn-ghost" title="Subir"
              onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button type="button" className="btn btn-ghost" title="Bajar"
              onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
            <button type="button" className="btn btn-ghost" style={{ color: '#c0392b' }}
              title="Quitar" onClick={() => remove(i)}>✕</button>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={add}>
          + Agregar momento
        </button>
        {items.length === 0 && (
          <button type="button" className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={loadDefaults}>
            Usar programa sugerido
          </button>
        )}
        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}
          onClick={() => save(items)} disabled={saving}>
          {saving ? '...' : 'Guardar programa'}
        </button>
      </div>
      {saved && <span className="saved-indicator">✓ Guardado</span>}
      <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
        Si lo dejas vacío se muestra el programa sugerido. Solo lo ven los invitados a todo el día.
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
            if (field.type === 'timeline') {
              return (
                <TimelineField key={field.key} fieldKey={field.key} label={field.label}
                  value={content[field.key] || '[]'} onSave={updateContent} token={token} />
              )
            }
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
