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
  const dressCodeImage = normalizeImageUrl(get('dress_code_image') || '')
  const venueMapImage = normalizeImageUrl(get('venue_map_image') || '')
  const dressCodeGif = normalizeImageUrl(get('dresscode_video_url')) || '/dresscode_cat.gif'
  const timerCatGif = normalizeImageUrl(get('background_video_url')) || '/timer_cat.gif'
  const descriptionDogGif = normalizeImageUrl(get('description_dog_url')) || '/description_dog.gif'

  // New botanical-lace skin, scoped to the venue hero for now.
  const cornerFloralTl = get('corner_floral_tl')
  const cornerFloralTr = get('corner_floral_tr')
  const venuePhotoFrame = normalizeImageUrl(get('venue_photo_frame_image') || '')
  const petOverlay = normalizeImageUrl(get('pet_overlay_image') || '')
  const timelineSeparator = get('timeline_separator_image')
  const timelineFloralLeft = get('timeline_floral_left')
  const timelineFloralRight = get('timeline_floral_right')
  const dressCodeNote = get('dress_code_note')

  const savedTimeline = parseTimelineItems(get('timeline_items'))
  const timelineItems = savedTimeline.length ? savedTimeline : DEFAULT_TIMELINE_ITEMS

  return (
    <section id="boda" className="section">
      <div className="stationery-scene reveal-on-scroll">
        <DecorSlot url={cornerFloralTl} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--sm corner-floral--tl" />
        <DecorSlot url={cornerFloralTr} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--sm corner-floral--tr" />

        <h2 className="section-title" style={{ textAlign: 'center' }}>El lugar</h2>
        <p className="section-subtitle" style={{ textAlign: 'center' }}>
          {get('venue_name', 'Altos del Paico')}
        </p>

        {/* ── Venue photos — one carousel, framed, straight under the title ── */}
        <div className="framed-media" style={{ marginTop: '1.5rem' }}>
          {venuePhotos.length > 0 ? (
            <PhotoCardCarousel photos={venuePhotos} landscape />
          ) : (
            <PhotoPlaceholder size="lg" label="Sube fotos del lugar" />
          )}
          {venuePhotoFrame && (
            <img src={venuePhotoFrame} alt="" className="framed-media-overlay" aria-hidden="true"
              onError={e => { e.target.style.display = 'none' }} />
          )}
        </div>

        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ alignSelf: 'center', margin: '1rem auto 0', display: 'table' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Ver en Google Maps
          </a>
        )}

        {/* ── Dog + cat, each with the same optional overlay art on top ── */}
        <div className="wedding-timer-gifs">
          <div className="framed-media wedding-timer-dog">
            <img src={descriptionDogGif} alt="" style={{ width: '100%', display: 'block' }} />
            {petOverlay && <img src={petOverlay} alt="" className="framed-media-overlay" aria-hidden="true" />}
          </div>
          <div className="framed-media wedding-timer-cat">
            <img src={timerCatGif} alt="" style={{ width: '100%', display: 'block' }} />
            {petOverlay && <img src={petOverlay} alt="" className="framed-media-overlay" aria-hidden="true" />}
          </div>
        </div>
      </div>

      {/* ── Programme of the day — full-day guests only ── */}
      {!isPartyOnly && timelineItems.length > 0 && (
        <div className="wedding-detail-block timeline-block reveal-on-scroll">
          <DecorSlot url={timelineSeparator} label="Separador horizontal" aspectRatio="7"
            className="timeline-separator" />

          <h3 className="wedding-detail-title">{get('timeline_title', 'Programa del día')}</h3>

          <div className="timeline-flanked">
            <DecorSlot url={timelineFloralLeft} label="Adorno vertical" aspectRatio="0.18"
              className="timeline-floral timeline-floral--left" />
            <Timeline items={timelineItems} />
            <DecorSlot url={timelineFloralRight} label="Adorno vertical" aspectRatio="0.18"
              className="timeline-floral timeline-floral--right" />
          </div>

          <DecorSlot url={timelineSeparator} label="Separador horizontal" aspectRatio="7"
            className="timeline-separator" />
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

      {/* ── Dress code — a single image (no corner florals here), an
          optional "mayores indicaciones" note drawn on top of it, and the
          cat gif below with the same overlay treatment as the other two ── */}
      <div className="wedding-detail-block reveal-on-scroll">
        <h3 className="wedding-detail-title">Código de vestimenta</h3>
        <div className="framed-media wedding-detail-img">
          {dressCodeImage ? (
            <img src={dressCodeImage} alt="Código de vestimenta" style={{ width: '100%', display: 'block' }}
              onError={e => e.target.style.display = 'none'} />
          ) : (
            <PhotoPlaceholder size="lg" label="Imagen de código de vestimenta" />
          )}
          {dressCodeNote && <p className="dresscode-note-overlay">{dressCodeNote}</p>}
        </div>
        <div className="framed-media wedding-dresscode-gif">
          <img src={dressCodeGif} alt="" style={{ width: '100%', display: 'block' }} />
          {petOverlay && <img src={petOverlay} alt="" className="framed-media-overlay" aria-hidden="true" />}
        </div>
      </div>
    </section>
  )
}
