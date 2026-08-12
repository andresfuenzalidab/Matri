/**
 * How we address a guest across the site.
 *
 * An invitation can name a companion up front (`companion_name` on the
 * invitation row). When it does, every personalised line — welcome message,
 * RSVP, gift thanks — talks to both of them, so the wording has to switch to
 * plural too.
 */

export function guestDisplayName(guest) {
  if (!guest) return ''
  const base = (guest.nickname || guest.name || '').trim()
  const companion = (guest.companionName || '').trim()
  if (!companion) return base
  if (!base) return companion
  return `${base} y ${companion}`
}

/** True when the invitation already names a companion → address both. */
export function isPairInvite(guest) {
  return Boolean((guest?.companionName || '').trim())
}

/** Picks singular/plural copy for an invitation. */
export function pick(guest, singular, plural) {
  return isPairInvite(guest) ? plural : singular
}
