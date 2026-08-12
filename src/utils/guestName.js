/**
 * How we address a guest across the site.
 *
 * Two independent fields on the invitation:
 *
 * - `nickname` is a *global* informal label, written to already cover everyone
 *   on the invitation ("Andrés y Cata", "Los Fuenzalida"). When it is set it is
 *   used verbatim — never combined with the companion's name.
 * - `name` + `companion_name` are the formal names. When a companion is named,
 *   the two formal names are joined with "y".
 *
 * `companion_name` is also the signal that the invitation covers two people,
 * so it drives the singular/plural wording regardless of the nickname.
 */

/** Formal name(s): "Andrés Fuenzalida y Catalina Pérez". */
export function guestFormalName(guest) {
  if (!guest) return ''
  const base = (guest.name || '').trim()
  const companion = (guest.companionName || '').trim()
  if (!companion) return base
  if (!base) return companion
  return `${base} y ${companion}`
}

/** How we speak to them: the nickname as written, else the formal name(s). */
export function guestDisplayName(guest) {
  if (!guest) return ''
  const nickname = (guest.nickname || '').trim()
  if (nickname) return nickname
  return guestFormalName(guest)
}

/** True when the invitation names a companion → address both. */
export function isPairInvite(guest) {
  return Boolean((guest?.companionName || '').trim())
}

/** Picks singular/plural copy for an invitation. */
export function pick(guest, singular, plural) {
  return isPairInvite(guest) ? plural : singular
}
