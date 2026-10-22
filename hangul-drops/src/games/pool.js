// O que o aluno já pode ver nos jogos, a partir do SRS.
// - Letras (jamo): liberadas aos poucos, começando pelas vogais.
// - Sílabas: um grupo (가 거 고...) só entra quando a consoante dele já foi
//   liberada; assim 가 nunca aparece antes de o aluno conhecer ㄱ.

import { buscarItem, gruposDeEstudo } from '../data/hangul.js';
import { gruposLiberados } from '../core/srs.js';

/** Consoantes já liberadas, como caracteres (ex.: ['ㄱ', 'ㄴ']). */
export function consoantesLiberadas() {
  return idsDeJamoLiberados()
    .map(buscarItem)
    .filter((item) => item.tipo === 'consoante')
    .map((item) => item.hangul);
}

function idsDeJamoLiberados() {
  return gruposLiberados(gruposDeEstudo('jamo')).flatMap((grupo) => grupo.itens);
}

/** Ids das sílabas liberadas (só das consoantes que o aluno já conhece). */
export function idsDeSilabasLiberadas() {
  const consoantes = new Set(consoantesLiberadas());
  const grupos = gruposDeEstudo('silabas').filter((grupo) =>
    consoantes.has(buscarItem(grupo.itens[0]).partes[0]),
  );
  return grupos.length > 0 ? gruposLiberados(grupos).flatMap((grupo) => grupo.itens) : [];
}

/** Tudo o que pode aparecer nos jogos: letras liberadas + sílabas liberadas. */
export function poolDoAprendiz({ incluirSilabas = true } = {}) {
  const jamo = idsDeJamoLiberados();
  return incluirSilabas ? [...jamo, ...idsDeSilabasLiberadas()] : jamo;
}
