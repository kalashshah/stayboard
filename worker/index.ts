import { Hono } from 'hono'
import { api } from './api'

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api', api)
app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((e, c) => {
  console.error(e)
  return c.json({ error: 'Something went wrong' }, 500)
})

export default { fetch: app.fetch } satisfies ExportedHandler<Env>
