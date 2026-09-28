/**
 * Free-form tags on an invitation ("colegio", "cata", "familia Fuenzalida"…).
 * An invitation can carry any number of them; they're stored as a JSON
 * array in `invitations.tags` and used to filter both the invitation lists
 * and the seating plan. Shared by the Pages Functions (validation on write)
 * and the admin UI, hence no DOM/React in here.
 */

export const MAX_TAGS = 30
export const MAX_TAG_LEN = 40

/** Accent/case-insensitive identity: "Colegio" and "colegio" are the same tag. */
export const tagKey = t => String(t).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Accepts an array, a JSON-array string (what the DB holds) or a
 * comma/semicolon separated string (what a spreadsheet cell holds) and
 * returns a clean list: trimmed, de-duplicated (first spelling wins), capped.
 */
export function normalizeTags(input) {
  let list = input
  if (typeof input === 'string') {
    const t = input.trim()
    if (t.startsWith('[')) {
      try { list = JSON.parse(t) } catch { list = t.split(/[,;]/) }
    } else {
      list = t.split(/[,;]/)
    }
  }
  if (!Array.isArray(list)) return []
  const seen = new Set()
  const out = []
  for (const raw of list) {
    const t = String(raw ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_TAG_LEN)
    if (!t) continue
    const k = tagKey(t)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
    if (out.length >= MAX_TAGS) break
  }
  return out
}

/** What goes in the DB column: a JSON array string, or NULL when empty. */
export function serializeTags(input) {
  const tags = normalizeTags(input)
  return tags.length ? JSON.stringify(tags) : null
}

/** Every distinct tag across a list of `{ tags }` items, alphabetical. */
export function collectTags(items) {
  const seen = new Map()
  for (const item of items || []) {
    for (const t of normalizeTags(item?.tags)) if (!seen.has(tagKey(t))) seen.set(tagKey(t), t)
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'es'))
}

/**
 * Does an item's tag list satisfy the selected filter tags? `mode` 'all'
 * (default) needs every selected tag; 'any' needs at least one. No selected
 * tags means no filtering.
 */
export function matchesTags(itemTags, selected, mode = 'all') {
  if (!selected || !selected.length) return true
  const have = new Set(normalizeTags(itemTags).map(tagKey))
  const want = selected.map(tagKey)
  return mode === 'any' ? want.some(k => have.has(k)) : want.every(k => have.has(k))
}
