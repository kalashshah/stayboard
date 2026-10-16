// Validation for the property config. The shape and the render helpers live in shared/design.ts; this file only adds the schema.
import { z } from 'zod'
import { FONTS, ICONS, LAYOUTS, TILE_KEYS, upgradeConfig, type IconKey, type PropertyConfig } from '../shared/design'

export * from '../shared/design'

const str = (max = 200) => z.string().trim().max(max)
const list = <T extends z.ZodTypeAny>(item: T) => z.array(item).max(40)
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex color like #c2562e')
const url = z.string().trim().max(500).refine((u) => u === '' || /^https:\/\//.test(u), 'must be an https URL')
const int = (min: number, max: number) => z.number().int().min(min).max(max)
const ICON_KEYS = Object.keys(ICONS) as [IconKey, ...IconKey[]]

const tileSchema = z.object({ key: z.enum(TILE_KEYS), label: str(24), sub: str(40), icon: z.enum(ICON_KEYS), visible: z.boolean() })
const designSchema = z.object({
  layout: z.enum(LAYOUTS),
  font: z.enum(FONTS),
  headlineSize: z.enum(['sm', 'md', 'lg']),
  align: z.enum(['left', 'center']),
  backdrop: z.object({
    kind: z.enum(['color', 'photo', 'slideshow', 'video']),
    photos: z.array(url).max(8),
    video: url,
    poster: url,
    overlay: int(0, 100),
    blur: int(0, 20),
    interval: int(5, 60),
  }),
  music: z.object({ enabled: z.boolean(), url, volume: int(0, 100) }),
  logo: url,
  tileStyle: z.enum(['glass', 'solid', 'outline']),
  radius: z.enum(['sharp', 'rounded', 'pill']),
  showClock: z.boolean(),
  showFooter: z.boolean(),
  tiles: z.array(tileSchema).length(TILE_KEYS.length).refine((t) => new Set(t.map((x) => x.key)).size === TILE_KEYS.length, 'every tile exactly once'),
})

// `satisfies` keeps the schema and the shared PropertyConfig type in step: drift fails the typecheck.
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
  appearance: z.object({ accent: hex, theme: z.enum(['dark', 'light']) }),
  design: designSchema,
  ask: z.object({
    enabled: z.boolean(),
    tone: z.enum(['friendly', 'formal']),
    fallback: str(200),
    suggested: list(str(120)),
  }),
}) satisfies z.ZodType<PropertyConfig>

export function parseConfig(input: unknown): { ok: true; config: PropertyConfig } | { ok: false; error: string } {
  const r = configSchema.safeParse(upgradeConfig(input))
  if (r.success) return { ok: true, config: r.data }
  const issue = r.error.issues[0]
  return { ok: false, error: `${issue.path.join('.') || 'config'}: ${issue.message}` }
}
