# Voice script — Klecks

Everything Klecks says, in both languages. The texts live in [`js/texts.js`](../js/texts.js) (`Mal.LINES`); this file lists them for recording.

**How the app picks audio:** if a clip is listed as recorded in [`js/audio.js`](../js/audio.js) (`RECORDED`), it plays `audio/<lang>-<key>.mp3`. Otherwise the device's built‑in voice reads the text. That's why the prototype already "talks" — but device voices sound robotic and are less reliable on iOS, so every line below should be recorded.

**To add a recording:**
1. Save it as `audio/de-hello.mp3`, `audio/en-hello.mp3`, … (file key = the key in the tables below).
2. Add the key to `RECORDED` in `js/audio.js`.
3. Add the file to `ASSETS` in `sw.js` and bump `CACHE`.

## Direction for the voice

- **Klecks** is a small, warm, curious drop of paint: friendly, a bit sleepy toward the end, never over‑excited, never whiny.
- Speak **slowly and clearly**, like reading a picture book to a 3‑year‑old. Leave short pauses at commas.
- **Describe, don't praise:** "So viel Blau!" is said with wonder, not like a teacher's grade.
- **Goodnight lines** get quieter and slower; a small yawn before *"Ich werde langsam müde"* is welcome.
- **Color and shape words** must be clean single words (they are also combined: *"So viel" + "Blau!"*). Record *"So viel"* with a rising, open ending so it joins well.

## Technical specs

- MP3, mono, 22.05 kHz or 44.1 kHz, ~64 kbps (matches the existing files).
- Trim silence to about 50 ms at the start and 100 ms at the end.
- Normalize loudness consistently across all files (e.g. −16 LUFS integrated).
- **Licence:** you need the right to use the recordings **commercially** in a paid app. That means a voice actor's buy‑out contract, or a TTS service's paid commercial licence. Not Piper's research voices, and not a free ElevenLabs plan.

## Lines

### Klecks talks

| file key | Deutsch | English |
|---|---|---|
| `hello` | Hallo! Ich bin Klecks, ein kleiner Farbklecks. Malst du mit mir? | Hello! I'm Klecks, a little blob of paint. Will you paint with me? |
| `hi` | Hallo! | Hi there! |
| `letsGo` | Los geht's! | Let's go! |
| `newThing` | Schau mal! Da ist etwas Neues! | Look! Something new! |
| `sleeps1` | Noch einmal schlafen! | One more sleep! |
| `sleeps2` | Noch zweimal schlafen! | Two more sleeps! |
| `sleeps3` | Noch dreimal schlafen! | Three more sleeps! |
| `sleepsN` | Noch ein paar Mal schlafen! | A few more sleeps! |

### Chapter intros (played the first time a chapter opens)

| file key | Deutsch | English |
|---|---|---|
| `ch_free` | Tipp auf eine Farbe und mal mit dem Finger! | Tap a color and paint with your finger! |
| `ch_rainbow` | Ein Regenbogen-Pinsel! Alle Farben auf einmal! | A rainbow brush! All the colors at once! |
| `ch_stamps` | Stempel! Tipp, tipp, tipp: ein Stern, ein Herz, eine Blume! | Stamps! Tap, tap, tap: a star, a heart, a flower! |
| `ch_mirror` | Ein Zauberspiegel! Was du auf einer Seite malst, kommt auch auf die andere. Wie bei einem Schmetterling! | A magic mirror! What you paint on one side appears on the other side too. Just like a butterfly! |
| `ch_night` | Es ist Nacht, und deine Farben leuchten! Mal den Mond und die Sterne! | It's night time, and your colors glow! Paint the moon and the stars! |
| `ch_mix` | Heute mischen wir Farben! Was passiert, wenn Rot und Gelb sich treffen? | Let's mix colors! What happens when red and yellow meet? |

### Shapes (stamps chapter)

| file key | Deutsch | English |
|---|---|---|
| `circle` | Kreis | Circle |
| `square` | Quadrat | Square |
| `triangle` | Dreieck | Triangle |
| `star` | Stern | Star |
| `heart` | Herz | Heart |
| `flower` | Blume | Flower |

### Describing pictures — never judging

| file key | Deutsch | English |
|---|---|---|
| `soMuch` | So viel | So much |
| `manyColors` | So viele Farben! | So many colors! |
| `fridge` | Das kommt an den Kühlschrank! | That goes on the fridge! |
| `fridgeEmpty` | Der Kühlschrank ist noch leer. Komm, wir malen was! | The fridge is still empty. Come on, let's paint something! |

### Winding down

| file key | Deutsch | English |
|---|---|---|
| `sleepy` | Ich werde langsam müde. Noch ein letztes Bild! | I'm getting sleepy. One last picture! |
| `goodnight` | Das war schön! Jetzt mache ich ein kleines Nickerchen. Bis bald! | That was lovely! Now I'm going to have a little nap. See you soon! |
| `goodnightDay` | Das war schön heute! Jetzt schlafe ich. Bis morgen! | That was lovely today! Now I am going to sleep. See you tomorrow! |
| `realPaint` | Mal doch mit echten Stiften weiter! | Why not keep painting with real crayons? |
| `awake` | Ausgeschlafen! Wollen wir malen? | I'm all rested! Shall we paint? |

### Already recorded, but must be re-recorded licence-clean

| file key | Deutsch | English |
|---|---|---|
| `clean` | Alles sauber! | All clean! |
| `lang` | Deutsch | English |

### Color names (already recorded)

`red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, `brown`, `black`, `white` →
Rot, Orange, Gelb, Grün, Blau, Lila, Rosa, Braun, Schwarz, Weiß / Red, Orange, Yellow, Green, Blue, Purple, Pink, Brown, Black, White.

The German colors came from ElevenLabs "Laura" and the English ones from Piper TTS. Check the German licence (a paid ElevenLabs plan is needed for commercial use) and re‑record the English set. The color kitchen reuses *orange, green, purple, pink, brown* when a new color is mixed.
