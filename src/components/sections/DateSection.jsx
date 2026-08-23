import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import AddToCalendar from '../AddToCalendar'
import DecorSlot from '../DecorSlot'
import {
  MONTH_NAMES, WEEKDAY_LABELS, monthMatrix, weddingDateParts, longDateLabel,
} from '../../utils/weddingDate.js'

/** The heart that marks the wedding day on the grid. */
const DayHeart = () => (
  <svg className="cal-heart" viewBox="0 0 32 30" aria-hidden="true">
    <path
      d="M16 28C7.5 21.2 2.5 17 2.5 11.2A7.7 7.7 0 0 1 16 6.4 7.7 7.7 0 0 1 29.5 11.2C29.5 17 24.5 21.2 16 28z"
      fill="currentColor"
    />
  </svg>
)

/** Just the live day grid — no card of its own, so it can draw directly on
 *  top of the envelope illustration at the printed card's position. */
function Calendar({ dateStr }) {
  const { year, month, day } = weddingDateParts(dateStr)
  const weeks = monthMatrix(year, month)

  return (
    <div className="cal-overlay">
      <p className="cal-month">{MONTH_NAMES[month]}</p>
      <p className="cal-year">{year}</p>

      <div className="cal-grid" role="table" aria-label={`${MONTH_NAMES[month]} ${year}`}>
        <div className="cal-row cal-row-head" role="row">
          {WEEKDAY_LABELS.map(label => (
            <span key={label} className="cal-weekday" role="columnheader">{label}</span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="cal-row" role="row">
            {week.map((d, di) => (
              <span
                key={di}
                role="cell"
                className={`cal-day ${d === day ? 'is-wedding' : ''} ${d == null ? 'is-empty' : ''}`}
                aria-current={d === day ? 'date' : undefined}
              >
                {d === day && <DayHeart />}
                <span className="cal-day-num">{d ?? ''}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

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
  const cornerFloral1 = get('corner_floral_1')
  const cornerFloral2 = get('corner_floral_2')

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
        <DecorSlot url={cornerFloral1} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--tl" />
        <DecorSlot url={cornerFloral2} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--tr" />

        <span className="kicker reveal-on-scroll">Reserva el día</span>
        <h2 className="section-title reveal-on-scroll">Nuestra fecha</h2>

        {/* Envelope + calendar, one full illustration — the live day grid
            draws on top at the printed card's spot, nothing else here is
            baked separately. */}
        <div className="cal-envelope-stage reveal-on-scroll">
          {envelopeImage ? (
            <img src={envelopeImage} alt="" className="cal-envelope-image"
              onError={e => { e.target.style.visibility = 'hidden' }} />
          ) : (
            <div className="decor-slot-placeholder" style={{ aspectRatio: '0.78', width: '100%' }}>
              <span>Sobre + calendario (imagen completa)</span>
            </div>
          )}
          <Calendar dateStr={dateStr} />
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
