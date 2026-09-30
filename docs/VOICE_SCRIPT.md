# Voice script — Klecks

Everything Klecks says, in both languages: **41 lines**. The texts live in [`js/lines.js`](../js/lines.js). The key is the file name: `audio/de-<key>.mp3` and `audio/en-<key>.mp3`. A line without a recording is read by the device's built‑in voice. You can hear every line in the app: parents' area → **Testmodus** → *Alle Sätze anhören* (each line shows *Aufnahme* or *Gerätestimme*).

## Recording with your ElevenLabs voice — on your computer

[`tools/make_voices.py`](../tools/make_voices.py) records the lines with your ElevenLabs voice and wires them into the app. It needs only Python 3, no extra packages. **Your API key never leaves your computer.** The script reads it from the environment or asks for it with hidden input, sends it only to ElevenLabs, and doesn't save it anywhere.

```sh
# in your local clone of the repository
python tools/make_voices.py --list-voices              # which voices your account has
python tools/make_voices.py --voice "Laura" --dry-run  # show what it would record, no API call
python tools/make_voices.py --voice "Laura"            # record every line that has no file yet
python tools/make_voices.py --voice "Laura" --all      # re-record everything (replaces the old files)
python tools/make_voices.py --voice "Laura" --only hello,sleepy --lang de   # redo single lines
```

- **Same voice in German and English.** `eleven_multilingual_v2` (the default model) speaks both, so Klecks sounds the same in both languages. To use two voices: `--voice-de "…" --voice-en "…"`.
- **Tuning:** `--stability 0.5 --similarity 0.8 --style 0` are the defaults. `--speed 0.9` speaks a little slower, if your model supports it. If a single word comes out in the wrong language (short words like "Rosa" can), redo it with `--only pink --model eleven_turbo_v2_5 --language-code`.
- **ffmpeg** (optional, recommended): if it's installed, the script trims silence at both ends and evens out loudness (mono, 64 kbit/s).
- **Afterwards** the script rewrites `audio/clips.js` (the app's list of recordings) and bumps the offline cache version in `sw.js`, so the iPad picks up the new sound. Commit and push `audio/` and `sw.js`, then open the app twice on the iPad.
- **Cost:** all 41 lines in both languages are about 2,000 characters.
- **Licence:** commercial use of ElevenLabs audio needs a **paid** plan (the free plan is non‑commercial and needs attribution). Generate the final set on a paid plan.

**Setting the key for one terminal session** (optional; otherwise the script asks):

```sh
# Windows PowerShell
$env:ELEVENLABS_API_KEY = "…"
# macOS / Linux
export ELEVENLABS_API_KEY="…"
```

Tip: in ElevenLabs you can create a separate API key just for this. If your plan allows it, restrict it to text‑to‑speech and give it a small credit limit. Delete it when you're done.

## Direction for the voice

- **Klecks** is a small, warm, curious drop of paint: friendly, a bit sleepy toward the end, never over‑excited, never whiny.
- **Pace:** slowly and clearly, like reading a picture book to a 3‑year‑old.
- **Describe, don't praise:** "So viel Blau!" is said with wonder, not like a teacher's grade.
- **Goodnight lines** get quieter and slower.
- **Color and shape words** are also combined ("So viel" + "Blau!"), so "So viel" should end open and rising.

## Lines

### Colors

| key | Deutsch | English | recorded |
|---|---|---|---|
| `red` | Rot | Red | ✅ |
| `orange` | Orange | Orange | ✅ |
| `yellow` | Gelb | Yellow | ✅ |
| `green` | Grün | Green | ✅ |
| `blue` | Blau | Blue | ✅ |
| `purple` | Lila | Purple | ✅ |
| `pink` | Rosa | Pink | ✅ |
| `brown` | Braun | Brown | ✅ |
| `black` | Schwarz | Black | ✅ |
| `white` | Weiß | White | ✅ |

### Klecks talks

| key | Deutsch | English | recorded |
|---|---|---|---|
| `hello` | Hallo! Ich bin Klecks, ein kleiner Farbklecks. Malst du mit mir? | Hello! I'm Klecks, a little blob of paint. Will you paint with me? | — |
| `hi` | Hallo! | Hi there! | — |
| `letsGo` | Los geht's! | Let's go! | — |
| `newThing` | Schau mal! Da ist etwas Neues! | Look! Something new! | — |
| `sleeps1` | Noch einmal schlafen! | One more sleep! | — |
| `sleeps2` | Noch zweimal schlafen! | Two more sleeps! | — |
| `sleeps3` | Noch dreimal schlafen! | Three more sleeps! | — |
| `sleepsN` | Noch ein paar Mal schlafen! | A few more sleeps! | — |
| `clean` | Alles sauber! | All clean! | ✅ |
| `lang` | Deutsch | English | ✅ |

### Chapter intros (the first time a chapter opens)

| key | Deutsch | English | recorded |
|---|---|---|---|
| `ch_free` | Tipp auf eine Farbe und mal mit dem Finger! | Tap a color and paint with your finger! | — |
| `ch_rainbow` | Ein Regenbogen-Pinsel! Alle Farben auf einmal! | A rainbow brush! All the colors at once! | — |
| `ch_stamps` | Stempel! Tipp, tipp, tipp: ein Stern, ein Herz, eine Blume! | Stamps! Tap, tap, tap: a star, a heart, a flower! | — |
| `ch_mirror` | Ein Zauberspiegel! Was du auf einer Seite malst, kommt auch auf die andere. Wie bei einem Schmetterling! | A magic mirror! What you paint on one side appears on the other side too. Just like a butterfly! | — |
| `ch_night` | Es ist Nacht, und deine Farben leuchten! Mal den Mond und die Sterne! | It's night time, and your colors glow! Paint the moon and the stars! | — |
| `ch_mix` | Heute mischen wir Farben! Was passiert, wenn Rot und Gelb sich treffen? | Let's mix colors! What happens when red and yellow meet? | — |

### Shapes (stamps chapter)

| key | Deutsch | English | recorded |
|---|---|---|---|
| `circle` | Kreis | Circle | — |
| `square` | Quadrat | Square | — |
| `triangle` | Dreieck | Triangle | — |
| `star` | Stern | Star | — |
| `heart` | Herz | Heart | — |
| `flower` | Blume | Flower | — |

### Describing pictures — never judging

| key | Deutsch | English | recorded |
|---|---|---|---|
| `soMuch` | So viel | So much | — |
| `manyColors` | So viele Farben! | So many colors! | — |
| `fridge` | Das kommt an den Kühlschrank! | That goes on the fridge! | — |
| `fridgeEmpty` | Der Kühlschrank ist noch leer. Komm, wir malen was! | The fridge is still empty. Come on, let's paint something! | — |

### Winding down

| key | Deutsch | English | recorded |
|---|---|---|---|
| `sleepy` | Ich werde langsam müde. Noch ein letztes Bild! | I'm getting sleepy. One last picture! | — |
| `goodnight` | Das war schön! Jetzt mache ich ein kleines Nickerchen. Bis bald! | That was lovely! Now I'm going to have a little nap. See you soon! | — |
| `goodnightDay` | Das war schön heute! Jetzt schlafe ich. Bis morgen! | That was lovely today! Now I am going to sleep. See you tomorrow! | — |
| `realPaint` | Mal doch mit echten Stiften weiter! | Why not keep painting with real crayons? | — |
| `awake` | Ausgeschlafen! Wollen wir malen? | I'm all rested! Shall we paint? | — |

Recordings in the app today: 12 German, 12 English. The old English clips and the German "Alles sauber!" / "Deutsch" come from Piper TTS voices trained on non‑commercial data. Re‑record them (`--all`) before a paid release.
