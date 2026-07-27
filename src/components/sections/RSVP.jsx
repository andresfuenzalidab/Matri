import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function RSVP({ initialRsvp }) {
  const { token, guest, get } = useApp()
  const isPartyOnly = guest?.invitationType === 'party_only'
  const maxAdditional = guest?.maxAdditionalGuests ?? null

  const [rsvp, setRsvp] = useState(initialRsvp)
  const [attending, setAttending] = useState('1')
  const [companionAttending, setCompanionAttending] = useState(true)
  const [numGuests, setNumGuests] = useState(1)
  const [dietaryRestriction, setDietaryRestriction] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // maxAdditional === 0: solo (total 1 person)
  // maxAdditional === 1: with companion (total 2 people)
  // maxAdditional > 1 or null: open number input
  const isSolo = maxAdditional === 0
  const isCouple = maxAdditional === 1

  function getNumGuests() {
    if (!attending || attending === '0') return 1
    if (isSolo) return 1
    if (isCouple) return companionAttending ? 2 : 1
    return Number(numGuests) || 1
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Invite-Token': token,
        },
        body: JSON.stringify({
          attending: Number(attending),
          numGuests: getNumGuests(),
          message,
          dietaryRestriction: dietaryRestriction.trim(),
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

  if (rsvp) {
    const companions = rsvp.numGuests > 1 ? rsvp.numGuests - 1 : 0
    return (
      <section id="rsvp" className="section-compact">
        <div className="rsvp-submitted">
          <div className="rsvp-check">{rsvp.attending ? '♡' : '✦'}</div>
          <h2>Gracias, {guest?.name}</h2>
          <p>
            {rsvp.attending
              ? isPartyOnly
                ? `¡Nos alegra que puedas celebrar con nosotros!${companions > 0 ? ` Esperamos a ${companions + 1} personas de tu parte.` : ''} Los esperamos a partir de las ${get('reception_time', '19:30')} en ${get('venue_name', 'Altos del Paico')}.`
                : `¡Nos alegra saber que estarás con nosotros!${companions > 0 ? ` Esperamos a ${companions + 1} personas de tu parte.` : ''} Te esperamos a las ${get('ceremony_time', '17:00')} en ${get('venue_name', 'Altos del Paico')}.`
              : 'Lamentamos que no puedas acompañarnos. Te tendremos en el corazón ese día especial.'}
          </p>
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

  return (
    <section id="rsvp" className="section">
      <h2 className="section-title reveal-on-scroll">RSVP</h2>
      <p className="section-subtitle reveal-on-scroll">
        {isPartyOnly
          ? `Confírmanos si podrás celebrar con nosotros — te esperamos en la fiesta a las ${get('reception_time', '19:30')}.`
          : 'Confírmanos tu asistencia antes del 15 de octubre de 2026.'}
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

        {/* Companion question (only when attending and maxAdditional === 1) */}
        {attending === '1' && isCouple && (
          <div className="form-field">
            <label className="rsvp-checkbox-label">
              <input
                type="checkbox"
                checked={companionAttending}
                onChange={e => setCompanionAttending(e.target.checked)}
              />
              {companionQuestion}
            </label>
          </div>
        )}

        {/* Number input (only when attending and maxAdditional > 1 or null) */}
        {attending === '1' && !isSolo && !isCouple && (
          <div className="form-field">
            <label className="form-label" htmlFor="num-guests">
              ¿Cuántos asistirán (incluyéndote)?
            </label>
            <input
              id="num-guests"
              className="input"
              type="number"
              min="1"
              max={maxAdditional != null ? maxAdditional + 1 : 20}
              value={numGuests}
              onChange={e => setNumGuests(e.target.value)}
              style={{ width: 100 }}
            />
          </div>
        )}

        {/* Dietary restriction (optional, only when question is configured) */}
        {dietaryQuestion && attending === '1' && (
          <div className="form-field">
            <label className="form-label" htmlFor="dietary">{dietaryQuestion}</label>
            <input
              id="dietary"
              className="input"
              type="text"
              value={dietaryRestriction}
              onChange={e => setDietaryRestriction(e.target.value)}
              placeholder="Escribe aquí si tienes alguna restricción..."
            />
          </div>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="rsvp-message">
            Mensaje para los novios (opcional)
          </label>
          <textarea
            id="rsvp-message"
            className="input"
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Confirmar asistencia'}
        </button>
      </form>
    </section>
  )
}
