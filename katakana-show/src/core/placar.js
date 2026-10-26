// O que fica salvo entre as partidas (sempre pelo storage.js, com try/catch):
// - recordes de cada temporada (pontos e estrelas);
// - álbum de figurinhas: as palavras que o aluno já acertou;
// - estatísticas de cada kana e palavra, para a "revisão inteligente"
//   (o que o aluno mais erra aparece mais vezes).

import { lerJSON, salvarJSON } from './storage.js';

const CHAVE_RECORDES = 'recordes';
const CHAVE_ALBUM = 'album';
const CHAVE_ESTATISTICAS = 'estatisticas';

/** Lê um objeto salvo, garantindo que é mesmo um objeto. */
function lerObjeto(chave) {
  const valor = lerJSON(chave, {});
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
}

// ---------- Recordes ----------

/** Recorde de uma temporada: { pontos, estrelas } (zeros se nunca jogou). */
export function recordeDa(temporada) {
  const salvo = lerObjeto(CHAVE_RECORDES)[temporada];
  return {
    pontos: Number(salvo?.pontos) || 0,
    estrelas: Number(salvo?.estrelas) || 0,
  };
}

/** Salva o resultado de uma rodada solo. Devolve true se for um novo recorde de pontos. */
export function salvarResultado(temporada, pontos, estrelas) {
  const recordes = lerObjeto(CHAVE_RECORDES);
  const anterior = recordeDa(temporada);
  const novoRecorde = pontos > anterior.pontos;
  recordes[temporada] = {
    pontos: Math.max(pontos, anterior.pontos),
    estrelas: Math.max(estrelas, anterior.estrelas),
  };
  salvarJSON(CHAVE_RECORDES, recordes);
  return novoRecorde;
}

// ---------- Álbum de palavras ----------

/** Ids das palavras já conquistadas. */
export function palavrasDoAlbum() {
  const lista = lerJSON(CHAVE_ALBUM, []);
  return new Set(Array.isArray(lista) ? lista.filter((id) => typeof id === 'string') : []);
}

/** Cola uma figurinha no álbum. Devolve true se ela é nova. */
export function colarNoAlbum(idDaPalavra) {
  const album = palavrasDoAlbum();
  if (album.has(idDaPalavra)) {
    return false;
  }
  album.add(idDaPalavra);
  salvarJSON(CHAVE_ALBUM, [...album]);
  return true;
}

// ---------- Estatísticas para a revisão inteligente ----------

/** { acertos, erros } de um kana ou palavra. */
export function estatisticaDe(id) {
  const salvo = lerObjeto(CHAVE_ESTATISTICAS)[id];
  return { acertos: Number(salvo?.acertos) || 0, erros: Number(salvo?.erros) || 0 };
}

/** Registra uma resposta sobre um kana ou palavra. */
export function registrarResposta(id, acertou) {
  const estatisticas = lerObjeto(CHAVE_ESTATISTICAS);
  const atual = estatisticaDe(id);
  estatisticas[id] = acertou
    ? { ...atual, acertos: atual.acertos + 1 }
    : { ...atual, erros: atual.erros + 1 };
  salvarJSON(CHAVE_ESTATISTICAS, estatisticas);
}

/**
 * Peso de sorteio de um item: o que nunca apareceu ou foi errado vem mais;
 * o que já foi acertado várias vezes vem menos (mas nunca some).
 */
export function pesoDeRevisao(id) {
  const { acertos, erros } = estatisticaDe(id);
  if (acertos + erros === 0) {
    return 3;
  }
  return Math.max(0.5, Math.min(8, 2 + erros * 2 - acertos * 0.5));
}
