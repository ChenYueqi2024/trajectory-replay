const norm = vector => Math.hypot(...vector);
const difference = (a,b) => a.map((v,i)=>v-b[i]);
export function displacement(mode, fraction, amplitude) {
  if (mode==='offset') return amplitude;
  if (mode==='drift') return amplitude*fraction;
  if (mode==='bump') return amplitude*Math.max(0,1-Math.abs(fraction-.58)/.18);
  return 0;
}
export function experiment(frames, mode, amplitude, align) {
  const duration=frames.at(-1).t-frames[0].t;
  const shift=align ? displacement(mode,0,amplitude) : 0;
  const samples=frames.map(frame=>{
    const delta=displacement(mode,duration?(frame.t-frames[0].t)/duration:0,amplitude)-shift;
    const estimate=[frame.p[0]+delta,frame.p[1],frame.p[2]];
    return {frame,estimate,error:Math.abs(delta),step:null};
  });
  let peak=0, sum=0;
  samples.forEach((s,i)=>{
    if (i) {
      const previous=samples[i-1];
      s.step=norm(difference(difference(s.estimate,previous.estimate),difference(s.frame.p,previous.frame.p)));
    }
    sum+=s.error*s.error;
    if (s.error>samples[peak].error) peak=i;
  });
  return {samples,peak,rms:Math.sqrt(sum/samples.length)};
}
export function nearestFrame(frames,time) {
  let lo=0,hi=frames.length-1;
  while(lo<hi) {
    const mid=Math.floor((lo+hi)/2);
    if (frames[mid].t<time) lo=mid+1; else hi=mid;
  }
  return lo && time-frames[lo-1].t<=frames[lo].t-time ? lo-1 : lo;
}
