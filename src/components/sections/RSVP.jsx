import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import { guestDisplayName, guestFormalName, isPairInvite, pick } from '../../utils/guestName.js'
import WaveRule from '../WaveRule'
import ThanksCard from '../ThanksCard'

/** Envelope the answered card slides into once it is sent. */
const EnvelopeGraphic = ({ image }) => (
  image ? (
    <img src={image} alt="" className="rsvp-envelope-img"
      onError={e => { e.target.style.display = 'none' }} />
  ) : (
    <svg className="rsvp-envelope-art" viewBox="0 0 320 210" aria-hidden="true">
      <rect x="4" y="34" width="312" height="172" rx="6" fill="var(--paper)" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 40 160 148 316 40" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path d="M4 206 132 118M316 206 188 118" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
    </svg>
  )
)

export default function RSVP({ initialRsvp }) {
  const { token, guest, get } = useApp()
  const isPartyOnly = guest?.invitationType === 'party_only'
  const maxAdditional = guest?.maxAdditionalGuests ?? null
  const knownCompanion = (guest?.companionName || '').trim()

  const [rsvp, setRsvp] = useState(initialRsvp)
  const [attending, setAttending] = useState('')
  const [companionName, setCompanionName] = useState(knownCompanion)
  // One box per person on a pair invitation, both ticked to start with, so
  // either of them can be unticked without the other being treated as the
  // "main" guest.
  const [mainComing, setMainComing] = useState(true)
  const [companionComing, setCompanionComing] = useState(true)
  const [numGuests, setNumGuests] = useState(1)
  const [dietaryRestriction, setDietaryRestriction] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sealing, setSealing] = useState(false)
  const [error, setError] = useState('')

  const isSolo = maxAdditional === 0
  // A named companion implies a pair even when no explicit limit was set.
  const isCouple = maxAdditional === 1 || Boolean(knownCompanion && maxAdditional == null)

  const cardImage = normalizeImageUrl(get('rsvp_card_image') || '')
  const envelopeImage = normalizeImageUrl(get('rsvp_envelope_image') || '')

  // Deadline check
  const deadlineStr = get('rsvp_deadline')
  const isPastDeadline = deadlineStr ? new Date() > new Date(deadlineStr) : false

  // Formal names — the RSVP card is the formal half of the correspondence.
  const mainFormalName = (guest?.name || '').trim()
  const companionFormalName = knownCompanion || companionName.trim()

  function getNumGuests() {
    if (!attending || attending === '0') return 1
    if (isSolo) return 1
    if (isCouple) return (mainComing ? 1 : 0) + (companionComing ? 1 : 0)
    return Number(numGuests) || 1
  }

  /** Who is actually coming — recorded so we know which of the two it is. */
  function getAttendeeNames() {
    if (!attending || attending === '0') return ''
    if (!isCouple) return mainFormalName
    return [
      mainComing ? mainFormalName : null,
      companionComing ? (companionFormalName || 'Acompañante') : null,
    ].filter(Boolean).join(' y ')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!attending) {
      setError('Marca una de las dos opciones para responder.')
      return
    }
    if (attending === '1' && isCouple && !mainComing && !companionComing) {
      setError('Si ninguno de los dos puede asistir, marca «Lamentablemente no podremos».')
      return
    }
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
          companionName: getAttendeeNames(),
          email: email.trim(),
        }),
      })
      if (res.ok) {
        const saved = {
          attending: Number(attending),
          numGuests: getNumGuests(),
          message,
          dietaryRestriction: dietaryRestriction.trim(),
        }
        // Let the card slip into the envelope, then hand over to the thanks.
        // `sealing` has to be cleared here: the sealing view is checked before
        // `rsvp` below, so leaving it set pins the section on "Enviando…".
        setSealing(true)
        setTimeout(() => { setSealing(false); setRsvp(saved) }, 1700)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al enviar. Por favor intenta de nuevo.')
        setLoading(false)
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
      setLoading(false)
    }
  }

  const venueName = get('venue_name', 'Altos del Paico')
  const ceremonyTime = get('ceremony_time', '17:00')
  const receptionTime = get('reception_time', '19:30')
  // The card itself is formal; the thank-you note that follows is informal.
  const formalName = guestFormalName(guest) || mainFormalName
  const displayName = guestDisplayName(guest)
  const pairInvite = isPairInvite(guest)

  // ── Sealing animation: the answered card drops into the envelope ──
  if (sealing && !rsvp) {
    return (
      <section id="rsvp" className="section-compact">
        <div className="rsvp-sealing">
          <div className="rsvp-sealing-stage">
            <div className="rsvp-sealing-letter">
              <p className="rsvp-sealing-letter-label">RSVP</p>
              <p className="rsvp-sealing-letter-name">{formalName}</p>
              <p className="rsvp-sealing-letter-answer">
                {attending === '1' ? 'Con mucho gusto' : 'No podremos'}
              </p>
            </div>
            <EnvelopeGraphic image={envelopeImage} />
          </div>
          <p className="rsvp-sealing-caption">Enviando tu respuesta…</p>
        </div>
      </section>
    )
  }

  // ── Already answered ──
  if (rsvp) {
    const companions = rsvp.numGuests > 1 ? rsvp.numGuests - 1 : 0
    // Follow who actually confirmed: one of a pair coming alone is singular.
    const plural = rsvp.attending ? rsvp.numGuests > 1 : pairInvite

    const defaultAttendingMsg = isPartyOnly
      ? `¡Nos alegra que ${plural ? 'puedan' : 'puedas'} celebrar con nosotros!${companions > 0 ? ` Esperamos a ${companions + 1} personas de tu parte.` : ''} Los esperamos a partir de las ${receptionTime} en ${venueName}.`
      : `¡Nos alegra saber que ${plural ? 'estarán' : 'estarás'} con nosotros!${companions > 0 ? ` Esperamos a ${companions + 1} personas de tu parte.` : ''} ${plural ? 'Los' : 'Te'} esperamos a las ${ceremonyTime} en ${venueName}.`
    const defaultDeclinedMsg = `Lamentamos que no ${plural ? 'puedan' : 'puedas'} acompañarnos. ${plural ? 'Los' : 'Te'} tendremos en el corazón ese día especial.`

    const attendingMsg = (get('rsvp_thanks_attending') || defaultAttendingMsg).replace(/\{NOMBRE\}/gi, displayName)
    const declinedMsg = (get('rsvp_thanks_declined') || defaultDeclinedMsg).replace(/\{NOMBRE\}/gi, displayName)

    return (
      <section id="rsvp" className="section-compact">
        <ThanksCard symbol={rsvp.attending ? '♡' : '✦'} title={`Gracias, ${displayName}`}>
          <p className="thanks-message">{rsvp.attending ? attendingMsg : declinedMsg}</p>
          {/* The calendar buttons live on the date card further up the page. */}
          {rsvp.attending ? (
            <button
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
              onClick={() => document.getElementById('regalos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver lista de regalos →
            </button>
          ) : null}
        </ThanksCard>
      </section>
    )
  }

  const dietaryQuestion = get('rsvp_dietary_question')
  const deadlineLabel = deadlineStr
    ? new Date(deadlineStr + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  if (isPastDeadline) {
    return (
      <section id="rsvp" className="section-compact">
        <ThanksCard symbol="✦" title="Plazo cerrado">
          <p className="thanks-message">
            El plazo para confirmar asistencia venció el {deadlineLabel}. Si tienes alguna duda, escríbenos directamente.
          </p>
        </ThanksCard>
      </section>
    )
  }

  // ── The open letter ──
  return (
    <section id="rsvp" className="section rsvp-section">
      <form className="rsvp-letter reveal-on-scroll" onSubmit={handleSubmit} noValidate>
        {cardImage && (
          <img src={cardImage} alt="" className="rsvp-letter-decor" aria-hidden="true"
            onError={e => { e.target.style.display = 'none' }} />
        )}

        <div className="rsvp-letter-inner">
          <p className="rsvp-letter-heading">RSVP</p>
          <WaveRule />

          {/* The addressee, written on the line — "M ______" on stationery.
              Formal names here, as on a printed reply card. */}
          <div className="rsvp-letter-line">
            <span className="rsvp-letter-line-mark" aria-hidden="true">M</span>
            <span className="rsvp-letter-line-name">{formalName}</span>
          </div>

          <p className="rsvp-letter-prompt">
            {isPartyOnly
              ? `${pairInvite ? 'Cuéntennos' : 'Cuéntanos'} si ${pairInvite ? 'podrán' : 'podrás'} celebrar con nosotros — la fiesta comienza a las ${receptionTime}.`
              : `${pairInvite ? 'Cuéntennos' : 'Cuéntanos'} si ${pairInvite ? 'nos acompañarán' : 'nos acompañarás'} ese día.`}
          </p>

          {/* ── The two answers, as tick boxes on the card ── */}
          <div className="rsvp-choices">
            <label className={`rsvp-choice ${attending === '1' ? 'is-picked' : ''}`}>
              <input type="radio" name="attending" value="1"
                checked={attending === '1'}
                onChange={e => setAttending(e.target.value)} />
              <span className="rsvp-choice-box" aria-hidden="true">✓</span>
              <span className="rsvp-choice-text">
                {pick(guest, 'Asistiré con mucho gusto', 'Asistiremos con mucho gusto')}
              </span>
            </label>
            <label className={`rsvp-choice ${attending === '0' ? 'is-picked' : ''}`}>
              <input type="radio" name="attending" value="0"
                checked={attending === '0'}
                onChange={e => setAttending(e.target.value)} />
              <span className="rsvp-choice-box" aria-hidden="true">✓</span>
              <span className="rsvp-choice-text">
                {pick(guest, 'Lamentablemente no podré', 'Lamentablemente no podremos')}
              </span>
            </label>
          </div>

          {/* ── Who is coming: one box per person, both ticked by default ── */}
          {attending === '1' && isCouple && (
            <div className="rsvp-attendees">
              <p className="rsvp-field-label">Confirmamos la asistencia de</p>
              <label className={`rsvp-attendee ${mainComing ? 'is-coming' : ''}`}>
                <input type="checkbox" checked={mainComing}
                  onChange={e => setMainComing(e.target.checked)} />
                <span className="rsvp-attendee-box" aria-hidden="true">✓</span>
                <span className="rsvp-attendee-name">{mainFormalName}</span>
              </label>
              <label className={`rsvp-attendee ${companionComing ? 'is-coming' : ''}`}>
                <input type="checkbox" checked={companionComing}
                  onChange={e => setCompanionComing(e.target.checked)} />
                <span className="rsvp-attendee-box" aria-hidden="true">✓</span>
                <span className="rsvp-attendee-name">
                  {knownCompanion || companionName.trim() || 'Mi acompañante'}
                </span>
              </label>
              <p className="rsvp-field-hint">
                Desmarca a quien no pueda acompañarnos.
              </p>
            </div>
          )}

          {attending === '1' && isCouple && companionComing && !knownCompanion && (
            <div className="rsvp-field">
              <label className="rsvp-field-label" htmlFor="companion-name">Nombre de tu acompañante</label>
              <input id="companion-name" className="rsvp-input" type="text"
                value={companionName} onChange={e => setCompanionName(e.target.value)}
                placeholder="Nombre completo…" />
            </div>
          )}

          {attending === '1' && !isSolo && !isCouple && (
            <div className="rsvp-field">
              <label className="rsvp-field-label" htmlFor="num-guests">¿Cuántos asistirán (incluyéndote)?</label>
              <input id="num-guests" className="rsvp-input" type="number" min="1"
                max={maxAdditional != null ? maxAdditional + 1 : 20}
                value={numGuests} onChange={e => setNumGuests(e.target.value)}
                style={{ maxWidth: 90 }} />
            </div>
          )}

          {dietaryQuestion && attending === '1' && !isPartyOnly && (
            <div className="rsvp-field">
              <label className="rsvp-field-label" htmlFor="dietary">{dietaryQuestion}</label>
              <input id="dietary" className="rsvp-input" type="text"
                value={dietaryRestriction} onChange={e => setDietaryRestriction(e.target.value)}
                placeholder="Escribe aquí si hay alguna restricción…" />
            </div>
          )}

          {attending !== '' && (
            <div className="rsvp-field">
              <label className="rsvp-field-label" htmlFor="rsvp-email">
                Email {attending === '1' ? '*' : '(opcional)'}
              </label>
              <input id="rsvp-email" className="rsvp-input" type="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" />
              {attending === '1' && (
                <span className="rsvp-field-hint">Te enviaremos una confirmación.</span>
              )}
            </div>
          )}

          {attending !== '' && (
            <div className="rsvp-field">
              <label className="rsvp-field-label" htmlFor="rsvp-message">Un mensaje para los novios (opcional)</label>
              <textarea id="rsvp-message" className="rsvp-input rsvp-textarea" rows={3}
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Escribe unas líneas…" />
            </div>
          )}

          {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}

          {deadlineLabel && (
            <p className="rsvp-letter-deadline">
              Por favor {pairInvite ? 'respondan' : 'responde'} antes del {deadlineLabel}
            </p>
          )}

          <button className="rsvp-send" type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Sellar y enviar'}
          </button>
        </div>
      </form>
    </section>
  )
}
