import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCity } from './city.js';
import { Simulation } from './simulation.js';
import { History } from './history.js';
import { Crane } from './crane.js';
import { attachArchitecturalFracture } from './fracture.js';
import { icon } from './icons.js';

const $=id=>document.getElementById(id);
const canvas=$('world');
let renderer;
try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
catch { $('error').hidden=false;$('error').textContent='This playground needs WebGL 2. Please open it in a browser with hardware acceleration enabled.';throw new Error('WebGL 2 unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xe4e8d9);scene.fog=new THREE.Fog(0xe4e8d9,100,240);
const camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.2,500);
function fitCamera(){camera.aspect=innerWidth/innerHeight;camera.fov=THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(39)/2)*Math.max(1,1.35/camera.aspect))),39,84);camera.updateProjectionMatrix();}
fitCamera();
const hero=new THREE.Vector3(82,66,91),heroTarget=new THREE.Vector3(-1,9,-3);
camera.position.copy(hero);
const controls=new OrbitControls(camera,canvas);controls.target.copy(heroTarget);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=12;controls.maxDistance=175;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.12;controls.panSpeed=.7;controls.rotateSpeed=.55;controls.zoomSpeed=.75;
const sky=new THREE.HemisphereLight(0xddeffc,0xa79870,1.8);scene.add(sky);
const sun=new THREE.DirectionalLight(0xffe4b3,3.2);sun.position.set(-38,70,36);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-68;sun.shadow.camera.right=68;sun.shadow.camera.top=68;sun.shadow.camera.bottom=-68;sun.shadow.camera.near=1;sun.shadow.camera.far=160;sun.shadow.normalBias=.035;sun.shadow.bias=-.00008;sun.shadow.radius=3;scene.add(sun);sun.target.position.set(0,0,0);scene.add(sun.target);
const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ec=envCanvas.getContext('2d');const gradient=ec.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#b7d6e2');gradient.addColorStop(.48,'#dbe9e2');gradient.addColorStop(.52,'#d3d7c7');gradient.addColorStop(1,'#949b83');ec.fillStyle=gradient;ec.fillRect(0,0,512,256);ec.fillStyle='#fff6de';ec.fillRect(70,40,70,70);ec.fillStyle='#eff6ee';ec.fillRect(310,55,130,28);
const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromEquirectangular(env);scene.environment=environment.texture;scene.environmentIntensity=.7;env.dispose();pmrem.dispose();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),new THREE.MeshStandardMaterial({color:0xd4d8be,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;ground.receiveShadow=true;scene.add(ground);
const city=createCity(scene);
const simulation=new Simulation(city,scene);
simulation.camera=camera;
attachArchitecturalFracture(simulation);
const crane=new Crane(scene);
const history=new History(60);
let tool='ball',slow=false,spaceSlow=false,paused=false,rewinding=false,resetting=false,actionCamera=false;
let cursor=0,recordAccumulator=0,activeClock=0,frameCount=0,frameTotal=0,fps=60;
let pristine,resetFrom=null,resetBlend=0,lastToast=0,soundEnabled=false,audioContext=null;
const held=new Set(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const hitGroups=city.buildings.flatMap(b=>b.bank?[b.bank.root]:b.floors.map(f=>f.group));
let hoverHit=null,pointerDown=null;

function capture(){const s=simulation.capture();s.crane=crane.capture();return s;}
function record(){history.record(simulation.time,capture());cursor=simulation.time;}
record();pristine=capture();
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');lastToast=performance.now();}
function setTool(next){tool=next;$('ball-tool').classList.toggle('active',tool==='ball');$('charge-tool').classList.toggle('active',tool==='charge');$('ball-tool').setAttribute('aria-pressed',tool==='ball');$('charge-tool').setAttribute('aria-pressed',tool==='charge');$('crane-controls').hidden=tool!=='ball';$('detonate').hidden=tool!=='charge';$('tool-hint').innerHTML=tool==='ball'?'<span class="key-icon">↖</span> Click a building to swing. <span class="hint-soft">Drag to look around.</span>':'<span class="key-icon">＋</span> Click structural members to place charges. <span class="hint-soft">Up to six. Then detonate.</span>';canvas.style.cursor=tool==='charge'?'crosshair':'grab';}
function setSlow(value){slow=value;$('slow-motion').setAttribute('aria-pressed',slow);}
function setActionCamera(value){actionCamera=value;$('action-camera').setAttribute('aria-pressed',value);if(value)toast('Action camera on. A front-row seat.');}
function restoreSample(time){const sample=history.sample(time);if(!sample)return;simulation.restore(sample.a,sample.b,sample.alpha);if(sample.a.crane)crane.restore(sample.a.crane,sample.b?.crane,sample.alpha);cursor=THREE.MathUtils.clamp(time,history.start,history.end);}
function branch(){
  if(resetting)return false;
  if(cursor<history.end-.002){
    const s=history.sample(cursor);
    simulation.restore(s.a);crane.restore(s.a.crane);
    history.truncate(s.timeA??simulation.time);cursor=simulation.time;
    toast('A fresh take. Make a different mess.');
  }
  rewinding=false;paused=false;recordAccumulator=0;return true;
}
function toggleRewind(){
  if(history.length<2||simulation.stats.tonnage===0&&cursor<=history.start+.01){toast('Make a little history first.');return;}
  resetting=false;resetFrom=null;rewinding=!rewinding;paused=!rewinding;updateUI();
}
function resetCity(){
  if(simulation.stats.tonnage===0&&simulation.stats.charges===0&&history.end<.1)return;
  resetting=true;rewinding=true;paused=false;resetFrom=null;resetBlend=0;
  toast('Putting every little piece back.');
}
function finishReset(){simulation.restore(pristine);crane.restore(pristine.crane);history.clear();record();resetting=false;rewinding=false;paused=false;resetFrom=null;recordAccumulator=0;$('toast').classList.remove('visible');}
function pauseToggle(){if(resetting){resetting=false;resetFrom=null;}rewinding=false;paused=!paused;updateUI();}
function detonate(){if(!branch())return;const n=simulation.stats.charges;simulation.detonate();if(n)toast(`${n} charges. One very satisfying moment.`);}

function sound(power=50){
  if(!soundEnabled)return;
  audioContext??=new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==='suspended')audioContext.resume();
  const ac=audioContext,duration=.65,buffer=ac.createBuffer(1,Math.floor(ac.sampleRate*duration),ac.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
  const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(750,ac.currentTime);filter.frequency.exponentialRampToValueAtTime(65,ac.currentTime+duration);gain.gain.value=Math.min(.28,power/400);source.connect(filter).connect(gain).connect(ac.destination);source.start();
  const bass=ac.createOscillator(),bg=ac.createGain();bass.frequency.setValueAtTime(84,ac.currentTime);bass.frequency.exponentialRampToValueAtTime(26,ac.currentTime+.38);bg.gain.setValueAtTime(.13,ac.currentTime);bg.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.42);bass.connect(bg).connect(ac.destination);bass.start();bass.stop(ac.currentTime+.45);
}
simulation.onEvent=event=>{
  if(event?.type==='impact'||event?.type==='collapse'||event?.type==='blast')sound(event.power||60);
  if(event?.type==='collapse')toast(simulation.stats.chain>1?`Chain reaction ×${simulation.stats.chain}. The crowd approves.`:'That brought the house down.');
  if(event?.type==='water')toast('And there goes the water bill.');
  if(event?.type==='implosion')toast('Perfect footprint. A standing ovation.');
};

function pick(event){
  const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(hitGroups,true);
  for(const hit of hits){
    if(hit.object.userData.bank){
      const body=simulation.bank.bodies[hit.object.userData.bodyIds[hit.instanceId]];
      if(body.fixed)continue;
      const building=hit.object.userData.bank.building;
      // Preserve the point in the selected piece's displayed coordinates.
      // Branching a scrubbed frame restores an earlier snapshot before input;
      // the same local point then follows that body's restored transform.
      const bankCharge=simulation.bank.anchorCharge(body.id,hit.point);
      return {...hit,bankCharge,building,floor:building.floors[simulation.bank.nodes[body.node].level]};
    }
    let object=hit.object;while(object&&!hitGroups.includes(object))object=object.parent;
    if(!object||!object.visible)continue;
    const building=city.buildings.find(b=>b.floors.some(f=>f.group===object));
    return {...hit,building,floor:building.floors.find(f=>f.group===object)};
  }
  return null;
}
canvas.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY,button:event.button};canvas.style.cursor='grabbing';});
canvas.addEventListener('pointermove',event=>{
  if(pointerDown)return;
  hoverHit=pick(event);
  if(hoverHit){const label=$('target-label');label.hidden=false;label.textContent=hoverHit.building.name;const small=document.createElement('small');small.textContent=tool==='ball'?'CLICK TO SWING':'CLICK TO PLACE CHARGE';label.appendChild(small);label.style.left=Math.min(innerWidth-120,Math.max(120,event.clientX))+'px';label.style.top=(event.clientY-21)+'px';canvas.style.cursor='crosshair';}
  else{$('target-label').hidden=true;canvas.style.cursor=tool==='charge'?'crosshair':'grab';}
});
canvas.addEventListener('pointerleave',()=>{$('target-label').hidden=true;pointerDown=null;});
canvas.addEventListener('pointerup',event=>{
  const down=pointerDown;pointerDown=null;canvas.style.cursor=tool==='charge'?'crosshair':'grab';
  if(!down||down.button!==0||Math.hypot(event.clientX-down.x,event.clientY-down.y)>5)return;
  const hit=pick(event);if(!hit||!branch())return;
  if(tool==='charge'){
    const bankBodyId=hit.object.userData.bank?hit.object.userData.bodyIds[hit.instanceId]:null;
    const point=hit.bankCharge?simulation.bank.chargePoint(hit.bankCharge):hit.point;
    if(simulation.placeCharge(point,hit.building.id,hit.floor.index,bankBodyId))sound(7);else toast('Six charges is a full set. Time to detonate.');
  }else{crane.aimAt(hit.point,hit.building.bank?2.1:3);toast(`Taking a swing at ${hit.building.name}.`);}
  $('target-label').hidden=true;record();updateUI();
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
$('ball-tool').onclick=()=>setTool('ball');$('charge-tool').onclick=()=>setTool('charge');
$('slow-motion').onclick=()=>setSlow(!slow);$('rewind').onclick=toggleRewind;$('reset-city').onclick=resetCity;
$('play-pause').onclick=pauseToggle;$('detonate').onclick=detonate;
$('action-camera').onclick=()=>setActionCamera(!actionCamera);
$('reset-view').onclick=()=>{setActionCamera(false);camera.position.copy(hero);controls.target.copy(heroTarget);controls.update();};
$('sound').onclick=()=>{soundEnabled=!soundEnabled;$('sound').setAttribute('aria-pressed',soundEnabled);icon($('sound'),soundEnabled?'sound':'muted');if(soundEnabled)sound(12);};
$('quality').onchange=event=>{const quality=event.target.value;simulation.setQuality(quality);renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?2:quality==='medium'?1.4:1));sun.shadow.mapSize.setScalar(quality==='high'?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}toast(`Graphics quality: ${quality}.`);};
$('timeline').addEventListener('input',event=>{resetting=false;rewinding=false;paused=true;restoreSample(Number(event.target.value));updateUI();});
document.querySelectorAll('[data-crane]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{if(!branch())return;held.add(button.dataset.crane);button.setPointerCapture(event.pointerId);});
  button.addEventListener('pointerup',()=>held.delete(button.dataset.crane));button.addEventListener('pointercancel',()=>held.delete(button.dataset.crane));button.addEventListener('lostpointercapture',()=>held.delete(button.dataset.crane));
});
const actionKeys={KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down',KeyF:'swing'};
window.addEventListener('keydown',event=>{
  if(/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
  if(event.target.closest?.('button')&&(event.code==='Space'||event.code==='Enter'))return;
  if(event.code==='Space'){event.preventDefault();spaceSlow=true;return;}
  if(event.repeat)return;
  if(actionKeys[event.code]){if(branch())held.add(actionKeys[event.code]);}
  if(event.code==='Digit1')setTool('ball');if(event.code==='Digit2')setTool('charge');if(event.code==='KeyR')toggleRewind();if(event.code==='KeyC')setActionCamera(!actionCamera);if(event.code==='KeyH')$('reset-view').click();if(event.code==='Enter'&&tool==='charge')detonate();if(event.code==='KeyP')pauseToggle();
});
window.addEventListener('keyup',event=>{if(event.code==='Space')spaceSlow=false;if(actionKeys[event.code])held.delete(actionKeys[event.code]);});
window.addEventListener('blur',()=>{held.clear();spaceSlow=false;pointerDown=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();spaceSlow=false;}});
function formatTime(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;}
function updateUI(){
  const stats=simulation.stats;
  $('tonnage').innerHTML=Math.round(stats.tonnage).toLocaleString()+'<span> t</span>';
  $('chain').innerHTML=`×${Math.max(1,stats.chain)}<span>${stats.collapsed?stats.collapsed+' buildings down':stats.tonnage?'partial damage':'no damage yet'}</span>`;
  $('charge-count').textContent=`${stats.charges}/6`;$('detonate-count').textContent=`${stats.charges} CHARGE${stats.charges===1?'':'S'}`;$('detonate').disabled=!stats.charges;
  $('rewind').setAttribute('aria-pressed',rewinding);icon($('play-pause'),paused||rewinding?'play':'pause');$('play-pause').setAttribute('aria-label',paused||rewinding?'Resume simulation':'Pause simulation');
  const state=resetting?'REBUILDING':rewinding?'REWINDING':paused?'TIME PAUSED':slow||spaceSlow?'SLOW MOTION':'REAL TIME';
  $('simulation-state').innerHTML=`<i style="background:${rewinding?'#c59a32':paused?'#8a8e80':'#728554'}"></i> ${state} <span>${rewinding?'−3.0×':paused?'0.0×':slow||spaceSlow?'0.1×':'1.0×'}</span>`;
  const range=$('timeline');range.min=history.start;range.max=Math.max(history.end,history.start+.01);range.value=cursor;$('timeline-time').textContent=formatTime(cursor);$('timeline-fill').style.width=`${history.end>history.start?THREE.MathUtils.clamp((cursor-history.start)/(history.end-history.start)*100,0,100):0}%`;
  if(performance.now()-lastToast>3200)$('toast').classList.remove('visible');
}
let previous=performance.now(),uiTick=0;
function animate(now){
  requestAnimationFrame(animate);
  const realDt=Math.max(0,Math.min(.06,(now-previous)/1000));previous=now;
  if(document.hidden)return;
  frameCount++;frameTotal+=realDt;if(frameTotal>1){fps=Math.round(frameCount/frameTotal);frameCount=0;frameTotal=0;}
  activeClock+=realDt;
  if(resetting&&resetFrom){
    resetBlend=Math.min(1,resetBlend+realDt/2.6);const alpha=resetBlend*resetBlend*(3-2*resetBlend);simulation.restore(resetFrom,pristine,alpha);crane.restore(resetFrom.crane,pristine.crane,alpha);if(resetBlend>=1)finishReset();
  }else if(rewinding){
    const speed=resetting?Math.max(3,(cursor-history.start)/1.8):3;
    restoreSample(Math.max(history.start,cursor-realDt*speed));
    if(cursor<=history.start+.001){
      if(resetting){if(history.start>.01){resetFrom=capture();resetBlend=0;}else finishReset();}
      else {rewinding=false;paused=true;}
    }
  }else if(!paused){
    if(cursor<history.end-.003){restoreSample(Math.min(history.end,cursor+realDt*((slow||spaceSlow)?.1:1)));}
    else{
      const dt=realDt*((slow||spaceSlow)?.1:1);
      for(const action of held)crane.control(action,dt);
      crane.update(dt,city,simulation);simulation.update(dt);cursor=simulation.time;
      recordAccumulator+=dt;if(recordAccumulator>=.05){record();recordAccumulator%=.05;}
    }
  }
  for(const light of city.warningLights||[])if(light.material?.emissive)light.material.emissiveIntensity=Math.sin(simulation.time*5+(light.id||0))>0?1.7:.08;
  if(actionCamera&&simulation.lastImpact&&simulation.stats.tonnage>0){
    const target=simulation.lastImpact.clone();target.y=Math.max(3,target.y);
    const desired=target.clone().add(new THREE.Vector3(32,24,37));camera.position.lerp(desired,realDt*.6);controls.target.lerp(target,realDt*1.4);
  }
  controls.update();renderer.render(scene,camera);
  uiTick+=realDt;if(uiTick>.08){updateUI();uiTick=0;}
}
window.addEventListener('resize',()=>{fitCamera();renderer.setSize(innerWidth,innerHeight);});
setTool('ball');controls.update();updateUI();requestAnimationFrame(animate);

// Read-only diagnostics and explicit action hooks for reproducible browser checks.
window.demolition={
  get ready(){return true;},get stats(){return {...simulation.stats};},get diagnostics(){return {fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,historyFrames:history.length,historyStart:history.start,historyEnd:history.end,cursor,mode:resetting?'reset':rewinding?'rewind':paused?'paused':'live',tool,buildings:city.buildings.map(b=>({id:b.id,name:b.name,floors:b.floors.length,x:b.x,z:b.z,height:b.height})),crane:crane.capture()};},
  view(position,target){camera.position.fromArray(position);controls.target.fromArray(target);controls.update();},
  projectPoint(x,y,z){const p=new THREE.Vector3(x,y,z).project(camera);return {x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight};},
  projectBuilding(id,floor=0){const b=city.buildings.find(b=>b.id===id);if(!b)return null;const p=new THREE.Vector3(b.x,b.floors[floor]?.y+1.5||2,b.z+b.depth/2).project(camera);return {x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight};},
  pause(){paused=true;rewinding=false;},resume(){paused=false;rewinding=false;},seek(time){paused=true;rewinding=false;restoreSample(time);updateUI();},reset:resetCity,
  state(){return capture();},historySample(time){return history.sample(time);},
  impactBuilding(id,power=80){if(!branch())return;const b=city.buildings.find(b=>b.id===id);simulation.impact(new THREE.Vector3(b.x,2,b.z+b.depth/2),power,new THREE.Vector3(-.1,0,-1));record();},
  aimBuilding(id){const b=city.buildings.find(b=>b.id===id);if(branch())crane.aimAt(new THREE.Vector3(b.x,5,b.z+b.depth/2),b.bank?2.1:3);},
  placeCharge(id,floor=0){if(!branch())return false;const b=city.buildings.find(b=>b.id===id),f=b.floors[floor];const result=simulation.placeCharge(new THREE.Vector3(b.x-b.width*.4,f.y+1,b.z+b.depth*.4),id,floor);record();return result;},detonate,
};
