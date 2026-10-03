// Conteúdo pedagógico: Simple Present × Present Continuous.
// Cores dos blocos: quem (sujeito), auxiliar (am/is/are/do/does...), verbo, complemento, tempo.
export const CATS = {
  sub:  { color: '#4aa8ff', pt: 'QUEM' },
  aux:  { color: '#c27bff', pt: 'AUXILIAR' },
  verb: { color: '#3ddc84', pt: 'VERBO' },
  comp: { color: '#ffa94d', pt: 'COMPLEMENTO' },
  time: { color: '#ffd84d', pt: 'TEMPO' },
  wh:   { color: '#4de8e0', pt: 'PERGUNTA' },
};

// atalho: "texto|categoria"
const c = (s) => s.split(' / ').map((x) => { const [t, k] = x.split('|'); return { t, c: k }; });
const S = (pt, chunks, distract, tip, ctx = '') => ({ pt, chunks: c(chunks), distract: c(distract), tip, ctx });

export const PLANETS = [
  {
    id: 1, model: 'planet_routine', name: 'Planeta Rotina', en: 'Simple Present', scale: 1.0,
    rule: '<b>Simple Present</b> = rotinas, hábitos e fatos. Com <b>he / she / it</b> o verbo ganha <b>-s</b>: she <i>works</i>, he <i>watches</i>.',
    examples: ['I drink tea every morning.', 'She works in a hospital.'],
    sentences: [
      S('Eu bebo chá todas as manhãs.', 'I|sub / drink|verb / tea|comp / every morning|time', 'drinks|verb / am drinking|verb', 'Com I, o verbo fica na forma base: I drink.', '☕'),
      S('Ela trabalha em um hospital.', 'She|sub / works|verb / in a hospital|comp', 'work|verb / is working|verb', 'She (ela) → verbo + s: she works.', '🏥'),
      S('Nós jogamos futebol aos sábados.', 'We|sub / play|verb / football|comp / on Saturdays|time', 'plays|verb / are playing|verb', 'Com we, sem -s: we play.', '⚽'),
      S('Meu irmão assiste TV todo dia.', 'My brother|sub / watches|verb / TV|comp / every day|time', 'watch|verb / watching|verb', 'My brother = he → watch + es = watches (verbos em -ch ganham -es).', '📺'),
      S('A Terra gira em torno do Sol.', 'The Earth|sub / goes|verb / around the Sun|comp', 'go|verb / is going|verb', 'Fatos científicos usam Simple Present. The Earth = it → goes.', '🌍'),
    ],
  },
  {
    id: 2, model: 'planet_now', name: 'Planeta Agora', en: 'Present Continuous', scale: 1.0,
    rule: '<b>Present Continuous</b> = algo acontecendo <b>agora</b>. Forma: <b>am / is / are + verbo-ing</b>.',
    examples: ['I am flying the ship now.', 'They are dancing on the moon.'],
    sentences: [
      S('Eu estou pilotando a nave agora.', 'I|sub / am|aux / flying|verb / the ship|comp / now|time', 'is|aux / fly|verb', 'I → am. I am flying.', '🚀'),
      S('Ela está lendo um livro neste momento.', 'She|sub / is|aux / reading|verb / a book|comp / at the moment|time', 'are|aux / reads|verb', 'She → is. She is reading.', '📖'),
      S('Eles estão dançando na lua.', 'They|sub / are|aux / dancing|verb / on the moon|comp', 'is|aux / dance|verb', 'They → are. dance → dancing (tira o -e).', '🌙'),
      S('O robô está consertando o motor.', 'The robot|sub / is|aux / fixing|verb / the engine|comp', 'are|aux / fixes|verb', 'The robot = it → is fixing.', '🤖'),
      S('Nós estamos explorando o espaço agora mesmo.', 'We|sub / are|aux / exploring|verb / space|comp / right now|time', 'am|aux / explore|verb', 'We → are. right now = agora mesmo.', '🔭'),
    ],
  },
  {
    id: 3, model: 'planet_spelling', name: 'Planeta Cristal da Ortografia', en: '-s / -es / -ies / -ing', scale: 1.0,
    rule: '<b>-s:</b> study → stud<b>ies</b>, go → go<b>es</b>. <b>-ing:</b> run → ru<b>nn</b>ing, make → mak<b>ing</b>, swim → swi<b>mm</b>ing.',
    examples: ['He studies English.', 'I am running to the ship!'],
    sentences: [
      S('Ele estuda inglês todo dia.', 'He|sub / studies|verb / English|comp / every day|time', 'studys|verb / study|verb', 'Consoante + y → ies: study → studies.', '📚'),
      S('Ela vai à escola de ônibus.', 'She|sub / goes|verb / to school|comp / by bus|comp', 'gos|verb / go|verb', 'go → goes (verbos em -o ganham -es).', '🚌'),
      S('Eu estou correndo para a nave!', 'I|sub / am|aux / running|verb / to the ship|comp', 'runing|verb / run|verb', 'run → running: dobra a última consoante.', '🏃'),
      S('Ele está fazendo o jantar.', 'He|sub / is|aux / making|verb / dinner|comp', 'makeing|verb / makes|verb', 'make → making: tira o -e antes do -ing.', '🍲'),
      S('Ela está nadando no lago alienígena.', 'She|sub / is|aux / swimming|verb / in the alien lake|comp', 'swiming|verb / swims|verb', 'swim → swimming: dobra o m.', '🏊'),
    ],
  },
  {
    id: 4, model: 'planet_negatives', name: 'Planeta Vulcão do Não', en: 'Negativas', scale: 1.0,
    rule: '<b>Simple Present:</b> don\'t / doesn\'t + verbo base (he <b>doesn\'t eat</b>). <b>Present Continuous:</b> am not / isn\'t / aren\'t + -ing.',
    examples: ['He doesn\'t eat meat.', 'She isn\'t sleeping now.'],
    sentences: [
      S('Eu não gosto de frio.', 'I|sub / don\'t|aux / like|verb / cold weather|comp', 'doesn\'t|aux / am not|aux', 'Hábito/gosto → Simple Present: I don\'t like.', '🥶'),
      S('Ele não come carne.', 'He|sub / doesn\'t|aux / eat|verb / meat|comp', 'don\'t|aux / eats|verb', 'Com doesn\'t o verbo volta à forma base: doesn\'t eat (sem -s).', '🥩'),
      S('Ela não está dormindo agora.', 'She|sub / isn\'t|aux / sleeping|verb / now|time', 'doesn\'t|aux / sleep|verb', 'Agora → Present Continuous: she isn\'t sleeping.', '😴'),
      S('Nós não estamos assistindo TV.', 'We|sub / aren\'t|aux / watching|verb / TV|comp', 'don\'t|aux / watch|verb', 'We → aren\'t + -ing.', '📺'),
      S('Eu não estou brincando!', 'I|sub / am not|aux / joking|verb', 'don\'t|aux / joke|verb', 'I → am not (não existe “amn\'t”).', '😄'),
    ],
  },
  {
    id: 5, model: 'planet_questions', name: 'Planeta Gelo das Perguntas', en: 'Perguntas', scale: 1.0,
    rule: '<b>Simple Present:</b> Do / Does + sujeito + verbo base? <b>Present Continuous:</b> Am / Is / Are + sujeito + -ing?',
    examples: ['Does she speak English?', 'Are you listening?'],
    sentences: [
      S('Você mora em Londres?', 'Do|aux / you|sub / live|verb / in London?|comp', 'Does|aux / living|verb', 'you → Do. Do you live…?', '🇬🇧'),
      S('Ela fala inglês?', 'Does|aux / she|sub / speak|verb / English?|comp', 'Do|aux / speaks|verb', 'she → Does, e o verbo fica sem -s: Does she speak…?', '🗣️'),
      S('Você está ouvindo?', 'Are|aux / you|sub / listening?|verb', 'Do|aux / listen?|verb', 'Agora → Are you listening?', '🎧'),
      S('Ele está pilotando a nave?', 'Is|aux / he|sub / flying|verb / the ship?|comp', 'Does|aux / fly|verb', 'Pergunta sobre agora: Is he flying…?', '🚀'),
      S('O que você está fazendo?', 'What|wh / are|aux / you|sub / doing?|verb', 'do|aux / does|aux', 'What + are + you + doing? (agora).', '❓'),
    ],
  },
  {
    id: 6, model: 'planet_markers', name: 'Nebulosa dos Marcadores', en: 'Palavras-sinal', scale: 1.0,
    rule: '<b>always, usually, often, never, every day</b> → Simple Present. <b>now, right now, at the moment, Look!, Listen!</b> → Present Continuous. Advérbios como <i>always</i> vêm antes do verbo.',
    examples: ['I always have breakfast.', 'Look! It is raining.'],
    sentences: [
      S('Eu sempre tomo café da manhã.', 'I|sub / always|time / have|verb / breakfast|comp', 'am having|verb / now|time', 'always → Simple Present, antes do verbo: I always have.', '🥐'),
      S('Olhe! Está chovendo.', 'Look!|time / It|sub / is|aux / raining|verb', 'rains|verb / every day|time', 'Look! indica algo acontecendo agora → is raining.', '🌧️'),
      S('Ela geralmente anda de bicicleta.', 'She|sub / usually|time / rides|verb / her bike|comp', 'ride|verb / is riding|verb', 'usually → Simple Present; she → rides.', '🚲'),
      S('Neste momento, eles estão comendo.', 'At the moment,|time / they|sub / are|aux / eating|verb', 'eat|verb / always|time', 'At the moment → Present Continuous.', '🍕'),
      S('Ele nunca bebe café.', 'He|sub / never|time / drinks|verb / coffee|comp', 'drink|verb / is drinking|verb', 'never → Simple Present; he → drinks.', '☕'),
    ],
  },
  {
    id: 7, model: 'planet_contrast', name: 'Planeta Dia & Noite', en: 'Contraste', scale: 1.0,
    rule: 'Rotina (Simple Present) × exceção de agora (Present Continuous): <i>I <b>usually walk</b>, but today I <b>am taking</b> a bus.</i>',
    examples: ['She works in London, but this month she is working in Paris.'],
    sentences: [
      S('Eu normalmente vou a pé, mas hoje estou pegando um ônibus.', 'I|sub / usually|time / walk,|verb / but today|time / I|sub / am|aux / taking|verb / a bus|comp', 'walking,|verb / take|verb', 'usually → walk; today (exceção) → am taking.', '🚶'),
      S('Ela trabalha em Londres, mas este mês está trabalhando em Paris.', 'She|sub / works|verb / in London,|comp / but this month|time / she|sub / is|aux / working|verb / in Paris|comp', 'work|verb / are|aux', 'Situação permanente → works; temporária → is working.', '🗼'),
      S('Escute! O bebê está chorando.', 'Listen!|time / The baby|sub / is|aux / crying|verb', 'cries|verb / cry|verb', 'Listen! → acontecendo agora.', '👶'),
      S('A água ferve a 100 graus.', 'Water|sub / boils|verb / at 100 degrees|comp', 'is boiling|verb / boil|verb', 'Fato científico → Simple Present: water boils.', '💧'),
      S('O que você faz nos fins de semana?', 'What|wh / do|aux / you|sub / do|verb / on weekends?|time', 'are|aux / doing|verb', 'Rotina (nos fins de semana) → What do you do…?', '🗓️'),
    ],
  },
  {
    id: 8, model: 'planet_paradox', name: 'Buraco do Paradoxo', en: 'Desafio final', scale: 1.0,
    rule: 'Desafio final! Lembre: verbos de estado como <b>know, like, understand, want</b> normalmente <b>não</b> vão para o -ing.',
    examples: ['I know the answer.', 'She is thinking about a trip.'],
    sentences: [
      S('Eu sei a resposta.', 'I|sub / know|verb / the answer|comp', 'am knowing|verb / knows|verb', 'know é verbo de estado: I know (não “am knowing”).', '💡'),
      S('Ela está pensando em uma viagem.', 'She|sub / is|aux / thinking|verb / about a trip|comp', 'thinks|verb / are|aux', 'think about (pensar em, agora) aceita -ing: she is thinking.', '🤔'),
      S('Você gosta de ficção científica?', 'Do|aux / you|sub / like|verb / science fiction?|comp', 'Are|aux / liking|verb', 'like é verbo de estado → Do you like…?', '👽'),
      S('Agora mesmo, o Professor está consertando a nave.', 'Right now,|time / the Professor|sub / is|aux / repairing|verb / the ship|comp', 'repairs|verb / are|aux', 'Right now → is repairing.', '🔧'),
      S('Todo ano, nós visitamos um planeta novo.', 'Every year,|time / we|sub / visit|verb / a new planet|comp', 'are visiting|verb / visits|verb', 'Every year → hábito → we visit.', '🪐'),
      S('Eles não entendem a pergunta.', 'They|sub / don\'t|aux / understand|verb / the question|comp', 'aren\'t understanding|verb / doesn\'t|aux', 'understand é verbo de estado → they don\'t understand.', '❔'),
    ],
  },
];

// frases motivacionais em inglês (com tradução) para a comemoração
export const CHEERS = [
  ['BRILLIANT!', 'Your English is travelling at light speed!', 'Seu inglês está viajando na velocidade da luz!'],
  ['FANTASTIC!', 'You are mastering space and time!', 'Você está dominando o espaço e o tempo!'],
  ['SUPERNOVA!', 'Every sentence makes you stronger!', 'Cada frase te deixa mais forte!'],
  ['STELLAR!', 'Keep going, the universe is waiting for you!', 'Continue, o universo está esperando por você!'],
  ['AMAZING!', 'You never stop learning. That is your superpower!', 'Você nunca para de aprender. Esse é seu superpoder!'],
  ['GALACTIC!', 'Mistakes are just stars on the way to success!', 'Erros são só estrelas no caminho do sucesso!'],
  ['WONDERFUL!', 'You are the best time traveller in the galaxy!', 'Você é o melhor viajante do tempo da galáxia!'],
  ['UNSTOPPABLE!', 'Believe in yourself and fly higher!', 'Acredite em você e voe mais alto!'],
];
