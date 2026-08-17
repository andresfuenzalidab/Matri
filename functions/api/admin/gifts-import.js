import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

/**
 * Bulk create/update trips and gifts from a parsed CSV — one row per gift,
 * the trip it belongs to named (and auto-created if new) right on that row,
 * since most of the work in this list is adding gifts, not destinations.
 *
 * Matching, same philosophy as invitations-import: a blank "ID" creates a new
 * gift, a filled one that matches updates it, and one that doesn't match is
 * reported as an error instead of silently creating a duplicate. The trip is
 * resolved by "Destino ID" first, then by name (case-insensitive), and only
 * created new if neither matches anything — trip description/image are only
 * touched when the row actually supplies them, so a gift row added without
 * repeating the trip's photo doesn't blank it out.
 */
export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    const rows = Array.isArray(body?.rows) ? body.rows : null
    if (!rows) return err('Se esperaba una lista de filas.')

    const [tripRows, giftRows] = await Promise.all([
      env.DB.prepare('SELECT id, name FROM trips').all(),
      env.DB.prepare('SELECT id FROM gifts').all(),
    ])
    const tripsById = new Map(tripRows.results.map(t => [t.id, t]))
    const tripsByName = new Map(tripRows.results.map(t => [t.name.trim().toLowerCase(), t.id]))
    const giftIds = new Set(giftRows.results.map(g => g.id))
    const orderByTrip = new Map()

    let created = 0, updated = 0, tripsCreated = 0
    const errors = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rowNum = i + 2
      const giftName = (r.giftName || '').trim()
      const tripName = (r.tripName || '').trim()
      if (!giftName) { errors.push(`Fila ${rowNum}: falta el nombre del regalo.`); continue }
      if (!tripName && !r.tripId) { errors.push(`Fila ${rowNum}: falta el destino.`); continue }

      // ── Resolve the trip: by ID, then by name, then create it ──
      let tripId = r.tripId && tripsById.has(r.tripId) ? r.tripId : null
      if (!tripId) tripId = tripsByName.get(tripName.toLowerCase()) || null

      if (!tripId) {
        tripId = crypto.randomUUID()
        await env.DB.prepare(
          'INSERT INTO trips (id, name, description, image_url, order_idx) VALUES (?, ?, ?, ?, ?)'
        ).bind(tripId, tripName, r.tripDescription?.trim() || null, r.tripImageUrl?.trim() || null, tripsById.size).run()
        tripsById.set(tripId, { id: tripId, name: tripName })
        tripsByName.set(tripName.toLowerCase(), tripId)
        tripsCreated++
      } else if (r.tripDescription?.trim() || r.tripImageUrl?.trim()) {
        // Only touch fields the row actually supplied.
        await env.DB.prepare(
          `UPDATE trips SET
             description = COALESCE(NULLIF(?, ''), description),
             image_url = COALESCE(NULLIF(?, ''), image_url)
           WHERE id = ?`
        ).bind(r.tripDescription?.trim() || '', r.tripImageUrl?.trim() || '', tripId).run()
      }

      const price = r.price !== '' && r.price != null && !Number.isNaN(Number(r.price)) ? Number(r.price) : null
      const description = (r.description || '').trim() || null
      const imageUrl = (r.imageUrl || '').trim() || null

      // ── Resolve the gift ──
      const giftId = (r.id || '').trim()
      if (!giftId) {
        const order = (orderByTrip.get(tripId) ?? -1) + 1
        orderByTrip.set(tripId, order)
        await env.DB.prepare(
          'INSERT INTO gifts (id, trip_id, name, price, description, image_url, order_idx, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
        ).bind(crypto.randomUUID(), tripId, giftName, price, description, imageUrl, order).run()
        created++
        continue
      }

      if (!giftIds.has(giftId)) { errors.push(`Fila ${rowNum}: el ID "${giftId}" no corresponde a ningún regalo existente.`); continue }

      await env.DB.prepare(
        'UPDATE gifts SET name = ?, price = ?, description = ?, image_url = ?, trip_id = ? WHERE id = ?'
      ).bind(giftName, price, description, imageUrl, tripId, giftId).run()
      updated++
    }

    return json({ created, updated, tripsCreated, errors })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
