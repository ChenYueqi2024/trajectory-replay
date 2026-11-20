const green='#006b58',orange='#ad521e',grid='#d3ded4',ink='#31493f';
function surface(canvas) {
  const w=canvas.clientWidth,h=canvas.clientHeight;
  const ratio=window.devicePixelRatio||1;
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)) {
    canvas.width=Math.round(w*ratio); canvas.height=Math.round(h*ratio);
  }
  const c=canvas.getContext('2d');
  c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,w,h);
  c.font='13px system-ui';c.lineJoin='round';return {c,w,h};
}
function line(c,points,color,width=1,dash=[]) {
  c.beginPath();c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=width;
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.stroke();c.setLineDash([]);
}
function dot(c,[x,y],color,r) {
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();c.strokeStyle='white';c.lineWidth=1.5;c.stroke();
}
export function pathPlot(canvas,samples,index,plane) {
  const {c,w,h}=surface(canvas),axis=plane==='xy'?1:2;
  const all=samples.flatMap(s=>[s.frame.p,s.estimate]);
  const xs=all.map(p=>p[0]), ys=all.map(p=>p[axis]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min((w-32)/Math.max(.05,maxX-minX),(h-46)/Math.max(.05,maxY-minY));
  const project=p=>[w/2+(p[0]-(minX+maxX)/2)*scale,(h-14)/2-(p[axis]-(minY+maxY)/2)*scale];
  const truth=samples.map(s=>project(s.frame.p)), estimate=samples.map(s=>project(s.estimate));
  line(c,truth,green,2.5);line(c,estimate,orange,2,[5,3]);
  line(c,[truth[index],estimate[index]],ink,1);
  dot(c,truth[index],green,6);dot(c,estimate[index],orange,3.8);
  const bar=.1*scale;
  line(c,[[12,h-13],[12+bar,h-13]],ink,2);
  c.fillStyle=ink;c.fillText('10 cm',16+bar,h-9);
  c.textAlign='right';c.fillText('X →   '+(axis===1?'Y':'Z')+' ↑',w-10,h-9);c.textAlign='left';
}
const left=47,right=12;
export function timeFraction(canvas,clientX) {
  const bounds=canvas.getBoundingClientRect();
  return Math.max(0,Math.min(1,(clientX-bounds.left-left)/(bounds.width-left-right)));
}
export function errorPlot(canvas,samples,index,amplitude) {
  const {c,w,h}=surface(canvas);
  const total=samples.at(-1).frame.t,max=Math.max(.1,amplitude);
  const x=t=>left+(w-left-right)*t/total;
  const y=v=>h-24-(h-43)*v/max;
  c.fillStyle=ink;
  for (const level of [0,.5,1]) {
    const v=max*level,py=y(v);
    line(c,[[left,py],[w-right,py]],grid);
    c.fillText((v*100).toFixed(v*100%1===0?0:1),5,py+4);
  }
  c.fillText('cm',4,12);c.fillText('0 s',left,h-4);
  c.textAlign='right';c.fillText(total.toFixed(1)+' s',w-right,h-4);c.textAlign='left';
  const points=samples.map(s=>[x(s.frame.t),y(s.error)]);
  line(c,points,orange,2.6);
  const current=points[index];line(c,[[current[0],12],[current[0],h-22]],ink,1,[3,3]);dot(c,current,orange,5);
}
