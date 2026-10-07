/* ============================================================
   Malspaß — app
   Screens, Klecks' world (home + chapters), the painting UI,
   the goodnight ritual, and boot.
   ============================================================ */
(function () {
  'use strict';
  var Mal = window.Mal, A = Mal.audio, P = Mal.paint, T = Mal.session;
  var $ = Mal.$;

  // Offline support (no-op when opened as a local file)
  try {
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  } catch (err) {}

  /* ============================================================
     STORY — chapters open with the days ("sleeps"), never with
     play time; grown-ups can open any chapter whenever they like
     ============================================================ */
  var story = Mal.story = {};
  function installDay() { return Mal.store.get('installDay', null) || Mal.dayKey(); }
  story.status = function (ch) {
    var i = Mal.CHAPTERS.indexOf(ch);
    var need = i < 2 ? 0 : (i - 1) * Mal.settings.pace;
    var days = Mal.daysBetween(installDay(), Mal.dayKey());
    var open = days >= need || Mal.store.get('allOpen', false) || !!Mal.store.get('unlocked', {})[ch.id];
    return { open: open, inDays: Math.max(0, need - days) };
  };
  story.unlock = function (id) {
    var u = Mal.store.get('unlocked', {});
    u[id] = true;
    Mal.store.set('unlocked', u);
    Mal.emit('story');
  };
  story.unlockAll = function () { Mal.store.set('allOpen', true); Mal.emit('story'); };
  // test mode: travel through the days, lock chapters again, replay first-time intros
  story.day = function () { return Mal.daysBetween(installDay(), Mal.dayKey()); };
  story.shiftDays = function (n) {
    var target = Math.max(0, story.day() + n);
    var d = new Date();
    d.setDate(d.getDate() - target);
    Mal.store.set('installDay', Mal.dayKey(d.getTime()));
    Mal.emit('story');
  };
  story.relock = function () { Mal.store.remove('allOpen'); Mal.store.remove('unlocked'); Mal.emit('story'); };
  story.resetIntros = function () {
    Mal.store.remove('seen');
    Mal.store.remove('announced');
    Mal.store.remove('studioSeen');
    markStudioSeen(studioStart());
    Mal.emit('story');
  };

  /* ---------- Malkasten: free painting grows one tool per level ---------- */
  function studioRange() { return Mal.AGE_STUDIO[Mal.settings.age] || [2, 6]; }
  function studioStart() { return studioRange()[0]; }
  // grown-ups can fix the level; otherwise it grows with the days from an age-appropriate start
  story.studioLevel = function () {
    var S = Mal.settings;
    if (S.studioLevel) return Mal.clamp(S.studioLevel, 1, Mal.STUDIO.length);
    var r = studioRange();
    return Math.min(r[1], r[0] + Math.floor(story.day() / Math.max(1, S.studioPace)));
  };
  // days until the next level comes by itself (-1: fixed by grown-ups or highest level for this age)
  story.studioNextIn = function () {
    var S = Mal.settings, pace = Math.max(1, S.studioPace);
    if (S.studioLevel || story.studioLevel() >= studioRange()[1]) return -1;
    return pace - (story.day() % pace);
  };
  // the lowest level not introduced yet — Klecks shows one new tool per visit
  story.studioIntro = function () {
    var lvl = story.studioLevel(), seen = Mal.store.get('studioSeen', {});
    for (var i = 2; i <= lvl; i++) if (!seen[i]) return i;
    return 0;
  };
  function markStudioSeen(upTo) {
    var seen = Mal.store.get('studioSeen', {});
    for (var i = 1; i <= upTo; i++) seen[i] = true;
    Mal.store.set('studioSeen', seen);
  }
  // what a child of this age starts with isn't "new": set once the grown-ups picked the age
  // at first run (or on the first start of this version on an existing install)
  story.studioBaseline = function () { markStudioSeen(studioStart()); Mal.store.set('studioInit', true); };
  if (!Mal.store.get('studioInit', false) && Mal.store.get('installDay', null)) story.studioBaseline();
  // small persistent per-chapter flags: 'seen' (intro played), 'announced' (new-chapter hint given)
  function flag(name, id, set) {
    var f = Mal.store.get(name, {});
    if (set && !f[id]) { f[id] = true; Mal.store.set(name, f); }
    return !!f[id];
  }

  /* ============================================================
     SCREENS
     ============================================================ */
  var SCREENS = ['paintUI', 'home', 'fridge', 'sleep'];
  var current = null;
  var chapter = Mal.CHAPTERS[0];

  function show(name) {
    SCREENS.forEach(function (s) { $(s).classList.toggle('active', s === name); });
    current = name;
    P.enabled = name === 'paintUI';
    if (name !== 'paintUI') { P.endAll(); A.stopAllTones(); }
    if (name !== 'fridge') Mal.gallery.closeViewer();
    updateKidActive();
  }
  // the clock only runs while a child is actually using a kid screen
  function updateKidActive() {
    var grownUps = ['gate', 'parent', 'firstrun'].some(function (id) { return $(id).classList.contains('open'); });
    T.setKidActive(!grownUps && current !== null && current !== 'sleep');
  }
  Mal.on('overlay', updateKidActive);
  Mal.app = { show: show, home: function () { goHome(false); } };

  /* ============================================================
     KLECKS, SKIES, BUTTONS
     ============================================================ */
  var homeSky = new Mal.Sky($('homeSky'));
  var paintSky = new Mal.Sky($('paintSky'));
  var kHome = new Mal.Klecks(homeSky.klecksSlot);
  var kPaint = new Mal.Klecks(paintSky.klecksSlot);
  var kIntro = new Mal.Klecks($('introKlecks'));
  var kSleep = new Mal.Klecks($('sleepKlecks'));
  Mal.on('clock', function (sky) { homeSky.set(sky); paintSky.set(sky); });

  $('homeBtn').innerHTML = Mal.RING + Mal.icon('home');
  $('sheetBtn').innerHTML = Mal.RING + Mal.icon('fridge');
  $('fridgeBtn').innerHTML = Mal.icon('fridge');
  $('fridgeBack').innerHTML = Mal.icon('back');
  $('vClose').innerHTML = Mal.icon('close');
  $('vPlay').innerHTML = Mal.icon('play');
  $('vShare').innerHTML = Mal.icon('share');
  $('vFilm').innerHTML = Mal.icon('film');
  $('vDel').innerHTML = Mal.RING + Mal.icon('trash');
  $('sleepPot').innerHTML = '<svg viewBox="0 0 200 110" aria-hidden="true"><path d="M18 20H182L168 98Q166 108 154 108H46Q34 108 32 98Z" fill="#5c6bc0"/>' +
    '<rect x="8" y="8" width="184" height="22" rx="11" fill="#7986cb"/><path d="M40 30q4 16 10 0M150 30q3 12 8 0" fill="#9fa8da"/>' +
    '<rect x="70" y="52" width="60" height="26" rx="13" fill="#3f51b5" opacity=".45"/></svg>';

  [$('parentBtn'), $('sleepParentBtn')].forEach(function (b) {
    b.innerHTML = Mal.RING + Mal.icon('lock');
    Mal.hold(b, 2000, function () { A.stopTalk(); Mal.parent.gate(Mal.parent.open); });
  });

  /* ---------- language (a toy for kids, too: they hear the switch) ---------- */
  var langBtns = document.querySelectorAll('.lang');
  function syncLang() {
    for (var i = 0; i < langBtns.length; i++) langBtns[i].textContent = Mal.lang.toUpperCase();
  }
  Array.prototype.forEach.call(langBtns, function (b) {
    Mal.press(b, function () {
      Mal.emit('input');
      Mal.setLang(Mal.lang === 'de' ? 'en' : 'de');
      A.say('lang');
    });
  });
  Mal.on('lang', function () { syncLang(); renderHome(); });

  /* ============================================================
     HOME — Klecks' world. Each chapter bubble shows the latest
     picture painted there, so the world fills with the child's art.
     ============================================================ */
  var pendingAnnounce = null;
  function renderHome() {
    Mal.gallery.list().then(build, function () { build([]); });
    function build(list) {
      var latest = {};
      list.forEach(function (m) { if (!latest[m.ch]) latest[m.ch] = m.thumb; });
      var box = $('chapters');
      box.innerHTML = '';
      var lockedShown = false;
      pendingAnnounce = null;
      Mal.CHAPTERS.forEach(function (ch) {
        var s = story.status(ch);
        if (!s.open && lockedShown) return; // only the very next surprise is visible
        var b = document.createElement('button');
        var fresh = s.open && (!flag('seen', ch.id) || (ch.studio && story.studioIntro()));
        b.className = 'bubble' + (s.open ? '' : ' locked') + (fresh ? ' new' : '');
        var html = '<span class="face">';
        if (!s.open) html += Mal.icon('gift');
        else if (latest[ch.id]) html += '<img alt="" src="' + latest[ch.id] + '">';
        else html += Mal.icon(ch.id);
        html += '</span>';
        if (s.open && latest[ch.id]) html += '<span class="badge">' + Mal.icon(ch.id) + '</span>';
        if (!s.open) {
          html += '<span class="moons">';
          for (var i = 0; i < Math.min(3, s.inDays); i++) html += Mal.icon('moon');
          html += '</span>';
        } else {
          html += '<span class="label">' + Mal.esc(Mal.t('chapter_' + ch.id)) + '</span>';
        }
        b.innerHTML = html;
        b.setAttribute('aria-label', Mal.t('chapter_' + ch.id));
        Mal.press(b, function () { onBubble(ch, b); });
        box.appendChild(b);
        if (!s.open) lockedShown = true;
        if (s.open && !flag('announced', ch.id)) pendingAnnounce = ch.id;
      });
    }
  }
  Mal.on('story', renderHome);
  Mal.on('gallery', function () { if (current === 'home') renderHome(); });

  function onBubble(ch, el) {
    Mal.emit('input');
    var s = story.status(ch);
    if (!s.open) {
      el.classList.remove('wiggle');
      void el.offsetWidth;
      el.classList.add('wiggle');
      kHome.bounce();
      A.say(s.inDays <= 1 ? 'sleeps1' : s.inDays === 2 ? 'sleeps2' : s.inDays === 3 ? 'sleeps3' : 'sleepsN');
      return;
    }
    flag('announced', ch.id, true);
    startChapter(ch);
  }

  var lastHi = 0;
  Mal.press(kHome.el, function () {
    Mal.emit('input');
    kHome.bounce();
    if (Date.now() - lastHi < 3000) return;
    lastHi = Date.now();
    if (pendingAnnounce) {
      flag('announced', pendingAnnounce, true);
      pendingAnnounce = null;
      A.chime();
      A.say('newThing');
    } else {
      A.say('hi');
    }
  });
  Mal.press($('fridgeBtn'), function () { Mal.emit('input'); Mal.gallery.open('kid'); });

  function goHome(save) {
    if (save && current === 'paintUI') saveCurrent(false);
    newTools = null;
    show('home');
    renderHome();
  }

  /* ============================================================
     INTRO — Klecks introduces each chapter (short, skippable)
     ============================================================ */
  var introGo = null, introBusy = false;
  function openIntro() { $('intro').classList.add('open'); introBusy = true; }
  function closeIntro() { $('intro').classList.remove('open'); introBusy = false; }
  Mal.press($('intro'), function () { if (introGo) introGo(); });

  function runIntro(line, iconHtml, color, glow, then) {
    $('introIcon').style.display = iconHtml ? '' : 'none';
    $('introIcon').innerHTML = iconHtml || '';
    $('introText').textContent = Mal.LINES[line][Mal.lang];
    kIntro.setColor(color);
    kIntro.setGlow(glow);
    openIntro();
    kIntro.wave();
    var done = false;
    introGo = function () {
      if (done) return;
      done = true;
      introGo = null;
      A.stopTalk();
      closeIntro();
      then();
    };
    var go = introGo;
    A.say(line, function () { setTimeout(function () { if (introGo === go) go(); }, 450); });
  }

  function startChapter(ch) {
    var first = !flag('seen', ch.id);
    flag('seen', ch.id, true);
    var lvl = !first && ch.studio ? story.studioIntro() : 0;
    if (lvl) {
      // a new tool in the paint box: Klecks introduces it, the button glows until it's tried
      var seen = Mal.store.get('studioSeen', {});
      seen[lvl] = true;
      Mal.store.set('studioSeen', seen);
      newTools = STUDIO_NEW[lvl - 1];
      runIntro('st_' + Mal.STUDIO[lvl - 1], studioIcon(lvl), P.color.hex, false, function () { enterPaint(ch); });
      return;
    }
    runIntro(first ? 'ch_' + ch.id : 'letsGo', Mal.icon(ch.id),
             ch.brush === 'rainbow' ? 'rainbow' : P.color.hex, ch.brush === 'glow',
             function () { enterPaint(ch); });
  }

  /* ============================================================
     PAINTING
     ============================================================ */
  function enterPaint(ch) {
    chapter = ch;
    Mal.store.set('lastChapter', ch.id);
    if (ch.studio) fitStudioTools();
    var keys = paletteKeys(ch);
    if (keys.length && keys.indexOf(P.color.key) < 0) P.color = Mal.color(keys.indexOf('blue') >= 0 ? 'blue' : keys[0]);
    P.newPage(ch);
    buildPalette(ch);
    buildTools(ch);
    buildStudioBars();
    var ui = $('paintUI');
    ui.classList.toggle('mirror', ch.brush === 'mirror');
    ui.classList.toggle('night', ch.brush === 'glow');
    syncKlecksColor();
    show('paintUI');
  }

  // the color actually painted (Malkasten level 7 adds light and dark shades)
  function paintHex() { return chapter.studio ? Mal.shade(P.color.hex, P.shade) : P.color.hex; }
  function paletteKeys(ch) {
    if (ch.studio) return Mal.PALETTES[Mal.studioHas(story.studioLevel(), 'colors') ? 'all' : 'basic'];
    return Mal.PALETTES[ch.palette];
  }

  function syncKlecksColor() {
    var c = chapter.brush === 'rainbow' ? 'rainbow' : paintHex();
    [kPaint, kHome, kSleep].forEach(function (k) { k.setColor(c); });
    kPaint.setGlow(chapter.brush === 'glow');
  }

  function buildPalette(ch) {
    var el = $('palette');
    el.innerHTML = '';
    var keys = paletteKeys(ch);
    var isNew = ch.studio && newTools && newTools.indexOf('palette') >= 0;
    keys.forEach(function (key) {
      var c = Mal.color(key);
      var b = document.createElement('button');
      b.className = 'swatch' + (key === P.color.key ? ' selected' : '') +
                    (isNew && Mal.PALETTES.basic.indexOf(key) < 0 ? ' new' : '');
      b.dataset.key = key;
      b.style.background = ch.studio ? Mal.shade(c.hex, P.shade) : c.hex;
      b.setAttribute('aria-label', c.de + ' / ' + c.en);
      // pointerdown (not click) → instant response for little fingers
      Mal.press(b, function () { selectColor(c); });
      el.appendChild(b);
    });
    $('dock').classList.toggle('empty', !keys.length);
  }

  function selectColor(c) {
    P.color = c;
    var sw = $('palette').children;
    for (var i = 0; i < sw.length; i++) {
      sw[i].classList.toggle('selected', sw[i].dataset.key === c.key);
      if (sw[i].dataset.key === c.key) sw[i].classList.remove('new');
    }
    if (P.tool === 'eraser') P.tool = lastBrush; // picking a color means painting again
    syncKlecksColor();
    kPaint.bounce();
    refreshTools();
    refreshStudio();
    A.say(c.key);
    Mal.emit('input');
  }

  function buildTools(ch) {
    var el = $('tools');
    el.innerHTML = '';
    if (ch.brush !== 'stamp') return;
    Mal.SHAPES.forEach(function (sh) {
      var b = document.createElement('button');
      b.className = 'tool';
      b.dataset.shape = sh;
      b.setAttribute('aria-label', Mal.LINES[sh].de + ' / ' + Mal.LINES[sh].en);
      Mal.press(b, function () {
        P.shape = sh;
        refreshTools();
        kPaint.bounce();
        A.say(sh);
        Mal.emit('input');
      });
      el.appendChild(b);
    });
    refreshTools();
  }
  function refreshTools() {
    var tools = $('tools').children;
    for (var i = 0; i < tools.length; i++) {
      tools[i].innerHTML = Mal.shapeSVG(tools[i].dataset.shape, P.color.hex);
      tools[i].classList.toggle('selected', tools[i].dataset.shape === P.shape);
    }
    $('tools').classList.toggle('on-white', P.color.key === 'white');
  }

  /* ---------- Malkasten tool bars (free painting) ---------- */
  // which buttons glow after Klecks introduced level n
  var STUDIO_NEW = [[], ['palette'], ['size'], ['eraser'], ['crayon', 'water', 'marker'], ['bucket', 'undo'], ['shade']];
  var newTools = null, lastBrush = 'paint';

  // keep tool, width and shade within what this level offers
  function fitStudioTools() {
    var lvl = story.studioLevel();
    var tools = toolList(lvl);
    if (tools.indexOf(P.tool) < 0) P.tool = 'paint';
    if (Mal.BRUSH_TYPES.indexOf(lastBrush) < 0 || tools.indexOf(lastBrush) < 0) lastBrush = 'paint';
    if (!Mal.studioHas(lvl, 'sizes')) P.size = 'm';
    if (!Mal.studioHas(lvl, 'shades')) P.shade = 0;
    if (Mal.PALETTES[Mal.studioHas(lvl, 'colors') ? 'all' : 'basic'].indexOf(P.color.key) < 0) P.color = Mal.color('blue');
  }
  function toolList(lvl) {
    var t = Mal.studioHas(lvl, 'brushes') ? Mal.BRUSH_TYPES.slice() : (Mal.studioHas(lvl, 'eraser') ? ['paint'] : []);
    if (Mal.studioHas(lvl, 'eraser')) t.push('eraser');
    if (Mal.studioHas(lvl, 'bucket')) t.push('bucket');
    return t;
  }
  function barButton(kind, value) {
    var b = document.createElement('button');
    b.className = 'tbtn';
    b.dataset.kind = kind;
    b.dataset.value = String(value);
    var glow = kind === 'tool' ? value : kind;
    if (newTools && newTools.indexOf(glow) >= 0) b.classList.add('new');
    Mal.press(b, function () {
      b.classList.remove('new');
      Mal.emit('input');
      if (kind === 'undo') {
        if (P.undo()) { A.whoosh(); kPaint.bounce(); }
        refreshStudio();
        return;
      }
      if (kind === 'tool') {
        P.tool = value;
        if (Mal.BRUSH_TYPES.indexOf(value) >= 0) lastBrush = value;
        A.say('tool_' + value);
      } else if (kind === 'size') {
        P.size = value;
        A.say('size_' + value);
      } else {
        P.shade = value;
        A.say(value > 0 ? 'shade_light' : (value < 0 ? 'shade_dark' : 'shade_normal'));
        buildPalette(chapter);
        syncKlecksColor();
      }
      kPaint.bounce();
      refreshStudio();
    });
    return b;
  }
  // buttons that belong together stay together when a bar has to wrap (small landscape phones)
  function addGroup(bar, buttons) {
    if (!buttons.length) return;
    var g = document.createElement('div');
    g.className = 'grp';
    buttons.forEach(function (b) { g.appendChild(b); });
    bar.appendChild(g);
  }
  function buildStudioBars() {
    var left = $('toolbar'), right = $('sizebar');
    left.innerHTML = '';
    right.innerHTML = '';
    if (!chapter.studio) return;
    var lvl = story.studioLevel(), tools = toolList(lvl);
    var isBrush = function (t) { return Mal.BRUSH_TYPES.indexOf(t) >= 0; };
    addGroup(left, tools.filter(isBrush).map(function (t) { return barButton('tool', t); }));
    var more = tools.filter(function (t) { return !isBrush(t); }).map(function (t) { return barButton('tool', t); });
    if (Mal.studioHas(lvl, 'bucket')) more.push(barButton('undo', 1));
    addGroup(left, more);
    if (Mal.studioHas(lvl, 'sizes')) addGroup(right, ['l', 'm', 's'].map(function (z) { return barButton('size', z); }));
    if (Mal.studioHas(lvl, 'shades')) addGroup(right, [1, 0, -1].map(function (v) { return barButton('shade', v); }));
    refreshStudio();
  }
  function refreshStudio() {
    if (!chapter.studio) return;
    var hex = paintHex();
    var btns = document.querySelectorAll('#toolbar .tbtn, #sizebar .tbtn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i], kind = b.dataset.kind, v = b.dataset.value, on = false, icon;
      if (kind === 'tool') { icon = Mal.toolIcon(v, hex); on = P.tool === v; }
      else if (kind === 'size') { icon = Mal.toolIcon('size_' + v, hex); on = P.size === v; }
      else if (kind === 'shade') {
        var sh = Mal.shade(P.color.hex, +v);
        icon = '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="15" fill="' + sh + '"' +
               (Mal.luma(sh) > 0.85 ? ' stroke="#b0b0b0" stroke-width="1.5"' : '') + '/></svg>';
        on = P.shade === +v;
      } else { icon = Mal.toolIcon('undo'); b.classList.toggle('off', !P.canUndo()); }
      if (b.dataset.icon !== icon) { b.innerHTML = icon; b.dataset.icon = icon; }
      b.classList.toggle('selected', on);
    }
  }
  Mal.on('strokeEnd', function () { if (current === 'paintUI') refreshStudio(); });
  // the picture Klecks shows when introducing a new level
  function studioIcon(lvl) {
    var hex = P.color.hex;
    switch (Mal.STUDIO[lvl - 1]) {
      case 'colors': return '<svg viewBox="0 0 48 48"><circle cx="16" cy="16" r="9" fill="#fb8c00"/><circle cx="32" cy="16" r="9" fill="#8e24aa"/>' +
                            '<circle cx="16" cy="32" r="9" fill="#f48fb1"/><circle cx="32" cy="32" r="9" fill="#795548"/></svg>';
      case 'sizes':  return '<svg viewBox="0 0 48 48"><circle cx="9" cy="24" r="3.5" fill="' + hex + '"/><circle cx="20" cy="24" r="6" fill="' + hex + '"/>' +
                            '<circle cx="35" cy="24" r="10" fill="' + hex + '"/></svg>';
      case 'eraser': return Mal.toolIcon('eraser');
      case 'brushes': return Mal.toolIcon('crayon', hex);
      case 'bucket': return Mal.toolIcon('bucket', hex);
      default:       return '<svg viewBox="0 0 48 48"><circle cx="12" cy="24" r="9" fill="' + Mal.shade(hex, 1) + '"/><circle cx="24" cy="24" r="9" fill="' + hex +
                            '"/><circle cx="36" cy="24" r="9" fill="' + Mal.shade(hex, -1) + '"/></svg>';
    }
  }

  Mal.press(kPaint.el, function () {
    Mal.emit('input');
    kPaint.bounce();
    A.say(chapter.brush === 'rainbow' ? 'manyColors' : P.color.key);
  });

  // color kitchen: "Orange!" when a new color appears on the paper
  Mal.on('discover', function (name) {
    var c = Mal.color(name);
    if (!c) return;
    kPaint.setColor(c.hex);
    kPaint.bounce();
    A.chime();
    setTimeout(function () { A.say(name); }, 380);
  });

  /* ---------- saving: every picture goes on the fridge ---------- */
  function saveCurrent(fly) {
    var item = P.snapshot();
    if (!item) return Promise.resolve(null);
    if (fly) flyToFridge(item.thumb);
    return Mal.gallery.add(item).then(function () { return item; }, function () { return item; });
  }

  function flyToFridge(src) {
    var target = current === 'paintUI' ? $('sheetBtn') : $('fridgeBtn');
    var r = target.getBoundingClientRect();
    var w = window.innerWidth, h = window.innerHeight;
    var img = document.createElement('img');
    img.className = 'fly';
    img.src = src;
    img.style.width = w + 'px';
    img.style.height = h + 'px';
    document.body.appendChild(img);
    var s = Math.max(0.05, r.width / w);
    void img.offsetWidth;
    img.style.transform = 'translate(' + (r.left + r.width / 2 - w * s / 2) + 'px,' + (r.top + r.height / 2 - h * s / 2) + 'px) scale(' + s + ')';
    img.style.opacity = '0.3';
    A.whoosh();
    setTimeout(function () {
      if (img.parentNode) img.parentNode.removeChild(img);
      target.classList.remove('pop');
      void target.offsetWidth;
      target.classList.add('pop');
    }, 760);
  }

  function flash() {
    var f = $('flash');
    f.style.background = chapter.bg === Mal.NIGHT ? '#000' : '#fff';
    f.style.transition = 'none';
    f.style.opacity = '0.9';
    void f.offsetWidth; // reflow
    f.style.transition = 'opacity 0.5s ease';
    f.style.opacity = '0';
  }

  // hold the fridge button: the picture goes on the fridge, a fresh sheet appears
  var lastComment = 0;
  var hungLastPicture = false; // the "one last picture" ended the session (goodnight mentions the fridge)
  Mal.hold($('sheetBtn'), 2000, function () {
    Mal.emit('input');
    var had = P.hasContent();
    var substantial = P.amount() > 400;
    var last = T.lastPicture();
    saveCurrent(true).then(function (item) {
      if (!item || last) return;
      // describe, don't judge — and not every single time
      if (substantial && Date.now() - lastComment > 40000) {
        lastComment = Date.now();
        A.sayQueue(P.describe(item).concat(['fridge']));
      }
    });
    P.newPage(chapter);
    refreshStudio();
    flash();
    if (!had) A.say('clean');
    if (had && last) { hungLastPicture = true; T.endNow(); } // "one last picture" is done → time for bed
  });

  Mal.hold($('homeBtn'), 700, function () { goHome(true); });

  /* ============================================================
     WINDING DOWN — Klecks gets sleepy, finishes the last picture
     with the child, says goodnight and goes to bed. The app ends
     the session, not the parent, and never mid-stroke.
     ============================================================ */
  Mal.on('sessionWarn', function () {
    if (current === 'sleep') return;
    kHome.setSleepy(true);
    kPaint.setSleepy(true);
    (current === 'paintUI' ? kPaint : kHome).yawn();
    setTimeout(function () { A.say('sleepy'); }, 1000);
  });

  var pendingEnd = null, endAsked = 0;
  Mal.on('sessionEnd', function (info) {
    info.lastPicture = hungLastPicture;
    hungLastPicture = false;
    pendingEnd = info;
    endAsked = Date.now();
    tryEnd();
  });
  Mal.on('strokeEnd', function () { if (pendingEnd) setTimeout(tryEnd, 250); });
  setInterval(function () { if (pendingEnd) tryEnd(); }, 1000);

  function tryEnd() {
    if (!pendingEnd) return;
    var waited = Date.now() - endAsked;
    if ((P.activeCount() > 0 || introBusy || A.isTalking()) && waited < 20000) return;
    var info = pendingEnd;
    pendingEnd = null;
    goToSleep(info, true);
  }

  function goToSleep(info, ritual) {
    introGo = null;
    closeIntro();
    Mal.gallery.closeViewer();
    var painting = current === 'paintUI';
    var saved = painting && P.hasContent();
    newTools = null;
    if (painting) saveCurrent(true);
    P.enabled = false;
    P.endAll();
    A.stopAllTones();
    P.releaseWake();
    T.enterSleep();
    setTimeout(function () {
      show('sleep');
      var el = $('sleep');
      el.classList.remove('night');
      renderSleepInfo();
      kSleep.setSleeping(false);
      kSleep.setSleepy(true);
      if (!ritual) { el.classList.add('night'); kSleep.setSleeping(true); return; }
      kSleep.yawn();
      setTimeout(function () {
        var lines = [info.reason === 'session' ? 'goodnight' : 'goodnightDay', 'realPaint'];
        if (saved || info.lastPicture) lines.unshift('fridge');
        A.sayQueue(lines, function () {
          if (current !== 'sleep' || !T.isSleeping) return; // woken up meanwhile
          el.classList.add('night');
          kSleep.setSleeping(true);
        });
      }, 1300);
    }, painting ? 850 : 0);
  }

  function renderSleepInfo() {
    var w = T.wakeInfo();
    var until = T.restDay() ? Mal.t('restDayInfo')
      : w.tomorrow ? Mal.t('sleepMorning') : Mal.t('sleepUntil', { time: Mal.clock(w.until) });
    $('sleepInfo').innerHTML = '<b>' + Mal.esc(until) + '</b><br>' + Mal.esc(Mal.t('ideaNow')) + ' ' +
      Mal.esc(Mal.t('idea_' + Mal.store.get('lastChapter', 'free')));
  }
  Mal.on('lang', function () { if (current === 'sleep') renderSleepInfo(); });
  Mal.on('settings', function () { if (current === 'sleep') renderSleepInfo(); });

  // a sleeping Klecks is not a toy: one soft hum now and then, nothing more
  var lastHum = 0;
  Mal.press(kSleep.el, function () {
    if (!kSleep.sleeping || Date.now() - lastHum < 12000) return;
    lastHum = Date.now();
    A.hum();
  });

  Mal.on('wake', function () {
    [kHome, kPaint, kSleep].forEach(function (k) { k.setSleepy(false); });
    if (current !== 'sleep') return;
    $('sleep').classList.remove('night');
    kSleep.setSleeping(false);
    kSleep.yawn();
    setTimeout(function () {
      show('home');
      renderHome();
      kHome.wave();
      A.say('awake');
    }, 1900);
  });

  /* ============================================================
     TEST MODE — scenes the parents' area can jump to
     ============================================================ */
  Mal.app.debug = {
    firstRun: function () {
      show('home');
      Mal.parent.firstRun(function () {
        story.studioBaseline();
        renderHome();
        runIntro('hello', '', '#1e88e5', false, function () { kHome.wave(); });
      });
    },
    hello: function () {
      show('home');
      runIntro('hello', '', '#1e88e5', false, function () { kHome.wave(); });
    },
    announce: function () {
      show('home');
      renderHome();
      kHome.bounce();
      A.chime();
      A.say('newThing');
    },
    // open any chapter, even a locked one (wakes Klecks quietly first)
    chapter: function (id) {
      if (T.isSleeping) T.resetToday(true);
      [kHome, kPaint, kSleep].forEach(function (k) { k.setSleepy(false); k.setSleeping(false); });
      startChapter(Mal.chapter(id));
    },
    wake: function () {
      if (current === 'sleep') T.grant(10);
      else { T.resetToday(true); show('home'); renderHome(); kHome.wave(); }
    }
  };

  // small timer read-out on the kids' screens (test mode only)
  var hud = $('debugHud');
  function mmss(ms) {
    if (!isFinite(ms)) return '∞';
    var s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }
  function updateHud() {
    var on = Mal.debugOn() && Mal.debug.hud;
    hud.style.display = on ? '' : 'none';
    if (!on) return;
    var st = T.status();
    hud.textContent = (st.sleeping ? 'zzz ' + Mal.clock(st.until) : mmss(st.sess) + ' / ' + mmss(st.sessLen)) +
      ' · ' + mmss(st.used) + ' / ' + mmss(st.daily) + ' · ' + (Mal.lang === 'de' ? 'Tag ' : 'day ') + story.day() +
      (st.speed > 1 ? ' · ×' + st.speed : '');
  }
  Mal.on('clock', updateHud);
  Mal.on('debug', updateHud);

  /* ============================================================
     BOOT
     ============================================================ */
  syncLang();
  renderHome();
  if (!Mal.store.get('installDay', null)) {
    // very first start: grown-ups first, then Klecks says hello
    show('home');
    Mal.parent.firstRun(function () {
      Mal.store.set('installDay', Mal.dayKey());
      story.studioBaseline();
      flag('announced', 'free', true);
      flag('announced', 'rainbow', true);
      renderHome();
      runIntro('hello', '', '#1e88e5', false, function () { kHome.wave(); });
    });
  } else if (T.asleep()) {
    T.enterSleep();
    goToSleep({ reason: 'resume' }, false);
  } else {
    show('home');
    kHome.wave();
  }
})();
