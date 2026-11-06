/* ===== DASHBOARD EDITOR: drag, resize, properties, screens, skin styling, undo ===== */
'use strict';
RD.Editor = {
  sel: null, drag: null, undo: [], grid: 10, snap: true,
  cloneSkin(src) {
    const s = RD.clone(src); s.id = 'u' + RD.uid(); s.user = true; s.name = (src.user ? src.name + ' copy' : 'My ' + src.name);
    s.screens.forEach(sc => sc.widgets.forEach(w => { w.id = RD.uid(); w._v = 0; }));
    RD.normSkin(s); RD.userSkins.push(s); RD.saveUserSkins(); return s;
  },
  start() {
    let s = RD.skin();
    if (!s.user) { s = this.cloneSkin(s); RD.setSkin(s.id); RD.toast('Editing your own copy: "' + s.name + '"', 3500); }
    RD.editing = true; document.body.classList.add('editing', 'hud-on'); this.sel = null; this.undo = [];
    this.bar(); this.panel(); setTimeout(RD.layout, 60);
  },
  stop() {
    RD.editing = false; document.body.classList.remove('editing'); this.sel = null;
    RD.$('#edbar').innerHTML = ''; RD.$('#edpanel').innerHTML = ''; RD.saveUserSkins(); RD.toast('Saved'); RD.showHud(); setTimeout(RD.layout, 60);
  },
  screen() { return RD.skin().screens[RD.settings.screen]; },
  snapshot() { this.undo.push(JSON.stringify(RD.skin())); if (this.undo.length > 40) this.undo.shift(); },
  doUndo() {
    const j = this.undo.pop(); if (!j) return RD.toast('Nothing to undo');
    const s = JSON.parse(j), cur = RD.skin(); Object.keys(cur).forEach(k => delete cur[k]); Object.assign(cur, s);
    cur.screens.forEach(sc => sc.widgets.forEach(w => w._v = (w._v || 0) + 1)); this.sel = null; RD.faceCache.clear(); RD.bgCache.k = ''; this.panel(); RD.updateDots();
  },
  changed(w) { if (w) w._v = (w._v || 0) + 1; clearTimeout(this._st); this._st = setTimeout(() => RD.saveUserSkins(), 600); },
  toV(e) { const r = RD.view.rect || RD.$('#stage').getBoundingClientRect(), v = RD.view; return [(e.clientX - r.left - v.ox) / v.s, (e.clientY - r.top - v.oy) / v.s]; },
  hit(x, y) { const ws = this.screen().widgets; for (let i = ws.length - 1; i >= 0; i--) { const w = ws[i]; if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return w; } return null; },
  down(e) {
    const [x, y] = this.toV(e), s = this.sel, hs = 22 / RD.view.s * 0.8 + 8;
    if (s && Math.abs(x - (s.x + s.w)) < hs && Math.abs(y - (s.y + s.h)) < hs) { this.snapshot(); this.drag = { mode: 'resize', w: s, x0: x, y0: y, ow: s.w, oh: s.h }; return; }
    const w = this.hit(x, y);
    if (w !== this.sel) { this.sel = w; this.panel(); }
    if (w) { this.snapshot(); this.drag = { mode: 'move', w, x0: x, y0: y, ox: w.x, oy: w.y, moved: false }; }
  },
  move(e) {
    const d = this.drag; if (!d) return; const [x, y] = this.toV(e), g = this.snap ? this.grid : 1, sn = (v) => Math.round(v / g) * g;
    if (d.mode === 'move') { d.w.x = sn(d.ox + x - d.x0); d.w.y = sn(d.oy + y - d.y0); d.moved = true; }
    else { d.w.w = Math.max(20, sn(d.ow + x - d.x0)); d.w.h = Math.max(12, sn(d.oh + y - d.y0)); if (e.shiftKey && d.w.type === 'radial') d.w.h = d.w.w; }
    this.changed(d.w); this.posFields();
  },
  up() { if (this.drag) { if (this.drag.mode === 'move' && !this.drag.moved) this.undo.pop(); this.drag = null; this.changed(); } },
  key(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    const w = this.sel, st = e.shiftKey ? 10 : 1;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); return this.doUndo(); }
    if (!w) return;
    const mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    if (mv) { e.preventDefault(); w.x += mv[0]; w.y += mv[1]; this.changed(w); this.posFields(); }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.del(); }
  },
  overlay(ctx) {
    const v = RD.view, d = RD.dpr; ctx.setTransform(v.s * d, 0, 0, v.s * d, v.ox * d, v.oy * d);
    if (this.snap) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = 0; x <= RD.W; x += 40) for (let y = 0; y <= RD.H; y += 40) ctx.fillRect(x - 1, y - 1, 2, 2); }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1 / v.s;
    this.screen().widgets.forEach(w => ctx.strokeRect(w.x, w.y, w.w, w.h)); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.strokeRect(0, 0, RD.W, RD.H);
    const s = this.sel; if (!s) return;
    ctx.strokeStyle = '#3d9bff'; ctx.lineWidth = 2.5 / v.s; ctx.strokeRect(s.x, s.y, s.w, s.h);
    const hs = 22 / v.s * 0.8; ctx.fillStyle = '#3d9bff'; ctx.fillRect(s.x + s.w - hs / 2, s.y + s.h - hs / 2, hs, hs);
    ctx.fillStyle = '#fff'; ctx.font = (12 / v.s) + 'px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(RD.WT[s.type].name + '  ' + Math.round(s.x) + ',' + Math.round(s.y) + '  ' + Math.round(s.w) + '×' + Math.round(s.h), s.x, s.y - 3 / v.s);
  },
  add(type) {
    const t = RD.WT[type]; this.snapshot();
    const w = Object.assign({ type, id: RD.uid(), _v: 0 }, RD.clone(t.def)); w.x = Math.round((RD.W - w.w) / 2 / 10) * 10; w.y = Math.round((RD.H - w.h) / 2 / 10) * 10;
    this.screen().widgets.push(w); this.sel = w; this.changed(w); this.panel();
  },
  del() { const w = this.sel; if (!w) return; this.snapshot(); const ws = this.screen().widgets; ws.splice(ws.indexOf(w), 1); this.sel = null; this.changed(); this.panel(); },
  dup() { const w = this.sel; if (!w) return; this.snapshot(); const c = RD.clone(w); c.id = RD.uid(); c.x += 20; c.y += 20; this.screen().widgets.push(c); this.sel = c; this.changed(c); this.panel(); },
  order(dir) { const w = this.sel; if (!w) return; this.snapshot(); const ws = this.screen().widgets, i = ws.indexOf(w); ws.splice(i, 1); if (dir > 0) ws.push(w); else ws.unshift(w); this.changed(); },
  bar() {
    const types = Object.keys(RD.WT);
    RD.$('#edbar').innerHTML = `
      <select id="ed-add"><option value="">＋ Add widget</option>${types.map(t => `<option value="${t}">${RD.WT[t].name}</option>`).join('')}</select>
      <button class="btn sm" id="ed-dup" title="Duplicate">⧉</button><button class="btn sm" id="ed-del" title="Delete">🗑</button>
      <button class="btn sm" id="ed-front" title="Bring to front">⬆</button><button class="btn sm" id="ed-back" title="Send to back">⬇</button>
      <button class="btn sm" id="ed-undo" title="Undo">↶</button><button class="btn sm ${this.snap ? 'on' : ''}" id="ed-grid" title="Snap to grid">#</button>
      <select id="ed-scr">${RD.skin().screens.map((s, i) => `<option value="${i}" ${i === RD.settings.screen ? 'selected' : ''}>${RD.esc(s.name)}</option>`).join('')}<option value="+">＋ New screen</option><option value="ren">Rename screen…</option><option value="dupS">Duplicate screen</option><option value="delS">Delete screen</option></select>
      <button class="btn sm" id="ed-skin">🎨 Skin style</button><button class="btn sm primary" id="ed-done">✓ Done</button>`;
    const $ = (id) => RD.$('#' + id);
    $('ed-add').onchange = (e) => { if (e.target.value) this.add(e.target.value); e.target.value = ''; };
    $('ed-dup').onclick = () => this.dup(); $('ed-del').onclick = () => this.del(); $('ed-front').onclick = () => this.order(1); $('ed-back').onclick = () => this.order(-1);
    $('ed-undo').onclick = () => this.doUndo(); $('ed-grid').onclick = () => { this.snap = !this.snap; this.bar(); };
    $('ed-done').onclick = () => this.stop(); $('ed-skin').onclick = () => { this.sel = null; this.panel(true); };
    $('ed-scr').onchange = (e) => {
      const v = e.target.value, sk = RD.skin();
      if (v === '+') { this.snapshot(); sk.screens.push({ name: 'Screen ' + (sk.screens.length + 1), widgets: [] }); RD.setScreen(sk.screens.length - 1); }
      else if (v === 'ren') { const n = prompt('Screen name', this.screen().name); if (n) this.screen().name = n; }
      else if (v === 'dupS') { this.snapshot(); const c = RD.clone(this.screen()); c.name += ' copy'; c.widgets.forEach(w => w.id = RD.uid()); sk.screens.splice(RD.settings.screen + 1, 0, c); RD.setScreen(RD.settings.screen + 1); }
      else if (v === 'delS') { if (sk.screens.length < 2) RD.toast('A skin needs at least one screen'); else if (confirm('Delete screen "' + this.screen().name + '"?')) { this.snapshot(); sk.screens.splice(RD.settings.screen, 1); RD.setScreen(0); } }
      else RD.setScreen(+v);
      this.sel = null; this.changed(); this.bar(); this.panel();
    };
  },
  colorField(k, val, label) {
    const refs = ['@primary', '@accent', '@warn', '@text', '@dim', '@track', '@panel', '@line', '@face', '@ring'];
    const isRef = val && val[0] === '@', isNone = !val || val === 'none';
    const hex = !isRef && !isNone && /^#[0-9a-f]{6}$/i.test(val) ? val : RD.toHex(RD.col(isRef ? val : (isNone ? '#000000' : val), RD.skin()));
    return `<label class="cf">${label}<span><select data-c="${k}">${refs.map(r => `<option value="${r}" ${val === r ? 'selected' : ''}>${r.slice(1)}</option>`).join('')}<option value="none" ${isNone ? 'selected' : ''}>none</option><option value="custom" ${!isRef && !isNone ? 'selected' : ''}>custom</option></select>
      <input type="color" data-cc="${k}" value="${hex}" ${isRef || isNone ? 'style="opacity:.35"' : ''}></span></label>`;
  },
  posFields() {
    const w = this.sel; if (!w) return;
    ['x', 'y', 'w', 'h'].forEach(k => { const i = RD.$('#edpanel [data-p="' + k + '"]'); if (i && document.activeElement !== i) i.value = Math.round(w[k]); });
  },
  panel(skinMode) {
    const p = RD.$('#edpanel'), w = this.sel, sk = RD.skin();
    if (!w && !skinMode) { p.innerHTML = `<div class="edhint"><b>Editing: ${RD.esc(sk.name)}</b><p>Tap a widget to select it. Drag to move, drag the blue corner to resize. Arrow keys nudge.</p><p>Use <b>＋ Add widget</b> to add gauges, bars, readouts, graphs, images, clocks and more.</p><p>Swipe screens with the screen selector. Changes save automatically.</p></div>`; return; }
    if (skinMode) {
      const pal = sk.pal;
      p.innerHTML = `<h3>Skin style</h3>
        <label>Name <input type="text" data-s="name" value="${RD.esc(sk.name)}"></label>
        <label>Default font <select data-s="font">${Object.keys(RD.FONTS).map(f => `<option ${sk.font === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
        <label class="chk"><input type="checkbox" data-s="glow" ${sk.glow ? 'checked' : ''}> Glow effects</label>
        <label>Background <select data-b="type">${['solid', 'grad', 'radial', 'grid', 'carbon', 'synth'].map(t => `<option ${sk.bg.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="cf">Background 1 <input type="color" data-b="c1" value="${RD.toHex(sk.bg.c1)}"></label>
        <label class="cf">Background 2 <input type="color" data-b="c2" value="${RD.toHex(sk.bg.c2 || sk.bg.c1)}"></label>
        <h3>Palette</h3><p class="hint">Widgets using palette colours update together.</p>
        ${Object.keys(pal).filter(k => k !== 'ghost').map(k => `<label class="cf">${k}<input type="color" data-pal="${k}" value="${RD.toHex(pal[k])}"></label>`).join('')}
        <h3>Quick themes</h3><div class="swatches">${RD.BUILTIN.map(b => `<button class="sw" data-th="${b.id}" title="${RD.esc(b.name)}" style="background:linear-gradient(135deg,${b.pal.primary} 0 50%,${b.pal.accent} 50%)"></button>`).join('')}</div>`;
      p.querySelectorAll('[data-s]').forEach(i => i.onchange = () => { this.snapshot(); sk[i.dataset.s] = i.type === 'checkbox' ? i.checked : i.value; RD.faceCache.clear(); this.changed(); });
      p.querySelectorAll('[data-b]').forEach(i => i.oninput = () => { sk.bg[i.dataset.b] = i.value; RD.bgCache.k = ''; this.changed(); });
      p.querySelectorAll('[data-pal]').forEach(i => i.oninput = () => { sk.pal[i.dataset.pal] = i.value; RD.faceCache.clear(); RD._shadeC = {}; this.changed(); });
      p.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { this.snapshot(); const t = RD.skinById(b.dataset.th); sk.pal = RD.clone(t.pal); sk.bg = RD.clone(t.bg); sk.font = t.font; sk.glow = t.glow; RD.faceCache.clear(); RD.bgCache.k = ''; this.changed(); this.panel(true); });
      return;
    }
    const t = RD.WT[w.type];
    const field = (pr) => {
      const v = w[pr.k];
      switch (pr.type) {
        case 'ch': return `<label>${pr.label}<select data-k="${pr.k}">${RD.chList().map(c => `<option value="${c}" ${c === v ? 'selected' : ''}>${RD.esc(RD.CH[c].label)}</option>`).join('')}</select></label>`;
        case 'num': return `<label>${pr.label}<input type="number" step="any" data-k="${pr.k}" value="${v == null ? '' : v}"></label>`;
        case 'text': return `<label>${pr.label}<input type="text" data-k="${pr.k}" value="${RD.esc(v)}"></label>`;
        case 'bool': return `<label class="chk"><input type="checkbox" data-k="${pr.k}" ${v ? 'checked' : ''}> ${pr.label}</label>`;
        case 'sel': return `<label>${pr.label}<select data-k="${pr.k}">${pr.opts.map(o => `<option ${String(o) === String(v) ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
        case 'font': return `<label>${pr.label}<select data-k="${pr.k}"><option value="@" ${v === '@' ? 'selected' : ''}>skin default</option>${Object.keys(RD.FONTS).map(f => `<option ${v === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>`;
        case 'color': return this.colorField(pr.k, v, pr.label);
        case 'image': return `<label>${pr.label}<input type="file" accept="image/*" data-img="${pr.k}"></label>${v ? '<button class="btn sm" data-clrimg="' + pr.k + '">Remove image</button>' : ''}`;
      }
      return '';
    };
    p.innerHTML = `<h3>${t.name}</h3><div class="pos">${['x', 'y', 'w', 'h'].map(k => `<label>${k.toUpperCase()}<input type="number" data-p="${k}" value="${Math.round(w[k])}"></label>`).join('')}</div>
      ${t.props.map(field).join('')}<div class="row"><button class="btn sm" id="ep-dup">Duplicate</button><button class="btn sm danger" id="ep-del">Delete</button></div>`;
    const set = (k, val) => { this.snapshot(); w[k] = val; if (k === 'src') { const c = RD.CH[val]; if (c && 'min' in w) { w.min = c.min; w.max = c.max; } if (w.type === 'radial') { w.numDiv = val === 'rpm' ? 1000 : 1; w.label = val === 'rpm' ? 'RPM' : (c.label || '').toUpperCase(); w.sub = val === 'rpm' ? 'x1000' : ''; w.red = val === 'rpm' ? RD.settings.redline : ''; } this.panel(); } this.changed(w); };
    p.querySelectorAll('[data-p]').forEach(i => i.onchange = () => { this.snapshot(); w[i.dataset.p] = +i.value; this.changed(w); });
    p.querySelectorAll('[data-k]').forEach(i => i.onchange = () => {
      const pr = t.props.find(x => x.k === i.dataset.k);
      set(i.dataset.k, i.type === 'checkbox' ? i.checked : pr.type === 'num' ? (i.value === '' ? '' : +i.value) : i.value);
    });
    p.querySelectorAll('[data-c]').forEach(s => s.onchange = () => {
      const k = s.dataset.c, cc = p.querySelector('[data-cc="' + k + '"]');
      if (s.value === 'custom') { cc.style.opacity = 1; set(k, cc.value); } else { cc.style.opacity = .35; set(k, s.value); }
    });
    p.querySelectorAll('[data-cc]').forEach(c => c.oninput = () => { const k = c.dataset.cc; p.querySelector('[data-c="' + k + '"]').value = 'custom'; c.style.opacity = 1; w[k] = c.value; this.changed(w); });
    p.querySelectorAll('[data-img]').forEach(f => f.onchange = () => {
      const file = f.files[0]; if (!file) return; const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = () => { const m = 640, s = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); set(f.dataset.img, c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85)); this.panel(); }; im.src = r.result; };
      r.readAsDataURL(file);
    });
    p.querySelectorAll('[data-clrimg]').forEach(b => b.onclick = () => { set(b.dataset.clrimg, ''); this.panel(); });
    RD.$('#ep-dup').onclick = () => this.dup(); RD.$('#ep-del').onclick = () => this.del();
  }
};
RD.toHex = (c) => {
  if (!c) return '#000000'; if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + c.slice(1).split('').map(x => x + x).join('');
  const m = /rgba?\(([^)]+)\)/.exec(c); if (m) { const [r, g, b] = m[1].split(',').map(Number); return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join(''); }
  return '#000000';
};
