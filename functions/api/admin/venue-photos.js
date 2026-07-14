import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const rows = await env.DB.prepare('SELECT * FROM venue_photos ORDER BY order_idx ASC').all()
    return json(rows.results)
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    if (!body?.image_url?.trim()) return err('URL de imagen requerida.')

    const maxRow = await env.DB.prepare('SELECT MAX(order_idx) AS max FROM venue_photos').first()
    const order = (maxRow?.max ?? -1) + 1

    const row = await env.DB.prepare(
      'INSERT INTO venue_photos (image_url, caption, order_idx) VALUES (?, ?, ?) RETURNING *'
    ).bind(body.image_url.trim(), body.caption || null, order).first()

    return json(row, 201)
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
    await env.DB.prepare('DELETE FROM venue_photos WHERE id = ?').bind(id).run()
    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
