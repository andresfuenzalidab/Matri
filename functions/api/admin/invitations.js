import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const rows = await env.DB.prepare(`
      SELECT
        i.id, i.token, i.name, i.email, i.is_admin, i.created_at,
        r.attending, r.num_guests
      FROM invitations i
      LEFT JOIN rsvp_responses r ON i.id = r.invitation_id
      ORDER BY i.created_at DESC
    `).all()
    return json(rows.results)
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    if (!body?.name?.trim()) return err('El nombre es requerido.')

    const token = crypto.randomUUID()
    const { name, email = '', isAdmin = false } = body

    const result = await env.DB.prepare(
      'INSERT INTO invitations (token, name, email, is_admin) VALUES (?, ?, ?, ?) RETURNING *'
    ).bind(token, name.trim(), email.trim() || null, isAdmin ? 1 : 0).first()

    return json(result, 201)
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

    // Cascade delete dependent records
    await env.DB.prepare('DELETE FROM gift_reservations WHERE invitation_id = ?').bind(id).run()
    await env.DB.prepare('DELETE FROM rsvp_responses WHERE invitation_id = ?').bind(id).run()
    await env.DB.prepare('DELETE FROM invitations WHERE id = ?').bind(id).run()

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
