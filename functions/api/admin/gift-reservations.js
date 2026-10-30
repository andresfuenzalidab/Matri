import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

// Manual control over gift records, for when a payment didn't register or a
// guest's gift has to be added/corrected by hand. Unlike /api/admin/invitations
// (confirmed gifts only), this lists EVERY reservation, confirmed or not.

const qty = v => Math.max(1, Math.min(99, Math.floor(Number(v)) || 1))

const SELECT = `
  SELECT gr.id, gr.gift_id, gr.invitation_id, gr.guest_name, gr.quantity,
         gr.confirmed_payment, gr.congratulations_message, gr.reserved_at,
         g.name AS gift_name, g.price AS gift_price,
         i.name AS invitation_name
  FROM gift_reservations gr
  LEFT JOIN gifts g ON g.id = gr.gift_id
  LEFT JOIN invitations i ON i.id = gr.invitation_id
`

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const rows = await env.DB.prepare(`${SELECT} WHERE g.active = 1 ORDER BY gr.reserved_at DESC`).all()
    return json(rows.results)
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)
    const b = await request.json().catch(() => null)
    if (!b?.invitation_id || !b?.gift_id) return err('Elige un invitado y un regalo.')

    const [inv, gift] = await Promise.all([
      env.DB.prepare('SELECT id, name FROM invitations WHERE id = ?').bind(b.invitation_id).first(),
      env.DB.prepare('SELECT id FROM gifts WHERE id = ? AND active = 1').bind(b.gift_id).first(),
    ])
    if (!inv) return err('Invitado no encontrado.', 404)
    if (!gift) return err('Regalo no encontrado.', 404)

    const created = await env.DB.prepare(
      'INSERT INTO gift_reservations (gift_id, invitation_id, guest_name, quantity, confirmed_payment, congratulations_message) VALUES (?, ?, ?, ?, ?, ?) RETURNING id'
    ).bind(
      gift.id, inv.id, (b.guest_name || '').trim() || inv.name, qty(b.quantity),
      b.confirmed_payment ? 1 : 0, (b.congratulations_message || '').trim()
    ).first()
    return json({ id: created.id }, 201)
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPut({ request, env }) {
  try {
    await requireAdmin(request, env)
    const b = await request.json().catch(() => null)
    if (!b?.id) return err('ID requerido.')

    const cur = await env.DB.prepare('SELECT * FROM gift_reservations WHERE id = ?').bind(b.id).first()
    if (!cur) return err('Registro no encontrado.', 404)

    if (b.gift_id && b.gift_id !== cur.gift_id) {
      const gift = await env.DB.prepare('SELECT id FROM gifts WHERE id = ? AND active = 1').bind(b.gift_id).first()
      if (!gift) return err('Regalo no encontrado.', 404)
    }

    await env.DB.prepare(
      'UPDATE gift_reservations SET gift_id = ?, quantity = ?, confirmed_payment = ?, congratulations_message = ?, guest_name = ? WHERE id = ?'
    ).bind(
      b.gift_id || cur.gift_id,
      b.quantity != null ? qty(b.quantity) : cur.quantity,
      b.confirmed_payment != null ? (b.confirmed_payment ? 1 : 0) : cur.confirmed_payment,
      b.congratulations_message != null ? String(b.congratulations_message).trim() : cur.congratulations_message,
      b.guest_name != null ? String(b.guest_name).trim() : cur.guest_name,
      cur.id
    ).run()
    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    await requireAdmin(request, env)
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return err('ID requerido.')
    await env.DB.prepare('DELETE FROM gift_reservations WHERE id = ?').bind(id).run()
    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
