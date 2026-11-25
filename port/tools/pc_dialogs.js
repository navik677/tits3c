const ok=c=>c===1||c===2||c===3||(c>=0x20&&c<0x7f)||(c>=0x91&&c<=0xd4);
module.exports=function pcDialogs2(buf){
  const res=[];let i=0;
  while(i<buf.length){
    if(!ok(buf[i])){i++;continue}
    let j=i;while(j<buf.length&&ok(buf[j]))j++;
    // run is [i,j); needs to end with 02 and be followed by 00
    if(buf[j]===0&&buf[j-1]===2&&j-i>=3){
      let s=i;
      const t=buf.subarray(i,j);
      const k=t.indexOf(Buffer.from([1,1]));
      if(k>=0&&k<6)s=i+k+2;
      else{const h=t.indexOf(0x23);if(h>=0&&h<8&&/\d/.test(String.fromCharCode(t[h+1]||0)))s=i+h;}
      const c=buf.subarray(s,j);
      if(/[\x91-\xd4]/.test(c.toString("latin1"))||/#\d/.test(c.toString("latin1")))res.push({at:s,c});
    }
    i=j+1;
  }
  return res;
};
