import path from 'node:path';
import {glob,readFile} from 'node:fs/promises';
import {root,json,save,hash} from './core.mjs';
export default async function retainedTakes({out}){
 const selection=await json(path.join(out,'delivery','selection.json')),selected=new Set(selection.map(s=>path.join(out,s.take)));const takes=[];
 for await(const file of glob(path.join(root,'.demo-work','**','capture.json'))){
  const capture=await json(file),dir=path.dirname(file);let receipt,controls,timing;try{receipt=await json(path.join(dir,'receipts.json'));}catch{}try{controls=await json(path.join(dir,'controls.json'));}catch{}try{timing=await json(path.join(dir,'timing.json'));}catch{}
  takes.push({directory:path.relative(root,dir),captureSha256:hash(await readFile(file)),capturedFrames:capture.frames?.length??0,errors:[capture.error,...(capture.errors??[]),...(receipt?.errors??[])].filter(Boolean),controlsPassed:controls?.passed??null,timingPassed:timing?.passed??null,selectedForOfficialRelease:selected.has(dir),rawFramesRetained:true});
 }
 await save(path.join(out,'retained-takes.json'),{policy:'Every development, interrupted, rehearsal and official take remains outside Git. Official release selection is the first technically valid take per build/chapter; no outcome-based retries.',takes:takes.sort((a,b)=>a.directory.localeCompare(b.directory))});
}
