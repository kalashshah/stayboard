import { getPropertyBySlug } from '@worker/db'
import { env, json, route } from '@/lib/server'

export const GET = route<{ slug: string }>(async (_req, { slug }) => {
  const p = await getPropertyBySlug(env(), slug)
  return p ? json({ config: p.config, updatedAt: p.updated_at }) : json({ error: 'Not found' }, 404)
})
