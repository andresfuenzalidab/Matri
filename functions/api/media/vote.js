import { err } from '../_auth.js'
import { driveConfigured, checkMediaKey, albumFile, notConfigured } from '../_drive.js'
import {
  FILE_FIELDS, metaFromFile, categoryOf, readAlbumConfig, votingOpen, votePayload, keyParam,
  cookieVoterId, validVoterId, voterCookie, missingVotesTable,
} from '../_media.js'

// POST /api/media/vote { voterId, fileId, remove? }
//
// One vote per voter and category (photo / video). Voting again in a category
// moves that vote — it never adds a second one; `remove: true` withdraws it.
// A voter is a random id kept both in a cookie (this endpoint sets it, and it
// wins if present) and in the browser's localStorage (sent in the body), so
// clearing just one of them doesn't buy a second vote.
export async function onRequestPost({ request, env }) {
  const denied = checkMediaKey(request, env)
  if (denied) return denied
  if (!driveConfigured(env)) return notConfigured()

  try {
    const body = await request.json().catch(() => null)
    const voterId = cookieVoterId(request) || (validVoterId(body?.voterId) ? body.voterId : null)
    if (!voterId) return err('No se pudo identificar tu navegador.', 400)
    const fileId = body?.fileId

    const cfg = await readAlbumConfig(env)
    if (!votingOpen(cfg)) return err('Las votaciones están cerradas.', 403)

    // Only real, live album files can be voted for; the snapshot stored
    // below comes from Drive itself, never from the request.
    const f = await albumFile(env, fileId, FILE_FIELDS)
    if (!f) return err('Archivo no encontrado.', 404)
    const category = categoryOf(f.mimeType)

    if (body.remove) {
      await env.DB.prepare('DELETE FROM media_votes WHERE voter_id = ? AND category = ? AND file_id = ?').bind(voterId, category, f.id).run()
    } else {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO media_files (file_id, meta) VALUES (?, ?) ON CONFLICT(file_id) DO UPDATE SET meta = excluded.meta')
          .bind(f.id, JSON.stringify(metaFromFile(f))),
        env.DB.prepare(`
          INSERT INTO media_votes (voter_id, category, file_id) VALUES (?, ?, ?)
          ON CONFLICT(voter_id, category) DO UPDATE SET file_id = excluded.file_id, created_at = CURRENT_TIMESTAMP
        `).bind(voterId, category, f.id),
      ])
    }

    const payload = await votePayload(env, voterId, keyParam(env, request))
    return new Response(JSON.stringify({ open: true, voterId, ...payload }), {
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': voterCookie(voterId) },
    })
  } catch (e) {
    if (missingVotesTable(e)) return err('Faltan las tablas de votos (ejecuta migration12.sql).', 500)
    return err('No se pudo registrar el voto.', 500)
  }
}
