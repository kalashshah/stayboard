import { getPropertyBySlug } from '@worker/db'
import type { Metadata } from 'next'
import { cache } from 'react'
import { backdropFor, headlineFor, tileLabel, visibleTiles, wifiQr, type PropertyConfig, type Tile } from '@/api'
import { FONT_STACK } from '@/design'
import { Qr } from '@/components/Qr'
import { Card } from '@/components/ui/card'
import { env } from '@/lib/server'
import { Ask, CopyButton } from './guest'

type Props = { params: Promise<{ slug: string }> }

const load = cache(async (slug: string) => getPropertyBySlug(env(), slug))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug)
  return { title: p?.config.name ?? 'Guest page', robots: { index: false } }
}

export default async function GuestPage({ params }: Props) {
  const { slug } = await params
  const p = await load(slug)
  if (!p) return <main className="px-6 py-16 text-center text-paragraph-md text-text-sub-600">This guest page doesn’t exist any more.</main>
  const c = p.config
  const accent = c.appearance.accent
  const b = backdropFor(c)
  const photo = b.kind === 'photo' ? b.url : b.kind === 'slideshow' ? b.urls[0] : b.kind === 'video' ? b.poster : ''
  const tiles = visibleTiles(c)
  const hero = photo
    ? `linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.72)), url(${photo}) center/cover`
    : `linear-gradient(160deg, ${accent}, ${accent}99)`
  return (
    <main className="mx-auto flex max-w-[560px] flex-col gap-3 px-3.5 pb-5" style={{ ['--accent' as string]: accent, ['--font' as string]: FONT_STACK[c.design.font] }}>
      <header className="-mx-3.5 mb-1 flex flex-col gap-2 rounded-b-3xl px-5.5 pt-7 pb-6.5 text-white" style={{ background: hero }}>
        {c.design.logo
          ? <img className="h-7 w-auto max-w-[60%] self-start object-contain" src={c.design.logo} alt={c.name} />
          : <span className="text-subheading-xs uppercase opacity-85">{c.name}</span>}
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight" style={{ fontFamily: 'var(--font)' }}>{headlineFor(c)}</h1>
        {c.welcome.message && <p className="text-paragraph-md opacity-90">{c.welcome.message}</p>}
        <span className="text-paragraph-sm opacity-80">Hosted by {c.hostName}</span>
      </header>

      {tiles.some((t) => t.key === 'ask') && <Ask slug={slug} hostName={c.hostName} suggested={c.ask.suggested} />}
      {tiles.filter((t) => t.key !== 'ask').map((t) => <Section key={t.key} t={t} c={c} />)}

      <footer className="py-6 pb-10 text-center text-paragraph-xs text-text-soft-400">Stayboard · a Fire TV welcome screen</footer>
    </main>
  )
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-label-lg text-text-strong-950" style={{ fontFamily: 'var(--font)' }}>{children}</h2>
const KV = ({ k, v, mono }: { k: string; v: string; mono?: boolean }) => (
  <div className="flex flex-col gap-0.5 border-b border-stroke-soft-200 py-2 last:border-b-0">
    <span className="text-paragraph-xs text-text-sub-600">{k}</span>
    <strong className={mono ? 'font-mono text-label-md tracking-wide' : 'text-label-md text-text-strong-950'}>{v}</strong>
  </div>
)
const List = ({ items }: { items: string[] }) => <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-strong-950">{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
const Topic = ({ q, a }: { q: string; a: string }) => (
  <details className="group border-t border-stroke-soft-200 py-2.5">
    <summary className="cursor-pointer text-label-sm text-text-strong-950">{q}</summary>
    <p className="mt-2 whitespace-pre-wrap text-paragraph-sm text-text-sub-600">{a}</p>
  </details>
)

function Section({ t, c }: { t: Tile; c: PropertyConfig }) {
  const card = 'flex flex-col gap-2.5'
  switch (t.key) {
    case 'wifi':
      if (!c.wifi.ssid) return null
      return (
        <Card className={card}>
          <H>{tileLabel(t)}</H>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <KV k="Network" v={c.wifi.ssid} />
              <KV k="Password" v={c.wifi.password} mono />
              <CopyButton text={c.wifi.password} />
            </div>
            <Qr text={wifiQr(c)} size={110} />
          </div>
        </Card>
      )
    case 'checkout':
      return (
        <Card className={card}>
          <H>{tileLabel(t)}</H>
          <div><KV k="Check-in" v={c.stay.checkIn} /><KV k="Checkout" v={c.stay.checkOut} /></div>
          {c.stay.checkoutSteps.length > 0 && <><p className="mt-1 text-paragraph-xs text-text-sub-600">Before you leave</p><List items={c.stay.checkoutSteps} /></>}
        </Card>
      )
    case 'rules':
      if (!c.rules.length) return null
      return <Card className={card}><H>{tileLabel(t)}</H><List items={c.rules} /></Card>
    case 'guide':
      if (!c.guide.length && !c.faqs.length) return null
      return (
        <Card className={card}>
          <H>{tileLabel(t)}</H>
          <div>
            {c.guide.map((g, i) => <Topic key={i} q={g.title} a={g.body} />)}
            {c.faqs.map((f, i) => <Topic key={`f${i}`} q={f.q} a={f.a} />)}
          </div>
        </Card>
      )
    case 'places':
      if (!c.places.length) return null
      return (
        <Card className={card}>
          <H>{tileLabel(t)}</H>
          {c.places.map((p, i) => (
            <div key={i} className="flex flex-col gap-0.5 border-t border-stroke-soft-200 pt-2">
              <div className="flex justify-between gap-3">
                <strong className="text-label-sm text-text-strong-950">{p.name}</strong>
                <span className="text-paragraph-xs text-text-sub-600">{[p.category, p.distance].filter(Boolean).join(' · ')}</span>
              </div>
              <p className="text-paragraph-sm text-text-sub-600">{p.note}</p>
            </div>
          ))}
        </Card>
      )
    case 'contacts':
      if (!c.contacts.length) return null
      return <Card className={card}><H>{tileLabel(t)}</H><div>{c.contacts.map((k, i) => <KV key={i} k={k.label} v={k.value} />)}</div></Card>
    default:
      return null
  }
}
