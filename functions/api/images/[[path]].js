/**
 * Serves R2 objects — mainly the videos admins upload to replace the bundled
 * defaults. It used to always return the whole file with no `Accept-Ranges`
 * and no support for a `Range` request. Chrome tolerates that for `<video>`
 * (it just can't seek, but plays fine from the start); iOS Safari does not —
 * its media pipeline expects range support, and without it a clip can sit
 * stuck "loading" indefinitely, especially with `preload="auto"` on a
 * multi-MB file. That is invisible from a desktop browser's device-toolbar
 * "iPhone" view, since that is still Chrome's own network/media stack under
 * a resized viewport, not real iOS Safari.
 */
export async function onRequestGet({ request, params, env }) {
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path
  if (!key) return new Response('Not found', { status: 404 })

  const head = await env.PHOTOS.head(key)
  if (!head) return new Response('Not found', { status: 404 })

  const contentType = head.httpMetadata?.contentType || 'application/octet-stream'
  const size = head.size
  const baseHeaders = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  }

  const rangeHeader = request.headers.get('range')
  if (!rangeHeader) {
    const obj = await env.PHOTOS.get(key)
    return new Response(obj.body, {
      headers: { ...baseHeaders, 'Content-Length': String(size) },
    })
  }

  // The only form browsers send for media: "bytes=start-end", either bound
  // open-ended ("bytes=500-"), or as a suffix ("bytes=-500", last N bytes).
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)
  if (!match || (!match[1] && !match[2])) {
    return new Response('Invalid Range', { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
  }

  let start = match[1] ? parseInt(match[1], 10) : undefined
  let end = match[2] ? parseInt(match[2], 10) : undefined
  if (start === undefined) {
    start = Math.max(0, size - end)
    end = size - 1
  } else if (end === undefined || end >= size) {
    end = size - 1
  }

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    return new Response('Range Not Satisfiable', { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
  }

  const length = end - start + 1
  const obj = await env.PHOTOS.get(key, { range: { offset: start, length } })
  if (!obj) return new Response('Not found', { status: 404 })

  return new Response(obj.body, {
    status: 206,
    headers: {
      ...baseHeaders,
      'Content-Length': String(length),
      'Content-Range': `bytes ${start}-${end}/${size}`,
    },
  })
}
