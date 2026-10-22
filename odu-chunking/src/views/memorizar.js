import { gsap } from 'gsap';
import { LANGS } from '../config.js';
import { LESSONS, lessonById, sentenceText } from '../core/blocks.js';
import { dueQueue, grade, previewInterval, srsSummary } from '../core/srs.js';
import { store } from '../core/store.js';
import { speak } from '../core/speech.js';
import { reducedMotion } from '../core/theme.js';
import { h, quad, select } from '../core/ui.js';

const RATINGS = [
  ['again', 'Errei'],
  ['hard', 'Difícil'],
  ['good', 'Bom'],
  ['easy', 'Fácil'],
];

export function mount(root, arg) {
  let lesson = lessonById[arg] ? arg : 'all';
  let mode = 'pt'; // 'pt' = PT-BR na frente · 'audio' = ditado em blocos
  let queue = [];
  let pos = 0;
  let flipped = false;
  let audioLang = 'en';

  const counter = h('span.eyebrow');
  const stage = h('div.card-stage');
  const controls = h('div');

  const modeSeg = h(
    'div.seg',
    { role: 'group', 'aria-label': 'Frente do cartão' },
    [
      ['pt', 'Frente PT-BR'],
      ['audio', 'Ditado em blocos'],
    ].map(([v, t]) =>
      h(
        'button',
        {
          type: 'button',
          'aria-pressed': String(v === mode),
          onclick: (e) => {
            mode = v;
            modeSeg
              .querySelectorAll('button')
              .forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
            showCard();
          },
        },
        t,
      ),
    ),
  );

  function rebuild() {
    queue = dueQueue({ lesson });
    pos = 0;
    showCard();
  }

  function showCard() {
    flipped = false;
    const card = queue[pos];
    const sum = srsSummary();
    if (!card) {
      counter.textContent = `${sum.vistas} de ${sum.total} frases no baralho`;
      const nextDue = Object.values(store.get().srs)
        .map((c) => c.due)
        .filter((d) => d > Date.now())
        .sort((a, b) => a - b)[0];
      stage.replaceChildren(
        h(
          'div.empty',
          {},
          h('h3', {}, 'Revisão do dia concluída'),
          h(
            'p.muted',
            {},
            nextDue
              ? `Próxima revisão em ${new Date(nextDue).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`
              : 'Escolha outra aula ou volte amanhã.',
          ),
          h(
            'div.row',
            {},
            h('a.btn', { href: '#construir' }, 'Praticar no Construir'),
            h('button.btn.ghost', { type: 'button', onclick: rebuild }, 'Recarregar fila'),
          ),
        ),
      );
      controls.replaceChildren();
      return;
    }
    counter.textContent = `Cartão ${pos + 1} de ${queue.length} · ${sum.vencidas} vencidas`;
    audioLang = LANGS[Math.floor(Math.random() * LANGS.length)].code;
    const lessonTitle = lessonById[card.licao].titulo;

    const front =
      mode === 'pt'
        ? h(
            'div.face.front',
            {},
            h('span.eyebrow', {}, `${lessonTitle} · diga em EN, FR, DE e ES`),
            h('p.prompt', {}, card.pt),
            h('p.muted', {}, 'Monte mentalmente os blocos em cada idioma antes de virar.'),
          )
        : h(
            'div.face.front',
            {},
            h('span.eyebrow', {}, `${lessonTitle} · ditado em ${audioLang.toUpperCase()}`),
            h('p.prompt', {}, 'Ouça e repita em blocos'),
            h(
              'div.row',
              {},
              h(
                'button.btn',
                {
                  type: 'button',
                  onclick: () => speak(sentenceText(audioLang, card.blocks[audioLang], card.p), audioLang),
                },
                'Ouvir de novo',
              ),
              h(
                'button.btn.ghost',
                {
                  type: 'button',
                  onclick: () =>
                    speak(sentenceText(audioLang, card.blocks[audioLang], card.p), audioLang, { rate: 0.65 }),
                },
                'Mais devagar',
              ),
            ),
          );

    const back = h('div.face.back', {}, h('span.eyebrow', {}, 'Resposta em blocos'), quad(card));
    const fc = h('div.flashcard', {}, front, back);
    stage.replaceChildren(fc);
    if (mode === 'audio') speak(sentenceText(audioLang, card.blocks[audioLang], card.p), audioLang);

    const flip = h('button.btn', { type: 'button', onclick: () => turn() }, 'Mostrar blocos');
    controls.replaceChildren(h('div.row', {}, flip, h('span.muted', {}, 'Atalho: espaço')));

    function turn() {
      if (flipped) return;
      flipped = true;
      if (reducedMotion()) gsap.set(fc, { rotateY: 180 });
      else gsap.to(fc, { rotateY: 180, duration: 0.6, ease: 'power3.inOut' });
      controls.replaceChildren(
        h(
          'div.grades',
          { role: 'group', 'aria-label': 'Como foi?' },
          RATINGS.map(([r, label], i) =>
            h(
              'button',
              { type: 'button', 'data-r': r, title: `Tecla ${i + 1}`, onclick: () => rate(r) },
              label,
              h('small', {}, previewInterval(card.id, r)),
            ),
          ),
        ),
      );
    }
    stage.turn = turn;
    if (!reducedMotion()) gsap.from(fc, { y: 24, opacity: 0, duration: 0.35, ease: 'power2.out' });
  }

  function rate(r) {
    const card = queue[pos];
    grade(card.id, r);
    // "Errei" volta para o fim da fila da sessão.
    if (r === 'again') queue.push(card);
    pos += 1;
    showCard();
  }

  function onKey(e) {
    if (e.target.closest('input, select, textarea')) return;
    if (e.code === 'Space' && !flipped && queue[pos]) {
      e.preventDefault();
      stage.turn?.();
    } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
      rate(RATINGS[Number(e.key) - 1][0]);
    }
  }
  document.addEventListener('keydown', onKey);

  root.append(
    h(
      'div.section-head',
      {},
      h('div', {}, h('span.eyebrow', {}, 'Revisão espaçada · 1 → 3 → 7 → 21 dias'), h('h2', {}, 'Memorizar')),
      h(
        'p.muted.prose',
        {},
        'Cada cartão é uma frase inteira em blocos, nunca uma palavra solta. Avalie com honestidade: o intervalo seguinte depende da sua resposta.',
      ),
    ),
    h(
      'div.row',
      { style: { alignItems: 'end', justifyContent: 'space-between' } },
      select(
        'mem-aula',
        'Aula',
        [['all', 'Todas as aulas'], ...LESSONS.map((l) => [l.id, `${l.id.slice(1)} · ${l.titulo}`])],
        lesson,
        (v) => {
          lesson = v;
          rebuild();
        },
      ),
      modeSeg,
    ),
    counter,
    stage,
    controls,
  );
  rebuild();
  return () => document.removeEventListener('keydown', onKey);
}
