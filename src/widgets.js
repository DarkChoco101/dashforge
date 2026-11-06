/* ===== WIDGET RENDER ENGINE ===== */
'use strict';
RD.FONTS = {
  sans: 'system-ui, Roboto, "Segoe UI", Helvetica, Arial, sans-serif',
  cond: '"Roboto Condensed", "sans-serif-condensed", "Arial Narrow", "Helvetica Neue", sans-serif',
  wide: '"Eurostile", "Microgramma", "Bank Gothic", "Arial Black", Impact, sans-serif',
  mono: '"Roboto Mono", "DejaVu Sans Mono", "Courier New", monospace',
  serif: 'Georgia, "Times New Roman", serif',
  seg7: 'seg7'
};
RD.col = (c, skin) => {
  if (!c) return 'transparent';
  if (c[0] === '@') { const p = (skin && skin.pal) || {}; return p[c.slice(1)] || '#fff'; }
  return c;
};
RD.fontOf = (f, skin) => (!f || f === '@') ? ((skin && skin.font) || 'sans') : f;
RD.hq = true;

/* ---------- 7-segment renderer (no font files needed) ---------- */
const SEG = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
  '-': 'g', ' ': '', 'N': 'abcef', 'n': 'ceg', 'R': 'eg', 'r': 'eg', 'P': 'abefg', 'E': 'adefg', 'F': 'aefg', 'A': 'abcefg', 'b': 'cdefg',
  'C': 'adef', 'c': 'deg', 'd': 'bcdeg', 'H': 'bcefg', 'h': 'cefg', 'L': 'def', 'o': 'cdeg', 'O': 'abcdef', 'S': 'afgcd', 't': 'defg', 'U': 'bcdef', 'u': 'cde', 'y': 'bcdfg', '_': 'd', '°': 'abfg'
};
RD.seg7Width = (str, h) => { let w = 0; for (const ch of String(str)) w += (ch === '.' || ch === ':') ? h * 0.22 : h * 0.62; return w; };
RD.seg7 = (ctx, str, x, y, h, color, align, ghost) => {
  str = String(str); const cw = h * 0.5, t = Math.max(1, h * 0.1), g = t * 0.25;
  const total = RD.seg7Width(str, h);
  let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const top = y - h / 2;
  ctx.save(); ctx.translate(px, top); ctx.transform(1, 0, -0.08, 1, h * 0.04, 0);
  let ox = 0;
  const segRect = (s, ox) => {
    const hh = h / 2;
    switch (s) {
      case 'a': return [ox + t / 2 + g, 0, cw - t - 2 * g, t];
      case 'd': return [ox + t / 2 + g, h - t, cw - t - 2 * g, t];
      case 'g': return [ox + t / 2 + g, hh - t / 2, cw - t - 2 * g, t];
      case 'f': return [ox, t / 2 + g, t, hh - t / 2 - 2 * g];
      case 'b': return [ox + cw - t, t / 2 + g, t, hh - t / 2 - 2 * g];
      case 'e': return [ox, hh + g, t, hh - t / 2 - 2 * g];
      case 'c': return [ox + cw - t, hh + g, t, hh - t / 2 - 2 * g];
    }
  };
  for (const ch of str) {
    if (ch === '.' || ch === ':') {
      ctx.fillStyle = color;
      if (ch === '.') ctx.fillRect(ox, h - t, t, t);
      else { ctx.fillRect(ox, h * 0.28, t, t); ctx.fillRect(ox, h * 0.66, t, t); }
      ox += h * 0.22; continue;
    }
    const on = SEG[ch] != null ? SEG[ch] : SEG[ch.toUpperCase()] || '';
    for (const s of 'abcdefg') {
      const lit = on.indexOf(s) >= 0;
      if (!lit && !ghost) continue;
      ctx.fillStyle = lit ? color : ghost;
      const r = segRect(s, ox); ctx.fillRect(r[0], r[1], r[2], r[3]);
    }
    ox += h * 0.62;
  }
  ctx.restore();
};

/* ---------- text helper ---------- */
RD.text = (ctx, str, x, y, px, o) => {
  o = o || {}; const f = o.font || 'sans';
  if (f === 'seg7') { RD.seg7(ctx, str, x, y, px * 0.78, o.color || '#fff', o.align || 'left', o.ghost); return; }
  ctx.font = (o.italic ? 'italic ' : '') + (o.weight || 600) + ' ' + Math.max(1, px).toFixed(1) + 'px ' + (RD.FONTS[f] || RD.FONTS.sans);
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || '#fff';
  if (o.glow && RD.hq) { ctx.shadowColor = o.glow; ctx.shadowBlur = px * 0.35; }
  ctx.fillText(str, x, y);
  if (o.glow) ctx.shadowBlur = 0;
};
RD.measure = (ctx, str, px, f, weight) => {
  if (f === 'seg7') return RD.seg7Width(str, px * 0.78);
  ctx.font = (weight || 600) + ' ' + px + 'px ' + (RD.FONTS[f] || RD.FONTS.sans); return ctx.measureText(str).width;
};
RD.rr = (ctx, x, y, w, h, r) => {
  r = Math.max(0, Math.min(r || 0, w / 2, h / 2)); ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
};
const D2R = Math.PI / 180;

/* range helper in display units */
RD.range = (w) => {
  const ch = w.src; let lo = RD.toDisp(ch, w.min), hi = RD.toDisp(ch, w.max);
  const c = RD.CH[ch];
  if (c && (c.kind === 'speed' || c.kind === 'temp') && RD.imp()) hi = Math.ceil(hi / 10) * 10;
  return [lo, hi];
};
RD.frac = (w, v) => { const [lo, hi] = RD.range(w); return RD.clamp((RD.toDisp(w.src, v) - lo) / ((hi - lo) || 1), 0, 1); };
RD.segColor = (f, w, skin) => f >= (w.t2 != null ? w.t2 : 0.85) ? RD.col(w.c3 || '@warn', skin) : f >= (w.t1 != null ? w.t1 : 0.6) ? RD.col(w.c2 || '@accent', skin) : RD.col(w.c1 || '@primary', skin);

/* ---------- face cache (static layers drawn once) ---------- */
RD.faceCache = new Map();
RD.cached = (ctx, w, skin, key, drawFn) => {
  if (RD.noCache) { ctx.save(); ctx.translate(w.x, w.y); drawFn(ctx); ctx.restore(); return; }
  const S = RD.scale * (RD.dpr || 1);
  const k = w.id + '|' + key + '|' + S.toFixed(3) + '|' + RD.settings.units + RD.settings.pressure + '|' + skin.id + '|' + w._v + '|' + w.w + 'x' + w.h + (RD.settings.night ? 'n' : '');
  let e = RD.faceCache.get(w.id);
  if (!e || e.k !== k) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w.w * S)); c.height = Math.max(1, Math.ceil(w.h * S));
    const cx = c.getContext('2d'); cx.scale(S, S); drawFn(cx);
    e = { k, c }; RD.faceCache.set(w.id, e);
  }
  ctx.drawImage(e.c, w.x, w.y, w.w, w.h);
};

/* ========== WIDGET TYPES ========== */
const P = (k, label, type, opts, extra) => Object.assign({ k, label, type, opts }, extra || {});
const COMMON_SRC = [P('src', 'Data', 'ch'), P('min', 'Min', 'num'), P('max', 'Max', 'num')];
const COLORS = (...ks) => ks.map(k => P(k[0], k[1], 'color'));
RD.WT = {};

/* ----- Radial gauge ----- */
RD.WT.radial = {
  name: 'Radial Gauge',
  def: { w: 320, h: 320, src: 'rpm', min: 0, max: 8000, red: 6500, mode: 'needle', start: 135, sweep: 270, numDiv: 1000, minor: 4,
    label: 'RPM', sub: 'x1000', showValue: true, valuePos: 'bottom', valueSize: 0.28, font: '@', face: '@face', ring: '@ring', ringW: 0.04,
    tick: '@text', num: '@text', needle: '@warn', arc: '@primary', track: '@track', redC: '@warn', arcW: 0.1, glow: true, smooth: 10 },
  props: [...COMMON_SRC, P('red', 'Redline from', 'num'), P('mode', 'Style', 'sel', ['needle', 'arc', 'both', 'arcOnly']), P('start', 'Start angle', 'num'), P('sweep', 'Sweep', 'num'),
    P('numDiv', 'Number divider', 'num'), P('minor', 'Minor ticks', 'num'), P('label', 'Label', 'text'), P('sub', 'Sub label', 'text'), P('showValue', 'Show value', 'bool'),
    P('valuePos', 'Value position', 'sel', ['center', 'bottom']), P('valueSize', 'Value size', 'num'), P('font', 'Font', 'font'), P('ringW', 'Ring width', 'num'), P('arcW', 'Arc width', 'num'),
    ...COLORS(['face', 'Face'], ['ring', 'Ring'], ['tick', 'Ticks'], ['num', 'Numbers'], ['needle', 'Needle'], ['arc', 'Arc'], ['track', 'Track'], ['redC', 'Red zone']), P('glow', 'Glow', 'bool'), P('smooth', 'Smoothing', 'num')],
  draw(ctx, w, v, skin) {
    const r = Math.min(w.w, w.h) / 2 * 0.97, a0 = w.start * D2R, sw = w.sweep * D2R;
    const [lo, hi] = RD.range(w), f = RD.frac(w, v), font = RD.fontOf(w.font, skin);
    const redF = w.red != null && w.red !== '' ? RD.frac(w, w.red) : 2;
    RD.cached(ctx, w, skin, 'face', (c) => {
      const cx = w.w / 2, cy = w.h / 2;
      const fc = RD.col(w.face, skin);
      if (w.face && fc !== 'none' && fc !== 'transparent') {
        const g = c.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
        g.addColorStop(0, fc); g.addColorStop(1, RD.shade(fc, -0.35));
        c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
      }
      const rc = RD.col(w.ring, skin);
      if (w.ringW > 0 && rc !== 'none' && rc !== 'transparent') {
        const g = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        g.addColorStop(0, RD.shade(rc, 0.4)); g.addColorStop(0.5, RD.shade(rc, -0.3)); g.addColorStop(1, RD.shade(rc, 0.2));
        c.strokeStyle = g; c.lineWidth = r * w.ringW; c.beginPath(); c.arc(cx, cy, r - r * w.ringW / 2, 0, Math.PI * 2); c.stroke();
      }
      const ar = r * 0.84;
      if (w.mode !== 'needle') {
        c.strokeStyle = RD.col(w.track, skin); c.lineWidth = r * w.arcW; c.lineCap = 'butt';
        c.beginPath(); c.arc(cx, cy, ar, a0, a0 + sw); c.stroke();
      }
      if (redF <= 1) {
        c.strokeStyle = RD.col(w.redC, skin); c.lineWidth = r * 0.035;
        c.beginPath(); c.arc(cx, cy, r * 0.905, a0 + sw * redF, a0 + sw); c.stroke();
      }
      if (w.mode !== 'arcOnly') {
        const span = hi - lo, step = RD.niceStep(span, w.numDiv >= 1000 ? span / w.numDiv : 9), minor = Math.max(0, w.minor | 0);
        c.strokeStyle = RD.col(w.tick, skin);
        const first = Math.ceil(lo / step) * step, nLab = Math.floor((hi - first) / step) + 1, nf = Math.min(0.13, 1.45 / Math.max(1, nLab));
        for (let val = first; val <= hi + 1e-9; val += step) {
          const fr = (val - lo) / span, a = a0 + sw * fr, ca = Math.cos(a), sa = Math.sin(a);
          c.lineWidth = r * 0.025; c.beginPath(); c.moveTo(cx + ca * r * 0.93, cy + sa * r * 0.93); c.lineTo(cx + ca * r * 0.79, cy + sa * r * 0.79); c.stroke();
          const nd = w.numDiv || 1, lab = +(val / nd).toFixed(2);
          RD.text(c, String(lab), cx + ca * r * 0.64, cy + sa * r * 0.64, r * nf, { font, color: RD.col(w.num, skin), align: 'center', weight: 700 });
          if (minor) for (let m = 1; m <= minor; m++) {
            const fv = val + step * m / (minor + 1); if (fv > hi) break;
            const am = a0 + sw * (fv - lo) / span, cm = Math.cos(am), sm = Math.sin(am);
            c.lineWidth = r * 0.012; c.beginPath(); c.moveTo(cx + cm * r * 0.93, cy + sm * r * 0.93); c.lineTo(cx + cm * r * 0.86, cy + sm * r * 0.86); c.stroke();
          }
        }
      }
      const ly = w.valuePos === 'center' && w.showValue ? cy + r * 0.38 : cy - r * 0.32;
      if (w.label) RD.text(c, w.label.replace('{unit}', RD.unitFor(w.src)), cx, ly, r * 0.1, { font: font === 'seg7' ? 'sans' : font, color: RD.col(w.num, skin), align: 'center', weight: 700 });
      if (w.sub) RD.text(c, w.sub, cx, ly + r * 0.12, r * 0.07, { color: RD.col('@dim', skin), align: 'center' });
    });
    const cx = w.x + w.w / 2, cy = w.y + w.h / 2, ar = r * 0.84;
    const hot = f >= redF;
    if (w.mode !== 'needle' && f > 0.001) {
      ctx.strokeStyle = hot ? RD.col(w.redC, skin) : RD.col(w.arc, skin); ctx.lineWidth = r * w.arcW; ctx.lineCap = 'butt';
      if (w.glow && RD.hq) { ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = r * 0.12; }
      ctx.beginPath(); ctx.arc(cx, cy, ar, a0, a0 + sw * f); ctx.stroke(); ctx.shadowBlur = 0;
    }
    if (w.mode === 'needle' || w.mode === 'both') {
      const a = a0 + sw * f, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, nw = r * 0.028;
      ctx.fillStyle = RD.col(w.needle, skin);
      if (w.glow && RD.hq) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = r * 0.08; }
      ctx.beginPath(); ctx.moveTo(cx - ca * r * 0.16 + nx * nw, cy - sa * r * 0.16 + ny * nw); ctx.lineTo(cx + ca * r * 0.9, cy + sa * r * 0.9);
      ctx.lineTo(cx - ca * r * 0.16 - nx * nw, cy - sa * r * 0.16 - ny * nw); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = RD.col('@ring', skin); ctx.beginPath(); ctx.arc(cx, cy, r * 0.075, 0, 7); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.04, 0, 7); ctx.fill();
    }
    if (w.showValue) {
      const vy = w.valuePos === 'center' ? cy : cy + r * 0.52, font2 = RD.fontOf(w.font, skin);
      const s = RD.fmt(w.src, v, w.dec);
      RD.text(ctx, s, cx, vy, r * w.valueSize, { font: font2, color: hot ? RD.col(w.redC, skin) : RD.col('@text', skin), align: 'center', weight: 800, ghost: font2 === 'seg7' ? RD.col('@ghost', skin) : null });
      if (w.valuePos === 'center') RD.text(ctx, RD.unitFor(w.src), cx, vy + r * w.valueSize * 0.72, r * 0.09, { color: RD.col('@dim', skin), align: 'center' });
    }
  }
};

/* ----- Bar gauge ----- */
RD.WT.bar = {
  name: 'Bar Gauge',
  def: { w: 400, h: 50, src: 'coolant', min: 40, max: 130, orient: 'h', segs: 20, gap: 0.25, radius: 4, t1: 0.6, t2: 0.85,
    c1: '@primary', c2: '@accent', c3: '@warn', track: '@track', label: 'TEMP', showValue: true, font: '@', smooth: 8 },
  props: [...COMMON_SRC, P('orient', 'Orientation', 'sel', ['h', 'v']), P('segs', 'Segments (0=solid)', 'num'), P('gap', 'Segment gap', 'num'), P('radius', 'Corner radius', 'num'),
    P('t1', 'Color 2 from (0-1)', 'num'), P('t2', 'Color 3 from (0-1)', 'num'), ...COLORS(['c1', 'Color 1'], ['c2', 'Color 2'], ['c3', 'Color 3'], ['track', 'Track']),
    P('label', 'Label', 'text'), P('showValue', 'Show value', 'bool'), P('font', 'Font', 'font'), P('smooth', 'Smoothing', 'num')],
  draw(ctx, w, v, skin) {
    const f = RD.frac(w, v), font = RD.fontOf(w.font, skin), vert = w.orient === 'v';
    let bx = w.x, by = w.y, bw = w.w, bh = w.h;
    const hasText = w.label || w.showValue;
    if (hasText) { if (vert) { bh -= 34; by += 0; } else { by += bh * 0.42; bh *= 0.58; } }
    if (hasText) {
      if (vert) {
        if (w.label) RD.text(ctx, w.label, w.x + w.w / 2, w.y + w.h - 22, 13, { color: RD.col('@dim', skin), align: 'center', weight: 700 });
        if (w.showValue) RD.text(ctx, RD.fmt(w.src, v, w.dec), w.x + w.w / 2, w.y + w.h - 6, 14, { color: RD.col('@text', skin), align: 'center', weight: 800, font: font === 'seg7' ? 'sans' : font });
      } else {
        const th = w.h * 0.36;
        if (w.label) RD.text(ctx, w.label, w.x, w.y + th / 2, th * 0.8, { color: RD.col('@dim', skin), weight: 700 });
        if (w.showValue) RD.text(ctx, RD.fmt(w.src, v, w.dec) + ' ' + RD.unitFor(w.src), w.x + w.w, w.y + th / 2, th * 0.9, { color: RD.col('@text', skin), align: 'right', weight: 800, font: font === 'seg7' ? 'sans' : font });
      }
    }
    const n = w.segs | 0;
    if (n > 0) {
      const len = vert ? bh : bw, cell = len / n, g = cell * w.gap;
      for (let i = 0; i < n; i++) {
        const p = (i + 0.5) / n, lit = p <= f + 0.5 / n * 0.999 && f > 0;
        ctx.fillStyle = lit ? RD.segColor(i / n, w, skin) : RD.col(w.track, skin);
        if (vert) RD.rr(ctx, bx, by + bh - (i + 1) * cell + g / 2, bw, cell - g, w.radius);
        else RD.rr(ctx, bx + i * cell + g / 2, by, cell - g, bh, w.radius);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = RD.col(w.track, skin); RD.rr(ctx, bx, by, bw, bh, w.radius); ctx.fill();
      if (f > 0) {
        const g = vert ? ctx.createLinearGradient(0, by + bh, 0, by) : ctx.createLinearGradient(bx, 0, bx + bw, 0);
        g.addColorStop(0, RD.col(w.c1, skin)); g.addColorStop(RD.clamp(w.t1, 0, 1), RD.col(w.c2, skin)); g.addColorStop(1, RD.col(w.c3, skin));
        ctx.fillStyle = g;
        if (vert) RD.rr(ctx, bx, by + bh * (1 - f), bw, bh * f, w.radius); else RD.rr(ctx, bx, by, bw * f, bh, w.radius);
        ctx.fill();
      }
    }
  }
};

/* ----- Digital readout ----- */
RD.WT.digital = {
  name: 'Digital Readout',
  def: { w: 220, h: 110, src: 'speed', min: 0, max: 240, dec: '', label: '', showUnit: true, align: 'center', font: '@', color: '@text', labelC: '@dim',
    panel: 'none', border: 'none', radius: 10, warnHi: '', warnLo: '', warnC: '@warn', size: 1, smooth: 0 },
  props: [P('src', 'Data', 'ch'), P('dec', 'Decimals (blank=auto)', 'num'), P('label', 'Label (blank=auto)', 'text'), P('showUnit', 'Show unit', 'bool'), P('align', 'Align', 'sel', ['left', 'center', 'right']),
    P('font', 'Font', 'font'), P('size', 'Text scale', 'num'), ...COLORS(['color', 'Value color'], ['labelC', 'Label color'], ['panel', 'Panel fill'], ['border', 'Border'], ['warnC', 'Warning color']),
    P('radius', 'Corner radius', 'num'), P('warnHi', 'Warn above', 'num'), P('warnLo', 'Warn below', 'num'), P('smooth', 'Smoothing', 'num')],
  draw(ctx, w, v, skin) {
    const font = RD.fontOf(w.font, skin);
    if (w.panel && w.panel !== 'none') { ctx.fillStyle = RD.col(w.panel, skin); RD.rr(ctx, w.x, w.y, w.w, w.h, w.radius); ctx.fill(); }
    if (w.border && w.border !== 'none') { ctx.strokeStyle = RD.col(w.border, skin); ctx.lineWidth = 2; RD.rr(ctx, w.x + 1, w.y + 1, w.w - 2, w.h - 2, w.radius); ctx.stroke(); }
    const label = w.label === '' || w.label == null ? (RD.CH[w.src] || {}).label || '' : w.label;
    const hasL = label && label !== '-';
    const pad = w.h * 0.08, lh = hasL ? w.h * 0.2 : 0;
    const ax = w.align === 'left' ? w.x + pad * 1.5 : w.align === 'right' ? w.x + w.w - pad * 1.5 : w.x + w.w / 2;
    if (hasL) RD.text(ctx, label.toUpperCase(), ax, w.y + pad + lh / 2, lh * 0.8, { color: RD.col(w.labelC, skin), align: w.align, weight: 700, font: font === 'seg7' || font === 'wide' ? 'sans' : font });
    const dv = RD.toDisp(w.src, v);
    const warn = (w.warnHi !== '' && w.warnHi != null && dv > +w.warnHi) || (w.warnLo !== '' && w.warnLo != null && dv < +w.warnLo);
    const s = RD.fmt(w.src, v, w.dec === '' ? null : w.dec), unit = w.showUnit ? RD.unitFor(w.src) : '';
    let px = (w.h - lh - pad * 2) * 0.82 * (w.size || 1);
    const uw = unit ? RD.measure(ctx, unit, px * 0.3, 'sans') + px * 0.12 : 0;
    const maxW = w.w - pad * 3 - uw, mw = RD.measure(ctx, s, px, font, 800);
    if (mw > maxW) px *= maxW / mw;
    const vy = w.y + lh + pad + (w.h - lh - pad * 2) / 2 + (hasL ? pad * 0.3 : 0);
    const col = warn && (Date.now() % 600 < 400) ? RD.col(w.warnC, skin) : RD.col(w.color, skin);
    const vw = RD.measure(ctx, s, px, font, 800);
    let vx = ax; if (w.align === 'center') vx = ax - uw / 2; if (w.align === 'right') vx = ax - uw;
    RD.text(ctx, s, vx, vy, px, { font, color: col, align: w.align, weight: 800, glow: skin.glow ? col : null, ghost: font === 'seg7' ? RD.col('@ghost', skin) : null });
    if (unit) {
      const ux = w.align === 'center' ? vx + vw / 2 + px * 0.1 : w.align === 'right' ? vx + px * 0.1 : vx + vw + px * 0.1;
      RD.text(ctx, unit, ux, vy + px * 0.22, px * 0.3, { color: RD.col(w.labelC, skin), weight: 600 });
    }
  }
};

/* ----- Gear indicator ----- */
RD.WT.gear = {
  name: 'Gear Indicator',
  def: { w: 140, h: 160, src: 'gear', font: '@', color: '@text', panel: 'none', border: '@primary', radius: 16, shape: 'box', label: 'GEAR' },
  props: [P('font', 'Font', 'font'), P('shape', 'Shape', 'sel', ['box', 'circle', 'none']), P('label', 'Label', 'text'), ...COLORS(['color', 'Text'], ['panel', 'Fill'], ['border', 'Border']), P('radius', 'Corner radius', 'num')],
  draw(ctx, w, v, skin) {
    const font = RD.fontOf(w.font, skin), cx = w.x + w.w / 2, cy = w.y + w.h / 2;
    if (w.shape !== 'none') {
      ctx.beginPath();
      if (w.shape === 'circle') ctx.arc(cx, cy, Math.min(w.w, w.h) / 2 - 2, 0, 7); else RD.rr(ctx, w.x + 2, w.y + 2, w.w - 4, w.h - 4, w.radius);
      if (w.panel !== 'none') { ctx.fillStyle = RD.col(w.panel, skin); ctx.fill(); }
      if (w.border !== 'none') { ctx.strokeStyle = RD.col(w.border, skin); ctx.lineWidth = 3; ctx.stroke(); }
    }
    const g = RD.gearText(RD.data.gear), lh = w.label ? w.h * 0.14 : 0;
    if (w.label) RD.text(ctx, w.label, cx, w.y + lh * 0.9, lh * 0.7, { color: RD.col('@dim', skin), align: 'center', weight: 700 });
    const col = g === 'R' ? RD.col('@warn', skin) : RD.col(w.color, skin);
    RD.text(ctx, g, cx, cy + lh * 0.35, (w.h - lh) * 0.78, { font, color: col, align: 'center', weight: 900, glow: skin.glow ? col : null, ghost: font === 'seg7' ? RD.col('@ghost', skin) : null });
  }
};

/* ----- Shift lights ----- */
RD.WT.shift = {
  name: 'Shift Lights',
  def: { w: 600, h: 40, src: 'rpm', n: 12, from: 4000, to: 6500, shape: 'circle', c1: '#22e05a', c2: '#ffd400', c3: '#ff2a2a', flash: '#3d7bff', off: '@track' },
  props: [P('src', 'Data', 'ch'), P('n', 'LED count', 'num'), P('from', 'Start at', 'num'), P('to', 'Shift point', 'num'), P('shape', 'Shape', 'sel', ['circle', 'rect', 'bar']),
    ...COLORS(['c1', 'Low'], ['c2', 'Mid'], ['c3', 'High'], ['flash', 'Shift flash'], ['off', 'Off'])],
  draw(ctx, w, v, skin) {
    const n = Math.max(1, w.n | 0), cell = w.w / n, f = RD.clamp((v - w.from) / ((w.to - w.from) || 1), 0, 1.0001);
    const flashing = v >= w.to, blink = Date.now() % 160 < 80;
    for (let i = 0; i < n; i++) {
      const lit = flashing ? blink : (i + 1) / n <= f + 1e-6;
      const p = i / n;
      let c = p < 0.5 ? w.c1 : p < 0.8 ? w.c2 : w.c3; if (flashing) c = w.flash;
      ctx.fillStyle = lit ? RD.col(c, skin) : RD.col(w.off, skin);
      if (lit && RD.hq) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12; }
      const cx = w.x + cell * (i + 0.5), cy = w.y + w.h / 2, s = Math.min(cell, w.h) * 0.8;
      ctx.beginPath();
      if (w.shape === 'circle') ctx.arc(cx, cy, s / 2, 0, 7);
      else if (w.shape === 'bar') RD.rr(ctx, w.x + cell * i + cell * 0.08, w.y, cell * 0.84, w.h, 3);
      else RD.rr(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.15);
      ctx.fill(); ctx.shadowBlur = 0;
    }
  }
};

/* ----- Warning lamp ----- */
RD.WT.lamp = {
  name: 'Warning Lamp',
  def: { w: 110, h: 60, src: 'coolant', op: '>', val: 105, icon: '⚠', label: 'TEMP', on: '@warn', offC: '@track', blink: true, radius: 10 },
  props: [P('src', 'Data', 'ch'), P('op', 'Condition', 'sel', ['>', '<']), P('val', 'Threshold', 'num'), P('icon', 'Icon/text', 'text'), P('label', 'Label', 'text'), ...COLORS(['on', 'On color'], ['offC', 'Off color']), P('blink', 'Blink', 'bool'), P('radius', 'Corner radius', 'num')],
  draw(ctx, w, v, skin) {
    const on = w.op === '<' ? v < w.val : v > w.val, show = on && (!w.blink || Date.now() % 700 < 450);
    const c = show ? RD.col(w.on, skin) : RD.col(w.offC, skin);
    ctx.strokeStyle = c; ctx.lineWidth = 2.5; RD.rr(ctx, w.x + 2, w.y + 2, w.w - 4, w.h - 4, w.radius); ctx.stroke();
    if (show) { ctx.fillStyle = RD.shade(c, -0.6); ctx.fill(); }
    const both = w.icon && w.label;
    if (w.icon) RD.text(ctx, w.icon, w.x + (both ? w.w * 0.28 : w.w / 2), w.y + w.h / 2, w.h * 0.5, { color: c, align: 'center', weight: 800 });
    if (w.label) RD.text(ctx, w.label, w.x + (both ? w.w * 0.64 : w.w / 2), w.y + w.h / 2, w.h * 0.28, { color: c, align: 'center', weight: 800 });
  }
};

/* ----- History graph ----- */
RD.hist = {};
RD.WT.graph = {
  name: 'History Graph',
  def: { w: 400, h: 160, src: 'speed', min: 0, max: 200, secs: 60, line: '@primary', fill: true, grid: '@track', panel: 'none', label: '', radius: 10 },
  props: [...COMMON_SRC, P('secs', 'Seconds shown', 'num'), P('label', 'Label (blank=auto)', 'text'), ...COLORS(['line', 'Line'], ['grid', 'Grid'], ['panel', 'Panel']), P('fill', 'Fill under line', 'bool'), P('radius', 'Corner radius', 'num')],
  sample(w, v, now) {
    const N = 120; let h = RD.hist[w.id];
    if (!h || h.src !== w.src) h = RD.hist[w.id] = { a: new Float32Array(N).fill(NaN), i: 0, t: 0, src: w.src };
    const iv = (w.secs || 60) * 1000 / N;
    if (now - h.t >= iv) { h.a[h.i] = v; h.i = (h.i + 1) % N; h.t = now; }
    return h;
  },
  draw(ctx, w, v, skin) {
    const h = this.sample(w, v, Date.now()), N = h.a.length;
    if (w.panel !== 'none') { ctx.fillStyle = RD.col(w.panel, skin); RD.rr(ctx, w.x, w.y, w.w, w.h, w.radius); ctx.fill(); }
    const px = w.x + 8, py = w.y + 26, pw = w.w - 16, ph = w.h - 34;
    ctx.strokeStyle = RD.col(w.grid, skin); ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = py + ph * i / 4; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke(); }
    const label = w.label || (RD.CH[w.src] || {}).label || '';
    RD.text(ctx, label.toUpperCase(), px, w.y + 13, 13, { color: RD.col('@dim', skin), weight: 700 });
    RD.text(ctx, RD.fmt(w.src, v) + ' ' + RD.unitFor(w.src), px + pw, w.y + 13, 15, { color: RD.col('@text', skin), weight: 800, align: 'right' });
    ctx.beginPath(); let started = false, lastX = px;
    for (let k = 0; k < N; k++) {
      const val = h.a[(h.i + k) % N]; if (isNaN(val)) continue;
      const x = px + pw * k / (N - 1), y = py + ph * (1 - RD.frac(w, val));
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y); lastX = x;
    }
    if (!started) return;
    ctx.strokeStyle = RD.col(w.line, skin); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    if (w.fill) {
      ctx.lineTo(lastX, py + ph); let fx = px; for (let k = 0; k < N; k++) if (!isNaN(h.a[(h.i + k) % N])) { fx = px + pw * k / (N - 1); break; }
      ctx.lineTo(fx, py + ph); ctx.closePath(); ctx.globalAlpha = 0.18; ctx.fillStyle = RD.col(w.line, skin); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
};

/* ----- G-force meter ----- */
RD.gTrail = [];
RD.WT.gmeter = {
  name: 'G-Force Meter',
  def: { w: 240, h: 240, maxG: 1.2, ring: '@track', dot: '@warn', text: '@text', panel: 'none' },
  props: [P('maxG', 'Max G', 'num'), ...COLORS(['ring', 'Rings'], ['dot', 'Dot'], ['text', 'Text'], ['panel', 'Panel'])],
  draw(ctx, w, v, skin) {
    const cx = w.x + w.w / 2, cy = w.y + w.h / 2, r = Math.min(w.w, w.h) / 2 - 6, mg = w.maxG || 1.2;
    if (w.panel !== 'none') { ctx.fillStyle = RD.col(w.panel, skin); ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, 7); ctx.fill(); }
    ctx.strokeStyle = RD.col(w.ring, skin); ctx.lineWidth = 1.5;
    [0.33, 0.66, 1].forEach(k => { ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, 7); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
    const gx = RD.data.accelX, gy = RD.data.accelY;
    const x = cx + RD.clamp(gx / mg, -1, 1) * r, y = cy - RD.clamp(gy / mg, -1, 1) * r;
    const tr = RD.gTrail; ctx.fillStyle = RD.col(w.dot, skin);
    for (let i = 0; i < tr.length; i++) { ctx.globalAlpha = i / tr.length * 0.4; ctx.beginPath(); ctx.arc(cx + RD.clamp(tr[i][0] / mg, -1, 1) * r, cy - RD.clamp(tr[i][1] / mg, -1, 1) * r, 3, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; if (RD.hq) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 14; }
    ctx.beginPath(); ctx.arc(x, y, Math.max(6, r * 0.07), 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    const tot = Math.sqrt(gx * gx + gy * gy);
    RD.text(ctx, tot.toFixed(2) + 'g', w.x + w.w - 4, w.y + 12, 14, { color: RD.col(w.text, skin), align: 'right', weight: 800 });
    RD.text(ctx, 'G', w.x + 4, w.y + 12, 13, { color: RD.col('@dim', skin), weight: 800 });
  }
};

/* ----- Compass tape ----- */
RD.WT.compass = {
  name: 'Compass Tape',
  def: { w: 360, h: 56, color: '@text', accent: '@primary', panel: 'none', radius: 10 },
  props: [...COLORS(['color', 'Text'], ['accent', 'Marker'], ['panel', 'Panel']), P('radius', 'Corner radius', 'num')],
  draw(ctx, w, v, skin) {
    const hd = RD.data.heading || 0, span = 120, pxDeg = w.w / span;
    ctx.save(); RD.rr(ctx, w.x, w.y, w.w, w.h, w.radius);
    if (w.panel !== 'none') { ctx.fillStyle = RD.col(w.panel, skin); ctx.fill(); }
    ctx.clip();
    const names = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
    ctx.strokeStyle = RD.col('@dim', skin); ctx.lineWidth = 2;
    for (let d = Math.floor((hd - span / 2) / 5) * 5; d <= hd + span / 2; d += 5) {
      const x = w.x + w.w / 2 + (d - hd) * pxDeg, dn = ((d % 360) + 360) % 360;
      const big = dn % 45 === 0; ctx.beginPath(); ctx.moveTo(x, w.y + w.h); ctx.lineTo(x, w.y + w.h - (big ? 16 : dn % 15 === 0 ? 10 : 5)); ctx.stroke();
      if (big) RD.text(ctx, names[dn], x, w.y + w.h * 0.36, w.h * 0.34, { color: dn === 0 ? RD.col('@warn', skin) : RD.col(w.color, skin), align: 'center', weight: 800 });
    }
    ctx.restore();
    ctx.fillStyle = RD.col(w.accent, skin); ctx.beginPath(); ctx.moveTo(w.x + w.w / 2 - 8, w.y); ctx.lineTo(w.x + w.w / 2 + 8, w.y); ctx.lineTo(w.x + w.w / 2, w.y + 10); ctx.fill();
  }
};

/* ----- Text / clock ----- */
RD.WT.text = {
  name: 'Text / Clock',
  def: { w: 200, h: 40, text: '{clock}', size: 28, font: '@', color: '@text', align: 'center', weight: 700 },
  props: [P('text', 'Text — tokens: {clock} {date} {source} {speed} {rpm} ... ', 'text'), P('size', 'Size', 'num'), P('font', 'Font', 'font'), P('align', 'Align', 'sel', ['left', 'center', 'right']),
    P('weight', 'Weight', 'sel', ['400', '600', '700', '900']), ...COLORS(['color', 'Color'])],
  draw(ctx, w, v, skin) {
    const font = RD.fontOf(w.font, skin);
    const s = RD.tokens(w.text || '');
    const x = w.align === 'left' ? w.x : w.align === 'right' ? w.x + w.w : w.x + w.w / 2;
    RD.text(ctx, s, x, w.y + w.h / 2, w.size, { font, color: RD.col(w.color, skin), align: w.align, weight: w.weight, ghost: null });
  }
};
RD.tokens = (s) => s.replace(/\{(\w+)(:u)?\}/g, (m, k, u) => {
  if (k === 'clock') { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  if (k === 'date') return new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  if (k === 'source') return (RD.Sources[RD.settings.source] || {}).name || '';
  if (RD.CH[k]) return u ? RD.unitFor(k) : RD.fmt(k, RD.data[k]);
  return m;
});

/* ----- Panel / shape ----- */
RD.WT.panel = {
  name: 'Panel / Shape',
  def: { w: 300, h: 200, shape: 'rect', fill: '@panel', fill2: '', stroke: '@line', strokeW: 2, radius: 16, alpha: 1 },
  props: [P('shape', 'Shape', 'sel', ['rect', 'circle', 'line']), ...COLORS(['fill', 'Fill'], ['fill2', 'Gradient to'], ['stroke', 'Stroke']), P('strokeW', 'Stroke width', 'num'), P('radius', 'Corner radius', 'num'), P('alpha', 'Opacity 0-1', 'num')],
  draw(ctx, w, v, skin) {
    ctx.globalAlpha = w.alpha == null ? 1 : w.alpha;
    ctx.beginPath();
    if (w.shape === 'line') { ctx.strokeStyle = RD.col(w.stroke, skin); ctx.lineWidth = w.strokeW || 2; ctx.moveTo(w.x, w.y + w.h / 2); ctx.lineTo(w.x + w.w, w.y + w.h / 2); ctx.stroke(); ctx.globalAlpha = 1; return; }
    if (w.shape === 'circle') ctx.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w / 2, w.h / 2, 0, 0, 7); else RD.rr(ctx, w.x, w.y, w.w, w.h, w.radius);
    if (w.fill && w.fill !== 'none') {
      if (w.fill2) { const g = ctx.createLinearGradient(0, w.y, 0, w.y + w.h); g.addColorStop(0, RD.col(w.fill, skin)); g.addColorStop(1, RD.col(w.fill2, skin)); ctx.fillStyle = g; }
      else ctx.fillStyle = RD.col(w.fill, skin);
      ctx.fill();
    }
    if (w.stroke && w.stroke !== 'none' && w.strokeW > 0) { ctx.strokeStyle = RD.col(w.stroke, skin); ctx.lineWidth = w.strokeW; ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
};

/* ----- Image ----- */
RD.imgCache = {};
RD.WT.image = {
  name: 'Image / Logo',
  def: { w: 200, h: 120, img: '', alpha: 1 },
  props: [P('img', 'Image', 'image'), P('alpha', 'Opacity 0-1', 'num')],
  draw(ctx, w, v, skin) {
    if (!w.img) { ctx.strokeStyle = RD.col('@dim', skin); ctx.setLineDash([6, 6]); ctx.strokeRect(w.x, w.y, w.w, w.h); ctx.setLineDash([]); RD.text(ctx, 'IMAGE', w.x + w.w / 2, w.y + w.h / 2, 16, { color: RD.col('@dim', skin), align: 'center' }); return; }
    let im = RD.imgCache[w.img]; if (!im) { im = new Image(); im.src = w.img; RD.imgCache[w.img] = im; }
    if (!im.complete || !im.naturalWidth) return;
    const s = Math.min(w.w / im.naturalWidth, w.h / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s;
    ctx.globalAlpha = w.alpha == null ? 1 : w.alpha; ctx.drawImage(im, w.x + (w.w - iw) / 2, w.y + (w.h - ih) / 2, iw, ih); ctx.globalAlpha = 1;
  }
};

/* colour shade helper: amt -1..1 */
RD._shadeC = {};
RD.shade = (c, amt) => {
  const key = c + amt; if (RD._shadeC[key]) return RD._shadeC[key];
  let r, g, b, m;
  if ((m = /^#([0-9a-f]{3,8})$/i.exec(c))) {
    let h = m[1]; if (h.length <= 4) h = h.split('').map(x => x + x).join('');
    r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
  } else if ((m = /rgba?\(([^)]+)\)/.exec(c))) { [r, g, b] = m[1].split(',').map(Number); } else return c;
  const f = (x) => Math.round(amt < 0 ? x * (1 + amt) : x + (255 - x) * amt);
  return (RD._shadeC[key] = 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')');
};
