import test from 'node:test';
import assert from 'node:assert/strict';
import { History } from '../src/history.js';

test('retains a full minute after prolonged recording and interpolates every seek', () => {
  const history = new History(60);
  for (let n = 0; n <= 4000; n++) history.record(n / 20, { position: n / 10, velocity: -2 });
  assert.ok(history.duration >= 60, `Only ${history.duration} seconds retained`);
  assert.ok(history.length <= 1202);
  assert.equal(history.end, 200);
  assert.equal(history.start, 140);
  const sample = history.sample(173.123);
  const position = sample.a.position + (sample.b.position - sample.a.position) * sample.alpha;
  assert.ok(Math.abs(position - 346.246) < 1e-10);
  assert.equal(history.sample(-10).a.position, 280);
  assert.equal(history.sample(900).a.position, 400);
});

test('branching removes the abandoned disaster without losing earlier replay', () => {
  const history = new History(60);
  for (let n = 0; n <= 200; n++) history.record(n / 20, { version: 'original', n });
  history.truncate(4.02);
  assert.equal(history.end, 4);
  history.record(4.05, { version: 'branch', n: 999 });
  assert.equal(history.sample(99).a.version, 'branch');
  assert.equal(history.sample(3).a.version, 'original');
  assert.equal(history.length, 82);
  history.clear();
  assert.equal(history.sample(2), null);
});
