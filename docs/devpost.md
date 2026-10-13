# Devpost submission — Stayboard

**Track:** Fire TV. **Mini-challenges:** AWS Builder (Amazon Bedrock Nova 2 Lite), Open Source (MIT).

## Tagline

Your rental's welcome screen, on the Fire TV. Guests ask the TV; you answer once.

## Inspiration

Every short-term-rental host answers the same five questions every week: the Wi-Fi password, checkout time, how the hot tub works, where to eat, whether there's a hair dryer. The TV is the one screen every guest looks at, and on Fire TV it's a Vega OS app away from being the house's front desk.

## What it does

- A **Fire TV app (Vega OS)** that turns on to a welcome screen with the guest's name, Wi-Fi with a scannable QR code, checkout checklist, house rules, a house guide, local picks and contacts.
- **Ask the house**: guests pick a question or type one on the TV (or scan a QR code and ask from their phone). Amazon Nova 2 Lite answers only from the host's guide. If the guide doesn't cover it, the TV says so and points to the host.
- A **host dashboard** with a live preview of the TV, autosave, pairing by a six-letter code, and an **inbox** where unanswered questions become FAQs with one click. The TV picks up changes within a minute.

## How we built it

- TV: React Native 0.83 for Vega (`@amazon-devices/react-native-kepler`), `TVFocusGuideView` for D-pad focus, `@amazon-devices/react-native-qrcode-svg`, AsyncStorage for the device secret and the last config. Tested on the Vega Virtual Device.
- Backend: Cloudflare Worker (Hono) + D1. Bedrock Converse API with a system prompt built from the property config; strict JSON output; daily caps.
- Dashboard and guest page: React 19 + Vite served by the same Worker.

## Challenges

See the friction log. The big ones: Vega's 960×540 logical resolution isn't documented where you start, there's no screenshot or key-injection command for the virtual device (we found the emulator console and `inputd-cli`), and network privileges aren't spelled out.

## What's next

Appstore submission, booking-calendar sync for guest names and dates, multi-language answers, a screensaver mode, and an email digest of unanswered questions.

## Product feedback (per tool)

- **Vega SDK / Virtual Device:** installer and template are excellent; please document the logical resolution, add `vega virtual-device screenshot`, and document `inputd-cli`.
- **React Native for Vega:** `TVFocusGuideView autoFocus` and `hasTVPreferredFocus` were enough for a full D-pad app without a navigation library. The `TextInput` `auxOptions`/`keyboardUiMode` props are a nice touch.
- **Amazon Bedrock Nova 2 Lite:** fast, cheap, followed the JSON-only instruction on every call. No complaints.
- **Devpost:** the hackathon page blocks non-browser clients, which made it hard to re-read the rules while building.
