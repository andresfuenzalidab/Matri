import { useState, useEffect } from 'react'

export default function WelcomeModal({ guest, onEnter }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay so the modal animates in after mount
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const message = guest.welcomeMessage
  const name = guest.name

  function handleEnter() {
    setVisible(false)
    setTimeout(onEnter, 400)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        background: 'var(--color-bg)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: 'clamp(3rem, 10vw, 5rem)',
          fontWeight: 600, color: 'var(--color-accent)', lineHeight: 1,
          marginBottom: '2rem',
        }}>
          A & C
        </div>

        <p style={{
          fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--color-accent)', marginBottom: '1.5rem',
        }}>
          6 de noviembre de 2026
        </p>

        {message ? (
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
            lineHeight: 1.5, marginBottom: '2rem',
            color: 'var(--color-text)',
          }}>
            {message}
          </p>
        ) : (
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
            lineHeight: 1.5, marginBottom: '2rem',
          }}>
            Querido/a <strong>{name}</strong>,<br />
            nos alegra mucho que puedas acompañarnos<br />en este día tan especial.
          </p>
        )}

        <div style={{
          height: 1, background: 'var(--color-divider)',
          margin: '2rem auto', maxWidth: 200,
        }} />

        <button
          className="btn btn-primary"
          onClick={handleEnter}
          style={{ fontSize: '0.8rem', letterSpacing: '0.1em', padding: '0.75rem 2.5rem' }}
        >
          Entrar a la invitación
        </button>
      </div>
    </div>
  )
}
