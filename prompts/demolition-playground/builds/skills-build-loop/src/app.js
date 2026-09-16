import { City,Playback,G,N,DT } from './world.js';
import { View } from './view.js';
const $=id=>document.getElementById(id),city=new City(),playback=new Playback(city),canvas=$('city');
let view;
try{view=new View(canvas,city);}catch(e){$('error').hidden=false;$('error').textContent=`The city could not start: ${e.message}. Use a browser with WebGL 2 enabled.`;throw e;}
let tool='ball',drag=null,keys=new Set(),last=performance.now(),toastUntil=0,hover=null;
const metrics={frames:[],longFrames:[],started:performance.now()};
if(PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame'))new PerformanceObserver(list=>{for(const e of list.getEntries())metrics.longFrames.push({start:e.startTime,duration:e.duration});}).observe({type:'long-animation-frame',buffered:true});
const toast=text=>{$('toast').textContent=text;toastUntil=performance.now()+2400;$('toast').classList.add('visible');};
function selectTool(t){tool=t;view.targetGroup.visible=t==='charges';$('ball-tool').classList.toggle('selected',t==='ball');$('charge-tool').classList.toggle('selected',t==='charges');$('ball-tool').setAttribute('aria-pressed',t==='ball');$('charge-tool').setAttribute('aria-pressed',t==='charges');$('ball-hint').hidden=t!=='ball';$('charge-hint').hidden=t!=='charges';}
$('ball-tool').onclick=()=>selectTool('ball');$('charge-tool').onclick=()=>selectTool('charges');
$('slow').onclick=()=>{playback.speed=playback.speed===1?.1:1;};
$('rewind').onclick=()=>{playback.mode=playback.mode==='rewind'?'paused':'rewind';};
$('play').onclick=()=>{if(playback.mode==='live')playback.mode='paused';else playback.play();};
$('timeline').oninput=e=>playback.scrubTime(Number(e.target.value));
$('reset-city').onclick=()=>{playback.reset();};
$('view').onclick=()=>{view.actionCamera=false;view.resetView();};
$('action-cam').onclick=()=>{view.actionCamera=!view.actionCamera;};
$('quality').onchange=e=>view.setQuality(e.target.value);
$('detonate').onclick=()=>{if(playback.act({type:'detonate'}))toast('Stand clear.');};
for(const button of document.querySelectorAll('[data-hold]')){
  button.addEventListener('pointerdown',e=>{button.setPointerCapture(e.pointerId);keys.add(button.dataset.hold);if(playback.mode!=='live')playback.play();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>keys.delete(button.dataset.hold));
}
window.addEventListener('keydown',e=>{
  if(['INPUT','SELECT'].includes(e.target.tagName))return;
  const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
  if(k===' ')playback.holdSlow=true;
  if(k==='r'&&!e.repeat)playback.mode='rewind';if(k==='b')selectTool('ball');if(k==='c')selectTool('charges');
  keys.add(k);if(['a','d','w','s','arrowup','arrowdown','arrowleft','arrowright'].includes(k)&&tool==='ball'&&playback.mode!=='live')playback.play();
});
window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);if(k===' ')playback.holdSlow=false;if(k==='r'&&playback.mode==='rewind')playback.mode='paused';});
window.addEventListener('blur',()=>{keys.clear();playback.holdSlow=false;drag=null;view.controls.enabled=true;});
canvas.addEventListener('pointerdown',e=>{
  canvas.focus();if(e.button!==0)return;const hit=view.pick(e.clientX,e.clientY,tool);
  if((tool==='ball'&&(hit==='ball'||e.shiftKey))||(tool==='charges'&&hit!==null)){
    view.controls.enabled=false;drag={x:e.clientX,y:e.clientY,hit,tool};canvas.setPointerCapture(e.pointerId);e.stopImmediatePropagation();
  }else if(tool==='charges')drag={x:e.clientX,y:e.clientY,hit:null,tool};
},true);
canvas.addEventListener('pointermove',e=>{
  if(drag?.tool==='ball'){const p=view.project(view.ball.position);$('target-cue').textContent='Release to swing';$('target-cue').style.cssText=`display:block;left:${e.clientX+14}px;top:${e.clientY}px`;return;}
  if(tool==='charges'){
    hover=view.pick(e.clientX,e.clientY,tool);if(hover!==null){const n=city.plan.nodes[hover];$('target-cue').textContent=`${city.plan.buildings[n.b].name} · floor ${n.f+1}`;$('target-cue').style.cssText=`display:block;left:${e.clientX+15}px;top:${e.clientY}px`;canvas.style.cursor='crosshair';return;}
  }
  $('target-cue').style.display='none';canvas.style.cursor='grab';
});
canvas.addEventListener('pointerup',e=>{
  if(!drag)return;const d=drag;drag=null;view.controls.enabled=true;$('target-cue').style.display='none';
  if(d.tool==='charges'){
    if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>7)return;
    if(d.hit===null){toast('Choose a gold structural joint.');return;}
    if(!playback.act({type:'charge',node:d.hit}))toast('That joint is unavailable, already charged, or all 6 charges are placed.');
  }else{
    const dx=e.clientX-d.x,dy=e.clientY-d.y;const right=view.camera.matrix.elements;const forward=[-right[8],-right[10]];
    if(Math.hypot(dx,dy)>4){playback.act({type:'swing',x:(right[0]*dx+forward[0]*-dy)*.10,z:(right[2]*dx+forward[1]*-dy)*.10});}
  }
});
canvas.addEventListener('pointercancel',()=>{drag=null;view.controls.enabled=true;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function input(){if(tool!=='ball')return null;const e=view.camera.matrix.elements;const x=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0),z=(keys.has('arrowup')?1:0)-(keys.has('arrowdown')?1:0);
  const a={type:'crane',rotate:(keys.has('d')?1:0)-(keys.has('a')?1:0),cable:(keys.has('s')?1:0)-(keys.has('w')?1:0),pumpX:e[0]*x-e[8]*z,pumpZ:e[2]*x-e[10]*z};return a.rotate||a.cable||x||z?a:null;}
function ui(){const s=playback.sample(),h=playback.history;$('tons').textContent=Math.floor(s[G.tons]).toLocaleString();$('chain').textContent=`×${Math.max(1,s[G.chain])}`;
  $('praise').textContent=s[G.time]-s[G.cheer]<3&&s[G.cheer]>0?(s[G.chain]>1?'“That brought the house down!”':s[G.clean]>3?'“Right in its own footprint!”':'“One more!”'):'';
  $('timeline').max=h.timeAt(h.end);$('timeline').step='any';$('timeline').value=playback.time;$('playhead').textContent=s[G.time].toFixed(1)+'s';$('duration').textContent=h.timeAt(h.end).toFixed(1)+'s';
  $('time-state').textContent=playback.mode==='reset'?'REBUILD':playback.mode==='rewind'?'REVERSE':playback.mode==='paused'?'PAUSED':h.cursor<h.end?'REPLAY':(playback.holdSlow||playback.speed===.1)?'0.1×':'LIVE';
  $('slow').setAttribute('aria-pressed',playback.holdSlow||playback.speed===.1);$('rewind').setAttribute('aria-pressed',playback.mode==='rewind'||playback.mode==='reset');$('action-cam').setAttribute('aria-pressed',view.actionCamera);
  $('play').textContent=playback.mode==='live'?'Ⅱ':'▶';$('play').setAttribute('aria-label',playback.mode==='live'?'Pause simulation':'Play recorded future or resume simulation');
  let count=0;for(let i=0;i<6;i++)if(s[city.chargeBase+i*4]===1)count++;$('charge-count').textContent=count+' / 6';$('detonate').disabled=!count;
  if(performance.now()>toastUntil)$('toast').classList.remove('visible');
}
function frame(now){const dt=(now-last)/1000;last=now;if(!document.hidden)playback.tick(dt,input());const start=performance.now();view.render(dt,playback.sample());ui();
  metrics.frames.push({wall:now,ms:dt*1000,work:performance.now()-start,time:city.state[G.time],presentedTime:playback.time,ball:view.ball.position.toArray(),mode:playback.mode,speed:playback.holdSlow?.1:playback.speed,active:city.stats().active});if(metrics.frames.length>36000)metrics.frames.shift();requestAnimationFrame(frame);}
// Diagnostics expose the actual application, not an alternate simulation or visual demo.
window.playground={city,playback,view,metrics,ready:true,stats:()=>({...city.stats(),historyBytes:playback.history.bytes,frames:playback.history.end,branch:playback.history.branchCount,parts:view.parts.length,drawCalls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles}),
  environment:()=>{const gl=view.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),viewport:[innerWidth,innerHeight],devicePixelRatio,pixelRatio:view.renderer.getPixelRatio(),quality:view.quality,three:'0.180.0',seed:city.plan.seed};}};
ui();requestAnimationFrame(frame);
