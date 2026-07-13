import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

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
      env.DB.prepare('SELECT COUNT(*) AS total FROM invitations').first(),
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
        total: invitationsResult?.total ?? 0,
        attending,
        declined,
        totalGuests,
      },
    })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
