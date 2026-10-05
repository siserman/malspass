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
- **The fridge:** every picture is saved automatically (IndexedDB, on the device only) and can be replayed as an exact time‑lapse. Parents can mark favorites, save/share and delete.
- **Sound:** spoken colors (recorded clips, device voice as fallback) and a pentatonic tone per finger that plays even with the iPhone's silent switch on.

## Code

Plain ES5 in separate files under `js/` that share one `window.Mal` namespace. This keeps old hand‑me‑down iPads working and needs no build step:

`core` → `lines` → `texts` → `audio` → `mascot` → `brushes` → `paint` → `session` → `gallery` → `parent` → `app`

What Klecks says is in `js/lines.js`, the grown‑up texts are in `js/texts.js`, and the offline file list is in `sw.js` (bump `CACHE` when files change).

## Voice

[`tools/make_voices.py`](tools/make_voices.py) records all of Klecks's lines with your ElevenLabs voice. It runs on your own computer, so the API key never leaves it, and it updates `audio/clips.js` and `sw.js` for you. Details and the full script of lines: [docs/VOICE_SCRIPT.md](docs/VOICE_SCRIPT.md).
