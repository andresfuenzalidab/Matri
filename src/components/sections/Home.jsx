import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import PhotoPlaceholder from '../PhotoPlaceholder'

function useCountdown(targetMs) {
  const [diff, setDiff] = useState(() => Math.max(0, targetMs - Date.now()))

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, targetMs - Date.now()))
    }, 1000)
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

// November 6 2026 17:00 Chile Standard Time (UTC-3 in November)
const WEDDING_MS = new Date('2026-11-06T17:00:00-03:00').getTime()

export default function Home() {
  const { get, loadContent } = useApp()
  const { days, hours, minutes, seconds } = useCountdown(WEDDING_MS)

  useEffect(() => { loadContent() }, [loadContent])

  const heroImage = get('hero_image')

  return (
    <section id="inicio" className="hero">
      <div className="hero-image-wrap">
        <PhotoPlaceholder
          size="hero"
          url={heroImage}
          label="Foto principal"
          alt="Andrés y Catalina"
        />
      </div>

      <div className="hero-subtitle">{get('hero_subtitle', 'Nos casamos')}</div>
      <h1 className="hero-title">{get('hero_title', 'Andrés & Catalina')}</h1>
      <div className="hero-date">{get('hero_date', '6 de noviembre de 2026')}</div>
      <div className="hero-location">{get('hero_location', 'Altos del Paico')}</div>

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
    </section>
  )
}
