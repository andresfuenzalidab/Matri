import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import AddToCalendar from '../AddToCalendar'
import DecorSlot from '../DecorSlot'
import { longDateLabel } from '../../utils/weddingDate.js'

/** Citación details — chromeless, drawn straight onto whatever sits behind
 *  it (the oval frame art), instead of its own punched-paper card. */
function CitationTag({ rows }) {
  return (
    <div className="paper-tag paper-tag--bare">
      <div className="paper-tag-body">
        {rows.map((row, i) => (
          <div key={row.label} className="paper-tag-row">
            <p className="paper-tag-label">{row.label}</p>
            <p className="paper-tag-value">{row.value}</p>
            {row.hint && <p className="paper-tag-hint">{row.hint}</p>}
          </div>
        ))}
        <AddToCalendar />
      </div>
    </div>
  )
}

export default function DateSection() {
  const { get, guest } = useApp()
  const isPartyOnly = guest?.invitationType === 'party_only'

  const dateStr = get('wedding_date')
  const envelopeImage = normalizeImageUrl(get('calendar_decor_image') || '')
  const ovalFrame = normalizeImageUrl(get('date_oval_frame_image') || '')

  // New botanical-lace skin — public-URL art, all optional (see DecorSlot).
  const cornerFloralTl = get('corner_floral_tl')
  const cornerFloralTr = get('corner_floral_tr')

  const citationTime = isPartyOnly
    ? get('reception_time', '19:30')
    : get('ceremony_time', '17:00')

  const rows = [
    {
      label: 'Fecha y hora de citación',
      value: `${citationTime} hrs`,
      hint: get('hero_date') || longDateLabel(dateStr),
    },
    {
      label: 'Lugar de citación',
      value: get('venue_name', 'Altos del Paico'),
      hint: get('venue_address') || null,
    },
  ]

  const extraNote = get('citation_note')
  if (extraNote) rows.push({ label: 'Ten en cuenta', value: extraNote })

  // The "take the day off" nudge only makes sense for guests invited to the
  // whole day — party-only guests arrive in the evening.
  const recommendation = get('wedding_day_off_tip')
  if (!isPartyOnly && recommendation) {
    rows.push({ label: 'Recomendación', value: recommendation })
  }

  return (
    <section id="fecha" className="section date-section">
      <div className="stationery-scene">
        <DecorSlot url={cornerFloralTl} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--tl" />
        <DecorSlot url={cornerFloralTr} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--tr" />

        <span className="kicker reveal-on-scroll">Reserva el día</span>
        <h2 className="section-title reveal-on-scroll">Nuestra fecha</h2>

        {/* Envelope + calendar — one full illustration; the art already
            has the month, the grid and the wedding day marked, so nothing
            draws on top of it. */}
        <div className="cal-envelope-stage reveal-on-scroll">
          {envelopeImage ? (
            <img src={envelopeImage} alt={`Calendario — ${longDateLabel(dateStr)}`} className="cal-envelope-image"
              onError={e => { e.target.style.visibility = 'hidden' }} />
          ) : (
            <div className="decor-slot-placeholder" style={{ aspectRatio: '0.78', width: '100%' }}>
              <span>Sobre + calendario (imagen completa)</span>
            </div>
          )}
        </div>

        {/* Same idea for the oval frame — the citación details draw inside
            its open window instead of sitting on their own paper card. */}
        <div className="date-celebration-frame reveal-on-scroll">
          {ovalFrame ? (
            <img src={ovalFrame} alt="" className="date-celebration-frame-image"
              onError={e => { e.target.style.visibility = 'hidden' }} />
          ) : (
            <div className="decor-slot-placeholder" style={{ aspectRatio: '0.8', width: '100%' }}>
              <span>Marco ovalado "La celebración"</span>
            </div>
          )}
          <div className="date-celebration-content">
            <CitationTag rows={rows} />
          </div>
        </div>
      </div>
    </section>
  )
}
