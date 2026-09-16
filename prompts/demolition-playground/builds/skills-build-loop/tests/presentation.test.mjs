import test from 'node:test';
import assert from 'node:assert/strict';
import { City, Playback, G, P, DT } from '../src/world.js';

for (const setting of ['speed','holdSlow']) test(`10% ${setting} changes every presented moving pose`,()=>{
  const p=new Playback(new City(undefined,64));p[setting]=setting==='speed'?.1:true;
  let previous=p.sample()[G.bx],changed=0;const deltas=[];
  for(let i=0;i<120;i++){p.tick(DT);const x=p.sample()[G.bx];deltas.push(Math.abs(x-previous));changed+=x!==previous;previous=x;}
  assert.equal(changed,120);assert(Math.abs(p.city.state[G.time]-.2)<1e-9);
  assert(Math.max(...deltas)<.003,'no boundary jump at the physical tick');
});
test('passive slow playback samples the recorded future without altering it',()=>{
 const p=new Playback(new City(undefined,64));for(let i=0;i<120;i++)p.tick(DT);const final=p.city.state.slice(),bytes=p.history.bytes,end=p.history.end;
 p.scrub(0);p.speed=.1;p.play();let prior=p.sample()[G.bx],changed=0;
 for(let i=0;i<120;i++){p.tick(DT);const x=p.sample()[G.bx];changed+=prior!==x;prior=x;}
 assert.equal(changed,120);assert.equal(p.history.end,end);assert.equal(p.history.bytes,bytes);p.scrub(end);assert.deepEqual(p.sample(),final);
});
test('reverse and rebuild use duration regardless of same-time input density',()=>{
 const times=[];for(const dense of [false,true]){const p=new Playback(new City(undefined,64));for(let i=0;i<120;i++)p.tick(DT,dense?{type:'crane',rotate:1}:null);
 p.mode='rewind';for(let i=0;i<30;i++)p.tick(DT);times.push(p.time);}
 assert(Math.abs(times[0]-1)<1e-9);assert(Math.abs(times[0]-times[1])<1e-9);
});
test('fractional scrubbing and reverse sample the same trajectory; exact moments are exact',()=>{
 const p=new Playback(new City(undefined,64));for(let i=0;i<120;i++)p.tick(DT);
 p.scrubTime(.513);const sample=p.sample().slice();assert(Math.abs(sample[G.time]-.513)<1e-9);p.scrubTime(.53);p.mode='rewind';p.tick(.0085);assert.deepEqual(p.sample(),sample);
 p.scrub(30);assert.deepEqual(p.sample(),p.city.state);
});
test('an interpolated intervention restores the preceding physical moment; rejection preserves both view and future',()=>{
 const p=new Playback(new City(undefined,64));for(let i=0;i<120;i++)p.tick(DT);p.scrubTime(.513);const shown=p.sample().slice(),before=p.city.state.slice(),end=p.history.end;
 assert(!p.act({type:'charge',node:-1}));assert.deepEqual(p.sample(),shown);assert.equal(p.history.end,end);
 assert(p.act({type:'swing',x:2,z:0}));assert.equal(p.time,before[G.time]);assert.equal(p.city.state[G.bx],before[G.bx]);assert.equal(p.city.state[G.bvx],before[G.bvx]+2);assert.equal(p.history.branchCount,1);
});
test('sampling never blends births, deaths, recycled identities or discrete scores',()=>{
 const p=new Playback(new City(undefined,8)),c=p.city,h=p.history;
 c.fragment(0,3,0,0,1);h.record();const id=c.state[c.po(0)+P.id],before=c.state.slice();
 c.step();c.state[c.po(0)+P.id]=id+99;c.state[c.po(0)]=100;c.state[G.score]=100;h.record();p.scrub(1);p.accumulator=DT/2;
 const sample=p.sample();assert.equal(sample[c.po(0)],before[c.po(0)]);assert.equal(sample[c.po(0)+P.id],id);assert.equal(sample[G.score],0);assert.equal(h.cursor,1);
});
test('held crane rotation, cable and pumping are included in live slow presentation',()=>{
 for(const [input,index]of [[{rotate:1},G.angle],[{cable:1},G.length],[{pumpX:1},G.bx]]){
  const p=new Playback(new City(undefined,64));p.speed=.1;let previous=p.sample()[index],changed=0;const deltas=[];
  for(let i=0;i<120;i++){p.tick(DT,{type:'crane',...input});const x=p.sample()[index];deltas.push(Math.abs(x-previous));changed+=previous!==x;previous=x;}
  assert.equal(changed,120);assert(Math.max(...deltas)<(index===G.length?.021:index===G.angle?.0011:.03));
 }
});
test('passive slow and reverse crane motion include ordered actions at the next moment',()=>{
 const p=new Playback(new City(undefined,64));for(let i=0;i<120;i++)p.tick(DT,{type:'crane',rotate:1});
 p.scrubTime(.5);p.speed=.1;p.play();let previous=p.sample()[G.angle],changed=0;
 for(let i=0;i<120;i++){p.tick(DT);const x=p.sample()[G.angle];assert(Math.abs(x-previous)<.0011);changed+=x!==previous;previous=x;}assert.equal(changed,120);
 p.scrubTime(.7);p.mode='rewind';previous=p.sample()[G.angle];changed=0;
 for(let i=0;i<120;i++){p.tick(DT*.05);const x=p.sample()[G.angle];assert(Math.abs(x-previous)<.0011);changed+=x!==previous;previous=x;}assert.equal(changed,120);
});
