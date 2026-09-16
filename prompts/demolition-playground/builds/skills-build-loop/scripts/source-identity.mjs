import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function sourceIdentity(){
 const paths=['index.html','package.json','package-lock.json','src/app.js','src/architecture.js','src/contact.js','src/fractures.js','src/presentation.js','src/style.css','src/view.js','src/world.js','scripts/server.mjs'];
 const files=[];for(const path of paths)files.push({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
 return {files,sha256:createHash('sha256').update(files.map(f=>`${f.sha256}  ${f.path}\n`).join('')).digest('hex')};
}
