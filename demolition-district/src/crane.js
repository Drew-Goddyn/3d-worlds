import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const v = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
export class Crane {
  constructor(scene) {
    this.base = new THREE.Vector3(28, 0, 16);
    this.yaw = -2.72; this.goalYaw = this.yaw;
    this.reach = 30; this.goalReach = 30;
    this.length = 27; this.goalLength = 27;
    this.time = 0; this.cooldown = 0; this.aimTime = 0;
    this.ballPosition = new THREE.Vector3(); this.velocity = new THREE.Vector3(.8,0,.4);
    this.anchor = new THREE.Vector3(); this.aim = new THREE.Vector3();
    this.root = new THREE.Group(); scene.add(this.root);
    this.root.position.copy(this.base);
    this.upper = new THREE.Group(); this.root.add(this.upper);
    const yellow = new THREE.MeshStandardMaterial({ color: 0xe9aa26, roughness: .59, metalness:.28 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x303a38, roughness: .77, metalness:.45 });
    const steel = new THREE.MeshStandardMaterial({color:0x667271,roughness:.55,metalness:.7});
    const glass = new THREE.MeshStandardMaterial({color:0x5c9d9e,roughness:.19,metalness:.6});
    const box = (parent,x,y,z,w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; };
    for (const z of [-2.8,2.8]) {
      box(this.root,0,1,z,9,1.8,1.7,dark);
      for(let x=-3.8;x<4;x+=.65) box(this.root,x,1.87,z,.24,.12,1.8,steel);
      for(let x=-3.3;x<4;x+=1.25) {
        const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,1.78,12),steel);wheel.rotation.x=Math.PI/2;wheel.position.set(x,1,z);this.root.add(wheel);
      }
    }
    box(this.root,0,2,0,7,1,5.6,yellow);
    box(this.upper,0,3,0,5.5,1.8,5.6,yellow);
    box(this.upper,-3.2,4,1.5,2.4,3,2.4,yellow);
    box(this.upper,-3.25,4.5,2.73,2.05,1.8,.05,glass);
    box(this.upper,-4.42,4.5,1.55,.05,1.8,2,glass);
    box(this.upper,-2.6,3.6,-2.1,4.5,1.8,1.2,dark);
    for(let i=0;i<7;i++) box(this.upper,-4.6+i*.6,3.65,-2.73,.13,1.25,.04,steel);
    this.boom = new THREE.Group(); this.upper.add(this.boom);
    this.boomMembers=[];
    const strut=(r)=>{const m=new THREE.Object3D();m.scale.set(r,1,r);this.boomMembers.push(m);return m;};
    for(let i=0;i<4+20*4;i++)strut(i<4?.15:.065);
    this.boomBatch=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,6),yellow,this.boomMembers.length);this.boomBatch.castShadow=true;this.boomBatch.frustumCulled=false;this.boom.add(this.boomBatch);
    this.supportWires = [];
    for(let i=0;i<2;i++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.033,.033,1,5),dark);this.upper.add(m);this.supportWires.push(m);}
    this.cable = new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,1,7),dark);scene.add(this.cable);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(1.7,28,20),new THREE.MeshStandardMaterial({color:0x394543,roughness:.38,metalness:.82}));this.ball.castShadow=true;scene.add(this.ball);
    const seam=new THREE.Mesh(new THREE.TorusGeometry(1.7,.035,5,40),steel);seam.rotation.x=Math.PI/2;this.ball.add(seam);
    this.halo=new THREE.Mesh(new THREE.TorusGeometry(2.15,.032,5,64),new THREE.MeshBasicMaterial({color:0xf6bd46,transparent:true,opacity:.7,depthWrite:false}));this.ball.add(this.halo);
    this.hook = new THREE.Mesh(new THREE.TorusGeometry(.3,.085,8,14),yellow);this.hook.position.y=1.8;this.ball.add(this.hook);
    // The fixed chassis and cab retain every tread, window and grille in a few batches.
    for(const parent of [this.root,this.upper]){
      const batches=new Map();
      for(const mesh of [...parent.children]){
        if(!mesh.isMesh||this.supportWires.includes(mesh))continue;
        mesh.updateMatrix();const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrix);
        if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(geometry);parent.remove(mesh);mesh.geometry.dispose();
      }
      for(const [material,geometries] of batches){const mesh=new THREE.Mesh(mergeGeometries(geometries),material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);geometries.forEach(g=>g.dispose());}
    }
    this.updateAnchor();this.ballPosition.copy(this.anchor).add(new THREE.Vector3(1,-this.length,0));
    this.initial=this.capture();this.render();
  }
  updateAnchor(){this.anchor.set(this.base.x+Math.cos(this.yaw)*this.reach,42,this.base.z+Math.sin(this.yaw)*this.reach);}
  aimAt(point){
    this.aim.copy(point);this.aim.y=THREE.MathUtils.clamp(point.y,3,32);
    this.goalYaw=Math.atan2(point.z-this.base.z,point.x-this.base.x);
    this.goalReach=THREE.MathUtils.clamp(Math.hypot(point.x-this.base.x,point.z-this.base.z)+2,14,51);
    this.goalLength=THREE.MathUtils.clamp(42-this.aim.y,9,39);
    this.aimTime=4.5;
    const impulse=point.clone().sub(this.ballPosition);impulse.y=0;impulse.normalize().multiplyScalar(21);
    this.velocity.add(impulse);
  }
  control(action,dt){
    if(action==='left')this.goalYaw-=dt*.58;
    if(action==='right')this.goalYaw+=dt*.58;
    if(action==='up')this.goalLength= Math.max(8,this.goalLength-dt*8);
    if(action==='down')this.goalLength= Math.min(39,this.goalLength+dt*8);
    if(action==='swing')this.velocity.add(new THREE.Vector3(-Math.sin(this.yaw),0,Math.cos(this.yaw)).multiplyScalar(dt*42));
  }
  update(dt,city,simulation){
    this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
    let delta= Math.atan2(Math.sin(this.goalYaw-this.yaw),Math.cos(this.goalYaw-this.yaw));
    this.yaw+=THREE.MathUtils.clamp(delta,-dt*.7,dt*.7);
    this.length+=THREE.MathUtils.clamp(this.goalLength-this.length,-dt*9,dt*9);
    this.reach+=THREE.MathUtils.clamp(this.goalReach-this.reach,-dt*12,dt*12);
    this.updateAnchor();
    const steps=3,h=dt/steps;
    for(let n=0;n<steps;n++) {
      this.velocity.y-=17*h;
      if(this.aimTime>0){
        this.aimTime-=h;
        v.copy(this.aim).sub(this.ballPosition);v.y=0;
        if(v.length()>1)v.normalize().multiplyScalar(16*h);else v.set(0,0,0);
        this.velocity.add(v);
      }
      this.velocity.multiplyScalar(Math.pow(.994,h*60));
      this.ballPosition.addScaledVector(this.velocity,h);
      v.copy(this.ballPosition).sub(this.anchor);
      if(v.length()>this.length){v.normalize();this.ballPosition.copy(this.anchor).addScaledVector(v,this.length);const radial=this.velocity.dot(v);this.velocity.addScaledVector(v,-radial);}
      if(this.ballPosition.y<2){this.ballPosition.y=2;this.velocity.y=Math.abs(this.velocity.y)*.4;}
      if(this.cooldown<=0&&this.velocity.length()>2.4){
        outer:for(const b of city.buildings){
          for(const floor of b.floors){
            if(!floor.group.visible)continue;
            const p=floor.group.position;
            const closest = new THREE.Vector3(THREE.MathUtils.clamp(this.ballPosition.x,p.x-b.width/2,p.x+b.width/2),THREE.MathUtils.clamp(this.ballPosition.y,p.y,p.y+floor.height),THREE.MathUtils.clamp(this.ballPosition.z,p.z-b.depth/2,p.z+b.depth/2));
            if(closest.distanceToSquared(this.ballPosition)<3.2){
              const speed=this.velocity.length();
              simulation.impact(closest,Math.min(150,26+speed*5),this.velocity.clone().normalize());
              this.velocity.multiplyScalar(-.34);this.velocity.y=Math.abs(this.velocity.y)+2;
              this.cooldown=.44;break outer;
            }
          }
        }
      }
    }
    this.render();
  }
  member(mesh,a,b){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(up,v.copy(b).sub(a).normalize());}
  render(){
    this.upper.rotation.y=-this.yaw;
    const end=new THREE.Vector3(this.reach,42,0),start=new THREE.Vector3(0,4,0);
    const side=new THREE.Vector3(0,0,1),normal=new THREE.Vector3(-38,this.reach,0).normalize();
    const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z])=>normal.clone().multiplyScalar(x*.8).addScaledVector(side,z*.8));
    for(let i=0;i<4;i++)this.member(this.boomMembers[i],start.clone().add(corners[i]),end.clone().add(corners[i]));
    let k=4;
    for(let j=0;j<20;j++)for(let sideIndex=0;sideIndex<4;sideIndex++){
      const pairs=[[0,1],[1,3],[3,2],[2,0]][sideIndex];
      const a=start.clone().lerp(end,j/20).add(corners[pairs[j%2]]);
      const b=start.clone().lerp(end,(j+1)/20).add(corners[pairs[1-j%2]]);
      this.member(this.boomMembers[k++],a,b);
    }
    this.boomMembers.forEach((member,index)=>{member.updateMatrix();this.boomBatch.setMatrixAt(index,member.matrix);});this.boomBatch.instanceMatrix.needsUpdate=true;
    for(let i=0;i<2;i++)this.member(this.supportWires[i],new THREE.Vector3(-3,5,(i?1:-1)*1.6),end.clone().add(new THREE.Vector3(0,0,(i?1:-1)*.6)));
    this.member(this.cable,this.anchor,this.ballPosition.clone().add(new THREE.Vector3(0,1.7,0)));
    this.ball.position.copy(this.ballPosition);
    this.ball.rotation.set(this.time*.11,0,this.time*.13);
    this.halo.material.opacity=.33+Math.sin(this.time*3)*.21;this.halo.scale.setScalar(1+Math.sin(this.time*3)*.035);
  }
  capture(){return {yaw:this.yaw,goalYaw:this.goalYaw,reach:this.reach,goalReach:this.goalReach,length:this.length,goalLength:this.goalLength,time:this.time,cooldown:this.cooldown,aimTime:this.aimTime,aim:this.aim.toArray(),p:this.ballPosition.toArray(),v:this.velocity.toArray()};}
  restore(s,b=null,t=0){
    for(const key of ['yaw','goalYaw','reach','goalReach','length','goalLength','time','cooldown','aimTime'])this[key]=s[key];
    this.ballPosition.fromArray(s.p);this.velocity.fromArray(s.v);this.aim.fromArray(s.aim);
    if(b){this.ballPosition.lerp(new THREE.Vector3().fromArray(b.p),t);this.yaw=THREE.MathUtils.lerp(s.yaw,b.yaw,t);this.reach=THREE.MathUtils.lerp(s.reach,b.reach,t);this.length=THREE.MathUtils.lerp(s.length,b.length,t);}
    this.updateAnchor();this.render();
  }
}
