import test from 'node:test';
import assert from 'node:assert/strict';
import {EventTrack,EventTransport,presentationEvents,EVENT_LIMIT} from '../src/event-track.js';
import {synthesizeVoice} from '../src/event-audio.js';
import {History} from '../src/history.js';
const point={x:1,y:2,z:3};
test('event aggregation cannot mutate an already recorded history frame',()=>{
 const track=new EventTrack();track.emit('contact',point,1,{mass:2,power:30});const saved=track.capture(),copy=structuredClone(saved);
 track.emit('contact',point,1.01,{mass:3,power:40});assert.equal(track.events.length,1);assert.equal(track.events[0].mass,5);assert.deepEqual(saved,copy);
 track.restore(saved);track.emit('blast',point,1.1);const alternate=track.capture();track.restore(saved);track.emit('blast',point,1.1);assert.deepEqual(track.capture(),alternate);
});
test('a dust birth preceding the oldest retained frame still renders and expires by simulation time',()=>{
 const track=new EventTrack(),history=new History(60);track.emit('dust',point,0,{spread:2});
 for(let i=0;i<=1210;i++){const time=i*.05;track.prune(time);history.record(time,{time,eventTrack:track.capture()});}
 assert.ok(history.start>0);const sample=history.sample(history.start+1);assert.equal(presentationEvents(sample.a.eventTrack.events,sample.b.eventTrack.events,sample.time).length,1);
 const late=history.sample(10);assert.equal(presentationEvents(late.a.eventTrack.events,late.b.eventTrack.events,10).length,0);
});
test('interpolated history births do not appear before their recorded time',()=>{
 const track=new EventTrack(),a=track.capture();track.emit('blast',point,1.03);const b=track.capture();
 assert.equal(presentationEvents(a.events,b.events,1.02).length,0);assert.equal(presentationEvents(a.events,b.events,1.04).length,1);assert.equal(a.events.length,0);
});
test('discarded future events cannot leak into restored alternate futures or pristine rebuild',()=>{
 const track=new EventTrack(),pristine=track.capture();track.emit('blast',point,1);const past=track.capture();track.emit('contact',point,2);const future=track.capture();
 track.restore(past);track.emit('blast',{x:9,y:1,z:0},2);assert.notDeepEqual(track.capture(),future);assert.equal(track.events.some(e=>e.type==='contact'),false);
 track.restore(pristine);assert.deepEqual(track.capture(),pristine);
});
test('presentation admission and expiry bound sustained effects without evicting active births',()=>{
 const track=new EventTrack();for(let i=0;i<2000;i++)track.emit('contact',{x:i*3,y:2,z:1},1,{material:'glass'});
 assert.equal(track.events.length,EVENT_LIMIT-16);assert.equal(track.events[0].id,1);
 for(let i=0;i<16;i++)track.emit('blast',point,1+i*.01);assert.equal(track.events.length,EVENT_LIMIT);assert.equal(track.events.filter(e=>e.type==='blast').length,16);track.prune(10);assert.equal(track.events.length,0);
});
test('retained normal replay reproduces forward audio choices while pause seek and resume suppress backlog',()=>{
 const track=new EventTrack();track.emit('blast',point,1.1);track.emit('contact',point,1.4);const transport=new EventTransport();
 transport.advance(track.events,1,'forward');const live=[...transport.advance(track.events,1.2,'forward').events,...transport.advance(track.events,1.5,'forward').events];
 assert.equal(live.length,2);assert.equal(transport.advance(track.events,1.5,'paused').stop,true);assert.deepEqual(transport.advance(track.events,1,'paused').events,[]);
 assert.deepEqual(transport.advance(track.events,1,'forward').events,[]);const replay=[...transport.advance(track.events,1.2,'forward').events,...transport.advance(track.events,1.5,'forward').events];assert.deepEqual(replay,live);
 transport.reset();assert.equal(transport.advance(track.events,1.6,'forward').events.length,0);
});
test('slow motion and reverse use explicit crossings and stop on every time-policy transition',()=>{
 const track=new EventTrack();track.emit('blast',point,1.1);const t=new EventTransport();t.advance(track.events,1,'forward');assert.equal(t.advance(track.events,1.01,'forward',.1).stop,true);
 assert.equal(t.advance(track.events,1.12,'forward',.1).events.length,1);assert.equal(t.advance(track.events,1.2,'reverse',1).stop,true);assert.equal(t.advance(track.events,1,'reverse',1).events.length,1);assert.equal(t.advance(track.events,.99,'reverse',1).events.length,0);
});
test('procedural material choices are deterministic, distinct, finite and bounded with headroom',()=>{
 const outputs=[];for(const material of ['stone','glass','steel','wood']){const a=synthesizeVoice('contact',material,3);assert.deepEqual(a,synthesizeVoice('contact',material,3));assert.ok(a.some(x=>Math.abs(x)>.01));assert.ok(a.every(x=>Number.isFinite(x)&&Math.abs(x)<=.85));outputs.push(a);}
 for(let i=1;i<outputs.length;i++)assert.notDeepEqual(outputs[0],outputs[i]);
});
