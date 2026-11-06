/* ===== EFFECTS: cheap neon glow, LED ring-light widget, animated backgrounds ===== */
'use strict';
/* Neon glow without shadowBlur: stroke the same path 3x (wide+faint → narrow+bright).
   ~3 GPU strokes instead of a CPU gaussian blur — runs fine on old tablets. */
RD.glowStroke = (ctx, path, color, width, level) => {
  level = level == null ? 1 : level;
  ctx.strokeStyle = color;
  if (level > 0) {
    ctx.globalAlpha = 0.10 * level; ctx.lineWidth = width * 3.4; path(); ctx.stroke();
    ctx.globalAlpha = 0.22 * level; ctx.lineWidth = width * 2; path(); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.lineWidth = width; path(); ctx.stroke();
};
RD.anyGlow = (skin) => skin && skin.glow;

/* ----- LED ring light gauge ----- */
RD.WT.ring = {
  name: 'Ring Light Gauge',
  def: { w: 420, h: 420, src: 'speed', min: 0, max: 160, start: 120, sweep: 300, segs: 48, thick: 0.075, gap: 0.3, t1: 0.6, t2: 0.85,
    c1: '@primary', c2: '@accent', c3: '@warn', track: '@track', glow: true, comet: false, inner: true, showValue: true, valueSize: 0.42, label: '', font: '@', smooth: 6 },
  props: [P('src', 'Data', 'ch'), P('min', 'Min', 'num'), P('max', 'Max', 'num'), P('start', 'Start angle', 'num'), P('sweep', 'Sweep (360 = full ring)', 'num'),
    P('segs', 'LED count (0 = smooth)', 'num'), P('thick', 'Thickness', 'num'), P('gap', 'LED gap', 'num'), P('t1', 'Colour 2 from', 'num'), P('t2', 'Colour 3 from', 'num'),
    ...COLORS(['c1', 'Colour 1'], ['c2', 'Colour 2'], ['c3', 'Colour 3'], ['track', 'Track']), P('glow', 'Neon glow', 'bool'), P('comet', 'Orbiting light', 'bool'),
    P('inner', 'Inner halo ring', 'bool'), P('showValue', 'Show value', 'bool'), P('valueSize', 'Value size', 'num'), P('label', 'Label', 'text'), P('font', 'Font', 'font'), P('smooth', 'Smoothing', 'num')],
  draw(ctx, w, v, skin) {
    const r = Math.min(w.w, w.h) / 2 * 0.86, th = r * w.thick, a0 = w.start * D2R, sw = w.sweep * D2R, f = RD.frac(w, v);
    const n = Math.max(0, w.segs | 0);
    RD.cached(ctx, w, skin, 'ring', (c) => {
      const cx = w.w / 2, cy = w.h / 2;
      c.lineCap = 'butt';
      c.strokeStyle = RD.col(w.track, skin); c.lineWidth = th;
      if (n) { const step = sw / n, g = step * w.gap; for (let i = 0; i < n; i++) { c.beginPath(); c.arc(cx, cy, r, a0 + i * step + g / 2, a0 + (i + 1) * step - g / 2); c.stroke(); } }
      else { c.beginPath(); c.arc(cx, cy, r, a0, a0 + sw); c.stroke(); }
      if (w.inner) {
        const ic = RD.col(w.c1, skin);
        c.globalAlpha = 0.18; c.strokeStyle = ic; c.lineWidth = r * 0.012; c.beginPath(); c.arc(cx, cy, r * 0.8, 0, 7); c.stroke();
        c.globalAlpha = 0.07; c.lineWidth = r * 0.05; c.beginPath(); c.arc(cx, cy, r * 0.8, 0, 7); c.stroke();
        c.globalAlpha = 0.12; c.lineWidth = r * 0.006; c.beginPath(); c.arc(cx, cy, r * 1.12, 0, 7); c.stroke();
        c.globalAlpha = 1;
      }
      if (w.label) RD.text(c, w.label, cx, cy - r * 0.42, r * 0.1, { color: RD.col('@dim', skin), align: 'center', weight: 800 });
    });
    const cx = w.x + w.w / 2, cy = w.y + w.h / 2, lvl = w.glow ? 1 : 0;
    ctx.lineCap = 'butt';
    if (f > 0.001) {
      const groups = [[], [], []];
      if (n) {
        const step = sw / n, g = step * w.gap, lit = Math.round(f * n);
        for (let i = 0; i < lit; i++) { const p = i / n; groups[p >= w.t2 ? 2 : p >= w.t1 ? 1 : 0].push([a0 + i * step + g / 2, a0 + (i + 1) * step - g / 2]); }
      } else {
        const e = a0 + sw * f, b1 = a0 + sw * Math.min(f, w.t1), b2 = a0 + sw * Math.min(f, w.t2);
        groups[0].push([a0, b1]); if (f > w.t1) groups[1].push([b1, b2]); if (f > w.t2) groups[2].push([b2, e]);
      }
      [w.c1, w.c2, w.c3].forEach((col, gi) => {
        const arcs = groups[gi]; if (!arcs.length) return;
        RD.glowStroke(ctx, () => { ctx.beginPath(); arcs.forEach(a => { ctx.moveTo(cx + Math.cos(a[0]) * r, cy + Math.sin(a[0]) * r); ctx.arc(cx, cy, r, a[0], a[1]); }); }, RD.col(col, skin), th, lvl);
      });
    }
    if (w.comet) {
      const t = performance.now() / 1000, spd = 0.35 + f * 2.2, base = (t * spd) % (Math.PI * 2), col = RD.col(f >= w.t2 ? w.c3 : w.c1, skin);
      ctx.fillStyle = col;
      for (let k = 0; k < 7; k++) {
        const a = base - k * 0.06, rr = r * 1.12;
        ctx.globalAlpha = (1 - k / 7) * 0.85; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r * (0.022 - k * 0.0022), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc(cx + Math.cos(base) * r * 1.12, cy + Math.sin(base) * r * 1.12, r * 0.07, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (w.showValue) {
      const font = RD.fontOf(w.font, skin), col = RD.col('@text', skin);
      RD.text(ctx, RD.fmt(w.src, v, w.dec), cx, cy + r * 0.02, r * w.valueSize, { font, color: col, align: 'center', weight: 800, glow: w.glow ? RD.col(w.c1, skin) : null, ghost: font === 'seg7' ? RD.col('@ghost', skin) : null });
      RD.text(ctx, RD.unitFor(w.src), cx, cy + r * w.valueSize * 0.78, r * 0.1, { color: RD.col('@dim', skin), align: 'center', weight: 700 });
    }
  }
};

/* ----- Animated background overlays (drawn over the cached base each frame) ----- */
RD.fx = { stars: null, rain: null, cols: null };
RD.bgFx = (ctx, skin, W, H, still) => {
  const b = skin.bg || {}, fx = b.fx; if (!fx) return;
  if (!still && (!RD.settings.bgAnim || RD.noCache)) return;
  if (still && fx === 'scan') return;
  const t = still ? 7.3 : performance.now() / 1000, c1 = RD.col('@primary', skin), c2 = RD.col('@accent', skin);
  ctx.save();
  if (fx === 'grid') {
    const hz = H * 0.66, spd = 0.25 + Math.min(1, (RD.data.speed || 0) / 120) * 1.2;
    ctx.strokeStyle = c2; ctx.lineWidth = Math.max(1, H / 500);
    const off = (t * spd) % 1;
    for (let i = 0; i < 12; i++) { const p = (i + off) / 12, y = hz + (H - hz) * p * p; ctx.globalAlpha = 0.08 + p * 0.35; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 0.25;
    for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.015, hz); ctx.lineTo(W / 2 + i * W * 0.11, H); ctx.stroke(); }
    ctx.globalAlpha = 0.5; ctx.strokeStyle = c1; ctx.lineWidth = Math.max(1.5, H / 300); ctx.beginPath(); ctx.moveTo(0, hz); ctx.lineTo(W, hz); ctx.stroke();
  } else if (fx === 'stars') {
    if (!RD.fx.stars) { RD.fx.stars = Array.from({ length: 110 }, () => [Math.random(), Math.random(), Math.random() * 6.28, 0.4 + Math.random() * 1.4]); }
    ctx.fillStyle = '#fff';
    for (const s of RD.fx.stars) { ctx.globalAlpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * s[3] + s[2])); const z = s[3] * H / 600; ctx.fillRect(s[0] * W, s[1] * H, z, z); }
  } else if (fx === 'aurora') {
    [[c1, 0.3, 0.12], [c2, 0.7, 0.09]].forEach(([c, x0, sp], i) => {
      const x = W * (x0 + Math.sin(t * sp + i * 2) * 0.18), y = H * (0.3 + Math.cos(t * sp * 0.8 + i) * 0.12), rad = Math.max(W, H) * 0.42;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.16; ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
  } else if (fx === 'rain') {
    if (!RD.fx.rain || RD.fx.rainC !== c1) {
      const cv = document.createElement('canvas'), ch = 24, rows = 22; cv.width = 28; cv.height = ch * rows; const x = cv.getContext('2d');
      x.font = 'bold 20px monospace'; x.textAlign = 'center';
      for (let i = 0; i < rows; i++) { x.globalAlpha = Math.pow(i / rows, 2); x.fillStyle = i === rows - 1 ? '#e8ffe8' : c1; x.fillText(String.fromCharCode(0x30A0 + Math.random() * 96 | 0), 14, i * ch + 20); }
      RD.fx.rain = cv; RD.fx.rainC = c1; RD.fx.cols = null;
    }
    const cw = Math.max(18, W / 48), sc = cw / 28, n = Math.ceil(W / cw);
    if (!RD.fx.cols || RD.fx.cols.length !== n) RD.fx.cols = Array.from({ length: n }, () => [Math.random() * H * 2, 60 + Math.random() * 140]);
    ctx.globalAlpha = 0.35;
    RD.fx.cols.forEach((c, i) => { c[0] += c[1] / 60; if (c[0] > H + RD.fx.rain.height * sc) c[0] = -Math.random() * H * 0.5; ctx.drawImage(RD.fx.rain, i * cw, c[0] - RD.fx.rain.height * sc, cw, RD.fx.rain.height * sc); });
  } else if (fx === 'pulse') {
    const s = Math.min(1, (RD.data.speed || 0) / 120), p = 0.5 + 0.5 * Math.sin(t * (1.2 + s * 3)), rad = Math.min(W, H) * (0.42 + p * 0.05);
    const g = ctx.createRadialGradient(W / 2, H * 0.45, rad * 0.2, W / 2, H * 0.45, rad); g.addColorStop(0, c1); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.08 + p * 0.07 + s * 0.06; ctx.fillStyle = g; ctx.fillRect(W / 2 - rad, H * 0.45 - rad, rad * 2, rad * 2);
  } else if (fx === 'scan') {
    const y = ((t * 0.18) % 1) * H; const g = ctx.createLinearGradient(0, y - H * 0.08, 0, y);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, c1); ctx.globalAlpha = 0.12; ctx.fillStyle = g; ctx.fillRect(0, y - H * 0.08, W, H * 0.08);
  }
  ctx.restore();
};
