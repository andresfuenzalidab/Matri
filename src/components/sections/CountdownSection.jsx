import { useState, useEffect, useMemo, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import { weddingInstant } from '../../utils/weddingDate.js'
import BlendVideo from '../BlendVideo'

function useCountdown(targetMs) {
  const [diff, setDiff] = useState(() => Math.max(0, targetMs - Date.now()))
  useEffect(() => {
    setDiff(Math.max(0, targetMs - Date.now()))
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
  const targetMs = useMemo(
    () => weddingInstant(get('wedding_date'), get('ceremony_time')).getTime(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [get('wedding_date'), get('ceremony_time')],
  )
  const { days, hours, minutes, seconds } = useCountdown(targetMs)
  const videoUrl = get('background_video_url') || '/timer_cat.mp4'
  const bgImage = normalizeImageUrl(get('countdown_bg_image') || '')
  const videoRef = useRef(null)

  useEffect(() => {
    if (shouldPlay) videoRef.current?.play().catch(() => {})
  }, [shouldPlay])

  return (
    <div className="countdown-section reveal-on-scroll">
      <p className="countdown-kicker">FALTAN</p>

      {/* The clip is capped at the page's content width — full-bleed made it
          scale up so far that the top and bottom of the frame were cropped. */}
      <BlendVideo
        ref={videoRef}
        loop
        wrapperClassName="countdown-video-wrap"
        className="countdown-section-video"
        src={videoUrl}
        style={{ display: 'block', width: '100%' }}
      />

      <div
        className="countdown-section-timer"
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
      >
        <div className="countdown-section-content">
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
    </div>
  )
}
