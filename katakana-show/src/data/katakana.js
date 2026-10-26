// Tabela do katakana usada no quiz e no guia fonético.
// Cada item tem: kana, romaji (Hepburn), grupo (linha da tabela), coluna (vogal),
// tipo ('basico', 'dakuten' ou 'combinado') e uma dica mnemônica em português.

/** Linhas da tabela. `colunas` indica a posição de cada kana (0=a, 1=i, 2=u, 3=e, 4=o). */
const LINHAS = [
  { grupo: 'a', kana: 'アイウエオ', romaji: ['a', 'i', 'u', 'e', 'o'] },
  { grupo: 'ka', kana: 'カキクケコ', romaji: ['ka', 'ki', 'ku', 'ke', 'ko'] },
  { grupo: 'sa', kana: 'サシスセソ', romaji: ['sa', 'shi', 'su', 'se', 'so'] },
  { grupo: 'ta', kana: 'タチツテト', romaji: ['ta', 'chi', 'tsu', 'te', 'to'] },
  { grupo: 'na', kana: 'ナニヌネノ', romaji: ['na', 'ni', 'nu', 'ne', 'no'] },
  { grupo: 'ha', kana: 'ハヒフヘホ', romaji: ['ha', 'hi', 'fu', 'he', 'ho'] },
  { grupo: 'ma', kana: 'マミムメモ', romaji: ['ma', 'mi', 'mu', 'me', 'mo'] },
  { grupo: 'ya', kana: 'ヤユヨ', romaji: ['ya', 'yu', 'yo'], colunas: [0, 2, 4] },
  { grupo: 'ra', kana: 'ラリルレロ', romaji: ['ra', 'ri', 'ru', 're', 'ro'] },
  { grupo: 'wa', kana: 'ワヲ', romaji: ['wa', 'wo'], colunas: [0, 4] },
  { grupo: 'n', kana: 'ン', romaji: ['n'], colunas: [0] },
  { grupo: 'ga', kana: 'ガギグゲゴ', romaji: ['ga', 'gi', 'gu', 'ge', 'go'], dakuten: true },
  { grupo: 'za', kana: 'ザジズゼゾ', romaji: ['za', 'ji', 'zu', 'ze', 'zo'], dakuten: true },
  { grupo: 'da', kana: 'ダヂヅデド', romaji: ['da', 'ji', 'zu', 'de', 'do'], dakuten: true },
  { grupo: 'ba', kana: 'バビブベボ', romaji: ['ba', 'bi', 'bu', 'be', 'bo'], dakuten: true },
  { grupo: 'pa', kana: 'パピプペポ', romaji: ['pa', 'pi', 'pu', 'pe', 'po'], dakuten: true },
];

/** Combinações com ャ ュ ョ pequenos (yōon), na ordem do guia. */
const COMBINACOES = [
  ['キャ', 'kya'], ['キュ', 'kyu'], ['キョ', 'kyo'],
  ['シャ', 'sha'], ['シュ', 'shu'], ['ショ', 'sho'],
  ['チャ', 'cha'], ['チュ', 'chu'], ['チョ', 'cho'],
  ['ニャ', 'nya'], ['ニュ', 'nyu'], ['ニョ', 'nyo'],
  ['ヒャ', 'hya'], ['ヒュ', 'hyu'], ['ヒョ', 'hyo'],
  ['ミャ', 'mya'], ['ミュ', 'myu'], ['ミョ', 'myo'],
  ['リャ', 'rya'], ['リュ', 'ryu'], ['リョ', 'ryo'],
  ['ギャ', 'gya'], ['ギュ', 'gyu'], ['ギョ', 'gyo'],
  ['ジャ', 'ja'], ['ジュ', 'ju'], ['ジョ', 'jo'],
  ['ビャ', 'bya'], ['ビュ', 'byu'], ['ビョ', 'byo'],
  ['ピャ', 'pya'], ['ピュ', 'pyu'], ['ピョ', 'pyo'],
]; // prettier-ignore

/** Dicas mnemônicas dos katakana básicos. */
const MNEMONICOS = {
  ア: 'Um machado (axe) de lado: "a".',
  イ: 'Uma pessoa encostada na parede, inclinada: "i".',
  ウ: 'Uma pessoa de chapéu dizendo "uuu".',
  エ: 'Uma viga de construção em forma de "I" deitado: "e"difício.',
  オ: 'Uma pessoa de braços abertos gritando "Oh!".',
  カ: 'Um braço forte fazendo "ka"ratê.',
  キ: 'Uma chave (key) com dois dentes.',
  ク: 'O bico aberto de um cuco: "ku".',
  ケ: 'Uma letra "K" torta: "ke".',
  コ: 'O canto de uma caixa: "co".',
  サ: 'Uma mesa de sala com duas pernas: "sa".',
  シ: 'Rosto sorrindo; os tracinhos ficam à esquerda, como olhos de lado: "shi".',
  ス: 'Uma pessoa subindo correndo uma ladeira: "su".',
  セ: 'Uma pessoa sentada (sentar = "se") numa cadeira.',
  ソ: 'Uma agulha costurando de cima para baixo: "so".',
  タ: 'Um taco dobrado com recheio: "ta".',
  チ: 'Um chip com perninhas: "chi".',
  ツ: 'Tsunami vindo do céu: os tracinhos ficam em cima, caindo.',
  テ: 'Um poste de telefone: "te".',
  ト: 'Um totem com um galho: "to".',
  ナ: 'Uma cruz inclinada: "na"da de reto.',
  ニ: 'Dois tracinhos — e "ni" quer dizer "dois" em japonês!',
  ヌ: 'Um nunchaku cruzado: "nu".',
  ネ: 'Uma pessoa de gravata (nekutai): "ne".',
  ノ: 'Um único traço, como um "No!" bem curto.',
  ハ: 'Duas pernas abertas dando risada: "Ha!".',
  ヒ: 'Uma colher deitada: "hi".',
  フ: 'Um funil visto de lado: "fu".',
  ヘ: 'Um morrinho no caminho: "Hê, que subida!".',
  ホ: 'Uma cruz com dois pezinhos, como placa de hospital: "ho".',
  マ: 'Um martelo de lado: "ma".',
  ミ: 'Três minhocas em fila: "mi".',
  ム: 'Um braço dobrado mostrando o músculo: "mu".',
  メ: 'Um X marcando o lugar: "me" aqui!',
  モ: 'Um anzol com mais (more) iscas: "mo".',
  ヤ: 'Um iaque (yak) com o chifre para cima: "ya".',
  ユ: 'Um "U" quadrado deitado: "yu".',
  ヨ: 'Um "E" ao contrário dizendo "yo!".',
  ラ: 'Uma tampa em cima de um フ: "ra".',
  リ: 'Dois juncos crescendo à beira do rio: "ri".',
  ル: 'Duas raízes (roots) saindo da terra: "ru".',
  レ: 'Um sinal de "certo" ✓ de revisado: "re".',
  ロ: 'Uma caixa quadrada, como um robô: "ro".',
  ワ: 'Um copo d’água (water) virado: "wa".',
  ヲ: 'Parece um ラ com um traço a mais: "wo" (pronuncia-se "o").',
  ン: 'Um tracinho e uma linha subindo — diferente do ソ, que desce.',
};

/** Katakana que costumam ser confundidos: viram as alternativas erradas das perguntas. */
export const PARECIDOS = [
  'シツ', 'ソンノ', 'クケタ', 'ウワフ', 'コユロ', 'ヌスメナ', 'マムア', 'チテ', 'ルレ',
  'ヨエ', 'セサヒ', 'ヤカ', 'ニミ', 'オホ', 'ラヲ', 'イト', 'キモ',
]; // prettier-ignore

const VOGAIS = 'aiueo';

function criarMnemonico(kana, romaji, linha) {
  if (MNEMONICOS[kana]) {
    return MNEMONICOS[kana];
  }
  const base = kana.normalize('NFD').charAt(0);
  const sinal = linha.grupo === 'pa' ? 'maru ゜ (bolinha)' : 'tenten ゛ (dois risquinhos)';
  return `É o ${base} com ${sinal}: o som muda para "${romaji}".`;
}

function criarItem(linha, indice) {
  const kana = linha.kana.charAt(indice);
  const romaji = linha.romaji[indice];
  const coluna = linha.colunas ? linha.colunas[indice] : VOGAIS.indexOf(romaji.slice(-1));
  return Object.freeze({
    id: `k:${kana}`,
    kana,
    romaji,
    grupo: linha.grupo,
    coluna: Math.max(0, coluna),
    tipo: linha.dakuten ? 'dakuten' : 'basico',
    mnemonico: criarMnemonico(kana, romaji, linha),
  });
}

/** Todos os katakana simples (básicos + ゛゜). */
export const KATAKANA = Object.freeze(
  LINHAS.flatMap((linha) => linha.romaji.map((_, indice) => criarItem(linha, indice))),
);

/** As combinações キャ, シュ, チョ… */
export const KATAKANA_COMBINADOS = Object.freeze(
  COMBINACOES.map(([kana, romaji]) =>
    Object.freeze({
      id: `k:${kana}`,
      kana,
      romaji,
      grupo: 'yoon',
      coluna: 'auo'.indexOf(romaji.slice(-1)),
      tipo: 'combinado',
      mnemonico: `${kana.charAt(0)} (${romaji.slice(0, -1)}i) + ${kana.charAt(1)} pequeno = "${romaji}" — numa sílaba só, sem o "i".`,
    }),
  ),
);

/** Linhas da tabela, para desenhar o guia. */
export const LINHAS_DA_TABELA = Object.freeze(
  LINHAS.map((linha) => ({
    grupo: linha.grupo,
    dakuten: Boolean(linha.dakuten),
    itens: KATAKANA.filter((item) => item.grupo === linha.grupo),
  })),
);

const POR_CARACTERE = new Map(
  [...KATAKANA, ...KATAKANA_COMBINADOS].map((item) => [item.kana, item]),
);

/** Busca um item pelo caractere (ex.: "ア" ou "キャ"). */
export function katakanaPorCaractere(caractere) {
  return POR_CARACTERE.get(caractere) ?? null;
}

/** Kana simples de um tipo ('basico' ou 'dakuten'). */
export function listarKatakana(tipos) {
  return KATAKANA.filter((item) => tipos.includes(item.tipo));
}

/** Os parecidos com um kana (sem ele mesmo). */
export function parecidosCom(kana) {
  const grupo = PARECIDOS.find((letras) => letras.includes(kana)) ?? '';
  return [...grupo].filter((letra) => letra !== kana);
}

const PEQUENOS = new Set(['ャ', 'ュ', 'ョ']);

/**
 * Separa uma palavra em sílabas com o romaji de cada uma, para o guia fonético.
 * Ex.: "コーヒー" → コ ko · ー (o) · ヒ hi · ー (i); "サッカー" → サ sa · ッ (k) · カ ka · ー (a).
 * Cada sílaba: { kana, romaji, especial? } — especial = 'longa' (ー) ou 'dobra' (ッ).
 */
export function separarSilabas(palavra) {
  const caracteres = [...palavra];
  const silabas = [];
  for (let i = 0; i < caracteres.length; i += 1) {
    const atual = caracteres[i];
    const proximo = caracteres[i + 1];
    if (proximo && PEQUENOS.has(proximo) && POR_CARACTERE.has(atual + proximo)) {
      silabas.push({ kana: atual + proximo, romaji: POR_CARACTERE.get(atual + proximo).romaji });
      i += 1;
    } else if (atual === 'ー') {
      const anterior = silabas.at(-1)?.romaji ?? '';
      silabas.push({ kana: 'ー', romaji: anterior.slice(-1), especial: 'longa' });
    } else if (atual === 'ッ') {
      silabas.push({ kana: 'ッ', romaji: '', especial: 'dobra' });
    } else {
      silabas.push({ kana: atual, romaji: POR_CARACTERE.get(atual)?.romaji ?? atual });
    }
  }
  // O ッ copia a primeira consoante da sílaba seguinte (チ → "t", como em "matcha").
  silabas.forEach((silaba, indice) => {
    if (silaba.especial === 'dobra') {
      const seguinte = silabas[indice + 1]?.romaji ?? '';
      silaba.romaji = seguinte.startsWith('ch') ? 't' : seguinte.charAt(0);
    }
  });
  return silabas;
}

/** Leitura em romaji de uma palavra inteira ("サッカー" → "sakkaa"). */
export function lerEmRomaji(palavra) {
  return separarSilabas(palavra)
    .map((silaba) => silaba.romaji)
    .join('');
}

/**
 * Nível de dificuldade de uma palavra:
 * 1 = só katakana básicos (e ー); 2 = com ゛ ou ゜; 3 = com ッ ou ャュョ pequenos.
 */
export function nivelDaPalavra(palavra) {
  if (/[ッャュョ]/.test(palavra)) {
    return 3;
  }
  return [...palavra].some((letra) => POR_CARACTERE.get(letra)?.tipo === 'dakuten') ? 2 : 1;
}
