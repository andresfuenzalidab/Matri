import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { normalizeAudioUrl } from '../utils/imageUrl.js'

export default function MusicPlayer({ welcomed }) {
  const { get } = useApp()
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const hasTriedAutoplay = useRef(false)
  const rawUrl = get('music_url')
  const musicUrl = normalizeAudioUrl(rawUrl)

  useEffect(() => {
    if (!musicUrl) return
    setReady(false)
    setLoadError(false)
    hasTriedAutoplay.current = false

    const audio = new Audio()
    audio.loop = true
    audio.volume = 0.35
    audio.preload = 'auto'

    audio.addEventListener('canplay', () => setReady(true), { once: true })
    audio.addEventListener('error', () => setLoadError(true), { once: true })
    audio.addEventListener('ended', () => setPlaying(false))

    audio.src = musicUrl
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [musicUrl])

  // Try autoplay once welcomed + audio is ready
  useEffect(() => {
    if (!welcomed || !ready || hasTriedAutoplay.current) return
    hasTriedAutoplay.current = true
    const wasPaused = sessionStorage.getItem('musicPaused') === '1'
    if (!wasPaused) {
      audioRef.current?.play()
        .then(() => setPlaying(true))
        .catch(() => {
          // Autoplay blocked — button will be visible for manual start
        })
    }
  }, [welcomed, ready])

  function toggle() {
    const audio = audioRef.current
    if (!audio || loadError) return
    if (playing) {
      audio.pause()
      sessionStorage.setItem('musicPaused', '1')
      setPlaying(false)
    } else {
      audio.play()
        .then(() => {
          setPlaying(true)
          sessionStorage.removeItem('musicPaused')
        })
        .catch(() => {})
    }
  }

  if (!musicUrl) return null

  return (
    <button
      className={`music-player-btn${playing ? ' playing' : ''}${loadError ? ' error' : ''}`}
      onClick={toggle}
      title={loadError ? 'No se pudo cargar la música' : playing ? 'Pausar música' : 'Reproducir música'}
      aria-label={playing ? 'Pausar música' : 'Reproducir música'}
    >
      {loadError
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        : playing
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      }
    </button>
  )
}
