/* ===== UI PANELS: menu, skins, connection, trips, perf, DTC, alerts, settings, device check, media ===== */
'use strict';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
RD.esc = esc;
RD.nativeL = () => { try { return window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? window.Capacitor.Plugins.DashLauncher : null; } catch (e) { return null; } };
const chOpts = (sel) => RD.chList().map(k => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(RD.CH[k].label)}</option>`).join('');
RD.download = (name, text, type) => {
  const b = new Blob([text], { type: type || 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
};

RD.UI = {
  modal(title, html, o) {
    o = o || {}; RD.UI.close();
    const m = document.createElement('div'); m.className = 'modal-wrap'; m.id = 'modal';
    m.innerHTML = `<div class="modal ${o.wide ? 'wide' : ''}"><header><button class="back" title="Back">‹</button><h2>${esc(title)}</h2><button class="x" title="Close">✕</button></header><div class="body">${html}</div></div>`;
    document.body.appendChild(m);
    m.querySelector('.x').onclick = () => RD.UI.close();
    m.querySelector('.back').onclick = () => { if (o.back) o.back(); else RD.UI.menu(); };
    m.addEventListener('pointerdown', (e) => { if (e.target === m) RD.UI.close(); });
    RD.UI._onClose = o.onClose;
    return m.querySelector('.body');
  },
  close() { const m = RD.$('#modal'); if (m) { m.remove(); if (RD.UI._onClose) { const f = RD.UI._onClose; RD.UI._onClose = null; f(); } } },
  initHud() {
    RD.$('#btn-menu').onclick = () => RD.UI.menu();
    RD.$('#btn-media').onclick = () => RD.Media.toggle();
    RD.$('#btn-full').onclick = () => RD.fullscreen();
    RD.$('#btn-trip').onclick = () => RD.UI.trips();
    RD.$('#btn-apps').onclick = () => RD.UI.apps();
    window.addEventListener('dashBack', () => {
      if (RD.$('#modal')) RD.UI.close(); else if (RD.editing) RD.Editor.stop(); else if (RD.Media.isOpen) RD.Media.close(); else RD.showHud();
    });
    RD.bus.on('status', () => RD.updateHud());
  },
  welcome() {
    const b = RD.UI.modal('Welcome to DashForge', `
      <p class="lead">Your car dashboard, built your way.</p>
      <ul class="feat"><li><b>Swipe</b> left/right to change screens. <b>Tap</b> to show controls.</li>
      <li>Passenger / second-screen mode: live <b>GPS speed, trip and compass</b>, plus the ▶ media dock for YouTube, Netflix and apps. Video plays while moving.</li>
      <li>Pick from ${RD.BUILTIN.length} skins, or tap <b>Edit Dashboard</b> to drag, resize and restyle anything.</li>
      <li>▶ opens the media dock: YouTube and one-tap app launcher.</li></ul>
      <div class="row"><button class="btn primary" id="w-skins">Choose a skin</button><button class="btn" id="w-dev">Check this device</button><button class="btn ghost" id="w-go">Start driving</button></div>`);
    b.querySelector('#w-skins').onclick = () => RD.UI.skins();
    b.querySelector('#w-dev').onclick = () => RD.UI.device();
    b.querySelector('#w-go').onclick = () => RD.UI.close();
  },
  menu() {
    const P = RD.passenger();
    let tiles = [
      ['skins', '🎨', 'Skins', RD.skin().name], ['edit', '✏️', 'Edit Dashboard', 'Drag, resize, restyle'], ['conn', '🔌', 'Connection', RD.Sources[RD.settings.source].name],
      ['trips', '🗺️', 'Trips & GPS Log', RD.Trips.cur ? 'Recording…' : RD.Trips.list.length + ' saved'], ['perf', '⏱️', 'Performance', '0-100 · ¼ mile'], ['media', '▶️', 'Media & Apps', 'YouTube · Netflix · apps'],
      ['dtc', '🔧', 'Fault Codes', 'Read / clear'], ['alerts', '🔔', 'Alerts', (RD.settings.alerts || []).filter(a => a.on).length + ' active'], ['settings', '⚙️', 'Settings', 'Units, display, car'],
      ...(RD.installEvt ? [['install', '⬇️', 'Install App', 'Add to home screen']] : []),
      ['apps', '⊞', 'All Apps', 'Every app on this tablet'],
      ['home', '🏠', 'Home Screen', RD.nativeL() ? 'Set DashForge as Home' : 'Needs the APK'],
      ['device', '📱', 'Device Check', 'Tablet compatibility'], ['io', '💾', 'Backup & Share', 'Import / export'], ['night', '🌙', 'Night Mode', RD.settings.night ? 'On' : 'Off'],
      ['mode', P ? '🚘' : '🛋️', P ? 'Driver Mode' : 'Passenger Mode', P ? 'Switch to engine data (OBD2)' : 'Second screen, GPS only']
    ];
    if (P) tiles = tiles.filter(t => t[0] !== 'dtc' && t[0] !== 'conn');
    const b = RD.UI.modal('Menu', `<div class="tiles">${tiles.map(t => `<button class="tile" data-k="${t[0]}"><span class="ic">${t[1]}</span><b>${t[2]}</b><small>${esc(t[3])}</small></button>`).join('')}</div>
      <p class="foot">DashForge v${RD.VERSION} · Trip ${RD.fmt('tripDist', RD.trip.dist)} ${RD.unitFor('tripDist')} <button class="link" id="rt">reset</button></p>`, { back: () => RD.UI.close() });
    b.querySelector('#rt').onclick = () => { RD.resetTrip(); RD.UI.menu(); };
    b.querySelectorAll('.tile').forEach(t => t.onclick = () => {
      const k = t.dataset.k;
      if (k === 'edit') { RD.UI.close(); RD.Editor.start(); }
      else if (k === 'media') { RD.UI.close(); RD.Media.open(); }
      else if (k === 'home') RD.UI.homeSetup();
      else if (k === 'mode') { const toP = !RD.passenger(); RD.settings.mode = toP ? 'passenger' : 'driver'; RD.saveSettings(); RD.setSource(toP ? 'gps' : 'sim'); RD.setSkin(toP ? 'pglass' : 'neon'); document.body.classList.toggle('passenger', toP); RD.toast(toP ? 'Passenger mode: GPS + media' : 'Driver mode: engine dashboards'); RD.UI.close(); }
      else if (k === 'install') { RD.installEvt.prompt(); RD.installEvt.userChoice.finally(() => { RD.installEvt = null; RD.UI.close(); }); }
      else if (k === 'night') { RD.settings.night = !RD.settings.night; RD.saveSettings(); RD.updateHud(); RD.UI.menu(); }
      else RD.UI[k]();
    });
  },

  /* ---------- skins gallery ---------- */
  skins() {
    let all = RD.allSkins();
    if (RD.passenger()) all = all.filter(s => s.passenger || s.user).concat(all.filter(s => !s.passenger && !s.user));
    const b = RD.UI.modal('Skins', `<div class="skins">${all.map(s => `
      <div class="skin ${s.id === RD.settings.skin ? 'cur' : ''}" data-id="${s.id}">
        <canvas width="320" height="180"></canvas>
        <div class="meta"><b>${esc(s.name)}</b><small>${s.user ? 'Custom' : s.passenger ? 'GPS · passenger' : 'Engine data (OBD2)'} · ${s.screens.length} screens</small></div>
        <div class="acts"><button class="btn sm primary" data-a="use">Use</button><button class="btn sm" data-a="dup">Customize</button>${s.user ? '<button class="btn sm danger" data-a="del">Delete</button>' : ''}</div>
      </div>`).join('')}</div>
      <div class="row"><button class="btn" id="sk-imp">Import skin file…</button><button class="btn" id="sk-new">New blank skin</button></div>`, { wide: true });
    RD.UI.thumbs(b);
    b.querySelectorAll('.skin').forEach(el => el.addEventListener('click', (e) => {
      const id = el.dataset.id, a = e.target.dataset.a;
      if (a === 'dup') { const s = RD.Editor.cloneSkin(RD.skinById(id)); RD.setSkin(s.id); RD.UI.close(); RD.Editor.start(); return; }
      if (a === 'del') { if (confirm('Delete this skin?')) { RD.userSkins = RD.userSkins.filter(s => s.id !== id); RD.saveUserSkins(); if (RD.settings.skin === id) RD.setSkin('neon'); RD.UI.skins(); } return; }
      RD.setSkin(id); RD.UI.skins();
      if (a === 'use') RD.UI.close();
    }));
    b.querySelector('#sk-imp').onclick = () => RD.UI.importFile();
    b.querySelector('#sk-new').onclick = () => {
      const s = RD.normSkin({ id: 'u' + RD.uid(), user: true, name: 'My Dashboard', font: 'sans', glow: false, bg: { type: 'grad', c1: '#111827', c2: '#000' }, pal: RD.clone(RD.BUILTIN[0].pal), screens: [{ name: 'Main', widgets: [] }] });
      RD.userSkins.push(s); RD.saveUserSkins(); RD.setSkin(s.id); RD.UI.close(); RD.Editor.start();
    };
  },
  thumbs(root) {
    const cvs = root.querySelectorAll('.skin canvas'); let i = 0;
    const next = () => {
      if (i >= cvs.length) return; const cv = cvs[i++], s = RD.skinById(cv.parentElement.dataset.id);
      RD.noCache = true; const sc = cv.width / RD.W;
      try { RD.renderScreen(cv.getContext('2d'), s, 0, cv.width, cv.height, sc, 0, 0, null); } catch (e) {}
      RD.noCache = false; setTimeout(next, 16);
    };
    next();
  },
  importFile() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => RD.UI.importText(r.result); r.readAsText(f); };
    inp.click();
  },
  importText(txt) {
    try {
      const o = JSON.parse(txt);
      if (o.kind === 'dashforge-backup') {
        if (!confirm('Restore full backup? This replaces your custom skins, settings and trips.')) return;
        RD.userSkins = (o.skins || []).map(RD.normSkin); RD.saveUserSkins();
        if (o.settings) { RD.settings = Object.assign({}, RD.defaults, o.settings); RD.saveSettings(); }
        if (o.trips) { RD.Trips.list = o.trips; RD.Trips.save(); }
        RD.toast('Backup restored'); RD.setSkin(RD.settings.skin); RD.UI.close(); return;
      }
      const s = o.skin || o; if (!s.screens) throw new Error('Not a skin file');
      s.id = 'u' + RD.uid(); s.user = true; RD.normSkin(s); RD.userSkins.push(s); RD.saveUserSkins(); RD.setSkin(s.id);
      RD.toast('Imported "' + s.name + '"'); RD.UI.skins();
    } catch (e) { RD.toast('Import failed: ' + e.message, 4000); }
  },

  /* ---------- connection ---------- */
  conn() {
    const s = RD.settings.source, o = RD.OBD;
    const bt = !!navigator.bluetooth || !!RD.OBD.native();
    const b = RD.UI.modal('Connection', `
      <div class="srcs">
        ${[['sim', '🎮', 'Demo / Simulator', 'Realistic simulated drive. Great for designing skins.'],
          ['gps', '🛰️', 'GPS + Sensors', 'No adapter needed. Speed, trips, heading, altitude, G-force from the tablet.'],
          ['obd', '🔌', 'OBD2 adapter (BLE)', 'RPM, temps, boost, fuel and fault codes via an ELM327 Bluetooth LE adapter. GPS used too.']]
        .map(x => `<label class="src ${s === x[0] ? 'on' : ''}"><input type="radio" name="src" value="${x[0]}" ${s === x[0] ? 'checked' : ''}><span class="ic">${x[1]}</span><b>${x[2]}</b><small>${x[3]}</small></label>`).join('')}
      </div>
      <div id="obdbox" style="display:${s === 'obd' ? 'block' : 'none'}">
        <div class="card">
          <div class="row between"><div><b>Adapter:</b> <span id="obdst">${RD.status.obd}</span> ${o.rate ? '· ' + o.rate.toFixed(1) + ' PIDs/s' : ''}</div>
          <button class="btn primary" id="obdc" ${bt ? '' : 'disabled'}>${RD.status.obd === 'live' ? 'Reconnect' : 'Connect OBD2 adapter'}</button></div>
          ${bt ? '' : '<p class="warn">⚠ This browser has no Web Bluetooth. Use Chrome on Android, or install the native APK build (supports Classic Bluetooth + WiFi adapters too).</p>'}
          <p class="hint">Plug the adapter into the OBD port, turn ignition ON, then tap Connect and pick your adapter (names like OBDII, Vgate, IOS-Vlink, OBDLink CX). Cheap "Bluetooth Classic" ELM327s will not appear here; they need the APK version.</p>
          <details><summary>Connection log</summary><pre id="obdlog">${esc(o.log.join('\n'))}</pre></details>
        </div>
      </div>
      <div class="card"><b>GPS:</b> ${RD.status.gps} ${RD.data.gpsAcc ? '· ±' + RD.data.gpsAcc.toFixed(0) + ' m' : ''} &nbsp; <b>Motion sensor:</b> ${RD.Motion.active ? 'on' : 'off'} <button class="btn sm" id="gcal">Zero G-sensor</button></div>`);
    b.querySelectorAll('input[name=src]').forEach(r => r.onchange = () => { RD.setSource(r.value); RD.UI.conn(); });
    const c = b.querySelector('#obdc'); if (c) c.onclick = async () => { c.disabled = true; c.textContent = 'Connecting…'; await RD.OBD.connect(); RD.UI.conn(); };
    b.querySelector('#gcal').onclick = () => RD.Motion.calibrate();
    RD.bus.on('obdlog', () => { const p = RD.$('#obdlog'); if (p) p.textContent = RD.OBD.log.join('\n'); const st = RD.$('#obdst'); if (st) st.textContent = RD.status.obd; });
  },

  /* ---------- trips ---------- */
  trips() {
    const T = RD.Trips, c = T.cur, u = RD.unitFor('tripDist');
    const dur = (ms) => RD.fmtTime(ms / 1000);
    const b = RD.UI.modal('Trips & GPS Log', `
      <div class="card row between">
        <div>${c ? `<b class="rec">● Recording</b> since ${new Date(c.start).toLocaleTimeString()} · ${RD.fmt('tripDist', c.dist)} ${u} · max ${RD.fmt('speed', c.max)} ${RD.unitFor('speed')}` : '<b>No trip recording</b>'}</div>
        <button class="btn ${c ? 'danger' : 'primary'}" id="tr-ss">${c ? 'End trip' : 'Start trip'}</button>
      </div>
      <div class="row wrap">
        <label class="chk"><input type="checkbox" id="tr-auto" ${RD.settings.autoTrip ? 'checked' : ''}> Auto start/end trips (starts after 15 s of driving, ends after 3 min parked)</label>
        <label>Speed limit alert line <input type="number" id="tr-lim" value="${RD.settings.speedLimit}" style="width:80px"> ${RD.unitFor('speed')}</label>
      </div>
      <div class="trips">${T.list.length ? T.list.map(t => `
        <div class="trip" data-id="${t.id}">
          <div><b>${new Date(t.start).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</b> ${new Date(t.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → ${new Date(t.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div class="stats"><span>${RD.fmt('tripDist', t.dist)} ${u}</span><span>${dur(t.end - t.start)}</span><span>avg ${RD.fmt('speed', t.avg)}</span><span>max ${RD.fmt('speed', t.max)}</span>${t.over ? `<span class="bad">${t.over}× over limit</span>` : ''}<span class="dim">${t.src === 'sim' ? 'demo' : t.src}</span></div>
        </div>`).join('') : '<p class="hint">No trips yet. Drive with GPS or OBD2 connected and trips are logged automatically.</p>'}</div>
      ${T.list.length ? '<div class="row"><button class="btn sm danger" id="tr-clear">Delete all trips</button></div>' : ''}`, { wide: true });
    b.querySelector('#tr-ss').onclick = () => { c ? T.end('manual') : T.start(true); RD.UI.trips(); };
    b.querySelector('#tr-auto').onchange = (e) => { RD.settings.autoTrip = e.target.checked; RD.saveSettings(); };
    b.querySelector('#tr-lim').onchange = (e) => { RD.settings.speedLimit = +e.target.value; RD.saveSettings(); };
    const clr = b.querySelector('#tr-clear'); if (clr) clr.onclick = () => { if (confirm('Delete all saved trips?')) { T.list = []; T.save(); RD.UI.trips(); } };
    b.querySelectorAll('.trip').forEach(el => el.onclick = () => RD.UI.trip(el.dataset.id));
  },
  trip(id) {
    const t = RD.Trips.list.find(x => x.id === id); if (!t) return;
    const u = RD.unitFor('tripDist'), su = RD.unitFor('speed');
    const b = RD.UI.modal('Trip — ' + new Date(t.start).toLocaleString(), `
      <canvas id="route" width="900" height="420" class="route"></canvas>
      <div class="kpis">
        ${[['Distance', RD.fmt('tripDist', t.dist) + ' ' + u], ['Duration', RD.fmtTime((t.end - t.start) / 1000)], ['Moving', RD.fmtTime(t.moving)], ['Avg speed', RD.fmt('speed', t.avg) + ' ' + su],
          ['Max speed', RD.fmt('speed', t.max) + ' ' + su], ['Over limit', t.over + '×'], ['Fuel (est.)', t.fuel ? t.fuel.toFixed(2) + ' L' : '—'], ['GPS points', t.pts.length]]
        .map(k => `<div><small>${k[0]}</small><b>${k[1]}</b></div>`).join('')}
      </div>
      <canvas id="spdc" width="900" height="160" class="route"></canvas>
      <div class="row"><button class="btn" id="t-gpx">Export GPX</button><button class="btn" id="t-maps">Open in Google Maps</button><button class="btn danger" id="t-del">Delete</button></div>`, { wide: true, back: () => RD.UI.trips() });
    RD.drawRoute(b.querySelector('#route'), t);
    const sc = b.querySelector('#spdc'), x = sc.getContext('2d'), W = sc.width, H = sc.height, sp = t.spd || [];
    x.fillStyle = '#0d1420'; x.fillRect(0, 0, W, H);
    if (sp.length > 1) {
      const mxv = Math.max(60, ...sp); x.strokeStyle = '#4fc3ff'; x.lineWidth = 2; x.beginPath();
      sp.forEach((v, i) => { const px = i / (sp.length - 1) * W, py = H - 10 - v / mxv * (H - 30); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
      const lim = RD.settings.speedLimit / (RD.imp() ? 0.621371 : 1), ly = H - 10 - lim / mxv * (H - 30);
      x.strokeStyle = '#ff3b5c'; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(0, ly); x.lineTo(W, ly); x.stroke(); x.setLineDash([]);
      x.fillStyle = '#8899aa'; x.font = '13px sans-serif'; x.fillText('Speed over time (' + su + ')  — red line = limit', 10, 16);
    }
    b.querySelector('#t-gpx').onclick = () => RD.download('trip-' + new Date(t.start).toISOString().slice(0, 16).replace(/:/g, '') + '.gpx', RD.Trips.gpx(t), 'application/gpx+xml');
    b.querySelector('#t-maps').onclick = () => {
      if (t.pts.length < 2) return RD.toast('Not enough GPS points');
      const pick = [t.pts[0]].concat(t.pts.filter((_, i) => i % Math.ceil(t.pts.length / 8) === 0).slice(1, 9)).concat([t.pts[t.pts.length - 1]]);
      window.open('https://www.google.com/maps/dir/' + pick.map(p => p[0] + ',' + p[1]).join('/'), '_blank');
    };
    b.querySelector('#t-del').onclick = () => { if (confirm('Delete this trip?')) { RD.Trips.remove(id); RD.UI.trips(); } };
  },

  /* ---------- performance ---------- */
  perf() {
    const P = RD.Perf;
    const b = RD.UI.modal('Performance Timer', `
      <div class="perfbig"><div id="pf-state"></div><div id="pf-time">0.00 s</div><div id="pf-spd"></div></div>
      <div class="row center"><button class="btn primary big" id="pf-arm">Arm timer</button><button class="btn big" id="pf-cancel">Cancel</button></div>
      <table class="res" id="pf-res"></table>
      <h3>History</h3><div id="pf-hist" class="hint"></div>
      <p class="hint">Uses GPS/OBD speed. GPS updates about once per second, so times are ±0.3 s. Only test on a closed track or safe empty road.</p>`, { onClose: () => clearInterval(RD._pfi) });
    const upd = () => {
      const st = { off: 'Ready', armed: RD.data.speed > 1 ? 'Armed — stop the vehicle' : 'Armed — GO when ready!', run: 'Running…', done: 'Finished' }[P.state];
      b.querySelector('#pf-state').textContent = st;
      b.querySelector('#pf-time').textContent = P.t.toFixed(2) + ' s';
      b.querySelector('#pf-spd').textContent = RD.fmt('speed', RD.data.speed) + ' ' + RD.unitFor('speed') + ' · ' + (RD.imp() ? (P.dist * 3.28).toFixed(0) + ' ft' : P.dist.toFixed(0) + ' m');
      const rows = P.targets().map(t => t.k).concat(['60 ft', '1/8 mile', '1/4 mile']);
      b.querySelector('#pf-res').innerHTML = rows.map(k => `<tr><td>${k}</td><td>${P.res[k] ? P.res[k].toFixed(2) + ' s' : '—'}</td></tr>`).join('');
      b.querySelector('#pf-hist').innerHTML = P.hist.length ? P.hist.slice(0, 8).map(h => `<div>${new Date(h.at).toLocaleString()} — ${Object.entries(h.res).map(([k, v]) => `<b>${k}</b> ${v.toFixed(2)}s`).join(' · ')}${h.src === 'sim' ? ' <i>(demo)</i>' : ''}</div>`).join('') : 'No runs yet';
    };
    b.querySelector('#pf-arm').onclick = () => { P.arm(); upd(); };
    b.querySelector('#pf-cancel').onclick = () => { P.cancel(); upd(); };
    upd(); clearInterval(RD._pfi); RD._pfi = setInterval(upd, 100);
  },

  /* ---------- fault codes ---------- */
  DTC: { P0101: 'MAF sensor range/performance', P0113: 'Intake air temp sensor high', P0128: 'Coolant below thermostat temp', P0130: 'O2 sensor circuit (B1S1)', P0171: 'System too lean (Bank 1)', P0172: 'System too rich (Bank 1)',
    P0300: 'Random/multiple cylinder misfire', P0301: 'Cylinder 1 misfire', P0302: 'Cylinder 2 misfire', P0303: 'Cylinder 3 misfire', P0304: 'Cylinder 4 misfire', P0335: 'Crankshaft position sensor A', P0340: 'Camshaft position sensor',
    P0401: 'EGR flow insufficient', P0420: 'Catalyst efficiency below threshold (B1)', P0440: 'EVAP system malfunction', P0442: 'EVAP small leak', P0455: 'EVAP large leak', P0500: 'Vehicle speed sensor', P0505: 'Idle air control system',
    P0562: 'System voltage low', P0700: 'Transmission control system', P0118: 'Coolant temp sensor high', P0117: 'Coolant temp sensor low', P0201: 'Injector circuit cyl 1', P0011: 'Camshaft timing over-advanced (B1)' },
  dtc() {
    const b = RD.UI.modal('Fault Codes (DTC)', `
      <p class="hint">Reads stored and pending engine fault codes from the car via OBD2. Requires the OBD2 connection to be live.</p>
      <div class="row"><button class="btn primary" id="d-read">Read codes</button><button class="btn danger" id="d-clr">Clear codes & check-engine light</button></div>
      <div id="d-out" class="card">Status: ${RD.status.obd}</div>`);
    const out = b.querySelector('#d-out');
    b.querySelector('#d-read').onclick = async () => {
      out.textContent = 'Reading…'; const r = await RD.OBD.readDTC();
      if (r.err) { out.textContent = r.err; return; }
      const li = (arr) => arr.length ? arr.map(c => `<div class="dtc"><b>${c}</b> ${esc(RD.UI.DTC[c] || 'See manufacturer documentation')} <a href="https://www.google.com/search?q=${c}+code" target="_blank">search ↗</a></div>`).join('') : '<div class="ok">None</div>';
      out.innerHTML = `<h3>Stored</h3>${li(r.stored)}<h3>Pending</h3>${li(r.pending)}`;
    };
    b.querySelector('#d-clr').onclick = async () => {
      if (!confirm('Clear all fault codes? This also resets emission readiness monitors. Engine should be OFF with ignition ON.')) return;
      out.textContent = 'Clearing…'; const ok = await RD.OBD.clearDTC(); out.textContent = ok ? 'Codes cleared.' : 'Clear failed or not connected.';
    };
  },

  /* ---------- alerts ---------- */
  alerts() {
    const A = RD.settings.alerts;
    const row = (a, i) => `<div class="alert" data-i="${i}">
      <input type="checkbox" data-k="on" ${a.on ? 'checked' : ''}>
      <select data-k="src">${chOpts(a.src)}</select>
      <select data-k="op"><option ${a.op === '>' ? 'selected' : ''}>&gt;</option><option ${a.op === '<' ? 'selected' : ''}>&lt;</option></select>
      <input type="number" step="any" data-k="val" value="${a.val}" style="width:80px"><span class="dim">${RD.unitFor(a.src)}</span>
      <input type="text" data-k="msg" value="${esc(a.msg)}" placeholder="Message">
      <label class="chk"><input type="checkbox" data-k="beep" ${a.beep ? 'checked' : ''}>Beep</label>
      <label class="chk"><input type="checkbox" data-k="speak" ${a.speak ? 'checked' : ''}>Voice</label>
      <label class="chk"><input type="checkbox" data-k="flash" ${a.flash ? 'checked' : ''}>Flash</label>
      <button class="btn sm" data-a="test">Test</button><button class="btn sm danger" data-a="del">✕</button></div>`;
    const b = RD.UI.modal('Alerts (Trigger → Action)', `<p class="hint">Values are in your display units. Each alert fires once when crossing the threshold, then re-arms.</p>
      <div id="al-list">${A.map(row).join('')}</div><div class="row"><button class="btn" id="al-add">+ Add alert</button><button class="btn ghost" id="al-reset">Restore defaults</button></div>`, { wide: true });
    b.querySelectorAll('.alert').forEach(el => {
      const i = +el.dataset.i;
      el.querySelectorAll('[data-k]').forEach(inp => inp.onchange = () => {
        const k = inp.dataset.k; A[i][k] = inp.type === 'checkbox' ? inp.checked : inp.type === 'number' ? +inp.value : inp.value; RD.saveSettings();
        if (k === 'src') RD.UI.alerts();
      });
      el.querySelector('[data-a=test]').onclick = () => { RD.beep(880, 2); RD.speak(A[i].msg); };
      el.querySelector('[data-a=del]').onclick = () => { A.splice(i, 1); RD.saveSettings(); RD.UI.alerts(); };
    });
    b.querySelector('#al-add').onclick = () => { A.push({ on: true, src: 'speed', op: '>', val: 100, msg: 'Alert', beep: true, speak: false, flash: true }); RD.saveSettings(); RD.UI.alerts(); };
    b.querySelector('#al-reset').onclick = () => { RD.settings.alerts = RD.clone(RD.defaults.alerts); RD.saveSettings(); RD.UI.alerts(); };
  },

  /* ---------- settings ---------- */
  settings() {
    const S = RD.settings;
    const sel = (k, opts) => `<select data-k="${k}">${opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${v}" ${String(S[k]) === String(v) ? 'selected' : ''}>${l}</option>`; }).join('')}</select>`;
    const num = (k, step) => `<input type="number" data-k="${k}" value="${S[k]}" step="${step || 'any'}">`;
    const chk = (k) => `<input type="checkbox" data-k="${k}" ${S[k] ? 'checked' : ''}>`;
    const b = RD.UI.modal('Settings', `<div class="form">
      <h3>Units</h3>
      <label>Units ${sel('units', [['metric', 'Metric (km/h, °C)'], ['imperial', 'Imperial (mph, °F)']])}</label>
      <label>Boost pressure ${sel('pressure', ['bar', 'psi', 'kPa'])}</label>
      <h3>Car</h3>
      <label>Redline RPM ${num('redline', 100)}</label>
      <label>Gear ratios (km/h per 1000 rpm, gear 1→6) <input type="text" data-k="ratios" value="${esc(S.ratios)}"></label>
      <label>Fuel tank (L) ${num('tank', 1)}</label>
      <label>Fuel price per litre (₹) ${num('fuelPrice', 0.5)}</label>
      <label>Tablet mounting ${sel('mount', [['upright', 'Upright (screen facing driver)'], ['flat', 'Lying flat']])}</label>
      <h3>Display</h3>
      <label>Brightness ${'<input type="range" min="0.3" max="1" step="0.05" data-k="brightness" value="' + S.brightness + '">'}</label>
      <label>Auto night mode (7pm–6am) ${chk('autoNight')}</label>
      <label>Keep screen awake ${chk('wake')}</label>
      <label>Graphics quality ${sel('quality', [['auto', 'Auto (recommended)'], ['high', 'High (glow effects)'], ['low', 'Low (old devices)']])}</label>
      <label>Max frame rate ${sel('maxFps', [[60, '60'], [30, '30 (saves battery)'], [20, '20']])}</label>
      <label>Animated backgrounds (grid, stars, aurora…) — costs FPS ${chk('bgAnim')}</label>
      <label>Show FPS counter ${chk('fps')}</label>
      <h3>Sound</h3>
      <label>Voice alerts ${chk('voice')}</label>
      <label>Volume ${'<input type="range" min="0" max="1" step="0.05" data-k="volume" value="' + S.volume + '">'}</label>
      <label>Allow video while moving (passenger use) ${chk('videoMoving')}</label>
      <h3>OBD2 polling (advanced)</h3>
      <label>Fast PIDs <input type="text" data-k="obdFast" value="${esc(S.obdFast)}"></label>
      <label>Slow PIDs <input type="text" data-k="obdSlow" value="${esc(S.obdSlow)}"></label>
      <div class="row"><button class="btn danger" id="st-reset">Reset all settings</button></div></div>`);
    b.querySelectorAll('[data-k]').forEach(inp => inp.onchange = inp.oninput = () => {
      const k = inp.dataset.k; let v = inp.type === 'checkbox' ? inp.checked : (inp.type === 'number' || inp.type === 'range') ? +inp.value : inp.value;
      if (k === 'maxFps') v = +v;
      S[k] = v; RD.saveSettings();
      if (k === 'quality') { RD.lowPerf = false; RD.hq = v !== 'low'; RD.layout(); }
      if (k === 'units' || k === 'pressure') RD.faceCache.clear();
      if (k === 'bgAnim') { RD.bgCache.k = ''; RD._dirty = true; }
      RD.updateHud();
    });
    b.querySelector('#st-reset').onclick = () => { if (confirm('Reset all settings to defaults?')) { const sk = S.skin; RD.settings = Object.assign({}, RD.defaults, { skin: sk }); RD.settings.alerts = RD.clone(RD.defaults.alerts); RD.saveSettings(); RD.layout(); RD.UI.settings(); } };
  },

  /* ---------- device compatibility check ---------- */
  device() {
    const ua = navigator.userAgent, and = (ua.match(/Android\s([\d.]+)/) || [])[1], chrome = (ua.match(/Chrome\/([\d.]+)/) || [])[1];
    const checks = [
      ['Android version', and || 'not Android', and ? (parseFloat(and) >= 7 ? 'ok' : 'warn') : 'info'],
      ['Browser engine', chrome ? 'Chrome ' + chrome.split('.')[0] : 'Other', chrome && parseInt(chrome) >= 80 ? 'ok' : 'warn'],
      ['Screen', screen.width + '×' + screen.height + ' @' + (window.devicePixelRatio || 1) + 'x', 'ok'],
      ['CPU cores / RAM', (navigator.hardwareConcurrency || '?') + ' cores / ' + (navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '?'), (navigator.hardwareConcurrency || 4) >= 4 ? 'ok' : 'warn'],
      ['Current FPS', RD.fps.toFixed(0) + ' fps (' + RD._slow.toFixed(1) + ' ms/frame)', RD.fps >= 40 ? 'ok' : RD.fps >= 24 ? 'warn' : 'bad'],
      ['Web Bluetooth (BLE OBD2)', navigator.bluetooth ? 'available' : 'not available', navigator.bluetooth ? 'ok' : 'warn'],
      ['GPS / Geolocation', navigator.geolocation ? 'available' + (location.protocol === 'https:' ? '' : ' (needs https)') : 'missing', navigator.geolocation ? 'ok' : 'bad'],
      ['Motion sensors', 'DeviceMotionEvent' in window ? (RD.Motion.raw[0] || RD.Motion.raw[1] ? 'receiving data' : 'supported (move tablet to test)') : 'missing', 'DeviceMotionEvent' in window ? 'ok' : 'warn'],
      ['Keep screen awake', 'wakeLock' in navigator ? 'supported' : 'not supported — set screen timeout to max in Android settings', 'wakeLock' in navigator ? 'ok' : 'warn'],
      ['Fullscreen', document.fullscreenEnabled ? 'supported' : 'limited', document.fullscreenEnabled ? 'ok' : 'warn'],
      ['Voice alerts', 'speechSynthesis' in window ? 'supported' : 'not supported', 'speechSynthesis' in window ? 'ok' : 'warn'],
      ['Online', navigator.onLine ? 'yes' : 'offline', 'info']
    ];
    const rep = checks.map(c => c[0] + ': ' + c[1]).join('\n') + '\nUA: ' + ua;
    let framed = false; try { framed = window.top !== window; } catch (e) { framed = true; }
    const b = RD.UI.modal('Device Check', `${framed ? '<p class="warn card">⚠ Running inside the Claude preview frame: GPS, motion sensors, Bluetooth, YouTube and downloads are blocked here by the frame. They work in the installed tablet version.</p>' : ''}<table class="res chk">${checks.map(c => `<tr><td>${c[0]}</td><td class="${c[2]}">${esc(c[1])}</td></tr>`).join('')}</table>
      <p class="hint">Verdict: ${and && parseFloat(and) < 7 ? '⚠ Android below 7 — the web version may struggle; the native APK targets Android 7+.' : 'This device can run DashForge. ' + (navigator.bluetooth ? 'BLE OBD2 works here.' : 'For OBD2, use the APK build.')}</p>
      <div class="row"><button class="btn primary" id="dv-copy">Copy report</button><button class="btn" id="dv-gps">Test GPS</button><button class="btn" id="dv-motion">Test motion sensor</button></div>
      <textarea readonly class="rep">${esc(rep)}</textarea>`);
    b.querySelector('#dv-copy').onclick = () => { const ta = b.querySelector('.rep'); ta.select(); try { navigator.clipboard.writeText(rep); } catch (e) { document.execCommand('copy'); } RD.toast('Report copied — paste it to Claude'); };
    b.querySelector('#dv-gps').onclick = () => { RD.GPS.start(); RD.toast('GPS started — allow location permission'); };
    b.querySelector('#dv-motion').onclick = async () => { await RD.Motion.start(); setTimeout(() => RD.UI.device(), 1500); };
  },

  /* ---------- all apps drawer (launcher mode) ---------- */
  async apps() {
    const NL = RD.nativeL();
    if (!NL) {
      RD.UI.modal('All Apps', `<p class="hint">The full app drawer works in the DashForge APK (installed app). In the browser version, use the quick-launch buttons in the ▶ media dock.</p><p><a class="btn primary" href="https://github.com/DarkChoco101/dashforge/releases/download/latest/DashForge.apk">Download the APK</a></p>`);
      return;
    }
    const b = RD.UI.modal('All Apps', `<input id="ap-q" placeholder="Search apps…" style="width:100%;margin:10px 0"><div class="apps" id="ap-grid"><p class="hint">Loading apps…</p></div>
      <div class="row"><button class="btn sm" id="ap-set">Android Settings</button><button class="btn sm" id="ap-home">Change Home app</button></div>`, { wide: true });
    b.querySelector('#ap-set').onclick = () => NL.openSettings();
    b.querySelector('#ap-home').onclick = () => NL.homeSettings();
    try {
      if (!RD._apps || Date.now() - RD._appsT > 60000) { const r = await NL.listApps(); RD._apps = r.apps || []; RD._appsT = Date.now(); }
      const grid = b.querySelector('#ap-grid'), draw = (q) => {
        q = (q || '').toLowerCase();
        grid.innerHTML = RD._apps.filter(a => !q || a.name.toLowerCase().includes(q)).map(a => `<button class="app" data-p="${esc(a.pkg)}">${a.icon ? `<img src="${a.icon}" width="58" height="58" style="border-radius:14px">` : '<span style="background:#333">' + esc(a.name[0]) + '</span>'}${esc(a.name)}</button>`).join('');
        grid.querySelectorAll('.app').forEach(x => x.onclick = () => { RD.UI.close(); NL.launch({ pkg: x.dataset.p }); });
      };
      draw(''); b.querySelector('#ap-q').oninput = (e) => draw(e.target.value);
    } catch (e) { b.querySelector('#ap-grid').innerHTML = '<p class="warn">Could not list apps: ' + esc(e.message || e) + '</p>'; }
  },
  homeSetup() {
    const NL = RD.nativeL();
    const b = RD.UI.modal('Home Screen', NL ? `<p class="lead">Make DashForge open every time you press Home or turn on the tablet.</p>
      <ol class="feat"><li>Tap <b>Open Home settings</b> below</li><li>Choose <b>DashForge</b></li><li>Press Home — done. Your other apps live in <b>⊞ All Apps</b>.</li></ol>
      <div class="row"><button class="btn primary big" id="hs-go">Open Home settings</button></div>
      <p class="hint">To switch back later, open All Apps → Change Home app.</p>` : `<p>Launcher mode needs the installed DashForge APK.</p><p><a class="btn primary" href="https://github.com/DarkChoco101/dashforge/releases/download/latest/DashForge.apk">Download the APK</a></p>`);
    const g = b.querySelector('#hs-go'); if (g) g.onclick = () => { RD.store.set('homeAsked', true); NL.homeSettings(); };
  },

  /* ---------- backup / share ---------- */
  io() {
    const s = RD.skin();
    const b = RD.UI.modal('Backup & Share', `
      <div class="card"><b>Current skin: ${esc(s.name)}</b><div class="row"><button class="btn" id="io-skin">Download skin file</button><button class="btn" id="io-copy">Copy skin JSON</button></div></div>
      <div class="card"><b>Import a skin</b><div class="row"><button class="btn" id="io-file">From file…</button></div>
      <textarea id="io-paste" placeholder="…or paste skin JSON here"></textarea><button class="btn sm" id="io-pastebtn">Import pasted JSON</button></div>
      <div class="card"><b>Full backup</b> (custom skins, settings, alerts, trips)<div class="row"><button class="btn primary" id="io-backup">Download backup</button><button class="btn" id="io-restore">Restore backup…</button></div></div>`);
    const skinJson = () => { const c = RD.clone(s); delete c.id; c.screens.forEach(sc => sc.widgets.forEach(w => { delete w._v; delete w.id; })); return JSON.stringify({ kind: 'dashforge-skin', v: 1, skin: c }, null, 1); };
    b.querySelector('#io-skin').onclick = () => RD.download(s.name.replace(/\W+/g, '-').toLowerCase() + '.dashskin.json', skinJson());
    b.querySelector('#io-copy').onclick = () => { try { navigator.clipboard.writeText(skinJson()); RD.toast('Copied'); } catch (e) { RD.toast('Copy failed'); } };
    b.querySelector('#io-file').onclick = () => RD.UI.importFile();
    b.querySelector('#io-restore').onclick = () => RD.UI.importFile();
    b.querySelector('#io-pastebtn').onclick = () => RD.UI.importText(b.querySelector('#io-paste').value);
    b.querySelector('#io-backup').onclick = () => RD.download('dashforge-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ kind: 'dashforge-backup', v: 1, at: Date.now(), skins: RD.userSkins, settings: RD.settings, trips: RD.Trips.list }));
  }
};

/* ===== MEDIA DOCK: YouTube + app launcher ===== */
RD.Media = {
  isOpen: false,
  APPS: [
    ['YouTube', '#ff0000', '▶', 'com.google.android.youtube'], ['YT Music', '#ff0033', '♫', 'com.google.android.apps.youtube.music'], ['Spotify', '#1db954', '◉', 'com.spotify.music'],
    ['JioSaavn', '#2bc5b4', '♪', 'com.jio.media.jiobeats'], ['Google Maps', '#34a853', '➤', 'com.google.android.apps.maps'], ['Waze', '#33ccff', '☺', 'com.waze'],
    ['Netflix', '#e50914', 'N', 'com.netflix.mediaclient'], ['Prime Video', '#00a8e1', '▶', 'com.amazon.avod.thirdpartyclient'], ['JioHotstar', '#0f1d6b', '★', 'in.startv.hotstar'],
    ['VLC', '#ff8800', '▲', 'org.videolan.vlc'], ['WhatsApp', '#25d366', '✆', 'com.whatsapp'], ['Phone', '#4f8cff', '☎', 'tel:'], ['Android Auto', '#3ddc84', 'A', 'com.google.android.projection.gearhead']
  ],
  init() {
    this.favs = RD.store.get('ytfavs', [{ t: 'Lo-fi drive mix', id: 'jfKfPfyJRdk', live: true }]);
    this.custom = RD.store.get('apps', []);
    this.render();
  },
  render() {
    const d = RD.$('#dock'); const apps = this.APPS.concat(this.custom.map(c => [c.n, '#666', c.n[0], c.p]));
    d.innerHTML = `<div class="dock-h"><b>Media & Apps</b><button class="x" id="dk-x">✕</button></div>
      <div class="yt"><div id="ytwrap" class="ytwrap"><div class="ytph">Paste a YouTube link below or pick a favourite</div></div>
      <div class="parked" id="parked">🚗 Video hidden while driving — audio keeps playing</div></div>
      <div class="row"><input id="yt-url" placeholder="YouTube link or video ID"><button class="btn sm primary" id="yt-play">Play</button><button class="btn sm" id="yt-fav">★</button></div>
      <div class="favs">${this.favs.map((f, i) => `<span class="fav" data-i="${i}">${esc(f.t)}<i data-d="${i}">✕</i></span>`).join('')}</div>
      <div class="apps">${apps.map(a => `<button class="app" data-p="${esc(a[3])}"><span style="background:${a[1]}">${esc(a[2])}</span>${esc(a[0])}</button>`).join('')}
      <button class="app" id="app-all"><span style="background:#2563eb">⊞</span>All apps</button><button class="app" id="app-add"><span style="background:#333">+</span>Add app</button></div>
      <div class="row"><input id="nav-to" placeholder="Navigate to… (address or place)"><button class="btn sm primary" id="nav-go">Go</button></div>`;
    d.querySelector('#dk-x').onclick = () => this.close();
    d.querySelector('#yt-play').onclick = () => this.play(d.querySelector('#yt-url').value);
    d.querySelector('#yt-fav').onclick = () => {
      const id = this.parse(d.querySelector('#yt-url').value) || this.cur; if (!id) return RD.toast('Paste a link first');
      const t = prompt('Name for this favourite?', 'My video'); if (!t) return; this.favs.push(Object.assign({ t }, id)); RD.store.set('ytfavs', this.favs); this.render();
    };
    d.querySelectorAll('.fav').forEach(f => f.onclick = (e) => {
      if (e.target.dataset.d != null) { this.favs.splice(+e.target.dataset.d, 1); RD.store.set('ytfavs', this.favs); this.render(); return; }
      const v = this.favs[+f.dataset.i]; this.playId(v);
    });
    d.querySelectorAll('.app[data-p]').forEach(b => b.onclick = () => this.launch(b.dataset.p));
    d.querySelector('#app-all').onclick = () => RD.UI.apps();
    d.querySelector('#app-add').onclick = () => {
      const n = prompt('App name (e.g. Gaana)'); if (!n) return; const p = prompt('Android package name (e.g. com.gaana). Find it in the Play Store URL after id='); if (!p) return;
      this.custom.push({ n, p }); RD.store.set('apps', this.custom); this.render();
    };
    d.querySelector('#nav-go').onclick = () => { const q = d.querySelector('#nav-to').value.trim(); if (q) window.open('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(q) + '&travelmode=driving', '_blank'); };
    if (this.cur) this.playId(this.cur, true);
  },
  parse(s) {
    s = (s || '').trim(); if (!s) return null; let m;
    if ((m = /[?&]list=([\w-]+)/.exec(s))) return { list: m[1], id: (/[?&]v=([\w-]{11})/.exec(s) || [])[1] };
    if ((m = /(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/.exec(s))) return { id: m[1] };
    if (/^[\w-]{11}$/.test(s)) return { id: s };
    return null;
  },
  play(s) { const p = this.parse(s); if (!p) return RD.toast('Could not read that YouTube link'); this.playId(p); },
  playId(p, quiet) {
    this.cur = p; const w = RD.$('#ytwrap'); if (!w) return;
    const q = 'autoplay=' + (quiet ? 0 : 1) + '&playsinline=1&rel=0&modestbranding=1' + (p.list ? '&list=' + p.list : '');
    const src = 'https://www.youtube.com/embed/' + (p.id || 'videoseries') + '?' + q;
    w.innerHTML = `<iframe src="${src}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  },
  launch(p) {
    if (p.startsWith('tel:')) { location.href = 'tel:'; return; }
    const ua = navigator.userAgent;
    const NL = RD.nativeL(); if (NL) { NL.launch({ pkg: p }).catch(() => RD.toast('That app is not installed')); return; }
    try { const AL = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppLauncher; if (AL && window.Capacitor.isNativePlatform()) { AL.openUrl({ url: p }).catch(() => RD.toast('App not installed')); return; } } catch (e) {}
    if (!/Android/i.test(ua)) { RD.toast('App launching works on the Android tablet'); return; }
    location.href = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=' + p + ';end';
  },
  guard() {
    const pk = RD.$('#parked'); if (!pk) return;
    const moving = RD.data.speed > 8 && RD.settings.source !== 'sim' && !RD.settings.videoMoving && !RD.passenger();
    pk.classList.toggle('show', !!(moving && this.cur));
  },
  open() { this.isOpen = true; document.body.classList.add('dock-on'); setTimeout(RD.layout, 260); },
  close() { this.isOpen = false; document.body.classList.remove('dock-on'); setTimeout(RD.layout, 260); },
  toggle() { this.isOpen ? this.close() : this.open(); }
};
