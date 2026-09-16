import {Playback,City,DT,G} from '../src/world.js';
import {sourceIdentity} from './source-identity.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
await mkdir('review/build-03/checks',{recursive:true});
const report={sourceIdentity:await sourceIdentity(),method:'120 deterministic wall ticks at 1/60 s; every observed value is the presentation sampler consumed by View. Authoritative fixed-step poses are expected to repeat.',samples:[],reverse:[]};
for(const setting of ['speed','holdSlow','heldRotate','passiveRotate','passiveBall']){
 const p=new Playback(new City(undefined,64));let index=G.bx,input=null;
 if(setting.startsWith('passive')){for(let i=0;i<120;i++)p.tick(DT,setting==='passiveRotate'?{type:'crane',rotate:1}:null);p.scrubTime(.5);p.play();}
 if(setting==='holdSlow')p.holdSlow=true;else p.speed=.1;
 if(setting.includes('Rotate'))index=G.angle;if(setting==='heldRotate')input={type:'crane',rotate:1};
 let prev=p.sample()[index],last=p.city.state[index],changes=0,physical=0;const poses=[];
 for(let i=0;i<120;i++){p.tick(DT,input);const now=p.sample()[index];changes+=now!==prev;physical+=p.city.state[index]!==last;poses.push({wall:(i+1)*DT,sim:p.time,physical:p.city.state[index],presented:now,delta:now-prev});prev=now;last=p.city.state[index];}
 report.samples.push({setting,changes,physicalChanges:physical,poses});
}
for(const dense of [false,true]){const p=new Playback(new City(undefined,64));for(let i=0;i<120;i++)p.tick(DT,dense?{type:'crane',rotate:1}:null);const start=p.time,records=p.history.end;p.mode='rewind';for(let i=0;i<30;i++)p.tick(DT);report.reverse.push({dense,records,reversedSeconds:start-p.time});}
await writeFile('review/build-03/checks/temporal-regressions.json',JSON.stringify(report,null,2));
console.log({samples:report.samples.map(({poses,...s})=>s),reverse:report.reverse});
