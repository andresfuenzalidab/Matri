/**
 * The in-memory "backend" behind the interactive admin demo (`?demo_admin=1`
 * → DemoAdminPanel.jsx). Every handler below mirrors its real
 * `functions/api/admin/*.js` counterpart's request/response shape closely
 * enough that the REAL admin components (InvitationsManager, RSVPDashboard,
 * GiftsDashboard) run completely unmodified against this instead — one
 * implementation of the UI, not a second one to keep in sync by hand.
 *
 * State lives in module-level variables, not React state: a full page
 * refresh re-evaluates this module from scratch, which is what makes "los
 * cambios se van al hacer refresh" (per feedback) true for free, with no
 * explicit reset button/logic needed. Within a single page load, edits
 * persist across tabs since the module isn't re-imported.
 *
 * `installDemoAdminApi()` / the returned `uninstall()` swap `window.fetch`
 * in and out — see DemoAdminPanel.jsx, which installs it only for as long
 * as that route is mounted.
 */

function uid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`
}

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString()
}

function seed() {
  const invitations = [
    { id: 1, token: uid(), name: 'María González', email: 'maria@example.com', phone: '+56 9 1234 5678', nickname: null, companion_name: null, is_admin: 0, welcome_message: null, notes: null, invitation_sent: 1, invitation_type: 'all_in', max_additional_guests: 0, created_at: daysAgo(12) },
    { id: 2, token: uid(), name: 'Juan Pérez', email: 'juan@example.com', phone: '+56 9 2345 6789', nickname: 'Juan y Sofía', companion_name: 'Sofía Pérez', is_admin: 0, welcome_message: '¡Los esperamos con mucho cariño!', notes: null, invitation_sent: 1, invitation_type: 'all_in', max_additional_guests: 1, created_at: daysAgo(11) },
    { id: 3, token: uid(), name: 'Pedro Martínez', email: 'pedro@example.com', phone: '+56 9 3456 7890', nickname: null, companion_name: null, is_admin: 0, welcome_message: null, notes: 'Amigo del colegio', invitation_sent: 0, invitation_type: 'party_only', max_additional_guests: 0, created_at: daysAgo(9) },
    { id: 4, token: uid(), name: 'Andrés Fuenzalida', email: 'andres@example.com', phone: '+56 9 4567 8901', nickname: null, companion_name: null, is_admin: 1, welcome_message: null, notes: null, invitation_sent: 1, invitation_type: 'all_in', max_additional_guests: 1, created_at: daysAgo(20) },
    { id: 5, token: uid(), name: 'Camila Rojas', email: 'camila@example.com', phone: '+56 9 5678 9012', nickname: null, companion_name: null, is_admin: 0, welcome_message: null, notes: null, invitation_sent: 1, invitation_type: 'all_in', max_additional_guests: 0, created_at: daysAgo(7) },
    { id: 6, token: uid(), name: 'Diego Soto', email: 'diego@example.com', phone: '+56 9 6789 0123', nickname: 'Diego y Valentina', companion_name: 'Valentina Soto', is_admin: 0, welcome_message: null, notes: null, invitation_sent: 1, invitation_type: 'party_only', max_additional_guests: 1, created_at: daysAgo(5) },
  ]

  const rsvps = new Map([
    [1, { attending: 1, num_guests: 1, companion_name: null, email: 'maria@example.com', dietary_restriction: '', message: '¡Los queremos mucho, no nos lo perderíamos!', submitted_at: daysAgo(8) }],
    [2, { attending: 1, num_guests: 2, companion_name: 'Sofía Pérez', email: 'juan@example.com', dietary_restriction: 'Vegetariana', message: '', submitted_at: daysAgo(6) }],
    [3, { attending: 0, num_guests: null, companion_name: null, email: 'pedro@example.com', dietary_restriction: '', message: '', submitted_at: daysAgo(4) }],
    [4, { attending: 1, num_guests: 2, companion_name: 'Pareja de Andrés', email: 'andres@example.com', dietary_restriction: '', message: '', submitted_at: daysAgo(15) }],
    [6, { attending: 1, num_guests: 2, companion_name: 'Valentina Soto', email: 'diego@example.com', dietary_restriction: '', message: '¡Que lo pasen increíble!', submitted_at: daysAgo(2) }],
  ])

  const tripItaly = { id: uid(), name: 'Luna de miel en Italia', description: '', image_url: '', order_idx: 0 }
  const tripPatagonia = { id: uid(), name: 'Aventura en Patagonia', description: '', image_url: '', order_idx: 1 }
  const trips = [tripItaly, tripPatagonia]

  const gifts = [
    { id: uid(), trip_id: tripItaly.id, name: 'Cena romántica en Roma', price: 80000, description: '', image_url: '', order_idx: 0, active: 1 },
    { id: uid(), trip_id: tripItaly.id, name: 'Clase de cocina italiana', price: 45000, description: '', image_url: '', order_idx: 1, active: 1 },
    { id: uid(), trip_id: tripItaly.id, name: 'Tour en góndola, Venecia', price: 60000, description: '', image_url: '', order_idx: 2, active: 1 },
    { id: uid(), trip_id: tripPatagonia.id, name: 'Buceo en Patagonia', price: 60000, description: '', image_url: '', order_idx: 0, active: 1 },
    { id: uid(), trip_id: tripPatagonia.id, name: 'Trekking Torres del Paine', price: 95000, description: '', image_url: '', order_idx: 1, active: 1 },
  ]

  const reservations = [
    { id: uid(), gift_id: gifts[0].id, invitation_id: 6, guest_name: 'Diego Soto', quantity: 1, confirmed_payment: 1, congratulations_message: '¡Que lo pasen increíble!' },
    { id: uid(), gift_id: gifts[3].id, invitation_id: 4, guest_name: 'Andrés Fuenzalida', quantity: 2, confirmed_payment: 1, congratulations_message: '' },
    { id: uid(), gift_id: gifts[1].id, invitation_id: 1, guest_name: 'María González', quantity: 1, confirmed_payment: 1, congratulations_message: 'Con mucho cariño ♡' },
  ]

  return { nextInvitationId: 7, invitations, rsvps, trips, gifts, reservations }
}

let store = seed()

// ── Read views — same shape the real endpoints return ──────────────

function invitationGifts(invitationId) {
  return store.reservations
    .filter(r => r.invitation_id === invitationId)
    .map(r => {
      const gift = store.gifts.find(g => g.id === r.gift_id)
      return { name: gift?.name || '', price: gift?.price ?? null, quantity: r.quantity, message: r.congratulations_message || '' }
    })
}

function listInvitations() {
  return [...store.invitations]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(inv => {
      const rsvp = store.rsvps.get(inv.id)
      return {
        ...inv,
        attending: rsvp ? rsvp.attending : null,
        num_guests: rsvp ? rsvp.num_guests : null,
        rsvp_companion_name: rsvp ? rsvp.companion_name : null,
        rsvp_email: rsvp ? rsvp.email : null,
        dietary_restriction: rsvp ? rsvp.dietary_restriction : null,
        rsvp_message: rsvp ? rsvp.message : null,
        submitted_at: rsvp ? rsvp.submitted_at : null,
        gifts: invitationGifts(inv.id),
      }
    })
}

function giftRow(g) {
  const resList = store.reservations.filter(r => r.gift_id === g.id)
  const confirmed = resList.filter(r => r.confirmed_payment)
  return {
    ...g,
    reservation_count: resList.length,
    total_quantity: resList.reduce((s, r) => s + r.quantity, 0),
    confirmed_count: confirmed.length,
    confirmed_quantity: confirmed.reduce((s, r) => s + r.quantity, 0),
    messages: resList.map(r => r.congratulations_message).filter(Boolean).join(' | '),
  }
}

function listGifts() {
  const giftRows = store.gifts.filter(g => g.active).map(giftRow)
  const trips = [...store.trips]
    .sort((a, b) => a.order_idx - b.order_idx)
    .map(t => ({ ...t, gifts: giftRows.filter(g => g.trip_id === t.id) }))
  const reserved = giftRows.filter(g => g.confirmed_count > 0).length
  const totalReceived = giftRows.reduce((s, g) => s + (g.confirmed_count > 0 ? (g.price || 0) * g.confirmed_quantity : 0), 0)
  return { trips, summary: { total: giftRows.length, reserved, available: giftRows.length - reserved, totalReceived } }
}

// ── Mutations — same field names/behavior as the real POST/PUT/DELETE ──

function createInvitation(body) {
  const row = {
    id: store.nextInvitationId++,
    token: uid(),
    name: (body.name || '').trim(),
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    nickname: body.nickname?.trim() || null,
    companion_name: body.companionName?.trim() || null,
    is_admin: body.isAdmin ? 1 : 0,
    welcome_message: body.welcomeMessage?.trim() || null,
    max_additional_guests: body.maxAdditionalGuests ?? null,
    invitation_type: body.invitationType || 'all_in',
    notes: body.notes?.trim() || null,
    invitation_sent: 0,
    created_at: new Date().toISOString(),
  }
  store.invitations.unshift(row)
  return row
}

function updateInvitation(body) {
  const inv = store.invitations.find(i => i.id === body.id)
  if (!inv) return false
  inv.welcome_message = body.welcomeMessage?.trim() || null
  inv.max_additional_guests = body.maxAdditionalGuests ?? null
  inv.invitation_type = body.invitationType || 'all_in'
  inv.notes = body.notes?.trim() || null
  inv.phone = body.phone?.trim() || null
  inv.nickname = body.nickname?.trim() || null
  inv.companion_name = body.companionName?.trim() || null
  return true
}

function deleteInvitations(ids) {
  const idSet = new Set(ids.map(Number))
  store.invitations = store.invitations.filter(i => !idSet.has(i.id))
  for (const id of idSet) store.rsvps.delete(id)
  store.reservations = store.reservations.filter(r => !idSet.has(r.invitation_id))
  return idSet.size
}

function importInvitations(rows) {
  const YES = new Set(['si', 'sí', 'yes', 'true', '1', 'x'])
  const isYes = v => YES.has(String(v ?? '').trim().toLowerCase())
  let created = 0, updated = 0
  const errors = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const name = (r.name || '').trim()
    if (!name) { errors.push(`Fila ${rowNum}: falta el nombre.`); continue }
    const token = (r.token || '').trim()
    const fields = {
      name,
      email: r.email?.trim() || null,
      phone: r.phone?.trim() || null,
      nickname: r.nickname?.trim() || null,
      companion_name: r.companionName?.trim() || null,
      is_admin: isYes(r.isAdmin) ? 1 : 0,
      invitation_sent: isYes(r.invitationSent) ? 1 : 0,
      welcome_message: r.welcomeMessage?.trim() || null,
      notes: r.notes?.trim() || null,
      invitation_type: String(r.invitationType || '').trim().toLowerCase().startsWith('solo') ? 'party_only' : 'all_in',
      max_additional_guests: r.maxAdditionalGuests !== '' && r.maxAdditionalGuests != null && !Number.isNaN(Number(r.maxAdditionalGuests))
        ? Number(r.maxAdditionalGuests) : null,
    }
    if (!token) {
      store.invitations.unshift({ id: store.nextInvitationId++, token: uid(), created_at: new Date().toISOString(), ...fields })
      created++
      continue
    }
    const existing = store.invitations.find(i => i.token === token)
    if (!existing) { errors.push(`Fila ${rowNum}: el token "${token}" no corresponde a ninguna invitación existente.`); continue }
    Object.assign(existing, fields)
    updated++
  }
  return { created, updated, errors }
}

function createTrip(body) {
  const order = store.trips.reduce((max, t) => Math.max(max, t.order_idx), -1) + 1
  const row = { id: uid(), name: body.name.trim(), description: body.description?.trim() || null, image_url: body.image_url?.trim() || null, order_idx: order }
  store.trips.push(row)
  return row
}

function updateTrip(body) {
  const trip = store.trips.find(t => t.id === body.id)
  if (!trip) return false
  trip.name = body.name?.trim() ?? trip.name
  trip.description = body.description?.trim() || null
  trip.image_url = body.image_url?.trim() || null
  if (body.order_idx != null) trip.order_idx = body.order_idx
  return true
}

function deleteTrip(id) {
  const giftIds = store.gifts.filter(g => g.trip_id === id).map(g => g.id)
  store.reservations = store.reservations.filter(r => !giftIds.includes(r.gift_id))
  store.gifts = store.gifts.filter(g => g.trip_id !== id)
  store.trips = store.trips.filter(t => t.id !== id)
}

function createGift(body) {
  const order = store.gifts.filter(g => g.trip_id === body.trip_id).reduce((max, g) => Math.max(max, g.order_idx), -1) + 1
  const row = {
    id: uid(), trip_id: body.trip_id, name: body.name.trim(),
    price: body.price != null && body.price !== '' ? Number(body.price) : null,
    description: body.description?.trim() || null, image_url: body.image_url?.trim() || null,
    order_idx: order, active: 1,
  }
  store.gifts.push(row)
  return row
}

function updateGift(body) {
  const gift = store.gifts.find(g => g.id === body.id)
  if (!gift) return false
  gift.name = body.name?.trim() ?? gift.name
  gift.price = body.price != null && body.price !== '' ? Number(body.price) : null
  gift.description = body.description?.trim() || null
  gift.image_url = body.image_url?.trim() || null
  gift.trip_id = body.trip_id ?? gift.trip_id
  if (body.order_idx != null) gift.order_idx = body.order_idx
  return true
}

function deleteGift(id) {
  store.reservations = store.reservations.filter(r => r.gift_id !== id)
  store.gifts = store.gifts.filter(g => g.id !== id)
}

function importGifts(rows) {
  let created = 0, updated = 0, tripsCreated = 0
  const errors = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const giftName = (r.giftName || '').trim()
    const tripName = (r.tripName || '').trim()
    if (!giftName) { errors.push(`Fila ${rowNum}: falta el nombre del regalo.`); continue }
    if (!tripName && !r.tripId) { errors.push(`Fila ${rowNum}: falta el destino.`); continue }

    let trip = store.trips.find(t => t.id === r.tripId) || store.trips.find(t => t.name.trim().toLowerCase() === tripName.toLowerCase())
    if (!trip) {
      trip = { id: uid(), name: tripName, description: r.tripDescription?.trim() || null, image_url: r.tripImageUrl?.trim() || null, order_idx: store.trips.length }
      store.trips.push(trip)
      tripsCreated++
    } else if (r.tripDescription?.trim() || r.tripImageUrl?.trim()) {
      trip.description = r.tripDescription?.trim() || trip.description
      trip.image_url = r.tripImageUrl?.trim() || trip.image_url
    }

    const price = r.price !== '' && r.price != null && !Number.isNaN(Number(r.price)) ? Number(r.price) : null
    const description = (r.description || '').trim() || null
    const imageUrl = (r.imageUrl || '').trim() || null
    const giftId = (r.id || '').trim()

    if (!giftId) {
      const order = store.gifts.filter(g => g.trip_id === trip.id).length
      store.gifts.push({ id: uid(), trip_id: trip.id, name: giftName, price, description, image_url: imageUrl, order_idx: order, active: 1 })
      created++
      continue
    }
    const existing = store.gifts.find(g => g.id === giftId)
    if (!existing) { errors.push(`Fila ${rowNum}: el ID "${giftId}" no corresponde a ningún regalo existente.`); continue }
    Object.assign(existing, { name: giftName, price, description, image_url: imageUrl, trip_id: trip.id })
    updated++
  }
  return { created, updated, tripsCreated, errors }
}

// ── Router ───────────────────────────────────────────────────────

async function route(method, pathname, params, body) {
  if (pathname === '/api/admin/invitations') {
    if (method === 'GET') return [200, listInvitations()]
    if (method === 'POST') return [201, createInvitation(body || {})]
    if (method === 'PUT') return updateInvitation(body || {}) ? [200, { success: true }] : [400, { error: 'ID requerido.' }]
    if (method === 'DELETE') {
      const ids = params.get('ids') ? params.get('ids').split(',') : params.get('id') ? [params.get('id')] : []
      return [200, { success: true, deleted: deleteInvitations(ids) }]
    }
  }
  if (pathname === '/api/admin/invitations-sent' && method === 'PUT') {
    const inv = store.invitations.find(i => i.id === body?.id)
    if (inv) inv.invitation_sent = body.invitation_sent ? 1 : 0
    return [200, { success: true }]
  }
  if (pathname === '/api/admin/invitations-import' && method === 'POST') {
    return [200, importInvitations(body?.rows || [])]
  }
  if (pathname === '/api/admin/reset-rsvp' && method === 'DELETE') {
    store.rsvps.delete(Number(params.get('id')))
    return [200, { ok: true }]
  }
  if (pathname === '/api/admin/reset-gifts' && method === 'DELETE') {
    const id = Number(params.get('id'))
    store.reservations = store.reservations.filter(r => r.invitation_id !== id)
    return [200, { ok: true }]
  }

  if (pathname === '/api/admin/gifts') {
    if (method === 'GET') return [200, listGifts()]
    if (method === 'POST') return [201, createGift(body || {})]
    if (method === 'PUT') return updateGift(body || {}) ? [200, { success: true }] : [400, { error: 'ID requerido.' }]
    if (method === 'DELETE') { deleteGift(params.get('id')); return [200, { success: true }] }
  }
  if (pathname === '/api/admin/gifts-import' && method === 'POST') {
    return [200, importGifts(body?.rows || [])]
  }
  if (pathname === '/api/admin/trips') {
    if (method === 'POST') return body?.name?.trim() ? [201, createTrip(body)] : [400, { error: 'Nombre requerido.' }]
    if (method === 'PUT') return updateTrip(body || {}) ? [200, { success: true }] : [400, { error: 'ID requerido.' }]
    if (method === 'DELETE') { deleteTrip(params.get('id')); return [200, { success: true }] }
  }

  return [404, { error: 'No encontrado (demo).' }]
}

/** Installs the interceptor and returns a function that restores the real
 *  `window.fetch` — call it on unmount. Only `/api/admin/*` calls are
 *  intercepted; everything else (site content, images...) passes through
 *  to the real network untouched. */
export function installDemoAdminApi() {
  const realFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url
    if (!url.startsWith('/api/admin/')) return realFetch(input, init)

    const u = new URL(url, window.location.origin)
    const method = (init?.method || 'GET').toUpperCase()
    let body = null
    if (init?.body) { try { body = JSON.parse(init.body) } catch { body = null } }

    // A little latency so it doesn't feel like a lie — every real action
    // here goes through an actual (fake) network round-trip visually.
    await new Promise(r => setTimeout(r, 220))

    const [status, data] = await route(method, u.pathname, u.searchParams, body)
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
  }
  return () => { window.fetch = realFetch }
}
