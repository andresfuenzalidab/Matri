import { json, err } from '../_auth.js'
import { driveFetch, driveConfigured, checkMediaKey, notConfigured } from '../_drive.js'

const MAX_BYTES = 2 * 1024 ** 3 // 2 GB per file

// POST /api/media/upload-session  { name, mimeType, size, uploader }
// Opens a Drive *resumable upload* and hands the one-time session URL to the
// browser, which then PUTs the file straight to Google. The file never passes
// through this worker (so no body-size limit), and the browser never sees the
// owner's credentials. The session is pinned to the album folder and only
// accepts what was declared here (images/videos). `uploader` is required.
export async function onRequestPost({ request, env }) {
  const denied = checkMediaKey(request, env)
  if (denied) return denied
  if (!driveConfigured(env)) return notConfigured()

  const body = await request.json().catch(() => null)
  const mimeType = String(body?.mimeType || '')
  const size = Number(body?.size) || 0
  const name = String(body?.name || 'archivo').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').slice(0, 120)
  if (!/^(image|video)\//.test(mimeType)) return err('Solo se pueden subir fotos y videos.')
  if (size <= 0 || size > MAX_BYTES) return err('El archivo es demasiado grande (máximo 2 GB).', 413)

  // Who uploaded it: kept in the file's private Drive metadata for the awards,
  // never returned by the public album endpoints. appProperties are capped at
  // 124 bytes (key + value), so trim by bytes, not characters.
  let uploader = String(body?.uploader || '').replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
  while (new TextEncoder().encode(uploader).length > 100) uploader = uploader.slice(0, -1)
  if (uploader.length < 2) return err('Escribe tu nombre para subir tus archivos.')

  // Timestamp prefix keeps names unique and sorted in the Drive folder.
  const stamped = `${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}_${name}`

  const res = await driveFetch(env, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(size),
      // Lets the browser PUT to the session URL cross-origin (CORS).
      Origin: new URL(request.url).origin,
    },
    body: JSON.stringify({
      name: stamped, parents: [env.DRIVE_FOLDER_ID], mimeType,
      description: `Subido por: ${uploader}`, appProperties: { uploader },
    }),
  })
  const uploadUrl = res.headers.get('Location')
  if (!res.ok || !uploadUrl) return err('No se pudo iniciar la subida.', 502)
  return json({ uploadUrl })
}
