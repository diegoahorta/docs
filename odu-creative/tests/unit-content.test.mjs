/**
 * Integridade do conteúdo de TODAS as unidades registradas em units/index.json:
 * questões válidas, áudio e tempos coerentes, jogo jogável, furigana completo (japonês).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validateQuestion, matchUtterance, articleErrors, evaluateQuestion, checkText } from '../js/core/evaluate.js';
import { validateTimings } from '../js/core/audio-sync.js';
import { plain, reading } from '../js/core/jp.js';

const root = new URL('../', import.meta.url).pathname;
const index = JSON.parse(readFileSync(root + 'units/index.json', 'utf8'));

for (const { id } of index) {
  const dir = `${root}units/${id}/`;
  const unit = JSON.parse(readFileSync(dir + 'unit.json', 'utf8'));
  const ja = unit.language.code === 'ja';
  const join = ja ? '' : ' ';
  const qIds = new Set(unit.questions.map((q) => q.id));
  const gIds = new Set(unit.grammar.map((g) => g.id));
  const all = [...unit.questions, ...unit.reviewItems];

  test(`[${id}] questões e itens de revisão são válidos e únicos`, () => {
    assert.deepEqual(all.flatMap(validateQuestion), []);
    assert.equal(new Set(all.map((q) => q.id)).size, all.length);
    for (const q of all) if (q.review) assert.ok(gIds.has(q.review), `${q.id}: review inexistente`);
  });

  test(`[${id}] a resposta-modelo de cada questão é aceita pelo corretor`, () => {
    for (const q of all) {
      const resp = { mcq: q.answer, tf: q.answer, gap: q.answers?.map((a) => a[0]), order: q.answers?.[0], transform: q.answers?.[0], match: q.pairs?.map((_, i) => i), produce: q.model }[q.type];
      assert.ok(evaluateQuestion(q, resp).correct, `${q.id} não aceita a própria resposta`);
    }
  });

  test(`[${id}] order: os blocos, na ordem certa, formam a resposta`, () => {
    for (const q of all.filter((x) => x.type === 'order')) {
      if (ja) {
        // existe uma ordem dos blocos que forma a resposta (comparação sem espaços/pontuação)
        const target = plain(q.answers[0]).replace(/[\s、。]/g, '');
        const pieces = q.tiles.map((t) => plain(t).replace(/[\s、。]/g, ''));
        assert.equal([...pieces].sort().join(''), [...pieces].sort().join(''));
        assert.equal(pieces.reduce((a, p) => a + p.length, 0), target.length, `${q.id}: blocos não cobrem a resposta`);
        for (const p of pieces) assert.ok(target.includes(p), `${q.id}: bloco “${p}” não está na resposta`);
      } else {
        const words = (s) => s.toLowerCase().replace(/[?.,!]/g, '').split(/\s+/).filter(Boolean).sort().join(' ');
        assert.equal(words(q.tiles.join(' ')), words(q.answers[0]), q.id);
      }
    }
    for (const r of unit.discover.reorder) {
      // a ordem original dos blocos do Discover já é a resposta
      assert.ok(checkText(r.tiles.join(join), [r.answer]), `discover: ${r.answer}`);
    }
  });

  test(`[${id}] faixas: arquivos existem, tempos válidos e coerentes com a duração real`, () => {
    for (const t of unit.tracks) {
      assert.ok(existsSync(dir + t.audio), t.audio);
      assert.deepEqual(validateTimings(t.segments), [], t.id);
      for (const qid of [...t.gist, ...t.detail]) assert.ok(qIds.has(qid), `${t.id}: questão ${qid}`);
      try {
        const d = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dir + t.audio]).toString());
        assert.ok(t.segments.at(-1).end <= d + 0.1, `${t.id}: último segmento além do fim do áudio`);
      } catch (e) { if (e.code !== 'ENOENT') throw e; } // ffprobe opcional
    }
  });

  test(`[${id}] questões com áudio apontam para segmentos existentes`, () => {
    for (const q of unit.questions.filter((x) => x.audio)) {
      const t = unit.tracks.find((x) => x.id === q.audio.track);
      assert.ok(t, q.id);
      for (const s of q.audio.segments) assert.ok(t.segments.some((x) => x.id === s), `${q.id}: ${s}`);
    }
  });

  test(`[${id}] Café Quest: uma resposta correta por fala, aceita no modo escrever; pagamentos coerentes`, () => {
    for (const m of unit.game.missions) {
      let spent = 0;
      for (const s of m.steps) {
        if (s.pay) { assert.ok(s.pay.options.includes(s.pay.amount)); spent += s.pay.amount; continue; }
        const ok = s.choices.filter((c) => c.ok);
        assert.equal(ok.length, 1, s.id);
        assert.ok(matchUtterance(plain(ok[0].text), s.match), `${s.id}: resposta correta não passa no modo escrever`);
        if (ja) assert.ok(matchUtterance(reading(ok[0].text), s.match), `${s.id}: resposta só em kana não passa`);
        else assert.equal(articleErrors(ok[0].text).length, 0, s.id);
      }
      assert.ok(spent <= m.budget, `${m.id}: gasta mais que o orçamento`);
    }
  });

  test(`[${id}] falas isoladas geradas existem em disco`, () => {
    for (const l of Object.values(unit.lines || {})) assert.ok(existsSync(dir + l.src), l.src);
  });

  if (ja) {
    test(`[${id}] todo kanji em texto para o aluno tem furigana (exceto questões de leitura de kanji)`, () => {
      const KANJI = /[㐀-鿿]/;
      const SKIP_KEYS = new Set(['currencySuffix', 'match', 'kickerTarget', 'hypothesisKeywords', 'references', 'sourceNote', 'labels', 'titleNative', 'assessment', 'teacherCriteria', 'npcLabel', 'placeholder', 'skillNames', 'lines', 'writePlaceholder', 'title', 'pattern', 'patternQuestion', 'patternsExtra']);
      const missing = [];
      const walk = (v, path, ctx) => {
        if (typeof v === 'string') {
          const outside = v.replace(/\{[^|{}]+\|[^|{}]+\}/g, '');
          if (KANJI.test(outside) && !ctx.noFurigana) missing.push(`${path}: ${v}`);
        } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, ctx));
        else if (v && typeof v === 'object') {
          const c = { noFurigana: ctx.noFurigana || v.noFurigana || v.examPart?.includes('表記') };
          for (const [k, x] of Object.entries(v)) if (!SKIP_KEYS.has(k) && k !== 'examPart') walk(x, `${path}.${k}`, c);
        }
      };
      walk(unit, 'unit', {});
      assert.deepEqual(missing, []);
    });

    test(`[${id}] marcação de furigana bem formada (sem chaves soltas)`, () => {
      const bad = [];
      JSON.stringify(unit, (k, v) => {
        if (typeof v === 'string' && /[{}]/.test(plain(v)) && !/^\{(item|choice|article)\}/.test(v) && !v.includes('{item}')) bad.push(v);
        return v;
      });
      assert.deepEqual(bad, []);
    });
  }

  if (id === 'en-a1-cafe') {
    test(`[${id}] preços do diálogo batem com o cardápio`, () => {
      const price = (pid, size) => { const it = unit.menu.sections.flatMap((s) => s.items).find((i) => i.id === pid); return size ? it.sizes[size] : it.price; };
      assert.equal(price('hot-chocolate', 'medium') + price('cheese-sandwich'), 7.5);
      assert.equal(price('orange-juice') + price('apple-pie'), 5.5);
    });
  }

  if (id === 'ja-n4-34') {
    test(`[${id}] preços do diálogo e das missões batem com o cardápio`, () => {
      const price = (pid, size) => { const it = unit.menu.sections.flatMap((s) => s.items).find((i) => i.id === pid); return size ? it.sizes[size] : it.price; };
      assert.equal(price('matcha-latte', 'M') + price('cheesecake'), 900); // faixa 1
      assert.equal(price('cocoa') + price('muffin'), 750); // missão 1
      assert.equal(price('cheese-sandwich') + price('orange-juice'), 830); // missão 2
      assert.equal(price('apple-pie') + price('apple-juice'), 800); // missão 3
    });
  }
}
