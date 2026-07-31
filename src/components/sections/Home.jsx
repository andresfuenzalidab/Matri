import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'

export default function Home() {
  const { loadContent } = useApp()
  useEffect(() => { loadContent() }, [loadContent])

  return (
    <section id="inicio" style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 640, overflow: 'hidden' }}>
      {/* Show the fixed SharedHeroVideo through this transparent layer */}
      <div style={{ width: '100%', height: '100%', background: 'transparent' }} />

      {/* Seamless fade to page bg at the bottom */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 65%, #eceae8 100%)',
      }} />

      {/* Scroll hint */}
      <div style={{
        position: 'absolute', bottom: 28, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'var(--font-heading)', fontSize: 12,
        letterSpacing: '0.3em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.85)',
        opacity: 0.85, pointerEvents: 'none',
      }}>
        Desliza para continuar el jardín ↓
      </div>
    </section>
  )
}
