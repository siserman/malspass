/* ============================================================
   Klecksinger — audio
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
     CLIPS — decoded into Web Audio buffers and played through the
     audio context the painting tones use. One context means one
     unlock on the first touch and no <audio> element per clip:
     priming 120 of those at once froze the iOS web view.
     ============================================================ */
  var buffers = {};   // 'de-hello' -> AudioBuffer
  var waiting = {};   // 'de-hello' -> callbacks while it loads
  var pendingSay = null;
  var fallbackAudio = null;

  // calls back with the decoded clip, or null where it can't be loaded (e.g. from file://)
  function loadClip(id, cb) {
    if (buffers[id]) { cb(buffers[id]); return; }
    if (waiting[id]) { waiting[id].push(cb); return; }
    waiting[id] = [cb];
    function done(buf) {
      if (buf) buffers[id] = buf;
      var cbs = waiting[id] || [];
      delete waiting[id];
      cbs.forEach(function (f) { f(buf || null); });
    }
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'audio/' + id + '.mp3', true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        if (!AC || !xhr.response || (xhr.status && xhr.status !== 200)) { done(null); return; }
        try { AC.decodeAudioData(xhr.response, done, function () { done(null); }); } catch (err) { done(null); }
      };
      xhr.onerror = function () { done(null); };
      xhr.send();
    } catch (err) { done(null); }
  }

  // a context still waiting for a touch isn't ready: a clip started on it would play late
  function contextReady() {
    if (!AC) return false;
    if (AC.state === 'suspended') { try { AC.resume(); } catch (err) {} return false; }
    return true;
  }

  /* ---------- talking: one line at a time, mascot mouth follows ---------- */
  var current = null; // { key, onEnd, src, audio, timer }

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
    if (tok.src) { try { tok.src.onended = null; tok.src.stop(0); } catch (err) {} }
    else if (tok.audio) { try { tok.audio.pause(); } catch (err) {} }
    else { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (err) {} }
    Mal.emit('talk', false);
  }

  function speakTok(tok) {
    var text = textFor(tok.key);
    tok.src = null;
    tok.audio = null;
    Mal.emit('talk', true);
    // safety net: some devices never fire onend
    tok.timer = setTimeout(function () { finish(tok); }, 900 + text.length * 80);
    if (!speak(text, Mal.lang, tok)) finish(tok);
  }

  function playBuffer(tok, buf) {
    try {
      var src = AC.createBufferSource();
      src.buffer = buf;
      src.connect(voiceOut);
      src.onended = function () { finish(tok); };
      tok.src = src;
      Mal.emit('talk', true);
      tok.timer = setTimeout(function () { finish(tok); }, buf.duration * 1000 + 800);
      if (src.start) src.start(0); else src.noteOn(0);
    } catch (err) {
      clearTimeout(tok.timer);
      speakTok(tok);
    }
  }

  // where clips can't be fetched (the page opened from file://): one element, made on demand
  function playElement(tok, id) {
    try {
      if (!fallbackAudio) { fallbackAudio = new Audio(); fallbackAudio.setAttribute('playsinline', ''); }
      var a = fallbackAudio;
      a.onended = function () { finish(tok); };
      a.src = 'audio/' + id + '.mp3';
      tok.audio = a;
      Mal.emit('talk', true);
      tok.timer = setTimeout(function () { finish(tok); }, 4500);
      var p = a.play();
      if (p && p.catch) {
        p.catch(function () {
          if (current !== tok) return;
          clearTimeout(tok.timer);
          speakTok(tok);
        });
      }
    } catch (err) {
      speakTok(tok);
    }
  }

  // say(key[, onEnd]) — a new line always interrupts the previous one
  A.say = function (key, onEnd) {
    stopCurrent();
    var tok = { key: key, onEnd: onEnd || null, src: null, audio: null, timer: null };
    if (!Mal.settings.voice || !textFor(key)) {
      setTimeout(function () { if (tok.onEnd) tok.onEnd(); }, 0);
      return;
    }
    current = tok;
    if (!hasClip(Mal.lang, key)) { speakTok(tok); return; }
    if (!contextReady()) {           // a browser before the first touch: retry after it
      pendingSay = key;
      speakTok(tok);
      return;
    }
    var id = Mal.lang + '-' + key;
    tok.timer = setTimeout(function () { finish(tok); }, 5000); // in case loading hangs
    loadClip(id, function (buf) {
      if (current !== tok) return;   // a newer line came first
      clearTimeout(tok.timer);
      if (buf) playBuffer(tok, buf);
      else playElement(tok, id);
    });
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

  // the color names are short and said on every tap: have them ready
  function preloadColors() {
    var keys = (RECORDED[Mal.lang] || []).filter(function (k) { return !!Mal.color(k); });
    (function next() {
      if (!keys.length) return;
      loadClip(Mal.lang + '-' + keys.shift(), function () { setTimeout(next, 30); });
    })();
  }

  // iOS lets a page start sound only from a touch: start (or wake) the audio context there
  var unlocked = false;
  function unlockAudio() {
    initToneEngine();
    if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (err) {} }
    if (unlocked || !AC) return;
    unlocked = true;
    try {                            // older iOS also wants one sound started inside the touch
      var b = AC.createBuffer(1, 1, 22050), s0 = AC.createBufferSource();
      s0.buffer = b; s0.connect(AC.destination);
      if (s0.start) s0.start(0); else s0.noteOn(0);
    } catch (err) {}
    preloadColors();
    if (pendingSay) {
      var k = pendingSay; pendingSay = null;
      setTimeout(function () { A.say(k); }, 150);
    }
  }
  document.addEventListener('touchend', unlockAudio, true);
  document.addEventListener('pointerup', unlockAudio, true);

  /* ============================================================
     PAINTING TONES — one soft-flute voice per finger (Web Audio),
     routed through an <audio> element so iOS treats it as media
     playback and it sounds even with the silent switch on
     ============================================================ */
  var AC = null, toneMaster = null, toneOut = null, voiceOut = null, toneStreamAudio = null;
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
      toneOut = comp;
      voiceOut = AC.createGain();    // Klecks's clips, without the tones' compressor
      var routed = false;
      try {
        var dest = AC.createMediaStreamDestination();
        comp.connect(dest);
        voiceOut.connect(dest);
        toneStreamAudio = new Audio();
        toneStreamAudio.setAttribute('playsinline', '');
        toneStreamAudio.srcObject = dest.stream;
        var p = toneStreamAudio.play();
        if (p && p.catch) {
          p.catch(function () {
            try { comp.connect(AC.destination); voiceOut.connect(AC.destination); } catch (err) {}
          });
        }
        routed = true;
      } catch (err) {}
      if (!routed) { try { comp.connect(AC.destination); voiceOut.connect(AC.destination); } catch (err) {} }
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

  // a copy of the tones for recording (the time-lapse film); null when tones are off
  A.captureTones = function () {
    try {
      if (!ready() || !toneOut || !AC.createMediaStreamDestination) return null;
      var d = AC.createMediaStreamDestination();
      toneOut.connect(d);
      return {
        track: d.stream.getAudioTracks()[0] || null,
        stop: function () { try { toneOut.disconnect(d); } catch (err) {} }
      };
    } catch (err) { return null; }
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
  // in the native app sound may start without a touch, so Klecks's first line can be the recording
  try {
    if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) { initToneEngine(); preloadColors(); }
  } catch (err) {}
})();
