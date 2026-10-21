// Repetição espaçada simples, no estilo Leitner.
//
// Cada item (kana, palavra...) mora em uma de 5 caixas:
// - acertou e a revisão estava "vencida": sobe uma caixa;
// - errou: volta para a caixa 1.
// Itens das caixas baixas e itens vencidos têm mais chance de aparecer.

import { lerJSON, salvarJSON } from './storage.js';

const CHAVE = 'srs';
export const TOTAL_CAIXAS = 5;

/** Peso de sorteio por caixa (índice = número da caixa). */
const PESO_POR_CAIXA = [0, 8, 5, 3, 2, 1];
/** Quantas horas esperar, em cada caixa, antes de o item poder subir de novo. */
const INTERVALO_HORAS = [0, 0, 8, 24, 72, 168];
const HORA_MS = 3_600_000;

const estado = carregar();

function carregar() {
  const salvo = lerJSON(CHAVE, null);
  return salvo && typeof salvo.itens === 'object' && salvo.itens !== null ? salvo : { itens: {} };
}

function salvar() {
  salvarJSON(CHAVE, estado);
}

function estaVencido(registro, agora) {
  if (!registro) {
    return true;
  }
  return agora - registro.ultimaRevisao >= INTERVALO_HORAS[registro.caixa] * HORA_MS;
}

/** Caixa atual do item (itens nunca vistos ficam na caixa 1). */
export function obterCaixa(id) {
  return estado.itens[id]?.caixa ?? 1;
}

/** Registro completo do item, ou null se nunca foi visto. */
export function obterRegistro(id) {
  return estado.itens[id] ?? null;
}

/** Atualiza a caixa do item depois de uma resposta. */
export function registrarResposta(id, acertou, agora = Date.now()) {
  const anterior = estado.itens[id] ?? { caixa: 1, acertos: 0, erros: 0, ultimaRevisao: 0 };
  let caixa = anterior.caixa;
  if (!acertou) {
    caixa = 1;
  } else if (estaVencido(estado.itens[id], agora)) {
    caixa = Math.min(TOTAL_CAIXAS, anterior.caixa + 1);
  }
  estado.itens[id] = {
    caixa,
    acertos: anterior.acertos + (acertou ? 1 : 0),
    erros: anterior.erros + (acertou ? 0 : 1),
    ultimaRevisao: agora,
  };
  salvar();
  return { caixaAnterior: anterior.caixa, caixaNova: caixa };
}

/** Peso de sorteio de um item: caixas baixas e itens vencidos pesam mais. */
export function pesoDoItem(id, agora = Date.now()) {
  const registro = estado.itens[id];
  const base = PESO_POR_CAIXA[registro?.caixa ?? 1];
  return estaVencido(registro, agora) ? base * 2 : base;
}

/** Sorteia um id respeitando os pesos. `evitar` tira itens recentes do sorteio. */
export function sortearPonderado(ids, { evitar = [] } = {}) {
  const filtrados = ids.filter((id) => !evitar.includes(id));
  const lista = filtrados.length > 0 ? filtrados : ids;
  const pesos = lista.map((id) => pesoDoItem(id));
  let sorteio = Math.random() * pesos.reduce((soma, peso) => soma + peso, 0);
  for (let i = 0; i < lista.length; i += 1) {
    sorteio -= pesos[i];
    if (sorteio <= 0) {
      return lista[i];
    }
  }
  return lista[lista.length - 1];
}

/** Sorteia vários ids diferentes, respeitando os pesos. */
export function sortearVarios(ids, quantidade) {
  const restantes = [...ids];
  const escolhidos = [];
  while (escolhidos.length < quantidade && restantes.length > 0) {
    const id = sortearPonderado(restantes);
    escolhidos.push(id);
    restantes.splice(restantes.indexOf(id), 1);
  }
  return escolhidos;
}

/**
 * Libera grupos aos poucos. Começa com `iniciais` grupos e libera o próximo
 * quando `proporcao` dos itens já liberados chegou pelo menos à `caixaMinima`.
 * `grupos` vem no formato [{ id, itens: [ids] }].
 */
export function gruposLiberados(grupos, { iniciais = 2, caixaMinima = 2, proporcao = 0.8 } = {}) {
  let quantidade = Math.min(iniciais, grupos.length);
  while (quantidade < grupos.length) {
    const ativos = grupos.slice(0, quantidade).flatMap((grupo) => grupo.itens);
    const dominados = ativos.filter((id) => obterCaixa(id) >= caixaMinima).length;
    if (dominados / ativos.length < proporcao) {
      break;
    }
    quantidade += 1;
  }
  return grupos.slice(0, quantidade);
}

/** Quantos itens há em cada caixa (índices 1 a 5). */
export function resumoPorCaixa(ids) {
  const contagem = Array(TOTAL_CAIXAS + 1).fill(0);
  ids.forEach((id) => {
    contagem[obterCaixa(id)] += 1;
  });
  return contagem;
}
