import { useState, useRef, useEffect } from 'react'

// Preview image of an album file. Google Drive builds a video's thumbnail a
// little after the upload finishes (sometimes a couple of minutes), so right
// after uploading it answers 404. Instead of a broken-image icon this shows a
// "processing" placeholder and quietly retries, with growing pauses, until
// the thumbnail exists; if it never does, a plain icon stays.

const MAX_TRIES = 12

const ICON = {
  video: 'M3.5 7.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1zM15.5 10.5l5-3v9l-5-3',
  image: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM3 16l5-4 4 3 3-2 6 4',
}

export default function Thumb({ item, compact = false }) {
  const [tries, setTries] = useState(0)
  const [failed, setFailed] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const retrying = failed && tries < MAX_TRIES
  const onError = () => {
    setFailed(true)
    if (tries >= MAX_TRIES) return
    timer.current = setTimeout(() => { setTries(t => t + 1); setFailed(false) }, 3000 + tries * 1500)
  }

  if (failed) {
    return (
      <div className={`mp-ph ${retrying ? 'is-busy' : ''}`} role="img" aria-label={retrying ? 'Preparando la vista previa' : 'Sin vista previa'}>
        <svg width={compact ? 18 : 30} height={compact ? 18 : 30} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={ICON[item.type === 'video' ? 'video' : 'image']} />
        </svg>
        {retrying && !compact && <small>Procesando…</small>}
      </div>
    )
  }

  const src = tries ? `${item.thumb}${item.thumb.includes('?') ? '&' : '?'}r=${tries}` : item.thumb
  return <img src={src} alt="" loading="lazy" decoding="async" onError={onError} />
}
