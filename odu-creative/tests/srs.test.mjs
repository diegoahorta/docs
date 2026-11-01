import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateSkill, classify, dueSkills, pickReviewItems, DAY } from '../js/core/srs.js';

const now = Date.UTC(2026, 0, 1);

test('acertos sobem de caixa e agendam com intervalos crescentes', () => {
  let s = updateSkill(undefined, true, { now, intervals: [1, 2, 4] });
  assert.equal(s.box, 1);
  assert.equal(s.due, now + 1 * DAY);
  s = updateSkill(s, true, { now, intervals: [1, 2, 4] });
  assert.equal(s.due, now + 2 * DAY);
});

test('erro volta para a caixa 0 e revisão no mesmo dia', () => {
  let s = updateSkill(undefined, true, { now });
  s = updateSkill(s, false, { now });
  assert.equal(s.box, 0);
  assert.equal(s.due, now);
});

test('classify: não dominado → em desenvolvimento → consolidado', () => {
  assert.equal(classify(undefined), 0);
  let s = updateSkill(undefined, false, { now });
  assert.equal(classify(s), 0);
  s = updateSkill(s, true, { now });
  s = updateSkill(s, true, { now });
  assert.equal(classify(s), 1);
  for (let i = 0; i < 4; i++) s = updateSkill(s, true, { now });
  assert.equal(classify(s, { consolidateAfter: 3 }), 2);
});

test('dueSkills ordena as mais frágeis primeiro', () => {
  const srs = { a: { box: 2, due: now - 1 }, b: { box: 0, due: now - 1 }, c: { box: 1, due: now + DAY } };
  assert.deepEqual(dueSkills(srs, now), ['b', 'a']);
});

test('pickReviewItems prioriza novos contextos das skills vencidas e evita repetidos', () => {
  const srs = { 'g-a-an': { box: 0, due: now - 1 }, other: { box: 3, due: now + 9 * DAY } };
  const reviewItems = [{ id: 'r1', skills: ['g-a-an'] }, { id: 'r2', skills: ['g-a-an'] }, { id: 'r3', skills: ['other'] }];
  const questions = [{ id: 'q1', stage: 'A', skills: ['g-a-an'] }];
  const items = pickReviewItems({ reviewItems, questions, srs, recentIds: ['r1'], now, size: 2, rnd: () => 0 });
  assert.deepEqual(items.map((i) => i.id), ['r2', 'q1']); // r1 foi visto há pouco: fica por último
});
