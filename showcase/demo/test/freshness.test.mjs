import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectFreshness} from '../freshness.mjs';
test('fresh capture supplies every30fps output sample without an extra hold',()=>{
 const capture={frames:Array.from({length:31},(_,i)=>({timestamp:i/60}))};
 const report=inspectFreshness(capture,{start:0,duration:.5});assert.equal(report.status,'pass');assert.equal(report.repeatedOutputFrames,0);
});
test('a sub100ms capture omission is inconclusive even when the long-gap gate would ignore it',()=>{
 const frames=Array.from({length:31},(_,i)=>({timestamp:i/60})).filter(f=>f.timestamp<.1||f.timestamp>=.183333);
 const report=inspectFreshness({frames},{start:0,duration:.5});assert.equal(report.status,'inconclusive');assert.ok(report.repeatedOutputFrames>0);assert.ok(report.sourceIntervals.some(g=>g.seconds<=.1));
});
test('native stall claims cannot automatically excuse missing capture evidence',()=>{
 const report=inspectFreshness({frames:[{timestamp:0},{timestamp:.2},{timestamp:.3}]},{start:0,duration:.3,gaps:[{classification:'native-animation-stall'}]});
 assert.equal(report.status,'inconclusive');assert.match(report.nativeStallPolicy,/positive evidence/);
});
