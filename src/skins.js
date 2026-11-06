/* ===== BUILT-IN SKINS ===== */
'use strict';
const W = (type, x, y, w, h, p) => Object.assign({ type, x, y, w, h }, p || {});

/* shared screens — colours use palette refs so they re-theme with every skin */
RD.tripScreen = () => ({
  name: 'Trip', widgets: [
    W('text', 40, 20, 600, 50, { text: 'TRIP COMPUTER', size: 26, align: 'left', color: '@dim', weight: '900' }),
    W('text', 840, 20, 400, 50, { text: '{clock}', size: 30, align: 'right' }),
    ...[['tripDist', 'Distance'], ['tripTime', 'Drive Time'], ['avgSpeed', 'Avg Speed'], ['maxSpeed', 'Max Speed']].map((c, i) =>
      W('digital', 40 + i * 305, 90, 290, 150, { src: c[0], label: c[1], panel: '@panel', border: '@line', dec: c[0] === 'tripDist' ? 1 : '' })),
    ...[['avgEco', 'Avg Economy'], ['tripFuel', 'Fuel Used'], ['tripCost', 'Trip Cost'], ['range', 'Range']].map((c, i) =>
      W('digital', 40 + i * 305, 255, 290, 150, { src: c[0], label: c[1], panel: '@panel', border: '@line' })),
    W('graph', 40, 420, 800, 270, { src: 'speed', min: 0, max: 160, secs: 120, panel: '@panel' }),
    W('compass', 860, 420, 380, 70, { panel: '@panel' }),
    W('digital', 860, 505, 185, 185, { src: 'altitude', panel: '@panel', border: '@line' }),
    W('digital', 1055, 505, 185, 185, { src: 'speed', label: 'Now', panel: '@panel', border: '@line' })
  ]
});
RD.gScreen = () => ({
  name: 'G-Force', widgets: [
    W('text', 40, 20, 600, 50, { text: 'PERFORMANCE', size: 26, align: 'left', color: '@dim', weight: '900' }),
    W('gmeter', 40, 90, 520, 520, { maxG: 1.2 }),
    W('digital', 600, 90, 300, 150, { src: 'accelX', label: 'Lateral', panel: '@panel', border: '@line' }),
    W('digital', 930, 90, 310, 150, { src: 'accelY', label: 'Accel / Brake', panel: '@panel', border: '@line' }),
    W('digital', 600, 255, 300, 150, { src: 'hp', label: 'Est. Power', panel: '@panel', border: '@line' }),
    W('digital', 930, 255, 310, 150, { src: 'speed', panel: '@panel', border: '@line' }),
    W('graph', 600, 420, 640, 270, { src: 'accelY', min: -1.2, max: 1.2, secs: 30, panel: '@panel', label: 'Longitudinal G' }),
    W('text', 40, 640, 520, 40, { text: 'Tip: Menu → Performance timer for 0-100 & 1/4 mile', size: 16, color: '@dim' })
  ]
});

RD.pTripScreen = () => ({
  name: 'Journey', widgets: [
    W('text', 40, 20, 600, 50, { text: 'JOURNEY', size: 26, align: 'left', color: '@dim', weight: '900' }),
    W('text', 840, 20, 400, 50, { text: '{clock}', size: 30, align: 'right' }),
    ...[['tripDist', 'Distance'], ['tripTime', 'Drive Time'], ['avgSpeed', 'Avg Speed'], ['maxSpeed', 'Top Speed']].map((c, i) =>
      W('digital', 40 + i * 305, 90, 290, 170, { src: c[0], label: c[1], panel: '@panel', border: '@line', dec: c[0] === 'tripDist' ? 1 : '' })),
    W('graph', 40, 280, 800, 410, { src: 'speed', min: 0, max: 140, secs: 300, panel: '@panel', label: 'Speed — last 5 min' }),
    W('compass', 860, 280, 380, 80, { panel: '@panel' }),
    W('digital', 860, 375, 380, 150, { src: 'altitude', panel: '@panel', border: '@line' }),
    W('digital', 860, 540, 380, 150, { src: 'speed', label: 'Now', panel: '@panel', border: '@line' })
  ]
});
RD.PASSENGER_IDS = ['pglass', 'pnight', 'pmini'];
RD.BUILTIN = [
  {
    id: 'pglass', name: 'Passenger Glass', font: 'sans', glow: true, passenger: true,
    bg: { type: 'radial', c1: '#13243d', c2: '#03060c' },
    pal: { primary: '#5ac8ff', accent: '#b388ff', warn: '#ff5c7a', text: '#ffffff', dim: '#8aa0bd', track: '#1a2a40', face: 'none', ring: '#2c4060', panel: 'rgba(30,50,80,0.4)', line: '#24364f', ghost: 'rgba(90,200,255,0.06)' },
    screens: [{
      name: 'Cruise', widgets: [
        W('text', 40, 30, 360, 80, { text: '{clock}', size: 68, align: 'left', weight: '700' }),
        W('text', 42, 108, 360, 36, { text: '{date}', size: 22, align: 'left', color: '@dim', weight: '600' }),
        W('compass', 880, 40, 360, 64, { panel: '@panel' }),
        W('radial', 390, 30, 500, 500, { src: 'speed', min: 0, max: 160, red: '', numDiv: 1, mode: 'arcOnly', start: 150, sweep: 240, face: 'none', ringW: 0, label: '', sub: '', showValue: false, arcW: 0.06 }),
        W('digital', 470, 160, 340, 230, { src: 'speed', label: '-' }),
        W('text', 470, 400, 340, 36, { text: 'SPEED', size: 18, color: '@dim', weight: '800' }),
        W('gmeter', 60, 190, 280, 280, { maxG: 1 }),
        W('digital', 950, 150, 290, 140, { src: 'altitude', panel: '@panel', border: '@line' }),
        W('digital', 950, 305, 290, 140, { src: 'heading', label: 'Heading', panel: '@panel', border: '@line' }),
        ...[['tripDist', 'Trip'], ['tripTime', 'Drive time'], ['avgSpeed', 'Average'], ['maxSpeed', 'Top speed']].map((c, i) =>
          W('digital', 40 + i * 305, 560, 290, 130, { src: c[0], label: c[1], panel: '@panel', border: '@line', dec: c[0] === 'tripDist' ? 1 : '' }))
      ]
    }, RD.pTripScreen(), RD.gScreen()]
  },
  {
    id: 'pnight', name: 'Night Cruise', font: 'seg7', glow: true, passenger: true,
    bg: { type: 'solid', c1: '#050302' },
    pal: { primary: '#ff9f1a', accent: '#ffcf70', warn: '#ff3b1a', text: '#ffb347', dim: '#7a5320', track: '#241606', face: 'none', ring: '#3a2408', panel: 'rgba(40,24,4,0.35)', line: '#3a2408', ghost: 'rgba(255,159,26,0.07)' },
    screens: [{
      name: 'Night', widgets: [
        W('digital', 330, 100, 620, 330, { src: 'speed', label: '-' }),
        W('bar', 330, 450, 620, 26, { src: 'speed', min: 0, max: 140, label: '', showValue: false, segs: 40, gap: 0.35, radius: 1, t1: 0.7, t2: 0.85 }),
        W('text', 40, 40, 400, 70, { text: '{clock}', size: 60, align: 'left', font: 'seg7' }),
        W('compass', 880, 40, 360, 64, {}),
        W('digital', 60, 540, 360, 140, { src: 'tripDist', label: 'Trip' }),
        W('digital', 460, 540, 360, 140, { src: 'tripTime', label: 'Time', showUnit: false }),
        W('digital', 860, 540, 360, 140, { src: 'altitude', label: 'Alt' })
      ]
    }, RD.pTripScreen(), RD.gScreen()]
  },
  {
    id: 'pmini', name: 'Minimal Speed', font: 'sans', glow: false, passenger: true,
    bg: { type: 'solid', c1: '#000' },
    pal: { primary: '#ffffff', accent: '#bdbdbd', warn: '#ff453a', text: '#ffffff', dim: '#6e6e6e', track: '#1c1c1c', face: 'none', ring: '#333', panel: '#0c0c0c', line: '#222', ghost: 'rgba(255,255,255,0.04)' },
    screens: [{
      name: 'Clean', widgets: [
        W('text', 40, 30, 400, 60, { text: '{clock}', size: 44, align: 'left', weight: '400' }),
        W('text', 840, 30, 400, 60, { text: '{date}', size: 24, align: 'right', color: '@dim', weight: '400' }),
        W('digital', 240, 130, 800, 400, { src: 'speed', label: '-', size: 1.1 }),
        W('digital', 140, 580, 320, 110, { src: 'tripDist', label: 'Trip' }),
        W('digital', 480, 580, 320, 110, { src: 'tripTime', label: 'Time', showUnit: false }),
        W('digital', 820, 580, 320, 110, { src: 'avgSpeed', label: 'Average' })
      ]
    }, RD.pTripScreen(), RD.gScreen()]
  },
  {
    id: 'neon', name: 'Neon Pulse', font: 'wide', glow: true,
    bg: { type: 'radial', c1: '#0c1a38', c2: '#02040a' },
    pal: { primary: '#00e5ff', accent: '#ff2bd6', warn: '#ff3b5c', text: '#eaf6ff', dim: '#6b86a8', track: '#14233a', face: 'none', ring: '#00e5ff', panel: 'rgba(20,40,80,0.35)', line: '#1d3558', ghost: 'rgba(0,229,255,0.06)' },
    screens: [{
      name: 'Drive', widgets: [
        W('shift', 340, 22, 600, 30, { n: 15, from: 3500, to: 6500 }),
        W('radial', 30, 90, 470, 470, { src: 'rpm', mode: 'both', face: 'none', ringW: 0, label: 'RPM', sub: 'x1000', arc: '@accent', needle: '@primary' }),
        W('radial', 780, 90, 470, 470, { src: 'speed', min: 0, max: 240, red: 999, mode: 'arc', numDiv: 1, face: 'none', ringW: 0, label: '', sub: '', valuePos: 'center', valueSize: 0.34, arc: '@primary' }),
        W('gear', 570, 100, 140, 160, { border: '@accent', label: 'GEAR' }),
        W('digital', 520, 280, 240, 100, { src: 'coolant', label: 'Coolant', warnHi: 108, panel: '@panel', border: '@line' }),
        W('digital', 520, 395, 240, 100, { src: 'boost', label: 'Boost', panel: '@panel', border: '@line' }),
        W('digital', 520, 510, 240, 100, { src: 'volt', label: 'Battery', warnLo: 11.8, panel: '@panel', border: '@line' }),
        W('bar', 60, 600, 400, 70, { src: 'fuel', min: 0, max: 100, label: 'FUEL', segs: 20, c1: '@warn', c2: '@primary', c3: '@primary', t1: 0.15, t2: 0.15 }),
        W('bar', 820, 600, 400, 70, { src: 'throttle', min: 0, max: 100, label: 'THROTTLE', segs: 20, c1: '@primary', c2: '@accent', c3: '@accent' }),
        W('text', 520, 640, 240, 40, { text: '{clock}', size: 30 })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  },
  {
    id: 'classic', name: 'Classic Chrome', font: 'sans', glow: false,
    bg: { type: 'grad', c1: '#1e1e1e', c2: '#070707' },
    pal: { primary: '#ff9d00', accent: '#ffd36b', warn: '#e3262b', text: '#f4f4f4', dim: '#9a9a9a', track: '#2a2a2a', face: '#1d1d1d', ring: '#d0d0d0', panel: '#151515', line: '#333', ghost: 'rgba(255,255,255,0.05)' },
    screens: [{
      name: 'Analog', widgets: [
        W('radial', 30, 100, 520, 520, { src: 'rpm', mode: 'needle', ringW: 0.05, label: 'RPM', sub: 'x1000', needle: '@primary', valueSize: 0.16 }),
        W('radial', 730, 100, 520, 520, { src: 'speed', min: 0, max: 240, red: 999, mode: 'needle', numDiv: 1, ringW: 0.05, label: '{unit}', sub: '', needle: '@primary', valueSize: 0.16 }),
        W('gear', 570, 130, 140, 130, { border: '@ring', label: '', panel: '#111' }),
        W('bar', 572, 290, 58, 280, { src: 'coolant', orient: 'v', label: 'TEMP', segs: 0, radius: 6, c1: '#3d8bff', c2: '@primary', c3: '@warn', t1: 0.4 }),
        W('bar', 650, 290, 58, 280, { src: 'fuel', min: 0, max: 100, orient: 'v', label: 'FUEL', segs: 0, radius: 6, c1: '@warn', c2: '@primary', c3: '@primary', t1: 0.2 }),
        W('lamp', 470, 640, 110, 56, { src: 'coolant', op: '>', val: 108, icon: '⚠', label: 'TEMP' }),
        W('lamp', 590, 640, 110, 56, { src: 'volt', op: '<', val: 11.8, icon: '', label: 'BATT' }),
        W('lamp', 710, 640, 110, 56, { src: 'fuel', op: '<', val: 10, icon: '', label: 'FUEL', on: '#ffb000' }),
        W('text', 30, 30, 300, 40, { text: '{clock}', size: 28, align: 'left', color: '@dim' }),
        W('text', 950, 30, 300, 40, { text: 'TRIP {tripDist} {tripDist:u}', size: 22, align: 'right', color: '@dim', font: 'mono' })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  },
  {
    id: 'track', name: 'Track Day', font: 'wide', glow: false,
    bg: { type: 'solid', c1: '#000' },
    pal: { primary: '#ffd60a', accent: '#ff8a00', warn: '#ff2d2d', text: '#ffffff', dim: '#8a8a8a', track: '#1e1e1e', face: 'none', ring: '#444', panel: '#0f0f0f', line: '#2c2c2c', ghost: 'rgba(255,255,255,0.05)' },
    screens: [{
      name: 'Race', widgets: [
        W('shift', 20, 12, 1240, 44, { n: 20, shape: 'bar', from: 4500, to: 6500 }),
        W('bar', 20, 66, 1240, 80, { src: 'rpm', label: '', showValue: false, segs: 48, gap: 0.3, radius: 2, t1: 0.7, t2: 0.85, c1: '#ffffff', c2: '@primary', c3: '@warn' }),
        W('gear', 470, 165, 340, 380, { border: '@primary', label: '', radius: 24 }),
        W('digital', 20, 165, 430, 200, { src: 'speed', label: 'Speed', panel: '@panel', border: '@line' }),
        W('digital', 20, 380, 430, 165, { src: 'rpm', label: 'RPM', panel: '@panel', border: '@line' }),
        W('digital', 830, 165, 210, 185, { src: 'coolant', label: 'Water', warnHi: 108, panel: '@panel', border: '@line' }),
        W('digital', 1050, 165, 210, 185, { src: 'oiltemp', label: 'Oil', warnHi: 130, panel: '@panel', border: '@line' }),
        W('digital', 830, 360, 210, 185, { src: 'boost', label: 'Boost', panel: '@panel', border: '@line' }),
        W('digital', 1050, 360, 210, 185, { src: 'volt', label: 'Volts', warnLo: 11.8, panel: '@panel', border: '@line' }),
        W('bar', 20, 570, 600, 60, { src: 'throttle', min: 0, max: 100, label: 'THROTTLE', segs: 0, c1: '#2bd96b', c2: '#2bd96b', c3: '#2bd96b' }),
        W('bar', 660, 570, 600, 60, { src: 'load', min: 0, max: 100, label: 'LOAD', segs: 0 }),
        W('text', 20, 660, 600, 44, { text: 'TIME {tripTime}', size: 26, align: 'left', color: '@dim', font: 'mono' }),
        W('text', 660, 660, 600, 44, { text: 'MAX {maxSpeed} {maxSpeed:u}', size: 26, align: 'right', color: '@dim', font: 'mono' })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  },
  {
    id: 'mono', name: 'Minimal Mono', font: 'sans', glow: false,
    bg: { type: 'solid', c1: '#000' },
    pal: { primary: '#ffffff', accent: '#bdbdbd', warn: '#ff453a', text: '#ffffff', dim: '#6e6e6e', track: '#1c1c1c', face: 'none', ring: '#333', panel: '#0c0c0c', line: '#222', ghost: 'rgba(255,255,255,0.04)' },
    screens: [{
      name: 'Clean', widgets: [
        W('text', 40, 30, 300, 50, { text: '{clock}', size: 34, align: 'left', weight: '400' }),
        W('text', 940, 30, 300, 50, { text: '{tripDist} {tripDist:u}', size: 28, align: 'right', color: '@dim', weight: '400' }),
        W('digital', 290, 120, 700, 350, { src: 'speed', label: '-', size: 1.1 }),
        W('bar', 340, 480, 600, 12, { src: 'rpm', label: '', showValue: false, segs: 0, radius: 6, c1: '#fff', c2: '#fff', c3: '@warn', t1: 0.8 }),
        W('gear', 590, 505, 100, 100, { shape: 'none', label: '', color: '@dim' }),
        W('digital', 60, 610, 270, 90, { src: 'coolant', label: 'Temp', warnHi: 108 }),
        W('digital', 350, 610, 270, 90, { src: 'fuel', label: 'Fuel', warnLo: 10 }),
        W('digital', 660, 610, 270, 90, { src: 'range', label: 'Range' }),
        W('digital', 950, 610, 270, 90, { src: 'eco', label: 'Economy' })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  },
  {
    id: 'synth', name: "Synthwave '84", font: 'seg7', glow: true,
    bg: { type: 'synth', c1: '#2b0a4a', c2: '#07020f' },
    pal: { primary: '#ff2fb9', accent: '#29e0ff', warn: '#ffde00', text: '#ffe9fb', dim: '#b48bd6', track: 'rgba(80,30,120,0.6)', face: 'none', ring: '#ff2fb9', panel: 'rgba(30,8,55,0.65)', line: '#5b2a8a', ghost: 'rgba(255,47,185,0.07)' },
    screens: [{
      name: 'Retro', widgets: [
        W('radial', 290, 30, 700, 700, { src: 'rpm', mode: 'arcOnly', start: 160, sweep: 220, face: 'none', ringW: 0, label: '', sub: '', showValue: false, arc: '@primary', arcW: 0.08 }),
        W('digital', 440, 170, 400, 210, { src: 'speed', label: '-', color: '@accent' }),
        W('gear', 575, 390, 130, 140, { shape: 'none', label: '', color: '@primary' }),
        W('digital', 30, 60, 250, 120, { src: 'rpm', label: 'RPM', panel: '@panel', border: '@line', dec: 0 }),
        W('digital', 30, 195, 250, 120, { src: 'boost', label: 'Boost', panel: '@panel', border: '@line' }),
        W('digital', 1000, 60, 250, 120, { src: 'coolant', label: 'Temp', warnHi: 108, panel: '@panel', border: '@line' }),
        W('digital', 1000, 195, 250, 120, { src: 'volt', label: 'Volts', panel: '@panel', border: '@line' }),
        W('bar', 40, 640, 420, 56, { src: 'fuel', min: 0, max: 100, label: 'FUEL', segs: 16, c1: '@warn', c2: '@accent', c3: '@accent', t1: 0.15, t2: 0.15 }),
        W('bar', 820, 640, 420, 56, { src: 'throttle', min: 0, max: 100, label: 'GAS', segs: 16, c1: '@accent', c2: '@primary', c3: '@primary' }),
        W('text', 490, 650, 300, 46, { text: '{clock}', size: 44, font: 'seg7', color: '@primary' })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  },
  {
    id: 'cockpit', name: 'Glass Cockpit', font: 'cond', glow: true,
    bg: { type: 'grad', c1: '#101a27', c2: '#04070b' },
    pal: { primary: '#4fc3ff', accent: '#9ef01a', warn: '#ff4d4d', text: '#ffffff', dim: '#7f8ea3', track: '#1b2533', face: 'none', ring: '#3a4a60', panel: 'rgba(25,38,56,0.55)', line: '#26364c', ghost: 'rgba(79,195,255,0.06)' },
    screens: [{
      name: 'Cockpit', widgets: [
        W('radial', 15, 150, 420, 420, { src: 'speed', min: 0, max: 240, red: 999, numDiv: 1, mode: 'arc', arcW: 0.05, face: 'none', ringW: 0, label: '', sub: '', valuePos: 'center', valueSize: 0.36 }),
        W('radial', 845, 150, 420, 420, { src: 'rpm', mode: 'arc', arcW: 0.05, face: 'none', ringW: 0, label: 'RPM', sub: 'x1000', valuePos: 'center', valueSize: 0.26, arc: '@accent' }),
        W('panel', 445, 40, 390, 640, { fill: '@panel', stroke: '@line', radius: 24 }),
        W('text', 465, 70, 350, 40, { text: '{date}  ·  {clock}', size: 24, color: '@dim' }),
        W('compass', 465, 110, 350, 60, {}),
        W('gear', 580, 185, 120, 120, { shape: 'circle', border: '@primary', label: '' }),
        W('graph', 460, 320, 360, 160, { src: 'speed', min: 0, max: 160, secs: 90 }),
        W('digital', 460, 495, 115, 90, { src: 'range', label: 'Range', showUnit: false }),
        W('digital', 582, 495, 115, 90, { src: 'eco', label: 'Eco', showUnit: false }),
        W('digital', 704, 495, 115, 90, { src: 'coolant', label: 'Temp', showUnit: false, warnHi: 108 }),
        W('bar', 470, 605, 340, 50, { src: 'fuel', min: 0, max: 100, label: 'FUEL', segs: 0, radius: 8, c1: '@warn', c2: '@primary', c3: '@primary', t1: 0.2 })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  },
  {
    id: 'amber', name: 'Night Amber', font: 'seg7', glow: true,
    bg: { type: 'solid', c1: '#070300' },
    pal: { primary: '#ffb000', accent: '#ff8000', warn: '#ff3000', text: '#ffb000', dim: '#8a5a00', track: '#2a1a00', face: 'none', ring: '#3a2500', panel: 'rgba(40,24,0,0.35)', line: '#3a2500', ghost: 'rgba(255,176,0,0.08)' },
    screens: [{
      name: 'LCD', widgets: [
        W('bar', 60, 50, 1160, 70, { src: 'rpm', label: '', showValue: false, segs: 50, gap: 0.35, radius: 1, t1: 0.75, t2: 0.82, c1: '@primary', c2: '@primary', c3: '@warn' }),
        W('text', 60, 135, 400, 30, { text: 'x1000 RPM   1   2   3   4   5   6   7   8', size: 16, align: 'left', color: '@dim', font: 'mono' }),
        W('digital', 400, 170, 520, 290, { src: 'speed', label: '-', color: '@primary' }),
        W('gear', 180, 220, 170, 200, { shape: 'box', border: '@line', label: 'GEAR' }),
        W('bar', 60, 200, 70, 400, { src: 'fuel', min: 0, max: 100, orient: 'v', label: 'F', segs: 12, c1: '@warn', c2: '@primary', c3: '@primary', t1: 0.17, t2: 0.17 }),
        W('bar', 1150, 200, 70, 400, { src: 'coolant', orient: 'v', label: 'T', segs: 12, c1: '@primary', c2: '@primary', c3: '@warn', t1: 0.5, t2: 0.75 }),
        W('digital', 940, 220, 190, 110, { src: 'volt', label: 'Volt' }),
        W('digital', 940, 340, 190, 110, { src: 'eco', label: 'Eco' }),
        W('digital', 180, 500, 300, 110, { src: 'tripDist', label: 'Trip' }),
        W('digital', 500, 500, 280, 110, { src: 'range', label: 'Range' }),
        W('digital', 800, 500, 330, 110, { src: 'tripTime', label: 'Time', showUnit: false }),
        W('text', 490, 640, 300, 50, { text: '{clock}', size: 44, font: 'seg7', color: '@primary' })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  },
  {
    id: 'eco', name: 'Eco Drive', font: 'sans', glow: false,
    bg: { type: 'radial', c1: '#0a3326', c2: '#020b08' },
    pal: { primary: '#2ee59d', accent: '#ffd166', warn: '#ef476f', text: '#eafff5', dim: '#6fa58f', track: '#123026', face: 'none', ring: '#1f5a45', panel: 'rgba(10,50,36,0.5)', line: '#1d4a3a', ghost: 'rgba(46,229,157,0.06)' },
    screens: [{
      name: 'Eco', widgets: [
        W('radial', 420, 60, 440, 440, { src: 'eco', min: 0, max: 30, red: '', numDiv: 1, mode: 'arc', start: 150, sweep: 240, face: 'none', ringW: 0, label: 'INSTANT', sub: '', valuePos: 'center', valueSize: 0.3, arc: '@primary' }),
        W('digital', 40, 60, 340, 200, { src: 'speed', panel: '@panel', border: '@line' }),
        W('digital', 40, 275, 340, 130, { src: 'fuelRate', panel: '@panel', border: '@line' }),
        W('bar', 50, 430, 320, 60, { src: 'load', min: 0, max: 100, label: 'ENGINE LOAD', segs: 12, c1: '@primary', c2: '@accent', c3: '@warn' }),
        W('digital', 900, 60, 340, 140, { src: 'avgEco', panel: '@panel', border: '@line' }),
        W('digital', 900, 215, 340, 140, { src: 'range', panel: '@panel', border: '@line' }),
        W('digital', 900, 370, 165, 120, { src: 'tripFuel', label: 'Used', panel: '@panel', border: '@line' }),
        W('digital', 1075, 370, 165, 120, { src: 'tripCost', label: 'Cost', panel: '@panel', border: '@line' }),
        W('graph', 40, 515, 820, 180, { src: 'fuelRate', min: 0, max: 20, secs: 120, panel: '@panel' }),
        W('gear', 900, 515, 160, 180, { border: '@primary', label: 'GEAR' }),
        W('text', 1075, 560, 165, 40, { text: '{clock}', size: 34 }),
        W('text', 1075, 620, 165, 40, { text: '{tripDist} {tripDist:u}', size: 22, color: '@dim' })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  },
  {
    id: 'diag', name: 'Data Engineer', font: 'mono', glow: false,
    bg: { type: 'grid', c1: '#0d1117', c2: '#0d1117' },
    pal: { primary: '#7cffcb', accent: '#ffd400', warn: '#ff5c5c', text: '#e6edf3', dim: '#7d8590', track: '#21262d', face: 'none', ring: '#30363d', panel: '#161b22', line: '#30363d', ghost: 'rgba(124,255,203,0.05)' },
    screens: [{
      name: 'Engine', widgets: [
        ...['rpm', 'speed', 'coolant', 'intake', 'oiltemp', 'load', 'throttle', 'maf', 'map', 'boost', 'timing', 'volt'].map((c, i) =>
          W('digital', 20 + (i % 4) * 315, 20 + Math.floor(i / 4) * 165, 300, 150, { src: c, panel: '@panel', border: '@line', align: 'left', warnHi: c === 'coolant' ? 108 : '' })),
        W('graph', 20, 520, 620, 185, { src: 'rpm', min: 0, max: 8000, secs: 60, panel: '@panel' }),
        W('graph', 655, 520, 605, 185, { src: 'speed', min: 0, max: 200, secs: 60, panel: '@panel', line: '@accent' })
      ]
    }, {
      name: 'More', widgets: [
        ...['afr', 'fuel', 'fuelRate', 'eco', 'ambient', 'altitude', 'gpsAcc', 'heading'].map((c, i) =>
          W('digital', 20 + (i % 4) * 315, 20 + Math.floor(i / 4) * 165, 300, 150, { src: c, panel: '@panel', border: '@line', align: 'left' })),
        W('graph', 20, 355, 620, 170, { src: 'coolant', min: 40, max: 130, secs: 300, panel: '@panel', line: '@warn' }),
        W('graph', 655, 355, 605, 170, { src: 'boost', min: -1, max: 1.5, secs: 60, panel: '@panel', line: '@accent' }),
        W('graph', 20, 540, 620, 165, { src: 'throttle', min: 0, max: 100, secs: 60, panel: '@panel' }),
        W('digital', 655, 540, 300, 165, { src: 'dtcCount', panel: '@panel', border: '@line', align: 'left', warnHi: 0 }),
        W('digital', 970, 540, 290, 165, { src: 'hp', panel: '@panel', border: '@line', align: 'left' })
      ]
    }, RD.gScreen()]
  },
  {
    id: 'carbon', name: 'Carbon Sport', font: 'wide', glow: true,
    bg: { type: 'carbon', c1: '#161616', c2: '#0a0a0a' },
    pal: { primary: '#ff1e1e', accent: '#ffffff', warn: '#ff1e1e', text: '#ffffff', dim: '#9a9a9a', track: '#2b2b2b', face: '#151515', ring: '#4a4a4a', panel: 'rgba(0,0,0,0.55)', line: '#333', ghost: 'rgba(255,255,255,0.05)' },
    screens: [{
      name: 'Sport', widgets: [
        W('radial', 370, 20, 540, 540, { src: 'rpm', mode: 'both', start: 150, sweep: 240, ringW: 0.035, label: '', sub: 'x1000 rpm', showValue: false, arc: '@primary', needle: '@accent', arcW: 0.06 }),
        W('digital', 500, 215, 280, 140, { src: 'speed', label: '-' }),
        W('gear', 590, 370, 100, 110, { shape: 'none', label: '', color: '@primary' }),
        W('radial', 40, 150, 300, 300, { src: 'coolant', red: 110, numDiv: 1, mode: 'arc', label: 'WATER', sub: '', valuePos: 'center', valueSize: 0.26, ringW: 0.03, arc: '@accent' }),
        W('radial', 940, 150, 300, 300, { src: 'boost', red: 1.2, numDiv: 1, mode: 'arc', label: 'BOOST', sub: '', valuePos: 'center', valueSize: 0.26, ringW: 0.03, arc: '@accent' }),
        W('shift', 440, 570, 400, 30, { n: 10, from: 4500, to: 6500, shape: 'rect' }),
        W('bar', 60, 620, 480, 60, { src: 'fuel', min: 0, max: 100, label: 'FUEL', segs: 24, c1: '@primary', c2: '#fff', c3: '#fff', t1: 0.15, t2: 0.15 }),
        W('bar', 740, 620, 480, 60, { src: 'oiltemp', label: 'OIL', segs: 24, c1: '#fff', c2: '#fff', c3: '@primary', t1: 0.7, t2: 0.8 }),
        W('text', 40, 40, 300, 40, { text: '{clock}', size: 28, align: 'left', color: '@dim' }),
        W('text', 940, 40, 300, 40, { text: '{tripDist} {tripDist:u}', size: 24, align: 'right', color: '@dim' })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  },
  {
    id: 'day', name: 'Daylight', font: 'sans', glow: false,
    bg: { type: 'grad', c1: '#f1f4f8', c2: '#dce2ea' },
    pal: { primary: '#0a63ff', accent: '#00a37a', warn: '#e01e37', text: '#0e1116', dim: '#5b6573', track: '#d3dae3', face: 'none', ring: '#9aa5b4', panel: '#ffffff', line: '#d3dae3', ghost: 'rgba(0,0,0,0.05)' },
    screens: [{
      name: 'Day', widgets: [
        W('panel', 30, 30, 600, 470, { fill: '@panel', stroke: '@line', radius: 28 }),
        W('panel', 650, 30, 600, 470, { fill: '@panel', stroke: '@line', radius: 28 }),
        W('radial', 105, 50, 450, 450, { src: 'speed', min: 0, max: 200, red: 999, numDiv: 1, mode: 'arc', label: '', sub: '', valuePos: 'center', valueSize: 0.34, ringW: 0, arcW: 0.07 }),
        W('radial', 725, 50, 450, 450, { src: 'rpm', mode: 'arc', label: 'RPM', sub: 'x1000', valuePos: 'center', valueSize: 0.24, ringW: 0, arcW: 0.07, arc: '@accent' }),
        W('digital', 30, 520, 290, 170, { src: 'coolant', panel: '@panel', border: '@line', warnHi: 108 }),
        W('digital', 340, 520, 290, 170, { src: 'fuel', panel: '@panel', border: '@line', warnLo: 10 }),
        W('digital', 650, 520, 290, 170, { src: 'range', panel: '@panel', border: '@line' }),
        W('panel', 960, 520, 290, 170, { fill: '@panel', stroke: '@line', radius: 10 }),
        W('text', 960, 570, 290, 60, { text: '{clock}', size: 54, weight: '700' }),
        W('text', 960, 640, 290, 30, { text: '{date}', size: 20, color: '@dim' }),
        W('gear', 290, 400, 80, 80, { shape: 'none', label: '', color: '@dim' })
      ]
    }, RD.tripScreen(), RD.gScreen()]
  }
];

/* normalise skin: fill widget defaults, ids */
RD.normSkin = (s) => {
  s.screens.forEach(sc => sc.widgets.forEach(w => {
    const t = RD.WT[w.type]; if (!t) return;
    const ch = RD.CH[w.src];
    if (ch && w.src !== t.def.src && w.type !== 'shift' && w.type !== 'lamp') {
      if (w.min == null) w.min = ch.min; if (w.max == null) w.max = ch.max;
      if (w.type === 'radial') { if (w.numDiv == null) w.numDiv = w.src === 'rpm' ? 1000 : 1; if (w.red == null) w.red = w.src === 'rpm' ? RD.settings.redline : ''; }
    }
    const full = Object.assign({}, t.def, w); Object.assign(w, full);
    if (!w.id) w.id = RD.uid(); w._v = w._v || 0;
  }));
  s.pal = Object.assign({ primary: '#0ff', accent: '#f0f', warn: '#f33', text: '#fff', dim: '#888', track: '#222', face: 'none', ring: '#555', panel: 'rgba(0,0,0,.4)', line: '#333', ghost: 'rgba(255,255,255,.05)' }, s.pal);
  return s;
};
RD.BUILTIN.forEach(RD.normSkin);
RD.userSkins = (RD.store.get('skins', []) || []).map(RD.normSkin);
RD.allSkins = () => RD.BUILTIN.concat(RD.userSkins);
RD.skinById = (id) => RD.allSkins().find(s => s.id === id) || RD.BUILTIN[0];
RD.saveUserSkins = () => {
  const ok = RD.store.set('skins', RD.userSkins.map(s => { const c = RD.clone(s); c.screens.forEach(sc => sc.widgets.forEach(w => delete w._v)); return c; }));
  if (!ok) RD.toast('Storage full — export your skins and remove large images');
};
