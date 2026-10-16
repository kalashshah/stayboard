import { getProperty, recentTvReplies, touchDevice, unpairDeviceRow } from '@worker/db'
import { env, guestUrl, json, route } from '@/lib/server'
import { tvDevice } from '@/lib/tv-device'

export const GET = route(async (req) => {
  const d = await tvDevice(req)
  if (!d) return json({ error: 'Unknown device' }, 401)
  await touchDevice(env(), d.code)
  const p = d.property_id ? await getProperty(env(), d.property_id) : null
  if (!p) {
    if (d.property_id) await unpairDeviceRow(env(), d.code) // property was deleted
    return json({ paired: false, code: d.code, pairUrl: `${env().APP_URL}/pair?code=${d.code}` })
  }
  return json({ paired: true, config: p.config, updatedAt: p.updated_at, slug: p.slug, guestUrl: guestUrl(p.slug), replies: await recentTvReplies(env(), p.id) })
})
