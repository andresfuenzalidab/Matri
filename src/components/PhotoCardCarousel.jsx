import { useState, useEffect, useCallback, useRef } from 'react'
import { normalizeImageUrl } from '../utils/imageUrl.js'

// A swipe has to be mostly horizontal and past this distance to count —
// short/vertical drags are page-scroll attempts, not a slide gesture.
const SWIPE_THRESHOLD = 40

/**
 * The photo carousel used both by "Nuestra Historia" and by "El lugar" — one
 * component so a change to how it behaves (autoplay timing, arrows, dots)
 * never has to be made twice. Each photo's `caption` carries an optional
 * "Título|Etiqueta" pair, split on the pipe; the admin editor writes that
 * format so this stays a plain, boring string on the wire.
 */
export default function PhotoCardCarousel({ photos, landscape = false, autoPlay = true }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const dragRef = useRef(null)

  // Without this, switching to a photo the browser hasn't fetched yet
  // meant the caption (plain text, instant) updated the moment `current`
  // changed while the new `<img src>` was still loading — for however long
  // that took, the card showed the OLD photo (or a blank flash) under the
  // NEW caption. Firing every photo's request up front means they're
  // already decoded and cached by the time `go()` ever swaps to them.
  useEffect(() => {
    photos.forEach(p => { new Image().src = normalizeImageUrl(p.image_url) })
  }, [photos])

  const go = useCallback((idx) => {
    setFading(true)
    setTimeout(() => { setCurrent(idx); setFading(false) }, 280)
  }, [])

  const prev = useCallback(() => go((current - 1 + photos.length) % photos.length), [current, go, photos.length])
  const next = useCallback(() => go((current + 1) % photos.length), [current, go, photos.length])

  useEffect(() => {
    if (!autoPlay || photos.length <= 1) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [autoPlay, next, photos.length])

  function handlePointerDown(e) {
    if (photos.length <= 1) return
    dragRef.current = { x: e.clientX, y: e.clientY }
  }
  function handlePointerUp(e) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    dragRef.current = null
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return
    if (dx > 0) prev(); else next()
  }

  if (!photos.length) return null
  const photo = photos[current]
  const src = normalizeImageUrl(photo.image_url)

  const parts = (photo.caption || '').split('|')
  const title = parts[0]?.trim()
  const badge = parts[1]?.trim()

  return (
    <div className="photo-card-carousel">
      <div
        className={`photo-card ${landscape ? 'photo-card--landscape' : ''} ${fading ? 'photo-card-fading' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { dragRef.current = null }}
        style={{ touchAction: 'pan-y' }}
      >
        <img src={src} alt={title || ''} draggable={false}
          style={{ objectPosition: photo.focal_point || '50% 50%' }}
          onError={e => e.target.style.display = 'none'} />
        {title && (
          <div className="photo-card-overlay">
            <p className="photo-card-title">{title}</p>
            {badge && <span className="photo-card-badge">{badge}</span>}
          </div>
        )}
        {photos.length > 1 && (
          <>
            <button className="photo-card-arrow photo-card-arrow--prev" onClick={prev} aria-label="Anterior">‹</button>
            <button className="photo-card-arrow photo-card-arrow--next" onClick={next} aria-label="Siguiente">›</button>
            <div className="photo-card-dots">
              {photos.map((_, i) => (
                <button key={i}
                  className={`photo-card-dot ${i === current ? 'active' : ''}`}
                  onClick={() => go(i)} aria-label={`Foto ${i + 1}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
