import { requireAdmin, json, err, handleAuthError } from '../_auth.js'
import { esPlanValido, fusionar } from '../../../src/utils/planner.js'

// One small JSON document, like the seating plan. This only guards against
// something absurd being written.
const MAX_PLAN_BYTES = 1_000_000

function missingTable(e) {
  return /no such table/i.test(String(e?.message || ''))
}

async function readPlan(env) {
  const row = await env.DB.prepare('SELECT plan FROM wedding_plan WHERE id = 1').first()
  if (!row?.plan) return null
  try { return JSON.parse(row.plan) } catch { return null }
}

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    return json({ plan: await readPlan(env) })
  } catch (e) {
    if (missingTable(e)) return err('Falta crear la tabla wedding_plan (ejecuta migration10.sql).', 500)
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

// The client sends its whole plan; it is merged with what is stored (tasks one
// by one, newest edit wins) so two people saving at once don't overwrite each
// other. The merged result is returned so the client can refresh.
export async function onRequestPut({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    const incoming = body?.plan
    if (!esPlanValido(incoming)) return err('Plan inválido.')
    if (JSON.stringify(incoming).length > MAX_PLAN_BYTES) return err('El plan es demasiado grande.', 413)

    const merged = fusionar(await readPlan(env), incoming)
    const text = JSON.stringify(merged)
    if (text.length > MAX_PLAN_BYTES) return err('El plan es demasiado grande.', 413)

    await env.DB.prepare(`
      INSERT INTO wedding_plan (id, plan, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET plan = excluded.plan, updated_at = CURRENT_TIMESTAMP
    `).bind(text).run()

    return json({ ok: true, plan: merged })
  } catch (e) {
    if (missingTable(e)) return err('Falta crear la tabla wedding_plan (ejecuta migration10.sql).', 500)
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
