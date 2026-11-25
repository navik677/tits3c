// ED6 "LB DIR" + .dat extractor. Usage: node dat_extract.js <dir-with-dat+dir> <outDir>
const fs = require('fs'), path = require('path');
const [,, src, out] = process.argv;
fs.mkdirSync(out, { recursive: true });
const summary = [];
for (const f of fs.readdirSync(src).filter(x => /^ED6_DT.*\.dir$/i.test(x))) {
  const base = f.slice(0, -4);
  const dir = fs.readFileSync(path.join(src, f));
  if (dir.toString('latin1', 0, 6) !== 'LB DIR') { console.log('skip', f); continue; }
  const cnt = dir.readUInt32LE(8);
  const datFd = fs.openSync(path.join(src, base + '.dat'), 'r');
  const od = path.join(out, base); fs.mkdirSync(od, { recursive: true });
  const flagsSeen = {};
  const idx = [];
  for (let i = 0; i < cnt; i++) {
    const o = 16 + i * 36;
    const name = dir.toString('latin1', o, o + 16).replace(/\0.*$/, '');
    const size = dir.readUInt32LE(o + 16), a = dir.readUInt32LE(o + 20), size2 = dir.readUInt32LE(o + 24), ts = dir.readUInt32LE(o + 28), off = dir.readUInt32LE(o + 32);
    flagsSeen[a + ':' + (size === size2)] = (flagsSeen[a + ':' + (size === size2)] || 0) + 1;
    idx.push({ name, size, off });
    if (!size) continue;
    const b = Buffer.alloc(size); fs.readSync(datFd, b, 0, size, off);
    fs.writeFileSync(path.join(od, name.replace(/ +\./, '.')), b);
  }
  fs.closeSync(datFd);
  console.log(base, cnt, JSON.stringify(flagsSeen));
}
