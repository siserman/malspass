# Malspaß → paid iOS/Android app — concept

*Draft for discussion · September 2026 · goes with the playable prototype on this branch*

---

## The concept on one screen

| | |
|---|---|
| **Product** | A calm finger‑painting app for ages **3–6** (at 2 only together with a parent), German/English, with **Klecks**, a little drop of paint who paints with the child — and **ends each session himself**. |
| **Levels** | **Chapters.** Each one brings one new tool and one idea (rainbow brush, shape stamps, magic mirror, glow night, real color mixing, …). They open with **calendar days — "noch zweimal schlafen"** — never with play time. Parents can open any chapter at any time. |
| **Painting levels** | **The Malkasten (paint box).** Free painting itself grows in 7 levels, **one new tool at a time**: 6 colors → all 10 → thick & thin → eraser → crayon, watercolor, marker → paint bucket & undo → light & dark. Where it starts and stops depends on age; a new level comes every few days; Klecks introduces each one. |
| **Story** | Klecks fell out of the paint pot onto a big, empty page. Every picture the child paints becomes part of Klecks' world: each chapter bubble on the home screen shows the child's own latest painting. At the end of a session Klecks goes to sleep in the paint pot. |
| **Healthy use by design** | Sun clock, "one last picture", goodnight ritual, break between sessions, daily budget, bedtime, optional rest days. No streaks, notifications, rewards, ads, purchases or data. |
| **Pedagogy** | Process over product · describe, don't judge · no rewards for painting · chapters follow how children's drawing develops · bilingual vocabulary · every chapter ends with an offline idea · built for painting together. |
| **Saving** | Every picture goes "on the fridge" automatically, with an exact **time‑lapse replay** of how it was painted. Sharing/saving/deleting is for grown‑ups. Everything stays on the device. |
| **Business** | Free download with the first chapters + **one‑time unlock** of the whole world (≈ €5.99, Family Sharing). No subscription, no ads — the business model must not reward screen time. |
| **Tech** | Keep this web code, ship it with **Capacitor** to the App Store and Play Store, add native audio/files/share/purchase. Zero‑data architecture makes Kids Category, COPPA and GDPR straightforward. |
| **Next step** | Playtest this prototype with 5–10 families for two weeks, then produce Klecks and the voice properly. |

---

## 1. Why this app, and why it's different

The market for toddler apps is full of free drawing apps paid for by ads and manipulation:

- In a 2019 study of 135 apps for children under 5, **95 % contained advertising** — 100 % of free apps and 88 % of paid ones (Meyer et al., 2019).
- In the apps 3–5‑year‑olds actually used, **80 % had at least one manipulative design feature**: characters pressuring the child, fake time pressure, navigation traps, lures to keep playing or buy (Radesky et al., 2022).

Premium "calm" apps exist, and they show there are parents who pay for quality: Pok Pok and Sago Mini World (subscriptions), Fox and Sheep's *Nighty Night!* (a finite bedtime ritual, paid), Ahoiii's *Fiete* apps from Cologne (paid apps plus a family subscription). None of them makes **ending well** its core feature.

**Positioning:** *Die Mal‑App, die selbst Schluss macht.* — *The painting app that knows when to stop.*

Three promises to parents:

1. **It ends by itself — kindly.** Klecks gets sleepy, finishes one last picture with your child and says goodnight. You don't have to be the bad guy.
2. **It's creative, not consumptive** — and it leads back to real paint.
3. **It's clean.** No ads, no data, no dark patterns. Pay once.

## 2. Who it's for

**Children 3–6.** The German S2k guideline on screen media (AWMF 027‑075, 2023) recommends:

- **no screen media under 3**;
- for **3–6 years, at most 30 minutes, on some days** ("an einzelnen Tagen"), with an adult nearby.

The WHO (2019) says at most 1 hour a day for ages 2–4, and less is better. The American Academy of Pediatrics replaced its fixed hour limits in January 2026 with a policy that focuses on quality, context and using media together — and explicitly criticizes engagement‑driven design.

The app says this honestly. The "2 years" preset exists for parents who use it anyway: short, and together.

**Parents** buy the app. Their real pain points are in chapter 6.

**Later:** grandparents' tablets, Kitas (a "Kita edition" without time limits but with the same calm design).

## 3. House rules (design principles)

1. **The app ends the session, not the parent.** Hiniker et al. (CHI 2016): transitions ended by the technology are significantly more successful than transitions ended by parents.
2. **Chapters open with the calendar, never with minutes played.** Anything unlocked by playing longer rewards overuse.
3. **No rewards for painting.** No points, stars, stickers or coins. Preschoolers who expected a reward for drawing later drew about half as much in free time as children who didn't (Lepper, Greene & Nisbett, 1973). Surprises are fine — that study found *unexpected* rewards didn't hurt — so a new chapter appearing is OK; "paint 3 pictures to unlock" is not.
4. **Describe, don't judge.** Klecks says "So viel Blau!", never "Toll!" or "Wrong!".
5. **Klecks never guilt‑trips.** He is glad when you come and fine when you go. He is never sad, never begs, never says "just one more". Parasocial pressure appeared in about a quarter of the apps in Radesky's study.
6. **The "never" list:** no streaks, no push notifications, no timers that pressure, no autoplay, no ads, no purchases or links in the kids' area, no social features, no collecting.
7. **Everything is finite.** Every screen has a natural end.
8. **No reading needed for kids; everything for grown‑ups is behind a gate.**
9. **Offline and private.** Nothing leaves the device unless a parent shares it.
10. **Real world first.** Every chapter comes with an offline idea for afterwards.

## 4. Klecks, the mascot

**Why a drop of paint?**

- He **takes on the color the child picks**, so color learning is built into the character.
- He is easy to animate with classic squash‑and‑stretch.
- No ethnicity, and nothing gendered beyond German grammar ("der Klecks" → "er"). Very merch‑friendly.
- The name works in German and English, the way "Pingu" does.
- He comes from the paint pot, so there's a natural home and bed for him.

A nice bonus: the poet Justinus Kerner made *Kleksographien* — pictures from ink blots — in the 1850s (published 1890). That is literally the "Zauberspiegel" chapter's offline activity: drip paint, fold the paper, open it — a butterfly.

**Personality:** curious, gentle, a little clumsy, loves colors, gets sleepy. He talks rarely while a child paints. He speaks when he's tapped, when something new appears (a freshly mixed color), and at the beginning and end.

**Alternatives considered:**
- A chameleon: changes color too, but it's a reptile and the "world lost its colors" trope is a little sad.
- A hedgehog with paintbrush spines: cute and very German, but less tied to color.
- An owl painter.

My recommendation is Klecks.

**Production:**
- The prototype's SVG Klecks already shows every state the app needs: idle/breathing, blink, look at the finger, talk, bounce, wave, yawn, sleepy, asleep, glow, and any color.
- For the real app, build him in **Rive**, an interactive animation tool with state machines and lip‑sync; Duolingo's characters are made with it. If you'd rather give him a 3D look, rendered sprite sheets work too.

**Name check:** "Malspaß" is a generic German word — weak as a trademark, and App Store names must be unique. Check DPMA/EUIPO and both stores. Consider a store name like *"Klecks – Malspaß für Kinder"*.

## 5. Story and chapters

**Frame story:** Klecks tumbles out of the paint pot onto a big white page. It's empty. *"Hallo! Ich bin Klecks. Malst du mit mir?"* In each chapter Klecks discovers a new way to paint, and every picture becomes part of his world. When the sun sets, Klecks yawns, the last picture goes on the fridge, and he goes to sleep in his paint pot.

**Rhythm:**
- The first two chapters are open from day one.
- After that, one new chapter every 2 days. Parents can choose 1, 2, 3 or 7 days.
- Only the *next* surprise is visible: a gift with moons, one moon per sleep ("noch zweimal schlafen").
- A new chapter pulses gently. Tapping Klecks says "Schau mal! Da ist etwas Neues!" There is no push notification.

**How each chapter works:**
1. A 10‑second intro by Klecks, skippable by tapping.
2. Open painting: no goals, no failing, no score.
3. The picture goes on the fridge.
4. Now and then Klecks describes it.

**Season 1:**

| # | Chapter | Tool | Idea / what the child practices | Offline idea | Prototype |
|---|---|---|---|---|---|
| 1 | Freies Malen | round brush, 10 colors, a tone per color | color names DE/EN, cause & effect, the pentatonic "finger music" | big paper on the floor, finger paints | ✅ |
| 2 | Regenbogen | rainbow brush; the tone climbs the scale as you paint | color order, rhythm | rainbow hunt: something in every color | ✅ |
| 3 | Formen‑Stempel | 6 shapes, tap or drag for a trail, shape names spoken | shapes, patterns | potato / cork stamps | ✅ |
| 4 | Zauberspiegel | mirror symmetry | symmetry (early math), butterflies | Klecksbild: fold‑and‑blot | ✅ |
| 5 | Leuchtnacht | neon glow on dark paper, sparkles | contrast, night & day | look for the moon, shadow puppets | ✅ |
| 6 | Farbenküche | real pigment mixing (red, yellow, blue, white); Klecks calls out "Orange!" when a new color appears | secondary colors, discovered by the child, not taught | mix watercolors | ✅ |
| 7 | Tierspuren | animal footprints along your path | animals, left/right | footprints in sand/snow | planned |
| 8 | Wetter | rain/snow/sun brushes | weather, seasons | look out of the window together | planned |
| 9 | Linien‑Zauber (4–6) | trace gentle dotted paths: vertical, horizontal, circle, cross …; no score | pre‑writing strokes in developmental order | draw in sand | planned |
| 10 | Gefühle‑Farben | "paint how you feel": colors and big/small movements, plus a breathing moment with Klecks | naming emotions, calming down | talk about the picture | planned |
| 11 | Musik‑Bild | Klecks "sings" your picture from left to right | sequence, sound & color | pots‑and‑spoons music | planned |
| 12 | Geschichte weitermalen | a tiny story; "what happens next?" | storytelling, language | tell a bedtime story | planned |

**Later seasons:** a Jahreszeiten (seasons) pack, a home‑language pack, and a Kita edition.

### The Malkasten — the painting itself grows

Chapters bring new *ideas*. The **Malkasten** (paint box) makes the *painting itself* richer: free painting starts simple and gains one tool per level. Klecks introduces each new tool once ("Mein Malkasten ist größer geworden!"), and its button glows until the child has tried it.

| Level | What's new | What the child practices |
|---|---|---|
| 1 Fingerfarben | 6 colors (red, yellow, blue, green, black, white), one round brush | big arm movements, cause and effect; few choices for the youngest |
| 2 Alle Farben | all 10 colors | color words, favorite colors, choosing |
| 3 Dick & dünn | 3 brush widths | controlling a line, fine motor skills, big and small shapes |
| 4 Radiergummi | eraser | taking something away and painting it again: revising an idea |
| 5 Pinsel‑Kiste | crayon (grainy wax), watercolor (layers glaze and mix), marker (thin, crisp) | different materials make different marks |
| 6 Farbeimer & Zurück | paint bucket (fills a closed shape) and one step back | closed shapes, figure and ground, planning |
| 7 Hell & dunkel | a lighter and a darker version of every color | tints and shades, light and shadow |

**Start and end by age:** 2 years: level 1, up to 3 · 3–4 years: level 2, up to 6 · 5–6 years: level 3, up to 7.

**Rules:**
- **One new tool at a time.** Children never meet a toolbar full of icons. Each level adds one idea, like Montessori's "isolation of difficulty" and the progressive disclosure UX research recommends for young children.
- **Calendar, not play time.** A new level arrives every 3 days, on its own rhythm, independent of the chapters. Parents can choose 2, 5 or 7 days instead. Painting more never unlocks anything. There are no stars and no "level up!" fanfare, because rewarding children for drawing lowers their later interest (Lepper et al., 1973).
- **Grown‑ups decide.** Parents can set any level directly: higher for a child who is ready, lower for one who is overwhelmed. A level a parent sets stays fixed.
- **The same picture data as everywhere else.** Brush width, shade and the exact paint‑bucket area are stored with each stroke, so the time‑lapse, undo and the fridge show exactly what was painted.
- **Talking about the process.** After the time‑lapse on the fridge, Klecks asks: "Erzähl mal: Wie hast du das gemalt?"

**What it deliberately doesn't do:** no coloring‑in pages and no "correct" result. No layers, selection or text tools: those belong to adult apps. Undo arrives late (level 6) and takes back only the last stroke, once. The arrow comes back with the next stroke, so a child can't wipe a picture away stroke by stroke. Process‑art educators worry that unlimited undo teaches children that a mark is a mistake to remove. The eraser comes first because it is a painting action you can see.

## 6. Healthy use — designed in, not bolted on

### The problems parents actually have

| Problem | What Malspaß does |
|---|---|
| **The fight at the end** (transition tantrums) | The *app* ends the session. A sun in a small sky window moves across as painting time passes. Near the end Klecks gets sleepy and says *"Noch ein letztes Bild!"* — a task‑based ending, not a countdown. Hanging that last picture on the fridge starts the goodnight. A session never ends in the middle of a stroke. Then comes a ritual: yawn, "Das war schön", *"Mal doch mit echten Stiften weiter!"*, sleep. |
| **"Just one more"** | Sessions are finite, chapters arrive with the days, there's no autoplay into the next thing and nothing to collect. |
| **Screens before bed** | Bedtime lock (default 18:30–07:00 for 3–4‑year‑olds). |
| **Every day becomes a habit** | Optional **rest days**: Klecks sleeps all day. The German guideline says "not every day". |
| **"I don't know what they do on it"** | The parents' area shows today's minutes, the last 7 days and the gallery — all local. |
| **The tablet as a pacifier** | An honest tip in the app. Frequent device‑calming of 3–5‑year‑olds is associated with more emotional reactivity later (Radesky et al., JAMA Pediatrics 2023). |
| **Manipulation** | None — see the "never" list in chapter 3. |
| **Guilt** | Co‑play is built in, every chapter hands over to real paint, and the "why" section explains the research in plain words. |

A nuance from the research:
- In Hiniker's diary study, parents' *two‑minute warnings* went along with **worse** transitions. That's why Klecks's warning is a natural ending cue ("one last picture"), not "2 minutes left!".
- In a follow‑up study (*Plan & Play*, 2017), children who made their own plan moved on without help 93 % of the time. That points to a feature worth testing next: **a picture budget the child chooses** ("Heute male ich 3 Bilder").

### Defaults by age (all adjustable)

| Preset | Session | Per day | Break after | Bedtime |
|---|---|---|---|---|
| 2 years (together) | 10 min | 10 min | 2 h | 18:00 |
| 3–4 years | 15 min | 30 min | 1 h | 18:30 |
| 5–6 years | 20 min | 30 min | 1 h | 19:00 |

Rest days are optional. Grown‑ups can always wake Klecks for 10 extra minutes behind the parental gate.

### How time is counted

- Only **visible, recently touched** time counts. After 90 seconds without a touch the clock pauses and the screen may go to sleep.
- A long gap counts as a natural break, so the next session starts fresh.
- Counting survives closing and reopening the app.

### Platform tools

- The app works together with iOS Screen Time and Guided Access, and with Android Family Link.
- iOS 27 introduced per‑category time allowances (Entertainment, Games, Social). Choose the App Store category honestly and never try to game it. Malspaß's own limits are finer and friendlier.

## 7. Pedagogy

Hirsh‑Pasek et al. (2015) name four pillars of learning apps. Here's how Malspaß meets each:

| Pillar | In Malspaß |
|---|---|
| **Active** ("minds‑on") | Open‑ended creating instead of tapping through content. |
| **Engaged** (not distracted) | No reward pop‑ups, no ads, calm visuals; Klecks stays quiet while the child paints. |
| **Meaningful** | Chapters connect to the child's world (weather, animals, night); every chapter has an offline idea. |
| **Socially interactive** | Built for painting together; "tell me about your picture"; looking at the fridge together. |

Plus a clear learning goal per chapter (see the table in chapter 5).

**More principles:**

- **Process over product.** No coloring‑in templates; at most, later on, "unfinished pictures" as open prompts ("give the giraffe its spots").
- **Following development.** Children's drawing goes from scribbling (about 2–4) to first symbols (about 4–7) (Kellogg; Lowenfeld). Chapters and presets follow that path. Pre‑writing lines come last, for ages 4–6.
- **Descriptive feedback, computed on the device.** The stroke recording tells Klecks which colors were used and how much ("So viel Blau!", "So viele Farben!"). Later it can describe movement too ("Ganz viele runde Linien!"). There's no AI and no cloud.
- **Language.** Color and shape words in German and English today. Later: home languages (Turkish, Arabic, Ukrainian, Polish, Russian …) and **parents recording their own voice** for color names, with recordings stored only on the device.
- **Discovering, not being taught.** In the Farbenküche nobody explains that red + yellow = orange. The child makes orange, and Klecks is surprised with them.
- **Measuring learning without data.** Parent observation and playtests. The app never tests the child.

### Official early‑years guidelines, and how the Malkasten follows them

There is no single official rulebook for painting apps, but the early‑years frameworks agree on what art education for 2–6‑year‑olds is about. Children explore materials and tools freely, discover color and color mixing, revise their ideas, and talk about how they made something. The Malkasten turns that into an order of tools.

| Guideline | What it says | In Malspaß |
|---|---|---|
| **England — EYFS** *Development Matters* (DfE, revised 2023), birth to three | "Explore paint, using fingers and other parts of their bodies as well as brushes and other tools." | Level 1: finger paint, one big brush, six colors |
| same, 3‑ and 4‑year‑olds | "Explore colour and colour‑mixing." | the Farbenküche chapter; watercolor glazes mix (level 5); light and dark (level 7) |
| same, 3‑ and 4‑year‑olds | "Create closed shapes with continuous lines, and begin to use these shapes to represent objects." | the paint bucket (level 6) fills exactly those closed shapes |
| same, 3‑ and 4‑year‑olds | "Explore different materials freely, in order to develop their ideas about how to use them and what to make." | the Pinsel‑Kiste (level 5): crayon, watercolor, marker, with no task attached |
| same, reception | "Explore, use and refine a variety of artistic effects…" · "Return to and build on their previous learning, refining ideas…" | eraser (level 4) and one step back (level 6); every level keeps all earlier tools |
| **EYFS statutory framework**, Early Learning Goal *Creating with Materials* | "Safely use and explore a variety of materials, tools and techniques, experimenting with colour, design, texture, form and function" · "Share their creations, explaining the process they have used" | the seven levels as a whole · the time‑lapse, then Klecks: "Erzähl mal: Wie hast du das gemalt?" |
| **USA — National Core Arts Standards**, Visual Arts (2014), Pre‑K | Cr1.1 "Engage in self‑directed play with materials." · Cr2.1 "Use a variety of art‑making tools." | free painting has no goals; tools arrive level by level |
| same, Kindergarten | Cr2.1 "Through experimentation, build skills in various media and approaches to art‑making." · Cr3.1 "Explain the process of making art while creating." | levels 3–7 · "Erzähl mal" |
| same, Pre‑K | Pr4.1 "Identify reasons for saving and displaying objects, artifacts, and artwork." · Re9.1 "Select a preferred artwork." | the fridge · the child's own star on a favorite picture |
| **Bavaria — BayBEP** (11th edition 2024), chapter 7.8 *Ästhetik, Kunst und Kultur*\* | „Grundverständnis über Farben und die Möglichkeiten, diese zu mischen, erwerben" · „Mit verschiedenen Materialien, Techniken als Ausdrucksmöglichkeiten umgehen können" · „Eigene Gestaltungs‑ und Ausdruckswege entdecken" | Farbenküche and watercolor · Pinsel‑Kiste, eraser, bucket · open painting, no templates |
| **Bavaria — LehrplanPLUS** primary school, art, years 1/2\* | „Farbeigenschaften (leuchtend – trüb, hell – dunkel)"; shades are made „experimentell … (z. B. Aufhellen und Abdunkeln)" | light and dark comes last (level 7), and only for 5–6‑year‑olds |
| **NAEYC** *Developmentally Appropriate Practice* (2020), principle 8 | "Development and learning advance when children are challenged to achieve at a level just beyond their current mastery and when they have many opportunities to reflect on and practice newly acquired skills." | one new tool every few days, with days in between to practice |
| **Montessori**, isolation of difficulty (AMI glossary)\* | difficult steps are "isolated and taught to the child separately… A task should neither be so hard that it is overwhelming, nor so easy that it is boring." | one new tool per level, introduced by Klecks, glowing until tried |
| **Lowenfeld & Brittain**, *Creative and Mental Growth* (8th ed., 1987) | scribbling stage about 2–4, pre‑schematic about 4–7; at this age color is chosen for feeling, not realism | the levels start with big movements; Klecks never calls a color "wrong" |
| **Touch research** (Nielsen Norman Group; Vatavu et al. 2015; Sesame Workshop 2012)\* | touch targets of at least 2 × 2 cm for ages 3–5; 3‑year‑olds' taps land about 4.5 mm off target; preschoolers rest their wrists on the bottom edge | the tool buttons are as large as seven of them next to the picture allow: about 1.4 cm on a standard iPad, still short of 2 cm. The palette sits at the bottom edge. Playtests should check both: do 3‑year‑olds hit the tools, and do resting wrists change the color by accident? |

\* Rows marked with an asterisk were checked against secondary sources only (the original documents couldn't be opened from here). The other quotes were found word for word in several independent copies. Check every quote against the current edition before using it in marketing or in the store listing.

## 8. Saving paintings — the fridge

- **Every picture is saved automatically.** Holding the fridge button hangs the picture on the fridge (a little flight animation) and starts a new sheet. Going home or ending a session saves too. Nothing a child paints is ever lost by accident.
- **The fridge** is a gallery that looks like a fridge door, with magnets. Kids can look and **watch a time‑lapse** of how their picture was made.
- **Exact replay.** Every stroke is recorded compactly (16‑bit coordinates plus brush, color and seed) and every brush is deterministic. The prototype's tests show 0 % pixel difference between the live painting and the replay for all six brushes.
- **Parents** can mark favorites, save or share (share sheet → Photos, print, messages) and delete. The newest 300 pictures and all favorites are kept.
- **Next:**
  - print‑quality export (re‑render the recording at 4K);
  - a yearly "Malbuch" (PDF or photo book);
  - a voice note ("Was hast du gemalt?") recorded with the parent;
  - importing photos of *real* paintings, so paper and screen art hang side by side on the fridge (camera behind the parental gate).
- **Privacy.** Apple's review guideline 5.1.4 explicitly counts **drawings** as personal information of minors. They stay on the device; in the native app, iCloud/Google device backup covers them. No cloud of our own.

## 9. Parents' area and safeguards

- **Parental gate:** hold the lock for 2 seconds, then tap three numbers that are written as words ("sieben – vier – zwei"). Children who can't read can't pass. Apple requires a gate like this for purchases, links and settings in the Kids Category.
- **First start:** a short note for parents (no ads, no data; Klecks ends the session; everything goes on the fridge; chapters come with the days), plus age presets and language.
- **Settings:**
  - today's minutes and a 7‑day chart;
  - wake Klecks (+10 min);
  - session length, daily maximum, break, bedtime, rest days, sun clock on/off;
  - chapter pace and unlocking single or all chapters;
  - gallery management;
  - language, tones, voice;
  - the "why" section and a reset.
- **Later:** an optional PIN, a **together mode** (prompts for parent and child on the same page: "Mama malt das Haus, du die Sonne"), and a weekly summary kept on the device — never a push notification.

## 10. Privacy, safety, compliance

- **Zero‑data architecture:** no accounts, no analytics SDKs, no ads, no internet needed. This is the easiest possible position for:
  - **Apple Kids Category** (guideline 1.3): parental gate, no third‑party analytics or ads, age band *5 and under*, age rating 4+;
  - **Google Play Families**: target audience ≤ 5, no ad SDKs, no device identifiers; opt in to *Teacher Approved*;
  - **COPPA** (amended 2025, compliance date 22 April 2026) and **GDPR/DSGVO**. A privacy policy is still required by both stores — it will be short.
- **⚠️ Voice licences must be fixed before selling.**
  - The current English clips and the German "Alles sauber!" / "Deutsch" come from Piper TTS voices. Their models derive from **non‑commercial** datasets: *kerstin* was fine‑tuned from *ryan* (RyanSpeech, CC BY‑NC‑SA); *lessac* and *amy* from Blizzard‑2013 data. Piper itself says its voices are for personal use and research.
  - ElevenLabs audio is only licensed for commercial use on a **paid** plan (the free plan is non‑commercial and needs attribution). Check which plan made the German color recordings.
  - **Plan:** record Klecks with a voice actor, or a licensed paid TTS. All lines are in [`VOICE_SCRIPT.md`](VOICE_SCRIPT.md).
- **Other asset licences:** fonts, sounds and music — keep a licence list from day one.
- **Accessibility:** no reading needed, big targets, colors are spoken (which helps color‑blind children too), reduced motion is respected, and the palette at the bottom suits left‑ and right‑handers.

## 11. Business model

| Model | + | − |
|---|---|---|
| Paid upfront | maximum trust, simplest | poor conversion (especially on Android); nobody can try it first |
| **Free + one‑time unlock** | try before you buy; one purchase; Family Sharing | needs a gated purchase screen |
| Subscription | recurring revenue | rewards engagement (the opposite of our promise); parents are tired of subscriptions; nothing on a server that justifies it |
| Ads | — | incompatible with the product |

**Recommendation:**
- A **free download** with *Freies Malen*, *Regenbogen*, *Formen‑Stempel* and **every safety feature** — safety is never paywalled.
- One **non‑consumable in‑app purchase**, *"Klecks' ganze Welt"*, around **€5.99** (test €4.99–7.99), with Family Sharing enabled.
- Later, optional one‑time season packs. Buying is only ever offered behind the parental gate and never shown to children.

**Rough math:**
- €5.99 including 19 % VAT is €5.03 net. Small developers pay about 15 % commission on both stores (Apple Small Business Program; Google's new fee split since mid‑2026 comes to about the same).
- That leaves **≈ €4.28 per sale**: 1,000 sales ≈ €4.3k, 10,000 sales ≈ €43k.
- Fixed costs: Apple Developer Program €99 a year, Google Play $25 once, a voice actor, animation, a Rive plan, and a legal check of the privacy policy.

**Getting found (DACH first):**
- the App Store's Kids editorial;
- Google Play *Teacher Approved*;
- the **Tommi** games award (TOMMI) and the **Pädagogischer Medienpreis** (Pädi);
- *klick‑tipps.net* app recommendations;
- parent communities and bilingual families;
- Kitas and pediatric practices.

(For the record: GIGA‑Maus ended in 2017, and the DJI app database and the Erfurter Netcode seal are no longer active.)

## 12. Technical path to iOS and Android

**Recommendation: keep this web code and ship it with Capacitor.**

- **All the work so far carries over:** the painting engine, the iOS audio tricks, the gallery, the session system. It stays one codebase, and the PWA remains a free test channel for families.
- **What becomes native:**
  - **Audio session** "playback" category: tones and voice ignore the silent switch without the MediaStream workaround.
  - Clips become Web Audio buffers: one audio context instead of 24 `<audio>` elements.
  - **Files** via Capacitor Filesystem for the gallery, with device backup.
  - Share sheet and Photos, haptics, keep‑awake.
  - **StoreKit 2 / Play Billing** through a purchase plugin with on‑device verification. A single non‑consumable doesn't need a third‑party purchase backend, and every extra SDK is a Kids‑Category risk.
- **Mascot:** the Rive web runtime runs inside Capacitor.
- **Performance:** Canvas 2D is fine on iPads. Test on cheap Android tablets, including Amazon Fire, which are common in families. Brushes can move to WebGL later if needed.
- **Alternatives:** Flutter (a rewrite, great canvas and Rive support), native Swift/Kotlin (double the work), Godot/Unity (overkill, bigger downloads).

**Code structure today** (plain ES5, no build step; works from `file://` and on old iPads):

| File | Contents |
|---|---|
| `js/core.js` | hardening, storage, events, colors, chapters, settings, input helpers, icons |
| `js/texts.js` | every DE/EN text: Klecks's lines and the parents' UI |
| `js/audio.js` | recorded clips → speech fallback, the per‑finger tone engine, little UI sounds |
| `js/mascot.js` | Klecks (SVG and animation) |
| `js/brushes.js` | the six deterministic brushes, RYB pigment mixing, replay |
| `js/paint.js` | the live canvas, multi‑touch, stroke recording, snapshots |
| `js/session.js` | time budget, sun clock, bedtime, rest days, the sleep state |
| `js/gallery.js` | IndexedDB fridge, viewer, time‑lapse, share |
| `js/parent.js` | parental gate, settings, first start |
| `js/app.js` | screens, home, chapters, intro, painting UI, goodnight ritual |

**Store checklist:**
- privacy policy and support URL;
- screenshots and an app preview video (DE/EN);
- the age rating questionnaire;
- the Kids Category / Families program;
- TestFlight and Play internal testing.

## 13. Roadmap

| Phase | What | Result |
|---|---|---|
| **0 — now** | This prototype. **Playtest for 2 weeks with 5–10 families.** | Do goodnights go smoothly? Do kids get the moons? Does Klecks talk too much or too little? Which chapters stick? How do parents react to the limits? |
| **1 — MVP** (≈ 2–3 months part‑time) | Final Klecks in Rive, professional DE/EN voice, 8 chapters, Capacitor apps, in‑app purchase, store listings, privacy policy | TestFlight / Play beta |
| **2 — Launch DACH + EN** | Press kit, award submissions, parent communities | First reviews |
| **3 — Grow** | New chapters each season, home languages, together mode, the child's own picture budget, print/photo book, importing real paintings, Kita edition | |

## 14. Decisions for you

1. **Mascot:** Klecks the paint drop? *(recommended)*
2. **Name:** keep "Malspaß", or brand around Klecks in the stores?
3. **Age focus:** 3–6, with an honest note for under‑3s? *(recommended)*
4. **Business model:** free + one‑time unlock *(recommended)*, or paid upfront?
5. **Rest days:** off by default *(recommended)*, or 1–2 days suggested at first start?
6. **Voice:** a voice actor or licensed TTS? What should Klecks sound like — a child's voice or a warm adult voice?
7. **Tech:** Capacitor *(recommended)* or a rewrite?
8. **Chapter pace:** every 2 days *(recommended)*?

**Decided (October 2026):**
- **Malkasten pace:** a new level every 3 days, independent of the chapters.
- **Undo:** stays late (level 6) and takes back only the last stroke.
- **Pinsel‑Kiste:** crayon, watercolor and marker.
- **Malkasten by age:** 2 years: levels 1–3 · 3–4 years: levels 2–6 · 5–6 years: levels 3–7. Light and dark stays for 5–6‑year‑olds.

## 15. The prototype on this branch

**Try it:** serve the folder (e.g. `python3 -m http.server`) or publish it with GitHub Pages, open it on the iPad and "Add to Home Screen". To see everything without waiting days, switch on the **Testmodus** at the bottom of the parents' area (lock at the top right → hold 2 s → answer the gate). It has day travel, every chapter and scene, a ×10/×60 clock and every voice line. Malkasten levels can be picked directly in the parents' area under **Malkasten** (level chips 1–7, or *Automatisch* plus day travel to see them arrive one by one).

**What's in it:**
- the first start for parents;
- Klecks and his hello;
- the home screen that fills with the child's art;
- 6 chapters with calendar unlocking and moons;
- the Malkasten: 7 levels of free painting with Klecks' introductions, a glowing new tool, age start and end, and a parents' setting;
- the sun clock, sleepy warning, "one last picture", goodnight ritual and sleep screen with an offline idea;
- break, daily budget, bedtime and rest days;
- the parental gate and parents' area;
- the fridge with time‑lapse replay, favorites, save/share and delete;
- DE/EN everywhere.

**Known limits:**
- New lines use the device voice until they're recorded. `tools/make_voices.py` records them with your ElevenLabs voice (see [`VOICE_SCRIPT.md`](VOICE_SCRIPT.md)).
- There is no purchase flow.
- In a browser tab, iOS may clear website storage — add it to the Home Screen.

---

### Sources

- AWMF S2k guideline 027‑075, *Prävention dysregulierten Bildschirmmediengebrauchs in Kindheit und Jugend* (2023) — register.awmf.org/de/leitlinien/detail/027-075; parents' version: kindergesundheit-info.de (BIÖG)
- WHO (2019), *Guidelines on physical activity, sedentary behaviour and sleep for children under 5*
- AAP (2016), *Media and Young Minds*; AAP (2026), *Digital Ecosystems, Children, and Adolescents*, Pediatrics 157(2)
- Hiniker, Suh, Cao, Kientz (2016), *Screen Time Tantrums*, CHI · Hiniker, Lee, Sobel, Choe (2017), *Plan & Play*, IDC
- Radesky, Hiniker et al. (2022), *Prevalence and Characteristics of Manipulative Design in Mobile Applications Used by Children*, JAMA Netw Open 5(6)
- Meyer et al. (2019), *Advertising in Young Children's Apps*, J Dev Behav Pediatr 40(1)
- Radesky et al. (2023), *Longitudinal Associations Between Use of Mobile Devices for Calming and Emotional Reactivity…*, JAMA Pediatr 177(1)
- Lepper, Greene, Nisbett (1973), *Undermining children's intrinsic interest with extrinsic reward*, JPSP 28(1)
- Hirsh‑Pasek et al. (2015), *Putting Education in "Educational" Apps*, Psychological Science in the Public Interest 16(1)
- Kellogg (1969), *Analyzing Children's Art* · Lowenfeld (1947), *Creative and Mental Growth*; Lowenfeld & Brittain (1987), 8th ed.
- DfE (2023), *Development Matters: Non‑statutory curriculum guidance for the early years foundation stage* — gov.uk/government/publications/development-matters--2 · DfE, *Statutory framework for the early years foundation stage* (Early Learning Goals unchanged since 2021) — gov.uk/government/publications/early-years-foundation-stage-framework--2
- National Coalition for Core Arts Standards (2014), *National Core Arts Standards: Visual Arts* — nationalartsstandards.org
- Bayerisches Staatsministerium für Familie, Arbeit und Soziales & Staatsinstitut für Frühpädagogik (IFP), *Der Bayerische Bildungs‑ und Erziehungsplan für Kinder in Tageseinrichtungen bis zur Einschulung*, 11th ed. (2024), ch. 7.8 — ifp.bayern · ISB, *LehrplanPLUS Grundschule, Kunst* — lehrplanplus.bayern.de
- NAEYC (2020), *Developmentally Appropriate Practice* position statement, principles 8–9 · AMI, *Glossary of Montessori terms*, "Isolation of a difficulty"
- Vatavu, Cramariuc, Schipor (2015), *Touch interaction for children aged 3 to 6 years*, Int. J. Human‑Computer Studies 74 · Nielsen Norman Group, *Children's UX: physical development* · Sesame Workshop (2012), *Best practices: designing touch tablet experiences for preschoolers*
- Gossett & Chen (2004), *Paint Inspired Color Compositing* (the RYB mixing model)
- Apple App Review Guidelines 1.3 & 5.1.4; Apple Kids apps guidance · Google Play Families policy · FTC COPPA Rule amendments (Federal Register, 22 April 2025)
- Piper voice model cards (rhasspy/piper-samples); ElevenLabs licensing help center
