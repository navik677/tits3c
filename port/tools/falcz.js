// Falcom "BZ mode 2" decompressor (ported from the algorithm described in uyjulian's public gist, MIT)
function decompress(buf, start = 0) {
  let off = start, bits = 8, flags = (buf[off] | (buf[off + 1] << 8)) >> 8; off += 2;
  const out = [];
  const flag = () => {
    if (bits === 0) { if (off + 2 > buf.length) throw new Error('eof'); flags = buf[off] | (buf[off + 1] << 8); off += 2; bits = 16; }
    const f = flags & 1; flags >>= 1; bits--; return f;
  };
  const run_ = (dist) => {
    let run = 2;
    if (flag() === 0) { run++; if (flag() === 0) { run++; if (flag() === 0) { run++; if (flag() === 0) {
      if (flag() === 0) { run = buf[off++] + 0xE; } else { run = 0; for (let i = 0; i < 3; i++) run = (run << 1) | flag(); run += 6; }
    } } } }
    if (dist > out.length || dist <= 0) throw new Error('bad dist ' + dist + ' at out ' + out.length);
    for (let i = 0; i < run; i++) out.push(out[out.length - dist]);
  };
  for (;;) {
    if (flag() === 0) { out.push(buf[off++]); continue; }
    if (flag() !== 0) {
      let run = 0; for (let i = 0; i < 5; i++) run = (run << 1) | flag();
      let d = buf[off++];
      if (run !== 0) { run_(d | (run << 8)); }
      else if (d > 2) run_(d);
      else if (d === 0) break;
      else {
        const branch = flag(); for (let i = 0; i < 4; i++) run = (run << 1) | flag();
        if (branch) { run = (run << 8) | buf[off++]; }
        run += 0xE; const v = buf[off++]; for (let i = 0; i < run; i++) out.push(v);
      }
    } else { const d = buf[off++]; run_(d); }
  }
  return { out: Buffer.from(out), used: off };
}
module.exports = { decompress };
