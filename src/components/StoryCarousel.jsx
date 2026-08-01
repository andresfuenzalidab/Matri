import { useState, useEffect, useCallback } from 'react'
import { normalizeImageUrl } from '../utils/imageUrl.js'

export default function StoryCarousel({ photos }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const go = useCallback((idx) => {
    setFading(true)
    setTimeout(() => { setCurrent(idx); setFading(false) }, 300)
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
  // Caption supports "Title|Badge subtitle" format
  const parts = (photo.caption || '').split('|')
  const title = parts[0]?.trim()
  const badge = parts[1]?.trim()

  return (
    <div className="photo-card-carousel">
      <div className={`photo-card ${fading ? 'photo-card-fading' : ''}`}>
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
