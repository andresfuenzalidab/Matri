import { getInvitation, json } from './_auth.js'

export async function onRequestGet({ request, env }) {
  const inv = await getInvitation(request, env)

  if (!inv) {
    return json({ valid: false })
  }

  const [rsvpRow, reservationRow] = await Promise.all([
    env.DB.prepare(
      'SELECT attending, num_guests, message FROM rsvp_responses WHERE invitation_id = ?'
    ).bind(inv.id).first(),
    env.DB.prepare(
      'SELECT gift_id, confirmed_payment, congratulations_message FROM gift_reservations WHERE invitation_id = ?'
    ).bind(inv.id).first(),
  ])

  return json({
    valid: true,
    guest: {
      id: inv.id,
      name: inv.name,
      email: inv.email,
      isAdmin: Boolean(inv.is_admin),
      welcomeMessage: inv.welcome_message || null,
      maxAdditionalGuests: inv.max_additional_guests ?? null,
      invitationType: inv.invitation_type || 'all_in',
    },
    rsvp: rsvpRow
      ? {
          attending: Boolean(rsvpRow.attending),
          numGuests: rsvpRow.num_guests,
          message: rsvpRow.message,
        }
      : null,
    giftReservation: reservationRow
      ? {
          giftId: reservationRow.gift_id,
          confirmedPayment: Boolean(reservationRow.confirmed_payment),
          congratulationsMessage: reservationRow.congratulations_message || null,
        }
      : null,
  })
}
