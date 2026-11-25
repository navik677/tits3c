// Minimal PSARC (v1.x, zlib) extractor. Usage: node psarc_extract.js <archive> <outDir>
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const [,, arc, out, ...prefixes] = process.argv; // optional: only extract paths starting with any prefix
const fd = fs.openSync(arc, 'r');
const rd = (pos, len) => { const b = Buffer.alloc(len); let n = 0; while (n < len) { const r = fs.readSync(fd, b, n, len - n, pos + n); if (!r) break; n += r; } return b.subarray(0, n); };
const h = rd(0, 32);
if (h.toString('latin1', 0, 4) !== 'PSAR') throw new Error('not a PSARC (encrypted?)');
const comp = h.toString('latin1', 8, 12);
const tocLen = h.readUInt32BE(12), entSize = h.readUInt32BE(16), nEnt = h.readUInt32BE(20), blk = h.readUInt32BE(24), flags = h.readUInt32BE(28);
console.log({ ver: h.readUInt16BE(4) + '.' + h.readUInt16BE(6), comp, tocLen, entSize, nEnt, blk, flags });
if (comp !== 'zlib') throw new Error('unsupported compression ' + comp);
const toc = rd(32, tocLen - 32);
const ents = [];
for (let i = 0; i < nEnt; i++) {
  const o = i * entSize;
  ents.push({ bi: toc.readUInt32BE(o + 16), size: toc.readUIntBE(o + 20, 5), off: toc.readUIntBE(o + 25, 5) });
}
const bw = blk <= 0x10000 ? 2 : blk <= 0x1000000 ? 3 : 4;
const tbl = toc.subarray(nEnt * entSize);
const bsize = i => tbl.readUIntBE(i * bw, bw);
function read(e) {
  const parts = []; let pos = e.off, left = e.size, bi = e.bi;
  while (left > 0) {
    let cs = bsize(bi++); if (cs === 0) cs = blk;
    const want = Math.min(blk, left);
    const raw = rd(pos, cs); pos += cs;
    const d = (cs === want) ? raw : zlib.inflateSync(raw);
    parts.push(d); left -= d.length;
  }
  return Buffer.concat(parts);
}
const names = read(ents[0]).toString('utf8').split(/\r?\n|\0/).filter(Boolean);
console.log('files in manifest:', names.length, 'entries:', nEnt - 1);
fs.mkdirSync(out, { recursive: true });
let n = 0;
for (let i = 1; i < nEnt; i++) {
  const nm = (names[i - 1] || ('unnamed_' + i)).replace(/^[\\/]+/, '');
  if (prefixes.length && !prefixes.some(p => nm.startsWith(p))) continue;
  const dest = path.join(out, nm);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, read(ents[i]));
  if (++n % 2000 === 0) console.log(n + ' / ' + (nEnt - 1));
}
console.log('done', n);
