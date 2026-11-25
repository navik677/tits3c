const fs=require('fs');
const lo="абвгдеёжзийклмноп", lo2="рстуфхцчшщъыьэюя";
const up="АБВГДЕЁЖЗИЙКЛМНОП", up2="РСТУФХЦЧШЩЪЫЬЭЮЯ";
const gapLo=+process.env.GL||2, gapUp=+process.env.GU||0;
const map={};
[...lo].forEach((ch,i)=>map[0x91+i]=ch);
[...lo2].forEach((ch,i)=>map[0x91+lo.length+gapLo+i]=ch);
[...up].forEach((ch,i)=>map[0xb4+i]=ch);
[...up2].forEach((ch,i)=>map[0xb4+up.length+gapUp+i]=ch);
module.exports={map};
if(require.main===module){
const b=fs.readFileSync(process.argv[2]);
const m=c=>map[c]||(c>=0x20&&c<0x7f?String.fromCharCode(c):'{'+c.toString(16)+'}');
let cur=[],n=0,lim=+process.argv[3]||12;
for(let i=0;i<b.length&&n<lim;i++){if(b[i]===0){if(cur.length>25){console.log(cur.map(m).join(''));n++}cur=[]}else cur.push(b[i])}}
