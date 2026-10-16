import { devicesFor, unpairDevice } from '@worker/db'
import { env, json, propertyRoute } from '@/lib/server'

export const DELETE = propertyRoute<{ id: string; code: string }>(async (p, _req, { code }) => {
  await unpairDevice(env(), code, p.id)
  return json({ devices: await devicesFor(env(), p.id) })
})
