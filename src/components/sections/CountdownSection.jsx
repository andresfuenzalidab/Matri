import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import { weddingInstant } from '../../utils/weddingDate.js'
import DecorSlot from '../DecorSlot'

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

export default function CountdownSection() {
  const { get } = useApp()
  const targetMs = useMemo(
    () => weddingInstant(get('wedding_date'), get('ceremony_time')).getTime(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [get('wedding_date'), get('ceremony_time')],
  )
  const { days, hours, minutes, seconds } = useCountdown(targetMs)
  const bgImage = normalizeImageUrl(get('countdown_bg_image') || '')

  const urnImage = get('urn_image')
  const cornerFloralTl = get('corner_floral_tl')
  const cornerFloralTr = get('corner_floral_tr')
  const cornerFloralBl = get('corner_floral_bl')
  const cornerFloralBr = get('corner_floral_br')

  return (
    // Same `<section className="section">` wrapper every other stationery
    // section uses — it's the one and only source of horizontal padding
    // now (see `.stationery-scene` in stationery.css); skipping it here
    // was exactly why this was the one section that reached full width
    // "by accident" while the others double-padded themselves.
    <section className="section">
      <div className="stationery-scene countdown-scene reveal-on-scroll">
      <DecorSlot url={cornerFloralTl} label="Adorno esquina" aspectRatio="1"
        className="corner-floral corner-floral--sm corner-floral--tl" />
      <DecorSlot url={cornerFloralTr} label="Adorno esquina" aspectRatio="1"
        className="corner-floral corner-floral--sm corner-floral--tr" />

      {/* Same urn top and bottom, on the same line as its corner-floral
          pair (absolute, same offset) rather than stacked below it in
          normal flow — that's what "aligned with the side arrangements"
          actually takes. */}
      <DecorSlot url={urnImage} label="Urna" aspectRatio="0.85"
        className="urn-image urn-image--sm urn-image--top" />

      <div className="countdown-section">
        <p className="countdown-kicker">FALTAN</p>

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

      <DecorSlot url={urnImage} label="Urna" aspectRatio="0.85"
        className="urn-image urn-image--sm urn-image--bottom" />

      <DecorSlot url={cornerFloralBl} label="Adorno esquina" aspectRatio="1"
        className="corner-floral corner-floral--sm corner-floral--bl" />
      <DecorSlot url={cornerFloralBr} label="Adorno esquina" aspectRatio="1"
        className="corner-floral corner-floral--sm corner-floral--br" />
      </div>
    </section>
  )
}
