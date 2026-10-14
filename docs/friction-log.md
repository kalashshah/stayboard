# Friction log — Stayboard (Fire TV / Vega OS)

What slowed us down while building a Vega app plus an AWS-backed service in one night. Dated 2026-10-14, Vega SDK 0.24.12112, CLI 1.4.4, macOS 26.7 on Apple Silicon.

## Vega SDK and Virtual Device

1. **Logical resolution is not stated where you start.** The hello-world template, "Build an app" and the React Native for Vega overview never say that a 1080p Fire TV renders at **960×540 logical points (2×)**. Our first build, laid out for 1920×1080, came up at double size. We found the number by taking a screenshot and measuring a font. One sentence in the template README ("design for 960×540; assets at 2×") would have saved an hour. *Severity: medium. Fix: document it in the template and the RN overview.*

2. **No screenshot command for the Vega Virtual Device.** `vega virtual-device --help` and `vega device --help` have no capture command; the docs point to "Dump Render Tree" (XML). The VVD is built on the Android emulator, so the emulator console still works: `adb -s emulator-5554 emu screenrecord screenshot <dir>` writes a 1920×1080 PNG. That path is undocumented and only works if you guess that `adb` can talk to the VVD at all. *Severity: medium. Fix: add `vega virtual-device screenshot <file>`.*

3. **No documented way to send remote keys to the VVD from a script.** The docs list GUI keyboard shortcuts only. We found two: the emulator console (`adb emu event send EV_KEY:KEY_RIGHT:1`) and the in-guest `inputd-cli` after `vsm developer-mode enable`. D-pad keys worked through the console; which key code means "Select" took trial and error. *Severity: medium for anyone automating UI tests. Fix: document `inputd-cli` on the "Run apps" page and name the Select key.*

4. **Installer has a non-interactive mode that isn't documented.** `get_vvm.sh` honors `NONINTERACTIVE=true` and `VEGA_SDK_VERSION`, but the install page only describes the prompts. We only knew because we read the script. *Severity: low. Fix: document the env vars; CI users need them.*

5. **Network privileges are unclear.** The manifest docs show camera and media privileges and a `net-info` privilege for `react-native-netinfo`. Nothing says whether plain `fetch` needs a privilege. It doesn't (our app talks to a Cloudflare Worker with no manifest changes), but we only learned that by trying. *Severity: low. Fix: one line on the manifest page: "outbound HTTPS needs no privilege".*

6. **Ported library versions look like typos.** `@amazon-devices/react-native-svg@3.0.9000000001` and `...async-storage__async-storage@2.1.9000000001`. They install fine, but the version scheme (`<major>.<minor>.9000000001`) isn't explained on the supported-libraries page, and `npm view` is the only way to find the exact string. *Severity: low. Fix: explain the scheme or show the full install line per library.*

7. **Devpost rules can't be fetched programmatically.** The hackathon page returns 403 to non-browser clients, so track rules had to be reconstructed from community posts. *Severity: low (Devpost, not Amazon), but the Fire TV track rules deserve a copy on developer.amazon.com.*

8. **Release build is what you want for the VVD; the docs lead with Debug.** A Debug `.vpkg` expects Metro; the Release build bundles JS and just runs. The "Build an app" page mentions both modes without saying which one to use for a quick "does it run?" check. *Severity: low.*

## AWS (Bedrock Nova 2 Lite)

9. **Nothing to report on the model.** Nova 2 Lite through the Converse API answered grounded questions correctly on the first try, returned clean JSON when asked, and costs well under a cent per question. The IAM policy that scopes a user to one inference profile plus the foundation model ARN worked unchanged from our previous project.

## Media and fonts (`@amazon-devices/react-native-w3cmedia`)

10. **The `<Video>` component draws nothing unless you pass `width` and `height` props.** Styling it with `StyleSheet.absoluteFill` gave a playing element (the `playing` event fired, `currentTime` advanced) and an empty box. Adding `width={…} height={…}` made frames appear. Neither the README nor the "W3C Media API" guide says the props are required. *Severity: medium.* The package's `VideoProps` typing lists them as optional.

11. **Manifest needs eight `[[wants.service]]` entries plus an `[offers]` block, and the module id is only in `kepler-compatibility.json`.** The README lists the services but not the `[[needs.module]] id = "/com.amazon.kepler.w3cmedia_2@IW3cmedia_3"` line; I found the id by opening `node_modules/@amazon-devices/react-native-w3cmedia/kepler-compatibility.json`. A `vega` CLI command that prints the manifest lines a dependency needs would remove this step entirely. *Severity: medium.*

12. **Bundled fonts are addressed by file name, not family name.** TTFs in `assets/fonts/` ship inside the `.vpkg` with no config, which is great, but `fontFamily: 'Fraunces'` silently falls back to the system font while `fontFamily: 'Fraunces-Regular'` (the file name) works, and `fontWeight: '600'` does not pick `Fraunces-SemiBold.ttf` for you. The expo-font page hints at the file-name rule; the core docs don't mention it. *Severity: low.*

**What worked:** on the Vega Virtual Device an https MP4 looped (muted) and an https MP3 reached `playing` with `<Audio autoplay loop volume>` on the first try, and all of our Unicode tile glyphs rendered (two as colour emoji).

## What worked well

- The one-line SDK installer, the `helloWorld` template and `vega run-app … -d VirtualDevice` took a fresh Mac from zero to an app on the virtual TV in about twenty minutes.
- `TVFocusGuideView` with `autoFocus` and `hasTVPreferredFocus` gave sensible D-pad focus with no extra library.
- `@amazon-devices/react-native-qrcode-svg` and AsyncStorage worked exactly like their upstream packages.
