// Presentation records own their randomness and never draw from structural RNG.
// Each snapshot retains live births, including births before the history cutoff.
export const EVENT_LIFE = 9;
// Record capacity is distinct from the fixed visual and audio draw budgets.
export const EVENT_LIMIT = 1536;
export const eventLife=e=>e.type==='motion'?2.4:e.type==='release'?3.4:e.type==='contact'?5.6:e.type==='blast'?4.4:7.5;
const soundTypes = new Set(['blast','impact','collapse','contact','release','water']);
export function eventRandom(seed, channel=0) {
  let x=(seed ^ Math.imul(channel+1,0x9e3779b9))>>>0;
  x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);
  return ((x^(x>>>15))>>>0)/4294967296;
}
export class EventTrack {
  constructor(){this.events=[];this.serial=0;this.suppressed=0;this.prunedAt=-Infinity;}
  prune(time){if(time===this.prunedAt)return;this.prunedAt=time;this.events=this.events.filter(e=>time-e.time<eventLife(e));}
  emit(type,point,time,extras={}) {
    if(!soundTypes.has(type)&&type!=='dust'&&type!=='motion')return;
    this.prune(time);
    const material=extras.material||'stone',cell=[point.x,point.y,point.z].map(v=>Math.floor(v/4));
    const key=type==='blast'?null:`${type}:${material}:${Math.floor(time/.15)}:${cell}`;
    const index=key?this.events.findIndex(e=>e.key===key):-1,old=this.events[index];
    const power=Math.min(180,extras.power??(type==='collapse'?45:12)),mass=Math.min(200,extras.mass??1);
    if(old){
      // Replace an immutable aggregate; earlier snapshots still own the old value.
      this.events[index]=Object.freeze({...old,power:Math.min(180,Math.hypot(old.power,power)),mass:Math.min(200,old.mass+mass),count:old.count+1});
      return this.events[index];
    }
    // Saturation drops new minor presentation work, never a still-visible birth.
    if(this.events.length>=(type==='blast'?EVENT_LIMIT:EVENT_LIMIT-16)){this.suppressed++;return;}
    const id=++this.serial,seed=(Math.imul(id,2654435761)^Math.round(time*1000))>>>0;
    const event=Object.freeze({id,key,seed,time,type,material,x:point.x,y:point.y,z:point.z,power,mass,soundMass:mass,count:1,spread:Math.min(5,extras.spread??1),speed:extras.speed??0,nx:extras.nx??0,nz:extras.nz??0,vx:extras.vx??0,vy:extras.vy??0,vz:extras.vz??0});
    this.events.push(event);return event;
  }
  capture(){return Object.freeze({serial:this.serial,suppressed:this.suppressed,events:Object.freeze(this.events.slice())});}
  restore(state){this.prunedAt=-Infinity;this.serial=state?.serial??0;this.suppressed=state?.suppressed??0;this.events=state?.events.slice()||[];}
}
export function presentationEvents(a,b,time) {
  if(!b)return a.filter(e=>e.time<=time&&time-e.time<eventLife(e));
  const merged=new Map(a.map(e=>[e.id,e]));
  for(const e of b)if(e.time<=time)merged.set(e.id,e);
  return [...merged.values()].filter(e=>e.time<=time&&time-e.time<eventLife(e));
}
// Shared transport policy is independent of an AudioContext and directly tested.
export class EventTransport {
  constructor(){this.reset();}
  reset(){this.time=null;this.mode=null;this.rate=null;}
  advance(events,time,mode,rate=1) {
    const changed=mode!==this.mode||rate!==this.rate;
    const discontinuity=this.time===null||changed||(mode==='forward'&&time<this.time)||(mode==='reverse'&&time>this.time)||Math.abs(time-this.time)>1;
    const from=this.time;this.time=time;this.mode=mode;this.rate=rate;
    if(discontinuity||!['forward','reverse'].includes(mode))return {stop:true,events:[]};
    const crossed=events.filter(e=>soundTypes.has(e.type)&&(mode==='forward'?e.time>from&&e.time<=time:e.time<=from&&e.time>time));
    // The same deterministic event choices in live play and retained replay.
    return {stop:false,events:crossed.sort((a,b)=>mode==='forward'?a.time-b.time:b.time-a.time)};
  }
}
