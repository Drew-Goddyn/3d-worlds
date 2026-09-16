// This catalog owns spatial membership and carried geometry bounds. Pool slots
// store only a stable catalog ordinal and recorded body state.
export function rotate(v,r){
 const [x,y,z]=v,[a,b,c]=r,sx=Math.sin(a),cx=Math.cos(a),sy=Math.sin(b),cy=Math.cos(b),sz=Math.sin(c),cz=Math.cos(c);
 return [cy*cz*x-cy*sz*y+sy*z,(cx*sz+sx*sy*cz)*x+(cx*cz-sx*sy*sz)*y-sx*cy*z,(sx*sz-cx*sy*cz)*x+(sx*cz+cx*sy*sz)*y+cx*cy*z];
}
export function extent(half,rotation){
 const x=rotate([half[0],0,0],rotation),y=rotate([0,half[1],0],rotation),z=rotate([0,0,half[2]],rotation);
 return [0,1,2].map(k=>Math.abs(x[k])+Math.abs(y[k])+Math.abs(z[k]));
}
export function corners(p){
 const points=[];for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5]){
   const v=rotate([x*p.sx,(p.geo==='pediment'?(y+.5)*.5:y)*p.sy,(p.geo==='pediment'?(z+.5)*.5:z)*p.sz],[p.rx,p.ry,p.rz]);
   points.push(v.map((a,k)=>a+[p.x,p.y,p.z][k]));
 }return points;
}
export class Fractures {
 constructor(plan,parts){
  this.nodes=plan.nodes.map(()=>[]);this.total=0;
  for(const n of plan.nodes){
   const buckets=new Map(),owned=parts.filter(p=>p.owner===n.id&&p.facade);let loose=0;
   for(const p of owned){
    const independent=loose<2&&((p.detail&&p.material.startsWith('brick'))||(p.shard&&p.geo==='pane0'));
    if(independent)loose++;
    const key=independent?'loose'+loose:p.column?'column'+(p.x<0?0:1)+(p.z<0?0:1):p.face!==undefined?'face'+p.face+':'+(p.faceX<0?0:1):'roof';
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(p);
   }
   for(const [key,list]of buckets){
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const p of list)for(const v of corners(p))for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}
    const group={ordinal:this.nodes[n.id].length,center:min.map((v,k)=>(v+max[k])/2),half:min.map((v,k)=>Math.max(.025,(max[k]-v)/2)),loose:key.startsWith('loose'),column:list.every(p=>p.column),material:n.material,parts:list};
    for(const p of list)p.fracture=group.ordinal;
    this.nodes[n.id].push(group);this.total++;
   }
  }
 }
 group(owner,ordinal){return this.nodes[owner]?.[ordinal];}
}
