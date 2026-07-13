import { requireInvitation, json, err, handleAuthError } from './_auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const inv = await requireInvitation(request, env)

    const existing = await env.DB.prepare(
      'SELECT id FROM rsvp_responses WHERE invitation_id = ?'
    ).bind(inv.id).first()

    if (existing) {
      return err('Ya confirmaste tu asistencia. No es posible modificarla.', 409)
    }

    const body = await request.json().catch(() => null)
    if (!body || body.attending === undefined) {
      return err('Datos inválidos.')
    }

    const { attending, numGuests = 1, message = '' } = body

    await env.DB.prepare(
      'INSERT INTO rsvp_responses (invitation_id, attending, num_guests, message) VALUES (?, ?, ?, ?)'
    ).bind(inv.id, attending ? 1 : 0, Number(numGuests) || 1, message || '').run()

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
