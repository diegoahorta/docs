import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segmentAt, lastStartedAt, validateTimings, parseVTT, toVTT } from '../js/core/audio-sync.js';

const segs = [{ start: 0.4, end: 2 }, { start: 2.6, end: 4 }, { start: 4.6, end: 6 }];

test('segmentAt encontra o segmento ativo e os silêncios', () => {
  assert.equal(segmentAt(segs, 0.1), -1);
  assert.equal(segmentAt(segs, 0.4), 0);
  assert.equal(segmentAt(segs, 2.3), -1);
  assert.equal(segmentAt(segs, 3), 1);
  assert.equal(segmentAt(segs, 5.99), 2);
  assert.equal(segmentAt(segs, 6), -1);
  assert.equal(lastStartedAt(segs, 2.3), 0);
});

test('validateTimings detecta sobreposição e intervalos inválidos', () => {
  assert.deepEqual(validateTimings(segs), []);
  assert.equal(validateTimings([{ start: 1, end: 0.5 }]).length, 1);
  assert.equal(validateTimings([{ start: 0, end: 2 }, { start: 1, end: 3 }]).length, 1);
});

test('WebVTT ida e volta', () => {
  const vtt = toVTT([{ start: 0.4, end: 2.25, text: 'Hi!', speaker: 'Mia' }, { start: 62.5, end: 64, text: 'Thanks!' }]);
  const cues = parseVTT(vtt);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 0.4);
  assert.equal(cues[1].start, 62.5);
  assert.equal(cues[0].text, '<v Mia>Hi!');
  assert.equal(parseVTT('1\n00:00:01,500 --> 00:00:02,000\nSRT ok')[0].start, 1.5);
});
