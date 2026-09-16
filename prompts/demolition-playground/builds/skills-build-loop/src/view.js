import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { G,N,P,T,MATERIAL } from './world.js';
const hash=n=>{let x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);};
const v3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const temp=new THREE.Object3D(),worldMatrix=new THREE.Matrix4(),quat=new THREE.Quaternion(),euler=new THREE.Euler();

export class View {
  constructor(canvas,city){
    this.city=city;this.plan=city.plan;this.canvas=canvas;this.quality='high';this.actionCamera=false;this.batches=new Map();this.parts=[];this.labels=[];
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#bfdce0');this.scene.fog=new THREE.Fog('#d2e2dc',115,245);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    this.camera=new THREE.PerspectiveCamera(42,1,.2,550);this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.maxPolarAngle=Math.PI*.49;this.controls.minDistance=6;this.controls.maxDistance=180;this.controls.target.set(0,12,0);this.resetView();
    this.scene.add(new THREE.HemisphereLight(0xe3f7ff,0xb39f76,2.25));
    const sun=new THREE.DirectionalLight(0xffe1a3,3.6);sun.position.set(-45,85,38);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:210});sun.shadow.bias=-.0006;sun.shadow.normalBias=.1;this.scene.add(sun);this.sun=sun;
    this.geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(.5,.5,1,12),sphere:new THREE.IcosahedronGeometry(.5,1),cone:new THREE.ConeGeometry(.5,1,12),shard:new THREE.TetrahedronGeometry(.5),plane:new THREE.PlaneGeometry(1,1)};
    for(let k=0;k<4;k++){const corners=[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]];const a=corners[k],b=corners[(k+1)%4];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,...a,...b],3));g.computeVertexNormals();this.geometries['pane'+k]=g;}
    const pedimentShape=new THREE.Shape();pedimentShape.moveTo(-.5,0);pedimentShape.lineTo(.5,0);pedimentShape.lineTo(0,.5);pedimentShape.closePath();this.geometries.pediment=new THREE.ExtrudeGeometry(pedimentShape,{depth:.5,bevelEnabled:false});
    const colors={stone:0xe0c996,trim:0xf6e4ba,brick:0xb55e41,brick2:0xcc7452,brick3:0x8f4736,mortar:0xd29d75,glass:0x58a9b9,glassLight:0x9cd7d5,glassDark:0x266a7f,frame:0x355d62,metal:0x426269,black:0x27383c,roof:0x637272,concrete:0xc7c7b1,white:0xf5ecd0,yellow:0xf7ba42,orange:0xdc7641,road:0x677b7b,sidewalk:0xcbcbbb,green:0x68904e,green2:0x8fac56,green3:0x427a5a,wood:0x886041,water:0x73d0e4,red:0xc9513e};
    this.materials={};for(const [k,color] of Object.entries(colors)){this.materials[k]=new THREE.MeshStandardMaterial({color,roughness:k.startsWith('glass')?.19:.85,metalness:k.startsWith('glass')?.55:k==='metal'?.5:.03});}
    for(const key of ['glass','glassLight','glassDark'])this.materials[key].side=THREE.DoubleSide;
    this.materials.beacon=new THREE.MeshStandardMaterial({color:0xffa42e,emissive:0xff7808,emissiveIntensity:1});
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),new THREE.MeshStandardMaterial({color:0xc5d4bd,roughness:1})).rotateX(-Math.PI/2));
    this.ground();
    for(const p of city.architecture.parts){const item=this.add(p.material,p.x,p.y,p.z,p.sx,p.sy,p.sz,p);item.fracture=p.fracture;item.shard=p.shard;item.column=p.column;}
    for(const l of city.architecture.labels)this.label(l.text,this.plan.nodes[l.node],l.x,l.y,l.z,l.w,l.h,l.color,l.bg);
    this.waterNode=this.plan.nodes.find(n=>n.water);
    this.staticDetails();this.flush();this.streetObjects();this.crane();this.people();this.particles();this.targets();
    this.resize();window.addEventListener('resize',()=>this.resize());
    this.render(0);
  }
  add(material,x,y,z,sx,sy,sz,{owner=-1,geo='box',rx=0,ry=0,rz=0,facade=false,detail=false}={}){
    const key=material+'|'+geo;if(!this.batches.has(key))this.batches.set(key,{material,geo,items:[]});
    const p={x,y,z,sx,sy,sz,rx,ry,rz,owner,facade,detail,id:this.parts.length};this.parts.push(p);this.batches.get(key).items.push(p);return p;
  }
  owned(n,material,x,y,z,sx,sy,sz,opts={}){return this.add(material,x,y,z,sx,sy,sz,{...opts,owner:n.id});}
  flush(){
    for(const b of this.batches.values()){
      b.mesh=new THREE.InstancedMesh(this.geometries[b.geo],this.materials[b.material],b.items.length);b.mesh.castShadow=true;b.mesh.receiveShadow=true;b.mesh.frustumCulled=false;b.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.scene.add(b.mesh);
      b.items.forEach((p,i)=>{temp.position.set(p.x,p.y,p.z);temp.rotation.set(p.rx,p.ry,p.rz);temp.scale.set(p.sx,p.sy,p.sz);temp.updateMatrix();p.local=temp.matrix.clone();p.index=i;});
    }
  }
  ground(){
    this.add('road',0,.05,0,91,.10,78);this.add('stone',0,-.55,0,93,1.1,80);
    for(const b of this.plan.buildings){this.add('sidewalk',b.x,.18,b.z,b.nx*b.bay+2.7,.25,b.nz*b.bay+2.7);}
    // Road paint, drains, paving joints, pedestrian crossings.
    for(let z=-36;z<38;z+=5){this.add('yellow',1,.116,z,.12,.02,2.4);this.add('yellow',1.35,.116,z,.12,.02,2.4);}
    for(let x=-44;x<45;x+=5){this.add('white',x,.116,5.5,2.1,.02,.13);}
    for(const z of [7,-3,29,-29])for(let x=-4;x<5;x+=1.25)this.add('white',x,.125,z,.65,.025,2);
    for(let x=-43;x<44;x+=3)for(const z of [-36,35])this.add('trim',x,.25,z,2.96,.14,1.8);
    for(let z=-34;z<=34;z+=3)for(const x of [-44,44])this.add('trim',x,.25,z,1.8,.14,2.96);
    for(let i=0;i<16;i++){const x=i%2?5:-6,z=Math.floor(i/2)*9-30;this.add('black',x,.23,z,.55,.03,.8);for(let j=0;j<5;j++)this.add('metal',x,.255,z-.32+j*.15,.5,.02,.035);}
  }

  label(text,node,x,y,z,w,h,color,bg){
    const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,128);ctx.fillStyle=color;ctx.font='600 45px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,65);
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,roughness:.9}));this.scene.add(mesh);this.labels.push({mesh,node:node.id,x,y,z});
  }
  staticDetails(){
    // Site boundary, striped barriers, lamps, benches, bins and an occupied spectator rail.
    for(let x=-43;x<44;x+=3.6)for(const z of [-37,37]){
      this.add('white',x,.8,z,3.1,1.2,.65);for(let j=0;j<4;j++)this.add('orange',x-1.1+j*.7,.82,z+.335,.35,.75,.04,{rz:-.4});
      this.add('beacon',x,1.55,z,.18,.20,.18,{geo:'sphere'});
    }
    for(let z=-33;z<36;z+=4)for(const x of [-45,45]){
      this.add('metal',x,1,z,.09,2,.09);this.add('metal',x,1.8,z+1.9,.05,.06,4);this.add('metal',x,.55,z+1.9,.05,.05,4);
      for(let j=0;j<8;j++)this.add('metal',x,1.1,z+j*.5,.025,1.4,.025,{detail:true});
    }
    for(let z=-29;z<35;z+=13)for(const x of [-5.4,5.7]){
      this.add('metal',x,3,z,.12,6,.12);this.add('metal',x+.6,5.9,z,1.4,.10,.12);this.add('white',x+1.15,5.82,z,.6,.12,.3);
      this.add('black',x,.45,z,.35,.65,.35);
    }
    for(let x=-37;x<38;x+=12){
      this.add('wood',x,.65,31,2.1,.15,.65);this.add('wood',x,1.13,31.25,2.1,.75,.12);for(const dx of [-.7,.7])this.add('metal',x+dx,.4,31,.07,.5,.55);
      this.add('metal',x+3,.65,31,.65,1.1,.65,{geo:'cylinder'});
    }
    // Rooftop billboard and small aerials are attached to structural members.
    const n=this.plan.nodes[this.plan.buildings[4].nodes.at(-1)];for(const x of [-2.5,2.5])this.owned(n,'metal',x,2,0,.1,4,.15);
    this.owned(n,'orange',0,3,0,6,2.3,.16);this.label('MAKE SOME ROOM.',n,0,3,.1,5.8,1.9,'#fff0cf','#c65b39');
    for(const b of this.plan.buildings){const n=this.plan.nodes[b.nodes.at(-1)];this.owned(n,'metal',0,2.6,0,.04,5,.04);for(let j=0;j<3;j++)this.owned(n,'metal',0,3+j*.4,0,1.5-j*.3,.04,.04);}
  }
  streetObjects(){
    this.objects=[];
    for(const o of this.plan.objects){const g=new THREE.Group();g.position.set(o.x,.35,o.z);g.rotation.y=o.angle||0;
      const mesh=(geo,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(this.geometries[geo],mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
      if(o.kind==='car'){
        const paint=new THREE.MeshStandardMaterial({color:o.color,roughness:.3,metalness:.3});mesh('box',paint,0,.5,0,1.5,.5,3.1);mesh('box',paint,0,.95,-.15,1.32,.65,1.7);mesh('box',this.materials.glassDark,0,1.04,-.16,1.35,.38,1.42);
        mesh('box',this.materials.white,0,.52,1.57,1.17,.16,.04);mesh('box',this.materials.red,0,.54,-1.57,1.17,.13,.04);
        for(const x of [-.76,.76])for(const z of [-1,1]){const m=mesh('cylinder',this.materials.black,x,.34,z,.53,.17,.53);m.rotation.z=Math.PI/2;}
      }else{
        mesh('cylinder',this.materials.wood,0,1.2,0,.28,2.5,.28);
        for(let i=0;i<7;i++)mesh('sphere',this.materials[['green','green2','green3'][i%3]],Math.cos(i*2.4)*.7,2.5+hash(i+o.x)*1.4,Math.sin(i*2.4)*.7,2.2,2.1,2.2);
        mesh('box',this.materials.stone,0,.06,0,1.8,.12,1.8);
      }
      this.scene.add(g);this.objects.push(g);
    }
  }
  crane(){
    const group=new THREE.Group();this.scene.add(group);this.craneGroup=group;
    const beam=(a,b,r=.13,mat='yellow',parent=group)=>{const d=b.clone().sub(a),m=new THREE.Mesh(this.geometries.cylinder,this.materials[mat]);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(v3(0,1,0),d.normalize());m.castShadow=true;parent.add(m);return m;};
    for(const x of [-5,-3])for(const z of [33,35])beam(v3(x,0,z),v3(x,45,z),.25);
    for(let y=1;y<45;y+=3){for(const z of [33,35]){beam(v3(-5,y,z),v3(-3,y+3,z),.12);beam(v3(-3,y,z),v3(-5,y+3,z),.12);}for(const x of [-5,-3])beam(v3(x,y,33),v3(x,y+3,35),.12);}
    this.jib=new THREE.Group();this.jib.position.set(-4,45,34);group.add(this.jib);
    for(let x=-9;x<29;x+=3){for(const z of [-.65,.65]){beam(v3(x,0,z),v3(x+3,0,z),.18,'yellow',this.jib);beam(v3(x,0,z),v3(x+1.5,2,0),.12,'yellow',this.jib);beam(v3(x+1.5,2,0),v3(x+3,0,z),.12,'yellow',this.jib);}beam(v3(x,0,-.65),v3(x,0,.65),.1,'yellow',this.jib);}
    const cab=new THREE.Mesh(this.geometries.box,this.materials.glassDark);cab.position.set(2,-1,.8);cab.scale.set(3,2.4,2.1);this.jib.add(cab);
    const weight=new THREE.Mesh(this.geometries.box,this.materials.concrete);weight.position.set(-8,-.5,0);weight.scale.set(4,2.5,3);this.jib.add(weight);
    const base=new THREE.Mesh(this.geometries.box,this.materials.yellow);base.position.set(-4,.7,34);base.scale.set(6,1.4,6);group.add(base);
    this.ball=new THREE.Mesh(new THREE.SphereGeometry(1.8,28,20),new THREE.MeshStandardMaterial({color:0x33464a,roughness:.36,metalness:.82}));this.ball.castShadow=true;group.add(this.ball);
    this.ballRing=new THREE.Mesh(new THREE.TorusGeometry(2.02,.035,6,64),new THREE.MeshBasicMaterial({color:0xffe7a7,transparent:true,opacity:.8}));group.add(this.ballRing);
    this.cable=new THREE.Line(new THREE.BufferGeometry().setFromPoints([v3(),v3()]),new THREE.LineBasicMaterial({color:0x263e42}));group.add(this.cable);
    this.dragLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([v3(),v3()]),new THREE.LineBasicMaterial({color:0xffbc55}));this.dragLine.visible=false;group.add(this.dragLine);
    this.waterGroup=new THREE.Group();this.waterSupports=new THREE.Group();this.scene.add(this.waterGroup,this.waterSupports);
    const wm=(geo,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(this.geometries[geo],this.materials[mat]);m.position.set(x,y-3,z);m.scale.set(sx,sy,sz);m.castShadow=true;this.waterGroup.add(m);return m;};
    for(const x of [-1.2,1.2])for(const z of [-1.2,1.2]){const m=wm('box','metal',x,1,z,.12,2,.12);this.waterSupports.add(m);m.position.y+=3;}
    this.tankSolid=wm('cylinder','wood',0,3,0,3.8,3.1,3.8);
    const shellMaterial=this.materials.wood.clone();shellMaterial.side=THREE.DoubleSide;this.tankWreck=new THREE.Mesh(new THREE.CylinderGeometry(1.9,1.9,3.1,24,1,true,.7,Math.PI*1.5),shellMaterial);this.tankWreck.castShadow=true;this.waterGroup.add(this.tankWreck);wm('cone','roof',0,5,0,4.2,1.1,4.2);
    for(const y of [1.65,2.35,3.6,4.45]){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.935,.05,5,32),this.materials.metal);ring.rotation.x=Math.PI/2;ring.position.y=y-3;this.waterGroup.add(ring);}
    for(let a=0;a<24;a++){const th=a/24*Math.PI*2;wm('box','stone',Math.cos(th)*1.905,3,Math.sin(th)*1.905,.025,2.9,.025);}
  }
  people(){
    this.spectators=[];this.pigeons=[];this.lights=[];
    for(let i=0;i<22;i++){
      const g=new THREE.Group();g.position.set(-36+i*3.2,.35,40+(i%2)*1.2);
      const add=(geo,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(this.geometries[geo],this.materials[mat]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;};
      add('box',i%2?'yellow':'orange',0,.9,0,.42,.65,.3);add('sphere','stone',0,1.44,0,.37,.4,.36);add('sphere','yellow',0,1.61,0,.47,.23,.46);
      for(const x of [-.12,.12])add('box','black',x,.36,0,.15,.65,.17);
      const arm=add('box','stone',.32,1.1,0,.14,.55,.14);const phone=add('box','black',.32,1.35,.03,.15,.22,.06);this.spectators.push({group:g,arm,phone,phase:i});
      this.scene.add(g);
    }
    for(let i=0;i<25;i++){const b=this.plan.buildings[i%7],n=this.plan.nodes[b.nodes.at(-1)];const m=new THREE.Mesh(new THREE.ConeGeometry(.15,.5,4),this.materials.white);m.userData={x:n.x+hash(i)*2,y:n.y+.9,z:n.z+hash(i+9)*2};this.scene.add(m);this.pigeons.push(m);}
  }
  particles(){
    this.debrisMeshes=[];
    for(let kind=0;kind<7;kind++){
      const mat=[this.materials.brick2,this.materials.stone,this.materials.glassLight,this.materials.metal,this.materials.concrete,this.materials.wood,this.materials.water][kind];
      const mesh=new THREE.InstancedMesh(kind===2?this.geometries.shard:this.geometries.box,mat,this.city.capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=kind<6;this.scene.add(mesh);this.debrisMeshes[kind]=mesh;
    }
    const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},vertexShader:`
      attribute float opacity; varying vec2 vUv; varying float vOpacity;
      void main(){vUv=uv;vOpacity=opacity;vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);vec2 size=vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));center.xy+=position.xy*size;gl_Position=projectionMatrix*center;}`,
      fragmentShader:`precision highp float; varying vec2 vUv; varying float vOpacity;uniform float uTime;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      void main(){vec2 uv=vUv-.5;float radial=1.-smoothstep(.17,.5,length(uv));float cloud=noise(vUv*7.+uTime*.14)*.55+noise(vUv*15.-uTime*.1)*.3+.15;float a=radial*cloud*vOpacity;gl_FragColor=vec4(mix(vec3(.69,.53,.32),vec3(1.,.87,.62),vUv.y),a);}`});
    const geo=this.geometries.plane.clone();this.dustOpacity=new THREE.InstancedBufferAttribute(new Float32Array(this.city.capacity),1);geo.setAttribute('opacity',this.dustOpacity);
    this.dust=new THREE.InstancedMesh(geo,dustMat,this.city.capacity);this.dust.frustumCulled=false;this.scene.add(this.dust);
    this.farDebris=new THREE.InstancedMesh(this.geometries.plane,this.materials.brick,this.city.capacity);this.farDebris.frustumCulled=false;this.scene.add(this.farDebris);
  }
  targets(){
    this.targetGroup=new THREE.Group();this.scene.add(this.targetGroup);this.markers=[];
    const geo=new THREE.TorusGeometry(.27,.055,5,16);const mat=new THREE.MeshBasicMaterial({color:0xffd478,depthTest:false});
    for(const n of this.plan.nodes){const m=new THREE.Mesh(geo,mat);m.userData.node=n.id;m.renderOrder=5;this.targetGroup.add(m);this.markers.push(m);}
    this.targetGroup.visible=false;
    this.cracks=new THREE.InstancedMesh(this.geometries.box,this.materials.black,this.plan.nodes.length*4);this.cracks.frustumCulled=false;this.scene.add(this.cracks);
    this.charges=[];for(let i=0;i<6;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.3,.6,.3),new THREE.MeshStandardMaterial({color:0xf25439,emissive:0x7a190b,emissiveIntensity:.7}));m.visible=false;this.scene.add(m);this.charges.push(m);}
  }
  targetPosition(id){const n=this.plan.nodes[id],s=this.presentedState||this.city.state,o=this.city.no(id);return v3(s[o]-n.sx*.40,s[o+1]-n.h*.57,s[o+2]+n.sz*.51+.15);}
  pick(x,y,tool){const rect=this.canvas.getBoundingClientRect();const r=new THREE.Raycaster();r.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),this.camera);
    if(tool==='ball')return r.intersectObject(this.ball).length?'ball':null;
    const hits=this.markers.filter(m=>m.visible&&r.ray.direction.dot(m.position.clone().sub(r.ray.origin))>0&&r.ray.distanceSqToPoint(m.position)<.49).sort((a,b)=>r.ray.origin.distanceToSquared(a.position)-r.ray.origin.distanceToSquared(b.position));return hits.length?hits[0].userData.node:null;
  }
  setQuality(q){this.quality=q;this.renderer.setPixelRatio(Math.min(devicePixelRatio,q==='high'?2:q==='medium'?1.5:1));this.sun.shadow.mapSize.set(q==='low'?1024:2048,q==='low'?1024:2048);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.resize();}
  resetView(){const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.camera.position.set(82,66,96);this.controls.target.set(-1,12,0);this.controls.update();this.controls.enableDamping=damping;}
  resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  project(point){const p=point.clone().project(this.camera);return {x:(p.x*.5+.5)*innerWidth,y:(-.5*p.y+.5)*innerHeight};}
  render(wallDt,s=this.city.state){
    this.presentedState=s;const t=s[G.time],near=this.quality==='low'?70:100;
    this.nodeMatrices=this.nodeMatrices||this.plan.nodes.map(()=>new THREE.Matrix4());
    for(const n of this.plan.nodes){const o=this.city.no(n.id);quat.setFromEuler(euler.set(s[o+6],s[o+7],s[o+8]));this.nodeMatrices[n.id].compose(v3(s[o],s[o+1],s[o+2]),quat,v3(1,1,1));}
    const facadeGroups=this.plan.nodes.map(()=>[]);for(let i=0;i<this.city.capacity;i++){const o=this.city.po(i);if(s[o+P.active]&&s[o+P.owner])facadeGroups[s[o+P.owner]-1][s[o+P.ordinal]]=o;}
    for(const b of this.batches.values()){
      for(const p of b.items){
        if(p.owner<0){b.mesh.setMatrixAt(p.index,p.local);continue;}
        const o=this.city.no(p.owner),n=this.plan.nodes[p.owner];let destroyed=p.facade&&s[o+N.shell]===2&&(!p.column||s[o+N.mode]>0);
        if(destroyed){
          const q=facadeGroups[p.owner][p.fracture],g=this.city.fractures.group(p.owner,p.fracture);
          if(q===undefined||!g){worldMatrix.multiplyMatrices(this.nodeMatrices[p.owner],p.local);b.mesh.setMatrixAt(p.index,worldMatrix);continue;}
          const groupQ=quat.setFromEuler(euler.set(s[q+P.rx],s[q+P.ry],s[q+P.rz]));
          temp.position.set(p.x-g.center[0],p.y-g.center[1],p.z-g.center[2]).applyQuaternion(groupQ).add(v3(s[q],s[q+1],s[q+2]));
          temp.quaternion.copy(groupQ).multiply(new THREE.Quaternion().setFromEuler(euler.set(p.rx,p.ry,p.rz)));
          temp.scale.set(p.sx,p.sy,p.sz);if(p.shard)temp.scale.multiplyScalar(.78);
          if(p.detail&&this.quality==='low'&&p.id%2)temp.scale.setScalar(0);
          temp.updateMatrix();b.mesh.setMatrixAt(p.index,temp.matrix);
        }else{
          worldMatrix.multiplyMatrices(this.nodeMatrices[p.owner],p.local);

          if(p.detail&&this.quality==='low'&&this.camera.position.distanceTo(v3(n.x,n.y,n.z))>near&&p.id%2)worldMatrix.scale(v3(0,0,0));
          b.mesh.setMatrixAt(p.index,worldMatrix);
        }
      }b.mesh.instanceMatrix.needsUpdate=true;
    }
    for(const l of this.labels){l.mesh.matrixAutoUpdate=false;temp.position.set(l.x,l.y,l.z);temp.rotation.set(0,0,0);temp.scale.set(1,1,1);temp.updateMatrix();l.mesh.matrix.multiplyMatrices(this.nodeMatrices[l.node],temp.matrix);}
    for(let i=0;i<this.objects.length;i++){const g=this.objects[i],o=this.city.objectBase+i*4,ob=this.plan.objects[i];g.scale.y=s[o]?(ob.kind==='car'?.28:1):1;if(ob.kind==='tree'){g.rotation.z=s[o]?1.25:0;g.rotation.y=s[o]?s[o+2]:0;}}
    this.materials.beacon.emissiveIntensity=.4+Math.sin(t*5)**2*2;
    this.jib.rotation.y=-s[G.angle];this.ball.position.set(s[G.bx],s[G.by],s[G.bz]);this.ballRing.position.copy(this.ball.position);this.ballRing.quaternion.copy(this.camera.quaternion);this.ballRing.material.opacity=.35+.35*Math.sin(t*3)**2;
    const cable=this.cable.geometry.attributes.position,tip=[-4+Math.cos(s[G.angle])*29,48,34+Math.sin(s[G.angle])*29];cable.setXYZ(0,...tip);cable.setXYZ(1,s[G.bx],s[G.by]+1.4,s[G.bz]);cable.needsUpdate=true;
    if(this.waterNode){const q=this.city.tankBase;this.waterGroup.position.set(s[q],s[q+1],s[q+2]);this.waterGroup.rotation.set(s[q+6],s[q+7],s[q+8]);this.tankSolid.visible=!s[q+T.ruptured];this.tankWreck.visible=!!s[q+T.ruptured];this.waterSupports.matrixAutoUpdate=false;this.waterSupports.matrix.copy(this.nodeMatrices[this.waterNode.id]);}
    for(const a of this.spectators){const dt=t-s[G.lastImpact],cheer=t-s[G.cheer];a.group.scale.y=dt>=0&&dt<.7?.7:1;a.arm.rotation.z=cheer>=0&&cheer<3?-.9+Math.sin(t*7+a.phase)*.3:0;a.phone.position.y=1.35+(cheer>=0&&cheer<3?.4+Math.sin(t*7+a.phase)*.08:0);}
    for(let i=0;i<this.pigeons.length;i++){const m=this.pigeons[i],p=m.userData,age=s[G.pigeon]<0?0:t-s[G.pigeon];m.visible=age<12;m.position.set(p.x+age*(2+hash(i)*3),p.y+age*3,p.z-age*(3+hash(i+8)*3));m.rotation.z=age?Math.sin(t*22+i)*.7:0;}
    const counts=Array(7).fill(0);let dust=0,far=0;
    for(let i=0;i<this.city.capacity;i++){const o=this.city.po(i);if(!s[o+P.active]||s[o+P.owner])continue;const kind=s[o+P.kind],size=s[o+P.size],age=s[o+P.age];
      temp.position.set(s[o],s[o+1],s[o+2]);temp.rotation.set(s[o+6],s[o+7],s[o+8]);
      if(kind===7){if(this.quality==='low'&&i%2)continue;const scale=size*(1+age*.8);temp.scale.set(scale*2,scale*1.8,scale);temp.updateMatrix();this.dust.setMatrixAt(dust,temp.matrix);this.dustOpacity.setX(dust,Math.max(0,1-age/s[o+P.life])*.38);dust++;}
      else{
        if(kind<6&&this.quality==='low'&&i%3)continue;
        temp.scale.set(size*(kind===3?2:1),size*(kind===2?.15:kind===3?.14:.7),size);
        const isFar=kind<6&&this.camera.position.distanceTo(temp.position)>near;
        if(isFar){temp.quaternion.copy(this.camera.quaternion);temp.updateMatrix();this.farDebris.setMatrixAt(far++,temp.matrix);}
        else{temp.updateMatrix();this.debrisMeshes[kind].setMatrixAt(counts[kind]++,temp.matrix);}
      }
    }
    for(let k=0;k<7;k++){this.debrisMeshes[k].count=counts[k];this.debrisMeshes[k].instanceMatrix.needsUpdate=true;}
    this.dust.count=dust;this.dust.instanceMatrix.needsUpdate=true;this.dustOpacity.needsUpdate=true;this.dust.material.uniforms.uTime.value=t;
    this.farDebris.count=far;this.farDebris.instanceMatrix.needsUpdate=true;
    let crackCount=0;for(const n of this.plan.nodes){const o=this.city.no(n.id);if(s[o+N.mode]===0&&(s[o+N.hp]<.98||s[o+N.fatigue]>.12)&&s[o+N.shell]<2){for(let j=0;j<4;j++){temp.position.copy(this.targetPosition(n.id));temp.position.x+=j*.22;temp.position.y+=j*.25;temp.rotation.set(0,0,j%2?.7:-.65);temp.scale.set(.025,.43,.035);temp.updateMatrix();this.cracks.setMatrixAt(crackCount++,temp.matrix);}}}this.cracks.count=crackCount;this.cracks.instanceMatrix.needsUpdate=true;
    for(const n of this.plan.nodes){const m=this.markers[n.id],o=this.city.no(n.id);m.visible=s[o+N.mode]===0;m.position.copy(this.targetPosition(n.id));m.quaternion.copy(this.camera.quaternion);}
    for(let i=0;i<6;i++){const o=this.city.chargeBase+i*4,m=this.charges[i];m.visible=s[o]===1;if(m.visible)m.position.copy(this.targetPosition(s[o+1]));}
    if(this.actionCamera&&t-s[G.lastImpact]<4){const target=v3(s[G.focusX],Math.max(2,s[G.focusY]),s[G.focusZ]);this.controls.target.lerp(target,1-Math.exp(-wallDt*2));const desired=target.clone().add(v3(35,24,39));this.camera.position.lerp(desired,1-Math.exp(-wallDt*.6));}
    this.controls.update();this.renderer.render(this.scene,this.camera);
  }
}
