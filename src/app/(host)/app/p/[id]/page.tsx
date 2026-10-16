import { devicesFor } from '@worker/db'
import { notFound } from 'next/navigation'
import { env, guestUrl, ownProperty } from '@/lib/server'
import { Editor } from './editor'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await ownProperty((await params).id)
  if (!p) notFound()
  return (
    <Editor
      property={{ id: p.id, slug: p.slug, config: p.config, updated_at: p.updated_at }}
      initialDevices={await devicesFor(env(), p.id)}
      guestUrl={guestUrl(p.slug)}
    />
  )
}
