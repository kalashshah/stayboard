import { createHost, createSession } from '@worker/db'
import { body, env, json, route, setSession } from '@/lib/server'

export const POST = route(async (req) => {
  const { email, password } = await body<{ email: string; password: string }>(req)
  const e = (email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return json({ error: 'Enter a valid email' }, 400)
  if (!password || password.length < 8) return json({ error: 'Password needs at least 8 characters' }, 400)
  const host = await createHost(env(), e, password)
  if (!host) return json({ error: 'That email already has an account. Sign in instead.' }, 409)
  await setSession(await createSession(env(), host.id))
  return json({ host })
})
