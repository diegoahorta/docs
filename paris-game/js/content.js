// Conteúdo baseado na aula "Francês em blocos no presente" (Odu Creative • Método Chunking).
// Funções dos blocos, como na aula: S sujeito, V verbo, C complemento, A conector/advérbio, L tempo/lugar.
export const CATS = {
  S: { color: '#3d7bea', pt: 'SUJEITO' },
  V: { color: '#e8454f', pt: 'VERBO' },
  C: { color: '#22a35f', pt: 'COMPLEMENTO' },
  A: { color: '#9a5bd6', pt: 'CONECTOR' },
  L: { color: '#ff5f9e', pt: 'LUGAR/TEMPO' },
};

const c = (s) => s.split(' / ').map((x) => { const [t, k] = x.split('|'); return { t, c: k }; });
// sentença: português, blocos certos, blocos falsos, dica, emoji, é pergunta?
const S = (pt, chunks, distract, tip, ctx = '', q = false) => ({ pt, chunks: c(chunks), distract: c(distract), tip, ctx, q });

// junta os blocos como frase corrida: J’ + habite = J’habite; pergunta leva espaço antes do "?"
export function frase(s) {
  const txt = s.chunks.map((x) => x.t).join(' ').replace(/’ /g, '’');
  return txt + (s.q ? ' ?' : '.');
}

export const PLACES = [
  {
    id: 1, key: 'airport', fr: 'Aéroport Charles-de-Gaulle', pt: 'Aeroporto', icon: '✈️', topic: 'Les pronoms', pos: [-42, 34],
    story: 'Lua acabou de pousar em Paris e não fala nada de francês! Primeiro passo: saber <b>quem</b> é quem.',
    rule: 'O sujeito vem antes do verbo e, em francês, quase sempre aparece: <b>je</b> (eu), <b>tu</b> (você informal), <b>il</b> (ele), <b>elle</b> (ela), <b>nous</b> (nós), <b>vous</b> (o senhor/a senhora/vocês), <b>ils</b> (eles), <b>elles</b> (elas).',
    examples: ['Je parle portugais.', 'Vous parlez anglais.'],
    sentences: [
      S('Eu falo português.', 'Je|S / parle|V / portugais|C', 'Tu|S / parles|V', 'je = eu. Com je, o verbo termina em -e: je parle.', '🗣️'),
      S('Você fala francês. (informal)', 'Tu|S / parles|V / français|C', 'Vous|S / parle|V', 'tu = você informal e pede -es: tu parles.', '💬'),
      S('Ele mora em Paris.', 'Il|S / habite|V / à Paris|L', 'Elle|S / habites|V', 'il = ele. Com il, o verbo termina em -e: il habite.', '🏠'),
      S('Ela fala italiano.', 'Elle|S / parle|V / italien|C', 'Il|S / parles|V', 'elle = ela. O nome do idioma não muda: elle parle italien.', '🍝'),
      S('O senhor fala inglês.', 'Vous|S / parlez|V / anglais|C', 'Tu|S / parle|V', 'Tratamento formal = vous, que pede -ez: vous parlez.', '🎩'),
      S('Nós falamos inglês.', 'Nous|S / parlons|V / anglais|C', 'Vous|S / parlez|V', 'nous = nós e pede -ons: nous parlons.', '👭'),
    ],
  },
  {
    id: 2, key: 'cafe', fr: 'Le Café de Saint-Germain', pt: 'Café', icon: '☕', topic: 'Parler et les langues', pos: [-10, 20],
    story: 'No café, todo mundo pergunta que línguas Lua fala. Hora de usar <b>parler</b>!',
    rule: '<b>sujeito + parler + idioma</b> (sem artigo). Terminações: je parl<b>e</b>, tu parl<b>es</b>, il/elle parl<b>e</b>, nous parl<b>ons</b>, vous parl<b>ez</b>, ils/elles parl<b>ent</b>. Idiomas em minúscula: français, portugais.',
    examples: ['Je parle français.', 'Je parle aussi portugais.'],
    sentences: [
      S('Eu falo francês.', 'Je|S / parle|V / français|C', 'parles|V / française|C', 'Idioma = français. “française” é nacionalidade (feminino).', '🥐'),
      S('Você fala português.', 'Tu|S / parles|V / portugais|C', 'parlez|V / parle|V', 'tu → -es: tu parles.', '🇧🇷'),
      S('Ela fala italiano.', 'Elle|S / parle|V / italien|C', 'parlent|V / italienne|C', 'Elle parle italien: o idioma não muda conforme a pessoa.', '🇮🇹'),
      S('Eu também falo português.', 'Je|S / parle|V / aussi|A / portugais|C', 'parles|V / mais|A', 'aussi (também) vem depois do verbo: je parle aussi…', '➕'),
      S('Elas falam inglês.', 'Elles|S / parlent|V / anglais|C', 'parlons|V / Ils|S', 'elles = elas (só mulheres) e pede -ent (que não se pronuncia).', '🇬🇧'),
    ],
  },
  {
    id: 3, key: 'montmartre', fr: 'Appartement à Montmartre', pt: 'Apartamento', icon: '🏡', topic: 'Habiter', pos: [10, -34],
    story: 'Lua vai morar num apartamento charmoso em Montmartre. Como dizer onde cada um <b>mora</b>?',
    rule: '<b>sujeito + habiter + à + cidade</b>. O h de habiter é mudo: <b>je</b> vira <b>j’</b> → j’habite (nunca “je habite”).',
    examples: ['J’habite à São Paulo.', 'Vous habitez à Rio.'],
    sentences: [
      S('Eu moro em São Paulo.', 'J’|S / habite|V / à São Paulo|L', 'Je|S / habites|V', 'Elisão: je + habite = j’habite.', '🌆'),
      S('Você mora em Paris.', 'Tu|S / habites|V / à Paris|L', 'habitez|V / en Paris|L', 'Cidade → à: à Paris. tu → habites.', '🗼'),
      S('Ele mora em Pequim.', 'Il|S / habite|V / à Pékin|L', 'habitent|V / au Pékin|L', 'à + cidade: à Pékin.', '🏯'),
      S('Vocês moram no Rio.', 'Vous|S / habitez|V / à Rio|L', 'habitons|V / Tu|S', 'vous → -ez: vous habitez.', '🏖️'),
      S('Nós moramos em Roma.', 'Nous|S / habitons|V / à Rome|L', 'habitez|V / en Rome|L', 'nous → -ons: nous habitons.', '🏛️'),
    ],
  },
  {
    id: 4, key: 'gare', fr: 'Gare de Lyon', pt: 'Estação de trem', icon: '🚆', topic: 'Voyager', pos: [36, 14],
    story: 'Na estação, Lua descobre que cada destino tem sua preposição. Vamos <b>viajar</b>!',
    rule: 'Cidade → <b>à</b> (à Rio). País feminino ou com vogal → <b>en</b> (en France, en Italie). País masculino → <b>au</b> (au Brésil). Plural → <b>aux</b>. Atenção: <b>nous voyageons</b> conserva o e.',
    examples: ['Vous voyagez au Brésil.', 'Nous voyageons en France.'],
    sentences: [
      S('Eu viajo para o Rio.', 'Je|S / voyage|V / à Rio|L', 'voyages|V / au Rio|L', 'Rio é cidade → à Rio. je → voyage.', '🏖️'),
      S('Vocês viajam ao Brasil.', 'Vous|S / voyagez|V / au Brésil|L', 'voyagent|V / en Brésil|L', 'Brésil é masculino → au Brésil. vous → voyagez.', '🇧🇷'),
      S('Nós viajamos para a França.', 'Nous|S / voyageons|V / en France|L', 'voyagons|V / au France|L', 'nous voyageons (com e) e France é feminino → en France.', '🇫🇷'),
      S('Ela viaja ao Japão.', 'Elle|S / voyage|V / au Japon|L', 'voyages|V / en Japon|L', 'Japon é masculino → au Japon.', '🗾'),
      S('Eles viajam aos Estados Unidos.', 'Ils|S / voyagent|V / aux États-Unis|L', 'voyagez|V / en États-Unis|L', 'País no plural → aux États-Unis.', '🗽'),
      S('Você viaja para a Itália.', 'Tu|S / voyages|V / en Italie|L', 'voyagez|V / au Italie|L', 'Italie começa com vogal → en Italie.', '🍕'),
    ],
  },
  {
    id: 5, key: 'eiffel', fr: 'La Tour Eiffel', pt: 'Torre Eiffel', icon: '🗼', topic: 'Être', pos: [-34, 17],
    story: 'Na Torre Eiffel, Lua se apresenta para novos amigos. O verbo <b>être</b> (ser/estar) é irregular!',
    rule: 'je <b>suis</b> • tu <b>es</b> • il/elle <b>est</b> • nous <b>sommes</b> • vous <b>êtes</b> • ils/elles <b>sont</b>. Nacionalidade muda com o gênero: brésilien / brésilienne.',
    examples: ['Je suis brésilienne.', 'Nous sommes à Paris.'],
    sentences: [
      S('Eu sou brasileira.', 'Je|S / suis|V / brésilienne|C', 'es|V / brésilien|C', 'Lua é mulher → brésilienne. je → suis.', '🇧🇷'),
      S('Você é professor.', 'Tu|S / es|V / professeur|C', 'est|V / êtes|V', 'tu → es.', '👩‍🏫'),
      S('Ela é francesa.', 'Elle|S / est|V / française|C', 'es|V / français|C', 'Nacionalidade feminina: française.', '🇫🇷'),
      S('Nós estamos em Paris.', 'Nous|S / sommes|V / à Paris|L', 'sont|V / êtes|V', 'nous → sommes.', '🗼'),
      S('Eles estão em São Paulo.', 'Ils|S / sont|V / à São Paulo|L', 'sommes|V / est|V', 'ils → sont.', '🌆'),
    ],
  },
  {
    id: 6, key: 'louvre', fr: 'Le Musée du Louvre', pt: 'Museu do Louvre', icon: '🖼️', topic: 'Aussi, mais, souvent, depuis', pos: [4, -12],
    story: 'No Louvre, Lua conversa com Pierre e aprende a ligar ideias e falar de frequência e duração.',
    rule: '<b>mais</b> = mas • <b>aussi</b> = também • <b>souvent</b> = frequentemente • <b>régulièrement</b> = regularmente • <b>depuis trois ans</b> = há três anos (e continua).',
    examples: ['Il est français, mais il parle aussi portugais.', 'J’habite à Rome depuis deux ans.'],
    sentences: [
      S('Ele é francês, mas também fala português.', 'Il|S / est|V / français,|C / mais|A / il|S / parle|V / aussi|A / portugais|C', 'française,|C / et|A', 'mais = mas; aussi vem depois do verbo.', '🎨'),
      S('Você viaja frequentemente a Paris.', 'Tu|S / voyages|V / souvent|A / à Paris|L', 'voyagez|V / depuis|L', 'souvent (frequentemente) logo depois do verbo.', '🔁'),
      S('Eu viajo a Paris regularmente.', 'Je|S / voyage|V / à Paris|L / régulièrement|A', 'voyages|V / pendant|L', 'régulièrement = regularmente.', '📅'),
      S('Pierre e você moram em São Paulo há três anos.', 'Pierre et toi, vous|S / habitez|V / à São Paulo|L / depuis trois ans|L', 'habitons|V / il y a trois ans|L', 'Pierre et toi = vous. depuis = há (e continua).', '⏳'),
      S('Eu moro em Roma há dois anos.', 'J’|S / habite|V / à Rome|L / depuis deux ans|L', 'Je|S / pendant deux ans|L', 'j’habite + depuis (situação que continua).', '🏛️'),
    ],
  },
  {
    id: 7, key: 'notredame', fr: 'Notre-Dame et la Seine', pt: 'Notre-Dame e o Sena', icon: '⛪', topic: 'Les questions', pos: [24, -12],
    story: 'Num passeio pelo Sena, Lua faz perguntas para conhecer os parisienses.',
    rule: 'Pergunta pela entonação: <b>Tu parles français ?</b> Ou com <b>Est-ce que</b>: <b>Est-ce que tu parles français ?</b> (a conjugação não muda). Em francês, há espaço antes do “?”.',
    examples: ['Tu habites à São Paulo ?', 'Est-ce que tu voyages souvent à Paris ?'],
    sentences: [
      S('Você mora em São Paulo?', 'Tu|S / habites|V / à São Paulo|L', 'habitez|V / J’|S', 'Mesma ordem da afirmação + “?”.', '❓', true),
      S('Você fala francês? (com est-ce que)', 'Est-ce que|A / tu|S / parles|V / français|C', 'parlez|V / Je|S', 'Est-ce que + frase normal.', '💬', true),
      S('Você viaja frequentemente ao Brasil?', 'Tu|S / voyages|V / souvent|A / au Brésil|L', 'voyagez|V / en Brésil|L', 'au Brésil (masculino).', '✈️', true),
      S('Sim, eu falo francês e português.', 'Oui,|A / je|S / parle|V / français|C / et|A / portugais|C', 'parles|V / mais|A', 'et = e; mais = mas.', '😊'),
      S('Vocês viajam para a França? (com est-ce que)', 'Est-ce que|A / vous|S / voyagez|V / en France|L', 'voyagent|V / au France|L', 'vous → voyagez; en France.', '🇫🇷', true),
    ],
  },
  {
    id: 8, key: 'arc', fr: 'L’Arc de Triomphe', pt: 'Arco do Triunfo', icon: '🏆', topic: 'Ma présentation', pos: [-26, -26],
    story: 'Grande final! No Arco do Triunfo, Lua faz sua apresentação completa em francês, sem ajuda das cores.',
    rule: 'Perfil completo: <b>être</b> + nacionalidade • <b>habiter</b> + cidade • <b>parler</b> + idioma • <b>voyager</b> + destino • frequência ou duração.',
    examples: ['Je suis brésilienne. J’habite à São Paulo.', 'Je parle portugais et français.'],
    sentences: [
      S('Eu sou brasileira.', 'Je|S / suis|V / brésilienne|C', 'brésilien|C / es|V', 'Feminino: brésilienne.', '🇧🇷'),
      S('Eu moro em São Paulo há três anos.', 'J’|S / habite|V / à São Paulo|L / depuis trois ans|L', 'Je|S / pendant trois ans|L', 'j’habite … depuis trois ans.', '🌆'),
      S('Eu falo português e francês.', 'Je|S / parle|V / portugais|C / et|A / français|C', 'parles|V / mais|A', 'et = e.', '🗣️'),
      S('Eu viajo frequentemente ao Japão.', 'Je|S / voyage|V / souvent|A / au Japon|L', 'voyageons|V / en Japon|L', 'au Japon; souvent depois do verbo.', '🗾'),
      S('Ela fala francês.', 'Elle|S / parle|V / français|C', 'française|C / parles|V', 'O idioma não muda com o gênero: elle parle français.', '👩'),
      S('Nós viajamos para a França.', 'Nous|S / voyageons|V / en France|L', 'voyagons|V / au France|L', 'nous voyageons (com e).', '🇫🇷'),
    ],
  },
];

// palavras e frases motivacionais em francês (com tradução)
export const CHEERS = [
  ['MAGNIFIQUE !', 'Tu parles déjà comme une vraie Parisienne !', 'Você já fala como uma verdadeira parisiense!'],
  ['BRAVO !', 'Chaque mot est un nouveau pas dans Paris !', 'Cada palavra é um novo passo em Paris!'],
  ['FORMIDABLE !', 'Continue comme ça, tu es incroyable !', 'Continue assim, você é incrível!'],
  ['SUPER !', 'Le français n’a plus de secrets pour toi !', 'O francês não tem mais segredos para você!'],
  ['FANTASTIQUE !', 'Paris est fière de toi !', 'Paris tem orgulho de você!'],
  ['EXCELLENT !', 'Petit à petit, l’oiseau fait son nid !', 'Pouco a pouco, o passarinho faz seu ninho!'],
  ['PARFAIT !', 'Crois en toi, tu vas y arriver !', 'Acredite em você, você vai conseguir!'],
  ['OH LÀ LÀ !', 'Tu brilles plus que la tour Eiffel !', 'Você brilha mais que a Torre Eiffel!'],
  ['TRÈS BIEN !', 'Ton français est plus doux qu’un croissant !', 'Seu francês é mais gostoso que um croissant!'],
];
