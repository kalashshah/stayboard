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

export const headlineFor = (c: PropertyConfig) =>
  c.welcome.headline.replace('{guest}', c.welcome.guestName ? `, ${c.welcome.guestName}` : '')

export const wifiQr = (c: PropertyConfig) =>
  `WIFI:T:WPA;S:${c.wifi.ssid.replace(/([\\;,:"])/g, '\\$1')};P:${c.wifi.password.replace(/([\\;,:"])/g, '\\$1')};;`

export function visibleTiles(c: PropertyConfig): TileKey[] {
  return TILE_ORDER.filter((k) => c.appearance.tiles[k] && (k !== 'ask' || c.ask.enabled))
}
