// Lista de conquistas. Cada uma tem uma função `verificar(estado)` que
// recebe o progresso atual e diz se a conquista foi alcançada.

import { listarItens } from '../data/hangul.js';
import { obterCaixa } from './srs.js';
import { nivelDoXP } from './levels.js';

/** Todos os itens da lista chegaram pelo menos à caixa indicada? */
function todosNaCaixa(itens, caixaMinima) {
  return itens.every((item) => obterCaixa(item.id) >= caixaMinima);
}

export const CONQUISTAS = Object.freeze([
  {
    id: 'primeiro-acerto',
    icone: '🌱',
    titulo: 'Primeiro passo',
    descricao: 'Acerte sua primeira letra ou sílaba.',
    verificar: (estado) => estado.estatisticas.acertos >= 1,
  },
  {
    id: 'primeira-partida',
    icone: '🎮',
    titulo: 'Jogador(a)',
    descricao: 'Termine uma partida de qualquer minijogo.',
    verificar: (estado) => estado.estatisticas.partidas >= 1,
  },
  {
    id: 'cem-acertos',
    icone: '💯',
    titulo: 'Cem acertos',
    descricao: 'Acumule 100 respostas certas.',
    verificar: (estado) => estado.estatisticas.acertos >= 100,
  },
  {
    id: 'vogais-basicas',
    icone: 'ㅏ',
    titulo: 'Vogais dominadas',
    descricao: 'Leve as vogais básicas (ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ) até a caixa 3 do SRS.',
    verificar: () => todosNaCaixa(listarItens('jamo', ['vogais']), 3),
  },
  {
    id: 'mestre-jamo',
    icone: '🇰🇷',
    titulo: 'Mestre dos jamo',
    descricao: 'Leve as 40 letras do hangul até a caixa 3.',
    verificar: () => todosNaCaixa(listarItens('jamo'), 3),
  },
  {
    id: 'primeiras-silabas',
    icone: '가',
    titulo: 'Primeiras sílabas',
    descricao: 'Leve as sílabas com ㄱ (가 거 고 구 그 기) até a caixa 3.',
    verificar: () => todosNaCaixa(listarItens('silabas', ['s-ㄱ']), 3),
  },
  {
    id: 'sequencia-3',
    icone: '🔥',
    titulo: 'Três dias seguidos',
    descricao: 'Estude 3 dias seguidos.',
    verificar: (estado) => estado.sequencia.melhor >= 3,
  },
  {
    id: 'sequencia-7',
    icone: '🏮',
    titulo: 'Uma semana inteira',
    descricao: 'Estude 7 dias seguidos.',
    verificar: (estado) => estado.sequencia.melhor >= 7,
  },
  {
    id: 'nivel-5',
    icone: '⭐',
    titulo: 'Nível 5',
    descricao: 'Chegue ao nível 5.',
    verificar: (estado) => nivelDoXP(estado.xp) >= 5,
  },
]);
