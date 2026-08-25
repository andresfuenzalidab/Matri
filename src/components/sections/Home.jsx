import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'

export default function Home() {
  const { loadContent } = useApp()
  useEffect(() => { loadContent() }, [loadContent])

  return (
    <section id="inicio" style={{ position: 'relative', width: '100%', height: '100dvh', minHeight: 640, overflow: 'hidden' }}>
      {/* `100dvh`, not `100vh`: on mobile, `100vh` counts the space still
          hidden behind the browser's address bar, so anything anchored near
          the bottom of a `100vh` box (the scroll hint below) sat below the
          actually-visible fold until the browser chrome collapsed — exactly
          the "I don't see it at the start" this was supposed to prevent.
          `dvh` tracks the real visible viewport instead. */}
      {/* Show the fixed SharedHeroVideo through this transparent layer */}
      <div style={{ width: '100%', height: '100%', background: 'transparent' }} />

      {/* Seamless fade to page bg at the bottom — fades to green, not the
          old cream: below this point the page is `.stationery-main` (the
          capped, phone-width card) sitting on a green fill everywhere else
          (see stationery.css), and green is what actually shows across
          MOST of this width now. Fading to cream instead left a visibly
          mismatched cream band right where the card is narrower than the
          hero, before the card's own edge even begins. */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 65%, var(--stationery-fill-color) 100%)',
      }} />

      {/* Scroll hint — the only thing standing in for the nav bar (hidden
          until the guest scrolls, see Nav.jsx) on this first screen, so it
          needs to actually read as an instruction, not a faint caption.
          Dark + a soft light halo instead of translucent white: white text
          alone washed out against bright footage and left people stranded
          not knowing to scroll. */}
      <div style={{
        // `dvh`-based container + a small, fixed-feeling `%` (not a big one
        // that could drift toward the middle) — always sits low, inside the
        // lighter faded band near the bottom, at any resolution.
        position: 'absolute', bottom: '6%', left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'var(--font-heading)', fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.3em', textTransform: 'uppercase',
        color: 'rgba(20,18,14,0.92)',
        textShadow: '0 1px 3px rgba(255,255,255,0.55), 0 0 14px rgba(255,255,255,0.35)',
        pointerEvents: 'none',
      }}>
        Desliza ↓
      </div>
    </section>
  )
}
