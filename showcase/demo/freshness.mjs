import {frameSchedule} from './timing.mjs';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {hash,root,json,save} from './core.mjs';
export function inspectFreshness(capture,timing){
 const fps=30,limit=1/fps,map=frameSchedule(capture.frames,timing.start,timing.duration,fps),issues=[];
 for(let i=0;i<map.length;i++){
  const row=map[i],previous=map[i-1];
  if(!(row.holdSeconds>=0&&row.holdSeconds<limit))issues.push({outputFrame:i,reason:'Source image is at least one output frame old',ageSeconds:row.holdSeconds});
  if(previous&&!(row.sourceTimestamp>previous.sourceTimestamp))issues.push({outputFrame:i,reason:'Source image does not advance chronologically',sourceIndex:row.sourceIndex});
 }
 const ordered=capture.frames.toSorted((a,b)=>a.timestamp-b.timestamp),sourceIntervals=[];
 for(let i=1;i<ordered.length;i++){
  const from=ordered[i-1].timestamp,to=ordered[i].timestamp;
  if(to-from>limit&&to>timing.start&&from<timing.start+timing.duration)sourceIntervals.push({from:from-timing.start,to:to-timing.start,seconds:to-from,disposition:'Disclosed source cadence interval; GPU presentation between captures is not established by metadata.'});
 }
 return {schemaVersion:1,status:issues.length?'inconclusive':'pass',scope:'30fps output-frame freshness; not proof of exact GPU presentation timing',fps,maximumSourceAgeSeconds:limit,outputFrames:map.length,encodedFrameMapSha256:hash(JSON.stringify(map)),maxObservedAgeSeconds:Math.max(...map.map(r=>r.holdSeconds)),repeatedOutputFrames:map.filter((r,i)=>i&&r.sourceIndex===map[i-1].sourceIndex).length,sourceIntervals,issues,nativeStallPolicy:'There is no automatic exemption. A repeated-image case requires separate positive evidence and independent review; this result never authorizes retrying a native stall away.'};
}

const frozenFiles=['showcase/demo/freshness.mjs','showcase/demo/test/freshness.test.mjs','showcase/demo/assemble.mjs','showcase/demo/verify.mjs'];
async function currentInputs(){const inputs={};for(const f of frozenFiles)inputs[f]=hash(await readFile(path.join(root,f)));return inputs;}
export async function assertFreshnessFreeze(out){const frozen=await json(path.join(out,'freshness-freeze.json')),inputs=await currentInputs();if(frozen.sha256!==hash(JSON.stringify(inputs)))throw Error('Frozen output-freshness verifier changed');return frozen;}
export async function freezeFreshness(out,originalCaptureFingerprint){
 try{return await assertFreshnessFreeze(out);}catch(e){if(e.code!=='ENOENT')throw e;}
 const inputs=await currentInputs(),frozen={schemaVersion:1,at:new Date().toISOString(),originalCaptureFingerprint,policy:'Every output image must be a new chronological captured source younger than one30fps frame. All longer source intervals remain disclosed. No automatic native-stall exemptions; inconclusive cases need independent positive evidence and never authorize retrying native stalls away.',inputs,sha256:hash(JSON.stringify(inputs))};await save(path.join(out,'freshness-freeze.json'),frozen);return frozen;
}
