import {experiment,nearestFrame} from './model.js';
import {pathPlot,errorPlot,timeFraction} from './plots.js';
const el=id=>document.getElementById(id);
let frames=[], result, index=0,timer=null,started=0,origin=0;
const cm=v=>(100*v).toFixed(1)+' cm';
function paint() {
  if (!result) return;
  const s=result.samples[index];
  if (el('photo').getAttribute('src')!==s.frame.image) el('photo').src=s.frame.image;
  el('photo').alt='TUM 室内相机实拍，第 '+(index+1)+' 帧，时间 '+s.frame.t.toFixed(2)+' 秒';
  el('clock').textContent=s.frame.t.toFixed(2)+' s · '+(index+1)+' / '+frames.length;
  el('time').value=index;
  el('time').setAttribute('aria-valuetext',el('clock').textContent);
  el('current').textContent=cm(s.error);el('rms').textContent=cm(result.rms);
  el('relative').textContent=s.step===null?'首帧':cm(s.step);
  el('prev').disabled=index===0;el('next').disabled=index===frames.length-1;
  pathPlot(el('paths'),result.samples,index,el('plane').value);
  errorPlot(el('errors'),result.samples,index,+el('size').value/100);
}
function recalculate() {
  if (!frames.length) return;
  const mode=el('mode').value, aligned=el('align').checked, size=+el('size').value;
  result=experiment(frames,mode,size/100,aligned);
  el('size').disabled=mode==='clean';el('amount').textContent=(mode==='clean'?0:size)+' cm';
  const notes={offset:aligned?'对齐后，固定平移在每一帧都被抵消。':'两条路径的形状相同。试试对齐起点，看看固定偏差还剩多少。',drift:'误差从起点逐步积累。即使首帧重合，终点仍会分开。',bump:'偏移只发生在中间一段。定位误差峰值，看看它出现在哪一帧。',clean:'估计位置与参考位置逐帧重合，三维位置误差为零。'};
  el('explain').textContent=size===0 && mode!=='clean'?'偏移幅度为零，两条轨迹完全重合。':notes[mode];
  paint();
}
function stop() {
  if (timer!==null) cancelAnimationFrame(timer);
  timer=null;el('play').textContent=index===frames.length-1?'重播':'播放';
}
function seek(to) {
  index=Math.max(0,Math.min(frames.length-1,to));stop();paint();
}
function tick(now) {
  const t=origin+(now-started)/1000;
  if (t>=frames.at(-1).t) {seek(frames.length-1);return;}
  let next=index;
  while(next<frames.length-1 && frames[next+1].t<=t) next++;
  if(next!==index){index=next;paint();}
  timer=requestAnimationFrame(tick);
}
async function start() {
  const r=await fetch('data/sequence.json');
  if(!r.ok) throw Error();
  frames=(await r.json()).frames;
  el('time').max=frames.length-1;
  el('play').disabled=false;
  el('play').onclick=()=>{
    if(timer!==null){stop();return;}
    if(index===frames.length-1)index=0;
    origin=frames[index].t;started=performance.now();paint();el('play').textContent='暂停';
    timer=requestAnimationFrame(tick);
  };
  el('prev').onclick=()=>seek(index-1);el('next').onclick=()=>seek(index+1);
  el('time').oninput=e=>seek(+e.target.value);
  el('peak').onclick=()=>{
    seek(result.peak);
    if (result.samples.every(s=>s.error===result.samples[0].error))
      el('explain').textContent='整段误差相同，每一帧都达到最大值。这里定位到首帧。';
  };
  el('errors').onclick=e=>seek(nearestFrame(frames,timeFraction(el('errors'),e.clientX)*frames.at(-1).t));
  for(const id of ['mode','size','align']) el(id).addEventListener('input',recalculate);
  el('plane').onchange=paint;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  new ResizeObserver(paint).observe(el('paths'));
  recalculate();
}
start().catch(()=>{el('clock').textContent='轨迹加载失败，请刷新重试。';});
