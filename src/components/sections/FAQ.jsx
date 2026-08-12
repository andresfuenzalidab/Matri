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

      <p className="faq-hint">Toca cada pregunta para ver la respuesta</p>

      <div className="faq-list">
        {items.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
              <button
                className="faq-question"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="faq-question-text">{item.q}</span>
                <span className="faq-toggle" aria-hidden="true">
                  <span className="faq-toggle-bar" />
                  <span className="faq-toggle-bar faq-toggle-bar-v" />
                </span>
              </button>
              <div
                id={`faq-answer-${i}`}
                className={`faq-answer ${isOpen ? 'faq-answer-open' : ''}`}
                role="region"
              >
                <p>{item.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
