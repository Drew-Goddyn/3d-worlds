import path from 'node:path';
import {mkdir,copyFile,readdir,readFile,writeFile} from 'node:fs/promises';
import {root,demo,run,save,hash,cmd} from './core.mjs';
export default async function packageAssets({out,builds,scenario}){
 const release=path.join(out,'release'),viewer=path.join(out,'viewer'),evidence=path.join(out,'evidence-package');
 await mkdir(release,{recursive:true});await mkdir(viewer,{recursive:true});await mkdir(evidence,{recursive:true});
 await copyFile(path.join(demo,'viewer.html'),path.join(viewer,'index.html'));
 for(const b of builds){const name=b.folder+'.mp4';await copyFile(path.join(out,'delivery',name),path.join(viewer,name));await copyFile(path.join(out,'delivery',name),path.join(release,name));}
 await copyFile(path.join(out,'delivery','demolition-comparison.mp4'),path.join(release,'demolition-comparison.mp4'));
 const manifest=[];
 async function copyEvidence(from,to){
  const original=await readFile(from),binary=from.endsWith('.png');
  const published=binary?original:Buffer.from(original.toString('utf8').replaceAll(out,'{RUN}').replaceAll(root,'{REPO}'));
  await mkdir(path.dirname(to),{recursive:true});await writeFile(to,published);
  manifest.push({file:path.relative(evidence,to),originalSha256:hash(original),packagedSha256:hash(published),localPathsReplaced:!original.equals(published)});
 }
 async function copyTree(from,to){
  await mkdir(to,{recursive:true});
  for(const e of await readdir(from,{withFileTypes:true})){
   if(e.name==='frames'||e.name==='work'||e.name.endsWith('.mp4'))continue;
   const a=path.join(from,e.name),b=path.join(to,e.name);
   if(e.isDirectory())await copyTree(a,b);else if(/\.(json|jsonl|md|txt|js|mjs|html|png)$/.test(e.name))await copyEvidence(a,b);
  }
 }
 for(const name of ['calibration','official','rehearsal','pilot','viewer-check'])await copyTree(path.join(out,name),path.join(evidence,name));
 try{await copyTree(path.join(out,'failed-encodings'),path.join(evidence,'failed-encodings'));}catch(e){if(e.code!=='ENOENT')throw e;}
 await copyTree(path.join(demo,'evidence'),path.join(evidence,'independent-reviews'));
 for(const name of ['freeze.json','preservation.json','technical-verification.json','recordings-review.json','retained-takes.json','output-freshness-verification.json','freshness-freeze.json'])await copyEvidence(path.join(out,name),path.join(evidence,name));
 for(const name of ['rehearsal-replacement-decision.json','official-replacement-decision.json','official-continuity-decision.json','color-conversion-check.json','protocol-clock-note.json','freshness-regression-evidence.json'])try{await copyEvidence(path.join(out,name),path.join(evidence,name));}catch(e){if(e.code!=='ENOENT')throw e;}
 await copyEvidence(path.join(root,`prompts/${scenario.promptId}/demo/scenario.json`),path.join(evidence,'scenario.json'));
 await copyTree(path.join(root,`prompts/${scenario.promptId}/demo/calibration`),path.join(evidence,'motion-calibration'));
 await copyEvidence(path.join(out,'delivery','selection.json'),path.join(evidence,'official-selection.json'));
 await copyEvidence(path.join(out,'delivery','action-delay-annotations.json'),path.join(evidence,'action-delay-annotations.json'));
 await copyTree(path.join(demo,'patches'),path.join(evidence,'adapters'));
 await copyEvidence(path.join(demo,'browser-runtime.js'),path.join(evidence,'browser-runtime.js'));
 await copyEvidence(path.join(demo,'freshness.mjs'),path.join(evidence,'freshness.mjs'));
 await copyEvidence(path.join(demo,'test','freshness.test.mjs'),path.join(evidence,'freshness.test.mjs'));
 const provenance=Buffer.from(JSON.stringify({recorderCommit:cmd('git',['rev-parse','HEAD']).trim(),pinnedGameCommit:scenario.sourceCommit,createdAt:new Date().toISOString()},null,2)+'\n');
 await writeFile(path.join(evidence,'release-source.json'),provenance);manifest.push({file:'release-source.json',originalSha256:hash(provenance),packagedSha256:hash(provenance),localPathsReplaced:false});
 await save(path.join(evidence,'evidence-manifest.json'),{schemaVersion:1,policy:'Only local run and repository paths are replaced by {RUN} and {REPO} in UTF-8 evidence. Original hashes refer to retained local evidence; packaged hashes verify the corresponding archive files. Binary images are unchanged. Raw JPEGs and clean masters remain outside this archive.',files:manifest.sort((a,b)=>a.file.localeCompare(b.file))});
 for(const [dir,name] of [[viewer,'demolition-viewer.zip'],[evidence,'demolition-evidence.zip']])await run('zip',['-q','-r',path.join(release,name),'.'],{cwd:dir});
 const sums={};for(const name of await readdir(release))if(/\.(mp4|zip)$/.test(name))sums[name]=hash(await readFile(path.join(release,name)));
 await save(path.join(out,'release-assets.json'),sums);console.log('Release films, viewer and evidence packaged locally.');
}
