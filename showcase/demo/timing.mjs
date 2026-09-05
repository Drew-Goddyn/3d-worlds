import path from 'node:path';
import {cmd,json,save} from './core.mjs';
export function frameSchedule(frames,start,duration,fps=30){const ordered=frames.map((f,sourceIndex)=>({...f,sourceIndex})).sort((a,b)=>a.timestamp-b.timestamp||a.sourceIndex-b.sourceIndex);const rows=[];let i=0;for(let n=0;n<Math.round(duration*fps);n++){const t=start+n/fps;while(i+1<ordered.length&&ordered[i+1].timestamp<=t)i++;rows.push({outputFrame:n,time:n/fps,sourceIndex:ordered[i].sourceIndex,sourceTimestamp:ordered[i].timestamp,holdSeconds:t-ordered[i].timestamp});}return rows;}
export function clockAlignment(clocks){
 const valid=clocks.length===6&&['before','after'].every(phase=>clocks.filter(c=>c.phase===phase).length===3)&&clocks.every(c=>['hostBeforeEpochMs','hostAfterEpochMs','pageEpochMs','pageWallBeforeEpochMs','pageWallAfterEpochMs'].every(k=>Number.isFinite(c[k])));
 if(!valid)return {passed:false,correction:0,uncertainty:Infinity,bracket:null};
 const low=Math.max(...clocks.map(c=>Math.max(c.hostBeforeEpochMs,c.pageWallBeforeEpochMs)-c.pageEpochMs-1))/1000;
 const high=Math.min(...clocks.map(c=>Math.min(c.hostAfterEpochMs,c.pageWallAfterEpochMs)-c.pageEpochMs+1))/1000;
 const uncertainty=Math.max(0,(high-low)/2);
 return {passed:low<=high&&uncertainty<1/30,correction:(low+high)/2,uncertainty,bracket:[low,high]};
}
export function classifyGaps(frames,receipt,{start,duration,epochCorrection=0,clockUncertainty=0}){
 const ordered=frames.toSorted((a,b)=>a.timestamp-b.timestamp),gaps=[];
 // CDP frame swaps and native RAF observations already use epoch time. Marker delay
 // measures presentation latency; subtracting it here would shift real stall intervals.
 // Clock uncertainty consumes the fixed one-output-frame endpoint budget.
 const endpointBound=1/30-clockUncertainty;
 for(let i=1;i<ordered.length;i++){
  const from=ordered[i-1].timestamp,to=ordered[i].timestamp,seconds=to-from;if(seconds<=.1)continue;
  const a=from-epochCorrection,b=to-epochCorrection;
  const intervals=receipt.frames.flatMap((r,index)=>{const previous=receipt.frames[index-1];if(!(r.rawDelta>75)||!previous)return [];return [{from:(r.epoch-r.rawDelta)/1000,to:r.epoch/1000,rawDeltaMs:r.rawDelta,callbackFrom:(previous.epoch-previous.now+previous.receipt)/1000,callbackTo:(r.epoch-r.now+r.receipt)/1000}];}).filter(r=>r.from<=b&&r.to>=a);
  const matched=intervals.filter(r=>Math.abs(r.from-a)<=endpointBound&&Math.abs(r.to-b)<=endpointBound&&Math.abs(r.callbackFrom-a)<=endpointBound&&Math.abs(r.callbackTo-b)<=endpointBound&&Math.abs((r.callbackTo-r.callbackFrom)-seconds)<=endpointBound);
  gaps.push({from,to,seconds,affectsFilm:to>start&&from<start+duration,epochCorrectionSeconds:epochCorrection,clockUncertaintySeconds:clockUncertainty,endpointBoundSeconds:endpointBound,nativeIntervals:intervals,matchedNativeIntervals:matched,classification:matched.length?'native-animation-stall':'unexplained'});
 }
 return gaps;
}
function color(dir,f){const v=cmd('ffmpeg',['-v','error','-i',path.join(dir,'frames',f.file),'-vf','crop=8:8:16:16,scale=1:1','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{encoding:null});const [r,g,b]=v;return r>200&&g<60&&b>200?'pre':r<60&&g>200&&b>200?'end':'live';}
export async function inspectTiming(dir,duration){const capture=await json(path.join(dir,'capture.json')),receipt=await json(path.join(dir,'receipts.json')),f=capture.frames.map((x,arrivalIndex)=>({...x,arrivalIndex})).sort((a,b)=>a.timestamp-b.timestamp||a.arrivalIndex-b.arrivalIndex);const marks=[];
 for(const phase of ['live','end']){const m=receipt.markers.find(m=>m.phase===phase);if(!m)throw Error(`Missing ${phase} marker`);const at=m.epoch/1000;const around=f.map((x,i)=>({...x,index:i})).filter(x=>Math.abs(x.timestamp-at)<.6);const samples=around.map(x=>({...x,color:color(dir,x)}));const first=samples.find(x=>x.color===phase);if(!first||first.index===0)throw Error(`Visible ${phase} synchronization transition not found`);const previous=f[first.index-1];marks.push({phase,pageEpoch:at,previousTimestamp:previous.timestamp,firstTimestamp:first.timestamp,intervalSeconds:first.timestamp-previous.timestamp,offsetLow:previous.timestamp-at,offsetHigh:first.timestamp-at,samples:samples.map(s=>({index:s.index,timestamp:s.timestamp,color:s.color}))});}
 const offsetLow=Math.max(...marks.map(m=>m.offsetLow)),offsetHigh=Math.min(...marks.map(m=>m.offsetHigh));if(offsetLow>offsetHigh+1/30)throw Error('Synchronization markers disagree by more than one output frame');const live=marks.find(m=>m.phase==='live'),finish=marks.find(m=>m.phase==='end');const offset=live.offsetHigh,start=live.firstTimestamp;const endpointDurationError=finish.firstTimestamp-start-duration;const uncertainty=Math.max(...marks.map(m=>Math.max(Math.abs(m.offsetLow-offset),Math.abs(m.offsetHigh-offset))));const alignment=clockAlignment(capture.clocks??[]),epochCorrection=alignment.correction,clockUncertainty=alignment.uncertainty,clockPassed=alignment.passed;
 const gaps=classifyGaps(f,receipt,{start,duration,epochCorrection,clockUncertainty});
 const result={start,duration,markerPresentationDelaySeconds:offset,epochCorrectionSeconds:epochCorrection,clockUncertaintySeconds:clockUncertainty,clockOffsetBracket:alignment.bracket,clockPassed,logicalStartPageEpoch:live.pageEpoch,endpointDurationError,uncertaintySeconds:uncertainty,markers:marks,gaps,actionDelays:receipt.events.filter(e=>e.planned!==null&&e.actual-e.planned>.1).map(e=>({action:e.action,planned:e.planned,actual:e.actual,delay:e.actual-e.planned})),passed:clockPassed&&uncertainty<=1/30&&Math.abs(endpointDurationError)<=1/30&&!gaps.some(g=>g.affectsFilm&&g.classification==='unexplained')};await save(path.join(dir,'timing.json'),result);await save(path.join(dir,'encoded-frame-map.json'),frameSchedule(capture.frames,start,duration));return result;}
