import { useState } from 'react'
import { useApp } from '../../context/AppContext'

function AddToCalendar({ venueName, ceremonyTime, isPartyOnly, receptionTime, eventEndTime }) {
  const startHour = isPartyOnly ? (receptionTime || '19:30') : (ceremonyTime || '17:00')
  const [h, m] = startHour.split(':').map(Number)
  // Chile is UTC-3 on Nov 6, 2026
  const startUtcH = String(h + 3).padStart(2, '0')
  const dtStart = `20261106T${startUtcH}${String(m).padStart(2, '0')}00Z`
  // End time: configurable from admin as HH:MM on Nov 7 (next day)
  const [eh, em] = (eventEndTime || '03:00').split(':').map(Number)
  const endUtcH = String(eh + 3).padStart(2, '0')
  const dtEnd = `20261107T${endUtcH}${String(em).padStart(2, '0')}00Z`

  const title = 'Matrimonio Cata & Andrés'
  const gcUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${dtStart}/${dtEnd}` +
    `&location=${encodeURIComponent(venueName || 'Altos del Paico')}`

  function downloadIcs() {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Matrimonio//ES',
      'BEGIN:VEVENT',
      `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
      `SUMMARY:${title}`,
      `LOCATION:${venueName || 'Altos del Paico'}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'matrimonio-cata-andres.ics'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <a href={gcUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
        + Google Calendar
      </a>
      <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }} onClick={downloadIcs}>
        + Apple / Outlook
      </button>
    </div>
  )
}

export default function RSVP({ initialRsvp }) {
  const { token, guest, get } = useApp()
  const isPartyOnly = guest?.invitationType === 'party_only'
  const maxAdditional = guest?.maxAdditionalGuests ?? null

  const [rsvp, setRsvp] = useState(initialRsvp)
  const [attending, setAttending] = useState('1')
  const [companionAttending, setCompanionAttending] = useState(true)
  const [companionName, setCompanionName] = useState('')
  const [numGuests, setNumGuests] = useState(1)
  const [dietaryRestriction, setDietaryRestriction] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isSolo = maxAdditional === 0
  const isCouple = maxAdditional === 1

  // Deadline check
  const deadlineStr = get('rsvp_deadline')
  const isPastDeadline = deadlineStr ? new Date() > new Date(deadlineStr) : false

  function getNumGuests() {
    if (!attending || attending === '0') return 1
    if (isSolo) return 1
    if (isCouple) return companionAttending ? 2 : 1
    return Number(numGuests) || 1
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (attending === '1' && !email.trim()) {
      setError('El email es requerido.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({
          attending: Number(attending),
          numGuests: getNumGuests(),
          message,
          dietaryRestriction: dietaryRestriction.trim(),
          companionName: companionName.trim(),
          email: email.trim(),
        }),
      })
      if (res.ok) {
        setRsvp({
          attending: Number(attending),
          numGuests: getNumGuests(),
          message,
          dietaryRestriction: dietaryRestriction.trim(),
        })
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al enviar. Por favor intenta de nuevo.')
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const venueName = get('venue_name', 'Altos del Paico')
  const ceremonyTime = get('ceremony_time', '17:00')
  const receptionTime = get('reception_time', '19:30')

  if (rsvp) {
    const companions = rsvp.numGuests > 1 ? rsvp.numGuests - 1 : 0
    const displayName = guest?.nickname || guest?.name || ''

    const defaultAttendingMsg = isPartyOnly
      ? `¡Nos alegra que puedas celebrar con nosotros!${companions > 0 ? ` Esperamos a ${companions + 1} personas de tu parte.` : ''} Los esperamos a partir de las ${receptionTime} en ${venueName}.`
      : `¡Nos alegra saber que estarás con nosotros!${companions > 0 ? ` Esperamos a ${companions + 1} personas de tu parte.` : ''} Te esperamos a las ${ceremonyTime} en ${venueName}.`
    const defaultDeclinedMsg = 'Lamentamos que no puedas acompañarnos. Te tendremos en el corazón ese día especial.'

    const attendingMsg = (get('rsvp_thanks_attending') || defaultAttendingMsg).replace(/\{NOMBRE\}/gi, displayName)
    const declinedMsg = (get('rsvp_thanks_declined') || defaultDeclinedMsg).replace(/\{NOMBRE\}/gi, displayName)

    return (
      <section id="rsvp" className="section-compact">
        <div className="rsvp-submitted">
          <div className="rsvp-check">{rsvp.attending ? '♡' : '✦'}</div>
          <h2>Gracias, {displayName}</h2>
          <p>{rsvp.attending ? attendingMsg : declinedMsg}</p>
          {rsvp.attending && (
            <AddToCalendar
              venueName={venueName}
              ceremonyTime={ceremonyTime}
              receptionTime={receptionTime}
              isPartyOnly={isPartyOnly}
              eventEndTime={get('wedding_end_time')}
            />
          )}
          {rsvp.attending ? (
            <button
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
              onClick={() => document.getElementById('regalos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver lista de regalos →
            </button>
          ) : null}
        </div>
      </section>
    )
  }

  const dietaryQuestion = get('rsvp_dietary_question')
  const companionQuestion = get('rsvp_companion_question', '¿Confirmas la asistencia de tu acompañante?')
  const deadlineLabel = deadlineStr
    ? new Date(deadlineStr + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  if (isPastDeadline) {
    return (
      <section id="rsvp" className="section-compact">
        <div className="rsvp-submitted">
          <div className="rsvp-check">✦</div>
          <h2>Plazo cerrado</h2>
          <p>El plazo para confirmar asistencia venció el {deadlineLabel}. Si tienes alguna duda, escríbenos directamente.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="rsvp" className="section">
      <h2 className="section-title reveal-on-scroll">RSVP</h2>
      <p className="section-subtitle reveal-on-scroll">
        {isPartyOnly
          ? `Confírmanos si podrás celebrar con nosotros — te esperamos en la fiesta a las ${receptionTime}.`
          : deadlineLabel
            ? `Confírmanos tu asistencia antes del ${deadlineLabel}.`
            : 'Confírmanos tu asistencia.'}
      </p>

      <form className="rsvp-container" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label className="form-label">Nombre</label>
          <div className="rsvp-guest-name">{guest?.name}</div>
        </div>

        <div className="form-field">
          <label className="form-label">¿Asistirás?</label>
          <div className="rsvp-attending-row">
            <label className="rsvp-radio-label">
              <input type="radio" name="attending" value="1"
                checked={attending === '1'}
                onChange={e => setAttending(e.target.value)} />
              Sí, con mucho gusto
            </label>
            <label className="rsvp-radio-label">
              <input type="radio" name="attending" value="0"
                checked={attending === '0'}
                onChange={e => setAttending(e.target.value)} />
              No podré asistir
            </label>
          </div>
        </div>

        {attending === '1' && isCouple && (
          <div className="form-field">
            <label className="rsvp-checkbox-label">
              <input type="checkbox" checked={companionAttending}
                onChange={e => setCompanionAttending(e.target.checked)} />
              {companionQuestion}
            </label>
          </div>
        )}

        {attending === '1' && isCouple && companionAttending && (
          <div className="form-field">
            <label className="form-label" htmlFor="companion-name">Nombre de tu acompañante</label>
            <input id="companion-name" className="input" type="text"
              value={companionName} onChange={e => setCompanionName(e.target.value)}
              placeholder="Nombre completo..." />
          </div>
        )}

        {attending === '1' && !isSolo && !isCouple && (
          <div className="form-field">
            <label className="form-label" htmlFor="num-guests">¿Cuántos asistirán (incluyéndote)?</label>
            <input id="num-guests" className="input" type="number" min="1"
              max={maxAdditional != null ? maxAdditional + 1 : 20}
              value={numGuests} onChange={e => setNumGuests(e.target.value)}
              style={{ width: 100 }} />
          </div>
        )}

        {dietaryQuestion && attending === '1' && !isPartyOnly && (
          <div className="form-field">
            <label className="form-label" htmlFor="dietary">{dietaryQuestion}</label>
            <input id="dietary" className="input" type="text"
              value={dietaryRestriction} onChange={e => setDietaryRestriction(e.target.value)}
              placeholder="Escribe aquí si tienes alguna restricción..." />
          </div>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="rsvp-email">
            Email {attending === '1' ? '*' : '(opcional)'}
          </label>
          <input id="rsvp-email" className="input" type="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com" />
          {attending === '1' && <span style={{ fontSize: '0.75rem', opacity: 0.55 }}>Te enviaremos una confirmación.</span>}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="rsvp-message">Mensaje para los novios (opcional)</label>
          <textarea id="rsvp-message" className="input" rows={3}
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..." />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Confirmar asistencia'}
        </button>
      </form>
    </section>
  )
}
