// Convert Vita msg/*.mbin: take Vita structure & codes, replace English text with Russian text from PC русик scenario files
const fs=require('fs'),path=require('path');
const {parseMbin,buildMbin}=require('./msg_lib.js');
const pcDialogs=require('./pc_dialogs.js');
const {align}=require('./align.js');
const {map}=require('./dec.js');
const toUtf8=buf=>{let s='';for(const c of buf)s+=map[c]||String.fromCharCode(c);return Buffer.from(s,'utf8')};
const TOK=/^(?:#\d*[A-Za-z])+/;
function splitSeg(b){const out=[];let s=0;for(let i=0;i<b.length-1;i++){if(b[i]===2&&b[i+1]===3){out.push(b.subarray(s,i+1));s=i+1;}}out.push(b.subarray(s));return out;}
function convEntry(vE,pcC){
  const last=vE.lastIndexOf(2);
  if(vE.length<5||last<0)return null;
  const head=vE.subarray(0,3),body=vE.subarray(3,last+1),tail=vE.subarray(last+1);
  const vs=splitSeg(body),ps=splitSeg(pcC);
  if(vs.length!==ps.length)return null;
  const parts=[head];
  for(let i=0;i<vs.length;i++){
    let v=vs[i],p=ps[i];
    // segments after the first start with 03 (separator kept from Vita)
    const lead=v[0]===3?v.subarray(0,1):Buffer.alloc(0);const vv=lead.length?v.subarray(1):v;
    const pp=p[0]===3?p.subarray(1):p;
    const vt=vv.toString('latin1'),pt=pp.toString('latin1');
    const vpre=(vt.match(TOK)||[''])[0];
    const ppre=(pt.match(TOK)||[''])[0];
    const ptext=pp.subarray(ppre.length); // ends with 02
    parts.push(lead,Buffer.from(vpre,'latin1'),toUtf8(ptext));
  }
  parts.push(tail);return Buffer.concat(parts);
}
module.exports={convEntry};
if(require.main===module){
  const V='vita/data/data_3rd/msg/',P='ru_pc_dec/ED6_DT21/',O=process.argv[2];
  fs.mkdirSync(O,{recursive:true});let files=0,ents=0,skipE=0;const only=process.argv[3]?new Set(process.argv[3].split(',')):null;
  for(const f of fs.readdirSync(V)){if(!f.endsWith('.mbin'))continue;if(only&&!only.has(f))continue;
    const base=f.slice(0,-5).toUpperCase();const cand=fs.readdirSync(P).find(x=>x.replace(/ +\./,'.').toUpperCase()===base+'._SN');if(!cand)continue;
    const m=parseMbin(fs.readFileSync(V+f));const d=pcDialogs(fs.readFileSync(P+cand));
    if(m.n===0)continue;const al=align(m.ents,d);let bad=0,conv=0;
    const ne=m.ents.map((e,i)=>{if(al[i]<0)return e;const r=convEntry(e,d[al[i]].c);if(!r){bad++;return e}conv++;return r});
    fs.writeFileSync(path.join(O,f),buildMbin(m.kinds,ne));files++;ents+=conv;skipE+=m.n-conv;
  }
  console.log('files',files,'entries converted',ents,'kept English (segment mismatch)',skipE);
}
