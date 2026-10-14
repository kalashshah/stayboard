# Demo video — script and shot list (under 3 minutes)

Record at 1920×1080. TV shots come from the Vega Virtual Device (`adb -s emulator-5554 emu screenrecord start --time-limit 180 tour.webm`), web shots from a browser at 1360×900, phone shots from a phone-sized browser window (390×844).

| Time | Shot | Voice-over |
|---|---|---|
| 0:00–0:12 | TV Home screen, "Welcome, Sam", tiles. | "This is Stayboard: a Fire TV app built on Vega OS that turns the TV in a short-term rental into the house's front desk." |
| 0:12–0:30 | Dashboard: Properties → editor, type in the Wi-Fi password and a guide topic ("The hot tub"), preview updates on the right. | "The host configures everything on the website: Wi-Fi, checkout, rules, a house guide, FAQs, local picks, contacts, colors, even which tiles show. There's a live preview of the TV, and it autosaves." |
| 0:30–0:45 | TV: Pair screen with the six-letter code → dashboard Devices tab, type the code → TV flips to Home within seconds. | "Pairing is a six-letter code. No account on the TV, nothing for guests to sign into." |
| 0:45–1:05 | TV: Wi-Fi screen with QR; Checkout; House guide (D-pad through topics). | "Guests get the Wi-Fi as a scannable code, the checkout checklist, and the guide, all navigable with the remote." |
| 1:00–1:25 | TV: Ask the house → pick "How does the thermostat work?" → answer card. Then the on-screen keyboard: type "is there a hair dryer" → "not in the guide" reply. | "Here's the part hosts spend their evenings on. Guests ask the TV. Amazon Nova 2 Lite answers only from the host's guide. If the guide doesn't cover it, the TV says so and points to the host." |
| 1:25–1:40 | Phone: scan the QR on the Ask screen → guest page → ask "when is checkout?". | "Prefer the phone? Scan the code on the TV and the whole guide, plus the ask box, is right there." |
| 1:40–2:00 | Dashboard: Inbox → the hair-dryer question, "Needs an answer" → Add as FAQ → type the answer → TV answers it next time. | "Every unanswered question lands in the inbox. One click turns it into an FAQ. The host answers once; every future guest gets it instantly." |
| 2:00–2:25 | Dashboard: Design studio → drop in a short MP4, pick Poster + Fraunces, drag the Ask tile to the front → TV shows the looping video with the new layout. | "And it's yours to design: a looping video or slideshow, music, five layouts, real typefaces, drag the tiles into any order. The TV, the preview and the phone page all show the same design." |
| 2:25–2:45 | Quick cuts: Split and Minimal layouts on the TV; light theme + custom accent; friction log on screen. | "Open source, free, no subscription. Built on Vega OS, Cloudflare Workers, R2 and Amazon Bedrock, with a friction log of everything we hit along the way." |
| 2:45–2:55 | Title card: Stayboard · stayboard.kalashshah47.workers.dev. | "Stayboard. Your rental's welcome screen, on the TV." |

Tips
- Clear the inbox before recording so the hair-dryer question is the only open one.
- Set the guest name to the name you'll say on camera.
- The VVD clock is in its own time zone; crop the top-right corner or set the host-side `TZ` before starting it.
