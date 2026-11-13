# Klecksinger: the next level, and the way into the App Store

*13 November 2026 · follows [STORE_PLAN.md](STORE_PLAN.md) (the why, the price, the competition). This file is the how and the order.*

---

## Where it stands

| Done | Open |
|---|---|
| Six chapters, seven Malkasten levels, sessions and the goodnight, the fridge with time‑lapse, film, ZIP backup, Weitermalen | The purchase |
| All 60 lines spoken in German and English, on a paid plan | Pictures still live in the web view's storage |
| A native shell (Capacitor 8.5.2) on the own iPhone and iPad | Save, share, film and backup still use browser downloads, which a web view doesn't have |
| App Store Connect record: name, bundle ID, 4+, Made for Kids, Education | Test mode is on; no release script; no listing |
| | DSA trader verification, trademark, playtest with other families |

Two things have changed since the store plan was written:

1. **The code is no longer the slow part.** The store plan guessed 3–5 weeks part‑time for the native work. The sessions since then (native shell in a day, audio rewrite and Weitermalen in a morning) suggest about **six to eight working sessions** plus testing on the devices. That's my estimate, not a measurement.
2. **The slow parts are the ones no code can speed up:** the DSA document, the trademark, other families' two weeks, screenshots and Apple's review.

**Opened on 14 November 2026.** The queue rule said no new Klecksinger code until babinger is in the App Store. Stephan opened phase 1 anyway, for a reason worth keeping: he uses Klecksinger with Aron almost every day. That daily use was the plan for babinger too, but Aron isn't a baby any more. Klecksinger is the app that gets tested by living with it.

## The recommendation

**TestFlight before Christmas, the store in early 2027.**

- Families have time over the holidays and some get new tablets. A TestFlight build in their hands by about 18 December is the playtest the concept has asked for since phase 0, on the real app.
- Submit in January with what they found fixed. A quiet launch in February or March, as decided, and the first push at Christmas 2027.
- A store release *for* this Christmas isn't worth forcing: the app would launch with no playtest by other families and no reviews.

---

## Phase 0 — now, no code

- [ ] **EUIPO SME Fund voucher. The window closes on 4 December 2026, three weeks from today.** Apply first, file the DPMA word mark "Klecksinger" (classes 9 + 41) only after the grant decision; a filing made before it isn't refunded. Check on the EUIPO page that this year's budget isn't already used up
- [x] **DSA trader details:** updated by Stephan on 14 November 2026. Account‑wide, so it also frees noisinger and babinger for the EU once Apple has verified them
- [ ] **Decide the slot on the board.** Phase 1 is open (above); whether Klecksinger now ships *before* babinger hasn't been said out loud yet
- [ ] **Write down what Aron did.** So far the tests gave one bug (the freeze) and one feature (Weitermalen). Still unanswered: does the goodnight go smoothly, does he hit the tool buttons, does a wrist change colors, does Klecks talk too much
- [ ] **Ask five to ten families now**, so they're ready when the TestFlight build is. External TestFlight testers need Apple's beta review once (usually a day or two)

## Phase 1 — the store shell (code)

In this order, because each step makes the next one testable. One small Swift plugin of our own (`KlecksNative`) carries all of it, so the app keeps **zero third‑party code besides Capacitor**, which is the simplest thing to defend in the Kids Category.

1. ✅ **Build hygiene** (14 Nov 2026). `tools/build-web.sh release` switches test mode off in the copy that ships, never in the source. `tools/release.sh` bumps the build number, syncs, archives, exports a store‑signed IPA and uploads it with `--upload`; it stops if test mode is still on or the icon has an alpha channel. Full screen only on iPad (no Split View for a three‑year‑old to drag open). A dry run gave a 2.5 MB IPA signed *Apple Distribution*, with Capacitor's privacy manifests inside. Nothing has been uploaded yet.
2. **The fridge as files.** Pictures and recordings move from IndexedDB to `Documents/` (so they're in the device backup), with a one‑time migration that leaves the old data in place until the copy is verified. The pictures Aron has painted in the test build are the first test case. Don't change the web view's scheme or host: that would orphan the old storage.
3. **Lift the 300‑picture limit.** Today the fridge keeps the newest 300 pictures and all favorites, and drops the rest without a word. An app that says "nothing a child paints is ever lost" can't do that. With files, a recording costs a few kilobytes: keep everything, and let parents delete.
4. **Native save and share.** Picture → share sheet and Photos; ZIP backup → Files; *Sicherung laden* through the document picker. All behind the gate, as today.
5. **Film.** Try MediaRecorder inside WKWebView first and hand the file to the share sheet. Only if that fails, encode with AVAssetWriter.
6. **The unlock.** StoreKit 2, one non‑consumable, Family Sharing on, *Restore* next to it, both only behind the parental gate. Free: chapters 1–2, Malkasten 1–3, the fridge, every safety feature. Locked chapters aren't shown to the child at all. The parents' first‑start note names the price once.
7. **Icon and launch screen** at store sizes, no alpha.
8. **Devices, in airplane mode:** the iPhone 16e, the iPad Pro, and the oldest iPad that runs iOS 15 we can borrow. Watch memory on long pictures and the replay of a 10‑minute painting. Silent switch on.

→ **Internal TestFlight.** Then the families.

## Phase 2 — the next level

What would make a parent say "this one is different" in the first two days, and a child ask for Klecks by name. Ranked; the first three belong in 1.0.

1. **The goodnight is the product. Make it the best minute in the app.** It's the one thing no competitor has and it's the app preview video. Go through it with a stopwatch and a child: the yawn, the sun, the last picture flying to the fridge, Klecks climbing into the pot. One idea worth trying: Klecks **hums the last picture**, a few of the pentatonic tones the child's own strokes made, slowed down, as his lullaby. The data is already in the recording.
2. **Klecks should notice the child.** He can already look, bounce, take a color and get sleepy. Small reactions cost little and make him a character rather than a logo: he watches the finger, startles kindly at a very fast scribble, peeks at a new color, yawns more as the sun gets low. No praise for the picture; the house rules stay.
3. **The film is the only advertising a Kids app is allowed.** A grandparent who gets an 8‑second time‑lapse on WhatsApp sees the app at its best. End the film on one quiet second: the finished picture, a small Klecks and the word *Klecksinger*. Sharing stays behind the gate, so this is the parent's choice.
4. **Version 1.1 six to eight weeks after launch: chapters 7 and 8** (Tierspuren, Wetter), free for everyone who bought. It proves "every future chapter is included" while the first reviews are being written, and it gives the press a second reason to write.
5. **More languages for Klecks.** 60 lines per language is an afternoon with the recording tools. Turkish, Arabic, Ukrainian, Polish and Russian are the home languages of many Kita children in Germany; French and Spanish open markets. Each one needs a native speaker to listen through before it ships, which is the real cost.
6. **Apple Pencil pressure.** Pointer events already carry it. Small work, a real delight on an iPad, but it adds a value per point to the recording format, so it needs a careful version step.

**Not now:** Rive, together mode, the photo book, importing real paintings, Android. All good, none of them decides whether 1.0 is loved.

## Phase 3 — listing and submission

- [ ] **A Klecksinger page on appinger.app** with privacy and support sections (the store needs both URLs, and a Kids app must also show its privacy policy inside the app, behind the gate)
- [ ] **Privacy label: Data Not Collected.** True as long as nothing but StoreKit talks to a server
- [ ] **Screenshots** (13" iPad, 6.9" iPhone; DE and EN) from the simulator, with real children's pictures from the playtest if the parents agree, otherwise ours. Order: the goodnight first, then painting, the fridge, the Malkasten, the parents' area
- [ ] **App preview:** 20 seconds: a picture being painted (the time‑lapse), the sun going down, the goodnight
- [ ] **Store name with keywords:** "Klecksinger: Malen für Kinder" / "Klecksinger: Painting for Kids"
- [ ] **Text:** lead with *Die Mal‑App, die selbst Schluss macht.* Then: *einmal kaufen, kein Abo, keine Werbung, keine Daten.* No health claims
- [ ] **Review notes:** how to pass the gate; that chapters open with the days and how to open them all in the parents' area; that the whole app is bundled and works offline (so it isn't read as a wrapped website, guideline 4.2); a sandbox note for the purchase
- [ ] **The purchase is submitted together with the version**, and the Paid Apps agreement already covers it (noisinger)
- [ ] **Featuring nomination** for the Kids editors, at least three weeks before the planned date

## Phase 4 — launch

As in the store plan, section E: the German Apple blogs, TOMMI and the Pädagogischer Medienpreis, klick‑tipps.net, Kitas and pediatric practices, and next to babinger in the parent communities.

---

## A possible calendar

| When | What |
|---|---|
| by 4 Dec | SME Fund application · families asked |
| Nov → mid Dec | Phase 1, if you open it · goodnight, Klecks and the film's last second from phase 2 |
| ~18 Dec | TestFlight to the families |
| January | Their findings · listing, screenshots, preview · DPMA filing after the grant |
| late Jan / Feb | Submit with the purchase and the nomination |
| Feb / Mar 2027 | Quiet launch |
| +6–8 weeks | 1.1 with chapters 7 and 8 |
| Nov 2027 | The Christmas push |

The launch in Germany depends on Apple verifying the DSA details.
