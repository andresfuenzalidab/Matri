export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`
  return url
}

// For Google Drive audio files: convert share URL to direct download stream
export function normalizeAudioUrl(url) {
  if (!url || typeof url !== 'string') return url
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`
  return url
}
