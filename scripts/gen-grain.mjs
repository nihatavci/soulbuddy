// Generate a small tileable film-grain PNG (neutral gray noise w/ low alpha).
// Neutral gray + alpha-blend reads as grain on BOTH light (paper/gold) and dark (ink)
// surfaces. No deps — hand-encode PNG via built-in zlib. Deterministic (seeded).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { crc32 } from 'node:zlib';

const N = 128;
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rng = mulberry32(0x5eed1234);

// RGBA scanlines, each prefixed with filter byte 0
const raw = Buffer.alloc(N * (1 + N * 4));
for (let y = 0; y < N; y++) {
  const row = y * (1 + N * 4);
  raw[row] = 0; // filter: none
  for (let x = 0; x < N; x++) {
    const i = row + 1 + x * 4;
    // Charcoal-biased salt-and-pepper: ~72% dark specks (read as charcoal grit on the
    // light paper + gold) and ~28% light specks so it's grain, not a flat wash.
    const dark = rng() < 0.72;
    const v = dark ? Math.floor(rng() * 55) : 175 + Math.floor(rng() * 80);
    const a = Math.floor(Math.pow(rng(), 1.25) * 150); // punchy: mean ~60, max 150
    raw[i] = v; raw[i + 1] = v; raw[i + 2] = v; raw[i + 3] = a;
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}
const sig = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N,0); ihdr.writeUInt32BE(N,4);
ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0; // 8-bit RGBA
const png = Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',deflateSync(raw)), chunk('IEND',Buffer.alloc(0))]);
writeFileSync('assets/textures/grain.png', png);
console.log('wrote assets/textures/grain.png', png.length, 'bytes', N+'x'+N);
