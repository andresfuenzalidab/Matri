import { normalizeImageUrl } from '../utils/imageUrl.js'

const CameraIcon = ({ size = 32 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

export default function PhotoPlaceholder({ size = 'md', label, url, alt = '' }) {
  const resolvedUrl = normalizeImageUrl(url)
  if (resolvedUrl) {
    const isCircle = size === 'sm'
    return (
      <img
        src={resolvedUrl}
        alt={alt || label || ''}
        style={{
          width: isCircle ? 130 : '100%',
          height: isCircle ? 130 : size === 'hero' ? 300 : size === 'lg' ? 260 : 200,
          objectFit: 'cover',
          borderRadius: isCircle ? '50%' : 8,
          display: 'block',
        }}
      />
    )
  }

  return (
    <div className={`photo-placeholder ph-${size}`}>
      <CameraIcon size={size === 'sm' ? 24 : 32} />
      {label && <span className="ph-label">{label}</span>}
    </div>
  )
}
