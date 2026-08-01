import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import StoryCarousel from '../StoryCarousel'

export default function OurStory() {
  const { token, get } = useApp()
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    fetch('/api/story-photos', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(data => setPhotos(data || []))
      .catch(() => {})
  }, [token])

  const body = get('story_body', '')
  const subtitle = get('story_subtitle', '')

  return (
    <section id="historia" className="section reveal-on-scroll" style={{ textAlign: 'center' }}>
      <span className="kicker">Nuestra Historia</span>
      <h2 className="section-title">{get('story_heading', 'El camino que nos trajo hasta aquí')}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}

      {body && (
        <div style={{
          maxWidth: 580,
          margin: '0 auto 3rem',
          textAlign: 'left',
          lineHeight: 2,
          fontSize: '0.95rem',
          opacity: 0.78,
        }}>
          {body.split('\n').filter(p => p.trim()).map((p, i) => (
            <p key={i} style={{ marginBottom: '1.1rem' }}>{p}</p>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <StoryCarousel photos={photos} />
        </div>
      )}
    </section>
  )
}
