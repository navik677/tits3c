const fs=require('fs');
// Vita .mbin: u32 count, then count x (u32 kind, u32 offset) ; offsets relative to data start = 4+8*count
function parseMbin(buf){
  const n=buf.readUInt32LE(0);const hdr=4+8*n;const offs=[],kinds=[];
  for(let i=0;i<n;i++){kinds.push(buf.readUInt32LE(4+i*8));offs.push(buf.readUInt32LE(8+i*8));}
  const ents=[];for(let i=0;i<n;i++){const s=hdr+offs[i],e=i+1<n?hdr+offs[i+1]:buf.length;ents.push(buf.subarray(s,e));}
  return {n,kinds,ents};
}
function buildMbin(kinds,ents){
  const n=ents.length;const hdr=4+8*n;let off=0;const h=Buffer.alloc(hdr);h.writeUInt32LE(n,0);
  ents.forEach((e,i)=>{h.writeUInt32LE(kinds[i],4+i*8);h.writeUInt32LE(off,8+i*8);off+=e.length});
  return Buffer.concat([h,...ents]);
}
// PC (decompressed ._SN) dialog entries: bytes after 01 01 up to the 02 00 terminator, allowed char set only
function pcDialogs(buf){
  const res=[];const ok=c=>c===1||c===2||c===3||(c>=0x20&&c<0x7f)||(c>=0x91&&c<=0xd4);
  for(let i=0;i+3<buf.length;i++){
    if(buf[i]!==1||buf[i+1]!==1)continue;
    let j=i+2;while(j<buf.length&&ok(buf[j])&&!(buf[j]===2&&buf[j+1]===0))j++;
    if(buf[j]===2&&buf[j+1]===0&&j-(i+2)>=2){
      const c=buf.subarray(i+2,j+1); // includes final 02
      const t=c.toString('latin1');
      if(/#\d*[A-Za-z]/.test(t.slice(0,40))||/[\x91-\xd4]/.test(t)){res.push({at:i,c});i=j+1;}
    }
  }
  return res;
}
module.exports={parseMbin,buildMbin,pcDialogs};
