import { currentHost, json, route } from '@/lib/server'

export const GET = route(async () => {
  const host = await currentHost()
  return host ? json({ host }) : json({ error: 'Sign in first' }, 401)
})
