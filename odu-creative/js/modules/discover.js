/**
 * MÓDULO 2 — INTAKE: DISCOVER THE PATTERN.
 * Observação → destaque → perguntas indutivas → reorganização → hipótese → revelação gradual → THE RULE.
 */
import { h, clear, shuffle, announce } from '../core/dom.js';
import { award, addXP, XP } from '../core/gamify.js';
import { success, gentleShake } from '../core/motion.js';
import { checkText, normalize } from '../core/evaluate.js';
import { playLine } from '../core/speech.js';
import { tl, isJa, joiner } from '../core/text.js';

/** Junta os chunks em uma frase. Inglês: com espaço ("I" + "'d like"); japonês: sem espaço. */
export function chunksToText(chunks, join = ' ') {
  return chunks.map((c) => c[0]).join(join).replace(/\s+([,?.!])/g, '$1').replace(/ '/g, "'");
}

export function render(ctx) {
  const { unit, progress } = ctx;
  const d = unit.discover;
  const state = (progress.discover ||= { questions: {}, reorder: {}, revealed: 0 });
  const lang = unit.language.bcp47;
  const ja = isJa(unit);
  const T = (text, o) => tl(unit, text, { noRomaji: true, ...o });

  const updateProgress = () => {
    const parts = [
      Object.keys(state.questions).length / d.questions.length,
      Object.keys(state.reorder).length / d.reorder.length,
      progress.hypothesis?.trim() ? 1 : 0,
      state.revealed / d.ruleSteps.length,
    ];
    ctx.setModule('discover', parts.reduce((a, b) => a + b, 0) / parts.length);
    if (progress.hypothesis?.trim() && state.revealed >= d.ruleSteps.length) award(progress, 'detective');
    ctx.save();
  };

  /* 1. Observação com destaque opcional */
  const sentences = h('ol', { class: 'sentence-list', lang }, d.sentences.map((s) =>
    h('li', {}, s.chunks.map(([text, role], i) => [i && !ja && !/^[,.?!']/.test(text) ? ' ' : '', h('span', { class: 'chunk', dataset: { role } }, T(text))]),
      ' ', h('button', { class: 'btn small ghost', 'aria-label': 'Ouvir a frase', onClick: () => playLine(unit, chunksToText(s.chunks, joiner(unit))) }, '🔊'),
      ja ? tl(unit, chunksToText(s.chunks, ''), { cls: 'romaji-only' }) : null)));
  const legend = h('div', { class: 'legend', hidden: true }, d.chunkLegend.map((l) =>
    h('span', { class: 'chunk', dataset: { role: l.role } }, h('strong', {}, l.label), ` — ${l.pt}`)));
  const obsCard = h('section', { class: 'card' });
  const hlBtn = h('button', { class: 'btn', 'aria-pressed': 'false', onClick: () => {
    const on = !obsCard.classList.contains('highlight');
    obsCard.classList.toggle('highlight', on);
    legend.hidden = !on;
    hlBtn.setAttribute('aria-pressed', String(on));
    hlBtn.textContent = on ? 'Esconder destaques' : '🖍 Destacar elementos';
  } }, '🖍 Destacar elementos');
  obsCard.append(h('h2', {}, '1. Observe'), h('p', {}, d.intro), sentences,
    h('div', { class: 'row', style: { marginTop: '10px' } }, hlBtn), legend,
    h('p', { class: 'small muted' }, 'Leia primeiro sem destaque. O que se repete? O que muda? Depois ative o destaque e compare.'));

  /* 2. Perguntas indutivas */
  const qCard = h('section', { class: 'card' }, h('h2', {}, '2. Compare e descubra'));
  d.questions.forEach((q, qi) => {
    const fb = h('div', { 'aria-live': 'polite' });
    const box = h('div', { class: 'q' }, h('p', { class: 'q-prompt' }, `${qi + 1}. `, T(q.prompt)));
    const opts = h('div', { class: 'options' }, q.options.map((o, i) => h('button', { class: 'btn opt', onClick: (e) => {
      if (i === q.answer) {
        e.currentTarget.classList.add('correct');
        clear(fb).append(h('div', { class: 'feedback' }, h('p', {}, '✓ ', T(q.feedback))));
        if (!state.questions[q.id]) { state.questions[q.id] = true; addXP(progress, XP.firstTry); }
        success(box); updateProgress();
      } else {
        e.currentTarget.classList.add('wrong');
        clear(fb).append(h('div', { class: 'feedback wrong' }, h('p', {}, 'Observe as frases de novo — ative o destaque se precisar.')));
        gentleShake(box);
      }
    } }, T(o))));
    box.append(opts, fb);
    qCard.append(box);
  });

  /* 3. Reorganize os blocos */
  const rCard = h('section', { class: 'card' }, h('h2', {}, '3. Monte as frases'), h('p', { class: 'small muted' }, 'Toque nos blocos na ordem certa. Toque de novo em um bloco colocado para devolvê-lo.'));
  d.reorder.forEach((r, ri) => {
    let picked = [];
    let bank = shuffle(r.tiles.map((t, i) => ({ t, i })));
    const ans = h('div', { class: 'tiles answer', lang });
    const bk = h('div', { class: 'tiles', lang });
    const fb = h('div', { 'aria-live': 'polite' });
    const draw = () => {
      clear(ans); clear(bk);
      picked.forEach((p, k) => ans.append(h('button', { class: 'tile', onClick: () => { picked.splice(k, 1); bank.push(p); draw(); } }, T(p.t))));
      bank.forEach((p, k) => bk.append(h('button', { class: 'tile', onClick: () => { bank.splice(k, 1); picked.push(p); draw(); } }, T(p.t))));
    };
    draw();
    const check = () => {
      const sentence = picked.map((p) => p.t).join(joiner(unit));
      if (checkText(sentence, [r.answer])) {
        clear(fb).append(h('div', { class: 'feedback' }, '✓ ', tl(unit, r.answer)));
        if (!state.reorder[ri]) { state.reorder[ri] = true; addXP(progress, XP.firstTry); }
        updateProgress();
      } else clear(fb).append(h('div', { class: 'feedback wrong' }, `Ainda não. ${d.reorderHint || 'Lembre: fórmula de pedido → a/an → item.'}`));
    };
    rCard.append(h('div', { class: 'q' }, h('p', { class: 'q-prompt' }, `Frase ${ri + 1}`), h('div', { class: 'stack' }, ans, bk),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary small', onClick: check }, 'Verificar')), fb));
  });

  /* 4. Hipótese */
  const hyp = h('textarea', { id: 'hyp', 'aria-describedby': 'hyp-help', placeholder: d.hypothesisPlaceholder || 'Ex.: Acho que usamos “an” quando…  Para pedir, as frases começam com…' }, progress.hypothesis || '');
  const saved = h('span', { class: 'small muted', 'aria-live': 'polite' });
  hyp.addEventListener('input', () => { progress.hypothesis = hyp.value; saved.textContent = 'Salvo neste dispositivo.'; ctx.save(); });
  hyp.addEventListener('change', updateProgress);
  const hCard = h('section', { class: 'card' }, h('h2', {}, '4. Sua hipótese'),
    h('label', { for: 'hyp', class: 'field' }, d.hypothesisPrompt || 'Com suas palavras (em português): como se faz um pedido? Quando usamos a e quando usamos an?'),
    h('p', { id: 'hyp-help', class: 'small muted' }, 'Não existe resposta errada aqui. Escrever a hipótese ajuda você a perceber a regra.'), hyp, saved);

  /* 5. Revelação gradual + comparação */
  const steps = h('div', {});
  const compare = h('div', {});
  const revealBtn = h('button', { class: 'btn accent', onClick: () => reveal(state.revealed + 1) });
  const ruleCard = h('section', { class: 'card', 'aria-labelledby': 'rule-title' },
    h('h2', { id: 'rule-title' }, unit.labels?.rule || 'THE RULE'),
    ...[d.pattern, d.patternQuestion, ...(d.patternsExtra || [])].filter(Boolean).map((pat, k) =>
      h('div', { class: 'formula', 'aria-label': 'Padrão', style: { marginTop: k ? '8px' : '0' } }, pat.flatMap((p, i) => (i ? [h('b', { 'aria-hidden': 'true' }, '+'), h('span', {}, T(p))] : [h('span', {}, T(p))])))),
    h('div', { style: { marginTop: '12px' } }, steps), h('div', { class: 'row' }, revealBtn), compare,
    h('div', { class: 'row end' }, h('a', { class: 'btn primary', href: '#/grammar' }, 'Aprofundar no Grammar Lab →')));

  function reveal(n) {
    if (n > 1 && !progress.hypothesis?.trim() && state.revealed === 0) {
      announce('Escreva sua hipótese antes de revelar a regra.');
    }
    state.revealed = Math.min(n, d.ruleSteps.length);
    clear(steps).append(...d.ruleSteps.slice(0, state.revealed).map((t, i) => h('div', { class: 'rule-step' }, h('strong', {}, `Passo ${i + 1}. `), T(t))));
    revealBtn.textContent = state.revealed === 0 ? '💡 Revelar o 1º passo da regra' : state.revealed < d.ruleSteps.length ? '💡 Revelar o próximo passo' : '✓ Regra completa';
    revealBtn.disabled = state.revealed >= d.ruleSteps.length;
    if (state.revealed >= d.ruleSteps.length) drawCompare();
    updateProgress();
  }

  function drawCompare() {
    const text = normalize(progress.hypothesis || '');
    clear(compare).append(h('div', { class: 'card soft', style: { marginTop: '12px' } },
      h('h3', {}, 'Sua hipótese × a regra'),
      text ? h('blockquote', { style: { margin: '0 0 8px', fontStyle: 'italic' } }, progress.hypothesis) : h('p', { class: 'muted' }, 'Você ainda não escreveu uma hipótese. Volte ao passo 4 — vale a pena!'),
      h('ul', { class: 'criteria' }, d.hypothesisKeywords.map((k) => {
        const ok = k.any.some((w) => text.includes(w));
        return h('li', { class: ok ? 'ok' : 'no' }, k.label);
      })),
      h('p', { class: 'small muted' }, 'Esta comparação procura palavras-chave na sua hipótese e serve só como guia. Releia e ajuste sua hipótese se quiser.')));
  }

  reveal(state.revealed);

  return h('div', {},
    h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Módulo 2 · Intake'), h('h1', {}, unit.labels?.discover || 'DISCOVER THE PATTERN'),
      h('p', {}, 'Antes de receber a explicação, você vai investigar. Compare frases, encontre o que se repete e crie sua própria regra.')),
    obsCard, qCard, rCard, hCard, ruleCard);
}
