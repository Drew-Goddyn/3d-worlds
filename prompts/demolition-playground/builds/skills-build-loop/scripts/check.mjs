import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const html=await readFile('index.html','utf8');
assert(html.indexOf('type="importmap"')<html.indexOf('type="module"'));
const map=JSON.parse(html.match(/<script type="importmap">\s*([\s\S]*?)<\/script>/)[1]);
assert.equal(map.imports.three,'/node_modules/three/build/three.module.js');assert.equal(map.imports['three/addons/'],'/node_modules/three/examples/jsm/');
const pkg=JSON.parse(await readFile('package.json','utf8'));assert.equal(pkg.dependencies.three,'0.180.0');
const files=(await readdir('src')).filter(f=>f.endsWith('.js'));
for(const f of files){assert.equal(spawnSync(process.execPath,['--check',`src/${f}`]).status,0);const source=await readFile(`src/${f}`,'utf8');assert(!/https?:\/\//.test(source),'No external scene assets');}
assert(!/<(?:img|video|audio)\b/.test(html));
console.log('PASS: syntax; import map before module; one pinned Three.js version; named Three imports; no remote scene assets.');
