import { useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import PhotoPlaceholder from '../PhotoPlaceholder'

export default function Home({ welcomed }) {
  const { get, loadContent } = useApp()
  const videoRef = useRef(null)

  useEffect(() => { loadContent() }, [loadContent])

  useEffect(() => {
    if (welcomed && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }, [welcomed])

  const heroImage = get('hero_image')
  const heroVideo = get('hero_video') || '/hero.mp4'

  return (
    <section id="inicio" className="hero">
      {heroVideo ? (
        <div className="hero-video-wrap">
          <video
            ref={videoRef}
            muted loop playsInline
            className="hero-video"
            src={heroVideo}
          />
          <div className="hero-video-overlay" />
        </div>
      ) : (
        <div className="hero-image-wrap">
          <PhotoPlaceholder
            size="hero"
            url={heroImage}
            label="Foto principal"
            alt="Andrés y Catalina"
          />
        </div>
      )}

      {!heroVideo && (
        <div className="hero-content fade-in-up">
          <div className="hero-subtitle">{get('hero_subtitle', 'Nos casamos')}</div>
          <h1 className="hero-title">{get('hero_title', 'Andrés & Catalina')}</h1>
          <div className="hero-date">{get('hero_date', 'Viernes 6 de noviembre de 2026')}</div>
          <div className="hero-location">{get('hero_location', 'Altos del Paico')}</div>
        </div>
      )}
    </section>
  )
}
