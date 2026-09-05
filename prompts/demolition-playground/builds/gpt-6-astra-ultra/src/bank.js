import * as THREE from 'three';

// The bank's recipe: nine load-bearing bays per level, with real masonry
// openings. Each retained fragment owns all its ornament; instances share only
// geometry, never motion. No facade is backed by an unbreakable opaque shell.
export function createBank(building, root) {
  const bank = { building, root: new THREE.Group(), nodes: [], bodies: [], batches: [] };
  bank.root.name = 'Mercantile Bank · masonry and frame';
  root.add(bank.root);
  const material = {
    stone: new THREE.MeshStandardMaterial({color:0xd9c6a3,roughness:.86}),
    limestone: new THREE.MeshStandardMaterial({color:0xf0dfbd,roughness:.72}),
    carved: new THREE.MeshStandardMaterial({color:0xf7e7ca,roughness:.67}),
    floor: new THREE.MeshStandardMaterial({color:0xa79b87,roughness:.94}),
    plaster: new THREE.MeshStandardMaterial({color:0xd9c9a8,roughness:.94}),
    bronze: new THREE.MeshStandardMaterial({color:0x665437,roughness:.38,metalness:.72}),
    glass: new THREE.MeshStandardMaterial({color:0x73a9ae,roughness:.13,metalness:.35,transparent:true,opacity:.48,depthWrite:false}),
    roof: new THREE.MeshStandardMaterial({color:0x487d78,roughness:.68,metalness:.25}),
    timber: new THREE.MeshStandardMaterial({color:0x725035,roughness:.86}),
  };
  const shapes = {
    box: new THREE.BoxGeometry(1,1,1),
    drum: new THREE.CylinderGeometry(.46,.5,1,24),
    torus: new THREE.TorusGeometry(.46,.065,6,24),
    sphere: new THREE.SphereGeometry(.5,12,8),
  };
  // Fluted shafts have true silhouette relief, not a painted stripe.
  const shaft = new THREE.CylinderGeometry(.44,.49,1,64,1);
  const sp = shaft.attributes.position;
  for(let i=0;i<sp.count;i++) {const x=sp.getX(i),z=sp.getZ(i),a=Math.atan2(z,x);const f=1-.055*(.5+.5*Math.cos(a*16));sp.setX(i,x*f);sp.setZ(i,z*f);}
  shaft.computeVertexNormals(); shapes.shaft=shaft;
  const batches = new Map();
  const box = (body,mat,x,y,z,w,h,d,ry=0,rz=0,shape='box') => {
    const key=mat+'/'+shape;
    if(!batches.has(key))batches.set(key,{material:material[mat],geometry:shapes[shape],parts:[]});
    const p={body:body.id,position:new THREE.Vector3(x-body.origin.x,y-body.origin.y,z-body.origin.z),scale:new THREE.Vector3(w,h,d),rotation:new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,rz)),shade:1-((body.id*13+batches.get(key).parts.length*7)%11)*.004};
    batches.get(key).parts.push(p);body.parts.push(p);
    // Conservative local collision bound includes projecting mouldings.
    shapes[shape].computeBoundingBox();
    const transform=new THREE.Matrix4().compose(p.position,p.rotation,p.scale);
    const bounds=shapes[shape].boundingBox.clone().applyMatrix4(transform);
    body.bounds.union(bounds);
  };
  function body(node,role,x,y,z,options={}) {
    const b={id:bank.bodies.length,node:node.id,role,origin:new THREE.Vector3(building.x+x,.23+y,building.z+z),parts:[],bounds:new THREE.Box3(),...options};
    bank.bodies.push(b);node.bodies.push(b.id);return b;
  }
  // Recipe coordinates below are bank-local; instances use world-space origins.
  const add=(b,mat,x,y,z,w,h,d,ry=0,rz=0,shape='box')=>box(b,mat,building.x+x,.23+y,building.z+z,w,h,d,ry,rz,shape);
  const W=4,D=11/3,H=4.3;
  for(let level=0;level<3;level++)for(let iz=0;iz<3;iz++)for(let ix=0;ix<3;ix++) {
    bank.nodes.push({id:bank.nodes.length,level,ix,iz,x:(ix-1)*W,z:(iz-1)*D,y:level*H,bodies:[],supports:[],neighbors:[]});
  }
  const nodeAt=(l,x,z)=>bank.nodes[l*9+z*3+x];
  for(const n of bank.nodes) {
    n.below=n.level?nodeAt(n.level-1,n.ix,n.iz).id:-1;
    for(const [dx,dz]of [[-1,0],[1,0],[0,-1],[0,1]])if(n.ix+dx>=0&&n.ix+dx<3&&n.iz+dz>=0&&n.iz+dz<3)n.neighbors.push(nodeAt(n.level,n.ix+dx,n.iz+dz).id);
    const {x,z,y,level}=n;
    // Four finite slab quarters break separately on landing; beams and floor
    // finishes belong to each quarter, so both sides remain closed surfaces.
    for(const dx of [-1,1])for(const dz of [-1,1]) {
      const xx=x+dx*.998,zz=z+dz*D/4,b=body(n,'slab',xx,y+H-.2,zz,{mass:3.4});
      add(b,'floor',xx,y+H-.23,zz,1.994,.38,D/2-.012);
      add(b,level===2?'roof':'plaster',xx,y+H-.025,zz,1.99,.03,D/2-.02);
      add(b,'bronze',xx,y+H-.48,zz,1.99,.16,.1);
      if(level<2)for(let t=0;t<3;t++)add(b,'stone',xx+(-.65+t*.65),y+H+.004,zz,.59,.025,D/2-.08);
    }
    // Independent pier cores: damage to a physical core changes its bay's
    // support capacity. Neighbour beams can bridge one missing support bay.
    for(const dx of [-1,1])for(const dz of [-1,1]) {
      const xx=x+dx*1.68,zz=z+dz*(D/2-.32);
      const b=body(n,'pier',xx,y+H/2,zz,{mass:2.5,capacity:1});n.supports.push(b.id);
      add(b,'stone',xx,y+H/2,zz,.42,H-.38,.42);
      add(b,'carved',xx,y+.32,zz,.62,.28,.62);
      add(b,'carved',xx,y+H-.47,zz,.64,.25,.64);
    }
    if(level===0) {
      const b=body(n,'foundation',x,.08,z,{fixed:true});add(b,'floor',x,.08,z,W-.014,.16,D-.014);
      // A checker floor gives demolished openings a depth cue.
      for(let a=0;a<4;a++)for(let c=0;c<4;c++)add(b,(a+c)%2?'stone':'floor',x-1.5+a,.172,z-D/2+(c+.5)*D/4,.98,.025,D/4-.016);
      if(n.iz===1) {
        const desk=body(n,'interior',x,y+.7,z,{mass:.5});
        add(desk,'timber',x,y+.7,z,2.9,1.2,.64);add(desk,'carved',x,y+1.35,z,3.1,.13,.85);
        for(const dx of [-1,0,1])add(desk,'bronze',x+dx,y+1.8,z,.04,.8,.045);
        add(desk,'bronze',x,y+2.2,z,2.9,.035,.045);
      }
    }
    // Facades are composed in a local u/v basis. Front and side openings are
    // actual voids: paired rusticated piers, sill, arch voussoirs and glazing.
    const faces=[];
    if(n.iz===2)faces.push({front:true,ox:x,oz:5.5,ux:1,uz:0,nx:0,nz:1,span:4});
    if(n.iz===0)faces.push({ox:x,oz:-5.5,ux:-1,uz:0,nx:0,nz:-1,span:4});
    if(n.ix===2)faces.push({ox:6,oz:z,ux:0,uz:-1,nx:1,nz:0,span:D});
    if(n.ix===0)faces.push({ox:-6,oz:z,ux:0,uz:1,nx:-1,nz:0,span:D});
    for(const face of faces) {
      const {ox,oz,ux,uz,nx,nz,span}=face;
      const ry=Math.atan2(nx,nz),pos=(u,v)=>[ox+u*ux+v*nx,oz+u*uz+v*nz];
      const put=(b,m,u,yy,v,w,h,d,rz=0,shape='box')=>{const [xx,zz]=pos(u,v);add(b,m,xx,yy,zz,w,h,d,ry,rz,shape);};
      const chunk=(role,u,yy,v,opts={})=>{const [xx,zz]=pos(u,v);return body(n,role,xx,yy,zz,opts);};
      const entrance=face.front&&n.ix===1&&level===0;
      const opening=entrance?2.12:level===2?1.9:1.8;
      const foot=entrance?.34:level===2?.64:.68;
      const archBase=level===2?2.15:2.44, radius=opening/2;
      // Blocks assembled in short closed fragments. Deep jamb reveals read
      // from either angle and their thickness survives fracture.
      for(const side of [-1,1]) {
        const u=side*(opening/2+(span-opening)/4);
        let previousCourse=null;
        for(let course=0;course<6;course++) {
          const b=chunk('masonry',u,y+.36+course*.59,-.13,{mass:.9});
          if(previousCourse!=null)b.restsOn=previousCourse;previousCourse=b.id;
          put(b,course%3===0?'limestone':'stone',u,y+.36+course*.59,-.13,(span-opening)/2-.028,.555,.58);
          if(course===0)put(b,'carved',u,y+.12,.04,(span-opening)/2+.05,.18,.76);
        }
      }
      if(!entrance) {
        const sill=chunk('masonry',0,y+foot/2,-.13,{mass:1.1});
        put(sill,'stone',0,y+foot/2,-.13,opening,foot-.04,.58);
        put(sill,'carved',0,y+foot,.07,opening+.23,.15,.86);
        if(level===1){put(sill,'bronze',0,y+foot+.45,.27,opening,.045,.045);for(let u=-.72;u<.8;u+=.24)put(sill,'bronze',u,y+foot+.24,.27,.034,.45,.035);}
      }
      // A tall arched window and recessed bronze joinery.
      for(let a=0;a<9;a++) {
        const angle=(a+.5)/9*Math.PI,u=Math.cos(angle)*(radius+.145),yy=y+archBase+Math.sin(angle)*(radius+.145);
        const b=chunk('arch',u,yy,-.1,{mass:.52});
        put(b,'carved',u,yy,-.1,.32,.42,.66,angle-Math.PI/2);
      }
      const keystone=chunk('arch',0,y+archBase+radius+.14,0,{mass:.55});
      put(keystone,'limestone',0,y+archBase+radius+.14,.04,.28,.55,.76);
      for(const side of [-1,1]) {
        const key='spandrel'+opening+'-'+level+'-'+side;
        if(!shapes[key]) {
          const shape=new THREE.Shape();
          const outer=radius,extent=radius,top=3.65-archBase;
          shape.moveTo(side*extent,0);shape.lineTo(side*extent,top);shape.lineTo(0,top);
          const limit=Math.asin(Math.min(1,top/outer));
          shape.lineTo(side*Math.cos(limit)*outer,top);
          for(let a=limit;a>0;a-=limit/12)shape.lineTo(side*Math.cos(a)*outer,Math.sin(a)*outer);
          shape.lineTo(side*outer,0);shape.closePath();
          shapes[key]=new THREE.ExtrudeGeometry(shape,{depth:.56,bevelEnabled:false,steps:1});
          shapes[key].translate(0,0,-.28);
        }
        const b=chunk('masonry',0,y+archBase,-.12,{mass:.8});
        put(b,'limestone',0,y+archBase,-.12,1,1,1,0,key);
      }
      const header=chunk('lintel',0,y+3.96,-.12,{mass:1.6});
      put(header,'limestone',0,y+3.96,-.12,span-.025,.62,.61);
      // Glazing consists of short panels, including a fanlight. It breaks
      // earlier than stone, revealing the floor and teller hall behind it.
      for(const side of [-1,1])for(let row=0;row<2;row++) {
        const height=(archBase-foot)/2-.04,yy=y+foot+(row+.5)*(archBase-foot)/2;
        const b=chunk('glass',side*opening/4,yy,-.31,{mass:.07});
        put(b,'glass',side*opening/4,yy,-.31,opening/2-.06,height,.035);
      }
      const frame=chunk('joinery',0,y+(archBase+foot)/2,-.32,{mass:.22});
      for(const u of [-opening/2,0,opening/2])put(frame,'bronze',u,y+(archBase+foot)/2,-.28,.052,archBase-foot,.07);
      for(const yy of [foot,(archBase+foot)/2,archBase])put(frame,'bronze',0,y+yy,-.28,opening,.055,.08);
      for(let a=0;a<9;a++) {
        const angle=(a+.5)/9*Math.PI,u=Math.cos(angle)*(radius-.06),yy=y+archBase+Math.sin(angle)*(radius-.06);
        put(frame,'bronze',u,yy,-.3,.3,.045,.05,angle-Math.PI/2);
      }
      for(const angle of [Math.PI/4,Math.PI/2,Math.PI*3/4]) {
        const u=Math.cos(angle)*radius*.47,yy=y+archBase+Math.sin(angle)*radius*.47;
        put(frame,'bronze',u,yy,-.3,.036,radius*.93,.045,angle-Math.PI/2);
      }
      if(entrance) {
        const doors=chunk('joinery',0,y+1.1,-.23,{mass:.45});
        for(const side of [-1,1]) {
          put(doors,'bronze',side*.53,y+.75,-.22,.92,.7,.1);
          put(doors,'carved',side*.12,y+1.5,-.1,.045,.4,.09);
        }
      }
      // Entablature: each bay owns three cornice stones, each with its dentils.
      for(let k=0;k<3;k++) {
        const u=(k-1)*span/3,b=chunk('cornice',u,y+H-.04,.2,{mass:1.8});
        put(b,'stone',u,y+H-.2,.16,span/3-.018,.19,.9);
        put(b,'carved',u,y+H+.005,.23,span/3+.015,.2,1.08);
        put(b,'limestone',u,y+H+.145,.21,span/3+.04,.1,1.19);
        for(let j=0;j<3;j++)put(b,'carved',u+(j-1)*span/9,y+H-.39,.45,.16,.18,.28);
      }
      if(level===2)for(let k=0;k<3;k++) {
        const u=(k-1)*span/3,b=chunk('parapet',u,y+H+.61,0,{mass:1.2});
        put(b,'stone',u,y+H+.34,0,span/3-.025,.17,.42);
        for(let j=0;j<3;j++)put(b,'carved',u+(j-1)*span/9,y+H+.62,0,.12,.49,.18);
        put(b,'limestone',u,y+H+.94,0,span/3+.012,.19,.56);
      }
      // Paired front columns frame three entrances/windows. The giant lower
      // order terminates in a distinct capital; upper floors use pilasters.
      if(face.front&&level===0)for(const side of [-1,1]) {
        const u=side*1.48;
        const base=chunk('column',u,y+.43,.73,{mass:1.4});
        put(base,'stone',u,y+.24,.73,.88,.32,.89);put(base,'carved',u,y+.47,.73,.82,.15,.82,0,'drum');
        let previousDrum=base.id;
        for(let drum=0;drum<3;drum++) {
          const b=chunk('column',u,y+.98+drum*.87,.73,{mass:1.5});
          b.restsOn=previousDrum;previousDrum=b.id;
          put(b,'limestone',u,y+.98+drum*.87,.73,.75,.855,.75,0,'shaft');
        }
        const cap=chunk('capital',u,y+3.58,.73,{mass:1.3});
        cap.restsOn=previousDrum;
        put(cap,'carved',u,y+3.38,.73,.87,.18,.87,0,'drum');
        put(cap,'carved',u,y+3.65,.73,1.02,.25,1.02);
        for(const s of [-1,1]){put(cap,'stone',u+s*.34,y+3.5,.99,.23,.22,.23,0,'sphere');}
      }
      if(face.front&&level===1)for(const side of [-1,1]) {
        const p=chunk('pilaster',side*1.49,y+2,.21,{mass:1.9});
        put(p,'limestone',side*1.49,y+2,.23,.51,3.3,.39);
        put(p,'carved',side*1.49,y+3.65,.28,.78,.28,.59);
      }
    }
  }
  // A central broken-pitch pediment and copper hipped lantern distinguish the
  // silhouette. All segments are physical parts owned by the roof's front bay.
  const top=nodeAt(2,1,2);
  for(let i=-3;i<=3;i++) {
    const b=body(top,'pediment',i*.62,13.85,5.64,{mass:1.6});
    const h=1.52-Math.abs(i)*.35;
    add(b,'limestone',i*.62,13.57+h/2,5.64,.615,h,.5);
    add(b,'carved',i*.62,13.64+h,5.68,.74,.19,.79,0,(i<0?1:i>0?-1:0)*.48);
  }
  const medallion=body(top,'pediment',0,14.08,5.95,{mass:.8});
  add(medallion,'bronze',0,14.08,5.96,.67,.67,.12,0,0,'sphere');
  for(let step=0;step<3;step++) {
    const b=body(nodeAt(0,1,2),'foundation',0,.06+step*.12,6.35-step*.25,{fixed:true});
    add(b,'stone',0,.06+step*.12,6.35-step*.25,4.5-step*.35,.16,1.55-step*.27);
  }
  const roofNode=nodeAt(2,1,1);
  for(const side of [-1,1]) {
    const b=body(roofNode,'roof',side*.73,13.7,0,{mass:1});
    add(b,'roof',side*.73,13.63,0,1.7,.16,3.1,0,-side*.35);
    add(b,'bronze',side*1.5,13.32,0,.065,.16,3.16);
  }
  // Inscription is attached to its own stone, not left floating after collapse.
  if(typeof document!=='undefined') {
    const c=document.createElement('canvas');c.width=1024;c.height=128;
    const ctx=c.getContext('2d');ctx.fillStyle='#e1ceab';ctx.fillRect(0,0,1024,128);
    ctx.fillStyle='#665537';ctx.font='54px Georgia';ctx.textAlign='center';ctx.fillText('M E R C A N T I L E',512,65);ctx.font='22px Georgia';ctx.fillText('B A N K   •   E S T .  1 8 9 2',512,105);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    material.inscription=new THREE.MeshStandardMaterial({map:texture,roughness:.86});
    const b=body(nodeAt(0,1,2),'inscription',0,3.95,6.32,{mass:1.6});
    add(b,'inscription',0,3.95,6.32,3.95,.48,.12);
  }
  for(const b of bank.bodies){b.size=b.bounds.getSize(new THREE.Vector3());b.localCenter=b.bounds.getCenter(new THREE.Vector3());}
  for(const [key,b]of batches) {
    const mesh=new THREE.InstancedMesh(b.geometry,b.material,b.parts.length);
    mesh.name='Bank '+key;mesh.castShadow=!key.startsWith('glass');mesh.receiveShadow=true;mesh.frustumCulled=false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.userData.bank=bank;mesh.userData.bodyIds=b.parts.map(p=>p.body);
    const color=new THREE.Color();b.parts.forEach((p,i)=>mesh.setColorAt(i,color.setRGB(p.shade,p.shade,p.shade)));
    bank.root.add(mesh);bank.batches.push({...b,mesh});
  }
  // Existing storey handles are retained for tool selection and district API,
  // but contain no old facade or slab geometry behind the new construction.
  for(let i=0;i<3;i++) {
    const group=new THREE.Group();group.position.set(building.x,.23+i*H,building.z);root.add(group);
    building.floors.push({group,y:.23+i*H,height:H,index:i,columns:[],pieces:[]});
  }
  building.bank=bank;
  return bank;
}
