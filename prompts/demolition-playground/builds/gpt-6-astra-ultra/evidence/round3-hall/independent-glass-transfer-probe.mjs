import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s.startsWith('three/addons/'))return {url:new URL('../../vendor/three-0.180.0/addons/'+s.slice(13),import.meta.url).href,shortCircuit:true};if(s==='three')return {url:new URL('../../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../../src/bank.js');
const {Simulation}=await import('../../src/simulation.js');
const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);const sim=new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene),bank=sim.bank;
const advance=s=>{for(let i=0;i<s*60;i++)sim.update(1/60);};
const {Crane}=await import('../../src/crane.js');const assert=await import('node:assert/strict');
const pristine=sim.capture(),city={buildings:[building]},rows=[];
for(const role of ['glass','joinery','masonry']) {
 sim.restore(pristine);let center;
 for(const b of bank.bodies.filter(b=>b.role===role&&b.origin.z>19&&b.origin.y<3.2)) {
  for(const offset of [.2,.6,1,1.5]){const p=b.origin.clone();p.y=Math.max(2.11,p.y);p.z+=offset;if(bank.sphereHit(p,1.7)?.body.role===role){center=p;break;}}
  if(center)break;
 }
 assert.ok(center,'a real-radius collision position for '+role);
 const crane=new Crane(scene);crane.yaw=crane.goalYaw=Math.atan2(center.z-crane.base.z,center.x-crane.base.x);crane.reach=crane.goalReach=Math.hypot(center.x-crane.base.x,center.z-crane.base.z);crane.length=crane.goalLength=39.9;crane.updateAnchor();crane.ballPosition.copy(center);crane.velocity.set(0,0,-8);
 const contacts=[],impacts=[],nativeHit=bank.sphereHit.bind(bank),nativeImpact=sim.impact.bind(sim);
 bank.sphereHit=(p,r)=>{const hit=nativeHit(p,r);if(hit)contacts.push({role:hit.body.role,fullPower:Math.min(150,26+crane.velocity.length()*5)});return hit;};
 sim.impact=(p,power,d)=>{impacts.push(power);return nativeImpact(p,power,d);};
 crane.update(.001,city,sim);bank.sphereHit=nativeHit;sim.impact=nativeImpact;
 const expected=role==='glass'?.28:role==='joinery'?.55:1;
 assert.equal(contacts[0]?.role,role);assert.ok(Math.abs(impacts[0]/contacts[0].fullPower-expected)<1e-12);
 rows.push({role,radius:1.7,contactCenter:center.toArray(),fullPower:contacts[0].fullPower,deliveredPower:impacts[0],ratio:impacts[0]/contacts[0].fullPower,detachedGlass:bank.bodies.filter(b=>b.role==='glass'&&b.state>0).length,failedBays:bank.stats.failedBays});
}
console.log(JSON.stringify({setup:'Contact integration probe uses current native body geometry and actual sphere radius; sphere is positioned at an overlapping contact to isolate transfer, not a gameplay route.',rows},null,2));
