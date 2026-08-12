import { useApp } from '../context/AppContext'
import { weddingInstant } from '../utils/weddingDate.js'

const pad = n => String(n).padStart(2, '0')
const stamp = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`

const CalendarGlyph = () => (
  <svg viewBox="0 0 24 24" className="cal-add-icon" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)

/**
 * "Save the date" buttons. Times are written as floating local values (no UTC
 * suffix) so the calendar shows the exact hours we quote on the page.
 */
export default function AddToCalendar({ className = '' }) {
  const { get, guest } = useApp()

  const isPartyOnly = guest?.invitationType === 'party_only'
  const venueName = get('venue_name', 'Altos del Paico')
  const startTime = isPartyOnly ? get('reception_time', '19:30') : get('ceremony_time', '17:00')
  const endTime = get('wedding_end_time', '03:00')

  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)

  const day = weddingInstant(get('wedding_date'), startTime)
  const dayStamp = stamp(day)
  // A finish hour earlier than the start means the party ran past midnight.
  const endStamp = eh < sh ? stamp(new Date(day.getTime() + 86400000)) : dayStamp

  const dtStart = `${dayStamp}T${pad(sh)}${pad(sm)}00`
  const dtEnd = `${endStamp}T${pad(eh)}${pad(em)}00`

  const title = `Matrimonio ${get('hero_title', 'Cata & Andrés')}`
  const gcUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${dtStart}/${dtEnd}` +
    `&location=${encodeURIComponent(venueName)}`

  function downloadIcs() {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Matrimonio//ES',
      'BEGIN:VEVENT',
      `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
      `SUMMARY:${title}`,
      `LOCATION:${venueName}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'matrimonio-cata-andres.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`cal-add ${className}`}>
      <p className="cal-add-label">Agrégalo a tu calendario</p>
      <div className="cal-add-actions">
        <a href={gcUrl} target="_blank" rel="noopener noreferrer" className="cal-add-btn">
          <CalendarGlyph />
          Google Calendar
        </a>
        <span className="cal-add-sep" aria-hidden="true" />
        <button type="button" className="cal-add-btn" onClick={downloadIcs}>
          <CalendarGlyph />
          Apple / Outlook
        </button>
      </div>
    </div>
  )
}
