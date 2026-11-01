/**
 * MÓDULO 1 — INPUT: Compreensão auditiva em 4 etapas.
 * 1) Escuta global (sem texto) → 2) Informações específicas → 3) Texto sincronizado → 4) Repetição e shadowing.
 */
import { h, clear, announce } from '../core/dom.js';
import { createPlayerUI } from '../components/player.js';
import { renderQuestion } from '../components/question.js';
import { playLine } from '../core/speech.js';
import { award, addXP, XP } from '../core/gamify.js';
import { tl, plainText, jaControls } from '../core/text.js';

const STAGES = [
  { key: 's1', title: '1. Escuta global', sub: 'Sem transcrição' },
  { key: 's2', title: '2. Informações', sub: 'Detalhes específicos' },
  { key: 's3', title: '3. Texto sincronizado', sub: 'Acompanhe a leitura' },
  { key: 's4', title: '4. Shadowing', sub: 'Repita os trechos' },
];

export function render(ctx, params) {
  const { unit, progress } = ctx;
  let trackIdx = Math.max(0, unit.tracks.findIndex((t) => t.id === params.get('track')));
  let stageIdx = 0;
  const root = h('div', {});
  const head = h('header', { class: 'page-head' },
    h('div', { class: 'eyebrow' }, 'Módulo 1 · Input'),
    h('h1', {}, 'Listening'),
    h('p', {}, 'Escute em etapas: primeiro a ideia geral, depois os detalhes, então o texto sincronizado e, por fim, repita os trechos.'),
    jaControls(ctx));
  const trackTabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Faixas' });
  const body = h('div', {});
  root.append(head, trackTabs, body);

  const st = (tid) => (progress.listening[tid] ||= {});
  function drawTabs() {
    clear(trackTabs).append(...unit.tracks.map((t, i) => h('button', {
      class: 'btn small', role: 'tab', 'aria-selected': String(i === trackIdx),
      onClick: () => { trackIdx = i; stageIdx = firstOpen(unit.tracks[i]); drawTabs(); draw(); },
    }, `${i + 1}. `, tl(unit, t.title, { noRomaji: true }))));
  }
  function firstOpen(track) {
    const s = st(track.id);
    const i = STAGES.findIndex((x) => !s[x.key]);
    return i < 0 ? 0 : i;
  }

  async function draw() {
    ctx.disposePlayers();
    const track = unit.tracks[trackIdx];
    const s = st(track.id);
    clear(body);
    const stepper = h('div', { class: 'stepper', role: 'group', 'aria-label': 'Etapas de escuta' }, STAGES.map((x, i) =>
      h('button', { class: `btn ${s[x.key] ? 'done' : ''}`, 'aria-current': i === stageIdx ? 'step' : null, 'aria-pressed': String(i === stageIdx),
        onClick: () => { stageIdx = i; draw(); } }, h('span', {}, x.title), h('small', {}, x.sub))));
    const situation = h('section', { class: 'card soft' },
      h('div', { class: 'grid two' },
        h('div', {}, h('h3', {}, '📍 Situação'), h('p', {}, track.situation)),
        h('div', {}, h('h3', {}, '🎯 Objetivo de compreensão'), h('p', {}, track.goal))),
      h('h3', {}, '🧰 Vocabulário de apoio'),
      h('div', { class: 'vocab-chips' }, vocabFor(track).map((v) => h('button', { class: 'chip', onClick: () => playLine(unit, v.audioText || v.term.split(' / ')[0]) },
        '🔊 ', tl(unit, v.term, { noRomaji: true }), h('small', {}, v.pt)))));
    body.append(stepper, situation);
    const stage = h('div', {});
    body.append(stage);
    await STAGE_RENDER[stageIdx](stage, track, s);
  }

  function complete(track, key) {
    const s = st(track.id);
    if (!s[key]) { s[key] = true; addXP(progress, XP.stage); }
    const doneTracks = unit.tracks.filter((t) => STAGES.every((x) => st(t.id)[x.key])).length;
    const totalStages = unit.tracks.length * STAGES.length;
    const doneStages = unit.tracks.reduce((a, t) => a + STAGES.filter((x) => st(t.id)[x.key]).length, 0);
    ctx.setModule('listening', doneStages / totalStages);
    if (STAGES.every((x) => s[x.key])) award(progress, 'good-ears');
    if (doneTracks) ctx.save();
    ctx.save();
  }

  function questionsBlock(track, ids, key, onAll) {
    const qs = ids.map((id) => unit.questions.find((q) => q.id === id)).filter(Boolean);
    const solved = new Set();
    return h('div', {}, qs.map((q, i) => renderQuestion(q, ctx, {
      module: 'listening', number: `${i + 1}/${qs.length}`,
      onDone: () => { solved.add(q.id); if (solved.size === qs.length) { complete(track, key); announce('Etapa concluída!'); onAll?.(); } },
    })));
  }

  function nextBtn(label = 'Próxima etapa →') {
    return h('button', { class: 'btn primary', onClick: () => { stageIdx = Math.min(stageIdx + 1, STAGES.length - 1); draw(); } }, label);
  }

  const STAGE_RENDER = [
    // 1. Escuta global
    async (el, track) => {
      el.append(h('div', { class: 'notice' }, 'Primeira escuta: ouça o diálogo inteiro SEM ler. Não se preocupe em entender tudo — procure a ideia geral. Depois responda.'));
      const ui = await createPlayerUI(ctx, track, { transcript: 'none', allowToggle: false });
      el.append(ui.el, h('h2', {}, 'Ideia geral'), questionsBlock(track, track.gist, 's1', () => el.append(nextBtn())));
    },
    // 2. Informações específicas
    async (el, track) => {
      el.append(h('div', { class: 'notice' }, 'Segunda escuta: agora procure informações específicas. Use ▶ Ouvir em cada questão para repetir só o trecho necessário.'));
      const ui = await createPlayerUI(ctx, track, { transcript: 'none', allowToggle: false });
      el.append(ui.el, h('h2', {}, 'Detalhes'), questionsBlock(track, track.detail, 's2', () => el.append(nextBtn())));
    },
    // 3. Texto sincronizado
    async (el, track) => {
      el.append(h('div', { class: 'notice' }, 'Terceira escuta: acompanhe o texto. O trecho falado fica destacado. Clique em ▶ ao lado de uma fala para ouvi-la de novo. A tradução é opcional.'));
      const done = h('p', { class: 'small muted' }, 'Ouça até o fim para concluir esta etapa.');
      const ui = await createPlayerUI(ctx, track, { transcript: 'visible', onEnded: () => { complete(track, 's3'); clear(done).append('✓ Etapa concluída! ', nextBtn()); } });
      el.append(ui.el, done);
    },
    // 4. Shadowing
    async (el, track) => {
      el.append(h('div', { class: 'notice' }, 'Quarta etapa: repita cada fala. No modo “Ouvir e repetir”, o áudio pausa depois de cada frase para você falar em voz alta. Depois tente o shadowing: fale JUNTO com o áudio.'));
      const ui = await createPlayerUI(ctx, track, { transcript: 'visible' });
      const player = ui.player;
      if (!player) return el.append(ui.el);
      const status = h('div', { class: 'caption-box', 'aria-live': 'polite' }, 'Escolha um modo abaixo.');
      let running = false;
      let loopOne = false;
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const runRepeat = async (from = 0) => {
        running = true;
        for (let i = from; i < track.segments.length && running; i++) {
          const s = track.segments[i];
          status.textContent = `Ouça (${i + 1}/${track.segments.length})…`;
          await player.playRange(i);
          if (!running) break;
          const wait = Math.max(1500, (s.end - s.start) * 1300 + 600);
          status.replaceChildren(h('strong', {}, '🎙 Sua vez! '), tl(unit, s.text));
          await pause(wait);
          if (loopOne) i--;
        }
        if (running) { status.textContent = '✓ Muito bem! Você repetiu todas as falas.'; complete(track, 's4'); }
        running = false;
      };
      const loopBtn = h('button', { class: 'btn small', 'aria-pressed': 'false', onClick: () => { loopOne = !loopOne; loopBtn.setAttribute('aria-pressed', String(loopOne)); } }, '🔁 Repetir a mesma fala');
      el.append(ui.el, h('section', { class: 'card' },
        h('h3', {}, 'Prática de repetição'),
        status,
        h('div', { class: 'row', style: { marginTop: '10px' } },
          h('button', { class: 'btn primary', onClick: () => { if (!running) runRepeat(Math.max(0, ui.player.current ?? 0)); } }, '▶ Ouvir e repetir'),
          h('button', { class: 'btn', onClick: () => { running = false; player.seek(0); player.setRate(0.9); player.play(); status.textContent = 'Shadowing: fale junto com o áudio, imitando ritmo e entonação.'; } }, '🗣 Shadowing (0.9×)'),
          h('button', { class: 'btn', onClick: () => { running = false; player.pause(); status.textContent = 'Pausado.'; } }, '■ Parar'),
          loopBtn),
        h('p', { class: 'small muted' }, 'Dica: para gravar sua voz e comparar, use o Speaking Studio.'),
        h('div', { class: 'row end' }, h('button', { class: 'btn small ghost', onClick: () => { complete(track, 's4'); announce('Etapa marcada como concluída.'); } }, 'Marcar como concluída'))));
    },
  ];

  function vocabFor(track) {
    const text = track.segments.map((s) => plainText(unit, s.text).toLowerCase()).join(' ');
    // vocabulário que aparece na faixa (ou marcado explicitamente com "tracks")
    return unit.vocabulary.filter((v) => v.tracks?.includes(track.id) || plainText(unit, v.term).toLowerCase().split(' / ').some((t) => text.includes(t.replace(/[?.]$/, '').toLowerCase())));
  }

  stageIdx = firstOpen(unit.tracks[trackIdx]);
  drawTabs();
  draw();
  return root;
}
