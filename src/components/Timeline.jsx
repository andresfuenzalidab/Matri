import { useEffect, useRef, useState } from 'react'
import TimelineIcon from './TimelineIcons.jsx'

const MarkerHeart = () => (
  <svg viewBox="0 0 32 30" className="timeline-marker-heart" aria-hidden="true">
    <path
      d="M16 28C7.5 21.2 2.5 17 2.5 11.2A7.7 7.7 0 0 1 16 6.4 7.7 7.7 0 0 1 29.5 11.2C29.5 17 24.5 21.2 16 28z"
      fill="currentColor"
    />
  </svg>
)

/**
 * Programme of the day. The filled part of the rail and the heart marker track
 * the scroll position across the list, in both directions — the rail is empty
 * before the list is reached and full once it has passed.
 */
export default function Timeline({ items }) {
  const listRef = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0

    function measure() {
      raf = 0
      const el = listRef.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      // The rail fills up to the point that has scrolled past 55% of the
      // viewport, so the marker sits comfortably in the reading zone.
      const anchor = window.innerHeight * 0.55
      const ratio = (anchor - top) / Math.max(height, 1)
      setProgress(Math.min(1, Math.max(0, ratio)))
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [items.length])

  if (!items.length) return null

  const pct = `${(progress * 100).toFixed(2)}%`

  return (
    <div className="timeline" ref={listRef}>
      <div className="timeline-track" style={{ gridRow: `1 / ${items.length + 1}` }} aria-hidden="true">
        <span className="timeline-track-line" />
        <span className="timeline-track-fill" style={{ height: pct }} />
        <span className="timeline-marker" style={{ top: pct }}>
          <MarkerHeart />
        </span>
      </div>

      {items.map((item, i) => {
        // An item lights up once the marker has reached its own row.
        const reached = progress >= (i + 0.35) / items.length
        return [
          <div
            key={`icon-${i}`}
            className={`timeline-row-icon ${reached ? 'is-reached' : ''}`}
            style={{ gridRow: i + 1 }}
          >
            <TimelineIcon name={item.icon} className="timeline-icon-art" />
          </div>,
          <div
            key={`body-${i}`}
            className={`timeline-row-body ${reached ? 'is-reached' : ''}`}
            style={{ gridRow: i + 1 }}
          >
            {item.title && <h4 className="timeline-row-title">{item.title}</h4>}
            {item.time && <p className="timeline-row-time">{item.time}</p>}
            {item.note && <p className="timeline-row-note">{item.note}</p>}
          </div>,
        ]
      })}
    </div>
  )
}
