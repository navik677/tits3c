// Rebuild a PSARC (zlib) replacing some entries. Usage: node psarc_build.js <orig.psarc> <overlayRoot> <out.psarc> [innerPrefix]
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const [,, orig, overlay, outp, prefix='']=process.argv;
const fd=fs.openSync(orig,'r');
const rd=(pos,len)=>{const b=Buffer.alloc(len);let n=0;while(n<len){const r=fs.readSync(fd,b,n,len-n,pos+n);if(!r)break;n+=r}return b.subarray(0,n)};
const h=rd(0,32);if(h.toString('latin1',0,4)!=='PSAR')throw new Error('not psarc');
const tocLen=h.readUInt32BE(12),entSize=h.readUInt32BE(16),nEnt=h.readUInt32BE(20),blk=h.readUInt32BE(24);
const toc=rd(32,tocLen-32);const bw=blk<=0x10000?2:blk<=0x1000000?3:4;const tbl=toc.subarray(nEnt*entSize);
const ents=[];for(let i=0;i<nEnt;i++){const o=i*entSize;ents.push({md5:toc.subarray(o,o+16),bi:toc.readUInt32BE(o+16),size:toc.readUIntBE(o+20,5),off:toc.readUIntBE(o+25,5)})}
const bsz=i=>tbl.readUIntBE(i*bw,bw);
function readEnt(e){const parts=[];let pos=e.off,left=e.size,bi=e.bi;while(left>0){let cs=bsz(bi++);if(cs===0)cs=blk;const want=Math.min(blk,left);const raw=rd(pos,cs);pos+=cs;const d=cs===want?raw:zlib.inflateSync(raw);parts.push(d);left-=d.length}return Buffer.concat(parts)}
const names=readEnt(ents[0]).toString('utf8').split(/\r?\n|\0/).filter(Boolean);
// collect replacements
const repl=new Map();
(function walk(d,rel){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name),r=rel?rel+'/'+f.name:f.name;if(f.isDirectory())walk(p,r);else repl.set(prefix+r,p)}})(overlay,'');
const nameIdx=new Map();names.forEach((n,i)=>nameIdx.set(n.replace(/^[\/]+/,''),i+1));
let replaced=0;const missing=[];
for(const k of repl.keys()){if(!nameIdx.has(k))missing.push(k)}
if(missing.length)console.log('WARNING not in archive:',missing.slice(0,5),missing.length);
// compute block counts
const blocksOf=sz=>sz===0?0:Math.ceil(sz/blk);
const newSize=ents.map(e=>e.size);const newData=new Map();
for(const [k,p] of repl){const i=nameIdx.get(k);if(!i)continue;const d=fs.readFileSync(p);newData.set(i,d);newSize[i]=d.length;replaced++}
const nBlocks=newSize.map(blocksOf).reduce((a,b)=>a+b,0);
const newTocLen=32+entSize*nEnt+bw*nBlocks;
const out=fs.openSync(outp,'w');let pos=newTocLen;
const outTbl=Buffer.alloc(bw*nBlocks);const outToc=Buffer.alloc(entSize*nEnt);let bIdx=0;
const wr=(b)=>{fs.writeSync(out,b,0,b.length,pos);pos+=b.length};
for(let i=0;i<nEnt;i++){
  const e=ents[i];const start=pos;const firstBlock=bIdx;
  if(newData.has(i)){
    const d=newData.get(i);for(let o=0;o<d.length;o+=blk){const ch=d.subarray(o,Math.min(o+blk,d.length));const c=zlib.deflateSync(ch,{level:9});let w,sz;
      if(c.length<ch.length){w=c;sz=c.length}else{w=ch;sz=ch.length}
      wr(w);outTbl.writeUIntBE(sz===blk?0:sz,bIdx*bw,bw);bIdx++}
  }else{
    let left=e.size,b0=e.bi,p=e.off;const nb=blocksOf(e.size);
    for(let k=0;k<nb;k++){const raw_cs=bsz(b0+k);const cs=raw_cs===0?blk:raw_cs;const raw=rd(p,cs);p+=cs;wr(raw);outTbl.writeUIntBE(raw_cs,bIdx*bw,bw);bIdx++}
  }
  const o=i*entSize;e.md5.copy(outToc,o);outToc.writeUInt32BE(firstBlock,o+16);outToc.writeUIntBE(newSize[i],o+20,5);outToc.writeUIntBE(start,o+25,5);
}
const header=Buffer.from(h);header.writeUInt32BE(newTocLen,12);
fs.writeSync(out,header,0,32,0);fs.writeSync(out,outToc,0,outToc.length,32);fs.writeSync(out,outTbl,0,outTbl.length,32+outToc.length);fs.closeSync(out);
console.log('built',outp,'replaced',replaced,'size',pos);
