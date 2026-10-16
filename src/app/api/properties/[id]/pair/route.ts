import { devicesFor, pairDevice } from '@worker/db'
import { body, env, json, propertyRoute } from '@/lib/server'

export const POST = propertyRoute(async (p, req) => {
  const { code, label } = await body<{ code: string; label: string }>(req)
  const k = (code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (k.length !== 6) return json({ error: 'Pairing codes are 6 characters' }, 400)
  const ok = await pairDevice(env(), k, p.id, (label ?? '').trim().slice(0, 60) || 'Living room TV')
  if (!ok) return json({ error: 'No TV is showing that code, or it is already paired' }, 404)
  return json({ devices: await devicesFor(env(), p.id) })
})
