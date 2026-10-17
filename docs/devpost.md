# Devpost submission — Stayboard

**Track:** Fire TV. **Mini-challenges:** AWS Builder (Amazon Bedrock Nova 2 Lite), Open Source (MIT).

- Live dashboard: https://stayboard.keronlabs.com
- Source: https://github.com/kalashshah/stayboard
- Demo video: https://github.com/kalashshah/stayboard/releases/download/v0.1.0/stayboard-demo.mp4
- Friction log: https://github.com/kalashshah/stayboard/blob/main/docs/friction-log.md

## Tagline

Your rental's welcome screen, on the Fire TV. Guests ask the TV; you answer once.

## Inspiration

Every short-term-rental host answers the same five questions every week: the Wi-Fi password, checkout time, how the hot tub works, where to eat, whether there's a hair dryer. The TV is the one screen every guest looks at, and on Fire TV it's a Vega OS app away from being the house's front desk.

## What it does

- A Fire TV app on Vega OS that turns on to a welcome screen with the guest's name, Wi-Fi with a scannable QR code, a checkout checklist, house rules, a house guide, local picks and contacts.
- Ask the house: guests pick a question or type one on the TV, or scan a QR code and ask from their phone. Amazon Nova 2 Lite answers only from the host's guide. If the guide doesn't cover it, the TV says so and tells the host.
- A host dashboard with a live preview of the TV, autosave and pairing by a six-letter code. Unanswered questions land in an inbox. The host replies once; the guest sees the reply on the TV or phone, and it is saved as an FAQ for everyone after. The TV picks up changes within a minute.
- A design studio: looping background video, photo or slideshow, background music, five layouts, three bundled typefaces, colours, a logo, and tiles the host can rename, drag into a new order, or hide. Uploads land in Cloudflare R2 and the TV plays them through Vega's W3C media API.

## How we built it

- TV: React Native 0.83 for Vega (`@amazon-devices/react-native-kepler`), `TVFocusGuideView` for D-pad focus, `@amazon-devices/react-native-w3cmedia` `<Video>`/`<Audio>` for the backdrop and music, bundled OFL fonts, `@amazon-devices/react-native-qrcode-svg`, AsyncStorage for the device secret and the last config. Tested on the Vega Virtual Device.
- Backend: Next.js 16 route handlers running on a Cloudflare Worker through OpenNext, with D1 for data and R2 for host uploads, served with Range support and an immutable cache. The Bedrock Converse API gets a system prompt built from the property config and must return strict JSON. Temperature 0, 300 tokens, daily caps per guest page and overall. One layout engine in `shared/design.ts` is shared by the TV, the web preview and the guest page.
- Dashboard and guest page: Next.js 16 App Router with Tailwind 4 and AlignUI components, deployed on the same Worker. The guest page is server-rendered at `/g/<slug>` and reached from a QR code on the TV.

## Challenges

See the friction log. The big ones: Vega's 960×540 logical resolution isn't documented where you start, there's no screenshot or key-injection command for the virtual device (we found the emulator console and `inputd-cli`), and network privileges aren't spelled out.

## What's next

Appstore submission, booking-calendar sync for guest names and dates, multi-language answers, a screensaver mode, and an email digest of unanswered questions.

## Product feedback (per tool)

- **Vega SDK / Virtual Device:** installer and template are excellent; please document the logical resolution, add `vega virtual-device screenshot`, and document `inputd-cli`.
- **React Native for Vega:** `TVFocusGuideView autoFocus` and `hasTVPreferredFocus` were enough for a full D-pad app without a navigation library. The `TextInput` `auxOptions`/`keyboardUiMode` props are a nice touch.
- **W3C media on Vega:** `<Video>` and `<Audio>` played https MP4/MP3 on the virtual device first try, but `<Video>` silently draws nothing without `width`/`height` props, the eight manifest services plus the module id are only discoverable by reading `node_modules`, and bundled fonts must be referenced by file name. All in the friction log.
- **Amazon Bedrock Nova 2 Lite:** fast, cheap, followed the JSON-only instruction on every call. No complaints.
- **Devpost:** the hackathon page blocks non-browser clients, which made it hard to re-read the rules while building.
