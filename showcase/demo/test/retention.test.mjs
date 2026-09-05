import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {hash} from '../core.mjs';
import {inspectRetainedFrames} from '../retained-takes.mjs';
test('retention evidence rejects lost or corrupted recorded frames',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'demolition-retention-'));
 try{
  await mkdir(path.join(dir,'frames'));await writeFile(path.join(dir,'frames','a.jpg'),'original');
  const frames=[{file:'a.jpg',sha256:hash('original')}];
  assert.equal((await inspectRetainedFrames(dir,frames)).passed,true);
  await writeFile(path.join(dir,'frames','a.jpg'),'corrupted');
  const corrupted=await inspectRetainedFrames(dir,frames);assert.equal(corrupted.passed,false);assert.equal(corrupted.issues[0].error,'SHA-256 mismatch');
  await rm(path.join(dir,'frames','a.jpg'));
  const missing=await inspectRetainedFrames(dir,frames);assert.equal(missing.passed,false);assert.equal(missing.issues[0].error,'ENOENT');
 }finally{await rm(dir,{recursive:true,force:true});}
});
