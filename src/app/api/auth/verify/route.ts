import { createSession, hostForEmail, takeLoginCode } from '@worker/db'
import { body, env, json, route, setSession } from '@/lib/server'

export const POST = route(async (req) => {
  const { email, code } = await body<{ email: string; code: string }>(req)
  const e = (email ?? '').trim().toLowerCase()
  const c = String(code ?? '').replace(/\D/g, '')
  if (c.length !== 6 || !(await takeLoginCode(env(), e, c))) return json({ error: 'That code is wrong or has expired' }, 401)
  const host = await hostForEmail(env(), e)
  await setSession(await createSession(env(), host.id))
  return json({ host })
})
