import { City,History,N,P,G,DT } from '../src/world.js';
import { mkdir,writeFile } from 'node:fs/promises';
await mkdir('review/build-01/checks',{recursive:true});
const report={method:'Accelerated Node.js execution of the exact application City and History interfaces. Controlled inputs, fixed seed 85173. Direct impact fixtures are identified separately from player actions.',scenarios:[]};
const run=(c,secs)=>{for(let i=0;i<secs*60;i++)c.step();};
function describe(name,c,method){report.scenarios.push({name,method,stats:c.stats(),fallen:c.plan.nodes.filter(n=>c.state[c.no(n.id)+N.mode]>0).map(n=>({node:n.id,building:c.plan.buildings[n.b].name,floor:n.f+1})),events:c.events});}
for(const node of [0,5]){const c=new City();c.action({type:'charge',node});c.action({type:'detonate'});run(c,15);describe(`Single foundation charge at member ${node}`,c,'Player charge and detonate actions');}
for(const velocity of [-4,-24]){const c=new City();c.action({type:'swing',x:0,z:velocity});run(c,20);describe(`Ball impulse with z velocity ${velocity}`,c,'Player swing action');}
{const c=new City();c.damage(1,.22,[2,0,0],'controlled-localized-strike');run(c,8);describe('Weak localized impact',c,'Direct damage fixture through the real ball/contact damage path');}
{const c=new City();for(const node of [0,1,2,3,4,5])c.action({type:'charge',node});c.action({type:'detonate'});run(c,20);describe('All bank foundations',c,'Player charge and detonate actions');}
{const c=new City();for(const node of [4,5,28,29,55,56])c.action({type:'charge',node});c.action({type:'detonate'});run(c,25);describe('Same placements as manual multi-building browser demonstration',c,'Player charge and detonate actions at simulation time zero; browser placement time differs');}
{const c=new City();const n=c.plan.nodes.find(n=>n.b===2&&n.f===6&&n.ix===2&&n.iz===1);c.damage(n.id,2.8,[80,0,0],'controlled-contact-strike');run(c,18);describe('Traceable tower-to-hotel chain',c,'Controlled mechanical impact fixture, not a demonstrated player swing');}
{const c=new City();const n=c.plan.nodes.find(n=>n.water);c.action({type:'charge',node:n.id});c.action({type:'detonate'});run(c,15);describe('Roof charge ruptures water tank',c,'Player charge and detonate actions');}
await writeFile('review/build-01/checks/physical-evidence.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report.scenarios.map(({events,fallen,...r})=>({...r,fallen:fallen.length,eventCount:events.length})),null,2));
