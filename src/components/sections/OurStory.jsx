import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import PhotoPlaceholder from '../PhotoPlaceholder'
import StoryCarousel from '../StoryCarousel'

export default function OurStory() {
  const { token, get } = useApp()
  const flowerOverlay = normalizeImageUrl(get('flower_overlay') || '')
  const [sections, setSections] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/story', { headers: { 'X-Invite-Token': token } }).then(r => r.json()),
      fetch('/api/story-photos', { headers: { 'X-Invite-Token': token } }).then(r => r.json()).catch(() => []),
    ]).then(([story, storyPhotos]) => {
      setSections(story)
      setPhotos(storyPhotos || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token])

  if (loading) return (
    <section id="historia" className="section">
      <p className="text-muted">Cargando...</p>
    </section>
  )

  return (
    <section id="historia" className="section reveal-on-scroll">
      <span className="kicker">Nuestra Historia</span>
      <h2 className="section-title">{get('story_heading', 'El camino que nos trajo hasta aquí')}</h2>
      <p className="section-subtitle">{get('story_subtitle', '')}</p>

      {sections.map((sec, i) => {
        const isEven = i % 2 === 0
        const angle = isEven ? -2.5 : 2
        const driftClass = isEven ? '' : 'drift-b'
        return (
          <div key={sec.id} className={`story-section ${isEven ? '' : 'reverse'}`}>
            <div className="story-text">
              {sec.date_label && <span className="story-date">{sec.date_label}</span>}
              <h3>{sec.title}</h3>
              {sec.content && <p>{sec.content}</p>}
            </div>
            <div className={`polaroid ${driftClass}`} style={{ transform: `rotate(${angle}deg)`, position: 'relative' }}>
              {sec.image_url ? (
                <img src={sec.image_url} alt={sec.title} style={{ width: '100%', height: 280, objectFit: 'cover' }} />
              ) : (
                <PhotoPlaceholder size="lg" label={sec.title} alt={sec.title} />
              )}
              {flowerOverlay && (
                <img src={flowerOverlay} alt="" style={{
                  position: 'absolute', bottom: -24, right: -24,
                  width: 90, height: 90, objectFit: 'contain',
                  mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 2,
                }} />
              )}
            </div>
          </div>
        )
      })}

      {sections.length === 0 && (
        <p className="text-muted" style={{ textAlign: 'center', padding: '3rem 0' }}>
          La historia se está escribiendo...
        </p>
      )}

      {photos.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <StoryCarousel photos={photos} />
        </div>
      )}
    </section>
  )
}
