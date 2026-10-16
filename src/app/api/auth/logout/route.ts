import { cookies } from 'next/headers'
import { deleteSession } from '@worker/db'
import { env, json, route, SESSION_COOKIE } from '@/lib/server'

export const POST = route(async () => {
  const jar = await cookies()
  const sid = jar.get(SESSION_COOKIE)?.value
  if (sid) await deleteSession(env(), sid)
  jar.delete(SESSION_COOKIE)
  return json({ ok: true })
})
