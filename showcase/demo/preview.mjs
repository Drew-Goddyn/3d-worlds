import path from 'node:path';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {demo,json,save,hash,run} from './core.mjs';
const font='/System/Library/Fonts/Supplemental/Arial.ttf';

export async function previewAuthorization(out){
 const policy=await json(path.join(demo,'evidence/preview-authorization.json'));
 if(policy.mode!=='preview'||hash(await readFile(path.join(out,'delivery/selection.json')))!==policy.selectionSha256)throw Error('Preview authorization does not match selected takes');
 for(const [name,sha] of Object.entries(policy.cleanMasters))if(hash(await readFile(path.join(out,'delivery',name)))!==sha)throw Error(`Preview source changed: ${name}`);
 for(const name of ['capture.json','receipts.json','encoded-frame-map.json'])if(hash(await readFile(path.join(out,policy.continuityException.take,name)))!==policy.continuityException[name+'Sha256'])throw Error(`Authorized continuity exception changed: ${name}`);
 return policy;
}
export function previewViewer(source,disclosure){
 const marker='<nav aria-label="Chapters">';
 if(source.split(marker).length!==2)throw Error('Viewer insertion point changed');
 return source.replace('<title>Demolition comparison</title>','<title>Demolition comparison — Preview</title>').replace(marker,`<aside aria-label="Preview recording limitation" style="border:1px solid #fac767;padding:14px;border-radius:8px;margin:18px 0;max-width:1100px;line-height:1.5"><strong>Preview recordings</strong><br>${disclosure}</aside>\n${marker}`);
}
export default async function preview({out,builds,scenario}){
 if(builds.length!==3)throw Error('Preview publication requires all three builds');
 const policy=await previewAuthorization(out),dir=path.join(out,'preview-delivery');await mkdir(dir,{recursive:true});
 const masters=builds.map(b=>path.join(out,'delivery',b.folder+'-clean.mp4'));
 const text=(value,x,y,size,color='white',enable='')=>`drawtext=fontfile='${font}':text='${value}':x=${x}:y=${y}:fontsize=${size}:fontcolor=${color}${enable?`:enable='${enable}'`:''}`;
 const caption=(b,i)=>i===0?'CITY OVERVIEW':i===1?'ONE BANK SWING':b.id==='site'?'3 AUTO CHARGES · SLOW · AUTO REWIND':b.id==='sol'?'3 MANUAL CHARGES · SLOW · HELD REWIND':'3 MANUAL CHARGES · SLOW · TOGGLE REWIND';
 const enable=i=>`gte(t,${scenario.chapters[i].startSeconds})*lt(t,${scenario.chapters[i].startSeconds+scenario.chapters[i].durationSeconds})`;
 const films=[];
 async function encode(file,args,sources){
  const identity={args,sources,authorizationSha256:hash(JSON.stringify(policy))},signature=hash(JSON.stringify(identity));
  try{const previous=await json(file+'.encoding.json');if(previous.signature!==signature||previous.sha256!==hash(await readFile(file)))throw Error('Existing preview encoding differs; preserve it and use a new output directory');films.push(previous);return;}catch(e){if(e.code!=='ENOENT')throw e;}
  const temporary=file.replace(/\.mp4$/,`.partial-${Date.now()}.mp4`);
  await run('ffmpeg',['-v','error','-n',...args,'-an','-frames:v','2100','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',temporary]);
  // Never overwrite an existing candidate or previous preview.
  try{await readFile(file);throw Error('Preview target already exists');}catch(e){if(e.code!=='ENOENT')throw e;}
  await rename(temporary,file);const row={file:path.basename(file),sha256:hash(await readFile(file)),signature,...identity};await save(file+'.encoding.json',row);films.push(row);
 }
 for(const [i,b] of builds.entries()){
  const notice=b.id==='astra'?'PREVIEW · Capture holds up to 100 ms · Native presentation unknown · No FPS ranking':'PREVIEW · Visual comparison only · Not a performance benchmark';
  const filters=['scale=1792:1008','pad=1920:1080:64:72:color=0x111a1b',text(b.label,64,10,26),text(notice,64,46,17,'0xffcb79'),...scenario.chapters.map((_,n)=>text(caption(b,n),'w-tw-64',18,23,'0x9dada9',enable(n)))];
  await encode(path.join(dir,b.folder+'.mp4'),['-i',masters[i],'-vf',filters.join(',')],[policy.cleanMasters[b.folder+'-clean.mp4']]);
 }
 const labels=builds.flatMap((b,i)=>[text(b.label,i*1280+36,12,32),text(b.id==='astra'?'PREVIEW · Capture holds up to 100 ms · Native presentation unknown · No FPS ranking':'PREVIEW · Visual comparison only · Not a performance benchmark',i*1280+36,54,20,'0xffcb79'),...scenario.chapters.map((_,n)=>text(caption(b,n),i*1280+36,88,22,'0x9dada9',enable(n)))]);
 const filters=masters.map((_,i)=>`[${i}:v]scale=1280:720[v${i}]`).join(';')+';[v0][v1][v2]hstack=inputs=3,pad=3840:840:0:120:color=0x111a1b,'+labels.join(',');
 await encode(path.join(dir,'demolition-comparison.mp4'),[...masters.flatMap(p=>['-i',p]),'-filter_complex',filters],Object.values(policy.cleanMasters));
 const html=previewViewer(await readFile(path.join(demo,'viewer.html'),'utf8'),policy.disclosure);await writeFile(path.join(dir,'index.html'),html);
 await save(path.join(out,'preview-encoding.json'),{mode:'preview',policy,films,viewerSha256:hash(html)});
 console.log('Four labeled preview films rendered from unchanged clean masters. Strict capture gates remain unchanged.');
}
