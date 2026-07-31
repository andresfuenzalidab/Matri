import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

export default function Home() {
  const { loadContent, get } = useApp()
  useEffect(() => { loadContent() }, [loadContent])

  const heroImage = normalizeImageUrl(get('hero_image') || '')

  return (
    <section id="inicio" style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 640, overflow: 'hidden' }}>
      {heroImage ? (
        <img
          src={heroImage}
          alt="Catalina y Andrés"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
        />
      ) : (
        /* Fallback: show the fixed background video through a transparent layer */
        <div style={{ width: '100%', height: '100%', background: 'transparent' }} />
      )}

      {/* Seamless fade to cream at the bottom */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 65%, #F3F2F2 100%)',
      }} />

      {/* Scroll hint */}
      <div style={{
        position: 'absolute', bottom: 28, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'var(--font-heading)', fontSize: 12,
        letterSpacing: '0.3em', textTransform: 'uppercase',
        color: heroImage ? '#fffdf8' : 'rgba(255,255,255,0.85)',
        opacity: 0.85, pointerEvents: 'none',
      }}>
        Desliza para continuar el jardín ↓
      </div>
    </section>
  )
}
