import { requireAdmin, json, err, handleAuthError } from '../_auth.js'
import { totalInvitedHeadcount } from '../../../src/utils/inviteCount.js'

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env)

    const [responsesResult, invitationsResult] = await Promise.all([
      env.DB.prepare(`
        SELECT r.*, i.name AS guest_name, i.email
        FROM rsvp_responses r
        JOIN invitations i ON r.invitation_id = i.id
        ORDER BY r.submitted_at DESC
      `).all(),
      env.DB.prepare('SELECT max_additional_guests, companion_name FROM invitations').all(),
    ])

    const responses = responsesResult.results
    const attending = responses.filter(r => r.attending).length
    const declined = responses.filter(r => !r.attending).length
    const totalGuests = responses
      .filter(r => r.attending)
      .reduce((sum, r) => sum + (r.num_guests || 1), 0)

    return json({
      responses,
      summary: {
        // Rows, kept separate from the people-count below — "Sin respuesta"
        // is `totalInvitations - attending - declined`, all three in the
        // same (row) unit. Mixing that with a headcount would be wrong.
        totalInvitations: invitationsResult.results?.length ?? 0,
        // People invited, companions included — what "Invitados" now shows.
        totalPeople: totalInvitedHeadcount(invitationsResult.results || []),
        attending,
        declined,
        totalGuests,
      },
    })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}

// Manual override of a guest's answer — for a last-minute cancellation, or an
// answer that never got registered. `attending` true/false creates or updates
// the response (no emails are sent); `null` clears it back to "sin respuesta".
export async function onRequestPut({ request, env }) {
  try {
    await requireAdmin(request, env)
    const b = await request.json().catch(() => null)
    if (!b?.invitation_id) return err('Invitación requerida.')

    const inv = await env.DB.prepare('SELECT id FROM invitations WHERE id = ?').bind(b.invitation_id).first()
    if (!inv) return err('Invitación no encontrada.', 404)

    if (b.attending === null) {
      await env.DB.prepare('DELETE FROM rsvp_responses WHERE invitation_id = ?').bind(inv.id).run()
      return json({ success: true })
    }
    if (typeof b.attending !== 'boolean') return err('Indica si asiste o no.')

    const text = v => String(v ?? '').trim().slice(0, 1000)
    // A decline is for the whole party, so guest count only matters when attending.
    const guests = b.attending ? Math.max(1, Math.min(20, Math.floor(Number(b.num_guests)) || 1)) : 1
    const existing = await env.DB.prepare('SELECT id FROM rsvp_responses WHERE invitation_id = ?').bind(inv.id).first()

    if (existing) {
      await env.DB.prepare(
        'UPDATE rsvp_responses SET attending = ?, num_guests = ?, companion_name = ?, dietary_restriction = ?, message = ? WHERE id = ?'
      ).bind(b.attending ? 1 : 0, guests, text(b.companion_name), text(b.dietary_restriction), text(b.message), existing.id).run()
    } else {
      await env.DB.prepare(
        'INSERT INTO rsvp_responses (invitation_id, attending, num_guests, companion_name, dietary_restriction, message) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(inv.id, b.attending ? 1 : 0, guests, text(b.companion_name), text(b.dietary_restriction), text(b.message)).run()
    }
    return json({ success: true })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
