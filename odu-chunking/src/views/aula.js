import { gsap } from 'gsap';
import { LANGS } from '../config.js';
import { LESSONS, lessonById, sentenceById, sentenceText } from '../core/blocks.js';
import { store } from '../core/store.js';
import { reducedMotion } from '../core/theme.js';
import { animateIn, blockName, chipLine, h, legend, linkHighlights, quad, sayButton } from '../core/ui.js';

const CODES = LANGS.map((l) => l.code);

function head(eyebrow, title, note) {
  return h(
    'div.section-head',
    {},
    h('div', {}, h('span.eyebrow', {}, eyebrow), h('h2', {}, title)),
    note ? h('p.muted.prose', {}, note) : null,
  );
}

function scaffoldSection(lesson) {
  const stage = h('div');
  const buttons = lesson.scaffold.map((lvl, i) =>
    h(
      'button',
      { type: 'button', 'aria-pressed': 'false', onclick: () => show(i) },
      h('small', {}, `Nível ${i + 1}`),
      lvl.rotulo,
    ),
  );
  let shown = -1;
  let playing = null;

  function show(i) {
    const prev = shown >= 0 ? lesson.scaffold[shown] : null;
    shown = i;
    buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    const box = quad(lesson.scaffold[i]);
    stage.replaceChildren(box);
    if (reducedMotion()) return;
    // Anima só os blocos novos em relação ao nível anterior.
    box.querySelectorAll('.lang-row').forEach((row, r) => {
      const lang = CODES[r];
      const before = prev ? prev.blocks[lang].map((x) => x.t) : [];
      row.querySelectorAll('.chip').forEach((c) => {
        const isNew = !before.includes(c.textContent) && !before.includes(`, ${c.textContent}`);
        if (isNew)
          gsap.from(c, { y: -18, scale: 0.6, autoAlpha: 0, duration: 0.5, ease: 'back.out(2.2)', delay: r * 0.06 });
      });
    });
  }

  const play = h(
    'button.btn.ghost',
    {
      type: 'button',
      onclick: () => {
        if (playing) {
          clearInterval(playing);
          playing = null;
          play.textContent = 'Reproduzir níveis';
          return;
        }
        let i = 0;
        show(0);
        play.textContent = 'Parar';
        playing = setInterval(() => {
          i += 1;
          if (i >= lesson.scaffold.length) {
            clearInterval(playing);
            playing = null;
            play.textContent = 'Reproduzir níveis';
            return;
          }
          show(i);
        }, 1800);
      },
    },
    'Reproduzir níveis',
  );

  show(lesson.scaffold.length - 1);
  return {
    el: h(
      'section.section',
      {},
      head(
        'Scaffolding',
        'Construção de frases',
        'A frase cresce um bloco de informação por vez. Compare onde cada idioma encaixa o bloco novo.',
      ),
      h('div.row', {}, h('div.scaffold-levels', {}, buttons), play),
      stage,
    ),
    stop: () => clearInterval(playing),
  };
}

function dialogSection(lesson) {
  let lang = 'en';
  const list = h('div.panel');
  const seg = h('div.seg', { role: 'group', 'aria-label': 'Idioma do diálogo' });

  const renderLines = () => {
    list.replaceChildren(
      ...lesson.dialogo.map((line) => {
        const langs = lang === 'all' ? CODES : [lang];
        return h(
          'div.dialog-line',
          {},
          h('span.speaker', { 'aria-label': `Falante ${line.falante}` }, line.falante),
          h(
            'div',
            { style: { display: 'grid', gap: '0.35rem', minWidth: 0 } },
            ...langs.map((code) =>
              h(
                'div.lang-row',
                {},
                h('span.lang-tag', {}, code.toUpperCase()),
                chipLine(code, line.blocks[code], line.p),
                sayButton(sentenceText(code, line.blocks[code], line.p), code),
              ),
            ),
            h('span.muted', {}, line.pt),
          ),
        );
      }),
    );
    linkHighlights(list);
    animateIn(list);
  };

  [...CODES, 'all'].forEach((code) => {
    seg.append(
      h(
        'button',
        {
          type: 'button',
          'aria-pressed': String(code === lang),
          onclick: (e) => {
            lang = code;
            seg
              .querySelectorAll('button')
              .forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
            renderLines();
          },
        },
        code === 'all' ? 'Todos' : code.toUpperCase(),
      ),
    );
  });
  renderLines();
  return h('section.section', {}, head('Conversa prática', 'Diálogo em blocos'), seg, list);
}

function drillSection(lesson) {
  const base = sentenceById[lesson.drill.frase];
  const cat = lesson.drill.bloco;
  const stage = h('div');
  const opts = [{ pt: null }, ...lesson.drill.opcoes];

  const render = (opt) => {
    const item = { ...base, blocks: {} };
    for (const code of CODES) {
      item.blocks[code] = base.blocks[code].map((b) => (opt.pt && b.b === cat ? { b: cat, t: opt[code] } : b));
    }
    item.pt = opt.pt ? base.pt.replace(/\.$|\?$/, '') + ` → ${opt.pt}` : base.pt;
    const box = quad(item);
    stage.replaceChildren(box);
    if (!reducedMotion()) {
      gsap.from(box.querySelectorAll(`.chip.b${cat}`), {
        rotateX: 90,
        duration: 0.45,
        ease: 'back.out(2)',
        stagger: 0.05,
        transformPerspective: 400,
      });
    }
  };

  const buttons = opts.map((opt, i) =>
    h(
      'button',
      {
        type: 'button',
        'aria-pressed': String(i === 0),
        onclick: (e) => {
          buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
          render(opt);
        },
      },
      opt.pt ?? 'Frase modelo',
    ),
  );
  render(opts[0]);
  return h(
    'section.section',
    {},
    head(
      'Drilling',
      'Substituição de blocos',
      `Troque só o bloco "${blockName(cat)}" e mantenha a estrutura. Os outros blocos não mudam em nenhum idioma.`,
    ),
    h('div.drill-options', {}, buttons),
    stage,
  );
}

function lessonList() {
  return h(
    'div.view',
    {},
    h('div.section-head', {}, h('div', {}, h('span.eyebrow', {}, 'Template Padrão ODU'), h('h2', {}, 'Aulas'))),
    h(
      'div.grid-3',
      {},
      LESSONS.map((l) =>
        h(
          'a.panel.lesson-card',
          { href: `#aula-${l.id}` },
          h('span.eyebrow', {}, `Aula ${l.id.slice(1)} · ${l.nivel}`),
          h('h3', {}, l.titulo),
          h('p.muted', {}, l.tema),
          h('p', {}, h('strong', {}, 'Ponto: '), l.ponto.nome),
        ),
      ),
    ),
  );
}

export function mount(root, arg) {
  const lesson = lessonById[arg];
  if (!lesson) {
    root.append(lessonList());
    return null;
  }
  store.update((s) => {
    s.visited[lesson.id] = Date.now();
  });

  const idx = LESSONS.indexOf(lesson);
  const next = LESSONS[idx + 1];
  const scaffold = scaffoldSection(lesson);

  root.append(
    h(
      'nav.lesson-nav',
      { 'aria-label': 'Aulas' },
      LESSONS.map((l) =>
        h(
          'a',
          { href: `#aula-${l.id}`, 'aria-current': l === lesson ? 'page' : null },
          `${l.id.slice(1)} · ${l.titulo}`,
        ),
      ),
    ),
    h(
      'header.section',
      {},
      h('span.eyebrow', {}, `Aula ${lesson.id.slice(1)} · ${lesson.nivel} · EN · FR · DE · ES`),
      h('h1', {}, lesson.titulo),
      h('p.muted', { style: { fontSize: 'var(--step-1)' } }, lesson.tema),
    ),
    h(
      'section.section',
      {},
      head('1', 'Objetivos da aula'),
      h(
        'div.objetivos',
        {},
        h('div.panel', {}, h('span.eyebrow', {}, 'Reconhecimento'), h('p', {}, lesson.objetivos.reconhecimento)),
        h('div.panel', {}, h('span.eyebrow', {}, 'Aplicação'), h('p', {}, lesson.objetivos.aplicacao)),
        h('div.panel', {}, h('span.eyebrow', {}, 'Comunicação'), h('p', {}, lesson.objetivos.comunicacao)),
      ),
    ),
    h('section.section', {}, head('2', 'Legenda de cores'), legend()),
    h(
      'section.section',
      {},
      head('3 · Gramática', lesson.ponto.nome),
      h(
        'div.grid-2',
        {},
        h(
          'div.panel',
          {},
          h('span.eyebrow', {}, 'Forma'),
          h(
            'div.table-scroll',
            {},
            h(
              'table.forma-table',
              {},
              h(
                'tbody',
                {},
                CODES.map((c) =>
                  h(
                    'tr',
                    {},
                    h('td', {}, h('span.lang-tag', {}, c.toUpperCase())),
                    h('td', {}, h('code', {}, lesson.ponto.forma[c])),
                  ),
                ),
              ),
            ),
          ),
        ),
        h(
          'div.panel',
          {},
          h('span.eyebrow', {}, 'Função'),
          h('p', {}, lesson.ponto.funcao),
          h('span.eyebrow', {}, 'Modo de uso'),
          h('p', {}, lesson.ponto.uso),
        ),
      ),
    ),
    h(
      'section.section',
      {},
      head('Assimilar', 'Frases em blocos', 'Clique em um bloco para ouvir só ele; o alto-falante lê a frase inteira.'),
      h(
        'div',
        { style: { display: 'grid', gap: '0.85rem' } },
        lesson.frases.map((f) => quad(f)),
      ),
    ),
    scaffold.el,
    dialogSection(lesson),
    h(
      'section.section',
      {},
      head('Interferência da L1', 'Prevenção de erros comuns'),
      h(
        'div.grid-2',
        {},
        lesson.erros.map((e) =>
          h(
            'div.panel.erro',
            {},
            h('span.lang-tag', { style: { justifySelf: 'start', padding: '0.15rem 0.4rem' } }, e.lang.toUpperCase()),
            h('div.x', { lang: e.lang }, h('span', { 'aria-hidden': 'true' }, '✗'), e.errado),
            h('div.ok', { lang: e.lang }, h('span', { 'aria-hidden': 'true' }, '✓'), e.certo),
            h('p.muted', {}, h('strong', {}, 'Nota do professor: '), e.nota),
          ),
        ),
      ),
    ),
    drillSection(lesson),
    h(
      'section.panel',
      {},
      h('span.eyebrow', {}, 'Prática e consolidação'),
      h('h3', {}, 'Agora monte as frases sozinho'),
      h(
        'div.row',
        {},
        h('a.btn', { href: `#construir-${lesson.id}` }, 'Construir com esta aula'),
        h('a.btn.ghost', { href: `#memorizar-${lesson.id}` }, 'Revisar cartões'),
        next ? h('a.btn.ghost', { href: `#aula-${next.id}` }, `Próxima: ${next.titulo}`) : null,
      ),
    ),
  );
  root.querySelectorAll('.quad').forEach((q) => animateIn(q));
  return () => scaffold.stop();
}
