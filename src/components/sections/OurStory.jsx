import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import PhotoPlaceholder from '../PhotoPlaceholder'
import StoryCarousel from '../StoryCarousel'

export default function OurStory() {
  const { token, get } = useApp()
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
    <section id="historia" className="section">
      <h2 className="section-title">Nuestra Historia</h2>
      <p className="section-subtitle">{get('story_subtitle', 'El camino que nos trajo hasta aquí.')}</p>
      <hr className="hr" />

      {sections.map((sec, i) => (
        <div key={sec.id} className={`story-section ${i % 2 === 1 ? 'reverse' : ''}`}>
          <div className="story-text">
            {sec.date_label && <span className="story-date">{sec.date_label}</span>}
            <h3>{sec.title}</h3>
            {sec.content && <p>{sec.content}</p>}
          </div>
          <PhotoPlaceholder
            size="lg"
            url={sec.image_url}
            label={sec.title}
            alt={sec.title}
          />
        </div>
      ))}

      {sections.length === 0 && (
        <p className="text-muted" style={{ textAlign: 'center', padding: '3rem 0' }}>
          La historia se está escribiendo...
        </p>
      )}

      {photos.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <StoryCarousel photos={photos} />
        </div>
      )}
    </section>
  )
}
