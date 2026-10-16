import { createProperty, listProperties } from '@worker/db'
import { body, currentHost, env, json, route } from '@/lib/server'

export const GET = route(async () => {
  const host = await currentHost()
  if (!host) return json({ error: 'Sign in first' }, 401)
  return json({ properties: await listProperties(env(), host.id) })
})

export const POST = route(async (req) => {
  const host = await currentHost()
  if (!host) return json({ error: 'Sign in first' }, 401)
  const n = ((await body<{ name: string }>(req)).name ?? '').trim()
  if (!n || n.length > 80) return json({ error: 'Give the property a name' }, 400)
  const p = await createProperty(env(), host.id, n)
  return json({ property: { id: p.id, slug: p.slug, config: p.config, updated_at: p.updated_at } })
})
