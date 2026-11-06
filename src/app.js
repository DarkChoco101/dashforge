/* ===== APP: render loop, background, input, HUD ===== */
'use strict';
RD.$ = (s, r) => (r || document).querySelector(s);
RD.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
RD.anim = {};
RD.editing = false;

/* ---------- backgrounds ---------- */
RD.bgCache = { k: '', c: null };
RD.drawBg = (ctx, skin, W, H) => {
  const k = skin.id + JSON.stringify(skin.bg) + W + 'x' + H;
  if (RD.noCache || RD.bgCache.k !== k) {
    const c = RD.noCache ? null : document.createElement('canvas');
    let x = ctx;
    if (c) { c.width = W; c.height = H; x = c.getContext('2d'); }
    const b = skin.bg || { type: 'solid', c1: '#000' }, c1 = b.c1 || '#000', c2 = b.c2 || c1;
    if (b.type === 'radial' || b.type === 'synth') { const g = x.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H / 2, Math.max(W, H) * 0.75); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; }
    else if (b.type === 'solid') x.fillStyle = c1;
    else { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; }
    x.fillRect(0, 0, W, H);
    if (b.type === 'grid') {
      x.strokeStyle = 'rgba(255,255,255,0.035)'; x.lineWidth = 1; const step = Math.max(16, W / 48);
      for (let i = 0; i < W; i += step) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
      for (let j = 0; j < H; j += step) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
    }
    if (b.type === 'carbon') {
      const s = Math.max(6, Math.round(W / 160));
      for (let i = 0; i < W; i += s * 2) for (let j = 0; j < H; j += s * 2) {
        const g1 = x.createLinearGradient(i, j, i + s, j + s); g1.addColorStop(0, 'rgba(255,255,255,0.06)'); g1.addColorStop(1, 'rgba(0,0,0,0.25)');
        x.fillStyle = g1; x.fillRect(i, j, s, s); x.fillRect(i + s, j + s, s, s);
        const g2 = x.createLinearGradient(i + s, j, i + 2 * s, j + s); g2.addColorStop(0, 'rgba(0,0,0,0.3)'); g2.addColorStop(1, 'rgba(255,255,255,0.04)');
        x.fillStyle = g2; x.fillRect(i + s, j, s, s); x.fillRect(i, j + s, s, s);
      }
      const v = x.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.7)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
    }
    if (b.type === 'synth') {
      const hz = H * 0.62, sun = x.createLinearGradient(0, H * 0.2, 0, hz); sun.addColorStop(0, '#ffd319'); sun.addColorStop(0.5, '#ff2975'); sun.addColorStop(1, '#8c1eff');
      x.save(); x.globalAlpha = 0.28; x.fillStyle = sun; x.beginPath(); x.arc(W / 2, hz, H * 0.32, Math.PI, 0); x.fill();
      x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 7; i++) { const yy = hz - H * 0.03 - i * H * 0.04; x.fillRect(0, yy, W, H * 0.008 + i * 0.6); } x.restore();
      x.fillStyle = 'rgba(10,0,25,0.85)'; x.fillRect(0, hz, W, H - hz);
      x.strokeStyle = 'rgba(255,47,185,0.35)'; x.lineWidth = 1.5;
      for (let i = 0; i < 14; i++) { const y = hz + (H - hz) * Math.pow(i / 13, 2); x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
      for (let i = -20; i <= 20; i++) { x.beginPath(); x.moveTo(W / 2 + i * W * 0.012, hz); x.lineTo(W / 2 + i * W * 0.09, H); x.stroke(); }
    }
    if (c) RD.bgCache = { k, c };
  }
  if (!RD.noCache) ctx.drawImage(RD.bgCache.c, 0, 0, W, H);
};

/* ---------- render one screen of a skin ---------- */
RD.renderScreen = (ctx, skin, screen, devW, devH, s, ox, oy, dt) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  RD.drawBg(ctx, skin, devW, devH);
  ctx.setTransform(s, 0, 0, s, ox, oy);
  const scr = skin.screens[screen] || skin.screens[0];
  for (const w of scr.widgets) {
    const t = RD.WT[w.type]; if (!t) continue;
    let v = RD.data[w.src];
    if (v == null || isNaN(v)) v = 0;
    if (dt != null && w.smooth > 0) {
      const a = RD.anim[w.id]; const nv = a == null ? v : a + (v - a) * Math.min(1, dt * w.smooth);
      RD.anim[w.id] = nv; v = nv;
    }
    try { t.draw(ctx, w, v, skin); } catch (e) { if (!RD._errShown) { RD._errShown = 1; console.error(e); } }
  }
};

/* ---------- main stage ---------- */
RD.view = { s: 1, ox: 0, oy: 0 };
RD.layout = () => {
  const st = RD.$('#stage'), cv = RD.$('#cv');
  const r = st.getBoundingClientRect();
  const q = RD.settings.quality;
  RD.dpr = Math.min(window.devicePixelRatio || 1, q === 'low' ? 1 : q === 'high' ? 2.5 : (RD.lowPerf ? 1 : 1.75));
  cv.width = Math.round(r.width * RD.dpr); cv.height = Math.round(r.height * RD.dpr);
  cv.getContext('2d')._rdf = null; cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  const s = Math.min(r.width / RD.W, r.height / RD.H);
  RD.scale = s; RD.view = { s, ox: (r.width - RD.W * s) / 2, oy: (r.height - RD.H * s) / 2, rect: r };
  RD.faceCache.clear(); RD.bgCache.k = '';
};
RD.skin = () => RD.skinById(RD.settings.skin);
RD.setSkin = (id) => { RD.settings.skin = id; RD.settings.screen = 0; RD.saveSettings(); RD.faceCache.clear(); RD.anim = {}; RD.updateDots(); };
RD.setScreen = (i) => {
  const n = RD.skin().screens.length; RD.settings.screen = ((i % n) + n) % n; RD.saveSettings(); RD.updateDots();
  const name = RD.skin().screens[RD.settings.screen].name; RD.flashName(name);
};
RD.flashName = (n) => { const e = RD.$('#scrname'); e.textContent = n; e.classList.add('show'); clearTimeout(RD._fn); RD._fn = setTimeout(() => e.classList.remove('show'), 1200); };
RD.updateDots = () => {
  const n = RD.skin().screens.length, d = RD.$('#dots');
  d.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<i class="${i === RD.settings.screen ? 'on' : ''}" data-i="${i}"></i>`).join('') : '';
};

/* ---------- loop ---------- */
RD.fps = 0; RD._frames = 0; RD._fpsT = 0; RD._last = 0; RD._alertT = 0; RD._slow = 0;
RD.frame = (now) => {
  requestAnimationFrame(RD.frame);
  const modal = !!document.getElementById('modal');
  const cap = modal ? 6 : (RD.lowPerf && RD.settings.quality === 'auto' ? Math.min(30, RD.settings.maxFps || 60) : (RD.settings.maxFps || 60));
  const minDt = 1000 / cap - 1;
  if (now - RD._last < minDt) return;
  const dt = Math.min(0.1, (now - RD._last) / 1000 || 0.016); RD._last = now;
  const t0 = performance.now();
  RD.derive(dt); RD.Trips.tick(dt);
  RD._alertT += dt; if (RD._alertT > 0.25) { RD._alertT = 0; RD.checkAlerts(); RD.updateHud(); }
  const cv = RD.$('#cv'), ctx = cv.getContext('2d'), v = RD.view, d = RD.dpr;
  RD.renderScreen(ctx, RD.skin(), RD.settings.screen, cv.width, cv.height, v.s * d, v.ox * d, v.oy * d, dt);
  if (RD.editing && RD.Editor) RD.Editor.overlay(ctx);
  const al = RD.activeAlert, ab = RD.$('#alertbar');
  if (al) { ab.textContent = '⚠ ' + al.msg; ab.classList.add('show'); RD.$('#stage').classList.toggle('alarm', Date.now() % 900 < 450); }
  else if (ab.classList.contains('show')) { ab.classList.remove('show'); RD.$('#stage').classList.remove('alarm'); }
  RD._frames++; RD._fpsT += dt;
  const ft = performance.now() - t0; if (document.getElementById('modal')) return; RD._slow = RD._slow * 0.95 + ft * 0.05;
  if (RD._fpsT >= 1) {
    RD.fps = RD._frames / RD._fpsT; RD._frames = 0; RD._fpsT = 0;
    RD.$('#fps').textContent = RD.settings.fps ? RD.fps.toFixed(0) + ' fps · ' + RD._slow.toFixed(1) + ' ms' : '';
    if (RD.settings.quality === 'auto') {
      if (!RD.lowPerf && !document.getElementById('modal') && (RD._slow > 20 || RD.fps < 30)) { RD.lowPerf = true; RD.hq = false; RD.layout(); }
    } else RD.hq = RD.settings.quality !== 'low';
  }
};

/* ---------- HUD ---------- */
RD.updateHud = () => {
  const src = RD.settings.source, st = RD.status;
  const pill = RD.$('#srcpill');
  let txt = RD.Sources[src].name, cls = 'ok';
  if (src === 'obd') { txt = 'OBD2 · ' + st.obd; cls = st.obd === 'live' ? 'ok' : st.obd === 'error' || st.obd === 'no-ecu' ? 'bad' : 'warn'; }
  if (src === 'gps') { txt = 'GPS · ' + st.gps; cls = st.gps === 'fix' ? 'ok' : st.gps === 'error' ? 'bad' : 'warn'; }
  if (src === 'sim') { txt = 'Demo mode'; cls = 'warn'; }
  if (RD.passenger()) txt = (st.gps === 'fix' ? '🛰 GPS' : '🛰 GPS ' + st.gps) + ' · Passenger';
  pill.textContent = txt; pill.className = 'pill ' + cls;
  const tp = RD.$('#trippill');
  if (RD.Trips.cur) { tp.style.display = ''; tp.textContent = '● REC ' + RD.fmt('tripDist', RD.Trips.cur.dist) + ' ' + RD.unitFor('tripDist'); } else tp.style.display = 'none';
  const pp = RD.$('#perfpill');
  if (RD.Perf.state === 'armed' || RD.Perf.state === 'run') { pp.style.display = ''; pp.textContent = RD.Perf.state === 'armed' ? 'PERF ARMED' : 'PERF ' + RD.Perf.t.toFixed(1) + 's'; } else pp.style.display = 'none';
  const auto = RD.settings.autoNight && (new Date().getHours() >= 19 || new Date().getHours() < 6);
  RD.$('#night').style.opacity = RD.settings.night || auto ? 0.45 : (1 - RD.settings.brightness);
  if (RD.Media) RD.Media.guard();
};
RD.showHud = () => {
  document.body.classList.add('hud-on'); clearTimeout(RD._hudT);
  RD._hudT = setTimeout(() => { if (!RD.editing) document.body.classList.remove('hud-on'); }, 4500);
};

/* ---------- input: swipe screens, tap HUD ---------- */
RD.initInput = () => {
  const st = RD.$('#stage'); let sx = 0, sy = 0, t0 = 0, down = false;
  st.addEventListener('pointerdown', (e) => {
    RD.unlockAudio(); RD.requestWake();
    if (RD.editing) return RD.Editor.down(e);
    down = true; sx = e.clientX; sy = e.clientY; t0 = Date.now();
  });
  window.addEventListener('pointermove', (e) => { if (RD.editing) RD.Editor.move(e); });
  window.addEventListener('pointerup', (e) => {
    if (RD.editing) return RD.Editor.up(e);
    if (!down) return; down = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) RD.setScreen(RD.settings.screen + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - t0 < 400) RD.showHud();
  });
  RD.$('#dots').addEventListener('click', (e) => { const i = e.target.dataset.i; if (i != null) RD.setScreen(+i); });
  window.addEventListener('resize', () => { clearTimeout(RD._rz); RD._rz = setTimeout(RD.layout, 120); });
  window.addEventListener('keydown', (e) => {
    if (RD.editing) return RD.Editor.key(e);
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') RD.setScreen(RD.settings.screen + 1);
    if (e.key === 'ArrowLeft') RD.setScreen(RD.settings.screen - 1);
    if (e.key === 'm') RD.UI.menu();
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') RD.requestWake(true); });
};
RD.unlockAudio = () => { if (RD._au) return; RD._au = 1; try { RD.audio = RD.audio || new (window.AudioContext || window.webkitAudioContext)(); RD.audio.resume(); } catch (e) {} };
RD.wakeLock = null;
RD.requestWake = async (force) => {
  if (!RD.settings.wake || !('wakeLock' in navigator)) return;
  if (RD.wakeLock && !force) return;
  try { RD.wakeLock = await navigator.wakeLock.request('screen'); RD.wakeLock.addEventListener('release', () => RD.wakeLock = null); } catch (e) {}
};
RD.fullscreen = () => {
  const d = document.documentElement;
  if (!document.fullscreenElement) { (d.requestFullscreen || d.webkitRequestFullscreen || (() => {})).call(d); try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }
  else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
};

/* ---------- boot ---------- */
RD.boot = () => {
  RD.hq = RD.settings.quality !== 'low';
  document.body.classList.toggle('passenger', RD.passenger());
  if (!RD.skinById(RD.settings.skin)) RD.settings.skin = 'neon';
  RD.layout(); RD.updateDots(); RD.initInput();
  RD.Sources[RD.settings.source] ? RD.setSource(RD.settings.source) : RD.setSource('sim');
  if (RD.Media) RD.Media.init();
  RD.UI.initHud();
  requestAnimationFrame(RD.frame);
  RD.showHud();
  if (RD.nativeL && RD.nativeL() && !RD.store.get('homeAsked', false)) { setTimeout(() => RD.UI.homeSetup(), 1200); }
  else if (!RD.store.get('welcomed', false)) { RD.store.set('welcomed', true); setTimeout(() => RD.UI.welcome(), 500); }
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(() => {});
};
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); RD.installEvt = e; });
window.addEventListener('load', RD.boot);
