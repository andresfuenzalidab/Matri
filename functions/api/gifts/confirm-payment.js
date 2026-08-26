import { requireInvitation, json, err, handleAuthError } from '../_auth.js'
import { sendEmail } from '../_email.js'

export async function onRequestPost({ request, env }) {
  try {
    const inv = await requireInvitation(request, env)

    // Read the pending (card-payment) reservations before flipping them, so
    // the confirmation emails below know what was actually just paid for —
    // `gifts/reserve.js` (bank transfer) sends these same two emails right
    // at reservation time, but the MercadoPago flow only ever reserves as
    // pending (see `gifts/checkout.js`) and this endpoint is the only place
    // that later learns the payment went through, so it's the one place
    // that can send them for a card payment.
    const pending = (await env.DB.prepare(
      `SELECT gr.quantity, gr.guest_name, gr.congratulations_message, g.name, g.price
       FROM gift_reservations gr JOIN gifts g ON g.id = gr.gift_id
       WHERE gr.invitation_id = ? AND gr.confirmed_payment = 0`
    ).bind(inv.id).all()).results || []

    await env.DB.prepare(
      'UPDATE gift_reservations SET confirmed_payment = 1 WHERE invitation_id = ? AND confirmed_payment = 0'
    ).bind(inv.id).run()

    if (pending.length > 0) {
      const emailFrom = (await env.DB.prepare("SELECT value FROM site_content WHERE key = 'email_from'").first())?.value
      const emailTo = (await env.DB.prepare("SELECT value FROM site_content WHERE key = 'email_to'").first())?.value

      if (emailFrom) {
        const guestName = pending[0].guest_name || inv.name
        const congratulationsMessage = pending.find(p => p.congratulations_message)?.congratulations_message || ''
        const giftList = pending.map(p => `${p.name}${p.quantity > 1 ? ` ×${p.quantity}` : ''}`).join(', ')
        const totalAmount = pending.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 1), 0)
        const totalFmt = `$${Number(totalAmount).toLocaleString('es-CL')} CLP`

        const guestEmail = (await env.DB.prepare("SELECT email FROM rsvp_responses WHERE invitation_id = ?").bind(inv.id).first())?.email
        if (guestEmail) {
          await sendEmail(env, {
            from: emailFrom,
            to: guestEmail,
            subject: 'Gracias por tu regalo — Matrimonio Cata & Andrés',
            html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <h2 style="color:#8B7355">¡Muchas gracias, ${guestName}! ♡</h2>
              <p>Hemos recibido tu pago y registrado tu regalo:</p>
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
            subject: `Regalo (pago confirmado): ${guestName} — ${giftList}`,
            html: `<div style="font-family:sans-serif">
              <p><strong>${guestName}</strong> pagó con tarjeta: ${giftList}</p>
              ${totalAmount > 0 ? `<p>Total: ${totalFmt}</p>` : ''}
              ${congratulationsMessage ? `<p>Mensaje: "${congratulationsMessage}"</p>` : ''}
            </div>`,
          })
        }
      }
    }

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
