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
