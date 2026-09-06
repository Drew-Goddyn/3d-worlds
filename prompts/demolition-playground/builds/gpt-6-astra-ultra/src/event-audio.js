import {EventTransport,eventRandom as random} from './event-track.js';
const MAX_VOICES=12;
// Editable, locally synthesized material voices. Buffers are cached, never
// downloaded, and synthesis never consumes the structural random generator.
export function synthesizeVoice(type,material,variant,sampleRate=24000) {
  const glass=material==='glass',metal=material==='steel',wood=material==='wood';
  const blast=type==='blast',release=type==='release',collapse=type==='collapse';
  const duration=blast?1.05:glass?.85:metal?1.3:collapse?1.25:release?.45:.85;
  const data=new Float32Array(Math.ceil(duration*sampleRate));let low=0,previous=0;
  const seed=variant*8171+1987,pitch=.9+random(seed,2)*.2;
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate,n=random(seed,i)*2-1;low+=.075*(n-low);const high=n-previous;previous=n;
    const attack=Math.min(1,t/.003);let value=0;
    if(blast){
      const phase=2*Math.PI*(57*t+23*(1-Math.exp(-t*10))/10);
      value=.44*Math.sin(phase)*Math.exp(-t*7)+low*2.8*Math.exp(-t*6)+high*.09*Math.exp(-t*45);
    }else if(glass||metal){
      const base=(glass?1120:185)*pitch,freqs=glass?[1,1.57,2.31,3.73]:[1,2.27,3.86,5.31];
      for(let j=0;j<freqs.length;j++)value+=Math.sin(t*base*freqs[j]*Math.PI*2+variant)*Math.exp(-t*(glass?8+j*3:3+j*2))*(glass?.11:.14)/(1+j*.6);
      value+=high*(glass?.06:.025)*Math.exp(-t*28);
    }else{
      const base=(wood?145:84)*pitch;
      value=(Math.sin(t*base*Math.PI*2)*.21+Math.sin(t*base*1.73*Math.PI*2)*.08)*Math.exp(-t*(release?19:9));
      const grainTime=Math.floor(t*31),pulse=Math.exp(-(t*31-grainTime)*8)*(0.3+random(seed,grainTime+100)*.7);
      value+=(low*1.5+high*.035)*pulse*Math.exp(-t*(collapse?2.8:5));
      if(collapse)value+=low*.65*Math.sin(Math.min(1,t/.22)*Math.PI/2)*Math.exp(-t*3);
    }
    data[i]=Math.max(-.85,Math.min(.85,value*attack*Math.min(1,(duration-t)*20)));
  }
  return data;
}
export class EventAudio {
  constructor(){this.transport=new EventTransport();this.enabled=false;this.level=.35;this.voices=new Set();this.cache=new Map();this.started=0;this.peakVoices=0;}
  async enable(value){
    this.enabled=value;this.stop();this.transport.reset();
    if(!value)return;
    if(!this.context){
      const ac=this.context=new (window.AudioContext||window.webkitAudioContext)();
      this.master=ac.createGain();this.master.gain.value=this.level;
      this.limiter=ac.createDynamicsCompressor();this.limiter.threshold.value=-14;this.limiter.knee.value=10;this.limiter.ratio.value=8;this.limiter.attack.value=.003;this.limiter.release.value=.12;
      this.master.connect(this.limiter).connect(ac.destination);
    }
    await this.context.resume();
  }
  setLevel(value){this.level=Math.max(0,Math.min(1,value));if(this.master)this.master.gain.setTargetAtTime(this.level,this.context.currentTime,.02);if(!this.level)this.stop();}
  stop(){for(const v of this.voices){v.source.onended=null;try{v.source.stop();}catch{}v.source.disconnect();v.gain.disconnect();v.filter.disconnect();v.pan.disconnect();}this.voices.clear();}
  discontinuity(){this.stop();this.transport.reset();this.previousEvents=[];}
  buffer(event,reverse){
    const variant=event.seed%8,key=`${event.type}:${event.material}:${variant}:${reverse}`;
    if(this.cache.has(key))return this.cache.get(key);
    let samples=synthesizeVoice(event.type,event.material,variant);
    if(reverse)samples=samples.slice().reverse();
    const buffer=this.context.createBuffer(1,samples.length,24000);buffer.copyToChannel(samples,0);
    if(this.cache.size>=192)this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key,buffer);return buffer;
  }
  update(events,time,mode,rate,camera){
    const available=mode==='reverse'?[...new Map([...(this.previousEvents||[]),...events].map(e=>[e.id,e])).values()]:events;
    const batch=this.transport.advance(available,time,mode,rate);this.previousEvents=events;
    if(batch.stop)this.stop();
    if(!this.enabled||!this.level||!this.context||this.context.state!=='running')return;
    for(const e of batch.events){
      if(e.type==='release'&&(e.seed%3!==0||e.material==='paper'))continue;
      // A finite voice budget admits the important pressure/impact gestures.
      // Quiet releases never evict a blast or contact already sounding.
      if(this.voices.size>=MAX_VOICES){if(e.type==='release')continue;const first=[...this.voices].find(v=>v.type==='release')||this.voices.values().next().value;first.source.stop();this.remove(first);}
      const ac=this.context,reverse=mode==='reverse',source=ac.createBufferSource(),gain=ac.createGain(),filter=ac.createBiquadFilter(),pan=ac.createStereoPanner();
      const buffer=this.buffer(e,reverse);source.buffer=buffer;
      const playback=reverse?.72:rate<1?.42:1;source.playbackRate.value=playback;
      const dx=e.x-camera.position.x,dy=e.y-camera.position.y,dz=e.z-camera.position.z,distance=Math.hypot(dx,dy,dz);
      const rightX=camera.matrixWorld.elements[0],rightZ=camera.matrixWorld.elements[2];
      pan.pan.value=Math.max(-.85,Math.min(.85,(dx*rightX+dz*rightZ)/Math.max(8,distance)));
      filter.type='lowpass';filter.frequency.value=Math.max(1800,14000/(1+distance/25));filter.Q.value=.5;
      const weight=e.type==='blast'?.8:e.type==='collapse'?.24:e.type==='release'?.075:Math.min(.46,.06+Math.sqrt(e.soundMass??e.mass)*.035+e.speed*.015);
      gain.gain.value=weight*(1/(1+Math.max(0,distance-15)/55))*(reverse?.28:1);
      source.connect(filter).connect(gain).connect(pan).connect(this.master);
      const voice={source,filter,gain,pan,type:e.type};this.voices.add(voice);source.onended=()=>this.remove(voice);
      // A crossed event starts at its elapsed offset, never as a queued backlog.
      const offset=reverse?0:Math.max(0,(time-e.time)*playback/rate);
      if(offset>=buffer.duration){this.remove(voice);continue;}
      source.start(ac.currentTime,offset);this.started++;this.peakVoices=Math.max(this.peakVoices,this.voices.size);
    }
  }
  remove(v){v.source.disconnect();v.filter.disconnect();v.gain.disconnect();v.pan.disconnect();this.voices.delete(v);}
  get stats(){return {enabled:this.enabled,level:this.level,voices:this.voices.size,peakVoices:this.peakVoices,voiceLimit:MAX_VOICES,cachedBuffers:this.cache.size,started:this.started,context:this.context?.state||'uncreated',queued:0};}
}
