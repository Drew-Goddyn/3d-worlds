// Shared physical bounds. Coordinates and XYZ rotations are the renderer's.
export const CONTACT_EPSILON=1e-4;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export function box(state,o,half,localY=0){
 const x=state[o+6],y=state[o+7],z=state[o+8],sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y),sz=Math.sin(z),cz=Math.cos(z);
 const axes=[[cy*cz,cx*sz+sx*sy*cz,sx*sz-cx*sy*cz],[-cy*sz,cx*cz-sx*sy*sz,sx*cz+cx*sy*sz],[sy,-sx*cy,cx*cy]];
 return {o,center:[state[o]+axes[1][0]*localY,state[o+1]+axes[1][1]*localY,state[o+2]+axes[1][2]*localY],half,axes,extent:[0,1,2].map(k=>axes.reduce((v,a,i)=>v+Math.abs(a[k])*half[i],0))};
}
export function slab(state,o,node,building){
 const roof=node.f===building.floors-1;
 return box(state,o,[(building.bay-.04)/2,roof?.24:.19,(building.bay-.04)/2],roof?.05:0);
}
// Shell bottom -1.55; surviving cone top +2.55 in the tank's local frame.
export function tankBody(state,o){return box(state,o,[2.1,2.05,2.1],.5);}
export function supportLever(body,floors){
 let best=null;
 for(const floor of floors){
  const sign=floor.axes[1][1]<0?-1:1,normal=floor.axes[1].map(v=>v*sign);if(normal[1]<.4)continue;
  const delta=body.center.map((v,k)=>v-floor.center[k]);
  const drop=(floor.half[1]-dot(delta,normal))/normal[1];
  const projected=delta.map((v,k)=>v+(k===1?drop:0));
  const x=Math.max(-floor.half[0],Math.min(floor.half[0],dot(projected,floor.axes[0]))),z=Math.max(-floor.half[2],Math.min(floor.half[2],dot(projected,floor.axes[2])));
  const lever=[0,1,2].map(k=>floor.center[k]+floor.axes[0][k]*x+normal[k]*floor.half[1]+floor.axes[2][k]*z-body.center[k]);
  if(!best||Math.hypot(lever[0],lever[2])<Math.hypot(best[0],best[2]))best=lever;
 }
 return best;
}
export function contact(a,b,padding=0){
 const d=a.center.map((v,k)=>v-b.center[k]);
 if(d.some((v,k)=>Math.abs(v)>a.extent[k]+b.extent[k]+padding))return null;
 let depth=Infinity,normal=null;
 const test=axis=>{
  const length=Math.hypot(...axis);if(length<1e-8)return true;
  const n=axis.map(v=>v/length),distance=dot(d,n);
  const overlap=a.axes.reduce((v,x,k)=>v+Math.abs(dot(x,n))*a.half[k],0)+b.axes.reduce((v,x,k)=>v+Math.abs(dot(x,n))*b.half[k],0)-Math.abs(distance);
  if(overlap < -padding)return false;
  if(overlap<depth){depth=overlap;normal=n.map(v=>v*(distance<0?-1:1));}return true;
 };
 for(const axis of [...a.axes,...b.axes])if(!test(axis))return null;
 for(const x of a.axes)for(const y of b.axes)if(!test([x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]]))return null;
 return {depth,normal};
}
export function separate(state,o,hit){
 if(hit.depth>0)for(let k=0;k<3;k++)state[o+k]+=hit.normal[k]*(hit.depth+CONTACT_EPSILON);
}
