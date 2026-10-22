import { h, select } from '../core/ui.js';
import { speak } from '../core/speech.js';

const PAGE = 60;
const COLS = [
  ['en', 2],
  ['pt', 3],
  ['fr', 4],
  ['de', 5],
  ['es', 6],
];

const fold = (s) =>
  s
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

export async function mount(root) {
  const { LEXICO } = await import('../data/lexico.js');
  const index = LEXICO.map((r) => fold(r.slice(2, 7).join(' ')));
  let query = '';
  let faixa = 'all';
  let limit = PAGE;

  const input = h('input', {
    id: 'lex-q',
    type: 'search',
    placeholder: 'Buscar em qualquer idioma: casa, house, maison, Haus…',
    autocomplete: 'off',
    oninput: (e) => {
      query = fold(e.target.value.trim());
      limit = PAGE;
      render();
    },
  });
  const count = h('span.eyebrow');
  const body = h('tbody');
  const more = h(
    'button.btn.ghost',
    {
      type: 'button',
      onclick: () => {
        limit += PAGE;
        render();
      },
    },
    'Mostrar mais',
  );

  function cell(row, code, col) {
    const text = row[col];
    const fixed = code !== 'en' && code !== 'pt' && row[7].split(',').includes(code);
    const btn = h(
      'button.word',
      {
        type: 'button',
        lang: code,
        title: code === 'pt' ? text : `Ouvir: ${text}`,
        onclick: () => code !== 'pt' && speak(text, code),
      },
      text,
    );
    return h(
      'td',
      {},
      btn,
      fixed ? h('span.fix', { title: 'Tradução original corrigida pela lista de alertas' }, 'corrigido') : null,
    );
  }

  function render() {
    const rows = [];
    for (let i = 0; i < LEXICO.length; i += 1) {
      const r = LEXICO[i];
      if (faixa !== 'all' && String(r[1]) !== faixa) continue;
      if (query && !index[i].includes(query)) continue;
      rows.push(r);
    }
    count.textContent = `${rows.length} palavras${rows.length > limit ? ` · mostrando ${limit}` : ''}`;
    body.replaceChildren(
      ...rows
        .slice(0, limit)
        .map((r) => h('tr', {}, h('td.n', {}, String(r[0])), ...COLS.map(([code, col]) => cell(r, code, col)))),
    );
    more.hidden = rows.length <= limit;
  }

  root.append(
    h(
      'div.section-head',
      {},
      h('div', {}, h('span.eyebrow', {}, '2.284 palavras por frequência'), h('h2', {}, 'Léxico')),
      h(
        'p.note.prose',
        {},
        'Base Mnemotechnics organizada pela ODU Creative. O português é a lista curada; FR, DE e ES vêm de tradução automática de palavras isoladas, já com as correções da lista de alertas. Use como apoio e estude sempre a palavra dentro de um bloco.',
      ),
    ),
    h(
      'div.row',
      { style: { alignItems: 'end' } },
      h('div.field', { style: { flex: '1 1 18rem' } }, h('label', { for: 'lex-q' }, 'Buscar'), input),
      select(
        'lex-faixa',
        'Faixa de frequência',
        [['all', 'Todas'], ...Array.from({ length: 10 }, (_, i) => [String(i + 1), `Faixa ${i + 1}`])],
        faixa,
        (v) => {
          faixa = v;
          limit = PAGE;
          render();
        },
      ),
    ),
    count,
    h(
      'div.table-scroll',
      {},
      h(
        'table.lex-table',
        {},
        h(
          'thead',
          {},
          h(
            'tr',
            {},
            ['Nº', 'EN', 'PT-BR', 'FR', 'DE', 'ES'].map((t) => h('th', { scope: 'col' }, t)),
          ),
        ),
        body,
      ),
    ),
    more,
  );
  render();
  return null;
}
