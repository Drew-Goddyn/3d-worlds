import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=pathToFileURL(resolve(process.env.ASTRA_APP_ROOT??process.cwd())+'/');
registerHooks({resolve(s,c,n){return s==='three'?{url:new URL('vendor/three-0.180.0/three.module.js',root).href,shortCircuit:true}:n(s,c);}});
const THREE=await import('three');
const {createBank}=await import(new URL('src/bank.js',root));
const {Simulation}=await import(new URL('src/simulation.js',root));
const {BankPhysics}=await import(new URL('src/bank-physics.js',root));
function fixture(){const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);return new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene);}
function advance(s,n){for(let i=0;i<n;i++)s.update(1/60);}
function charge(s,points){for(const p of points)assert.equal(s.placeCharge(new THREE.Vector3(...p),0,0),true);s.detonate();}
function small(specs){
  const bodies=specs.map((s,id)=>{const size=new THREE.Vector3(...s.size),bounds=new THREE.Box3(size.clone().multiplyScalar(-.5),size.clone().multiplyScalar(.5));return {id,node:0,role:'stone',origin:new THREE.Vector3(...s.pos),mass:1,size,bounds,parts:[{collisionBounds:bounds.clone()}],fixed:false};});
  const recipe={building:{id:0,x:0,z:0},batches:[],nodes:[{id:0,level:0,below:-1,x:0,y:0,z:0,bodies:bodies.map(b=>b.id),supports:[],neighbors:[]}],bodies};
  const sim={floors:[],buildingStates:[],time:0,tonnage:0,random:()=>.5,lastImpact:new THREE.Vector3(),_emit(){},_emitDust(){},_affectProps(){}};
  const bank=new BankPhysics(recipe,sim);sim.bank=bank;return bank;
}
let geometryQueries=0;
function checkGeometry(bank){
  for(const b of bank.bodies){
    const direct=bank.composeBody(b),box=b.bounds.clone().applyMatrix4(direct);
    assert.deepEqual(bank.bodyMatrix(b),direct,`matrix for retained member ${b.id}`);
    assert.deepEqual(bank.bounds(b),box,`overall bounds for retained member ${b.id}`);
    const actual=bank.solidBounds(b);assert.equal(actual.length,b.parts.length);
    for(let i=0;i<actual.length;i++)assert.deepEqual(actual[i],b.parts[i].collisionBounds.clone().applyMatrix4(direct),`solid part ${i} of member ${b.id}`);
    for(const value of direct.elements)assert.ok(Number.isFinite(value));
    geometryQueries++;
  }
}
function currentRoots(bank){
  const rooted=new Set(),adjacent=new Map(),grid=new Map(),boxes=new Map(),parts=new Map();
  const solids=bank.bodies.filter(b=>(b.state===0||b.fixed)&&!b.content&&!['glass','paper'].includes(b.role));
  for(const b of bank.bodies){const m=bank.composeBody(b);boxes.set(b.id,b.bounds.clone().applyMatrix4(m));parts.set(b.id,b.parts.map(p=>p.collisionBounds.clone().applyMatrix4(m)));}
  for(const b of solids){
    if(b.fixed)rooted.add(b.id);adjacent.set(b.id,new Set());
    const box=boxes.get(b.id).clone().expandByScalar(.18);
    for(let x=Math.floor(box.min.x/3);x<=Math.floor(box.max.x/3);x++)for(let z=Math.floor(box.min.z/3);z<=Math.floor(box.max.z/3);z++){
      const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(b.id);
    }
  }
  const seen=new Set();
  for(const group of grid.values())for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){
    const left=group[i],right=group[j],key=Math.min(left,right)+':'+Math.max(left,right);if(seen.has(key))continue;seen.add(key);
    if(!boxes.get(left).clone().expandByScalar(.18).intersectsBox(boxes.get(right)))continue;
    if(parts.get(left).some(a=>parts.get(right).some(b=>a.clone().expandByScalar(.18).intersectsBox(b)))){adjacent.get(left).add(right);adjacent.get(right).add(left);}
  }
  const queue=[...rooted];for(let i=0;i<queue.length;i++)for(const id of adjacent.get(queue[i])??[])if(!rooted.has(id)){rooted.add(id);queue.push(id);}
  const surfaces=bank.bodies.filter(b=>b.state!==1&&!['glass','paper'].includes(b.role));
  const settled=bank.bodies.filter(b=>b.state===2);
  for(const b of settled)if(parts.get(b.id).some(p=>p.min.y<=.25))rooted.add(b.id);
  let changed=true;while(changed){changed=false;for(const b of settled)if(!rooted.has(b.id)){
    if(surfaces.some(other=>other.id!==b.id&&rooted.has(other.id)&&parts.get(b.id).some(incoming=>parts.get(other.id).some(box=>incoming.max.x>box.min.x&&incoming.min.x<box.max.x&&incoming.max.z>box.min.z&&incoming.min.z<box.max.z&&Math.abs(box.max.y-incoming.min.y)<.045)))){rooted.add(b.id);changed=true;}
  }}
  return rooted;
}

test('ordinary side demolition keeps cached geometry identical to current direct geometry through contact, restore, and interpolation',()=>{
  const s=fixture();charge(s,[[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]);
  const count=s.bank.bodies.length;let past,copy;
  for(let i=0;i<=210;i++){
    if(i%30===0)checkGeometry(s.bank);
    if(i===90){past=s.capture();copy=structuredClone(past);}
    if(i<210)s.update(1/60);
  }
  const future=s.capture(),fresh=fixture();fresh.restore(past);checkGeometry(fresh.bank);advance(fresh,120);
  assert.deepEqual(fresh.capture(),future,'fresh restore must resume the exact future');
  s.restore(past,future,.67);checkGeometry(s.bank);assert.deepEqual(s.capture(),past,'interpolation cannot change resumable state');
  s.restore(past);advance(s,120);assert.deepEqual(s.capture(),future,'warmed cache must resume the exact future');
  fresh.restore(past);const b=fresh.bank.bodies.find(b=>b.state===0&&b.role==='pier'&&fresh.bank.nodes[b.node].level===1);
  assert.ok(b);const point=fresh.bank.bounds(b).getCenter(new THREE.Vector3());
  assert.equal(fresh.placeCharge(point,0,1,b.id),true);fresh.detonate();advance(fresh,120);
  assert.notDeepEqual(fresh.capture(),future,'a later cut must change the future');assert.deepEqual(past,copy);
  assert.equal(s.bank.bodies.length,count);assert.equal(fresh.bank.bodies.length,count);
  console.log(JSON.stringify({check:'direct geometry oracle',queries:geometryQueries,retained:count}));
  advance(s,390);const roots=currentRoots(s.bank),candidates=s.bank.bodies.filter(b=>b.role==='pier'&&b.state!==1&&!roots.has(b.id));
  const previous=new Map(candidates.map(b=>[b.id,s.bank.bodyMatrix(b).elements.slice()]));
  advance(s,300);const laterRoots=currentRoots(s.bank);
  for(const b of candidates)if(b.state!==1&&!laterRoots.has(b.id))assert.notDeepEqual(s.bank.bodyMatrix(b).elements,previous.get(b.id),`unsupported pier ${b.id} cannot remain frozen for five simulated seconds`);
  const unrooted=s.bank.bodies.filter(b=>b.role==='pier'&&b.state!==1&&!laterRoots.has(b.id));
  assert.equal(unrooted.length,0,'the settled side-collapse aftermath cannot contain unrooted standing or asleep piers');
  console.log(JSON.stringify({check:'native side-collapse current support',at10Seconds:candidates.map(b=>b.id),at15Seconds:unrooted.map(b=>b.id),stats:s.bank.stats}));
});

test('a whole carrier without a foundation moves, and settled construction reacts to removal of its current support',()=>{
  const bank=small([{pos:[0,5,0],size:[1,1,1]}]);
  for(let i=0;i<60;i++)bank.step(1/60);
  assert.ok(bank.bounds(bank.bodies[0]).min.y<2,'a wholly unrooted carrier cannot freeze in place');
  const stack=small([{pos:[0,.73,0],size:[2,1,2]},{pos:[0,1.73,0],size:[1,1,1]}]);
  stack.nodes[0].state=2;for(const b of stack.bodies)b.state=2;
  for(let i=0;i<10;i++)stack.step(1/60);
  assert.equal(stack.bodies[1].state,2);const past=stack.capture(),copy=structuredClone(past);
  stack.bodies[0].x=4;
  for(let i=0;i<30;i++)stack.step(1/60);
  assert.ok(stack.bodies[1].y<1.4,'removing current support must lower the supported remnant');
  const future=stack.capture(),fresh=small([{pos:[0,.73,0],size:[2,1,2]},{pos:[0,1.73,0],size:[1,1,1]}]);
  fresh.restore(past);fresh.bodies[0].x=4;for(let i=0;i<30;i++)fresh.step(1/60);
  assert.deepEqual(fresh.capture(),future);assert.deepEqual(past,copy);
});

test('a normal lower-front wound stays meaningfully damaged while the observation interval advances and a later cut remains effective',()=>{
  const s=fixture();charge(s,[[-6.3,1.3,19.65]]);advance(s,300);
  const initial={...s.bank.stats},past=s.capture(),copy=structuredClone(past);
  advance(s,1200);const observed={...s.bank.stats};
  assert.ok(initial.settled+initial.loose>0,'ordinary damage must release actual architecture');
  assert.ok(observed.failedBays<observed.bays,'partial damage must retain construction');
  assert.equal(observed.failedBays,initial.failedBays,'the observation interval cannot be a delayed broad failure');
  const naturalSleepCovered=s.bank.structure.sleeping;
  const before=s.capture(),fresh=fixture();fresh.restore(before);assert.equal(fresh.bank.structure.sleeping,naturalSleepCovered);
  charge(s,[[-11,1.3,19.65]]);advance(s,180);
  charge(fresh,[[-11,1.3,19.65]]);advance(fresh,180);
  assert.deepEqual(fresh.capture(),s.capture(),'restoration followed by the same later charge must resume identically');
  assert.notDeepEqual(s.capture().bank.bodies,before.bank.bodies,'the later ordinary cut must change retained construction');
  assert.deepEqual(past,copy);
  console.log(JSON.stringify({check:'25-second native partial wound',input:[-6.3,1.3,19.65],at5Seconds:initial,at25Seconds:observed,naturalSleepCovered,laterInput:[-11,1.3,19.65],afterLaterCut:s.bank.stats}));
});


test('height-indexed resting candidates equal a direct solid-overlap scan at bin edges and through downward sweeps',()=>{
  const bank=small([{pos:[0,1,0],size:[1,.1,1]}]),body=bank.bodies[0],entries=[];
  for(const top of [-1.001,-1,-.501,-.5,-.499,-.001,0,.001,.499999,.5,.500001,1,1.5,4.1]){
    entries.push({b:{id:entries.length+1,state:2},minX:.35,maxX:.6,minZ:-.25,maxZ:.25,bottom:top-.02,top});
  }
  entries.push({b:{id:99,state:1},minX:-.5,maxX:.5,minZ:-.5,maxZ:.5,bottom:0,top:.5});
  const grid=new Map();for(const e of entries)for(let x=Math.floor(e.minX/3);x<=Math.floor(e.maxX/3);x++)for(let z=Math.floor(e.minZ/3);z<=Math.floor(e.maxZ/3);z++){const key=x+','+z+','+Math.floor(e.top/.5);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(e);}
  let queries=0;
  for(const y of [-1,-.5,0,.5,1,1.5])for(const priorY of [null,y,y+2.5]){
    const part=new THREE.Box3(new THREE.Vector3(-.5,y,-.5),new THREE.Vector3(.5,y+.1,.5));
    const prior=priorY===null?null:[part.clone().translate(new THREE.Vector3(0,priorY-y,0))];
    const low=y-(prior?.012:.045),high=prior?priorY+.15:y+.045;
    const expected=entries.filter(e=>e.b.state!==1&&e.top>=low&&e.top<=high&&part.max.x>e.minX&&part.min.x<e.maxX&&part.max.z>e.minZ&&part.min.z<e.maxZ).map(e=>e.b.id).sort((a,b)=>a-b);
    const actual=bank.restingContacts(body,grid,[part],prior).map(c=>c.e.b.id).sort((a,b)=>a-b);
    assert.deepEqual(actual,expected);queries++;
  }
  console.log(JSON.stringify({check:'height-bin direct-scan oracle',queries}));
});
