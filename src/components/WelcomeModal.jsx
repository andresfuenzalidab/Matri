import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

export default function WelcomeModal({ guest, onEnter, onVideoReady }) {
  const [visible, setVisible] = useState(false)
  const [contentVisible, setContentVisible] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const { get } = useApp()
  const videoRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const message = guest.welcomeMessage
  const displayName = guest.nickname || guest.name
  const heroVideo = get('hero_video') || '/hero.mp4'

  function handleEnter() {
    videoRef.current?.play().catch(() => {})
    setContentVisible(false)
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
        background: 'var(--color-bg)',
      }}
    >
      {heroVideo && (
        <video
          ref={videoRef}
          muted loop playsInline
          onCanPlay={() => { setVideoReady(true); onVideoReady?.() }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
          src={heroVideo}
        />
      )}

      {/* Overlay */}
      {heroVideo && videoReady && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%)',
        }} />
      )}

      {/* Spinner while loading */}
      {!videoReady && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid var(--color-neutral-300)',
            borderTopColor: 'var(--color-accent)',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}

      {/* Welcome content */}
      <div style={{
        textAlign: 'center', maxWidth: 480,
        position: 'relative', zIndex: 2,
        opacity: videoReady && contentVisible ? 1 : 0,
        transform: contentVisible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        pointerEvents: videoReady ? 'auto' : 'none',
      }}>
        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: 'clamp(3rem, 10vw, 5rem)',
          fontWeight: 600, color: '#fff', lineHeight: 1,
          marginBottom: '2rem',
        }}>
          A & C
        </div>

        <p style={{
          fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.75)',
          marginBottom: '1.5rem',
        }}>
          Viernes 6 de noviembre de 2026
        </p>

        {message ? (
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
            lineHeight: 1.5, marginBottom: '2rem', color: '#fff',
          }}>
            {message}
          </p>
        ) : (
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
            lineHeight: 1.5, marginBottom: '2rem', color: '#fff',
          }}>
            Querido/a <strong>{displayName}</strong>,<br />
            nos alegra mucho que puedas acompañarnos<br />en este día tan especial.
          </p>
        )}

        <div style={{
          height: 1,
          background: 'rgba(255,255,255,0.3)',
          margin: '2rem auto', maxWidth: 200,
        }} />

        <button
          className="btn btn-primary"
          onClick={handleEnter}
          style={{
            fontSize: '0.8rem', letterSpacing: '0.1em', padding: '0.75rem 2.5rem',
            borderColor: 'rgba(255,255,255,0.7)', color: '#fff',
          }}
        >
          Entrar a la invitación
        </button>
      </div>
    </div>
  )
}
