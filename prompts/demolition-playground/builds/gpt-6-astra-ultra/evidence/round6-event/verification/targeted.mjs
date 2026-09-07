import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const app='/tmp/astra-round6-verification/checkout/prompts/demolition-playground/builds/gpt-6-astra-ultra/';
registerHooks({resolve(s,c,n){if(s==='three')return {url:'file://'+app+'vendor/three-0.180.0/three.module.js',shortCircuit:true};return n(s,c);}});
const {EventAudio}=await import(app+'src/event-audio.js');
const {EventTrack,presentationEvents,EVENT_LIMIT}=await import(app+'src/event-track.js');
const {EventVisuals}=await import(app+'src/event-visuals.js');
const {History}=await import(app+'src/history.js');
const THREE=await import('three');
class Param {constructor(){this.value=0;}setTargetAtTime(v){this.value=v;}}
class Node {constructor(ctx,type){this.ctx=ctx;this.type=type;this.connected=false;this.disconnections=0;ctx.nodes.push(this);}connect(n){this.connected=true;return n;}disconnect(){this.connected=false;this.disconnections++;}}
class Source extends Node {constructor(ctx){super(ctx,'source');this.playbackRate=new Param();this.started=false;this.stopped=false;this.onended=null;}start(time,offset){assert.equal(this.started,false);this.started=true;this.startTime=time;this.offset=offset;this.ctx.starts.push(this);}stop(){this.stopped=true;}end(){this.onended?.();}}
class FakeAudioContext {
 constructor(){this.nodes=[];this.starts=[];this.state='suspended';this.currentTime=3;this.destination={};FakeAudioContext.instances.push(this);}
 async resume(){this.state='running';}
 createGain(){const n=new Node(this,'gain');n.gain=new Param();return n;}
 createDynamicsCompressor(){const n=new Node(this,'compressor');for(const k of ['threshold','knee','ratio','attack','release'])n[k]=new Param();return n;}
 createBufferSource(){return new Source(this);}
 createBiquadFilter(){const n=new Node(this,'filter');n.frequency=new Param();n.Q=new Param();return n;}
 createStereoPanner(){const n=new Node(this,'pan');n.pan=new Param();return n;}
 createBuffer(ch,length,rate){return {duration:length/rate,samples:null,copyToChannel(samples){this.samples=samples.slice();}};}
}
FakeAudioContext.instances=[];globalThis.window={AudioContext:FakeAudioContext};
const camera=new THREE.PerspectiveCamera();camera.position.set(0,3,20);camera.updateMatrixWorld();
const event=(id,time,type='blast',material='stone')=>({id,time,type,material,seed:id*43,x:0,y:1,z:0,power:100,mass:4,soundMass:4,speed:7,nx:0,nz:0,vx:0,vy:0,vz:0,spread:1,count:1});
function noVoices(a){assert.equal(a.voices.size,0);for(const n of a.context.nodes)if(!['compressor'].includes(n.type)&&n!==a.master)assert.equal(n.connected,false,'transient '+n.type+' remains connected');}
test('same-timestamp expiry cache cannot leak stale births after restoring a snapshot',()=>{
 const t=new EventTrack();t.emit('blast',{x:0,y:1,z:0},0);const saved=t.capture(),copy=structuredClone(saved);
 t.prune(10);assert.equal(t.events.length,0);t.restore(saved);t.prune(10);assert.equal(t.events.length,0);
 t.restore(saved);t.emit('blast',{x:1,y:1,z:0},10);assert.equal(t.events.length,1);assert.equal(t.events[0].time,10);
 t.emit('blast',{x:2,y:1,z:0},10);assert.equal(t.events.length,2);t.prune(10);assert.equal(t.events.length,2);
 assert.deepEqual(saved,copy);t.prune(15);assert.equal(t.events.length,0);
});
test('real EventAudio owns forward pause slow seek reverse resume mute and zero-level lifecycles',async()=>{
 const a=new EventAudio(),events=[event(1,1.1),event(2,1.4,'contact','glass')];
 a.update(events,1,'forward',1,camera);assert.equal(a.context,undefined,'muted default creates no context');
 await a.enable(true);assert.equal(a.started,0,'enabling sound does not play a blast');
 a.update(events,1,'forward',1,camera);a.update(events,1.2,'forward',1,camera);assert.equal(a.started,1);
 const first=[...a.voices][0];assert.ok(Math.abs(first.source.offset-.1)<1e-8);
 a.update(events,1.2,'paused',1,camera);assert.equal(first.source.stopped,true);noVoices(a);
 a.update(events,1.3,'forward',1,camera);assert.equal(a.started,1,'resume does not replay prior sounds');
 a.update(events,1.45,'forward',1,camera);assert.equal(a.started,2);
 a.update(events,1.46,'forward',.1,camera);noVoices(a);
 a.update([event(3,1.47,'contact')],1.48,'forward',.1,camera);assert.equal([...a.voices][0].source.playbackRate.value,.42);
 a.discontinuity();noVoices(a);a.update(events,1,'paused',.1,camera);a.update(events,1,'forward',.1,camera);assert.equal(a.started,3);
 a.update(events,1.12,'forward',.1,camera);assert.equal(a.started,4);
 a.update(events,1.5,'reverse',1,camera);noVoices(a);a.update(events,1.3,'reverse',1,camera);assert.equal([...a.voices][0].source.playbackRate.value,.72);
 a.discontinuity();noVoices(a);a.update(events,1.7,'forward',1,camera);assert.equal(a.started,5,'forward seek suppresses backlog');
 a.update([event(9,1.8)],1.9,'forward',1,camera);a.setLevel(0);noVoices(a);
 a.update([event(10,2)],2.1,'forward',1,camera);a.setLevel(.35);a.update([event(10,2)],2.11,'forward',1,camera);assert.equal(a.started,6,'unmuting level suppresses backlog');
 a.update([event(11,2.2)],2.3,'forward',1,camera);await a.enable(false);noVoices(a);assert.equal(a.enabled,false);
});
test('real EventAudio retained replay has identical buffer choices and exact reversed samples',async()=>{
 const a=new EventAudio();await a.enable(true);const es=[event(4,1.1,'contact','glass'),event(5,1.2,'contact','steel')];
 a.update(es,1,'forward',1,camera);a.update(es,1.25,'forward',1,camera);const live=a.context.starts.map(s=>s.buffer);
 a.discontinuity();a.update(es,1,'forward',1,camera);a.update(es,1.25,'forward',1,camera);assert.deepEqual(a.context.starts.slice(2).map(s=>s.buffer),live);
 for(const e of es)assert.deepEqual(a.buffer(e,true).samples,a.buffer(e,false).samples.slice().reverse());
 for(const v of [...a.voices])v.source.end();noVoices(a);
});
test('actual voice eviction, buffer caching and repeated cleanup stay bounded',async()=>{
 const a=new EventAudio();await a.enable(true);
 for(let cycle=0;cycle<20;cycle++){
   const es=Array.from({length:30},(_,i)=>event(cycle*30+i+1,cycle+.01+i*.001,i%2?'contact':'blast',['stone','wood','steel','glass'][i%4]));
   a.discontinuity();a.update(es,cycle,'forward',1,camera);a.update(es,cycle+.1,'forward',1,camera);
   assert.ok(a.voices.size<=12);assert.ok(a.peakVoices<=12);assert.ok(a.cache.size<=192);assert.equal(a.stats.queued,0);
   a.discontinuity();noVoices(a);
 }
 for(let i=0;i<230;i++)a.buffer(event(i,0,'contact','test-material-'+i),false);
 assert.equal(a.cache.size,192);assert.equal(a.context.nodes.filter(n=>n.type==='source'&&n.started&&!n.stopped).length,0);
});
test('recorded grouped events reproduce the actual live audio selection on retained replay',async()=>{
 const a=new EventAudio(),track=new EventTrack(),frames=[];await a.enable(true);a.update([],0,'forward',1,camera);
 for(let i=1;i<=60;i++){
  const time=i*.05;
  for(let j=0;j<5;j++)track.emit(i%10===0?'blast':i%3===0?'release':'contact',{x:j,y:2,z:1},time-.01,{material:['stone','glass','steel'][i%3],mass:2,power:20});
  frames.push({time,events:track.capture().events});a.update(track.events,time,'forward',1,camera);
 }
 const live=a.context.starts.map(s=>({buffer:s.buffer,rate:s.playbackRate.value,offset:s.offset}));assert.ok(live.length>20);
 a.discontinuity();a.update([],0,'forward',1,camera);const before=a.context.starts.length;
 for(const f of frames)a.update(f.events,f.time,'forward',1,camera);
 assert.deepEqual(a.context.starts.slice(before).map(s=>({buffer:s.buffer,rate:s.playbackRate.value,offset:s.offset})),live);
 a.discontinuity();noVoices(a);
});
test('actual visual buffers reproduce pre-cutoff births and remain bounded through repeated renders and reset',()=>{
 const t=new EventTrack(),h=new History(60);t.emit('dust',{x:1,y:1,z:1},0,{spread:2});
 for(let i=0;i<=1220;i++){let time=i*.05;t.prune(time);h.record(time,{eventTrack:t.capture()});}
 const sample=h.sample(2);assert.ok(h.start>0);const events=presentationEvents(sample.a.eventTrack.events,sample.b.eventTrack.events,2);
 const v=new EventVisuals(new THREE.Scene());v.render(events,2);assert.ok(v.stats.clouds>0);const matrices=v.clouds.instanceMatrix.array.slice();
 v.render(events,4);v.render(events,2);assert.deepEqual(v.clouds.instanceMatrix.array,matrices,'seek reconstructs exact visual transforms');
 const many=Array.from({length:EVENT_LIMIT},(_,i)=>event(i,.1,'blast'));
 for(let i=0;i<20;i++){v.render(many,.2,'high');assert.ok(v.stats.clouds<=480);assert.ok(v.stats.grains<=960);assert.ok(v.stats.lights<=3);v.render(many,.2,'low');assert.ok(v.stats.clouds<=240);assert.ok(v.stats.grains<=320);v.render([],0);assert.deepEqual(v.stats,{clouds:0,grains:0,lights:0});}
 assert.ok(v.clouds.instanceMatrix.array.every(Number.isFinite));assert.ok(v.positions.array.every(Number.isFinite));
});
