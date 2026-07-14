import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const rows = await env.DB.prepare('SELECT * FROM story_sections ORDER BY order_idx ASC').all()
    return json(rows.results)
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    if (!body?.title?.trim()) return err('Título requerido.')

    const maxRow = await env.DB.prepare('SELECT MAX(order_idx) AS max FROM story_sections').first()
    const order = (maxRow?.max ?? -1) + 1

    const row = await env.DB.prepare(
      'INSERT INTO story_sections (title, content, date_label, image_url, order_idx) VALUES (?, ?, ?, ?, ?) RETURNING *'
    ).bind(body.title.trim(), body.content || '', body.date_label || null, body.image_url || '', order).first()

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
      'UPDATE story_sections SET title = ?, content = ?, date_label = ?, image_url = ?, order_idx = ? WHERE id = ?'
    ).bind(
      body.title ?? '', body.content ?? '', body.date_label ?? null,
      body.image_url ?? '', body.order_idx ?? 0, body.id
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
    await env.DB.prepare('DELETE FROM story_sections WHERE id = ?').bind(id).run()
    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
