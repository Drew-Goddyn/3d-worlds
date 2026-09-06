import * as THREE from 'three';
import {eventRandom as random} from './event-track.js';
const MAX_CLOUDS=480,MAX_GRAINS=960;
const dummy=new THREE.Object3D();
// Birth records reconstruct this finite field at any simulation time. No frame
// accumulation, callbacks, structural RNG or camera motion drives presentation.
export class EventVisuals {
  constructor(scene){
    this.root=new THREE.Group();this.root.name='Recorded disturbance, contact dust and suspended grit';scene.add(this.root);
    const geometry=new THREE.PlaneGeometry(1,1);
    this.cloudData=new THREE.InstancedBufferAttribute(new Float32Array(MAX_CLOUDS*4),4);
    geometry.setAttribute('cloud',this.cloudData);
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
      vertexShader:`attribute vec4 cloud; varying vec2 vUv; varying vec4 vCloud;
      void main(){vUv=uv;vCloud=cloud;vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);center.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));gl_Position=projectionMatrix*center;}`,
      fragmentShader:`varying vec2 vUv;varying vec4 vCloud;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){vec2 uv=vUv-.5;float age=vCloud.y;vec2 flow=vUv*5.+vec2(vCloud.z,age*.25);float n=noise(flow)*.60+noise(flow*2.13)*.27+noise(flow*4.1)*.13;
      float r=length(uv*vec2(1.,1.08));float edge=1.-smoothstep(.20,.50,r+(n-.5)*.19);
      float alpha=edge*vCloud.x*(.45+n*.55);if(alpha<.004)discard;
      float rim=smoothstep(.19,.45,r)*(.55+vUv.y*.45);
      vec3 core=mix(vec3(.19,.20,.18),vec3(.36,.22,.13),vCloud.w);
      vec3 lit=mix(core,vec3(1.,.88,.63),clamp(n*.4+vUv.y*.23+rim*.45,0.,1.));
      gl_FragColor=vec4(lit,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
    this.clouds=new THREE.InstancedMesh(geometry,material,MAX_CLOUDS);this.clouds.frustumCulled=false;this.clouds.count=0;this.clouds.renderOrder=2;this.clouds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.root.add(this.clouds);
    const grains=new THREE.BufferGeometry();
    this.positions=new THREE.BufferAttribute(new Float32Array(MAX_GRAINS*3),3).setUsage(THREE.DynamicDrawUsage);
    this.grainData=new THREE.BufferAttribute(new Float32Array(MAX_GRAINS*3),3).setUsage(THREE.DynamicDrawUsage);
    grains.setAttribute('position',this.positions);grains.setAttribute('grain',this.grainData);
    this.grainMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{height:{value:900}},
      vertexShader:`attribute vec3 grain;uniform float height;varying vec3 vGrain;void main(){vGrain=grain;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(grain.x*height/max(1.,-p.z),1.,5.);gl_Position=projectionMatrix*p;}`,
      fragmentShader:`varying vec3 vGrain;void main(){vec2 p=gl_PointCoord-.5;float a=(1.-smoothstep(.25,.5,length(p)))*vGrain.y;vec3 c=mix(vec3(.75,.62,.41),vec3(.69,.94,.91),vGrain.z);gl_FragColor=vec4(c,a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
    this.grains=new THREE.Points(grains,this.grainMaterial);this.grains.frustumCulled=false;this.root.add(this.grains);
    this.lights=Array.from({length:3},()=>{const l=new THREE.PointLight(0xffcc85,0,8,2);this.root.add(l);return l;});
  }
  render(events,time,quality='high',height=900){
    let clouds=0,grains=0,lights=0;
    const cloudBudget=quality==='low'?240:MAX_CLOUDS,grainBudget=quality==='low'?320:MAX_GRAINS;
    for(const light of this.lights)light.intensity=0;
    for(const e of events.slice().reverse()){
      const age=time-e.time;if(age<0||age>=9)continue;
      const blast=e.type==='blast',contact=e.type==='contact',release=e.type==='release',motion=e.type==='motion';
      const glass=e.material==='glass',metal=e.material==='steel';
      const dusty=e.type==='blast'||!glass&&!metal&&e.material!=='paper'&&['dust','collapse','impact','contact','release','motion'].includes(e.type);
      if(blast&&age<.24&&lights<3){const light=this.lights[lights++];light.position.set(e.x,e.y+.35,e.z);light.intensity=5*Math.sin(Math.PI*age/.24)**2;}
      if(dusty){
        const life=motion?2.4:blast?4.4:contact?5.6:release?3.2:7.5;
        if(age<life){
          const lobes=motion?2:blast?9:contact?5:release?2:e.type==='collapse'?6:Math.min(8,3+Math.ceil(e.power/15));
          for(let i=0;i<lobes&&clouds<cloudBudget;i++){
            const r=k=>random(e.seed,i*13+k),angle=r(0)*Math.PI*2;
            const energy=Math.min(2.1,.6+Math.sqrt(e.power)/11+(contact?Math.sqrt(e.mass)*.045:0));
            const travel=(blast?4.8:contact?2.7:release?.8:1.6)*energy*(1-Math.exp(-age*1.3));
            const radius=travel*(.3+r(1)*.7),size=(blast?.9:contact?.7:release?.42:.85)+Math.sqrt(age)*(.65+r(2)*.85)*energy;
            const floor=e.y<.7||contact;
            const y=Math.max(.35,e.y+(floor?.28:0)+(blast?r(3)*1.5*(1-Math.exp(-age*5)):release?-Math.min(age*1.2,e.y-.3):r(3)*.5)+age*.18);
            const push=blast?travel*.5:0;
            const drag=motion?(1-Math.exp(-age*3))*.12:0;
            dummy.position.set(e.x+Math.cos(angle)*radius+e.nx*push+e.vx*drag,y+e.vy*drag,e.z+Math.sin(angle)*radius+e.nz*push+e.vz*drag);
            dummy.scale.set(size*(floor?1.7:1.15),size*(floor?.7:1.25),1);dummy.updateMatrix();this.clouds.setMatrixAt(clouds,dummy.matrix);
            const envelope=Math.min(1,age*(blast?22:9))*Math.pow(1-age/life,1.8);
            this.cloudData.setXYZW(clouds,(blast?.53:contact?.40:release?.23:.31)*envelope,age,r(4)*30,e.material==='brick'?1:0);clouds++;
          }
        }
      }
      if((blast||contact||release)&&age<3.4){
        const count=blast?42:contact?16:glass?18:5;
        for(let i=0;i<count&&grains<grainBudget;i++){
          const r=k=>random(e.seed,500+i*9+k),angle=r(0)*Math.PI*2,velocity=(blast?5:contact?2:1)*(.25+r(1));
          const y=e.y+(blast?1.2+r(2)*2:contact?.5+r(2):r(2)) * age-1.7*age*age;
          if(y<.25)continue;
          this.positions.setXYZ(grains,e.x+Math.cos(angle)*velocity*age,y,e.z+Math.sin(angle)*velocity*age);
          this.grainData.setXYZ(grains,.025+r(3)*.035,Math.min(1,age*30)*Math.max(0,1-age/3.4)*.85,glass?1:0);grains++;
        }
      }
    }
    this.clouds.count=clouds;this.clouds.instanceMatrix.needsUpdate=true;this.cloudData.needsUpdate=true;
    this.grains.geometry.setDrawRange(0,grains);this.positions.needsUpdate=true;this.grainData.needsUpdate=true;this.grainMaterial.uniforms.height.value=height;
    this.stats={clouds,grains,lights};
  }
}
