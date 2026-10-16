import { ask, today, TV_DAILY_CAP, validQuestion } from '@worker/ask'
import { getProperty, takeBudget } from '@worker/db'
import { body, env, json, route } from '@/lib/server'
import { tvDevice } from '@/lib/tv-device'

export const POST = route(async (req) => {
  const d = await tvDevice(req)
  if (!d) return json({ error: 'Unknown device' }, 401)
  const p = d.property_id ? await getProperty(env(), d.property_id) : null
  if (!p) return json({ error: 'TV is not paired' }, 409)
  const q = validQuestion((await body<{ question: unknown }>(req)).question)
  if (!q) return json({ error: 'Ask a question between 1 and 300 characters' }, 400)
  if (!(await takeBudget(env(), `${today()}:tv:${p.id}`, TV_DAILY_CAP)))
    return json({ answered: false, answer: `This TV has asked a lot today. ${p.config.ask.fallback}` })
  return json(await ask(env(), p, q, 'tv'))
})
