import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import { parseTimelineItems, DEFAULT_TIMELINE_ITEMS } from '../../utils/timelineItems.js'
import PhotoPlaceholder from '../PhotoPlaceholder'
import PhotoCardCarousel from '../PhotoCardCarousel'
import Timeline from '../Timeline'
import DecorSlot from '../DecorSlot'

export default function WeddingInfo() {
  const { get, guest, venuePhotos, loadVenuePhotos } = useApp()

  // Shared with the admin editor via AppContext — an edit there updates this
  // same state directly, instead of this component holding its own stale
  // copy fetched once on mount.
  useEffect(() => { loadVenuePhotos() }, [loadVenuePhotos])

  const mapsUrl = get('venue_maps_url')
  const isPartyOnly = guest?.invitationType === 'party_only'
  const dressCodeImage = get('dress_code_image')
  const venueMapImage = normalizeImageUrl(get('venue_map_image') || '')
  const descriptionImage = normalizeImageUrl(get('description_image') || '')
  const dressCodeGif = normalizeImageUrl(get('dresscode_video_url')) || '/dresscode_cat.gif'
  const timerCatGif = normalizeImageUrl(get('background_video_url')) || '/timer_cat.gif'
  const descriptionDogGif = normalizeImageUrl(get('description_dog_url')) || '/description_dog.gif'

  // New botanical-lace skin, scoped to the venue hero for now.
  const cornerFloral1 = get('corner_floral_1')
  const cornerFloral2 = get('corner_floral_2')
  const urnImage = get('urn_image')
  const venuePhotoFrame = normalizeImageUrl(get('venue_photo_frame_image') || '')

  const savedTimeline = parseTimelineItems(get('timeline_items'))
  const timelineItems = savedTimeline.length ? savedTimeline : DEFAULT_TIMELINE_ITEMS

  return (
    <section id="boda" className="section">
      <div className="stationery-scene reveal-on-scroll">
        <DecorSlot url={cornerFloral1} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--sm corner-floral--tl" />
        <DecorSlot url={cornerFloral2} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--sm corner-floral--tr" />

        <h2 className="section-title" style={{ textAlign: 'center' }}>El lugar</h2>
        <p className="section-subtitle" style={{ textAlign: 'center' }}>
          {get('venue_name', 'Altos del Paico')}
        </p>

        {/* ── General info image + how to get there ── */}
        <div className="card venue-card">
          <div className="venue-photo-framed">
            {descriptionImage ? (
              <img src={descriptionImage} alt="El lugar"
                style={{ width: '100%', borderRadius: 6, display: 'block', objectFit: 'cover' }}
                onError={e => e.target.style.display = 'none'} />
            ) : (
              <PhotoPlaceholder size="lg" label="Sube aquí una foto del lugar" />
            )}
            {venuePhotoFrame && (
              <img src={venuePhotoFrame} alt="" className="venue-photo-frame-art" aria-hidden="true"
                onError={e => { e.target.style.display = 'none' }} />
            )}
          </div>
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
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            {/* Auto-advances — the dog + timer cat gif underneath keep looping
                regardless, so a static carousel next to them reads as stalled. */}
            <PhotoCardCarousel photos={venuePhotos} landscape />
          </div>
        )}

        {/* ── Countdown mascots, flanking the urn, right under the carousel ── */}
        <div className="wedding-timer-gifs">
          <img src={descriptionDogGif} alt="" className="wedding-timer-dog" />
          <DecorSlot url={urnImage} label="Urna" aspectRatio="0.85" className="urn-image" />
          <img src={timerCatGif} alt="" className="wedding-timer-cat" />
        </div>
      </div>

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
        {dressCodeImage ? (
          <img src={normalizeImageUrl(dressCodeImage)} alt="Código de vestimenta"
            className="wedding-detail-img" onError={e => e.target.style.display = 'none'} />
        ) : (
          <PhotoPlaceholder size="lg" label="Imagen de código de vestimenta" />
        )}
        <img src={dressCodeGif} alt="" className="wedding-dresscode-gif" />
      </div>
    </section>
  )
}
