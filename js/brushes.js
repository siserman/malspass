/* ============================================================
   Malspaß — brushes
   Every brush is a pure function of the recorded points plus a
   per-stroke seed, so a painting can be replayed exactly
   (time-lapse in the gallery, high-res export later).

   A point has   x, y   = device pixels on the target surface
                 cx, cy = CSS pixels on the original page (for spacing)
   ============================================================ */
(function () {
  'use strict';
  var Mal = window.Mal;
  var B = Mal.brushes = {};
  var Q = B.Q = 65535;   // coordinates are stored as 16-bit fractions of the page
  var SIZE = 26;         // base brush size in CSS px

  /* ============================================================
     SURFACES — a canvas that shows one page (live or replay)
     ============================================================ */
  B.surface = function (canvas, page) {
    var S = { canvas: canvas, ctx: canvas.getContext('2d'), page: page, grid: null };
    B.resize(S);
    if (page.brush === 'mix') S.grid = makeGrid(page.gw, page.gh);
    return S;
  };
  B.resize = function (S) {
    S.W = S.canvas.width;
    S.H = S.canvas.height;
    S.k = Math.min(S.W / S.page.w, S.H / S.page.h); // device px per page px
  };
  B.point = function (S, qx, qy) {
    return { x: qx / Q * S.W, y: qy / Q * S.H, cx: qx / Q * S.page.w, cy: qy / Q * S.page.h };
  };
  B.clear = function (S) {
    var c = S.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.fillStyle = S.page.bg;
    c.fillRect(0, 0, S.W, S.H);
    if (S.grid) { resetGrid(S.grid); B.renderGrid(S); }
  };
  // per-stroke state; `meta` is what gets saved:
  // {b: brush, c: color key, s: seed, sh: shape, z: width (CSS px), v: shade -1/0/+1, m: fill mask}
  B.stroke = function (meta) {
    var col = Mal.color(meta.c) || Mal.color('blue');
    return {
      meta: meta, key: col.key, hex: Mal.shade(col.hex, meta.v || 0), freq: col.freq, shape: meta.sh || 'star',
      size: meta.z || SIZE, rng: Mal.rng(meta.s || 1), dist: 0, acc: 0, carry: 0, spark: 0, blip: false, cell: -1
    };
  };

  /* ---------- drawing helpers ---------- */
  function dot(S, p, r, color) {
    var c = S.ctx;
    c.beginPath();
    c.fillStyle = color;
    c.arc(p.x, p.y, r, 0, Math.PI * 2);
    c.fill();
  }
  function seg(S, a, b, w, color) {
    var c = S.ctx;
    c.beginPath();
    c.strokeStyle = color;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  }
  function cssDist(a, b) {
    var dx = b.cx - a.cx, dy = b.cy - a.cy;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function lerpPt(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t };
  }
  // call fn at even spacing along a→b (st.carry remembers the leftover between segments)
  function along(st, a, b, gap, fn) {
    var len = cssDist(a, b);
    if (len <= 0) return;
    var t = gap - st.carry;
    while (t <= len) { fn(lerpPt(a, b, t / len)); t += gap; }
    st.carry = len - (t - gap);
  }

  /* ============================================================
     PAINT — the classic round finger brush
     ============================================================ */
  B.paint = {
    begin: function (S, st, p) { dot(S, p, st.size * S.k / 2, st.hex); },
    move:  function (S, st, a, b) { seg(S, a, b, st.size * S.k, st.hex); }
  };

  /* ============================================================
     MIRROR — everything also appears mirrored (butterflies!)
     ============================================================ */
  function mirrored(S, p) { return { x: S.W - p.x, y: p.y, cx: S.page.w - p.cx, cy: p.cy }; }
  B.mirror = {
    begin: function (S, st, p) { B.paint.begin(S, st, p); B.paint.begin(S, st, mirrored(S, p)); },
    move:  function (S, st, a, b) { B.paint.move(S, st, a, b); B.paint.move(S, st, mirrored(S, a), mirrored(S, b)); }
  };

  /* ============================================================
     MALKASTEN BRUSHES — crayon, watercolor, marker, eraser and the
     paint bucket. Width (z) and light/dark shade (v) come from meta.
     ============================================================ */

  // Wachsmalstift: grainy wax — small seeded flecks across the stroke width
  var CRAYON_GAP = 1.6;
  function crayonDab(S, st, p, dx, dy) {
    var c = S.ctx, w = st.size * S.k, n = Math.max(3, Math.round(st.size / 3));
    var grain = Math.max(1, st.size / 26) * S.k;
    c.fillStyle = st.hex;
    for (var i = 0; i < n; i++) {
      var off = (st.rng() - 0.5) * w * 0.95;
      var along = (st.rng() - 0.5) * 2 * S.k;
      var sz = (0.8 + st.rng() * 1.6) * grain;
      c.globalAlpha = 0.45 + st.rng() * 0.5;
      c.fillRect(p.x - dy * off + dx * along - sz / 2, p.y + dx * off + dy * along - sz / 2, sz, sz);
    }
    c.globalAlpha = 1;
  }
  B.crayon = {
    begin: function (S, st, p) {
      st.carry = 0;
      for (var k = 0; k < 4; k++) crayonDab(S, st, p, Math.cos(k * 0.785), Math.sin(k * 0.785));
    },
    move: function (S, st, a, b) {
      var len = cssDist(a, b);
      if (len <= 0) return;
      var dx = (b.cx - a.cx) / len, dy = (b.cy - a.cy) / len;
      along(st, a, b, CRAYON_GAP, function (q) { crayonDab(S, st, q, dx, dy); });
    }
  };

  // Wasserfarbe: soft translucent glaze; layers darken and mix like real watercolor
  var WATER_GAP = 2.5;
  var waterSprites = {};
  function waterSprite(hex, rad) {
    var key = hex + '|' + Math.round(rad);
    if (waterSprites[key]) return waterSprites[key];
    var n = Math.max(2, Math.ceil(rad * 2));
    var cv = document.createElement('canvas');
    cv.width = cv.height = n;
    var g = cv.getContext('2d');
    var rgb = Mal.hexToRgb(hex).join(',');
    var grd = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    grd.addColorStop(0, 'rgba(' + rgb + ',0.11)');
    grd.addColorStop(0.65, 'rgba(' + rgb + ',0.08)');
    grd.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, n, n);
    waterSprites[key] = cv;
    return cv;
  }
  function waterDab(S, st, p) {
    var base = st.size * 0.62 * S.k;
    var r = base * (0.9 + st.rng() * 0.2);
    var c = S.ctx;
    // white paint can't darken anything, so it is laid on top instead
    c.globalCompositeOperation = Mal.luma(st.hex) > 0.9 ? 'source-over' : 'multiply';
    c.drawImage(waterSprite(st.hex, base), p.x - r, p.y - r, r * 2, r * 2);
    c.globalCompositeOperation = 'source-over';
  }
  B.water = {
    begin: function (S, st, p) { st.carry = 0; waterDab(S, st, p); },
    move:  function (S, st, a, b) { along(st, a, b, WATER_GAP, function (q) { waterDab(S, st, q); }); }
  };

  // Filzstift: thin and crisp
  B.marker = {
    begin: function (S, st, p) { dot(S, p, st.size * 0.45 * S.k / 2, st.hex); },
    move:  function (S, st, a, b) { seg(S, a, b, st.size * 0.45 * S.k, st.hex); }
  };

  // Radiergummi: paints the paper back
  B.eraser = {
    begin: function (S, st, p) { dot(S, p, st.size * 1.4 * S.k / 2, S.page.bg); },
    move:  function (S, st, a, b) { seg(S, a, b, st.size * 1.4 * S.k, S.page.bg); }
  };

  // Farbeimer: the area is found once on the live page (B.findFill) and saved with
  // the stroke as runs, so replays and undo paint exactly the same area
  B.bucket = {
    begin: function (S, st) {
      var m = st.meta.m;
      st.blip = true;
      if (!m) return;
      var cv = document.createElement('canvas');
      cv.width = m.w;
      cv.height = m.h;
      var g = cv.getContext('2d');
      g.fillStyle = st.hex;
      for (var i = 0; i < m.r.length; i += 3) g.fillRect(m.r[i + 1], m.r[i], m.r[i + 2], 1);
      S.ctx.imageSmoothingEnabled = true;
      S.ctx.drawImage(cv, 0, 0, m.w, m.h, 0, 0, S.W, S.H);
    },
    move: function () {}
  };
  // flood fill on the page at CSS resolution → {w, h, r: [y, x, length, …]}
  B.findFill = function (S, qx, qy) {
    var w = Math.max(1, Math.round(S.page.w)), h = Math.max(1, Math.round(S.page.h));
    var cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    var g = cv.getContext('2d');
    g.drawImage(S.canvas, 0, 0, S.W, S.H, 0, 0, w, h);
    var px = g.getImageData(0, 0, w, h).data;
    var sx = Mal.clamp(Math.floor(qx / Q * w), 0, w - 1), sy = Mal.clamp(Math.floor(qy / Q * h), 0, h - 1);
    var si = (sy * w + sx) * 4, r0 = px[si], g0 = px[si + 1], b0 = px[si + 2], TOL = 48;
    var mask = new Uint8Array(w * h);
    function like(i) {
      var j = i * 4;
      return !mask[i] && Math.abs(px[j] - r0) <= TOL && Math.abs(px[j + 1] - g0) <= TOL && Math.abs(px[j + 2] - b0) <= TOL;
    }
    var stack = [sx, sy], x0, x1, y, x;
    function seedRow(yy) { // one seed per run of fillable pixels in the row above/below
      if (yy < 0 || yy >= h) return;
      var inRun = false;
      for (var xx = x0; xx <= x1; xx++) {
        var ok = like(yy * w + xx);
        if (ok && !inRun) stack.push(xx, yy);
        inRun = ok;
      }
    }
    while (stack.length) {
      y = stack.pop();
      x = stack.pop();
      if (!like(y * w + x)) continue;
      x0 = x;
      x1 = x;
      while (x0 > 0 && like(y * w + x0 - 1)) x0--;
      while (x1 < w - 1 && like(y * w + x1 + 1)) x1++;
      for (var k = x0; k <= x1; k++) mask[y * w + k] = 1;
      seedRow(y - 1);
      seedRow(y + 1);
    }
    // grow by one pixel so the paint tucks under soft (anti-aliased) outlines, then encode as runs
    var runs = [];
    for (y = 0; y < h; y++) {
      var start = -1;
      for (x = 0; x <= w; x++) {
        var i = y * w + x;
        var on = x < w && (mask[i] || (x > 0 && mask[i - 1]) || (x < w - 1 && mask[i + 1]) ||
                           (y > 0 && mask[i - w]) || (y < h - 1 && mask[i + w]));
        if (on && start < 0) start = x;
        else if (!on && start >= 0) { runs.push(y, start, x - start); start = -1; }
      }
    }
    return { w: w, h: h, r: runs };
  };

  /* ============================================================
     RAINBOW — color walks through the rainbow as you paint,
     and the tone walks up the pentatonic scale with it
     ============================================================ */
  var RAINBOW_NOTES = [[20, 261.63], [45, 293.66], [90, 329.63], [170, 392.0], [250, 440.0], [300, 523.25]];
  function noteFor(h) {
    for (var i = 0; i < RAINBOW_NOTES.length; i++) if (h < RAINBOW_NOTES[i][0]) return RAINBOW_NOTES[i][1];
    return 523.25;
  }
  function hue(h) { return 'hsl(' + h.toFixed(1) + ',88%,' + (h > 40 && h < 75 ? 50 : 56) + '%)'; }
  B.rainbow = {
    begin: function (S, st, p) {
      st.dist = 0;
      st.freq = noteFor(0);
      dot(S, p, SIZE * 1.25 * S.k / 2, hue(0));
    },
    move: function (S, st, a, b) {
      st.dist += cssDist(a, b);
      var h = (st.dist * 0.8) % 300; // red → purple every ~375 px
      seg(S, a, b, SIZE * 1.25 * S.k, hue(h));
      st.freq = noteFor(h);
    }
  };

  /* ============================================================
     STAMPS — tap for one, drag for a trail
     ============================================================ */
  var STAMP_GAP = 70;
  B.stamp = {
    begin: function (S, st, p) { st.acc = 0; stamp(S, st, p); },
    move: function (S, st, a, b) {
      st.acc += cssDist(a, b);
      if (st.acc >= STAMP_GAP) { st.acc = 0; stamp(S, st, b); }
    }
  };
  function stamp(S, st, p) {
    var r = 30 * S.k * (0.85 + 0.3 * st.rng());
    var rot = (st.rng() - 0.5) * 0.7;
    var c = S.ctx;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(rot);
    c.fillStyle = st.hex;
    B.shapePath(c, st.shape, r);
    c.fill();
    if (st.shape === 'flower') {
      c.beginPath();
      c.fillStyle = st.key === 'yellow' ? '#fb8c00' : '#fdd835';
      c.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      c.fill();
    } else {
      c.strokeStyle = st.key === 'white' ? '#cfcfcf' : Mal.mixHex(st.hex, '#000000', 0.18);
      c.lineWidth = 2.2 * S.k;
      c.lineJoin = 'round';
      c.stroke();
    }
    c.restore();
    st.blip = true;
  }
  B.shapePath = function (c, shape, r) {
    var i, a;
    c.beginPath();
    switch (shape) {
      case 'circle':
        c.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        break;
      case 'square':
        var s = r * 0.8, k = r * 0.18;
        c.moveTo(-s + k, -s);
        c.arcTo(s, -s, s, s, k); c.arcTo(s, s, -s, s, k);
        c.arcTo(-s, s, -s, -s, k); c.arcTo(-s, -s, s, -s, k);
        c.closePath();
        break;
      case 'triangle':
        c.moveTo(0, -r); c.lineTo(r * 0.97, r * 0.72); c.lineTo(-r * 0.97, r * 0.72); c.closePath();
        break;
      case 'star':
        for (i = 0; i < 10; i++) {
          var rr = i % 2 ? r * 0.45 : r;
          a = -Math.PI / 2 + i * Math.PI / 5;
          if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        c.closePath();
        break;
      case 'heart':
        c.moveTo(0, r * 0.85);
        c.bezierCurveTo(-r * 1.3, r * 0.05, -r * 0.8, -r * 1.15, 0, -r * 0.45);
        c.bezierCurveTo(r * 0.8, -r * 1.15, r * 1.3, r * 0.05, 0, r * 0.85);
        c.closePath();
        break;
      default: // flower: five round petals
        for (i = 0; i < 5; i++) {
          a = -Math.PI / 2 + i * Math.PI * 2 / 5;
          var px = Math.cos(a) * r * 0.5, py = Math.sin(a) * r * 0.5;
          c.moveTo(px + r * 0.42, py);
          c.arc(px, py, r * 0.42, 0, Math.PI * 2);
        }
    }
  };

  /* ============================================================
     GLOW — neon light on night paper: soft additive halo dabs at
     even spacing (no beads), a bright core line, a few sparkles
     ============================================================ */
  var GLOW_GAP = 6;
  var sprites = {};
  function glowSprite(hex, rad) {
    var key = hex + '|' + Math.round(rad);
    if (sprites[key]) return sprites[key];
    var n = Math.max(2, Math.ceil(rad * 2));
    var cv = document.createElement('canvas');
    cv.width = cv.height = n;
    var g = cv.getContext('2d');
    var rgb = Mal.hexToRgb(hex).join(',');
    var grd = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    grd.addColorStop(0, 'rgba(' + rgb + ',0.075)');
    grd.addColorStop(0.4, 'rgba(' + rgb + ',0.035)');
    grd.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, n, n);
    sprites[key] = cv;
    return cv;
  }
  function glowDab(S, st, p) {
    var spr = glowSprite(st.hex, SIZE * 1.7 * S.k);
    var c = S.ctx;
    c.globalCompositeOperation = 'lighter';
    c.drawImage(spr, p.x - spr.width / 2, p.y - spr.height / 2);
    c.globalCompositeOperation = 'source-over';
  }
  function sparkle(S, st, p) {
    var c = S.ctx;
    var ang = st.rng() * Math.PI * 2, d = (0.6 + st.rng() * 0.9) * SIZE * S.k;
    var x = p.x + Math.cos(ang) * d, y = p.y + Math.sin(ang) * d;
    var r = (2.5 + st.rng() * 3.5) * S.k;
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.moveTo(x, y - r * 2);
    c.quadraticCurveTo(x, y, x + r * 2, y);
    c.quadraticCurveTo(x, y, x, y + r * 2);
    c.quadraticCurveTo(x, y, x - r * 2, y);
    c.quadraticCurveTo(x, y, x, y - r * 2);
    c.fill();
    c.globalCompositeOperation = 'source-over';
  }
  function glowCore(st) { return Mal.mixHex(st.hex, '#ffffff', 0.55); }
  B.glow = {
    begin: function (S, st, p) {
      st.carry = 0;
      st.spark = 0;
      glowDab(S, st, p);
      dot(S, p, SIZE * 0.45 * S.k / 2, glowCore(st));
    },
    move: function (S, st, a, b) {
      along(st, a, b, GLOW_GAP, function (q) { glowDab(S, st, q); });
      seg(S, a, b, SIZE * 0.45 * S.k, glowCore(st));
      st.spark += cssDist(a, b);
      if (st.spark >= 38) { st.spark = 0; sparkle(S, st, b); }
    }
  };

  /* ============================================================
     MIX — wet paint that really mixes: every cell of a coarse grid
     holds amounts of red / yellow / blue / white pigment, and the
     color comes from the RYB color cube (Gossett & Chen 2004),
     tuned to the app's own palette colors
     ============================================================ */
  var CELL = 4;           // CSS px per pigment cell
  var MIX_R = 17;         // brush radius, CSS px
  var MIX_RATE = 0.1;     // pigment per dab at the brush center
  var MIX_GAP = 2.4;      // CSS px between dabs
  var DENSE = 0.45;       // pigment amount that covers the paper fully
  var PIG = { red: 0, yellow: 1, blue: 2, white: 3 };
  var RYB = [ // index = r + 2y + 4b
    [255, 255, 255], [229, 57, 53], [253, 216, 53], [251, 140, 0],
    [30, 136, 229], [142, 36, 170], [67, 160, 71], [93, 64, 55]
  ];
  var PAPER_RGB = Mal.hexToRgb(Mal.PAPER);
  B.MIX_CELL = CELL;

  function makeGrid(gw, gh) {
    var cnv = document.createElement('canvas');
    cnv.width = gw;
    cnv.height = gh;
    var cctx = cnv.getContext('2d');
    return { gw: gw, gh: gh, m: new Float32Array(gw * gh * 4), cnv: cnv, cctx: cctx, img: cctx.createImageData(gw, gh), dirty: null };
  }
  function resetGrid(G) {
    for (var i = 0; i < G.m.length; i++) G.m[i] = 0;
    G.dirty = { x0: 0, y0: 0, x1: G.gw - 1, y1: G.gh - 1 };
  }
  function markDirty(G, x0, y0, x1, y1) {
    var d = G.dirty;
    if (!d) { G.dirty = { x0: x0, y0: y0, x1: x1, y1: y1 }; return; }
    if (x0 < d.x0) d.x0 = x0;
    if (y0 < d.y0) d.y0 = y0;
    if (x1 > d.x1) d.x1 = x1;
    if (y1 > d.y1) d.y1 = y1;
  }
  function ryb2rgb(r, y, b, out) {
    for (var ch = 0; ch < 3; ch++) {
      var x0 = RYB[0][ch] + (RYB[1][ch] - RYB[0][ch]) * r;
      var x1 = RYB[2][ch] + (RYB[3][ch] - RYB[2][ch]) * r;
      var x2 = RYB[4][ch] + (RYB[5][ch] - RYB[4][ch]) * r;
      var x3 = RYB[6][ch] + (RYB[7][ch] - RYB[6][ch]) * r;
      var y0 = x0 + (x1 - x0) * y;
      var y1 = x2 + (x3 - x2) * y;
      out[ch] = y0 + (y1 - y0) * b;
    }
  }
  function mixDab(S, st, p) {
    var G = S.grid;
    var cw = S.page.w / G.gw, chh = S.page.h / G.gh;
    var gx = p.cx / cw, gy = p.cy / chh;
    var rx = MIX_R / cw, ry = MIX_R / chh;
    var x0 = Math.max(0, Math.floor(gx - rx)), x1 = Math.min(G.gw - 1, Math.ceil(gx + rx));
    var y0 = Math.max(0, Math.floor(gy - ry)), y1 = Math.min(G.gh - 1, Math.ceil(gy + ry));
    var ch = PIG[st.key];
    if (ch === undefined) ch = 0;
    var m = G.m;
    for (var y = y0; y <= y1; y++) {
      var dy = (y + 0.5 - gy) / ry;
      for (var x = x0; x <= x1; x++) {
        var dx = (x + 0.5 - gx) / rx;
        var d2 = dx * dx + dy * dy;
        if (d2 >= 1) continue;
        var i = (y * G.gw + x) * 4;
        m[i + ch] += MIX_RATE * (1 - d2);
        var M = m[i] + m[i + 1] + m[i + 2] + m[i + 3];
        if (M > 1) { var s = 1 / M; m[i] *= s; m[i + 1] *= s; m[i + 2] *= s; m[i + 3] *= s; }
      }
    }
    if (x1 >= x0 && y1 >= y0) markDirty(G, x0, y0, x1, y1);
    var cxI = Mal.clamp(Math.floor(gx), 0, G.gw - 1), cyI = Mal.clamp(Math.floor(gy), 0, G.gh - 1);
    st.cell = (cyI * G.gw + cxI) * 4;
  }
  B.mix = {
    begin: function (S, st, p) { st.carry = 0; mixDab(S, st, p); },
    move:  function (S, st, a, b) { along(st, a, b, MIX_GAP, function (q) { mixDab(S, st, q); }); }
  };
  // name of a freshly mixed color in a cell (for "Orange!" moments), else null
  B.mixName = function (S, i) {
    var m = S.grid.m;
    var r = m[i], y = m[i + 1], b = m[i + 2], w = m[i + 3], M = r + y + b + w;
    if (M < DENSE) return null;
    var mx = Math.max(r, y, b);
    if (mx <= 0) return null;
    r /= mx; y /= mx; b /= mx;
    if (w / M >= 0.3) return (r > 0.6 && y < 0.45 && b < 0.45) ? 'pink' : null;
    if (r > 0.55 && y > 0.55 && b > 0.55) return 'brown';
    if (r > 0.55 && y > 0.55 && b < 0.35) return 'orange';
    if (y > 0.55 && b > 0.55 && r < 0.35) return 'green';
    if (r > 0.55 && b > 0.55 && y < 0.35) return 'purple';
    return null;
  };
  B.renderGrid = function (S) {
    var G = S.grid;
    if (!G) return;
    var d = G.dirty;
    if (d) {
      var m = G.m, data = G.img.data, out = [0, 0, 0];
      for (var y = d.y0; y <= d.y1; y++) {
        for (var x = d.x0; x <= d.x1; x++) {
          var i = (y * G.gw + x) * 4;
          var r = m[i], yy = m[i + 1], b = m[i + 2], w = m[i + 3], M = r + yy + b + w;
          var R = PAPER_RGB[0], Gr = PAPER_RGB[1], Bl = PAPER_RGB[2];
          if (M > 0.0001) {
            var mx = Math.max(r, yy, b);
            if (mx > 0) ryb2rgb(r / mx, yy / mx, b / mx, out);
            else { out[0] = 255; out[1] = 255; out[2] = 255; }
            var wf = w / M, dens = M >= DENSE ? 1 : M / DENSE;
            R += (out[0] + (255 - out[0]) * wf - R) * dens;
            Gr += (out[1] + (255 - out[1]) * wf - Gr) * dens;
            Bl += (out[2] + (255 - out[2]) * wf - Bl) * dens;
          }
          data[i] = R; data[i + 1] = Gr; data[i + 2] = Bl; data[i + 3] = 255;
        }
      }
      G.cctx.putImageData(G.img, 0, 0, d.x0, d.y0, d.x1 - d.x0 + 1, d.y1 - d.y0 + 1);
      G.dirty = null;
    }
    var c = S.ctx;
    c.imageSmoothingEnabled = true;
    try { c.imageSmoothingQuality = 'high'; } catch (err) {}
    c.drawImage(G.cnv, 0, 0, G.gw, G.gh, 0, 0, S.W, S.H);
  };

  /* ============================================================
     REPLAY — run a saved page again, stroke event by stroke event
     ============================================================ */
  function applyEvents(S, item, from, to, states, last, onStroke) {
    var ev = item.ev, strokes = item.strokes;
    for (var i = from; i < to; i++) {
      var sid = ev[i * 3], meta = strokes[sid];
      if (!meta) continue;
      var brush = B[meta.b] || B.paint;
      var p = B.point(S, ev[i * 3 + 1], ev[i * 3 + 2]);
      if (!states[sid]) {
        states[sid] = B.stroke(meta);
        brush.begin(S, states[sid], p);
        if (onStroke) onStroke(meta);
      } else {
        brush.move(S, states[sid], last[sid], p);
      }
      last[sid] = p;
    }
  }
  // animated: opts.duration (ms), opts.onStroke(meta), opts.onDone()
  B.replay = function (S, item, opts) {
    opts = opts || {};
    var n = item.ev ? item.ev.length / 3 : 0;
    var states = {}, last = {}, i = 0, stopped = false, t0 = 0;
    var duration = opts.duration || 5000;
    B.clear(S);
    function step(ts) {
      if (stopped) return;
      if (!t0) t0 = ts;
      // time-based: every picture takes about `duration`, however big it is
      var end = Math.min(n, Math.max(i + 1, Math.ceil(n * (ts - t0) / duration)));
      applyEvents(S, item, i, end, states, last, opts.onStroke);
      i = end;
      if (S.grid) B.renderGrid(S);
      if (i < n) requestAnimationFrame(step);
      else if (opts.onDone) opts.onDone();
    }
    requestAnimationFrame(step);
    return { stop: function () { stopped = true; } };
  };
  // all at once (high-res export, tests)
  B.renderAll = function (S, item) {
    B.clear(S);
    var n = item.ev ? item.ev.length / 3 : 0;
    applyEvents(S, item, 0, n, {}, {}, null);
    if (S.grid) B.renderGrid(S);
  };
})();
