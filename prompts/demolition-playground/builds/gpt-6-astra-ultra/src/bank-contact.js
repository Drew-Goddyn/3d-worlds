import * as THREE from 'three';

// Rendered closed surfaces, retained in body-local coordinates. Broad boxes
// only choose candidates; they are never landing platforms. Keeping the mesh
// triangles also preserves the holes and concave edges of fracture plates.
export function contactMesh(geometry,transform=new THREE.Matrix4()) {
  const vertices=[],faces=[],indices=new Map(),source=geometry.attributes.position,index=geometry.index;
  const id=i=>{const v=new THREE.Vector3().fromBufferAttribute(source,i).applyMatrix4(transform),key=v.toArray().map(x=>Math.round(x*1e7)).join(',');if(!indices.has(key)){indices.set(key,vertices.length);vertices.push(v);}return indices.get(key);};
  for(let i=0;i<(index?.count??source.count);i+=3)faces.push([0,1,2].map(j=>id(index?index.getX(i+j):i+j)));
  let volume=0;const center=new THREE.Vector3();
  for(const [ia,ib,ic] of faces){const a=vertices[ia],b=vertices[ib],c=vertices[ic],v=a.dot(new THREE.Vector3().crossVectors(b,c))/6;volume+=v;center.addScaledVector(a,v/4).addScaledVector(b,v/4).addScaledVector(c,v/4);}
  if(Math.abs(volume)>1e-10)center.divideScalar(volume);else new THREE.Box3().setFromPoints(vertices).getCenter(center);
  return {vertices,faces,center,volume:Math.abs(volume)};
}
export function boxMesh(box) {
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const geometry=new THREE.BoxGeometry(size.x,size.y,size.z),mesh=contactMesh(geometry,new THREE.Matrix4().makeTranslation(...center));geometry.dispose();return mesh;
}
export function worldMesh(mesh,matrix) {
  const vertices=mesh.vertices.map(p=>p.clone().applyMatrix4(matrix)),box=new THREE.Box3().setFromPoints(vertices);
  const faces=mesh.faces.map(ids=>{
    const p=ids.map(id=>vertices[id]),n=new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(p[1],p[0]),new THREE.Vector3().subVectors(p[2],p[0])).normalize();
    return {ids,p,n,d:-n.dot(p[0]),box:new THREE.Box3().setFromPoints(p)};
  });
  return {vertices,faces,box,up:faces.filter(f=>f.n.y>.05),down:faces.filter(f=>f.n.y< -.05)};
}
const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
const height=(f,x,z)=>-(f.n.x*x+f.n.z*z+f.d)/f.n.y;
function overlap(a,b) {
  let poly=a.map(p=>({x:p.x,z:p.z}));const sign=Math.sign(cross(...b));
  for(let i=0;i<3&&poly.length;i++) {
    const from=b[i],to=b[(i+1)%3],next=[];
    for(let j=0;j<poly.length;j++) {
      const p=poly[j],q=poly[(j+1)%poly.length],dp=cross(from,to,p)*sign,dq=cross(from,to,q)*sign;
      if(dp>=-1e-9)next.push(p);
      if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);next.push({x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t});}
    }
    poly=next;
  }
  return poly;
}
function previousPoint(face,previous,point) {
  const [a,b,c]=face.p,den=cross(a,b,c),u=cross(point,b,c)/den,v=cross(a,point,c)/den,w=1-u-v;
  return previous.vertices[face.ids[0]].clone().multiplyScalar(u).addScaledVector(previous.vertices[face.ids[1]],v).addScaledVector(previous.vertices[face.ids[2]],w);
}
// A contact must be crossed by the same material point from above. In
// particular, being within 15 cm of a higher box cannot lift a resting piece
// onto it on successive steps. The 2 mm slop only absorbs solver roundoff.
export function surfaceContacts(moving,support,previous=null) {
  const contacts=[];
  for(const a of moving.down)for(const b of support.up) {
    if(a.box.max.x<b.box.min.x||a.box.min.x>b.box.max.x||a.box.max.z<b.box.min.z||a.box.min.z>b.box.max.z)continue;
    if(b.box.max.y<a.box.min.y-.012||(!previous&&b.box.min.y>a.box.max.y+.012))continue;
    for(const p of overlap(a.p,b.p)) {
      const y=height(b,p.x,p.z),depth=y-height(a,p.x,p.z);
      if(depth<-.012||(!previous&&depth>.012))continue;
      if(previous) {
        const old=previousPoint(a,previous,p),gap=old.y-height(b,old.x,old.z);
        if(gap<-.002)continue;
        // Entering the side of a sloping/near-vertical face is not a landing.
        // Require an actual crossing at the old projected material point too.
        const sign=Math.sign(cross(...b.p));
        if(b.p.some((v,i)=>cross(v,b.p[(i+1)%3],old)*sign< -1e-8))continue;
        if(depth>Math.max(.002,old.y-height(a,p.x,p.z))+.002)continue;
      }
      contacts.push({point:new THREE.Vector3(p.x,y,p.z),depth,normal:b.n});
    }
  }
  return contacts;
}
// The convex hull is the support polygon, not a collision hull. Disconnected
// feet can carry weight between them; empty space cannot create a contact.
export function balance(points,center,normals=[]) {
  const sorted=[...new Map(points.map(p=>[p.x.toFixed(7)+','+p.z.toFixed(7),p])).values()].sort((a,b)=>a.x-b.x||a.z-b.z);
  if(!sorted.length)return {stable:false,pivot:null};
  const lower=[],upper=[];
  for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
  for(const p of [...sorted].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
  const hull=sorted.length>1?[...lower.slice(0,-1),...upper.slice(0,-1)]:sorted;
  let inside=hull.length>=3,nearest=hull[0],distance=Infinity;
  for(let i=0;i<hull.length;i++) {
    const a=hull[i],b=hull[(i+1)%hull.length];if(cross(a,b,center)<-1e-8)inside=false;
    const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((center.x-a.x)*dx+(center.z-a.z)*dz)/(dx*dx+dz*dz||1)));
    const point=a.clone().lerp(b,t),d=(point.x-center.x)**2+(point.z-center.z)**2;if(d<distance){distance=d;nearest=point;}
  }
  const normal=new THREE.Vector3();for(const n of normals)normal.add(n);if(!normal.lengthSq())normal.y=1;normal.normalize();
  const balanced=inside||distance<.000025,sliding=Math.hypot(normal.x,normal.z)>.55*normal.y;
  return {stable:balanced&&!sliding,balanced,sliding,normal,pivot:nearest,hull};
}
