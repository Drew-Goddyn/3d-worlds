import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../src/bank.js');
const {Simulation}=await import('../src/simulation.js');
function fixture(){const scene=new THREE.Scene(),b={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(b,scene);return new Simulation({buildings:[b],props:[],crowd:[],pigeons:[]},scene);}
function charges(sim){for(const [x,z]of [[-15.7,19.65],[-11,19.65],[-6.3,19.65],[-4.8,10],[-4.8,14],[-4.8,17.8]])assert.ok(sim.placeCharge(new THREE.Vector3(x,1.3,z),0,0));sim.detonate();}
const advance=(sim,n)=>{for(let i=0;i<n;i++)sim.update(1/60);};
const position=b=>new THREE.Vector3(b.x,b.y,b.z);

test('ordinary charge strength carries connected architecture through a measurable fall before contact breakup',()=>{
  const sim=fixture(),retained=sim.bank.bodies.length;charges(sim);let witnessed=0,maxPieces=0;
  for(let frame=0;frame<300;frame++) {
    const bodies=sim.bank.bodies,groups=new Map();
    for(const b of bodies)if(b.cluster>=0){if(!groups.has(b.cluster))groups.set(b.cluster,[]);groups.get(b.cluster).push(b);}
    const before=[...groups.values()].filter(g=>g.length>=8).map(g=>({a:g[0],b:g.at(-1),id:g[0].cluster,d:position(g[0]).distanceTo(position(g.at(-1))),y:g[0].y}));
    sim.update(1/60);maxPieces=Math.max(maxPieces,sim.bank.stats.connectedPieces);
    for(const pair of before)if(pair.a.cluster===pair.id&&pair.b.cluster===pair.id&&Math.abs(pair.a.y-pair.y)>.002){assert.ok(Math.abs(position(pair.a).distanceTo(position(pair.b))-pair.d)<1e-8,'a connected section must not stretch');witnessed++;}
  }
  assert.ok(maxPieces>50,'a substantial amount of real construction remains connected in motion');assert.ok(witnessed>10,'connected fall persists across frames');
  advance(sim,600);assert.equal(sim.bank.stats.connectedPieces,0,'contacts break the moving sections into retained resting construction');assert.equal(sim.bank.stats.loose,0);assert.equal(sim.bank.bodies.length,retained);
});

test('a new charge on moving connected construction splits the current remnant and restores its exact future',()=>{
  const sim=fixture();charges(sim);const bank=sim.bank;
  // Intervene when construction is actually in connected flight, after its
  // bearings have failed; this fixture does not prescribe an animation time.
  let part;for(let frame=0;frame<300&&!part;frame++){sim.update(1/60);part=bank.bodies.find(b=>b.cluster>=0&&b.role!=='glass');}assert.ok(part,'ordinary charges must create a moving section within five seconds');
  const mid=sim.capture(),copy=structuredClone(mid);advance(sim,120);const oldFuture=sim.capture();sim.restore(mid);
  const point=bank.bounds(part).getCenter(new THREE.Vector3());assert.ok(sim.placeCharge(point,0,bank.nodes[part.node].level,part.id));sim.detonate();
  const charged=sim.capture();advance(sim,120);const changed=sim.capture();assert.notDeepEqual(changed,oldFuture);
  sim.restore(charged);advance(sim,120);assert.deepEqual(sim.capture(),changed,'solver membership, momentum, contacts and random state must restore');assert.deepEqual(mid,copy);
});

test('compound motion hands a fractured piece to individual motion only on the following step',()=>{
  const sim=fixture(),bank=sim.bank;
  const n=bank.nodes[8];bank.cohesion.releaseBay(n,new THREE.Vector3(1,-1,0),2);
  const section=bank.cohesion.sections.find(s=>s.state===1);assert.ok(section);
  const members=bank.bodies.filter(b=>b.cluster>=0);for(const b of members)b.y-=1.5;
  for(const s of bank.cohesion.sections)s.y-=1.5;
  sim.update(1/60);
  for(const b of members)if(bank.cohesion.moved.has(b.id)&&b.cluster<0)assert.ok(bank.bounds(b).min.y>=.22999,'contact correction holds for the entire transition frame');
  assert.ok(bank.cohesion.sections.length<bank.bodies.length,'section allocation remains bounded by retained construction');
});
