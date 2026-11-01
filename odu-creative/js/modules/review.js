/**
 * MÓDULO 7 — REVISÃO ESPAÇADA.
 * Painel por competência (Ainda não dominado / Em desenvolvimento / Consolidado), intervalos ajustáveis
 * e desafio de revisão com itens em NOVOS contextos.
 */
import { h, clear } from '../core/dom.js';
import { classify, dueSkills, pickReviewItems, STATUS_LABELS, DAY } from '../core/srs.js';
import { allSkills, skillName } from '../core/unit-loader.js';
import { renderQuestion } from '../components/question.js';
import { award, addXP, XP } from '../core/gamify.js';

const FACTORS = [[0.5, 'Mais frequente'], [1, 'Padrão'], [1.5, 'Mais espaçada']];

export function render(ctx) {
  const { unit, progress } = ctx;
  const cfg = { consolidateAfter: unit.config?.consolidateAfter ?? 3 };
  const root = h('div', {});
  const dash = h('section', { class: 'card' });
  const challenge = h('section', {});

  function when(due) {
    const d = Math.ceil((due - Date.now()) / DAY);
    return d <= 0 ? 'hoje' : d === 1 ? 'amanhã' : `em ${d} dias`;
  }

  function drawDash() {
    const skills = allSkills(unit);
    const counts = [0, 0, 0];
    const rows = skills.map((k) => {
      const s = progress.srs[k];
      const st = classify(s, cfg);
      counts[st]++;
      return h('div', { class: 'skill-row' },
        h('div', {}, h('strong', {}, skillName(unit, k)),
          h('div', { class: 'small muted' }, s ? `${s.correct} acertos · ${s.wrong} erros · próxima revisão ${when(s.due)}` : 'Ainda não praticado')),
        h('span', { class: `small status-${st}`, style: { fontWeight: 800 } }, STATUS_LABELS[st]));
    });
    const due = dueSkills(progress.srs).length;
    const factor = ctx.settings.srsFactor || 1;
    clear(dash).append(
      h('div', { class: 'row between' }, h('h2', {}, 'Seu domínio'), h('span', { class: 'badge-tag accent' }, `${due} para revisar`)),
      h('div', { class: 'row small' }, STATUS_LABELS.map((l, i) => h('span', { class: `badge-tag ${['danger', '', 'mint'][i]}` }, `${l}: ${counts[i]}`))),
      ...rows,
      h('fieldset', { style: { marginTop: '12px' } }, h('legend', {}, 'Intervalo das revisões'),
        h('div', { class: 'row' }, FACTORS.map(([f, label]) => h('button', { class: 'btn small', 'aria-pressed': String(factor === f), onClick: () => { ctx.setSettings({ srsFactor: f }); drawDash(); } }, label))),
        h('p', { class: 'small muted' }, `Intervalos atuais (dias após acertos seguidos): ${ctx.intervals().join(', ')}. Um erro traz a competência de volta para hoje.`)),
    );
  }

  function startChallenge() {
    const recent = progress.attempts.slice(-30).map((a) => a.qid);
    const items = pickReviewItems({ reviewItems: unit.reviewItems || [], questions: unit.questions, srs: progress.srs, recentIds: recent, size: 5 });
    clear(challenge);
    if (!items.length) {
      challenge.append(h('div', { class: 'card' }, h('p', {}, 'Ainda não há o que revisar. Pratique primeiro na Practice Zone ou no Listening — as competências aparecem aqui automaticamente.')));
      return;
    }
    let done = 0;
    challenge.append(h('h2', {}, '🔁 Desafio de revisão'), h('p', { class: 'muted' }, 'As mesmas estruturas, em situações novas.'));
    items.forEach((q, i) => challenge.append(renderQuestion(q, ctx, {
      module: 'review', number: `${i + 1}/${items.length}`,
      onDone: () => {
        done++;
        if (done === items.length) {
          progress.reviewSessions = (progress.reviewSessions || 0) + 1;
          addXP(progress, XP.review);
          award(progress, 'reviewer');
          ctx.setModule('review', Math.min(1, progress.reviewSessions / 3));
          drawDash();
          challenge.append(h('div', { class: 'card' }, h('h3', {}, '✓ Revisão concluída!'), h('p', {}, 'Volte nos próximos dias: o sistema agenda a próxima revisão conforme seu desempenho.'),
            h('button', { class: 'btn', onClick: startChallenge }, 'Novo desafio')));
        }
      },
    })));
    challenge.scrollIntoView?.({ behavior: 'smooth' });
  }

  drawDash();
  root.append(
    h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Módulo 7 · Review'), h('h1', {}, 'Revisão espaçada'),
      h('p', {}, 'O sistema registra suas respostas, identifica onde você tem mais dificuldade e propõe revisões no momento certo — em contextos diferentes, para você não decorar as questões.'),
      h('button', { class: 'btn primary', onClick: startChallenge }, '▶ Começar desafio de revisão')),
    dash, challenge);
  return root;
}
