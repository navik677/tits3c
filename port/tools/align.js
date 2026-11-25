// Align Vita mbin entries with PC dialog entries using (face id, line count) signatures per segment
const segs=b=>{const out=[];let s=0;for(let i=0;i<b.length-1;i++){if(b[i]===2&&b[i+1]===3){out.push(b.subarray(s,i));s=i+2}}out.push(b.subarray(s));return out};
function sig(buf){return segs(buf).map(sg=>{const t=sg.toString('latin1');const m=t.match(/#(\d+)F/);let lines=1;for(const c of sg)if(c===1)lines++;return {face:m?+m[1]:-1,lines};});}
function vitaContent(e){const last=e.lastIndexOf(2);return e.subarray(3,last+1)}
const keyOf=sg=>sg.map(x=>x.face+':'+x.lines).join('|');
const faceOf=sg=>sg.map(x=>x.face).join('|');
function align(vEnts,pcList){
  const vs=vEnts.map(e=>sig(vitaContent(e))).map(keyOf),ps=pcList.map(d=>keyOf(sig(d.c)));
  const byKeyP=new Map();ps.forEach((k,j)=>{if(!byKeyP.has(k))byKeyP.set(k,[]);byKeyP.get(k).push(j)});
  const byKeyV=new Map();vs.forEach((k,i)=>{if(!byKeyV.has(k))byKeyV.set(k,[]);byKeyV.get(k).push(i)});
  const res=new Array(vs.length).fill(-1),usedP=new Array(ps.length).fill(false);
  // A: keys that occur exactly once on each side
  vs.forEach((k,i)=>{if(byKeyV.get(k).length===1&&(byKeyP.get(k)||[]).length===1){res[i]=byKeyP.get(k)[0];usedP[res[i]]=true}});
  // B: ambiguous keys: use offset of nearest already-matched neighbour (prev, then next)
  for(let round=0;round<4;round++){let changed=0;
    for(let i=0;i<vs.length;i++){if(res[i]>=0)continue;const cands=(byKeyP.get(vs[i])||[]).filter(j=>!usedP[j]);if(!cands.length)continue;
      let off=null;for(let d=1;d<8&&off===null;d++){if(i-d>=0&&res[i-d]>=0)off=res[i-d]-(i-d);else if(i+d<vs.length&&res[i+d]>=0)off=res[i+d]-(i+d)}
      if(off===null)continue;const exp=i+off;let best=-1,bd=1e9;for(const j of cands){const d=Math.abs(j-exp);if(d<bd){bd=d;best=j}}
      if(bd<=2){res[i]=best;usedP[best]=true;changed++}}
    if(!changed)break}
  // C: relax to faces only (line wrapping differs between languages), near neighbour offset
  const vf=vEnts.map(e=>faceOf(sig(vitaContent(e)))),pf=pcList.map(d=>faceOf(sig(d.c)));
  for(let round=0;round<4;round++){let changed=0;
    for(let i=0;i<vf.length;i++){if(res[i]>=0)continue;let off=null;for(let d=1;d<8&&off===null;d++){if(i-d>=0&&res[i-d]>=0)off=res[i-d]-(i-d);else if(i+d<vf.length&&res[i+d]>=0)off=res[i+d]-(i+d)}
      if(off===null)continue;const exp=i+off;let best=-1,bd=1e9;for(let j=Math.max(0,exp-2);j<=Math.min(pf.length-1,exp+2);j++){if(!usedP[j]&&pf[j]===vf[i]&&Math.abs(j-exp)<bd){bd=Math.abs(j-exp);best=j}}
      if(best>=0){res[i]=best;usedP[best]=true;changed++}}
    if(!changed)break}
  return res;
}
module.exports={align,sig,vitaContent,keyOf,segs};
