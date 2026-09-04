/** A bounded, ordered history. Snapshots are owned by the recorder, never mutated. */
export class History {
  constructor(seconds = 60) {
    this.seconds = seconds;
    this.frames = [];
    this.head = 0;
  }

  record(time, state) {
    if (!Number.isFinite(time)) throw new TypeError('History time must be finite');
    if (this.length && time < this.end - 1e-8) this.truncate(time);
    if (this.length && Math.abs(time - this.end) < 1e-8) {
      this.frames[this.frames.length - 1] = { time, state };
      return;
    }
    this.frames.push({ time, state });
    const cutoff = time - this.seconds;
    // Keep the sample immediately preceding the cutoff for interpolation.
    while (this.head + 1 < this.frames.length && this.frames[this.head + 1].time <= cutoff) this.head++;
    if (this.head > 256 && this.head > this.frames.length / 3) {
      this.frames = this.frames.slice(this.head);
      this.head = 0;
    }
  }

  sample(time) {
    if (!this.length) return null;
    if (time <= this.start) {
      const first = this.frames[this.head];
      return { a: first.state, b: first.state, alpha: 0, time: first.time, timeA: first.time, timeB: first.time, aTime: first.time, bTime: first.time };
    }
    if (time >= this.end) {
      const last = this.frames[this.frames.length - 1];
      return { a: last.state, b: last.state, alpha: 0, time: last.time, timeA: last.time, timeB: last.time, aTime: last.time, bTime: last.time };
    }
    let lo = this.head, hi = this.frames.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.frames[mid].time <= time) lo = mid;
      else hi = mid;
    }
    const a = this.frames[lo], b = this.frames[hi];
    return { a: a.state, b: b.state, alpha: (time - a.time) / (b.time - a.time), time, timeA: a.time, timeB: b.time, aTime: a.time, bTime: b.time };
  }

  truncate(time) {
    while (this.frames.length > this.head && this.frames[this.frames.length - 1].time > time + 1e-8) this.frames.pop();
    if (this.frames.length === this.head) this.clear();
  }

  clear() { this.frames = []; this.head = 0; }
  get start() { return this.length ? this.frames[this.head].time : 0; }
  get end() { return this.length ? this.frames[this.frames.length - 1].time : 0; }
  get length() { return this.frames.length - this.head; }
  get duration() { return this.end - this.start; }
}
