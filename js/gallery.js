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
    G.get(id).then(function (full) {
      if (!full) return;
      var meta = null;
      (metas || []).forEach(function (x) { if (x.id === id) meta = x; });
      shown = { full: full, meta: meta };
      fitStage(full.w, full.h);
      vImg.src = full.img;
      viewer.classList.toggle('parent-mode', mode === 'parent');
      $('vPlay').style.display = full.ev ? '' : 'none';
      $('vStar').innerHTML = Mal.icon(meta && meta.star ? 'starOn' : 'star');
      viewer.classList.add('open');
    });
  };
  function closeViewer() {
    stopReplay();
    viewer.classList.remove('open');
    shown = null;
  }
  G.closeViewer = closeViewer;

  Mal.tap($('vClose'), closeViewer);
  Mal.tap($('vPlay'), function () {
    if (!shown || !shown.full.ev) return;
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
      onDone: function () { replay = null; }
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

  // grown-ups: hand the picture to the system share sheet (→ Photos, print, messages)
  function dataURLtoBlob(url) {
    var parts = url.split(','), bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: 'image/jpeg' });
  }
  G.share = function (full) {
    var d = new Date(full.id);
    var name = 'malspass-' + Mal.dayKey(full.id) + '-' + d.getHours() + '-' + d.getMinutes() + '.jpg';
    var blob = dataURLtoBlob(full.img);
    try {
      var file = new File([blob], name, { type: 'image/jpeg' });
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
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
})();
