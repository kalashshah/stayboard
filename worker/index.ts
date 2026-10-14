import { Hono } from 'hono'
import { api } from './api'
import { parseRange } from './media'

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api', api)

// Public media, immutable and ranged so TVs and browsers can stream video.
app.get('/m/:pid/:file', async (c) => {
  const key = `${c.req.param('pid')}/${c.req.param('file')}`
  const head = await c.env.MEDIA.head(key)
  if (!head) return c.json({ error: 'Not found' }, 404)
  const range = parseRange(c.req.header('range'), head.size)
  if (range === 'unsatisfiable') return new Response(null, { status: 416, headers: { 'content-range': `bytes */${head.size}` } })
  const obj = await c.env.MEDIA.get(key, range ? { range } : undefined)
  if (!obj) return c.json({ error: 'Not found' }, 404)
  const h = new Headers({
    'content-type': head.httpMetadata?.contentType ?? 'application/octet-stream',
    'accept-ranges': 'bytes',
    'cache-control': 'public, max-age=31536000, immutable',
    etag: head.httpEtag,
  })
  if (range) {
    h.set('content-range', `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`)
    h.set('content-length', String(range.length))
  } else h.set('content-length', String(head.size))
  return new Response(obj.body, { status: range ? 206 : 200, headers: h })
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((e, c) => {
  console.error(e)
  return c.json({ error: 'Something went wrong' }, 500)
})

export default { fetch: app.fetch } satisfies ExportedHandler<Env>
