import { requireAdmin, json, err, handleAuthError } from '../_auth.js'
import { driveFetch, driveConfigured, albumFile, notConfigured } from '../_drive.js'
import { purgeVotes, missingVotesTable, votePayload, keyParam, readAlbumConfig, votesLimit } from '../_media.js'

const TRASH_BATCH = 20
const MAX_IDS_PER_CALL = 15 // each file costs two Drive calls; stay under the Worker's subrequest cap

// Who uploaded each file (private Drive metadata — guests never get this).
async function uploaderNames(env) {
  const names = {}
  if (!driveConfigured(env)) return names
  let pageToken = ''
  for (let page = 0; page < 5; page++) { // up to 5000 files
    const p = new URLSearchParams({
      q: `'${env.DRIVE_FOLDER_ID}' in parents and trashed = false`,
      pageSize: '1000', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true',
      fields: 'nextPageToken,files(id,appProperties)',
    })
    if (pageToken) p.set('pageToken', pageToken)
    const res = await driveFetch(env, `/files?${p}`)
    if (!res.ok) break
    const d = await res.json()
    for (const f of d.files || []) if (f.appProperties?.uploader) names[f.id] = f.appProperties.uploader
    pageToken = d.nextPageToken
    if (!pageToken) break
  }
  return names
}

// GET → vote count of every voted file, totals, the provisional ranking, and who
// uploaded each file (for the admin manager and the awards). Pass ?k= if MEDIA_KEY
// is set, so the thumbnails in the ranking carry it.
export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const uploaders = await uploaderNames(env).catch(() => ({}))
    try {
      const [rows, cfg] = await Promise.all([
        env.DB.prepare('SELECT file_id, COUNT(*) AS votes FROM media_votes GROUP BY file_id').all(),
        readAlbumConfig(env),
      ])
      const counts = {}
      for (const r of rows.results) counts[r.file_id] = r.votes
      const { ranking, totals } = await votePayload(env, null, keyParam(env, request), votesLimit(cfg), true)
      return json({ counts, totals, ranking, uploaders })
    } catch (e) {
      if (missingVotesTable(e)) return json({ counts: {}, totals: { image: 0, video: 0 }, ranking: { image: [], video: [] }, uploaders, missing: true })
      throw e
    }
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

// POST { action: 'delete', ids: [...] }  → moves files to the Drive trash and drops their votes.
// POST { action: 'trash-batch' } → trashes up to 20 album files (call until remaining is false).
// POST { action: 'reset-votes', category?: 'image' | 'video' } → clears the ranking.
export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)

    if (body?.action === 'delete') {
      if (!driveConfigured(env)) return notConfigured()
      const ids = [...new Set(Array.isArray(body.ids) ? body.ids : [])].slice(0, MAX_IDS_PER_CALL)
      if (!ids.length) return err('No hay archivos para eliminar.')
      const deleted = [], failed = []
      for (const id of ids) {
        try {
          if (!(await albumFile(env, id, 'id'))) { failed.push(id); continue }
          const res = await driveFetch(env, `/files/${id}?supportsAllDrives=true`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trashed: true }),
          })
          ;(res.ok ? deleted : failed).push(id)
        } catch { failed.push(id) }
      }
      await purgeVotes(env, deleted).catch(() => {})
      return json({ deleted, failed })
    }

    // Contest reset, step 1: trash up to TRASH_BATCH files at a time. The page calls
    // this in a loop until `remaining` is false, so no single request gets too long.
    if (body?.action === 'trash-batch') {
      if (!driveConfigured(env)) return notConfigured()
      const p = new URLSearchParams({
        q: `'${env.DRIVE_FOLDER_ID}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`,
        pageSize: String(TRASH_BATCH), supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', fields: 'files(id)',
      })
      const list = await driveFetch(env, `/files?${p}`)
      if (!list.ok) return err('No se pudo leer el álbum.', 502)
      const ids = ((await list.json()).files || []).map(x => x.id)
      const results = await Promise.all(ids.map(id => driveFetch(env, `/files/${id}?supportsAllDrives=true`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }),
      }).then(r => (r.ok ? id : null)).catch(() => null)))
      const deleted = results.filter(Boolean)
      await purgeVotes(env, deleted).catch(() => {})
      return json({ deleted: deleted.length, remaining: ids.length === TRASH_BATCH && deleted.length > 0 })
    }

    if (body?.action === 'reset-votes') {
      const cat = body.category
      if (cat && cat !== 'image' && cat !== 'video') return err('Categoría inválida.')
      const stmts = cat
        ? [env.DB.prepare('DELETE FROM media_votes WHERE category = ?').bind(cat),
           env.DB.prepare('DELETE FROM media_files WHERE file_id NOT IN (SELECT file_id FROM media_votes)')]
        : [env.DB.prepare('DELETE FROM media_votes'), env.DB.prepare('DELETE FROM media_files')]
      await env.DB.batch(stmts)
      return json({ ok: true })
    }

    return err('Acción desconocida.')
  } catch (e) {
    if (missingVotesTable(e)) return err('Faltan las tablas de votos (ejecuta migration12.sql).', 500)
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
