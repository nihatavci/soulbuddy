// Bake the Paperwhite icon set: wobble clean 24x24 glyphs into hand-drawn path data.
//
// Why offline: react-native-svg can't measure path geometry at runtime, so we sample
// + perturb here (Node, via svg-path-properties) and ship static paths. Deterministic
// per glyph (seeded), periodic noise (integer frequencies) so closed shapes seam cleanly.
//
// Run:  node scripts/bake-icons.mjs   (regenerates components/icons/paperwhite.generated.ts)
import { svgPathProperties } from 'svg-path-properties';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const AMP = 0.5;          // wobble amplitude in 24-unit space
const STEP = 1.1;         // sample spacing
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── primitive helpers → everything becomes a path 'd' so sampling is uniform ──
const circleD = (cx, cy, r) =>
  `M${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const rrD = (x, y, w, h, rx) => {
  const r = Math.min(rx, w / 2, h / 2);
  return `M${x + r} ${y} h${w - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - 2 * r} a${r} ${r} 0 0 1 ${-r} ${r} h${-(w - 2 * r)} a${r} ${r} 0 0 1 ${-r} ${-r} v${-(h - 2 * r)} a${r} ${r} 0 0 1 ${r} ${-r} Z`;
};

// ── canonical base glyphs (clean geometry). p=path, c=circle, r=rrect, dot=filled ──
const BASE = {
  // designed Paperwhite (19)
  back: [['p', 'M14 5l-7 7 7 7'], ['p', 'M7.5 12H20']],
  close: [['p', 'M6 6l12 12'], ['p', 'M18 6L6 18']],
  add: [['p', 'M12 5.2v13.6'], ['p', 'M5.3 12h13.4']],
  write: [['p', 'M4 20l1-4L16 5a2 2 0 012.8 2.8L8 18.8 4 20z'], ['p', 'M14 7l3 3']],
  lock: [['r', 5, 10.5, 14, 9.5, 2.4], ['p', 'M8 10.5V7.6a4 4 0 018 0v2.9']],
  shield: [['p', 'M12 3.5l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9v-5l7-3z']],
  person: [['c', 12, 8, 3.6], ['p', 'M5 19.5a7 7 0 0114 0']],
  hide: [['p', 'M4 12s3.4-6.2 8-6.2c1.4 0 2.6.3 3.7.9M20 12s-1.2 2.2-3.3 3.9M9.4 9.7A3 3 0 0014.5 14M4.5 4.5l15 15']],
  settings: [['p', 'M4 8h9'], ['p', 'M17 8h3'], ['p', 'M4 16h3'], ['p', 'M11 16h9'], ['c', 15, 8, 2.2], ['c', 9, 16, 2.2]],
  notify: [['p', 'M6 10a6 6 0 0112 0c0 5 1.5 6.5 1.5 6.5H4.5S6 15 6 10z'], ['p', 'M10 19.5a2 2 0 004 0']],
  chat: [['p', 'M4.5 6h15v9H9l-4 3 .3-3H4.5z']],
  resonance: [['dot', 5, 12, 1.8], ['p', 'M10 12c4-3.2 7 3.2 11 0']],
  send: [['p', 'M4.5 12l15-7.5-5.5 15-2.8-5.7L4.5 12z']],
  report: [['p', 'M5 3.5v17'], ['p', 'M5 4.5h11l-2.2 3.8L16 12H5']],
  block: [['c', 12, 12, 8.2], ['p', 'M6.4 6.4l11.2 11.2']],
  near: [['p', 'M12 21s-6.5-5.8-6.5-10.2A6.5 6.5 0 0112 4.3a6.5 6.5 0 016.5 6.5C18.5 15.2 12 21 12 21z'], ['c', 12, 10.6, 2.3]],
  'age-range': [['p', 'M4 12h16'], ['p', 'M4 12l3.5-3.5'], ['p', 'M4 12l3.5 3.5'], ['p', 'M20 12l-3.5-3.5'], ['p', 'M20 12l-3.5 3.5']],
  intent: [['c', 8.5, 12, 4.3], ['c', 15.5, 12, 4.3]],
  confirm: [['p', 'M5 12.5l4.5 4.5L19 7']],

  // long-tail glyphs, drawn in the same style (19)
  zap: [['p', 'M13 2L3 14h7l-1 8 10-12h-7l1-8z']],
  cpu: [['r', 5, 5, 14, 14, 2], ['r', 9.5, 9.5, 5, 5, 1],
    ['p', 'M9 2v3'], ['p', 'M15 2v3'], ['p', 'M9 19v3'], ['p', 'M15 19v3'],
    ['p', 'M2 9h3'], ['p', 'M2 15h3'], ['p', 'M19 9h3'], ['p', 'M19 15h3']],
  'chevron-left': [['p', 'M15 6l-6 6 6 6']],
  'chevron-right': [['p', 'M9 6l6 6-6 6']],
  trash: [['p', 'M4 7h16'], ['p', 'M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2'],
    ['p', 'M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13'], ['p', 'M10 11v6'], ['p', 'M14 11v6']],
  star: [['p', 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 20.6l1-5.8L3.5 9.7l5.9-.9z']],
  eye: [['p', 'M3 12s3.4-6.2 9-6.2 9 6.2 9 6.2-3.4 6.2-9 6.2-9-6.2-9-6.2z'], ['c', 12, 12, 2.8]],
  reply: [['p', 'M9 14L4 9l5-5'], ['p', 'M4 9h11a4 4 0 014 4v6']],
  'bar-chart': [['p', 'M4 20h16'], ['p', 'M8 20v-6'], ['p', 'M12 20v-10'], ['p', 'M16 20v-4']],
  'alert-triangle': [['p', 'M12 3.5L21.5 20H2.5z'], ['p', 'M12 10v4.5'], ['dot', 12, 17.5, 0.95]],
  activity: [['p', 'M3 12h4l2.6 7 4-14 2.6 7h4.8']],
  pause: [['p', 'M9 5v14'], ['p', 'M15 5v14']],
  grid: [['r', 4, 4, 7, 7, 1.5], ['r', 13, 4, 7, 7, 1.5], ['r', 4, 13, 7, 7, 1.5], ['r', 13, 13, 7, 7, 1.5]],
  heart: [['p', 'M12 20.5C6 16 3.5 12.6 3.5 9A4.5 4.5 0 0112 7a4.5 4.5 0 018.5 2c0 3.6-2.5 7-8.5 11.5z']],
  'check-circle': [['c', 12, 12, 8.4], ['p', 'M8.4 12.2l2.5 2.5 4.7-5']],
  'arrow-right': [['p', 'M4 12h15'], ['p', 'M13 6l6 6-6 6']],
  clock: [['c', 12, 12, 8.4], ['p', 'M12 7.5V12l3 2']],
  logout: [['p', 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4'], ['p', 'M16 17l5-5-5-5'], ['p', 'M21 12H9']],
  card: [['r', 3, 6, 18, 12, 2.5], ['p', 'M3 10.5h18']],
};

// ── every currently-used Feather/Ionicons name → canonical glyph ──
const ALIASES = {
  // Feather
  x: 'close', check: 'confirm', user: 'person', 'trash-2': 'trash', sliders: 'settings',
  slash: 'block', 'eye-off': 'hide', 'corner-up-left': 'reply', 'bar-chart-2': 'bar-chart',
  flag: 'report', 'edit-3': 'write',
  // Ionicons
  'chevron-forward': 'chevron-right', 'chevron-back': 'chevron-left', checkmark: 'confirm',
  'checkmark-circle': 'check-circle', 'arrow-forward': 'arrow-right', 'trash-outline': 'trash',
  'time-outline': 'clock', 'star-outline': 'star', 'pencil-outline': 'write',
  'notifications-outline': 'notify', 'log-out-outline': 'logout', 'lock-closed-outline': 'lock',
  'card-outline': 'card',
  // identity (present but harmless to list a few explicitly)
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wobble(d, closed, seed) {
  const props = new svgPathProperties(d);
  const len = props.getTotalLength();
  if (!len) return d;
  const n = Math.max(6, Math.round(len / STEP));
  const rng = mulberry32(seed);
  // INTEGER frequencies → period 1 → nx(0)===nx(1), so closed shapes seam cleanly
  const f1 = 2 + Math.floor(rng() * 3), f2 = 4 + Math.floor(rng() * 4);
  const f3 = 2 + Math.floor(rng() * 3), f4 = 4 + Math.floor(rng() * 4);
  const p1 = rng() * 6.283, p2 = rng() * 6.283, p3 = rng() * 6.283, p4 = rng() * 6.283;
  const nx = (u) => 0.7 * Math.sin(f1 * u * 6.283 + p1) + 0.3 * Math.sin(f2 * u * 6.283 + p2);
  const ny = (u) => 0.7 * Math.sin(f3 * u * 6.283 + p3) + 0.3 * Math.sin(f4 * u * 6.283 + p4);
  const raw = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n; const pt = props.getPointAtLength(len * u);
    raw.push([pt.x + AMP * nx(u), pt.y + AMP * ny(u)]);
  }
  const segs = [];
  for (let i = 1; i < raw.length; i++) segs.push(Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const med = segs.slice().sort((a, b) => a - b)[Math.floor(segs.length / 2)] || 1;
  const jump = Math.max(med * 3.5, 3);
  let out = '', pen = false;
  for (let i = 0; i < raw.length; i++) {
    const xs = raw[i][0].toFixed(2), ys = raw[i][1].toFixed(2);
    if (i > 0 && segs[i - 1] > jump) { out += `M${xs} ${ys}`; pen = true; continue; }
    out += pen ? `L${xs} ${ys}` : `M${xs} ${ys}`; pen = true;
  }
  if (closed) out += 'Z';
  return out;
}

function bakeGlyph(name, prims) {
  const seedBase = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) * 2654435761 >>> 0;
  const shapes = [];
  prims.forEach((prim, idx) => {
    const [t] = prim;
    if (t === 'dot') { shapes.push({ dot: [prim[1], prim[2], prim[3]] }); return; }
    let d, closed;
    if (t === 'p') { d = prim[1]; closed = /[zZ]\s*$/.test(prim[1]); }
    else if (t === 'c') { d = circleD(prim[1], prim[2], prim[3]); closed = true; }
    else if (t === 'r') { d = rrD(prim[1], prim[2], prim[3], prim[4], prim[5]); closed = true; }
    shapes.push({ d: wobble(d, closed, (seedBase + idx * 131) >>> 0) });
  });
  return shapes;
}

const GLYPHS = {};
for (const [name, prims] of Object.entries(BASE)) GLYPHS[name] = bakeGlyph(name, prims);

// sanity: every alias target must exist
for (const [a, target] of Object.entries(ALIASES)) {
  if (!GLYPHS[target]) throw new Error(`alias "${a}" → unknown glyph "${target}"`);
}

const header = `// AUTO-GENERATED by scripts/bake-icons.mjs — do not edit by hand.
// Regenerate: node scripts/bake-icons.mjs
export type Shape = { d: string } | { dot: [number, number, number] };
`;
const body =
  `export const GLYPHS: Record<string, Shape[]> = ${JSON.stringify(GLYPHS, null, 2)};\n\n` +
  `export const ALIASES: Record<string, string> = ${JSON.stringify(ALIASES, null, 2)};\n\n` +
  `export type IconName = string;\n`;

const outPath = resolve(__dirname, '..', 'components', 'icons', 'paperwhite.generated.ts');
writeFileSync(outPath, header + body);
console.log(`Baked ${Object.keys(GLYPHS).length} glyphs + ${Object.keys(ALIASES).length} aliases → ${outPath}`);
