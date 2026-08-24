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

      {/* Scroll hint — the only thing standing in for the nav bar (hidden
          until the guest scrolls, see Nav.jsx) on this first screen, so it
          needs to actually read as an instruction, not a faint caption.
          Dark + a soft light halo instead of translucent white: white text
          alone washed out against bright footage and left people stranded
          not knowing to scroll. */}
      <div style={{
        position: 'absolute', bottom: 28, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'var(--font-heading)', fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.3em', textTransform: 'uppercase',
        color: 'rgba(20,18,14,0.92)',
        textShadow: '0 1px 3px rgba(255,255,255,0.55), 0 0 14px rgba(255,255,255,0.35)',
        pointerEvents: 'none',
      }}>
        Desliza para continuar el jardín ↓
      </div>
    </section>
  )
}
