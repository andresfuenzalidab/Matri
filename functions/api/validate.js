import { getInvitation, json } from './_auth.js'

export async function onRequestGet({ request, env }) {
  const inv = await getInvitation(request, env)

  if (!inv) {
    return json({ valid: false })
  }

  const [rsvpRow, reservationRows] = await Promise.all([
    env.DB.prepare(
      'SELECT attending, num_guests, message, dietary_restriction FROM rsvp_responses WHERE invitation_id = ?'
    ).bind(inv.id).first(),
    env.DB.prepare(
      'SELECT gift_id, quantity, confirmed_payment, congratulations_message FROM gift_reservations WHERE invitation_id = ?'
    ).bind(inv.id).all(),
  ])

  return json({
    valid: true,
    guest: {
      id: inv.id,
      name: inv.name,
      email: inv.email,
      phone: inv.phone || null,
      nickname: inv.nickname || null,
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
          dietaryRestriction: rsvpRow.dietary_restriction || null,
        }
      : null,
    giftReservations: (reservationRows.results || []).map(r => ({
      giftId: r.gift_id,
      quantity: r.quantity || 1,
      confirmedPayment: Boolean(r.confirmed_payment),
      congratulationsMessage: r.congratulations_message || null,
    })),
  })
}
