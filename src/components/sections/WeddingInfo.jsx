import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import PhotoPlaceholder from '../PhotoPlaceholder'
import BlendVideo from '../BlendVideo'

const MapPinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

function VenueCarousel({ photos, landscape }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const go = useCallback((idx) => {
    setFading(true)
    setTimeout(() => { setCurrent(idx); setFading(false) }, 280)
  }, [])

  const prev = () => go((current - 1 + photos.length) % photos.length)
  const next = useCallback(() => go((current + 1) % photos.length), [current, go, photos.length])

  useEffect(() => {
    if (photos.length <= 1) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next, photos.length])

  if (!photos.length) return null
  const photo = photos[current]
  const src = normalizeImageUrl(photo.image_url)

  const parts = (photo.caption || '').split('|')
  const title = parts[0]?.trim()
  const badge = parts[1]?.trim()

  return (
    <div className="photo-card-carousel">
      <div className={`photo-card ${landscape ? 'photo-card--landscape' : ''} ${fading ? 'photo-card-fading' : ''}`}>
        <img src={src} alt={title || 'Foto del lugar'}
          onError={e => e.target.style.display = 'none'} />
        {title && (
          <div className="photo-card-overlay">
            <p className="photo-card-title">{title}</p>
            {badge && <span className="photo-card-badge">{badge}</span>}
          </div>
        )}
      </div>
      {photos.length > 1 && (
        <div className="photo-card-controls">
          <button className="photo-card-arrow" onClick={prev} aria-label="Anterior">‹</button>
          <div className="photo-card-dots">
            {photos.map((_, i) => (
              <button key={i}
                className={`photo-card-dot ${i === current ? 'active' : ''}`}
                onClick={() => go(i)} aria-label={`Foto ${i + 1}`} />
            ))}
          </div>
          <button className="photo-card-arrow" onClick={next} aria-label="Siguiente">›</button>
        </div>
      )}
    </div>
  )
}

export default function WeddingInfo({ shouldPlay }) {
  const { get, token, guest } = useApp()
  const [venuePhotos, setVenuePhotos] = useState([])
  const descVideoRef = useRef(null)
  const dressVideoRef = useRef(null)

  useEffect(() => {
    if (shouldPlay) {
      descVideoRef.current?.play().catch(() => {})
      dressVideoRef.current?.play().catch(() => {})
    }
  }, [shouldPlay])

  useEffect(() => {
    fetch('/api/venue-photos', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(data => setVenuePhotos(data))
      .catch(() => {})
  }, [token])

  const mapsUrl = get('venue_maps_url')
  const isPartyOnly = guest?.invitationType === 'party_only'
  const dressCodeImage = get('dress_code_image')
  const timelineImage = get('timeline_image')

  return (
    <section id="boda" className="section">
      <h2 className="section-title reveal-on-scroll">Detalles del matrimonio</h2>
      <p className="reveal-on-scroll" style={{
        fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontWeight: 400,
        fontSize: 'clamp(1.25rem, 3.5vw, 1.9rem)', color: 'var(--color-accent)',
        opacity: 0.75, letterSpacing: '0.04em', marginBottom: '2.5rem',
      }}>{get('hero_date', 'Viernes 6 de noviembre de 2026')}</p>

      <div className="wedding-cards reveal-on-scroll">
        {!isPartyOnly && (
          <div className="card wedding-event-card">
            <div className="wedding-event-type">Hora de citación</div>
            <div className="wedding-event-time">{get('ceremony_time', '17:00')} hrs</div>
            <div className="wedding-event-name">{get('venue_name', 'Altos del Paico')}</div>
          </div>
        )}
        {isPartyOnly && (
          <div className="card wedding-event-card">
            <div className="wedding-event-type">Hora de citación</div>
            <div className="wedding-event-time">{get('reception_time', '19:30')} hrs</div>
            <div className="wedding-event-name">{get('venue_name', 'Altos del Paico')}</div>
          </div>
        )}
      </div>

      {get('wedding_day_off_tip') && (
        <p className="reveal-on-scroll" style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 400, opacity: 0.72, marginTop: '0.5rem', color: 'var(--color-accent)' }}>
          {get('wedding_day_off_tip')}
        </p>
      )}

      <div className="card venue-card reveal-on-scroll">
        <BlendVideo
          ref={descVideoRef}
          loop
          wrapperStyle={{ borderRadius: 6, marginTop: '0.75rem', overflow: 'hidden' }}
          style={{ width: '100%', display: 'block' }}
          src={get('description_video_url') || '/description_dog.mp4'}
        />
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ alignSelf: 'center', marginTop: '0.75rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Ver en Google Maps
          </a>
        )}
      </div>

      {/* Dress code */}
      <div className="wedding-detail-block reveal-on-scroll">
        <h3 className="wedding-detail-title">Código de vestimenta</h3>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', maxWidth: 600 }}>
          <BlendVideo
            ref={dressVideoRef}
            loop
            wrapperStyle={{ flex: '0 0 50%', width: '50%' }}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
            src={get('dresscode_video_url') || '/dresscode_cat.mp4'}
          />
          {dressCodeImage ? (
            <img src={normalizeImageUrl(dressCodeImage)} alt="Código de vestimenta"
              style={{ flex: '0 0 50%', width: '50%', objectFit: 'cover', display: 'block' }}
              onError={e => e.target.style.display = 'none'} />
          ) : (
            <div style={{ flex: '0 0 50%', width: '50%' }}>
              <PhotoPlaceholder size="md" label="Imagen de código de vestimenta" />
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {!isPartyOnly && (
        <div className="wedding-detail-block reveal-on-scroll">
          {timelineImage ? (
            <img src={normalizeImageUrl(timelineImage)} alt="Programa del día"
              className="wedding-detail-img"
              onError={e => e.target.style.display = 'none'} />
          ) : (
            <PhotoPlaceholder size="md" label="Imagen del programa / timeline" />
          )}
        </div>
      )}

      {/* Venue photos carousel */}
      {venuePhotos.length > 0 && (
        <div className="reveal-on-scroll" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <VenueCarousel photos={venuePhotos} landscape />
        </div>
      )}
    </section>
  )
}
