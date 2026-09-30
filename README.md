# Malspaß

A calm finger‑painting app for young children, in German and English, with **Klecks**, a little drop of paint who paints with the child and ends each session with a goodnight ritual.

The goal is a paid iOS/Android app. The concept — mascot, chapters, pedagogy, healthy‑use design, business model, tech path and roadmap — is in **[docs/CONCEPT.md](docs/CONCEPT.md)**. Everything Klecks says, ready for recording, is in [docs/VOICE_SCRIPT.md](docs/VOICE_SCRIPT.md).

## Try it

It's a static web app (PWA) with no build step and no dependencies:

```sh
python3 -m http.server 8000
# open http://localhost:8000 on a tablet in the same network, then "Add to Home Screen"
```

It also runs straight from `index.html` (service worker and offline cache only work over http/https).

- **Parents' area:** press and hold the lock (top right) for 2 seconds, then tap the three numbers shown as words.
- **See the goodnight flow quickly:** in the parents' area choose *Eine Malzeit dauert → 1 Min (Test)*.

## What's inside

- **Six chapters:** free painting, rainbow brush, shape stamps, magic mirror, glow night, and a color kitchen where pigments really mix. They unlock with calendar days, not play time.
- **Sessions:** a sun clock, a sleepy "one last picture", a goodnight ritual and a sleep screen with an offline idea. Also a break between sessions, a daily maximum, bedtime and rest days.
- **The fridge:** every picture is saved automatically (IndexedDB, on the device only) and can be replayed as an exact time‑lapse. Parents can mark favorites, save/share and delete.
- **Sound:** spoken colors (recorded clips, device voice as fallback) and a pentatonic tone per finger that plays even with the iPhone's silent switch on.

## Code

Plain ES5 in separate files under `js/` that share one `window.Mal` namespace. This keeps old hand‑me‑down iPads working and needs no build step:

`core` → `texts` → `audio` → `mascot` → `brushes` → `paint` → `session` → `gallery` → `parent` → `app`

All texts are in `js/texts.js`. The offline file list is in `sw.js` (bump `CACHE` when files change).
