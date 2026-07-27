import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

// Plays a transparent WebM video (pets) as an overlay at random intervals.
// Upload a WebM with alpha channel (VP8/VP9 + alpha) for the transparency to work.
export default function BackgroundVideoOverlay() {
  const { get } = useApp()
  const videoRef = useRef(null)
  const [visible, setVisible] = useState(false)

  const videoUrl = get('background_video_url')

  useEffect(() => {
    if (!videoUrl) return

    // Play every 45–90 seconds, randomly
    function scheduleNext() {
      const delay = 45000 + Math.random() * 45000
      return setTimeout(() => {
        const video = videoRef.current
        if (!video) return scheduleNext()
        video.currentTime = 0
        video.play().catch(() => {})
        setVisible(true)
      }, delay)
    }

    const id = scheduleNext()
    return () => clearTimeout(id)
  }, [videoUrl])

  function handleEnded() {
    setVisible(false)
    const video = videoRef.current
    if (!video) return
    // Reschedule after the video ends
    const delay = 45000 + Math.random() * 45000
    setTimeout(() => {
      video.currentTime = 0
      video.play().catch(() => {})
      setVisible(true)
    }, delay)
  }

  if (!videoUrl) return null

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      muted
      playsInline
      onEnded={handleEnded}
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: 'min(400px, 50vw)',
        pointerEvents: 'none',
        zIndex: 200,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    />
  )
}
