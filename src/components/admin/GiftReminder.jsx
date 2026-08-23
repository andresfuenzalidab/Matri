import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

const DEFAULT_SUBJECT = 'Un pequeño recordatorio 💛 — Matrimonio Cata & Andrés'
const DEFAULT_MESSAGE = `¡Hola {NOMBRE}!

Queríamos recordarte con mucho cariño que todavía puedes ayudarnos a construir nuestra luna de miel a través de nuestra lista de regalos.

Cada aporte, grande o pequeño, significa muchísimo para nosotros. ¡Gracias por ser parte de este momento tan especial!`

export default function GiftReminder() {
  const { token } = useApp()
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gift-reminder', { headers: { 'X-Invite-Token': token } })
      if (res.ok) {
        const d = await res.json()
        setRecipients(d.recipients || [])
      } else {
        setError('No se pudo cargar la lista de destinatarios.')
      }
    } catch { setError('Error de conexión.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function send() {
    if (!subject.trim() || !message.trim() || recipients.length === 0) return
    if (!window.confirm(`¿Enviar este recordatorio a ${recipients.length} invitado(s)? Esta acción no se puede deshacer.`)) return
    setSending(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/admin/gift-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ subject, message }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) setResult(d)
      else setError(d.error || 'Error al enviar los correos.')
    } catch { setError('Error de conexión.') }
    finally { setSending(false) }
  }

  if (loading) return <p className="text-muted">Cargando...</p>

  return (
    <div>
      <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem', lineHeight: 1.5 }}>
        Envía un recordatorio a todos los invitados que dejaron su correo (al confirmar
        asistencia o no) y que todavía no tienen un regalo confirmado. Usa <code>{'{NOMBRE}'}</code> en
        el asunto o el mensaje para saludar a cada uno por su nombre.
      </p>

      {error && <p className="form-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>{error} ✕</p>}

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{recipients.length}</span>
          <span className="stat-label">Destinatarios elegibles</span>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Asunto</label>
        <input className="input" value={subject} onChange={e => setSubject(e.target.value)} />
      </div>
      <div className="form-field">
        <label className="form-label">Mensaje</label>
        <textarea className="input" rows={7} value={message} onChange={e => setMessage(e.target.value)} />
      </div>

      <button
        className="btn btn-primary"
        onClick={send}
        disabled={sending || loading || recipients.length === 0 || !subject.trim() || !message.trim()}
      >
        {sending ? 'Enviando...' : `Enviar recordatorio a ${recipients.length} invitado(s)`}
      </button>

      {result && (
        <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
          Enviados: {result.sent} · Fallidos: {result.failed} · Total: {result.total}
        </p>
      )}

      {recipients.length > 0 && (
        <details style={{ marginTop: '1.5rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.85rem', opacity: 0.7 }}>Ver destinatarios</summary>
          <ul style={{ fontSize: '0.8rem', marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
            {recipients.map(r => (
              <li key={r.id}>
                {r.name} — {r.email}
                {r.attending === 1 ? ' (confirmó)' : r.attending === 0 ? ' (no asiste)' : ' (sin responder)'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
