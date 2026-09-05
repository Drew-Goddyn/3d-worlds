// Recording-only bridge. This module is copied into temporary, hash-pinned builds.
export function attachComparison(c) {
  const {THREE:T,scene}=c;
  const nativeCamera=c.camera,camera=nativeCamera.clone(),controls={target:c.controls.target.clone()};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const vector=a=>new T.Vector3(...a);
  const packBox=b=>({min:b.min.toArray(),max:b.max.toArray()});
  const box=v=>new T.Box3(vector(v.min),vector(v.max));
  scene.updateMatrixWorld(true);
  const pristine=c.describe();
  let previewShot="overview",calibration=null,chapter=null,zero=0,end=null,eventCursor=0,lastRaw=null,disposed=false;
  const events=[],frames=[],markers=[],errors=[];
  const marker=document.createElement('div');
  marker.style.cssText='position:fixed;left:0;top:0;width:64px;height:64px;z-index:2147483647;pointer-events:none;display:none;background:#ff00ff';
  document.body.append(marker);
  let markerPhase='off';
  function mark(phase){if(phase===markerPhase)return;markerPhase=phase;marker.style.display=phase==='live'?'none':'block';marker.style.background=phase==='end'?'#00ffff':'#ff00ff';markers.push({phase,now:performance.now(),epoch:performance.timeOrigin+performance.now()});}
  function basis(az=45){const a=(az+(pristine.frontAzimuthDegrees??0))*Math.PI/180,e=Math.PI/6;const outward=new T.Vector3(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e));const right=new T.Vector3(Math.cos(a),0,-Math.sin(a));const up=new T.Vector3().crossVectors(outward,right);return {outward,right,up};}
  function corners(b){const out=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])out.push(new T.Vector3(x,y,z));return out;}
  function fit(bounds,angles,parts=[bounds]){const b=box(bounds),center=b.getCenter(new T.Vector3()),safe={left:.15,right:.85,top:.14,bottom:.78};
    const n={left:2*(safe.left+.028)-1,right:2*(safe.right-.028)-1,top:1-2*(safe.top+.0256),bottom:1-2*(safe.bottom-.0256)};
    const tan=Math.tan(Math.PI/8),aspect=16/9;
    const points=parts.flatMap(p=>corners(box(p)));
    function ranges(d){let xmin=-Infinity,xmax=Infinity,ymin=-Infinity,ymax=Infinity;
      for(const a of angles){const {outward,right,up}=basis(a);const pos=center.clone().addScaledVector(outward,d);for(const q of points){const rel=q.clone().sub(pos),depth=-rel.dot(outward);if(depth<=camera.near)return null;const x=rel.dot(right),y=rel.dot(up);xmin=Math.max(xmin,x-n.right*depth*tan*aspect);xmax=Math.min(xmax,x-n.left*depth*tan*aspect);ymin=Math.max(ymin,y-n.top*depth*tan);ymax=Math.min(ymax,y-n.bottom*depth*tan);}}
      return xmin<=xmax&&ymin<=ymax?{x:(xmin+xmax)/2,y:(ymin+ymax)/2}:null;
    }
    let lo=1,hi=500;if(!ranges(hi))throw Error('No framing solution');for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(ranges(mid))hi=mid;else lo=mid;}
    return {bounds,parts,center:center.toArray(),distance:hi*1.00001,offset:ranges(hi*1.00001),safeRect:safe,verticalFov:45,elevation:30,angles};
  }
  function pose(profile,az){const {outward,right,up}=basis(az),d=profile.distance,center=vector(profile.center),pos=center.clone().addScaledVector(outward,d),tan=Math.tan(Math.PI/8);const rows=corners(box(profile.bounds)).map(q=>{const v=q.sub(pos);return {x:v.dot(right),y:v.dot(up),depth:-v.dot(outward)};});
    function centered(axis,factor,wanted){let lo=-500,hi=500;for(let i=0;i<45;i++){const mid=(lo+hi)/2,values=rows.map(r=>(r[axis]-mid)/(r.depth*factor)),value=(Math.min(...values)+Math.max(...values))/2;if(value>wanted)lo=mid;else hi=mid;}return (lo+hi)/2;}
    const target=center.addScaledVector(right,centered('x',tan*16/9,0)).addScaledVector(up,centered('y',tan,.08));return {target,position:target.clone().addScaledVector(outward,d)};}

  function apply(shot='overview',az=45,blend=1){if(!calibration)return;let p=pose(calibration.shots[shot],az);if(blend<1){const o=pose(calibration.shots.overview,45);p={target:o.target.lerp(p.target,blend),position:o.position.lerp(p.position,blend)};}camera.fov=45;camera.aspect=16/9;camera.up.set(0,1,0);camera.position.copy(p.position);controls.target.copy(p.target);camera.lookAt(p.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);}
  function projected(p){const q=p.clone().project(camera);return {x:(q.x+1)*960,y:(1-q.y)*540,depth:q.z};}
  function chooseTargets(){apply();scene.updateMatrixWorld(true);const targets={};for(const key of ['bank','warehouse','glass-tower']){
      if(c.automaticCharges){targets[key]={nativeAutomatic:true};continue;}
      const candidates=[],rejected=[];
      for(const support of c.supports(key)){
        const b=box(support.bounds),center=b.getCenter(new T.Vector3());
        for(const fraction of [.05,.1,.2,.3,.4,.5,.6,.7,.8,.9,.95])for(const face of ['x','z']){
          const p=center.clone();p.y=b.min.y+(b.max.y-b.min.y)*fraction;p[face]=camera.position[face]>center[face]?b.max[face]:b.min[face];
          const screen=projected(p);if(screen.x<288||screen.x>1632||screen.y<151||screen.y>842)continue;
          const hit=c.hit(screen);if(!hit||!c.matches(support,hit)){rejected.push({support:support.key,hit:hit?c.hitIdentity(hit):null,point:hit?.point.toArray()});continue;}
          candidates.push({key:support.key,point:hit.point.toArray(),screen,building:key,score:Math.hypot(screen.x-projected(vector(pristine.facadeCenters[key])).x,screen.y-projected(vector(pristine.facadeCenters[key])).y),native:c.hitIdentity(hit)});
        }
      }
      candidates.sort((a,b)=>a.score-b.score||a.key.localeCompare(b.key));if(!candidates.length)throw Error(`No visible structural target for ${key}: ${JSON.stringify(rejected.slice(0,8))}`);targets[key]=candidates[0];
    }return targets;}
  function dispatch(action,extra={}){const before=c.observe(),at=performance.now();try{const result=c.action(action,calibration,extra);events.push({action,planned:extra.planned??null,actual:(at-zero)/1000,epoch:performance.timeOrigin+at,before,after:c.observe(),result:result??null});}catch(error){errors.push({action,message:error.message,actual:(at-zero)/1000});throw error;}}
  const api={
    camera,ready:()=>true,inspect:()=>clone(pristine),
    calibrate(){const overview=pristine.bounds;const envelope=c.swingEnvelope(pristine);const ballBox=box(pristine.craneBounds).union(box(pristine.bankBounds)).union(box(envelope));calibration={version:1,front:pristine.front,right:pristine.right,frontAzimuthDegrees:pristine.frontAzimuthDegrees,swingEnvelope:envelope,shots:{overview:fit(overview,Array.from({length:21},(_,i)=>45+i)),ball:fit(packBox(ballBox),[45])},targets:{},bankPoint:pristine.bankPoint};apply();calibration.targets=chooseTargets();return clone(calibration);},
    load(value){calibration=clone(value);apply();},
    view(shot='overview'){previewShot=shot;apply(shot);scene.updateMatrixWorld(true);c.renderer.render(scene,camera);return {position:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov,targets:calibration.targets,projectedBounds:corners(box(calibration.shots[shot].bounds)).map(projected)};},
    checkCharges(){dispatch('charges.prepareSet');if(!c.automaticCharges)for(const key of ['bank','warehouse','glass-tower'])dispatch('charge.place',{target:key});const charges=c.observe().charges;if(charges.length!==3)throw Error(`Expected three charges, got ${charges.length}`);return {charges,markers:c.chargePoints().map(p=>({point:p.toArray(),screen:projected(p)}))};},
    arm(spec){if(!calibration)throw Error('Calibration required');chapter=clone(spec);previewShot='overview';zero=performance.now()+1000;eventCursor=0;end=null;events.length=frames.length=markers.length=errors.length=0;mark('pre');return {zero,epochZero:performance.timeOrigin+zero};},
    beforeFrame(now){const rawDelta=lastRaw===null?null:now-lastRaw;lastRaw=now;if(!chapter)return;frames.push({now,rawDelta,epoch:performance.timeOrigin+now,receipt:performance.now(),nativeCamera:{position:nativeCamera.position.toArray(),target:c.controls.target.toArray(),fov:nativeCamera.fov}});const t=(now-zero)/1000;if(t<0)return;if(t>=chapter.durationSeconds){if(end===null){end=now;mark('end');}return;}mark('live');
      try{c.tick?.(t,calibration);while(eventCursor<chapter.events.length&&chapter.events[eventCursor].at<=t){const e=chapter.events[eventCursor++];if(e.action.startsWith('camera.'))continue;dispatch(e.action,{...e,planned:e.at});}}
      catch(error){if(!errors.some(e=>e.message===error.message))errors.push({message:error.message,actual:t});}
    },
    beforeRender(){if(!calibration||disposed)return;const t=chapter?(performance.now()-zero)/1000:0;let az=45,shot=previewShot,blend=1;if(chapter?.id==='city'){const u=Math.max(0,Math.min(1,(t-2)/4));az=45+20*u*u*(3-2*u);}if(chapter?.id==='ball'){shot='ball';const u=Math.max(0,Math.min(1,t/2));blend=u*u*(3-2*u);}apply(shot,az,blend);},
    receipts:()=>clone({events,frames,markers,errors,zero,epochZero:performance.timeOrigin+zero,end,done:end!==null,observation:c.observe(),camera:{position:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov}}),
    dispose(){disposed=true;marker.remove();}
  };
  window.__comparison=api;return api;
}
