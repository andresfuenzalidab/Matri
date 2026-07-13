import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)

    const rows = await env.DB.prepare(`
      SELECT
        g.id AS gift_id,
        g.name AS gift_name,
        g.price,
        t.name AS trip_name,
        gr.id AS reservation_id,
        gr.confirmed_payment,
        gr.reserved_at,
        i.name AS guest_name
      FROM gifts g
      JOIN trips t ON g.trip_id = t.id
      LEFT JOIN gift_reservations gr ON g.id = gr.gift_id
      LEFT JOIN invitations i ON gr.invitation_id = i.id
      WHERE g.active = 1
      ORDER BY t.order_idx, g.order_idx
    `).all()

    const gifts = rows.results
    const reserved = gifts.filter(g => g.reservation_id).length
    const available = gifts.filter(g => !g.reservation_id).length

    return json({
      gifts,
      summary: { total: gifts.length, reserved, available },
    })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
