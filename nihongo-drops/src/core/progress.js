// Progresso do jogador: XP, nível, streak diário, estatísticas,
// recordes por minijogo e conquistas. Tudo salvo no localStorage.

import { lerJSON, salvarJSON } from './storage.js';
import { criarEmissor, dataLocalISO, diasEntre } from './utils.js';
import { registrarResposta as registrarNoSRS } from './srs.js';
import { nivelDoXP, progressoDoNivel } from './levels.js';
import { CONQUISTAS } from './achievements.js';
import { obterConfig } from './settings.js';

const CHAVE = 'progresso';
const XP_POR_ACERTO = 10;
const XP_POR_ERRO = 1; // um pouquinho de XP por tentar também

const emissor = criarEmissor();
const estado = carregar();

function estadoInicial() {
  return {
    xp: 0,
    sequencia: { atual: 0, melhor: 0, ultimoDia: null },
    estatisticas: { acertos: 0, erros: 0, partidas: 0 },
    recordes: {},
    conquistas: {},
  };
}

/** Junta o que foi salvo com o estado inicial (protege contra dados antigos ou corrompidos). */
function carregar() {
  const inicial = estadoInicial();
  const salvo = lerJSON(CHAVE, null);
  if (!salvo || typeof salvo !== 'object') {
    return inicial;
  }
  return {
    xp: Number.isFinite(salvo.xp) ? salvo.xp : 0,
    sequencia: { ...inicial.sequencia, ...salvo.sequencia },
    estatisticas: { ...inicial.estatisticas, ...salvo.estatisticas },
    recordes: { ...salvo.recordes },
    conquistas: { ...salvo.conquistas },
  };
}

function salvar() {
  salvarJSON(CHAVE, estado);
  emissor.emit('mudou', obterResumo());
}

/**
 * Escuta eventos do progresso. Eventos: 'mudou', 'xp', 'nivel', 'conquista'.
 * Devolve a função para cancelar.
 */
export function aoProgresso(evento, callback) {
  return emissor.on(evento, callback);
}

/** Streak atual para exibição: zera se o jogador pulou um dia. */
function sequenciaVisivel(hoje = dataLocalISO()) {
  const { atual, ultimoDia } = estado.sequencia;
  if (!ultimoDia) {
    return 0;
  }
  return diasEntre(ultimoDia, hoje) <= 1 ? atual : 0;
}

/** Resumo pronto para a interface. */
export function obterResumo() {
  return {
    xp: estado.xp,
    ...progressoDoNivel(estado.xp),
    sequencia: sequenciaVisivel(),
    melhorSequencia: estado.sequencia.melhor,
    estatisticas: { ...estado.estatisticas },
    recordes: { ...estado.recordes },
    conquistas: { ...estado.conquistas },
  };
}

/** Marca que o jogador estudou hoje e atualiza o streak. */
function registrarAtividadeDoDia(hoje = dataLocalISO()) {
  const sequencia = estado.sequencia;
  if (sequencia.ultimoDia === hoje) {
    return;
  }
  const continuou = sequencia.ultimoDia && diasEntre(sequencia.ultimoDia, hoje) === 1;
  sequencia.atual = continuou ? sequencia.atual + 1 : 1;
  sequencia.melhor = Math.max(sequencia.melhor, sequencia.atual);
  sequencia.ultimoDia = hoje;
}

/** Soma XP e avisa se o jogador subiu de nível. */
export function ganharXP(quantidade) {
  if (quantidade <= 0) {
    return;
  }
  const nivelAntes = nivelDoXP(estado.xp);
  estado.xp += Math.round(quantidade);
  emissor.emit('xp', { ganho: quantidade, total: estado.xp });
  const nivelDepois = nivelDoXP(estado.xp);
  if (nivelDepois > nivelAntes) {
    emissor.emit('nivel', { nivel: nivelDepois });
  }
  verificarConquistas();
  salvar();
}

/**
 * Registra uma resposta do jogador em qualquer minijogo:
 * atualiza SRS, estatísticas, streak, XP e conquistas.
 */
export function registrarResposta(id, acertou) {
  registrarAtividadeDoDia();
  const resultadoSRS = registrarNoSRS(id, acertou);
  estado.estatisticas[acertou ? 'acertos' : 'erros'] += 1;
  ganharXP(acertou ? XP_POR_ACERTO : XP_POR_ERRO);
  return resultadoSRS;
}

/** Registra o fim de uma partida e devolve se foi recorde. */
export function registrarFimDePartida(jogoId, pontos) {
  const recordeAnterior = estado.recordes[jogoId] ?? 0;
  const novoRecorde = pontos > recordeAnterior;
  if (novoRecorde) {
    estado.recordes[jogoId] = pontos;
  }
  estado.estatisticas.partidas += 1;
  verificarConquistas();
  salvar();
  return { novoRecorde, recordeAnterior };
}

/** Desbloqueia conquistas novas e avisa a interface. */
export function verificarConquistas() {
  for (const conquista of CONQUISTAS) {
    if (!estado.conquistas[conquista.id] && conquista.verificar(estado)) {
      estado.conquistas[conquista.id] = dataLocalISO();
      emissor.emit('conquista', conquista);
    }
  }
}

/** O minijogo está liberado pelo XP (ou pela opção "liberar todas as fases")? */
export function jogoLiberado(jogo) {
  return obterConfig().liberarTodasFases || estado.xp >= jogo.xpNecessario;
}
