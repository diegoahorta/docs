// 📖 Guia fonético de romaji: pode ser aberto a qualquer momento, inclusive no meio
// de uma pergunta (o cronômetro pausa, mas a pergunta passa a valer metade dos pontos).
// Abas: tabela básica, ゛゜, combinações, "como falar" e sinais especiais.

import { KATAKANA_COMBINADOS, LINHAS_DA_TABELA, separarSilabas } from '../data/katakana.js';
import { SINAIS, SONS_DIFERENTES, comoSoa } from '../data/fonetica.js';
import { falar } from '../core/speech.js';
import { criarElemento } from '../core/utils.js';
import { abrirModal } from './modal.js';
import { botaoFalar } from './falar.js';
import { entrar } from './motion.js';

const ABAS = [
  { id: 'basicos', rotulo: 'アイウ Básicos' },
  { id: 'sinais-dakuten', rotulo: 'ガ ゛゜' },
  { id: 'combinacoes', rotulo: 'キャ Combinações' },
  { id: 'como-falar', rotulo: '🗣️ Como falar' },
  { id: 'sinais', rotulo: 'ー ッ Sinais' },
];
const CABECALHO_VOGAIS = ['a', 'i', 'u', 'e', 'o'];

let abaLembrada = 'basicos';

/** Painel de detalhes que aparece ao tocar num kana. */
function criarDetalhe() {
  const painel = criarElemento('div', { class: 'guia-detalhe', 'aria-live': 'polite' }, [
    criarElemento('p', {
      class: 'texto-suave',
      text: '👆 Toque num katakana para ouvir e ver como se fala.',
    }),
  ]);
  return {
    painel,
    mostrar(item) {
      painel.replaceChildren(
        criarElemento('span', { class: 'guia-detalhe-kana', lang: 'ja', text: item.kana }),
        criarElemento('div', { class: 'guia-detalhe-texto' }, [
          criarElemento('p', { class: 'guia-detalhe-romaji' }, [
            criarElemento('strong', { text: item.romaji }),
            ` — soa "${comoSoa(item.romaji)}"`,
          ]),
          criarElemento('p', { text: `💡 ${item.mnemonico}` }),
        ]),
        botaoFalar(item.kana),
      );
      entrar(painel.children, { y: 8, intervalo: 0.03 });
    },
  };
}

/** Uma célula da tabela: kana grande e romaji embaixo. */
function celula(item, detalhe) {
  if (!item) {
    return criarElemento('span', { class: 'guia-celula guia-celula-vazia', 'aria-hidden': 'true' });
  }
  return criarElemento(
    'button',
    {
      type: 'button',
      class: 'guia-celula',
      'aria-label': `${item.kana}: ${item.romaji}`,
      onClick: () => {
        falar(item.kana);
        detalhe.mostrar(item);
      },
    },
    [
      criarElemento('span', { class: 'guia-celula-kana', lang: 'ja', text: item.kana }),
      criarElemento('span', { class: 'guia-celula-romaji', text: item.romaji }),
    ],
  );
}

/** Tabela no formato tradicional: linhas (k, s, t…) × colunas (a, i, u, e, o). */
function tabelaDeLinhas(linhas, detalhe) {
  const grade = criarElemento('div', { class: 'guia-tabela', role: 'group' });
  grade.append(
    criarElemento('span', { class: 'guia-cabecalho', 'aria-hidden': 'true' }),
    ...CABECALHO_VOGAIS.map((vogal) =>
      criarElemento('span', { class: 'guia-cabecalho', 'aria-hidden': 'true', text: vogal }),
    ),
  );
  for (const linha of linhas) {
    grade.append(
      criarElemento('span', {
        class: 'guia-cabecalho guia-cabecalho-linha',
        'aria-hidden': 'true',
        text: linha.grupo === 'a' ? '—' : linha.grupo.replace(/a$/, ''),
      }),
    );
    for (let coluna = 0; coluna < 5; coluna += 1) {
      grade.append(
        celula(
          linha.itens.find((item) => item.coluna === coluna),
          detalhe,
        ),
      );
    }
  }
  return grade;
}

/** Combinações em 3 colunas (ya, yu, yo). */
function tabelaDeCombinacoes(detalhe) {
  const grade = criarElemento('div', { class: 'guia-tabela guia-tabela-3' });
  ['ya', 'yu', 'yo'].forEach((rotulo) =>
    grade.append(criarElemento('span', { class: 'guia-cabecalho', text: rotulo })),
  );
  KATAKANA_COMBINADOS.forEach((item) => grade.append(celula(item, detalhe)));
  return grade;
}

/** Palavra de exemplo separada em sílabas: シャ sha · ツ tsu. */
export function silabasDaPalavra(palavra) {
  return criarElemento(
    'span',
    { class: 'silabas', lang: 'ja' },
    separarSilabas(palavra).map((silaba) =>
      criarElemento('span', { class: `silaba ${silaba.especial ? 'silaba-especial' : ''}` }, [
        criarElemento('span', { class: 'silaba-kana', text: silaba.kana }),
        criarElemento('span', {
          class: 'silaba-romaji',
          lang: 'pt-BR',
          // ー e ッ não têm som próprio: mostram o que acrescentam (+o, +k).
          text: silaba.especial ? `+${silaba.romaji}` : silaba.romaji,
        }),
      ]),
    ),
  );
}

function abaComoFalar() {
  return criarElemento('div', { class: 'guia-cartoes' }, [
    criarElemento('p', {
      class: 'guia-intro',
      text: 'O romaji usa o nosso alfabeto, mas algumas letras soam diferente do português. Fique de olho nestas:',
    }),
    ...SONS_DIFERENTES.map((som) =>
      criarElemento('article', { class: 'guia-cartao' }, [
        criarElemento('p', { class: 'guia-cartao-titulo' }, [
          criarElemento('strong', { text: som.romaji }),
          criarElemento('span', { class: 'guia-seta', text: ' → soa ' }),
          criarElemento('strong', { class: 'guia-soa', text: `"${som.soa}"` }),
        ]),
        criarElemento('p', { text: som.explicacao }),
        criarElemento('p', { class: 'guia-exemplo' }, [
          'Ex.: ',
          silabasDaPalavra(som.exemplo),
          botaoFalar(som.exemplo),
        ]),
      ]),
    ),
  ]);
}

function abaSinais() {
  return criarElemento('div', { class: 'guia-cartoes' }, [
    ...SINAIS.map((sinal) =>
      criarElemento('article', { class: 'guia-cartao' }, [
        criarElemento('p', { class: 'guia-cartao-titulo' }, [
          criarElemento('span', { class: 'guia-sinal', lang: 'ja', text: sinal.sinal }),
          criarElemento('strong', { text: sinal.nome }),
        ]),
        criarElemento('p', { text: sinal.explicacao }),
        criarElemento('p', { class: 'guia-exemplo' }, [
          'Ex.: ',
          silabasDaPalavra(sinal.exemplo),
          botaoFalar(sinal.exemplo),
        ]),
        criarElemento('p', { class: 'texto-suave', text: sinal.leitura }),
      ]),
    ),
  ]);
}

function conteudoDaAba(id, detalhe) {
  switch (id) {
    case 'sinais-dakuten':
      return [
        criarElemento('p', {
          class: 'guia-intro',
          text: 'Os dois risquinhos ゛ (tenten) e a bolinha ゜ (maru) mudam o som: カ ka → ガ ga, ハ ha → パ pa.',
        }),
        tabelaDeLinhas(
          LINHAS_DA_TABELA.filter((linha) => linha.dakuten),
          detalhe,
        ),
        detalhe.painel,
      ];
    case 'combinacoes':
      return [
        criarElemento('p', {
          class: 'guia-intro',
          text: 'Um kana terminado em "i" + ャ ュ ョ pequenos viram UMA sílaba só: キ + ャ = kya.',
        }),
        tabelaDeCombinacoes(detalhe),
        detalhe.painel,
      ];
    case 'como-falar':
      return [abaComoFalar()];
    case 'sinais':
      return [abaSinais()];
    default:
      return [
        tabelaDeLinhas(
          LINHAS_DA_TABELA.filter((linha) => !linha.dakuten),
          detalhe,
        ),
        detalhe.painel,
      ];
  }
}

/**
 * Abre o guia na última aba usada.
 * Dispara o evento "ks:guia" (a tela do jogo marca a pergunta como consultada).
 */
export function abrirGuia() {
  document.dispatchEvent(new CustomEvent('ks:guia'));
  const detalhe = criarDetalhe();
  const painelAbas = criarElemento('div', {
    class: 'guia-painel',
    role: 'tabpanel',
    tabindex: '0',
  });
  const botoes = ABAS.map((aba) =>
    criarElemento('button', {
      type: 'button',
      role: 'tab',
      class: 'guia-aba',
      id: `guia-aba-${aba.id}`,
      dataset: { aba: aba.id },
      text: aba.rotulo,
      onClick: () => selecionar(aba.id, true),
    }),
  );
  const lista = criarElemento('div', { class: 'guia-abas', role: 'tablist' }, botoes);

  function selecionar(id, focar = false) {
    abaLembrada = id;
    botoes.forEach((botao) => {
      const ativo = botao.dataset.aba === id;
      botao.setAttribute('aria-selected', String(ativo));
      botao.tabIndex = ativo ? 0 : -1;
      if (ativo && focar) {
        botao.focus();
      }
    });
    painelAbas.setAttribute('aria-labelledby', `guia-aba-${id}`);
    painelAbas.replaceChildren(...conteudoDaAba(id, detalhe));
    painelAbas.scrollTop = 0;
  }

  // Setas trocam de aba (padrão de acessibilidade para abas).
  lista.addEventListener('keydown', (evento) => {
    const atual = ABAS.findIndex((aba) => aba.id === abaLembrada);
    const passo = { ArrowRight: 1, ArrowLeft: -1 }[evento.key];
    if (passo) {
      evento.preventDefault();
      selecionar(ABAS[(atual + passo + ABAS.length) % ABAS.length].id, true);
    }
  });

  selecionar(abaLembrada);
  return abrirModal({
    titulo: '📖 Guia de romaji',
    classe: 'modal-guia',
    conteudo: [lista, painelAbas],
  });
}
