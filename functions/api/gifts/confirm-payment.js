import { requireInvitation, json, err, handleAuthError } from '../_auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const inv = await requireInvitation(request, env)
    await env.DB.prepare(
      'UPDATE gift_reservations SET confirmed_payment = 1 WHERE invitation_id = ? AND confirmed_payment = 0'
    ).bind(inv.id).run()
    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
