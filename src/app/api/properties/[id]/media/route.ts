// Host uploads, stored in R2 and served publicly from /m/.
import { newId } from '@worker/auth'
import { checkUpload, listMedia, usedBytes } from '@worker/media'
import { env, json, propertyRoute } from '@/lib/server'

export const GET = propertyRoute(async (p) => json({ files: await listMedia(env(), p.id) }))

export const PUT = propertyRoute(async (p, req) => {
  const q = new URL(req.url).searchParams
  // Buffered and measured: content-length does not survive OpenNext's request conversion, and R2 needs a known length.
  // ponytail: an oversized upload is read before it is refused (capped by the platform's 100 MB request limit)
  const data = await req.arrayBuffer()
  const size = data.byteLength
  const v = checkUpload(q.get('kind') ?? '', req.headers.get('content-type') ?? '', size, await usedBytes(env(), p.id))
  if (!v.ok) return json({ error: v.error }, v.status)
  const key = `${p.id}/${newId()}.${v.ext}`
  await env().MEDIA.put(key, data, {
    httpMetadata: { contentType: v.contentType },
    customMetadata: { name: (q.get('name') ?? '').slice(0, 120), kind: v.kind },
  })
  return json({ key, url: `${env().APP_URL}/m/${key}`, size })
})
