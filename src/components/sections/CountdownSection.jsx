import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

const WEDDING_MS = new Date('2026-11-06T17:00:00-03:00').getTime()

function useCountdown(targetMs) {
  const [diff, setDiff] = useState(() => Math.max(0, targetMs - Date.now()))
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, targetMs - Date.now())), 1000)
    return () => clearInterval(id)
  }, [targetMs])
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export default function CountdownSection({ shouldPlay }) {
  const { get } = useApp()
  const { days, hours, minutes, seconds } = useCountdown(WEDDING_MS)
  const videoUrl = get('background_video_url') || '/timer_cat.mp4'
  const bgImage = normalizeImageUrl(get('countdown_bg_image') || '')
  const videoRef = useRef(null)

  useEffect(() => {
    if (shouldPlay) videoRef.current?.play().catch(() => {})
  }, [shouldPlay])

  return (
    <div className="countdown-section reveal-on-scroll">
      {/* Timer with optional background image */}
      <div
        className="countdown-section-timer"
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
      >
        <div className="countdown-section-content">
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '0.62rem',
            letterSpacing: '0.25em', textTransform: 'uppercase',
            opacity: 0.6, marginBottom: '1rem',
          }}>
            FALTAN
          </p>
          <div className="countdown" aria-label="Cuenta regresiva">
            {[
              ['días', days],
              ['horas', hours],
              ['min', minutes],
              ['seg', seconds],
            ].map(([label, val]) => (
              <div key={label} className="countdown-unit">
                <span className="countdown-number">{String(val).padStart(2, '0')}</span>
                <span className="countdown-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mascot video — editorial frame */}
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        padding: '0.25rem 1rem 0',
      }}>
        {/* Thin frame lines */}
        <div style={{
          position: 'relative',
          maxWidth: 600,
          width: '100%',
        }}>
          <div style={{
            position: 'absolute', inset: -12,
            border: '1px solid rgba(182,130,53,0.25)',
            borderRadius: 2,
            pointerEvents: 'none',
            zIndex: 1,
          }}/>
          <video
            ref={videoRef}
            muted loop playsInline
            className="countdown-section-video"
            src={videoUrl}
            style={{ borderRadius: 2, display: 'block', width: '100%' }}
          />
          {/* Corner accents */}
          {[
            { top: -5, left: -5, borderWidth: '2px 0 0 2px' },
            { top: -5, right: -5, borderWidth: '2px 2px 0 0' },
            { bottom: -5, left: -5, borderWidth: '0 0 2px 2px' },
            { bottom: -5, right: -5, borderWidth: '0 2px 2px 0' },
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: s.top, left: s.left, right: s.right, bottom: s.bottom,
              width: 20, height: 20,
              borderColor: 'rgba(182,130,53,0.55)',
              borderStyle: 'solid',
              borderWidth: s.borderWidth,
              pointerEvents: 'none', zIndex: 2,
            }}/>
          ))}
        </div>
      </div>
    </div>
  )
}
