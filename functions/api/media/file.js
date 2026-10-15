import { driveFetch, driveConfigured, checkMediaKey, albumFile, notConfigured } from '../_drive.js'

// GET /api/media/file?id=...[&download=1] → the original, streamed from Drive.
// Range requests are passed through so videos play and seek (iOS Safari
// refuses to play video without them — same reason as /api/images).
export async function onRequestGet({ request, env }) {
  const denied = checkMediaKey(request, env)
  if (denied) return denied
  if (!driveConfigured(env)) return notConfigured()

  const url = new URL(request.url)
  const f = await albumFile(env, url.searchParams.get('id'))
  if (!f) return new Response('Not found', { status: 404 })

  const range = request.headers.get('Range')
  const res = await driveFetch(env, `/files/${f.id}?alt=media&supportsAllDrives=true`, range ? { headers: { Range: range } } : {})
  if (!res.ok) return new Response('Not found', { status: res.status === 416 ? 416 : 404 })

  const headers = new Headers({
    'Content-Type': f.mimeType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=86400',
  })
  for (const h of ['Content-Length', 'Content-Range']) {
    const v = res.headers.get(h)
    if (v) headers.set(h, v)
  }
  if (url.searchParams.get('download')) {
    const safe = (f.name || 'archivo').replace(/[^\w.\- ]+/g, '_')
    headers.set('Content-Disposition', `attachment; filename="${safe}"`)
  }
  return new Response(res.body, { status: res.status, headers })
}
