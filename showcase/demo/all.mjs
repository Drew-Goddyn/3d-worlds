import path from 'node:path';
import {existsSync} from 'node:fs';
import pilot from './pilot.mjs';
import assemble,{chooseTake} from './assemble.mjs';
import verify,{freeze,fingerprint} from './verify.mjs';
import {json} from './core.mjs';
export default async function all(options){
 if(!options.builds.every(b=>existsSync(path.join(options.out,'calibration',b.id,'camera.json'))))await options.calibrate();
 if(!existsSync(path.join(options.out,'pilot','control-result.json')))await pilot({...options,args:['--control-only']});
 if(!(await json(path.join(options.out,'pilot','control-result.json'))).passed)throw Error('Existing pilot failed; retain it and resolve its technical failure');
 const current=await fingerprint(options.scenario,options.out);
 for(const kind of ['rehearsal','official']){
  if(kind==='official')await freeze(options.scenario,options.out);
  const present=options.builds.some(b=>options.scenario.chapters.some(c=>existsSync(path.join(options.out,kind,b.id,c.id))));
  if(!present)await options.record(kind);
  // Never automatically replace a failed or incomplete recording to get a passing result.
  for(const b of options.builds)for(const c of options.scenario.chapters)await chooseTake(options.out,kind,b,c,current.sha256);
 }
 await assemble(options);
 await verify(options);
}
