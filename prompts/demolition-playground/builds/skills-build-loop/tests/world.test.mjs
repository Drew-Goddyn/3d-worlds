import test from 'node:test';
import assert from 'node:assert/strict';
import { City, History, Playback, N, P, G, DT, STRIDE } from '../src/world.js';
const run=(c,seconds)=>{for(let i=0;i<Math.round(seconds/DT);i++)c.step();};
const advance=(h,seconds)=>{for(let i=0;i<Math.round(seconds/DT);i++)h.advance();};
const charges=(h,ids)=>{for(const id of ids)assert.equal(h.action({type:'charge',node:id}),true);assert.equal(h.action({type:'detonate'}),true);};
const fallen=c=>c.plan.nodes.filter(n=>c.state[c.no(n.id)+N.mode]!==0).map(n=>n.id);

test('pristine district remains intact under gravity and gentle crane sway',()=>{
 const c=new City();run(c,10);assert.deepEqual(fallen(c),[]);assert.equal(c.stats().createdFragments,0);assert.equal(c.stats().score,0);
 for(const n of c.plan.nodes)assert.equal(c.state[c.no(n.id)+1],n.y);
});
test('a weak localized strike sheds facade material without destroying supports',()=>{
 const c=new City();c.damage(1,.22,[2,0,0],'ball');run(c,8);assert.deepEqual(fallen(c),[]);assert(c.stats().createdFragments>0);assert(c.state[c.no(1)+N.hp]<1);assert.equal(c.state[c.jointBase+c.plan.nodes[1].vertical],1);
});
test('same seed, different support placement produces distinct local failure',()=>{
 const a=new City(),b=new City(),ha=new History(a),hb=new History(b);charges(ha,[0]);charges(hb,[5]);advance(ha,12);advance(hb,12);
 assert(fallen(a).length>0&&fallen(a).length<24);assert(fallen(b).length>0&&fallen(b).length<24);assert.notDeepEqual(fallen(a),fallen(b));
});
test('manual charges fire at staged deadlines and ground support loss propagates floor by floor',()=>{
 const c=new City(),h=new History(c);charges(h,[0,1,2,3,4,5]);advance(h,18);
 const fire=c.events.filter(e=>e.kind==='charge-fired');assert.equal(fire.length,6);for(let i=1;i<6;i++)assert(Math.abs(fire[i].time-fire[i-1].time-.18)<DT+.0001);
 const fail=c.events.filter(e=>e.kind==='support-failure'&&e.building===0);assert.equal(fail.length,24);
 const earliest=[0,1,2,3].map(f=>Math.min(...fail.filter(e=>e.floor===f).map(e=>e.time)));assert(earliest.every((t,i)=>!i||t>earliest[i-1]));
 const settled=c.plan.nodes.filter(n=>n.b===0).map(n=>c.state.slice(c.no(n.id),c.no(n.id)+STRIDE));run(c,6);
 for(let i=0;i<24;i++)assert.deepEqual(c.state.slice(c.no(i),c.no(i)+STRIDE),settled[i]);assert(c.stats().tons>0);
});
test('ball momentum changes damage through the actual action interface',()=>{
 const soft=new City(),hard=new City();soft.action({type:'swing',x:0,z:-4});hard.action({type:'swing',x:0,z:-24});run(soft,14);run(hard,14);
 assert(hard.events.some(e=>e.cause==='ball'));assert(fallen(hard).length>fallen(soft).length);
});
test('neighbor collapse has a contact source and does not start merely from proximity',()=>{
 const c=new City();const n=c.plan.nodes.find(n=>n.b===2&&n.f===6&&n.ix===2&&n.iz===1);
 c.damage(n.id,2.8,[80,0,0],'test-impact');run(c,15);
 const contacts=c.events.filter(e=>e.kind==='neighbor-contact');assert(contacts.length>0);
 for(const e of contacts){assert.notEqual(c.plan.nodes[e.source].b,c.plan.nodes[e.target].b);assert(e.power>.35);}
 assert(c.events.some(e=>e.kind==='support-failure'&&e.building===6));
 const control=new City();control.damage(n.id,.2,[0,0,0],'test-impact');run(control,15);assert(!control.events.some(e=>e.kind==='neighbor-contact'));
});
test('water burst transfers momentum to debris and expires without deleting structural rubble',()=>{
 const c=new City();const water=c.plan.nodes.find(n=>n.water);c.action({type:'charge',node:water.id});c.action({type:'detonate'});run(c,12);
 assert(c.events.some(e=>e.kind==='water-burst'));assert(c.stats().waterImpulse>0);assert.equal(c.stats().water,0);
});
test('all numeric state restores exactly across mid-collapse, rubble, creation, reuse and pristine',()=>{
 const c=new City(undefined,180),h=new History(c);const initial=c.state.slice();charges(h,[0,1,2,3,4,5]);
 const snapshots=[];for(let i=0;i<900;i++){h.advance();if([60,160,400,899].includes(i))snapshots.push({frame:h.cursor,state:c.state.slice()});}
 assert(c.stats().createdFragments>180,'particle slots actually reused');
 for(let pass=0;pass<4;pass++){for(const saved of [...snapshots].reverse()){h.seek(saved.frame);assert.deepEqual(c.state,saved.state);}for(const saved of snapshots){h.seek(saved.frame);assert.deepEqual(c.state,saved.state);}}
 h.seek(0);assert.deepEqual(c.state,initial);
});
test('scrubbing and passive playback preserve future and replay cannot award duplicate score',()=>{
 const c=new City(),h=new History(c);charges(h,[0,1,2,3,4,5]);advance(h,14);const end=h.end,final=c.state.slice(),events=JSON.stringify(c.events),bytes=h.bytes;
 h.seek(200);for(let i=h.cursor;i<end;i++)h.advance();assert.deepEqual(c.state,final);assert.equal(h.end,end);assert.equal(h.bytes,bytes);assert.equal(JSON.stringify(c.events),events);
 h.seek(0);h.seek(end);assert.equal(c.stats().score,final[G.score]);
});
test('accepted actions branch from restored physical state; invalid input keeps the old future',()=>{
 const c=new City(),h=new History(c);advance(h,1);const old=h.cursor;charges(h,[0,1]);advance(h,7);h.seek(old);const end=h.end;assert.equal(h.action({type:'charge',node:-1}),false);assert.equal(h.end,end);
 assert(h.action({type:'charge',node:24}));assert.equal(h.branchCount,1);assert(h.end<end);h.action({type:'detonate'});advance(h,10);
 assert(!c.events.some(e=>e.kind==='charge-fired'&&e.node===0));assert(c.events.some(e=>e.kind==='charge-fired'&&e.node===24));assert(!fallen(c).some(id=>id<24));
});
test('slow motion advances simulation at one tenth rate; pause and scrub consume no history',()=>{
 const p=new Playback();for(let i=0;i<60;i++)p.tick(DT);const normal=p.city.stats().time;const q=new Playback();q.speed=.1;for(let i=0;i<60;i++)q.tick(DT);assert(Math.abs(q.city.stats().time/normal-.1)<.02);
 const end=p.history.end;p.scrub(10);for(let i=0;i<60;i++)p.tick(DT);assert.equal(p.history.end,end);assert.equal(p.history.cursor,10);
 const held=new Playback();held.holdSlow=true;for(let i=0;i<60;i++)held.tick(DT);assert.equal(held.city.stats().time,q.city.stats().time);
});
test('90 simulation seconds retain earliest and recent destruction for a full animated reset',()=>{
 const p=new Playback(),h=p.history;charges(h,[0,1,2,3,4,5]);advance(h,65);const first=p.city.state.slice(),firstFrame=h.cursor;
 charges(h,[24,25,26,27,28,29]);advance(h,26);const final=p.city.state.slice(),end=h.end;
 assert(p.city.stats().time>90);h.seek(firstFrame);assert.deepEqual(p.city.state,first);h.seek(end);assert.deepEqual(p.city.state,final);
 p.reset();p.tick(.1);assert(h.cursor<end&&h.cursor>0,'reset traverses history');for(let i=0;i<400;i++)p.tick(DT);assert.equal(h.cursor,0);assert.deepEqual(p.city.state,p.city.initial);
 assert.equal(h.end,end,'reset keeps recorded future');
});
test('recorded crane actions replay at the original simulation-time rate',()=>{
 const p=new Playback(new City(undefined,64));for(let i=0;i<120;i++)p.tick(DT,{type:'crane',rotate:1});const end=p.city.state.slice();p.scrub(0);p.play();for(let i=0;i<120;i++)p.tick(DT);assert.deepEqual(p.city.state,end);
});
test('an input at the cable limit cannot erase the recorded future',()=>{
 const p=new Playback(new City(undefined,64));for(let i=0;i<180;i++)p.tick(DT,{type:'crane',cable:-1});const limit=p.history.cursor;for(let i=0;i<30;i++)p.tick(DT);const end=p.history.end;p.scrub(limit);assert.equal(p.act({type:'crane',cable:-1}),false);assert.equal(p.history.end,end);
});
test('spent charge slots are reusable for later demolition',()=>{
 const c=new City(),h=new History(c);charges(h,[0,1,2,3,4,5]);advance(h,3);charges(h,[24,25,26,27,28,29]);advance(h,2);assert.equal(c.events.filter(e=>e.kind==='charge-fired').length,12);
});
test('branching at a same-time action preserves only events at that snapshot',()=>{
 const c=new City(),h=new History(c);h.action({type:'charge',node:0});const f=h.cursor;h.action({type:'charge',node:1});h.seek(f);h.action({type:'charge',node:2});assert.deepEqual(c.events.filter(e=>e.kind==='charge-placed').map(e=>e.node),[0,2]);
});
test('the visible rooftop tank has a ball collider and ruptures on contact',()=>{
 const c=new City(),s=c.state,n=c.plan.nodes.find(n=>n.water);s[G.angle]=Math.atan2(n.z-34,n.x+4);s[G.length]=40;s[G.bx]=n.x;s[G.by]=n.y+3;s[G.bz]=n.z;s[G.bvx]=3;c.step();assert.equal(s[c.no(n.id)+N.water],0);assert(c.events.some(e=>e.kind==='water-burst'));
});
test('shed architecture is assigned persistent physical groups that survive pool reuse',()=>{
 const c=new City(undefined,180);c.damage(1,2.8,[20,0,0],'test-impact');const groups=[];for(let i=0;i<c.capacity;i++){const o=c.po(i);if(c.state[o+P.owner]===2)groups.push({o,id:c.state[o+P.id]});}assert.equal(groups.length,c.fractures.nodes[1].filter(g=>!g.column).length);assert(groups.length>1);
 run(c,6);for(let i=0;i<8;i++){c.fragment(0,3,0,7,80);run(c,2);}
 for(const g of groups){assert.equal(c.state[g.o+P.id],g.id);assert.equal(c.state[g.o+P.owner],2);assert.equal(c.state[g.o+P.active],1);}
});
test('water impulses move physical groups carrying the shed visible architecture',()=>{
 const wet=new City(),n=wet.plan.nodes.find(n=>n.water);wet.action({type:'charge',node:n.id});wet.action({type:'detonate'});for(let i=0;i<600&&wet.state[G.waterImpulse]===0;i++)wet.step();assert(wet.state[G.waterImpulse]>0);
 const dry=new City();dry.state.set(wet.state);for(let i=0;i<dry.capacity;i++){const o=dry.po(i);if(dry.state[o+P.kind]===6)dry.state[o+P.active]=0;}
 for(let i=0;i<60;i++){wet.step();dry.step();}
 let moved=0;for(let i=0;i<wet.capacity;i++){const o=wet.po(i);if(wet.state[o+P.owner]&&Math.hypot(wet.state[o+3]-dry.state[o+3],wet.state[o+5]-dry.state[o+5])>1e-8)moved++;}assert(moved>0);
});
test('settling retains debris group orientation',()=>{
 const c=new City();c.damage(1,2.8,[20,0,0],'test-impact');let transitions=0;
 for(let t=0;t<600;t++){const before=[];for(let i=0;i<c.capacity;i++){const o=c.po(i);if(c.state[o+P.owner]&&!c.state[o+P.sleep])before.push({o,r:Array.from(c.state.slice(o+6,o+9))});}c.step();for(const g of before){if(c.state[g.o+P.sleep]){transitions++;assert(c.state.slice(g.o+6,g.o+9).some(v=>v!==0));}}}
 assert(transitions>0);
});
test('falling member mass changes the damage transferred to its support',()=>{
 function impact(mass){const c=new City(),n=c.plan.nodes[6],o=c.no(6);n.mass=mass;c.breakConnections(n.id,'test-release');c.state[o+N.mode]=1;c.state[o+1]=c.plan.nodes[0].y+1;c.state[o+4]=-5;for(let i=0;i<10;i++)c.step();return c.events.find(e=>e.cause==='falling-slab'&&e.source===6)?.power;}
 const light=impact(16),heavy=impact(32);assert(light>0);assert.equal(heavy,light*2);
});
