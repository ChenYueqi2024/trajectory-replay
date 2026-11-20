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
  const referenceX = (s.frame.p[0] * 100).toFixed(2);
  const estimateX = (s.estimate[0] * 100).toFixed(2);
  el('calculation').textContent = `第 ${index+1} 帧 · 参考 X 为 ${referenceX} cm，模拟 X 为 ${estimateX} cm。Y、Z 相同，两点距离为 ${cm(s.error)}。`;
  el('prev').disabled=index===0;el('next').disabled=index===frames.length-1;
  pathPlot(el('paths'),result.samples,index,el('plane').value);
  errorPlot(el('errors'),result.samples,index,+el('size').value/100);
}
function recalculate() {
  if (!frames.length) return;
  const mode=el('mode').value, aligned=el('align').checked, size=+el('size').value;
  result=experiment(frames,mode,size/100,aligned);
  el('size').disabled=mode==='clean';el('amount').textContent=(mode==='clean'?0:size)+' cm';
  const rules = {
    offset: `每帧的 X 坐标都加 ${size} cm。试着勾选、再取消「对齐起点」，对比位置误差和相邻帧的位移差。`,
    drift: `偏移量 = ${size} cm × 已过去的时间比例。首帧加 0，走过一半时间加 ${cm(size/200)}，最后一帧加 ${size} cm。点「播放」观察两点分开。`,
    bump: `走到全程时间的 40% 才开始偏移，58% 时设定偏移达 ${size} cm，76% 时回到原轨迹。点「定位最大误差」看最接近峰值的采样帧。`,
    clean: '直接采用每一帧的参考位置。拖动时间轴，观察两点重合时三个指标的读数。'
  };
  el('rule').textContent = rules[mode];
  const notes={offset:aligned?'起点对齐减去了整段共有的平移量，所以各帧的位置误差都为零。':'每帧都偏同样的距离，相邻两帧的偏移会相互抵消。位置可以偏很多，每一步仍能走对。',drift:'对齐只能消除起点的偏移。后来逐步积累的偏差仍会出现在曲线上。',bump:'短时偏移结束后，终点可以完全重合。只检查终点会漏掉中途这次定位偏差。',clean:'估计位置与参考位置逐帧重合，三维位置误差为零。'};
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
  for (const link of document.querySelectorAll('[data-replay]')) {
    link.addEventListener('click', () => {
      el('mode').value=link.dataset.replay;
      el('size').value=30;
      el('align').checked=false;
      recalculate();
      seek(result.peak);
      el('mode').focus({preventScroll:true});
    });
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  new ResizeObserver(paint).observe(el('paths'));
  recalculate();
}
start().catch(()=>{el('clock').textContent='轨迹加载失败，请刷新重试。';});
