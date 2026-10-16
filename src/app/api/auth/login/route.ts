import { verifyPassword } from '@worker/auth'
import { createSession, findHost } from '@worker/db'
import { body, env, json, route, setSession } from '@/lib/server'

export const POST = route(async (req) => {
  const { email, password } = await body<{ email: string; password: string }>(req)
  const row = await findHost(env(), (email ?? '').trim().toLowerCase())
  if (!row || !password || !(await verifyPassword(password, row.pass_hash, row.salt))) return json({ error: 'Wrong email or password' }, 401)
  await setSession(await createSession(env(), row.id))
  return json({ host: { id: row.id, email: row.email } })
})
