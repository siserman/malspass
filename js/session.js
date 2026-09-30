/* ============================================================
   Malspaß — painting time
   A session budget, a daily budget, a break between sessions and
   a bedtime. Only real, visible, recently-touched time counts.
   The sun in the sky shows how much painting time is left; when
   it sets, Klecks gets sleepy and ends the session — so the app,
   not the parent, is the one that says "that's enough for now".
   ============================================================ */
(function () {
  'use strict';
  var Mal = window.Mal;
  var T = Mal.session = {};
  var S = Mal.settings;
  var IDLE_MS = 90 * 1000; // no touch for this long → the clock pauses

  var st = (function () {
    var s = Mal.store.get('time', null) || {};
    return {
      day: s.day || Mal.dayKey(), used: s.used || 0, sess: s.sess || 0, last: s.last || 0,
      sleepUntil: s.sleepUntil || 0, reason: s.reason || '', bonusDay: s.bonusDay || '', bonus: s.bonus || 0,
      bedOverride: s.bedOverride || 0, warned: !!s.warned, hist: s.hist || {}, sessLen: s.sessLen || 0
    };
  })();
  var lastInput = Date.now();
  var kidActive = false;
  var lastSave = 0;
  T.isSleeping = false;

  function save(force) {
    var now = Date.now();
    if (!force && now - lastSave < 5000) return;
    lastSave = now;
    Mal.store.set('time', st);
  }

  /* ---------- budgets ---------- */
  function dayRoll(now) {
    var today = Mal.dayKey(now);
    if (st.day === today) return;
    st.day = today;
    st.used = 0;
    st.bonus = 0;
    st.bonusDay = today;
    // keep two weeks of history for the parents' chart
    Object.keys(st.hist).forEach(function (k) { if (Mal.daysBetween(k, today) > 14) delete st.hist[k]; });
  }
  // a session granted by grown-ups ("10 more minutes") has its own length
  function sessionMs() { return st.sessLen || (S.sessionMin > 0 ? S.sessionMin * 60000 : Infinity); }
  function dailyMs() { return S.dailyMin > 0 ? S.dailyMin * 60000 + (st.bonusDay === st.day ? st.bonus : 0) : Infinity; }
  // rest days: Klecks sleeps all day (the guideline says "not every day")
  function isRestDay(ts) { return (S.restDays || []).indexOf(new Date(ts).getDay()) >= 0; }
  function nextWake(now) {
    var w = Mal.atTime(S.wake, now);
    if (w <= now) w = Mal.atTime(S.wake, now + 86400000);
    for (var guard = 0; guard < 7 && isRestDay(w); guard++) w = Mal.atTime(S.wake, w + 86400000);
    return w;
  }
  function inBedtime(now) {
    if (!S.bedtime || st.bedOverride > now) return false;
    return now >= Mal.atTime(S.bedtime, now) || now < Mal.atTime(S.wake, now);
  }
  function msToBedtime(now) {
    if (!S.bedtime || st.bedOverride > now) return Infinity;
    if (inBedtime(now)) return 0;
    return Mal.atTime(S.bedtime, now) - now;
  }

  T.remaining = function (now) {
    now = now || Date.now();
    if (isRestDay(now)) return 0;
    return Math.min(sessionMs() - st.sess, dailyMs() - st.used, msToBedtime(now));
  };
  T.asleep = function (now) {
    now = now || Date.now();
    dayRoll(now);
    return st.sleepUntil > now || inBedtime(now) || dailyMs() - st.used <= 0 || isRestDay(now);
  };
  T.restDay = function () { return isRestDay(Date.now()); };
  // when Klecks wakes up again (for the grown-ups' info line)
  T.wakeInfo = function (now) {
    now = now || Date.now();
    var until = st.sleepUntil;
    if (inBedtime(now) || dailyMs() - st.used <= 0 || isRestDay(now)) until = Math.max(until, nextWake(now));
    return { until: until, tomorrow: Mal.dayKey(until) !== Mal.dayKey(now) };
  };
  T.usedToday = function () { dayRoll(Date.now()); return st.used; };
  T.history = function () { return st.hist; };

  function endSession(now, forced) {
    var reason = forced || 'session';
    if (!forced && msToBedtime(now) <= 0) reason = 'bedtime';
    else if (!forced && (dailyMs() - st.used <= 0 || isRestDay(now))) reason = 'daily';
    st.sleepUntil = reason === 'session' ? now + S.breakMin * 60000 : nextWake(now);
    st.reason = reason;
    st.sess = 0;
    st.sessLen = 0;
    st.warned = false;
    T.isSleeping = true;
    save(true);
    Mal.emit('sessionEnd', { reason: reason, until: st.sleepUntil });
  }

  /* ---------- the clock ---------- */
  // test mode: the painting clock can run 10× or 60× faster
  function speed() { return Mal.debugOn() && Mal.debug.speed > 1 ? Mal.debug.speed : 1; }

  // a long gap is a natural break: the next session starts fresh
  function breakCheck(now) {
    if (st.last && now - st.last >= S.breakMin * 60000 && st.sess > 0) { st.sess = 0; st.sessLen = 0; st.warned = false; }
  }

  function tick() {
    var now = Date.now();
    dayRoll(now);
    breakCheck(now);

    if (T.isSleeping) {
      if (!T.asleep(now)) { T.isSleeping = false; st.sess = 0; st.warned = false; save(true); Mal.emit('wake', {}); }
    } else if (kidActive && document.visibilityState === 'visible') {
      if (now - lastInput < IDLE_MS) {
        var add = (st.last ? Mal.clamp(now - st.last, 0, 2000) : 1000) * speed();
        st.sess += add;
        st.used += add;
        st.hist[st.day] = (st.hist[st.day] || 0) + add;
        st.last = now;
        save(false);
      } else {
        Mal.paint.releaseWake(); // let the screen sleep if nobody is painting
      }
      var rem = T.remaining(now);
      if (isFinite(rem)) {
        var warnAt = Mal.clamp(0.25 * (st.sess + rem), 30000, 120000);
        if (!st.warned && rem > 0 && rem <= warnAt) { st.warned = true; save(true); Mal.emit('sessionWarn'); }
        if (rem <= 0) endSession(now);
      }
    }
    Mal.emit('clock', T.sky(now));
  }

  // sun position 0..1 across the sky (the effective session length)
  T.sky = function (now) {
    now = now || Date.now();
    if (T.isSleeping) return { frac: 1, night: true };
    var rem = T.remaining(now);
    if (!S.sun || !isFinite(rem)) return { frac: 0.3, night: false };
    var total = st.sess + Math.max(0, rem);
    return { frac: total > 0 ? Mal.clamp(st.sess / total, 0, 1) : 1, night: false };
  };

  T.setKidActive = function (on) {
    if (on && !kidActive) {
      var now = Date.now();
      dayRoll(now);
      breakCheck(now);   // e.g. app reopened hours later
      st.last = now;     // time spent in grown-up screens doesn't count
    }
    kidActive = !!on;
  };
  T.enterSleep = function () { T.isSleeping = true; };
  // after the "one last picture" warning, hanging that picture on the fridge ends the session
  T.lastPicture = function () { return !T.isSleeping && st.warned; };
  T.endNow = function () { if (!T.isSleeping) endSession(Date.now()); };

  // grown-ups: "wake Klecks, 10 more minutes"
  T.grant = function (minutes) {
    var now = Date.now(), ms = minutes * 60000;
    dayRoll(now);
    st.sleepUntil = 0;
    st.sess = 0;
    st.sessLen = ms;
    if (S.dailyMin > 0) {
      var over = st.used + ms - dailyMs();
      if (over > 0) {
        if (st.bonusDay !== st.day) { st.bonusDay = st.day; st.bonus = 0; }
        st.bonus += over;
      }
    }
    if (S.bedtime && msToBedtime(now) < ms) st.bedOverride = now + ms + 60000;
    st.warned = false;
    st.last = now;
    save(true);
    if (T.isSleeping) { T.isSleeping = false; Mal.emit('wake', { granted: true }); }
  };
  /* ---------- test mode helpers ---------- */
  T.status = function () {
    var now = Date.now();
    dayRoll(now);
    return { sess: st.sess, sessLen: sessionMs(), used: st.used, daily: dailyMs(), sleeping: T.isSleeping,
             reason: st.reason, until: T.wakeInfo(now).until, speed: speed() };
  };
  // Klecks goes to sleep right now for a given reason: 'session' | 'daily' | 'bedtime'
  T.debugSleep = function (reason) { endSession(Date.now(), reason); };
  T.warnNow = function () {
    if (T.isSleeping) return;
    st.warned = true;
    save(true);
    Mal.emit('sessionWarn');
  };
  // today's time back to zero; wakes Klecks without the wake-up scene when `silent`
  T.resetToday = function (silent) {
    st.used = 0; st.sess = 0; st.sessLen = 0; st.sleepUntil = 0; st.warned = false;
    st.bonus = 0; st.bedOverride = 0; st.hist[st.day] = 0; st.last = Date.now();
    save(true);
    if (T.isSleeping) {
      T.isSleeping = false;
      if (!silent) Mal.emit('wake', {});
    }
  };
  T.reset = function () {
    st = { day: Mal.dayKey(), used: 0, sess: 0, last: 0, sleepUntil: 0, reason: '', bonusDay: '', bonus: 0, bedOverride: 0, warned: false, hist: {}, sessLen: 0 };
    T.isSleeping = false;
    save(true);
  };

  Mal.on('input', function () { lastInput = Date.now(); });
  document.addEventListener('pointerdown', function () { lastInput = Date.now(); }, true);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { lastInput = Date.now(); tick(); }
    else save(true);
  });
  window.addEventListener('pagehide', function () { save(true); });
  setInterval(tick, 1000);

  /* ============================================================
     SKY — a little window with the sun travelling across it;
     Klecks stands on the hill in front
     ============================================================ */
  var SKY_STOPS = [[0, '#bfe6ff'], [0.62, '#c6e7fb'], [0.8, '#ffe2ad'], [0.93, '#ffb48c'], [1, '#8f7bb8']];
  function stopColor(stops, f) {
    for (var i = 1; i < stops.length; i++) {
      if (f <= stops[i][0]) {
        var a = stops[i - 1], b = stops[i];
        return Mal.mixHex(a[1], b[1], (f - a[0]) / (b[0] - a[0]));
      }
    }
    return stops[stops.length - 1][1];
  }
  function Sky(slot) {
    this.slot = slot;
    var box = this.el = document.createElement('div');
    box.className = 'sky';
    var stars = '';
    [[22, 18], [48, 34], [70, 12], [118, 22], [140, 40], [176, 16], [96, 44], [30, 46]].forEach(function (p, i) {
      stars += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 3 ? 1.1 : 1.6) + '"/>';
    });
    box.innerHTML = '<svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<rect class="sky-bg" width="200" height="100"/>' +
      '<g class="sky-stars">' + stars + '</g>' +
      '<path class="sky-moon" d="M161 10a14 14 0 1 0 10 24A11.5 11.5 0 0 1 161 10z"/>' +
      '<circle class="sky-glow" r="17"/><circle class="sky-sun" r="10.5"/>' +
      '<ellipse class="sky-cloud" cx="46" cy="30" rx="15" ry="5.5"/><ellipse class="sky-cloud" cx="150" cy="22" rx="12" ry="4.5"/>' +
      '<path class="sky-hill" d="M0 80Q55 62 105 74T200 70V100H0Z"/>' +
      '</svg>';
    slot.appendChild(box);
    this.klecksSlot = document.createElement('div');
    this.klecksSlot.className = 'sky-klecks';
    slot.appendChild(this.klecksSlot);
    this.bg = box.querySelector('.sky-bg');
    this.sun = box.querySelector('.sky-sun');
    this.glow = box.querySelector('.sky-glow');
    this.hill = box.querySelector('.sky-hill');
    this.last = '';
    this.set({ frac: 0.3, night: false });
  }
  Sky.prototype.set = function (s) {
    var key = s.night + '|' + s.frac.toFixed(3);
    if (key === this.last) return;
    this.last = key;
    this.el.classList.toggle('night', !!s.night);
    if (s.night) { this.bg.style.fill = '#1c2356'; this.hill.style.fill = '#2f4a3c'; return; }
    var f = s.frac;
    this.bg.style.fill = stopColor(SKY_STOPS, f);
    this.hill.style.fill = Mal.mixHex('#9ccc65', '#6d8f4e', Mal.clamp((f - 0.75) / 0.25, 0, 1));
    var x = 14 + 172 * f, y = 80 - 60 * Math.sin(Math.PI * Mal.clamp(f, 0, 1));
    var sunColor = Mal.mixHex('#ffd54f', '#ff8a50', Mal.clamp((f - 0.7) / 0.3, 0, 1));
    this.sun.setAttribute('cx', x.toFixed(1));
    this.sun.setAttribute('cy', y.toFixed(1));
    this.sun.style.fill = sunColor;
    this.glow.setAttribute('cx', x.toFixed(1));
    this.glow.setAttribute('cy', y.toFixed(1));
    this.glow.style.fill = sunColor;
  };
  Mal.Sky = Sky;
})();
