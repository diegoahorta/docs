// Tabela de hiragana e katakana (gojūon + dakuten/handakuten).
// Cada item tem: kana, romaji (Hepburn), leituras alternativas aceitas,
// grupo (linha da tabela), coluna (vogal), script e uma dica mnemônica em português.

/** Linhas da tabela. `colunas` indica a posição de cada kana (0=a, 1=i, 2=u, 3=e, 4=o). */
const LINHAS = [
  { grupo: 'a', hiragana: 'あいうえお', katakana: 'アイウエオ', romaji: ['a', 'i', 'u', 'e', 'o'] },
  {
    grupo: 'ka',
    hiragana: 'かきくけこ',
    katakana: 'カキクケコ',
    romaji: ['ka', 'ki', 'ku', 'ke', 'ko'],
  },
  {
    grupo: 'sa',
    hiragana: 'さしすせそ',
    katakana: 'サシスセソ',
    romaji: ['sa', 'shi', 'su', 'se', 'so'],
  },
  {
    grupo: 'ta',
    hiragana: 'たちつてと',
    katakana: 'タチツテト',
    romaji: ['ta', 'chi', 'tsu', 'te', 'to'],
  },
  {
    grupo: 'na',
    hiragana: 'なにぬねの',
    katakana: 'ナニヌネノ',
    romaji: ['na', 'ni', 'nu', 'ne', 'no'],
  },
  {
    grupo: 'ha',
    hiragana: 'はひふへほ',
    katakana: 'ハヒフヘホ',
    romaji: ['ha', 'hi', 'fu', 'he', 'ho'],
  },
  {
    grupo: 'ma',
    hiragana: 'まみむめも',
    katakana: 'マミムメモ',
    romaji: ['ma', 'mi', 'mu', 'me', 'mo'],
  },
  {
    grupo: 'ya',
    hiragana: 'やゆよ',
    katakana: 'ヤユヨ',
    romaji: ['ya', 'yu', 'yo'],
    colunas: [0, 2, 4],
  },
  {
    grupo: 'ra',
    hiragana: 'らりるれろ',
    katakana: 'ラリルレロ',
    romaji: ['ra', 'ri', 'ru', 're', 'ro'],
  },
  { grupo: 'wa', hiragana: 'わを', katakana: 'ワヲ', romaji: ['wa', 'wo'], colunas: [0, 4] },
  { grupo: 'n', hiragana: 'ん', katakana: 'ン', romaji: ['n'], colunas: [0] },
  {
    grupo: 'ga',
    hiragana: 'がぎぐげご',
    katakana: 'ガギグゲゴ',
    romaji: ['ga', 'gi', 'gu', 'ge', 'go'],
  },
  {
    grupo: 'za',
    hiragana: 'ざじずぜぞ',
    katakana: 'ザジズゼゾ',
    romaji: ['za', 'ji', 'zu', 'ze', 'zo'],
  },
  {
    grupo: 'da',
    hiragana: 'だぢづでど',
    katakana: 'ダヂヅデド',
    romaji: ['da', 'ji', 'zu', 'de', 'do'],
  },
  {
    grupo: 'ba',
    hiragana: 'ばびぶべぼ',
    katakana: 'バビブベボ',
    romaji: ['ba', 'bi', 'bu', 'be', 'bo'],
  },
  {
    grupo: 'pa',
    hiragana: 'ぱぴぷぺぽ',
    katakana: 'パピプペポ',
    romaji: ['pa', 'pi', 'pu', 'pe', 'po'],
  },
];

/** Ordem em que os grupos são apresentados ao aluno. */
export const GRUPOS_BASICOS = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n'];
export const GRUPOS_DAKUTEN = ['ga', 'za', 'da', 'ba', 'pa'];

/** Outras formas de digitar a mesma leitura (Kunrei-shiki, etc.). */
const ALTERNATIVAS = {
  shi: ['si'],
  chi: ['ti'],
  tsu: ['tu'],
  fu: ['hu'],
  wo: ['o'],
  n: ['nn'],
};

/** Alternativas que dependem do kana (じ/ぢ e ず/づ têm a mesma leitura). */
const ALTERNATIVAS_POR_KANA = {
  じ: ['zi'],
  ジ: ['zi'],
  ぢ: ['di'],
  ヂ: ['di'],
  づ: ['du'],
  ヅ: ['du'],
};

/** Dicas mnemônicas dos hiragana básicos. */
const MNEMONICOS = {
  あ: 'Tem um "a" cursivo escondido embaixo de uma cruz: "Aah!"',
  い: 'Dois palitinhos lado a lado, como as letras "ii".',
  う: 'Uma boca de lado dizendo "uuu", com um tracinho de nariz em cima.',
  え: 'Um ninja dando um chute alto e gritando "Ê!".',
  お: 'Parece o あ, mas deixou uma bolinha voando: "Ooh!".',
  か: 'Uma faca cortando o ar ("ka!"), com uma faísca ao lado.',
  き: 'Parece uma chave (key): dois dentes e uma argola embaixo.',
  く: 'O bico de um passarinho fazendo "ku-ku".',
  け: 'Um barril (keg) ao lado de uma torneira.',
  こ: 'Duas minhocas deitadas, bem quietinhas: "co".',
  さ: 'Um rosto satisfeito sorrindo de lado: "sa".',
  し: 'Um anzol de pesca; o peixe pede silêncio: "shii!".',
  す: 'Um balanço pendurado num galho, com um laço: "su".',
  せ: 'Uma boca aberta mostrando um dente de vampiro: "se".',
  そ: 'Um zigue-zague de linha de costura: "so".',
  た: 'Parece as letras "t" e "a" coladas: "ta".',
  ち: 'Um número 5 olhando para trás e espirrando "tchi!".',
  つ: 'Uma onda grande: "tsu"nami.',
  て: 'Um braço estendido: "te" dou a mão.',
  と: 'Um dedão do pé (toe) com um espinho espetado.',
  な: 'Uma freira rezando ao lado de uma cruz: "na".',
  に: 'Um joelho (knee) ao lado de dois tracinhos.',
  ぬ: 'Macarrão (noodles) enrolado no garfo: "nu".',
  ね: 'Um gato (neko) com o rabo enroladinho.',
  の: 'Um sinal de proibido: "No!".',
  は: 'Alguém rindo de boca aberta: "Ha!".',
  ひ: 'Um sorrisão de orelha a orelha: "Hi hi!".',
  ふ: 'Um rosto soprando uma vela: "Fuu!".',
  へ: 'Um morrinho no caminho: "Hê, que subida!".',
  ほ: 'Papai Noel com a barriga cheia: "Ho ho!".',
  ま: 'Uma mamãe com o cabelo preso num coque.',
  み: 'Parece um 21 escrito com pressa: "mi".',
  む: 'Uma vaca fazendo "muu" com o rabo levantado.',
  め: 'Um olho com a pupila — e "me" significa olho em japonês!',
  も: 'Um anzol com mais (more) iscas: "mo".',
  や: 'Um iaque (yak) com os chifres para cima.',
  ゆ: 'Um peixe nadando em "U": "yu".',
  よ: 'Um ioiô pendurado no dedo: "yo".',
  ら: 'Um coelho (rabbit) sentado com uma orelha em pé: "ra".',
  り: 'Dois juncos crescendo à beira do rio: "ri".',
  る: 'Um caracol com a casinha enrolada embaixo: "ru".',
  れ: 'Uma pessoa ajoelhada rezando: "re".',
  ろ: 'Um 3 sem o laço embaixo, como uma roda: "ro".',
  わ: 'Um cisne deslizando na água: "Wa(u)!".',
  を: 'Alguém engolindo um peixe inteiro: "wo!" (pronuncia-se "o").',
  ん: 'Um "n" escrito à mão, com a perna esticada.',
};

/** Dicas mnemônicas dos katakana básicos. */
const MNEMONICOS_KATAKANA = {
  ア: 'Um machado (axe) de lado: "a".',
  イ: 'Uma pessoa encostada na parede, inclinada: "i".',
  ウ: 'É o う com um chapéu em cima.',
  エ: 'Uma viga de construção em forma de "I" deitado: "e"difício.',
  オ: 'Uma pessoa de braços abertos gritando "Oh!".',
  カ: 'É o か sem a faísca ao lado.',
  キ: 'Uma chave (key) com dois dentes.',
  ク: 'O bico aberto de um cuco: "ku".',
  ケ: 'Uma letra "K" torta: "ke".',
  コ: 'O canto de uma caixa: "co".',
  サ: 'Uma mesa de sala com duas pernas: "sa".',
  シ: 'Rosto sorrindo; os tracinhos ficam à esquerda, como olhos de lado: "shi".',
  ス: 'Uma pessoa subindo correndo uma ladeira: "su".',
  セ: 'Parece o せ, mas sem a perna da direita.',
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
  ヘ: 'Igualzinho ao へ do hiragana!',
  ホ: 'Uma cruz com dois pezinhos, como placa de hospital: "ho".',
  マ: 'Um martelo de lado: "ma".',
  ミ: 'Três minhocas em fila: "mi".',
  ム: 'Um braço dobrado mostrando o músculo: "mu".',
  メ: 'Um X marcando o lugar: "me" aqui!',
  モ: 'Parece o も, com mais linhas retas: "mo".',
  ヤ: 'Parece o や sem a bolinha: "ya".',
  ユ: 'Um "U" quadrado deitado: "yu".',
  ヨ: 'Um "E" ao contrário dizendo "yo!".',
  ラ: 'Uma tampa em cima de um フ: "ra".',
  リ: 'Parece o り, só que mais reto.',
  ル: 'Duas raízes (roots) saindo da terra: "ru".',
  レ: 'Um sinal de "certo" ✓ de revisado: "re".',
  ロ: 'Uma caixa quadrada, como um robô: "ro".',
  ワ: 'Um copo d’água (water) virado: "wa".',
  ヲ: 'Parece um ラ com um traço a mais: "wo" (pronuncia-se "o").',
  ン: 'Um tracinho e uma linha subindo — diferente do ソ, que desce.',
};

const NOME_DO_SINAL = { ga: 'tenten', za: 'tenten', da: 'tenten', ba: 'tenten', pa: 'maru' };
const VOGAIS = 'aiueo';

/** Encontra o kana sem dakuten (ex.: が → か) para gerar a dica. */
function kanaSemSinal(kana) {
  return kana.normalize('NFD').charAt(0);
}

function criarMnemonico(kana, romaji, grupo, script) {
  const dicas = script === 'hiragana' ? MNEMONICOS : MNEMONICOS_KATAKANA;
  if (dicas[kana]) {
    return dicas[kana];
  }
  const base = kanaSemSinal(kana);
  const sinal = NOME_DO_SINAL[grupo] === 'maru' ? '゜ (maru)' : '゛ (tenten)';
  return `É o ${base} com ${sinal}: o som muda para "${romaji}".`;
}

function criarItem(linha, script, indice) {
  const kana = linha[script].charAt(indice);
  const romaji = linha.romaji[indice];
  const coluna = linha.colunas ? linha.colunas[indice] : VOGAIS.indexOf(romaji.slice(-1));
  const outroScript = script === 'hiragana' ? 'katakana' : 'hiragana';
  return Object.freeze({
    id: `${script.charAt(0)}:${kana}`,
    kana,
    romaji,
    alternativas: ALTERNATIVAS_POR_KANA[kana] ?? ALTERNATIVAS[romaji] ?? [],
    grupo: linha.grupo,
    coluna: Math.max(0, coluna),
    script,
    dakuten: GRUPOS_DAKUTEN.includes(linha.grupo),
    par: linha[outroScript].charAt(indice),
    mnemonico: criarMnemonico(kana, romaji, linha.grupo, script),
  });
}

function criarScript(script) {
  return LINHAS.flatMap((linha) =>
    linha.romaji.map((_, indice) => criarItem(linha, script, indice)),
  );
}

export const HIRAGANA = Object.freeze(criarScript('hiragana'));
export const KATAKANA = Object.freeze(criarScript('katakana'));
export const TODOS_KANA = Object.freeze([...HIRAGANA, ...KATAKANA]);

const POR_ID = new Map(TODOS_KANA.map((item) => [item.id, item]));
const POR_CARACTERE = new Map(TODOS_KANA.map((item) => [item.kana, item]));

/** Busca um item pelo id (ex.: "h:あ"). */
export function buscarKana(id) {
  return POR_ID.get(id) ?? null;
}

/** Busca um item pelo caractere (ex.: "ア"). */
export function kanaPorCaractere(caractere) {
  return POR_CARACTERE.get(caractere) ?? null;
}

/** Lista os kana de um script, opcionalmente filtrando por grupos. */
export function listarKana(script, grupos = null) {
  const lista = script === 'katakana' ? KATAKANA : HIRAGANA;
  return grupos ? lista.filter((item) => grupos.includes(item.grupo)) : lista;
}

/** Grupos na ordem de estudo, no formato usado pelo SRS: [{ id, itens: [ids] }]. */
export function gruposDeEstudo(script, incluirDakuten = false) {
  const grupos = incluirDakuten ? [...GRUPOS_BASICOS, ...GRUPOS_DAKUTEN] : GRUPOS_BASICOS;
  return grupos.map((grupo) => ({
    id: grupo,
    itens: listarKana(script, [grupo]).map((item) => item.id),
  }));
}

/** Devolve o kana equivalente no outro script (あ ↔ ア). */
export function parCorrespondente(item) {
  return kanaPorCaractere(item.par);
}

/** Kana pequenos que se juntam ao anterior (き + ゃ = kya). */
const PEQUENOS = { ゃ: 'ya', ゅ: 'yu', ょ: 'yo', ャ: 'ya', ュ: 'yu', ョ: 'yo' };

/** Junta um kana pequeno à leitura anterior: ki+ya = kya, shi+ya = sha. */
function juntarPequeno(leitura, pequeno) {
  if (/(sh|ch|j)i$/.test(leitura)) {
    return leitura.slice(0, -1) + pequeno.slice(1);
  }
  return leitura.endsWith('i') ? leitura.slice(0, -1) + pequeno : leitura + pequeno;
}

/**
 * Lê um texto em kana como romaji (Hepburn simplificado), tratando
 * っ/ッ (consoante dobrada), ー (vogal longa) e ゃゅょ.
 * Ex.: "ねこ" → "neko", "サッカー" → "sakkaa", "きょう" → "kyou".
 */
export function lerEmRomaji(texto) {
  let leitura = '';
  let dobrar = false;
  for (const caractere of texto) {
    if (caractere === 'っ' || caractere === 'ッ') {
      dobrar = true;
    } else if (caractere === 'ー') {
      leitura += leitura.slice(-1);
    } else if (PEQUENOS[caractere]) {
      leitura = juntarPequeno(leitura, PEQUENOS[caractere]);
    } else {
      let silaba = kanaPorCaractere(caractere)?.romaji ?? caractere;
      if (dobrar) {
        silaba = (silaba.startsWith('ch') ? 't' : silaba.charAt(0)) + silaba;
        dobrar = false;
      }
      leitura += silaba;
    }
  }
  return leitura;
}
