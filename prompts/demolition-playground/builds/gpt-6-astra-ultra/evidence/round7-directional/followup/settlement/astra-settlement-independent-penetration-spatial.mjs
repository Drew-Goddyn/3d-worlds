import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as T from '/Users/Drew/.codex/worktrees/d794/3d-worlds/prompts/demolition-playground/builds/gpt-6-astra-ultra/vendor/three-0.180.0/three.module.js';

// Independent static geometric oracle: capture poses + rendered core vertices.
// No application collision, support, restore, or integration code is imported.
const names=process.argv.slice(2), snapshots=[];
const vec=v=>Array.isArray(v)?new T.Vector3(...v):new T.Vector3(v.x,v.y,v.z);
function meshFor(body,flat){
 const row=flat.slice(body.id*18,body.id*18+18),part=body.parts[0];
 assert.ok(row[13]===1||row[13]===2,'Only released poses can bypass structural-carrier reconstruction');
 const q=new T.Quaternion().setFromEuler(new T.Euler(...row.slice(3,6),'XYZ')),p=new T.Vector3(...row.slice(0,3));
 const verts=part.collisionMesh.vertices.map(v=>vec(v).applyQuaternion(q).add(p)),faces=part.collisionMesh.faces;
 const normals=faces.map(f=>verts[f[1]].clone().sub(verts[f[0]]).cross(verts[f[2]].clone().sub(verts[f[0]])).normalize());
 // Prove convexity before applying a convex-solid separation test.
 for(let i=0;i<faces.length;i++)for(const v of verts)assert.ok(normals[i].dot(v.clone().sub(verts[faces[i][0]]))<1e-8);
 const edges=[];for(const f of faces)for(let i=0;i<f.length;i++)edges.push(verts[f[(i+1)%f.length]].clone().sub(verts[f[i]]).normalize());
 const planes=faces.map((f,i)=>({n:normals[i],d:-normals[i].dot(verts[f[0]])}));
 return {id:body.id,role:body.role,state:row[13],position:row.slice(0,3),rotation:row.slice(3,6),velocity:row.slice(6,9),angularVelocity:row.slice(9,12),coreLocalDimensions:vec(part.collisionBounds.max).sub(vec(part.collisionBounds.min)).toArray(),coreVolume:part.collisionMesh.volume,verts,normals,edges,planes};
}
const row=m=>Object.fromEntries(Object.entries(m).filter(([k])=>!['verts','normals','edges','planes'].includes(k)));
function interiorProof(a,b){
 const planes=[...a.planes,...b.planes],vertices=[];
 for(let i=0;i<planes.length;i++)for(let j=i+1;j<planes.length;j++)for(let k=j+1;k<planes.length;k++){
  const p=planes[i],q=planes[j],r=planes[k],qr=q.n.clone().cross(r.n),det=p.n.dot(qr);if(Math.abs(det)<1e-10)continue;
  const v=qr.multiplyScalar(-p.d).addScaledVector(r.n.clone().cross(p.n),-q.d).addScaledVector(p.n.clone().cross(q.n),-r.d).divideScalar(det);
  if(planes.every(f=>f.n.dot(v)+f.d<1e-8)&&!vertices.some(x=>x.distanceTo(v)<1e-7))vertices.push(v);
 }
 assert.ok(vertices.length>=4,'Actual convex intersection needs at least four vertices');
 const center=vertices.reduce((s,v)=>s.add(v),new T.Vector3()).divideScalar(vertices.length);
 const margins=planes.map(f=>-f.n.dot(center)-f.d),radius=Math.min(...margins);
 assert.ok(radius>1e-9,'Convex intersection must contain a finite interior ball');
 return {intersectionVertexCount:vertices.length,commonInteriorPoint:center.toArray(),allFaceInteriorMargins:margins,commonInscribedSphereRadius:radius,intersectionVolumeLowerBound:4/3*Math.PI*radius**3};
}
function sat(a,b){
 const axes=[new T.Vector3(1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,0,1),...a.normals,...b.normals];
 for(const ae of a.edges)for(const be of b.edges){const n=ae.clone().cross(be);if(n.lengthSq()>1e-16)axes.push(n.normalize());}
 let greatestGap=-Infinity,best;
 for(const n of axes){
  const av=a.verts.map(v=>n.dot(v)),bv=b.verts.map(v=>n.dot(v));
  const ai=[Math.min(...av),Math.max(...av)],bi=[Math.min(...bv),Math.max(...bv)];
  const gap=Math.max(bi[0]-ai[1],ai[0]-bi[1]);
  if(gap>greatestGap){greatestGap=gap;best={axis:n.toArray(),firstInterval:ai,secondInterval:bi};}
 }
 return {interpenetrating:greatestGap< -1e-9,separatingGap:greatestGap>0?greatestGap:0,minimumTranslationToSeparate:greatestGap<0?-greatestGap:0,...best};
}
for(const filename of names){
 const raw=fs.readFileSync(filename),d=JSON.parse(raw),flat=d.bank.bodies;
 const pierMeshes=d.recipe.bodies.filter(b=>b.role==='pier'&&[1,2].includes(flat[b.id*18+13])).map(b=>meshFor(b,flat)),byId=new Map(pierMeshes.map(m=>[m.id,m]));
 const selected=[[1084,1419],[1264,1438]].map(([a,b])=>({first:row(byId.get(a)),second:row(byId.get(b)),geometry:sat(byId.get(a),byId.get(b))}));
 const intersections=[];
 for(let i=0;i<pierMeshes.length;i++)for(let j=i+1;j<pierMeshes.length;j++){
  const a=pierMeshes[i],b=pierMeshes[j],geometry=sat(a,b);
  if(geometry.interpenetrating)intersections.push({first:row(a),second:row(b),geometry,interiorProof:interiorProof(a,b)});
 }
 snapshots.push({filename:filename.split('/').pop(),sha256:crypto.createHash('sha256').update(raw).digest('hex'),simulationTime:d.simulationTime,bodyCount:d.recipe.bodies.length,releasedPierCoreCount:pierMeshes.length,selectedPairs:selected,releasedPierCoreIntersections:intersections});
}
const result={scope:'Diagnostic of supplied 24055bb captures; original offending pairs and all released pier first-part rendered convex stone cores. No stepping, no acceptance claim, no assessment of other materials or unreleased carrier geometry.',snapshots};
const out='/tmp/astra-settlement-independent-penetration-spatial.json';fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
