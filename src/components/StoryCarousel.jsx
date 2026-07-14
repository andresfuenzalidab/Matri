import { useState, useEffect, useCallback } from 'react'
import { normalizeImageUrl } from '../utils/imageUrl.js'

export default function StoryCarousel({ photos }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const go = useCallback((idx) => {
    setFading(true)
    setTimeout(() => {
      setCurrent(idx)
      setFading(false)
    }, 280)
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

  return (
    <div className="story-carousel">
      <div className={`story-carousel-img-wrap ${fading ? 'fading' : ''}`}>
        <img
          src={src}
          alt={photo.caption || ''}
          onError={e => e.target.style.display = 'none'}
        />
        {photo.caption && (
          <div className="story-carousel-caption">{photo.caption}</div>
        )}
      </div>

      {photos.length > 1 && (
        <>
          <button className="story-carousel-arrow left" onClick={prev} aria-label="Anterior">‹</button>
          <button className="story-carousel-arrow right" onClick={next} aria-label="Siguiente">›</button>
          <div className="story-carousel-dots">
            {photos.map((_, i) => (
              <button
                key={i}
                className={`story-carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
