import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { normalizeImageUrl } from '../utils/imageUrl.js'
import { guestDisplayName, pick } from '../utils/guestName.js'
import { longDateLabel } from '../utils/weddingDate.js'

/** The wax seal drawn when no seal image is uploaded. */
const SealSprig = () => (
  <svg viewBox="0 0 40 40" className="envelope-seal-art" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
      <path d="M20 31V15" />
      <path d="M20 22c-4 0-6.5-2-7.5-5.5 3.5 0 6.5 1.5 7.5 5.5z" />
      <path d="M20 22c4 0 6.5-2 7.5-5.5-3.5 0-6.5 1.5-7.5 5.5z" />
      <path d="M20 15c-2.6-1.4-3.6-3.4-3-6 2.2.8 3.4 2.6 3 6z" />
      <path d="M20 15c2.6-1.4 3.6-3.4 3-6-2.2.8-3.4 2.6-3 6z" />
      <circle cx="20" cy="10.5" r="1.6" />
      <circle cx="13.5" cy="13" r="1.2" />
      <circle cx="26.5" cy="13" r="1.2" />
    </g>
  </svg>
)

/** Bouncing arrow that points down at the seal. */
const PointerArrow = () => (
  <svg viewBox="0 0 24 30" className="envelope-arrow" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v20" />
      <path d="M5.5 16.5 12 23l6.5-6.5" />
    </g>
  </svg>
)

export default function WelcomeModal({ guest, onEnter }) {
  const { get } = useApp()
  const [visible, setVisible] = useState(false)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const logo = normalizeImageUrl(get('envelope_logo_image') || '')
  const sealImage = normalizeImageUrl(get('envelope_seal_image') || '')
  const cta = get('envelope_cta_text', 'Toca aquí para abrir la invitación')
  const dateLabel = get('hero_date') || longDateLabel(get('wedding_date'))
  // Own key so the envelope can read "Cata & Andrés" while the rest of the
  // site keeps whatever `hero_title` says.
  const names = get('envelope_names') || get('hero_title', 'Cata & Andrés')

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
      <div className={`envelope ${opening ? 'is-opening' : ''}`}>
        {/* ── Upper half: logo + personalised message ── */}
        <div className="envelope-top">
          <svg className="envelope-fold" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 0 L50 100 L100 0" fill="none" stroke="currentColor" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
          </svg>

          <div className="envelope-top-content">
            {/* Order: logo → names → date → personalised message */}
            {logo && (
              <img src={logo} alt="" className="envelope-logo"
                onError={e => { e.target.style.display = 'none' }} />
            )}

            <p className={`envelope-names ${logo ? '' : 'envelope-names-framed'}`}>
              {!logo && <span className="envelope-monogram-ring" aria-hidden="true" />}
              {names}
            </p>

            <p className="envelope-date">{dateLabel}</p>

            <p className="envelope-message">
              {message || (
                <>
                  {pick(guest, 'Querido/a', 'Queridos')} <strong>{displayName}</strong>,
                  <br />
                  {pick(
                    guest,
                    'nos alegra mucho que puedas acompañarnos en este día tan especial.',
                    'nos alegra mucho que puedan acompañarnos en este día tan especial.',
                  )}
                </>
              )}
            </p>
          </div>

          {/* ── The seal sits exactly on the fold ── */}
          <div className="envelope-seal-slot">
            <PointerArrow />
            <button
              type="button"
              className="envelope-seal"
              onClick={handleEnter}
              aria-label={cta}
            >
              {sealImage ? (
                <img src={sealImage} alt="" onError={e => { e.target.style.display = 'none' }} />
              ) : (
                <SealSprig />
              )}
            </button>
          </div>
        </div>

        {/* ── Lower half: the invitation to click ── */}
        <div className="envelope-bottom">
          <svg className="envelope-fold" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 100 L50 0 L100 100" fill="none" stroke="currentColor" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
          </svg>
          <button type="button" className="envelope-cta" onClick={handleEnter}>
            {cta}
          </button>
        </div>
      </div>
    </div>
  )
}
