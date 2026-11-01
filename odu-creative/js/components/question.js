/**
 * Componente de questão reutilizável.
 * Tipos: mcq, tf, gap, order, transform, match, produce.
 * Ciclo: responder → verificar → feedback (acerto/erro + explicação) → tentar de novo /
 *        ver correção comentada → recomendação de revisão.
 */
import { h, clear, shuffle, announce } from '../core/dom.js';
import { evaluateQuestion } from '../core/evaluate.js';
import { success, gentleShake } from '../core/motion.js';

const STAGE_LABEL = { A: 'Reconhecimento', B: 'Compreensão', C: 'Manipulação', D: 'Produção', exam: 'Avaliação', listening: 'Escuta' };

export function renderQuestion(q, ctx, { module = 'practice', onDone, number } = {}) {
  let attempts = 0;
  let solved = false; // eslint-disable-line no-unused-vars
  let state = initialState(q);

  const root = h('article', { class: 'q', 'aria-labelledby': `q-${q.id}-p` });
  const head = h('div', { class: 'q-head' },
    h('span', { class: 'badge-tag' }, q.examPart || q.context || STAGE_LABEL[q.stage] || 'Questão'),
    number ? h('span', { class: 'small muted' }, number) : null);
  const prompt = h('div', { class: 'q-prompt', id: `q-${q.id}-p` }, q.prompt);
  const audioRow = q.audio ? audioButtons(q, ctx) : null;
  const body = h('div', { class: 'q-body' });
  const feedback = h('div', { 'aria-live': 'polite' });
  const checkBtn = h('button', { class: 'btn primary', onClick: check }, 'Verificar');
  const actions = h('div', { class: 'actions' }, checkBtn);
  root.append(head, prompt, audioRow, body, actions, feedback);
  drawBody();
  return root;

  function drawBody() {
    clear(body);
    body.append(renderBody(q, state, (s) => { state = s; }));
  }

  function check() {
    const response = responseOf(q, state);
    if (response === null) { announce('Responda antes de verificar.'); feedback.replaceChildren(h('p', { class: 'notice warn' }, 'Responda antes de verificar.')); return; }
    attempts += 1;
    const res = evaluateQuestion(q, response);
    ctx.record(q, res.correct, attempts, module);
    markBody(q, body, res, response);
    showFeedback(res, response);
    if (res.correct) { solved = true; checkBtn.disabled = true; success(root); onDone?.(true, attempts); }
    else gentleShake(root);
  }

  function showFeedback(res, response) {
    clear(feedback);
    const isProduce = q.type === 'produce';
    const kind = res.correct ? '' : isProduce && res.criteria.met > 0 ? 'partial' : 'wrong';
    const box = h('div', { class: `feedback ${kind}` });
    if (res.correct) {
      box.append(h('h4', {}, attempts === 1 ? '✓ Correto!' : '✓ Correto agora! Boa persistência.'), h('p', {}, q.explanation || ''));
    } else {
      box.append(h('h4', {}, isProduce ? 'Quase lá — confira os critérios' : 'Ainda não. Vamos pensar juntos.'));
      const why = q.type === 'mcq' && q.distractors?.[String(response)];
      if (why) box.append(h('p', {}, h('strong', {}, 'Por que não: '), why));
      if (!isProduce) box.append(h('p', {}, h('strong', {}, 'Dica: '), q.explanation || ''));
    }
    if (isProduce) {
      box.append(h('ul', { class: 'criteria' }, res.criteria.results.map((c) =>
        h('li', { class: c.ok ? 'ok' : 'no' }, c.label, c.optional ? ' (opcional)' : '', c.detail ? h('span', { class: 'small muted' }, ` — ${c.detail}`) : ''))));
      box.append(h('p', { class: 'small muted' }, 'A verificação automática confere apenas critérios objetivos. Criatividade e adequação são avaliadas pelo professor.'));
    }
    const actionsRow = h('div', { class: 'row' });
    if (!res.correct) {
      actionsRow.append(h('button', { class: 'btn small', onClick: () => { clear(feedback); state = initialState(q); drawBody(); body.querySelector('input,textarea,button')?.focus(); } }, '↺ Tentar novamente'));
      actionsRow.append(h('button', { class: 'btn small ghost', onClick: (e) => { e.target.replaceWith(correction()); } }, 'Ver correção comentada'));
    } else if (isProduce && q.model) {
      actionsRow.append(h('button', { class: 'btn small ghost', onClick: (e) => e.target.replaceWith(correction()) }, 'Comparar com um modelo'));
    }
    if (q.review) {
      const g = ctx.unit.grammar.find((x) => x.id === q.review);
      if (g) actionsRow.append(h('a', { class: 'btn small ghost', href: `#/grammar?g=${g.id}` }, `📘 Revisar: ${g.name}`));
    }
    box.append(actionsRow);
    feedback.append(box);
    announce(res.correct ? 'Resposta correta.' : 'Resposta ainda não correta. Veja a dica.');
  }

  function correction() {
    const ans = correctAnswerText(q);
    return h('div', { class: 'card soft', style: { marginTop: '8px' } },
      h('strong', {}, isModel() ? 'Modelo: ' : 'Resposta correta: '), h('span', { style: { whiteSpace: 'pre-line' } }, ans),
      h('p', { class: 'small', style: { marginTop: '6px' } }, q.explanation || ''),
      q.distractors ? h('ul', { class: 'small' }, Object.entries(q.distractors).map(([i, t]) => h('li', {}, `“${q.options[i]}”: ${t}`))) : null);
  }
  function isModel() { return q.type === 'produce'; }
}

function audioButtons(q, ctx) {
  const row = h('div', { class: 'row', style: { marginBottom: '10px' } });
  const play = async (rate) => {
    const track = ctx.unit.tracks.find((t) => t.id === q.audio.track);
    const { player } = await ctx.trackPlayer(track.id);
    if (!player) return announce('Áudio indisponível.');
    const idx = q.audio.segments.map((id) => track.segments.findIndex((s) => s.id === id)).filter((i) => i >= 0);
    player.setRate(rate);
    await player.playRange(Math.min(...idx), Math.max(...idx));
    player.setRate(1);
  };
  row.append(
    h('button', { class: 'btn small accent', onClick: () => play(1) }, '▶ Ouvir'),
    h('button', { class: 'btn small', onClick: () => play(0.75) }, '🐢 Mais devagar'));
  return row;
}

function initialState(q) {
  switch (q.type) {
    case 'mcq': case 'tf': return { choice: null };
    case 'gap': return { values: q.answers.map(() => '') };
    case 'order': return { bank: shuffle(q.tiles.map((t, i) => ({ t, i }))), picked: [] };
    case 'transform': case 'produce': return { text: '' };
    case 'match': return { picks: q.pairs.map(() => ''), rights: shuffle(q.pairs.map((p, i) => ({ text: p[1], i }))) };
    default: return {};
  }
}

function responseOf(q, s) {
  switch (q.type) {
    case 'mcq': case 'tf': return s.choice;
    case 'gap': return s.values.some((v) => !v.trim()) ? null : s.values;
    case 'order': return s.picked.length ? s.picked.map((p) => p.t).join(' ').replace(/\s+([?.!,])/g, '$1') : null;
    case 'transform': case 'produce': return s.text.trim() ? s.text : null;
    case 'match': return s.picks.some((p) => p === '') ? null : s.picks.map(Number);
    default: return null;
  }
}

function correctAnswerText(q) {
  switch (q.type) {
    case 'mcq': return q.options[q.answer];
    case 'tf': return q.answer ? 'Verdadeiro' : 'Falso';
    case 'gap': { let i = 0; return q.text.replace(/___/g, () => q.answers[i++][0]); }
    case 'order': case 'transform': return capitalize(q.answers[0]);
    case 'match': return q.pairs.map((p) => `${p[0]} → ${p[1]}`).join('\n');
    case 'produce': return q.model;
    default: return '';
  }
}
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function renderBody(q, s, set) {
  switch (q.type) {
    case 'mcq': {
      const group = h('div', { class: 'options', role: 'radiogroup', 'aria-labelledby': `q-${q.id}-p` });
      const btns = q.options.map((opt, i) => h('button', {
        class: 'btn opt', role: 'radio', 'aria-checked': String(s.choice === i), dataset: { i },
        onClick: () => { s.choice = i; btns.forEach((b, j) => b.setAttribute('aria-checked', String(i === j))); set(s); },
      }, opt));
      group.append(...btns);
      return group;
    }
    case 'tf': {
      const group = h('div', { class: 'options', role: 'radiogroup' });
      const opts = [[true, 'Verdadeiro'], [false, 'Falso']];
      const btns = opts.map(([v, label]) => h('button', {
        class: 'btn opt', role: 'radio', 'aria-checked': 'false', dataset: { v: String(v) },
        onClick: () => { s.choice = v; btns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === String(v)))); set(s); },
      }, label));
      group.append(...btns);
      return group;
    }
    case 'gap': {
      const parts = q.text.split('___');
      const wrap = h('p', { class: 'gap-text' });
      parts.forEach((part, i) => {
        wrap.append(part);
        if (i < parts.length - 1) wrap.append(h('input', {
          type: 'text', 'aria-label': `Lacuna ${i + 1}`, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', value: s.values[i],
          onInput: (e) => { s.values[i] = e.target.value; set(s); },
        }));
      });
      return wrap;
    }
    case 'order': {
      const answer = h('div', { class: 'tiles answer', 'aria-label': 'Sua frase (clique em um bloco para devolver)' });
      const bank = h('div', { class: 'tiles', 'aria-label': 'Blocos disponíveis (clique para adicionar)' });
      const draw = () => {
        clear(answer); clear(bank);
        if (!s.picked.length) answer.append(h('span', { class: 'muted small' }, 'Toque nos blocos na ordem certa…'));
        s.picked.forEach((p, k) => answer.append(h('button', { class: 'tile', 'aria-label': `Remover “${p.t}”`, onClick: () => { s.picked.splice(k, 1); s.bank.push(p); draw(); set(s); } }, p.t)));
        s.bank.forEach((p, k) => bank.append(h('button', { class: 'tile', 'aria-label': `Adicionar “${p.t}”`, onClick: () => { s.bank.splice(k, 1); s.picked.push(p); draw(); set(s); answer.lastElementChild?.focus(); } }, p.t)));
      };
      draw();
      return h('div', { class: 'stack' }, answer, bank);
    }
    case 'transform':
      return h('div', { class: 'stack' },
        h('p', {}, h('span', { class: 'muted' }, 'Frase original: '), h('strong', {}, q.source)),
        h('input', { type: 'text', 'aria-label': 'Sua frase', autocomplete: 'off', spellcheck: 'false', value: s.text, onInput: (e) => { s.text = e.target.value; set(s); } }));
    case 'produce': {
      const attrs = { 'aria-label': 'Sua resposta', spellcheck: 'false', onInput: (e) => { s.text = e.target.value; set(s); } };
      return q.multiline ? h('textarea', { ...attrs, rows: 6, placeholder: 'Mia: Hi! What would you like?\nMe: ...' }) : h('input', { ...attrs, type: 'text', autocomplete: 'off' });
    }
    case 'match': {
      const wrap = h('div', {});
      q.pairs.forEach((p, i) => {
        const sel = h('select', { 'aria-label': `Resposta para: ${p[0]}`, onChange: (e) => { s.picks[i] = e.target.value; set(s); } },
          h('option', { value: '' }, 'Escolha…'), s.rights.map((r) => h('option', { value: String(r.i) }, r.text)));
        wrap.append(h('div', { class: 'match-row', dataset: { i } }, h('strong', {}, p[0]), sel));
      });
      return wrap;
    }
    default:
      return h('p', {}, `Tipo não suportado: ${q.type}`);
  }
}

/** Marca visualmente certo/errado nas opções após a verificação. */
function markBody(q, body, res, response) {
  if (q.type === 'mcq') {
    body.querySelectorAll('.opt').forEach((b) => {
      b.classList.remove('correct', 'wrong');
      if (Number(b.dataset.i) === response) b.classList.add(res.correct ? 'correct' : 'wrong');
    });
  } else if (q.type === 'tf') {
    body.querySelectorAll('.opt').forEach((b) => {
      b.classList.remove('correct', 'wrong');
      if (b.dataset.v === String(response)) b.classList.add(res.correct ? 'correct' : 'wrong');
    });
  } else if (q.type === 'gap') {
    body.querySelectorAll('input').forEach((inp, i) => { inp.style.borderColor = res.perGap[i] ? 'var(--mint)' : 'var(--danger)'; });
  } else if (q.type === 'match') {
    body.querySelectorAll('.match-row select').forEach((sel, i) => { sel.style.borderColor = res.perPair[i] ? 'var(--mint)' : 'var(--danger)'; });
  }
}
