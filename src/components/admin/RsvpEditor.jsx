import { useState } from 'react'
import AdminModal from './AdminModal'
import { invitedHeadcount } from '../../utils/inviteCount.js'

/**
 * Admin override of one invitation's RSVP: confirm on someone's behalf, mark a
 * last-minute cancellation, fix the headcount, or clear the answer entirely.
 * No emails go out from here.
 */
export default function RsvpEditor({ invitation: inv, token, onClose, onSaved }) {
  const answered = inv.attending !== null && inv.attending !== undefined
  const [status, setStatus] = useState(!answered ? 'none' : inv.attending ? 'yes' : 'no')
  const [guests, setGuests] = useState(inv.num_guests || 1)
  const [who, setWho] = useState(inv.rsvp_companion_name || '')
  const [diet, setDiet] = useState(inv.dietary_restriction || '')
  const [message, setMessage] = useState(inv.rsvp_message || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const capacity = invitedHeadcount(inv)

  async function save(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/rsvp', {
        method: 'PUT',
        headers: { 'X-Invite-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: inv.id,
          attending: status === 'none' ? null : status === 'yes',
          num_guests: guests, companion_name: who, dietary_restriction: diet, message,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar.')
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const Opt = ({ value, label }) => (
    <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer' }}>
      <input type="radio" name="rsvp-status" checked={status === value} onChange={() => setStatus(value)} /> {label}
    </label>
  )

  return (
    <AdminModal title={`RSVP · ${inv.name}`} onClose={onClose}>
      <form onSubmit={save} style={{ display: 'grid', gap: '0.9rem' }}>
        <div>
          <div className="form-label">Asistencia</div>
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
            <Opt value="yes" label="Confirma" />
            <Opt value="no" label="No asiste" />
            <Opt value="none" label="Sin respuesta" />
          </div>
          {status === 'none' && answered && <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0.4rem 0 0' }}>Se borrará su respuesta actual.</p>}
        </div>

        {status === 'yes' && (
          <>
            <div>
              <label className="form-label" htmlFor="rsvp-guests">Personas que asisten (invitación para {capacity})</label>
              <input id="rsvp-guests" className="input" type="number" min="1" max="20" value={guests} onChange={e => setGuests(e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="rsvp-who">Quiénes asisten</label>
              <input id="rsvp-who" className="input" value={who} onChange={e => setWho(e.target.value)} placeholder="Nombres, si quieres anotarlos" />
            </div>
            <div>
              <label className="form-label" htmlFor="rsvp-diet">Restricción alimenticia</label>
              <input id="rsvp-diet" className="input" value={diet} onChange={e => setDiet(e.target.value)} />
            </div>
          </>
        )}
        {status !== 'none' && (
          <div>
            <label className="form-label" htmlFor="rsvp-msg">Mensaje / nota</label>
            <textarea id="rsvp-msg" className="input" rows={2} value={message} onChange={e => setMessage(e.target.value)} />
          </div>
        )}

        {error && <p className="form-error" role="alert" style={{ margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </AdminModal>
  )
}
