# Stayboard Studio: media, layouts and a better editor

Date: 2026-10-14. Builds on `2026-10-14-stayboard-design.md`. Approved in chat ("yes build it end to end and deploy").

## Intent

Hosts said the welcome screen is editable but not designable. This adds a design studio to the dashboard: background video, photo slideshows, music, layout presets, fonts, tile styling and drag-to-reorder tiles. Everything renders on three surfaces: the Fire TV app (Vega), the live web preview and the guest phone page. The TV stays D-pad friendly: no free-form canvas, every layout has a fixed focus order.

Success: a host uploads a 20 s MP4 and a track, picks "Poster" layout and a serif font, reorders tiles, and the paired TV shows it within a minute with the video looping silently and the music playing at the chosen volume.

Constraints carried over: no paid services (R2 free tier, Workers free plan), AWS under $5 total, secrets only in `.dev.vars` and Worker secrets, nothing pushed publicly without the user's say.

## Config changes (`worker/config.ts`)

A new top-level `design` object. `appearance` shrinks to `{ accent, theme }`. The old `appearance.backgroundUrl` and `appearance.tiles` are migrated, not kept.

```ts
design: {
  layout: 'hero' | 'centered' | 'split' | 'poster' | 'minimal'      // default 'hero'
  font: 'sans' | 'serif' | 'grotesk'                                 // default 'sans'
  headlineSize: 'sm' | 'md' | 'lg'                                   // default 'md'
  align: 'left' | 'center'                                           // default 'left'
  backdrop: {
    kind: 'color' | 'photo' | 'slideshow' | 'video'                  // default 'color'
    photos: string[]        // https URLs, max 8; 'photo' uses photos[0]
    video: string           // https URL, '' when none
    poster: string          // https URL still for the video, '' when none
    overlay: number         // 0..100 darkness over media, default 55
    blur: number            // 0..20 px, default 0
    interval: number        // slideshow seconds 5..60, default 10
  }
  music: { enabled: boolean; url: string; volume: number }          // volume 0..100, default 40, enabled false
  logo: string                                                       // https URL or ''
  tileStyle: 'glass' | 'solid' | 'outline'                           // default 'glass'
  radius: 'sharp' | 'rounded' | 'pill'                               // default 'rounded'
  showClock: boolean                                                 // default true
  showFooter: boolean                                                // default true
  tiles: { key: TileKey; label: string; sub: string; icon: IconKey; visible: boolean }[]
}
```

- `tiles` is the display order. Every `TileKey` appears exactly once (schema `refine`). `label` max 24, `sub` max 40; empty `sub` means "use the automatic subtitle" (Wi-Fi name, checkout time, counts).
- `IconKey` is a closed set of 14 glyph names rendered as Unicode characters on all surfaces: `wifi ◠, clock ◷, list ☰, book ▤, pin ◎, phone ✆, ask ?, star ★, heat ♨, coffee ☕, flag ⚑, mail ✉, home ⌂, sun ☀`. If the spike shows the TV font lacks a glyph, that glyph is dropped from the set.
- URL fields accept `https://` only, max 500 chars. Media served by Stayboard lives under `${APP_URL}/m/`.
- `upgradeConfig(raw: unknown): unknown` runs before zod in `parseConfig` and in `toProperty`: when `design` is missing it builds the default design, copies `appearance.backgroundUrl` into `backdrop.photos[0]` with `kind: 'photo'`, copies `appearance.tiles[k]` into each tile's `visible`, and deletes the two legacy keys. Idempotent.
- `defaultConfig` ships the default design. `visibleTiles(c)` (web, TV) returns `design.tiles` filtered by `visible` and `ask.enabled`.
- Zod `.default()` is not used for `design`; the upgrade step is the single migration path so old TV caches and old rows take the same route.

## Media storage

- R2 bucket `stayboard-media`, binding `MEDIA` in `wrangler.jsonc`. Keys are `<propertyId>/<uuid>.<ext>`.
- `PUT /api/properties/:id/media?kind=video|audio|image&name=<filename>`; body is the raw file; host session required. The Worker checks the `content-type` against the kind's allowlist and the `content-length` against the cap, then streams the body to R2 with `httpMetadata.contentType`. Response `{ key, url, size }` where `url = ${APP_URL}/m/${key}`.

  | kind | types | cap |
  |---|---|---|
  | video | video/mp4 | 40 MB |
  | audio | audio/mpeg, audio/mp4, audio/x-m4a | 10 MB |
  | image | image/jpeg, image/png, image/webp | 5 MB |

- Per-property quota 150 MB, computed by listing the prefix. Over quota → 413 with a message naming the quota.
- `GET /api/properties/:id/media` → `{ files: { key, url, size, uploaded, contentType }[] }`.
- `DELETE /api/properties/:id/media/<file>` deletes one object (host must own the property; key is rebuilt server-side from the property id so a host cannot delete another host's file).
- `GET /m/:propertyId/:file` is public, no auth. Passes the request `Range` header through to R2, returns 206 with `content-range` for ranged reads, sets `cache-control: public, max-age=31536000, immutable`, `accept-ranges: bytes` and the stored content type. 404 when missing.
- Deleting a property deletes its media prefix (list then batch delete).
- `.gitignore` unchanged; nothing media-related is committed.

## Dashboard (`src/`)

### Studio layout

- `Editor.tsx` becomes a shell: left sidebar nav grouped as **Content** (Welcome, Stay & Wi-Fi, House rules, Guide, FAQs, Local picks, Contacts), **Design** (Design), **Concierge** (Ask the house, Inbox), **TV** (Devices). Main area: for Content and Concierge tabs the form panel sits left and a device-framed preview sticks on the right (as now, larger). For Design, the preview spans the full width at the top (sticky) and the control rail sits below it in sections.
- The TV frame shows the property name, a "Home screen" caption, and a small "Open on TV within a minute" note. The preview renders the same layout engine the TV uses (see Rendering).
- Status pill (Saved / Saving / error) and "Guest page" link stay in the header. Autosave behaviour is unchanged.

### Design tab (`src/pages/Design.tsx`)

Sections, each a card with a heading and a one-line hint:

1. **Backdrop**: segmented control Color / Photo / Slideshow / Video. Photo and Slideshow show a photo strip (thumbnails, drag file or click to upload, remove, URL paste field). Video shows an uploader with the poster frame it captured; Overlay (0–100) and Blur (0–20) sliders apply to all media kinds; Interval slider for slideshows.
2. **Music**: toggle, uploader or URL, volume slider, "plays on the TV only" note.
3. **Layout**: five preset cards with mini wireframes; current one outlined.
4. **Type**: font pairing (three cards rendered in the font), headline size (S/M/L), alignment (Left/Center).
5. **Tiles**: ordered list of tile cards; each card has a drag handle, up/down buttons (keyboard accessible), visibility toggle, label input, subtitle input (placeholder shows the automatic subtitle), icon picker (14 glyph buttons).
6. **Details**: accent color, theme, tile style (Glass/Solid/Outline), corner radius (Sharp/Rounded/Pill), logo uploader, Show clock, Show footer.

Drag-and-drop uses native HTML5 DnD (`draggable`, `dragstart`, `dragover`, `drop`) on the tile cards; no library.

### Uploader (`src/components/Upload.tsx`)

- Accepts a kind, shows a drop zone or a thumbnail/filename when set; click opens a file picker filtered by kind; drag-and-drop works. Uses XHR for progress (percentage in the zone). On success calls `onDone(url)`. Errors from the Worker (type, size, quota) show inline.
- For video it captures a poster: loads the file in a hidden `<video>`, seeks to 0.5 s, draws to a canvas (max 1280 wide), encodes JPEG 0.8, uploads as `kind=image`, and returns both URLs. If capture fails (codec unsupported in the browser) the video still uploads and `poster` stays `''`.
- A "Use a link instead" toggle reveals an https URL input for hosts who already host files.

### Other pages

- `Preview.tsx` is rewritten as the shared layout renderer (see Rendering) and gains a `frame` prop for the device bezel.
- `Guest.tsx`: hero uses the backdrop photo or poster (never video or music), the chosen font, accent, logo, and tile labels/order for section order and headings.
- `Properties.tsx`: each property card shows a small live preview thumbnail (the same renderer at 240 px), device count and unanswered count.
- `Landing.tsx`: hero demo shows the Poster layout with a photo backdrop and a serif font so the designer is visible on first load; a "Design it your way" section with three small previews (Hero, Split, Poster).
- `styles.css`: sidebar, studio grid, segmented controls, sliders, cards, drop zones, device frame; keep the existing palette and General Sans for the dashboard chrome. The preview fonts load from Google Fonts (`Inter`, `Fraunces`, `Space Grotesk`).

## Rendering (one layout engine, three renderers)

A pure helper `layoutFor(c)` in `worker/config.ts` (shared with web; mirrored in `tv/src/types.ts`) returns per-layout numbers so the renderers agree:

| layout | top bar | headline block | media card | tiles |
|---|---|---|---|---|
| hero | name/logo + clock | bottom-left over backdrop | none | one row, bottom |
| centered | centered name/logo, clock right | centered, vertically middle | none | one row, bottom |
| split | name/logo + clock | left column, vertically centered | right column 44 % wide, rounded, shows photo/poster/video | one row, bottom |
| poster | logo only, no name | bottom-left, headline one size larger, gradient scrim | none (backdrop is the media) | compact row (smaller tiles), bottom |
| minimal | none | top-left, small | none | one row, vertically centered; no footer |

Shared numbers (TV logical px at 960×540; web preview uses the same values in `cqw`, 1 px = 0.104 cqw): headline sizes sm 34 / md 46 / lg 60; tile heights normal 105, compact 72; radius sharp 4 / rounded 13 / pill 24; tile styles glass = `rgba(255,255,255,0.08)` + 1 px `rgba(255,255,255,0.14)` border, solid = theme tile color, outline = transparent + 2 px border.

Backdrop rendering:
- color: current flat color + accent glow.
- photo: cover image, overlay `rgba(0,0,0,overlay/100)` (light theme uses white overlay), blur if > 0.
- slideshow: same as photo, index advances every `interval` s with a 600 ms crossfade (two stacked images).
- video: TV plays `<Video src loop muted autoplay scalingmode="fill">` under the overlay; web preview plays an HTML `<video muted loop autoplay playsinline>`; guest page shows the poster. When `poster` is set, it shows until the video's first frame.

Music: the TV mounts one `<Audio src loop autoplay volume>` at the app root while `music.enabled && url`; remounts on URL change; volume applied live. Web preview and guest page never play music.

Fonts: TTFs bundled in `tv/assets/fonts/` (Inter, Fraunces, Space Grotesk, OFL), referenced by `fontFamily`. The web uses the same families from Google Fonts. If the spike shows Vega ignores bundled fonts, `font` still applies on web and guest, the TV uses the system font, and the README says so.

## TV app (`tv/`)

- Add `@amazon-devices/react-native-w3cmedia@~2.3.2`; Babel preset change and `manifest.toml` `[wants.service]` entries (`com.amazon.mediametrics.service`, `com.amazon.media.server`, `com.amazon.gipc.uuid.*`, `com.amazon.media.playersession.service`, `com.amazon.mediabuffer.service`, `com.amazon.mediatransform.service`, `com.amazon.audio.stream`, `com.amazon.audio.control`) and `[offers.service] com.amazon.gipc.uuid.*`.
- `src/types.ts` mirrors the new config, `upgradeConfig`, `layoutFor`, `visibleTiles`, icon glyph map.
- `src/ui.tsx`: `Screen` takes the whole config; renders the backdrop kinds; `themeFor` adds `font` and radius numbers.
- `src/screens/Home.tsx` renders the five layouts from `layoutFor`, tile labels/subtitles/icons/order from `design.tiles`, logo via `Image`, clock/footer toggles.
- `src/App.tsx`: mounts `<Music>` from `src/Music.tsx`; cached state passes through `upgradeConfig` on load so an old cache cannot crash the new build.
- Jest: `types.spec.ts` grows with `upgradeConfig`, `visibleTiles` order and `layoutFor` cases.

Spike (first task, throwaway): a scratch screen in the running app plays a public MP4 and an MP3 on the Vega Virtual Device and renders text in a bundled TTF and the 14 glyphs. Outcome recorded in the friction log and used to settle the two fallbacks above. The scratch screen is deleted before the next task.

## Errors and limits

- Upload rejected: inline message in the uploader ("MP4 only", "Videos up to 40 MB", "This property has used its 150 MB"). The config is unchanged.
- Media URL 404 on the TV (deleted file): `Image` and `Video` errors are swallowed; the backdrop falls back to color. Music failure is silent.
- Slideshow with zero photos behaves as color. Video kind with empty `video` behaves as `poster` photo if set, else color.
- Config validation errors surface in the status pill as today.

## Testing

- Worker (vitest): `upgradeConfig` on a legacy config (background → photo, tiles → visible, idempotent); schema rejects duplicate or missing tile keys, out-of-range sliders, non-https URLs; `layoutFor` returns the table above; media validation (kind/type/size/quota) as pure functions in `worker/media.ts`; range header parsing.
- TV (jest): `upgradeConfig`, `visibleTiles` honours order and visibility, `layoutFor`.
- E2E (Playwright, scratchpad, against the live site): upload a small MP4 and MP3 fixture, switch layout to Poster, reorder tiles by drag, reload and confirm persistence, open the guest page and confirm the poster and order.
- Simulator: screenshots of all five layouts with a video backdrop, plus a short recording with music audible is not possible to capture; verify via `adb logcat`/app log that the Audio element reached `playing`.

## Out of scope

Free-form canvas, per-screen (Wi-Fi, Ask) design, video on the guest page, transcoding, multiple music tracks, a preview switcher for non-home screens.
