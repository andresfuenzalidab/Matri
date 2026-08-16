import { useState, useEffect, useCallback } from 'react'
import { normalizeImageUrl } from '../utils/imageUrl.js'

/**
 * The photo carousel used both by "Nuestra Historia" and by "El lugar" — one
 * component so a change to how it behaves (autoplay timing, arrows, dots)
 * never has to be made twice. Each photo's `caption` carries an optional
 * "Título|Etiqueta" pair, split on the pipe; the admin editor writes that
 * format so this stays a plain, boring string on the wire.
 */
export default function PhotoCardCarousel({ photos, landscape = false }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const go = useCallback((idx) => {
    setFading(true)
    setTimeout(() => { setCurrent(idx); setFading(false) }, 280)
  }, [])

  const prev = () => go((current - 1 + photos.length) % photos.length)
  const next = useCallback(() => go((current + 1) % photos.length), [current, go, photos.length])

  useEffect(() => {
    if (photos.length <= 1) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next, photos.length])

  if (!photos.length) return null
  const photo = photos[current]
  const src = normalizeImageUrl(photo.image_url)

  const parts = (photo.caption || '').split('|')
  const title = parts[0]?.trim()
  const badge = parts[1]?.trim()

  return (
    <div className="photo-card-carousel">
      <div className={`photo-card ${landscape ? 'photo-card--landscape' : ''} ${fading ? 'photo-card-fading' : ''}`}>
        <img src={src} alt={title || ''} onError={e => e.target.style.display = 'none'} />
        {title && (
          <div className="photo-card-overlay">
            <p className="photo-card-title">{title}</p>
            {badge && <span className="photo-card-badge">{badge}</span>}
          </div>
        )}
      </div>
      {photos.length > 1 && (
        <div className="photo-card-controls">
          <button className="photo-card-arrow" onClick={prev} aria-label="Anterior">‹</button>
          <div className="photo-card-dots">
            {photos.map((_, i) => (
              <button key={i}
                className={`photo-card-dot ${i === current ? 'active' : ''}`}
                onClick={() => go(i)} aria-label={`Foto ${i + 1}`} />
            ))}
          </div>
          <button className="photo-card-arrow" onClick={next} aria-label="Siguiente">›</button>
        </div>
      )}
    </div>
  )
}
