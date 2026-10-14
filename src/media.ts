// Browser-side media helpers: type inference for files Safari leaves untyped, and poster capture for videos.
const EXT: Record<string, string> = { mp4: 'video/mp4', mp3: 'audio/mpeg', m4a: 'audio/mp4', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

export const inferType = (f: File) => f.type || EXT[f.name.split('.').pop()?.toLowerCase() ?? ''] || ''

/** First frame of a video as a JPEG, or null when the browser cannot decode it. */
export function capturePoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    const src = URL.createObjectURL(file)
    let settled = false
    const done = (b: Blob | null) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(src)
      resolve(b)
    }
    v.onerror = () => done(null)
    v.onloadedmetadata = () => { v.currentTime = Math.min(0.5, v.duration / 2) }
    v.onseeked = () => {
      const scale = Math.min(1, 1280 / v.videoWidth)
      const c = document.createElement('canvas')
      c.width = Math.round(v.videoWidth * scale)
      c.height = Math.round(v.videoHeight * scale)
      c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height)
      c.toBlob((b) => done(b), 'image/jpeg', 0.8)
    }
    setTimeout(() => done(null), 15_000) // ponytail: a stuck decoder should not hang the upload
    v.src = src
  })
}
