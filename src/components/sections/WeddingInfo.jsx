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
  const [transportOpen, setTransportOpen] = useState(false)
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
        <p className="reveal-on-scroll" style={{ textAlign: 'center', fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem', fontStyle: 'italic' }}>
          {get('wedding_day_off_tip')}
        </p>
      )}

      <div className="card venue-card reveal-on-scroll">
        <video
          ref={descVideoRef}
          muted loop playsInline
          style={{ width: '100%', borderRadius: 6, marginTop: '0.75rem', display: 'block' }}
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
          <video
            ref={dressVideoRef}
            muted loop playsInline
            style={{ flex: '0 0 50%', width: '50%', display: 'block', objectFit: 'cover' }}
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
            <VenueCarousel photos={venuePhotos} />
        </div>
      )}

      {/* Transport contacts — collapsible */}
      {(() => {
        try {
          const contacts = JSON.parse(get('transport_contacts') || '[]')
          if (!contacts.length) return null
          return (
            <div className="reveal-on-scroll" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={() => setTransportOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '1rem', width: '100%', maxWidth: 400,
                  background: 'transparent', border: '1px solid var(--color-divider)',
                  borderRadius: 10, cursor: 'pointer', padding: '0.85rem 1.1rem',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
                    <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--color-accent)' }}>Transporte</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', opacity: 0.5 }}>
                  <span>{transportOpen ? 'Cerrar' : 'Ver contactos'}</span>
                  <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: transportOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                </div>
              </button>
              {transportOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', width: '100%', maxWidth: 400 }}>
                  {contacts.map((c, i) => (
                    <a key={i} href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: '1px solid var(--color-divider)', borderRadius: 8, textDecoration: 'none', color: 'inherit' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, opacity: 0.7 }}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.65 }}>{c.phone}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        } catch { return null }
      })()}
    </section>
  )
}
