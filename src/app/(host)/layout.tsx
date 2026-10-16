import { redirect } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { currentHost } from '@/lib/server'

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const host = await currentHost()
  if (!host) redirect('/')
  return <Shell email={host.email}>{children}</Shell>
}
