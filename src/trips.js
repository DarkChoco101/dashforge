/* ===== TRIP LOGGER: auto start/end, GPS track, speed log, overspeed ===== */
'use strict';
RD.defaults.autoTrip = true; RD.defaults.speedLimit = 80;
if (RD.settings.autoTrip == null) RD.settings.autoTrip = true;
if (RD.settings.speedLimit == null) RD.settings.speedLimit = 80;

RD.Trips = {
  cur: null, list: RD.store.get('trips', []), movingFor: 0, stopFor: 0, simPos: [12.9716, 77.5946], ptT: 0, spT: 0, over: false,
  pos() {
    if (RD.settings.source === 'sim') return this.simPos;
    const l = RD.GPS.last; if (!l || Date.now() - (RD.gpsTime || 0) > 5000) return null; return [l.lat, l.lon];
  },
  start(manual) {
    if (this.cur) return;
    this.cur = { id: RD.uid(), start: Date.now(), end: 0, dist: 0, max: 0, moving: 0, over: 0, fuel: 0, pts: [], spd: [], src: RD.settings.source, manual: !!manual };
    this.stopFor = 0; RD.bus.emit('trip');
    RD.toast(manual ? 'Trip started' : 'Driving detected — trip recording started');
  },
  end(reason) {
    const c = this.cur; if (!c) return; this.cur = null; c.end = Date.now();
    RD.bus.emit('trip');
    if (c.dist < 0.1 && !c.manual) return;
    c.avg = c.moving > 0 ? c.dist / (c.moving / 3600) : 0;
    this.list.unshift(c); this.list = this.list.slice(0, 60);
    if (!this.save()) { this.list.forEach((t, i) => { if (i > 10) t.pts = t.pts.filter((_, k) => k % 3 === 0); }); this.save(); }
    RD.toast('Trip saved: ' + RD.fmt('tripDist', c.dist) + ' ' + RD.unitFor('tripDist') + (reason ? ' (' + reason + ')' : ''));
  },
  save() { return RD.store.set('trips', this.list); },
  remove(id) { this.list = this.list.filter(t => t.id !== id); this.save(); },
  tick(dt) {
    const s = RD.data.speed;
    if (RD.settings.source === 'sim') {
      const h = RD.data.heading * D2R, m = s / 3.6 * dt;
      this.simPos = [this.simPos[0] + Math.cos(h) * m / 111320, this.simPos[1] + Math.sin(h) * m / (111320 * Math.cos(this.simPos[0] * D2R))];
    }
    if (!this.cur) {
      if (!RD.settings.autoTrip) return;
      this.movingFor = s > 8 ? this.movingFor + dt : 0;
      if (this.movingFor > 15) { this.start(false); this.movingFor = 0; }
      return;
    }
    const c = this.cur;
    c.dist += s / 3600 * dt; if (s > 2) c.moving += dt; if (s > c.max) c.max = s; c.fuel += (RD.data.fuelRate || 0) / 3600 * dt;
    const lim = RD.settings.speedLimit;
    if (lim > 0) { const sd = RD.toDisp('speed', s); if (sd > lim && !this.over) { this.over = true; c.over++; } else if (sd < lim - 3) this.over = false; }
    this.ptT += dt; this.spT += dt;
    if (this.spT >= 2) { this.spT = 0; c.spd.push(Math.round(s)); if (c.spd.length > 5400) c.spd = c.spd.filter((_, i) => i % 2 === 0); }
    if (this.ptT >= 3) {
      this.ptT = 0; const p = this.pos();
      if (p) {
        const last = c.pts[c.pts.length - 1];
        if (!last || RD.haversine(last[0], last[1], p[0], p[1]) > 15) c.pts.push([+p[0].toFixed(5), +p[1].toFixed(5), Math.round(s)]);
        if (c.pts.length > 3000) c.pts = c.pts.filter((_, i) => i % 2 === 0);
      }
    }
    if (!c.manual) { this.stopFor = s < 2 ? this.stopFor + dt : 0; if (this.stopFor > 180) this.end('parked'); }
  },
  gpx(t) {
    const pts = t.pts.map((p, i) => `<trkpt lat="${p[0]}" lon="${p[1]}"><time>${new Date(t.start + (t.end - t.start) * i / Math.max(1, t.pts.length - 1)).toISOString()}</time></trkpt>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="DashForge" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>Trip ${new Date(t.start).toLocaleString()}</name><trkseg>\n${pts}\n</trkseg></trk></gpx>`;
  }
};

/* draw a trip route (with optional OSM tiles) into a canvas */
RD.drawRoute = (cv, t, skinPal) => {
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  ctx.fillStyle = '#0d1420'; ctx.fillRect(0, 0, W, H);
  if (!t.pts.length) { ctx.fillStyle = '#8899aa'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('No GPS points recorded for this trip', W / 2, H / 2); return; }
  let la0 = 90, la1 = -90, lo0 = 180, lo1 = -180;
  t.pts.forEach(p => { la0 = Math.min(la0, p[0]); la1 = Math.max(la1, p[0]); lo0 = Math.min(lo0, p[1]); lo1 = Math.max(lo1, p[1]); });
  const mx = (lon, z) => (lon + 180) / 360 * 256 * Math.pow(2, z);
  const my = (lat, z) => { const s = Math.sin(lat * D2R); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * Math.pow(2, z); };
  let z = 17; while (z > 2 && (mx(lo1, z) - mx(lo0, z) > W * 0.85 || my(la0, z) - my(la1, z) > H * 0.85)) z--;
  const cx = (mx(lo0, z) + mx(lo1, z)) / 2, cy = (my(la0, z) + my(la1, z)) / 2, ox = cx - W / 2, oy = cy - H / 2;
  const drawLine = () => {
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < t.pts.length; i++) {
      const a = t.pts[i - 1], b = t.pts[i], sp = b[2];
      ctx.strokeStyle = sp > RD.settings.speedLimit / (RD.imp() ? 0.621 : 1) ? '#ff3b5c' : sp > 50 ? '#ffd166' : '#2ee59d';
      ctx.beginPath(); ctx.moveTo(mx(a[1], z) - ox, my(a[0], z) - oy); ctx.lineTo(mx(b[1], z) - ox, my(b[0], z) - oy); ctx.stroke();
    }
    const s = t.pts[0], e = t.pts[t.pts.length - 1];
    [[s, '#2ee59d', 'S'], [e, '#ff3b5c', 'E']].forEach(([p, c, l]) => {
      const x = mx(p[1], z) - ox, y = my(p[0], z) - oy; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#000'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(l, x, y);
    });
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(W - 150, H - 18, 150, 18); ctx.fillStyle = '#ccc'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('© OpenStreetMap contributors', W - 4, H - 8);
  };
  drawLine();
  if (!navigator.onLine) return;
  const tiles = []; const n = Math.pow(2, z);
  for (let tx = Math.floor(ox / 256); tx <= Math.floor((ox + W) / 256); tx++) for (let ty = Math.floor(oy / 256); ty <= Math.floor((oy + H) / 256); ty++) if (ty >= 0 && ty < n) tiles.push([tx, ty]);
  let loaded = 0, imgs = [];
  tiles.forEach(([tx, ty]) => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = im.onerror = () => {
      loaded++; if (loaded < tiles.length) return;
      ctx.fillStyle = '#0d1420'; ctx.fillRect(0, 0, W, H);
      imgs.forEach(o => { if (o.im.naturalWidth) { ctx.globalAlpha = 0.75; ctx.drawImage(o.im, o.tx * 256 - ox, o.ty * 256 - oy); ctx.globalAlpha = 1; } });
      ctx.fillStyle = 'rgba(5,10,20,.35)'; ctx.fillRect(0, 0, W, H); drawLine();
    };
    im.src = `https://tile.openstreetmap.org/${z}/${((tx % n) + n) % n}/${ty}.png`; imgs.push({ im, tx, ty });
  });
};
