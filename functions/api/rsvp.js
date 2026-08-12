import { requireInvitation, json, err, handleAuthError } from './_auth.js'
import { sendEmail } from './_email.js'

export async function onRequestPost({ request, env }) {
  try {
    const inv = await requireInvitation(request, env)

    const existing = await env.DB.prepare(
      'SELECT id FROM rsvp_responses WHERE invitation_id = ?'
    ).bind(inv.id).first()

    if (existing) {
      return err('Ya confirmaste tu asistencia. No es posible modificarla.', 409)
    }

    const body = await request.json().catch(() => null)
    if (!body || body.attending === undefined) {
      return err('Datos inválidos.')
    }

    const { attending, numGuests = 1, message = '', dietaryRestriction = '', companionName = '', email = '' } = body

    // The nickname is a global informal label already covering everyone on the
    // invitation, so it is used as-is. Otherwise fall back to the formal
    // name(s), joined with "y" when a companion is named up front.
    const namedCompanion = (inv.companion_name || '').trim()
    const formalName = namedCompanion ? `${inv.name} y ${namedCompanion}` : inv.name
    const greetName = (inv.nickname || '').trim() || formalName

    await env.DB.prepare(
      'INSERT INTO rsvp_responses (invitation_id, attending, num_guests, message, dietary_restriction, companion_name, email) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      inv.id, attending ? 1 : 0,
      Number(numGuests) || 1,
      message || '',
      dietaryRestriction || '',
      companionName || '',
      email || ''
    ).run()

    // Send confirmation emails (silently skip if not configured)
    const emailFrom = (await env.DB.prepare("SELECT value FROM site_content WHERE key = 'email_from'").first())?.value
    const emailTo = (await env.DB.prepare("SELECT value FROM site_content WHERE key = 'email_to'").first())?.value
    const venueName = (await env.DB.prepare("SELECT value FROM site_content WHERE key = 'venue_name'").first())?.value || 'el lugar'
    const ceremonyTime = (await env.DB.prepare("SELECT value FROM site_content WHERE key = 'ceremony_time'").first())?.value || '17:00'

    if (emailFrom) {
      if (email && attending) {
        await sendEmail(env, {
          from: emailFrom,
          to: email,
          subject: 'Confirmación de asistencia — Matrimonio Cata & Andrés',
          html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#8B7355">¡Hola ${greetName}!</h2>
            <p>Hemos recibido tu confirmación de asistencia a nuestro matrimonio. ♡</p>
            <p><strong>Fecha:</strong> Viernes 6 de noviembre de 2026</p>
            <p><strong>Hora de citación:</strong> ${ceremonyTime} hrs</p>
            <p><strong>Lugar:</strong> ${venueName}</p>
            <p style="margin-top:1.5rem;font-size:0.9rem;opacity:0.7">¡Nos vemos pronto!</p>
            <p style="font-size:0.9rem;opacity:0.7">Cata & Andrés</p>
          </div>`,
        })
      }
      if (emailTo) {
        await sendEmail(env, {
          from: emailFrom,
          to: emailTo,
          subject: `RSVP: ${formalName} — ${attending ? `Confirmó (${numGuests} personas)` : 'No puede asistir'}`,
          html: `<div style="font-family:sans-serif">
            <p><strong>${formalName}</strong> ${attending ? `confirmó asistencia (${numGuests} persona${numGuests > 1 ? 's' : ''})` : 'indicó que no puede asistir'}.</p>
            ${companionName ? `<p>Acompañante: ${companionName}</p>` : ''}
            ${dietaryRestriction ? `<p>Restricción alimenticia: ${dietaryRestriction}</p>` : ''}
            ${email ? `<p>Email: ${email}</p>` : ''}
            ${message ? `<p>Mensaje: "${message}"</p>` : ''}
          </div>`,
        })
      }
    }

    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
