import * as THREE from 'three';

// Architectural fragments keep the actual source vertices. Coarse joint failure
// releases them into analytic ballistic motion, with a finite ground impact and
// damped bounce. Their complete motion is a pure function of the recorded floor
// state: rewinding neither integrates backwards nor invents new random values.
const declarations=`
attribute vec3 fractureCenter;
attribute vec3 fractureSize;
attribute float fractureId;
uniform float fractureAge;
uniform float fractureActive;
uniform vec3 fractureOrigin;
uniform vec3 fractureDrift;
uniform mat4 fractureInverse;
float fractureHash(float p) { return fract(sin(p*127.13+17.7)*43758.5453); }
mat3 fractureRotation(float x,float z) {
  float a=cos(x),b=sin(x),c=cos(z),d=sin(z);
  return mat3(c,d,0.,-d*a,c*a,b,d*b,-c*b,a);
}
`;
const transform=`
if(fractureActive>.5) {
  float randomA=fractureHash(fractureId+fractureCenter.x*.131+fractureCenter.z*.317);
  float randomB=fractureHash(fractureId+43.31);
  float elapsed=max(0.,fractureAge-.12-randomA*.36);
  float blend=smoothstep(0.,.32,elapsed);
  vec3 origin=fractureOrigin+fractureCenter;
  float landing=sqrt(max(.06,2.*(origin.y-.35)/15.));
  float flight=min(elapsed,landing);
  float turn=smoothstep(0.,max(.3,landing),flight);
  float tall=step(max(fractureSize.x,fractureSize.z)*.55,fractureSize.y);
  mat3 spin=fractureRotation(turn*(tall*(1.1+randomA*.4)+(1.-tall)*(.08+randomA*.15)),turn*(randomB-.5)*.45);
  vec3 extents=abs(spin[0])*fractureSize.x*.5+abs(spin[1])*fractureSize.y*.5+abs(spin[2])*fractureSize.z*.5;
  vec2 outward=normalize(fractureCenter.xz+vec2(randomA-.5,randomB-.5)*3.+vec2(.001));
  float after=max(0.,elapsed-landing);
  float travel=min(elapsed,landing+.6)*(randomA*1.5+.45);
  float ground=.24+extents.y;
  vec3 center=origin+vec3(outward.x*travel,0.,outward.y*travel)+fractureDrift*turn;
  center.y=max(ground,origin.y-7.5*flight*flight)+max(0.,sin(after*9.))*exp(-after*3.)*.45;
  vec3 worldFragment=center+spin*(transformed-fractureCenter);
  vec3 inherited=(modelMatrix*vec4(transformed,1.)).xyz;
  transformed=(fractureInverse*vec4(mix(inherited,worldFragment,blend),1.)).xyz;
}
`;

function attachStressCracks(mesh,floor,simulation,glass=false){
  const uniforms={stressDamage:{value:0},stressGlass:{value:glass?1:0}};
  const previous=mesh.material.onBeforeCompile;
  mesh.material.onBeforeCompile=shader=>{
    previous.call(mesh.material,shader);
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='varying vec2 stressUv;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nstressUv=uv;');
    shader.fragmentShader='varying vec2 stressUv;\nuniform float stressDamage;\nuniform float stressGlass;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      if(stressDamage>.1){
        vec2 p=stressUv;
        float jag=sin(p.y*41.)*.012+sin(p.y*97.)*.006;
        float lineA=abs(p.x-.38-p.y*.21-jag);
        float lineB=abs(p.x-.5+p.y*.37-jag*.6);
        float lineC=abs(p.y-.61+p.x*.45-sin(p.x*53.)*.01);
        float cracks=(1.-smoothstep(.0015,.005,min(lineA,min(lineB,lineC))))*step(p.y,stressDamage*1.4);
        diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.16,.18,.15),vec3(.92,.99,1.),stressGlass),cracks*stressDamage*.8);
      }
    `);
  };
  mesh.material.customProgramCacheKey=()=>glass?'district-stress-glass-v1':'district-source-fracture-stress-v1';
  const before=mesh.onBeforeRender;
  mesh.onBeforeRender=(...args)=>{
    before?.apply(mesh,args);
    const {next,alpha}=simulation.presentation||{};
    const support=next?THREE.MathUtils.lerp(floor.support,next.floors[floor.index*22+17],alpha):floor.support;
    uniforms.stressDamage.value=THREE.MathUtils.clamp(1-support,0,1);
  };
}

export function attachArchitecturalFracture(simulation) {
  const visited=new Set();
  for (const floor of simulation.floors) {
    for (const piece of floor.pieces) {
      const mesh=piece.mesh,primitives=mesh.userData.primitives;
      if(visited.has(mesh))continue;visited.add(mesh);
      if(mesh.userData.fractureUnits?.length){mesh.material=mesh.material.clone();attachStressCracks(mesh,floor,simulation,true);continue;}
      if(!primitives?.length)continue;
      const geo=mesh.geometry;
      if(!geo.getAttribute('fractureCenter'))continue;
      const sizes=new Float32Array(geo.getAttribute('position').count*3);
      for(const unit of primitives)for(let vertex=unit.start;vertex<unit.start+unit.count;vertex++)sizes.set(unit.size,vertex*3);
      geo.setAttribute('fractureSize',new THREE.BufferAttribute(sizes,3));
      const uniforms={fractureAge:{value:0},fractureActive:{value:0},fractureOrigin:{value:new THREE.Vector3(floor.baseX,floor.baseY,floor.baseZ)},fractureDrift:{value:new THREE.Vector3()},fractureInverse:{value:new THREE.Matrix4()}};
      function patch(material){
        material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader=declarations+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+transform);};
        material.customProgramCacheKey=()=> 'district-source-fracture-v1';
      }
      mesh.material=mesh.material.clone();patch(mesh.material);
      mesh.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});patch(mesh.customDepthMaterial);
      mesh.frustumCulled=false;
      const before=()=>{
        const {next,alpha}=simulation.presentation||{};
        const viewTime=next?THREE.MathUtils.lerp(simulation.time,next.time,alpha):simulation.time;
        uniforms.fractureAge.value=Math.max(0,viewTime-floor.born);
        uniforms.fractureActive.value=floor.state>=2?1:0;
        uniforms.fractureDrift.value.set((floor.floor.group.position.x-floor.baseX)*.7,0,(floor.floor.group.position.z-floor.baseZ)*.7);
        uniforms.fractureInverse.value.copy(mesh.matrixWorld).invert();
      };
      mesh.onBeforeRender=before;mesh.onBeforeShadow=before;
      attachStressCracks(mesh,floor,simulation,false);
    }
  }
}
