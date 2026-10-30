// Texts and switches of the guest album, editable from Admin → Álbum.
// Stored as plain keys in `site_content` (prefix `album_`). Shared by the API
// (which merges these defaults) and the admin form / guest page.

export const ALBUM_DEFAULTS = {
  album_eyebrow: 'Andrés & Catalina · 6 de noviembre de 2026',
  album_title: 'Atrapa el Momento',
  album_subtitle: 'Escanea el QR y comparte tus fotos y videos',
  album_note: '¡La mejor foto y el mejor video ganan un premio!',
  album_prize_photo: '',
  album_prize_photo_detail: '',
  album_prize_video: '',
  album_prize_video_detail: '',
  album_voting_open: '1',
  // ISO date-time (UTC) when voting closes by itself; '' = no deadline.
  album_voting_deadline: '',
  // Votes each guest may cast per category (photos and, separately, videos). 0 = unlimited.
  album_votes_max: '0',
  // Show the winners' uploader names in the awards ceremony.
  album_reveal_names: '0',
}

export const ALBUM_KEYS = Object.keys(ALBUM_DEFAULTS)
export const ALBUM_MAX_LEN = 300
export const ALBUM_DETAIL_MAX_LEN = 1200
export const VOTES_MAX_LIMIT = 100
export const albumMaxLen = key => (key.endsWith('_detail') ? ALBUM_DETAIL_MAX_LEN : ALBUM_MAX_LEN)

export function withAlbumDefaults(stored = {}) {
  const out = {}
  for (const k of ALBUM_KEYS) out[k] = stored[k] != null ? String(stored[k]) : ALBUM_DEFAULTS[k]
  return out
}

/** Votes per category a guest may cast; 0 means unlimited. */
export function votesLimit(cfg) {
  const n = Math.floor(Number(cfg?.album_votes_max))
  return Number.isFinite(n) && n > 0 ? Math.min(VOTES_MAX_LIMIT, n) : 0
}

/** Milliseconds since epoch of the voting deadline, or null if none / invalid. */
export function deadlineMs(cfg) {
  const t = Date.parse(cfg?.album_voting_deadline || '')
  return Number.isFinite(t) ? t : null
}

/** Voting is open unless the admin closed it or the deadline has passed. */
export function isVotingOpen(cfg, now = Date.now()) {
  if (cfg?.album_voting_open === '0') return false
  const d = deadlineMs(cfg)
  return d == null || now < d
}
