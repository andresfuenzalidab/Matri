/**
 * Shared bits of the guest album: how a Drive file becomes an album item, the
 * stored album settings, and the voting tallies. See media.js / media/*.js.
 */
import { withAlbumDefaults, ALBUM_KEYS, votesLimit } from '../../src/utils/albumConfig.js'

export const FILE_FIELDS = 'id,name,mimeType,size,createdTime,imageMediaMetadata(width,height,rotation),videoMediaMetadata(width,height,durationMillis)'

export const categoryOf = mime => (String(mime).startsWith('video/') ? 'video' : 'image')

/** The part of a Drive file we keep: enough to draw a tile, nothing private. */
export function metaFromFile(f) {
  const m = f.imageMediaMetadata || f.videoMediaMetadata || {}
  // EXIF orientations 5-8 are the sideways ones: stored width/height are swapped.
  const sideways = [5, 6, 7, 8].includes(f.imageMediaMetadata?.rotation)
  return {
    id: f.id,
    name: f.name,
    type: categoryOf(f.mimeType),
    mimeType: f.mimeType,
    size: Number(f.size) || 0,
    createdAt: f.createdTime,
    width: (sideways ? m.height : m.width) || null,
    height: (sideways ? m.width : m.height) || null,
    duration: f.videoMediaMetadata?.durationMillis ? Number(f.videoMediaMetadata.durationMillis) : null,
  }
}

/** `&k=...` to carry the album key onto media URLs (img/video tags can't send headers). */
export function keyParam(env, request) {
  if (!env.MEDIA_KEY) return ''
  return `&k=${encodeURIComponent(new URL(request.url).searchParams.get('k') || '')}`
}

export function buildItem(meta, k = '') {
  return {
    ...meta,
    thumb: `/api/media/thumb?id=${meta.id}${k}`,
    src: `/api/media/file?id=${meta.id}${k}`,
    download: `/api/media/file?id=${meta.id}&download=1${k}`,
  }
}

export async function readAlbumConfig(env) {
  const marks = ALBUM_KEYS.map(() => '?').join(',')
  const rows = await env.DB.prepare(`SELECT key, value FROM site_content WHERE key IN (${marks})`).bind(...ALBUM_KEYS).all()
  const stored = {}
  for (const r of rows.results) stored[r.key] = r.value
  return withAlbumDefaults(stored)
}

export const votingOpen = cfg => cfg.album_voting_open !== '0'
export { votesLimit }

const TOP = 10
const VOTER_RE = /^[\w-]{16,64}$/

export const validVoterId = id => typeof id === 'string' && VOTER_RE.test(id)

export function cookieVoterId(request) {
  const m = /(?:^|;\s*)mv=([\w-]{16,64})/.exec(request.headers.get('Cookie') || '')
  return m ? m[1] : null
}

export const voterCookie = id => `mv=${id}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`

/** Live ranking per category, this voter's own picks (a list per category), and overall totals. */
export async function votePayload(env, voterId, k = '', limit = 3) {
  const rank = async category => {
    const rows = await env.DB.prepare(`
      SELECT v.file_id, COUNT(*) AS votes, f.meta
      FROM media_votes v JOIN media_files f ON f.file_id = v.file_id
      WHERE v.category = ?
      GROUP BY v.file_id
      ORDER BY votes DESC, MIN(v.created_at) ASC
      LIMIT ${TOP}
    `).bind(category).all()
    return rows.results.flatMap(r => {
      try { return [{ ...buildItem(JSON.parse(r.meta), k), votes: r.votes }] } catch { return [] }
    })
  }
  const [image, video, mineRows, totalRows] = await Promise.all([
    rank('image'),
    rank('video'),
    voterId ? env.DB.prepare('SELECT category, file_id FROM media_votes WHERE voter_id = ?').bind(voterId).all() : { results: [] },
    env.DB.prepare('SELECT category, COUNT(*) AS n FROM media_votes GROUP BY category').all(),
  ])
  const mine = { image: [], video: [] }
  for (const r of mineRows.results) mine[r.category].push(r.file_id)
  const totals = { image: 0, video: 0 }
  for (const r of totalRows.results) totals[r.category] = r.n
  return { ranking: { image, video }, mine, totals, limit }
}

/** Removes votes (and the cached snapshot) for deleted files. */
export async function purgeVotes(env, ids) {
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    const marks = chunk.map(() => '?').join(',')
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM media_votes WHERE file_id IN (${marks})`).bind(...chunk),
      env.DB.prepare(`DELETE FROM media_files WHERE file_id IN (${marks})`).bind(...chunk),
    ])
  }
}

export const missingVotesTable = e => /no such table/i.test(String(e?.message || ''))
