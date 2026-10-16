import { parseConfig } from '@worker/config'
import { deleteProperty, devicesFor, updateConfig } from '@worker/db'
import { body, env, guestUrl, json, propertyRoute } from '@/lib/server'

export const GET = propertyRoute(async (p) =>
  json({
    property: { id: p.id, slug: p.slug, config: p.config, updated_at: p.updated_at },
    devices: await devicesFor(env(), p.id),
    guestUrl: guestUrl(p.slug),
  }))

export const PUT = propertyRoute(async (p, req) => {
  const r = parseConfig((await body<{ config: unknown }>(req)).config)
  if (!r.ok) return json({ error: r.error }, 400)
  return json({ updated_at: await updateConfig(env(), p.id, r.config) })
})

export const DELETE = propertyRoute(async (p) => {
  await deleteProperty(env(), p.id)
  return json({ ok: true })
})
