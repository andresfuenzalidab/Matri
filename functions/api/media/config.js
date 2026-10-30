import { requireAdmin, json, err, handleAuthError } from '../_auth.js'
import { checkMediaKey } from '../_drive.js'
import { readAlbumConfig } from '../_media.js'
import { ALBUM_KEYS, albumMaxLen, votesLimit } from '../../../src/utils/albumConfig.js'

const flag = v => (v === '0' || v === false ? '0' : '1')

// GET /api/media/config → the album's texts and switches (guests, key-checked).
export async function onRequestGet({ request, env }) {
  // An admin (invite token) reads it without the album key; guests need the key.
  const isAdmin = request.headers.get('X-Invite-Token') ? await requireAdmin(request, env).then(() => true, () => false) : false
  const denied = isAdmin ? null : checkMediaKey(request, env)
  if (denied) return denied
  try {
    return json(await readAlbumConfig(env))
  } catch {
    return err('No se pudo leer la configuración.', 500)
  }
}

// PUT /api/media/config { values: { album_title: '...', ... } } → admin only.
export async function onRequestPut({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    const values = body?.values
    if (!values || typeof values !== 'object') return err('Datos inválidos.')

    const stmts = []
    for (const key of ALBUM_KEYS) {
      if (!(key in values)) continue
      let v
      if (key === 'album_voting_open') v = flag(values[key])
      else if (key === 'album_reveal_names') v = values[key] === '1' || values[key] === true ? '1' : '0'
      else if (key === 'album_votes_max') v = String(votesLimit({ album_votes_max: values[key] }))
      else if (key === 'album_voting_deadline') {
        const t = Date.parse(String(values[key] || ''))
        v = String(values[key] || '').trim() === '' ? '' : Number.isFinite(t) ? new Date(t).toISOString() : null
        if (v === null) return err('La fecha de cierre no es válida.')
      } else v = String(values[key] ?? '').trim().slice(0, albumMaxLen(key))
      stmts.push(env.DB.prepare(
        'INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP'
      ).bind(key, v))
    }
    if (stmts.length) await env.DB.batch(stmts)
    return json(await readAlbumConfig(env))
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
