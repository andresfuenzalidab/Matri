import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const rows = await env.DB.prepare(`
      SELECT
        i.id, i.token, i.name, i.email, i.phone, i.nickname, i.is_admin, i.created_at,
        i.welcome_message, i.max_additional_guests, i.invitation_type, i.notes,
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
    const {
      name, email = '', phone = '', nickname = '',
      isAdmin = false, welcomeMessage = '',
      maxAdditionalGuests = null, invitationType = 'all_in', notes = ''
    } = body

    const result = await env.DB.prepare(
      'INSERT INTO invitations (token, name, email, phone, nickname, is_admin, welcome_message, max_additional_guests, invitation_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
    ).bind(
      token, name.trim(), email.trim() || null, phone.trim() || null, nickname.trim() || null,
      isAdmin ? 1 : 0, welcomeMessage.trim() || null,
      maxAdditionalGuests ?? null, invitationType, notes.trim() || null
    ).first()

    return json(result, 201)
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
      'UPDATE invitations SET welcome_message = ?, max_additional_guests = ?, invitation_type = ?, notes = ?, phone = ?, nickname = ? WHERE id = ?'
    ).bind(
      body.welcomeMessage?.trim() || null,
      body.maxAdditionalGuests ?? null,
      body.invitationType || 'all_in',
      body.notes?.trim() || null,
      body.phone?.trim() || null,
      body.nickname?.trim() || null,
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

    await env.DB.prepare('DELETE FROM gift_reservations WHERE invitation_id = ?').bind(id).run()
    await env.DB.prepare('DELETE FROM rsvp_responses WHERE invitation_id = ?').bind(id).run()
    await env.DB.prepare('DELETE FROM invitations WHERE id = ?').bind(id).run()

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
