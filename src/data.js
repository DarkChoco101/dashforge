/* ===== DATA SOURCES, DERIVED VALUES, ALERTS, PERFORMANCE ===== */
'use strict';
RD.defaults.mount = 'upright';
if (!RD.settings.mount) RD.settings.mount = 'upright';
RD.ratios = () => String(RD.settings.ratios).split(',').map(Number).filter(x => x > 0);

/* ---------------- Simulator ---------------- */
const Sim = {
  name: 'Simulator', providesGear: true, providesG: true,
  s: null,
  start() {
    this.s = { speed: 0, gear: 0, rpm: 800, thr: 0, phase: 'idle', pt: 0, dur: 2, target: 0, shiftT: 0, lat: 0, latT: 0, hdg: 40, prevV: 0 };
    RD.data.coolant = Math.max(RD.data.coolant, 30);
  },
  stop() {},
  next() {
    const s = this.s, r = Math.random();
    if (s.phase === 'idle' || s.phase === 'brake') {
      s.phase = r < 0.2 ? 'launch' : 'accel'; s.target = s.phase === 'launch' ? 180 : 40 + Math.random() * 110; s.thrT = s.phase === 'launch' ? 1 : 0.35 + Math.random() * 0.45;
    } else if (s.phase === 'accel' || s.phase === 'launch') { s.phase = 'cruise'; s.dur = 4 + Math.random() * 6; }
    else if (s.phase === 'cruise') { s.phase = 'brake'; s.target = Math.random() < 0.35 ? 0 : 15 + Math.random() * 40; s.brk = 2.5 + Math.random() * 4; }
    s.pt = 0;
  },
  tick(dt) {
    const s = this.s, d = RD.data, ratios = RD.ratios(), redline = RD.settings.redline || 6500;
    s.pt += dt; let a = 0;
    const ratio = s.gear > 0 ? ratios[Math.min(s.gear, ratios.length) - 1] : 0;
    switch (s.phase) {
      case 'idle': s.thr = 0; if (s.pt > 2.5) this.next(); break;
      case 'accel': case 'launch': {
        if (s.gear === 0) s.gear = 1;
        const shiftAt = s.phase === 'launch' ? redline - 150 : 2400 + s.thrT * 2600;
        if (s.shiftT > 0) { s.shiftT -= dt; s.thr = 0.05; }
        else { s.thr = RD.lerp(s.thr, s.thrT, dt * 4); if (s.rpm > shiftAt && s.gear < ratios.length) { s.gear++; s.shiftT = s.phase === 'launch' ? 0.18 : 0.35; } }
        a = s.thr * 7.5 / Math.pow(s.gear, 0.75) * (1 - s.speed / 260) - 0.3;
        if (s.speed >= s.target) this.next();
        break;
      }
      case 'cruise': s.thr = RD.lerp(s.thr, 0.18 + Math.sin(s.pt) * 0.04, dt * 3); a = (Math.sin(s.pt * 0.7) * 0.25); if (s.pt > s.dur) this.next(); break;
      case 'brake': s.thr = 0; a = -s.brk;
        if (s.gear > 1 && ratio && s.speed / ratio * 1000 < 1300) s.gear--;
        if (s.speed <= s.target + 0.5) { if (s.target < 1) { s.speed = 0; s.gear = 0; s.phase = 'idle'; s.pt = 0; } else this.next(); }
        break;
    }
    s.speed = Math.max(0, s.speed + a * 3.6 * dt);
    const rat = s.gear > 0 ? ratios[Math.min(s.gear, ratios.length) - 1] : 0;
    let target = s.gear > 0 && s.speed > 3 ? Math.max(850, s.speed / rat * 1000) : 800 + s.thr * 3000;
    if (s.gear === 1 && s.speed < 12 && s.thr > 0.3) target = Math.max(target, 1500 + s.thr * 2500);
    s.rpm = RD.lerp(s.rpm, target + (Math.random() - 0.5) * 30, Math.min(1, dt * 12));
    s.latT -= dt; if (s.latT <= 0) { s.latT = 2 + Math.random() * 5; s.latGoal = s.speed > 20 ? (Math.random() - 0.5) * 1.1 : 0; }
    s.lat = RD.lerp(s.lat, s.latGoal || 0, dt * 1.5);
    s.hdg = (s.hdg + s.lat * s.speed * 0.02 * dt * 10 + 360) % 360;
    const thr = s.thr * 100, load = 15 + s.thr * 80;
    d.speed = s.speed; d.rpm = s.rpm; d.gear = s.gear; d.throttle = thr; d.load = load;
    d.accelY = RD.lerp(d.accelY, a / 9.81, dt * 6); d.accelX = s.lat + (Math.random() - 0.5) * 0.02;
    d.heading = s.hdg; d.altitude = 920 + Math.sin(Date.now() / 60000) * 15;
    d.coolant = RD.lerp(d.coolant, 88 + load * 0.08, dt * 0.03); d.oiltemp = RD.lerp(d.oiltemp, 96 + load * 0.12, dt * 0.02);
    d.intake = RD.lerp(d.intake, 32 + load * 0.05, dt * 0.2); d.volt = 14.1 + Math.sin(Date.now() / 3000) * 0.08;
    d.boost = RD.lerp(d.boost, -0.65 + s.thr * Math.min(1, s.rpm / 3500) * 1.75, dt * 5); d.map = (d.boost + 1.013) * 100;
    d.maf = Math.max(2.5, s.rpm * load / 100 * 0.022); d.timing = RD.clamp(8 + s.rpm / 350 - load * 0.08, 0, 42);
    d.afr = s.thr > 0.85 ? RD.lerp(d.afr, 12.4, dt * 4) : s.phase === 'brake' ? RD.lerp(d.afr, 19, dt * 2) : RD.lerp(d.afr, 14.7 + (Math.random() - 0.5) * 0.3, dt * 4);
    d.fuel = Math.max(3, d.fuel - (d.fuelRate || 0) / 3600 * dt / RD.settings.tank * 100);
    d.ambient = 28;
  }
};

/* ---------------- GPS ---------------- */
const GPS = {
  id: null, last: null, fix: false, active: false,
  start() {
    if (this.active || !navigator.geolocation) { if (!navigator.geolocation) RD.toast('GPS not available on this device'); return; }
    this.active = true;
    this.id = navigator.geolocation.watchPosition(p => this.onPos(p), e => { RD.toast('GPS: ' + e.message); RD.status.gps = 'error'; }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    RD.status.gps = 'searching';
  },
  stop() { if (this.id != null) navigator.geolocation.clearWatch(this.id); this.id = null; this.active = false; RD.status.gps = 'off'; },
  onPos(p) {
    const c = p.coords, t = p.timestamp; RD.status.gps = 'fix';
    let spd = c.speed != null && !isNaN(c.speed) ? c.speed * 3.6 : null;
    if (this.last) {
      const dist = RD.haversine(this.last.lat, this.last.lon, c.latitude, c.longitude), dtt = (t - this.last.t) / 1000;
      if (spd == null && dtt > 0) spd = dist / dtt * 3.6;
      if (c.heading == null || isNaN(c.heading)) { if (dist > 3) RD.data.heading = RD.bearing(this.last.lat, this.last.lon, c.latitude, c.longitude); }
    }
    if (c.heading != null && !isNaN(c.heading) && (spd || 0) > 2) RD.data.heading = c.heading;
    if (c.altitude != null) RD.data.altitude = c.altitude;
    RD.data.gpsAcc = c.accuracy;
    RD.gpsSpeed = c.accuracy < 50 ? Math.max(0, spd || 0) : RD.gpsSpeed;
    RD.gpsTime = Date.now();
    this.last = { lat: c.latitude, lon: c.longitude, t };
  }
};
RD.haversine = (a, b, c, d) => { const R = 6371000, dl = (c - a) * D2R, dn = (d - b) * D2R, x = Math.sin(dl / 2) ** 2 + Math.cos(a * D2R) * Math.cos(c * D2R) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
RD.bearing = (a, b, c, d) => { const y = Math.sin((d - b) * D2R) * Math.cos(c * D2R), x = Math.cos(a * D2R) * Math.sin(c * D2R) - Math.sin(a * D2R) * Math.cos(c * D2R) * Math.cos((d - b) * D2R); return (Math.atan2(y, x) / D2R + 360) % 360; };
RD.gpsSpeed = 0;

/* ---------------- Motion sensors (G-force) ---------------- */
const Motion = {
  active: false, grav: [0, 0, 0], off: RD.store.get('goff', [0, 0]), raw: [0, 0],
  async start() {
    if (this.active) return;
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) { try { await DeviceMotionEvent.requestPermission(); } catch (e) {} }
    this.h = (e) => this.on(e); window.addEventListener('devicemotion', this.h); this.active = true;
  },
  stop() { if (this.h) window.removeEventListener('devicemotion', this.h); this.active = false; },
  on(e) {
    let a = e.acceleration, ax, ay, az;
    if (a && a.x != null) { ax = a.x; ay = a.y; az = a.z; }
    else if (e.accelerationIncludingGravity) {
      const g = e.accelerationIncludingGravity, k = 0.92, G = this.grav;
      G[0] = G[0] * k + g.x * (1 - k); G[1] = G[1] * k + g.y * (1 - k); G[2] = G[2] * k + g.z * (1 - k);
      ax = g.x - G[0]; ay = g.y - G[1]; az = g.z - G[2];
    } else return;
    const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    let sx, sy;
    switch ((ang + 360) % 360) { case 90: sx = -ay; sy = ax; break; case 270: sx = ay; sy = -ax; break; case 180: sx = -ax; sy = -ay; break; default: sx = ax; sy = ay; }
    const lat = sx / 9.81, lon = (RD.settings.mount === 'flat' ? sy : -az) / 9.81;
    this.raw = [lat, lon];
    if (!RD.Sources[RD.settings.source].providesG) {
      RD.data.accelX = RD.lerp(RD.data.accelX, lat - this.off[0], 0.2);
      RD.data.accelY = RD.lerp(RD.data.accelY, lon - this.off[1], 0.2);
    }
  },
  calibrate() { this.off = this.raw.slice(); RD.store.set('goff', this.off); RD.toast('G-sensor zeroed'); }
};
RD.Motion = Motion; RD.GPS = GPS;

/* ---------------- OBD2 over BLE (ELM327) ---------------- */
const OBD = {
  name: 'OBD2 (BLE)', providesGear: false,
  SERVICES: ['0000fff0-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb', '000018f0-0000-1000-8000-00805f9b34fb',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '49535343-fe7d-4ae5-8fa9-9fafd205e455', '0000ae30-0000-1000-8000-00805f9b34fb', '0000beef-0000-1000-8000-00805f9b34fb'],
  dev: null, wr: null, nt: null, buf: '', pending: null, q: Promise.resolve(), running: false, proto: '', supported: null, misses: {}, baro: 101, rate: 0,
  log: [],
  addLog(s) { this.log.push(new Date().toLocaleTimeString() + '  ' + s); if (this.log.length > 200) this.log.shift(); RD.bus.emit('obdlog'); },
  async start() {
    RD.status.obd = 'disconnected';
    GPS.start(); Motion.start();
    if (!this.dev) RD.toast('Open menu → Connection → Connect OBD2 adapter', 4000);
  },
  stop() { this.running = false; },
  native() { try { return window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins.BluetoothLe; } catch (e) { return null; } },
  hex(bytes) { return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '); },
  async connect() {
    const ble = this.native();
    if (!ble && !navigator.bluetooth) { RD.toast('Bluetooth not available here. Use Chrome on Android, or the DashForge APK.', 5000); this.addLog('no bluetooth API'); return false; }
    try {
      RD.status.obd = 'connecting'; RD.bus.emit('status'); this.wr = this.nt = null;
      if (ble) await this.connectNative(ble); else await this.connectWeb();
      await this.init();
      return true;
    } catch (e) {
      RD.status.obd = 'error'; RD.bus.emit('status'); this.addLog('Error: ' + (e.message || e)); RD.toast('OBD2: ' + (e.message || e), 5000); return false;
    }
  },
  onDisc() { this.running = false; RD.status.obd = 'disconnected'; RD.bus.emit('status'); this.addLog('Disconnected'); RD.toast('OBD2 adapter disconnected'); },
  async connectWeb() {
    this.dev = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: this.SERVICES });
    this.addLog('Selected ' + (this.dev.name || 'device'));
    this.dev.addEventListener('gattserverdisconnected', () => this.onDisc());
    const server = await this.dev.gatt.connect();
    let wr = null, nt = null;
    for (const uuid of this.SERVICES) {
      let svc; try { svc = await server.getPrimaryService(uuid); } catch (e) { continue; }
      for (const c of await svc.getCharacteristics()) {
        if (!wr && (c.properties.write || c.properties.writeWithoutResponse)) wr = c;
        if (!nt && (c.properties.notify || c.properties.indicate)) nt = c;
      }
      if (wr && nt) { this.addLog('Service ' + uuid.slice(0, 8)); break; }
      wr = nt = null;
    }
    if (!wr || !nt) throw new Error('No ELM327 serial service found on this device');
    await nt.startNotifications();
    nt.addEventListener('characteristicvaluechanged', (e) => { const dv = e.target.value; let s = ''; for (let i = 0; i < dv.byteLength; i++) s += String.fromCharCode(dv.getUint8(i)); this.onText(s); });
    this.wr = { write: async (bytes) => { if (wr.properties.writeWithoutResponse && wr.writeValueWithoutResponse) await wr.writeValueWithoutResponse(bytes); else await wr.writeValue(bytes); } };
    this.nt = nt;
  },
  async connectNative(ble) {
    await ble.initialize({ androidNeverForLocation: false });
    const dev = await ble.requestDevice({ optionalServices: this.SERVICES });
    const id = dev.deviceId; this.dev = dev; this.addLog('Selected ' + (dev.name || id));
    await ble.addListener('disconnected|' + id, () => this.onDisc());
    await ble.connect({ deviceId: id });
    const { services } = await ble.getServices({ deviceId: id });
    let pick = null;
    for (const svc of services) {
      if (!this.SERVICES.includes(svc.uuid.toLowerCase())) continue;
      const w = svc.characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse), n = svc.characteristics.find(c => c.properties.notify || c.properties.indicate);
      if (w && n) { pick = { s: svc.uuid, w, n }; break; }
    }
    if (!pick) throw new Error('No ELM327 serial service found on this device');
    this.addLog('Service ' + pick.s.slice(0, 8));
    await ble.addListener('notification|' + id + '|' + pick.s + '|' + pick.n.uuid, (ev) => {
      const v = ev && ev.value; let s = '';
      if (typeof v === 'string') { const h = v.replace(/[^0-9a-f]/gi, ''); for (let i = 0; i + 1 < h.length; i += 2) s += String.fromCharCode(parseInt(h.substr(i, 2), 16)); }
      this.onText(s);
    });
    await ble.startNotifications({ deviceId: id, service: pick.s, characteristic: pick.n.uuid });
    const wnr = !pick.w.properties.write;
    this.wr = { write: (bytes) => ble[wnr ? 'writeWithoutResponse' : 'write']({ deviceId: id, service: pick.s, characteristic: pick.w.uuid, value: this.hex(bytes) }) };
    this.nt = true;
  },
  onText(s) {
    this.buf += s;
    if (this.buf.indexOf('>') >= 0 && this.pending) { const out = this.buf.split('>')[0]; this.buf = ''; const p = this.pending; this.pending = null; p.res(out); }
  },
  send(cmd, timeout) {
    const run = () => new Promise(async (res) => {
      const to = setTimeout(() => { if (this.pending) { this.pending = null; this.buf = ''; res('TIMEOUT'); } }, timeout || 2500);
      this.pending = { res: (v) => { clearTimeout(to); res(v); } };
      const bytes = new TextEncoder().encode(cmd + '\r');
      try {
        for (let i = 0; i < bytes.length; i += 20) {
          await this.wr.write(bytes.slice(i, i + 20));
        }
      } catch (e) { clearTimeout(to); this.pending = null; res('ERROR ' + e.message); }
    });
    const p = this.q.then(run); this.q = p.catch(() => {}); return p;
  },
  async init() {
    RD.status.obd = 'initializing'; RD.bus.emit('status');
    const seq = [['ATZ', 4000], ['ATE0'], ['ATL0'], ['ATS0'], ['ATH0'], ['ATAT1'], ['ATSP0']];
    for (const [c, t] of seq) { const r = await this.send(c, t); this.addLog(c + ' → ' + r.replace(/\s+/g, ' ').trim()); }
    const r = await this.send('0100', 12000); this.addLog('0100 → ' + r.replace(/\s+/g, ' ').trim());
    if (/UNABLE|ERROR|TIMEOUT|NO DATA/.test(r)) { RD.status.obd = 'no-ecu'; RD.bus.emit('status'); RD.toast('Adapter connected but car ECU not responding. Is ignition ON?', 6000); }
    this.supported = new Set();
    this.parseSupport(r, 0);
    for (const base of [0x20, 0x40]) {
      if (!this.supported.has(base)) break;
      const rr = await this.send('01' + base.toString(16).toUpperCase().padStart(2, '0'), 3000); this.parseSupport(rr, base);
    }
    this.proto = (await this.send('ATDPN')).replace(/[^0-9A-C]/gi, '').replace(/^A/, '');
    const baro = this.parse(await this.send('0133'), '33'); if (baro) this.baro = baro[0];
    this.addLog('Protocol ' + this.proto + ', ' + this.supported.size + ' PIDs supported');
    RD.status.obd = 'live'; RD.bus.emit('status'); RD.toast('OBD2 connected — live data');
    this.running = true; this.loop();
  },
  parseSupport(r, base) {
    const want = '41' + base.toString(16).toUpperCase().padStart(2, '0');
    const s = r.replace(/[\s>]/g, '').toUpperCase(), i = s.indexOf(want); if (i < 0) return;
    const hex = s.substr(i + 4, 8); if (hex.length < 8) return;
    const bits = parseInt(hex, 16);
    for (let b = 0; b < 32; b++) if (bits & (1 << (31 - b))) this.supported.add(base + b + 1);
  },
  parse(r, pid) {
    const s = r.replace(/SEARCHING\.\.\.|BUSINIT:?\s*(OK|\.\.\.)?/gi, '').replace(/[\s>]/g, '').toUpperCase();
    const i = s.indexOf('41' + pid); if (i < 0) return null;
    const out = []; for (let k = i + 4; k + 1 < s.length && out.length < 4; k += 2) { const b = parseInt(s.substr(k, 2), 16); if (isNaN(b)) break; out.push(b); }
    return out;
  },
  apply(pid, b) {
    const d = RD.data, A = b[0], B = b[1] || 0;
    switch (pid) {
      case '0C': d.rpm = (A * 256 + B) / 4; break;
      case '0D': d.speed = A; break;
      case '05': d.coolant = A - 40; break;
      case '0F': d.intake = A - 40; break;
      case '11': d.throttle = A * 100 / 255; break;
      case '04': d.load = A * 100 / 255; break;
      case '0B': d.map = A; d.boost = (A - this.baro) / 100; break;
      case '10': d.maf = (A * 256 + B) / 100; break;
      case '42': d.volt = (A * 256 + B) / 1000; break;
      case '2F': d.fuel = A * 100 / 255; break;
      case '0E': d.timing = A / 2 - 64; break;
      case '5C': d.oiltemp = A - 40; break;
      case '46': d.ambient = A - 40; break;
    }
  },
  async loop() {
    const list = (s) => String(s).split(',').map(x => x.trim().toUpperCase()).filter(p => p && (!this.supported || !this.supported.size || this.supported.has(parseInt(p, 16))));
    const fast = list(RD.settings.obdFast), slow = list(RD.settings.obdSlow);
    let si = 0, n = 0, t0 = performance.now();
    while (this.running) {
      const batch = fast.slice(); if (slow.length) batch.push(slow[si++ % slow.length]);
      for (const pid of batch) {
        if ((this.misses[pid] || 0) > 3) continue;
        const r = await this.send('01' + pid, 1500);
        const b = this.parse(r, pid);
        if (b && b.length) { this.apply(pid, b); this.misses[pid] = 0; n++; } else if (/NO DATA|\?/.test(r)) this.misses[pid] = (this.misses[pid] || 0) + 1;
        if (!this.running) return;
      }
      const el = performance.now() - t0; if (el > 2000) { this.rate = n / el * 1000; n = 0; t0 = performance.now(); }
    }
  },
  async readDTC() {
    if (RD.status.obd !== 'live') return { err: 'Connect to OBD2 first' };
    const wasRunning = this.running; this.running = false; await this.q;
    const r = await this.send('03', 5000), r7 = await this.send('07', 5000);
    const isCAN = /^[6-9]$/.test(this.proto);
    const decode = (resp, mode) => {
      const codes = [];
      resp.split(/[\r\n]+/).forEach(line => {
        let s = line.replace(/\s/g, '').toUpperCase(); const i = s.indexOf(mode); if (i !== 0) return;
        s = s.slice(2); if (isCAN) s = s.slice(2);
        for (let k = 0; k + 4 <= s.length; k += 4) {
          const h = s.substr(k, 4); if (h === '0000') continue;
          const c = parseInt(h[0], 16); codes.push('PCBU'[c >> 2] + (c & 3) + h.slice(1));
        }
      });
      return codes;
    };
    const out = { stored: decode(r, '43'), pending: decode(r7, '47') };
    RD.data.dtcCount = out.stored.length;
    if (wasRunning) { this.running = true; this.loop(); }
    return out;
  },
  async clearDTC() {
    if (RD.status.obd !== 'live') return false;
    const wasRunning = this.running; this.running = false; await this.q;
    const r = await this.send('04', 5000); RD.data.dtcCount = 0;
    if (wasRunning) { this.running = true; this.loop(); }
    return /44/.test(r.replace(/\s/g, ''));
  }
};
RD.OBD = OBD;

const GPSSource = {
  name: 'GPS + Sensors', providesGear: false,
  start() { GPS.start(); Motion.start(); },
  stop() {},
  tick(dt) {
    const d = RD.data;
    const stale = Date.now() - (RD.gpsTime || 0) > 4000;
    d.speed = RD.lerp(d.speed, stale ? 0 : RD.gpsSpeed, Math.min(1, dt * 3));
  }
};

RD.status = { gps: 'off', obd: 'off' };
RD.Sources = { sim: Sim, gps: GPSSource, obd: OBD };

RD.setSource = (k) => {
  const cur = RD.Sources[RD.settings.source]; if (cur && cur.stop) cur.stop();
  if (k !== 'obd' && k !== 'gps') { GPS.stop(); }
  RD.settings.source = k; RD.saveSettings();
  const s = RD.Sources[k]; if (s.start) s.start();
  if (k !== 'sim') { ['rpm', 'throttle', 'load', 'boost', 'maf', 'map'].forEach(c => RD.data[c] = 0); RD.data.gear = 0; }
  RD.bus.emit('status');
};

/* ---------------- Derived values: trip, economy, gear, power ---------------- */
RD.trip = Object.assign({ dist: 0, time: 0, moving: 0, max: 0, fuel: 0 }, RD.store.get('trip', {}));
RD.resetTrip = () => { RD.trip = { dist: 0, time: 0, moving: 0, max: 0, fuel: 0 }; RD.store.set('trip', RD.trip); RD.toast('Trip reset'); };
RD._prevSpeed = 0; RD._saveT = 0;
RD.derive = (dt) => {
  const d = RD.data, src = RD.Sources[RD.settings.source], t = RD.trip;
  if (src.tick) src.tick(dt);
  if (RD.settings.source === 'obd' && RD.status.obd !== 'live' && RD.gpsTime && Date.now() - RD.gpsTime < 4000) d.speed = RD.lerp(d.speed, RD.gpsSpeed, Math.min(1, dt * 3));
  if (!src.providesGear) {
    if (d.speed < 3 || d.rpm < 500) d.gear = 0;
    else { const r = d.speed / d.rpm * 1000, rs = RD.ratios(); let best = 0, bd = 1e9; rs.forEach((x, i) => { const e = Math.abs(Math.log(r / x)); if (e < bd) { bd = e; best = i + 1; } }); if (bd < 0.25) d.gear = best; }
  }
  const a = (d.speed - RD._prevSpeed) / 3.6 / Math.max(dt, 1e-3); RD._prevSpeed = d.speed;
  if (!src.providesG && !RD.Motion.active) d.accelY = RD.lerp(d.accelY, a / 9.81, Math.min(1, dt * 3));
  const v = d.speed / 3.6, P = 1250 * Math.max(0, a) * v + 0.5 * 1.2 * 0.7 * v * v * v + 1250 * 9.81 * 0.012 * v;
  d.hp = RD.lerp(d.hp, (d.throttle > 5 || RD.settings.source !== 'sim') ? P / 745.7 : 0, Math.min(1, dt * 4));
  t.dist += d.speed / 3600 * dt; t.time += dt; if (d.speed > 2) t.moving += dt; if (d.speed > t.max) t.max = d.speed;
  d.fuelRate = d.maf > 0 ? d.maf / 14.7 / 745 * 3600 : 0;
  t.fuel += d.fuelRate / 3600 * dt;
  d.eco = d.fuelRate > 0.2 && d.speed > 3 ? Math.min(99, d.speed / d.fuelRate) : d.speed > 3 ? 99 : 0;
  d.tripDist = t.dist; d.tripTime = t.time; d.avgSpeed = t.moving > 1 ? t.dist / (t.moving / 3600) : 0; d.maxSpeed = t.max;
  d.tripFuel = t.fuel; d.avgEco = t.fuel > 0.01 ? t.dist / t.fuel : 0; d.tripCost = t.fuel * RD.settings.fuelPrice;
  d.range = d.fuel / 100 * RD.settings.tank * (d.avgEco > 1 ? d.avgEco : 12);
  RD.gTrail.push([d.accelX, d.accelY]); if (RD.gTrail.length > 40) RD.gTrail.shift();
  RD._saveT += dt; if (RD._saveT > 5) { RD._saveT = 0; RD.store.set('trip', t); }
  RD.Perf.tick(dt);
};

/* ---------------- Alerts (Trigger → Action) ---------------- */
RD.defaults.alerts = [
  { on: true, src: 'coolant', op: '>', val: 108, msg: 'Engine temperature high', beep: true, speak: true, flash: true },
  { on: true, src: 'volt', op: '<', val: 11.8, msg: 'Battery voltage low', beep: true, speak: true, flash: true },
  { on: true, src: 'fuel', op: '<', val: 10, msg: 'Fuel level low', beep: true, speak: true, flash: false },
  { on: false, src: 'speed', op: '>', val: 100, msg: 'Speed limit exceeded', beep: true, speak: false, flash: true },
  { on: true, src: 'rpm', op: '>', val: 6800, msg: 'Over rev', beep: true, speak: false, flash: true }
];
if (!RD.settings.alerts) RD.settings.alerts = RD.clone(RD.defaults.alerts);
RD.alertState = {};
RD.audio = null;
RD.beep = (freq, n) => {
  try {
    RD.audio = RD.audio || new (window.AudioContext || window.webkitAudioContext)();
    const ac = RD.audio; if (ac.state === 'suspended') ac.resume();
    for (let i = 0; i < (n || 2); i++) {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.22;
      o.type = 'square'; o.frequency.value = freq || 880; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25 * RD.settings.volume, t + 0.01); g.gain.linearRampToValueAtTime(0, t + 0.16);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.18);
    }
  } catch (e) {}
};
RD.speak = (msg) => { try { if (!RD.settings.voice || !window.speechSynthesis) return; const u = new SpeechSynthesisUtterance(msg); u.volume = RD.settings.volume; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
RD.activeAlert = null;
RD.checkAlerts = () => {
  const now = Date.now(); let top = null;
  (RD.settings.alerts || []).forEach((al, i) => {
    if (!al.on) return;
    if (RD.passenger() && RD.GPS_CH.indexOf(al.src) < 0) return;
    const v = RD.toDisp(al.src, RD.data[al.src]);
    const hit = al.op === '<' ? v < al.val : v > al.val;
    const st = RD.alertState[i] = RD.alertState[i] || { active: false, last: 0 };
    if (al.src === 'fuel' && RD.settings.source === 'gps') return;
    if (hit && !st.active && now - st.last > 15000) {
      st.active = true; st.last = now;
      if (al.beep) RD.beep(al.src === 'rpm' ? 1200 : 880, al.src === 'rpm' ? 1 : 2);
      if (al.speak) RD.speak(al.msg);
    }
    if (!hit) {
      const hyst = Math.abs(al.val) * 0.02;
      if (al.op === '<' ? v > al.val + hyst : v < al.val - hyst) st.active = false;
    }
    if (st.active && al.flash) top = al;
  });
  RD.activeAlert = top;
};

/* ---------------- Performance timer ---------------- */
RD.Perf = {
  state: 'off', t: 0, dist: 0, max: 0, res: {}, hist: RD.store.get('perf', []),
  targets() { return RD.imp() ? [{ k: '0-30 mph', v: 48.28 }, { k: '0-60 mph', v: 96.56 }, { k: '0-100 mph', v: 160.9 }] : [{ k: '0-60 km/h', v: 60 }, { k: '0-100 km/h', v: 100 }, { k: '0-150 km/h', v: 150 }, { k: '0-200 km/h', v: 200 }]; },
  arm() { this.state = 'armed'; this.res = {}; this.t = 0; this.dist = 0; this.max = 0; RD.toast(RD.data.speed > 1 ? 'Armed — come to a full stop' : 'Armed — launch when ready'); },
  cancel() { this.state = 'off'; },
  tick(dt) {
    const s = RD.data.speed;
    if (this.state === 'armed') { if (s < 1) this.ready = true; if (this.ready && s >= 1) { this.state = 'run'; this.t = 0; this.dist = 0; this.ready = false; } return; }
    if (this.state !== 'run') return;
    this.t += dt; this.dist += s / 3.6 * dt; this.max = Math.max(this.max, s);
    this.targets().forEach(tg => { if (!this.res[tg.k] && s >= tg.v) this.res[tg.k] = this.t; });
    [['60 ft', 18.288], ['1/8 mile', 201.17], ['1/4 mile', 402.34]].forEach(([k, m]) => { if (!this.res[k] && this.dist >= m) this.res[k] = this.t; });
    if (this.res['1/4 mile'] || s < this.max - 15 || this.t > 60) this.finish();
  },
  finish() {
    this.state = 'done';
    if (Object.keys(this.res).length) {
      this.hist.unshift({ at: Date.now(), res: this.res, src: RD.settings.source }); this.hist = this.hist.slice(0, 20); RD.store.set('perf', this.hist);
      RD.beep(1400, 1);
    }
  }
};
