import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

const DEFAULT_SUBJECT = 'Un pequeño recordatorio 💛 — Matrimonio Cata & Andrés'
const DEFAULT_MESSAGE = `¡Hola {NOMBRE}!

Queríamos recordarte con mucho cariño que todavía puedes ayudarnos a construir nuestra luna de miel a través de nuestra lista de regalos.

Cada aporte, grande o pequeño, significa muchísimo para nosotros. ¡Gracias por ser parte de este momento tan especial!`

export default function GiftReminder() {
  const { token } = useApp()
  const [recipients, setRecipients] = useState([])
  // Which of the suggested candidates actually get the email — starts as
  // "all of them" (the old, only, behavior) but the admin can uncheck any
  // before sending, per feedback: the suggested list is a starting point,
  // not a forced send-to-everyone.
  const [selectedIds, setSelectedIds] = useState(() => new Set())
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
        const list = d.recipients || []
        setRecipients(list)
        setSelectedIds(new Set(list.map(r => r.id)))
      } else {
        setError('No se pudo cargar la lista de destinatarios.')
      }
    } catch { setError('Error de conexión.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function toggleRecipient(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(prev => prev.size === recipients.length ? new Set() : new Set(recipients.map(r => r.id)))
  }

  async function send() {
    if (!subject.trim() || !message.trim() || selectedIds.size === 0) return
    if (!window.confirm(`¿Enviar este recordatorio a ${selectedIds.size} invitado(s)? Esta acción no se puede deshacer.`)) return
    setSending(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/admin/gift-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ subject, message, recipientIds: Array.from(selectedIds) }),
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
        Sugerimos a todos los invitados que dejaron su correo (al confirmar asistencia o no) y que
        todavía no tienen un regalo confirmado — desmarca a quien no quieras incluir antes de enviar.
        Usa <code>{'{NOMBRE}'}</code> en el asunto o el mensaje para saludar a cada uno por su nombre.
      </p>

      {error && <p className="form-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>{error} ✕</p>}

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{recipients.length}</span>
          <span className="stat-label">Candidatos sugeridos</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{selectedIds.size}</span>
          <span className="stat-label">Seleccionados para enviar</span>
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
        disabled={sending || loading || selectedIds.size === 0 || !subject.trim() || !message.trim()}
      >
        {sending ? 'Enviando...' : `Enviar recordatorio a ${selectedIds.size} invitado(s)`}
      </button>

      {result && (
        <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
          Enviados: {result.sent} · Fallidos: {result.failed} · Total: {result.total}
        </p>
      )}

      {recipients.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={recipients.length > 0 && selectedIds.size === recipients.length}
                ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < recipients.length }}
                onChange={toggleSelectAll}
                style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
              Destinatarios ({recipients.length})
            </label>
          </div>
          <div className="admin-table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table className="admin-table">
              <tbody>
                {recipients.map(r => (
                  <tr key={r.id} style={!selectedIds.has(r.id) ? { opacity: 0.45 } : undefined}>
                    <td style={{ width: 32 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleRecipient(r.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                      />
                    </td>
                    <td><strong>{r.name}</strong></td>
                    <td style={{ opacity: 0.7, fontSize: '0.85rem' }}>{r.email}</td>
                    <td>
                      {r.attending === 1
                        ? <span className="tag tag-accent" style={{ fontSize: '0.7rem' }}>Confirmó</span>
                        : r.attending === 0
                          ? <span className="tag tag-neutral" style={{ fontSize: '0.7rem' }}>No asiste</span>
                          : <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>Sin responder</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
