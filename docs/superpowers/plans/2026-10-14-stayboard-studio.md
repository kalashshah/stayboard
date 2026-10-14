# Stayboard Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hosts design the TV welcome screen (video/photo/slideshow backdrops, music, five layouts, fonts, styled and reorderable tiles) in a redesigned editor, and the TV, web preview and guest page all render it.

**Architecture:** One `design` object in the property config, migrated from the old `appearance` fields by a pure `upgradeConfig`. Pure helpers (`layoutFor`, `backdropFor`, `tileSub`, `visibleTiles`) live in `worker/config.ts` and are mirrored in `tv/src/types.ts`, so three renderers agree. Media is uploaded raw to R2 through the Worker and served back with Range support. The dashboard gets a sidebar studio with a Design tab; the TV app adds `react-native-w3cmedia` for video and audio.

**Tech Stack:** Hono + zod 4 + D1 + R2 on Cloudflare Workers; React 19 + Vite; Vega RN 0.83 + `@amazon-devices/react-native-w3cmedia` ~2.3.2; vitest, jest, Playwright (scratchpad).

**Spec:** `docs/superpowers/specs/2026-10-14-stayboard-studio-design.md`

## Global Constraints

- No paid services: R2 free tier, Workers free plan; AWS stays under $5.
- Secrets only in `.dev.vars` and Worker secrets; no media committed; no public push without the user's say.
- URL fields: `https://` only, max 500 chars. Caps: video 40 MB (video/mp4), audio 10 MB (audio/mpeg, audio/mp4, audio/x-m4a), image 5 MB (image/jpeg, image/png, image/webp); 150 MB per property.
- TV logical resolution 960×540; web preview uses `cqw` with 1 px = 0.104 cqw.
- Dashboard chrome keeps General Sans and the existing palette; preview fonts are Inter, Fraunces, Space Grotesk (OFL).
- Every TV layout keeps a single left-to-right tile row for D-pad focus.

## Review Focus

1. A legacy config (no `design`) read by the TV from its AsyncStorage cache must render, not crash → Task 7 jest `upgradeConfig` on a cached legacy state.
2. A `Range: bytes=0-` request for a video must get 206 with `content-range`, and `bytes=999999999-` on a small file must get 416 → Task 3 `parseRange` tests.
3. Uploading a file with an empty `content-type` (Safari for .m4a) must get a clear 415, not a 500 → Task 3 `checkUpload` test for `''`.
4. A video backdrop whose file was deleted must fall back to the poster or color on the TV, not a blank screen → Task 7 `onError` path sets `failed` state; checked on the simulator with a 404 URL.
5. Reordering tiles by drag must persist after reload and must keep every key exactly once → Task 6 Playwright check and Task 2 schema refine test.

---

### Task 1: Spike — video, audio, fonts and glyphs on the Vega Virtual Device (throwaway)

**Files:**
- Modify (temporarily): `tv/index.js` to register `src/Spike.tsx` as root; `tv/package.json`, `tv/babel.config.js`, `tv/manifest.toml`
- Create (temporary): `tv/src/Spike.tsx`, `tv/assets/fonts/Inter-Regular.ttf`, `Fraunces-Regular.ttf`, `SpaceGrotesk-Regular.ttf`
- Record: `docs/friction-log.md` (new entries)

**Interfaces:**
- Produces: answers to (a) does `<Video>` play an https MP4 on the VVD, (b) does `<Audio>` play an MP3, (c) do bundled TTFs render via `fontFamily` and under which name, (d) which of the 14 glyphs render. These settle the fallbacks in Tasks 5 and 7.

- [ ] **Step 1: Install the media package and apply its config**

```bash
cd tv && npm i @amazon-devices/react-native-w3cmedia@~2.3.2
```
`babel.config.js`:
```js
module.exports = {
  presets: [['module:@react-native/babel-preset', { useTransformReactJSXExperimental: true }]],
  plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
};
```
`manifest.toml` under `[wants]`, one `[[wants.service]]` per id: `com.amazon.mediametrics.service`, `com.amazon.media.server`, `com.amazon.gipc.uuid.*`, `com.amazon.media.playersession.service`, `com.amazon.mediabuffer.service`, `com.amazon.mediatransform.service`, `com.amazon.audio.stream`, `com.amazon.audio.control`; plus `[offers] [[offers.service]] id = "com.amazon.gipc.uuid.*"`.

- [ ] **Step 2: Fetch static TTFs** (Google Fonts returns TrueType to a curl user agent)

```bash
mkdir -p tv/assets/fonts && cd tv/assets/fonts
for f in "Inter:wght@400;600" "Fraunces:wght@400;600" "Space+Grotesk:wght@400;600"; do
  curl -s "https://fonts.googleapis.com/css2?family=$f" | grep -o 'https://[^)]*\.ttf' ; done
# download each URL to <Family>-<Weight>.ttf (Regular/SemiBold)
```

- [ ] **Step 3: Write `src/Spike.tsx`** — a screen with `<Video src="https://commondatacore.s3.amazonaws.com/..." …>` replaced by any public https MP4 (use a small Big Buck Bunny clip from `https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4`), `<Audio src="https://…/file_example_MP3_700KB.mp3" loop autoplay volume={0.5}>`, three `<Text>` lines in `fontFamily: 'Inter'`, `'Fraunces'`, `'Space Grotesk'` (and the `-Regular` variants), and one line with all 14 glyphs. Register it as root in `index.js`.

- [ ] **Step 4: Build, run, observe**

```bash
source ~/vega/env && npm run build:release && vega run-app build/aarch64-release/stayboard_aarch64.vpkg com.kalashshah.stayboard.main -d VirtualDevice
adb -s emulator-5554 emu screenrecord screenshot .superpowers/shots/spike
adb -s emulator-5554 logcat -d | grep -i "w3cmedia\|media\|audio" | tail -40
```
Expected: screenshot shows video frames (or not), fonts differ (or not), glyphs render (or boxes); logcat shows the audio element reaching `playing` (or an error).

- [ ] **Step 5: Record and revert**

Write three friction-log entries (media package setup, VVD playback result, fonts result). Then `git checkout tv/index.js && rm tv/src/Spike.tsx`. Keep the package install, Babel change, manifest entries and fonts (Task 7 needs them). Commit: `chore(tv): add w3cmedia, manifest media services, bundled fonts`.

---

### Task 2: Config schema — `design`, `upgradeConfig`, layout helpers

**Files:**
- Modify: `worker/config.ts`, `worker/db.ts:18-20`, `src/api.ts`, `src/components/Preview.tsx:14-16`
- Test: `worker/config.test.ts`

**Interfaces:**
- Produces (all exported from `worker/config.ts`): `LAYOUTS`, `FONTS`, `ICONS: Record<IconKey, string>`, `IconKey`, `Design`, `TILE_DEFAULTS`, `defaultDesign(): Design`, `upgradeConfig(raw: unknown): unknown`, `layoutFor(c): Layout`, `backdropFor(c): Backdrop`, `tileSub(c, key): string`, `visibleTiles(c): Design['tiles']`, `RADIUS`, `HEADLINE`. `PropertyConfig.appearance` becomes `{ accent, theme }`.

- [ ] **Step 1: Failing tests** (append to `worker/config.test.ts`)

```ts
describe('upgradeConfig', () => {
  const legacy = { ...defaultConfig('Loft'), design: undefined, appearance: { accent: '#c2562e', theme: 'dark', backgroundUrl: 'https://x/a.jpg', tiles: { wifi: true, checkout: false, rules: true, guide: true, places: true, contacts: true, ask: true } } }
  it('moves backgroundUrl into a photo backdrop and tiles into visibility', () => {
    const r = parseConfig(upgradeConfig(legacy))
    expect(r.ok && r.config.design.backdrop).toMatchObject({ kind: 'photo', photos: ['https://x/a.jpg'] })
    expect(r.ok && r.config.design.tiles.find((t) => t.key === 'checkout')?.visible).toBe(false)
    expect(r.ok && 'backgroundUrl' in r.config.appearance).toBe(false)
  })
  it('is idempotent', () => { const once = upgradeConfig(legacy); expect(upgradeConfig(once)).toEqual(once) })
})
describe('design schema', () => {
  it('rejects a tile list missing a key', () => {
    const c = defaultConfig('Loft'); c.design.tiles = c.design.tiles.slice(1)
    expect(parseConfig(c).ok).toBe(false)
  })
  it('rejects a duplicate tile key', () => {
    const c = defaultConfig('Loft'); c.design.tiles[1] = { ...c.design.tiles[0] }
    expect(parseConfig(c).ok).toBe(false)
  })
  it('rejects overlay above 100 and a non-https video', () => {
    const c = defaultConfig('Loft'); c.design.backdrop.overlay = 101
    expect(parseConfig(c).ok).toBe(false)
    const d = defaultConfig('Loft'); d.design.backdrop.video = 'http://x/v.mp4'
    expect(parseConfig(d).ok).toBe(false)
  })
})
describe('layout helpers', () => {
  it('poster uses a bigger headline, a scrim and compact tiles', () => {
    const c = defaultConfig('Loft'); c.design.layout = 'poster'
    expect(layoutFor(c)).toMatchObject({ headline: 60, scrim: true, tiles: 'compact', topBar: 'logo' })
  })
  it('minimal has no top bar or footer', () => {
    const c = defaultConfig('Loft'); c.design.layout = 'minimal'; c.design.showFooter = true
    expect(layoutFor(c)).toMatchObject({ topBar: 'none', footer: false })
  })
  it('backdropFor falls back: video without file → poster photo → color', () => {
    const c = defaultConfig('Loft'); c.design.backdrop.kind = 'video'
    expect(backdropFor(c)).toEqual({ kind: 'color' })
    c.design.backdrop.poster = 'https://x/p.jpg'
    expect(backdropFor(c)).toEqual({ kind: 'photo', url: 'https://x/p.jpg' })
  })
  it('tileSub prefers the custom subtitle', () => {
    const c = defaultConfig('Loft'); c.wifi.ssid = 'LoftNet'
    expect(tileSub(c, 'wifi')).toBe('LoftNet')
    c.design.tiles[0].sub = 'Fast fibre'
    expect(tileSub(c, 'wifi')).toBe('Fast fibre')
  })
  it('visibleTiles follows design order and hides ask when disabled', () => {
    const c = defaultConfig('Loft'); c.design.tiles.reverse(); c.ask.enabled = false
    expect(visibleTiles(c).map((t) => t.key)).toEqual(['contacts', 'places', 'guide', 'rules', 'checkout', 'wifi'])
  })
})
```

- [ ] **Step 2: Run** `npx vitest run worker/config.test.ts` — Expected: FAIL (`upgradeConfig` not exported).

- [ ] **Step 3: Implement in `worker/config.ts`**

```ts
export const LAYOUTS = ['hero', 'centered', 'split', 'poster', 'minimal'] as const
export const FONTS = ['sans', 'serif', 'grotesk'] as const
export const ICONS = { wifi: '◠', clock: '◷', list: '☰', book: '▤', pin: '◎', phone: '✆', ask: '?', star: '★', heat: '♨', coffee: '☕', flag: '⚑', mail: '✉', home: '⌂', sun: '☀' } as const
export type IconKey = keyof typeof ICONS
const ICON_KEYS = Object.keys(ICONS) as [IconKey, ...IconKey[]]
const url = z.string().trim().max(500).refine((u) => u === '' || /^https:\/\//.test(u), 'must be an https URL')
const int = (min: number, max: number) => z.number().int().min(min).max(max)
const tileSchema = z.object({ key: z.enum(TILE_KEYS), label: str(24), sub: str(40), icon: z.enum(ICON_KEYS), visible: z.boolean() })
const designSchema = z.object({
  layout: z.enum(LAYOUTS), font: z.enum(FONTS), headlineSize: z.enum(['sm', 'md', 'lg']), align: z.enum(['left', 'center']),
  backdrop: z.object({ kind: z.enum(['color', 'photo', 'slideshow', 'video']), photos: z.array(url).max(8), video: url, poster: url, overlay: int(0, 100), blur: int(0, 20), interval: int(5, 60) }),
  music: z.object({ enabled: z.boolean(), url, volume: int(0, 100) }),
  logo: url, tileStyle: z.enum(['glass', 'solid', 'outline']), radius: z.enum(['sharp', 'rounded', 'pill']), showClock: z.boolean(), showFooter: z.boolean(),
  tiles: z.array(tileSchema).length(TILE_KEYS.length).refine((t) => new Set(t.map((x) => x.key)).size === TILE_KEYS.length, 'every tile exactly once'),
})
export type Design = z.infer<typeof designSchema>
// configSchema: appearance: z.object({ accent: hex, theme: z.enum(['dark','light']) }), design: designSchema
export const TILE_DEFAULTS: Record<TileKey, { label: string; icon: IconKey }> = { wifi: { label: 'Wi-Fi', icon: 'wifi' }, checkout: { label: 'Checkout', icon: 'clock' }, rules: { label: 'House rules', icon: 'list' }, guide: { label: 'House guide', icon: 'book' }, places: { label: 'Local picks', icon: 'pin' }, contacts: { label: 'Contacts', icon: 'phone' }, ask: { label: 'Ask the house', icon: 'ask' } }
export const defaultDesign = (): Design => ({
  layout: 'hero', font: 'sans', headlineSize: 'md', align: 'left',
  backdrop: { kind: 'color', photos: [], video: '', poster: '', overlay: 55, blur: 0, interval: 10 },
  music: { enabled: false, url: '', volume: 40 }, logo: '', tileStyle: 'glass', radius: 'rounded', showClock: true, showFooter: true,
  tiles: TILE_KEYS.map((key) => ({ key, label: TILE_DEFAULTS[key].label, sub: '', icon: TILE_DEFAULTS[key].icon, visible: true })),
})
/** Legacy configs (no `design`) get one built from appearance.backgroundUrl / appearance.tiles. Idempotent. */
export function upgradeConfig(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || (raw as { design?: unknown }).design) return raw
  const c = raw as Record<string, unknown>
  const a = (c.appearance ?? {}) as Record<string, unknown>
  const d = defaultDesign()
  if (typeof a.backgroundUrl === 'string' && a.backgroundUrl) { d.backdrop.kind = 'photo'; d.backdrop.photos = [a.backgroundUrl] }
  const vis = a.tiles as Record<string, boolean> | undefined
  if (vis && typeof vis === 'object') d.tiles = d.tiles.map((t) => ({ ...t, visible: vis[t.key] !== false }))
  const { backgroundUrl: _b, tiles: _t, ...rest } = a
  return { ...c, appearance: rest, design: d }
}
export function parseConfig(input: unknown) { const r = configSchema.safeParse(upgradeConfig(input)); /* unchanged below */ }
export type Layout = { topBar: 'full' | 'centered' | 'logo' | 'none'; hero: 'bottom' | 'middle' | 'top'; align: 'left' | 'center'; mediaCard: boolean; tiles: 'bottom' | 'compact' | 'middle'; headline: number; footer: boolean; scrim: boolean }
export const HEADLINE = { sm: 34, md: 46, lg: 60 } as const
export const RADIUS = { sharp: 4, rounded: 13, pill: 24 } as const
export function layoutFor(c: PropertyConfig): Layout {
  const d = c.design, h = HEADLINE[d.headlineSize]
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
export const visibleTiles = (c: PropertyConfig) => c.design.tiles.filter((t) => t.visible && (t.key !== 'ask' || c.ask.enabled))
```
`defaultConfig`: `appearance: { accent: '#c2562e', theme: 'dark' }, design: defaultDesign()`. In `worker/db.ts` `toProperty`: `config: upgradeConfig(JSON.parse(r.config)) as PropertyConfig`. In `src/api.ts` re-export the helpers; in `Preview.tsx` delete the local `visibleTiles` and `TILE_LABELS.sub` in favour of `tileSub` (full rewrite comes in Task 5; keep it compiling now).

- [ ] **Step 4: Run** `npx vitest run && npm run typecheck` — Expected: all green (fix the Editor's `appearance.tiles` / `backgroundUrl` references by pointing them at `design` temporarily; Task 6 replaces that tab).

- [ ] **Step 5: Commit** `feat(config): design object, legacy upgrade, layout helpers`

---

### Task 3: Media storage — R2 upload, listing, delete, public serving with Range

**Files:**
- Create: `worker/media.ts`, `worker/media.test.ts`
- Modify: `wrangler.jsonc` (add `"r2_buckets": [{ "binding": "MEDIA", "bucket_name": "stayboard-media" }]`), `worker/api.ts`, `worker/index.ts`, `worker/db.ts:97-103` (`deleteProperty` → also `deletePrefix`)

**Interfaces:**
- Produces: `PUT /api/properties/:id/media?kind=&name=` → `{ key, url, size }`; `GET /api/properties/:id/media` → `{ files: MediaFile[] }` with `MediaFile = { key, url, size, uploaded, contentType, name, kind }`; `DELETE /api/properties/:id/media/:file` → `{ ok }`; `GET /m/:pid/:file` public.
- Pure: `checkUpload(kind, contentType, size, used)`, `parseRange(header, size)`, `KINDS`, `QUOTA`, `MB`.

- [ ] **Step 1: Failing tests** `worker/media.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { checkUpload, MB, parseRange, QUOTA } from './media'
describe('checkUpload', () => {
  it('accepts an mp4 under the cap', () => expect(checkUpload('video', 'video/mp4', 30 * MB, 0)).toEqual({ ok: true, kind: 'video', ext: 'mp4', contentType: 'video/mp4' }))
  it('rejects the wrong type with 415 and names the rule', () => expect(checkUpload('video', 'video/quicktime', 1, 0)).toMatchObject({ ok: false, status: 415, error: expect.stringContaining('MP4') }))
  it('rejects an empty content type with 415', () => expect(checkUpload('audio', '', 1, 0)).toMatchObject({ ok: false, status: 415 }))
  it('rejects over the kind cap with 413', () => expect(checkUpload('image', 'image/png', 6 * MB, 0)).toMatchObject({ ok: false, status: 413 }))
  it('rejects over the property quota with 413 naming 150 MB', () => expect(checkUpload('image', 'image/png', 1 * MB, QUOTA - 100)).toMatchObject({ ok: false, status: 413, error: expect.stringContaining('150 MB') }))
  it('rejects an unknown kind with 400', () => expect(checkUpload('font', 'font/ttf', 1, 0)).toMatchObject({ ok: false, status: 400 }))
  it('maps audio/x-m4a to m4a', () => expect(checkUpload('audio', 'audio/x-m4a', 1, 0)).toMatchObject({ ok: true, ext: 'm4a' }))
})
describe('parseRange', () => {
  it('returns null without a header', () => expect(parseRange(undefined, 100)).toBeNull())
  it('parses open-ended, closed and suffix ranges', () => {
    expect(parseRange('bytes=0-', 100)).toEqual({ offset: 0, length: 100 })
    expect(parseRange('bytes=10-19', 100)).toEqual({ offset: 10, length: 10 })
    expect(parseRange('bytes=-5', 100)).toEqual({ offset: 95, length: 5 })
    expect(parseRange('bytes=10-999', 100)).toEqual({ offset: 10, length: 90 })
  })
  it('flags unsatisfiable ranges', () => expect(parseRange('bytes=100-', 100)).toEqual('unsatisfiable'))
})
```

- [ ] **Step 2: Run** `npx vitest run worker/media.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement `worker/media.ts`**

```ts
export const MB = 1024 * 1024
export const QUOTA = 150 * MB
export const KINDS = {
  video: { types: { 'video/mp4': 'mp4' }, cap: 40 * MB, rule: 'MP4 videos up to 40 MB' },
  audio: { types: { 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a' }, cap: 10 * MB, rule: 'MP3 or M4A tracks up to 10 MB' },
  image: { types: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }, cap: 5 * MB, rule: 'JPG, PNG or WebP images up to 5 MB' },
} as const
export type Kind = keyof typeof KINDS
export function checkUpload(kind: string, contentType: string, size: number, used: number) {
  if (!(kind in KINDS)) return { ok: false as const, status: 400 as const, error: 'Unknown upload kind' }
  const k = KINDS[kind as Kind]
  const ct = contentType.split(';')[0].trim().toLowerCase()
  const ext = (k.types as Record<string, string>)[ct]
  if (!ext) return { ok: false as const, status: 415 as const, error: k.rule }
  if (!size || size > k.cap) return { ok: false as const, status: 413 as const, error: k.rule }
  if (used + size > QUOTA) return { ok: false as const, status: 413 as const, error: 'This property has used its 150 MB of media. Delete something first.' }
  return { ok: true as const, kind: kind as Kind, ext, contentType: ct }
}
/** RFC 7233 single range → { offset, length }, null when absent, 'unsatisfiable' when out of bounds. */
export function parseRange(header: string | undefined, size: number): { offset: number; length: number } | null | 'unsatisfiable' {
  const m = header?.match(/^bytes=(\d*)-(\d*)$/)
  if (!m) return null
  const [, a, b] = m
  if (a === '' && b === '') return null
  if (a === '') { const n = Math.min(Number(b), size); return n === 0 ? 'unsatisfiable' : { offset: size - n, length: n } }
  const start = Number(a)
  if (start >= size) return 'unsatisfiable'
  const end = b === '' ? size - 1 : Math.min(Number(b), size - 1)
  return { offset: start, length: end - start + 1 }
}
export type MediaFile = { key: string; url: string; size: number; uploaded: number; contentType: string; name: string; kind: string }
export async function listMedia(env: Env, propertyId: string): Promise<MediaFile[]> {
  const out: MediaFile[] = []; let cursor: string | undefined
  do {
    const r = await env.MEDIA.list({ prefix: `${propertyId}/`, cursor, include: ['httpMetadata', 'customMetadata'] })
    for (const o of r.objects) out.push({ key: o.key, url: `${env.APP_URL}/m/${o.key}`, size: o.size, uploaded: o.uploaded.getTime(), contentType: o.httpMetadata?.contentType ?? '', name: o.customMetadata?.name ?? '', kind: o.customMetadata?.kind ?? '' })
    cursor = r.truncated ? r.cursor : undefined
  } while (cursor)
  return out.sort((a, b) => b.uploaded - a.uploaded)
}
export const usedBytes = async (env: Env, propertyId: string) => (await listMedia(env, propertyId)).reduce((n, f) => n + f.size, 0)
export async function deletePrefix(env: Env, propertyId: string) {
  const keys = (await listMedia(env, propertyId)).map((f) => f.key)
  if (keys.length) await env.MEDIA.delete(keys)
}
```
Routes in `worker/api.ts` (after the questions routes):
```ts
api.get('/properties/:id/media', async (c) => { const p = await ownProperty(c); if (!p) return c.json({ error: 'Not found' }, 404); return c.json({ files: await listMedia(c.env, p.id) }) })
api.put('/properties/:id/media', async (c) => {
  const p = await ownProperty(c); if (!p) return c.json({ error: 'Not found' }, 404)
  const v = checkUpload(c.req.query('kind') ?? '', c.req.header('content-type') ?? '', Number(c.req.header('content-length') ?? 0), await usedBytes(c.env, p.id))
  if (!v.ok) return c.json({ error: v.error }, v.status)
  const key = `${p.id}/${newId()}.${v.ext}`
  await c.env.MEDIA.put(key, c.req.raw.body, { httpMetadata: { contentType: v.contentType }, customMetadata: { name: (c.req.query('name') ?? '').slice(0, 120), kind: v.kind } })
  return c.json({ key, url: `${c.env.APP_URL}/m/${key}`, size: Number(c.req.header('content-length')) })
})
api.delete('/properties/:id/media/:file', async (c) => { const p = await ownProperty(c); if (!p) return c.json({ error: 'Not found' }, 404); await c.env.MEDIA.delete(`${p.id}/${c.req.param('file')}`); return c.json({ ok: true }) })
```
Serving in `worker/index.ts`:
```ts
app.get('/m/:pid/:file', async (c) => {
  const key = `${c.req.param('pid')}/${c.req.param('file')}`
  const head = await c.env.MEDIA.head(key)
  if (!head) return c.json({ error: 'Not found' }, 404)
  const range = parseRange(c.req.header('range'), head.size)
  if (range === 'unsatisfiable') return new Response(null, { status: 416, headers: { 'content-range': `bytes */${head.size}` } })
  const obj = await c.env.MEDIA.get(key, range ? { range } : undefined)
  if (!obj) return c.json({ error: 'Not found' }, 404)
  const h = new Headers({ 'content-type': head.httpMetadata?.contentType ?? 'application/octet-stream', 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=31536000, immutable', etag: head.httpEtag })
  if (range) { h.set('content-range', `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`); h.set('content-length', String(range.length)) } else h.set('content-length', String(head.size))
  return new Response(obj.body, { status: range ? 206 : 200, headers: h })
})
```
`deleteProperty` in `db.ts` gains `await deletePrefix(env, id)` (import from `./media`; avoid the cycle by having `media.ts` not import `db.ts`).

- [ ] **Step 4: Create the bucket, regenerate types, run tests**

```bash
npx wrangler r2 bucket create stayboard-media && npx wrangler types && npx vitest run && npm run typecheck
```
Expected: bucket created, `MEDIA: R2Bucket` in `worker-configuration.d.ts`, all tests green.

- [ ] **Step 5: Live check after `npm run deploy`** — upload a 1 MB MP4 with curl using the smoke account cookie; `curl -sI -H 'Range: bytes=0-99' <url>` → `HTTP/2 206`, `content-range: bytes 0-99/<size>`; `curl -sI -H 'Range: bytes=99999999-'` → 416.

- [ ] **Step 6: Commit** `feat(media): R2 uploads, listing, delete and ranged public serving`

---

### Task 4: Dashboard upload — API client, poster capture, `Upload` component

**Files:**
- Modify: `src/api.ts` (add `upload`, `media`, `deleteMedia`, `MediaFile` type)
- Create: `src/components/Upload.tsx`, `src/media.ts` (poster capture + type inference, pure-ish), `src/media.test.ts`

**Interfaces:**
- Produces: `api.upload(id, kind, file, onProgress?) → Promise<{ key, url, size }>`; `api.media(id) → { files }`; `api.deleteMedia(id, file)`; `inferType(file: File): string`; `capturePoster(file: File): Promise<Blob | null>`; `<Upload id kind value onChange label hint accept />` where `onChange(url: string, extra?: { poster?: string })`.

- [ ] **Step 1: Failing test** `src/media.test.ts` (vitest, jsdom not needed)

```ts
import { describe, expect, it } from 'vitest'
import { inferType } from './media'
describe('inferType', () => {
  it('uses the browser type when present', () => expect(inferType({ name: 'a.mp4', type: 'video/mp4' } as File)).toBe('video/mp4'))
  it('falls back to the extension', () => {
    expect(inferType({ name: 'song.m4a', type: '' } as File)).toBe('audio/mp4')
    expect(inferType({ name: 'song.MP3', type: '' } as File)).toBe('audio/mpeg')
    expect(inferType({ name: 'x.bin', type: '' } as File)).toBe('')
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/media.test.ts` — Expected: FAIL (module missing). (Add `src/**/*.test.ts` to the vitest include if the config limits it to `worker`.)

- [ ] **Step 3: Implement**

`src/media.ts`:
```ts
const EXT: Record<string, string> = { mp4: 'video/mp4', mp3: 'audio/mpeg', m4a: 'audio/mp4', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
export const inferType = (f: File) => f.type || EXT[f.name.split('.').pop()?.toLowerCase() ?? ''] || ''
/** First frame of a video as a JPEG, or null when the browser cannot decode it. */
export function capturePoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'
    const src = URL.createObjectURL(file); const done = (b: Blob | null) => { URL.revokeObjectURL(src); resolve(b) }
    v.onerror = () => done(null)
    v.onloadedmetadata = () => { v.currentTime = Math.min(0.5, v.duration / 2) }
    v.onseeked = () => {
      const scale = Math.min(1, 1280 / v.videoWidth); const c = document.createElement('canvas')
      c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale)
      c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height); c.toBlob((b) => done(b), 'image/jpeg', 0.8)
    }
    v.src = src
  })
}
```
`src/api.ts`:
```ts
export type MediaFile = { key: string; url: string; size: number; uploaded: number; contentType: string; name: string; kind: string }
upload: (id: string, kind: 'video' | 'audio' | 'image', file: Blob & { name?: string }, type: string, onProgress?: (p: number) => void) => new Promise<{ key: string; url: string; size: number }>((resolve, reject) => {
  const x = new XMLHttpRequest()
  x.open('PUT', `/api/properties/${id}/media?kind=${kind}&name=${encodeURIComponent(file.name ?? 'poster.jpg')}`)
  x.setRequestHeader('content-type', type)
  x.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
  x.onload = () => { const d = JSON.parse(x.responseText || '{}'); x.status < 300 ? resolve(d) : reject(new ApiError(x.status, d.error ?? `Upload failed (${x.status})`)) }
  x.onerror = () => reject(new ApiError(0, 'Upload failed. Check your connection.'))
  x.send(file)
}),
media: (id: string) => call<{ files: MediaFile[] }>(`/properties/${id}/media`),
deleteMedia: (id: string, file: string) => call(`/properties/${id}/media/${file}`, { method: 'DELETE' }),
```
`src/components/Upload.tsx`: props `{ id, kind, value, onChange, label, hint?, poster? }`. Renders a `.drop` zone (dashed card) that is a `<label>` wrapping a hidden `<input type=file accept=…>`; handles `dragover`/`drop`; when `value` is set shows a thumbnail (`<img>` for image, `<video muted>` first frame for video, a ♫ badge with the filename for audio) with "Replace" and "Remove" buttons; a "Use a link instead" toggle reveals an https input that calls `onChange` on blur. Upload flow: `const type = inferType(file); if (!type) setError('Pick an MP4, MP3, M4A, JPG, PNG or WebP'); const r = await api.upload(id, kind, file, type, setProgress); if (kind === 'video') { const b = await capturePoster(file); const p = b ? await api.upload(id, 'image', b, 'image/jpeg') : null; onChange(r.url, { poster: p?.url ?? '' }) } else onChange(r.url)`. Errors from `ApiError` show inline under the zone. Progress shows "Uploading 42%".

- [ ] **Step 4: Run** `npx vitest run && npm run typecheck` — Expected: green.

- [ ] **Step 5: Commit** `feat(dashboard): media upload with progress and poster capture`

---

### Task 5: Shared renderer — `Preview.tsx` rewrite, guest page, property thumbnails

**Files:**
- Rewrite: `src/components/Preview.tsx`
- Modify: `src/pages/Guest.tsx`, `src/pages/Properties.tsx`, `src/styles.css` (preview + guest rules), `index.html` (Google Fonts link for Inter, Fraunces, Space Grotesk)

**Interfaces:**
- Consumes: `layoutFor`, `backdropFor`, `tileSub`, `visibleTiles`, `ICONS`, `RADIUS`, `headlineFor` from `src/api.ts`.
- Produces: `<TvPreview config focus? time? frame? />`; `FONT_STACK: Record<Font, string>`.

- [ ] **Step 1: Write `Preview.tsx`** — `FONT_STACK = { sans: "'Inter', system-ui, sans-serif", serif: "'Fraunces', Georgia, serif", grotesk: "'Space Grotesk', system-ui, sans-serif" }`. Root `.tv` gets `style={{ fontFamily, '--r': RADIUS[d.radius] * 0.104 + 'cqw', '--h': L.headline * 0.104 + 'cqw', textAlign: L.align }}` and a `data-layout` attribute. Children in order: `<Backdrop>` (absolute; `color` → gradient as today; `photo` → `<img>` with `filter: blur(Npx)`; `slideshow` → two `<img>` crossfading on a `setInterval(interval*1000)`; `video` → `<video muted loop autoPlay playsInline poster src>`; then an overlay `div` with `background: rgba(0,0,0,overlay/100)` (white for light theme) and, when `L.scrim`, a bottom gradient), `<TopBar>` per `L.topBar` (logo `<img>` when `design.logo`, else name; clock when `showClock`), `<Hero>` positioned by `L.hero`, optional `<MediaCard>` (split: the photo/poster/video in a rounded box, 44% wide), `<Tiles>` (row; compact when `L.tiles === 'compact'`; vertically centred when `'middle'`; each tile: glyph `ICONS[t.icon]`, `t.label`, `tileSub(c, t.key)`; style per `tileStyle`; `focus` tile gets the accent), `<Footer>` when `L.footer`. `frame` prop wraps in `.tv-frame` (dark bezel, small stand) for the editor.

- [ ] **Step 2: Guest page** — hero background uses `backdropFor(c)`: photo/slideshow first url or video poster as a cover image under the accent gradient (fallback: gradient only); `fontFamily` from `FONT_STACK[c.design.font]` on headings; logo at the top when set; sections render in `visibleTiles(c)` order with `t.label` as the heading; the Ask section keeps its position rule (first when visible).

- [ ] **Step 3: Properties page** — each card gets a `<TvPreview config frame={false} />` thumbnail (needs the full config: change `listProperties` in `worker/db.ts` to return `config` parsed through `upgradeConfig` instead of only `name`; `PropertySummary` gains `config: PropertyConfig`).

- [ ] **Step 4: Verify** `npm run typecheck && npx vitest run`; `npm run dev` and screenshot `/g/i3czks9j` and `/app` with the Playwright helper (`pw/shots.mjs`), eyeball: fonts load, tiles ordered, thumbnails render.

- [ ] **Step 5: Commit** `feat(web): shared layout renderer, guest page design, property thumbnails`

---

### Task 6: Studio editor — sidebar shell, Design tab, styles, landing refresh, e2e

**Files:**
- Modify: `src/pages/Editor.tsx` (shell + sidebar; content tabs unchanged; remove the appearance tab), `src/components/Fields.tsx` (add `Segmented`, `Slider`), `src/styles.css` (studio), `src/pages/Landing.tsx`
- Create: `src/pages/Design.tsx`
- Test: scratchpad `pw/sb-studio.mjs` (Playwright against the live site)

**Interfaces:**
- Consumes: `Upload`, `TvPreview`, `set/update` pattern from `Editor`.
- Produces: `<Design id c set />` where `set('design', next)`; `Segmented<T>({ value, options: [T, string][], onChange })`; `Slider({ value, min, max, step?, onChange, suffix? })`.

- [ ] **Step 1: Fields** — `Segmented` renders a `.seg` with one `button.on` per option; `Slider` is `<input type=range>` with the value shown beside it.

- [ ] **Step 2: Editor shell** — `NAV = [['Content', [['welcome','Welcome'], ['stay','Stay & Wi-Fi'], ['rules','House rules'], ['guide','Guide'], ['faqs','FAQs'], ['places','Local picks'], ['contacts','Contacts']]], ['Design', [['design','Design']]], ['Concierge', [['ask','Ask the house'], ['inbox','Inbox']]], ['TV', [['devices','Devices']]]]`. Layout `.studio { grid-template-columns: 200px minmax(0,1fr) }`; inside, `tab === 'design'` renders `<TvPreview frame />` full width then `<Design>`; other tabs render `.editor-body` (panel + sticky framed preview) as today. Old `?tab=appearance` links redirect to `design`.

- [ ] **Step 3: `Design.tsx`** — six `.card` sections per the spec. Backdrop: `Segmented` over kind; photo strip = `design.backdrop.photos.map` thumbnails with × and an `<Upload kind="image" onChange={(u) => photos.push(u)}>` while `< 8`; video = `<Upload kind="video" value={video} poster={poster} onChange={(u, x) => set backdrop { video: u, poster: x?.poster ?? '' }}>`; sliders Overlay/Blur, Interval only for slideshow. Music: `Toggle`, `<Upload kind="audio">`, volume `Slider`. Layout: five `.preset` buttons each containing a tiny CSS wireframe (`.wire[data-layout]`). Type: three `.fontcard` buttons rendered in their font, `Segmented` for size and align. Tiles: `TileSorter` list — each `.tilecard` is `draggable`, with `onDragStart={() => drag.current = i}`, `onDragOver={(e) => e.preventDefault()}`, `onDrop={() => move(drag.current, i)}`, plus ↑ ↓ buttons, visibility `Toggle`, `label` input (max 24), `sub` input (placeholder = `tileSub` automatic value), icon picker (14 `.iconbtn`). Details: accent (colour + hex), theme, tile style, radius, logo `<Upload kind="image">`, Show clock, Show footer toggles.

- [ ] **Step 4: Styles** — sidebar nav (group labels in the mono eyebrow style, active item with surface + hairline), `.tv-frame` bezel, `.seg`, `.drop` (dashed, hover accent), `.preset`/`.wire`, `.fontcard`, `.tilecard` (grab cursor, lifted while dragging), `.iconbtn`, range input styling. Keep every rule within the existing tokens.

- [ ] **Step 5: Landing** — hero demo config: `layout 'poster'`, `font 'serif'`, backdrop photo (a Pexels/Unsplash https URL of a bright living room, hotlink allowed), tile order with Ask first; add a "Design it your way" section with three `TvPreview`s (hero/split/poster) at small size.

- [ ] **Step 6: Deploy and e2e** — `npm run deploy`, then `pw/sb-studio.mjs`: sign in as the smoke account, open the demo property's Design tab, upload a 1 MB MP4 fixture (download `Big_Buck_Bunny_360_10s_1MB.mp4` into the scratchpad) and a 700 KB MP3, pick Poster, drag the first tile card onto the fourth, reload, assert the order persisted and `backdrop.video` is set (via `/api/properties/:id`), open `/g/i3czks9j` and assert the poster `<img>` and the section order. Screenshots to `.superpowers/shots/studio_*.png`.

- [ ] **Step 7: Commit** `feat(studio): sidebar editor, design tab with media, layouts, fonts and tile sorting`

---

### Task 7: TV app — backdrops, music, layouts, fonts, legacy cache

**Files:**
- Modify: `tv/src/types.ts`, `tv/src/ui.tsx`, `tv/src/screens/Home.tsx`, `tv/src/App.tsx`, `tv/src/api.ts` (`loadCachedState` → upgrade), `tv/test/types.spec.ts`
- Create: `tv/src/Backdrop.tsx`, `tv/src/Music.tsx`
- Assets: `tv/assets/fonts/*.ttf` (from Task 1)

**Interfaces:**
- Consumes: `@amazon-devices/react-native-w3cmedia` `Video`, `Audio`.
- Produces (in `types.ts`, mirrors of Task 2 with identical signatures): `Design`, `ICONS`, `defaultDesign`, `upgradeConfig`, `layoutFor`, `backdropFor`, `tileSub`, `visibleTiles`, `RADIUS`, `FONT: Record<Font, string | undefined>` (family names found in the spike, `undefined` = system).

- [ ] **Step 1: Failing jest tests** (append to `tv/test/types.spec.ts`)

```ts
it('upgrades a cached legacy state so the new build can render it', () => {
  const legacy = { ...sample, design: undefined, appearance: { accent: '#c2562e', theme: 'dark', backgroundUrl: 'https://x/a.jpg', tiles: { wifi: false } } }
  const c = upgradeConfig(legacy) as PropertyConfig
  expect(c.design.backdrop).toMatchObject({ kind: 'photo', photos: ['https://x/a.jpg'] })
  expect(visibleTiles(c).map((t) => t.key)).not.toContain('wifi')
})
it('layoutFor poster is compact with a scrim', () => expect(layoutFor({ ...sample, design: { ...sample.design, layout: 'poster' } })).toMatchObject({ tiles: 'compact', scrim: true }))
it('backdropFor video without a file falls back to the poster', () => expect(backdropFor({ ...sample, design: { ...sample.design, backdrop: { ...sample.design.backdrop, kind: 'video', poster: 'https://x/p.jpg' } } })).toEqual({ kind: 'photo', url: 'https://x/p.jpg' }))
```

- [ ] **Step 2: Run** `cd tv && npx jest` — Expected: FAIL (`upgradeConfig` missing).

- [ ] **Step 3: Implement**
  - `types.ts`: copy the helper bodies from Task 2 verbatim (no zod; `upgradeConfig` returns `PropertyConfig`).
  - `Backdrop.tsx`: `({ c, theme })` → absolute-fill `View`; `color` → current glow; `photo` → `Image` cover with `blurRadius={blur}`; `slideshow` → two `Animated.Image`s, index advances every `interval` s, 600 ms opacity fade; `video` → `<Video src loop muted autoplay scalingmode="fill" style={absoluteFill} onError={() => setFailed(true)} />` with the poster `Image` underneath until `onPlaying`; `failed` → render the poster photo or color. Overlay `View` with `rgba(0,0,0,overlay/100)` (light theme: white) and a bottom `LinearGradient`-free scrim built from three stacked translucent `View`s when `L.scrim`.
  - `Music.tsx`: `({ url, volume, enabled })` → `enabled && url ? <Audio key={url} src={url} loop autoplay volume={volume / 100} onError={() => {}} /> : null`; mounted once in `App.tsx` outside the screen stack.
  - `ui.tsx`: `Screen` takes `c` and renders `<Backdrop>`; `themeFor` adds `font: FONT[c.design.font]`, `radius: RADIUS[c.design.radius]`, `tileBg/tileBorder` per `tileStyle`.
  - `Home.tsx`: build from `layoutFor(c)`: top bar variants (logo `Image` 28 px tall), hero block position/alignment/headline size, split media card (`Image`/`Video` in a rounded `View`, 44 % width), tiles row from `visibleTiles(c)` with glyph/label/`tileSub`, compact variant (height 72, font 13), `middle` variant centred, footer per `L.footer`.
  - `api.ts` `loadCachedState`: `if (s?.paired) s.config = upgradeConfig(s.config)`.

- [ ] **Step 4: Verify on the simulator** — `npm run build:release`, launch, use the smoke property: set each of the five layouts and a video backdrop + music from the dashboard, wait ≤ 60 s, screenshot each (`.superpowers/shots/tv/studio_<layout>.png`); set the video URL to a 404 and confirm the fallback; `adb logcat -d | grep -i audio` shows the track playing. `npx jest` green; `npx tsc --noEmit` green.

- [ ] **Step 5: Commit** `feat(tv): video/photo/slideshow backdrops, music, five layouts, fonts, legacy cache upgrade`

---

### Task 8: Docs, media gallery, deploy, final review

**Files:**
- Modify: `README.md` (Design studio section, media limits, R2 setup line, screenshots), `docs/friction-log.md`, `docs/devpost.md`, `docs/video.md`, `docs/media/` (new screenshots)

- [ ] **Step 1:** README: "Design studio" feature list, `npx wrangler r2 bucket create stayboard-media` in setup, judge instructions updated (try Poster + upload), media caps table, fonts/licence note, simulator playback note from the spike.
- [ ] **Step 2:** Copy curated screenshots (studio design tab, three TV layouts with video) into `docs/media/`; update `docs/devpost.md` and `docs/video.md` shot list.
- [ ] **Step 3:** `npm run deploy`; `curl -s https://stayboard.kalashshah47.workers.dev/api/health`; re-run `pw/sb-studio.mjs` and `pw/sb-faq.mjs` against production.
- [ ] **Step 4:** Commit `docs: studio, media limits, new screenshots`, then run the final whole-branch review per executing-plans.
