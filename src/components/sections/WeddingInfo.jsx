import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import PhotoPlaceholder from '../PhotoPlaceholder'

const MapPinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

function VenueCarousel({ photos }) {
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

  return (
    <div className="story-carousel" style={{ marginTop: '1.5rem' }}>
      <div className={`story-carousel-img-wrap ${fading ? 'fading' : ''}`}
        style={{ height: 300 }}>
        <img src={src} alt={photo.caption || 'Foto del lugar'}
          onError={e => e.target.style.display = 'none'} />
        {photo.caption && <div className="story-carousel-caption">{photo.caption}</div>}
      </div>
      {photos.length > 1 && (
        <>
          <button className="story-carousel-arrow left" onClick={prev} aria-label="Anterior">‹</button>
          <button className="story-carousel-arrow right" onClick={next} aria-label="Siguiente">›</button>
          <div className="story-carousel-dots">
            {photos.map((_, i) => (
              <button key={i} className={`story-carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => go(i)} aria-label={`Foto ${i + 1}`} />
            ))}
          </div>
        </>
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
      <p className="section-subtitle reveal-on-scroll">{get('hero_date', 'Viernes 6 de noviembre de 2026')}</p>

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
            <div style={{ fontSize: '0.78rem', opacity: 0.65, marginTop: '0.4rem', lineHeight: 1.5 }}>
              Los invitamos a celebrar con nosotros en la fiesta
            </div>
          </div>
        )}
      </div>

      <div className="card venue-card reveal-on-scroll">
        <div className="venue-card-header">
          <MapPinIcon />
          <h3>{get('venue_name', 'Altos del Paico')}</h3>
        </div>
        {get('venue_address') && <p className="venue-address">{get('venue_address')}</p>}
        <video
          ref={descVideoRef}
          muted loop playsInline
          style={{ width: '100%', borderRadius: 6, marginTop: '0.75rem', display: 'block' }}
          src={get('description_video_url') || '/description_dog.mp4'}
        />
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ alignSelf: 'flex-start', marginTop: '0.75rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Ver en Google Maps
          </a>
        )}
      </div>

      {/* Dress code */}
      <div className="wedding-detail-block reveal-on-scroll" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <video
          ref={dressVideoRef}
          muted loop playsInline
          style={{ flex: '0 0 auto', width: 'min(260px, 100%)', borderRadius: 6, display: 'block' }}
          src={get('dresscode_video_url') || '/dresscode_cat.mp4'}
        />
        <div style={{ flex: 1, minWidth: 180 }}>
          <h3 className="wedding-detail-title">Código de vestimenta</h3>
          {dressCodeImage ? (
            <img src={normalizeImageUrl(dressCodeImage)} alt="Código de vestimenta"
              className="wedding-detail-img"
              onError={e => e.target.style.display = 'none'} />
          ) : (
            <PhotoPlaceholder size="md" label="Imagen de código de vestimenta" />
          )}
        </div>
      </div>

      {/* Timeline */}
      {!isPartyOnly && (
        <div className="wedding-detail-block reveal-on-scroll">
          <h3 className="wedding-detail-title">Programa del día</h3>
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
        <div className="reveal-on-scroll" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            El lugar
          </h3>
          <VenueCarousel photos={venuePhotos} />
        </div>
      )}
    </section>
  )
}
