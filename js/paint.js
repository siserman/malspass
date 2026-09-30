/* ============================================================
   Malspaß — the paper
   Multi-touch painting on the live canvas. Every stroke is also
   recorded (16-bit coordinates + brush + color + seed) so the
   gallery can replay how a picture was made.
   ============================================================ */
(function () {
  'use strict';
  var Mal = window.Mal, B = Mal.brushes, A = Mal.audio;
  var P = Mal.paint = {};

  var canvas = Mal.$('paper');
  var ctx = canvas.getContext('2d');
  var dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  var MIN_STEP = 1.5;        // CSS px — ignore jitter below this (keeps the log small)
  var MAX_EVENTS = 200000;   // per page; beyond that we keep painting but stop recording

  var page = null;           // the picture being painted
  var S = null;              // its surface on the live canvas
  var active = {};           // pointerId -> { sid, st, last, lq, cx, cy }

  P.enabled = false;
  P.color = Mal.color('blue');
  P.shape = 'star';

  /* ============================================================
     CANVAS SIZE (keeps the picture when the device is rotated)
     ============================================================ */
  function sizeCanvas(preserve) {
    var w = window.innerWidth, h = window.innerHeight;
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (preserve && canvas.width === W && canvas.height === H) return;
    var snapshot = null;
    if (preserve && !(S && S.grid) && canvas.width > 0 && canvas.height > 0) {
      try {
        snapshot = document.createElement('canvas');
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;
        snapshot.getContext('2d').drawImage(canvas, 0, 0);
      } catch (err) { snapshot = null; }
    }
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = page ? page.bg : Mal.PAPER;
    ctx.fillRect(0, 0, W, H);
    if (snapshot) {
      try { ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, W, H); } catch (err) {}
    }
    if (S) {
      B.resize(S);
      if (S.grid) B.renderGrid(S);
      Object.keys(active).forEach(function (id) {
        var a = active[id];
        a.last = B.point(S, a.lq[0], a.lq[1]);
      });
    }
  }
  sizeCanvas(false);
  window.addEventListener('resize', function () { sizeCanvas(true); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { sizeCanvas(true); }, 250); });

  /* ============================================================
     PAGES
     ============================================================ */
  P.newPage = function (chapter) {
    P.endAll();
    var w = window.innerWidth, h = window.innerHeight;
    page = { ch: chapter.id, brush: chapter.brush, bg: chapter.bg, w: w, h: h,
             strokes: [], ev: [], full: false, colors: {}, found: {} };
    if (chapter.brush === 'mix') { page.gw = Math.ceil(w / B.MIX_CELL); page.gh = Math.ceil(h / B.MIX_CELL); }
    S = B.surface(canvas, page);
    B.clear(S);
  };
  P.hasContent = function () { return !!page && page.strokes.length > 0; };
  P.page = function () { return page; };

  /* ============================================================
     WAKE LOCK — screen stays on while painting, released while
     Klecks sleeps or nobody touches the screen
     ============================================================ */
  var wakeLock = null, wakePending = false;
  function requestWake() {
    if (wakeLock || wakePending) return;
    try {
      if ('wakeLock' in navigator) {
        wakePending = true;
        navigator.wakeLock.request('screen').then(function (wl) {
          wakePending = false;
          wakeLock = wl;
          try { wl.addEventListener('release', function () { if (wakeLock === wl) wakeLock = null; }); } catch (err) {}
        }).catch(function () { wakePending = false; });
      }
    } catch (err) { wakePending = false; }
  }
  P.releaseWake = function () {
    try { if (wakeLock) wakeLock.release(); } catch (err) {}
    wakeLock = null;
  };

  /* ============================================================
     MULTI-TOUCH INPUT
     ============================================================ */
  function quant(e) {
    var x = Mal.clamp(e.clientX / window.innerWidth, 0, 1);
    var y = Mal.clamp(e.clientY / window.innerHeight, 0, 1);
    return [Math.round(x * B.Q), Math.round(y * B.Q)];
  }
  function brush() { return B[page.brush] || B.paint; }

  function record(sid, q) {
    if (page.full) return;
    if (sid > 65535 || page.ev.length >= MAX_EVENTS * 3) { page.full = true; return; }
    page.ev.push(sid, q[0], q[1]);
  }
  function count(st, amount) {
    var key = page.brush === 'rainbow' ? 'rainbow' : st.key;
    page.colors[key] = (page.colors[key] || 0) + amount;
  }

  var renderQueued = false;
  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(function () { renderQueued = false; if (S && S.grid) B.renderGrid(S); });
  }

  // side effects of a brush step: tones, stamp blips, mixed-color discoveries
  function after(id, st) {
    if (st.lastFreq === undefined) st.lastFreq = st.freq;
    else if (st.freq !== st.lastFreq) { st.lastFreq = st.freq; A.setToneFreq(id, st.freq); }
    if (st.blip) { st.blip = false; A.blip(st.freq); count(st, 60); }
    if (S.grid) {
      queueRender();
      if (st.cell >= 0) {
        var name = B.mixName(S, st.cell);
        if (name && !page.found[name]) { page.found[name] = true; Mal.emit('discover', name); }
      }
    }
  }

  var lastLook = 0;
  function look(e) {
    var t = Date.now();
    if (t - lastLook < 120) return;
    lastLook = t;
    Mal.emit('look', { x: e.clientX, y: e.clientY });
  }

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (!P.enabled || !page) return;
    Mal.emit('input');
    requestWake();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    endStroke(e.pointerId);
    var q = quant(e);
    var sid = page.strokes.length;
    var meta = { b: page.brush, c: P.color.key, s: (Math.random() * 4294967295) >>> 0 };
    if (page.brush === 'stamp') meta.sh = P.shape;
    page.strokes.push(meta);
    var st = B.stroke(meta);
    var p = B.point(S, q[0], q[1]);
    brush().begin(S, st, p);
    record(sid, q);
    active[e.pointerId] = { sid: sid, st: st, last: p, lq: q, cx: e.clientX, cy: e.clientY };
    if (page.brush !== 'stamp') count(st, 5); // stamps are counted per stamp in after()
    if (page.brush !== 'stamp') A.startTone(e.pointerId, st.freq);
    after(e.pointerId, st);
    Mal.emit('look', { x: e.clientX, y: e.clientY });
    Mal.emit('strokeStart', st);
  });

  canvas.addEventListener('pointermove', function (e) {
    var a = active[e.pointerId];
    if (!a) return;
    e.preventDefault();
    var list = (typeof e.getCoalescedEvents === 'function') ? e.getCoalescedEvents() : null;
    if (!list || !list.length) list = [e];
    for (var i = 0; i < list.length; i++) {
      var ev = list[i];
      var dx = ev.clientX - a.cx, dy = ev.clientY - a.cy;
      var d2 = dx * dx + dy * dy;
      if (d2 < MIN_STEP * MIN_STEP) continue;
      a.cx = ev.clientX;
      a.cy = ev.clientY;
      var q = quant(ev);
      var p = B.point(S, q[0], q[1]);
      brush().move(S, a.st, a.last, p);
      record(a.sid, q);
      a.last = p;
      a.lq = q;
      count(a.st, page.brush === 'stamp' ? 0 : Math.sqrt(d2));
    }
    Mal.emit('input');
    after(e.pointerId, a.st);
    look(e);
  });

  function endStroke(id) {
    if (!active[id]) return;
    delete active[id];
    A.stopTone(id);
    Mal.emit('strokeEnd');
  }
  canvas.addEventListener('pointerup', function (e) { endStroke(e.pointerId); });
  canvas.addEventListener('pointercancel', function (e) { endStroke(e.pointerId); });
  P.endAll = function () { Object.keys(active).forEach(endStroke); };
  P.activeCount = function () { return Object.keys(active).length; };

  /* ============================================================
     SAVING & DESCRIBING
     ============================================================ */
  function exportJPEG(maxSide, quality) {
    var s = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(canvas.width * s));
    c.height = Math.max(1, Math.round(canvas.height * s));
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = true;
    g.drawImage(canvas, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  }

  // everything the gallery needs to show, replay and export the picture
  P.snapshot = function () {
    if (!P.hasContent()) return null;
    if (S.grid) B.renderGrid(S);
    var id = Date.now();
    return {
      id: id, t: id, ch: page.ch, brush: page.brush, bg: page.bg, w: page.w, h: page.h,
      gw: page.gw || 0, gh: page.gh || 0,
      strokes: page.strokes.slice(),
      ev: page.full ? null : new Uint16Array(page.ev),
      colors: page.colors,
      found: Object.keys(page.found),
      img: exportJPEG(1600, 0.85),
      thumb: exportJPEG(360, 0.8)
    };
  };

  // what Klecks says about a picture: describe, don't judge
  P.describe = function (item) {
    var colors = item.colors || {};
    var keys = Object.keys(colors).filter(function (k) { return colors[k] >= 40; });
    var found = item.found || [];
    if (keys.indexOf('rainbow') >= 0 || keys.length + found.length >= 4) return ['manyColors'];
    if (found.length) return ['soMuch', found[found.length - 1]];
    if (!keys.length) return [];
    keys.sort(function (a, b) { return colors[b] - colors[a]; });
    return ['soMuch', keys[0]];
  };
  P.amount = function () {
    if (!page) return 0;
    var n = 0;
    Object.keys(page.colors).forEach(function (k) { n += page.colors[k]; });
    return n;
  };

  // time-lapse of a saved picture on another canvas
  P.replay = function (targetCanvas, item, opts) {
    return B.replay(B.surface(targetCanvas, item), item, opts);
  };

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') P.endAll();
    else if (P.enabled) requestWake();
  });
  Mal.on('input', function () { if (P.enabled) requestWake(); });
})();
