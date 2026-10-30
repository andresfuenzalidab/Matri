import { useState, useEffect, useMemo } from 'react'
import { ALBUM_DEFAULTS, ALBUM_MAX_LEN, ALBUM_DETAIL_MAX_LEN, VOTES_MAX_LIMIT } from '../../utils/albumConfig.js'

const TEXT_FIELDS = [
  { key: 'album_eyebrow', label: 'Línea superior', hint: 'Pequeña, arriba del título (nombres y fecha).' },
  { key: 'album_title', label: 'Título', hint: 'Se ve en letra cursiva grande, como en la tarjeta.' },
  { key: 'album_subtitle', label: 'Mensaje principal', hint: 'Ej: Escanea el QR y comparte tus fotos y videos.' },
  { key: 'album_note', label: 'Nota (Pd)', hint: 'Ej: ¡La mejor foto y el mejor video ganan un premio!' },
]
const PRIZE_FIELDS = [
  { key: 'album_prize_photo', label: 'Premio a la mejor foto', hint: 'Ej: Una cena para dos.' },
  { key: 'album_prize_photo_detail', label: 'Detalle del premio a la mejor foto', hint: 'Se abre con «Ver los premios». Puedes escribir varias líneas: qué incluye, cuándo se entrega, etc.', multiline: true },
  { key: 'album_prize_video', label: 'Premio al mejor video', hint: 'Ej: Un fin de semana en la playa.' },
  { key: 'album_prize_video_detail', label: 'Detalle del premio al mejor video', hint: 'Igual que el anterior, para el video.', multiline: true },
]

const pad = n => String(n).padStart(2, '0')
// ISO (UTC) -> value for <input type="datetime-local"> in this computer's timezone
function toLocalInput(iso) {
  const d = new Date(iso)
  if (!iso || Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = v => (v ? new Date(v).toISOString() : '')

/** Texts, prizes, voting rules and deadline of the guest album page. */
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

  const field = f => (
    <div key={f.key}>
      <label className="form-label" htmlFor={f.key}>{f.label}</label>
      {f.multiline
        ? <textarea id={f.key} className="input" rows={3} maxLength={ALBUM_DETAIL_MAX_LEN} value={values[f.key]} onChange={e => set(f.key, e.target.value)} />
        : <input id={f.key} className="input" maxLength={ALBUM_MAX_LEN} value={values[f.key]} onChange={e => set(f.key, e.target.value)} />}
      <div style={{ fontSize: '0.74rem', opacity: 0.6, marginTop: 3 }}>{f.hint}</div>
    </div>
  )
  const sub = text => <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginTop: '0.4rem' }}>{text}</div>

  const deadlineLocal = toLocalInput(values.album_voting_deadline)
  const deadlinePassed = values.album_voting_deadline && Date.parse(values.album_voting_deadline) <= Date.now()

  return (
    <div className="create-form" style={{ display: 'grid', gap: '0.9rem' }}>
      <div className="create-form-title">Mensaje, premios y votaciones</div>
      <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.7 }}>
        Es lo que ven los invitados al escanear el QR. Los cambios aparecen en el álbum en menos de un minuto.
      </p>

      {sub('Textos')}
      {TEXT_FIELDS.map(field)}

      {sub('Premios')}
      {PRIZE_FIELDS.map(field)}

      {sub('Votaciones')}
      <div>
        <label className="form-label" htmlFor="album_voting_deadline">Cierre de las votaciones</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input id="album_voting_deadline" className="input" type="datetime-local" style={{ maxWidth: 240 }}
            value={deadlineLocal} onChange={e => set('album_voting_deadline', fromLocalInput(e.target.value))} />
          {deadlineLocal && <button type="button" className="btn btn-secondary" onClick={() => set('album_voting_deadline', '')}>Quitar plazo</button>}
        </div>
        <div style={{ fontSize: '0.74rem', opacity: 0.6, marginTop: 3 }}>
          Los invitados ven una cuenta regresiva hasta esta fecha (hora de tu computador). Al llegar, las votaciones se cierran solas y se abre la premiación.
          {deadlinePassed && <strong style={{ color: '#b03e2c' }}> Esta fecha ya pasó: las votaciones están cerradas.</strong>}
        </div>
      </div>

      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer' }}>
        <input type="checkbox" style={{ marginTop: 4 }} checked={values.album_voting_open !== '0'} onChange={e => set('album_voting_open', e.target.checked ? '1' : '0')} />
        <span>
          <strong>Votaciones abiertas</strong>
          <span style={{ display: 'block', fontSize: '0.78rem', opacity: 0.65 }}>
            Desmárcalo para cerrarlas a mano ahora mismo, sin esperar el plazo. Se abre la premiación.
          </span>
        </span>
      </label>

      <div>
        <label className="form-label" htmlFor="album_votes_max">Límite de votos por persona</label>
        <input id="album_votes_max" className="input" type="number" min="0" max={VOTES_MAX_LIMIT} style={{ width: 110 }}
          value={values.album_votes_max} onChange={e => set('album_votes_max', e.target.value)} />
        <div style={{ fontSize: '0.74rem', opacity: 0.6, marginTop: 3 }}>
          0 = ilimitado (cada invitado puede votar todas las fotos y videos que quiera, una vez cada uno). Si pones un número, vale para fotos y, aparte, para videos.
        </div>
      </div>

      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer' }}>
        <input type="checkbox" style={{ marginTop: 4 }} checked={values.album_reveal_names === '1'} onChange={e => set('album_reveal_names', e.target.checked ? '1' : '0')} />
        <span>
          <strong>Mostrar quién subió la foto o el video ganador</strong>
          <span style={{ display: 'block', fontSize: '0.78rem', opacity: 0.65 }}>
            Solo en la premiación y solo con las votaciones cerradas. Si lo dejas desmarcado, el nombre lo ves únicamente tú aquí en el admin.
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
