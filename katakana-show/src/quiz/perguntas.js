// Geração das perguntas do quiz (lógica pura, sem DOM).
// As perguntas alternam entre LER KATAKANA e ENTENDER PALAVRAS, como pede a revisão:
//   kana → romaji, romaji → kana, kana combinado → romaji,
//   palavra → significado, palavra → leitura, significado → palavra, som → palavra.
// As alternativas erradas são feitas para ensinar: katakana parecidos (シ/ツ, ソ/ン)
// e palavras "quase certas" (ピザ × ピサ), que obrigam a olhar cada traço.

import {
  KATAKANA_COMBINADOS,
  katakanaPorCaractere,
  lerEmRomaji,
  listarKatakana,
  parecidosCom,
} from '../data/katakana.js';
import { palavrasAteNivel } from '../data/palavras.js';
import { embaralhar, sortear } from '../core/utils.js';

const ALTERNATIVAS = 4;

/** ヂ e ヅ têm a mesma leitura de ジ e ズ: ficam fora das perguntas de kana isolado. */
const FORA_DAS_PERGUNTAS = new Set(['ヂ', 'ヅ', 'ヲ']);

/** Tipos de pergunta de cada família; a rodada alterna as famílias. */
const TIPOS_DE_KANA = ['kana-romaji', 'romaji-kana'];
const TIPOS_DE_PALAVRA = ['palavra-significado', 'palavra-romaji', 'significado-palavra'];

/**
 * Sorteia um item levando em conta o peso de cada um (revisão inteligente)
 * e evitando os que já saíram nesta rodada.
 */
function sortearPonderado(lista, peso, jaUsados) {
  const candidatos = lista.filter((item) => !jaUsados.has(item.id));
  const fonte = candidatos.length > 0 ? candidatos : lista;
  const pesos = fonte.map((item) => peso(item.id));
  let sorteio = Math.random() * pesos.reduce((soma, valor) => soma + valor, 0);
  for (let i = 0; i < fonte.length; i += 1) {
    sorteio -= pesos[i];
    if (sorteio <= 0) {
      return fonte[i];
    }
  }
  return fonte.at(-1);
}

/** Junta alternativas sem repetir rótulos: primeiro as "pegadinhas", depois as aleatórias. */
function completarAlternativas(correta, pegadinhas, reserva) {
  const usados = new Set([correta]);
  const erradas = [];
  for (const opcao of [...embaralhar(pegadinhas), ...embaralhar(reserva)]) {
    if (erradas.length === ALTERNATIVAS - 1) {
      break;
    }
    if (opcao && !usados.has(opcao)) {
      usados.add(opcao);
      erradas.push(opcao);
    }
  }
  return erradas;
}

/** Monta a pergunta final com as opções embaralhadas. */
function montar(base, corretaOpcao, erradas) {
  const opcoes = embaralhar([{ ...corretaOpcao, certa: true }, ...erradas]);
  return { ...base, opcoes, correta: opcoes.findIndex((opcao) => opcao.certa) };
}

/**
 * Troca um kana da palavra por um parecido (ou tira/põe o ゛) para criar uma
 * palavra "quase certa": ピザ → ピサ, ゲーム → ケーム, テレビ → テルビ.
 */
export function mutarPalavra(palavra) {
  const letras = [...palavra];
  const posicoes = embaralhar(letras.map((_, indice) => indice));
  for (const indice of posicoes) {
    const letra = letras[indice];
    const semSinal = letra.normalize('NFD').charAt(0);
    const trocas = [...parecidosCom(letra)];
    if (semSinal !== letra) {
      trocas.push(semSinal); // ガ → カ
    } else if (katakanaPorCaractere(`${letra}゙`.normalize('NFC'))) {
      trocas.push(`${letra}゙`.normalize('NFC')); // カ → ガ
    }
    const validas = trocas.filter(
      (troca) => katakanaPorCaractere(troca) && !FORA_DAS_PERGUNTAS.has(troca),
    );
    // Não mexe no kana grande antes de ャュョ (キャ continua uma combinação válida).
    const proximaPequena = /[ャュョ]/.test(letras[indice + 1] ?? '');
    if (validas.length > 0 && !proximaPequena) {
      const copia = [...letras];
      copia[indice] = sortear(validas);
      return copia.join('');
    }
  }
  return null;
}

/** Várias mutações diferentes de uma palavra (sem repetir e sem palavras reais). */
function mutacoes(palavra, quantidade, palavrasReais) {
  const resultado = new Set();
  for (let tentativa = 0; tentativa < 20 && resultado.size < quantidade; tentativa += 1) {
    const mutada = mutarPalavra(palavra);
    if (mutada && mutada !== palavra && !palavrasReais.has(mutada)) {
      resultado.add(mutada);
    }
  }
  return [...resultado];
}

// ---------- Perguntas de kana ----------

/** Pegadinhas de um kana: os parecidos e o mesmo kana com/sem ゛゜ (ゴ ↔ コ). */
function vizinhosDe(kana) {
  const semSinal = kana.normalize('NFD').charAt(0);
  const comSinais = [`${semSinal}\u3099`, `${semSinal}\u309a`].map((letra) =>
    letra.normalize('NFC'),
  );
  return [...parecidosCom(kana), semSinal, ...comSinais].filter(
    (letra) => letra !== kana && katakanaPorCaractere(letra) && !FORA_DAS_PERGUNTAS.has(letra),
  );
}

function perguntaKanaRomaji(item, pool) {
  const pegadinhas = vizinhosDe(item.kana).map((letra) => katakanaPorCaractere(letra).romaji);
  const erradas = completarAlternativas(
    item.romaji,
    pegadinhas,
    pool.map((kana) => kana.romaji),
  );
  return montar(
    {
      tipo: 'kana-romaji',
      titulo: 'Como se lê?',
      destaque: { kana: item.kana },
      item,
      idsRevisao: [item.id],
    },
    { rotulo: item.romaji, romaji: true },
    erradas.map((romaji) => ({ rotulo: romaji, romaji: true })),
  );
}

function perguntaRomajiKana(item, pool) {
  const erradas = completarAlternativas(
    item.kana,
    vizinhosDe(item.kana),
    pool.filter((kana) => kana.romaji !== item.romaji).map((kana) => kana.kana),
  );
  return montar(
    {
      tipo: 'romaji-kana',
      titulo: 'Qual é o katakana?',
      destaque: { romaji: item.romaji },
      item,
      idsRevisao: [item.id],
    },
    { rotulo: item.kana, kana: true },
    erradas.map((kana) => ({ rotulo: kana, kana: true })),
  );
}

// ---------- Perguntas de palavra ----------

function perguntaPalavraSignificado(palavra, palavras) {
  const mesmaCategoria = palavras.filter((outra) => outra.categoria === palavra.categoria);
  const porSignificado = new Map(palavras.map((outra) => [outra.pt, outra]));
  const erradas = completarAlternativas(
    palavra.pt,
    mesmaCategoria.map((outra) => outra.pt),
    palavras.map((outra) => outra.pt),
  );
  return montar(
    {
      tipo: 'palavra-significado',
      titulo: 'O que significa?',
      destaque: { kana: palavra.kana, palavra: true },
      palavra,
      idsRevisao: [palavra.id],
    },
    { rotulo: palavra.pt, emoji: palavra.emoji },
    erradas.map((pt) => ({ rotulo: pt, emoji: porSignificado.get(pt).emoji })),
  );
}

function perguntaPalavraRomaji(palavra, palavras, reais) {
  const quaseCertas = mutacoes(palavra.kana, 3, reais).map(lerEmRomaji);
  const parecidas = palavras
    .filter((outra) => Math.abs(outra.kana.length - palavra.kana.length) <= 1)
    .map((outra) => outra.romaji);
  const erradas = completarAlternativas(palavra.romaji, quaseCertas.slice(0, 2), [
    ...quaseCertas,
    ...parecidas,
  ]);
  return montar(
    {
      tipo: 'palavra-romaji',
      titulo: 'Como se lê esta palavra?',
      destaque: { kana: palavra.kana, palavra: true },
      palavra,
      idsRevisao: [palavra.id],
    },
    { rotulo: palavra.romaji, romaji: true },
    erradas.map((romaji) => ({ rotulo: romaji, romaji: true })),
  );
}

function perguntaSignificadoPalavra(palavra, palavras, reais) {
  const erradas = completarAlternativas(
    palavra.kana,
    mutacoes(palavra.kana, 2, reais),
    palavras.map((outra) => outra.kana),
  );
  return montar(
    {
      tipo: 'significado-palavra',
      titulo: 'Como se escreve em katakana?',
      destaque: { emoji: palavra.emoji, pt: palavra.pt },
      palavra,
      idsRevisao: [palavra.id],
    },
    { rotulo: palavra.kana, kana: true },
    erradas.map((kana) => ({ rotulo: kana, kana: true })),
  );
}

function perguntaOuvirPalavra(palavra, palavras, reais) {
  const pergunta = perguntaSignificadoPalavra(palavra, palavras, reais);
  return {
    ...pergunta,
    tipo: 'ouvir-palavra',
    titulo: 'Ouça e escolha a palavra!',
    destaque: { audio: palavra.kana },
  };
}

// ---------- A rodada ----------

/**
 * Cria a lista de perguntas de uma rodada.
 * @param {object} temporada  uma das TEMPORADAS
 * @param {number} quantidade número de perguntas
 * @param {object} opcoes     { peso(id) → número, comVoz: boolean }
 */
export function criarRodada(temporada, quantidade, { peso = () => 1, comVoz = false } = {}) {
  const kanas = listarKatakana(temporada.tiposDeKana).filter(
    (item) => !FORA_DAS_PERGUNTAS.has(item.kana),
  );
  const combinados = temporada.combinados ? KATAKANA_COMBINADOS : [];
  const palavras = palavrasAteNivel(temporada.nivelDasPalavras);
  const reais = new Set(palavras.map((palavra) => palavra.kana));
  // As palavras mais difíceis da temporada aparecem um pouco mais.
  const pesoDaPalavra = (id) => {
    const palavra = palavras.find((outra) => outra.id === id);
    return peso(id) * (palavra?.nivel === temporada.nivelDasPalavras ? 1.5 : 1);
  };

  const usados = new Set();
  const tiposDePalavra = comVoz ? [...TIPOS_DE_PALAVRA, 'ouvir-palavra'] : TIPOS_DE_PALAVRA;
  const ordemKana = embaralhar(TIPOS_DE_KANA);
  const ordemPalavra = embaralhar(tiposDePalavra);
  const perguntas = [];

  for (let i = 0; i < quantidade; i += 1) {
    if (i % 2 === 0) {
      // Pergunta de leitura de katakana (às vezes uma combinação キャ, シュ…).
      const usarCombinado = combinados.length > 0 && Math.random() < 0.3;
      const pool = usarCombinado ? combinados : kanas;
      const item = sortearPonderado(pool, peso, usados);
      usados.add(item.id);
      const tipo = usarCombinado ? 'kana-romaji' : ordemKana[(i / 2) % ordemKana.length];
      perguntas.push(
        tipo === 'kana-romaji' ? perguntaKanaRomaji(item, pool) : perguntaRomajiKana(item, pool),
      );
    } else {
      // Pergunta de vocabulário.
      const palavra = sortearPonderado(palavras, pesoDaPalavra, usados);
      usados.add(palavra.id);
      const tipo = ordemPalavra[Math.floor(i / 2) % ordemPalavra.length];
      const criar = {
        'palavra-significado': perguntaPalavraSignificado,
        'palavra-romaji': perguntaPalavraRomaji,
        'significado-palavra': perguntaSignificadoPalavra,
        'ouvir-palavra': perguntaOuvirPalavra,
      }[tipo];
      perguntas.push(criar(palavra, palavras, reais));
    }
  }
  return perguntas;
}
