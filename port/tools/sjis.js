// Unicode Cyrillic -> game text bytes (Vita build stores text in Shift-JIS).
// Double-byte JIS row 7 Cyrillic (0x8440..) renders with a fixed full-width advance (letters spaced out),
// so by default Cyrillic goes to the single-byte half-width katakana slots 0xA0..0xDF, which render
// proportionally; tools/font_patch.js points those font slots at the Cyrillic glyphs. Ё/ё -> Е/е (64 slots).
const UP = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', LO = 'абвгдежзийклмнопрстуфхцчшщъыьэюя';
const UP_DB = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', LO_DB = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
// double-byte SJIS codes (used by the font patch as glyph source)
const dbl = new Map();
[...UP_DB].forEach((ch, i) => dbl.set(ch, 0x8440 + i));
[...LO_DB].forEach((ch, i) => { const c = 0x8470 + i; dbl.set(ch, c >= 0x847f ? c + 1 : c); });
// single-byte slots
const single = new Map();
[...UP].forEach((ch, i) => single.set(ch, 0xA0 + i));
[...LO].forEach((ch, i) => single.set(ch, 0xC0 + i));
single.set('Ё', single.get('Е')); single.set('ё', single.get('е'));
const MODE = process.env.CYR_MODE || 'single';
function toSjis(str) {
  const out = [];
  for (const ch of str) {
    if (MODE === 'single' && single.has(ch)) { out.push(single.get(ch)); continue; }
    const c = dbl.get(ch);
    if (c !== undefined) out.push(c >> 8, c & 0xff);
    else if (ch.codePointAt(0) < 0x80) out.push(ch.codePointAt(0));
    else throw new Error('no SJIS mapping for ' + ch + ' U+' + ch.codePointAt(0).toString(16));
  }
  return Buffer.from(out);
}
module.exports = { toSjis, dbl, single, UP, LO };
