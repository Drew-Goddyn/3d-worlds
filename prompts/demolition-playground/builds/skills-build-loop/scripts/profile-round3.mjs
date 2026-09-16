import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {sourceIdentity} from './source-identity.mjs';
const before=process.argv.includes('--before');
const {City,History,P,N}=await import(before?'../review/build-02/source/src/world.js':'../src/world.js');
const c=new City(),h=new History(c),timings={},changed={},samples=[];
for(const name of ['step','particleStep','tankStep','solveConnections','ballStep']){const fn=c[name];c[name]=function(...args){const t=performance.now();const r=fn.apply(this,args);timings[name]=(timings[name]||0)+performance.now()-t;return r;};}
const record=h.record;h.record=function(){const t=performance.now();record.call(this);timings.record=(timings.record||0)+performance.now()-t;
 for(const id of this.frames.at(-1).ids){let kind='other';if(id>=c.particleBase&&id<c.objectBase){const k=(id-c.particleBase)%32;kind='particle-'+(k<3?'position':k<6?'velocity':k<9?'rotation':k<12?'angularVelocity':k===P.age?'age':'discrete');}else if(id>=c.nodeBase&&id<c.jointBase)kind='structure';changed[kind]=(changed[kind]||0)+1;}};
const charge=ids=>{for(const node of ids)h.action({type:'charge',node});h.action({type:'detonate'});};
const advance=seconds=>{for(let i=0;i<seconds*60;i++){h.advance();if(i%600===0){let awake=0,sleep=0;for(let k=0;k<c.capacity;k++){const o=c.po(k);if(c.state[o+P.active])c.state[o+P.sleep]?sleep++:awake++;}samples.push({time:c.stats().time,awakeParticles:awake,sleepingParticles:sleep,bytes:h.bytes,stats:c.stats()});}}};
const start=performance.now();charge([0,1,2,3,4,5]);advance(4);charge([48,49,50,54,55,56]);advance(61);charge([24,25,26,27,28,29]);advance(3);charge([196]);advance(23);
const result={sourceIdentity:before?JSON.parse(await readFile('tests/fixtures/tank-build02.json','utf8')).sourceIdentity:await sourceIdentity(),snapshot:before?'build-02':'working-round-03',method:'Node method timings, including nested timings. Same 91-second input schedule. Instrumentation and no rendering: not a browser FPS result.',wallMs:performance.now()-start,timings,changed,historyBytes:h.bytes,stats:c.stats(),samples};
await mkdir('review/build-03/checks',{recursive:true});await writeFile('review/build-03/checks/profile-'+(before?'before':'after')+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify({timings,changed,bytes:h.bytes,stats:c.stats()},null,2));
