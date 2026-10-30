import { json, err } from '../_auth.js'
import { checkMediaKey } from '../_drive.js'
import { readAlbumConfig, votingOpen, votesLimit, votePayload, keyParam, cookieVoterId, validVoterId, missingVotesTable } from '../_media.js'

// GET /api/media/votes?voter=<id>  → live ranking (top 10 photos and videos),
// this voter's own picks, totals, the per-category vote limit, and whether voting is still open.
// Polled by every open album page, so it stays to a handful of tiny D1 reads.
export async function onRequestGet({ request, env }) {
  const denied = checkMediaKey(request, env)
  if (denied) return denied
  try {
    const url = new URL(request.url)
    const queryId = url.searchParams.get('voter')
    const voterId = cookieVoterId(request) || (validVoterId(queryId) ? queryId : null)
    const cfg = await readAlbumConfig(env)
    const payload = await votePayload(env, voterId, keyParam(env, request), votesLimit(cfg))
    return json({ open: votingOpen(cfg), ...payload })
  } catch (e) {
    if (missingVotesTable(e)) return err('Faltan las tablas de votos (ejecuta migration12.sql).', 500)
    return err('No se pudo leer el ranking.', 500)
  }
}
