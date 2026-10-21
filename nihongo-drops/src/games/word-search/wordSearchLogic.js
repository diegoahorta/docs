// Regras do Caça-Palavras sem nada de Phaser: níveis, escolha das palavras
// (pelo SRS), geração da grade e conferência do que o jogador marcou.

import { HIRAGANA, KATAKANA } from '../../data/kana.js';
import { VOCABULARIO } from '../../data/vocab.js';
import { sortearVarios } from '../../core/srs.js';
import { sortear } from '../../core/utils.js';

/** Direções possíveis: [deslocamento na linha, deslocamento na coluna]. */
const DIRECOES = {
  direita: [0, 1],
  baixo: [1, 0],
  diagonalDescendo: [1, 1],
  diagonalSubindo: [-1, 1],
};

export const NIVEIS = Object.freeze([
  { tamanho: 5, palavras: 3, direcoes: ['direita', 'baixo'], scripts: ['hiragana'] },
  { tamanho: 6, palavras: 4, direcoes: ['direita', 'baixo'], scripts: ['hiragana'] },
  {
    tamanho: 7,
    palavras: 5,
    direcoes: ['direita', 'baixo', 'diagonalDescendo'],
    scripts: ['hiragana'],
  },
  {
    tamanho: 8,
    palavras: 5,
    direcoes: ['direita', 'baixo', 'diagonalDescendo'],
    scripts: ['katakana'],
  },
  {
    tamanho: 9,
    palavras: 7,
    direcoes: ['direita', 'baixo', 'diagonalDescendo', 'diagonalSubindo'],
    scripts: ['hiragana', 'katakana'],
  },
]);

export const CUSTO_DA_DICA = 15;
const TENTATIVAS_POR_PALAVRA = 300;

/** Pontos de uma palavra encontrada: palavras maiores valem mais. */
export function pontosDaPalavra(palavra) {
  return 20 + 10 * Array.from(palavra.kana).length;
}

/** Bônus por terminar o nível sem usar dicas. */
export function bonusDoNivel(usouDica) {
  return usouDica ? 0 : 50;
}

/** Palavras que cabem na grade do nível (2 kana até o tamanho da grade − 1). */
function palavrasDoNivel(nivel) {
  return VOCABULARIO.filter((palavra) => {
    const tamanho = Array.from(palavra.kana).length;
    return nivel.scripts.includes(palavra.script) && tamanho >= 2 && tamanho < nivel.tamanho;
  });
}

/** Tenta colocar a palavra em alguma posição/direção livre. Devolve as células ou null. */
function tentarColocar(grade, letras, direcoes) {
  const tamanho = grade.length;
  for (let tentativa = 0; tentativa < TENTATIVAS_POR_PALAVRA; tentativa += 1) {
    const [dl, dc] = DIRECOES[sortear(direcoes)];
    const linha = Math.floor(Math.random() * tamanho);
    const coluna = Math.floor(Math.random() * tamanho);
    const celulas = letras.map((_, i) => ({ l: linha + dl * i, c: coluna + dc * i }));
    const cabe = celulas.every(
      ({ l, c }, i) =>
        l >= 0 &&
        l < tamanho &&
        c >= 0 &&
        c < tamanho &&
        (grade[l][c] === null || grade[l][c] === letras[i]),
    );
    if (cabe) {
      celulas.forEach(({ l, c }, i) => {
        grade[l][c] = letras[i];
      });
      return celulas;
    }
  }
  return null;
}

/** Kana usados para preencher as casas vazias (do mesmo alfabeto das palavras). */
function kanaDePreenchimento(scripts) {
  const listas = { hiragana: HIRAGANA, katakana: KATAKANA };
  return scripts.flatMap((script) => listas[script].filter((item) => !item.dakuten));
}

/**
 * Gera a grade de um nível.
 * Devolve { tamanho, grade: [[kana]], palavras: [{ palavra, celulas }] }.
 */
export function gerarNivel(indiceDoNivel) {
  const nivel = NIVEIS[indiceDoNivel];
  const candidatas = palavrasDoNivel(nivel);
  const porId = new Map(candidatas.map((palavra) => [palavra.id, palavra]));
  // Sorteia o dobro do necessário (pelo SRS) e coloca as maiores primeiro.
  const escolhidas = sortearVarios([...porId.keys()], nivel.palavras * 2)
    .map((id) => porId.get(id))
    .sort((a, b) => Array.from(b.kana).length - Array.from(a.kana).length);

  const grade = Array.from({ length: nivel.tamanho }, () => Array(nivel.tamanho).fill(null));
  const colocadas = [];
  for (const palavra of escolhidas) {
    if (colocadas.length === nivel.palavras) {
      break;
    }
    const celulas = tentarColocar(grade, Array.from(palavra.kana), nivel.direcoes);
    if (celulas) {
      colocadas.push({ palavra, celulas });
    }
  }

  const preenchimento = kanaDePreenchimento(nivel.scripts);
  grade.forEach((linha) =>
    linha.forEach((valor, c) => {
      linha[c] = valor ?? sortear(preenchimento).kana;
    }),
  );
  return { tamanho: nivel.tamanho, grade, palavras: colocadas };
}

/**
 * Células da linha reta entre duas casas (horizontal, vertical ou diagonal).
 * Devolve null se as casas não estiverem alinhadas.
 */
export function celulasEntre(inicio, fim) {
  const dl = fim.l - inicio.l;
  const dc = fim.c - inicio.c;
  const alinhado = dl === 0 || dc === 0 || Math.abs(dl) === Math.abs(dc);
  if (!alinhado) {
    return null;
  }
  const passos = Math.max(Math.abs(dl), Math.abs(dc));
  return Array.from({ length: passos + 1 }, (_, i) => ({
    l: inicio.l + Math.sign(dl) * i,
    c: inicio.c + Math.sign(dc) * i,
  }));
}

/** Ajusta o fim do arraste para a direção reta mais próxima (8 direções). */
export function alinharFim(inicio, alvo) {
  const dl = alvo.l - inicio.l;
  const dc = alvo.c - inicio.c;
  const angulo = Math.round(Math.atan2(dl, dc) / (Math.PI / 4)) * (Math.PI / 4);
  const passos = Math.max(Math.abs(dl), Math.abs(dc));
  return {
    l: inicio.l + Math.round(Math.sin(angulo)) * passos,
    c: inicio.c + Math.round(Math.cos(angulo)) * passos,
  };
}

/** Texto formado pelas células marcadas. */
export function textoDasCelulas(grade, celulas) {
  return celulas.map(({ l, c }) => grade[l][c]).join('');
}

/**
 * Procura uma palavra ainda não encontrada com o texto marcado (lido em
 * qualquer sentido). Comparar o texto, e não a posição, evita punir o jogador
 * quando o preenchimento aleatório forma a mesma palavra em outro lugar.
 */
export function conferirSelecao(grade, celulas, palavras, encontradas) {
  const texto = textoDasCelulas(grade, celulas);
  const invertido = Array.from(texto).reverse().join('');
  return (
    palavras.find(
      ({ palavra }) =>
        !encontradas.has(palavra.id) && (palavra.kana === texto || palavra.kana === invertido),
    ) ?? null
  );
}
