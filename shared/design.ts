// The property config and the pure helpers that render it. No dependencies: the Worker, the dashboard and the TV all import this file.
export const TILE_KEYS = ['wifi', 'checkout', 'rules', 'guide', 'places', 'contacts', 'ask'] as const
export type TileKey = (typeof TILE_KEYS)[number]

export const LAYOUTS = ['hero', 'centered', 'split', 'poster', 'minimal'] as const
export const FONTS = ['sans', 'serif', 'grotesk'] as const
export type Font = (typeof FONTS)[number]
/** Tile glyphs: plain Unicode so the TV, the web preview and the phone page need no icon font. */
export const ICONS = { wifi: '◠', clock: '◷', list: '☰', book: '▤', pin: '◎', phone: '✆', ask: '?', star: '★', heat: '♨', coffee: '☕', flag: '⚑', mail: '✉', home: '⌂', spark: '✦' } as const
export type IconKey = keyof typeof ICONS

export type Tile = { key: TileKey; label: string; sub: string; icon: IconKey; visible: boolean }
export type Design = {
  layout: (typeof LAYOUTS)[number]
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

/** `id` is set when the question was logged, so the asker can later pick up the host's reply. */
export type Answer = { answered: boolean; answer: string; id?: string }
export type Reply = { id: string; question: string; reply: string; replied_at: number }

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

/** Legacy configs (no `design`: old DB rows, old TV caches) get one built from appearance.backgroundUrl / appearance.tiles. Idempotent. */
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

/** "Welcome, {guest}" → "Welcome, Sam", or "Welcome" when no guest name is set. */
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
  const esc = (s: string) => s.replace(/([\;,:"])/g, '\\$1')
  if (!c.wifi.password) return `WIFI:T:nopass;S:${esc(c.wifi.ssid)};;`
  return `WIFI:T:WPA;S:${esc(c.wifi.ssid)};P:${esc(c.wifi.password)};;`
}

// ---- layout engine: numbers the TV (960×540 logical px) and the web preview (cqw) both use ----
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

/** What to actually draw: empty media falls back to the next best thing, never to a blank screen. */
export function backdropFor(c: PropertyConfig): Backdrop {
  const b = c.design.backdrop
  if (b.kind === 'video' && b.video) return { kind: 'video', url: b.video, poster: b.poster }
  if (b.kind === 'video' && b.poster) return { kind: 'photo', url: b.poster }
  if (b.kind === 'slideshow' && b.photos.length > 1) return { kind: 'slideshow', urls: b.photos }
  if ((b.kind === 'photo' || b.kind === 'slideshow') && b.photos[0]) return { kind: 'photo', url: b.photos[0] }
  return { kind: 'color' }
}

/** Tile subtitle: the host's custom one, else something live from the content. */
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
/** A tile with its label cleared shows the stock label rather than nothing. */
export const tileLabel = (t: Tile) => t.label || TILE_DEFAULTS[t.key].label

export function defaultConfig(name: string): PropertyConfig {
  return {
    name,
    hostName: 'Your host',
    welcome: {
      headline: 'Welcome, {guest}',
      message: 'Make yourself at home. Everything you need for your stay is on this screen.',
      guestName: '',
    },
    stay: {
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      checkoutSteps: ['Strip the beds and leave linens in the laundry', 'Load and start the dishwasher', 'Take trash to the bins outside', 'Lock the door and return the key to the lockbox'],
    },
    wifi: { ssid: '', password: '' },
    rules: ['No smoking indoors', 'Quiet hours 10 PM – 8 AM', 'No parties or events', 'Please take shoes off at the door'],
    guide: [
      { title: 'The TV', body: 'Press the Home button on the remote to get to Netflix, Prime Video and the rest. Sign in with your own accounts and sign out before you leave.' },
      { title: 'Heating and cooling', body: 'The thermostat is in the hallway. Tap to wake it, then use the arrows. Please keep it between 65 and 75°F.' },
      { title: 'Trash and recycling', body: 'Bins are on the side of the house. Trash is picked up Tuesday morning, recycling every other Tuesday.' },
    ],
    faqs: [
      { q: 'Where is the first aid kit?', a: 'Under the bathroom sink, next to the extra toilet paper.' },
      { q: 'Can we have guests over?', a: 'Daytime visitors are welcome. Overnight guests beyond the booked number are not allowed.' },
    ],
    places: [
      { name: 'Corner Market', category: 'Groceries', note: 'Open until 10 PM, good coffee at the counter.', distance: '5 min walk' },
      { name: 'Luna Trattoria', category: 'Dinner', note: 'Book ahead on weekends. Try the cacio e pepe.', distance: '10 min walk' },
    ],
    contacts: [
      { label: 'Host', value: 'Text (555) 010-0100' },
      { label: 'Emergency', value: '911' },
    ],
    appearance: { accent: '#c2562e', theme: 'dark' },
    design: defaultDesign(),
    ask: {
      enabled: true,
      tone: 'friendly',
      fallback: 'I’ve let your host know, and their reply will show up here.',
      suggested: ['What is the Wi-Fi password?', 'When is checkout?', 'How does the thermostat work?', 'Where can we get coffee nearby?'],
    },
  }
}
