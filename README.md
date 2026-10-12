# Klecksinger

*Formerly Malspaß.* A calm finger‑painting app for young children, in German and English, with **Klecks**, a little drop of paint who paints with the child and ends each session with a goodnight ritual.

The goal is a paid iOS/Android app. The concept — mascot, chapters, pedagogy, healthy‑use design, business model, tech path and roadmap — is in **[docs/CONCEPT.md](docs/CONCEPT.md)**. Everything Klecks says, ready for recording, is in [docs/VOICE_SCRIPT.md](docs/VOICE_SCRIPT.md). What it takes to reach the App Store, the competition and the price decision are in [docs/STORE_PLAN.md](docs/STORE_PLAN.md); the name and branding are in [docs/NAME_AND_BRAND.md](docs/NAME_AND_BRAND.md).

## Try it

It's a static web app (PWA) with no build step and no dependencies:

```sh
python3 -m http.server 8000
# open http://localhost:8000 on a tablet in the same network, then "Add to Home Screen"
```

It also runs straight from `index.html` (service worker and offline cache only work over http/https).

- **Parents' area:** press and hold the lock (top right) for 2 seconds, then tap the three numbers shown as words.
- **Test mode:** at the bottom of the parents' area, switch *Testmodus* on. It lets you:
  - jump through the days, so chapters and paint‑box levels open like in real life;
  - lock chapters again, or open any chapter right away;
  - pick any Malkasten level directly (also outside test mode, under *Malkasten*);
  - play every scene: first start, hello, "something new", sleepy, goodnight, bedtime, daily limit, rest day, wake up;
  - run the clock ×10 or ×60, and show a timer on screen;
  - listen to every voice line.

  Switch it off for real use. Store builds drop it via `Mal.DEV` in `js/core.js`.

## What's inside

- **Six chapters:** free painting, rainbow brush, shape stamps, magic mirror, glow night, and a color kitchen where pigments really mix. They unlock with calendar days, not play time.
- **The Malkasten (paint box):** free painting itself grows in seven levels, one new tool at a time: six colors → all colors → thick & thin → eraser → crayon, watercolor and marker → paint bucket & undo → light & dark shades. The start and the last level depend on the child's age, a new level comes every few days, and Klecks introduces each one. Parents can set the level directly.
- **Sessions:** a sun clock, a sleepy "one last picture", a goodnight ritual and a sleep screen with an offline idea. Also a break between sessions, a daily maximum, bedtime and rest days.
- **The fridge:** every picture is saved automatically (IndexedDB, on the device only) and can be replayed as an exact time‑lapse. Parents can mark favorites, save/share and delete, save a picture's time‑lapse as a **film** (MP4 in Safari, made with MediaRecorder), and back up the whole fridge as **one ZIP file** (pictures plus recordings) that *Sicherung laden* restores.
- **Sound:** spoken colors (recorded clips, device voice as fallback) and a pentatonic tone per finger that plays even with the iPhone's silent switch on.

## Code

Plain ES5 in separate files under `js/` that share one `window.Mal` namespace. This keeps old hand‑me‑down iPads working and needs no build step:

`core` → `lines` → `texts` → `audio` → `mascot` → `brushes` → `paint` → `session` → `gallery` → `parent` → `app`

What Klecks says is in `js/lines.js`, the grown‑up texts are in `js/texts.js`, and the offline file list is in `sw.js` (bump `CACHE` when files change).

## Native iOS app

The same web code also runs as a native iOS app inside [Capacitor](https://capacitorjs.com) 8. The web app still has no build step; the native app copies it into `www/` first:

```sh
npm install                  # once
npm run sync                 # copies the web app into www/ and into the Xcode project
open ios/App/App.xcodeproj   # or build from the command line, below
```

The native shell adds what a Home Screen web app can't do: sound plays with the silent switch on, there's no status bar, and a swipe from a screen edge only shows the home indicator first, so a child painting near the palette doesn't leave the app by accident. The icon is Klecks. Bundle ID `com.appinger.klecksinger`, team `XWY4S3RCZA`, iOS 15 or later.

A development build for your own devices, from the command line:

```sh
npm run sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -derivedDataPath build/device -allowProvisioningUpdates build
xcrun devicectl device install app --device <name or UDID> build/device/Build/Products/Release-iphoneos/App.app
```

This is a test build, not the store app: there's no purchase yet, the fridge still lives in the web view's storage rather than in files, and test mode (`Mal.DEV`) is still on. The store work is in [docs/STORE_PLAN.md](docs/STORE_PLAN.md), section C.

## Voice

[`tools/make_voices.py`](tools/make_voices.py) records all of Klecks's lines with your ElevenLabs voice. It runs on your own computer, so the API key never leaves it, and it updates `audio/clips.js` and `sw.js` for you. Details and the full script of lines: [docs/VOICE_SCRIPT.md](docs/VOICE_SCRIPT.md).
