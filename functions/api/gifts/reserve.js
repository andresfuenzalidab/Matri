import { requireInvitation, json, err, handleAuthError } from '../_auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const inv = await requireInvitation(request, env)

    const body = await request.json().catch(() => null)
    if (!body?.gifts || !Array.isArray(body.gifts) || body.gifts.length === 0) {
      return err('Datos inválidos.')
    }

    const { gifts, guestName, confirmedPayment = 0, congratulationsMessage = '' } = body

    for (const item of gifts) {
      if (!item.id) return err('Datos inválidos.')

      const giftRow = await env.DB.prepare(
        'SELECT id FROM gifts WHERE id = ? AND active = 1'
      ).bind(item.id).first()

      if (!giftRow) return err(`El regalo "${item.id}" no está disponible.`, 404)

      const alreadyByMe = await env.DB.prepare(
        'SELECT id FROM gift_reservations WHERE gift_id = ? AND invitation_id = ?'
      ).bind(item.id, inv.id).first()

      if (alreadyByMe) continue

      await env.DB.prepare(
        'INSERT INTO gift_reservations (gift_id, invitation_id, guest_name, quantity, confirmed_payment, congratulations_message) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        item.id, inv.id, guestName || inv.name,
        Math.max(1, Number(item.quantity) || 1),
        confirmedPayment ? 1 : 0,
        congratulationsMessage || ''
      ).run()
    }

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
