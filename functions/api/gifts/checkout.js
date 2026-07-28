import { requireInvitation, json, err, handleAuthError } from '../_auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const inv = await requireInvitation(request, env)

    const body = await request.json().catch(() => null)
    if (!body?.gifts || !Array.isArray(body.gifts) || body.gifts.length === 0) {
      return err('Datos inválidos.')
    }

    const accessToken = env.mp_access_token
    if (!accessToken) {
      const msg = inv.is_admin
        ? '[Admin] mp_access_token no está configurado en el Worker de Cloudflare.'
        : 'Pago con tarjeta no disponible.'
      return err(msg, 503)
    }

    const { gifts, guestName, congratulationsMessage = '' } = body

    // Fetch prices from DB to compute total server-side
    let total = 0
    const items = []
    for (const item of gifts) {
      if (!item.id) return err('Datos inválidos.')
      const giftRow = await env.DB.prepare(
        'SELECT id, name, price FROM gifts WHERE id = ? AND active = 1'
      ).bind(item.id).first()
      if (!giftRow) return err(`El regalo "${item.id}" no está disponible.`, 404)
      const qty = Math.max(1, Number(item.quantity) || 1)
      total += (giftRow.price || 0) * qty
      items.push({ giftRow, qty })
    }

    if (total <= 0) return err('El monto total debe ser mayor a cero.')

    const siteUrl = (await env.DB.prepare("SELECT value FROM content WHERE key = 'site_url'").first())?.value || ''
    const description = (await env.DB.prepare("SELECT value FROM content WHERE key = 'mp_description'").first())?.value || 'Regalo Matrimonio'
    const backUrl = siteUrl ? `${siteUrl}/#regalos` : '/#regalos'

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ title: description, quantity: 1, unit_price: total, currency_id: 'CLP' }],
        back_urls: { success: backUrl, failure: backUrl, pending: backUrl },
        auto_return: 'approved',
      }),
    })

    if (!mpRes.ok) {
      const mpErr = await mpRes.text()
      console.error('MercadoPago error:', mpErr)
      const msg = inv.is_admin
        ? `[Admin] MercadoPago HTTP ${mpRes.status}: ${mpErr}`
        : 'Error al crear el pago. Intenta con transferencia.'
      return err(msg, 502)
    }

    const { init_point } = await mpRes.json()

    // Reserve gifts as pending (confirmed_payment = 0)
    for (const { giftRow, qty } of items) {
      const alreadyByMe = await env.DB.prepare(
        'SELECT id FROM gift_reservations WHERE gift_id = ? AND invitation_id = ?'
      ).bind(giftRow.id, inv.id).first()
      if (alreadyByMe) continue

      await env.DB.prepare(
        'INSERT INTO gift_reservations (gift_id, invitation_id, guest_name, quantity, confirmed_payment, congratulations_message) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(giftRow.id, inv.id, guestName || inv.name, qty, 0, congratulationsMessage || '').run()
    }

    return json({ init_point })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
