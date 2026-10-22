import { LANGS } from '../config.js';
import { LESSONS, lessonById, sentenceText } from '../core/blocks.js';
import { addMastery, store } from '../core/store.js';
import { speak } from '../core/speech.js';
import { onThemeChange } from '../core/theme.js';
import { h, select } from '../core/ui.js';
import { isCorrect, makeGame } from '../game/rounds.js';

const POINTS = 10;

export async function mount(root, arg) {
  let lesson = lessonById[arg] ? arg : 'all';
  let lang = 'en';
  let rounds = [];
  let index = 0;
  let score = 0;
  let streak = 0;
  let hits = 0;
  let checked = false;
  let scene = null;

  const frame = h('div.game-frame', { 'aria-label': 'Área do jogo Construir' });
  const scoreEl = h('b', {}, '0');
  const streakEl = h('b', {}, '0');
  const bestEl = h('b', {}, String(store.get().game.best));
  const feedback = h('p.feedback', { role: 'status', 'aria-live': 'polite' });

  const checkBtn = h('button.btn', { type: 'button', disabled: true, onclick: () => check() }, 'Verificar');
  const clearBtn = h('button.btn.ghost', { type: 'button', onclick: () => scene?.clearAnswer() }, 'Limpar');
  const skipBtn = h('button.btn.ghost', { type: 'button', onclick: () => check(true) }, 'Não sei');
  const listenBtn = h(
    'button.btn.ghost',
    {
      type: 'button',
      onclick: () => {
        const r = rounds[index];
        if (r) speak(sentenceText(r.lang, r.sentence.blocks[r.lang], r.sentence.p), r.lang);
      },
    },
    'Ouvir',
  );

  const langSeg = h(
    'div.seg',
    { role: 'group', 'aria-label': 'Idioma' },
    [...LANGS.map((l) => [l.code, l.label]), ['all', '4 idiomas']].map(([v, t]) =>
      h(
        'button',
        {
          type: 'button',
          'aria-pressed': String(v === lang),
          onclick: (e) => {
            lang = v;
            langSeg
              .querySelectorAll('button')
              .forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
            start();
          },
        },
        t,
      ),
    ),
  );

  root.append(
    h(
      'div.section-head',
      {},
      h('div', {}, h('span.eyebrow', {}, 'Organização sintática'), h('h2', {}, 'Construir')),
      h(
        'p.muted.prose',
        {},
        'Reorganize os blocos embaralhados na ordem do idioma. No modo 4 idiomas, a mesma frase aparece em EN, FR, DE e ES seguidos, para você sentir a ordem mudar.',
      ),
    ),
    h(
      'div.row',
      { style: { alignItems: 'end', justifyContent: 'space-between' } },
      select(
        'game-aula',
        'Aula',
        [['all', 'Todas as aulas'], ...LESSONS.map((l) => [l.id, `${l.id.slice(1)} · ${l.titulo}`])],
        lesson,
        (v) => {
          lesson = v;
          start();
        },
      ),
      langSeg,
    ),
    h(
      'div.game-shell',
      {},
      h(
        'div.game-hud',
        {},
        h(
          'div.hud-stats',
          {},
          h('span', {}, 'Pontos ', scoreEl),
          h('span', {}, 'Sequência ', streakEl),
          h('span', {}, 'Recorde ', bestEl),
        ),
        h('div.row', {}, clearBtn, skipBtn, listenBtn, checkBtn),
      ),
      frame,
      feedback,
    ),
  );

  function updateHud() {
    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    bestEl.textContent = String(store.get().game.best);
  }

  function start() {
    rounds = makeGame({ lesson, lang, count: lang === 'all' ? 12 : 8 });
    index = 0;
    score = 0;
    streak = 0;
    hits = 0;
    updateHud();
    play();
  }

  function play() {
    checked = false;
    checkBtn.textContent = 'Verificar';
    checkBtn.disabled = true;
    skipBtn.disabled = false;
    clearBtn.disabled = false;
    feedback.textContent = '';
    feedback.className = 'feedback';
    if (index >= rounds.length) return finish();
    scene?.startRound(rounds[index], index, rounds.length);
  }

  function check(giveUp = false) {
    if (!scene) return;
    if (checked) {
      index += 1;
      play();
      return;
    }
    const r = rounds[index];
    const ok = !giveUp && isCorrect(r, scene.chosen());
    checked = true;
    addMastery(r.sentence.id, r.lang, ok);
    if (ok) {
      streak += 1;
      hits += 1;
      score += POINTS * Math.min(streak, 5);
      feedback.textContent = streak > 1 ? `Certo! Sequência de ${streak} (×${Math.min(streak, 5)})` : 'Certo!';
      feedback.className = 'feedback ok';
      speak(sentenceText(r.lang, r.sentence.blocks[r.lang], r.sentence.p), r.lang);
    } else {
      streak = 0;
      feedback.textContent = giveUp
        ? 'Veja a ordem certa e tente lembrar na próxima.'
        : 'Quase. Compare com a ordem correta.';
      feedback.className = 'feedback bad';
    }
    scene.showResult(ok);
    updateHud();
    checkBtn.disabled = false;
    skipBtn.disabled = true;
    clearBtn.disabled = true;
    checkBtn.textContent = index + 1 >= rounds.length ? 'Ver resultado' : 'Próxima';
    checkBtn.focus();
  }

  function finish() {
    store.update((s) => {
      s.game.played += 1;
      s.game.best = Math.max(s.game.best, score);
    });
    updateHud();
    const pct = Math.round((hits / rounds.length) * 100);
    feedback.className = 'feedback';
    feedback.textContent = '';
    scene?.scene.pause();
    frame.querySelector('.game-over')?.remove();
    const over = h(
      'div.empty.game-over',
      { style: { position: 'absolute', inset: '1rem', background: 'var(--surface)', alignContent: 'center' } },
      h('span.eyebrow', {}, 'Fim da partida'),
      h('h3', {}, `${score} pontos · ${hits} de ${rounds.length} frases (${pct}%)`),
      h(
        'p.muted',
        {},
        pct >= 80
          ? 'Ótimo domínio. Experimente o modo 4 idiomas ou outra aula.'
          : 'Revise as frases da aula e jogue de novo.',
      ),
      h(
        'div.row',
        {},
        h(
          'button.btn',
          {
            type: 'button',
            onclick: () => {
              over.remove();
              scene?.scene.resume();
              start();
            },
          },
          'Jogar de novo',
        ),
        h('a.btn.ghost', { href: '#memorizar' }, 'Ir para Memorizar'),
      ),
    );
    frame.append(over);
    checkBtn.disabled = true;
    skipBtn.disabled = true;
    clearBtn.disabled = true;
  }

  function onKey(e) {
    if (e.target.closest('input, select, textarea')) return;
    if (e.key === 'Enter' && !checkBtn.disabled && document.activeElement !== checkBtn) {
      e.preventDefault();
      check();
    }
  }
  document.addEventListener('keydown', onKey);

  await document.fonts?.ready;
  const Phaser = await import('phaser');
  const { BuildScene } = await import('../game/BuildScene.js');
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: frame,
    transparent: false,
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    scene: [BuildScene],
    banner: false,
    audio: { noAudio: true },
  });
  game.events.on('answer-changed', (n) => {
    if (!checked) checkBtn.disabled = n === 0;
  });
  game.events.once('scene-ready', (s) => {
    scene = s;
    frame.scene = s; // acesso para testes automatizados
    start();
  });
  const offTheme = onThemeChange(() => scene?.applyTheme());

  return () => {
    document.removeEventListener('keydown', onKey);
    offTheme();
    game.destroy(true);
  };
}
