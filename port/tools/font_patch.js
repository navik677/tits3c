// Point single-byte slots 0xA0..0xDF of vitafont2bit.fnt (VFNT) at the existing Cyrillic glyphs.
// Usage: node font_patch.js <in.fnt> <out.fnt>
const fs = require('fs');
const { dbl, single } = require('./sjis.js');
const [,, inp, outp] = process.argv;
const b = Buffer.from(fs.readFileSync(inp));
if (b.toString('latin1', 0, 4) !== 'VFNT') throw new Error('not VFNT');
// range table: start @0x40, end @0x80, glyph base index @0xC0 (u32 each)
const ranges = []; for (let i = 0; i < 16; i++) { const s = b.readUInt32LE(0x40 + i * 4), e = b.readUInt32LE(0x80 + i * 4); if (e) ranges.push({ s, e, base: b.readUInt32LE(0xC0 + i * 4) }); }
const idx = c => { for (const r of ranges) if (c >= r.s && c <= r.e) return r.base + c - r.s; throw new Error('no glyph range for ' + c.toString(16)); };
const ent = i => 0x104 + i * 4;
let n = 0;
for (const [ch, code] of single) { if (ch === 'Ё' || ch === 'ё') continue; b.writeUInt32LE(b.readUInt32LE(ent(idx(dbl.get(ch)))), ent(idx(code))); n++; }
fs.writeFileSync(outp, b); console.log('patched', n, 'glyph slots');
