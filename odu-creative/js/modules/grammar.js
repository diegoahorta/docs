/**
 * MÓDULO 3 — GRAMMAR LAB.
 * Para cada estrutura: nome, função, forma, tabela, exemplos (afirm./neg./interr.) com tradução e áudio,
 * comparação, erros frequentes, uso, pronúncia e verificação rápida.
 * Recursos por idioma (furigana/romaji, pinyin, formalidade) entram via campos opcionais do JSON
 * (ver docs/ADICIONAR-UNIDADES.md); esta unidade de inglês usa notas de pronúncia/fonologia.
 */
import { h } from '../core/dom.js';
import { playLine } from '../core/speech.js';
import { renderQuestion } from '../components/question.js';
import { award } from '../core/gamify.js';

const TYPE_LABEL = { affirmative: 'Afirmativa', negative: 'Negativa', interrogative: 'Interrogativa' };

export function render(ctx, params) {
  const { unit, progress } = ctx;
  const open = params.get('g');
  const checks = (progress.grammarChecks ||= {});
  const lang = unit.language.bcp47;
  let showPt = true;

  const ptToggle = h('button', { class: 'btn small', 'aria-pressed': 'true', onClick: () => {
    showPt = !showPt;
    ptToggle.setAttribute('aria-pressed', String(showPt));
    document.querySelectorAll('.ex-pt').forEach((el) => (el.hidden = !showPt));
  } }, 'Traduções');

  const cards = unit.grammar.map((g) => {
    const checkQ = { id: `chk-${g.id}`, type: 'mcq', stage: 'A', skills: [g.id], prompt: g.check.prompt, options: g.check.options, answer: g.check.answer, explanation: g.check.explanation };
    const det = h('details', { class: 'card', id: g.id, open: open ? open === g.id : g.id === unit.grammar[0].id },
      h('summary', {}, h('span', {}, g.name, checks[g.id] ? ' ✓' : '')),
      h('p', {}, h('span', { class: 'badge-tag' }, 'Função comunicativa'), ' ', g.function),
      h('div', { class: 'formula', style: { margin: '8px 0 12px' } }, h('span', {}, g.form)),
      h('p', {}, g.explanation),
      g.table ? h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, g.table.headers.map((x) => h('th', { scope: 'col' }, x)))),
        h('tbody', {}, g.table.rows.map((r) => h('tr', {}, r.map((c, i) => (i === 0 ? h('th', { scope: 'row' }, c) : h('td', { lang: i === 2 ? lang : null }, c)))))))) : null,
      h('h3', { style: { marginTop: '16px' } }, 'Exemplos'),
      h('div', { class: 'stack' }, g.examples.map((ex) => h('div', { class: 'card soft', style: { margin: 0, padding: '10px 12px' } },
        h('div', { class: 'row between' }, h('span', { class: 'badge-tag accent' }, TYPE_LABEL[ex.type] || ex.type),
          h('button', { class: 'btn small ghost', 'aria-label': `Ouvir: ${ex.en}`, onClick: () => playLine(unit, ex.en) }, '🔊')),
        h('div', { lang, style: { fontSize: '1.1rem', fontWeight: 650 } }, ex.en),
        h('div', { class: 'ex-pt muted', lang: 'pt-BR' }, ex.pt)))),
      g.comparison ? h('div', { class: 'notice', style: { marginTop: '12px' } }, h('strong', {}, `⚖ ${g.comparison.title}: `), g.comparison.text) : null,
      h('h3', {}, 'Erros frequentes'),
      g.commonErrors.map((e) => h('div', { class: 'err-pair' },
        h('span', {}, '✗ ', h('span', { class: 'wrong', lang }, e.wrong)),
        h('span', {}, '✓ ', h('span', { class: 'right', lang }, e.right)),
        h('span', { class: 'small' }, e.why))),
      h('h3', {}, 'Uso e contexto'), h('p', {}, g.usage),
      g.pronunciation ? h('div', { class: 'notice' }, h('strong', {}, '🗣 Pronúncia: '), g.pronunciation) : null,
      g.romaji || g.pinyin || g.furigana ? h('p', { class: 'small muted' }, 'Este idioma possui recursos de leitura adicionais nesta estrutura.') : null,
      h('h3', {}, 'Verificação rápida'),
      renderQuestion(checkQ, ctx, { module: 'grammar', onDone: (ok, attempts) => {
        checks[g.id] = true;
        ctx.setModule('grammar', Object.keys(checks).length / unit.grammar.length);
        if (unit.grammar.every((x) => checks[x.id])) award(progress, 'grammar-lab');
        ctx.save();
      } }));
    return det;
  });

  return h('div', {},
    h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Módulo 3 · Intake'), h('h1', {}, 'Grammar Lab'),
      h('p', {}, 'Explore cada estrutura da unidade: forma, função, exemplos com áudio, erros comuns e dicas de pronúncia.'),
      h('div', { class: 'row' }, ptToggle, h('a', { class: 'btn small ghost', href: '#/discover' }, '← Voltar ao Discover'))),
    ...cards,
    h('div', { class: 'row end' }, h('a', { class: 'btn primary', href: '#/practice' }, 'Ir para a Practice Zone →')));
}
