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

function Calendar({ dateStr, bgImage }) {
  const { year, month, day } = weddingDateParts(dateStr)
  const weeks = monthMatrix(year, month)

  return (
    <div
      className={`cal-card ${bgImage ? 'has-custom-bg' : ''}`}
      style={bgImage ? { '--custom-bg-image': `url("${bgImage}")` } : undefined}
    >
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

/** Punched paper tag with the practical details of the day. */
function CitationTag({ rows, title, bgImage }) {
  return (
    <div
      className={`paper-tag ${bgImage ? 'has-custom-bg' : ''}`}
      style={bgImage ? { '--custom-bg-image': `url("${bgImage}")` } : undefined}
    >
      <div className="paper-tag-holes" aria-hidden="true">
        <span /><span /><span />
      </div>
      <div className="paper-tag-body">
        <p className="paper-tag-title">{title}</p>
        {rows.map((row, i) => (
          <div key={row.label} className="paper-tag-row">
            <span className="paper-tag-index" aria-hidden="true">({i + 1})</span>
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
  const decor = normalizeImageUrl(get('calendar_decor_image') || '')
  const calendarBg = normalizeImageUrl(get('calendar_card_background_image') || '')
  const citationBg = normalizeImageUrl(get('citation_card_background_image') || '')

  // New botanical-lace skin — public-URL art, all optional (see DecorSlot).
  const paperTexture = get('stationery_paper_texture')
  const sideBorder = get('stationery_side_border')
  const cornerFloral1 = get('corner_floral_1')
  const cornerFloral2 = get('corner_floral_2')
  const ovalFrame = normalizeImageUrl(get('date_oval_frame_image') || '')

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
      <div className="stationery-scene" style={{
        '--stationery-paper': paperTexture ? `url(${normalizeImageUrl(paperTexture)})` : undefined,
        '--stationery-border': sideBorder ? `url(${normalizeImageUrl(sideBorder)})` : undefined,
      }}>
        <DecorSlot url={cornerFloral1} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--tl" />
        <DecorSlot url={cornerFloral2} label="Adorno esquina" aspectRatio="1"
          className="corner-floral corner-floral--tr" />

        <span className="kicker reveal-on-scroll">Reserva el día</span>
        <h2 className="section-title reveal-on-scroll">Nuestra fecha</h2>

        <div className="date-section-stage reveal-on-scroll">
          {decor && (
            <img src={decor} alt="" className="date-section-decor" aria-hidden="true"
              onError={e => { e.target.style.display = 'none' }} />
          )}
          <div className="cal-envelope">
            <Calendar dateStr={dateStr} bgImage={calendarBg} />
          </div>
        </div>

        {/* The oval lace frame is decoration only — sits behind the real
            citation card rather than replacing it, so the venue/time/notes
            stay live and admin-editable instead of baked into an image. */}
        <div className="date-celebration-frame reveal-on-scroll" style={{
          '--frame-image': ovalFrame ? `url(${ovalFrame})` : undefined,
        }}>
          <CitationTag rows={rows} title={get('citation_card_title', 'La celebración')} bgImage={citationBg} />
        </div>
      </div>
    </section>
  )
}
