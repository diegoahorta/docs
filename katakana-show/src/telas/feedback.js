// Cartão que aparece depois de cada resposta: mostra a resposta certa com o guia
// fonético (sílaba por sílaba), a dica mnemônica e, no erro, compara o que o aluno
// marcou com o certo (ex.: "サ sa × ザ za").

import { katakanaPorCaractere } from '../data/katakana.js';
import { CATEGORIAS, PALAVRAS_KATAKANA } from '../data/palavras.js';
import { comoSoa } from '../data/fonetica.js';
import { criarElemento } from '../core/utils.js';
import { botaoFalar } from '../ui/falar.js';
import { silabasDaPalavra } from '../ui/guia.js';

/**
 * Diferenças entre duas palavras do mesmo tamanho, kana por kana.
 * Ex.: ("ピザ", "ピサ") → [{ certo: "ザ", marcado: "サ" }]
 */
export function diferencas(certa, marcada) {
  const a = [...certa];
  const b = [...marcada];
  if (a.length !== b.length) {
    return [];
  }
  return a
    .map((letra, indice) => ({ certo: letra, marcado: b[indice] }))
    .filter((par) => par.certo !== par.marcado);
}

/** "シ (shi)" para um kana conhecido. */
function kanaComLeitura(kana) {
  const item = katakanaPorCaractere(kana);
  return item ? `${kana} (${item.romaji})` : kana;
}

/** Explica a escolha errada, quando dá para ensinar algo com ela. */
function explicarErro(pergunta, escolhida) {
  if (!escolhida) {
    return null;
  }
  if (pergunta.tipo === 'romaji-kana') {
    return `Você marcou ${kanaComLeitura(escolhida.rotulo)}. O certo é ${kanaComLeitura(pergunta.item.kana)}.`;
  }
  if (pergunta.tipo === 'kana-romaji') {
    return `Você marcou "${escolhida.rotulo}", mas ${pergunta.item.kana} se lê "${pergunta.item.romaji}".`;
  }
  // A alternativa marcada é outra palavra de verdade? Aproveita para ensiná-la.
  const outra = PALAVRAS_KATAKANA.find(
    (palavra) =>
      palavra !== pergunta.palavra &&
      [palavra.kana, palavra.pt, palavra.romaji].includes(escolhida.rotulo),
  );
  if (pergunta.palavra && outra) {
    return `Você marcou ${outra.emoji} ${outra.kana} (${outra.romaji}) = ${outra.pt}. É outra palavra!`;
  }
  if (pergunta.palavra && escolhida.kana) {
    const trocas = diferencas(pergunta.palavra.kana, escolhida.rotulo);
    if (trocas.length > 0 && trocas.length <= 2) {
      const lista = trocas
        .map((par) => `${kanaComLeitura(par.marcado)} × ${kanaComLeitura(par.certo)}`)
        .join(', ');
      return `Quase! Repare na diferença: ${lista}.`;
    }
  }
  if (pergunta.tipo === 'palavra-romaji') {
    return `Você marcou "${escolhida.rotulo}". Leia sílaba por sílaba com o guia abaixo.`;
  }
  return null;
}

/** Bloco que explica um kana isolado. */
function explicacaoDeKana(item) {
  return criarElemento('div', { class: 'explicacao' }, [
    criarElemento('span', { class: 'explicacao-kana', lang: 'ja', text: item.kana }),
    criarElemento('div', { class: 'explicacao-texto' }, [
      criarElemento('p', { class: 'explicacao-romaji' }, [
        criarElemento('strong', { text: item.romaji }),
        ` — soa "${comoSoa(item.romaji)}"`,
        botaoFalar(item.kana),
      ]),
      criarElemento('p', { text: `💡 ${item.mnemonico}` }),
    ]),
  ]);
}

/** Bloco que explica uma palavra: emoji, sílabas com romaji, significado e curiosidade. */
function explicacaoDePalavra(palavra, novaFigurinha) {
  const categoria = CATEGORIAS[palavra.categoria];
  return criarElemento('div', { class: 'explicacao' }, [
    criarElemento('span', {
      class: 'explicacao-emoji',
      'aria-hidden': 'true',
      text: palavra.emoji,
    }),
    criarElemento('div', { class: 'explicacao-texto' }, [
      criarElemento('p', { class: 'explicacao-palavra' }, [
        criarElemento('span', { lang: 'ja', class: 'explicacao-palavra-kana', text: palavra.kana }),
        botaoFalar(palavra.kana),
      ]),
      silabasDaPalavra(palavra.kana),
      criarElemento('p', { class: 'explicacao-romaji' }, [
        criarElemento('strong', { text: palavra.romaji }),
        ` = ${palavra.pt}`,
        criarElemento('span', {
          class: 'etiqueta',
          text: `${categoria.emoji} ${categoria.nome}`,
        }),
      ]),
      palavra.curiosidade ? criarElemento('p', { text: `🌎 ${palavra.curiosidade}` }) : null,
      novaFigurinha
        ? criarElemento('p', { class: 'nova-figurinha', text: '✨ Nova figurinha no seu álbum!' })
        : null,
    ]),
  ]);
}

/**
 * Cria o cartão de resultado da pergunta.
 * @param {object} pergunta
 * @param {object} dados { acertou, escolhida, pontos, tempoEsgotado, novaFigurinha,
 *                         consultouGuia, ultima, aoContinuar }
 */
export function criarFeedback(pergunta, dados) {
  const { acertou, escolhida, pontos, tempoEsgotado, novaFigurinha, consultouGuia, ultima } = dados;
  const erro = acertou ? null : explicarErro(pergunta, escolhida);
  const titulo = acertou ? '✅ CERTO!' : tempoEsgotado ? '⏰ Tempo esgotado!' : '❌ Ops, não foi!';
  const botao = criarElemento('button', {
    type: 'button',
    class: 'botao botao-proxima',
    text: ultima ? '🏁 Ver o resultado' : 'Próxima ▶',
    onClick: dados.aoContinuar,
  });

  const cartao = criarElemento(
    'div',
    {
      class: `feedback ${acertou ? 'feedback-certo' : 'feedback-errado'}`,
      role: 'status',
    },
    [
      criarElemento('div', { class: 'feedback-cabecalho' }, [
        criarElemento('strong', { class: 'feedback-titulo', text: titulo }),
        acertou ? criarElemento('span', { class: 'feedback-pontos', text: `+${pontos}` }) : null,
        acertou && consultouGuia
          ? criarElemento('span', { class: 'etiqueta', text: '📖 ½ ponto (guia)' })
          : null,
      ]),
      erro ? criarElemento('p', { class: 'feedback-erro', text: erro }) : null,
      pergunta.palavra
        ? explicacaoDePalavra(pergunta.palavra, novaFigurinha)
        : explicacaoDeKana(pergunta.item),
      botao,
    ],
  );
  return { cartao, botao };
}
