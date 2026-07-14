import { requireInvitation, json, err, handleAuthError } from '../_auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const inv = await requireInvitation(request, env)

    const existing = await env.DB.prepare(
      'SELECT id FROM gift_reservations WHERE invitation_id = ?'
    ).bind(inv.id).first()

    if (existing) {
      return err('Ya reservaste un regalo. Solo se permite uno por invitado.', 409)
    }

    const body = await request.json().catch(() => null)
    if (!body?.giftId) return err('Datos inválidos.')

    const { giftId, guestName, confirmedPayment = 0, congratulationsMessage = '' } = body

    const giftRow = await env.DB.prepare(
      'SELECT id FROM gifts WHERE id = ? AND active = 1'
    ).bind(giftId).first()

    if (!giftRow) return err('Este regalo no está disponible.', 404)

    const alreadyTaken = await env.DB.prepare(
      'SELECT id FROM gift_reservations WHERE gift_id = ?'
    ).bind(giftId).first()

    if (alreadyTaken) {
      return err('Este regalo ya fue reservado por otra persona.', 409)
    }

    await env.DB.prepare(
      'INSERT INTO gift_reservations (gift_id, invitation_id, guest_name, confirmed_payment, congratulations_message) VALUES (?, ?, ?, ?, ?)'
    ).bind(giftId, inv.id, guestName || inv.name, confirmedPayment ? 1 : 0, congratulationsMessage || '').run()

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
