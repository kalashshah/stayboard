// The property config: one JSON document the host edits and the TV renders.
import { z } from 'zod'

const str = (max = 200) => z.string().trim().max(max)
const list = <T extends z.ZodTypeAny>(item: T) => z.array(item).max(40)
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex color like #c2562e')

export const TILE_KEYS = ['wifi', 'checkout', 'rules', 'guide', 'places', 'contacts', 'ask'] as const
export type TileKey = (typeof TILE_KEYS)[number]

export const configSchema = z.object({
  name: str(80).min(1, 'give the property a name'),
  hostName: str(60).min(1, 'add a host name'),
  welcome: z.object({ headline: str(80), message: str(400), guestName: str(60) }),
  stay: z.object({ checkIn: str(20), checkOut: str(20), checkoutSteps: list(str(160)) }),
  wifi: z.object({ ssid: str(64), password: str(64) }),
  rules: list(str(160)),
  guide: list(z.object({ title: str(80), body: str(4000) })),
  faqs: list(z.object({ q: str(200), a: str(1000) })),
  places: list(z.object({ name: str(80), category: str(40), note: str(200), distance: str(40) })),
  contacts: list(z.object({ label: str(60), value: str(120) })),
  appearance: z.object({
    accent: hex,
    theme: z.enum(['dark', 'light']),
    backgroundUrl: z.string().trim().max(500).refine((u) => u === '' || /^https:\/\//.test(u), 'must be an https URL'),
    tiles: z.object(Object.fromEntries(TILE_KEYS.map((k) => [k, z.boolean()])) as Record<TileKey, z.ZodBoolean>),
  }),
  ask: z.object({
    enabled: z.boolean(),
    tone: z.enum(['friendly', 'formal']),
    fallback: str(200),
    suggested: list(str(120)),
  }),
})

export type PropertyConfig = z.infer<typeof configSchema>

export function parseConfig(input: unknown): { ok: true; config: PropertyConfig } | { ok: false; error: string } {
  const r = configSchema.safeParse(input)
  if (r.success) return { ok: true, config: r.data }
  const issue = r.error.issues[0]
  return { ok: false, error: `${issue.path.join('.') || 'config'}: ${issue.message}` }
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
  const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')
  if (!c.wifi.password) return `WIFI:T:nopass;S:${esc(c.wifi.ssid)};;`
  return `WIFI:T:WPA;S:${esc(c.wifi.ssid)};P:${esc(c.wifi.password)};;`
}

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
    appearance: {
      accent: '#c2562e',
      theme: 'dark',
      backgroundUrl: '',
      tiles: { wifi: true, checkout: true, rules: true, guide: true, places: true, contacts: true, ask: true },
    },
    ask: {
      enabled: true,
      tone: 'friendly',
      fallback: 'Text your host and they will get right back to you.',
      suggested: ['What is the Wi-Fi password?', 'When is checkout?', 'How does the thermostat work?', 'Where can we get coffee nearby?'],
    },
  }
}
