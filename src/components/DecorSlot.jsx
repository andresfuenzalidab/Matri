import { normalizeImageUrl } from '../utils/imageUrl.js'

/**
 * One decorative art layer (corner floral, frame, urn, texture...) sourced
 * from an admin-editable content field — always a public URL, pasted or
 * uploaded through the same ImageField the rest of the site uses. Until
 * that URL is set, this renders a labelled dashed box at the same aspect
 * ratio, so the layout/position is legible before the real art exists.
 */
export default function DecorSlot({ url, label, aspectRatio, className = '', style, alt = '' }) {
  const resolved = normalizeImageUrl(url)
  if (resolved) {
    // `aspectRatio` is a stand-in for the real art's own proportions before
    // it exists — forcing it onto the real `<img>` too would stretch/distort
    // any real upload whose natural ratio doesn't match the guess. The real
    // image sizes itself (width from `style`/className, height auto).
    return (
      <img src={resolved} alt={alt} className={className}
        style={style}
        onError={e => { e.target.style.visibility = 'hidden' }} />
    )
  }
  if (!label) return null
  return (
    <div className={`decor-slot-placeholder ${className}`} style={{ ...style, aspectRatio }} aria-hidden="true">
      <span>{label}</span>
    </div>
  )
}
