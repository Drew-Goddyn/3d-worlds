import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {previewViewer} from '../preview.mjs';

test('Preview viewer adds a visible disclosure and leaves playback behavior unchanged',async()=>{
 const source=await readFile(new URL('../viewer.html',import.meta.url),'utf8');
 const preview=previewViewer(source,'Capture holds; no FPS ranking.');
 assert.match(preview,/<aside aria-label="Preview recording limitation"/);
 assert.match(preview,/Capture holds; no FPS ranking\./);
 assert.equal(preview.match(/<script>[\s\S]*<\/script>/)[0],source.match(/<script>[\s\S]*<\/script>/)[0]);
});

test('Preview labeling rejects an unknown or ambiguous viewer insertion point',()=>{
 assert.throws(()=>previewViewer('<html></html>','Preview'),/insertion point changed/);
 assert.throws(()=>previewViewer('<nav aria-label="Chapters"><nav aria-label="Chapters">','Preview'),/insertion point changed/);
});
