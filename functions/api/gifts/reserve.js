import { requireInvitation, json, err, handleAuthError } from '../_auth.js'
import { sendEmail } from '../_email.js'

export async function onRequestPost({ request, env }) {
  try {
    const inv = await requireInvitation(request, env)

    const body = await request.json().catch(() => null)
    if (!body?.gifts || !Array.isArray(body.gifts) || body.gifts.length === 0) {
      return err('Datos inválidos.')
    }

    // Demo token (see `_auth.js`) — the tour's bank-transfer "confirm" path
    // ends here; let it look reserved without writing a row or emailing
    // anyone. (The card/MercadoPago path is simulated entirely client-side
    // instead — see GiftModal.jsx — so it never reaches this endpoint or
    // `gifts/checkout.js` at all.)
    if (inv.isDemo) return json({ success: true })

    const { gifts, guestName, confirmedPayment = 0, congratulationsMessage = '' } = body

    const reservedNames = []
    let totalAmount = 0

    for (const item of gifts) {
      if (!item.id) return err('Datos inválidos.')

      const giftRow = await env.DB.prepare(
        'SELECT id, name, price FROM gifts WHERE id = ? AND active = 1'
      ).bind(item.id).first()

      if (!giftRow) return err(`El regalo "${item.id}" no está disponible.`, 404)

      const alreadyByMe = await env.DB.prepare(
        'SELECT id FROM gift_reservations WHERE gift_id = ? AND invitation_id = ?'
      ).bind(item.id, inv.id).first()

      if (alreadyByMe) continue

      const qty = Math.max(1, Number(item.quantity) || 1)
      reservedNames.push(`${giftRow.name}${qty > 1 ? ` ×${qty}` : ''}`)
      totalAmount += (giftRow.price || 0) * qty

      await env.DB.prepare(
        'INSERT INTO gift_reservations (gift_id, invitation_id, guest_name, quantity, confirmed_payment, congratulations_message) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        item.id, inv.id, guestName || inv.name,
        qty,
        confirmedPayment ? 1 : 0,
        congratulationsMessage || ''
      ).run()
    }

    // Send confirmation emails
    const emailFrom = (await env.DB.prepare("SELECT value FROM site_content WHERE key = 'email_from'").first())?.value
    const emailTo = (await env.DB.prepare("SELECT value FROM site_content WHERE key = 'email_to'").first())?.value

    if (emailFrom && reservedNames.length > 0) {
      const guestEmail = (await env.DB.prepare("SELECT email FROM rsvp_responses WHERE invitation_id = ?").bind(inv.id).first())?.email
      const giftList = reservedNames.join(', ')
      const totalFmt = `$${Number(totalAmount).toLocaleString('es-CL')} CLP`

      if (guestEmail) {
        await sendEmail(env, {
          from: emailFrom,
          to: guestEmail,
          subject: 'Gracias por tu regalo — Matrimonio Cata & Andrés',
          html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#8B7355">¡Muchas gracias, ${guestName || inv.name}! ♡</h2>
            <p>Hemos registrado tu regalo:</p>
            <p style="font-weight:600">${giftList}</p>
            ${totalAmount > 0 ? `<p>Total: ${totalFmt}</p>` : ''}
            <p style="margin-top:1.5rem;font-size:0.9rem;opacity:0.7">Con mucho amor,</p>
            <p style="font-size:0.9rem;opacity:0.7">Cata & Andrés</p>
          </div>`,
        })
      }
      if (emailTo) {
        await sendEmail(env, {
          from: emailFrom,
          to: emailTo,
          subject: `Regalo: ${guestName || inv.name} — ${giftList}`,
          html: `<div style="font-family:sans-serif">
            <p><strong>${guestName || inv.name}</strong> reservó: ${giftList}</p>
            ${totalAmount > 0 ? `<p>Total: ${totalFmt}</p>` : ''}
            ${congratulationsMessage ? `<p>Mensaje: "${congratulationsMessage}"</p>` : ''}
          </div>`,
        })
      }
    }

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
