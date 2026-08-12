import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import AddToCalendar from '../AddToCalendar'
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

function Calendar({ dateStr }) {
  const { year, month, day } = weddingDateParts(dateStr)
  const weeks = monthMatrix(year, month)

  return (
    <div className="cal-card">
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
function CitationTag({ rows, title }) {
  return (
    <div className="paper-tag">
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
      <span className="kicker reveal-on-scroll">Reserva el día</span>
      <h2 className="section-title reveal-on-scroll">Nuestra fecha</h2>

      <div className="date-section-stage reveal-on-scroll">
        {decor && (
          <img src={decor} alt="" className="date-section-decor" aria-hidden="true"
            onError={e => { e.target.style.display = 'none' }} />
        )}
        <div className="cal-envelope">
          <Calendar dateStr={dateStr} />
        </div>
      </div>

      <div className="reveal-on-scroll">
        <CitationTag rows={rows} title={get('citation_card_title', 'La citación')} />
      </div>
    </section>
  )
}
