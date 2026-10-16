// Public media, immutable and ranged so TVs and browsers can stream video.
import { parseRange } from '@worker/media'
import { env, json, route } from '@/lib/server'

export const GET = route<{ pid: string; file: string }>(async (req, { pid, file }) => {
  const key = `${pid}/${file}`
  const head = await env().MEDIA.head(key)
  if (!head) return json({ error: 'Not found' }, 404)
  const range = parseRange(req.headers.get('range') ?? undefined, head.size)
  if (range === 'unsatisfiable') return new Response(null, { status: 416, headers: { 'content-range': `bytes */${head.size}` } })
  const obj = await env().MEDIA.get(key, range ? { range } : undefined)
  if (!obj) return json({ error: 'Not found' }, 404)
  const h = new Headers({
    'content-type': head.httpMetadata?.contentType ?? 'application/octet-stream',
    'accept-ranges': 'bytes',
    'x-content-type-options': 'nosniff',
    'cache-control': 'public, max-age=31536000, immutable',
    etag: head.httpEtag,
  })
  if (range) {
    h.set('content-range', `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`)
    h.set('content-length', String(range.length))
  } else h.set('content-length', String(head.size))
  return new Response(obj.body, { status: range ? 206 : 200, headers: h })
})
