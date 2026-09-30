/* ============================================================
   Malspaß — Klecks, the mascot
   A little drop of paint that takes on the chosen color.
   Pure SVG + one small animation loop: breathing, blinking,
   looking at the finger, talking, bouncing, yawning, sleeping.

   House rules for Klecks (see docs/CONCEPT.md): always glad when
   you come, always fine when you go — never sad, never begging,
   never "just one more".
   ============================================================ */
(function () {
  'use strict';
  var Mal = window.Mal;
  var all = [];
  var uid = 0;

  var BODY = 'M60 10C67 28 102 52 102 86C102 110 83 126 60 126C37 126 18 110 18 86C18 52 53 28 60 10Z';
  var MOUTH = {
    smile: 'M50 101Q60 111 70 101',
    open:  'M50 100Q60 116 70 100Q60 104 50 100Z',
    yawn:  'M52.5 104a7.5 9.5 0 1 0 15 0a7.5 9.5 0 1 0-15 0Z',
    o:     'M56.8 105a3.2 3.4 0 1 0 6.4 0a3.2 3.4 0 1 0-6.4 0Z'
  };

  function markup(id) {
    return '<svg viewBox="0 0 120 140" aria-hidden="true">' +
      '<defs><linearGradient id="krb' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#e53935"/><stop offset=".22" stop-color="#fb8c00"/><stop offset=".42" stop-color="#fdd835"/>' +
      '<stop offset=".62" stop-color="#43a047"/><stop offset=".8" stop-color="#1e88e5"/><stop offset="1" stop-color="#8e24aa"/>' +
      '</linearGradient></defs>' +
      '<ellipse class="k-shadow" cx="60" cy="131" rx="34" ry="5"/>' +
      '<g class="k-all">' +
        '<ellipse class="k-arm" cx="22" cy="97" rx="7" ry="12"/>' +
        '<ellipse class="k-arm" cx="98" cy="97" rx="7" ry="12"/>' +
        '<path class="k-body" d="' + BODY + '"/>' +
        '<ellipse class="k-hl" cx="40" cy="70" rx="6" ry="12" transform="rotate(25 40 70)"/>' +
        '<circle class="k-hl" cx="48" cy="48" r="3.2"/>' +
        '<g class="k-eye" data-cx="47"><ellipse class="k-white" cx="47" cy="84" rx="9" ry="11"/>' +
          '<g class="k-pupil"><circle cx="47.5" cy="86" r="5.6"/><circle class="k-glint" cx="49.7" cy="83.4" r="1.9"/></g></g>' +
        '<g class="k-eye" data-cx="73"><ellipse class="k-white" cx="73" cy="84" rx="9" ry="11"/>' +
          '<g class="k-pupil"><circle cx="72.5" cy="86" r="5.6"/><circle class="k-glint" cx="74.7" cy="83.4" r="1.9"/></g></g>' +
        '<path class="k-lid" d="M39 86Q47 93 55 86M65 86Q73 93 81 86"/>' +
        '<ellipse class="k-cheek" cx="34" cy="99" rx="7" ry="4.5"/><ellipse class="k-cheek" cx="86" cy="99" rx="7" ry="4.5"/>' +
        '<path class="k-mouth" d="' + MOUTH.smile + '"/>' +
      '</g>' +
      '<g class="k-zzz"><path d="M87 36h7l-7 8h7"/><path d="M97 21h8l-8 9h8"/><path d="M107 4h10l-10 11h10"/></g>' +
    '</svg>';
  }

  function now() { return performance.now() / 1000; }

  function Klecks(container, opts) {
    opts = opts || {};
    this.id = ++uid;
    var el = this.el = document.createElement('div');
    el.className = 'klecks' + (opts.className ? ' ' + opts.className : '');
    el.innerHTML = markup(this.id);
    container.appendChild(el);
    this.gAll = el.querySelector('.k-all');
    this.shadow = el.querySelector('.k-shadow');
    this.body = el.querySelector('.k-body');
    this.arms = el.querySelectorAll('.k-arm');
    this.eyes = el.querySelectorAll('.k-eye');
    this.pupils = el.querySelectorAll('.k-pupil');
    this.lid = el.querySelector('.k-lid');
    this.mouth = el.querySelector('.k-mouth');
    this.color = null;
    this.sleeping = false;
    this.sleepy = false;
    this.talking = false;
    this.glowing = false;
    this.anim = {};                    // start times of one-shot animations
    this.nextBlink = now() + 1 + Math.random() * 3;
    this.blinkAt = -1;
    this.look = { x: 0, y: 0 };
    this.lookTarget = { x: 0, y: 0 };
    this.lookUntil = 0;
    this.mouthOpen = false;
    this.mouthFlip = 0;
    this.cache = {};
    this.visible = false;
    this.setColor(opts.color || '#1e88e5');
    all.push(this);
  }

  Klecks.prototype.setColor = function (c) {
    if (c === this.color) return;
    this.color = c;
    var fill, stroke, dark = false;
    if (c === 'rainbow') {
      fill = 'url(#krb' + this.id + ')';
      stroke = '#6a4a8c';
    } else {
      fill = c;
      stroke = Mal.mixHex(c, '#000000', 0.28);
      dark = Mal.luma(c) < 0.3;
    }
    this.body.style.fill = fill;
    this.body.style.stroke = stroke;
    for (var i = 0; i < this.arms.length; i++) {
      this.arms[i].style.fill = fill;
      this.arms[i].style.stroke = stroke;
    }
    this.el.classList.toggle('dark', dark);
    if (this.glowing) this.setGlow(true);
  };

  Klecks.prototype.setGlow = function (on) {
    this.glowing = on;
    var c = this.color === 'rainbow' ? '#fdd835' : this.color;
    this.el.style.filter = on ? 'drop-shadow(0 0 7px ' + c + ')' : '';
  };
  Klecks.prototype.bounce = function () { this.anim.bounce = now(); };
  Klecks.prototype.wave   = function () { this.anim.wave = now(); };
  Klecks.prototype.yawn   = function () { this.anim.yawn = now(); };
  Klecks.prototype.setSleepy = function (on) { this.sleepy = !!on; };
  Klecks.prototype.setSleeping = function (on) {
    this.sleeping = !!on;
    if (on) { this.talking = false; this.sleepy = false; }
    this.el.classList.toggle('sleeping', this.sleeping);
  };

  // look toward a point on screen (e.g. the painting finger)
  Klecks.prototype.lookAt = function (x, y) {
    var r = this.el.getBoundingClientRect();
    if (!r.width) return;
    var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * 0.6);
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var k = Math.min(1, d / 120);
    this.lookTarget.x = dx / d * 3.2 * k;
    this.lookTarget.y = dy / d * 2.6 * k;
    this.lookUntil = now() + 2.5;
  };

  function set(k, el, attr, val, slot) {
    if (k.cache[slot] === val) return;
    k.cache[slot] = val;
    if (attr === 'display') el.style.display = val;
    else el.setAttribute(attr, val);
  }

  Klecks.prototype.update = function (t) {
    var a = this.anim, sx = 1, sy = 1, ty = 0, p, q;

    // breathing
    var br = this.sleeping ? Math.sin(t * 1.5) * 0.035 : Math.sin(t * 2.6) * 0.018;
    sx -= br * 0.7;
    sy += br;

    // bounce: squash – jump with stretch – squash on landing
    if (a.bounce !== undefined) {
      p = (t - a.bounce) / 0.6;
      if (p >= 1 || p < 0) delete a.bounce;
      else if (p < 0.16) { q = p / 0.16; sx *= 1 + 0.12 * q; sy *= 1 - 0.12 * q; }
      else if (p < 0.82) {
        q = (p - 0.16) / 0.66;
        ty = -22 * Math.sin(Math.PI * q);
        var s = 0.09 * Math.pow(Math.cos(Math.PI * q), 2);
        sx *= 1 - s; sy *= 1 + s;
      } else { q = (p - 0.82) / 0.18; var sq = 0.1 * Math.sin(Math.PI * q); sx *= 1 + sq; sy *= 1 - sq; }
    }

    // yawn: stretch up, eyes squeezed, big round mouth
    var yawning = false;
    if (a.yawn !== undefined) {
      p = (t - a.yawn) / 1.8;
      if (p >= 1 || p < 0) delete a.yawn;
      else { yawning = true; var st = Math.sin(Math.PI * p); sy *= 1 + 0.07 * st; sx *= 1 - 0.035 * st; }
    }

    set(this, this.gAll, 'transform',
        'translate(0 ' + ty.toFixed(2) + ') translate(60 128) scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(-60 -128)', 'all');
    var sh = 1 - Math.min(0.5, -ty / 44);
    set(this, this.shadow, 'transform', 'translate(60 131) scale(' + sh.toFixed(3) + ' 1) translate(-60 -131)', 'shadow');

    // waving arm
    var armRot = 0;
    if (a.wave !== undefined) {
      p = (t - a.wave) / 1.5;
      if (p >= 1 || p < 0) delete a.wave;
      else {
        var raise = Math.min(1, p / 0.2) * Math.min(1, (1 - p) / 0.2); // up – wave – down
        armRot = (-125 + 22 * Math.sin(p * Math.PI * 7)) * raise;
      }
    }
    set(this, this.arms[1], 'transform', 'rotate(' + armRot.toFixed(1) + ' 96 88)', 'arm');

    // eyes: closed while sleeping or yawning, heavy when sleepy, blinking otherwise
    var closed = this.sleeping || yawning;
    set(this, this.lid, 'display', closed ? '' : 'none', 'lid');
    for (var i = 0; i < this.eyes.length; i++) set(this, this.eyes[i], 'display', closed ? 'none' : '', 'eyeD' + i);
    if (!closed) {
      if (t >= this.nextBlink) { this.blinkAt = t; this.nextBlink = t + 2.2 + Math.random() * 4; }
      var ey = this.sleepy ? 0.5 : 1;
      if (t - this.blinkAt < 0.14) ey = 0.1;
      for (var j = 0; j < this.eyes.length; j++) {
        var cx = this.eyes[j].getAttribute('data-cx');
        set(this, this.eyes[j], 'transform', 'translate(' + cx + ' 84) scale(1 ' + ey + ') translate(-' + cx + ' -84)', 'eye' + j);
      }
      // pupils: follow the finger, otherwise wander a little
      var tx = this.lookTarget.x, tyy = this.lookTarget.y;
      if (t > this.lookUntil) { tx = Math.sin(t * 0.7) * 1.2; tyy = Math.sin(t * 0.43) * 0.8; }
      this.look.x += (tx - this.look.x) * 0.18;
      this.look.y += (tyy - this.look.y) * 0.18;
      var pt = 'translate(' + this.look.x.toFixed(2) + ' ' + this.look.y.toFixed(2) + ')';
      for (var n = 0; n < this.pupils.length; n++) set(this, this.pupils[n], 'transform', pt, 'pupil' + n);
    }

    // mouth
    var shape = 'smile';
    if (yawning) shape = 'yawn';
    else if (this.sleeping) shape = 'o';
    else if (this.talking) {
      if (t > this.mouthFlip) { this.mouthOpen = !this.mouthOpen; this.mouthFlip = t + 0.08 + Math.random() * 0.11; }
      shape = this.mouthOpen ? 'open' : 'smile';
    }
    if (this.cache.mouth !== shape) {
      this.cache.mouth = shape;
      this.mouth.setAttribute('d', MOUTH[shape]);
      this.mouth.setAttribute('class', 'k-mouth k-mouth-' + shape);
    }
  };

  // one loop for all instances; only visible ones do any work
  var lastVis = 0;
  function loop() {
    var t = now();
    if (t - lastVis > 0.25) {
      lastVis = t;
      for (var i = 0; i < all.length; i++) all[i].visible = all[i].el.getClientRects().length > 0;
    }
    for (var j = 0; j < all.length; j++) if (all[j].visible) all[j].update(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  Mal.on('talk', function (on) {
    all.forEach(function (k) { k.talking = !!on && !k.sleeping; });
  });
  Mal.on('look', function (p) {
    all.forEach(function (k) { if (k.visible) k.lookAt(p.x, p.y); });
  });

  Mal.Klecks = Klecks;
})();
