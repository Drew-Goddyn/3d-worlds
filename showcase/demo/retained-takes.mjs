import path from 'node:path';
import {glob,readFile} from 'node:fs/promises';
import {root,json,save,hash} from './core.mjs';
export async function inspectRetainedFrames(dir,frames){
 const issues=[];let existing=0,hashesVerified=0;
 for(const frame of frames){
  if(!frame.file){issues.push({index:frame.index,error:'Missing recorded filename'});continue;}
  try{const bytes=await readFile(path.join(dir,'frames',frame.file));existing++;
   if(frame.sha256){const actual=hash(bytes);if(actual===frame.sha256)hashesVerified++;else issues.push({file:frame.file,error:'SHA-256 mismatch',expected:frame.sha256,actual});}
  }catch(e){issues.push({file:frame.file,error:e.code??e.message});}
 }
 return {passed:issues.length===0,referenced:frames.length,existing,hashesVerified,withoutRecordedHash:frames.filter(f=>!f.sha256).length,issues};
}
export default async function retainedTakes({out}){
 const selection=await json(path.join(out,'delivery','selection.json')),selected=new Set(selection.map(s=>path.join(out,s.take)));const takes=[];
 for await(const file of glob(path.join(root,'.demo-work','**','capture.json'))){
  const capture=await json(file),dir=path.dirname(file);let receipt,controls,timing;try{receipt=await json(path.join(dir,'receipts.json'));}catch{}try{controls=await json(path.join(dir,'controls.json'));}catch{}try{timing=await json(path.join(dir,'timing.json'));}catch{}
  const retention=await inspectRetainedFrames(dir,capture.frames??[]);
  takes.push({directory:path.relative(root,dir),captureSha256:hash(await readFile(file)),capturedFrames:capture.frames?.length??0,errors:[capture.error,...(capture.errors??[]),...(receipt?.errors??[])].filter(Boolean),controlsPassed:controls?.passed??null,timingPassed:timing?.passed??null,usedInCurrentDeliveryFilms:selected.has(dir),rawFramesRetained:retention.passed,retention});
 }
 const report={status:takes.every(t=>t.retention.passed)?'pass':'fail',checkedAt:new Date().toISOString(),policy:'Every development, diagnostic, interrupted, rehearsal and official take remains outside Git. Current delivery selection is recorded separately from release eligibility; the authorized preview preserves the first Astra charges take despite its disclosed capture-continuity failure. No outcome-based retries. Retention checks read every referenced JPEG and compare every available recorded SHA-256.',takes:takes.sort((a,b)=>a.directory.localeCompare(b.directory))};
 await save(path.join(out,'retained-takes.json'),report);
 if(report.status!=='pass')throw Error('Retained frame files are missing or corrupted; see retained-takes.json');
 console.log(`Verified retained frames for ${takes.length} captures: ${takes.reduce((n,t)=>n+t.retention.hashesVerified,0)} SHA-256 matches.`);
}
