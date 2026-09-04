import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'three') return { url: new URL('../vendor/three-0.180.0/three.module.js', import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}});
const THREE = await import('three');
const { Simulation } = await import('../src/simulation.js');
const { History } = await import('../src/history.js');

function fixture({ neighbor = false, tank = false, glassUnits = false } = {}) {
  const scene = new THREE.Scene();
  const buildings = [];
  for (let b = 0; b < (neighbor ? 2 : 1); b++) {
    const building = { id: b, name: b ? 'Neighbor' : 'Test tower', kind: glassUnits ? 'glass' : b ? 'brick' : 'concrete', x: b * 7, z: 0, width: 6, depth: 6, height: 16, floors: [] };
    for (let i = 0; i < 5; i++) {
      const group = new THREE.Group(); group.position.set(building.x, .23 + i * 3.2, 0); scene.add(group);
      const pieces = [];
      for (const [x,z] of [[-2.5,-2.5],[-2.5,2.5],[2.5,-2.5],[2.5,2.5]]) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(.3, 3, .3), new THREE.MeshBasicMaterial());
        mesh.position.set(x, 1.5, z); group.add(mesh); pieces.push({ mesh, material: 'concrete' });
      }
      const batch = new THREE.Mesh(new THREE.BoxGeometry(6, .3, 6), new THREE.MeshBasicMaterial()); group.add(batch); pieces.push({mesh: batch, material:'concrete'});
      if (glassUnits) {
        const positions = new Float32Array(2 * 36 * 3);
        const units = [];
        for (const [j, x] of [-2.6, 2.6].entries()) {
          const pane = new THREE.BoxGeometry(1, 2, .1).toNonIndexed().translate(x, 1.5, 2.5);
          positions.set(pane.attributes.position.array, j * 36 * 3);
          units.push({ start:j*36, count:36, center:[x,1.5,2.5], size:[1,2,.1] });
        }
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        mesh.userData.fractureUnits = units; group.add(mesh); pieces.push({mesh,material:'glass'});
      }
      building.floors.push({group, y: group.position.y, index: i, height:3.2, columns:[{x:-2.5,z:-2.5},{x:-2.5,z:2.5},{x:2.5,z:-2.5},{x:2.5,z:2.5}], pieces});
    }
    if (tank && b === 0) {
      const group = new THREE.Group(); group.add(new THREE.Mesh(new THREE.CylinderGeometry(1,1,2), new THREE.MeshBasicMaterial()));
      group.position.set(1,4,1); building.floors.at(-1).group.add(group); building.waterTower = {group};
    }
    buildings.push(building);
  }
  const prop = new THREE.Group(); prop.position.set(3,.2,0); scene.add(prop);
  const city = { buildings, props:[{group:prop,x:3,z:0,kind:'car'}], crowd:[], pigeons:[] };
  return { sim:new Simulation(city,scene),city,scene };
}
function advance(sim, frames, dt = 1/60) { for(let i=0;i<frames;i++) sim.update(dt); }

test('demolition charge destroys supports and upper floors pancake in sequence', () => {
  const {sim,city} = fixture();
  assert.equal(sim.stats.collapsed, 0);
  assert.equal(sim.placeCharge(new THREE.Vector3(2.5,1,2.5),0,0),true);
  sim.detonate(); sim.update(.1);
  assert.ok(sim.floors[0].support < .56);
  assert.equal(sim.floors[0].state,2);
  assert.equal(sim.floors[4].state,0,'roof must wait for loss of support below');
  advance(sim,600);
  assert.equal(sim.stats.collapsed,1);
  assert.ok(sim.stats.tonnage>0);
  assert.ok(sim.floors.every(f=>f.state===3));
  assert.ok(sim.floors[4].y < 3,'roof must descend into a rubble stack');
  for(const floor of city.buildings[0].floors) assert.equal(floor.pieces.at(-1).mesh.visible,true,'whole floor batch must not disappear');
  assert.ok(sim.stats.pieces>30);
});

test('restoring mid-blast reproduces every physical and random state exactly, including staged charges and a water burst', () => {
  const {sim} = fixture({tank:true});
  sim.placeCharge(new THREE.Vector3(2.5,1,2.5),0,0);
  sim.placeCharge(new THREE.Vector3(2.5,10,2.5),0,3);
  sim.detonate(); advance(sim,6);
  const middle=sim.capture();
  assert.equal(middle.charges.length,1,'the second charge is still waiting');
  advance(sim,240); const expected=sim.capture();
  assert.equal(expected.tanks[0][10],1,'water tower must burst');
  sim.restore(middle); advance(sim,240);
  assert.deepEqual(sim.capture(),expected);
});

test('rewind after more than a minute restores damage, rubble, props and charge inventory', () => {
  const {sim,city} = fixture();
  const pristine=sim.capture();
  const history=new History(60);
  sim.placeCharge(new THREE.Vector3(2.5,1,2.5),0,0); sim.detonate();
  for(let i=0;i<1401;i++) {sim.update(.05);history.record(sim.time,sim.capture());}
  assert.ok(history.duration>=60-1e-8);
  const earlier=history.sample(35.125);
  sim.restore(earlier.a,earlier.b,earlier.alpha);
  const restored=sim.capture();
  assert.deepEqual(restored,earlier.a,'interpolation must not mutate the underlying resumable snapshot');
  sim.restore(pristine);
  assert.deepEqual(sim.capture(),pristine);
  assert.ok(city.buildings[0].floors.every(f=>f.pieces.every(p=>p.mesh.visible)));
  assert.equal(city.props[0].group.scale.y,1);
});

test('slow motion advances exactly the supplied simulation time', () => {
  const {sim}=fixture();
  advance(sim,120,.001);
  assert.ok(Math.abs(sim.time-.12)<1e-12);
});

test('a falling assembly transfers impact into an adjacent building', () => {
  const {sim}=fixture({neighbor:true});
  // A horizontal strike near the shared side tears out lower columns and carries
  // the descending body across the one-metre gap into the second structure.
  sim.impact(new THREE.Vector3(2.8,1,0),155,new THREE.Vector3(1,0,0));
  advance(sim,240);
  assert.ok(sim.buildingStates[1].floors.some(f=>f.support<1),'neighbor must receive collision damage');
  assert.ok(sim.stats.chain>1);
});

test('distance and quality change debris rendering without changing the recorded disaster', () => {
  const high=fixture().sim, low=fixture().sim;
  high.setQuality('high'); low.setQuality('low');
  const camera=new THREE.PerspectiveCamera(); camera.position.set(130,80,130); low.setCamera(camera);
  for (const sim of [high,low]) {
    sim.placeCharge(new THREE.Vector3(2.5,1,2.5),0,0);sim.detonate();advance(sim,150);
  }
  assert.deepEqual(low.capture(),high.capture(),'quality must not change randomness or physical replay');
  assert.ok(low.farDebris.geometry.drawRange.count>0,'distant rubble must use impostors');
  assert.ok(high.debrisMeshes.reduce((n,m)=>n+m.count,0)>low.debrisMeshes.reduce((n,m)=>n+m.count,0));
  assert.ok(low.dustMesh.count<high.dustMesh.count,'low quality must reduce visible dust layers');
});

test('a damaged curtain-wall pane detaches while its neighboring pane survives, and rewind reconstructs exact geometry', () => {
  const {sim,city}=fixture({glassUnits:true});
  const mesh=city.buildings[0].floors[0].pieces.at(-1).mesh;
  const original=mesh.geometry.attributes.position.array.slice();
  const pristine=sim.capture();
  sim.impact(new THREE.Vector3(2.6,1.7,2.5),30,new THREE.Vector3(0,0,-1));
  const damaged=mesh.geometry.attributes.position.array;
  assert.deepEqual(damaged.slice(0,108),original.slice(0,108),'the other pane remains attached');
  assert.ok(damaged.slice(108).every(v=>v===0),'struck pane triangles must leave the curtain wall');
  assert.equal(mesh.visible,true,'the shared facade batch remains visible');
  assert.ok(sim.stats.pieces>0,'detached panes become debris');
  sim.render();assert.ok(sim.rebarMesh.count>0,'damage exposes bent reinforcement');
  sim.restore(pristine);
  assert.deepEqual(mesh.geometry.attributes.position.array,original);
});

test('the archived rebuild carries a detached tank directly back to its roof', () => {
  const {sim}=fixture({tank:true});
  const pristine=sim.capture();
  const expected=sim.tanks[0].group.getWorldPosition(new THREE.Vector3());
  sim.placeCharge(new THREE.Vector3(2.5,1,2.5),0,0);sim.detonate();advance(sim,300);
  const collapsed=sim.capture();
  assert.ok(collapsed.tanks[0][0]>0);
  sim.restore(collapsed,pristine,1);
  const rendered=sim.tanks[0].group.getWorldPosition(new THREE.Vector3());
  assert.ok(rendered.distanceTo(expected)<1e-9,'tank should arrive at the roof before final snapshot replacement');
  assert.deepEqual(sim.capture(),collapsed,'rebuild display must leave resume state untouched');
});
