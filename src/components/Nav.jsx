import { useState, useEffect } from 'react'

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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="bottom-nav" aria-label="Navegación">
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
