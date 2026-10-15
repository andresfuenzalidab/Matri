import { driveFetch, driveConfigured, checkMediaKey, albumFile, notConfigured } from '../_drive.js'

// GET /api/media/thumb?id=...&w=480 → small preview image, proxied from Drive
// (Drive's own thumbnail links expire within hours and aren't public).
export async function onRequestGet({ request, env }) {
  const denied = checkMediaKey(request, env)
  if (denied) return denied
  if (!driveConfigured(env)) return notConfigured()

  const url = new URL(request.url)
  const width = Math.min(1600, Math.max(100, parseInt(url.searchParams.get('w'), 10) || 480))
  const f = await albumFile(env, url.searchParams.get('id'))
  if (!f?.thumbnailLink) return new Response('Not found', { status: 404 })

  const link = f.thumbnailLink.replace(/=s\d+$/, `=s${width}`)
  const res = await driveFetch(env, link)
  if (!res.ok) return new Response('Not found', { status: 404 })
  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'private, max-age=86400',
    },
  })
}
