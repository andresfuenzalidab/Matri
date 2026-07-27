import { getInvitation, json, err } from './_auth.js'

export async function onRequestGet({ request, env }) {
  const inv = await getInvitation(request, env)
  if (!inv) return err('Unauthorized', 401)

  const [rows, myReservations, otherReservations] = await Promise.all([
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
  ])

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

  return json(Array.from(tripMap.values()).sort((a, b) => a.order - b.order))
}
