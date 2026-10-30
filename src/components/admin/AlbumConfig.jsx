import { useState, useEffect, useMemo } from 'react'
import { ALBUM_DEFAULTS, ALBUM_MAX_LEN, ALBUM_DETAIL_MAX_LEN, VOTES_LIMIT_MAX } from '../../utils/albumConfig.js'

const FIELDS = [
  { key: 'album_eyebrow', label: 'Línea superior', hint: 'Pequeña, arriba del título (nombres y fecha).' },
  { key: 'album_title', label: 'Título', hint: 'Se ve en letra cursiva grande, como en la tarjeta.' },
  { key: 'album_subtitle', label: 'Mensaje principal', hint: 'Ej: Escanea el QR y comparte tus fotos y videos.' },
  { key: 'album_note', label: 'Nota (Pd)', hint: 'Ej: ¡La mejor foto y el mejor video ganan un premio!' },
  { key: 'album_prize_photo', label: 'Premio a la mejor foto', hint: 'Déjalo vacío para no mostrarlo. Ej: Una cena para dos.' },
  { key: 'album_prize_photo_detail', label: 'Detalle del premio a la mejor foto', hint: 'Se abre con el botón «Ver detalle del premio». Puedes escribir varias líneas: qué incluye, cuándo se entrega, etc.', multiline: true },
  { key: 'album_prize_video', label: 'Premio al mejor video', hint: 'Déjalo vacío para no mostrarlo.' },
  { key: 'album_prize_video_detail', label: 'Detalle del premio al mejor video', hint: 'Igual que el anterior, para el video.', multiline: true },
]

/** Texts, prizes and the voting switch shown on the guest album page. */
export default function AlbumConfig({ token }) {
  const headers = useMemo(() => ({ 'X-Invite-Token': token, 'Content-Type': 'application/json' }), [token])
  const [values, setValues] = useState(null)
  const [saved, setSaved] = useState(null) // last saved values, to know when there are unsaved edits
  const [state, setState] = useState('idle') // idle | saving | saved | error
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/media/config', { headers })
      .then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || 'No se pudo cargar.'); return d })
      .then(d => { if (!cancelled) { setValues({ ...ALBUM_DEFAULTS, ...d }); setSaved({ ...ALBUM_DEFAULTS, ...d }) } })
      .catch(e => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [headers])

  if (error && !values) return <p className="form-error">{error}</p>
  if (!values) return <p className="text-muted">Cargando…</p>

  const dirty = JSON.stringify(values) !== JSON.stringify(saved)
  const set = (k, v) => { setValues(x => ({ ...x, [k]: v })); setState('idle') }

  async function save() {
    setState('saving'); setError('')
    try {
      const res = await fetch('/api/media/config', { method: 'PUT', headers, body: JSON.stringify({ values }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'No se pudo guardar.')
      setValues({ ...ALBUM_DEFAULTS, ...d }); setSaved({ ...ALBUM_DEFAULTS, ...d }); setState('saved')
    } catch (e) { setError(e.message); setState('error') }
  }

  return (
    <div className="create-form" style={{ display: 'grid', gap: '0.9rem' }}>
      <div className="create-form-title">Mensaje y premios del álbum</div>
      <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.7 }}>
        Es lo que ven los invitados al escanear el QR. Los cambios aparecen en el álbum en menos de un minuto.
      </p>

      {FIELDS.map(f => (
        <div key={f.key}>
          <label className="form-label" htmlFor={f.key}>{f.label}</label>
          {f.multiline
            ? <textarea id={f.key} className="input" rows={3} maxLength={ALBUM_DETAIL_MAX_LEN} value={values[f.key]} onChange={e => set(f.key, e.target.value)} />
            : <input id={f.key} className="input" maxLength={ALBUM_MAX_LEN} value={values[f.key]} onChange={e => set(f.key, e.target.value)} />}
          <div style={{ fontSize: '0.74rem', opacity: 0.6, marginTop: 3 }}>{f.hint}</div>
        </div>
      ))}

      <div>
        <label className="form-label" htmlFor="album_votes_limit">Votos por persona (en fotos, y aparte en videos)</label>
        <input id="album_votes_limit" className="input" type="number" min="1" max={VOTES_LIMIT_MAX} style={{ width: 100 }}
          value={values.album_votes_limit} onChange={e => set('album_votes_limit', e.target.value)} />
        <div style={{ fontSize: '0.74rem', opacity: 0.6, marginTop: 3 }}>Cada invitado puede votar por esta cantidad de fotos distintas y la misma cantidad de videos distintos (máx. {VOTES_LIMIT_MAX}).</div>
      </div>

      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer' }}>
        <input type="checkbox" style={{ marginTop: 4 }} checked={values.album_voting_open !== '0'} onChange={e => set('album_voting_open', e.target.checked ? '1' : '0')} />
        <span>
          <strong>Votaciones abiertas</strong>
          <span style={{ display: 'block', fontSize: '0.78rem', opacity: 0.65 }}>
            Desmárcalo para cerrar los votos: el ranking queda congelado y se muestra como «Ganadores».
          </span>
        </span>
      </label>

      {error && <p className="form-error" role="alert" style={{ margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={save} disabled={!dirty || state === 'saving'}>{state === 'saving' ? 'Guardando…' : 'Guardar cambios'}</button>
        {state === 'saved' && !dirty && <span style={{ fontSize: '0.85rem', color: '#4d7a3a' }}>✓ Guardado</span>}
        {dirty && state !== 'saving' && <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Cambios sin guardar</span>}
      </div>
    </div>
  )
}
