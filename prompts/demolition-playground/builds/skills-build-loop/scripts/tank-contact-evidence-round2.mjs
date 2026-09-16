// A disclosed failing physical-contact probe, replaying the final recorded controls.
import {readFile,writeFile} from 'node:fs/promises';
import {Vector3,Matrix4,Quaternion,Euler} from 'three';
import {City,G} from '../src/world.js';
import {sourceIdentity} from './source-identity.mjs';
const capture=JSON.parse(await readFile('review/build-02/checks/capture-tank-run.json','utf8'));
const c=new City(),s=c.state;
for(const e of capture.trace.events.filter(e=>['charge-placed','detonation-armed'].includes(e.kind))){
  while(s[G.time]<e.time-1e-8)c.step();
  if(!c.action(e.kind==='charge-placed'?{type:'charge',node:e.node}:{type:'detonate'}))throw Error('Recorded action was rejected');
}
while(s[G.time]<capture.trace.stats.time-1e-8)c.step();
const q=c.tankBase,position=new Vector3(...s.slice(q,q+3));
const rotation=new Euler(...s.slice(q+6,q+9)),tank=new Matrix4().compose(position,new Quaternion().setFromEuler(rotation),new Vector3(1,1,1));
const floors=c.plan.nodes.map(n=>({node:n.id,half:[(c.plan.buildings[n.b].bay-.06)/2,.19,(c.plan.buildings[n.b].bay-.06)/2],inverse:new Matrix4().compose(new Vector3(...s.slice(c.no(n.id),c.no(n.id)+3)),new Quaternion().setFromEuler(new Euler(...s.slice(c.no(n.id)+6,c.no(n.id)+9))),new Vector3(1,1,1)).invert()}));
const intersections=[];
for(let a=0;a<=96;a++)for(let y=0;y<=64;y++){
  const theta=.7+Math.PI*1.5*a/96,point=new Vector3(1.9*Math.sin(theta),-1.55+3.1*y/64,1.9*Math.cos(theta)).applyMatrix4(tank);
  for(const f of floors){const local=point.clone().applyMatrix4(f.inverse);if([local.x,local.y,local.z].every((v,k)=>Math.abs(v)<f.half[k]-.001))intersections.push({floor:f.node,point:point.toArray(),depthBelowSlabSurface:f.half[1]-Math.abs(local.y)});}
}
const stats=c.stats(),keys=['time','tons','createdFragments','waterImpulse','active','sleeping'];
const report={sourceIdentity:await sourceIdentity(),method:'Replay the final tank recording charge-placement and detonation event times through City.action and fixed City.step. Sample the rendered 270-degree wooden shell surface in world space against each actual rotated floor slab box. This is a diagnostic, not a passing acceptance test.',recordedControlReplayMatches:keys.every(k=>Math.abs(stats[k]-capture.trace.stats[k])<1e-8),replayedStats:stats,captureStats:capture.trace.stats,tankPosition:position.toArray(),tankEuler:rotation.toArray().slice(0,3),surfaceSamples:97*65,intersectingSamples:intersections.length,affectedFloors:[...new Set(intersections.map(p=>p.floor))],examples:intersections.slice(0,12),status:intersections.length?'unresolved-contact-defect':'no-shell-slab-intersection-in-this-probe'};
await writeFile('review/build-02/checks/tank-contact-diagnostic.json',JSON.stringify(report,null,2));
console.log({status:report.status,replayMatches:report.recordedControlReplayMatches,intersectingSamples:intersections.length,affectedFloors:report.affectedFloors});
