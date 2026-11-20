import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {experiment,nearestFrame} from './model.js';
const frames=JSON.parse(readFileSync(new URL('data/sequence.json',import.meta.url),'utf8')).frames;
test('source timestamps are ordered and all images and matching poses exist',()=>{
  assert.equal(frames.length,64);
  for (const [i,f] of frames.entries()) {
    assert.ok(!i || f.t>frames[i-1].t);
    assert.ok(Math.abs(f.poseTimestamp-f.rgbTimestamp)<.005);
    assert.ok(existsSync(new URL(f.image,import.meta.url)));
    assert.ok(Math.abs(Math.hypot(...f.q)-1)<.001);
  }
});
test('constant coordinate shift contributes no relative displacement and cancels after origin alignment',()=>{
  for (const align of [true,false]) {
    const {samples,rms}=experiment(frames,'offset',.3,align);
    assert.ok(Math.abs(rms-(align?0:.3))<1e-12);
    assert.ok(samples.slice(1).every(s=>s.step<1e-12));assert.equal(samples[0].step,null);
  }
});
test('drift peaks at the last timestamp and survives origin alignment',()=>{
  const {samples,peak}=experiment(frames,'drift',.3,true);
  assert.equal(samples[0].error,0);assert.equal(peak,63);assert.equal(samples[peak].error,.3);
  assert.ok(Math.abs(samples[3].error-.3*frames[3].t/frames.at(-1).t)<1e-12);
});
test('transient deviation peaks inside the run and returns to zero',()=>{
  const {samples,peak}=experiment(frames,'bump',.4,true);
  assert.ok(peak>0 && peak<63 && samples[peak].error>.36);assert.equal(samples[63].error,0);
});
test('clicking the time curve selects closest captured frame including both boundaries',()=>{
  for(const [i,f] of frames.entries())assert.equal(nearestFrame(frames,f.t),i);
  assert.equal(nearestFrame(frames,-1),0);assert.equal(nearestFrame(frames,100),63);
});
