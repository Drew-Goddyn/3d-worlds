import { architecture } from './architecture.js';
import { Fractures, rotate } from './fractures.js';
import { Presentation } from './presentation.js';
import { box, slab, tankBody, supportLever, contact, separate, CONTACT_EPSILON } from './contact.js';
// One numeric state owns everything that can be rewound. Geometry is immutable.
export const DT = 1 / 60;
export const SEED = 85173;
export const MATERIAL = { brick: 0, stone: 1, glass: 2, steel: 3, concrete: 4, wood: 5, water: 6, dust: 7 };
export const N = { x:0,y:1,z:2,vx:3,vy:4,vz:5,rx:6,ry:7,rz:8,wx:9,wy:10,wz:11,hp:12,mode:13,fatigue:14,shell:15,hit:16,water:17,scored:18,rest:19,shellTime:20,detachTime:21,shellX:22,shellY:23,shellZ:24,shellVX:25,shellVY:26,shellVZ:27,shellRX:28,shellRY:29,shellRZ:30 };
export const P = { x:0,y:1,z:2,vx:3,vy:4,vz:5,rx:6,ry:7,rz:8,wx:9,wy:10,wz:11,kind:12,active:13,age:14,life:15,size:16,id:17,sleep:18,rest:19,owner:20,ordinal:21,birthX:22,birthY:23,birthZ:24 };
export const T = { mode:12,ruptured:13,rest:14,detached:15,burst:16,supported:17 };
export const G = { time:0,rng:1,score:2,tons:3,chain:4,lastImpact:5,cheer:6,pigeon:7,angle:8,length:9,bx:10,by:11,bz:12,bvx:13,bvy:14,bvz:15,serial:16,focusX:17,focusY:18,focusZ:19,fired:20,waterImpulse:21,chainContacts:22,crushedCars:23,snappedTrees:24,clean:25 };
export const STRIDE = 32;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

export function blueprint() {
  const buildings = [
    {name:'Mercantile Bank', kind:'bank', x:-19,z:18,nx:3,nz:2,bay:5.5,floors:4,h:3.9,material:1,color:0xe6cc96},
    {name:'Municipal Parking', kind:'parking', x:18,z:18,nx:3,nz:2,bay:5.3,floors:4,h:3.4,material:4,color:0xb5c4bd},
    {name:'Prism Tower', kind:'glass', x:13,z:-11,nx:3,nz:3,bay:4.3,floors:11,h:3.3,material:2,color:0x57bec7},
    {name:'Cedar & Water', kind:'water', x:-10,z:-14,nx:3,nz:3,bay:4.2,floors:6,h:3.5,material:0,color:0xc47b52},
    {name:'Union Warehouse', kind:'brick', x:-31,z:-15,nx:2,nz:2,bay:5,floors:4,h:3.6,material:0,color:0xad5940},
    {name:'Foundry Stores', kind:'brick', x:-32,z:0,nx:2,nz:2,bay:5,floors:3,h:3.6,material:0,color:0xcf7450},
    {name:'The Juniper', kind:'hotel', x:31,z:-12,nx:2,nz:3,bay:4.4,floors:7,h:3.3,material:1,color:0xe2b86f},
  ];
  const nodes=[],joints=[];
  for (let bi=0;bi<buildings.length;bi++) {
    const b=buildings[bi]; b.id=bi;b.nodes=[];
    const grid=[];
    for(let f=0;f<b.floors;f++) { grid[f]=[];
      for(let ix=0;ix<b.nx;ix++){grid[f][ix]=[];for(let iz=0;iz<b.nz;iz++) {
        const id=nodes.length;grid[f][ix][iz]=id;b.nodes.push(id);
        nodes.push({id,b:bi,f,ix,iz,x:b.x+(ix-(b.nx-1)/2)*b.bay,y:(f+1)*b.h+.32,z:b.z+(iz-(b.nz-1)/2)*b.bay,
          sx:b.bay-.08,sz:b.bay-.08,h:b.h,mass:b.kind==='bank'?22:16,material:b.material, joints:[],below:-1,vertical:-1,neighbors:[],
          water:b.kind==='water'&&f===b.floors-1&&ix===1&&iz===1});
      }}
    }
    const join=(a,c,kind)=>{let id=joints.length;joints.push({id,a,b:c,kind});nodes[a].joints.push(id);if(c>=0)nodes[c].joints.push(id);return id;};
    for(const id of b.nodes){const n=nodes[id];n.below=n.f?grid[n.f-1][n.ix][n.iz]:-1;n.vertical=join(id,n.below,'column');
      if(n.ix) {const a=grid[n.f][n.ix-1][n.iz];join(id,a,'beam');n.neighbors.push(a);nodes[a].neighbors.push(id);}
      if(n.iz) {const a=grid[n.f][n.ix][n.iz-1];join(id,a,'beam');n.neighbors.push(a);nodes[a].neighbors.push(id);}
    }
  }
  const objects=[];
  for(let i=0;i<20;i++){const side=i%2?-1:1;objects.push({kind:'car',x:i<10?-2.6+side*1.2:((i-10)*6-29),z:i<10?i*6-28:7.7,angle:i<10?0:Math.PI/2,color:[0xd26044,0xf0cf63,0x467f83,0xe8e5ce,0x6a8298][i%5]});}
  for(let i=0;i<18;i++)objects.push({kind:'tree',x:i<9?-42:41,z:(i%9)*7-28,color:0x578c50});
  // Several trees and vehicles sit beside facades, within the fall zone.
  objects.push({kind:'car',x:23,z:-2.8,angle:1.57,color:0xf1b64c},{kind:'car',x:-18,z:8.3,angle:1.57,color:0x468f94},
    {kind:'car',x:23,z:-11,angle:0,color:0xedc15b},{kind:'tree',x:23,z:-17,color:0x6e914d},{kind:'tree',x:22,z:8.3,color:0x718d3f},{kind:'tree',x:-8,z:7.7,color:0x669552});
  return {buildings,nodes,joints,objects,seed:SEED};
}

export class City {
  constructor(plan=blueprint(), capacity=3072,geometry=null) {
    this.plan=plan;this.architecture=geometry?.architecture||architecture(plan);this.fractures=geometry?.fractures||new Fractures(plan,this.architecture.parts);this.capacity=capacity;this.nodeBase=64;this.jointBase=this.nodeBase+plan.nodes.length*STRIDE;
    this.particleBase=this.jointBase+plan.joints.length;this.objectBase=this.particleBase+capacity*STRIDE;
    this.chargeBase=this.objectBase+plan.objects.length*4;
    this.tankBase=this.chargeBase+6*4;this.state=new Float64Array(this.tankBase+STRIDE);this.events=[];
    this.fragmentShapes=[];this.scratchSupport=new Float64Array(plan.nodes.length);this.previousPositions=new Float64Array(plan.nodes.length*3);
    const s=this.state;s[G.rng]=plan.seed;s[G.angle]=-1.10;s[G.length]=29;s[G.lastImpact]=-100;s[G.cheer]=-100;s[G.pigeon]=-1;
    const tip=this.tip();s[G.bx]=tip[0]+1.5;s[G.by]=tip[1]-29;s[G.bz]=tip[2]+.4;s[G.bvx]=.25;
    for(const n of plan.nodes){const o=this.no(n.id);s[o]=n.x;s[o+1]=n.y;s[o+2]=n.z;s[o+N.hp]=1;s[o+N.water]=n.water?1:0;s[o+N.hit]=-100;s[o+N.shellTime]=-1;}
    for(let i=0;i<plan.joints.length;i++)s[this.jointBase+i]=1;
    const tank=plan.nodes.find(n=>n.water);s[this.tankBase]=tank.x;s[this.tankBase+1]=tank.y+3;s[this.tankBase+2]=tank.z;
    this.initial=s.slice();
  }
  no(i){return this.nodeBase+i*STRIDE;}
  po(i){return this.particleBase+i*STRIDE;}
  random(){let x=this.state[G.rng]|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.state[G.rng]=x>>>0;return(x>>>0)/4294967296;}
  tip(){const s=this.state;return[-4+Math.cos(s[G.angle])*29,48,34+Math.sin(s[G.angle])*29];}
  emit(kind,data={}){this.events.push({time:this.state[G.time],kind,...data});}
  focus(x,y,z){const s=this.state;s[G.focusX]=x;s[G.focusY]=y;s[G.focusZ]=z;s[G.lastImpact]=s[G.time];if(s[G.pigeon]<0)s[G.pigeon]=s[G.time];}
  validTarget(id){return Number.isInteger(id)&&id>=0&&id<this.plan.nodes.length&&this.state[this.no(id)+N.mode]===0;}
  action(a){
    const s=this.state;
    if(a.type==='charge'){
      if(!this.validTarget(a.node))return false;
      for(let i=0;i<6;i++){let o=this.chargeBase+i*4;if(s[o]===1&&s[o+1]===a.node)return false;}
      for(let i=0;i<6;i++){let o=this.chargeBase+i*4;if(s[o]!==1){s[o]=1;s[o+1]=a.node;s[o+2]=-1;this.emit('charge-placed',{node:a.node,slot:i});return true;}}
      return false;
    }
    if(a.type==='detonate'){
      let k=0;for(let i=0;i<6;i++){const o=this.chargeBase+i*4;if(s[o]===1&&s[o+2]<0){s[o+2]=s[G.time]+.08+k*.18;k++;}}
      if(k){s[G.fired]++;this.emit('detonation-armed',{count:k});}return k>0;
    }
    if(a.type==='crane'){
      const rotate=clamp(a.rotate||0,-1,1), cable=clamp(a.cable||0,-1,1),px=clamp(a.pumpX||0,-1,1),pz=clamp(a.pumpZ||0,-1,1);
      if(!rotate&&!cable&&!px&&!pz)return false;
      s[G.angle]+=rotate*.6*DT;s[G.length]=clamp(s[G.length]+cable*12*DT,9,44);
      s[G.bvx]+=px*18*DT;s[G.bvz]+=pz*18*DT;return true;
    }
    if(a.type==='swing'){
      if(!Number.isFinite(a.x)||!Number.isFinite(a.z)||Math.hypot(a.x,a.z)<.01)return false;
      s[G.bvx]+=clamp(a.x,-24,24);s[G.bvz]+=clamp(a.z,-24,24);return true;
    }
    return false;
  }
  fragment(x,y,z,kind,count,energy=1,v=[0,0,0],owner=-1){
    const s=this.state,created=[];
    for(let k=0;k<count;k++){
      let slot=-1;const start=(s[G.serial]|0)%this.capacity;
      for(let j=0;j<this.capacity;j++){const i=(start+j)%this.capacity,o=this.po(i);if(!s[o+P.active]){slot=i;break;}}
      if(slot<0){ // Retire the oldest sleeping micro-fragment only; structural rubble never expires.
        let oldest=Infinity;for(let i=0;i<this.capacity;i++){const o=this.po(i);if(!s[o+P.owner]&&(s[o+P.sleep]||owner>=0)&&s[o+P.id]<oldest){oldest=s[o+P.id];slot=i;}}
      }
      if(slot<0)break;
      const o=this.po(slot);created.push(o);s.fill(0,o,o+STRIDE);s[o+P.active]=1;s[o+P.kind]=kind;s[o+P.id]=++s[G.serial];
      s[o]=x+(this.random()-.5)*1.8;s[o+1]=Math.max(.2,y+(this.random()-.5)*1.6);s[o+2]=z+(this.random()-.5)*1.8;
      const t=this.random()*Math.PI*2,speed=(1+this.random()*5)*energy;
      s[o+3]=Math.cos(t)*speed+v[0];s[o+4]=(1+this.random()*5)*energy+v[1];s[o+5]=Math.sin(t)*speed+v[2];
      s[o+9]=(this.random()-.5)*9;s[o+10]=(this.random()-.5)*9;s[o+11]=(this.random()-.5)*9;
      s[o+P.size]=kind===7?1.4+this.random()*1.3:kind===6?.10+this.random()*.18:kind===2?.12+this.random()*.35:.18+this.random()*.48;
      s[o+P.owner]=owner+1;s[o+P.ordinal]=k;s[o+P.birthX]=s[o];s[o+P.birthY]=s[o+1];s[o+P.birthZ]=s[o+2];
      s[o+P.life]=kind===7?6+this.random()*5:kind===6?4+this.random()*2:1e9;
      if(kind===7){s[o+4]=.6+this.random();s[o+3]*=.5;s[o+5]*=.5;}
    }
    return created;
  }
  damage(id,power,impulse=[0,0,0],cause='impact',source=-1){
    const n=this.plan.nodes[id],s=this.state,o=this.no(id);if(!n||s[o+N.mode]===2)return;
    s[o+N.hp]=Math.max(0,s[o+N.hp]-power*.48);s[o+N.hit]=s[G.time];
    this.focus(s[o],s[o+1]-n.h*.4,s[o+2]);
    if(s[o+N.shell]<2&&power>.12){
      s[o+N.shell]=Math.min(2,s[o+N.shell]+(power>.7?2:1));
      this.fragment(s[o],s[o+1]-n.h*.4,s[o+2],n.material,n.material===2?28:16,Math.min(2,power),impulse.map(v=>v*.06));
      this.fragment(s[o],s[o+1]-n.h*.6,s[o+2],7,4,.7);
    }
    if(power>.35){
      s[this.jointBase+n.vertical]=Math.max(0,s[this.jointBase+n.vertical]-power*.85);
      for(const ji of n.joints){const j=this.plan.joints[ji];if(j.kind==='beam')s[this.jointBase+ji]=Math.max(0,s[this.jointBase+ji]-power*.35);}
    }
    if(s[o+N.mode]===0){s[o+3]+=impulse[0]*.07;s[o+5]+=impulse[2]*.07;}
    else{s[o+3]+=impulse[0]*.1;s[o+4]+=impulse[1]*.1;s[o+5]+=impulse[2]*.1;}
    if(s[o+N.shell]===2&&s[o+N.shellTime]<0)this.fracture(id);
    if(source>=0&&this.plan.nodes[source].b!==n.b&&power>.35){s[G.chainContacts]++;s[G.chain]=Math.max(s[G.chain],2);this.emit('neighbor-contact',{source,target:id,power,cause,sourceMemberPosition:Array.from(s.slice(this.no(source),this.no(source)+3)),targetMemberPosition:Array.from(s.slice(o,o+3))});}
    if(n.water&&power>.45)this.detachTank(id,impulse);
    this.emit('damage',{node:id,power,cause,source});
  }
  fracture(id,columnsOnly=false){
    const s=this.state,o=this.no(id),n=this.plan.nodes[id];if(!columnsOnly){s[o+N.shellTime]=s[G.time];for(let k=0;k<9;k++)s[o+N.shellX+k]=s[o+k];}
    for(const g of this.fractures.nodes[id]){
      if(columnsOnly?!g.column:(g.column&&!s[o+N.mode]))continue;
      const pos=rotate(g.center,Array.from(s.slice(o+6,o+9))).map((v,k)=>v+s[o+k]);
      const [q]=this.fragment(...pos,g.material,1,g.loose?1.2:.22,[s[o+3],s[o+4],s[o+5]],id);
      if(q===undefined)continue;
      s[q+P.ordinal]=g.ordinal;
      for(let k=0;k<3;k++){s[q+k]=pos[k];s[q+P.birthX+k]=pos[k];s[q+6+k]=s[o+6+k];s[q+9+k]*=g.loose?1:g.column?.25:g.material===1?.36:.48;}
    }
  }
  detachTank(id,impulse=[0,0,0]){
    const s=this.state,o=this.no(id),q=this.tankBase;if(s[q+T.mode])return;
    s[q+T.mode]=1;s[q+T.detached]=s[G.time];s[q+3]=s[o+3]+impulse[0]*.08+5.4;s[q+4]=1;s[q+5]=s[o+5]+impulse[2]*.08+3.2;s[q+9]=1.4;s[q+11]=-1.1;
    this.emit('tank-detached',{node:id,position:Array.from(s.slice(q,q+3))});
  }
  burst(id){
    const s=this.state,o=this.no(id),q=this.tankBase;if(s[q+T.ruptured])return;
    this.detachTank(id);s[o+N.water]=0;s[q+T.ruptured]=1;s[q+T.burst]=s[G.time];
    this.fragment(s[q],s[q+1],s[q+2],6,90,1.8,[s[q+3],0,s[q+5]]);
    this.fragment(s[q],s[q+1],s[q+2],5,22,1);
    this.emit('water-burst',{node:id,position:Array.from(s.slice(q,q+3))});
  }
  tankStep(){
    const s=this.state,n=this.plan.nodes.find(n=>n.water),o=this.no(n.id),q=this.tankBase;
    if(!s[q+T.mode]){const v=rotate([0,3,0],Array.from(s.slice(o+6,o+9)));for(let k=0;k<3;k++){s[q+k]=s[o+k]+v[k];s[q+6+k]=s[o+6+k];}if(s[o+N.mode])this.detachTank(n.id);return;}
    const floors=this.slabBodies();
    if(s[q+T.mode]===2){
      const body=tankBody(s,q);
      const grounded=body.center[1]-body.extent[1]<=.35+.002;let supported=grounded,penetrating=false;const supports=[];
      for(const floor of floors){const hit=contact(body,floor,.002);if(!hit)continue;penetrating ||= hit.depth>CONTACT_EPSILON;supported ||= s[floor.o+N.mode]!==1&&hit.normal[1]>.4;if(hit.normal[1]>.4)supports.push(floor);}
      const lever=supportLever(body,supports),balanced=grounded||(lever&&Math.hypot(lever[0],lever[2])<.025);
      if(supported&&balanced&&!penetrating)return;s[q+T.mode]=1;s[q+T.rest]=0;s[q+T.supported]=0;this.emit('tank-support-lost');
    }
    s[q+4]-=9.81*DT;for(let k=0;k<3;k++){s[q+k]+=s[q+3+k]*DT;s[q+6+k]+=s[q+9+k]*DT;}
    let supported=false,movingSupport=false,grounded=false;const supports=new Set();
    for(let pass=0;pass<6;pass++){
      let body=tankBody(s,q);
      const hits=[];if(body.center[1]-body.extent[1]<.35)hits.push({hit:{normal:[0,1,0],depth:.35-body.center[1]+body.extent[1]},floor:null});
      for(const floor of floors){const hit=contact(body,floor);if(hit)hits.push({hit,floor});}
      if(!hits.length)break;
      for(const {hit,floor} of hits){
        // Re-evaluate after each response; corner contacts can involve two bays.
        const current=floor?contact(tankBody(s,q),floor):hit;if(!current)continue;
        separate(s,q,current);const v=current.normal,base=floor?.o,relative=[0,1,2].map(k=>s[q+3+k]-(base===undefined||s[base+N.mode]!==1?0:s[base+3+k])),inward=relative.reduce((a,x,k)=>a+x*v[k],0);
        // Test impact energy before contact friction dissipates rotation.
        if(Math.max(0,-inward)+2.1*Math.hypot(s[q+9],s[q+10],s[q+11])>2.5)this.burst(n.id);
        if(inward<0)for(let k=0;k<3;k++)s[q+3+k]-=inward*v[k]*(inward < -1?1.12:1);
        if(current.normal[1]>.4){supported=true;if(floor)supports.add(floor);else grounded=true;movingSupport ||= floor!==null&&s[floor.o+N.mode]===1;s[q+3]*=.84;s[q+5]*=.84;}
        for(let k=9;k<12;k++)s[q+k]*=.84;
      }
    }
    if(s[q+T.supported]&&!supported)this.emit('tank-support-lost');s[q+T.supported]=supported?1:0;
    const lever=supportLever(tankBody(s,q),supports),balanced=grounded||(lever&&Math.hypot(lever[0],lever[2])<.025);
    if(supported&&!balanced&&lever){
      // An overhanging center of mass tips about the edge instead of becoming
      // a permanent anchor on a narrow strip of roof.
      const height=Math.max(.2,-lever[1]),inertia=(2.1**2+2.05**2)/3;
      const ax=-lever[2]*9.81/(inertia+lever[2]**2+height**2),az=lever[0]*9.81/(inertia+lever[0]**2+height**2);
      s[q+9]+=ax*DT;s[q+11]+=az*DT;s[q+3]-=az*height*DT;s[q+5]+=ax*height*DT;
    }
    if(supported&&balanced&&!movingSupport&&Math.hypot(...s.slice(q+3,q+6))<.3&&Math.hypot(...s.slice(q+9,q+12))<.1){s[q+T.rest]+=DT;if(s[q+T.rest]>.7){s[q+T.mode]=2;s.fill(0,q+3,q+6);s.fill(0,q+9,q+12);}}else s[q+T.rest]=0;
  }
  slabBodies(){return this.plan.nodes.map(n=>({...slab(this.state,this.no(n.id),n,this.plan.buildings[n.b]),node:n.id}));}
  detach(id){
    const s=this.state,n=this.plan.nodes[id],o=this.no(id);if(s[o+N.mode])return;
    s[o+N.mode]=1;s[o+N.shell]=2;s[o+N.detachTime]=s[G.time];
    // The column's physical chunks are released below; its old anchor cannot
    // keep carrying the floor. Surviving beams still connect adjacent bays.
    const vertical=n.vertical;if(s[this.jointBase+vertical]>0){s[this.jointBase+vertical]=0;this.emit('connection-broken',{joint:vertical,a:id,b:n.below,cause:'column-release'});}
    let dx=s[o+3],dz=s[o+5];
    for(const a of n.neighbors){const q=this.no(a);if(s[q+N.mode]){dx+=(this.plan.nodes[a].x-n.x)*.25;dz+=(this.plan.nodes[a].z-n.z)*.25;}}
    s[o+3]=clamp(dx,-12,12);s[o+5]=clamp(dz,-12,12);s[o+9]=dz*.07;s[o+11]=-dx*.07;if(s[o+N.shellTime]<0)this.fracture(id);else this.fracture(id,true);
    this.fragment(s[o],s[o+1]-n.h*.5,s[o+2],n.material,n.material===2?16:10,.5,[dx*.2,0,dz*.2]);
    this.fragment(s[o],s[o+1],s[o+2],7,2,.5);
    this.focus(s[o],s[o+1],s[o+2]);this.emit('support-failure',{node:id,floor:n.f,building:n.b});
  }
  step(){
    const s=this.state,ns=this.plan.nodes;s[G.time]+=DT;
    for(let i=0;i<6;i++){const o=this.chargeBase+i*4;if(s[o]===1&&s[o+2]>=0&&s[o+2]<=s[G.time]){
      const id=s[o+1],n=ns[id],q=this.no(id);s[o]=2;
      this.damage(id,2.4,[(n.x-this.plan.buildings[n.b].x)*-1.2,-2,(n.z-this.plan.buildings[n.b].z)*-1.2],'charge');
      this.fragment(s[q],s[q+1]-n.h*.6,s[q+2],7,10,1.7);this.emit('charge-fired',{node:id,slot:i});
    }}
    this.ballStep();
    // Capacity transfers through intact columns and adjacent supported bays.
    const support=this.scratchSupport;support.fill(0);
    for(const n of ns){const o=this.no(n.id);if(s[o+N.mode])continue;
      const v=s[this.jointBase+n.vertical];const below=n.below<0||s[this.no(n.below)+N.mode]===0;
      support[n.id]=below?v*1.4:0;
    }
    for(const n of ns){const o=this.no(n.id);if(s[o+N.mode])continue;
      let capacity=support[n.id];
      for(const ji of n.joints){const j=this.plan.joints[ji];if(j.kind!=='beam')continue;const a=j.a===n.id?j.b:j.a;
        if(support[a]>=1)capacity+=s[this.jointBase+ji]*.27;
      }
      if(capacity<1){
        const deficit=1-capacity;s[o+N.fatigue]+=DT*deficit;
        s[o+1]=n.y-Math.min(.75,s[o+N.fatigue]*.35);
        s[o+N.rx]=Math.sin(n.id*4.3)*s[o+N.fatigue]*.035;s[o+N.rz]=Math.cos(n.id*4.3)*s[o+N.fatigue]*.035;
        if(s[o+N.fatigue]>.35){for(const ji of n.joints){if(this.plan.joints[ji].kind==='beam')s[this.jointBase+ji]=Math.max(0,s[this.jointBase+ji]-DT*deficit*.8);}}
        if(s[o+N.fatigue]>.6||s[o+N.hp]===0)this.detach(n.id);
      }
    }
    this.wakeUnsupportedSlabs();
    for(const n of ns){const o=this.no(n.id);if(s[o+N.mode]!==1)continue;
      for(let k=0;k<3;k++)this.previousPositions[n.id*3+k]=s[o+k];
      s[o+4]-=9.81*DT;
      for(let a=0;a<3;a++){s[o+a]+=s[o+3+a]*DT;s[o+6+a]+=s[o+9+a]*DT;s[o+9+a]*=.995;}
    }
    this.solveConnections();
    // Finish velocity reconstruction before contacts can release another bay.
    for(const n of ns){const o=this.no(n.id);if(s[o+N.mode]===1)for(let k=0;k<3;k++)s[o+3+k]=(s[o+k]-this.previousPositions[n.id*3+k])/DT;}
    const floorBodies=this.slabBodies();
    for(const n of ns){const o=this.no(n.id);if(s[o+N.mode]!==1)continue;
      let restingContact=false,body=floorBodies[n.id];
      for(const m of ns){if(m.id===n.id)continue;const q=this.no(m.id);
        if(s[q+N.mode]===1)continue;
        const floor=floorBodies[m.id],hit=contact(body,floor);
        if(hit){
          const inward=hit.normal.reduce((v,a,k)=>v+a*s[o+3+k],0),impact=Math.max(0,-inward);
          if(s[q+N.mode]===0&&hit.normal[1]>.4&&impact>1){
            if(impact>2)this.breakConnections(n.id,'floor-impact');
            this.damage(m.id,impact*.16*(n.mass/16),[s[o+3]*1.5,-impact*(n.mass/16),s[o+5]*1.5],'falling-slab',n.id);
            if(s[this.jointBase+m.vertical]<=.25)this.detach(m.id);
          }else if(s[q+N.mode]===0&&m.b!==n.b&&impact>1.4&&s[G.time]-s[q+N.hit]>.16){
            this.damage(m.id,impact*.28*(n.mass/16),[s[o+3]*2,0,s[o+5]*2],'side-contact',n.id);
          }
          if(s[q+N.mode]!==1){separate(s,o,hit);body=slab(s,o,n,this.plan.buildings[n.b]);if(inward<0)for(let k=0;k<3;k++)s[o+3+k]-=inward*hit.normal[k]*(impact>2?1.12:1);restingContact ||= hit.normal[1]>.4;
            if(impact>1.5&&s[q+N.mode]===2)this.rubbleImpact(n,impact);
          }
        }else if(s[q+N.mode]===0&&m.b!==n.b&&Math.abs(s[o]-s[q])<(n.sx+m.sx)*.46&&Math.abs(s[o+2]-s[q+2])<(n.sz+m.sz)*.46&&s[o+1]>s[q+1]-m.h&&s[o+1]<s[q+1]+.24&&Math.hypot(s[o+3],s[o+5])>1.4&&s[G.time]-s[q+N.hit]>.16){
          const speed=Math.hypot(s[o+3],s[o+5]);this.damage(m.id,speed*.28*(n.mass/16),[s[o+3]*2,0,s[o+5]*2],'side-contact',n.id);s[o+3]*=.75;s[o+5]*=.75;
        }
      }
      const depth=.35-body.center[1]+body.extent[1];
      if(depth>=0){const impact=-s[o+4];separate(s,o,{normal:[0,1,0],depth});if(impact>1.5)this.rubbleImpact(n,impact);s[o+4]=impact>2?impact*.12:0;restingContact=true;}
      if(restingContact){
        s[o+3]*=.87;s[o+5]*=.87;for(let k=9;k<12;k++)s[o+k]*=.75;
        if(Math.hypot(s[o+3],s[o+4],s[o+5])<.4&&Math.hypot(s[o+9],s[o+10],s[o+11])<.1)s[o+N.rest]+=DT;else s[o+N.rest]=0;
        if(s[o+N.rest]>.6){s[o+N.mode]=2;s.fill(0,o+3,o+6);s.fill(0,o+9,o+12);}
      }else s[o+N.rest]=0;
      floorBodies[n.id]=slab(s,o,n,this.plan.buildings[n.b]);
      this.streetImpact(s[o],s[o+1],s[o+2],Math.max(n.sx,n.sz)*.6,n.id);
    }
    this.tankStep();this.particleStep();
  }
  rubbleImpact(n,impact){
    const s=this.state,o=this.no(n.id);this.breakConnections(n.id,'rubble-impact');
    this.fragment(s[o],s[o+1],s[o+2],7,Math.min(5,Math.ceil(impact*.3)),.6);
    if(s[o+N.water])this.burst(n.id);
    if(!s[o+N.scored]){s[o+N.scored]=1;s[G.tons]+=n.mass;s[G.score]+=Math.round(n.mass*10*Math.max(1,s[G.chain]));s[G.cheer]=s[G.time];
      if(Math.abs(s[o]-n.x)<1.5&&Math.abs(s[o+2]-n.z)<1.5){s[G.clean]++;s[G.score]+=50;}
    }
  }
  breakConnections(id,cause){
    for(const ji of this.plan.nodes[id].joints)if(this.state[this.jointBase+ji]>0){this.state[this.jointBase+ji]=0;const j=this.plan.joints[ji];this.emit('connection-broken',{joint:ji,a:j.a,b:j.b,cause});}
  }
  wakeUnsupportedSlabs(){
    const s=this.state,bodies=this.slabBodies(),roots=[],pending=[];
    for(const body of bodies){
      if(s[body.o+N.mode]===0||(s[body.o+N.mode]===2&&body.center[1]-body.extent[1]<=.351))roots.push(body);
      else if(s[body.o+N.mode]===2)pending.push(body);
    }
    // Reachability from actual roots rules out floating cycles. A tilted slab
    // can support a body's edge even when its own center is higher.
    for(let i=0;i<roots.length&&pending.length;i++)for(let j=pending.length-1;j>=0;j--){
      const hit=contact(pending[j],roots[i],.035);
      if(hit&&hit.normal[1]>.4)roots.push(...pending.splice(j,1));
    }
    for(const body of pending){s[body.o+N.mode]=1;s[body.o+N.rest]=0;this.emit('slab-support-lost',{node:body.node});}
  }
  solveConnections(){
    const s=this.state;
    for(let pass=0;pass<3;pass++)for(const j of this.plan.joints){
      const health=s[this.jointBase+j.id];if(health<=0||j.b<0)continue;
      const a=this.no(j.a),b=this.no(j.b),wa=s[a+N.mode]===1?1:0,wb=s[b+N.mode]===1?1:0;if(!wa&&!wb)continue;
      const na=this.plan.nodes[j.a],nb=this.plan.nodes[j.b],rest=[nb.x-na.x,nb.y-na.y,nb.z-na.z];
      const ra=rotate(rest.map(v=>v*.5),Array.from(s.slice(a+6,a+9))),rb=rotate(rest.map(v=>-v*.5),Array.from(s.slice(b+6,b+9)));
      const error=[0,1,2].map(k=>s[b+k]+rb[k]-s[a+k]-ra[k]),strain=Math.hypot(...error),length=Math.hypot(...rest);
      if(pass===0){
        const loss=DT*Math.max(0,strain-.12)*1.4;
        s[this.jointBase+j.id]=Math.max(0,health-loss);
        if(strain>1.1+health*1.4||s[this.jointBase+j.id]===0){s[this.jointBase+j.id]=0;this.emit('connection-broken',{joint:j.id,a:j.a,b:j.b,strain});continue;}
      }
      const strength=.36*health/(wa+wb);
      for(let k=0;k<3;k++){const d=error[k]*strength;if(wa){s[a+k]+=d;}if(wb){s[b+k]-=d;}}
      // Torque from the displaced connection rotates the surviving section.
      const torque=[ra[1]*error[2]-ra[2]*error[1],ra[2]*error[0]-ra[0]*error[2],ra[0]*error[1]-ra[1]*error[0]];
      for(let k=0;k<3;k++){const turn=torque[k]*.08/(length*length);if(wa)s[a+6+k]+=turn;if(wb)s[b+6+k]+=turn;}
    }
  }
  ballStep(){
    const s=this.state,tip=this.tip();s[G.bvy]-=9.81*DT;
    const old=[s[G.bx],s[G.by],s[G.bz]];
    for(let i=0;i<3;i++)s[G.bx+i]+=s[G.bvx+i]*DT;
    let dx=s[G.bx]-tip[0],dy=s[G.by]-tip[1],dz=s[G.bz]-tip[2],d=Math.hypot(dx,dy,dz),len=s[G.length];
    if(d>len){dx/=d;dy/=d;dz/=d;s[G.bx]=tip[0]+dx*len;s[G.by]=tip[1]+dy*len;s[G.bz]=tip[2]+dz*len;
      const radial=s[G.bvx]*dx+s[G.bvy]*dy+s[G.bvz]*dz;s[G.bvx]-=radial*dx;s[G.bvy]-=radial*dy;s[G.bvz]-=radial*dz;
      // The moving suspension point transfers momentum through cable tension.
      for(let i=0;i<3;i++)s[G.bvx+i]=clamp(s[G.bvx+i]*.7+(s[G.bx+i]-old[i])/DT*.3,-42,42);
    }
    for(let i=0;i<3;i++)s[G.bvx+i]*=.9995;
    if(s[G.by]<2){s[G.by]=2;s[G.bvy]=Math.abs(s[G.bvy])*.25;}
    for(const n of this.plan.nodes){const o=this.no(n.id);if(s[o+N.mode]===2||s[G.time]-s[o+N.hit]<.24)continue;
      const boxes=[];
      if(n.water&&!s[this.tankBase+T.ruptured]){const body=tankBody(s,this.tankBase);boxes.push([...body.center,...body.extent]);}
      if(s[o+N.shell]<2&&s[o+N.mode]===0)boxes.push([s[o],s[o+1]-n.h*.5,s[o+2],n.sx*.5,n.h*.5+.2,n.sz*.5]);
      else{boxes.push([s[o],s[o+1],s[o+2],n.sx*.5,.22,n.sz*.5]);for(const x of [-n.sx*.44,n.sx*.44])for(const z of [-n.sz*.44,n.sz*.44])boxes.push([s[o]+x,s[o+1]-n.h*.5,s[o+2]+z,.18,n.h*.5,.18]);}
      let closest=null,best=Infinity;for(const b of boxes){const p=[clamp(s[G.bx],b[0]-b[3],b[0]+b[3]),clamp(s[G.by],b[1]-b[4],b[1]+b[4]),clamp(s[G.bz],b[2]-b[5],b[2]+b[5])],d=Math.hypot(s[G.bx]-p[0],s[G.by]-p[1],s[G.bz]-p[2]);if(d<best){best=d;closest=p;}}
      const [cx,cy,cz]=closest;
      let dx=s[G.bx]-cx,dy=s[G.by]-cy,dz=s[G.bz]-cz,dist=Math.hypot(dx,dy,dz);
      if(dist<1.8){const speed=Math.hypot(s[G.bvx],s[G.bvy],s[G.bvz]);if(speed>1.4){this.damage(n.id,speed*.11,[s[G.bvx]*2,s[G.bvy]*2,s[G.bvz]*2],'ball');if(s[o+N.water]&&s[G.by]>s[o+1]+1)this.burst(n.id);}
        if(dist<.01){dx=old[0]-s[o];dz=old[2]-s[o+2];dy=0;dist=Math.hypot(dx,dz)||1;}
        dx/=dist;dy/=dist;dz/=dist;const inward=s[G.bvx]*dx+s[G.bvy]*dy+s[G.bvz]*dz;
        if(inward<0){s[G.bvx]-=inward*dx*.62;s[G.bvy]-=inward*dy*.62;s[G.bvz]-=inward*dz*.62;}
        s[G.bx]+=dx*.12;s[G.by]+=dy*.12;s[G.bz]+=dz*.12;
      }
    }
  }
  streetImpact(x,y,z,r,source){
    if(y>3.7)return;const s=this.state;
    for(let i=0;i<this.plan.objects.length;i++){const ob=this.plan.objects[i],o=this.objectBase+i*4;if(s[o])continue;
      if(Math.hypot(x-ob.x,z-ob.z)<r+1){s[o]=1;s[o+1]=s[G.time];s[o+2]=Math.atan2(ob.z-z,ob.x-x);s[G[ob.kind==='car'?'crushedCars':'snappedTrees']]++;
        this.fragment(ob.x,1,ob.z,ob.kind==='car'?3:5,9,1);this.emit('street-object',{object:i,objectKind:ob.kind,source});}
    }
  }
  fragmentShape(o,state=this.state){
    const i=(o-this.particleBase)/STRIDE,g=state[o+P.owner]?this.fractures.group(state[o+P.owner]-1,state[o+P.ordinal]):null;
    let cached=state===this.state?this.fragmentShapes[i]:null;
    if(cached&&cached.group===g&&cached.size===state[o+P.size]&&cached.kind===state[o+P.kind]&&[6,7,8].every((k,j)=>Object.is(cached.rotation[j],state[o+k])))return cached.body;
    const size=state[o+P.size],kind=state[o+P.kind],half=g?.half||[size*(kind===3?1:.5),size*(kind===2?.075:kind===3?.07:.35),size*.5];
    const {axes,extent}=box(state,o,half),body={axes,extent};
    if(state===this.state)this.fragmentShapes[i]={group:g,size,kind,rotation:Array.from(state.slice(o+6,o+9)),body};
    return body;
  }
  fragmentExtent(o,state=this.state){return this.fragmentShape(o,state).extent;}
  supportGrid(){
    const s=this.state,grid=new Map(),add=e=>{
      for(let x=Math.floor((s[e.q]-e.half[0])/8);x<=Math.floor((s[e.q]+e.half[0])/8);x++)for(let z=Math.floor((s[e.q+2]-e.half[2])/8);z<=Math.floor((s[e.q+2]+e.half[2])/8);z++){
        const key=(x&65535)*65536+(z&65535);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(e);
      }
    };
    for(const n of this.plan.nodes){const q=this.no(n.id);if(s[q+N.mode]!==1){const body=slab(s,q,n,this.plan.buildings[n.b]);add({q,half:body.extent,top:body.center[1]+body.extent[1],node:n.id});}}
    for(let i=0;i<this.capacity;i++){const q=this.po(i);if(s[q+P.active]&&s[q+P.owner]&&s[q+P.sleep])add({q,half:this.fragmentExtent(q),node:-1});}
    return grid;
  }
  fragmentSupport(o,half,grid){
    const s=this.state;let height=.35+half[1],node=-1;
    if(s[o+P.owner]||s[o+P.kind]===6){
      for(let x=Math.floor((s[o]-half[0])/8);x<=Math.floor((s[o]+half[0])/8);x++)for(let z=Math.floor((s[o+2]-half[2])/8);z<=Math.floor((s[o+2]+half[2])/8);z++)for(const e of grid.get((x&65535)*65536+(z&65535))||[]){
        const {q,half:other}=e;if(q===o)continue;const top=e.top??s[q+1]+other[1];
        const cross=Math.max(.3,-s[o+4]*DT+.05);
        if(s[o+1]-half[1]>=top-cross&&Math.abs(s[o]-s[q])<(e.node>=0?other[0]+half[0]*.45:Math.min(half[0],other[0])*.7)&&Math.abs(s[o+2]-s[q+2])<(e.node>=0?other[2]+half[2]*.45:Math.min(half[2],other[2])*.7)&&top+half[1]>height){height=top+half[1];node=e.node;}
      }
    }
    return {height,node};
  }
  fragmentGround(o,half,grid){return this.fragmentSupport(o,half,grid).height;}
  particleStep(){
    const s=this.state;
    const settled=this.supportGrid();
    for(let i=0;i<this.capacity;i++){const o=this.po(i);if(!s[o+P.active])continue;if(s[o+P.sleep]){if(!s[o+P.owner]||s[o+1]<=this.fragmentGround(o,this.fragmentExtent(o),settled)+.03)continue;s[o+P.sleep]=0;s[o+P.rest]=0;}const kind=s[o+P.kind];if(!s[o+P.owner])s[o+P.age]+=DT;
      if(s[o+P.age]>s[o+P.life]){s[o+P.active]=0;continue;}
      if(kind===7){s[o+3]+=.06*DT;s[o+4]+=.12*DT;s[o+3]*=.99;s[o+5]*=.99;}
      else s[o+4]-=9.81*DT;
      for(let a=0;a<3;a++){s[o+a]+=s[o+3+a]*DT;s[o+6+a]+=s[o+9+a]*DT;}
      const contactHalf=this.fragmentExtent(o);
      if(s[o+P.owner]&&Math.hypot(s[o+3],s[o+4],s[o+5])>3){
        const source=s[o+P.owner]-1,building=this.plan.nodes[source].b;
        for(const b of this.plan.buildings){if(b.id===building||Math.abs(s[o]-b.x)>b.nx*b.bay*.5+contactHalf[0]||Math.abs(s[o+2]-b.z)>b.nz*b.bay*.5+contactHalf[2])continue;
          for(const id of b.nodes){const n=this.plan.nodes[id],q=this.no(id);if(s[q+N.mode]||s[G.time]-s[q+N.hit]<.2)continue;
            if(Math.abs(s[o]-s[q])<n.sx*.5+contactHalf[0]&&Math.abs(s[o+2]-s[q+2])<n.sz*.5+contactHalf[2]&&s[o+1]-contactHalf[1]<s[q+1]+.2&&s[o+1]+contactHalf[1]>s[q+1]-n.h){
              this.emit('facade-contact-probe',{source,target:id,group:s[o+P.id],half:contactHalf,position:Array.from(s.slice(o,o+3)),velocity:Array.from(s.slice(o+3,o+6)),targetPosition:Array.from(s.slice(q,q+3))});this.damage(id,Math.hypot(s[o+3],s[o+4],s[o+5])*.07,[s[o+3]*.3,s[o+4]*.3,s[o+5]*.3],'facade-contact',source);s[o+3]*=-.25;s[o+5]*=-.25;s[o+4]*=.5;break;
            }
          }
        }
      }
      const half=contactHalf,support=this.fragmentSupport(o,half,settled),ground=support.height;
      if(s[o+1]<ground){s[o+1]=ground;const impact=-s[o+4];let balanced=true;s[o+4]=impact*(kind===2?.24:kind===6?.08:.16);s[o+3]*=kind===6?.92:.82;s[o+5]*=kind===6?.92:.82;for(let k=9;k<12;k++)s[o+k]*=s[o+P.owner]?.94:.78;
        if(s[o+P.owner]){
          // A tilted box bears on its lowest corner. The normal force creates
          // torque around its center; tall facade chunks topple before resting.
          const g=this.fractures.group(s[o+P.owner]-1,s[o+P.ordinal]),shape=this.fragmentShape(o);
          const axes=shape.axes.map((axis,i)=>axis.map(v=>v*g.half[i]));
          const lever=[0,0,0];for(const axis of axes)for(let k=0;k<3;k++)lever[k]-=(Math.abs(axis[1])<.025?0:Math.sign(axis[1]))*axis[k];
          balanced=Math.hypot(lever[0],lever[2])<.075;
          s[o+9]-=lever[2]*9.81*DT*.65/(g.half[1]**2+g.half[2]**2+.1);
          s[o+11]+=lever[0]*9.81*DT*.65/(g.half[0]**2+g.half[1]**2+.1);
        }
        if(s[o+P.owner]&&support.node>=0&&impact>2&&s[G.time]-s[this.no(support.node)+N.hit]>.2)this.damage(support.node,impact*(kind===1||kind===4?.012:.007),[s[o+3]*.2,-impact*.2,s[o+5]*.2],'chunk-floor-contact',s[o+P.owner]-1);
        if(s[o+P.owner]&&impact>4)this.streetImpact(s[o],s[o+1],s[o+2],1.1,s[o+P.owner]-1);
        if(kind===6){ // Shallow radial water flow exchanges momentum with nearby fragments.
          for(let k=0;k<this.capacity;k+=1){const q=this.po(k);if(!s[q+P.active]||s[q+P.kind]>=6)continue;const half=this.fragmentExtent(q);if(Math.abs(s[q+1]-half[1]-(s[o+1]-s[o+P.size]*.5))>1.2)continue;
            const dx=s[q]-s[o],dz=s[q+2]-s[o+2],d2=dx*dx+dz*dz;const distance=Math.max(0,Math.abs(dx)-half[0])**2+Math.max(0,Math.abs(dz)-half[2])**2;if(distance<3.2&&d2>.01){const impulse=.16/(.4+d2);s[q+3]+=dx*impulse;s[q+5]+=dz*impulse;s[q+4]+=.04;s[q+P.sleep]=0;s[q+P.rest]=0;s[G.waterImpulse]+=Math.hypot(dx,dz)*impulse;}
          }
        }
        if(balanced&&impact<.5&&Math.hypot(s[o+3],s[o+5])<.3&&Math.hypot(s[o+9],s[o+10],s[o+11])<.18&&kind<6){s[o+P.rest]+=DT;if(s[o+P.rest]>.3){s[o+P.sleep]=1;s.fill(0,o+3,o+6);s.fill(0,o+9,o+12);}}else s[o+P.rest]=0;
      }
    }
  }
  stats(){const s=this.state;let active=0,sleeping=0,debris=0,dust=0,water=0;
    for(const n of this.plan.nodes){const m=s[this.no(n.id)+N.mode];if(m===1)active++;if(m===2)sleeping++;}
    for(let i=0;i<this.capacity;i++){const o=this.po(i);if(s[o+P.active]){debris++;if(s[o+P.kind]===7)dust++;if(s[o+P.kind]===6)water++;}}
    return {time:s[G.time],active,sleeping,debris,dust,water,score:s[G.score],tons:s[G.tons],chain:s[G.chain],waterImpulse:s[G.waterImpulse],chainContacts:s[G.chainContacts],crushedCars:s[G.crushedCars],snappedTrees:s[G.snappedTrees],createdFragments:s[G.serial]};
  }
}

// Lossless XOR of Float64 bits: the same delta applies forward and backward.
// Sparse checkpoints bound seek work; every simulation and action record remains.
// No eviction: the run retains its complete history until the page is closed.
export class History {
  constructor(city){this.city=city;this.frames=[];this.keys=new Map();this.cursor=0;this.branchCount=0;this.version=0;this.previous=city.state.slice();this.frames.push(null);this.keys.set(0,this.pack(city.state));this.bytes=this.keyBytes(this.keys.get(0));}
  get end(){return this.frames.length-1;}
  pack(s){const ids=[],values=[];for(let i=0;i<s.length;i++)if(!Object.is(s[i],0)){ids.push(i);values.push(s[i]);}return {ids:Uint32Array.from(ids),values:Float64Array.from(values)};}
  keyBytes(k){return k.ids.byteLength+k.values.byteLength;}
  record(){
    if(this.cursor!==this.end)throw Error('Branch before evolving a historical state');
    const s=this.city.state,ids=[],xor=[],now=new Uint32Array(s.buffer,s.byteOffset,s.length*2),previous=new Uint32Array(this.previous.buffer);
    for(let i=0;i<s.length;i++){const lo=now[i*2]^previous[i*2],hi=now[i*2+1]^previous[i*2+1];if(lo||hi){ids.push(i);xor.push(lo,hi);}}
    const frame={time:s[G.time],eventCount:this.city.events.length,ids:Uint32Array.from(ids),xor:Uint32Array.from(xor)};
    this.frames.push(frame);this.cursor++;this.version++;this.bytes+=frame.ids.byteLength+frame.xor.byteLength;
    this.previous.set(s);if(this.cursor%120===0){const k=this.pack(s);this.keys.set(this.cursor,k);this.bytes+=this.keyBytes(k);}
  }
  applyTo(state,frame){const words=new Uint32Array(state.buffer,state.byteOffset,state.length*2);for(let i=0;i<frame.ids.length;i++){const o=frame.ids[i]*2;words[o]^=frame.xor[i*2];words[o+1]^=frame.xor[i*2+1];}}
  apply(frame){this.applyTo(this.city.state,this.frames[frame]);}
  seek(frame){const target=clamp(Math.round(frame),0,this.end);
    if(Math.abs(target-this.cursor)>120){const key=Math.floor(target/120)*120;const k=this.keys.get(key);this.city.state.fill(0);for(let i=0;i<k.ids.length;i++)this.city.state[k.ids[i]]=k.values[i];this.cursor=key;}
    while(this.cursor>target){this.apply(this.cursor,true);this.cursor--;}
    while(this.cursor<target){this.cursor++;this.apply(this.cursor,false);}
    this.previous.set(this.city.state);this.version++;return this.city.state;
  }
  branch(){if(this.cursor===this.end)return false;
    this.frames.length=this.cursor+1;for(const k of this.keys.keys())if(k>this.cursor)this.keys.delete(k);
    this.city.events.length=this.frames[this.cursor]?.eventCount||0;this.branchCount++;this.recount();return true;
  }
  recount(){this.bytes=0;for(const f of this.frames)if(f)this.bytes+=f.ids.byteLength+f.xor.byteLength;for(const k of this.keys.values())this.bytes+=this.keyBytes(k);}
  action(a){
    // Validate on a copy first: rejected input must preserve the recorded future.
    const original=this.city.state.slice(),eventCount=this.city.events.length;
    const accepted=this.city.action(a);const changed=this.city.state.slice();const newEvents=this.city.events.slice(eventCount);
    this.city.state.set(original);this.city.events.length=eventCount;
    if(!accepted||!changed.some((v,i)=>!Object.is(v,original[i])))return false;
    this.branch();this.city.state.set(changed);this.city.events.push(...newEvents);
    // An action gets its own snapshot at the current simulation time.
    this.record();return true;
  }
  advance(){if(this.cursor<this.end){const target=this.city.state[G.time]+DT;let next=this.cursor;while(next<this.end&&this.timeAt(next+1)<=target+1e-9)next++;this.seek(next);return 'replay';}this.city.step();this.record();return 'live';}
  seekTime(t){let lo=0,hi=this.end; // Frame times include same-time accepted inputs.
    while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(this.timeAt(mid)<=t+1e-9)lo=mid;else hi=mid-1;}
    return this.seek(lo);
  }
  timeAt(frame){return this.frames[frame]?.time||0;}
}

export class Playback {
  constructor(city=new City()) {
    this.city=city;this.history=new History(city);this.presentation=new Presentation(city);
    this.mode='live';this.speed=1;this.holdSlow=false;this.accumulator=0;
  }
  get time(){return this.city.state[G.time]+this.accumulator;}
  sample(){return this.presentation.sample(this.history,this.accumulator/DT,this.pendingInput);}
  tick(wallSeconds,input=null){
    this.pendingInput=input;
    if(this.mode==='paused')return;
    const wall=Math.min(wallSeconds,.25);
    if(this.mode==='reset'||this.mode==='rewind'){
      const rate=this.mode==='reset'?Math.max(2,this.history.timeAt(this.history.end)/5):2;
      this.seekTime(Math.max(0,this.time-wall*rate));
      if(this.time<=1e-9){this.history.seek(0);this.accumulator=0;this.mode='paused';}
      return;
    }
    this.accumulator+=wall*(this.holdSlow?.1:this.speed);
    while(this.accumulator>=DT-1e-10){
      if(input)this.history.action(input);
      this.history.advance();this.accumulator=Math.max(0,this.accumulator-DT);
    }
  }
  act(action){
    const displayedTime=this.time,restoredTime=this.city.state[G.time];
    const ok=this.history.action(action);
    if(ok){this.lastIntervention={displayedTime,restoredTime};this.mode='live';this.accumulator=0;}
    return ok;
  }
  // Frame selection remains available for exact same-time snapshot inspection.
  scrub(frame){this.mode='paused';this.accumulator=0;this.history.seek(frame);}
  seekTime(time){const t=clamp(time,0,this.history.timeAt(this.history.end));this.history.seekTime(t);this.accumulator=Math.max(0,t-this.city.state[G.time]);}
  scrubTime(time){this.mode='paused';this.seekTime(time);}
  play(){this.mode='live';if(!this.accumulator&&this.history.cursor<this.history.end)this.history.seekTime(this.city.state[G.time]);}
  reset(){this.mode='reset';this.accumulator=0;}
}
