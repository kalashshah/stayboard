// Mirror of worker/config.ts (the TV project has its own build root). Keep the helper bodies identical.
export const TILE_KEYS = ['wifi', 'checkout', 'rules', 'guide', 'places', 'contacts', 'ask'] as const
export type TileKey = (typeof TILE_KEYS)[number]
export type Font = 'sans' | 'serif' | 'grotesk'

export const ICONS = { wifi: '◠', clock: '◷', list: '☰', book: '▤', pin: '◎', phone: '✆', ask: '?', star: '★', heat: '♨', coffee: '☕', flag: '⚑', mail: '✉', home: '⌂', spark: '✦' } as const
export type IconKey = keyof typeof ICONS

export type Tile = { key: TileKey; label: string; sub: string; icon: IconKey; visible: boolean }
export type Design = {
  layout: 'hero' | 'centered' | 'split' | 'poster' | 'minimal'
  font: Font
  headlineSize: 'sm' | 'md' | 'lg'
  align: 'left' | 'center'
  backdrop: { kind: 'color' | 'photo' | 'slideshow' | 'video'; photos: string[]; video: string; poster: string; overlay: number; blur: number; interval: number }
  music: { enabled: boolean; url: string; volume: number }
  logo: string
  tileStyle: 'glass' | 'solid' | 'outline'
  radius: 'sharp' | 'rounded' | 'pill'
  showClock: boolean
  showFooter: boolean
  tiles: Tile[]
}

export type PropertyConfig = {
  name: string
  hostName: string
  welcome: { headline: string; message: string; guestName: string }
  stay: { checkIn: string; checkOut: string; checkoutSteps: string[] }
  wifi: { ssid: string; password: string }
  rules: string[]
  guide: { title: string; body: string }[]
  faqs: { q: string; a: string }[]
  places: { name: string; category: string; note: string; distance: string }[]
  contacts: { label: string; value: string }[]
  appearance: { accent: string; theme: 'dark' | 'light' }
  design: Design
  ask: { enabled: boolean; tone: 'friendly' | 'formal'; fallback: string; suggested: string[] }
}

export type TvState =
  | { paired: false; code: string; pairUrl: string }
  | { paired: true; config: PropertyConfig; updatedAt: number; slug: string; guestUrl: string }

export type Answer = { answered: boolean; answer: string }

export const TILE_DEFAULTS: Record<TileKey, { label: string; icon: IconKey }> = {
  wifi: { label: 'Wi-Fi', icon: 'wifi' }, checkout: { label: 'Checkout', icon: 'clock' }, rules: { label: 'House rules', icon: 'list' },
  guide: { label: 'House guide', icon: 'book' }, places: { label: 'Local picks', icon: 'pin' }, contacts: { label: 'Contacts', icon: 'phone' }, ask: { label: 'Ask the house', icon: 'ask' },
}

export const defaultDesign = (): Design => ({
  layout: 'hero', font: 'sans', headlineSize: 'md', align: 'left',
  backdrop: { kind: 'color', photos: [], video: '', poster: '', overlay: 55, blur: 0, interval: 10 },
  music: { enabled: false, url: '', volume: 40 },
  logo: '', tileStyle: 'glass', radius: 'rounded', showClock: true, showFooter: true,
  tiles: TILE_KEYS.map((key) => ({ key, label: TILE_DEFAULTS[key].label, sub: '', icon: TILE_DEFAULTS[key].icon, visible: true })),
})

/** Legacy configs (no `design`, e.g. an old AsyncStorage cache) get one built from appearance.backgroundUrl / appearance.tiles. */
export function upgradeConfig(raw: unknown): PropertyConfig {
  if (!raw || typeof raw !== 'object' || (raw as { design?: unknown }).design) return raw as PropertyConfig
  const c = raw as Record<string, unknown>
  const a = (c.appearance ?? {}) as Record<string, unknown>
  const d = defaultDesign()
  if (typeof a.backgroundUrl === 'string' && a.backgroundUrl) {
    d.backdrop.kind = 'photo'
    d.backdrop.photos = [a.backgroundUrl]
  }
  const vis = a.tiles as Record<string, boolean> | undefined
  if (vis && typeof vis === 'object') d.tiles = d.tiles.map((t) => ({ ...t, visible: vis[t.key] !== false }))
  const { backgroundUrl: _b, tiles: _t, ...rest } = a
  return { ...c, appearance: rest, design: d } as PropertyConfig
}

/** "Welcome, {guest}" → "Welcome, Sam", or "Welcome" when no guest name is set. Mirrors worker/config.ts. */
export function headlineFor(c: PropertyConfig) {
  const h = c.welcome.headline
  const name = c.welcome.guestName.trim()
  if (!h.includes('{guest}')) return h
  if (name) return h.replace(/\{guest\}/g, name)
  const out = h
    .replace(/\s*[,;:–—-]?\s*\{guest\}\s*[,;:–—-]?\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([!?.])/g, '$1')
    .trim()
  return out ? out[0].toUpperCase() + out.slice(1) : out
}

/** Wi-Fi QR payload phones understand; open networks use nopass. */
export function wifiQr(c: PropertyConfig) {
  const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')
  if (!c.wifi.password) return `WIFI:T:nopass;S:${esc(c.wifi.ssid)};;`
  return `WIFI:T:WPA;S:${esc(c.wifi.ssid)};P:${esc(c.wifi.password)};;`
}

// ---- layout engine (960×540 logical px) ----
export type Layout = {
  topBar: 'full' | 'centered' | 'logo' | 'none'
  hero: 'bottom' | 'middle' | 'top'
  align: 'left' | 'center'
  mediaCard: boolean
  tiles: 'bottom' | 'compact' | 'middle'
  headline: number
  footer: boolean
  scrim: boolean
}
export const HEADLINE = { sm: 34, md: 46, lg: 60 } as const
export const RADIUS = { sharp: 4, rounded: 13, pill: 24 } as const

export function layoutFor(c: PropertyConfig): Layout {
  const d = c.design
  const h = HEADLINE[d.headlineSize]
  switch (d.layout) {
    case 'centered': return { topBar: 'centered', hero: 'middle', align: 'center', mediaCard: false, tiles: 'bottom', headline: h, footer: d.showFooter, scrim: false }
    case 'split': return { topBar: 'full', hero: 'middle', align: d.align, mediaCard: true, tiles: 'bottom', headline: h, footer: d.showFooter, scrim: false }
    case 'poster': return { topBar: 'logo', hero: 'bottom', align: d.align, mediaCard: false, tiles: 'compact', headline: { sm: 46, md: 60, lg: 72 }[d.headlineSize], footer: d.showFooter, scrim: true }
    case 'minimal': return { topBar: 'none', hero: 'top', align: d.align, mediaCard: false, tiles: 'middle', headline: HEADLINE.sm, footer: false, scrim: false }
    default: return { topBar: 'full', hero: 'bottom', align: d.align, mediaCard: false, tiles: 'bottom', headline: h, footer: d.showFooter, scrim: false }
  }
}

export type Backdrop = { kind: 'color' } | { kind: 'photo'; url: string } | { kind: 'slideshow'; urls: string[] } | { kind: 'video'; url: string; poster: string }

export function backdropFor(c: PropertyConfig): Backdrop {
  const b = c.design.backdrop
  if (b.kind === 'video' && b.video) return { kind: 'video', url: b.video, poster: b.poster }
  if (b.kind === 'video' && b.poster) return { kind: 'photo', url: b.poster }
  if (b.kind === 'slideshow' && b.photos.length > 1) return { kind: 'slideshow', urls: b.photos }
  if ((b.kind === 'photo' || b.kind === 'slideshow') && b.photos[0]) return { kind: 'photo', url: b.photos[0] }
  return { kind: 'color' }
}

export function tileSub(c: PropertyConfig, key: TileKey): string {
  const custom = c.design.tiles.find((t) => t.key === key)?.sub
  if (custom) return custom
  switch (key) {
    case 'wifi': return c.wifi.ssid || 'Ask your host'
    case 'checkout': return c.stay.checkOut
    case 'rules': return `${c.rules.length} to know`
    case 'guide': return `${c.guide.length + c.faqs.length} topics`
    case 'places': return `${c.places.length} nearby`
    case 'contacts': return c.contacts[0]?.label ?? 'Reach us'
    case 'ask': return 'Any question'
  }
}

export const visibleTiles = (c: PropertyConfig): Tile[] => c.design.tiles.filter((t) => t.visible && (t.key !== 'ask' || c.ask.enabled))
export const tileLabel = (t: Tile) => t.label || TILE_DEFAULTS[t.key].label

/** Bundled TTFs in assets/fonts; Vega addresses them by file name, and weight needs its own file. */
export const FONT: Record<Font, { regular: string; bold: string }> = {
  sans: { regular: 'Inter-Regular', bold: 'Inter-SemiBold' },
  serif: { regular: 'Fraunces-Regular', bold: 'Fraunces-SemiBold' },
  grotesk: { regular: 'SpaceGrotesk-Regular', bold: 'SpaceGrotesk-SemiBold' },
}
