export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`
  return url
}

// For Google Drive audio: use the new usercontent CDN (works without auth for public files)
export function normalizeAudioUrl(url) {
  if (!url || typeof url !== 'string') return url
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (match) return `https://drive.usercontent.google.com/download?id=${match[1]}&export=download&authuser=0`
  return url
}
