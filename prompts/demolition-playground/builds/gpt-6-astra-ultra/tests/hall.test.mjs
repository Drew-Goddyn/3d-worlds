import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../src/bank.js');const {Simulation}=await import('../src/simulation.js');const {History}=await import('../src/history.js');
function fixture(){const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);return new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene);}
const advance=(sim,n)=>{for(let i=0;i<n;i++)sim.update([.011,.029,.007,.025,.018][i%5]);};

test('the intact hall contains supported furnishings and pre-existing triangular glazing',()=>{
 const sim=fixture(),bank=sim.bank;
 for(const role of ['counter','table','chair','cabinet','equipment','paper'])assert.ok(bank.bodies.some(b=>b.role===role));
 assert.ok(bank.bodies.filter(b=>b.shard).length>=200);
 for(const b of bank.bodies.filter(b=>b.shard))assert.equal(b.parts.length,1);
 const pristine=sim.capture();advance(sim,100);
 assert.ok(bank.bodies.filter(b=>b.content).every(b=>b.state===0&&b.hp===1));
 assert.deepEqual(bank.capture().bodies,pristine.bank.bodies);
 for(const b of bank.bodies.filter(b=>b.content&&!b.restsOn))assert.ok(bank.bounds(b).min.y>=.4,'furnishings stand on tiled floor');
});

test('a window wound releases nearby triangular shards without broadcasting damage into the hall',()=>{
 const sim=fixture(),bank=sim.bank;
 const glass=bank.bodies.find(b=>b.shard&&b.origin.z>19&&b.origin.x<-14);
 bank.damage(glass.origin,80,new THREE.Vector3(0,0,-1));
 assert.ok(bank.bodies.some(b=>b.shard&&b.state===1));
 assert.ok(bank.bodies.some(b=>b.shard&&b.state===0),'another opening remains glazed');
 assert.ok(bank.bodies.filter(b=>b.content).every(b=>b.state===0&&b.hp===1),'wall damage alone cannot launch contents');
});

test('a falling architectural fragment contacts a writing table and releases only its loose articles',()=>{
 const sim=fixture(),bank=sim.bank,table=bank.bodies.find(b=>b.role==='table');
 const stone=bank.bodies.find(b=>b.role==='masonry'&&b.size.y<1);
 bank.release(stone,new THREE.Vector3(0,-1,0),2);stone.x=table.x;stone.y=3.1;stone.z=table.z;stone.vx=.5;stone.vz=.5;
 advance(sim,90);
 assert.ok(table.state>0,'falling stone must move the table');
 assert.ok(bank.bodies.filter(b=>b.role==='paper'&&b.restsOn===table.id).every(b=>b.state>0),'the struck table sheds its own paper');
 assert.ok(bank.bodies.filter(b=>b.role==='counter').every(b=>b.state===0),'remote counters remain intact');
});

test('ball contact uses current solid members and passes through a cleared window',()=>{
 const sim=fixture(),bank=sim.bank,point=new THREE.Vector3(-11.45,2.1,19.19);
 assert.equal(bank.sphereHit(point,.05)?.body.role,'glass');
 for(const b of bank.bodies)if(bank.bounds(b).distanceToPoint(point)<.2){bank.release(b,new THREE.Vector3(1,0,0),1);b.x+=20;}
 assert.equal(bank.sphereHit(point,.05),null,'no invisible original facade or frame rectangle');
 const table=bank.bodies.find(b=>b.role==='table'),top=new THREE.Vector3(table.x,1.6,table.z);
 assert.equal(bank.sphereHit(top,.12)?.body.id,table.id,'reachable furniture remains a collision target');
});

test('paper, furniture, contact ownership and scoring replay exactly and rebuild without duplicates',()=>{
 const sim=fixture(),bank=sim.bank,pristine=sim.capture(),count=bank.bodies.length;
 const table=bank.bodies.find(b=>b.role==='table');bank.hitContent(table,90,new THREE.Vector3(.3,.2,1));advance(sim,20);
 const middle=sim.capture(),copy=structuredClone(middle);advance(sim,100);const future=sim.capture();
 assert.deepEqual(middle,copy);sim.restore(middle);advance(sim,100);assert.deepEqual(sim.capture(),future);
 const history=new History(60);history.record(middle.time,middle);history.record(future.time,future);
 sim.restore(middle);history.truncate(middle.time);bank.hitContent(table,70,new THREE.Vector3(-1,0,0));advance(sim,100);history.record(sim.time,sim.capture());
 assert.notDeepEqual(sim.capture(),future);assert.deepEqual(middle,copy);
 for(let i=0;i<3;i++){sim.restore(pristine);assert.deepEqual(sim.capture(),pristine);assert.equal(bank.bodies.length,count);}
});

test('a fragment passing between table legs cannot impart a contact impulse',()=>{
 const sim=fixture(),bank=sim.bank,table=bank.bodies.find(b=>b.role==='table');
 const stone=bank.bodies.filter(b=>b.role==='masonry').sort((a,b)=>a.size.length()-b.size.length())[0];
 bank.release(stone,new THREE.Vector3(1,0,0),2);stone.x=table.x;stone.y=.9;stone.z=table.z;stone.rx=stone.ry=stone.rz=stone.wx=stone.wy=stone.wz=0;
 assert.equal(bank.solidContact(stone,table),false);sim.update(1/60);
 assert.equal(table.state,0);assert.equal(table.hp,1);
});

test('a ledger that has settled on a table falls when the table moves away',()=>{
 const sim=fixture(),bank=sim.bank,table=bank.bodies.find(b=>b.role==='table');
 const ledger=bank.bodies.find(b=>b.role==='equipment'&&b.restsOn===table.id);
 bank.hitContent(ledger,3,new THREE.Vector3());for(let i=0;i<300;i++)sim.update(1/60);
 assert.equal(ledger.state,2);const originalY=ledger.y;
 for(let n=0;n<6;n++){bank.hitContent(table,150,new THREE.Vector3(-1,0,0));for(let i=0;i<300;i++)sim.update(1/60);}
 assert.ok(ledger.y<originalY-.5,'settled support must be reassessed without levitation');
 assert.ok(bank.bounds(ledger).min.y>=.22);
});

test('settled masonry falls when its furniture support moves away',()=>{
 const sim=fixture(),bank=sim.bank,table=bank.bodies.find(b=>b.role==='table');
 const stone=bank.bodies.filter(b=>b.role==='masonry').sort((a,b)=>a.size.length()-b.size.length())[0];
 bank.release(stone,new THREE.Vector3(),0);stone.x=table.x;stone.z=table.z;stone.y=bank.bounds(table).max.y-stone.bounds.min.y;
 for(let i=0;i<300;i++)sim.update(1/60);assert.equal(stone.state,2);const originalY=stone.y;
 for(let n=0;n<6;n++){bank.hitContent(table,150,new THREE.Vector3(-1,0,0));for(let i=0;i<300;i++)sim.update(1/60);}
 assert.ok(stone.y<originalY-.5);assert.ok(bank.bounds(stone).min.y>=.22);
});


test('the full-size ball can contact a writing table below the intact ceiling',()=>{
 const sim=fixture(),bank=sim.bank,table=bank.bodies.find(b=>b.role==='table');
 assert.equal(bank.sphereHit(new THREE.Vector3(table.x,2.1,table.z),1.7)?.body.id,table.id);
});
