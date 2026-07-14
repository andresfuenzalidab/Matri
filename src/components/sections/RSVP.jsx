import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function RSVP({ initialRsvp }) {
  const { token, guest } = useApp()
  const [rsvp, setRsvp] = useState(initialRsvp)
  const [attending, setAttending] = useState('1')
  const [numGuests, setNumGuests] = useState(1)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
          numGuests: Number(numGuests),
          message,
        }),
      })
      if (res.ok) {
        setRsvp({ attending: Number(attending), numGuests: Number(numGuests), message })
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
      <section id="rsvp" className="section">
        <div className="rsvp-submitted">
          <div className="rsvp-check">
            {rsvp.attending ? '♡' : '✦'}
          </div>
          <h2>Gracias, {guest?.name}</h2>
          <p>
            {rsvp.attending
              ? `¡Nos alegra saber que estarás con nosotros!${companions > 0 ? ` Esperamos a ${companions + 1} personas de tu parte.` : ''} Te esperamos el 6 de noviembre en Altos del Paico.`
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

  return (
    <section id="rsvp" className="section">
      <h2 className="section-title">RSVP</h2>
      <p className="section-subtitle">
        Confírmanos tu asistencia antes del 15 de octubre de 2026.
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
              <input
                type="radio" name="attending" value="1"
                checked={attending === '1'}
                onChange={e => setAttending(e.target.value)}
              />
              Sí, con mucho gusto
            </label>
            <label className="rsvp-radio-label">
              <input
                type="radio" name="attending" value="0"
                checked={attending === '0'}
                onChange={e => setAttending(e.target.value)}
              />
              No podré asistir
            </label>
          </div>
        </div>

        {attending === '1' && (
          <div className="form-field">
            <label className="form-label" htmlFor="num-guests">
              ¿Cuántos asistirán (incluyéndote)?
            </label>
            <input
              id="num-guests"
              className="input"
              type="number" min="1" max="10"
              value={numGuests}
              onChange={e => setNumGuests(e.target.value)}
              style={{ width: 100 }}
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
