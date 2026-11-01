import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, checkText, checkGaps, expectedArticle, articleErrors, checkCriteria, matchUtterance, wordDiff, evaluateQuestion, validateQuestion } from '../js/core/evaluate.js';

test('normalize trata apóstrofos tipográficos e espaços', () => {
  assert.equal(normalize('  I’d   like  A cookie ,  please. '), "i'd like a cookie, please.");
});

test('checkText ignora ponto final mas respeita palavras', () => {
  assert.ok(checkText('Can I have an apple juice', ['can i have an apple juice?'].map((s) => s.replace('?', ''))));
  assert.ok(checkText("I'd like a cookie.", ["i'd like a cookie"]));
  assert.ok(!checkText('I like a cookie.', ["i'd like a cookie"]));
});

test('checkGaps avalia cada lacuna', () => {
  assert.deepEqual(checkGaps(['an', 'A'], [['an'], ['a']]), { correct: true, perGap: [true, true] });
  assert.equal(checkGaps(['a', 'a'], [['an'], ['a']]).correct, false);
});

test('expectedArticle usa o som inicial, com exceções', () => {
  assert.equal(expectedArticle('orange'), 'an');
  assert.equal(expectedArticle('cookie'), 'a');
  assert.equal(expectedArticle('hour'), 'an');
  assert.equal(expectedArticle('university'), 'a');
  assert.equal(expectedArticle('egg'), 'an');
});

test('articleErrors encontra a/an errados', () => {
  assert.deepEqual(articleErrors('Can I have a orange juice and an cookie?').map((e) => e.word), ['orange', 'cookie']);
  assert.equal(articleErrors("I'd like a large orange juice").length, 0);
});

test('checkCriteria (produção) separa critérios obrigatórios e opcionais', () => {
  const criteria = [
    { label: 'pedido', pattern: "\\b(i'?d like|can i have)\\b" },
    { label: 'artigos', check: 'articles' },
    { label: 'please', pattern: '\\bplease\\b', optional: true },
  ];
  const ok = checkCriteria("I'd like an orange juice.", criteria);
  assert.equal(ok.correct, true);
  assert.equal(ok.results[2].ok, false);
  const bad = checkCriteria('I want a orange juice', criteria);
  assert.equal(bad.correct, false);
  assert.equal(bad.met, 0);
});

test('matchUtterance aceita variações e exige termos obrigatórios', () => {
  const m = { all: ['hot chocolate'], any: ["i'd like", 'can i have'] };
  assert.ok(matchUtterance('Hi, I would like a hot chocolate please', m));
  assert.ok(matchUtterance('id like a hot chocolate', m));
  assert.ok(!matchUtterance('hot chocolate', m));
  assert.ok(!matchUtterance("I'd like a milkshake", m));
});

test('wordDiff marca palavras reconhecidas', () => {
  const d = wordDiff('Can I have a cookie?', 'can I have cookie');
  assert.deepEqual(d.map((x) => x.hit), [true, true, true, false, true]);
});

test('evaluateQuestion cobre os tipos', () => {
  assert.ok(evaluateQuestion({ type: 'mcq', answer: 1 }, 1).correct);
  assert.ok(evaluateQuestion({ type: 'tf', answer: false }, false).correct);
  assert.ok(evaluateQuestion({ type: 'order', answers: ['How much is it?'] }, 'How much is it?').correct);
  assert.ok(evaluateQuestion({ type: 'match', pairs: [['a', 'b'], ['c', 'd']] }, [0, 1]).correct);
  assert.ok(!evaluateQuestion({ type: 'match', pairs: [['a', 'b'], ['c', 'd']] }, [1, 0]).correct);
});

test('validateQuestion aponta problemas de estrutura', () => {
  assert.equal(validateQuestion({ id: 'x', prompt: 'p', skills: ['s'], type: 'mcq', options: ['a', 'b'], answer: 0 }).length, 0);
  assert.ok(validateQuestion({ id: 'x', prompt: 'p', skills: ['s'], type: 'gap', text: '___ e ___', answers: [['a']] }).length > 0);
});
