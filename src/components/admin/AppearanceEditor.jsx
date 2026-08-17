import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { HEADING_FONTS, BODY_FONTS } from '../../utils/fontOptions.js'

const COLOR_FIELDS = [
  { key: 'theme_color_bg', label: 'Fondo de la página', fallback: '#eceae8' },
  { key: 'theme_color_accent', label: 'Dorado / acento (títulos, bordes, botones)', fallback: '#b68235' },
  { key: 'theme_color_accent_deep', label: 'Dorado oscuro (barra inferior, carrito de regalos)', fallback: '#3a270d' },
  { key: 'theme_color_on_accent', label: 'Texto sobre fondo oscuro (barra inferior, carrito)', fallback: '#fdf9f0' },
  { key: 'theme_color_text', label: 'Texto', fallback: '#201f1d' },
  { key: 'theme_color_paper', label: 'Papel de las tarjetas (sobre, calendario, RSVP)', fallback: '#f7f3ea' },
  { key: 'theme_color_seal', label: 'Sello de cera', fallback: '#6d7355' },
]

const FONT_FIELDS = [
  { key: 'theme_font_heading', label: 'Tipografía de títulos', options: HEADING_FONTS, fallback: 'Cormorant Garamond' },
  { key: 'theme_font_body', label: 'Tipografía de texto', options: BODY_FONTS, fallback: 'Lora' },
]

function ColorField({ fieldKey, label, fallback, value, onSave, token }) {
  const [val, setVal] = useState(value || fallback)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setVal(value || fallback) }, [value, fallback])

  async function save(next) {
    setVal(next)
    setSaving(true)
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ key: fieldKey, value: next }),
      })
      onSave(fieldKey, next)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally { setSaving(false) }
  }

  function reset() { save(fallback) }

  return (
    <div className="appearance-color-row">
      <input type="color" value={val} onChange={e => save(e.target.value)}
        disabled={saving} className="appearance-color-swatch" />
      <div className="appearance-color-info">
        <span className="form-label">{label}</span>
        <span className="appearance-color-hex">{val}</span>
      </div>
      {value && value !== fallback && (
        <button type="button" className="btn btn-ghost" style={{ fontSize: '0.72rem' }} onClick={reset}>
          Restablecer
        </button>
      )}
      {saved && <span className="saved-indicator">✓</span>}
    </div>
  )
}

function FontField({ fieldKey, label, options, fallback, value, onSave, token }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const current = value || fallback

  async function save(next) {
    setSaving(true)
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ key: fieldKey, value: next }),
      })
      onSave(fieldKey, next)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally { setSaving(false) }
  }

  return (
    <div className="content-field">
      <label className="form-label">{label}</label>
      <div className="content-field-row">
        <select className="input" value={current} disabled={saving}
          onChange={e => save(e.target.value)}>
          {options.map(f => (
            <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>{f.name}</option>
          ))}
        </select>
      </div>
      <p style={{ fontFamily: `'${current}', serif`, fontSize: '1.3rem', margin: '0.5rem 0 0', opacity: 0.85 }}>
        Andrés & Catalina — Viernes 6 de noviembre
      </p>
      {saved && <span className="saved-indicator">✓ Guardado</span>}
    </div>
  )
}

export default function AppearanceEditor() {
  const { token, content, updateContent, loadContent, contentLoaded } = useApp()
  const [loading, setLoading] = useState(!contentLoaded)

  useEffect(() => {
    if (!contentLoaded) loadContent().then(() => setLoading(false))
    else setLoading(false)
  }, [contentLoaded, loadContent])

  if (loading) return <p className="text-muted">Cargando...</p>

  return (
    <div>
      <p style={{ fontSize: '0.85rem', opacity: 0.65, marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Un solo tema para todo el sitio — cambia aquí y se aplica de inmediato en todas las secciones.
        No afecta el contenido (textos, fotos, videos), solo la apariencia.
      </p>

      <div className="content-section">
        <div className="content-section-title">Colores</div>
        {COLOR_FIELDS.map(f => (
          <ColorField key={f.key} fieldKey={f.key} label={f.label} fallback={f.fallback}
            value={content[f.key]} onSave={updateContent} token={token} />
        ))}
      </div>

      <div className="content-section">
        <div className="content-section-title">Tipografías</div>
        {FONT_FIELDS.map(f => (
          <FontField key={f.key} fieldKey={f.key} label={f.label} options={f.options} fallback={f.fallback}
            value={content[f.key]} onSave={updateContent} token={token} />
        ))}
      </div>
    </div>
  )
}
