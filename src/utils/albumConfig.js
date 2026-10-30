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
  // How many different photos (and, separately, videos) each guest can vote for.
  album_votes_limit: '3',
}

export const ALBUM_KEYS = Object.keys(ALBUM_DEFAULTS)
export const ALBUM_MAX_LEN = 300
export const ALBUM_DETAIL_MAX_LEN = 1200
export const VOTES_LIMIT_MAX = 10
export const albumMaxLen = key => (key.endsWith('_detail') ? ALBUM_DETAIL_MAX_LEN : ALBUM_MAX_LEN)

/** Votes each guest may cast per category, clamped to 1..VOTES_LIMIT_MAX. */
export function votesLimit(cfg) {
  const n = Math.floor(Number(cfg?.album_votes_limit))
  return Number.isFinite(n) ? Math.min(VOTES_LIMIT_MAX, Math.max(1, n)) : 3
}

export function withAlbumDefaults(stored = {}) {
  const out = {}
  for (const k of ALBUM_KEYS) out[k] = stored[k] != null ? String(stored[k]) : ALBUM_DEFAULTS[k]
  return out
}
