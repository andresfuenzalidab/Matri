import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)

    const formData = await request.formData().catch(() => null)
    if (!formData) return err('Datos de formulario inválidos.')

    const file = formData.get('file')
    if (!file || typeof file === 'string') return err('No se encontró ningún archivo.')

    const ext = file.name?.split('.').pop()?.toLowerCase() || 'bin'
    const key = `${crypto.randomUUID()}.${ext}`

    await env.PHOTOS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    })

    return json({ key, url: `/api/images/${key}` }, 201)
  } catch (e) {
    return handleAuthError(e) || err('Error al subir el archivo.', 500)
  }
}
