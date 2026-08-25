import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { normalizeImageUrl } from '../utils/imageUrl.js'
import { guestDisplayName, pick } from '../utils/guestName.js'

/**
 * The cover art (names, date, envelope, wax seal, "haz click aquí") is one
 * illustrated background image now, not drawn piece by piece with CSS/SVG —
 * see `references/Landing Page.png` in the repo, copied to
 * `public/welcome-cover-bg.png`. Two things it can't know are layered on
 * top instead: the guest's own personalised message, and the actual click
 * target that opens the invitation (roughly over the envelope in the art).
 * `envelope_logo_image` / `envelope_seal_image` / `envelope_names` /
 * `hero_date` no longer apply here — there's no live text left for them to
 * feed. If the couple's names or date ever change, the artwork itself needs
 * a new export; admin can still swap the whole background via
 * `envelope_background_image`, but whatever's uploaded there needs to be a
 * similarly self-contained design (same reasoning as this default one).
 */
export default function WelcomeModal({ guest, onEnter }) {
  const { get } = useApp()
  const [visible, setVisible] = useState(false)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const coverBg = normalizeImageUrl(get('envelope_background_image') || '') || '/welcome-cover-bg.png'
  const cta = get('envelope_cta_text', 'Toca aquí para abrir la invitación')

  const displayName = guestDisplayName(guest)
  const message = guest?.welcomeMessage

  function handleEnter() {
    if (opening) return
    setOpening(true)
    // Let the flap swing open before the page underneath takes over.
    setTimeout(() => {
      setVisible(false)
      setTimeout(onEnter, 420)
    }, 620)
  }

  return (
    <div
      className="envelope-overlay"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Message + card share this wrapper's width, so they scale together
          as one unit at any viewport instead of the message being sized
          independently of the art it sits above. */}
      <div className="envelope-stack">
        <p className="envelope-message">
          {message || (
            <>
              {pick(guest, 'Querido/a', 'Queridos')} <strong>{displayName}</strong>,{' '}
              {pick(
                guest,
                'nos alegra mucho que puedas acompañarnos en este día tan especial.',
                'nos alegra mucho que puedan acompañarnos en este día tan especial.',
              )}
            </>
          )}
        </p>

        <div
          className={`envelope ${opening ? 'is-opening' : ''}`}
          style={{ '--envelope-cover-bg': `url("${coverBg}")` }}
        >
          {/* Generous, roughly over the envelope + "haz click aquí" in the
              art — deliberately bigger than just the wax seal so it doesn't
              need pixel-perfect alignment with the artwork on every device. */}
          <button type="button" className="envelope-card-open" onClick={handleEnter} aria-label={cta} />
        </div>
      </div>
    </div>
  )
}
