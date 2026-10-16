import { ask, GUEST_DAILY_CAP, today, validQuestion } from '@worker/ask'
import { getPropertyBySlug, takeBudget } from '@worker/db'
import { body, env, json, route } from '@/lib/server'

export const POST = route<{ slug: string }>(async (req, { slug }) => {
  const p = await getPropertyBySlug(env(), slug)
  if (!p) return json({ error: 'Not found' }, 404)
  const q = validQuestion((await body<{ question: unknown }>(req)).question)
  if (!q) return json({ error: 'Ask a question between 1 and 300 characters' }, 400)
  if (!(await takeBudget(env(), `${today()}:${p.slug}`, GUEST_DAILY_CAP)))
    return json({ answered: false, answer: `The concierge has answered a lot today. ${p.config.ask.fallback}` })
  return json(await ask(env(), p, q, 'phone'))
})
