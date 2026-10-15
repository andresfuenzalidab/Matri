/**
 * Google Drive access for the guest photo/video album.
 *
 * Auth is an OAuth refresh token of the account that owns the folder (files
 * uploaded by guests then count against that account's storage — a service
 * account can't, it has no Drive quota). Secrets, set in Cloudflare:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
 *   DRIVE_FOLDER_ID, and optionally MEDIA_KEY (see `checkMediaKey`).
 * See MEDIA_SETUP.md.
 *
 * Every file the album serves is first checked to live inside DRIVE_FOLDER_ID,
 * so the endpoints can never be used to read anything else in the account.
 */
import { err } from './_auth.js'

const DRIVE = 'https://www.googleapis.com/drive/v3'

let cached = { token: null, exp: 0 }

export function driveConfigured(env) {
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN && env.DRIVE_FOLDER_ID)
}

export async function accessToken(env) {
  if (cached.token && Date.now() < cached.exp - 60_000) return cached.token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) throw new Error('No se pudo autenticar con Google Drive.')
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 }
  return cached.token
}

export async function driveFetch(env, path, init = {}) {
  const token = await accessToken(env)
  const headers = { ...(init.headers || {}), Authorization: `Bearer ${token}` }
  return fetch(path.startsWith('http') ? path : `${DRIVE}${path}`, { ...init, headers })
}

/**
 * Optional shared secret in the QR link (`/fotos?k=...`). When MEDIA_KEY is set,
 * every media request must carry it, so only people who scanned the QR (or got
 * the link) can browse or upload. Returns an error Response, or null if fine.
 */
export function checkMediaKey(request, env) {
  if (!env.MEDIA_KEY) return null
  const url = new URL(request.url)
  const sent = url.searchParams.get('k') || request.headers.get('X-Media-Key') || ''
  if (sent.length === env.MEDIA_KEY.length && timingSafeEqual(sent, env.MEDIA_KEY)) return null
  return err('Enlace no válido.', 403)
}

function timingSafeEqual(a, b) {
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Metadata of a file, or null unless it is a live media file inside the album folder. */
export async function albumFile(env, id, fields = 'id,name,mimeType,size,thumbnailLink') {
  if (!/^[\w-]{10,}$/.test(id || '')) return null
  const res = await driveFetch(env, `/files/${id}?supportsAllDrives=true&fields=${encodeURIComponent(fields + ',parents,trashed')}`)
  if (!res.ok) return null
  const f = await res.json()
  if (f.trashed || !f.parents?.includes(env.DRIVE_FOLDER_ID)) return null
  if (!/^(image|video)\//.test(f.mimeType || '')) return null
  return f
}

export function notConfigured() {
  return err('El álbum aún no está configurado (faltan las claves de Google Drive).', 503)
}
