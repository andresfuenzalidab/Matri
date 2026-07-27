import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import PhotoPlaceholder from '../PhotoPlaceholder'

export default function Home() {
  const { get, loadContent } = useApp()

  useEffect(() => { loadContent() }, [loadContent])

  const heroImage = get('hero_image')
  const heroVideo = get('hero_video') || '/hero.mp4'

  return (
    <section id="inicio" className="hero">
      {heroVideo ? (
        <div className="hero-video-wrap">
          <video
            autoPlay muted loop playsInline
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

      <div className={`hero-content fade-in-up ${heroVideo ? 'hero-content-over-video' : ''}`}>
        <div className="hero-subtitle">{get('hero_subtitle', 'Nos casamos')}</div>
        <h1 className="hero-title">{get('hero_title', 'Andrés & Catalina')}</h1>
        <div className="hero-date">{get('hero_date', 'Viernes 6 de noviembre de 2026')}</div>
        <div className="hero-location">{get('hero_location', 'Altos del Paico')}</div>
      </div>
    </section>
  )
}
