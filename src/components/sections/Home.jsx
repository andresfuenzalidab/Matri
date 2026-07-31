import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { BotanicalHeroLeft, BotanicalHeroRight, BotanicalOrnament } from '../Botanical'

export default function Home() {
  const { loadContent, get } = useApp()
  useEffect(() => { loadContent() }, [loadContent])

  const title = get('hero_title', 'Catalina & Andrés')
  const [name1, name2] = title.includes('&') ? title.split('&').map(s => s.trim()) : [title, '']
  const date = get('hero_date', 'Viernes 6 de noviembre de 2026')
  const location = get('hero_location', 'Altos del Paico · Santiago, Chile')

  return (
    <section id="inicio" className="editorial-hero">
      {/* Gradient over video */}
      <div className="hero-video-overlay" />

      {/* Botanical frames — left */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 'min(320px, 35vw)', pointerEvents: 'none', zIndex: 2,
        display: 'flex', alignItems: 'flex-start',
      }}>
        <BotanicalHeroLeft style={{ opacity: 0.82, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }} />
      </div>

      {/* Botanical frames — right */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: 'min(320px, 35vw)', pointerEvents: 'none', zIndex: 2,
        display: 'flex', alignItems: 'flex-start',
      }}>
        <BotanicalHeroRight style={{ opacity: 0.82, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }} />
      </div>

      {/* Editorial content */}
      <div className="editorial-hero-content" style={{ position: 'relative', zIndex: 3 }}>
        <p className="hero-eyebrow">JUNTO A NUESTRAS FAMILIAS</p>
        <p className="hero-eyebrow" style={{ marginBottom: '2.5rem' }}>TE INVITAMOS A NUESTRA BODA</p>

        <h1 className="editorial-name">{name1}</h1>
        <div className="editorial-ampersand">y</div>
        {name2 && <h1 className="editorial-name">{name2}</h1>}

        <BotanicalOrnament style={{ margin: '1.5rem auto', opacity: 0.7, filter: 'brightness(10) saturate(0)' }} />

        <p className="editorial-date">{date.toUpperCase()}</p>
        <p className="editorial-location">{location.toUpperCase()}</p>

        {get('hero_quote') && (
          <p className="editorial-quote">"{get('hero_quote')}"</p>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator" style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
        <div className="scroll-indicator-dot" />
        <div className="scroll-indicator-line" />
      </div>
    </section>
  )
}
