/**
 * How many people a single invitation actually represents, before anyone
 * has RSVPed — the "Invitados" stats used to just count invitation rows,
 * so a couple sharing one invitation counted as one person.
 *
 * `max_additional_guests` is authoritative whenever it's set (even 0, i.e.
 * "coming alone"); a named companion with no explicit cap implies exactly
 * one more person, matching the "isCouple" rule the RSVP form itself uses
 * (see RSVP.jsx). No cap and no named companion means just the one person.
 */
export function invitedHeadcount(inv) {
  const cap = inv.max_additional_guests
  if (cap != null) return 1 + Number(cap)
  if (inv.companion_name) return 2
  return 1
}

export function totalInvitedHeadcount(invitations) {
  return invitations.reduce((sum, inv) => sum + invitedHeadcount(inv), 0)
}
