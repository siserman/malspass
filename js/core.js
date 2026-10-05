/* ============================================================
   Malspaß — core
   Namespace, hardening, storage, events, colors, chapters,
   settings, input helpers and icons.
   Plain ES5 on purpose: runs on hand-me-down iPads and from file://
   ============================================================ */
(function () {
  'use strict';

  var Mal = window.Mal = {};
  Mal.errors = []; // collected for automated tests, never shown

  /* ============================================================
     GLOBAL HARDENING — nothing a toddler does should break the app
     (only grown-up panels marked .scroll may scroll)
     ============================================================ */
  function inScroll(e) {
    var t = e.target;
    return !!(t && t.closest && t.closest('.scroll'));
  }
  // Block scrolling, pinch-zoom, pull-to-refresh, double-tap zoom
  document.addEventListener('touchstart', function (e) { if (e.touches.length > 0 && !inScroll(e)) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchmove',  function (e) { if (!inScroll(e)) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchend',   function (e) { if (!inScroll(e)) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart',  function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick',    function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('wheel', function (e) { if (!inScroll(e)) e.preventDefault(); }, { passive: false });
  // Swallow any uncaught error so the app never dies mid-painting
  window.addEventListener('error', function (e) {
    Mal.errors.push(String(e.message || e.error));
    e.preventDefault();
    return true;
  });
  window.addEventListener('unhandledrejection', function (e) {
    Mal.errors.push('rejection: ' + String(e.reason));
    e.preventDefault();
  });

  /* ============================================================
     STORAGE — small JSON values in localStorage, never throws
     (paintings live in IndexedDB, see gallery.js)
     ============================================================ */
  var PREFIX = 'malspass.';
  Mal.store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (err) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (err) {}
    },
    remove: function (key) {
      try { window.localStorage.removeItem(PREFIX + key); } catch (err) {}
    },
    clearAll: function () {
      try {
        var keys = [];
        for (var i = 0; i < window.localStorage.length; i++) {
          var k = window.localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) keys.push(k);
        }
        keys.forEach(function (k) { window.localStorage.removeItem(k); });
      } catch (err) {}
    }
  };

  /* ============================================================
     EVENTS — tiny bus so modules don't need to know each other
     ============================================================ */
  var handlers = {};
  Mal.on = function (name, fn) { (handlers[name] = handlers[name] || []).push(fn); };
  Mal.emit = function (name, data) {
    var list = handlers[name];
    if (!list) return;
    list.slice().forEach(function (fn) {
      try { fn(data); } catch (err) { Mal.errors.push(name + ': ' + String(err)); }
    });
  };

  /* ============================================================
     SMALL HELPERS
     ============================================================ */
  Mal.$ = function (id) { return document.getElementById(id); };
  Mal.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  Mal.lerp = function (a, b, t) { return a + (b - a) * t; };
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // local calendar day, e.g. '2026-09-30'
  Mal.dayKey = function (ts) {
    var d = ts ? new Date(ts) : new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  };
  Mal.daysBetween = function (fromKey, toKey) {
    var a = fromKey.split('-'), b = toKey.split('-');
    var da = new Date(+a[0], +a[1] - 1, +a[2]), db = new Date(+b[0], +b[1] - 1, +b[2]);
    return Math.round((db - da) / 86400000);
  };
  // timestamp of hh:mm on the day of `base`
  Mal.atTime = function (hhmm, base) {
    var p = hhmm.split(':');
    var d = new Date(base || Date.now());
    d.setHours(+p[0], +p[1], 0, 0);
    return d.getTime();
  };
  Mal.clock = function (ts) {
    var d = new Date(ts);
    if (Mal.lang === 'de') return d.getHours() + ':' + pad2(d.getMinutes());
    var h = d.getHours() % 12 || 12;
    return h + ':' + pad2(d.getMinutes()) + (d.getHours() < 12 ? ' am' : ' pm');
  };

  // seeded PRNG (mulberry32) — brushes stay deterministic so paintings can be replayed
  Mal.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  Mal.hexToRgb = function (hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  Mal.rgbToHex = function (r, g, b) {
    function c(v) { return Mal.clamp(Math.round(v), 0, 255); }
    return '#' + ((1 << 24) | (c(r) << 16) | (c(g) << 8) | c(b)).toString(16).slice(1);
  };
  Mal.mixHex = function (a, b, t) {
    var x = Mal.hexToRgb(a), y = Mal.hexToRgb(b);
    return Mal.rgbToHex(Mal.lerp(x[0], y[0], t), Mal.lerp(x[1], y[1], t), Mal.lerp(x[2], y[2], t));
  };
  Mal.luma = function (hex) {
    var c = Mal.hexToRgb(hex);
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  };

  /* ============================================================
     COLORS — freq: C-major pentatonic, rainbow order (warm = low,
     cool = high), so any combination of fingers stays consonant
     ============================================================ */
  Mal.COLORS = [
    { key: 'red',    hex: '#e53935', de: 'Rot',     en: 'Red',    freq: 261.63 }, // C4
    { key: 'orange', hex: '#fb8c00', de: 'Orange',  en: 'Orange', freq: 293.66 }, // D4
    { key: 'yellow', hex: '#fdd835', de: 'Gelb',    en: 'Yellow', freq: 329.63 }, // E4
    { key: 'green',  hex: '#43a047', de: 'Grün',    en: 'Green',  freq: 392.00 }, // G4
    { key: 'blue',   hex: '#1e88e5', de: 'Blau',    en: 'Blue',   freq: 440.00 }, // A4
    { key: 'purple', hex: '#8e24aa', de: 'Lila',    en: 'Purple', freq: 523.25 }, // C5
    { key: 'pink',   hex: '#f48fb1', de: 'Rosa',    en: 'Pink',   freq: 587.33 }, // D5
    { key: 'brown',  hex: '#795548', de: 'Braun',   en: 'Brown',  freq: 196.00 }, // G3
    { key: 'black',  hex: '#212121', de: 'Schwarz', en: 'Black',  freq: 130.81 }, // C3
    { key: 'white',  hex: '#ffffff', de: 'Weiß',    en: 'White',  freq: 659.26 }  // E5
  ];
  Mal.color = function (key) {
    for (var i = 0; i < Mal.COLORS.length; i++) if (Mal.COLORS[i].key === key) return Mal.COLORS[i];
    return null;
  };
  Mal.PAPER = '#fdfbf7';
  Mal.NIGHT = '#101a3c';

  /* ============================================================
     CHAPTERS — each one brings one new tool and one idea.
     They unlock with calendar days ("sleeps"), never with play time.
     ============================================================ */
  Mal.CHAPTERS = [
    { id: 'free',    brush: 'paint',   palette: 'all',   bg: Mal.PAPER, studio: true },
    { id: 'rainbow', brush: 'rainbow', palette: 'none',  bg: Mal.PAPER },
    { id: 'stamps',  brush: 'stamp',   palette: 'all',   bg: Mal.PAPER },
    { id: 'mirror',  brush: 'mirror',  palette: 'all',   bg: Mal.PAPER },
    { id: 'night',   brush: 'glow',    palette: 'night', bg: Mal.NIGHT },
    { id: 'mix',     brush: 'mix',     palette: 'mix',   bg: Mal.PAPER }
  ];
  Mal.chapter = function (id) {
    for (var i = 0; i < Mal.CHAPTERS.length; i++) if (Mal.CHAPTERS[i].id === id) return Mal.CHAPTERS[i];
    return Mal.CHAPTERS[0];
  };
  Mal.PALETTES = {
    basic: ['red', 'yellow', 'blue', 'green', 'black', 'white'],
    all:   ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white'],
    night: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'white'],
    mix:   ['red', 'yellow', 'blue', 'white'],
    none:  []
  };
  Mal.SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'flower'];

  /* ============================================================
     MALKASTEN — free painting grows one tool at a time (one new idea
     per level). Levels come with calendar days like the chapters,
     start and stop at an age-appropriate point, and grown-ups can set
     them directly.
     ============================================================ */
  Mal.STUDIO = ['basic', 'colors', 'sizes', 'eraser', 'brushes', 'bucket', 'shades'];
  Mal.AGE_STUDIO = { '2': [1, 3], '3-4': [2, 6], '5-6': [3, 7] }; // [first level, highest level]
  Mal.studioHas = function (level, what) { return level >= Mal.STUDIO.indexOf(what) + 1; };
  Mal.BRUSH_TYPES = ['paint', 'crayon', 'water', 'marker'];
  Mal.SIZES = { s: 10, m: 26, l: 48 };   // brush widths in CSS px
  // light / normal / dark version of a color
  Mal.shade = function (hex, v) {
    return v > 0 ? Mal.mixHex(hex, '#ffffff', 0.45) : (v < 0 ? Mal.mixHex(hex, '#000000', 0.38) : hex);
  };

  /* ============================================================
     SETTINGS (grown-ups) — defaults follow the German S2k guideline:
     3–6 years ≈ max 30 min screen time per day
     ============================================================ */
  Mal.AGE_PRESETS = {
    '2':   { sessionMin: 10, dailyMin: 10, breakMin: 120, bedtime: '18:00' },
    '3-4': { sessionMin: 15, dailyMin: 30, breakMin: 60,  bedtime: '18:30' },
    '5-6': { sessionMin: 20, dailyMin: 30, breakMin: 60,  bedtime: '19:00' }
  };
  var DEFAULTS = {
    age: '3-4', sessionMin: 15, dailyMin: 30, breakMin: 60, bedtime: '18:30', wake: '07:00',
    restDays: [], pace: 2, studioLevel: 0, studioPace: 3, sun: true, tones: true, voice: true
  };
  Mal.settings = (function () {
    var saved = Mal.store.get('settings', {}) || {};
    var s = {};
    Object.keys(DEFAULTS).forEach(function (k) { s[k] = (k in saved) ? saved[k] : DEFAULTS[k]; });
    return s;
  })();
  Mal.saveSettings = function () {
    Mal.store.set('settings', Mal.settings);
    Mal.emit('settings', Mal.settings);
  };

  /* ============================================================
     TEST MODE — jump to any chapter, day or scene, fast clock.
     Lives in the parents' area. Set DEV to false for store builds.
     ============================================================ */
  Mal.DEV = true;
  Mal.debug = (function () {
    var d = Mal.store.get('debug', {}) || {};
    return { on: !!d.on, hud: !!d.hud, fastGate: !!d.fastGate, speed: d.speed || 1 };
  })();
  Mal.debugOn = function () { return Mal.DEV && Mal.debug.on; };
  Mal.saveDebug = function () {
    Mal.store.set('debug', Mal.debug);
    Mal.emit('debug', Mal.debug);
  };

  /* ============================================================
     LANGUAGE
     ============================================================ */
  Mal.lang = Mal.store.get('lang', 'de') === 'en' ? 'en' : 'de';
  document.documentElement.lang = Mal.lang;
  Mal.setLang = function (l) {
    Mal.lang = l === 'en' ? 'en' : 'de';
    Mal.store.set('lang', Mal.lang);
    document.documentElement.lang = Mal.lang;
    Mal.emit('lang', Mal.lang);
  };
  // grown-up texts (see texts.js); {name} placeholders
  Mal.t = function (key, vars) {
    var entry = Mal.UI && Mal.UI[key];
    var s = entry ? (entry[Mal.lang] !== undefined ? entry[Mal.lang] : entry.de) : key;
    if (vars && typeof s === 'string') {
      Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    }
    return s;
  };
  Mal.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };

  /* ============================================================
     INPUT HELPERS — clicks are suppressed by the hardening above,
     so everything runs on pointer events
     ============================================================ */
  // kid buttons: react instantly on touch-down
  Mal.press = function (el, fn) {
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      fn(e);
    });
  };
  // grown-up buttons: a clean tap (works inside scrolling panels)
  Mal.tap = function (el, fn) {
    var id = null, sx = 0, sy = 0, t0 = 0;
    el.addEventListener('pointerdown', function (e) {
      id = e.pointerId; sx = e.clientX; sy = e.clientY; t0 = Date.now();
      e.stopPropagation();
    });
    el.addEventListener('pointerup', function (e) {
      if (e.pointerId !== id) return;
      id = null;
      if (Math.abs(e.clientX - sx) > 14 || Math.abs(e.clientY - sy) > 14 || Date.now() - t0 > 1500) return;
      e.stopPropagation();
      fn(e);
    });
    el.addEventListener('pointercancel', function () { id = null; });
  };
  // press-and-hold with a filling ring: for anything a toddler shouldn't trigger by accident
  Mal.RING = '<svg class="ring" viewBox="0 0 100 100"><circle class="ring-arc" cx="50" cy="50" r="47" fill="none" stroke-width="6" ' +
             'stroke-linecap="round" stroke-dasharray="295.3" stroke-dashoffset="295.3" transform="rotate(-90 50 50)"/></svg>';
  Mal.hold = function (el, ms, fn) {
    var LEN = 295.3, start = null, raf = null;
    function arc() { return el.querySelector('.ring-arc'); }
    function progress(f) {
      var a = arc();
      if (a) a.style.strokeDashoffset = String(LEN * (1 - Mal.clamp(f, 0, 1)));
    }
    function tick(ts) {
      if (start === null) return;
      var f = (ts - start) / ms;
      progress(f);
      if (f >= 1) { cancel(); fn(); }
      else raf = requestAnimationFrame(tick);
    }
    function cancel() {
      start = null;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      el.classList.remove('holding');
      progress(0);
    }
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      el.classList.add('holding');
      start = performance.now();
      raf = requestAnimationFrame(tick);
    });
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('pointerleave', function () { if (start !== null) cancel(); });
  };

  /* ============================================================
     ICONS — inline SVG, so everything works offline and looks the
     same on every device ({u} = unique id for clip paths)
     ============================================================ */
  var ICONS = {
    home: '<svg viewBox="0 0 48 48"><path d="M13 22V38a2 2 0 0 0 2 2H33a2 2 0 0 0 2-2V22" fill="#ffcc80" stroke="#6d5446" stroke-width="3.5" stroke-linejoin="round"/>' +
          '<path d="M7 24L24 9 41 24" fill="none" stroke="#6d5446" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<rect x="20" y="28" width="8" height="12" rx="2" fill="#e53935"/></svg>',
    fridge: '<svg viewBox="0 0 48 48"><rect x="10" y="4" width="28" height="40" rx="5" fill="#eef3f6" stroke="#5b6b75" stroke-width="3"/>' +
            '<path d="M10 16H38" stroke="#5b6b75" stroke-width="3"/><path d="M33 8v4M33 20v7" stroke="#5b6b75" stroke-width="3" stroke-linecap="round"/>' +
            '<rect x="14" y="21" width="14" height="12" rx="1.5" fill="#fff" stroke="#b0bec5" stroke-width="1.5"/>' +
            '<path d="M16.5 30q2.5-6 5-2.5t4.5-3.5" fill="none" stroke="#e53935" stroke-width="2.2" stroke-linecap="round"/>' +
            '<circle cx="21" cy="21" r="2.4" fill="#1e88e5"/></svg>',
    lock: '<svg viewBox="0 0 48 48"><path d="M16 21v-6a8 8 0 0 1 16 0v6" fill="none" stroke="#757575" stroke-width="4"/>' +
          '<rect x="11" y="20" width="26" height="20" rx="5" fill="#9e9e9e"/><circle cx="24" cy="28.5" r="3" fill="#fff"/>' +
          '<rect x="22.6" y="29" width="2.8" height="6" rx="1.4" fill="#fff"/></svg>',
    close: '<svg viewBox="0 0 48 48"><path d="M14 14L34 34M34 14L14 34" stroke="#555" stroke-width="5" stroke-linecap="round"/></svg>',
    back: '<svg viewBox="0 0 48 48"><path d="M28 12L16 24 28 36" fill="none" stroke="#555" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 48 48"><path d="M17 11L37 24 17 37Z" fill="#43a047" stroke="#43a047" stroke-width="3" stroke-linejoin="round"/></svg>',
    share: '<svg viewBox="0 0 48 48"><path d="M16 20h-3v20h22V20h-3" fill="none" stroke="#555" stroke-width="3.5" stroke-linejoin="round"/>' +
           '<path d="M24 29V7M16 14l8-8 8 8" fill="none" stroke="#555" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trash: '<svg viewBox="0 0 48 48"><path d="M10 14h28M20 14V9h8v5M14 14l2 26h16l2-26" fill="none" stroke="#c62828" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 48 48"><path d="M24 6l5.3 11.5 12.5 1.4-9.3 8.5 2.6 12.4L24 33.5 12.9 39.8l2.6-12.4-9.3-8.5 12.5-1.4z" fill="none" stroke="#f9a825" stroke-width="3.5" stroke-linejoin="round"/></svg>',
    starOn: '<svg viewBox="0 0 48 48"><path d="M24 6l5.3 11.5 12.5 1.4-9.3 8.5 2.6 12.4L24 33.5 12.9 39.8l2.6-12.4-9.3-8.5 12.5-1.4z" fill="#fdd835" stroke="#f9a825" stroke-width="3.5" stroke-linejoin="round"/></svg>',
    gift: '<svg viewBox="0 0 48 48"><rect x="8" y="20" width="32" height="22" rx="3" fill="#f48fb1"/><rect x="6" y="14" width="36" height="8" rx="2" fill="#ec407a"/>' +
          '<rect x="21" y="14" width="6" height="28" fill="#fdd835"/><path d="M24 14C18 4 10 8 14 13ZM24 14C30 4 38 8 34 13Z" fill="#fdd835" stroke="#f9a825" stroke-width="1.5"/></svg>',
    moon: '<svg viewBox="0 0 48 48"><path d="M30 6a18 18 0 1 0 12 30A15 15 0 0 1 30 6z" fill="#ffd54f"/></svg>',
    // chapter icons
    free: '<svg viewBox="0 0 48 48"><path d="M6 36c6-12 13 2 19-9s11-5 17-1" fill="none" stroke="#1e88e5" stroke-width="5" stroke-linecap="round"/>' +
          '<g transform="rotate(35 27 18)"><rect x="24" y="1" width="6" height="19" rx="3" fill="#a1887f"/><rect x="23" y="18" width="8" height="5" fill="#b0bec5"/>' +
          '<path d="M23 23h8l-1 7q-3 5-6 0z" fill="#e53935"/></g></svg>',
    rainbow: '<svg viewBox="0 0 48 48"><g fill="none" stroke-width="4.2"><path d="M5 37a19 19 0 0 1 38 0" stroke="#e53935"/><path d="M9.2 37a14.8 14.8 0 0 1 29.6 0" stroke="#fb8c00"/>' +
             '<path d="M13.4 37a10.6 10.6 0 0 1 21.2 0" stroke="#fdd835"/><path d="M17.6 37a6.4 6.4 0 0 1 12.8 0" stroke="#43a047"/></g>' +
             '<g fill="#fff" stroke="#cfd8dc" stroke-width="1.5"><ellipse cx="9" cy="38" rx="7.5" ry="4.5"/><ellipse cx="39" cy="38" rx="7.5" ry="4.5"/></g></svg>',
    stamps: '<svg viewBox="0 0 48 48"><circle cx="13" cy="33" r="8" fill="#1e88e5"/>' +
            '<path d="M34 41C24 34 22 29 25.5 25.5 28 23 31.5 24 34 27 36.5 24 40 23 42.5 25.5 46 29 44 34 34 41Z" fill="#e53935"/>' +
            '<path d="M20 3l2.9 7.6 8.1.4-6.3 5.1 2.1 7.9-6.8-4.5-6.8 4.5 2.1-7.9L9 11l8.1-.4z" fill="#fdd835" stroke="#f9a825" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    mirror: '<svg viewBox="0 0 48 48"><path d="M24 23C18 8 5 6 5 16c0 8 9 10 19 8z" fill="#8e24aa"/><path d="M24 23c6-15 19-17 19-7 0 8-9 10-19 8z" fill="#8e24aa"/>' +
            '<path d="M24 25c-8 1-15 7-12 13 3 5 10-2 12-10z" fill="#f48fb1"/><path d="M24 25c8 1 15 7 12 13-3 5-10-2-12-10z" fill="#f48fb1"/>' +
            '<rect x="22.5" y="13" width="3" height="25" rx="1.5" fill="#5d4037"/><circle cx="13" cy="15" r="3" fill="#fdd835"/><circle cx="35" cy="15" r="3" fill="#fdd835"/></svg>',
    night: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#1a2150"/><path d="M27 9a15 15 0 1 0 13 24A12.5 12.5 0 0 1 27 9z" fill="#ffe082"/>' +
           '<circle cx="13" cy="14" r="1.8" fill="#fff"/><circle cx="36" cy="12" r="1.4" fill="#fff"/><circle cx="11" cy="31" r="1.3" fill="#fff"/></svg>',
    mix: '<svg viewBox="0 0 48 48"><defs><clipPath id="mr{u}"><circle cx="18" cy="18" r="11"/></clipPath><clipPath id="my{u}"><circle cx="30" cy="18" r="11"/></clipPath></defs>' +
         '<circle cx="18" cy="18" r="11" fill="#e53935"/><circle cx="30" cy="18" r="11" fill="#fdd835"/><circle cx="24" cy="29" r="11" fill="#1e88e5"/>' +
         '<circle cx="30" cy="18" r="11" fill="#fb8c00" clip-path="url(#mr{u})"/><circle cx="24" cy="29" r="11" fill="#8e24aa" clip-path="url(#mr{u})"/>' +
         '<circle cx="24" cy="29" r="11" fill="#43a047" clip-path="url(#my{u})"/>' +
         '<g clip-path="url(#mr{u})"><circle cx="24" cy="29" r="11" fill="#6d4c41" clip-path="url(#my{u})"/></g></svg>'
  };
  var iconUid = 0;
  Mal.icon = function (name) {
    var s = ICONS[name] || '';
    return s.indexOf('{u}') < 0 ? s : s.split('{u}').join('i' + (++iconUid));
  };

  // studio tool icons, tinted with the current color
  Mal.toolIcon = function (name, hex) {
    var c = hex || '#1e88e5';
    var edge = Mal.luma(c) > 0.85 ? ' stroke="#b0b0b0" stroke-width="1.5"' : '';
    var f = ' fill="' + c + '"' + edge;
    switch (name) {
      case 'paint':  return '<svg viewBox="0 0 48 48"><path d="M24 11c7 0 13 5 13 12 0 8-6 14-13 14S10 31 11 23c1-7 6-12 13-12z"' + f + '/>' +
                            '<circle cx="39" cy="11" r="4"' + f + '/><circle cx="9" cy="10" r="3"' + f + '/><circle cx="41" cy="38" r="3"' + f + '/></svg>';
      case 'crayon': return '<svg viewBox="0 0 48 48"><g transform="rotate(45 24 24)"><path d="M18 14L24 2 30 14Z"' + f + '/>' +
                            '<rect x="18" y="13" width="12" height="31" rx="2"' + f + '/><rect x="18" y="22" width="12" height="13" fill="#fff" opacity=".6"/></g></svg>';
      case 'water':  return '<svg viewBox="0 0 48 48"><circle cx="15" cy="36" r="10"' + f + ' opacity=".35"/><g transform="rotate(40 24 24)">' +
                            '<rect x="21" y="1" width="6" height="22" rx="3" fill="#a1887f"/><rect x="20" y="21" width="8" height="5" fill="#b0bec5"/>' +
                            '<path d="M20 26h8l-1 9q-3 6-6 0z"' + f + '/></g></svg>';
      case 'marker': return '<svg viewBox="0 0 48 48"><g transform="rotate(45 24 24)"><rect x="19" y="5" width="10" height="27" rx="3" fill="#eceff1" stroke="#90a4ae" stroke-width="1.5"/>' +
                            '<rect x="19" y="5" width="10" height="9" rx="3"' + f + '/><path d="M20 32h8l-2 7h-4z" fill="#90a4ae"/><path d="M22.5 39h3L24 45z"' + f + '/></g></svg>';
      case 'eraser': return '<svg viewBox="0 0 48 48"><g transform="rotate(-30 24 24)"><rect x="7" y="16" width="34" height="17" rx="3" fill="#f8bbd0"/>' +
                            '<rect x="7" y="16" width="13" height="17" rx="3" fill="#90caf9"/></g><circle cx="38" cy="40" r="1.6" fill="#f8bbd0"/><circle cx="33" cy="43" r="1.2" fill="#f8bbd0"/></svg>';
      case 'bucket': return '<svg viewBox="0 0 48 48"><path d="M14 14q9-9 18 0" fill="none" stroke="#78909c" stroke-width="2.5"/><path d="M11 16h24l-3 25H14z" fill="#b0bec5"/>' +
                            '<path d="M11 16q12 6 24 0" fill="none" stroke="#78909c" stroke-width="2"/><path d="M35 17q8 5 6 15q-1 5-3 1q0-8-5-12z"' + f + '/></svg>';
      case 'undo':   return '<svg viewBox="0 0 48 48"><path d="M15 19h15a9.5 9.5 0 0 1 0 19H21" fill="none" stroke="#5f6b73" stroke-width="4.5" stroke-linecap="round"/>' +
                            '<path d="M21 11l-8 8 8 8" fill="none" stroke="#5f6b73" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      case 'size_s': return '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="4"' + f + '/></svg>';
      case 'size_m': return '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="9"' + f + '/></svg>';
      case 'size_l': return '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16"' + f + '/></svg>';
      default:       return '';
    }
  };

  // stamp shapes as SVG (the canvas versions live in brushes.js)
  Mal.shapeSVG = function (shape, fill) {
    var f = ' fill="' + fill + '"';
    var body;
    switch (shape) {
      case 'circle':   body = '<circle r="19"' + f + '/>'; break;
      case 'square':   body = '<rect x="-17" y="-17" width="34" height="34" rx="4"' + f + '/>'; break;
      case 'triangle': body = '<path d="M0-19L18.5 14H-18.5Z"' + f + ' stroke="' + fill + '" stroke-width="3" stroke-linejoin="round"/>'; break;
      case 'star':     body = '<path d="' + starPath(21, 9.5) + '"' + f + '/>'; break;
      case 'heart':    body = '<path d="M0 18C-24 1-15-21 0-9 15-21 24 1 0 18Z"' + f + '/>'; break;
      default: // flower
        body = '';
        for (var i = 0; i < 5; i++) {
          var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
          body += '<circle cx="' + (Math.cos(a) * 10).toFixed(1) + '" cy="' + (Math.sin(a) * 10).toFixed(1) + '" r="8.5"' + f + '/>';
        }
        body += '<circle r="6" fill="' + (fill === '#fdd835' ? '#fb8c00' : '#fdd835') + '"/>';
    }
    return '<svg viewBox="-24 -24 48 48">' + body + '</svg>';
  };
  function starPath(ro, ri) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? ri : ro, a = -Math.PI / 2 + i * Math.PI / 5;
      d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1);
    }
    return d + 'Z';
  }
})();
