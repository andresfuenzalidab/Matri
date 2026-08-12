import { DEFAULT_ICON, TIMELINE_ICON_KEYS } from '../components/TimelineIcons.jsx'

/** Shown until an admin saves their own programme. */
export const DEFAULT_TIMELINE_ITEMS = [
  { icon: 'champagne', time: '17:00', title: 'Recepción de invitados', note: 'Nos encontramos y nos abrazamos' },
  { icon: 'rings', time: '18:00', title: 'Ceremonia', note: 'Dos «yo» se entrelazan en un «para siempre»' },
  { icon: 'dinner', time: '19:30', title: 'Banquete', note: 'Brindis, comida y buena compañía' },
  { icon: 'dance', time: '22:00', title: 'Fiesta', note: 'La pista se abre y no se cierra' },
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
    }))
    .filter(it => it.title || it.time)
}
