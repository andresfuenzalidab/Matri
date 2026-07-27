import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

export default function WelcomeModal({ guest, onEnter }) {
  const [visible, setVisible] = useState(false)
  const [contentVisible, setContentVisible] = useState(true)
  const { get } = useApp()
  const videoRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const message = guest.welcomeMessage
  const displayName = guest.nickname || guest.name
  const heroVideo = get('hero_video')

  function handleEnter() {
    // Start video on click (user gesture = reliable autoplay)
    videoRef.current?.play().catch(() => {})

    // Fade out welcome content first
    setContentVisible(false)

    // Then fade out the whole modal and hand off
    setTimeout(() => {
      setVisible(false)
      setTimeout(onEnter, 400)
    }, 400)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Video — preloaded but paused until Entrar */}
      {heroVideo ? (
        <video
          ref={videoRef}
          muted loop playsInline
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
          }}
          src={heroVideo}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--color-bg)', zIndex: 0,
        }} />
      )}

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: heroVideo
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%)'
          : 'transparent',
      }} />

      {/* Welcome content */}
      <div style={{
        textAlign: 'center', maxWidth: 480,
        position: 'relative', zIndex: 2,
        opacity: contentVisible ? 1 : 0,
        transform: contentVisible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}>
        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: 'clamp(3rem, 10vw, 5rem)',
          fontWeight: 600, color: heroVideo ? '#fff' : 'var(--color-accent)', lineHeight: 1,
          marginBottom: '2rem',
        }}>
          A & C
        </div>

        <p style={{
          fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: heroVideo ? 'rgba(255,255,255,0.75)' : 'var(--color-accent)',
          marginBottom: '1.5rem',
        }}>
          Viernes 6 de noviembre de 2026
        </p>

        {message ? (
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
            lineHeight: 1.5, marginBottom: '2rem',
            color: heroVideo ? '#fff' : 'var(--color-text)',
          }}>
            {message}
          </p>
        ) : (
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
            lineHeight: 1.5, marginBottom: '2rem',
            color: heroVideo ? '#fff' : 'var(--color-text)',
          }}>
            Querido/a <strong>{displayName}</strong>,<br />
            nos alegra mucho que puedas acompañarnos<br />en este día tan especial.
          </p>
        )}

        <div style={{
          height: 1,
          background: heroVideo ? 'rgba(255,255,255,0.3)' : 'var(--color-divider)',
          margin: '2rem auto', maxWidth: 200,
        }} />

        <button
          className="btn btn-primary"
          onClick={handleEnter}
          style={{
            fontSize: '0.8rem', letterSpacing: '0.1em', padding: '0.75rem 2.5rem',
            ...(heroVideo ? { borderColor: 'rgba(255,255,255,0.7)', color: '#fff' } : {}),
          }}
        >
          Entrar a la invitación
        </button>
      </div>
    </div>
  )
}
