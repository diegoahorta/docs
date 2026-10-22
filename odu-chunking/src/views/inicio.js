import { LANGS } from '../config.js';
import { LESSONS, lessonById, sentenceText } from '../core/blocks.js';
import { store, masteryOf } from '../core/store.js';
import { srsSummary } from '../core/srs.js';
import { h, legend } from '../core/ui.js';

const ORDER = LANGS.map((l) => l.code);

function lessonCard(lesson) {
  const bars = LANGS.map((l) => {
    const v = lesson.frases.reduce((s, f) => s + masteryOf(f.id, l.code), 0) / lesson.frases.length;
    return h('span.bar', {}, l.label, h('i', { style: { '--v': `${Math.round(v * 100)}%` } }));
  });
  const visited = store.get().visited[lesson.id];
  return h(
    'a.panel.lesson-card',
    { href: `#aula-${lesson.id}` },
    h(
      'header',
      {},
      h('span.eyebrow', {}, `Aula ${lesson.id.slice(1)}`),
      h('span.eyebrow', {}, visited ? 'vista' : 'nova'),
    ),
    h('h3', {}, lesson.titulo),
    h('p.muted', {}, lesson.tema),
    h('div.bars', { 'aria-label': 'Domínio por idioma' }, bars),
  );
}

export async function mount(root) {
  const model = lessonById.l02.frases[0];
  const caption = h('span.sentence', { lang: 'en' }, '');
  const langChips = ORDER.map((c) => h('span', { 'data-l': c }, c.toUpperCase()));
  const canvas = h('canvas.hero-canvas', { 'aria-label': 'Blocos 3D da frase modelo se reorganizando em cada idioma' });

  const sum = srsSummary();
  const { game } = store.get();

  root.append(
    h(
      'section.hero',
      {},
      h(
        'div.hero-copy',
        {},
        h('span.eyebrow', {}, 'Método Chunking · ODU Creative'),
        h('h1', {}, 'Construa a frase em blocos.'),
        h(
          'p',
          {},
          'Inglês, francês, alemão e espanhol ao mesmo tempo. Cada cor é uma função na frase, e você vê como cada língua organiza os mesmos blocos.',
        ),
        h(
          'div.row',
          {},
          h('a.btn', { href: '#aula-l01' }, 'Começar pela aula 1'),
          h('a.btn.ghost', { href: '#construir' }, 'Jogar Construir'),
        ),
      ),
      h(
        'figure.hero-stage',
        { style: { margin: 0 } },
        canvas,
        h('figcaption.hero-caption', {}, caption, h('div.hero-langs', {}, langChips)),
      ),
    ),
    h(
      'section.stats',
      { 'aria-label': 'Seu progresso' },
      h('div.stat', {}, h('b', {}, String(sum.vencidas)), h('span', {}, 'cartões para revisar hoje')),
      h('div.stat', {}, h('b', {}, `${sum.vistas}/${sum.total}`), h('span', {}, 'frases já estudadas')),
      h('div.stat', {}, h('b', {}, String(sum.dominadas)), h('span', {}, 'frases dominadas (caixa 4+)')),
      h('div.stat', {}, h('b', {}, String(game.best)), h('span', {}, 'recorde no Construir')),
    ),
    h(
      'section.section',
      {},
      h(
        'div.section-head',
        {},
        h('div', {}, h('span.eyebrow', {}, 'Legenda de cores'), h('h2', {}, 'Mapeamento sintático')),
        h(
          'p.muted.prose',
          {},
          'As mesmas cores em todas as telas e nos quatro idiomas. Passe o mouse sobre um bloco para ver a função dele nas outras línguas.',
        ),
      ),
      legend(),
    ),
    h(
      'section.section',
      {},
      h('div.section-head', {}, h('div', {}, h('span.eyebrow', {}, '6 aulas · iniciante'), h('h2', {}, 'Aulas'))),
      h('div.grid-3', {}, LESSONS.map(lessonCard)),
    ),
    h(
      'section.section',
      {},
      h('div.section-head', {}, h('div', {}, h('span.eyebrow', {}, 'Roteiro'), h('h2', {}, 'Como estudar'))),
      h(
        'ol.steps',
        {},
        h(
          'li',
          {},
          h('strong', {}, 'Assimilar'),
          h('span.muted', {}, 'Na aula, compare a frase nos 4 idiomas e ouça cada bloco.'),
        ),
        h(
          'li',
          {},
          h('strong', {}, 'Construir em níveis'),
          h('span.muted', {}, 'Veja a frase crescer do núcleo da ação até o tempo e o contexto.'),
        ),
        h(
          'li',
          {},
          h('strong', {}, 'Montar'),
          h('span.muted', {}, 'No Construir, reorganize os blocos embaralhados na ordem de cada língua.'),
        ),
        h(
          'li',
          {},
          h('strong', {}, 'Memorizar'),
          h(
            'span.muted',
            {},
            'Revise em 1, 3, 7 e 21 dias. O cartão é sempre a frase em blocos, nunca a palavra solta.',
          ),
        ),
      ),
    ),
  );

  const setLang = (lang) => {
    caption.textContent = sentenceText(lang, model.blocks[lang], model.p);
    caption.lang = lang;
    langChips.forEach((c) => c.classList.toggle('on', c.dataset.l === lang));
  };

  let hero = null;
  try {
    const { createHero } = await import('../three/hero.js');
    hero = createHero(canvas, model.blocks, ORDER, setLang);
    langChips.forEach((c) => {
      c.style.cursor = 'pointer';
      c.addEventListener('click', () => hero.go(c.dataset.l));
    });
  } catch (err) {
    console.warn('Three.js indisponível', err);
    setLang('en');
  }
  return () => hero?.dispose();
}
