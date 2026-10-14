// Host media in R2: validation, listing, quota and ranged reads. Keys are `<propertyId>/<uuid>.<ext>`.
export const MB = 1024 * 1024
export const QUOTA = 150 * MB

export const KINDS = {
  video: { types: { 'video/mp4': 'mp4' }, cap: 40 * MB, rule: 'MP4 videos up to 40 MB' },
  audio: { types: { 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a' }, cap: 10 * MB, rule: 'MP3 or M4A tracks up to 10 MB' },
  image: { types: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }, cap: 5 * MB, rule: 'JPG, PNG or WebP images up to 5 MB' },
} as const
export type Kind = keyof typeof KINDS

export type UploadCheck =
  | { ok: true; kind: Kind; ext: string; contentType: string }
  | { ok: false; status: 400 | 413 | 415; error: string }

export function checkUpload(kind: string, contentType: string, size: number, used: number): UploadCheck {
  if (!(kind in KINDS)) return { ok: false, status: 400, error: 'Unknown upload kind' }
  const k = KINDS[kind as Kind]
  const ct = contentType.split(';')[0].trim().toLowerCase()
  const ext = (k.types as Record<string, string>)[ct]
  if (!ext) return { ok: false, status: 415, error: k.rule }
  if (!size || size > k.cap) return { ok: false, status: 413, error: k.rule }
  if (used + size > QUOTA) return { ok: false, status: 413, error: 'This property has used its 150 MB of media. Delete something first.' }
  return { ok: true, kind: kind as Kind, ext, contentType: ct }
}

/** RFC 7233 single range → { offset, length }; null when absent; 'unsatisfiable' when out of bounds. */
export function parseRange(header: string | undefined, size: number): { offset: number; length: number } | null | 'unsatisfiable' {
  const m = header?.match(/^bytes=(\d*)-(\d*)$/)
  if (!m) return null
  const [, a, b] = m
  if (a === '' && b === '') return null
  if (a === '') {
    const n = Math.min(Number(b), size)
    return n === 0 ? 'unsatisfiable' : { offset: size - n, length: n }
  }
  const start = Number(a)
  if (start >= size) return 'unsatisfiable'
  const end = b === '' ? size - 1 : Math.min(Number(b), size - 1)
  return { offset: start, length: end - start + 1 }
}

export type MediaFile = { key: string; url: string; size: number; uploaded: number; contentType: string; name: string; kind: string }

export async function listMedia(env: Env, propertyId: string): Promise<MediaFile[]> {
  const out: MediaFile[] = []
  let cursor: string | undefined
  do {
    const r = await env.MEDIA.list({ prefix: `${propertyId}/`, cursor, include: ['httpMetadata', 'customMetadata'] })
    for (const o of r.objects) {
      out.push({
        key: o.key, url: `${env.APP_URL}/m/${o.key}`, size: o.size, uploaded: o.uploaded.getTime(),
        contentType: o.httpMetadata?.contentType ?? '', name: o.customMetadata?.name ?? '', kind: o.customMetadata?.kind ?? '',
      })
    }
    cursor = r.truncated ? r.cursor : undefined
  } while (cursor)
  return out.sort((a, b) => b.uploaded - a.uploaded)
}

export const usedBytes = async (env: Env, propertyId: string) => (await listMedia(env, propertyId)).reduce((n, f) => n + f.size, 0)

export async function deletePrefix(env: Env, propertyId: string) {
  const keys = (await listMedia(env, propertyId)).map((f) => f.key)
  if (keys.length) await env.MEDIA.delete(keys)
}
