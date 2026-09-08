import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return s==='three'?{url:new URL('../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true}:n(s,c);}});
const THREE=await import('three'),{createBank}=await import('../src/bank.js'),{BankPhysics}=await import('../src/bank-physics.js');
const area=(a,b,c)=>new THREE.Vector3().crossVectors(b.clone().sub(a),c.clone().sub(a)).length()/2;

test('optimized contact faces preserve every rendered surface, including concave fracture edges and openings',()=>{
  const building={id:0,x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,new THREE.Scene());const recipe=building.bank;
  let originalFaces=0,contactFaces=0,checked=0;
  for(const batch of recipe.batches)for(const part of batch.parts) {
    const transform=new THREE.Matrix4().compose(part.position,part.rotation,part.scale),geometry=batch.geometry,positions=geometry.attributes.position,index=geometry.index;
    let renderedArea=0;const vertices=[];
    for(let i=0;i<positions.count;i++)vertices.push(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(transform));
    for(let i=0;i<(index?.count??positions.count);i+=3){const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);renderedArea+=area(...ids.map(id=>vertices[id]));originalFaces++;}
    let collisionArea=0;const mesh=part.collisionMesh;
    for(const ids of mesh.faces){for(let i=1;i<ids.length-1;i++)collisionArea+=area(...[ids[0],ids[i],ids[i+1]].map(id=>mesh.vertices[id]));contactFaces++;}
    assert.ok(Math.abs(collisionArea-renderedArea)<Math.max(1e-8,renderedArea*1e-6),'joining coplanar triangles must neither fill a void nor remove visible surface');checked++;
  }
  assert.ok(checked>3000,'check the whole bank recipe, not a substitute box');assert.ok(contactFaces<originalFaces*.75,'the preserved surfaces must actually eliminate redundant face checks');
});

test('collision bounds track rendered asymmetric bank pieces through arbitrary world rotations',()=>{
  const building={id:0,x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,new THREE.Scene());
  const sim={floors:[],buildingStates:[],time:0,tonnage:0,random:()=>.5,_emit(){},_emitDust(){},_affectProps(){}},bank=new BankPhysics(building.bank,sim);sim.bank=bank;
  for(const role of ['slab','vault-rib','glass','joinery','arch']) {
    const body=bank.bodies.find(b=>b.role===role);body.state=1;body.x+=.7;body.y+=1;body.rx=.67;body.ry=.31;body.rz=-.8;
    const rendered=new THREE.Box3(),bodyMatrix=new THREE.Matrix4().compose(new THREE.Vector3(body.x,body.y,body.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(body.rx,body.ry,body.rz)),new THREE.Vector3(1,1,1));
    for(const batch of building.bank.batches)for(const part of batch.parts)if(part.body===body.id) {
      const matrix=bodyMatrix.clone().multiply(new THREE.Matrix4().compose(part.position,part.rotation,part.scale)),positions=batch.geometry.attributes.position;
      for(let i=0;i<positions.count;i++)rendered.expandByPoint(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(matrix));
    }
    const collision=bank.bounds(body);assert.ok(rendered.min.distanceTo(collision.min)<1e-6&&rendered.max.distanceTo(collision.max)<1e-6,role+' must collide at its rendered extent');
  }
});
