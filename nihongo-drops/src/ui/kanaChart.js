// Tela "Estudar": tabela de hiragana/katakana com a caixa do SRS de cada kana.
// Ao tocar em um kana abre o detalhe: ordem dos traços, pronúncia, dica e exemplos.

import { criarElemento } from '../core/utils.js';
import { GRUPOS_BASICOS, GRUPOS_DAKUTEN, listarKana } from '../data/kana.js';
import { palavrasComKana } from '../data/vocab.js';
import { obterCaixa, TOTAL_CAIXAS } from '../core/srs.js';
import { falar } from '../core/speech.js';
import { abrirModal } from './modal.js';
import { criarBotaoFala } from './speakButton.js';
import { criarAnimacaoTracos } from './strokeOrder.js';
import { entrar } from './motion.js';

const NOMES_SCRIPT = { hiragana: 'Hiragana ひらがな', katakana: 'Katakana カタカナ' };

/** Monta uma grade de 5 colunas (a i u e o), deixando buracos em や e わ. */
function criarGrade(script, grupos) {
  const grade = criarElemento('div', { class: 'tabela-kana' });
  for (const grupo of grupos) {
    const linha = Array(5).fill(null);
    listarKana(script, [grupo]).forEach((item) => {
      linha[item.coluna] = item;
    });
    linha.forEach((item) => grade.append(item ? criarCelula(item) : criarElemento('span')));
  }
  return grade;
}

function criarCelula(item) {
  const caixa = obterCaixa(item.id);
  return criarElemento(
    'button',
    {
      type: 'button',
      class: 'celula-kana',
      'aria-label': `${item.kana}, ${item.romaji}, caixa ${caixa} de ${TOTAL_CAIXAS}`,
      dataset: { caixa: String(caixa) },
      onClick: () => abrirDetalheKana(item),
    },
    [
      criarElemento('span', { class: 'kana', lang: 'ja', text: item.kana }),
      criarElemento('span', { class: 'romaji', text: item.romaji }),
    ],
  );
}

function criarPainelScript(script) {
  return criarElemento('div', { class: 'painel-script', role: 'tabpanel' }, [
    criarGrade(script, GRUPOS_BASICOS),
    criarElemento('h3', { text: 'Com ゛ (tenten) e ゜ (maru)' }),
    criarGrade(script, GRUPOS_DAKUTEN),
  ]);
}

/** Abas acessíveis Hiragana / Katakana. */
function criarAbas(conteiner) {
  const abas = Object.entries(NOMES_SCRIPT).map(([script, nome]) =>
    criarElemento('button', {
      type: 'button',
      role: 'tab',
      class: 'aba',
      'aria-selected': 'false',
      dataset: { script },
      text: nome,
    }),
  );
  const selecionar = (script) => {
    abas.forEach((aba) => aba.setAttribute('aria-selected', String(aba.dataset.script === script)));
    const painel = criarPainelScript(script);
    conteiner.replaceChildren(painel);
    entrar(painel.querySelectorAll('.celula-kana'), { y: 10, duracao: 0.25, intervalo: 0.008 });
  };
  abas.forEach((aba) => aba.addEventListener('click', () => selecionar(aba.dataset.script)));
  return { lista: criarElemento('div', { class: 'abas', role: 'tablist' }, abas), selecionar };
}

/** Abre a tabela de kana. */
export function abrirTabelaKana(scriptInicial = 'hiragana') {
  const conteiner = criarElemento('div');
  const abas = criarAbas(conteiner);
  abrirModal({
    titulo: 'Estudar kana',
    classe: 'modal-largo',
    conteudo: [
      criarElemento('p', {
        class: 'texto-suave',
        text: 'Toque em um kana para ver a ordem dos traços e ouvir a pronúncia. A cor indica a caixa do SRS (1 = precisa revisar, 5 = dominado).',
      }),
      abas.lista,
      conteiner,
    ],
  });
  abas.selecionar(scriptInicial);
}

function criarExemplos(item) {
  const palavras = palavrasComKana(item.kana);
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
          criarElemento('span', { class: 'kana-medio', lang: 'ja', text: palavra.kana }),
          criarElemento('span', { class: 'romaji', text: palavra.romaji }),
          criarElemento('span', { text: palavra.pt }),
          criarBotaoFala(palavra.kana, { rotulo: palavra.pt }),
        ]),
      ),
    ),
  ]);
}

/** Abre o detalhe de um kana com a animação de traços. */
export function abrirDetalheKana(item) {
  const tracos = criarAnimacaoTracos(item.kana, { tamanho: 220 });
  const botaoRepetir = criarElemento('button', {
    type: 'button',
    class: 'botao botao-secundario',
    text: '↻ Repetir traços',
    onClick: () => tracos.tocar(),
  });
  abrirModal({
    titulo: `${item.kana} — ${item.romaji}`,
    classe: 'modal-detalhe',
    aoFechar: () => tracos.destroy(),
    conteudo: [
      criarElemento('div', { class: 'detalhe-kana' }, [
        criarElemento('div', { class: 'detalhe-tracos' }, [tracos.elemento, botaoRepetir]),
        criarElemento('div', { class: 'detalhe-info' }, [
          criarElemento('div', { class: 'detalhe-leitura' }, [
            criarElemento('span', { class: 'kana kana-grande', lang: 'ja', text: item.kana }),
            criarElemento('span', { class: 'detalhe-romaji', text: item.romaji }),
            criarBotaoFala(item.kana),
          ]),
          criarElemento('p', {
            text: `${item.script === 'hiragana' ? 'Hiragana' : 'Katakana'} · ${tracos.total} traço(s) · par: ${item.par} · caixa ${obterCaixa(item.id)} de ${TOTAL_CAIXAS}`,
            class: 'texto-suave',
          }),
          criarElemento('p', { class: 'dica', text: `💡 ${item.mnemonico}` }),
          criarExemplos(item),
        ]),
      ]),
    ],
  });
  falar(item.kana);
  tracos.tocar();
}
