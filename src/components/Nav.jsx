import { useState, useEffect } from 'react'

const LINKS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'boda', label: 'Detalles' },
  { id: 'historia', label: 'Nuestra Historia' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'regalos', label: 'Regalos' },
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
        { threshold: 0.25, rootMargin: '-60px 0px 0px 0px' }
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
    <nav className="app-nav">
      <div className="nav-inner">
        <a href="#inicio" className="nav-brand" onClick={e => handleLinkClick(e, 'inicio')}>
          A & C
        </a>
        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {LINKS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={active === id ? 'active' : ''}
                onClick={e => handleLinkClick(e, id)}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  )
}
