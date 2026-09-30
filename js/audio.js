/* ============================================================
   Malspaß — audio
   Recorded clips first (reliable on iOS, play even with the silent
   switch on), device speech as fallback, and the per-finger
   painting tones.
   ============================================================ */
(function () {
  'use strict';
  var Mal = window.Mal;
  var A = Mal.audio = {};

  /* ---------- which clips exist in audio/<lang>-<key>.mp3 ----------
     audio/clips.js lists them; tools/make_voices.py rewrites it. */
  var RECORDED = window.MAL_CLIPS || { de: [], en: [] };
  function hasClip(langCode, key) { return (RECORDED[langCode] || []).indexOf(key) >= 0; }

  function textFor(key) {
    var l = Mal.LINES[key];
    if (l) return l[Mal.lang];
    var c = Mal.color(key);
    return c ? (Mal.lang === 'de' ? c.de : c.en) : '';
  }

  /* ============================================================
     SPEECH (fallback)
     ============================================================ */
  var voices = [];
  function loadVoices() {
    try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (err) { voices = []; }
  }
  loadVoices();
  try {
    if (window.speechSynthesis && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  } catch (err) {}

  function pickVoice(langCode) {
    var pref = langCode === 'de' ? ['de-DE', 'de'] : ['en-US', 'en-GB', 'en'];
    for (var p = 0; p < pref.length; p++) {
      for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang && voices[i].lang.toLowerCase().indexOf(pref[p].toLowerCase()) === 0) return voices[i];
      }
    }
    return null;
  }

  function speak(text, langCode, tok) {
    try {
      if (!window.speechSynthesis) return false;
      if (speechSynthesis.paused) { try { speechSynthesis.resume(); } catch (err) {} }
      if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = langCode === 'de' ? 'de-DE' : 'en-US';
      u.rate = 0.85;
      u.pitch = 1.1;
      try {
        var v = pickVoice(langCode);
        if (v) u.voice = v;
      } catch (err) {}
      if (tok) {
        u.onend = function () { finish(tok); };
        u.onerror = function () { finish(tok); };
      }
      var timer = setTimeout(function () { try { speechSynthesis.speak(u); } catch (err) {} }, 60);
      if (tok) tok.speakTimer = timer; // cancelled if a newer line interrupts
      return true;
    } catch (err) { return false; }
  }

  /* ============================================================
     CLIPS
     ============================================================ */
  var audioCache = {};
  var audioUnlocked = false;
  var pendingSay = null;

  function getAudio(langCode, key) {
    var id = langCode + '-' + key;
    if (!audioCache[id]) {
      var a = new Audio('audio/' + id + '.mp3');
      a.preload = 'auto';
      audioCache[id] = a;
    }
    return audioCache[id];
  }
  // preload every recorded clip (cached by the service worker)
  Object.keys(RECORDED).forEach(function (l) {
    RECORDED[l].forEach(function (k) { getAudio(l, k); });
  });

  /* ---------- talking: one line at a time, mascot mouth follows ---------- */
  var current = null; // { key, onEnd, audio, timer }

  function finish(tok) {
    if (!tok || current !== tok) return;
    current = null;
    clearTimeout(tok.timer);
    Mal.emit('talk', false);
    if (tok.onEnd) { var cb = tok.onEnd; tok.onEnd = null; cb(); }
  }

  function stopCurrent() {
    var tok = current;
    if (!tok) return;
    current = null;
    clearTimeout(tok.timer);
    clearTimeout(tok.speakTimer);
    if (tok.audio) { try { tok.audio.pause(); tok.audio.currentTime = 0; } catch (err) {} }
    else { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (err) {} }
    Mal.emit('talk', false);
  }

  function speakTok(tok) {
    var text = textFor(tok.key);
    tok.audio = null;
    Mal.emit('talk', true);
    // safety net: some devices never fire onend
    tok.timer = setTimeout(function () { finish(tok); }, 900 + text.length * 80);
    if (!speak(text, Mal.lang, tok)) finish(tok);
  }

  // say(key[, onEnd]) — a new line always interrupts the previous one
  A.say = function (key, onEnd) {
    stopCurrent();
    var tok = { key: key, onEnd: onEnd || null, audio: null, timer: null };
    if (!Mal.settings.voice || !textFor(key)) {
      setTimeout(function () { if (tok.onEnd) tok.onEnd(); }, 0);
      return;
    }
    current = tok;
    if (!hasClip(Mal.lang, key)) { speakTok(tok); return; }
    try {
      var a = getAudio(Mal.lang, key);
      tok.audio = a;
      a.currentTime = 0;
      a.onended = function () { finish(tok); };
      Mal.emit('talk', true);
      tok.timer = setTimeout(function () { finish(tok); }, ((a.duration && isFinite(a.duration)) ? a.duration * 1000 : 3500) + 800);
      var p = a.play();
      if (p && p.catch) {
        p.catch(function () {
          if (current !== tok) return;
          pendingSay = key;          // will retry right after unlock
          clearTimeout(tok.timer);
          speakTok(tok);             // and try speech in the meantime
        });
      }
    } catch (err) {
      speakTok(tok);
    }
  };

  // several lines in a row, e.g. ['soMuch', 'blue']
  A.sayQueue = function (keys, onEnd) {
    var list = keys.slice();
    (function next() {
      if (!list.length) { if (onEnd) onEnd(); return; }
      A.say(list.shift(), next);
    })();
  };
  A.stopTalk = stopCurrent;
  A.isTalking = function () { return !!current; };
  // everything Klecks can say (test mode lists these)
  A.keys = function () { return Object.keys(Mal.LINES); };
  A.text = textFor;
  A.hasClip = hasClip;

  // iOS unlocks media playback on the first real touch — prime every clip once
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    Object.keys(audioCache).forEach(function (id) {
      var a = audioCache[id];
      if (current && current.audio === a) return;
      try {
        a.muted = true;
        var p = a.play();
        if (p && p.then) {
          p.then(function () { a.pause(); a.currentTime = 0; a.muted = false; })
           .catch(function () { a.muted = false; });
        } else {
          a.pause(); a.currentTime = 0; a.muted = false;
        }
      } catch (err) { try { a.muted = false; } catch (e2) {} }
    });
    if (pendingSay) {
      var k = pendingSay; pendingSay = null;
      setTimeout(function () { A.say(k); }, 150);
    }
    initToneEngine();
  }
  document.addEventListener('touchend', unlockAudio, true);
  document.addEventListener('pointerup', unlockAudio, true);

  /* ============================================================
     PAINTING TONES — one soft-flute voice per finger (Web Audio),
     routed through an <audio> element so iOS treats it as media
     playback and it sounds even with the silent switch on
     ============================================================ */
  var AC = null, toneMaster = null, toneStreamAudio = null;
  var tones = {}; // id -> {osc, gain, lfo, lfoGain}
  var VOICE_VOL = 0.14;

  function initToneEngine() {
    if (AC) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      AC = new Ctx();
      toneMaster = AC.createGain();
      toneMaster.gain.value = 0.9;
      var comp = AC.createDynamicsCompressor(); // keeps 5-finger chords from clipping
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      toneMaster.connect(comp);
      var routed = false;
      try {
        var dest = AC.createMediaStreamDestination();
        comp.connect(dest);
        toneStreamAudio = new Audio();
        toneStreamAudio.setAttribute('playsinline', '');
        toneStreamAudio.srcObject = dest.stream;
        var p = toneStreamAudio.play();
        if (p && p.catch) {
          p.catch(function () {
            try { comp.connect(AC.destination); } catch (err) {}
          });
        }
        routed = true;
      } catch (err) {}
      if (!routed) { try { comp.connect(AC.destination); } catch (err) {} }
    } catch (err) { AC = null; }
  }

  function ready() {
    if (!Mal.settings.tones) return false;
    initToneEngine();
    if (!AC) return false;
    if (AC.state === 'suspended') { try { AC.resume(); } catch (err) {} }
    return true;
  }

  A.startTone = function (id, f) {
    try {
      if (!ready()) return;
      A.stopTone(id);
      var now = AC.currentTime;
      var osc = AC.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      var g = AC.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(VOICE_VOL, now + 0.08); // soft attack, no click
      // gentle 5 Hz vibrato = flute-like life
      var lfo = AC.createOscillator();
      lfo.frequency.value = 5;
      var lfoGain = AC.createGain();
      lfoGain.gain.value = f * 0.007;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(g);
      g.connect(toneMaster);
      osc.start(now);
      lfo.start(now);
      tones[id] = { osc: osc, gain: g, lfo: lfo, lfoGain: lfoGain };
    } catch (err) {}
  };

  // glide to a new note (rainbow brush walks up the scale)
  A.setToneFreq = function (id, f) {
    var t = tones[id];
    if (!t) return;
    try {
      var now = AC.currentTime;
      t.osc.frequency.setTargetAtTime(f, now, 0.03);
      t.lfoGain.gain.setTargetAtTime(f * 0.007, now, 0.03);
    } catch (err) {}
  };

  A.stopTone = function (id) {
    var t = tones[id];
    if (!t) return;
    delete tones[id];
    try {
      var now = AC.currentTime;
      t.gain.gain.cancelScheduledValues(now);
      t.gain.gain.setValueAtTime(t.gain.gain.value, now);
      t.gain.gain.linearRampToValueAtTime(0.0001, now + 0.15); // soft release
      t.osc.stop(now + 0.2);
      t.lfo.stop(now + 0.2);
    } catch (err) {
      try { t.osc.stop(); t.lfo.stop(); } catch (e2) {}
    }
  };

  A.stopAllTones = function () {
    Object.keys(tones).forEach(function (id) { A.stopTone(id); });
  };

  // short plucked note: stamps, replays, little UI moments
  A.blip = function (f, vol, when) {
    try {
      if (!ready()) return;
      var t0 = AC.currentTime + (when || 0);
      var v = vol || 0.16;
      [1, 2].forEach(function (mult, i) {
        var o = AC.createOscillator();
        o.type = i ? 'sine' : 'triangle';
        o.frequency.value = f * mult;
        var g = AC.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(i ? v * 0.25 : v, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + (i ? 0.18 : 0.4));
        o.connect(g);
        g.connect(toneMaster);
        o.start(t0);
        o.stop(t0 + 0.45);
      });
    } catch (err) {}
  };
  // a little "ta-da" (C5 E5 G5) for discoveries and new chapters
  A.chime = function () {
    A.blip(523.25, 0.12, 0); A.blip(659.26, 0.12, 0.11); A.blip(783.99, 0.14, 0.22);
  };
  // picture flies to the fridge
  A.whoosh = function () {
    A.blip(392.0, 0.1, 0); A.blip(523.25, 0.12, 0.09);
  };
  // sleepy hum when a sleeping Klecks is tapped
  A.hum = function () {
    try {
      if (!ready()) return;
      [[329.63, 0], [261.63, 0.45]].forEach(function (n) {
        var t0 = AC.currentTime + n[1];
        var o = AC.createOscillator();
        o.type = 'sine';
        o.frequency.value = n[0];
        var g = AC.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.07, t0 + 0.12);
        g.gain.linearRampToValueAtTime(0.0001, t0 + 0.55);
        o.connect(g);
        g.connect(toneMaster);
        o.start(t0);
        o.stop(t0 + 0.6);
      });
    } catch (err) {}
  };

  // tiny introspection hook (used by automated tests, harmless in production)
  window.__malDebug = function () {
    return {
      ac: !!AC,
      state: AC ? AC.state : 'none',
      voices: Object.keys(tones).map(function (id) { return tones[id].osc.frequency.value; }),
      talking: current ? current.key : null
    };
  };

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') { A.stopAllTones(); stopCurrent(); }
    else if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (err) {} }
  });
})();
