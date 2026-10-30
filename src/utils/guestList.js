// One-row-per-person guest lists, for filling the venue's "Lista alfabética de
// invitados por mesa" sheet: a confirmed invitation for 2 becomes 2 rows, each
// as "Apellido + Nombre" with its table number from the seating plan.

import { buildParties, normalizeLayout } from './seating.js'

const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'san', 'santa', 'y', 'da', 'di', 'van', 'von'])

// How many trailing words make up one surname ("De la Fuente" = 3, "Soto" = 1).
function surnameLength(tokens) {
  let n = 1
  while (tokens.length - n - 1 >= 1 && PARTICLES.has(tokens[tokens.length - n - 1].toLowerCase())) n++
  return n
}

/**
 * "Juan Pablo Pérez Soto" -> "Pérez Soto Juan Pablo". Names are stored as one
 * free-text field, so this follows the Chilean convention: the last two surnames
 * (compound ones like "De la Fuente" kept together), everything before is the
 * given name; with just three words it reads as one name + two surnames.
 * Placeholders for unnamed companions ("Acompañante de Ana") are left as they are.
 */
export function surnameFirst(full) {
  const name = String(full || '').trim().replace(/\s+/g, ' ')
  if (!name || /^acompañante de /i.test(name)) return name
  const tokens = name.split(' ')
  if (tokens.length === 1) return name
  const s1 = surnameLength(tokens)
  let cut = tokens.length - s1
  if (cut >= 2) cut -= surnameLength(tokens.slice(0, cut)) // second surname, leaving at least a given name
  if (cut < 1) cut = 1
  return `${tokens.slice(cut).join(' ')} ${tokens.slice(0, cut).join(' ')}`
}

// "Mesa 12" -> 12; a table renamed without a number keeps its text.
function tableNumber(name) {
  const m = /(\d+)/.exec(name || '')
  return m ? Number(m[1]) : null
}

/**
 * Everyone who is coming (confirmed), one entry each, plus the tables with their
 * head count. `layoutRaw` is the saved seating plan (null = nobody is seated).
 */
export function guestPeople(invitations, layoutRaw) {
  const layout = normalizeLayout(layoutRaw)
  const tables = layout.elements
    .filter(e => e.type === 'table')
    .map((t, i) => ({ id: t.id, label: t.name || `Mesa ${i + 1}`, num: tableNumber(t.name), count: 0 }))
    .sort((a, b) => (a.num ?? 1e9) - (b.num ?? 1e9) || a.label.localeCompare(b.label, 'es', { numeric: true }))
  const byId = new Map(tables.map(t => [t.id, t]))

  const people = []
  for (const party of buildParties(invitations).filter(p => !p.pending)) {
    for (const p of party.people) {
      const seat = layout.assign[p.id]
      const table = seat ? byId.get(seat.t) : null
      if (table) table.count++
      people.push({
        name: surnameFirst(p.name),
        table, // null when not seated
        tableText: table ? (table.num ?? table.label) : '',
        party: party.label,
        dietary: party.dietary || '',
      })
    }
  }
  people.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
  return { people, tables }
}

/**
 * Rows for the venue's sheet: the alphabetical list on the left ("Apellido + Nombre",
 * "N° mesa") and, beside it, the head count per table with a total — same layout as
 * their template. Only seated people, because the sheet is "según layout".
 */
export function venueSheet(invitations, layoutRaw) {
  const { people, tables } = guestPeople(invitations, layoutRaw)
  const seated = people.filter(p => p.table)
  const summary = tables.map(t => [`mesa ${t.num ?? t.label}`, t.count])
  summary.push(['Total', tables.reduce((s, t) => s + t.count, 0)])

  const headers = ['Apellido + Nombre', 'N° mesa', '', 'numero mesa', 'invitados']
  const height = Math.max(seated.length, summary.length)
  const rows = Array.from({ length: height }, (_, i) => [
    ...(seated[i] ? [seated[i].name, seated[i].tableText] : ['', '']),
    '',
    ...(summary[i] || ['', '']),
  ])
  return { headers, rows, seated: seated.length, unseated: people.length - seated.length }
}
