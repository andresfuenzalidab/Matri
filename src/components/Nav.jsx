import { useState, useEffect } from 'react'

const LINKS = [
  { id: 'inicio',   label: 'Inicio' },
  { id: 'boda',     label: 'Detalles' },
  { id: 'historia', label: 'Historia' },
  { id: 'faq',      label: 'FAQ' },
  { id: 'rsvp',     label: 'RSVP' },
  { id: 'regalos',  label: 'Regalos' },
]

const BOTTOM_LINKS = [
  { id: 'boda',     label: 'Lugar' },
  { id: 'historia', label: 'Historia' },
  { id: 'rsvp',     label: 'Confirma' },
  { id: 'regalos',  label: 'Regalos' },
  { id: 'faq',      label: 'FAQ' },
]

export default function Nav() {
  const [active, setActive] = useState('inicio')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const observers = LINKS.map(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { threshold: 0.05, rootMargin: '-40px 0px -40% 0px' }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  function handleLinkClick(e, id) {
    e.preventDefault()
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* ── Top nav (desktop) ── */}
      <nav className="app-nav">
        <div className="nav-inner">
          <a href="#inicio" className="nav-brand" onClick={e => handleLinkClick(e, 'inicio')}>
            A & C
          </a>
          <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {LINKS.map(({ id, label }) => (
              <li key={id}>
                <a href={`#${id}`}
                  className={active === id ? 'active' : ''}
                  onClick={e => handleLinkClick(e, id)}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <button className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* ── Bottom pill nav (mobile only) ── */}
      <nav className="bottom-nav" aria-label="Navegación">
        {BOTTOM_LINKS.map(({ id, label }) => (
          <a key={id} href={`#${id}`}
            className={`bottom-nav-tab ${active === id ? 'active' : ''}`}
            onClick={e => handleLinkClick(e, id)}>
            {label}
          </a>
        ))}
      </nav>
    </>
  )
}
