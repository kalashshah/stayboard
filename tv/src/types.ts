// Mirror of worker/config.ts PropertyConfig (the TV project has its own build root).
export type TileKey = 'wifi' | 'checkout' | 'rules' | 'guide' | 'places' | 'contacts' | 'ask'

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
  appearance: { accent: string; theme: 'dark' | 'light'; backgroundUrl: string; tiles: Record<TileKey, boolean> }
  ask: { enabled: boolean; tone: 'friendly' | 'formal'; fallback: string; suggested: string[] }
}

export type TvState =
  | { paired: false; code: string; pairUrl: string }
  | { paired: true; config: PropertyConfig; updatedAt: number; slug: string; guestUrl: string }

export type Answer = { answered: boolean; answer: string }

export const TILE_ORDER: TileKey[] = ['wifi', 'checkout', 'rules', 'guide', 'places', 'contacts', 'ask']

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

export function visibleTiles(c: PropertyConfig): TileKey[] {
  return TILE_ORDER.filter((k) => c.appearance.tiles[k] && (k !== 'ask' || c.ask.enabled))
}
