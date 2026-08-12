/**
 * The wedding date lives in site content as `wedding_date` (YYYY-MM-DD) so the
 * calendar and the countdown always agree. Chile sits at UTC-3 in November.
 */

export const DEFAULT_WEDDING_DATE = '2026-11-06'
export const CHILE_OFFSET = '-03:00'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{1,2}:\d{2}$/

function safeDate(dateStr) {
  return DATE_RE.test((dateStr || '').trim()) ? dateStr.trim() : DEFAULT_WEDDING_DATE
}

function safeTime(timeStr, fallback = '17:00') {
  const t = (timeStr || '').trim()
  if (!TIME_RE.test(t)) return fallback
  const [h, m] = t.split(':')
  return `${h.padStart(2, '0')}:${m}`
}

/** Exact instant of the ceremony, for the countdown. */
export function weddingInstant(dateStr, timeStr) {
  return new Date(`${safeDate(dateStr)}T${safeTime(timeStr)}:00${CHILE_OFFSET}`)
}

/** Calendar coordinates (local, no timezone maths) for the month grid. */
export function weddingDateParts(dateStr) {
  const [year, month, day] = safeDate(dateStr).split('-').map(Number)
  return { year, month: month - 1, day }
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/** Monday-first weekday initials, matching the grid below. */
export const WEEKDAY_LABELS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO']

/**
 * Monday-first month grid: an array of 7-slot weeks holding day numbers,
 * with `null` for the leading/trailing blanks.
 */
export function monthMatrix(year, month) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = Array(firstWeekday).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** "Viernes 6 de noviembre de 2026" */
export function longDateLabel(dateStr) {
  const { year, month, day } = weddingDateParts(dateStr)
  const d = new Date(year, month, day)
  const label = d.toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
