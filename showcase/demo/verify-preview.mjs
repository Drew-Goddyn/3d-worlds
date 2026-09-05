import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {json,save,hash,run} from './core.mjs';
import {preservation,probe,fingerprint} from './verify.mjs';
import {inspectFreshness,assertFreshnessFreeze} from './freshness.mjs';
import {validateActions} from './control-checks.mjs';
import {previewAuthorization} from './preview.mjs';

export default async function verifyPreview({out,builds,scenario}){
 const policy=await previewAuthorization(out);await assertFreshnessFreeze(out);
 const current=await fingerprint(scenario,out),frozen=await json(path.join(out,'freeze.json'));
 if(current.sha256!==frozen.sha256)throw Error('Original capture inputs changed');
 await run('npm',['run','test:demo']);
 const original=await preservation(scenario);if(!original.passed)throw Error('Original builds changed');await save(path.join(out,'preservation.json'),original);
 const chapters=[];
 for(const selected of policy.selection){
  const dir=path.join(out,selected.take),capture=await json(path.join(dir,'capture.json')),receipt=await json(path.join(dir,'receipts.json')),timing=await json(path.join(dir,'timing.json')),inputs=await json(path.join(dir,'inputs.json'));
  if(inputs.sha256!==frozen.sha256||capture.error||capture.errors.length||receipt.errors.length||!timing.passed)throw Error(`Non-continuity failure: ${selected.take}`);
  const build=builds.find(b=>b.id===selected.build),chapter=scenario.chapters.find(c=>c.id===selected.chapter);
  const controls=validateActions(build,chapter,receipt),freshness=inspectFreshness(capture,timing);
  const exception=selected.take===policy.continuityException.take;
  if(!exception&&freshness.status!=='pass')throw Error(`Unauthorized continuity exception: ${selected.take}`);
  if(exception&&freshness.repeatedOutputFrames!==policy.continuityException.repeatedOutputFrames)throw Error('Authorized preview continuity result changed');
  chapters.push({...selected,controlsPassed:controls.passed,timingPassed:timing.passed,strictFreshness:freshness,previewContinuityException:exception});
 }
 const dir=path.join(out,'preview-delivery'),encoding=await json(path.join(out,'preview-encoding.json')),films=[];
 for(const [name,width,height] of [...builds.map(b=>[b.folder+'.mp4',1920,1080]),['demolition-comparison.mp4',3840,840]]){
  const file=path.join(dir,name),meta=probe(file),v=meta.streams.find(s=>s.codec_type==='video'),bytes=await readFile(file);
  let atom=0,moov=-1,mdat=-1;
  while(atom+8<=bytes.length){let size=bytes.readUInt32BE(atom);const type=bytes.toString('ascii',atom+4,atom+8);if(size===1)size=Number(bytes.readBigUInt64BE(atom+8));if(type==='moov')moov=atom;if(type==='mdat')mdat=atom;if(!size)break;atom+=size;}
  const row={file:name,sha256:hash(bytes),width:v.width,height:v.height,frames:Number(v.nb_read_frames),duration:Number(v.duration),codec:v.codec_name,pixelFormat:v.pix_fmt,fps:v.avg_frame_rate,audio:meta.streams.some(s=>s.codec_type==='audio'),fastStart:moov>=0&&mdat>=0&&moov<mdat};
  row.passed=row.width===width&&row.height===height&&row.frames===2100&&row.duration===70&&row.codec==='h264'&&row.pixelFormat==='yuv420p'&&row.fps==='30/1'&&!row.audio&&row.fastStart&&encoding.films.some(f=>f.file===name&&f.sha256===row.sha256);
  films.push(row);
 }
 const report={status:films.every(f=>f.passed)?'pass':'fail',mode:'preview',strictReleaseApproved:false,scope:'User-authorized labeled preview; capture continuity remains inconclusive, all other automated properties required',authorizationSha256:hash(JSON.stringify(policy)),preservationPassed:original.passed,chapters,films,independentReviewRequired:true};
 await save(path.join(out,'preview-technical-verification.json'),report);
 if(report.status!=='pass')throw Error('Preview media verification failed');
 console.log('Preview preservation, native controls, timing and media checks passed; strict continuity remains inconclusive.');
}
