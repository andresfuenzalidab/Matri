import { err } from '../_auth.js'
import { driveConfigured, checkMediaKey, albumFile, notConfigured } from '../_drive.js'
import {
  FILE_FIELDS, metaFromFile, categoryOf, readAlbumConfig, votingOpen, votesLimit, votePayload, keyParam,
  cookieVoterId, validVoterId, voterCookie, missingVotesTable,
} from '../_media.js'

// POST /api/media/vote { voterId, fileId, remove? }
//
// Each voter has a limited number of votes per category (photo / video) — the
// admin sets it, default 3 — on different files: a file can't be voted twice by
// the same person, and past the limit a vote has to be withdrawn first
// (`remove: true`) before voting another.
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

    const limit = votesLimit(cfg)
    if (body.remove) {
      await env.DB.prepare('DELETE FROM media_votes WHERE voter_id = ? AND file_id = ?').bind(voterId, f.id).run()
    } else {
      const already = await env.DB.prepare('SELECT 1 AS x FROM media_votes WHERE voter_id = ? AND file_id = ?').bind(voterId, f.id).first()
      if (!already) {
        // The limit check and the insert are one statement, so two quick taps
        // can't both slip past it.
        const ins = await env.DB.prepare(`
          INSERT INTO media_votes (voter_id, file_id, category)
          SELECT ?1, ?2, ?3 WHERE (SELECT COUNT(*) FROM media_votes WHERE voter_id = ?1 AND category = ?3) < ?4
        `).bind(voterId, f.id, category, limit).run()
        if (!ins.meta?.changes) {
          return err(`Ya usaste tus ${limit} votos de ${category === 'video' ? 'videos' : 'fotos'}. Quita uno para votar otro.`, 409)
        }
      }
      await env.DB.prepare('INSERT INTO media_files (file_id, meta) VALUES (?, ?) ON CONFLICT(file_id) DO UPDATE SET meta = excluded.meta')
        .bind(f.id, JSON.stringify(metaFromFile(f))).run()
    }

    const payload = await votePayload(env, voterId, keyParam(env, request), limit)
    return new Response(JSON.stringify({ open: true, voterId, ...payload }), {
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': voterCookie(voterId) },
    })
  } catch (e) {
    if (missingVotesTable(e)) return err('Faltan las tablas de votos (ejecuta migration12.sql).', 500)
    return err('No se pudo registrar el voto.', 500)
  }
}
