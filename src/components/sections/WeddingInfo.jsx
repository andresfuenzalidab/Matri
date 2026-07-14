import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

const MapPinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export default function WeddingInfo() {
  const { get, token, guest } = useApp()
  const [venuePhotos, setVenuePhotos] = useState([])

  useEffect(() => {
    fetch('/api/venue-photos', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(data => setVenuePhotos(data))
      .catch(() => {})
  }, [token])

  const mapsUrl = get('venue_maps_url')
  const isPartyOnly = guest?.invitationType === 'party_only'

  return (
    <section id="boda" className="section">
      <h2 className="section-title">Detalles del matrimonio</h2>
      <p className="section-subtitle">{get('hero_date', 'Viernes 6 de noviembre de 2026')}</p>

      <div className="wedding-cards">
        {!isPartyOnly && (
          <div className="card wedding-event-card">
            <div className="wedding-event-type">Ceremonia</div>
            <div className="wedding-event-time">{get('ceremony_time', '17:00')} hrs</div>
            <div className="wedding-event-name">{get('venue_name', 'Altos del Paico')}</div>
          </div>
        )}
        <div className="card wedding-event-card">
          <div className="wedding-event-type">{isPartyOnly ? 'Celebración' : 'Recepción'}</div>
          <div className="wedding-event-time">{get('reception_time', '19:30')} hrs</div>
          <div className="wedding-event-name">{get('venue_name', 'Altos del Paico')}</div>
          {isPartyOnly && (
            <div style={{ fontSize: '0.78rem', opacity: 0.65, marginTop: '0.4rem', lineHeight: 1.5 }}>
              Los invitamos a celebrar con nosotros en la fiesta
            </div>
          )}
        </div>
      </div>

      <div className="card venue-card">
        <div className="venue-card-header">
          <MapPinIcon />
          <h3>{get('venue_name', 'Altos del Paico')}</h3>
        </div>
        {get('venue_address') && <p className="venue-address">{get('venue_address')}</p>}
        {get('venue_description') && <p className="venue-description">{get('venue_description')}</p>}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ alignSelf: 'flex-start', marginTop: '0.75rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Ver en Google Maps
          </a>
        )}
      </div>

      {venuePhotos.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>
            El lugar
          </h3>
          <div className="venue-collage">
            {venuePhotos.map(photo => (
              <div key={photo.id} className="venue-collage-item">
                <img
                  src={normalizeImageUrl(photo.image_url)}
                  alt={photo.caption || 'Foto del lugar'}
                  onError={e => e.target.parentElement.style.display = 'none'}
                />
                {photo.caption && <span className="venue-collage-caption">{photo.caption}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
