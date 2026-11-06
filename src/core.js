/* ===== CORE: namespace, channels, units, storage ===== */
'use strict';
const RD = window.RD = {};
RD.W = 1280; RD.H = 720;
RD.VERSION = '1.0.0';

RD.store = {
  get(k, d) { try { const v = localStorage.getItem('rdx.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('rdx.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};

RD.defaults = {
  units: 'metric', pressure: 'bar', ratios: '7.5,13,19,26,33,40', redline: 6500,
  night: false, brightness: 1, wake: true, fps: false, maxFps: 60, quality: 'auto',
  source: 'sim', skin: 'neon', screen: 0, tank: 45, fuelPrice: 105, volume: 0.6,
  voice: true, obdFast: '0C,0D,11', obdSlow: '05,0F,04,0B,10,42,2F,0E,5C,46'
};
RD.settings = Object.assign({}, RD.defaults, RD.store.get('settings', {}));
RD.saveSettings = () => RD.store.set('settings', RD.settings);
if (!RD.settings.modeSet) { RD.settings.mode = 'passenger'; RD.settings.skin = 'pglass'; RD.settings.source = 'gps'; RD.settings.screen = 0; RD.settings.modeSet = true; RD.saveSettings(); }
RD.passenger = () => RD.settings.mode === 'passenger';
RD.GPS_CH = ['speed', 'heading', 'altitude', 'gpsAcc', 'tripDist', 'tripTime', 'avgSpeed', 'maxSpeed', 'accelX', 'accelY', 'hp'];

/* Channels — canonical units: speed km/h, temp °C, boost bar, dist km, eco km/L */
RD.CH = {
  rpm:      { label: 'RPM', kind: '', unit: 'rpm', min: 0, max: 8000, dec: 0 },
  speed:    { label: 'Speed', kind: 'speed', min: 0, max: 240, dec: 0 },
  gear:     { label: 'Gear', kind: '', unit: '', min: -1, max: 6, dec: 0 },
  throttle: { label: 'Throttle', kind: '', unit: '%', min: 0, max: 100, dec: 0 },
  load:     { label: 'Engine Load', kind: '', unit: '%', min: 0, max: 100, dec: 0 },
  coolant:  { label: 'Coolant', kind: 'temp', min: 40, max: 130, dec: 0 },
  intake:   { label: 'Intake Air', kind: 'temp', min: -10, max: 80, dec: 0 },
  oiltemp:  { label: 'Oil Temp', kind: 'temp', min: 40, max: 150, dec: 0 },
  maf:      { label: 'MAF', kind: '', unit: 'g/s', min: 0, max: 200, dec: 1 },
  map:      { label: 'MAP', kind: '', unit: 'kPa', min: 0, max: 250, dec: 0 },
  boost:    { label: 'Boost', kind: 'pressure', min: -1, max: 1.5, dec: 2 },
  fuel:     { label: 'Fuel Level', kind: '', unit: '%', min: 0, max: 100, dec: 0 },
  volt:     { label: 'Battery', kind: '', unit: 'V', min: 10, max: 16, dec: 1 },
  timing:   { label: 'Timing Adv', kind: '', unit: '°', min: -10, max: 50, dec: 1 },
  afr:      { label: 'AFR', kind: '', unit: ':1', min: 10, max: 20, dec: 1 },
  ambient:  { label: 'Ambient', kind: 'temp', min: -10, max: 50, dec: 0 },
  fuelRate: { label: 'Fuel Rate', kind: '', unit: 'L/h', min: 0, max: 30, dec: 1 },
  eco:      { label: 'Instant Eco', kind: 'eco', min: 0, max: 40, dec: 1 },
  avgEco:   { label: 'Avg Eco', kind: 'eco', min: 0, max: 40, dec: 1 },
  accelX:   { label: 'Lateral G', kind: '', unit: 'g', min: -1.5, max: 1.5, dec: 2 },
  accelY:   { label: 'Long. G', kind: '', unit: 'g', min: -1.5, max: 1.5, dec: 2 },
  heading:  { label: 'Heading', kind: '', unit: '°', min: 0, max: 360, dec: 0 },
  altitude: { label: 'Altitude', kind: 'alt', min: 0, max: 3000, dec: 0 },
  gpsAcc:   { label: 'GPS Accuracy', kind: 'alt', min: 0, max: 50, dec: 0 },
  tripDist: { label: 'Trip', kind: 'dist', min: 0, max: 1000, dec: 1 },
  tripTime: { label: 'Trip Time', kind: 'time', min: 0, max: 36000, dec: 0 },
  avgSpeed: { label: 'Avg Speed', kind: 'speed', min: 0, max: 200, dec: 0 },
  maxSpeed: { label: 'Max Speed', kind: 'speed', min: 0, max: 300, dec: 0 },
  range:    { label: 'Range', kind: 'dist', min: 0, max: 900, dec: 0 },
  tripFuel: { label: 'Trip Fuel', kind: '', unit: 'L', min: 0, max: 100, dec: 2 },
  tripCost: { label: 'Trip Cost', kind: '', unit: '₹', min: 0, max: 10000, dec: 0 },
  hp:       { label: 'Est. Power', kind: '', unit: 'hp', min: 0, max: 300, dec: 0 },
  dtcCount: { label: 'Fault Codes', kind: '', unit: '', min: 0, max: 20, dec: 0 }
};
RD.chList = () => Object.keys(RD.CH);

RD.data = {};           // live raw values (canonical units)
RD.chList().forEach(k => RD.data[k] = 0);
RD.data.coolant = 25; RD.data.intake = 25; RD.data.oiltemp = 25; RD.data.volt = 12.4; RD.data.fuel = 70; RD.data.afr = 14.7;
RD.data.ambient = 28;

RD.imp = () => RD.settings.units === 'imperial';
RD.unitFor = (ch) => {
  const c = RD.CH[ch]; if (!c) return '';
  switch (c.kind) {
    case 'speed': return RD.imp() ? 'mph' : 'km/h';
    case 'temp': return RD.imp() ? '°F' : '°C';
    case 'pressure': return RD.settings.pressure;
    case 'dist': return RD.imp() ? 'mi' : 'km';
    case 'alt': return RD.imp() ? 'ft' : 'm';
    case 'eco': return RD.imp() ? 'mpg' : 'km/L';
    case 'time': return '';
    default: return c.unit || '';
  }
};
RD.toDisp = (ch, v) => {
  const c = RD.CH[ch]; if (!c || v == null || isNaN(v)) return v;
  const imp = RD.imp();
  switch (c.kind) {
    case 'speed': case 'dist': return imp ? v * 0.621371 : v;
    case 'temp': return imp ? v * 9 / 5 + 32 : v;
    case 'pressure': return RD.settings.pressure === 'psi' ? v * 14.5038 : RD.settings.pressure === 'kPa' ? v * 100 : v;
    case 'alt': return imp ? v * 3.28084 : v;
    case 'eco': return imp ? v * 2.35215 : v;
    default: return v;
  }
};
RD.fmtTime = (s) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(ss).padStart(2, '0'); };
RD.fmt = (ch, v, dec) => {
  const c = RD.CH[ch];
  if (c && c.kind === 'time') return RD.fmtTime(v);
  if (ch === 'gear') return RD.gearText(v);
  const d = RD.toDisp(ch, v);
  if (d == null || isNaN(d)) return '--';
  const dd = dec != null ? dec : (c ? c.dec : 0);
  return Number(d).toFixed(dd);
};
RD.gearText = (g) => g === -1 ? 'R' : (!g ? 'N' : String(Math.round(g)));
RD.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
RD.lerp = (a, b, t) => a + (b - a) * t;
RD.uid = () => Math.random().toString(36).slice(2, 9);
RD.clone = (o) => JSON.parse(JSON.stringify(o));
RD.niceStep = (range, target) => {
  const raw = range / (target || 8), p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
};

/* Simple event bus */
RD.bus = { h: {}, on(e, f) { (this.h[e] = this.h[e] || []).push(f); }, emit(e, a) { (this.h[e] || []).forEach(f => { try { f(a); } catch (er) { console.error(er); } }); } };

/* Toast */
RD.toast = (msg, ms) => {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(RD._tt); RD._tt = setTimeout(() => t.classList.remove('show'), ms || 2600);
};
