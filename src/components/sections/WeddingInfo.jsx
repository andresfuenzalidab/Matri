import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import { parseTimelineItems, DEFAULT_TIMELINE_ITEMS } from '../../utils/timelineItems.js'
import PhotoPlaceholder from '../PhotoPlaceholder'
import PhotoCardCarousel from '../PhotoCardCarousel'
import Timeline from '../Timeline'
import DecorSlot from '../DecorSlot'

const DRESS_CODE_NOTE_DEFAULT =
  'Queremos verlos elegantes y disfrutando. Pueden elegir los colores que más les gusten; ' +
  'solo les pedimos no usar el blanco, crema, marfil o tonos similares reservados para la novia.'

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
  // One shared background for the dog+cat pair, and a separate, dedicated
  // one for the dress-code cat — two different spots, two different images.
  const petsOverlay = normalizeImageUrl(get('pets_overlay_image') || '')
  const dresscodePetOverlay = normalizeImageUrl(get('dresscode_pet_overlay_image') || '')
  const timelineSeparatorTop = get('timeline_separator_top_image')
  const timelineSeparatorBottom = get('timeline_separator_bottom_image')
  const timelineFloralLeft = get('timeline_floral_left')
  const timelineFloralRight = get('timeline_floral_right')
  const dressCodeNote = get('dress_code_note', DRESS_CODE_NOTE_DEFAULT)

  const savedTimeline = parseTimelineItems(get('timeline_items'))
  const timelineItems = savedTimeline.length ? savedTimeline : DEFAULT_TIMELINE_ITEMS

  return (
    <section id="boda" className="section">
      <div className="stationery-scene">
        <DecorSlot url={cornerFloralTl} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--sm corner-floral--tl" />
        <DecorSlot url={cornerFloralTr} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--sm corner-floral--tr" />

        <h2 className="section-title corner-floral-clearance reveal-on-scroll" style={{ textAlign: 'center' }}>El lugar</h2>
        <p className="section-subtitle reveal-on-scroll" style={{ textAlign: 'center' }}>
          {get('venue_name', 'Altos del Paico')}
        </p>

        {/* ── Venue photos — one carousel, framed, full width, straight
            under the title. Arrows/dots live inside the carousel itself
            now (see PhotoCardCarousel) — nothing renders below the frame. ── */}
        <div className="framed-media reveal-on-scroll" style={{ marginTop: '1.5rem' }}>
          <div className="framed-media-content">
            {venuePhotos.length > 0 ? (
              <PhotoCardCarousel photos={venuePhotos} landscape />
            ) : (
              <PhotoPlaceholder size="lg" label="Sube fotos del lugar" />
            )}
          </div>
          {venuePhotoFrame && (
            <img src={venuePhotoFrame} alt="" className="framed-media-overlay" aria-hidden="true"
              onError={e => { e.target.style.display = 'none' }} />
          )}
        </div>

        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-gold reveal-on-scroll"
            style={{ alignSelf: 'center', margin: '1rem auto 0', display: 'table' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Ver en Google Maps
          </a>
        )}

        {/* ── Dog + cat share one full-width background/frame — not one
            each — with real space between them. ── */}
        <div className="framed-media reveal-on-scroll" style={{ marginTop: '2.5rem' }}>
          <div className="pets-row">
            <div className="wedding-timer-dog">
              <img src={descriptionDogGif} alt="" style={{ width: '100%', display: 'block' }} />
            </div>
            <div className="wedding-timer-cat">
              <img src={timerCatGif} alt="" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
          {petsOverlay && (
            <img src={petsOverlay} alt="" className="framed-media-overlay" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* ── Programme of the day — full-day guests only ── */}
      {!isPartyOnly && timelineItems.length > 0 && (
        <div className="wedding-detail-block timeline-block reveal-on-scroll">
          <DecorSlot url={timelineSeparatorTop} label="Separador horizontal (arriba)" aspectRatio="7"
            className="timeline-separator full-bleed" />

          <h3 className="wedding-detail-title">{get('timeline_title', 'Programa del día')}</h3>

          {/* The florals are delimiters the list sits inside of, not
              decoration drawn over it — see .timeline-flanked in
              stationery.css for the padding that keeps the two apart. */}
          <div className="timeline-flanked">
            <DecorSlot url={timelineFloralLeft} label="Adorno vertical" aspectRatio="0.18"
              className="timeline-floral timeline-floral--left" />
            <Timeline items={timelineItems} />
            <DecorSlot url={timelineFloralRight} label="Adorno vertical" aspectRatio="0.18"
              className="timeline-floral timeline-floral--right" />
          </div>

          <DecorSlot url={timelineSeparatorBottom} label="Separador horizontal (cierre)" aspectRatio="7"
            className="timeline-separator full-bleed" />
        </div>
      )}

      {/* ── Map / diagram of the grounds — image and placeholder both
          wrapped the same way, so there's no width mismatch between "an
          image is set" and "it isn't yet" ── */}
      <div className="wedding-detail-block wedding-map-slot reveal-on-scroll">
        <h3 className="wedding-detail-title">{get('venue_map_title', 'Plano del lugar')}</h3>
        <div className="framed-media full-bleed wedding-detail-img">
          {venueMapImage ? (
            <img src={venueMapImage} alt="Plano del lugar" style={{ width: '100%', display: 'block' }}
              onError={e => e.target.style.display = 'none'} />
          ) : (
            <PhotoPlaceholder size="lg" label="Sube aquí el plano o mapa del lugar" />
          )}
        </div>
      </div>

      {/* ── Dress code — a single image (no corner florals here), a
          customizable note drawn over it, and the cat gif below with its
          own dedicated full-width background (not the dog+cat one). ── */}
      <div className="wedding-detail-block reveal-on-scroll">
        <h3 className="wedding-detail-title">Código de vestimenta</h3>
        <div className="framed-media full-bleed wedding-detail-img">
          {dressCodeImage ? (
            <img src={dressCodeImage} alt="Código de vestimenta" style={{ width: '100%', display: 'block' }}
              onError={e => e.target.style.display = 'none'} />
          ) : (
            <PhotoPlaceholder size="lg" label="Imagen de código de vestimenta" />
          )}
          {dressCodeNote && <p className="dresscode-note-overlay">{dressCodeNote}</p>}
        </div>
        <div className="framed-media full-bleed" style={{ marginTop: '1.5rem' }}>
          <div className="dresscode-pet-row">
            <div className="framed-media">
              <img src={dressCodeGif} alt="" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
          {dresscodePetOverlay && (
            <img src={dresscodePetOverlay} alt="" className="framed-media-overlay" aria-hidden="true" />
          )}
        </div>
      </div>
    </section>
  )
}
