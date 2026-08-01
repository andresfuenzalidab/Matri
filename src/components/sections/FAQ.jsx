import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function FAQ() {
  const { get } = useApp()
  const [open, setOpen] = useState(null)

  let items = []
  try { items = JSON.parse(get('faq_items') || '[]') } catch {}

  if (!items.length) return null

  return (
    <section id="faq" className="section reveal-on-scroll" style={{ textAlign: 'center' }}>
      <span className="kicker">Preguntas frecuentes</span>
      <h2 className="section-title">{get('faq_heading', '¿Tienes dudas?')}</h2>

      <div style={{ maxWidth: 640, margin: '2rem auto 0', textAlign: 'left' }}>
        {items.map((item, i) => (
          <div key={i} className="faq-item">
            <button
              className="faq-question"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span>{item.q}</span>
              <span className="faq-chevron" style={{
                transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>▾</span>
            </button>
            <div className={`faq-answer ${open === i ? 'faq-answer-open' : ''}`}>
              <p>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
