import fs from 'node:fs';
import assert from 'node:assert/strict';
import {City as C3, N, G, T} from '../source/src/world.js';
import {City as C2} from '../../build02_review/source/src/world.js';
const dir='/mnt/data/build03_review/inspection';
const fixture=JSON.parse(fs.readFileSync('/mnt/data/build03_review/source/tests/fixtures/tank-build02.json'));
const run=JSON.parse(fs.readFileSync('/mnt/data/build03_review/checks/capture-tank-run.json'));
const pack=c=>({stats:c.stats(),tank:Array.from(c.state.slice(c.tankBase,c.tankBase+17)),floors:c.plan.nodes.map(n=>({id:n.id,position:Array.from(c.state.slice(c.no(n.id),c.no(n.id)+3)),rotation:Array.from(c.state.slice(c.no(n.id)+6,c.no(n.id)+9)),bay:c.plan.buildings[n.b].bay,roof:n.f===c.plan.buildings[n.b].floors-1}))});
const result=[];
for(const [name,C,f] of [['build02-original-sequence',C2,fixture],['build03-original-sequence',C3,fixture],['build03-final-tank-recording',C3,{inputs:run.trace.events.filter(e=>['charge-placed','detonation-armed'].includes(e.kind)),endTime:run.trace.stats.time}]]){
 const c=new C();let steps=0;for(const e of f.inputs){while(c.state[G.time]<e.time-1e-8){c.step();steps++;}assert(c.action(e.kind==='charge-placed'?{type:'charge',node:e.node}:{type:'detonate'}));}
 while(c.state[G.time]<f.endTime-1e-8){c.step();steps++;}
 const p=pack(c);const r={name,steps,...p};if(name.includes('final-tank'))r.maxCapturedTankDifference=Math.max(...r.tank.map((v,i)=>Math.abs(v-run.trace.tank[i])));result.push(r);console.log(name,steps,'tank mode',r.tank[T.mode],'time',r.stats.time,'difference',r.maxCapturedTankDifference??'n/a');
}
fs.writeFileSync(dir+'/reviewer-replayed-tank-states.json',JSON.stringify(result));
