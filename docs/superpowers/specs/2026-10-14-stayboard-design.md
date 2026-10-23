# Stayboard — design spec

**One line:** A Fire TV (Vega OS) welcome screen for short-term rentals that the host configures on a website, with an "Ask the house" feature that answers guest questions from the host's own content.

**Hackathon:** Amazon "Build, Ship, Shape" 2026, Fire TV track (+ AWS Builder and Open Source mini-challenges). Deadline 2026-10-23 12:00 PT.

**Why it's different from what's on the Appstore:** Hello Guest Screen, WelcomeScreen and Breezee show static info and charge $7–15/month. Stayboard adds a grounded AI concierge: guests ask the TV (or their phone) and get answers from the house guide; anything the guide can't answer lands in the host's inbox as a one-click FAQ. Free, open source, built on Vega OS (Amazon's new Fire TV platform), not Fire OS.

## Users

- **Host** — owns one or more rentals. Edits everything on the website. Never touches the TV after pairing.
- **Guest** — sees the TV when it turns on. Reads Wi-Fi, checkout, rules, guide, local picks, contacts. Asks questions on the TV or by scanning a QR code on their phone.

## Components

1. **Worker + D1** (Workers, Hono, TypeScript). API for hosts, TVs and guests. Calls Amazon Bedrock (Nova 2 Lite, `us.amazon.nova-2-lite-v1:0`, us-east-1) for answers. Serves the dashboard SPA and the guest page.
2. **Dashboard** (`src/`, React + Vite). Landing page, sign-up/sign-in, property editor with live TV preview, questions inbox, device pairing.
3. **Guest page** (`src/guest`, same SPA, route `/g/:slug`). Mobile web version of the TV screen with an ask box.
4. **TV app** (`tv/`, React Native 0.83 for Vega, `@amazon-devices/react-native-kepler`). Pair, home, detail screens, ask screen.

## Data model (D1)

```sql
hosts(id TEXT PK, email TEXT UNIQUE, pass_hash TEXT, salt TEXT, created_at INTEGER)
sessions(id TEXT PK, host_id TEXT, expires_at INTEGER)
properties(id TEXT PK, host_id TEXT, slug TEXT UNIQUE, config TEXT /*JSON*/, updated_at INTEGER, created_at INTEGER)
devices(code TEXT PK, secret TEXT UNIQUE, property_id TEXT NULL, label TEXT, paired_at INTEGER, last_seen_at INTEGER, created_at INTEGER)
questions(id TEXT PK, property_id TEXT, source TEXT /*tv|phone*/, question TEXT, answer TEXT, answered INTEGER, created_at INTEGER)
usage(day TEXT PK, calls INTEGER)
```

`config` is one JSON document (schema below). One column instead of nine tables: the host edits it as a whole, the TV reads it as a whole.

## Property config (JSON)

```ts
type PropertyConfig = {
  name: string                       // "Ocean View Loft"
  hostName: string                   // "Priya"
  welcome: { headline: string; message: string; guestName: string }   // headline supports {guest}
  stay: { checkIn: string; checkOut: string; checkoutSteps: string[] }  // "15:00", "11:00"
  wifi: { ssid: string; password: string }
  rules: string[]
  guide: { title: string; body: string }[]        // house manual sections
  faqs: { q: string; a: string }[]
  places: { name: string; category: string; note: string; distance: string }[]
  contacts: { label: string; value: string }[]
  appearance: {
    accent: string                                 // hex
    theme: 'dark' | 'light'
    backgroundUrl: string                          // optional photo
    tiles: Record<'wifi'|'checkout'|'rules'|'guide'|'places'|'contacts'|'ask', boolean>
  }
  ask: { enabled: boolean; tone: 'friendly' | 'formal'; fallback: string; suggested: string[] }
}
```

Validated server-side with zod. Strings capped (headline 80, message 400, guide body 4000, 40 items per list). Unknown keys stripped. `defaultConfig(name)` fills a complete, sensible document so a new property renders immediately.

## API

All JSON. Host routes need the session cookie. TV routes need `Authorization: Bearer <device secret>`.

| Route | Who | Does |
|---|---|---|
| `POST /api/auth/signup {email,password}` | public | create host, set cookie |
| `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | public/host | session |
| `GET /api/properties` | host | list |
| `POST /api/properties {name}` | host | create with `defaultConfig` |
| `GET /api/properties/:id` | host | config + devices + stats |
| `PUT /api/properties/:id {config}` | host | validate, save, bump `updated_at` |
| `DELETE /api/properties/:id` | host | delete property, unpair devices |
| `POST /api/properties/:id/pair {code}` | host | link a device code |
| `DELETE /api/properties/:id/devices/:code` | host | unpair |
| `GET /api/properties/:id/questions` | host | inbox, newest first, `answered` flag |
| `DELETE /api/properties/:id/questions/:qid` | host | dismiss |
| `POST /api/tv/register` | TV | new `{code, secret}` |
| `GET /api/tv/config` | TV | `{paired:false, code}` or `{paired:true, config, updatedAt, slug}`; updates `last_seen_at` |
| `POST /api/tv/ask {question}` | TV | answer |
| `GET /api/g/:slug` | public | config (minus nothing; Wi-Fi is meant for guests) |
| `POST /api/g/:slug/ask {question}` | public | answer, 60/day per slug |

Pairing code: 6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I). Device secret: 32 random bytes, base64url.

## Ask the house (Bedrock)

- Prompt = system text built from the config: name, host, check-in/out, checkout steps, Wi-Fi, rules, guide sections, FAQs, places, contacts, tone.
- Instruction: answer only from the house guide, two to four sentences, no invented facts. If the guide doesn't cover it, reply with `answered:false` and a short message pointing to the fallback contact.
- Output: `{"answered": boolean, "answer": string}` parsed leniently (first `{…}` in the text).
- Every question is logged with `answered`. Unanswered ones are the host's inbox; "Add as FAQ" prefills a FAQ with the question.
- Caps: 300 Bedrock calls/day globally (`usage` table), 60/day per property slug for the public guest route. Temperature 0, maxTokens 300.
- Nothing personal is sent: no guest identity, only the question text.

## Dashboard

- **Landing** (signed out): hero with the TV mock, three value points (configure once, guests ask the TV, unanswered becomes FAQs), sign-up/sign-in modal. Theme follows Lookout/Penny: General Sans, warm white, ink, hairline cards, pill buttons. Accent here is a warm terracotta instead of lime to feel hospitable.
- **Properties**: list, create.
- **Property editor**: left column tabs — Welcome, Stay & Wi-Fi, Rules, Guide, FAQs, Local picks, Contacts, Appearance, Ask, Devices, Inbox. Right column: live 16:9 preview of the TV home screen rendering the current config (web implementation of the same layout). Autosave with 600 ms debounce; "Saved" indicator.
- **Devices**: enter pairing code shown on TV; list of paired TVs with last-seen; unpair; guest page link + QR.
- **Inbox**: questions with answered/unanswered, "Add as FAQ", dismiss.

## TV app (Vega)

Screens, all D-pad navigable with visible focus rings:

1. **Pair** — big 6-char code, "Go to stayboard.../pair and enter this code", QR with the pairing URL. Polls `/api/tv/config` every 5 s until paired.
2. **Home** — background (photo or accent gradient), headline with guest name, message, clock, tile grid: Wi-Fi, Checkout, House rules, Guide, Local picks, Contacts, Ask the house. Hidden tiles respect `appearance.tiles`. Refreshes config every 60 s.
3. **Wi-Fi** — network name, password large, QR (`WIFI:T:WPA;S:…;P:…;;`) so phones join by scanning.
4. **Checkout** — time and steps as a checklist.
5. **Rules**, **Guide** (list of sections → section body), **Places** (cards), **Contacts**.
6. **Ask** — TextInput (system on-screen keyboard, `returnKeyType="search"`, `auxOptions="title:Ask the house"`), suggested questions as chips, answer card, and a QR "or ask from your phone" to `/g/:slug`.

State: in-memory + `@amazon-devices/react-native-async-storage__async-storage` for the device secret and last config (so a TV that reboots offline still shows the screen). Navigation: a small screen stack in app state with the Back key via `BackHandler` — no react-navigation dependency.

QR codes: `react-native-qrcode-svg` from the Vega supported list (`@amazon-devices/react-native-qrcode-svg`).

## Non-goals

- Booking-platform sync (Airbnb/Hostfully). Host types the guest name.
- Voice input on the TV (Alexa integration is not available to third-party Vega apps in this SDK).
- Payments, upsells, multi-language.

## Security and privacy

- Passwords PBKDF2-SHA256 (100k iterations) via Web Crypto; HttpOnly, SameSite=Lax session cookie, 30 days.
- Device secret never shown to the host; the TV only reveals the pairing code.
- Guest page exposes exactly what the TV shows. Questions are stored as text only.
- AWS IAM user limited to `bedrock:InvokeModel` on Nova 2 Lite; $3/month budget alarm already on the account.

## Testing

- `vitest` for the Worker: config validation and defaults, pairing-code alphabet, password hashing round trip, prompt building, answer parsing, daily cap.
- Dashboard and guest page: Playwright screenshots against the deployed Worker.
- TV: build the `.vpkg`, run on the Vega Virtual Device, screenshot every screen, exercise pairing and ask end to end against the deployed Worker.

## Demo path (for judges and the video)

1. Sign up, create "Ocean View Loft", edit Wi-Fi, rules, a guide section ("The hot tub"), two FAQs.
2. TV shows a pairing code; host enters it; TV flips to the welcome screen within 5 s.
3. Guest opens Ask, types "how do I turn on the hot tub" → answer from the guide.
4. Guest asks "is there a hair dryer" (not in guide) → polite "not in the guide, text Priya"; the question shows in the host's inbox → "Add as FAQ" → TV answers it next time.
