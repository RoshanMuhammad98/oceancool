// Generates the PWA icon set as real PNGs (no dependencies).
// Subject: a split-AC indoor unit with three airflow bars, the shortest in copper.
// Run: node tools/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

/* ---------- minimal PNG encoder (RGBA, 8-bit, no interlace) ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const at = y * (width * 4 + 1);
    raw[at] = 0; // filter: none
    rgba.copy(raw, at + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- drawing ---------- */
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const TEAL_TOP = hex('#12909F');
const TEAL_BOT = hex('#075663');
const WHITE = hex('#FFFFFF');
const COPPER = hex('#E08A56');

// signed distance to a rounded rectangle, in pixel units
function sdRoundRect(px, py, x0, y0, x1, y1, r) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const hx = (x1 - x0) / 2 - r, hy = (y1 - y0) / 2 - r;
  const qx = Math.abs(px - cx) - hx, qy = Math.abs(py - cy) - hy;
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

// 3x3 supersampled coverage of a rounded rect for one pixel
function coverage(px, py, rect) {
  let hits = 0;
  for (let sy = 0; sy < 3; sy++) {
    for (let sx = 0; sx < 3; sx++) {
      const x = px + (sx + 0.5) / 3, y = py + (sy + 0.5) / 3;
      if (sdRoundRect(x, y, rect[0], rect[1], rect[2], rect[3], rect[4]) <= 0) hits++;
    }
  }
  return hits / 9;
}

function render(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const S = size;
  // maskable icons must keep their mark inside the 80% safe zone
  const pad = maskable ? S * 0.20 : 0;
  const inner = S - pad * 2;
  const u = (v) => pad + v * inner; // unit-space (0..1) -> pixels

  const plate = maskable
    ? [0, 0, S, S, 0]                                  // full bleed behind the mask
    : [S * 0.035, S * 0.035, S * 0.965, S * 0.965, S * 0.225];

  // the indoor unit, its vent slit, then three airflow bars
  const marks = [
    { rect: [u(0.155), u(0.235), u(0.845), u(0.395), inner * 0.05], color: WHITE, alpha: 1 },
    { rect: [u(0.225), u(0.352), u(0.775), u(0.375), inner * 0.012], color: TEAL_BOT, alpha: 0.85 },
    { rect: [u(0.205), u(0.505), u(0.720), u(0.570), inner * 0.033], color: WHITE, alpha: 0.95 },
    { rect: [u(0.285), u(0.635), u(0.660), u(0.700), inner * 0.033], color: WHITE, alpha: 0.72 },
    { rect: [u(0.375), u(0.765), u(0.605), u(0.830), inner * 0.033], color: COPPER, alpha: 1 },
  ];

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const plateCov = coverage(x, y, plate);
      if (plateCov <= 0) continue;

      // vertical teal ramp
      const t = y / (S - 1);
      let r = TEAL_TOP[0] + (TEAL_BOT[0] - TEAL_TOP[0]) * t;
      let g = TEAL_TOP[1] + (TEAL_BOT[1] - TEAL_TOP[1]) * t;
      let b = TEAL_TOP[2] + (TEAL_BOT[2] - TEAL_TOP[2]) * t;

      for (const m of marks) {
        const a = coverage(x, y, m.rect) * m.alpha;
        if (a <= 0) continue;
        r += (m.color[0] - r) * a;
        g += (m.color[1] - g) * a;
        b += (m.color[2] - b) * a;
      }

      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(g);
      buf[i + 2] = Math.round(b);
      buf[i + 3] = Math.round(plateCov * 255);
    }
  }
  return encodePng(S, S, buf);
}

const jobs = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: true }],
  ['favicon-32.png', 32, {}],
];

for (const [name, size, opts] of jobs) {
  const png = render(size, opts);
  writeFileSync(join(OUT, name), png);
  console.log(`${name.padEnd(26)} ${size}x${size}  ${png.length} bytes`);
}
