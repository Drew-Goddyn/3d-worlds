import { City, DT, G, N, P } from './world.js';

// A read-only sample between physical records. Discrete state comes from the
// earlier record; only continuing identities can move between those records.
export class Presentation {
  constructor(city) {
    this.city = city;
    this.next = new Float64Array(city.state.length);
    this.state = new Float64Array(city.state.length);
    this.forecast = new City(city.plan, city.capacity,city);
    this.version = -1;
  }
  sample(history, fraction, input=null) {
    const a = this.city.state, b = this.next, out = this.state;
    const alpha = Math.max(0, Math.min(1, fraction));
    out.set(a);
    if (!alpha) return out; // Recorded moments retain every bit, including -0.
    const inputKey=JSON.stringify(input);
    if (this.version !== history.version || inputKey!==this.inputKey) {
      b.set(a);
      if (history.cursor < history.end) {
        // Group equal-time records in order. Motion fields interpolate toward
        // the complete next moment; discrete fields stay at the earlier moment.
        let nextTime=null;
        for (let i = history.cursor + 1; i <= history.end; i++) {
          const f = history.frames[i];
          if(nextTime!==null&&f.time>nextTime+1e-9)break;
          history.applyTo(b,f);
          if (f.time > a[G.time] + 1e-9) nextTime=f.time;
        }
      } else {
        // Deterministic one-step lookahead supplies live interpolation without
        // publishing effects, consuming history, or moving the physical cursor.
        this.forecast.state.set(a); this.forecast.events.length = 0;
        if(input)this.forecast.action(input);this.forecast.step(); b.set(this.forecast.state);
      }
      this.version = history.version;this.inputKey=inputKey;
    }
    const lerp = i => { out[i] = a[i] + (b[i] - a[i]) * alpha; };
    for (const i of [G.time,G.angle,G.length,G.bx,G.by,G.bz,G.bvx,G.bvy,G.bvz]) lerp(i);
    for (const n of this.city.plan.nodes) {
      const o = this.city.no(n.id);
      for (let k = 0; k < 12; k++) lerp(o + k);
    }
    for (let i = 0; i < this.city.capacity; i++) {
      const o = this.city.po(i);
      if (!a[o+P.active] || !b[o+P.active] || a[o+P.id] !== b[o+P.id]) continue;
      for (let k = 0; k < 12; k++) lerp(o+k);
      lerp(o+P.age);
    }
    // The tank is one persistent body, even when its shell has ruptured.
    if (this.city.tankBase !== undefined) for (let k=0;k<12;k++) lerp(this.city.tankBase+k);
    return out;
  }
}
