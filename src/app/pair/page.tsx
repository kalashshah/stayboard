import { listProperties } from '@worker/db'
import { redirect } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { currentHost, env } from '@/lib/server'
import { Pair } from './pair'

export const metadata = { title: 'Pair a TV' }

// Outside the (host) group on purpose: the TV's QR code lands here, so a signed-out host signs in and comes back with the code.
export default async function PairPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const code = ((await searchParams).code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  const host = await currentHost()
  if (!host) redirect(`/?next=${encodeURIComponent(`/pair?code=${code}`)}`)
  return <Shell email={host.email}><Pair code={code} list={await listProperties(env(), host.id)} /></Shell>
}
