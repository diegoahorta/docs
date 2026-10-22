// Dados do hangul: os jamo (letras) e as sílabas de estudo.
//
// O hangul junta letras em blocos de sílaba: ㄱ + ㅏ = 가 (ga); com consoante
// final (batchim): 가 + ㄴ = 간 (gan). As sílabas são montadas pela fórmula
// do Unicode, então não precisamos de uma tabela gigante.
//
// Romanização: Romanização Revisada do Coreano (padrão oficial).
// Cada item tem: hangul, romanizacao, alternativas aceitas ao digitar, tipo,
// grupo, conjunto ('jamo' ou 'silabas'), fala (o que a voz ko-KR pronuncia)
// e uma dica mnemônica em português.

// ---------- Tabelas do Unicode (ordem oficial) ----------

const INICIAIS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const VOGAIS_UNICODE = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const FINAIS = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const PRIMEIRA_SILABA = 0xac00; // 가
const ULTIMA_SILABA = 0xd7a3; // 힣

/** Som de cada jamo no começo da sílaba (consoantes) ou como vogal. */
const SOM_INICIAL = {
  ㄱ: 'g',
  ㄲ: 'kk',
  ㄴ: 'n',
  ㄷ: 'd',
  ㄸ: 'tt',
  ㄹ: 'r',
  ㅁ: 'm',
  ㅂ: 'b',
  ㅃ: 'pp',
  ㅅ: 's',
  ㅆ: 'ss',
  ㅇ: '',
  ㅈ: 'j',
  ㅉ: 'jj',
  ㅊ: 'ch',
  ㅋ: 'k',
  ㅌ: 't',
  ㅍ: 'p',
  ㅎ: 'h',
};
const SOM_VOGAL = {
  ㅏ: 'a',
  ㅐ: 'ae',
  ㅑ: 'ya',
  ㅒ: 'yae',
  ㅓ: 'eo',
  ㅔ: 'e',
  ㅕ: 'yeo',
  ㅖ: 'ye',
  ㅗ: 'o',
  ㅘ: 'wa',
  ㅙ: 'wae',
  ㅚ: 'oe',
  ㅛ: 'yo',
  ㅜ: 'u',
  ㅝ: 'wo',
  ㅞ: 'we',
  ㅟ: 'wi',
  ㅠ: 'yu',
  ㅡ: 'eu',
  ㅢ: 'ui',
  ㅣ: 'i',
};
/** Som da consoante final (batchim): só 7 sons possíveis. */
const SOM_FINAL = {
  ㄱ: 'k',
  ㄲ: 'k',
  ㄳ: 'k',
  ㄴ: 'n',
  ㄵ: 'n',
  ㄶ: 'n',
  ㄷ: 't',
  ㄹ: 'l',
  ㄺ: 'k',
  ㄻ: 'm',
  ㄼ: 'l',
  ㄽ: 'l',
  ㄾ: 'l',
  ㄿ: 'p',
  ㅀ: 'l',
  ㅁ: 'm',
  ㅂ: 'p',
  ㅄ: 'p',
  ㅅ: 't',
  ㅆ: 't',
  ㅇ: 'ng',
  ㅈ: 't',
  ㅊ: 't',
  ㅋ: 'k',
  ㅌ: 't',
  ㅍ: 'p',
  ㅎ: 't',
};

/** Monta uma sílaba a partir dos jamo: comporSilaba('ㄱ', 'ㅏ', 'ㄴ') → '간'. */
export function comporSilaba(inicial, vogal, final = '') {
  const codigo =
    PRIMEIRA_SILABA +
    (INICIAIS.indexOf(inicial) * VOGAIS_UNICODE.length + VOGAIS_UNICODE.indexOf(vogal)) *
      FINAIS.length +
    FINAIS.indexOf(final);
  return String.fromCodePoint(codigo);
}

/** Desmonta uma sílaba: '간' → { inicial: 'ㄱ', vogal: 'ㅏ', final: 'ㄴ' }; null se não for sílaba. */
export function decomporSilaba(caractere) {
  const codigo = caractere.codePointAt(0) - PRIMEIRA_SILABA;
  if (codigo < 0 || codigo > ULTIMA_SILABA - PRIMEIRA_SILABA) {
    return null;
  }
  const final = codigo % FINAIS.length;
  const vogal = Math.floor(codigo / FINAIS.length) % VOGAIS_UNICODE.length;
  const inicial = Math.floor(codigo / FINAIS.length / VOGAIS_UNICODE.length);
  return { inicial: INICIAIS[inicial], vogal: VOGAIS_UNICODE[vogal], final: FINAIS[final] };
}

/**
 * Romaniza um texto sílaba por sílaba (sem as mudanças de som entre sílabas,
 * que as palavras do vocabulário já trazem prontas). Ex.: '간' → 'gan'.
 */
export function romanizar(texto) {
  return Array.from(texto)
    .map((caractere) => {
      const partes = decomporSilaba(caractere);
      if (!partes) {
        return itemPorCaractere(caractere)?.romanizacao ?? caractere;
      }
      return (
        SOM_INICIAL[partes.inicial] + SOM_VOGAL[partes.vogal] + (SOM_FINAL[partes.final] ?? '')
      );
    })
    .join('');
}

// ---------- Jamo ----------

/** [jamo, nome coreano, nome romanizado, dica] por grupo de estudo. */
const JAMO_POR_GRUPO = {
  vogais: [
    ['ㅏ', '아', 'a', 'Um tronco com um galho apontando para fora (direita): "a".'],
    ['ㅓ', '어', 'eo', 'O galho aponta para dentro (esquerda): som de "ó" aberto, escrito "eo".'],
    ['ㅗ', '오', 'o', 'Uma árvore em pé no chão, galho para cima: "ô".'],
    ['ㅜ', '우', 'u', 'O galho aponta para baixo, como uma gota caindo: "u".'],
    [
      'ㅡ',
      '으',
      'eu',
      'Uma linha reta, como a boca esticada num sorriso sem graça: "ũ" (escrito "eu").',
    ],
    ['ㅣ', '이', 'i', 'Uma linha em pé, fininha como a letra "i".'],
  ],
  'vogais-y': [
    ['ㅑ', '야', 'ya', 'É o ㅏ com um galho a mais: o tracinho extra acrescenta um "y": "ya".'],
    ['ㅕ', '여', 'yeo', 'É o ㅓ com dois galhos: "yeo" (como "yó").'],
    ['ㅛ', '요', 'yo', 'É o ㅗ com duas pernas para cima: "yo".'],
    ['ㅠ', '유', 'yu', 'É o ㅜ com duas pernas para baixo: "yu".'],
  ],
  'consoantes-1': [
    ['ㄱ', '기역', 'giyeok', 'Parece uma arma (gun) virada: "g" (no final, "k").'],
    ['ㄴ', '니은', 'nieun', 'Parece um nariz (nose) de perfil: "n".'],
    ['ㄷ', '디귿', 'digeut', 'Uma porta (door) aberta para a direita: "d" (no final, "t").'],
    ['ㄹ', '리을', 'rieul', 'Uma cobra enrolada (rattlesnake): "r" no começo, "l" no final.'],
    ['ㅁ', '미음', 'mieum', 'Uma boca (mouth) quadrada: "m".'],
  ],
  'consoantes-2': [
    ['ㅂ', '비읍', 'bieup', 'Um balde (bucket) com duas alças: "b" (no final, "p").'],
    ['ㅅ', '시옷', 'siot', 'Um dente ou uma montanha: "s" (antes de ㅣ soa "sh").'],
    [
      'ㅇ',
      '이응',
      'ieung',
      'Um círculo: mudo no começo da sílaba (아 = a) e "ng" no final (앙 = ang).',
    ],
    ['ㅈ', '지읒', 'jieut', 'Um ㅅ com um chapéu reto: "j" (como "dj").'],
    ['ㅎ', '히읗', 'hieut', 'Um homem de chapéu (hat): "h".'],
  ],
  aspiradas: [
    ['ㅋ', '키읔', 'kieuk', 'É o ㄱ com um traço a mais: mais ar, "k" forte.'],
    ['ㅌ', '티읕', 'tieut', 'É o ㄷ com um traço a mais: "t" com ar.'],
    ['ㅍ', '피읖', 'pieup', 'Uma mesa com duas pernas: "p" com ar.'],
    ['ㅊ', '치읓', 'chieut', 'É o ㅈ com um tracinho em cima: "tch" com ar.'],
  ],
  tensas: [
    ['ㄲ', '쌍기역', 'ssanggiyeok', 'Dois ㄱ: "k" tenso e seco, sem soltar ar (kk).'],
    ['ㄸ', '쌍디귿', 'ssangdigeut', 'Dois ㄷ: "t" tenso e seco (tt).'],
    ['ㅃ', '쌍비읍', 'ssangbieup', 'Dois ㅂ: "p" tenso e seco (pp).'],
    ['ㅆ', '쌍시옷', 'ssangsiot', 'Dois ㅅ: "s" forte e tenso (ss).'],
    ['ㅉ', '쌍지읒', 'ssangjieut', 'Dois ㅈ: "tj" tenso e seco (jj).'],
  ],
  'vogais-compostas': [
    ['ㅐ', '애', 'ae', 'ㅏ + ㅣ: "é" aberto (escrito "ae").'],
    ['ㅔ', '에', 'e', 'ㅓ + ㅣ: "ê" (escrito "e"); hoje soa quase igual a ㅐ.'],
    ['ㅒ', '얘', 'yae', 'ㅑ + ㅣ: "yé".'],
    ['ㅖ', '예', 'ye', 'ㅕ + ㅣ: "yê".'],
    ['ㅘ', '와', 'wa', 'ㅗ + ㅏ: "o" + "a" bem rápido = "wa".'],
    ['ㅙ', '왜', 'wae', 'ㅗ + ㅐ: "wé".'],
    ['ㅚ', '외', 'oe', 'ㅗ + ㅣ: soa "wê" (escrito "oe").'],
    ['ㅝ', '워', 'wo', 'ㅜ + ㅓ: "wó" (escrito "wo").'],
    ['ㅞ', '웨', 'we', 'ㅜ + ㅔ: "wê".'],
    ['ㅟ', '위', 'wi', 'ㅜ + ㅣ: "wi".'],
    ['ㅢ', '의', 'ui', 'ㅡ + ㅣ: "ũi" (escrito "ui").'],
  ],
};

/** Ordem em que os grupos de jamo são apresentados. */
export const GRUPOS_JAMO = Object.keys(JAMO_POR_GRUPO);

export const NOMES_DOS_GRUPOS = {
  vogais: 'Vogais básicas',
  'vogais-y': 'Vogais com y',
  'consoantes-1': 'Consoantes I',
  'consoantes-2': 'Consoantes II',
  aspiradas: 'Aspiradas',
  tensas: 'Tensas (duplas)',
  'vogais-compostas': 'Vogais compostas',
};

/** Outras formas de digitar o som (romanizações antigas ou do final da sílaba). */
const ALTERNATIVAS = {
  ㄱ: ['k'],
  ㄷ: ['t'],
  ㄹ: ['l'],
  ㅂ: ['p'],
  ㅇ: ['ng'],
};

/** Som que a voz pronuncia: vogais com ㅇ mudo (아), consoantes com ㅏ (가), ㅇ como 앙. */
function falaDoJamo(jamo, tipo) {
  if (tipo === 'vogal') {
    return comporSilaba('ㅇ', jamo);
  }
  if (jamo === 'ㅇ') {
    return '앙';
  }
  return comporSilaba(jamo, 'ㅏ');
}

function criarJamo(grupo, [jamo, nome, nomeRomanizado, mnemonico]) {
  const tipo = jamo in SOM_VOGAL ? 'vogal' : 'consoante';
  const romanizacao = tipo === 'vogal' ? SOM_VOGAL[jamo] : SOM_INICIAL[jamo] || 'ng';
  return Object.freeze({
    id: `j:${jamo}`,
    hangul: jamo,
    romanizacao,
    alternativas: (ALTERNATIVAS[jamo] ?? []).filter((alt) => alt !== romanizacao),
    tipo,
    grupo,
    conjunto: 'jamo',
    nome: `${nome} (${nomeRomanizado})`,
    fala: falaDoJamo(jamo, tipo),
    mnemonico,
  });
}

export const JAMO = Object.freeze(
  GRUPOS_JAMO.flatMap((grupo) => JAMO_POR_GRUPO[grupo].map((dados) => criarJamo(grupo, dados))),
);

// ---------- Sílabas de estudo ----------

/** Consoantes iniciais, na ordem de estudo, e as 6 vogais básicas. */
const CONSOANTES_DAS_SILABAS = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅎㅋㅌㅍㅊㄲㄸㅃㅆㅉ';
const VOGAIS_DAS_SILABAS = 'ㅏㅓㅗㅜㅡㅣ';

export const GRUPOS_SILABAS = Array.from(CONSOANTES_DAS_SILABAS).map(
  (consoante) => `s-${consoante}`,
);
Array.from(CONSOANTES_DAS_SILABAS).forEach((consoante) => {
  NOMES_DOS_GRUPOS[`s-${consoante}`] = `Sílabas com ${consoante}`;
});

function criarSilaba(consoante, vogal) {
  const silaba = comporSilaba(consoante, vogal);
  const romanizacao = SOM_INICIAL[consoante] + SOM_VOGAL[vogal];
  // Quem digita "ka" para 가 ou "la" para 라 também acerta.
  const alternativas = (ALTERNATIVAS[consoante] ?? [])
    .filter((alt) => alt !== 'ng')
    .map((alt) => alt + SOM_VOGAL[vogal]);
  if (consoante === 'ㅅ' && vogal === 'ㅣ') {
    alternativas.push('shi');
  }
  const somConsoante = consoante === 'ㅇ' ? 'mudo' : SOM_INICIAL[consoante];
  return Object.freeze({
    id: `s:${silaba}`,
    hangul: silaba,
    romanizacao,
    alternativas,
    tipo: 'silaba',
    grupo: `s-${consoante}`,
    conjunto: 'silabas',
    partes: [consoante, vogal],
    fala: silaba,
    mnemonico: `${consoante} (${somConsoante}) + ${vogal} (${SOM_VOGAL[vogal]}) = ${silaba} (${romanizacao})`,
  });
}

export const SILABAS = Object.freeze(
  Array.from(CONSOANTES_DAS_SILABAS).flatMap((consoante) =>
    Array.from(VOGAIS_DAS_SILABAS).map((vogal) => criarSilaba(consoante, vogal)),
  ),
);

export const TODOS = Object.freeze([...JAMO, ...SILABAS]);

// ---------- Consultas ----------

const POR_ID = new Map(TODOS.map((item) => [item.id, item]));
const POR_CARACTERE = new Map(TODOS.map((item) => [item.hangul, item]));

/** Busca um item pelo id (ex.: "j:ㄱ" ou "s:가"). */
export function buscarItem(id) {
  return POR_ID.get(id) ?? null;
}

/** Busca um item pelo caractere (ex.: "ㅏ" ou "나"). */
export function itemPorCaractere(caractere) {
  return POR_CARACTERE.get(caractere) ?? null;
}

/** Itens de um conjunto ('jamo' ou 'silabas'), opcionalmente só de alguns grupos. */
export function listarItens(conjunto, grupos = null) {
  const lista = conjunto === 'silabas' ? SILABAS : JAMO;
  return grupos ? lista.filter((item) => grupos.includes(item.grupo)) : lista;
}

/** Grupos na ordem de estudo, no formato do SRS: [{ id, itens: [ids] }]. */
export function gruposDeEstudo(conjunto) {
  const grupos = conjunto === 'silabas' ? GRUPOS_SILABAS : GRUPOS_JAMO;
  return grupos.map((grupo) => ({
    id: grupo,
    itens: listarItens(conjunto, [grupo]).map((item) => item.id),
  }));
}
