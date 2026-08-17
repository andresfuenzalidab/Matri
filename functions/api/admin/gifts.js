import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)

    const [trips, gifts] = await Promise.all([
      env.DB.prepare('SELECT * FROM trips ORDER BY order_idx ASC').all(),
      env.DB.prepare(`
      SELECT
        g.id, g.trip_id, g.name, g.price, g.description, g.image_url, g.order_idx,
        COUNT(gr.id) AS reservation_count,
        COALESCE(SUM(gr.quantity), 0) AS total_quantity,
        COUNT(CASE WHEN gr.confirmed_payment = 1 THEN 1 END) AS confirmed_count,
        COALESCE(SUM(CASE WHEN gr.confirmed_payment = 1 THEN gr.quantity ELSE 0 END), 0) AS confirmed_quantity,
        GROUP_CONCAT(NULLIF(gr.congratulations_message, ''), ' | ') AS messages
      FROM gifts g
      LEFT JOIN gift_reservations gr ON g.id = gr.gift_id
      WHERE g.active = 1
      GROUP BY g.id
      ORDER BY g.order_idx ASC
    `).all(),
    ])

    const tripList = trips.results.map(t => ({
      ...t,
      gifts: gifts.results.filter(g => g.trip_id === t.id),
    }))

    const allGifts = gifts.results
    const reserved = allGifts.filter(g => g.confirmed_count > 0).length
    const totalReceived = allGifts.reduce(
      (sum, g) => sum + (g.confirmed_count > 0 ? (g.price || 0) * g.confirmed_quantity : 0), 0
    )
    const summary = { total: allGifts.length, reserved, available: allGifts.length - reserved, totalReceived }

    return json({ trips: tripList, summary })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    if (!body?.name?.trim()) return err('Nombre requerido.')
    if (!body?.trip_id) return err('Destino requerido.')

    const id = crypto.randomUUID()
    const maxRow = await env.DB.prepare(
      'SELECT MAX(order_idx) AS max FROM gifts WHERE trip_id = ?'
    ).bind(body.trip_id).first()
    const order = (maxRow?.max ?? -1) + 1

    await env.DB.prepare(
      'INSERT INTO gifts (id, trip_id, name, price, description, image_url, order_idx, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
    ).bind(
      id, body.trip_id, body.name.trim(),
      body.price != null && body.price !== '' ? Number(body.price) : null,
      body.description?.trim() || null,
      body.image_url?.trim() || null,
      order
    ).run()

    const row = await env.DB.prepare('SELECT * FROM gifts WHERE id = ?').bind(id).first()
    return json(row, 201)
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPut({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    if (!body?.id) return err('ID requerido.')

    await env.DB.prepare(
      'UPDATE gifts SET name = ?, price = ?, description = ?, image_url = ?, trip_id = ?, order_idx = ? WHERE id = ?'
    ).bind(
      body.name?.trim() ?? '',
      body.price != null && body.price !== '' ? Number(body.price) : null,
      body.description?.trim() || null,
      body.image_url?.trim() || null,
      body.trip_id ?? null,
      body.order_idx ?? 0,
      body.id
    ).run()

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    await requireAdmin(request, env)
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return err('ID requerido.')

    // Remove reservation first (cascade), then soft-delete the gift
    await env.DB.prepare('DELETE FROM gift_reservations WHERE gift_id = ?').bind(id).run()
    await env.DB.prepare('UPDATE gifts SET active = 0 WHERE id = ?').bind(id).run()
    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
