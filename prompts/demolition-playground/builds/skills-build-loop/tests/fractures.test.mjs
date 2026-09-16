import test from 'node:test';
import assert from 'node:assert/strict';
import {City,History,N,P,T,G,DT} from '../src/world.js';
import {corners,rotate} from '../src/fractures.js';
const run=(c,t)=>{for(let i=0;i<t*60;i++)c.step();};
const charge=(c,ids)=>{for(const node of ids)assert(c.action({type:'charge',node}));assert(c.action({type:'detonate'}));};

test('every shed piece belongs to a bounded spatial chunk, with room for the whole city',()=>{
 const c=new City();assert(c.fractures.total<c.capacity);let loose=0;
 for(const n of c.plan.nodes)for(const g of c.fractures.nodes[n.id]){
  for(const p of g.parts){assert.equal(p.fracture,g.ordinal);for(const v of corners(p))for(let k=0;k<3;k++)assert(Math.abs(v[k]-g.center[k])<=g.half[k]+1e-9);}
  if(g.loose){loose++;assert.equal(g.parts.length,1);}
  if(!g.parts.some(p=>p.geo==='pediment'))assert(g.half[0]<n.sx&&g.half[2]<n.sz);
 }assert(loose>200);
});
test('rotated carried geometry stays above physical ground through falling and sleeping',()=>{
 const c=new City();for(const id of [1,55,158,224])c.damage(id,2.8,[20,0,5]);let checked=0;
 for(let t=0;t<600;t++){c.step();for(let i=0;i<c.capacity;i++){const o=c.po(i),s=c.state;if(!s[o+P.owner])continue;const g=c.fractures.group(s[o+P.owner]-1,s[o+P.ordinal]);
  const half=c.fragmentExtent(o);assert(s[o+1]-half[1]>=.35-1e-8);
  if(t%60===0)for(const p of g.parts)for(const v of corners(p)){const world=rotate(v.map((x,k)=>x-g.center[k]),Array.from(s.slice(o+6,o+9)));assert(world[1]+s[o+1]>=.35-1e-8);checked++;}
 }}assert(checked>1000);
});
test('tank detaches, rotates, ruptures, survives as a body, and falls when its roof is lost',()=>{
 const c=new City(),n=c.plan.nodes.find(n=>n.water),q=c.tankBase;charge(c,[n.id]);run(c,3);
 assert(c.state[q+T.mode]);assert(c.state[q+T.ruptured]);assert(Math.hypot(c.state[q+6],c.state[q+8])>.1);
 assert(c.events.find(e=>e.kind==='tank-detached').time<c.events.find(e=>e.kind==='water-burst').time);
 const height=c.state[q+1];charge(c,[147,148,149,150,151,152]);run(c,3);charge(c,[153,154,155]);run(c,18);
 assert(c.events.some(e=>e.kind==='tank-support-lost'));assert(c.state[q+1]<height-10);assert(c.state[q+T.ruptured]);assert(c.stats().waterImpulse>0);
});
test('tank motion, rupture and support loss restore exactly and replacement futures abandon later wreckage',()=>{
 const c=new City(),h=new History(c),n=c.plan.nodes.find(n=>n.water);h.action({type:'charge',node:n.id});h.action({type:'detonate'});
 const saved=[];for(let i=0;i<240;i++){h.advance();if([4,15,60,239].includes(i))saved.push({frame:h.cursor,state:c.state.slice()});}
 for(const p of saved.reverse()){h.seek(p.frame);assert.deepEqual(c.state,p.state);}h.seek(0);h.action({type:'swing',x:2,z:0});for(let i=0;i<240;i++)h.advance();assert.equal(c.state[c.tankBase+T.ruptured],0);assert(!c.events.some(e=>e.kind==='water-burst'));
});
test('surviving connections carry a displaced section before strain and floor impacts break it',()=>{
 const c=new City();charge(c,[0,1,2,3,4,5]);let connectedMoving=0,maxTilt=0;
 for(let i=0;i<900;i++){c.step();for(const j of c.plan.joints){if(j.b<0||c.state[c.jointBase+j.id]<=.1)continue;const a=c.no(j.a),b=c.no(j.b);if(c.state[a+N.mode]===1&&c.state[b+N.mode]===1){connectedMoving++;maxTilt=Math.max(maxTilt,Math.hypot(c.state[a+6],c.state[a+8]));}}}
 assert(connectedMoving>100);assert(maxTilt>.05);assert(c.events.some(e=>e.kind==='connection-broken'&&(e.cause==='floor-impact'||e.cause==='rubble-impact')));assert(c.plan.nodes.filter(n=>n.b===0).every(n=>c.state[c.no(n.id)+N.mode]===2));
});
test('facade damage retains supported columns; released columns collide with surviving floors',()=>{
 const c=new City(),id=123,o=c.no(id);c.damage(id,.8,[0,0,0]);run(c,5);assert.equal(c.state[o+N.mode],0);
 for(let i=0;i<c.capacity;i++){const q=c.po(i);if(c.state[q+P.owner]===id+1)assert(!c.fractures.group(id,c.state[q+P.ordinal]).column);}
 const d=new City();charge(d,[id]);run(d,5);assert(d.events.some(e=>e.cause==='chunk-floor-contact'));
});
test('a tilted tall chunk tips under contact torque before it sleeps',()=>{
 const c=new City(),n=c.plan.nodes[1];c.damage(n.id,2.8,[20,0,0]);let q;
 for(let i=0;i<c.capacity;i++){const o=c.po(i);if(c.state[o+P.owner]===2){const g=c.fractures.group(1,c.state[o+P.ordinal]);if(g.half[1]>g.half[2]*2&&!g.loose){q=o;break;}}}assert(q!==undefined);
 c.state[q+6]=.5;c.state[q+8]=0;c.state[q]=60;c.state[q+2]=0;c.state[q+1]=c.fragmentExtent(q)[1]+.35;c.state.fill(0,q+3,q+6);c.state.fill(0,q+9,q+12);const initial=c.fragmentExtent(q)[1];run(c,8);assert(c.fragmentExtent(q)[1]<initial*.7);assert.equal(c.state[q+P.sleep],1);
});
test('constrained bay velocity agrees with displacement before contact response',()=>{
 const c=new City();charge(c,[0]);let checked=0,before,integrated=false;
 const solve=c.solveConnections.bind(c),floors=c.slabBodies.bind(c);
 c.solveConnections=()=>{solve();integrated=true;};
 // Whole-slab edge contacts now happen during this fixture's first second.
 // Check reconstruction at the collision boundary, before a valid impulse or
 // separation changes velocity and position independently.
 c.slabBodies=()=>{if(integrated){integrated=false;for(const n of c.plan.nodes){const o=c.no(n.id);if(before[o+N.mode]===1&&c.state[o+N.mode]===1){for(let k=0;k<3;k++)assert(Math.abs(c.state[o+3+k]-(c.state[o+k]-before[o+k])/DT)<1e-8);checked++;}}}return floors();};
 for(let i=0;i<60;i++){before=c.state.slice();c.step();}assert(checked>0);
});
test('a bay first released by a floor impact keeps its contact velocity until integration',()=>{
 const c=new City(),s=c.state,source=c.no(6),target=c.no(24);c.breakConnections(6,'test-release');s[source+N.mode]=1;
 s[source]=s[target];s[source+1]=s[target+1]+.4;s[source+2]=s[target+2];s[source+4]=-10;const before=Array.from(s.slice(target,target+3));c.step();
 assert.equal(s[target+N.mode],1);assert.deepEqual(Array.from(s.slice(target,target+3)),before);assert(Math.hypot(...s.slice(target+3,target+6))<20,'no stale-position launch velocity');
});
