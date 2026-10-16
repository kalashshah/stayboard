# Stayboard

**Your rental's welcome screen, on the Fire TV. Guests ask the TV; you answer once.**

Stayboard is a Fire TV app built on **Vega OS** for short-term rentals. The host configures everything on a website: Wi-Fi, check-in and checkout, house rules, a house guide, FAQs, local picks, contacts. A **design studio** sets how the screen looks: a looping background video, photo or slideshow, music, five layouts, three typefaces, colours, a logo, and tiles you can rename, reorder or hide. The TV shows it the moment it turns on. Guests can **ask the TV anything** and get an answer grounded in the host's own content via **Amazon Bedrock (Nova 2 Lite)**. Questions the guide can't answer land in the host's inbox as a one-click FAQ, so the next guest gets an instant answer.

Built for the Amazon "Build, Ship, Shape" Developer Hackathon 2026, Fire TV track (also the AWS Builder and Open Source mini-challenges).

- Live dashboard: https://stayboard.keronlabs.com
- Friction log: [docs/friction-log.md](docs/friction-log.md)
- Design spec: [docs/superpowers/specs/2026-10-14-stayboard-design.md](docs/superpowers/specs/2026-10-14-stayboard-design.md)

## Why

Welcome-screen apps already exist on Fire TV (Hello Guest Screen, WelcomeScreen, Breezee). They show static information and charge $7–15 a month. Stayboard is free, open source, built on Amazon's new Vega OS, and adds the part hosts actually spend their evenings on: answering the same questions over and over. The TV answers from the house guide; the host only ever fills a gap once.

## What's in the box

| Part | Where | Stack |
|---|---|---|
| Fire TV app | `tv/` | React Native 0.83 for Vega (`@amazon-devices/react-native-kepler` 4), `react-native-w3cmedia` for video and audio, QR codes, AsyncStorage, bundled fonts |
| API + database + media | `src/app/api/`, `worker/`, `migrations/` | Next.js route handlers on a Cloudflare Worker via OpenNext; D1/R2 logic in `worker/`. D1 (SQLite), R2 for host uploads (ranged, immutable), Amazon Bedrock Nova 2 Lite via `aws4fetch` |
| Host dashboard | `src/app/` | Next.js 16 (App Router) + Tailwind 4 with AlignUI components; design studio with a live framed preview of the TV, drag-to-reorder tiles, uploads with progress, autosave |
| Guest phone page | `src/app/g/[slug]/` | Server-rendered at `/g/<slug>`, reached from a QR code on the TV; same backdrop, font and tile order as the TV |

### Design studio

One `design` object in the property config drives three renderers (TV, web preview, guest page) through the same pure helpers (`layoutFor`, `backdropFor`, `tileSub` in `shared/design.ts`, imported by all three):

| Control | Options |
|---|---|
| Backdrop | Colour with an accent glow · one photo · slideshow of up to 8 photos (5–60 s, crossfade) · looping muted video with a poster frame. Darken and blur sliders. |
| Music | One MP3/M4A, loops on the TV at the chosen volume. Never plays on the phone page. |
| Layout | Hero · Centered · Split (text beside the media) · Poster (full-bleed, compact tiles) · Minimal. Every layout keeps one left-to-right tile row for the remote. |
| Type | Inter, Fraunces or Space Grotesk (OFL, bundled in the TV app), headline size, alignment. |
| Tiles | Drag by the grip (mouse or touch) or use ↑↓, rename, custom subtitle, 14 icons, show/hide. |
| Details | Accent colour, dark/light, glass/solid/outline tiles, sharp/rounded/pill corners, logo, clock, footer. |

Background video looks best at 1080p: the simulator's software scaler shows faint seams when it upscales smaller clips, and real TVs are 1080p or 4K anyway. Uploads go straight to R2 through the Worker (`PUT /api/properties/:id/media`): MP4 up to 40 MB, MP3/M4A up to 10 MB, JPG/PNG/WebP up to 5 MB, 150 MB per property. The browser captures a JPEG poster from uploaded videos so the phone page has a still. Files are served from `/m/<property>/<file>` with `Range` support and a one-year immutable cache.

### TV screens

Pair → Home (welcome with the guest's name, clock, tiles) → Wi-Fi (password + scannable QR) → Checkout (times + checklist) → House rules → House guide (topics + FAQs) → Local picks → Contacts → **Ask the house** (suggested questions, on-screen keyboard, answer card, QR to ask from a phone).

All screens are D-pad navigable with visible focus rings and work with the remote's Back button. The TV polls for config every 60 s (every 5 s while unpaired) and keeps the last config in storage so a reboot while offline still shows the screen.

### How "Ask the house" stays honest

The Worker builds a system prompt from the property config (stay, Wi-Fi, rules, guide, FAQs, places, contacts) and asks Nova 2 Lite to answer **only** from it, returning `{"answered": bool, "answer": string}`. Unanswered questions get a short "not in the guide" reply plus the host's fallback line, and show up in the inbox. Temperature 0, 300 max tokens, a 300-call global daily cap and 60 per guest page per day. No guest identity is sent to the model.

## Run it yourself

Prerequisites: Node 20+, a Cloudflare account, an AWS account with Bedrock access to `us.amazon.nova-2-lite-v1:0` in us-east-1, and (for the TV) the Vega SDK on a Mac or Linux machine.

```bash
# API + dashboard
npm install
npx wrangler d1 create stayboard            # put the id in wrangler.jsonc
npx wrangler d1 migrations apply stayboard --remote
npx wrangler r2 bucket create stayboard-media   # host uploads (free tier is plenty)
cp .dev.vars.example .dev.vars              # AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (IAM user with bedrock:InvokeModel only)
                                            # GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (OAuth web client; redirect URI <origin>/api/auth/google/callback)
npx wrangler secret bulk .dev.vars
npm run deploy                              # opennextjs-cloudflare build + deploy
npm test                                    # vitest: config schema, hashing, prompt, answer parsing

# TV app (Vega SDK installed: curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash)
cd tv && npm install
# point tv/src/api.ts API_BASE at your Worker URL, then:
npm run build:release
vega virtual-device start
vega run-app build/aarch64-release/stayboard_aarch64.vpkg com.kalashshah.stayboard.main -d VirtualDevice
```

For a real Fire TV Stick running Vega OS: enable developer mode, `vega device install-app --packagePath build/armv7-release/stayboard_armv7.vpkg`, then `vega device launch-app --appName com.kalashshah.stayboard.main`.

## For judges (no Fire TV needed)

1. Open https://stayboard.keronlabs.com and create an account (Continue with Google, or any email and a password of 8+ characters).
2. Create a property. It comes pre-filled with a sensible house guide; edit anything and watch the TV preview on the right update.
3. Open **Design studio**: drop in a short MP4 (or paste an https link), pick **Poster** and **Fraunces**, drag a tile to a new spot. The preview plays the video; the TV would too.
4. Open **Guest page ↗** on your phone: that's exactly what the TV shows, plus the ask box. Ask "when is checkout?" then "is there a hair dryer?".
5. Back in the editor, open **Inbox**: the hair-dryer question is waiting. Click **Add as FAQ**, type the answer. Ask again on the phone.
6. To see the real TV app, run it on the Vega Virtual Device (above) and pair it from **Devices** with the six-letter code the TV shows.

## Screenshots (Vega Virtual Device and dashboard)

Design studio on the TV: the same property in five layouts, with a looping video, a slideshow, a blurred photo and a flat colour behind it.

| | |
|---|---|
| ![Poster layout, video backdrop, Fraunces](docs/media/tv-studio-poster.png) | ![Hero layout, slideshow, Inter](docs/media/tv-studio-hero.png) |
| ![Split layout, video with media card](docs/media/tv-studio-split.png) | ![Centered layout, blurred photo, Space Grotesk](docs/media/tv-studio-centered.png) |
| ![Minimal layout, light theme](docs/media/tv-studio-minimal.png) | ![Design studio in the dashboard](docs/media/web-studio.png) |
| ![Tile sorter](docs/media/web-studio-tiles.png) | ![Properties with live thumbnails](docs/media/web-properties.png) |

The rest of the app:

| | |
|---|---|
| ![Pair](docs/media/tv-pair.png) | ![Home](docs/media/tv-home.png) |
| ![Wi-Fi](docs/media/tv-wifi.png) | ![Your stay](docs/media/tv-checkout.png) |
| ![Guide](docs/media/tv-guide.png) | ![Local picks](docs/media/tv-places.png) |
| ![Ask](docs/media/tv-ask.png) | ![Answer](docs/media/tv-ask-answer.png) |
| ![House rules](docs/media/tv-rules.png) | ![Contacts](docs/media/tv-contacts.png) |
| ![Landing](docs/media/web-landing.png) | ![Editor](docs/media/web-editor.png) |
| ![Inbox](docs/media/web-inbox.png) | ![Guest page](docs/media/phone-guest.png) |

## Security and privacy

- Passwords: PBKDF2-SHA256, 100k iterations, Web Crypto. Sessions: HttpOnly, Secure, SameSite=Lax cookie, 30 days.
- TVs authenticate with a random 32-byte secret that is never shown to anyone; hosts only see the six-letter pairing code.
- The guest page exposes exactly what the TV shows. Questions are stored as text only.
- Uploads are type- and size-checked in the Worker, stored under the property's own prefix, deleted with the property, and served without listing. URL fields accept `https://` only.
- The IAM user can only call `bedrock:InvokeModel` on Nova 2 Lite. A $3/month budget alarm is on the account.

## Path to production

- Appstore submission of the Vega package (icon, listing, device testing on a Fire TV Stick 4K Select).
- Booking sync (Airbnb/Hostfully iCal) to fill the guest name and stay dates automatically.
- Multi-language answers (Nova handles it; the UI needs copy) and a screensaver mode for idle TVs.
- Email digest of unanswered questions.

## License

MIT. See [LICENSE](LICENSE).
