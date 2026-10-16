'use client'

import { RiHome4Line, RiLogoutBoxRLine, RiTvLine } from '@remixicon/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { api } from '@/api'
import { Brand } from './Brand'
import * as Btn from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [['/app', 'Properties', RiHome4Line], ['/pair', 'Pair a TV', RiTvLine]] as const

/** Signed-in chrome: brand, the two top-level pages, who is signed in, sign out. */
export function Shell({ email, wide, children }: { email: string; wide?: boolean; children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const wideNow = wide ?? path.startsWith('/app/p/')
  return (
    <div className={cn('mx-auto px-4 pb-20', wideNow ? 'max-w-[1180px]' : 'max-w-[980px]')}>
      <header className="sticky top-3 z-30 mt-3 flex items-center gap-3 rounded-2xl bg-bg-white-0/75 py-2 pr-2 pl-4 shadow-regular-md ring-1 ring-stroke-soft-200 backdrop-blur-xl">
        <Brand href="/app" />
        <nav className="ml-auto flex gap-0.5 rounded-10 bg-bg-weak-50 p-0.5 ring-1 ring-inset ring-stroke-soft-200 sm:ml-6">
          {NAV.map(([href, label, I]) => (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-label-sm transition-colors sm:px-3',
              path === href ? 'bg-bg-white-0 text-text-strong-950 shadow-fancy-buttons-stroke' : 'text-text-sub-600 hover:text-text-strong-950',
            )}><I className={cn('hidden size-4 sm:block', path === href ? 'text-orange-500' : 'text-text-soft-400')} />{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:ml-auto">
          <span title={email} className="fancy fancy-ink grid size-8 shrink-0 place-items-center rounded-full text-label-sm uppercase"><span>{email[0]}</span></span>
          <span className="hidden max-w-[180px] truncate text-paragraph-sm text-text-sub-600 lg:inline">{email}</span>
          <Btn.Root variant="neutral" mode="ghost" size="xsmall" title="Sign out" onClick={() => api.logout().then(() => { router.push('/'); router.refresh() })}>
            <Btn.Icon as={RiLogoutBoxRLine} />
            <span className="hidden sm:inline">Sign out</span>
          </Btn.Root>
        </div>
      </header>
      {children}
    </div>
  )
}

/** Page title block used at the top of every signed-in page. */
export const PageHead = ({ title, lede, children }: { title: React.ReactNode; lede?: string; children?: React.ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 pt-8 pb-5">
    <div className="flex flex-col gap-2">
      <h1 className="text-title-h5 tracking-tight text-text-strong-950 md:text-title-h4">{title}</h1>
      {lede && <p className="max-w-2xl text-paragraph-md text-text-sub-600">{lede}</p>}
    </div>
    {children}
  </div>
)
