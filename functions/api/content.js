import { requireInvitation, json, err, handleAuthError } from './_auth.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireInvitation(request, env)
    const rows = await env.DB.prepare('SELECT key, value FROM site_content').all()
    const content = {}
    for (const row of rows.results) {
      content[row.key] = row.value
    }
    return json(content)
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
