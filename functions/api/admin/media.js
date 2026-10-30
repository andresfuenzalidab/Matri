import { requireAdmin, json, err, handleAuthError } from '../_auth.js'
import { driveFetch, driveConfigured, albumFile, notConfigured } from '../_drive.js'
import { purgeVotes, missingVotesTable } from '../_media.js'

const MAX_IDS_PER_CALL = 15 // each file costs two Drive calls; stay under the Worker's subrequest cap

// GET → vote count of every voted file, plus totals (for the admin manager).
export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const [rows, voters] = await Promise.all([
      env.DB.prepare('SELECT file_id, COUNT(*) AS votes FROM media_votes GROUP BY file_id').all(),
      env.DB.prepare('SELECT category, COUNT(*) AS n FROM media_votes GROUP BY category').all(),
    ])
    const counts = {}
    for (const r of rows.results) counts[r.file_id] = r.votes
    const totals = { image: 0, video: 0 }
    for (const r of voters.results) totals[r.category] = r.n
    return json({ counts, totals })
  } catch (e) {
    if (missingVotesTable(e)) return json({ counts: {}, totals: { image: 0, video: 0 }, missing: true })
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

// POST { action: 'delete', ids: [...] }  → moves files to the Drive trash and drops their votes.
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
