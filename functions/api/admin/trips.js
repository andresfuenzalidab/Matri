import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const rows = await env.DB.prepare(
      'SELECT * FROM trips ORDER BY order_idx ASC'
    ).all()
    return json(rows.results)
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    if (!body?.name?.trim()) return err('Nombre requerido.')

    const id = crypto.randomUUID()
    const maxRow = await env.DB.prepare('SELECT MAX(order_idx) AS max FROM trips').first()
    const order = (maxRow?.max ?? -1) + 1

    await env.DB.prepare(
      'INSERT INTO trips (id, name, description, image_url, order_idx) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, body.name.trim(), body.description?.trim() || null, body.image_url?.trim() || null, order).run()

    const row = await env.DB.prepare('SELECT * FROM trips WHERE id = ?').bind(id).first()
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
      'UPDATE trips SET name = ?, description = ?, image_url = ?, order_idx = ? WHERE id = ?'
    ).bind(
      body.name?.trim() ?? '',
      body.description?.trim() || null,
      body.image_url?.trim() || null,
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

    const hasGifts = await env.DB.prepare(
      'SELECT id FROM gifts WHERE trip_id = ? AND active = 1 LIMIT 1'
    ).bind(id).first()
    if (hasGifts) return err('No se puede eliminar un destino que tiene regalos activos.', 409)

    await env.DB.prepare('DELETE FROM trips WHERE id = ?').bind(id).run()
    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
