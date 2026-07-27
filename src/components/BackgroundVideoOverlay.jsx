import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'

export default function BackgroundVideoOverlay() {
  const { get } = useApp()
  const videoRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const videoUrl = get('background_video_url') || '/mascotas.webm'

  const play = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.play().catch(() => {})
    setVisible(true)
  }, [])

  function handleEnded() {
    setVisible(false)
    timerRef.current = setTimeout(play, 45000 + Math.random() * 45000)
  }

  useEffect(() => {
    timerRef.current = setTimeout(play, 45000 + Math.random() * 45000)
    return () => clearTimeout(timerRef.current)
  }, [play])

  return (
    <>
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        playsInline
        onEnded={handleEnded}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          zIndex: 200,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease',
          background: 'transparent',
          mixBlendMode: 'multiply',
        }}
      />
      <button
        onClick={play}
        title="Probar video mascotas"
        style={{
          position: 'fixed', bottom: '1.75rem', left: '5rem', zIndex: 201,
          width: 40, height: 40, borderRadius: '50%',
          border: '1.5px solid var(--color-accent)',
          background: 'var(--color-bg)', color: 'var(--color-accent)',
          cursor: 'pointer', fontSize: '1.1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'white' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-accent)' }}
      >
        🐾
      </button>
    </>
  )
}
