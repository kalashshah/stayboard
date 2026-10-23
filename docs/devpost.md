# Devpost submission — Stayboard

**Track:** Fire TV. **Mini-challenges:** AWS Builder (Amazon Bedrock Nova 2 Lite), Open Source (MIT).

- Live dashboard: https://stayboard.keronlabs.com
- Source: https://github.com/kalashshah/stayboard
- Demo video: https://github.com/kalashshah/stayboard/releases/download/v0.1.0/stayboard-demo.mp4
- Friction log: https://github.com/kalashshah/stayboard/blob/main/docs/friction-log.md

## Tagline

A Fire TV app for rentals where guests ask the TV about the house. Amazon Nova answers from the host's guide, and anything it can't answer goes to the host, who answers it once.

## Inspiration

Every short-term-rental host answers the same five questions every week: the Wi-Fi password, checkout time, how the hot tub works, where to eat, whether there's a hair dryer. Every guest looks at the TV, and with a Vega OS app on a Fire TV it can be the house's front desk.

## What it does

- Ask the house: guests pick a suggested question or type one with the remote, or scan a QR code and ask from their phone. Amazon Nova 2 Lite answers only from what the host wrote (the guide, FAQs, rules, Wi-Fi, checkout, local picks). If that doesn't cover the question, the TV says so, gives the host's fallback line, and sends the question to the host's inbox.
- The host replies once. The guest sees the reply on the TV or phone, and it is saved as an FAQ, so Nova answers it for every guest after.
- The rest of the screen: the TV turns on to a welcome screen with the guest's name, Wi-Fi with a scannable QR code, a checkout checklist, house rules, a house guide, local picks and contacts.
- A host dashboard with a live preview of the TV, autosave and pairing by a six-letter code. The TV picks up changes within a minute.
- A design studio: looping background video, photo or slideshow, background music, five layouts, three bundled typefaces, colours, a logo, and tiles the host can rename, drag into a new order, or hide. Uploads go to R2 object storage, and the TV plays them through Vega's W3C media API.

## How we built it

- TV: React Native 0.83 for Vega (`@amazon-devices/react-native-kepler`), `TVFocusGuideView` for D-pad focus, `@amazon-devices/react-native-w3cmedia` `<Video>`/`<Audio>` for the backdrop and music, bundled OFL fonts, `@amazon-devices/react-native-qrcode-svg`, AsyncStorage for the device secret and the last config. Tested on the Vega Virtual Device.
- AI: the Worker calls the Bedrock Converse API (Nova 2 Lite, us-east-1) with a system prompt built from the property config and tells the model to answer only from it. The model must return `{"answered": bool, "answer": string}`, and `answered: false` is what sends a question to the inbox. Temperature 0, 300 max tokens, 60 calls per guest page a day and 300 overall. No guest identity goes to the model.
- Backend: Next.js 16 route handlers running on Workers through OpenNext, with D1 for data and R2 for host uploads, served with Range support and an immutable cache. One layout engine in `shared/design.ts` is shared by the TV, the web preview and the guest page.
- Dashboard and guest page: Next.js 16 App Router with Tailwind 4 and AlignUI components, deployed on the same Worker. The guest page is server-rendered at `/g/<slug>` and reached from a QR code on the TV.

## Challenges

The [friction log](https://github.com/kalashshah/stayboard/blob/main/docs/friction-log.md) has all 18 entries. These cost the most time:

- Vega lays out a 1080p TV at 960×540 logical points, and the getting-started docs don't say so. Our first build came up at double size.
- A background `<Audio>` track took over the remote's Back button and closed the app until we set `audioUsage` to `USAGE_GAME`.
- `<Video>` played but drew nothing until we passed `width` and `height` props.
- The virtual device has no screenshot or key-injection command, so we used the emulator console and `inputd-cli`.

## What we learned

On a TV, every screen needs one obvious place for the D-pad to land, and `TVFocusGuideView` handled that without a navigation library. Letting the model say it doesn't know turned out to be the useful part of the AI: each `answered: false` marks a gap in the guide, and the host's reply fills it for the next guest.

## What's next

Appstore submission, booking-calendar sync for guest names and dates, multi-language answers, a screensaver mode, and an email digest of unanswered questions.

## Product feedback

### Vega SDK, CLI and Vega Virtual Device

- **What we used it for:** building, packaging and running the TV app (`vega run-app`, `vega virtual-device`), and testing every screen on the virtual device.
- **What worked well:** the one-line installer and the `helloWorld` template. `vega run-app … -d VirtualDevice` installs and launches in one step, and the Release build bundles the JS, so it runs without Metro.
- **What needs work:** the 960×540 logical resolution isn't documented where you start. There's no screenshot command and no documented way to send remote keys (we used the emulator console and `inputd-cli`). The installer's `NONINTERACTIVE` mode isn't documented. The virtual device once exited between two runs with nothing in the log.
- **Onboarding:** a fresh Mac got from nothing to an app on the virtual TV in about twenty minutes.
- **Would we build with it again?** Yes. Getting started was quick, and the problems we hit have workarounds. All of them are in the friction log.

### React Native for Vega (`@amazon-devices/react-native-kepler`)

- **What we used it for:** the whole TV UI, including D-pad focus, the on-screen keyboard for Ask the house, QR codes (`react-native-qrcode-svg`) and AsyncStorage for the device secret and the cached config.
- **What worked well:** `TVFocusGuideView` with `autoFocus` and `hasTVPreferredFocus` was enough for a full D-pad app with no navigation library. The ported QR and AsyncStorage packages behave like upstream.
- **What needs work:** pressing Select on a focused `TextInput` opens the keyboard and also types its first key. The remote's Enter key doesn't fire `onSubmitEditing`. Bundled fonts have to be referenced by file name, not family name. Ported library versions (`3.0.9000000001`) look like typos and aren't explained.
- **Onboarding:** the template is standard React Native, so the first screens needed nothing new.
- **Would we build with it again?** Yes. Our React Native knowledge carried straight over to the TV.

### W3C Media on Vega (`@amazon-devices/react-native-w3cmedia`)

- **What we used it for:** the looping background video and the background music.
- **What worked well:** https MP4 and MP3 played on the virtual device first try, with loop, mute and volume.
- **What needs work:** `<Video>` draws nothing without `width`/`height` props, and it ignores position and transform styles. The eight manifest services and the module id can only be found by reading `node_modules`. A background `<Audio>` track takes over the Back button and closes the app unless you set `audioUsage` to `USAGE_GAME`.
- **Onboarding:** audio worked first try. Video took longer, because of the missing `width`/`height` props and the manifest entries.
- **Would we build with it again?** Yes. It's the standard media API, and once the manifest was right it was reliable.

### Amazon Bedrock with Nova 2 Lite (AWS)

- **What we used it for:** every Ask the house answer. Our Worker signs requests with `aws4fetch` and calls the Bedrock Converse API (`us.amazon.nova-2-lite-v1:0`, us-east-1). The system prompt is built from the host's guide, FAQs, rules, Wi-Fi, checkout, local picks and contacts. The model must reply with `{"answered": bool, "answer": string}`, and `answered: false` sends the question to the host's inbox. Temperature is 0 and max tokens 300, with daily caps of 60 calls per guest page and 300 overall. An IAM user that can only call `bedrock:InvokeModel` on Nova 2 Lite holds the credentials, and a $3/month budget alarm is set on the account. Code: [`worker/ask.ts`](https://github.com/kalashshah/stayboard/blob/main/worker/ask.ts).
- **What worked well:** it answered grounded questions correctly on the first try, followed the JSON-only instruction on every call, and costs well under a cent per question. The Converse API works over plain HTTPS, so it runs on a non-AWS edge runtime with no SDK.
- **What needs work:** nothing blocked us. A Converse option that guarantees a JSON schema would let us drop our parsing fallback.
- **Onboarding:** the IAM policy scoped to one inference profile plus the foundation model ARN worked unchanged from a previous project.
- **Would we build with it again?** Yes. It followed the JSON format on every call, and because the Converse API is plain HTTPS we could call it from our Worker without the AWS SDK.

## Feature requests

- **`vega virtual-device screenshot` and `vega device press-key`:** these would let us record demos and run UI tests without the emulator console. Important.
- **A documented logical resolution in the template README:** our first build came up at double size. Important.
- **A CLI command that prints the manifest entries a dependency needs:** this would have saved the W3C media setup. Nice to have.
- **Let the remote's Enter key submit a `TextInput`:** guests shouldn't have to hunt for the keyboard's Search button. Important.

## Open source

- **Repository:** https://github.com/kalashshah/stayboard (MIT, created during the hackathon window)
- **GitHub username:** kalashshah
- **What we did:** we published the whole project under MIT. That's the Vega TV app, the Next.js dashboard and API on Workers, the guest phone page, the D1 migrations, and a friction log with 18 entries.
- **How it works:** one `design` object drives three renderers (the TV, the web preview and the phone page) through shared pure helpers in `shared/design.ts`. The Bedrock integration is one plain-HTTPS function in `worker/ask.ts`. Setup and deploy steps are in the README, and the `.vpkg` builds are on the release.
- **Why it matters:** it's a full, working Vega OS app that other developers can read. It shows D-pad focus without a navigation library, W3C media playback with a working manifest, on-screen keyboard handling and a grounded LLM feature. Hosts get a free alternative to welcome-screen apps that charge $7–15 a month.

## Credits

The forest backdrop in some TV screenshots is from Big Buck Bunny (© Blender Foundation, CC BY 3.0).
