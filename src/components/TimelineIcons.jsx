/**
 * Hand-drawn-feeling line icons for the timeline. Each entry in
 * `timeline_items` picks one of these by key, so the keys are part of the
 * saved content — rename with care.
 */

const box = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.15,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ICONS = {
  champagne: {
    label: 'Brindis / copas',
    paths: (
      <>
        <path d="M19 5h5v6c2.6 1.8 3.5 4.4 3.5 7.2V38a3.5 3.5 0 0 1-3.5 3.5h-4.5A3.5 3.5 0 0 1 16 38V18.2C16 15.4 16.9 12.8 19 11z" />
        <path d="M16 21h11.5" />
        <path d="M21.7 29.5c-1.9-1.4-2.9-2.4-2.9-3.6a1.6 1.6 0 0 1 2.9-.8 1.6 1.6 0 0 1 2.9.8c0 1.2-1 2.2-2.9 3.6z" />
        <path d="M32 14h9l-1.1 7.6a3.4 3.4 0 0 1-6.8 0z" />
        <path d="M36.5 25.5v11" />
        <path d="M32.5 37.5h8" />
      </>
    ),
  },
  rings: {
    label: 'Anillos / ceremonia',
    paths: (
      <>
        <circle cx="19" cy="29" r="9" />
        <circle cx="30" cy="29" r="9" />
        <path d="M25.8 14.5 30 8.5l4.2 6-4.2 5z" />
      </>
    ),
  },
  dinner: {
    label: 'Banquete / cena',
    paths: (
      <>
        <circle cx="24" cy="24" r="11" />
        <path d="M24 29.5c-3.2-2.4-5-4-5-5.9a2.6 2.6 0 0 1 5-1.2 2.6 2.6 0 0 1 5 1.2c0 1.9-1.8 3.5-5 5.9z" />
        <path d="M7 9v8a3 3 0 0 0 6 0V9" />
        <path d="M10 20v19" />
        <path d="M40 9c2 3.2 2 6.8 0 10v20" />
      </>
    ),
  },
  cake: {
    label: 'Torta',
    paths: (
      <>
        <path d="M9 41h30" />
        <path d="M11 41V29a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v12" />
        <path d="M16 27V19a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8" />
        <path d="M11 34h26" />
        <path d="M24 17v-4" />
        <path d="M24 8.5c1.6 1.7 2.2 2.8 2.2 3.8a2.2 2.2 0 0 1-4.4 0c0-1 .6-2.1 2.2-3.8z" />
      </>
    ),
  },
  dance: {
    label: 'Fiesta / baile',
    paths: (
      <>
        <circle cx="15" cy="35" r="4.2" />
        <path d="M19.2 35V13l14-3.2v5.4l-14 3.2" />
        <circle cx="29.2" cy="32" r="4.2" />
        <path d="M33.4 32V9.8" />
      </>
    ),
  },
  photo: {
    label: 'Fotos',
    paths: (
      <>
        <path d="M42 35.5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3h5.5l3-5h13l3 5H39a3 3 0 0 1 3 3z" />
        <circle cx="24" cy="26" r="7" />
      </>
    ),
  },
  car: {
    label: 'Traslado',
    paths: (
      <>
        <path d="M8 33v-6l4.2-9.5A3 3 0 0 1 15 15.7h18a3 3 0 0 1 2.8 1.8L40 27v6" />
        <path d="M11 27h26" />
        <circle cx="15" cy="33.5" r="3.2" />
        <circle cx="33" cy="33.5" r="3.2" />
      </>
    ),
  },
  heart: {
    label: 'Corazón',
    paths: <path d="M24 39C13.5 31.5 7.5 26.5 7.5 19.5A8.6 8.6 0 0 1 24 14.5 8.6 8.6 0 0 1 40.5 19.5C40.5 26.5 34.5 31.5 24 39z" />,
  },
  sunset: {
    label: 'Atardecer',
    paths: (
      <>
        <circle cx="24" cy="26" r="8" />
        <path d="M6 37h36" />
        <path d="M24 9v4M11.5 13.5l2.8 2.8M36.5 13.5l-2.8 2.8M6 26h4M38 26h4" />
      </>
    ),
  },
  fireworks: {
    label: 'Fuegos artificiales',
    paths: (
      <>
        <circle cx="24" cy="24" r="4" />
        <path d="M24 6v8M24 34v8M6 24h8M34 24h8M11 11l5.6 5.6M31.4 31.4 37 37M37 11l-5.6 5.6M11 37l5.6-5.6" />
      </>
    ),
  },
  coffee: {
    label: 'Café / desayuno',
    paths: (
      <>
        <path d="M10 17h24v11a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10z" />
        <path d="M34 20.5h3.5a5 5 0 0 1 0 10H34" />
        <path d="M17 8c0 2 2 2.4 2 4.5M25 6.5c0 2 2 2.4 2 4.5" />
      </>
    ),
  },
  church: {
    label: 'Iglesia',
    paths: (
      <>
        <path d="M24 5v8M20.5 8.5h7" />
        <path d="M11 41V22l13-8.5L37 22v19z" />
        <path d="M19.5 41V30.5a4.5 4.5 0 0 1 9 0V41" />
      </>
    ),
  },
  flower: {
    label: 'Flor / ramo',
    paths: (
      <>
        <circle cx="24" cy="16" r="3" />
        <ellipse cx="24" cy="8.5" rx="2.8" ry="4.6" />
        <ellipse cx="30.6" cy="13.4" rx="2.8" ry="4.6" transform="rotate(72 30.6 13.4)" />
        <ellipse cx="28.1" cy="21.3" rx="2.8" ry="4.6" transform="rotate(144 28.1 21.3)" />
        <ellipse cx="19.9" cy="21.3" rx="2.8" ry="4.6" transform="rotate(216 19.9 21.3)" />
        <ellipse cx="17.4" cy="13.4" rx="2.8" ry="4.6" transform="rotate(288 17.4 13.4)" />
        <path d="M24 24v18" />
        <path d="M24 32c-3.8 0-5.8-1.9-6.8-4.9 3.3 0 5.8 1.4 6.8 4.9z" />
        <path d="M24 37.5c3.8 0 5.8-1.9 6.8-4.9-3.3 0-5.8 1.4-6.8 4.9z" />
      </>
    ),
  },
  clock: {
    label: 'Hora / reloj',
    paths: (
      <>
        <circle cx="24" cy="24" r="16" />
        <path d="M24 13v11l7.5 5" />
      </>
    ),
  },
  gift: {
    label: 'Regalos',
    paths: (
      <>
        <rect x="8" y="19" width="32" height="20" rx="2" />
        <path d="M8 27h32M24 19v20" />
        <path d="M24 19c-4.5-8.5-13-6.5-9.5 0M24 19c4.5-8.5 13-6.5 9.5 0" />
      </>
    ),
  },
}

export const TIMELINE_ICON_KEYS = Object.keys(ICONS)

export const TIMELINE_ICON_OPTIONS = TIMELINE_ICON_KEYS.map(key => ({
  key, label: ICONS[key].label,
}))

export const DEFAULT_ICON = 'heart'

export default function TimelineIcon({ name, className = '' }) {
  const icon = ICONS[name] || ICONS[DEFAULT_ICON]
  return (
    <svg {...box} className={className} aria-hidden="true">
      {icon.paths}
    </svg>
  )
}
