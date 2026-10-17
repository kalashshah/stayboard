'use client'

import { RiArrowRightLine, RiBookOpenLine, RiChat3Line, RiLayoutMasonryLine, RiLockLine, RiMailLine, RiPaletteLine, RiShieldCheckLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { defaultConfig } from '../../shared/design'
import type { Design, PropertyConfig } from '@/api'
import { patchAppearance, patchBackdrop, patchDesign } from '@/design'
import { Segmented } from '@/components/Fields'
import { cn } from '@/lib/utils'
import { Auth, type AuthMode } from '@/components/Auth'
import { Brand } from '@/components/Brand'
import { TvPreview } from '@/components/Preview'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Story } from './story'

const PHOTO = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=70'

function demo(layout: PropertyConfig['design']['layout'], font: PropertyConfig['design']['font'] = 'serif') {
  const c = defaultConfig('Ocean View Loft')
  c.hostName = 'Priya'
  c.welcome.guestName = 'Sam'
  c.wifi = { ssid: 'LoftNet', password: 'seabreeze22' }
  c.design.layout = layout
  c.design.font = font
  c.design.radius = layout === 'minimal' ? 'sharp' : 'pill'
  c.design.backdrop = { ...c.design.backdrop, kind: 'photo', photos: [PHOTO], overlay: layout === 'split' ? 70 : 50 }
  c.design.tiles = [c.design.tiles[6], ...c.design.tiles.slice(0, 6)]
  return c
}
const hero = demo('poster')

const ASK_STEPS: [typeof RiChat3Line, string, string][] = [
  [RiChat3Line, 'A guest asks', 'On the TV with the remote, or from their phone by scanning the code on screen. There is no app to install and no account to create.'],
  [RiBookOpenLine, 'Your guide answers', 'Amazon Nova reads only what you wrote: stay details, rules, guide, FAQs, local picks and contacts. It will not make up a door code or a price.'],
  [RiMailLine, 'Gaps come to you', 'If it isn’t in your guide, the TV says so and you get an email. Your reply goes back to the guest who asked and is saved as an FAQ for every guest after.'],
]
const ASK_EXAMPLES: [string, string, boolean][] = [
  ['Where do we park?', 'Use bay 14 in the garage under the building. The fob is on the hook by the door.', true],
  ['Is there a hair dryer?', 'Yes, in the top drawer of the bedroom dresser.', true],
  ['Can we bring our dog?', 'That isn’t in the house guide yet. I’ve passed your question to Priya. The reply will show up here.', false],
]

const POINT_ICONS = [RiLayoutMasonryLine, RiPaletteLine, RiShieldCheckLine, RiLockLine]
const POINTS: [string, string][] = [
  ['Every section is yours', 'Headline with the guest’s name, message, check-in and checkout, Wi-Fi with a scannable code, rules, guide, FAQs, local picks, contacts.'],
  ['Looks like your place', 'Video, photo or slideshow backdrops, music, layouts, fonts, colours, your logo, and tiles you can rename, reorder or hide.'],
  ['Grounded answers', 'Amazon Nova reads only your house guide. If it isn’t in there, the TV says so and points guests to you.'],
  ['Private by design', 'Guests never make an account and nothing tracks them. The TV stores your house guide and a pairing secret, and keeps nothing about who stayed.'],
]

export function Landing({ initialError, next }: { initialError: string; next: string }) {
  // /?error=... comes back from the Google callback; open the sign-in dialog with it and clean the URL.
  const [auth, setAuth] = useState<AuthMode | null>(initialError || next !== '/app' ? 'login' : null)
  useEffect(() => { if (initialError) history.replaceState(null, '', location.pathname) }, [initialError])
  const h2 = 'max-w-3xl text-title-h4 tracking-tight text-text-strong-950 md:text-title-h3'
  return (
    <div className="relative overflow-x-clip pb-12">
      <header className="sticky top-3 z-30 mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-[1120px] items-center justify-between gap-3 rounded-2xl bg-bg-white-0/75 py-2 pr-2 pl-4 shadow-regular-md ring-1 ring-stroke-soft-200 backdrop-blur-xl">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {([['#ask', 'Ask the house'], ['#how', 'How it works'], ['#design', 'Design'], ['#why', 'Why Stayboard']] as const).map(([h, l]) => (
            <a key={h} href={h} className="rounded-lg px-3 py-1.5 text-label-sm text-text-sub-600 transition hover:bg-bg-weak-50 hover:text-text-strong-950">{l}</a>
          ))}
        </nav>
        <Button onClick={() => setAuth('signup')}>Start now</Button>
      </header>

      <div className="-mt-[68px]"><Story config={hero} onSignup={() => setAuth('signup')} onLogin={() => setAuth('login')} /></div>

      <div className="mx-auto max-w-[1160px] px-4 md:px-5">
      <section className="flex scroll-mt-24 flex-col gap-4 pt-24" id="ask">
        <span className="text-label-xs tracking-[0.12em] text-orange-600 uppercase">Ask the house</span>
        <h2 className={h2}>The questions guests would text you at 11pm, answered by the TV.</h2>
        <p className="mb-4 max-w-2xl text-paragraph-lg text-text-sub-600">Write your house guide once. Guests ask in their own words and get a short answer in seconds, based only on what you wrote. Whatever it can’t answer comes to you, and your reply goes straight back to the guest, so the guide fills its own gaps over time.</p>
        <div className="grid gap-x-6 md:grid-cols-3">
          {ASK_STEPS.map(([I, t, d], i) => (
            <div key={t} className="flex flex-col gap-1.5 border-t border-stroke-soft-200 py-5">
              <span className="mb-2 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-10 bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-alpha-24"><I className="size-5" /></span>
                <span className="text-label-xs text-text-soft-400">{String(i + 1).padStart(2, '0')}</span>
              </span>
              <h3 className="text-label-lg text-text-strong-950">{t}</h3>
              <p className="text-paragraph-sm text-text-sub-600">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {ASK_EXAMPLES.map(([q, a, ok]) => (
            <Card key={q} className="flex flex-col gap-3 p-5">
              <p className="text-label-md text-text-strong-950">“{q}”</p>
              <p className="text-paragraph-sm text-text-sub-600">{a}</p>
              <span className={`mt-auto text-label-xs ${ok ? 'text-text-soft-400' : 'text-orange-600'}`}>{ok ? 'From Priya’s house guide' : 'Not in the guide · Priya replies here'}</span>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-4 pt-24" id="design">
        <h2 className={h2}>Design it your way.</h2>
        <p className="mb-4 max-w-2xl text-paragraph-lg text-text-sub-600">A looping video, a photo or a slideshow, five layouts, three typefaces, any colour, light or dark. Try it: the TV, the preview and the guest page all show the same design.</p>
        <Playground />
      </section>

      <section className="flex scroll-mt-24 flex-col gap-8 pt-24" id="why">
        <h2 className={h2}>What’s on the screen is up to you.</h2>
        <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(([t, d], i) => {
            const I = POINT_ICONS[i]
            return (
            <div key={t} className="flex flex-col gap-1.5 border-t border-stroke-soft-200 py-5">
              <span className="mb-2 grid size-9 place-items-center rounded-10 bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-alpha-24"><I className="size-5" /></span>
              <h3 className="text-label-lg text-text-strong-950">{t}</h3>
              <p className="text-paragraph-sm text-text-sub-600">{d}</p>
            </div>
            )
          })}
        </div>
      </section>

      <Card className="fancy fancy-ink bg-bg-strong-950 shadow-float relative mt-24 mb-16 flex flex-col items-center gap-3 overflow-hidden px-8 py-16 text-center">
        <div aria-hidden className="absolute -bottom-40 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-orange-500/35 blur-[100px]" />
        <h2 className="max-w-2xl text-title-h4 tracking-tight text-static-white md:text-title-h3">Stop answering the same questions every stay.</h2>
        <Button size="lg" className="mt-3" onClick={() => setAuth('signup')}>Create your screen <RiArrowRightLine className="relative z-10 -mr-1 size-4" /></Button>
        <span className="text-paragraph-sm text-static-white/60">Takes about ten minutes.</span>
      </Card>

      <footer className="flex flex-wrap justify-between gap-2 border-t border-stroke-soft-200 pt-6 text-paragraph-sm text-text-soft-400">
        <span>Stayboard · Fire TV app on Vega OS · Amazon Bedrock Nova 2 Lite · Cloudflare Workers</span>
        <span>Built for the Amazon Developer Hackathon 2026</span>
      </footer>
      </div>

      <Auth mode={auth} onMode={setAuth} onClose={() => setAuth(null)} next={next} initialError={initialError} />
    </div>
  )
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&q=70`
type Look = { name: string; layout: Design['layout']; font: Design['font']; accent: string; theme: 'dark' | 'light'; tileStyle: Design['tileStyle']; radius: Design['radius']; backdrop: Partial<Design['backdrop']> }
// ponytail: demo media hotlinked from Mixkit/Unsplash; copy to R2 if either ever breaks the links.
const LOOKS: Look[] = [
  { name: 'Coastal', layout: 'poster', font: 'grotesk', accent: '#2f8fb5', theme: 'dark', tileStyle: 'glass', radius: 'pill', backdrop: { kind: 'video', video: 'https://assets.mixkit.co/videos/1164/1164-720.mp4', poster: U('1499793983690-e29da59ef1c2'), overlay: 35 } },
  { name: 'Terracotta', layout: 'hero', font: 'serif', accent: '#c2562e', theme: 'dark', tileStyle: 'glass', radius: 'rounded', backdrop: { kind: 'photo', photos: [PHOTO], overlay: 50 } },
  { name: 'Tropical', layout: 'split', font: 'sans', accent: '#14a38b', theme: 'dark', tileStyle: 'solid', radius: 'pill', backdrop: { kind: 'slideshow', photos: [U('1499793983690-e29da59ef1c2'), U('1512917774080-9991f1c4c750'), U('1505693416388-ac5ce068fe85')], overlay: 70, interval: 5 } },
  { name: 'Scandi', layout: 'centered', font: 'sans', accent: '#3d6b4f', theme: 'light', tileStyle: 'solid', radius: 'sharp', backdrop: { kind: 'photo', photos: [U('1522708323590-d24dbb6b0267')], overlay: 60 } },
  { name: 'Midnight', layout: 'minimal', font: 'grotesk', accent: '#8b5cf6', theme: 'dark', tileStyle: 'outline', radius: 'rounded', backdrop: { kind: 'color' } },
]
const MEDIA = Object.fromEntries(LOOKS.map((l) => [l.backdrop.kind, l.backdrop])) as Record<Design['backdrop']['kind'], Partial<Design['backdrop']>>
const LAYOUT_NAMES: [Design['layout'], string][] = [['hero', 'Hero'], ['centered', 'Centered'], ['split', 'Split'], ['poster', 'Poster'], ['minimal', 'Minimal']]
const SWATCHES = ['#c2562e', '#2f8fb5', '#14a38b', '#3d6b4f', '#8b5cf6', '#d4a017']

const wear = (look: Look) => (c: PropertyConfig) => {
  const { name: _, accent, theme, backdrop, ...design } = look
  return patchBackdrop(backdrop)(patchAppearance({ accent, theme })(patchDesign(design)(c)))
}

/** Landing "try it" studio: pick a look, then change any part of it. Same TvPreview the dashboard uses. */
function Playground() {
  const [c, setC] = useState(() => wear(LOOKS[0])(demo('poster')))
  const [look, setLook] = useState(LOOKS[0].name)
  const set = (f: (c: PropertyConfig) => PropertyConfig) => { setC(f); setLook('') }
  const d = c.design
  const label = 'text-label-xs tracking-[0.08em] text-text-soft-400 uppercase'
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-4">
        <TvPreview config={c} focus="ask" frame />
        <div className="grid grid-cols-5 gap-2 md:gap-3" role="radiogroup" aria-label="Layout">
          {LAYOUT_NAMES.map(([k, n]) => (
            <button key={k} type="button" role="radio" aria-checked={d.layout === k} onClick={() => set(patchDesign({ layout: k }))}
              className={cn('flex min-w-0 flex-col gap-1.5 rounded-xl p-1 text-center transition', d.layout === k ? 'ring-2 ring-primary-base' : 'opacity-70 ring-1 ring-stroke-soft-200 hover:opacity-100')}>
              <span className="tv-thumb block [container-type:inline-size]"><TvPreview config={patchDesign({ layout: k })(c)} still /></span>
              <span className="pb-1 text-label-xs text-text-sub-600">{n}</span>
            </button>
          ))}
        </div>
      </div>

      <Card className="flex flex-col gap-5 self-start p-5">
        <div className="flex flex-col gap-2">
          <span className={label}>Start from a look</span>
          <div className="flex flex-wrap gap-2">
            {LOOKS.map((l) => (
              <button key={l.name} type="button" aria-pressed={look === l.name} onClick={() => { setC(wear(l)); setLook(l.name) }}
                className={cn('flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-label-sm transition', look === l.name ? 'bg-bg-strong-950 text-static-white' : 'bg-bg-weak-50 text-text-sub-600 hover:text-text-strong-950')}>
                <i className="size-5 rounded-full ring-2 ring-white/60" style={{ background: l.accent }} />{l.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className={label}>Backdrop</span>
          <Segmented value={d.backdrop.kind} options={[['video', 'Video'], ['photo', 'Photo'], ['slideshow', 'Slides'], ['color', 'Colour']]} onChange={(kind) => set(patchBackdrop({ ...MEDIA[kind], kind }))} />
        </div>
        <div className="flex flex-col gap-2">
          <span className={label}>Colour</span>
          <div className="flex flex-wrap items-center gap-2">
            {SWATCHES.map((s) => (
              <button key={s} type="button" aria-label={`Accent ${s}`} aria-pressed={c.appearance.accent === s} onClick={() => set(patchAppearance({ accent: s }))}
                className={cn('size-8 rounded-full transition', c.appearance.accent === s ? 'ring-2 ring-primary-base ring-offset-2' : 'hover:scale-110')} style={{ background: s }} />
            ))}
            <input type="color" aria-label="Custom accent" value={c.appearance.accent} onChange={(e) => set(patchAppearance({ accent: e.target.value }))} className="size-8 cursor-pointer rounded-full bg-bg-white-0 p-0.5 ring-1 ring-inset ring-stroke-soft-200" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className={label}>Mode</span>
          <Segmented value={c.appearance.theme} options={[['dark', 'Dark'], ['light', 'Light']]} onChange={(theme) => set(patchAppearance({ theme }))} />
        </div>
        <div className="flex flex-col gap-2">
          <span className={label}>Typeface</span>
          <Segmented value={d.font} options={[['sans', 'Inter'], ['serif', 'Fraunces'], ['grotesk', 'Grotesk']]} onChange={(font) => set(patchDesign({ font }))} />
        </div>
        <div className="flex flex-col gap-2">
          <span className={label}>Tiles</span>
          <Segmented value={d.tileStyle} options={[['glass', 'Glass'], ['solid', 'Solid'], ['outline', 'Outline']]} onChange={(tileStyle) => set(patchDesign({ tileStyle }))} />
          <Segmented value={d.radius} options={[['sharp', 'Sharp'], ['rounded', 'Rounded'], ['pill', 'Pill']]} onChange={(radius) => set(patchDesign({ radius }))} />
        </div>
      </Card>
    </div>
  )
}
