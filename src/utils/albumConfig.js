// Texts and switches of the guest album, editable from Admin → Álbum.
// Stored as plain keys in `site_content` (prefix `album_`). Shared by the API
// (which merges these defaults) and the admin form / guest page.

export const ALBUM_DEFAULTS = {
  album_eyebrow: 'Andrés & Catalina · 6 de noviembre de 2026',
  album_title: 'Atrapa el Momento',
  album_subtitle: 'Escanea el QR y comparte tus fotos y videos',
  album_note: '¡La mejor foto y el mejor video ganan un premio!',
  album_prize_photo: '',
  album_prize_video: '',
  album_voting_open: '1',
}

export const ALBUM_KEYS = Object.keys(ALBUM_DEFAULTS)
export const ALBUM_MAX_LEN = 300

export function withAlbumDefaults(stored = {}) {
  const out = {}
  for (const k of ALBUM_KEYS) out[k] = stored[k] != null ? String(stored[k]) : ALBUM_DEFAULTS[k]
  return out
}
