import { redirect } from 'next/navigation'
import { currentHost } from '@/lib/server'
import { Landing } from './landing'

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  if (await currentHost()) redirect('/app')
  const { error = '', next = '' } = await searchParams
  // Only same-site paths: `next` comes from the URL, so never let it point off-site.
  return <Landing initialError={error} next={next.startsWith('/') && !next.startsWith('//') ? next : '/app'} />
}
