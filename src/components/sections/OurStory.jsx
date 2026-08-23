import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import PhotoCardCarousel from '../PhotoCardCarousel'

export default function OurStory() {
  const { get, storyPhotos, loadStoryPhotos } = useApp()

  // Shared with the admin editor via AppContext — an edit there updates this
  // same state directly, instead of this component holding its own stale
  // copy fetched once on mount.
  useEffect(() => { loadStoryPhotos() }, [loadStoryPhotos])

  const body = get('story_body', '')
  const subtitle = get('story_subtitle', '')
  const storyFrame = normalizeImageUrl(get('story_photo_frame_image') || '')

  return (
    <section id="historia" className="section reveal-on-scroll" style={{ textAlign: 'center' }}>
      <span className="kicker">Nuestra Historia</span>
      <h2 className="section-title">{get('story_heading', 'El camino que nos trajo hasta aquí')}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}

      {body && (
        <div style={{
          maxWidth: 580,
          margin: '0 auto 3rem',
          textAlign: 'center',
          lineHeight: 2,
          fontFamily: 'var(--font-heading)',
          fontStyle: 'italic',
          fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)',
          fontWeight: 400,
          opacity: 0.82,
          color: 'var(--color-text)',
        }}>
          {body.split('\n').filter(p => p.trim()).map((p, i) => (
            <p key={i} style={{ marginBottom: '1.1rem' }}>{p}</p>
          ))}
        </div>
      )}

      {storyPhotos.length > 0 && (
        <div className="framed-media full-bleed" style={{ marginTop: '2rem' }}>
          <div className="framed-media-content">
            <PhotoCardCarousel photos={storyPhotos} />
          </div>
          {storyFrame && (
            <img src={storyFrame} alt="" className="framed-media-overlay" aria-hidden="true" />
          )}
        </div>
      )}
    </section>
  )
}
