// Tela "Estudar": letras (jamo) por grupo e a tabela de sílabas (consoante ×
// vogal), com a caixa do SRS de cada item. Ao tocar num item abre o detalhe:
// ordem dos traços, pronúncia, dica, como a sílaba é montada e exemplos.

import { criarElemento } from '../core/utils.js';
import { GRUPOS_JAMO, GRUPOS_SILABAS, NOMES_DOS_GRUPOS, listarItens } from '../data/hangul.js';
import { palavrasCom } from '../data/vocab.js';
import { obterRegistro, TOTAL_CAIXAS } from '../core/srs.js';
import { falar } from '../core/speech.js';
import { abrirModal } from './modal.js';
import { criarBotaoFala } from './speakButton.js';
import { criarAnimacaoTracos } from './strokeOrder.js';
import { entrar } from './motion.js';

const ABAS = { jamo: 'Letras 자모', silabas: 'Sílabas 음절' };
const VOGAIS_DA_TABELA = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ'];
const TIPOS = { vogal: 'Vogal', consoante: 'Consoante', silaba: 'Sílaba' };

/** 0 = ainda não visto; 1 a 5 = caixa do SRS. */
function nivelDoItem(item) {
  return obterRegistro(item.id)?.caixa ?? 0;
}

function descreverNivel(nivel) {
  return nivel === 0 ? 'ainda não visto' : `caixa ${nivel} de ${TOTAL_CAIXAS}`;
}

function criarCelula(item) {
  const nivel = nivelDoItem(item);
  return criarElemento(
    'button',
    {
      type: 'button',
      class: 'celula-hangul',
      'aria-label': `${item.hangul}, ${item.romanizacao}, ${descreverNivel(nivel)}`,
      dataset: { caixa: String(nivel) },
      onClick: () => abrirDetalhe(item),
    },
    [
      criarElemento('span', { class: 'hangul', lang: 'ko', text: item.hangul }),
      criarElemento('span', { class: 'romanizacao', text: item.romanizacao }),
    ],
  );
}

/** Aba das letras: um bloco por grupo (vogais básicas, consoantes I...). */
function criarPainelJamo() {
  return criarElemento(
    'div',
    { class: 'painel-script', role: 'tabpanel' },
    GRUPOS_JAMO.flatMap((grupo) => [
      criarElemento('h3', { text: NOMES_DOS_GRUPOS[grupo] }),
      criarElemento(
        'div',
        { class: 'tabela-hangul tabela-jamo' },
        listarItens('jamo', [grupo]).map(criarCelula),
      ),
    ]),
  );
}

/** Aba das sílabas: linhas = consoantes, colunas = vogais (como num quadro de hangul). */
function criarPainelSilabas() {
  const cabecalho = [
    criarElemento('span'),
    ...VOGAIS_DA_TABELA.map((vogal) =>
      criarElemento('span', { class: 'tabela-cabecalho', lang: 'ko', text: vogal }),
    ),
  ];
  const linhas = GRUPOS_SILABAS.flatMap((grupo) => {
    const itens = listarItens('silabas', [grupo]);
    return [
      criarElemento('span', { class: 'tabela-cabecalho', lang: 'ko', text: itens[0].partes[0] }),
      ...itens.map(criarCelula),
    ];
  });
  return criarElemento('div', { class: 'painel-script', role: 'tabpanel' }, [
    criarElemento('div', { class: 'tabela-hangul tabela-silabas' }, [...cabecalho, ...linhas]),
  ]);
}

/** Abas acessíveis Letras / Sílabas. */
function criarAbas(conteiner) {
  const abas = Object.entries(ABAS).map(([conjunto, nome]) =>
    criarElemento('button', {
      type: 'button',
      role: 'tab',
      class: 'aba',
      'aria-selected': 'false',
      dataset: { conjunto },
      text: nome,
    }),
  );
  const selecionar = (conjunto) => {
    abas.forEach((aba) =>
      aba.setAttribute('aria-selected', String(aba.dataset.conjunto === conjunto)),
    );
    const painel = conjunto === 'silabas' ? criarPainelSilabas() : criarPainelJamo();
    conteiner.replaceChildren(painel);
    entrar(painel.querySelectorAll('.celula-hangul'), { y: 10, duracao: 0.25, intervalo: 0.006 });
  };
  abas.forEach((aba) => aba.addEventListener('click', () => selecionar(aba.dataset.conjunto)));
  return { lista: criarElemento('div', { class: 'abas', role: 'tablist' }, abas), selecionar };
}

/** Abre a tela de estudo. */
export function abrirTabelaHangul(conjuntoInicial = 'jamo') {
  const conteiner = criarElemento('div');
  const abas = criarAbas(conteiner);
  abrirModal({
    titulo: 'Estudar hangul',
    classe: 'modal-largo',
    conteudo: [
      criarElemento('p', {
        class: 'texto-suave',
        text: 'Toque numa letra ou sílaba para ver a ordem dos traços e ouvir a pronúncia. A bolinha mostra a caixa do SRS: cinza = ainda não visto; verde mais claro = mais dominado.',
      }),
      abas.lista,
      conteiner,
    ],
  });
  abas.selecionar(conjuntoInicial);
}

function criarExemplos(item) {
  const palavras = palavrasCom(item.hangul);
  if (palavras.length === 0) {
    return null;
  }
  return criarElemento('div', { class: 'exemplos' }, [
    criarElemento('h3', { text: 'Exemplos' }),
    criarElemento(
      'ul',
      {},
      palavras.map((palavra) =>
        criarElemento('li', {}, [
          criarElemento('span', { 'aria-hidden': 'true', text: palavra.emoji }),
          criarElemento('span', { class: 'hangul-medio', lang: 'ko', text: palavra.hangul }),
          criarElemento('span', { class: 'romanizacao', text: palavra.romanizacao }),
          criarElemento('span', { text: palavra.pt }),
          criarBotaoFala(palavra.fala, { rotulo: palavra.pt }),
        ]),
      ),
    ),
  ]);
}

/** Linha de informações: tipo, nome da letra (ou montagem da sílaba), traços e caixa. */
function textoDeInformacoes(item, totalDeTracos) {
  const partes = [TIPOS[item.tipo]];
  if (item.nome) {
    partes.push(`nome: ${item.nome}`);
  }
  if (item.partes) {
    partes.push(`montagem: ${item.partes.join(' + ')}`);
  }
  partes.push(`${totalDeTracos} traço(s)`, descreverNivel(nivelDoItem(item)));
  return partes.join(' · ');
}

/** Abre o detalhe de uma letra ou sílaba com a animação de traços. */
export function abrirDetalhe(item) {
  const tracos = criarAnimacaoTracos(item.hangul, { tamanho: 220 });
  const botaoRepetir = criarElemento('button', {
    type: 'button',
    class: 'botao botao-secundario',
    text: '↻ Repetir traços',
    onClick: () => tracos.tocar(),
  });
  abrirModal({
    titulo: `${item.hangul} — ${item.romanizacao}`,
    classe: 'modal-detalhe',
    aoFechar: () => tracos.destroy(),
    conteudo: [
      criarElemento('div', { class: 'detalhe-hangul' }, [
        criarElemento('div', { class: 'detalhe-tracos' }, [tracos.elemento, botaoRepetir]),
        criarElemento('div', { class: 'detalhe-info' }, [
          criarElemento('div', { class: 'detalhe-leitura' }, [
            criarElemento('span', { class: 'hangul hangul-grande', lang: 'ko', text: item.hangul }),
            criarElemento('span', { class: 'detalhe-romanizacao', text: item.romanizacao }),
            criarBotaoFala(item.fala, { rotulo: item.hangul }),
          ]),
          criarElemento('p', {
            class: 'texto-suave',
            text: textoDeInformacoes(item, tracos.total),
          }),
          criarElemento('p', { class: 'dica', text: `💡 ${item.mnemonico}` }),
          criarExemplos(item),
        ]),
      ]),
    ],
  });
  falar(item.fala);
  tracos.tocar();
}
