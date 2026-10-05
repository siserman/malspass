/* ============================================================
   Malspaß — for grown-ups
   Parental gate (numbers spelled out as words — a pre-reader
   can't pass it), the settings sheet and the first-run welcome.
   ============================================================ */
(function () {
  'use strict';
  var Mal = window.Mal, A = Mal.audio, T = Mal.session;
  var $ = Mal.$;
  var PA = Mal.parent = {};

  function openOverlay(id) { $(id).classList.add('open'); Mal.emit('overlay'); }
  function closeOverlay(id) { $(id).classList.remove('open'); Mal.emit('overlay'); }

  /* ============================================================
     GATE
     ============================================================ */
  var target = [], entered = [], onPass = null;

  PA.gate = function (cb) {
    if (Mal.debugOn() && Mal.debug.fastGate) { cb(); return; } // test mode shortcut
    onPass = cb;
    newQuestion();
    openOverlay('gate');
  };
  function newQuestion() {
    target = [];
    while (target.length < 3) {
      var n = 1 + Math.floor(Math.random() * 9);
      if (target.indexOf(n) < 0) target.push(n);
    }
    entered = [];
    var words = Mal.t('numbers');
    $('gateTitle').textContent = Mal.t('gateTitle');
    $('gateAsk').textContent = Mal.t('gateAsk');
    $('gateWords').textContent = target.map(function (n) { return words[n]; }).join(' – ');
    renderSlots();
  }
  function renderSlots() {
    var html = '';
    for (var i = 0; i < 3; i++) html += '<span>' + (entered[i] !== undefined ? entered[i] : '') + '</span>';
    $('gateSlots').innerHTML = html;
  }
  (function buildKeypad() {
    var pad = $('keypad');
    [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, null].forEach(function (n) {
      var b = document.createElement('button');
      if (n === null) { b.className = 'blank'; b.disabled = true; pad.appendChild(b); return; }
      b.textContent = String(n);
      Mal.tap(b, function () {
        if (entered.length >= 3) return;
        entered.push(n);
        renderSlots();
        if (entered.length < 3) return;
        if (entered.join() === target.join()) {
          setTimeout(function () { closeOverlay('gate'); if (onPass) onPass(); }, 150);
        } else {
          var card = $('gateCard');
          card.classList.remove('shake');
          void card.offsetWidth;
          card.classList.add('shake');
          setTimeout(newQuestion, 500);
        }
      });
      pad.appendChild(b);
    });
  })();
  $('gateClose').innerHTML = Mal.icon('close');
  Mal.tap($('gateClose'), function () { closeOverlay('gate'); });

  /* ============================================================
     SETTINGS SHEET
     ============================================================ */
  var sheet = $('parentSheet');

  var statusTimer = null;
  PA.open = function () {
    render();
    openOverlay('parent');
    sheet.scrollTop = 0;
    clearInterval(statusTimer);
    statusTimer = setInterval(updateStatus, 1000);
  };
  PA.close = function () {
    clearInterval(statusTimer);
    closeOverlay('parent');
    Mal.emit('parentClosed');
  };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function section(title) {
    var s = el('section', 'sec');
    s.appendChild(el('h2', '', Mal.esc(title)));
    sheet.appendChild(s);
    return s;
  }
  function chips(parent, label, options, current, onPick) {
    var row = el('div', 'row');
    if (label) row.appendChild(el('div', 'lbl', Mal.esc(label)));
    var box = el('div', 'chips');
    options.forEach(function (o) {
      var b = el('button', 'chip' + (o.v === current ? ' on' : ''), Mal.esc(o.l));
      Mal.tap(b, function () { onPick(o.v); render(); });
      box.appendChild(b);
    });
    row.appendChild(box);
    parent.appendChild(row);
    return row;
  }
  function minutes(n) { return n >= 60 && n % 60 === 0 ? Mal.t('hours', { n: n / 60 }) : Mal.t('min', { n: n }); }
  function setS(key, v) { Mal.settings[key] = v; Mal.saveSettings(); }
  function onOff(v) { return [{ v: true, l: Mal.t('on') }, { v: false, l: Mal.t('off') }]; }

  function render() {
    var S = Mal.settings;
    var keepScroll = sheet.scrollTop;
    sheet.innerHTML = '';

    statusEl = null;
    var head = el('header', '');
    head.appendChild(el('h1', '', Mal.esc(Mal.t('parentTitle'))));
    var close = el('button', 'round', Mal.icon('close'));
    close.setAttribute('aria-label', Mal.t('close'));
    Mal.tap(close, PA.close);
    head.appendChild(close);
    sheet.appendChild(head);

    // test mode on → its tools come first; off → only a switch at the very end
    if (Mal.DEV && Mal.debug.on) renderDebug(S);

    /* ---------- today ---------- */
    var today = section(Mal.t('secToday'));
    var used = Math.round(T.usedToday() / 60000);
    today.appendChild(el('p', 'big', Mal.esc(S.dailyMin > 0 ? Mal.t('usedOf', { m: used, max: S.dailyMin }) : Mal.t('usedNoLimit', { m: used }))));
    var asleep = T.asleep();
    var info = T.wakeInfo();
    var status = !asleep ? Mal.t('statusAwake')
      : (info.tomorrow ? Mal.t('statusMorning', { time: Mal.clock(info.until) }) : Mal.t('statusUntil', { time: Mal.clock(info.until) }));
    today.appendChild(el('p', 'note', Mal.esc(status)));
    if (asleep) {
      var wake = el('button', 'btn', Mal.esc(Mal.t('wake10')));
      Mal.tap(wake, function () { T.grant(10); PA.close(); });
      today.appendChild(wake);
    }
    // last 7 days
    var hist = T.history(), bars = el('div', 'bars'), max = Math.max(S.dailyMin || 30, 1);
    for (var d = 6; d >= 0; d--) {
      var key = Mal.dayKey(Date.now() - d * 86400000);
      var mins = Math.round((hist[key] || 0) / 60000);
      var dt = new Date(Date.now() - d * 86400000);
      var dayName = dt.toLocaleDateString(Mal.lang === 'de' ? 'de-DE' : 'en-US', { weekday: 'short' });
      var bar = el('div', 'bar' + (d === 0 ? ' today' : ''), '<i>' + mins + '</i><span>' + Mal.esc(dayName) + '</span>');
      bar.style.height = Math.max(4, Math.min(100, mins / max * 100)) + '%';
      bars.appendChild(bar);
    }
    today.appendChild(el('div', 'lbl', Mal.esc(Mal.t('last7'))));
    today.appendChild(bars);

    /* ---------- painting time ---------- */
    var time = section(Mal.t('secTime'));
    chips(time, Mal.t('agePreset'), [
      { v: '2', l: Mal.t('age_2') }, { v: '3-4', l: Mal.t('age_3-4') }, { v: '5-6', l: Mal.t('age_5-6') }
    ], S.age, function (v) { applyAge(v); });
    if (S.age === '2') time.appendChild(el('p', 'note warn', Mal.esc(Mal.t('under3'))));
    chips(time, Mal.t('session'), [1, 5, 10, 15, 20, 30, 0].map(function (n) {
      return { v: n, l: n === 1 ? Mal.t('testMin') : n === 0 ? Mal.t('unlimited') : minutes(n) };
    }), S.sessionMin, function (v) { setS('sessionMin', v); });
    chips(time, Mal.t('daily'), [10, 15, 30, 45, 60, 0].map(function (n) {
      return { v: n, l: n === 0 ? Mal.t('unlimited') : minutes(n) };
    }), S.dailyMin, function (v) { setS('dailyMin', v); });
    chips(time, Mal.t('breakAfter'), [15, 30, 60, 120].map(function (n) {
      return { v: n, l: minutes(n) };
    }), S.breakMin, function (v) { setS('breakMin', v); });
    chips(time, Mal.t('bedtime'), [null, '18:00', '18:30', '19:00', '19:30', '20:00'].map(function (v) {
      return { v: v, l: v === null ? Mal.t('off') : v };
    }), S.bedtime, function (v) { setS('bedtime', v); });
    // rest days (multi-select, Monday first)
    var restRow = el('div', 'row');
    restRow.appendChild(el('div', 'lbl', Mal.esc(Mal.t('restDays'))));
    var restBox = el('div', 'chips');
    [1, 2, 3, 4, 5, 6, 0].forEach(function (wd) {
      var ref = new Date(2026, 0, 4 + wd); // 4 Jan 2026 was a Sunday
      var name = ref.toLocaleDateString(Mal.lang === 'de' ? 'de-DE' : 'en-US', { weekday: 'short' });
      var on = (S.restDays || []).indexOf(wd) >= 0;
      var b = el('button', 'chip' + (on ? ' on' : ''), Mal.esc(name));
      Mal.tap(b, function () {
        var list = (S.restDays || []).slice();
        var i = list.indexOf(wd);
        if (i >= 0) list.splice(i, 1); else if (list.length < 6) list.push(wd);
        setS('restDays', list);
        render();
      });
      restBox.appendChild(b);
    });
    restRow.appendChild(restBox);
    time.appendChild(restRow);
    time.appendChild(el('p', 'note', Mal.esc(Mal.t('restNote'))));
    chips(time, Mal.t('sunClock'), onOff(), S.sun, function (v) { setS('sun', v); });

    /* ---------- chapters ---------- */
    var chs = section(Mal.t('secChapters'));
    chips(chs, Mal.t('pace'), [1, 2, 3, 7].map(function (n) {
      return { v: n, l: n === 1 ? '1 ' + Mal.t('paceDay') : Mal.t('paceDays', { n: n }) };
    }), S.pace, function (v) { setS('pace', v); Mal.emit('story'); });
    Mal.CHAPTERS.forEach(function (ch) {
      var s = Mal.story.status(ch);
      var row = el('div', 'chap');
      row.appendChild(el('span', 'ico', Mal.icon(ch.id)));
      var txt = s.open ? Mal.t('chOpen') : (s.inDays <= 1 ? Mal.t('chTomorrow') : Mal.t('chInDays', { n: s.inDays }));
      row.appendChild(el('span', 'nm', Mal.esc(Mal.t('chapter_' + ch.id)) + '<br><span class="st">' + Mal.esc(txt) + '</span>'));
      if (!s.open) {
        var b = el('button', 'btn small secondary', Mal.esc(Mal.t('unlock')));
        Mal.tap(b, function () { Mal.story.unlock(ch.id); render(); });
        row.appendChild(b);
      }
      chs.appendChild(row);
    });
    var all = el('button', 'btn secondary', Mal.esc(Mal.t('unlockAll')));
    Mal.tap(all, function () { Mal.story.unlockAll(); render(); });
    chs.appendChild(all);
    chs.appendChild(el('p', 'note', Mal.esc(Mal.t('chapterNote'))));

    /* ---------- Malkasten: the free-painting tools grow ---------- */
    var stu = section(Mal.t('secStudio'));
    var lvl = Mal.story.studioLevel(), nextIn = Mal.story.studioNextIn();
    stu.appendChild(el('p', 'big', Mal.esc(Mal.t('studioNow', { n: lvl, name: Mal.t('studio_' + lvl)[0] }))));
    stu.appendChild(el('p', 'note', Mal.esc(S.studioLevel ? Mal.t('studioFixed') : nextIn < 0 ? Mal.t('studioMax')
      : nextIn === 1 ? Mal.t('studioNext1') : Mal.t('studioNext', { d: nextIn }))));
    chips(stu, Mal.t('studioLevel'), [{ v: 0, l: Mal.t('studioAuto') }].concat(Mal.STUDIO.map(function (id, i) {
      return { v: i + 1, l: String(i + 1) };
    })), S.studioLevel, function (v) { setS('studioLevel', v); Mal.emit('story'); });
    if (!S.studioLevel) {
      chips(stu, Mal.t('studioPace'), [2, 3, 5, 7].map(function (n) { return { v: n, l: Mal.t('paceDays', { n: n }) }; }),
            S.studioPace, function (v) { setS('studioPace', v); Mal.emit('story'); });
    }
    var levels = el('ol', 'levels');
    Mal.STUDIO.forEach(function (id, i) {
      var t = Mal.t('studio_' + (i + 1));
      levels.appendChild(el('li', i + 1 <= lvl ? 'on' : '', '<b>' + Mal.esc(t[0]) + '</b> – ' + Mal.esc(t[1])));
    });
    stu.appendChild(levels);
    stu.appendChild(el('p', 'note', Mal.esc(Mal.t('studioNote'))));

    /* ---------- gallery ---------- */
    var gal = section(Mal.t('secGallery'));
    var countP = el('p', 'note', '…');
    gal.appendChild(countP);
    Mal.gallery.list().then(function (list) {
      countP.textContent = list.length === 1 ? Mal.t('galleryOne') : Mal.t('galleryCount', { n: list.length });
    });
    var openG = el('button', 'btn', Mal.esc(Mal.t('galleryOpen')));
    Mal.tap(openG, function () { closeOverlay('parent'); Mal.gallery.open('parent'); });
    gal.appendChild(openG);

    /* ---------- language & sound ---------- */
    var snd = section(Mal.t('secSound'));
    chips(snd, Mal.t('language'), [{ v: 'de', l: 'Deutsch' }, { v: 'en', l: 'English' }], Mal.lang, function (v) { Mal.setLang(v); });
    chips(snd, Mal.t('tones'), onOff(), S.tones, function (v) { setS('tones', v); if (!v) A.stopAllTones(); });
    chips(snd, Mal.t('voice'), onOff(), S.voice, function (v) { setS('voice', v); if (!v) A.stopTalk(); });

    /* ---------- why ---------- */
    var why = section(Mal.t('secWhy'));
    why.classList.add('why');
    Mal.t('why').forEach(function (p) { why.appendChild(el('p', '', Mal.esc(p))); });

    if (Mal.DEV && !Mal.debug.on) renderDebug(S);

    /* ---------- reset ---------- */
    var rs = section(Mal.t('secReset'));
    var rb = el('button', 'btn danger hold', Mal.RING + Mal.esc(Mal.t('resetHold')));
    Mal.hold(rb, 2500, function () {
      Mal.gallery.clearAll().then(function () {
        Mal.store.clearAll();
        location.reload();
      });
    });
    rs.appendChild(rb);
    rs.appendChild(el('p', 'note', Mal.esc(Mal.t('resetNote'))));

    sheet.scrollTop = toTop ? 0 : keepScroll; // switching test mode on jumps to its tools
    toTop = false;
  }

  /* ============================================================
     TEST MODE (only when Mal.DEV) — every chapter, day and scene
     without waiting, a faster clock, and every voice line to listen to
     ============================================================ */
  var statusEl = null, voicesOpen = false, toTop = false;

  function mmss(ms) {
    if (!isFinite(ms)) return '∞';
    var s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }
  function updateStatus() {
    if (!statusEl) return;
    var st = T.status();
    statusEl.textContent = Mal.t('dbgStatus', {
      sess: mmss(st.sess), len: mmss(st.sessLen), used: mmss(st.used), daily: mmss(st.daily), day: Mal.story.day(),
      state: st.sleeping ? Mal.t('dbgAsleep', { time: Mal.clock(st.until) }) : Mal.t('dbgAwake')
    });
  }
  // buttons that run an action and redraw; scenes close the sheet first
  function actions(parent, label, list) {
    var row = el('div', 'row');
    if (label) row.appendChild(el('div', 'lbl', Mal.esc(label)));
    var box = el('div', 'chips');
    list.forEach(function (a) {
      var b = el('button', 'chip' + (a.on ? ' on' : '') + (a.hold ? ' hold' : ''), (a.hold ? Mal.RING : '') + (a.html || Mal.esc(a.l)));
      if (a.hold) Mal.hold(b, a.hold, function () { a.fn(); render(); });
      else {
        Mal.tap(b, function () {
          if (a.scene) { PA.close(); setTimeout(a.fn, 60); }
          else { a.fn(); render(); }
        });
      }
      box.appendChild(b);
    });
    row.appendChild(box);
    parent.appendChild(row);
  }

  function renderDebug(S) {
    var D = Mal.debug, dbg = Mal.app.debug, story = Mal.story;
    var sec = section(Mal.t('dbgTitle'));
    sec.classList.add('dbg');
    chips(sec, null, onOff(), D.on, function (v) { D.on = v; toTop = v; Mal.saveDebug(); });
    if (!D.on) { sec.appendChild(el('p', 'note', Mal.esc(Mal.t('dbgNote')))); return; }

    statusEl = el('p', 'dbg-status', '');
    sec.appendChild(statusEl);
    updateStatus();

    // days pass → chapters open exactly like in real life
    actions(sec, Mal.t('dbgDays', { n: story.day() }), [
      { l: Mal.t('dbgDayMinus'), fn: function () { story.shiftDays(-1); } },
      { l: Mal.t('dbgDayPlus'), fn: function () { story.shiftDays(1); } },
      { l: Mal.t('dbgDayZero'), fn: function () { story.shiftDays(-story.day()); } },
      { l: Mal.t('dbgRelock'), fn: story.relock },
      { l: Mal.t('dbgResetIntros'), fn: story.resetIntros }
    ]);
    actions(sec, Mal.t('dbgOpenChapter'), Mal.CHAPTERS.map(function (ch) {
      return { html: '<span class="ico">' + Mal.icon(ch.id) + '</span>' + Mal.esc(Mal.t('chapter_' + ch.id)),
               scene: true, fn: function () { dbg.chapter(ch.id); } };
    }));

    var weekday = new Date().getDay(), rest = (S.restDays || []).indexOf(weekday) >= 0;
    actions(sec, Mal.t('dbgScenes'), [
      { l: Mal.t('dbgFirstRun'), scene: true, fn: dbg.firstRun },
      { l: Mal.t('dbgHello'), scene: true, fn: dbg.hello },
      { l: Mal.t('dbgAnnounce'), scene: true, fn: dbg.announce },
      { l: Mal.t('dbgWarn'), scene: true, fn: T.warnNow },
      { l: Mal.t('dbgGoodnight'), scene: true, fn: function () { T.debugSleep('session'); } },
      { l: Mal.t('dbgBedtime'), scene: true, fn: function () { T.debugSleep('bedtime'); } },
      { l: Mal.t('dbgDaily'), scene: true, fn: function () { T.debugSleep('daily'); } },
      { l: Mal.t('dbgRestToday'), on: rest, scene: true, fn: function () {
        var list = (S.restDays || []).slice(), i = list.indexOf(weekday);
        if (i >= 0) list.splice(i, 1); else list.push(weekday);
        setS('restDays', list);
      } },
      { l: Mal.t('dbgWake'), scene: true, fn: dbg.wake }
    ]);

    chips(sec, Mal.t('dbgSpeed'), [1, 10, 60].map(function (n) { return { v: n, l: '×' + n }; }), D.speed,
          function (v) { D.speed = v; Mal.saveDebug(); });
    chips(sec, Mal.t('dbgHud'), onOff(), D.hud, function (v) { D.hud = v; Mal.saveDebug(); });
    chips(sec, Mal.t('dbgFastGate'), onOff(), D.fastGate, function (v) { D.fastGate = v; Mal.saveDebug(); });
    actions(sec, null, [
      { l: Mal.t('dbgResetToday'), fn: function () { T.resetToday(false); } },
      { l: Mal.t('dbgEmptyFridge'), hold: 1200, fn: function () { Mal.gallery.clearAll(); } }
    ]);

    // every line Klecks can say — tap to hear it, see which ones are real recordings
    var vb = el('button', 'btn secondary', Mal.esc(Mal.t('dbgVoices')) + (voicesOpen ? ' ▾' : ' ▸'));
    Mal.tap(vb, function () { voicesOpen = !voicesOpen; render(); });
    sec.appendChild(vb);
    if (voicesOpen) {
      var keys = A.keys();
      var playAll = el('button', 'btn small', Mal.esc(Mal.t('dbgPlayAll')));
      Mal.tap(playAll, function () { A.sayQueue(keys); });
      sec.appendChild(playAll);
      var list = el('div', 'dbg-voices');
      keys.forEach(function (k) {
        var rec = A.hasClip(Mal.lang, k);
        var row = el('button', 'dbg-line', '<span class="play">▶</span><span class="k">' + Mal.esc(k) + '</span>' +
          '<span class="tx">' + Mal.esc(A.text(k)) + '</span><span class="tag' + (rec ? ' rec' : '') + '">' +
          Mal.esc(Mal.t(rec ? 'dbgClip' : 'dbgTts')) + '</span>');
        Mal.tap(row, function () { A.say(k); });
        list.appendChild(row);
      });
      sec.appendChild(list);
    }
    sec.appendChild(el('p', 'note', Mal.esc(Mal.t('dbgNote'))));
  }
  function applyAge(age) {
    var p = Mal.AGE_PRESETS[age];
    Mal.settings.age = age;
    Object.keys(p).forEach(function (k) { Mal.settings[k] = p[k]; });
    Mal.saveSettings();
  }
  Mal.on('lang', function () { if ($('parent').classList.contains('open')) render(); });

  /* ============================================================
     FIRST RUN — grown-ups see this once, before Klecks says hello
     ============================================================ */
  PA.firstRun = function (done) {
    var box = $('firstCard');
    var top = el('div', 'first-klecks');
    var k = new Mal.Klecks(top, { color: '#1e88e5' });
    function draw() {
      box.innerHTML = '';
      box.appendChild(top);
      k.wave();
      box.appendChild(el('h1', '', Mal.esc(Mal.t('firstTitle'))));
      var ul = el('ul', '');
      Mal.t('firstPoints').forEach(function (p) { ul.appendChild(el('li', '', Mal.esc(p))); });
      box.appendChild(ul);
      box.appendChild(el('div', 'lbl', Mal.esc(Mal.t('firstAge'))));
      var ages = el('div', 'chips');
      ['2', '3-4', '5-6'].forEach(function (a) {
        var b = el('button', 'chip' + (Mal.settings.age === a ? ' on' : ''), Mal.esc(Mal.t('age_' + a)));
        Mal.tap(b, function () { applyAge(a); draw(); });
        ages.appendChild(b);
      });
      box.appendChild(ages);
      if (Mal.settings.age === '2') box.appendChild(el('p', 'note warn', Mal.esc(Mal.t('under3'))));
      var langs = el('div', 'chips langs');
      [['de', 'Deutsch'], ['en', 'English']].forEach(function (l) {
        var b = el('button', 'chip' + (Mal.lang === l[0] ? ' on' : ''), l[1]);
        Mal.tap(b, function () { Mal.setLang(l[0]); draw(); });
        langs.appendChild(b);
      });
      box.appendChild(langs);
      var go = el('button', 'btn go', Mal.esc(Mal.t('firstStart')));
      Mal.tap(go, function () {
        closeOverlay('firstrun');
        box.innerHTML = '';
        done();
      });
      box.appendChild(go);
      box.appendChild(el('p', 'note', Mal.esc(Mal.t('firstHint'))));
    }
    draw();
    openOverlay('firstrun');
  };
})();
