import { DEFAULT_ICON, TIMELINE_ICON_KEYS } from '../components/TimelineIcons.jsx'

/** Shown until an admin saves their own programme. `showForPartyOnly`:
 *  party-only guests are invited starting from the reception/party, not
 *  the ceremony — only items marked true show for them; a full-day guest
 *  always sees every item regardless of this flag. */
export const DEFAULT_TIMELINE_ITEMS = [
  { icon: 'champagne', time: '17:00', title: 'Recepción de invitados', note: 'Nos encontramos y nos abrazamos', showForPartyOnly: false },
  { icon: 'rings', time: '18:00', title: 'Ceremonia', note: 'Dos «yo» se entrelazan en un «para siempre»', showForPartyOnly: false },
  { icon: 'dinner', time: '19:30', title: 'Banquete', note: 'Brindis, comida y buena compañía', showForPartyOnly: false },
  { icon: 'dance', time: '22:00', title: 'Fiesta', note: 'La pista se abre y no se cierra', showForPartyOnly: true },
]

export function parseTimelineItems(raw) {
  let parsed
  try { parsed = JSON.parse(raw || '[]') } catch { return [] }
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter(it => it && typeof it === 'object')
    .map(it => ({
      icon: TIMELINE_ICON_KEYS.includes(it.icon) ? it.icon : DEFAULT_ICON,
      time: String(it.time ?? '').trim(),
      title: String(it.title ?? '').trim(),
      note: String(it.note ?? '').trim(),
      // Absent on anything saved before this existed — defaults to false
      // (hidden for party-only) so existing programmes don't suddenly
      // start showing ceremony-only items to party-only guests until an
      // admin actually opts specific items in.
      showForPartyOnly: it.showForPartyOnly === true,
    }))
    .filter(it => it.title || it.time)
}
