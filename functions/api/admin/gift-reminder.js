import { requireAdmin, json, err, handleAuthError } from '../_auth.js'
import { sendEmail } from '../_email.js'

/** Everyone who left an email — at invite time or when RSVPing — and hasn't
 *  got a CONFIRMED gift reservation yet. Attending or not, per feedback:
 *  a "no" RSVP still leaves the gift list open, so it isn't filtered out. */
async function eligibleRecipients(env) {
  const [invRes, confirmedRes] = await Promise.all([
    env.DB.prepare(`
      SELECT i.id, i.name, i.email AS inv_email, r.email AS rsvp_email, r.attending
      FROM invitations i
      LEFT JOIN rsvp_responses r ON r.invitation_id = i.id
      WHERE i.is_admin = 0
    `).all(),
    env.DB.prepare(`SELECT DISTINCT invitation_id FROM gift_reservations WHERE confirmed_payment = 1`).all(),
  ])
  const confirmedIds = new Set((confirmedRes.results || []).map(r => r.invitation_id))
  return (invRes.results || [])
    .map(r => ({
      id: r.id,
      name: r.name,
      email: (r.rsvp_email || r.inv_email || '').trim(),
      attending: r.attending,
    }))
    .filter(r => r.email && !confirmedIds.has(r.id))
}

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)
    const recipients = await eligibleRecipients(env)
    return json({ recipients, count: recipients.length })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)

    const body = await request.json().catch(() => null)
    const subject = (body?.subject || '').trim()
    const message = (body?.message || '').trim()
    if (!subject || !message) return err('El asunto y el mensaje son obligatorios.')

    const emailFrom = (await env.DB.prepare("SELECT value FROM site_content WHERE key = 'email_from'").first())?.value
    if (!emailFrom) return err('Configura primero el correo remitente (email_from) en la pestaña Contenido.')

    const recipients = await eligibleRecipients(env)
    let sent = 0, failed = 0
    for (const r of recipients) {
      const paragraphs = message.split('\n').filter(p => p.trim())
        .map(p => `<p>${p.replace(/\{NOMBRE\}/gi, r.name)}</p>`).join('')
      const html = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        ${paragraphs}
        <p style="margin-top:1.5rem;font-size:0.9rem;opacity:0.7">Con cariño,</p>
        <p style="font-size:0.9rem;opacity:0.7">Cata & Andrés</p>
      </div>`
      const ok = await sendEmail(env, {
        from: emailFrom,
        to: r.email,
        subject: subject.replace(/\{NOMBRE\}/gi, r.name),
        html,
      })
      if (ok) sent++
      else failed++
    }

    return json({ sent, failed, total: recipients.length })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
