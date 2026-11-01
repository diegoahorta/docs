/**
 * MÓDULO 4 — PRACTICE ZONE.
 * Etapas graduadas A (reconhecimento) → B (compreensão) → C (manipulação) → D (produção) + Avaliação.
 * Ao final de cada etapa: resultado, meta da unidade e recomendações de revisão por competência.
 */
import { h, clear, progressBar, tabs } from '../core/dom.js';
import { renderQuestion } from '../components/question.js';
import { award, addXP, XP } from '../core/gamify.js';
import { skillName } from '../core/unit-loader.js';

const STAGES = [
  { id: 'A', label: 'A · Reconhecer', intro: 'Reconheça formas, significados e estruturas.' },
  { id: 'B', label: 'B · Compreender', intro: 'Ouça trechos e escolha a informação ou resposta adequada.' },
  { id: 'C', label: 'C · Manipular', intro: 'Complete, organize, transforme e associe.' },
  { id: 'D', label: 'D · Produzir', intro: 'Escreva suas próprias frases em situações reais.' },
  { id: 'exam', label: '📝 Avaliação', intro: '' },
];

export function render(ctx, params) {
  const { unit, progress } = ctx;
  const results = (progress.practice ||= {}); // { stage: { qid: firstTryCorrect } }
  const initial = Math.max(0, STAGES.findIndex((s) => s.id === params.get('stage')));

  const t = tabs(STAGES.map((s) => ({ id: `stage-${s.id}`, label: s.label + (stageDone(s.id) ? ' ✓' : ''), render: () => stageView(s) })), { initial, label: 'Etapas da prática' });

  function stageQuestions(id) { return unit.questions.filter((q) => q.stage === id); }
  function stageDone(id) { const qs = stageQuestions(id); return qs.length && qs.every((q) => q.id in (results[id] || {})); }

  function stageView(s) {
    const qs = stageQuestions(s.id);
    const r = (results[s.id] ||= {});
    const wrap = h('div', {});
    const bar = h('div', {});
    const summary = h('div', { 'aria-live': 'polite' });
    const drawBar = () => clear(bar).append(progressBar(Object.keys(r).length / qs.length, `Etapa ${s.label}`), h('p', { class: 'small muted' }, `${Object.keys(r).length} de ${qs.length} concluídas`));
    drawBar();
    const intro = s.id === 'exam'
      ? h('div', { class: 'notice' }, h('strong', {}, `Referência: ${unit.assessment.reference}. `), unit.assessment.note)
      : h('p', { class: 'muted' }, s.intro);
    wrap.append(intro, bar);
    qs.forEach((q, i) => wrap.append(renderQuestion(q, ctx, {
      module: 'practice', number: `${i + 1}/${qs.length}`,
      onDone: (ok, attempts) => {
        if (!(q.id in r)) r[q.id] = attempts === 1;
        drawBar();
        updateModule();
        if (Object.keys(r).length === qs.length) finish(s, qs, r, summary);
        ctx.save();
      },
    })));
    wrap.append(summary);
    if (Object.keys(r).length === qs.length && qs.length) finish(s, qs, r, summary, true);
    return wrap;
  }

  function updateModule() {
    const all = unit.questions.filter((q) => q.stage !== 'listening');
    const done = all.filter((q) => q.id in (results[q.stage] || {})).length;
    ctx.setModule('practice', done / all.length);
    if (['A', 'B', 'C', 'D'].every(stageDone)) award(progress, 'practice-a-d');
  }

  function finish(s, qs, r, el, silent = false) {
    const first = qs.filter((q) => r[q.id]).length;
    const ratio = first / qs.length;
    const goal = unit.config?.passThreshold ?? 0.7;
    const weak = new Map();
    qs.filter((q) => !r[q.id]).forEach((q) => (q.skills || []).forEach((k) => weak.set(k, (weak.get(k) || 0) + 1)));
    if (!silent) addXP(progress, XP.stage);
    if (s.id === 'exam' && ratio >= goal) award(progress, 'exam-ready');
    clear(el).append(h('section', { class: 'card', style: { borderColor: ratio >= goal ? 'var(--mint)' : 'var(--accent)' } },
      h('h3', {}, ratio >= goal ? '🎉 Etapa concluída — meta atingida!' : '✓ Etapa concluída — vamos reforçar alguns pontos'),
      h('p', {}, `Acertos na 1ª tentativa: ${first} de ${qs.length} (${Math.round(ratio * 100)}%). Meta da unidade: ${Math.round(goal * 100)}%.`),
      weak.size ? h('div', {}, h('p', {}, h('strong', {}, 'Recomendação de revisão:')),
        h('ul', {}, [...weak.entries()].map(([k, n]) => {
          const g = unit.grammar.find((x) => x.id === k);
          return h('li', {}, `${skillName(unit, k)} (${n} questão${n > 1 ? 'ões' : ''})`, g ? [' — ', h('a', { href: `#/grammar?g=${g.id}` }, 'rever no Grammar Lab')] : '');
        })),
        h('p', { class: 'small muted' }, 'Essas competências entram com prioridade na Revisão espaçada.')) : h('p', {}, 'Nenhum ponto fraco detectado nesta etapa. 👏'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onClick: () => { results[s.id] = {}; ctx.save(); t.select(STAGES.indexOf(s)); } }, '↺ Refazer etapa'),
        STAGES.indexOf(s) < STAGES.length - 1 ? h('button', { class: 'btn primary', onClick: () => t.select(STAGES.indexOf(s) + 1) }, 'Próxima etapa →') : h('a', { class: 'btn primary', href: '#/speaking' }, 'Speaking Studio →'))));
  }

  return h('div', {},
    h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Módulo 4 · Output'), h('h1', {}, 'Practice Zone'),
      h('p', {}, 'Do reconhecimento à produção. Errar faz parte: cada resposta traz explicação, correção comentada e chance de tentar de novo.')),
    t.el);
}
