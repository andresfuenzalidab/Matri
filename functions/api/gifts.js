import { getInvitation, json, err } from './_auth.js'

export async function onRequestGet({ request, env }) {
  const inv = await getInvitation(request, env)
  if (!inv) return err('Unauthorized', 401)

  const [rows, myReservations, otherReservations, confirmedRows] = await Promise.all([
    env.DB.prepare(`
      SELECT
        g.id AS gift_id,
        g.name AS gift_name,
        g.price,
        g.description,
        g.image_url AS gift_image,
        t.id AS trip_id,
        t.name AS trip_name,
        t.image_url AS trip_image,
        t.order_idx AS trip_order,
        g.order_idx AS gift_order
      FROM gifts g
      JOIN trips t ON g.trip_id = t.id
      WHERE g.active = 1
      ORDER BY t.order_idx, g.order_idx
    `).all(),
    env.DB.prepare(
      'SELECT gift_id, quantity FROM gift_reservations WHERE invitation_id = ?'
    ).bind(inv.id).all(),
    env.DB.prepare(
      'SELECT DISTINCT gift_id FROM gift_reservations WHERE invitation_id != ?'
    ).bind(inv.id).all(),
    env.DB.prepare(`
      SELECT gr.gift_id AS id, g.name, g.price, gr.quantity, t.name AS trip_name
      FROM gift_reservations gr
      JOIN gifts g ON gr.gift_id = g.id
      LEFT JOIN trips t ON g.trip_id = t.id
      WHERE gr.invitation_id = ? AND gr.confirmed_payment = 1
    `).bind(inv.id).all(),
  ])

  // Same shape whether this came from the cart flow (client-side, right
  // after reserving) or from this GET on reload/MP redirect — both need
  // tripName so the confirmation can show which destino each gift belongs to.
  const purchasedGifts = (confirmedRows.results || []).map(r => ({
    id: r.id, name: r.name, price: r.price, quantity: r.quantity, tripName: r.trip_name || '',
  }))

  const myGiftIds = new Set((myReservations.results || []).map(r => r.gift_id))
  const otherGiftIds = new Set((otherReservations.results || []).map(r => r.gift_id))

  const tripMap = new Map()
  for (const row of rows.results) {
    if (!tripMap.has(row.trip_id)) {
      tripMap.set(row.trip_id, {
        id: row.trip_id,
        name: row.trip_name,
        imageUrl: row.trip_image || '',
        order: row.trip_order,
        gifts: [],
      })
    }
    const status = myGiftIds.has(row.gift_id) ? 'reserved-by-you'
      : otherGiftIds.has(row.gift_id) ? 'reserved'
      : 'available'
    tripMap.get(row.trip_id).gifts.push({
      id: row.gift_id,
      name: row.gift_name,
      price: row.price,
      description: row.description || '',
      imageUrl: row.gift_image || '',
      status,
    })
  }

  return json({
    trips: Array.from(tripMap.values()).sort((a, b) => a.order - b.order),
    purchased: purchasedGifts.length > 0,
    purchasedGifts,
  })
}
