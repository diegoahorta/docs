// Lista de conquistas. Cada uma tem uma função `verificar(estado)` que
// recebe o progresso atual e diz se a conquista foi alcançada.

import { listarKana } from '../data/kana.js';
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
    descricao: 'Acerte seu primeiro kana.',
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
    id: 'fileira-a',
    icone: 'あ',
    titulo: 'Fileira あ dominada',
    descricao: 'Leve あいうえお até a caixa 3 do SRS.',
    verificar: () => todosNaCaixa(listarKana('hiragana', ['a']), 3),
  },
  {
    id: 'mestre-hiragana',
    icone: '🎌',
    titulo: 'Mestre do hiragana',
    descricao: 'Leve os 46 hiragana básicos até a caixa 3.',
    verificar: () =>
      todosNaCaixa(
        listarKana('hiragana').filter((item) => !item.dakuten),
        3,
      ),
  },
  {
    id: 'mestre-katakana',
    icone: '🏯',
    titulo: 'Mestre do katakana',
    descricao: 'Leve os 46 katakana básicos até a caixa 3.',
    verificar: () =>
      todosNaCaixa(
        listarKana('katakana').filter((item) => !item.dakuten),
        3,
      ),
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
