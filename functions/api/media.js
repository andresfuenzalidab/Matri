import { requireAdmin, json, err, handleAuthError } from './_auth.js'
import { driveFetch, driveConfigured, checkMediaKey, albumFile, notConfigured } from './_drive.js'
import { FILE_FIELDS, metaFromFile, buildItem, keyParam, purgeVotes } from './_media.js'

const PAGE_SIZE = 60

// GET /api/media?pageToken=...&k=...  → one page of the album, newest first.
export async function onRequestGet({ request, env }) {
  const denied = checkMediaKey(request, env)
  if (denied) return denied
  if (!driveConfigured(env)) return notConfigured()
  try {
    const url = new URL(request.url)
    const q = `'${env.DRIVE_FOLDER_ID}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`
    const params = new URLSearchParams({
      q,
      pageSize: String(PAGE_SIZE),
      orderBy: 'createdTime desc',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      fields: `nextPageToken,files(${FILE_FIELDS})`,
    })
    const pageToken = url.searchParams.get('pageToken')
    if (pageToken) params.set('pageToken', pageToken)

    const res = await driveFetch(env, `/files?${params}`)
    if (!res.ok) return err('No se pudo leer el álbum.', 502)
    const data = await res.json()

    const k = keyParam(env, request)
    const items = (data.files || []).map(f => buildItem(metaFromFile(f), k))
    return json({ items, nextPageToken: data.nextPageToken || null })
  } catch {
    return err('No se pudo leer el álbum.', 502)
  }
}

// DELETE /api/media?id=...  → admin only; moves the file to the Drive trash.
export async function onRequestDelete({ request, env }) {
  try {
    await requireAdmin(request, env)
    if (!driveConfigured(env)) return notConfigured()
    const id = new URL(request.url).searchParams.get('id')
    if (!(await albumFile(env, id, 'id'))) return err('Archivo no encontrado.', 404)
    const res = await driveFetch(env, `/files/${id}?supportsAllDrives=true`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trashed: true }),
    })
    if (!res.ok) return err('No se pudo eliminar.', 502)
    await purgeVotes(env, [id]).catch(() => {}) // votes table may not exist yet
    return json({ ok: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
