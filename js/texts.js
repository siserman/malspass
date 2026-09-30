/* ============================================================
   Malspaß — texts for the grown-ups' screens (DE/EN)
   Kids never need to read anything. Everything Klecks *says*
   lives in js/lines.js (see docs/VOICE_SCRIPT.md).
   ============================================================ */
(function () {
  'use strict';
  var Mal = window.Mal;

  Mal.UI = {
    chapter_free:    { de: 'Freies Malen',    en: 'Free painting' },
    chapter_rainbow: { de: 'Regenbogen',      en: 'Rainbow' },
    chapter_stamps:  { de: 'Formen-Stempel',  en: 'Shape stamps' },
    chapter_mirror:  { de: 'Zauberspiegel',   en: 'Magic mirror' },
    chapter_night:   { de: 'Leuchtnacht',     en: 'Glow night' },
    chapter_mix:     { de: 'Farbenküche',     en: 'Color kitchen' },

    idea_free:    { de: 'Großes Papier auf den Boden, Fingerfarben raus – und weitermalen!', en: 'Big paper on the floor, finger paints out – and keep painting!' },
    idea_rainbow: { de: 'Regenbogen-Suche: Findet zusammen etwas in jeder Farbe.', en: 'Rainbow hunt: find something in every color together.' },
    idea_stamps:  { de: 'Stempeln mit Kartoffelhälften, Korken oder Blättern.', en: 'Stamp with potato halves, corks or leaves.' },
    idea_mirror:  { de: 'Klecksbild: Farbe auf ein Blatt tropfen, falten, aufklappen – ein Schmetterling!', en: 'Blot painting: drip paint on paper, fold it, open it – a butterfly!' },
    idea_night:   { de: 'Heute Abend zusammen den Mond suchen – oder mit der Taschenlampe Schattenfiguren machen.', en: 'Look for the moon together tonight – or make shadow puppets with a flashlight.' },
    idea_mix:     { de: 'Mit Wasserfarben mischen: Rot + Gelb, Gelb + Blau, Blau + Rot.', en: 'Mix watercolors: red + yellow, yellow + blue, blue + red.' },

    gateTitle:   { de: 'Nur für Erwachsene', en: 'Grown-ups only' },
    gateAsk:     { de: 'Tippe diese Zahlen:', en: 'Tap these numbers:' },
    numbers:     { de: ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'],
                   en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'] },

    parentTitle: { de: 'Für Eltern', en: 'For parents' },
    close:       { de: 'Schließen', en: 'Close' },
    secToday:    { de: 'Heute', en: 'Today' },
    usedOf:      { de: '{m} von {max} Minuten gemalt', en: '{m} of {max} minutes painted' },
    usedNoLimit: { de: '{m} Minuten gemalt', en: '{m} minutes painted' },
    statusAwake: { de: 'Klecks ist wach.', en: 'Klecks is awake.' },
    statusUntil: { de: 'Klecks schläft bis {time} Uhr.', en: 'Klecks is asleep until {time}.' },
    statusMorning: { de: 'Klecks schläft bis morgen früh ({time} Uhr).', en: 'Klecks is asleep until tomorrow morning ({time}).' },
    wake10:      { de: 'Klecks wecken: 10 Minuten extra', en: 'Wake Klecks: 10 extra minutes' },
    last7:       { de: 'Letzte 7 Tage', en: 'Last 7 days' },

    secTime:     { de: 'Malzeit', en: 'Painting time' },
    agePreset:   { de: 'Empfehlung nach Alter', en: 'Recommended by age' },
    age_2:       { de: '2 Jahre', en: '2 years' },
    'age_3-4':   { de: '3–4 Jahre', en: '3–4 years' },
    'age_5-6':   { de: '5–6 Jahre', en: '5–6 years' },
    under3:      { de: 'Unter 3 Jahren raten Fachleute von Bildschirmzeit ab. Wenn überhaupt: kurz und gemeinsam.',
                   en: 'For under-3s, experts advise against screen time. If at all: short, and together.' },
    session:     { de: 'Eine Malzeit dauert', en: 'One painting session lasts' },
    daily:       { de: 'Höchstens pro Tag', en: 'Maximum per day' },
    breakAfter:  { de: 'Pause nach einer Malzeit', en: 'Break after a session' },
    bedtime:     { de: 'Schlafenszeit (bis 7 Uhr)', en: 'Bedtime (until 7 am)' },
    sunClock:    { de: 'Sonnen-Uhr zeigen', en: 'Show sun clock' },
    restDays:    { de: 'Ruhetage (Klecks schläft den ganzen Tag)', en: 'Rest days (Klecks sleeps all day)' },
    restNote:    { de: 'Die Leitlinie der Kinder- und Jugendmedizin empfiehlt für 3- bis 6-Jährige höchstens 30 Minuten – und nicht an jedem Tag.',
                   en: 'The German pediatric guideline recommends at most 30 minutes for ages 3–6 – and not every day.' },
    off:         { de: 'Aus', en: 'Off' },
    on:          { de: 'An', en: 'On' },
    unlimited:   { de: 'Ohne', en: 'None' },
    min:         { de: '{n} Min', en: '{n} min' },
    hours:       { de: '{n} Std', en: '{n} h' },
    testMin:     { de: '1 Min (Test)', en: '1 min (test)' },

    secChapters: { de: 'Kapitel', en: 'Chapters' },
    pace:        { de: 'Ein neues Kapitel alle', en: 'A new chapter every' },
    paceDay:     { de: 'Tag', en: 'day' },
    paceDays:    { de: '{n} Tage', en: '{n} days' },
    chOpen:      { de: 'offen', en: 'open' },
    chTomorrow:  { de: 'ab morgen', en: 'tomorrow' },
    chInDays:    { de: 'in {n} Tagen', en: 'in {n} days' },
    unlock:      { de: 'Öffnen', en: 'Unlock' },
    unlockAll:   { de: 'Alle Kapitel öffnen', en: 'Unlock all chapters' },
    chapterNote: { de: 'Neue Kapitel kommen mit den Tagen – nie durch mehr Spielzeit. Du kannst jedes Kapitel auch selbst öffnen, z. B. für eine gemeinsame Malzeit.',
                   en: 'New chapters arrive with the days – never through more play time. You can also open any chapter yourself, e.g. for painting together.' },

    secGallery:  { de: 'Kühlschrank (Galerie)', en: 'Fridge (gallery)' },
    galleryCount:{ de: '{n} Bilder gespeichert – nur auf diesem Gerät.', en: '{n} pictures saved – on this device only.' },
    galleryOne:  { de: '1 Bild gespeichert – nur auf diesem Gerät.', en: '1 picture saved – on this device only.' },
    galleryOpen: { de: 'Bilder ansehen, sichern, löschen', en: 'View, save or delete pictures' },

    secSound:    { de: 'Sprache & Klang', en: 'Language & sound' },
    language:    { de: 'Sprache', en: 'Language' },
    tones:       { de: 'Mal-Töne & Klänge', en: 'Painting tones & sounds' },
    voice:       { de: 'Stimme von Klecks', en: "Klecks's voice" },

    secWhy:      { de: 'Warum Malspaß so ist', en: 'Why Malspaß works this way' },
    why: {
      de: [
        'Malspaß ist ein Mal-Spielzeug, kein Zeitfresser. Für Kinder von 3 bis 6 Jahren empfiehlt die Leitlinie der Kinder- und Jugendmedizin höchstens 30 Minuten Bildschirmzeit – und nicht an jedem Tag. Malspaß hilft dabei, statt dagegen zu arbeiten.',
        'Klecks beendet die Malzeit selbst: Er wird müde, malt mit deinem Kind ein letztes Bild, sagt Gute Nacht – und bricht nie mitten im Strich ab. Studien zeigen: Wenn die App das Ende macht statt der Eltern, klappt der Übergang deutlich besser.',
        'Keine Punkte, Sterne oder Belohnungen fürs Malen. Eine bekannte Studie mit Kita-Kindern zeigte: Wer fürs Malen eine Belohnung erwartet, malt danach weniger gern.',
        'Klecks bewertet nicht („toll!“), sondern beschreibt („So viel Blau!“). Das hält die Neugier wach.',
        'Neue Kapitel kommen mit der Zeit – nicht durch mehr Spielen. Keine Serien, keine Benachrichtigungen, keine Werbung, keine Daten.',
        'Am schönsten ist Malspaß gemeinsam: Fragt euer Kind, was es gemalt hat – und malt danach mit echten Farben weiter.',
        'Bitte nicht zum Beruhigen bei Wutanfällen nutzen. Besser als feste, geplante Malzeit.'
      ],
      en: [
        'Malspaß is a painting toy, not a time sink. For children aged 3–6, the German pediatric guideline recommends at most 30 minutes of screen time – and not every day. Malspaß is built to help with that, not to fight it.',
        'Klecks ends each session: gets sleepy, finishes one last picture with your child, says goodnight – and never stops mid-stroke. Research shows transitions go much better when the technology ends the session instead of the parent.',
        'No points, stars or rewards for painting. A well-known study with preschoolers found that children who expected a reward for drawing later chose to draw less.',
        'Klecks doesn’t judge (“great!”) but describes (“So much blue!”). That keeps curiosity alive.',
        'New chapters arrive with time – not by playing more. No streaks, no notifications, no ads, no data.',
        'Malspaß is best together: ask your child what they painted – then keep going with real paint.',
        'Please don’t use it to calm tantrums. It works best as a planned painting time.'
      ]
    },

    secReset:    { de: 'Zurücksetzen', en: 'Reset' },
    resetHold:   { de: 'Gedrückt halten: alles löschen', en: 'Hold to delete everything' },
    resetNote:   { de: 'Löscht alle Bilder und Einstellungen auf diesem Gerät.', en: 'Deletes all pictures and settings on this device.' },

    firstTitle:  { de: 'Hallo! Kurz für Eltern', en: 'Hi! A quick note for parents' },
    firstPoints: {
      de: [
        'Keine Werbung, keine Käufe für Kinder, keine Daten. Alles bleibt auf diesem Gerät.',
        'Klecks sagt selbst, wann Schluss ist. Du musst nicht der Spielverderber sein.',
        'Jedes Bild kommt an den Kühlschrank (die Galerie).',
        'Neue Kapitel kommen mit den Tagen – nicht durch mehr Spielen.'
      ],
      en: [
        'No ads, no purchases for kids, no data collection. Everything stays on this device.',
        'Klecks says when it’s time to stop – so you don’t have to be the bad guy.',
        'Every picture goes on the fridge (the gallery).',
        'New chapters arrive with the days – not by playing more.'
      ]
    },
    firstAge:    { de: 'Wie alt ist dein Kind?', en: 'How old is your child?' },
    firstStart:  { de: "Los geht's!", en: "Let's start!" },
    firstHint:   { de: 'Einstellungen: Schloss oben rechts 2 Sekunden gedrückt halten.', en: 'Settings: press and hold the lock at the top right for 2 seconds.' },

    ideaNow:     { de: 'Idee für jetzt:', en: 'Idea for now:' },
    sleepUntil:  { de: 'Klecks schläft bis {time} Uhr.', en: 'Klecks is asleep until {time}.' },
    sleepMorning:{ de: 'Klecks schläft bis morgen früh.', en: 'Klecks is asleep until tomorrow morning.' },
    restDayInfo: { de: 'Heute hat Klecks Ruhetag.', en: 'Today is Klecks’s day off.' },

    dbgTitle:      { de: 'Testmodus', en: 'Test mode' },
    dbgNote:       { de: 'Nur zum Ausprobieren während der Entwicklung – in der Store-Version gibt es ihn nicht (Mal.DEV in js/core.js).',
                     en: 'For trying things out during development only – not part of the store version (Mal.DEV in js/core.js).' },
    dbgStatus:     { de: 'Malzeit {sess} von {len} · heute {used} von {daily} · Tag {day} · {state}',
                     en: 'Session {sess} of {len} · today {used} of {daily} · day {day} · {state}' },
    dbgAwake:      { de: 'Klecks ist wach', en: 'Klecks is awake' },
    dbgAsleep:     { de: 'Klecks schläft bis {time}', en: 'Klecks sleeps until {time}' },
    dbgDays:       { de: 'Tag {n} seit dem ersten Start – Kapitel öffnen sich wie echt', en: 'Day {n} since first start – chapters open as in real life' },
    dbgDayMinus:   { de: '− 1 Tag', en: '− 1 day' },
    dbgDayPlus:    { de: '+ 1 Tag (einmal schlafen)', en: '+ 1 day (one sleep)' },
    dbgDayZero:    { de: 'Tag 0', en: 'Day 0' },
    dbgRelock:     { de: 'Kapitel wieder sperren', en: 'Lock chapters again' },
    dbgResetIntros:{ de: 'Intros & „Neu“ zurücksetzen', en: 'Reset intros & “new”' },
    dbgOpenChapter:{ de: 'Kapitel sofort öffnen (auch gesperrte)', en: 'Open a chapter now (even locked ones)' },
    dbgScenes:     { de: 'Szenen', en: 'Scenes' },
    dbgFirstRun:   { de: 'Erster Start', en: 'First start' },
    dbgHello:      { de: 'Hallo von Klecks', en: 'Hello from Klecks' },
    dbgAnnounce:   { de: '„Etwas Neues!“', en: '“Something new!”' },
    dbgWarn:       { de: 'Müde: letztes Bild', en: 'Sleepy: last picture' },
    dbgGoodnight:  { de: 'Gute Nacht (Pause)', en: 'Goodnight (break)' },
    dbgBedtime:    { de: 'Schlafenszeit', en: 'Bedtime' },
    dbgDaily:      { de: 'Tageslimit erreicht', en: 'Daily limit reached' },
    dbgRestToday:  { de: 'Heute Ruhetag', en: 'Rest day today' },
    dbgWake:       { de: 'Aufwachen', en: 'Wake up' },
    dbgSpeed:      { de: 'Zeitraffer für die Malzeit', en: 'Fast clock for painting time' },
    dbgHud:        { de: 'Zeit-Anzeige auf dem Bildschirm', en: 'Timer on screen' },
    dbgFastGate:   { de: 'Elternbereich ohne Zahlen öffnen', en: 'Open parents’ area without numbers' },
    dbgResetToday: { de: 'Heute zurücksetzen (Zeit)', en: 'Reset today (time)' },
    dbgEmptyFridge:{ de: 'Kühlschrank leeren (halten)', en: 'Empty the fridge (hold)' },
    dbgVoices:     { de: 'Alle Sätze anhören', en: 'Listen to every line' },
    dbgPlayAll:    { de: 'Alle nacheinander', en: 'Play all' },
    dbgClip:       { de: 'Aufnahme', en: 'recording' },
    dbgTts:        { de: 'Gerätestimme', en: 'device voice' },

    save:        { de: 'Sichern', en: 'Save' },
    del:         { de: 'Löschen (halten)', en: 'Delete (hold)' },
    fav:         { de: 'Favorit', en: 'Favorite' },
    replay:      { de: 'Nochmal ansehen', en: 'Watch again' }
  };
})();
