import { requireInvitation, json, err, handleAuthError } from './_auth.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireInvitation(request, env)
    const rows = await env.DB.prepare(
      'SELECT * FROM venue_photos ORDER BY order_idx ASC'
    ).all()
    return json(rows.results)
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
