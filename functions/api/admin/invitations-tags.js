import { requireAdmin, json, err, handleAuthError } from '../_auth.js'
import { serializeTags } from '../../../src/utils/tags.js'

/**
 * Bulk tag edit: `{ updates: [{ id, tags: [...] }] }` replaces the tag list
 * of each listed invitation (the client works out add/remove itself). Its own
 * endpoint because PUT /admin/invitations rewrites every editable column —
 * sending it just an id + tags would blank the rest.
 */
export async function onRequestPut({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    const updates = Array.isArray(body?.updates) ? body.updates : null
    if (!updates?.length) return err('Se esperaba una lista de cambios.')
    if (updates.length > 500) return err('Demasiados cambios a la vez.')

    const stmts = updates
      .filter(u => u && u.id != null && Array.isArray(u.tags))
      .map(u => env.DB.prepare('UPDATE invitations SET tags = ? WHERE id = ?').bind(serializeTags(u.tags), u.id))
    if (!stmts.length) return err('Nada que actualizar.')

    await env.DB.batch(stmts)
    return json({ success: true, updated: stmts.length })
  } catch (e) {
    if (/no such column|no column named/i.test(String(e?.message || ''))) {
      return err('Falta la columna tags (ejecuta migration11.sql).', 500)
    }
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
