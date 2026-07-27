import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestDelete({ request, env }) {
  try {
    await requireAdmin(request, env)
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return err('Missing id')
    await env.DB.prepare('DELETE FROM rsvp_responses WHERE invitation_id = ?').bind(Number(id)).run()
    return json({ ok: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
