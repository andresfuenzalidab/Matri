import { useApp } from '../context/AppContext'
import { normalizeImageUrl } from '../utils/imageUrl.js'

/**
 * Elegant break between sections. If an ornament image has been uploaded
 * (`section_divider_image`) it is used instead of the drawn flourish — like the
 * other botanical art on the page it is multiplied onto the cream background,
 * so a PNG on white or with a transparent background both blend in.
 */
const Flourish = () => (
  <svg
    className="section-divider-art"
    viewBox="0 0 300 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.9"
    strokeLinecap="round"
    aria-hidden="true"
  >
    {/* tapered rules */}
    <path d="M6 20h108" opacity="0.35" />
    <path d="M186 20h108" opacity="0.35" />

    {/* left sprig */}
    <path d="M114 20c8 0 14-2 19-6" />
    <path d="M124 18c-1.5-3.4-1-6 1.6-7.8.9 3.3.2 5.9-1.6 7.8z" />
    <path d="M131 14.6c-2.4-2.7-2.6-5.4-.7-8 2 2.8 2.2 5.5.7 8z" />
    <path d="M114 20c8 0 14 2 19 6" />
    <path d="M124 22c-1.5 3.4-1 6 1.6 7.8.9-3.3.2-5.9-1.6-7.8z" />

    {/* right sprig (mirrored) */}
    <path d="M186 20c-8 0-14-2-19-6" />
    <path d="M176 18c1.5-3.4 1-6-1.6-7.8-.9 3.3-.2 5.9 1.6 7.8z" />
    <path d="M169 14.6c2.4-2.7 2.6-5.4.7-8-2 2.8-2.2 5.5-.7 8z" />
    <path d="M186 20c-8 0-14 2-19 6" />
    <path d="M176 22c1.5 3.4 1 6-1.6 7.8-.9-3.3-.2-5.9 1.6-7.8z" />

    {/* centre lozenge */}
    <path d="M150 12.5 156 20l-6 7.5-6-7.5z" />
    <circle cx="150" cy="20" r="1.6" fill="currentColor" stroke="none" />
  </svg>
)

export default function SectionDivider() {
  const { get } = useApp()
  const img = normalizeImageUrl(get('section_divider_image') || '')

  return (
    <div className="section-divider" aria-hidden="true">
      {img ? (
        <img src={img} alt="" className="section-divider-img"
          onError={e => { e.target.style.display = 'none' }} />
      ) : (
        <Flourish />
      )}
    </div>
  )
}
