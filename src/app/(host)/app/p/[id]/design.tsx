'use client'

// The design studio: backdrop media, music, layout, type, tiles and details. Every change goes through a functional patch.
import { RiArrowDownLine, RiArrowUpLine, RiCloseLine, RiDraggable } from '@remixicon/react'
import { useRef, useState } from 'react'
import { ICONS, tileSub, TILE_DEFAULTS, type Design, type Font, type IconKey, type PropertyConfig, type Tile } from '@/api'
import { dropIndex, FONT_STACK, patchAppearance, patchBackdrop, patchDesign, patchMusic, resolveMove } from '@/design'
import { Field, Head, Segmented, Slider, Text, Toggle } from '@/components/Fields'
import { Upload } from '@/components/Upload'
import { Card } from '@/components/ui/card'
import * as CompactButton from '@/components/ui/compact-button'
import { Input } from '@/components/ui/input'
import * as Switch from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type Props = { id: string; c: PropertyConfig; update: (patch: (c: PropertyConfig) => PropertyConfig) => void }

const LAYOUT_INFO: [Design['layout'], string, string][] = [
  ['hero', 'Hero', 'Headline bottom-left, tiles along the bottom.'],
  ['centered', 'Centered', 'Everything centered and symmetrical.'],
  ['split', 'Split', 'Text on the left, your photo or video on the right.'],
  ['poster', 'Poster', 'Full-bleed media, big headline, compact tiles.'],
  ['minimal', 'Minimal', 'Just a small headline and the tiles.'],
]
const FONT_INFO: [Font, string, string][] = [['sans', 'Inter', 'Clean and modern'], ['serif', 'Fraunces', 'Warm and editorial'], ['grotesk', 'Space Grotesk', 'Techy and friendly']]

/** A selectable card (layout preset, font): AlignUI's radio-card look, ring-2 on the chosen one. */
export const choice = (on: boolean) => cn(
  'flex flex-col gap-1.5 rounded-xl bg-bg-white-0 p-3 text-left transition duration-200 ease-out',
  on ? 'ring-2 ring-primary-base' : 'ring-1 ring-inset ring-stroke-soft-200 hover:bg-bg-weak-50',
)

export function DesignTab({ id, c, update }: Props) {
  const d = c.design
  // Functional patches: an upload that finishes after the host changed the layout must not revert the layout.
  const sd = (patch: Partial<Design>) => update(patchDesign(patch))
  const bd = (patch: Partial<Design['backdrop']>) => update(patchBackdrop(patch))
  const md = (patch: Partial<Design['music']>) => update(patchMusic(patch))
  const ad = (patch: Partial<PropertyConfig['appearance']>) => update(patchAppearance(patch))
  const b = d.backdrop
  const section = 'flex flex-col gap-4'
  return (
    <div className="flex flex-col gap-4">
      <Card className={section}>
        <Head title="Backdrop" hint="What plays behind everything on the TV." />
        <Segmented value={b.kind} options={[['color', 'Color'], ['photo', 'Photo'], ['slideshow', 'Slideshow'], ['video', 'Video']]} onChange={(kind) => bd({ kind })} />
        {b.kind === 'photo' && (
          <Upload id={id} kind="image" label="Background photo" value={b.photos[0] ?? ''} onChange={(u) => bd({ photos: u ? [u, ...b.photos.slice(1)] : b.photos.slice(1) })} />
        )}
        {b.kind === 'slideshow' && (
          <>
            {b.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {b.photos.map((u, i) => (
                  <div className="relative w-[120px]" key={`${u}${i}`}>
                    <img src={u} alt="" className="aspect-[16/10] w-full rounded-lg object-cover ring-1 ring-inset ring-stroke-soft-200" />
                    <CompactButton.Root variant="white" fullRadius className="absolute top-1 right-1" title="Remove" aria-label="Remove photo" onClick={() => bd({ photos: b.photos.filter((_, j) => j !== i) })}>
                      <CompactButton.Icon as={RiCloseLine} />
                    </CompactButton.Root>
                  </div>
                ))}
              </div>
            )}
            {b.photos.length < 8
              ? <Upload id={id} kind="image" compact label={`Add photo (${b.photos.length}/8)`} value="" onChange={(u) => u && bd({ photos: [...b.photos, u] })} />
              : <p className="text-paragraph-sm text-text-sub-600">Eight photos is the limit. Remove one to add another.</p>}
            <Field group label="Seconds per photo"><Slider label="Seconds per photo" value={b.interval} min={5} max={60} onChange={(interval) => bd({ interval })} suffix=" s" /></Field>
          </>
        )}
        {b.kind === 'video' && (
          <>
            <Upload id={id} kind="video" label="Background video" value={b.video} poster={b.poster} onChange={(u, x) => bd({ video: u, poster: x?.poster ?? (u ? b.poster : '') })} />
            <p className="text-paragraph-xs text-text-sub-600">Plays muted on a loop. 1080p looks best; keep it under 40 MB and around 15–30 seconds. A still of the first frame is captured for the phone page.</p>
            {b.video && !b.poster && (
              <Upload id={id} kind="image" compact label="Poster frame (optional)" value={b.poster} onChange={(u) => bd({ poster: u })} />
            )}
          </>
        )}
        {b.kind !== 'color' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field group label="Darken" hint="Keeps the text readable over bright media."><Slider label="Darken" value={b.overlay} min={0} max={100} onChange={(overlay) => bd({ overlay })} suffix="%" /></Field>
            <Field group label="Blur"><Slider label="Blur" value={b.blur} min={0} max={20} onChange={(blur) => bd({ blur })} suffix=" px" /></Field>
          </div>
        )}
      </Card>

      <Card className={section}>
        <Head title="Music" hint="A track that loops softly on the TV. Never plays on the phone page." action={<Switch.Root checked={d.music.enabled} onCheckedChange={(enabled) => md({ enabled })} aria-label="Play music on the TV" />} />
        {d.music.enabled && (
          <>
            <Upload id={id} kind="audio" label="Track" value={d.music.url} onChange={(url) => md({ url })} />
            <Field group label="Volume"><Slider label="Volume" value={d.music.volume} min={0} max={100} onChange={(volume) => md({ volume })} suffix="%" /></Field>
          </>
        )}
      </Card>

      <Card className={section}>
        <Head title="Layout" hint="Where the headline, media and tiles sit. Every layout keeps the remote's left-right navigation." />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5" role="radiogroup" aria-label="Layout">
          {LAYOUT_INFO.map(([k, name, blurb]) => (
            <button key={k} type="button" role="radio" aria-checked={d.layout === k} className={choice(d.layout === k)} onClick={() => sd({ layout: k })}>
              <Wire layout={k} on={d.layout === k} />
              <strong className="text-label-sm text-text-strong-950">{name}</strong>
              <span className="text-paragraph-xs text-text-sub-600">{blurb}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className={section}>
        <Head title="Type" hint="Fonts are bundled in the TV app, so what you pick here is what guests see." />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Font">
          {FONT_INFO.map(([k, name, blurb]) => (
            <button key={k} type="button" role="radio" aria-checked={d.font === k} className={cn(choice(d.font === k), 'p-4')} onClick={() => sd({ font: k })}>
              <span className="mb-1.5 text-[26px] leading-tight tracking-tight text-text-strong-950" style={{ fontFamily: FONT_STACK[k] }}>Welcome, Sam</span>
              <strong className="text-label-sm text-text-strong-950">{name}</strong>
              <span className="text-paragraph-xs text-text-sub-600">{blurb}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field group label="Headline size"><Segmented value={d.headlineSize} options={[['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']]} onChange={(headlineSize) => sd({ headlineSize })} /></Field>
          <Field group label="Alignment"><Segmented value={d.align} options={[['left', 'Left'], ['center', 'Center']]} onChange={(align) => sd({ align })} /></Field>
        </div>
      </Card>

      <Card className={section}>
        <Head title="Tiles" hint="Drag to reorder. Rename, swap the icon, or switch a tile off." />
        <TileSorter c={c} tiles={d.tiles} onChange={(tiles) => sd({ tiles })} />
      </Card>

      <Card className={section}>
        <Head title="Details" hint="Colour, theme, tile shape, logo." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field group label="Accent color">
            <div className="flex gap-2">
              <input type="color" aria-label="Accent color" className="h-10 w-11 shrink-0 cursor-pointer rounded-10 bg-bg-white-0 p-1 ring-1 ring-inset ring-stroke-soft-200" value={c.appearance.accent} onChange={(e) => ad({ accent: e.target.value })} />
              <Text value={c.appearance.accent} maxLength={7} className="font-mono" onChange={(v) => ad({ accent: v })} />
            </div>
          </Field>
          <Field group label="Theme"><Segmented value={c.appearance.theme} options={[['dark', 'Dark'], ['light', 'Light']]} onChange={(theme) => ad({ theme })} /></Field>
          <Field group label="Tile style"><Segmented value={d.tileStyle} options={[['glass', 'Glass'], ['solid', 'Solid'], ['outline', 'Outline']]} onChange={(tileStyle) => sd({ tileStyle })} /></Field>
          <Field group label="Corners"><Segmented value={d.radius} options={[['sharp', 'Sharp'], ['rounded', 'Rounded'], ['pill', 'Pill']]} onChange={(radius) => sd({ radius })} /></Field>
        </div>
        <Upload id={id} kind="image" compact label="Logo (replaces the property name)" value={d.logo} onChange={(logo) => sd({ logo })} />
        <div className="flex flex-wrap gap-6">
          <Toggle on={d.showClock} label="Show the clock" onChange={(showClock) => sd({ showClock })} />
          <Toggle on={d.showFooter} label="Show the footer" onChange={(showFooter) => sd({ showFooter })} />
        </div>
      </Card>
    </div>
  )
}

/** Tiny wireframe of a layout preset. */
function Wire({ layout, on }: { layout: Design['layout']; on: boolean }) {
  const t = 'currentColor'
  const tiles = (y: number, h: number, n = 5) => Array.from({ length: n }, (_, i) => <rect key={i} x={6 + i * 11.2} y={y} width={9} height={h} rx={1.2} fill={t} opacity={i === 0 ? 0.9 : 0.35} />)
  return (
    <svg className={cn('h-auto w-full rounded-lg bg-bg-weak-50 p-1.5', on ? 'text-marker' : 'text-text-strong-950')} viewBox="0 0 64 36" aria-hidden="true">
      <rect x="0.5" y="0.5" width="63" height="35" rx="3" fill="none" stroke={t} opacity="0.35" />
      {layout === 'hero' && <><rect x="6" y="14" width="24" height="4" rx="1" fill={t} /><rect x="6" y="20" width="18" height="1.5" fill={t} opacity="0.4" />{tiles(25, 6)}</>}
      {layout === 'centered' && <><rect x="20" y="11" width="24" height="4" rx="1" fill={t} /><rect x="24" y="17" width="16" height="1.5" fill={t} opacity="0.4" />{tiles(25, 6)}</>}
      {layout === 'split' && <><rect x="6" y="11" width="20" height="4" rx="1" fill={t} /><rect x="6" y="17" width="14" height="1.5" fill={t} opacity="0.4" /><rect x="36" y="6" width="22" height="15" rx="2" fill={t} opacity="0.3" />{tiles(25, 6)}</>}
      {layout === 'poster' && <><rect x="2" y="2" width="60" height="32" rx="2" fill={t} opacity="0.15" /><rect x="6" y="16" width="30" height="6" rx="1" fill={t} /><rect x="6" y="24" width="18" height="1.5" fill={t} opacity="0.4" />{tiles(28, 4)}</>}
      {layout === 'minimal' && <><rect x="6" y="6" width="18" height="3" rx="1" fill={t} />{tiles(15, 7)}</>}
    </svg>
  )
}

/** Drag by the grip (pointer events, so mouse and touch both work); ↑↓ buttons for keyboards. */
function TileSorter({ c, tiles, onChange }: { c: PropertyConfig; tiles: Tile[]; onChange: (t: Tile[]) => void }) {
  const list = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ from: number; to: number } | null>(null) // the truth; pointerup can arrive before React re-renders a move
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null) // for styling only
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= tiles.length) return
    const next = [...tiles]
    const [it] = next.splice(from, 1)
    next.splice(to, 0, it)
    onChange(next)
  }
  const patch = (i: number, p: Partial<Tile>) => onChange(tiles.map((t, j) => (j === i ? { ...t, ...p } : t)))
  const auto = { ...c, design: { ...c.design, tiles: c.design.tiles.map((x) => ({ ...x, sub: '' })) } }
  const indexAt = (y: number) => {
    const cards = Array.from(list.current?.children ?? []) as HTMLElement[]
    return dropIndex(cards.map((el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 }), y)
  }
  const grip = (i: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = { from: i, to: i }
      setDrag(dragRef.current)
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const d = dragRef.current
      if (!d) return
      const to = indexAt(e.clientY)
      if (to !== d.to) { dragRef.current = { from: d.from, to }; setDrag(dragRef.current) }
    },
    onPointerUp: () => {
      const d = dragRef.current
      dragRef.current = null
      setDrag(null)
      if (d) move(d.from, resolveMove(d.from, d.to, tiles.length))
    },
    onPointerCancel: () => { dragRef.current = null; setDrag(null) },
  })
  return (
    <div className="flex flex-col gap-2" ref={list}>
      {tiles.map((t, i) => (
        <div key={t.key} className={cn(
          'grid grid-cols-[20px_40px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl bg-bg-white-0 px-3 py-2.5 ring-1 ring-inset ring-stroke-soft-200 transition duration-200 sm:grid-cols-[20px_40px_minmax(0,1.1fr)_minmax(0,1.4fr)_auto]',
          drag && drag.to === i && drag.from !== i && 'bg-marker-soft/50 ring-2 ring-marker',
          drag?.from === i && 'opacity-50',
          !t.visible && 'opacity-55',
        )}>
          <span className="cursor-grab touch-none text-text-soft-400 active:cursor-grabbing" title="Drag to reorder" {...grip(i)}><RiDraggable className="size-5" /></span>
          <IconPicker value={t.icon} onChange={(icon) => patch(i, { icon })} />
          <Input aria-label="Tile label" value={t.label} maxLength={24} placeholder={TILE_DEFAULTS[t.key].label} onChange={(e) => patch(i, { label: e.target.value })} />
          <Input aria-label="Tile subtitle" className="col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto" value={t.sub} maxLength={40} placeholder={tileSub(auto, t.key)} onChange={(e) => patch(i, { sub: e.target.value })} />
          <div className="flex items-center gap-1">
            <CompactButton.Root variant="ghost" title="Move up" aria-label="Move up" onClick={() => move(i, i - 1)} disabled={i === 0}><CompactButton.Icon as={RiArrowUpLine} /></CompactButton.Root>
            <CompactButton.Root variant="ghost" title="Move down" aria-label="Move down" onClick={() => move(i, i + 1)} disabled={i === tiles.length - 1}><CompactButton.Icon as={RiArrowDownLine} /></CompactButton.Root>
            <Switch.Root className="ml-1" checked={t.visible} onCheckedChange={(visible) => patch(i, { visible })} aria-label={`Show ${t.label || TILE_DEFAULTS[t.key].label}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: IconKey; onChange: (k: IconKey) => void }) {
  const ref = useRef<HTMLDetailsElement>(null)
  return (
    <details className="relative" ref={ref}>
      <summary title="Change icon" className="grid size-10 cursor-pointer list-none place-items-center rounded-10 bg-bg-weak-50 text-xl ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-white-0 [&::-webkit-details-marker]:hidden">{ICONS[value]}</summary>
      <div className="absolute top-12 left-0 z-30 grid grid-cols-7 gap-1 rounded-xl bg-bg-white-0 p-2 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
        {(Object.keys(ICONS) as IconKey[]).map((k) => (
          <button key={k} type="button" title={k} className={cn('grid size-9 place-items-center rounded-lg text-lg hover:bg-bg-weak-50', k === value && 'ring-2 ring-primary-base')}
            onClick={() => { onChange(k); ref.current?.removeAttribute('open') }}>{ICONS[k]}</button>
        ))}
      </div>
    </details>
  )
}
