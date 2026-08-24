import { useState, useEffect } from 'react'

/** In document order — the active-section maths below depends on it. */
const LINKS = [
  { id: 'inicio',   label: 'Inicio' },
  { id: 'boda',     label: 'Lugar' },
  { id: 'historia', label: 'Historia' },
  { id: 'rsvp',     label: 'Confirma' },
  { id: 'regalos',  label: 'Regalos' },
  { id: 'faq',      label: 'FAQ' },
]

export default function Nav() {
  const [active, setActive] = useState('inicio')
  // Hidden on the hero video so the "Desliza para continuar" hint is the
  // only call to action there — showing the nav on top of it competed with
  // that instruction and buried it. Appears once the guest has actually
  // scrolled, exactly when it becomes useful.
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let raf = 0

    /**
     * One observer per section let whichever callback happened to fire last
     * win, so short sections near the bottom (FAQ) never lit up. Instead pick
     * the last section whose top has crossed a reading line — a single,
     * deterministic answer for any scroll position.
     */
    function measure() {
      raf = 0
      const line = window.innerHeight * 0.35
      const present = LINKS.filter(({ id }) => document.getElementById(id))
      if (!present.length) return

      let current = present[0].id
      for (const { id } of present) {
        if (document.getElementById(id).getBoundingClientRect().top <= line) current = id
      }

      // The final section can be too short to ever reach the line, so once the
      // page bottom is in view it is always the active one.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8
      if (atBottom) current = present[present.length - 1].id

      setActive(current)
      // Half the hero's height is enough to register as "scrolled" — the
      // guest has clearly acted on the hint by then, no need to wait for
      // the full 100vh section to pass.
      setScrolled(window.scrollY > window.innerHeight * 0.5)
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  function handleLinkClick(e, id) {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`bottom-nav ${scrolled ? '' : 'bottom-nav--hidden'}`} aria-label="Navegación">
      {LINKS.map(({ id, label }) => (
        <a key={id} href={`#${id}`}
          className={`bottom-nav-tab ${active === id ? 'active' : ''}`}
          onClick={e => handleLinkClick(e, id)}>
          {label}
        </a>
      ))}
    </nav>
  )
}
