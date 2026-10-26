// Guia fonético: como ler o romaji em voz alta, pensado para quem fala português.
// O romaji usa letras do nosso alfabeto, mas algumas não soam como no português.

/** Sons que pegam o falante de português de surpresa, com exemplos em katakana. */
export const SONS_DIFERENTES = Object.freeze([
  {
    romaji: 'shi',
    soa: 'xi',
    explicacao: 'Como o "xi" de "xícara".',
    exemplo: 'シャツ',
  },
  {
    romaji: 'chi',
    soa: 'tchi',
    explicacao: 'Como o "ti" de "tia" no jeito carioca: "tchi".',
    exemplo: 'チーズ',
  },
  {
    romaji: 'tsu',
    soa: 'tsu',
    explicacao: 'O "t" e o "s" grudados, como em "tsunami".',
    exemplo: 'ドーナツ',
  },
  {
    romaji: 'fu',
    soa: 'fu (soprado)',
    explicacao: 'Entre o "f" e o "h": sopre de leve, sem encostar os dentes no lábio.',
    exemplo: 'ゴルフ',
  },
  {
    romaji: 'r',
    soa: 'r de "caro"',
    explicacao: 'Sempre o "r" fraquinho de "caro" ou "arara", nunca o de "rato".',
    exemplo: 'ラーメン',
  },
  {
    romaji: 'h',
    soa: 'h de "hello"',
    explicacao: 'Um sopro leve, como o "h" do inglês "hello" (parecido com o "r" de "rato").',
    exemplo: 'ホテル',
  },
  {
    romaji: 'ji / j',
    soa: 'dji',
    explicacao: '"ji" soa "dji", como o "di" de "dia" em muitos sotaques do Brasil.',
    exemplo: 'オレンジ',
  },
  {
    romaji: 'te / de / to',
    soa: 'tê / dê / tô',
    explicacao: 'Nunca vira "tchê" ou "djê": テ é "tê" e デ é "dê".',
    exemplo: 'テレビ',
  },
  {
    romaji: 's',
    soa: 'ss',
    explicacao: 'Sempre "ss" de "massa", mesmo entre vogais: バス é "bassu", não "bazu".',
    exemplo: 'バス',
  },
  {
    romaji: 'g',
    soa: 'g de "gato"',
    explicacao: 'Sempre forte: "gi" soa "gui" e "ge" soa "gue".',
    exemplo: 'ギター',
  },
  {
    romaji: 'y',
    soa: 'i rápido',
    explicacao: '"ya, yu, yo" soam "ia, iu, io", numa sílaba só.',
    exemplo: 'ヨーヨー',
  },
  {
    romaji: 'n (ン)',
    soa: 'n nasal',
    explicacao: 'Um "n" sozinho, nasal, como no fim de "bom". Antes de b, p ou m soa "m".',
    exemplo: 'パン',
  },
  {
    romaji: 'u',
    soa: 'u leve',
    explicacao: 'Lábios sem arredondar. No fim da palavra, às vezes quase some: スキー ≈ "s’kii".',
    exemplo: 'スキー',
  },
  {
    romaji: 'e / o',
    soa: 'ê / ô',
    explicacao: 'As vogais são sempre fechadas e curtas: "e" = "ê", "o" = "ô".',
    exemplo: 'メロン',
  },
]);

/** Os sinais especiais do katakana. */
export const SINAIS = Object.freeze([
  {
    sinal: 'ー',
    nome: 'Traço de vogal longa',
    explicacao: 'Estica a vogal anterior pelo dobro do tempo. No romaji, a vogal aparece dobrada.',
    exemplo: 'ケーキ',
    leitura: 'ke-e-ki → keeki',
  },
  {
    sinal: 'ッ',
    nome: 'Tsu pequeno',
    explicacao:
      'Não tem som próprio: faz uma pausa curtinha e dobra a consoante seguinte, como se a voz travasse.',
    exemplo: 'サッカー',
    leitura: 'sa-(pausa)-kaa → sakkaa',
  },
  {
    sinal: 'ャ ュ ョ',
    nome: 'Ya, yu, yo pequenos',
    explicacao: 'Juntam-se ao kana de antes numa sílaba só, que perde o "i": キ + ャ = kya.',
    exemplo: 'シャツ',
    leitura: 'sha-tsu → shatsu',
  },
  {
    sinal: '゛',
    nome: 'Tenten (dois risquinhos)',
    explicacao: 'Deixa o som "mais forte": k→g, s→z, t→d, h→b. カ ka → ガ ga.',
    exemplo: 'ゲーム',
    leitura: 'ge-e-mu → geemu',
  },
  {
    sinal: '゜',
    nome: 'Maru (bolinha)',
    explicacao: 'Só aparece na linha do h e transforma o som em "p": ハ ha → パ pa.',
    exemplo: 'ピザ',
    leitura: 'pi-za → piza',
  },
]);

/** Dica de pronúncia para uma leitura em romaji (ex.: "shi" → "xi"). */
export function comoSoa(romaji) {
  const especiais = {
    shi: 'xi',
    chi: 'tchi',
    tsu: 'ts',
    fu: 'fu soprado',
    ji: 'dji',
    ja: 'dja',
    ju: 'dju',
    jo: 'djo',
    sha: 'xa',
    shu: 'xu',
    sho: 'xô',
    cha: 'tcha',
    chu: 'tchu',
    cho: 'tchô',
    wo: 'ô',
    n: 'n nasal',
    gi: 'gui',
    ge: 'guê',
    te: 'tê',
    de: 'dê',
    ya: 'ia',
    yu: 'iu',
    yo: 'iô',
  };
  if (especiais[romaji]) {
    return especiais[romaji];
  }
  if (romaji.startsWith('r')) {
    return `${romaji} (r de "caro")`;
  }
  if (romaji.startsWith('s')) {
    return `${romaji.replace('s', 'ss')}`;
  }
  return romaji.replace(/e$/, 'ê').replace(/o$/, 'ô');
}
