import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestPut({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    if (!body?.id) return err('ID requerido.')

    await env.DB.prepare(
      'UPDATE invitations SET invitation_sent = ? WHERE id = ?'
    ).bind(body.invitation_sent ? 1 : 0, body.id).run()

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
