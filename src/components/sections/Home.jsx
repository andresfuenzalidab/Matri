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

      {/* Seamless fade to the page background at the bottom. Was briefly a
          `mask-image` reveal of the tiled damask pattern instead of a flat
          color — reverted: it rendered as fully opaque across the WHOLE
          hero instead of just fading in over the last third, hiding the
          video entirely. Back to the proven mechanism: a plain color
          gradient (`--stationery-fill-color`, the same fallback tone used
          elsewhere) fading the video out, handing off to `.editorial-main`
          — which starts exactly at this point and shows the real tiled
          border art — for the textured look, rather than trying to fade
          into the texture itself mid-gradient. */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 65%, var(--stationery-fill-color) 100%)',
      }} />

      {/* Scroll hint — the only thing standing in for the nav bar (hidden
          until the guest scrolls, see Nav.jsx) on this first screen, so it
          needs to actually read as an instruction, not a faint caption.
          White + bold, with a dark shadow for contrast against whatever
          the video happens to be showing at that moment. */}
      <div style={{
        // `dvh`-based container + a small, fixed-feeling `%` (not a big one
        // that could drift toward the middle) — always sits low, inside the
        // lighter faded band near the bottom, at any resolution.
        position: 'absolute', bottom: '6%', left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'var(--font-heading)', fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.3em', textTransform: 'uppercase',
        color: '#ffffff',
        textShadow: '0 1px 4px rgba(0,0,0,0.55), 0 0 12px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
      }}>
        Desliza ↓
      </div>
    </section>
  )
}
