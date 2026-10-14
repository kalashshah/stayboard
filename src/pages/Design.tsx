// The Design tab: backdrop media, music, layout, type, tiles and details. Every change goes through `set('design', …)`.
import { useRef, useState } from 'react'
import { ICONS, tileSub, TILE_DEFAULTS, type Design, type Font, type IconKey, type PropertyConfig, type Tile } from '../api'
import { dropIndex, patchAppearance, patchBackdrop, patchDesign, patchMusic, resolveMove } from '../design'
import { Field, Segmented, Slider, Text, Toggle } from '../components/Fields'
import { FONT_STACK } from '../components/Preview'
import { Upload } from '../components/Upload'

type Props = { id: string; c: PropertyConfig; update: (patch: (c: PropertyConfig) => PropertyConfig) => void }

const LAYOUT_INFO: [Design['layout'], string, string][] = [
  ['hero', 'Hero', 'Headline bottom-left, tiles along the bottom.'],
  ['centered', 'Centered', 'Everything centered, calm and symmetrical.'],
  ['split', 'Split', 'Text on the left, your photo or video on the right.'],
  ['poster', 'Poster', 'Full-bleed media, big headline, compact tiles.'],
  ['minimal', 'Minimal', 'Just a small headline and the tiles.'],
]
const FONT_INFO: [Font, string, string][] = [['sans', 'Inter', 'Clean and modern'], ['serif', 'Fraunces', 'Warm and editorial'], ['grotesk', 'Space Grotesk', 'Techy and friendly']]

export function DesignTab({ id, c, update }: Props) {
  const d = c.design
  // Functional patches: an upload that finishes after the host changed the layout must not revert the layout.
  const sd = (patch: Partial<Design>) => update(patchDesign(patch))
  const bd = (patch: Partial<Design['backdrop']>) => update(patchBackdrop(patch))
  const md = (patch: Partial<Design['music']>) => update(patchMusic(patch))
  const ad = (patch: Partial<PropertyConfig['appearance']>) => update(patchAppearance(patch))
  const b = d.backdrop
  const hasMedia = b.kind !== 'color'
  return (
    <div className="stack design">
      <section className="card stack">
        <Head title="Backdrop" hint="What plays behind everything on the TV." />
        <Segmented value={b.kind} options={[['color', 'Color'], ['photo', 'Photo'], ['slideshow', 'Slideshow'], ['video', 'Video']]} onChange={(kind) => bd({ kind })} />
        {b.kind === 'photo' && (
          <Upload id={id} kind="image" label="Background photo" value={b.photos[0] ?? ''} onChange={(u) => bd({ photos: u ? [u, ...b.photos.slice(1)] : b.photos.slice(1) })} />
        )}
        {b.kind === 'slideshow' && (
          <>
            {b.photos.length > 0 && (
              <div className="photo-strip">
                {b.photos.map((u, i) => (
                  <div className="photo-thumb" key={`${u}${i}`}>
                    <img src={u} alt="" />
                    <button type="button" className="btn danger sm icon" title="Remove" onClick={() => bd({ photos: b.photos.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
              </div>
            )}
            {b.photos.length < 8 ? (
              <Upload id={id} kind="image" compact label={`Add photo (${b.photos.length}/8)`} value="" onChange={(u) => u && bd({ photos: [...b.photos, u] })} />
            ) : <p className="muted small">Eight photos is the limit. Remove one to add another.</p>}
            <Field label="Seconds per photo"><Slider value={b.interval} min={5} max={60} onChange={(interval) => bd({ interval })} suffix=" s" /></Field>
          </>
        )}
        {b.kind === 'video' && (
          <>
            <Upload id={id} kind="video" label="Background video" value={b.video} poster={b.poster} onChange={(u, x) => bd({ video: u, poster: x?.poster ?? (u ? b.poster : '') })} />
            <p className="muted small">Plays muted on a loop. 1080p looks best; keep it under 40 MB and around 15–30 seconds. A still of the first frame is captured for the phone page.</p>
            {b.video && !b.poster && (
              <Upload id={id} kind="image" compact label="Poster frame (optional)" value={b.poster} onChange={(u) => bd({ poster: u })} />
            )}
          </>
        )}
        {hasMedia && (
          <div className="cols">
            <Field label="Darken" hint="Keeps the text readable over bright media."><Slider value={b.overlay} min={0} max={100} onChange={(overlay) => bd({ overlay })} suffix="%" /></Field>
            <Field label="Blur"><Slider value={b.blur} min={0} max={20} onChange={(blur) => bd({ blur })} suffix=" px" /></Field>
          </div>
        )}
      </section>

      <section className="card stack">
        <Head title="Music" hint="A track that loops softly on the TV. Never plays on the phone page." />
        <Toggle on={d.music.enabled} label="Play music on the TV" onChange={(enabled) => md({ enabled })} />
        {d.music.enabled && (
          <>
            <Upload id={id} kind="audio" label="Track" value={d.music.url} onChange={(url) => md({ url })} />
            <Field label="Volume"><Slider value={d.music.volume} min={0} max={100} onChange={(volume) => md({ volume })} suffix="%" /></Field>
          </>
        )}
      </section>

      <section className="card stack">
        <Head title="Layout" hint="Where the headline, media and tiles sit. Every layout keeps the remote's left-right navigation." />
        <div className="presets">
          {LAYOUT_INFO.map(([k, name, blurb]) => (
            <button key={k} type="button" className={`preset ${d.layout === k ? 'on' : ''}`} onClick={() => sd({ layout: k })}>
              <Wire layout={k} />
              <strong>{name}</strong>
              <span className="muted small">{blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card stack">
        <Head title="Type" hint="Fonts are bundled in the TV app, so what you pick here is what guests see." />
        <div className="fonts">
          {FONT_INFO.map(([k, name, blurb]) => (
            <button key={k} type="button" className={`fontcard ${d.font === k ? 'on' : ''}`} style={{ fontFamily: FONT_STACK[k] }} onClick={() => sd({ font: k })}>
              <span className="fontcard-sample">Welcome, Sam</span>
              <strong>{name}</strong>
              <span className="muted small">{blurb}</span>
            </button>
          ))}
        </div>
        <div className="cols">
          <Field label="Headline size"><Segmented value={d.headlineSize} options={[['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']]} onChange={(headlineSize) => sd({ headlineSize })} /></Field>
          <Field label="Alignment"><Segmented value={d.align} options={[['left', 'Left'], ['center', 'Center']]} onChange={(align) => sd({ align })} /></Field>
        </div>
      </section>

      <section className="card stack">
        <Head title="Tiles" hint="Drag to reorder. Rename, swap the icon, or switch a tile off." />
        <TileSorter c={c} tiles={d.tiles} onChange={(tiles) => sd({ tiles })} />
      </section>

      <section className="card stack">
        <Head title="Details" hint="Colour, theme, tile shape, logo." />
        <div className="cols">
          <Field label="Accent color">
            <div className="row">
              <input type="color" className="swatch" value={c.appearance.accent} onChange={(e) => ad({ accent: e.target.value })} />
              <Text value={c.appearance.accent} maxLength={7} onChange={(v) => ad({ accent: v })} />
            </div>
          </Field>
          <Field label="Theme"><Segmented value={c.appearance.theme} options={[['dark', 'Dark'], ['light', 'Light']]} onChange={(theme) => ad({ theme })} /></Field>
          <Field label="Tile style"><Segmented value={d.tileStyle} options={[['glass', 'Glass'], ['solid', 'Solid'], ['outline', 'Outline']]} onChange={(tileStyle) => sd({ tileStyle })} /></Field>
          <Field label="Corners"><Segmented value={d.radius} options={[['sharp', 'Sharp'], ['rounded', 'Rounded'], ['pill', 'Pill']]} onChange={(radius) => sd({ radius })} /></Field>
        </div>
        <Upload id={id} kind="image" compact label="Logo (replaces the property name)" value={d.logo} onChange={(logo) => sd({ logo })} />
        <div className="row" style={{ gap: 24 }}>
          <Toggle on={d.showClock} label="Show the clock" onChange={(showClock) => sd({ showClock })} />
          <Toggle on={d.showFooter} label="Show the footer" onChange={(showFooter) => sd({ showFooter })} />
        </div>
      </section>
    </div>
  )
}

const Head = ({ title, hint }: { title: string; hint: string }) => (
  <div>
    <h3>{title}</h3>
    <p className="muted small">{hint}</p>
  </div>
)

/** Tiny wireframe of a layout preset. */
function Wire({ layout }: { layout: Design['layout'] }) {
  const t = 'currentColor'
  const tiles = (y: number, h: number, n = 5) => Array.from({ length: n }, (_, i) => <rect key={i} x={6 + i * 11.2} y={y} width={9} height={h} rx={1.2} fill={t} opacity={i === 0 ? 0.9 : 0.35} />)
  return (
    <svg className="wire" viewBox="0 0 64 36" aria-hidden="true">
      <rect x="0.5" y="0.5" width="63" height="35" rx="3" fill="none" stroke={t} opacity="0.35" />
      {layout === 'hero' && <>{<rect x="6" y="14" width="24" height="4" rx="1" fill={t} />}<rect x="6" y="20" width="18" height="1.5" fill={t} opacity="0.4" />{tiles(25, 6)}</>}
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
    <div className="stack" style={{ gap: 8 }} ref={list}>
      {tiles.map((t, i) => (
        <div key={t.key} className={`tilecard ${drag && drag.to === i && drag.from !== i ? 'over' : ''} ${drag?.from === i ? 'lifting' : ''} ${t.visible ? '' : 'off'}`}>
          <span className="grip" title="Drag to reorder" {...grip(i)}>⋮⋮</span>
          <IconPicker value={t.icon} onChange={(icon) => patch(i, { icon })} />
          <input className="input" aria-label="Tile label" value={t.label} maxLength={24} placeholder={TILE_DEFAULTS[t.key].label} onChange={(e) => patch(i, { label: e.target.value })} />
          <input className="input" aria-label="Tile subtitle" value={t.sub} maxLength={40} placeholder={tileSub(auto, t.key)} onChange={(e) => patch(i, { sub: e.target.value })} />
          <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
            <button type="button" className="btn ghost sm icon" title="Move up" onClick={() => move(i, i - 1)} disabled={i === 0}>↑</button>
            <button type="button" className="btn ghost sm icon" title="Move down" onClick={() => move(i, i + 1)} disabled={i === tiles.length - 1}>↓</button>
            <Toggle on={t.visible} onChange={(visible) => patch(i, { visible })} />
          </div>
        </div>
      ))}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: IconKey; onChange: (k: IconKey) => void }) {
  const ref = useRef<HTMLDetailsElement>(null)
  return (
    <details className="iconpick" ref={ref}>
      <summary title="Change icon">{ICONS[value]}</summary>
      <div className="icongrid">
        {(Object.keys(ICONS) as IconKey[]).map((k) => (
          <button key={k} type="button" className={k === value ? 'on' : ''} title={k} onClick={() => { onChange(k); ref.current?.removeAttribute('open') }}>{ICONS[k]}</button>
        ))}
      </div>
    </details>
  )
}
