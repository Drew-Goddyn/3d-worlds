// Original seven test bodies; import/fixture paths relocated. Three OBB equivalence case omitted because dependency download is unavailable.
import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {City,History,N,T} from '../source/src/world.js';
test('a sleeping slab wakes when its actual supporting slab moves away',()=>{
 const c=new City(),s=c.state,a=c.no(0),b=c.no(6);c.breakConnections(0,'fixture');c.breakConnections(6,'fixture');
 s[a+N.mode]=2;s[b+N.mode]=2;s[a+1]=.54;s[b]=s[a];s[b+2]=s[a+2];s[b+1]=.9201;
 c.wakeUnsupportedSlabs();assert.equal(s[b+N.mode],2);
 s[a]+=30;c.step();assert.equal(s[b+N.mode],1);assert(s[b+1]<.9201);assert(c.events.some(e=>e.kind==='slab-support-lost'&&e.node===6));
});
test('released upper columns cannot preserve an invisible support constraint',()=>{
 const c=new City();for(const node of [0,1,2,3,4,5])assert(c.action({type:'charge',node}));assert(c.action({type:'detonate'}));for(let i=0;i<240;i++)c.step();
 const released=c.plan.nodes.filter(n=>n.b===0&&n.f>0&&c.state[c.no(n.id)+N.mode]);assert(released.length>0);for(const n of released)assert.equal(c.state[c.jointBase+n.vertical],0);
 assert(c.events.some(e=>e.kind==='connection-broken'&&e.cause==='column-release'));
});
test('reversible history preserves Float64 bits, checkpoints, and branch recounts',()=>{
 const c=new City(undefined,0),h=new History(c),o=c.no(0)+31,words=new DataView(c.state.buffer),values=[0n,0x8000000000000000n,1n,0x8000000000000001n,0x400921fb54442d18n,0x7fefffffffffffffn];
 const saved=[Buffer.from(c.state.buffer.slice(0))];for(let i=0;i<130;i++){words.setBigUint64(o*8,values[i%values.length],true);h.record();saved.push(Buffer.from(c.state.buffer.slice(0)));}
 for(const f of [129,2,130,120,5,0,128]){h.seek(f);assert.deepEqual(Buffer.from(c.state.buffer),saved[f]);}
 h.seek(2);h.branch();assert(h.action({type:'swing',x:2,z:0}));const bytes=h.bytes;h.recount();assert.equal(h.bytes,bytes);h.seek(0);assert.deepEqual(Buffer.from(c.state.buffer),saved[0]);
});
test('a lateral slab-edge collision transfers damage to the neighboring structure',()=>{
 const c=new City(),s=c.state,a=c.no(6),b=c.no(24);c.breakConnections(6,'fixture');s[a+N.mode]=1;s[a]=s[b]-5.6;s[a+1]=s[b+1];s[a+2]=s[b+2];s[a+3]=10;
 for(let i=0;i<8;i++)c.step();assert(s[b+N.hp]<1);assert(c.events.some(e=>e.kind==='neighbor-contact'&&e.source===6&&e.target===24&&e.cause==='side-contact'));
});
test('an upright tank cannot sleep on a roof sliver beyond its center of mass',()=>{
 const c=new City(),s=c.state,q=c.tankBase,n=c.plan.nodes.find(n=>n.water),b=c.plan.buildings[n.b];s[q+T.mode]=1;s[q+T.ruptured]=1;s[q]=b.x+b.nx*b.bay/2+1.8;s[q+1]=n.y+.29+1.55+.05;s[q+2]=n.z;
 for(let i=0;i<600;i++)c.step();assert(s[q+1]<5,'overhanging tank falls to the ground');assert(s[q+6]!==0||s[q+8]!==0,'edge contact produces tipping motion');
});
test('a tank sleeps on either face of a flat grounded slab',()=>{
 for(const angle of [0,Math.PI]){const c=new City(),s=c.state,o=c.no(0),q=c.tankBase;c.breakConnections(0,'fixture');s[o+N.mode]=2;s[o]=80;s[o+1]=.54;s[o+2]=80;s[o+6]=angle;s[q+T.mode]=1;s[q+T.ruptured]=1;s[q]=80;s[q+1]=2.33;s[q+2]=80;for(let i=0;i<180;i++)c.step();assert.equal(s[q+T.mode],2);}
});

test('recorded complete collapse stays asleep despite tilted supports with higher centers',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../source/tests/fixtures/tower-round3-controls.json',import.meta.url))),c=new City();
 for(const e of fixture.inputs){while(c.state[0]<e.time-1e-8)c.step();assert(c.action(e.kind==='charge-placed'?{type:'charge',node:e.node}:{type:'detonate'}));}
 while(c.state[0]<30-1e-8)c.step();const tower=c.plan.nodes.filter(n=>n.b===2),saved=tower.map(n=>c.state.slice(c.no(n.id),c.no(n.id)+32));assert(tower.every(n=>c.state[c.no(n.id)+N.mode]===2));
 for(let i=0;i<600;i++)c.step();for(let i=0;i<tower.length;i++)assert.deepEqual(c.state.slice(c.no(tower[i].id),c.no(tower[i].id)+32),saved[i]);
});
