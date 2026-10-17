# Demo video

2 minutes 45 seconds, 1920×1080. The file is attached to the GitHub release (`stayboard-demo.mp4`), and a silent cut (`stayboard-demo-silent.mp4`) is there for anyone who wants to record their own voice over it. The narration in the published cut is macOS text-to-speech; the lines below are the script.

## Shot list

| Time | Shot | Narration |
|---|---|---|
| 0:00 | Title card | |
| 0:03 | TV Home: "Welcome, Sam" over the looping ocean clip | This is Stayboard: a Fire TV app built on Vega OS that turns the TV in a short-term rental into the house's front desk. |
| 0:10 | Dashboard: Properties → editor, type the Wi-Fi password, add "The hot tub" to the guide, preview updates | The host sets everything up on the website: Wi-Fi, checkout, rules, a house guide, FAQs, local picks, contacts, even which tiles show. There's a live preview of the TV, and it autosaves. |
| 0:29 | Devices tab: type the six-letter code → TV flips from Pair to Home | Pairing is a six-letter code. There's no account on the TV and nothing for guests to sign into. |
| 0:42 | TV: Wi-Fi with QR, checkout checklist, house guide | Guests get the Wi-Fi as a scannable code, the checkout checklist and the house guide, all navigable with the remote. |
| 0:58 | TV: Ask the house. Pick "How does the thermostat work?" → answer. Type "Is there a hair dryer?" → "Not in the guide yet · Priya will reply here" | Here's the part hosts spend their evenings on. Guests ask the TV. Amazon Nova 2 Lite answers only from the host's guide. If the guide doesn't cover it, the TV says so and tells the host. |
| 1:26 | Phone: guest page, ask "When is checkout?" then "Is there a hair dryer?" | Prefer the phone? Scan the code on the TV, and the whole guide plus the ask box is right there. |
| 1:42 | Dashboard: Inbox → reply "Yes, in the top drawer of the bedroom dresser." → TV shows "Priya replied" | Every unanswered question lands in the inbox. The host replies once. The guest sees the answer, and it's saved as an FAQ for everyone who stays after. |
| 2:06 | Design studio: upload the MP4, pick Poster and Fraunces, drag the Ask tile to the front | And it's yours to design: a looping video or slideshow, music, five layouts, real typefaces, and tiles you can drag into any order. The TV, the preview and the phone page all show the same design. |
| 2:29 | Landing page scroll-through | Open source, free, no subscription. Built on Vega OS, Cloudflare Workers and Amazon Bedrock, with a friction log of everything we hit along the way. |
| 2:40 | End card: stayboard.keronlabs.com | Stayboard. Your rental's welcome screen, on the TV. |

## How it was recorded

- **Website and phone:** Playwright driving the installed Google Chrome (Playwright's own Chromium has no H.264, so the video backdrops would stay black). Headless Chrome keeps 88 px of window chrome, so the window is resized through DevTools to viewport height plus 88 or the screencast loses the bottom strip. The page is zoomed to 120% on a 1920×1080 viewport for legibility, and a drawn cursor follows the mouse so clicks are visible. The phone shots use a 780×1688 viewport at 200% zoom, composited into the frame with a rounded mask.
- **TV:** the Vega Virtual Device, recorded with `adb -s emulator-5554 emu screenrecord start <file.webm>` and driven with `inputd-cli button_press` (after `vsm developer-mode enable`). Typing goes through `inputd-cli send_text`, which opens the on-screen keyboard by itself; the keyboard's Search button is Down ×4, Right, Enter from where it opens. Back on the Home or Pair screen exits the app, so the tour only presses Back inside a screen.
- **Assembly:** one ffmpeg pass per shot (trim, speed, 30 fps, caption burned in with Inter from `tv/assets/fonts`), concat, then the narration segments mixed in at each shot's offset.

Before recording again: clear the inbox so the hair-dryer question is the only open one, set the guest name to the one in the narration, and keep the browser and TV recordings sequential, since the virtual device once exited while both ran.
