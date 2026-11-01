/** Integridade do conteúdo da unidade: questões válidas, áudio e tempos coerentes, jogo jogável. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validateQuestion, matchUtterance, articleErrors, evaluateQuestion } from '../js/core/evaluate.js';
import { validateTimings } from '../js/core/audio-sync.js';

const dir = new URL('../units/en-a1-cafe/', import.meta.url).pathname;
const unit = JSON.parse(readFileSync(dir + 'unit.json', 'utf8'));
const qIds = new Set(unit.questions.map((q) => q.id));
const gIds = new Set(unit.grammar.map((g) => g.id));

test('todas as questões e itens de revisão são válidos e únicos', () => {
  const all = [...unit.questions, ...unit.reviewItems];
  assert.deepEqual(all.flatMap(validateQuestion), []);
  assert.equal(new Set(all.map((q) => q.id)).size, all.length);
  for (const q of all) if (q.review) assert.ok(gIds.has(q.review), `${q.id}: review inexistente`);
});

test('a resposta-modelo de cada questão é aceita pelo corretor', () => {
  for (const q of [...unit.questions, ...unit.reviewItems]) {
    const resp = { mcq: q.answer, tf: q.answer, gap: q.answers?.map((a) => a[0]), order: q.answers?.[0], transform: q.answers?.[0], match: q.pairs?.map((_, i) => i), produce: q.model }[q.type];
    assert.ok(evaluateQuestion(q, resp).correct, `${q.id} não aceita a própria resposta`);
  }
});

test('order: os blocos formam a resposta esperada', () => {
  for (const q of [...unit.questions, ...unit.reviewItems].filter((x) => x.type === 'order')) {
    const words = (s) => s.toLowerCase().replace(/[?.,!]/g, '').split(/\s+/).filter(Boolean).sort().join(' ');
    assert.equal(words(q.tiles.join(' ')), words(q.answers[0]), q.id);
  }
});

test('faixas: arquivos existem, tempos válidos e coerentes com a duração real', () => {
  for (const t of unit.tracks) {
    assert.ok(existsSync(dir + t.audio), t.audio);
    assert.deepEqual(validateTimings(t.segments), [], t.id);
    for (const id of [...t.gist, ...t.detail]) assert.ok(qIds.has(id), `${t.id}: questão ${id}`);
    try {
      const d = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dir + t.audio]).toString());
      assert.ok(t.segments.at(-1).end <= d + 0.1, `${t.id}: último segmento além do fim do áudio`);
    } catch (e) { if (e.code !== 'ENOENT') throw e; } // ffprobe opcional
  }
});

test('questões com áudio apontam para segmentos existentes', () => {
  for (const q of unit.questions.filter((x) => x.audio)) {
    const t = unit.tracks.find((x) => x.id === q.audio.track);
    assert.ok(t, q.id);
    for (const s of q.audio.segments) assert.ok(t.segments.some((x) => x.id === s), `${q.id}: ${s}`);
  }
});

test('Café Quest: cada fala tem exatamente uma resposta correta, aceita na escrita e com artigos corretos', () => {
  for (const m of unit.game.missions) {
    for (const s of m.steps) {
      if (s.pay) { assert.ok(s.pay.options.includes(s.pay.amount)); assert.ok(s.pay.amount <= m.budget); continue; }
      const ok = s.choices.filter((c) => c.ok);
      assert.equal(ok.length, 1, s.id);
      assert.ok(matchUtterance(ok[0].text, s.match), `${s.id}: resposta correta não passa no modo escrever`);
      assert.equal(articleErrors(ok[0].text).length, 0, s.id);
    }
  }
});

test('preços do diálogo batem com o cardápio', () => {
  const price = (id, size) => { const it = unit.menu.sections.flatMap((s) => s.items).find((i) => i.id === id); return size ? it.sizes[size] : it.price; };
  assert.equal(price('hot-chocolate', 'medium') + price('cheese-sandwich'), 7.5);
  assert.equal(price('orange-juice') + price('apple-pie'), 5.5);
  assert.equal(price('orange-juice') + price('cookie'), 4);
});

test('falas isoladas geradas existem em disco', () => {
  for (const l of Object.values(unit.lines || {})) assert.ok(existsSync(dir + l.src), l.src);
});
