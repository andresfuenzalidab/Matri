/**
 * Pure helpers behind the admin "Seating plan" (components/admin/SeatingPlan.jsx):
 * turning confirmed RSVPs into seatable people, table geometry, the seat
 * assignment rules, and the PNG / print exports. Nothing here touches React
 * or the DOM (except the two export functions at the bottom, which open a
 * window / trigger a download).
 *
 * Layout shape (this is exactly what gets stored in D1, see seating.js API):
 *   {
 *     v: 1,
 *     elements: [
 *       { id, type: 'table', shape: 'round'|'rect', x, y, rot, seats, name, oneSide },
 *       { id, type: 'shape', preset: 'dance'|'stage'|'bar'|'buffet', x, y, w, h, rot, label, round },
 *     ],
 *     assign: { [personId]: { t: tableId, s: seatIndex } },
 *   }
 * x/y are the element's CENTER on the floor; rot is degrees.
 */

export const FLOOR = { w: 2000, h: 1300 }
export const GRID = 10
export const SEAT_D = 30

/** Earthy, on-brand tones — one per party so couples/families read at a glance. */
export const PARTY_COLORS = [
  '#6d7355', '#b68235', '#a4573d', '#b57a86',
  '#4f6b7a', '#7a4e6b', '#8f9a63', '#c0864a',
]

export const SHAPE_PRESETS = {
  dance: { label: 'Pista de baile', w: 320, h: 320 },
  stage: { label: 'Escenario', w: 360, h: 130 },
  bar: { label: 'Barra', w: 240, h: 70 },
  buffet: { label: 'Buffet', w: 300, h: 80 },
}

export const snap = (v, g = GRID) => Math.round(v / g) * g
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export function uid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
}

export function emptyLayout() {
  return { v: 1, elements: [], assign: {} }
}

export function normalizeLayout(raw) {
  if (!raw || typeof raw !== 'object') return emptyLayout()
  const elements = Array.isArray(raw.elements)
    ? raw.elements.filter(e => e && e.id && (e.type === 'table' || e.type === 'shape'))
    : []
  const assign = raw.assign && typeof raw.assign === 'object' && !Array.isArray(raw.assign) ? raw.assign : {}
  return { v: 1, elements, assign }
}

// ── Guests ───────────────────────────────────────────────────────────────

const splitNames = s => String(s || '').split(/\s+y\s+/i).map(x => x.trim()).filter(Boolean)

function initialsOf(name) {
  const words = String(name).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/**
 * One "party" per confirmed invitation, holding one seatable person per
 * confirmed head. `num_guests` is authoritative for how many; the names come
 * from what the RSVP form recorded (`rsvp_companion_name` is the joined list
 * of who is actually coming — "A y B", or just one of them on a partial
 * couple), falling back to the invitation's own names, then a generic
 * "Acompañante" for unnamed plus-ones.
 */
export function buildParties(invitations) {
  const parties = []
  for (const inv of invitations || []) {
    if (!inv.attending) continue
    const n = Math.max(1, Number(inv.num_guests) || 1)
    const main = (inv.name || '').trim() || 'Invitado'
    const first = main.split(/\s+/)[0]
    const known = splitNames(inv.rsvp_companion_name)

    const same = (a, b) => a.toLowerCase() === b.toLowerCase()
    const names = known.slice(0, n)
    // Older RSVPs stored only the companion here (not "main y companion"):
    // if there are more heads than names and the main guest isn't among
    // them, the main guest is one of the people coming.
    if (names.length < n && !names.some(x => same(x, main))) names.unshift(main)
    const companion = (inv.companion_name || '').trim()
    if (names.length === 1 && same(names[0], main) && n >= 2 && companion) names.push(companion)

    const named = names.length
    const unnamed = n - named
    for (let i = 0; i < unnamed; i++) names.push(`Acompañante de ${first}`)

    const color = PARTY_COLORS[Number(inv.id) % PARTY_COLORS.length]
    const people = names.map((name, i) => {
      const generic = i >= named
      const g = i - named + 1
      return {
        id: `${inv.id}-${i}`,
        partyId: inv.id,
        name: generic && unnamed > 1 ? `${name} (${g})` : name,
        initials: generic ? `+${g}` : initialsOf(name),
        color,
      }
    })

    const firstNames = people.map(p => p.name.split(/\s+/)[0])
    parties.push({
      id: inv.id,
      label: (inv.nickname || '').trim() || (people.length > 1 && !unnamed ? firstNames.join(' y ') : people[0].name),
      partyOnly: inv.invitation_type === 'party_only',
      dietary: (inv.dietary_restriction || '').trim(),
      color,
      people,
    })
  }
  parties.sort((a, b) => a.label.localeCompare(b.label, 'es'))
  return parties
}

// ── Geometry ─────────────────────────────────────────────────────────────

/**
 * Local (unrotated, centered on the element) geometry for a table: the
 * bounding box `W×H` that includes the chairs, the table top `tw×th`, and
 * each seat's center plus its outward direction (used to place name labels).
 */
export function tableGeometry(t) {
  const n = Math.max(1, t.seats | 0)
  const seats = []
  if (t.shape === 'round') {
    const r = Math.max(56, Math.ceil((n * 38) / (2 * Math.PI)) - 22)
    const ring = r + 22
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
      seats.push({ x: Math.cos(a) * ring, y: Math.sin(a) * ring, ox: Math.cos(a), oy: Math.sin(a) })
    }
    const W = 2 * (ring + SEAT_D / 2 + 2)
    return { W, H: W, tw: 2 * r, th: 2 * r, seats }
  }
  const top = t.oneSide ? 0 : Math.ceil(n / 2)
  const bottom = n - top
  const maxRow = Math.max(top, bottom)
  const tw = Math.max(120, maxRow * 42 + 16)
  const th = 70
  const off = th / 2 + 22
  for (let i = 0; i < top; i++) seats.push({ x: -tw / 2 + ((i + 0.5) * tw) / top, y: -off, ox: 0, oy: -1 })
  for (let i = 0; i < bottom; i++) seats.push({ x: -tw / 2 + ((i + 0.5) * tw) / bottom, y: off, ox: 0, oy: 1 })
  return { W: tw + 40, H: th + 2 * (22 + SEAT_D / 2 + 2), tw, th, seats }
}

/** Unrotated bounding box of any element. */
export function elementBox(el) {
  if (el.type === 'table') {
    const g = tableGeometry(el)
    return { w: g.W, h: g.H }
  }
  return { w: el.w, h: el.h }
}

/** Bounds (with rotation approximated by the circumscribed circle) of all elements. */
export function layoutBounds(elements, pad = 60) {
  if (!elements.length) return { minX: 0, minY: 0, maxX: FLOOR.w, maxY: FLOOR.h }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of elements) {
    const { w, h } = elementBox(el)
    const r = el.rot ? Math.hypot(w, h) / 2 : 0
    const hw = r || w / 2
    const hh = r || h / 2
    minX = Math.min(minX, el.x - hw); maxX = Math.max(maxX, el.x + hw)
    minY = Math.min(minY, el.y - hh); maxY = Math.max(maxY, el.y + hh)
  }
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

export function makeTable({ shape, seats, x, y, number }) {
  return { id: uid(), type: 'table', shape, x, y, rot: 0, seats, name: `Mesa ${number}`, oneSide: false }
}

export function makeShape({ preset, x, y }) {
  const p = SHAPE_PRESETS[preset]
  return { id: uid(), type: 'shape', preset, x, y, w: p.w, h: p.h, rot: 0, label: p.label, round: false }
}

// ── Assignment rules ─────────────────────────────────────────────────────

/** { seatIndex: personId } for one table. */
export function seatOccupants(assign, tableId) {
  const out = {}
  for (const [pid, a] of Object.entries(assign)) if (a.t === tableId) out[a.s] = pid
  return out
}

export function countAtTable(assign, tableId) {
  let n = 0
  for (const a of Object.values(assign)) if (a.t === tableId) n++
  return n
}

export function unassign(assign, ids) {
  const next = { ...assign }
  for (const id of ids) delete next[id]
  return next
}

/** Put one person on a specific seat; swaps with whoever is there if the
 *  person is already seated, otherwise sends the previous occupant back to
 *  the list. */
export function assignToSeat(assign, personId, tableId, seat) {
  const next = { ...assign }
  const occupant = Object.keys(next).find(id => next[id].t === tableId && next[id].s === seat && id !== personId)
  const from = next[personId]
  if (occupant) {
    if (from) next[occupant] = { t: from.t, s: from.s }
    else delete next[occupant]
  }
  next[personId] = { t: tableId, s: seat }
  return next
}

/** Seat several people at the first free chairs of a table. Anyone who
 *  doesn't fit stays exactly where they were. */
export function assignGroupToTable(assign, table, ids) {
  const next = { ...assign }
  const mine = ids.filter(id => next[id]?.t === table.id)
  const toPlace = ids.filter(id => !mine.includes(id))
  const taken = new Set(Object.values(next).filter(a => a.t === table.id).map(a => a.s))
  const free = []
  for (let s = 0; s < table.seats; s++) if (!taken.has(s)) free.push(s)
  let placed = 0
  for (const id of toPlace) {
    if (!free.length) break
    next[id] = { t: table.id, s: free.shift() }
    placed++
  }
  return { assign: next, placed, overflow: toPlace.length - placed }
}

/** After a table's seat count changes: anyone on a chair that no longer
 *  exists moves to a free chair if there is one, otherwise goes back to the
 *  list. Returns how many went back. */
export function reflowTable(assign, table) {
  const next = { ...assign }
  const taken = new Set(Object.values(next).filter(a => a.t === table.id && a.s < table.seats).map(a => a.s))
  let dropped = 0
  for (const [pid, a] of Object.entries(next)) {
    if (a.t !== table.id || a.s < table.seats) continue
    let s = 0
    while (s < table.seats && taken.has(s)) s++
    if (s < table.seats) { next[pid] = { t: table.id, s }; taken.add(s) }
    else { delete next[pid]; dropped++ }
  }
  return { assign: next, dropped }
}

/** Drop assignments pointing at people / tables / chairs that no longer exist. */
export function pruneAssign(assign, validPeople, elements) {
  const tables = new Map(elements.filter(e => e.type === 'table').map(t => [t.id, t]))
  const seen = new Set()
  const next = {}
  let removed = 0
  for (const [pid, a] of Object.entries(assign || {})) {
    const t = a && tables.get(a.t)
    const key = t && `${a.t}:${a.s}`
    if (!validPeople.has(pid) || !t || !(a.s >= 0 && a.s < t.seats) || seen.has(key)) { removed++; continue }
    seen.add(key)
    next[pid] = { t: a.t, s: a.s }
  }
  return { assign: next, removed }
}

// ── Export ───────────────────────────────────────────────────────────────

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const SVG_FONT = 'Georgia, "Times New Roman", serif'
const SHAPE_FILL = {
  dance: { fill: '#e9d3a2', stroke: '#b68235', text: '#5a3b0a' },
  stage: { fill: '#565c42', stroke: '#3c4530', text: '#f7f3ea' },
  bar: { fill: '#5a3b0a', stroke: '#3a270d', text: '#f7f3ea' },
  buffet: { fill: '#8f9a63', stroke: '#6d7355', text: '#fdf9f0' },
}

/** A standalone SVG of the whole plan, cropped to what's on it. */
export function buildPlanSvg(layout, peopleById) {
  const els = layout.elements
  const b = layoutBounds(els, 50)
  const w = Math.round(b.maxX - b.minX)
  const h = Math.round(b.maxY - b.minY)
  const occupantsOf = id => seatOccupants(layout.assign, id)

  const parts = []
  for (const el of els.filter(e => e.type === 'shape')) {
    const c = SHAPE_FILL[el.preset] || SHAPE_FILL.dance
    const body = el.round
      ? `<ellipse rx="${el.w / 2}" ry="${el.h / 2}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="3"/>`
      : `<rect x="${-el.w / 2}" y="${-el.h / 2}" width="${el.w}" height="${el.h}" rx="8" fill="${c.fill}" stroke="${c.stroke}" stroke-width="3"/>`
    const fs = clamp(Math.min(el.h * 0.28, el.w / Math.max(4, el.label.length) * 1.6), 12, 26)
    parts.push(`<g transform="translate(${el.x - b.minX} ${el.y - b.minY}) rotate(${el.rot || 0})">${body}<text transform="rotate(${-(el.rot || 0)})" text-anchor="middle" dominant-baseline="central" font-family='${SVG_FONT}' font-size="${fs}" font-weight="600" fill="${c.text}">${esc(el.label)}</text></g>`)
  }
  for (const el of els.filter(e => e.type === 'table')) {
    const g = tableGeometry(el)
    const occ = occupantsOf(el.id)
    const count = Object.keys(occ).length
    const top = el.shape === 'round'
      ? `<circle r="${g.tw / 2}" fill="#fbf7ee" stroke="#b68235" stroke-width="3"/>`
      : `<rect x="${-g.tw / 2}" y="${-g.th / 2}" width="${g.tw}" height="${g.th}" rx="10" fill="#fbf7ee" stroke="#b68235" stroke-width="3"/>`
    const seats = g.seats.map((s, i) => {
      const p = peopleById.get(occ[i])
      return p
        ? `<circle cx="${s.x}" cy="${s.y}" r="${SEAT_D / 2}" fill="${p.color}"/><text transform="translate(${s.x} ${s.y}) rotate(${-(el.rot || 0)})" text-anchor="middle" dominant-baseline="central" font-family='${SVG_FONT}' font-size="11" font-weight="700" fill="#fdf9f0">${esc(p.initials)}</text>`
        : `<circle cx="${s.x}" cy="${s.y}" r="${SEAT_D / 2 - 1}" fill="#fbf7ee" stroke="#b68235" stroke-width="1.5" stroke-dasharray="3 3"/>`
    }).join('')
    // ~0.55em per character: shrink the name until it fits inside the table top.
    const fs = clamp((g.tw * 0.8) / (Math.max(4, el.name.length) * 0.55), 9, 22)
    parts.push(`<g transform="translate(${el.x - b.minX} ${el.y - b.minY}) rotate(${el.rot || 0})">${top}${seats}<g transform="rotate(${-(el.rot || 0)})"><text text-anchor="middle" y="-2" font-family='${SVG_FONT}' font-size="${fs}" font-weight="700" fill="#4a4038">${esc(el.name)}</text><text text-anchor="middle" y="${fs * 0.9}" font-family='${SVG_FONT}' font-size="11" fill="#7d5411">${count}/${el.seats}</text></g></g>`)
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f7f3ea"/>${parts.join('')}</svg>`
  return { svg, width: w, height: h }
}

/** Renders the plan to a PNG and triggers a download. */
export function downloadPlanPng(layout, peopleById, filename = 'seating-plan.png') {
  const { svg, width, height } = buildPlanSvg(layout, peopleById)
  const scale = Math.min(2, 4000 / Math.max(width, height))
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  const img = new Image()
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('No se pudo generar la imagen.'))
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(a.href), 2000)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo generar la imagen.')) }
    img.src = url
  })
}

/** Opens a print-ready page: the plan first, then one card per table. */
export function printPlan(layout, parties, peopleById) {
  const { svg } = buildPlanSvg(layout, peopleById)
  const tables = layout.elements.filter(e => e.type === 'table')
  const cards = tables.map(t => {
    const occ = seatOccupants(layout.assign, t.id)
    const rows = Object.keys(occ).map(Number).sort((a, b) => a - b).map(s => {
      const p = peopleById.get(occ[s])
      const diet = p && parties.find(x => x.id === p.partyId)?.dietary
      return `<li><span class="n">${s + 1}</span>${esc(p?.name || '')}${diet ? `<em> · ${esc(diet)}</em>` : ''}</li>`
    }).join('')
    return `<section class="card"><h3>${esc(t.name)}<small>${Object.keys(occ).length}/${t.seats}</small></h3><ol>${rows || '<li class="empty">Sin invitados</li>'}</ol></section>`
  }).join('')

  const seated = new Set(Object.keys(layout.assign))
  const pending = parties.flatMap(p => p.people).filter(p => !seated.has(p.id))
  const pendingHtml = pending.length
    ? `<section class="card wide"><h3>Sin mesa<small>${pending.length}</small></h3><p>${pending.map(p => esc(p.name)).join(' · ')}</p></section>`
    : ''

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Seating plan</title><style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #4a4038; }
    h1 { font-weight: 600; font-size: 22px; margin: 0 0 10px; text-align: center; color: #7d5411; }
    .plan { page-break-after: always; text-align: center; }
    .plan svg { max-width: 100%; max-height: 165mm; height: auto; border: 1px solid #d9c9a3; }
    .grid { columns: 3; column-gap: 8mm; }
    .card { break-inside: avoid; border: 1px solid #d9c9a3; border-radius: 6px; padding: 8px 12px; margin: 0 0 8px; }
    .card.wide { column-span: all; }
    h3 { margin: 0 0 4px; font-size: 15px; display: flex; justify-content: space-between; color: #7d5411; }
    h3 small { font-weight: 400; color: #7d7979; }
    ol { margin: 0; padding: 0; list-style: none; font-size: 12px; line-height: 1.6; }
    .n { display: inline-block; width: 20px; color: #b68235; }
    em { color: #7d7979; font-size: 11px; }
    .empty { color: #9b9797; }
    p { font-size: 12px; line-height: 1.6; margin: 0; }
  </style></head><body>
    <div class="plan"><h1>Seating plan</h1>${svg}</div>
    <h1>Invitados por mesa</h1><div class="grid">${cards}${pendingHtml}</div>
    <script>window.addEventListener('load',()=>setTimeout(()=>window.print(),400))</script>
  </body></html>`

  const win = window.open('', '_blank', 'width=1100,height=800')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  return true
}
