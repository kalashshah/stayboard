import { env, json, propertyRoute } from '@/lib/server'

export const DELETE = propertyRoute<{ id: string; file: string }>(async (p, _req, { file }) => {
  await env().MEDIA.delete(`${p.id}/${file}`) // key rebuilt from the owned property: no cross-host deletes
  return json({ ok: true })
})
