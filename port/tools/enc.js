const {map}=require('./dec.js');const inv={};for(const k in map)inv[map[k]]=+k;
module.exports={enc:s=>Buffer.from([...s].map(c=>inv[c]!==undefined?inv[c]:c.charCodeAt(0))),inv};
