import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

// The whole plan is one small JSON document; this only guards against
// something absurd being written, not a real limit anyone should hit.
const MAX_LAYOUT_BYTES = 500_000

function missingTable(e) {
  return /no such table/i.test(String(e?.message || ''))
}

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const row = await env.DB.prepare('SELECT layout, updated_at FROM seating_plan WHERE id = 1').first()
    let layout = null
    if (row?.layout) {
      try { layout = JSON.parse(row.layout) } catch { layout = null }
    }
    return json({ layout, updatedAt: row?.updated_at || null })
  } catch (e) {
    if (missingTable(e)) return err('Falta crear la tabla seating_plan (ejecuta migration10.sql).', 500)
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPut({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    const layout = body?.layout
    if (!layout || typeof layout !== 'object' || !Array.isArray(layout.elements)) {
      return err('Plan inválido.')
    }
    const text = JSON.stringify(layout)
    if (text.length > MAX_LAYOUT_BYTES) return err('El plan es demasiado grande.', 413)

    await env.DB.prepare(`
      INSERT INTO seating_plan (id, layout, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET layout = excluded.layout, updated_at = CURRENT_TIMESTAMP
    `).bind(text).run()

    return json({ ok: true })
  } catch (e) {
    if (missingTable(e)) return err('Falta crear la tabla seating_plan (ejecuta migration10.sql).', 500)
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
