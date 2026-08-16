import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import { parseTimelineItems, DEFAULT_TIMELINE_ITEMS } from '../../utils/timelineItems.js'
import PhotoPlaceholder from '../PhotoPlaceholder'
import PhotoCardCarousel from '../PhotoCardCarousel'
import BlendVideo from '../BlendVideo'
import Timeline from '../Timeline'

export default function WeddingInfo({ shouldPlay }) {
  const { get, token, guest } = useApp()
  const [venuePhotos, setVenuePhotos] = useState([])
  const dressVideoRef = useRef(null)

  useEffect(() => {
    if (shouldPlay) dressVideoRef.current?.play().catch(() => {})
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
  const venueMapImage = normalizeImageUrl(get('venue_map_image') || '')
  const descriptionImage = normalizeImageUrl(get('description_image') || '')

  const savedTimeline = parseTimelineItems(get('timeline_items'))
  const timelineItems = savedTimeline.length ? savedTimeline : DEFAULT_TIMELINE_ITEMS

  return (
    <section id="boda" className="section">
      <h2 className="section-title reveal-on-scroll" style={{ textAlign: 'center' }}>El lugar</h2>
      <p className="section-subtitle reveal-on-scroll" style={{ textAlign: 'center' }}>
        {get('venue_name', 'Altos del Paico')}
      </p>

      {/* ── General info image + how to get there ── */}
      <div className="card venue-card reveal-on-scroll">
        {descriptionImage ? (
          <img src={descriptionImage} alt="El lugar"
            style={{ width: '100%', borderRadius: 6, display: 'block', objectFit: 'cover' }}
            onError={e => e.target.style.display = 'none'} />
        ) : (
          <PhotoPlaceholder size="lg" label="Sube aquí una foto del lugar" />
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ alignSelf: 'center', marginTop: '1rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Ver en Google Maps
          </a>
        )}
      </div>

      {/* ── Photos of the venue ── */}
      {venuePhotos.length > 0 && (
        <div className="reveal-on-scroll" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <PhotoCardCarousel photos={venuePhotos} landscape />
        </div>
      )}

      {/* ── Programme of the day — full-day guests only ── */}
      {!isPartyOnly && timelineItems.length > 0 && (
        <div className="wedding-detail-block reveal-on-scroll">
          <h3 className="wedding-detail-title">{get('timeline_title', 'Programa del día')}</h3>
          <Timeline items={timelineItems} />
        </div>
      )}

      {/* ── Map / diagram of the grounds ── */}
      <div className="wedding-detail-block wedding-map-slot reveal-on-scroll">
        <h3 className="wedding-detail-title">{get('venue_map_title', 'Plano del lugar')}</h3>
        {venueMapImage ? (
          <img src={venueMapImage} alt="Plano del lugar" className="wedding-detail-img"
            onError={e => e.target.style.display = 'none'} />
        ) : (
          <PhotoPlaceholder size="lg" label="Sube aquí el plano o mapa del lugar" />
        )}
      </div>

      {/* ── Dress code ── */}
      <div className="wedding-detail-block reveal-on-scroll">
        <h3 className="wedding-detail-title">Código de vestimenta</h3>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', maxWidth: 600, margin: '0 auto' }}>
          {dressCodeImage ? (
            <img src={normalizeImageUrl(dressCodeImage)} alt="Código de vestimenta"
              style={{ flex: '0 0 50%', width: '50%', objectFit: 'cover', display: 'block' }}
              onError={e => e.target.style.display = 'none'} />
          ) : (
            <div style={{ flex: '0 0 50%', width: '50%' }}>
              <PhotoPlaceholder size="md" label="Imagen de código de vestimenta" />
            </div>
          )}
          <BlendVideo
            ref={dressVideoRef}
            loop
            wrapperStyle={{ flex: '0 0 50%', width: '50%' }}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
            src={get('dresscode_video_url') || '/dresscode_cat.mp4'}
          />
        </div>
      </div>
    </section>
  )
}
