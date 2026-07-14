import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { normalizeAudioUrl } from '../utils/imageUrl.js'

export default function MusicPlayer({ welcomed }) {
  const { get } = useApp()
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const hasTriedAutoplay = useRef(false)
  const musicUrl = normalizeAudioUrl(get('music_url'))

  useEffect(() => {
    if (!musicUrl) return
    const audio = new Audio(musicUrl)
    audio.loop = true
    audio.volume = 0.35
    audio.addEventListener('canplaythrough', () => setReady(true), { once: true })
    audio.addEventListener('ended', () => setPlaying(false))
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [musicUrl])

  useEffect(() => {
    if (!welcomed || !ready || hasTriedAutoplay.current) return
    hasTriedAutoplay.current = true
    const wasPaused = sessionStorage.getItem('musicPaused') === '1'
    if (!wasPaused) {
      audioRef.current?.play()
        .then(() => setPlaying(true))
        .catch(() => {})
    }
  }, [welcomed, ready])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
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
      className={`music-player-btn${playing ? ' playing' : ''}`}
      onClick={toggle}
      title={playing ? 'Pausar música' : 'Reproducir música'}
      aria-label={playing ? 'Pausar música' : 'Reproducir música'}
    >
      {playing
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      }
    </button>
  )
}
