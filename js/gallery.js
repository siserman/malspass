/* ============================================================
   Malspaß — the fridge (gallery)
   Every picture is kept on this device only (IndexedDB):
   a small 'meta' record with the thumbnail for the fridge door,
   and a 'full' record with the image and the stroke recording
   for the time-lapse replay. Kids can look and replay; saving,
   sharing and deleting is for grown-ups.
   ============================================================ */
(function () {
  'use strict';
  var Mal = window.Mal, A = Mal.audio;
  var G = Mal.gallery = {};
  var $ = Mal.$;
  var DB_NAME = 'malspass', MAX_ITEMS = 300;
  var dbp = null, mem = null, metas = null;

  /* ============================================================
     STORAGE
     ============================================================ */
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve, reject) {
      try {
        var req = window.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () {
          var d = req.result;
          if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'id' });
          if (!d.objectStoreNames.contains('full')) d.createObjectStore('full', { keyPath: 'id' });
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      } catch (err) { reject(err); }
    }).catch(function () {
      mem = { meta: {}, full: {} }; // no IndexedDB (e.g. private mode): keep pictures for this visit
      return null;
    });
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (err) {}
    return dbp;
  }
  function asPromise(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function write(stores, fn) {
    return db().then(function (d) {
      if (!d) { fn(null); return; }
      return new Promise(function (resolve, reject) {
        var tx = d.transaction(stores, 'readwrite');
        fn(tx);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }
  function values(obj) { return Object.keys(obj).map(function (k) { return obj[k]; }); }

  // fridge list, newest first (small records, cached)
  G.list = function () {
    if (metas) return Promise.resolve(metas);
    return db().then(function (d) {
      if (!d) return values(mem.meta);
      return asPromise(d.transaction('meta').objectStore('meta').getAll());
    }).then(function (arr) {
      metas = (arr || []).sort(function (a, b) { return b.id - a.id; });
      return metas;
    });
  };
  G.get = function (id) {
    return db().then(function (d) {
      if (!d) return mem.full[id];
      return asPromise(d.transaction('full').objectStore('full').get(id));
    });
  };
  G.add = function (item) {
    var meta = { id: item.id, t: item.t, ch: item.ch, thumb: item.thumb, star: false, colors: item.colors, found: item.found };
    var full = { id: item.id, img: item.img, ev: item.ev, strokes: item.strokes, brush: item.brush, bg: item.bg,
                 w: item.w, h: item.h, gw: item.gw, gh: item.gh };
    return G.list().then(function (list) {
      list.unshift(meta);
      return write(['meta', 'full'], function (tx) {
        if (!tx) { mem.meta[meta.id] = meta; mem.full[full.id] = full; return; }
        tx.objectStore('meta').put(meta);
        tx.objectStore('full').put(full);
      }).catch(function () {
        // storage trouble: keep the picture without its replay data
        full.ev = null;
        return write(['meta', 'full'], function (tx) {
          if (!tx) return;
          tx.objectStore('meta').put(meta);
          tx.objectStore('full').put(full);
        });
      });
    }).then(prune).then(function () { Mal.emit('gallery'); return meta; });
  };
  G.remove = function (id) {
    if (metas) metas = metas.filter(function (m) { return m.id !== id; });
    return write(['meta', 'full'], function (tx) {
      if (!tx) { delete mem.meta[id]; delete mem.full[id]; return; }
      tx.objectStore('meta').delete(id);
      tx.objectStore('full').delete(id);
    }).then(function () { Mal.emit('gallery'); });
  };
  G.setStar = function (id, on) {
    var m = null;
    (metas || []).forEach(function (x) { if (x.id === id) m = x; });
    if (!m) return Promise.resolve();
    m.star = !!on;
    return write(['meta'], function (tx) { if (tx) tx.objectStore('meta').put(m); });
  };
  G.clearAll = function () {
    metas = [];
    return write(['meta', 'full'], function (tx) {
      if (!tx) { mem.meta = {}; mem.full = {}; return; }
      tx.objectStore('meta').clear();
      tx.objectStore('full').clear();
    }).then(function () { Mal.emit('gallery'); });
  };
  // keep the newest pictures (and every favorite)
  function prune() {
    return G.list().then(function (list) {
      var excess = list.length - MAX_ITEMS;
      if (excess <= 0) return;
      var victims = list.filter(function (m) { return !m.star; }).slice(-excess);
      return Promise.all(victims.map(function (m) { return G.remove(m.id); }));
    });
  }

  /* ============================================================
     FRIDGE DOOR
     ============================================================ */
  var MAGNETS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#f48fb1'];
  var mode = 'kid';
  var emptyKlecks = null;

  G.open = function (m) {
    mode = m || 'kid';
    $('fridge').classList.toggle('parent-mode', mode === 'parent');
    Mal.app.show('fridge');
    render();
  };
  function render() {
    return G.list().then(function (list) {
      var grid = $('fridgeGrid');
      grid.innerHTML = '';
      $('fridgeEmpty').style.display = list.length ? 'none' : '';
      if (!list.length) {
        if (!emptyKlecks) emptyKlecks = new Mal.Klecks($('fridgeEmpty'), { color: Mal.paint.color.hex });
        emptyKlecks.setColor(Mal.paint.color.hex);
        emptyKlecks.wave();
        if (mode === 'kid') A.say('fridgeEmpty');
        return;
      }
      list.forEach(function (m) {
        var rnd = Mal.rng(m.id % 1000003);
        var card = document.createElement('button');
        card.className = 'card';
        card.style.transform = 'rotate(' + ((rnd() - 0.5) * 6).toFixed(1) + 'deg)';
        card.innerHTML = '<span class="magnet" style="background:' + MAGNETS[Math.floor(rnd() * MAGNETS.length)] + '"></span>' +
          '<img alt="" loading="lazy" src="' + m.thumb + '">' + (m.star ? '<span class="fav">' + Mal.icon('starOn') + '</span>' : '');
        Mal.tap(card, function () { G.view(m.id); });
        grid.appendChild(card);
      });
    });
  }
  Mal.tap($('fridgeBack'), function () {
    A.stopTalk();
    if (mode === 'parent') { Mal.app.show('home'); Mal.parent.open(); }
    else Mal.app.home();
  });

  /* ============================================================
     VIEWER + TIME-LAPSE
     ============================================================ */
  var viewer = $('viewer'), stage = $('viewerStage'), vImg = $('viewerImg'), vCanvas = $('viewerCanvas');
  var shown = null, replay = null;

  function fitStage(w, h) {
    var maxW = window.innerWidth * 0.92 - 20, maxH = window.innerHeight * 0.74 - 20;
    var s = Math.min(maxW / w, maxH / h);
    stage.style.width = Math.round(w * s + 20) + 'px';
    stage.style.height = Math.round(h * s + 20) + 'px';
    return { w: Math.round(w * s), h: Math.round(h * s) };
  }
  function stopReplay() {
    if (replay) { replay.stop(); replay = null; }
    vCanvas.style.display = 'none';
  }
  G.view = function (id) {
    stopReplay();
    filmReset();
    G.get(id).then(function (full) {
      if (!full) return;
      var meta = null;
      (metas || []).forEach(function (x) { if (x.id === id) meta = x; });
      shown = { full: full, meta: meta };
      fitStage(full.w, full.h);
      vImg.src = full.img;
      viewer.classList.toggle('parent-mode', mode === 'parent');
      $('vPlay').style.display = full.ev ? '' : 'none';
      vFilm.style.display = full.ev && G.filmType() ? '' : 'none';
      $('vStar').innerHTML = Mal.icon(meta && meta.star ? 'starOn' : 'star');
      viewer.classList.add('open');
    });
  };
  function closeViewer() {
    stopReplay();
    filmReset();
    viewer.classList.remove('open');
    shown = null;
  }
  G.closeViewer = closeViewer;

  Mal.tap($('vClose'), closeViewer);
  Mal.tap($('vPlay'), function () {
    if (!shown || !shown.full.ev || (film && film.state === 'rec')) return;
    stopReplay();
    var size = fitStage(shown.full.w, shown.full.h);
    var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    vCanvas.width = Math.round(size.w * dpr);
    vCanvas.height = Math.round(size.h * dpr);
    vCanvas.style.display = 'block';
    var lastBlip = 0;
    replay = Mal.paint.replay(vCanvas, shown.full, {
      duration: 6000,
      onStroke: function (meta) {
        var now = Date.now();
        if (now - lastBlip < 90) return;
        lastBlip = now;
        var c = Mal.color(meta.c);
        if (c) A.blip(c.freq, 0.07);
      },
      // talking about the process is part of making art (it's in the early-years goals)
      onDone: function () { replay = null; if (viewer.classList.contains('open')) A.say('tellMe'); }
    });
  });
  Mal.tap($('vStar'), function () {
    if (!shown || !shown.meta) return;
    var on = !shown.meta.star;
    G.setStar(shown.meta.id, on).then(render);
    $('vStar').innerHTML = Mal.icon(on ? 'starOn' : 'star');
  });
  Mal.tap($('vShare'), function () {
    if (shown) G.share(shown.full);
  });
  Mal.hold($('vDel'), 1200, function () {
    if (!shown) return;
    var id = shown.full.id;
    closeViewer();
    G.remove(id).then(render);
  });

  /* ============================================================
     SAVING — grown-ups hand files to the system share sheet
     (→ Photos, Files, print, messages); where there is none, download
     ============================================================ */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function baseName(full) {
    var d = new Date(full.id);
    return 'malspass-' + Mal.dayKey(full.id) + '-' + pad(d.getHours()) + pad(d.getMinutes());
  }
  function dataURLtoBytes(url) {
    var bin = atob(url.slice(url.indexOf(',') + 1));
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  G.shareFile = function (blob, name) {
    try {
      var file = new File([blob], name, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Malspaß' }).catch(function () {});
        return;
      }
    } catch (err) {}
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
  };
  G.share = function (full) {
    G.shareFile(new Blob([dataURLtoBytes(full.img)], { type: 'image/jpeg' }), baseName(full) + '.jpg');
  };

  /* ============================================================
     FILM — the time-lapse as a video file (grown-ups)
     The replay paints on its own canvas at a fixed video size and is
     copied to the viewer canvas every frame (Safari only sends frames
     for a canvas that changes, and the copy keeps the last picture on
     screen for the ending). The replay's tones are mixed in. The
     browser's MediaRecorder writes the file: MP4 in Safari, WebM
     elsewhere. iOS opens the share sheet only right after a tap, so a
     finished film waits for a second tap.
     ============================================================ */
  // H.264 + AAC plays everywhere (Photos, messengers); Safari records that for plain 'video/mp4'
  var FILM_TYPES = ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4;codecs=avc1', 'video/mp4',
                    'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  var FILM_LONG = 1280, FILM_HOLD = 1500, FILM_FPS = 30, FILM_MS = 6000;
  var vFilm = $('vFilm'), vNote = $('vNote');
  var film = null; // { state: 'rec' | 'ready', id, blob, name, abort }

  G.filmType = function () {
    if (!window.MediaRecorder || typeof vCanvas.captureStream !== 'function') return '';
    for (var i = 0; i < FILM_TYPES.length; i++) {
      try { if (MediaRecorder.isTypeSupported(FILM_TYPES[i])) return FILM_TYPES[i]; } catch (err) {}
    }
    return '';
  };
  function note(text) { vNote.textContent = text || ''; }
  function filmReset() {
    if (film && film.abort) film.abort();
    film = null;
    viewer.classList.remove('filming');
    vFilm.classList.remove('rec', 'ready');
    vFilm.innerHTML = Mal.icon('film');
    note('');
  }
  function filmFailed() { filmReset(); note(Mal.t('filmFail')); }

  function filmStart() {
    var full = shown && shown.full, type = G.filmType();
    if (!full || !full.ev || !type) return;
    stopReplay();
    var k = FILM_LONG / Math.max(full.w, full.h);
    var W = Math.round(full.w * k / 2) * 2, H = Math.round(full.h * k / 2) * 2;
    fitStage(full.w, full.h);
    vCanvas.width = W;
    vCanvas.height = H;
    vCanvas.style.display = 'block';
    var out = vCanvas.getContext('2d');
    var paint = document.createElement('canvas');
    paint.width = W;
    paint.height = H;

    var stream = vCanvas.captureStream(FILM_FPS);
    var tones = A.captureTones();
    if (tones && tones.track) { try { stream.addTrack(tones.track); } catch (err) {} }
    var rec = null;
    try { rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 3000000 }); } catch (err) {
      try { rec = new MediaRecorder(stream); } catch (err2) { rec = null; }
    }
    var f = film = { state: 'rec', id: full.id };
    var chunks = [], raf = 0, hold = 0, play = null, over = false;
    function stopAll() {
      cancelAnimationFrame(raf);
      clearTimeout(hold);
      if (play) { play.stop(); play = null; }
      stream.getTracks().forEach(function (t) { try { t.stop(); } catch (err) {} });
      if (tones) tones.stop();
    }
    f.abort = function () {
      over = true;
      try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (err) {}
      stopAll();
    };
    if (!rec) { filmFailed(); return; }
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onerror = function () { if (film === f) filmFailed(); };
    rec.onstop = function () {
      stopAll();
      if (over || film !== f) return;
      var mime = (rec.mimeType || type).split(';')[0];
      var blob = new Blob(chunks, { type: mime });
      if (!blob.size) { filmFailed(); return; }
      f.state = 'ready';
      f.abort = null;
      f.blob = blob;
      f.name = baseName(full) + (mime === 'video/mp4' ? '.mp4' : '.webm');
      viewer.classList.remove('filming');
      vFilm.classList.remove('rec');
      vFilm.classList.add('ready');
      vFilm.innerHTML = Mal.icon('filmSave');
      note(Mal.t('filmReady'));
    };

    viewer.classList.add('filming');
    vFilm.classList.add('rec');
    note(Mal.t('filmMaking'));
    var lastBlip = 0;
    play = Mal.paint.replay(paint, full, {
      duration: FILM_MS,
      onStroke: function (meta) {
        var now = Date.now();
        if (now - lastBlip < 90) return;
        lastBlip = now;
        var c = Mal.color(meta.c);
        if (c) A.blip(c.freq, 0.07);
      },
      onDone: function () {
        play = null;
        hold = setTimeout(function () { try { rec.stop(); } catch (err) { filmFailed(); } }, FILM_HOLD);
      }
    });
    (function copy() {
      out.drawImage(paint, 0, 0);
      raf = requestAnimationFrame(copy);
    })();
    try { rec.start(); } catch (err) { filmFailed(); }
  }
  Mal.tap(vFilm, function () {
    if (!shown) return;
    if (film && film.state === 'ready' && film.id === shown.full.id) { G.shareFile(film.blob, film.name); return; }
    if (film && film.state === 'rec') return;
    filmStart();
  });
  // a film can't be made in the background: start again when the app comes back
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' && film && film.state === 'rec') filmReset();
  });

  /* ============================================================
     BACKUP — every picture with its recording in one ZIP file.
     Stored, not compressed (the pictures are JPEGs already). Unzipped
     it is a folder of pictures; "Sicherung laden" reads it back.
       2026-10-05_14-03-27.jpg          the picture
       malspass/2026-10-05_14-03-27.json  recording and fridge data
       malspass/backup.json             what's inside (format, version)
     ============================================================ */
  var CRC_TABLE = null;
  function crc32(bytes) {
    if (!CRC_TABLE) {
      CRC_TABLE = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        CRC_TABLE[n] = c >>> 0;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function zipWriter() {
    var parts = [], central = [], offset = 0, count = 0, enc = new TextEncoder();
    return {
      add: function (name, bytes, ts) {
        var nm = enc.encode(name), crc = crc32(bytes), d = new Date(ts);
        var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
        var date = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
        var h = new DataView(new ArrayBuffer(30)), c = new DataView(new ArrayBuffer(46));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
        h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
        h.setUint32(18, bytes.length, true); h.setUint32(22, bytes.length, true); h.setUint16(26, nm.length, true);
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
        c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
        c.setUint32(20, bytes.length, true); c.setUint32(24, bytes.length, true); c.setUint16(28, nm.length, true);
        c.setUint32(42, offset, true);
        parts.push(h.buffer, nm, bytes);
        central.push(c.buffer, nm);
        offset += 30 + nm.length + bytes.length;
        count++;
      },
      blob: function () {
        var size = 0;
        central.forEach(function (x) { size += x.byteLength; });
        var e = new DataView(new ArrayBuffer(22));
        e.setUint32(0, 0x06054b50, true); e.setUint16(8, count, true); e.setUint16(10, count, true);
        e.setUint32(12, size, true); e.setUint32(16, offset, true);
        return new Blob(parts.concat(central, [e.buffer]), { type: 'application/zip' });
      }
    };
  }
  function toB64(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  // the recording as little-endian 16-bit numbers, the same on every device
  function evToB64(ev) {
    var dv = new DataView(new ArrayBuffer(ev.length * 2));
    for (var i = 0; i < ev.length; i++) dv.setUint16(i * 2, ev[i], true);
    return toB64(new Uint8Array(dv.buffer));
  }
  function evFromB64(str) {
    var bytes = dataURLtoBytes(',' + str), dv = new DataView(bytes.buffer), ev = new Uint16Array(bytes.length >> 1);
    for (var i = 0; i < ev.length; i++) ev[i] = dv.getUint16(i * 2, true);
    return ev;
  }
  function stamp(ts) {
    var d = new Date(ts);
    return Mal.dayKey(ts) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds());
  }

  // → Promise of { blob, name, count }
  G.backup = function (onProgress) {
    var enc = new TextEncoder();
    return G.list().then(function (list) {
      var todo = list.slice().reverse(), zip = zipWriter(), index = [], used = {}, i = 0;
      function next() {
        if (i >= todo.length) {
          var manifest = { format: 'malspass-backup', version: 1, app: 'Malspaß', created: new Date().toISOString(), pictures: index };
          zip.add('malspass/backup.json', enc.encode(JSON.stringify(manifest, null, 1)), Date.now());
          return { blob: zip.blob(), name: 'malspass-' + Mal.dayKey() + '.zip', count: index.length };
        }
        var m = todo[i++];
        return G.get(m.id).then(function (full) {
          if (full && full.img) {
            var name = stamp(m.id);
            while (used[name]) name += '-' + (m.id % 1000);
            used[name] = true;
            var data = { id: m.id, t: m.t, ch: m.ch, star: !!m.star, colors: m.colors || {}, found: m.found || [], thumb: m.thumb,
                         brush: full.brush, bg: full.bg, w: full.w, h: full.h, gw: full.gw || 0, gh: full.gh || 0,
                         strokes: full.strokes || [], ev: full.ev ? evToB64(full.ev) : null };
            zip.add(name + '.jpg', dataURLtoBytes(full.img), m.id);
            zip.add('malspass/' + name + '.json', enc.encode(JSON.stringify(data)), m.id);
            index.push({ id: m.id, image: name + '.jpg', data: 'malspass/' + name + '.json' });
          }
          if (onProgress) onProgress(i, todo.length);
          return next();
        });
      }
      return next();
    });
  };

  /* ---------- restore ---------- */
  function bytesOf(blob) {
    if (blob.arrayBuffer) return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); });
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(new Uint8Array(r.result)); };
      r.onerror = function () { reject(r.error); };
      r.readAsArrayBuffer(blob);
    });
  }
  // reads the table of contents at the end of a ZIP; entries are read one at a time
  function zipReader(file) {
    var tail = Math.min(file.size, 22 + 65535);
    return bytesOf(file.slice(file.size - tail)).then(function (end) {
      var dv = new DataView(end.buffer), at = -1;
      for (var i = end.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { at = i; break; }
      if (at < 0) throw new Error('notbackup');
      var n = dv.getUint16(at + 10, true), size = dv.getUint32(at + 12, true), off = dv.getUint32(at + 16, true);
      return bytesOf(file.slice(off, off + size)).then(function (cd) {
        var c = new DataView(cd.buffer), p = 0, entries = {}, dec = new TextDecoder();
        for (var k = 0; k < n; k++) {
          if (p + 46 > cd.length || c.getUint32(p, true) !== 0x02014b50) throw new Error('notbackup');
          var nl = c.getUint16(p + 28, true), xl = c.getUint16(p + 30, true), cl = c.getUint16(p + 32, true);
          entries[dec.decode(cd.subarray(p + 46, p + 46 + nl))] = {
            method: c.getUint16(p + 10, true), size: c.getUint32(p + 20, true), offset: c.getUint32(p + 42, true)
          };
          p += 46 + nl + xl + cl;
        }
        return {
          names: Object.keys(entries),
          read: function (name) {
            var e = entries[name];
            if (!e) return Promise.reject(new Error('notbackup'));
            return bytesOf(file.slice(e.offset, e.offset + 30)).then(function (h) {
              var hv = new DataView(h.buffer);
              var start = e.offset + 30 + hv.getUint16(26, true) + hv.getUint16(28, true);
              var raw = file.slice(start, start + e.size);
              if (e.method === 0) return bytesOf(raw);
              // re-zipped on a computer: deflated
              if (e.method === 8 && window.DecompressionStream && raw.stream) {
                return new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()
                  .then(function (b) { return new Uint8Array(b); });
              }
              throw new Error('unsupported');
            });
          }
        };
      });
    });
  }
  function put(meta, full) {
    return write(['meta', 'full'], function (tx) {
      if (!tx) { mem.meta[meta.id] = meta; mem.full[full.id] = full; return; }
      tx.objectStore('meta').put(meta);
      tx.objectStore('full').put(full);
    });
  }
  // adds the pictures this device doesn't have yet → Promise of { added, skipped }
  G.restore = function (file, onProgress) {
    var dec = new TextDecoder();
    return zipReader(file).then(function (zip) {
      var man = null;
      zip.names.forEach(function (n) {
        if (/(^|\/)malspass\/backup\.json$/.test(n) && n.indexOf('__MACOSX') !== 0) man = n;
      });
      if (!man) throw new Error('notbackup');
      var root = man.slice(0, man.length - 'malspass/backup.json'.length); // a folder, if it was re-zipped
      return zip.read(man).then(function (bytes) {
        var m = JSON.parse(dec.decode(bytes));
        if (!m || m.format !== 'malspass-backup' || !(m.version <= 1) || !Array.isArray(m.pictures)) throw new Error('notbackup');
        return G.list().then(function (list) {
          var have = {}, added = 0, skipped = 0, i = 0;
          list.forEach(function (x) { have[x.id] = true; });
          function next() {
            if (i >= m.pictures.length) return null;
            var p = m.pictures[i++];
            if (have[p.id]) { skipped++; if (onProgress) onProgress(i, m.pictures.length); return next(); }
            return Promise.all([zip.read(root + p.data), zip.read(root + p.image)]).then(function (r) {
              var d = JSON.parse(dec.decode(r[0]));
              var img = 'data:image/jpeg;base64,' + toB64(r[1]);
              var meta = { id: d.id, t: d.t || d.id, ch: d.ch, thumb: d.thumb || img, star: !!d.star, colors: d.colors || {}, found: d.found || [] };
              var full = { id: d.id, img: img, ev: d.ev ? evFromB64(d.ev) : null, strokes: d.strokes || [], brush: d.brush, bg: d.bg,
                           w: d.w, h: d.h, gw: d.gw || 0, gh: d.gh || 0 };
              return put(meta, full).then(function () { have[d.id] = true; added++; });
            }).then(function () {
              if (onProgress) onProgress(i, m.pictures.length);
              return next();
            });
          }
          return Promise.resolve(next()).then(function () {
            metas = null;
            return prune();
          }).then(function () {
            Mal.emit('gallery');
            return { added: added, skipped: skipped };
          });
        });
      });
    });
  };
})();
