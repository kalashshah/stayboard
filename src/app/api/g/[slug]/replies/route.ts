import { getPropertyBySlug, repliesFor } from '@worker/db'
import { env, json, route } from '@/lib/server'

const UUID = /^[0-9a-f-]{36}$/

/** Host replies to questions this phone asked. The phone sends the ids it got back from /ask; ids are random, so they can't be guessed. */
export const GET = route<{ slug: string }>(async (req, { slug }) => {
  const p = await getPropertyBySlug(env(), slug)
  if (!p) return json({ error: 'Not found' }, 404)
  const ids = (new URL(req.url).searchParams.get('ids') ?? '').split(',').filter((i) => UUID.test(i)).slice(0, 10)
  return json({ replies: await repliesFor(env(), p.id, ids) })
})
