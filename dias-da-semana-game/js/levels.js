// Conteúdo pedagógico baseado na aula "Dias da semana em inglês" (Método Chunking).
// Código de cores da aula:
//   azul = quem / sujeito, verde = verbo/ação, laranja = complemento,
//   roxo = quando (on + dia), amarelo = dia como resposta.

export const CATS = {
  who:  { color: '#2f7de1', dark: '#1a4f99', pt: 'QUEM' },
  verb: { color: '#22a447', dark: '#136b2c', pt: 'AÇÃO' },
  comp: { color: '#ff8a1f', dark: '#b35400', pt: 'COMPLEMENTO' },
  when: { color: '#8e4fd6', dark: '#5a2a96', pt: 'QUANDO' },
  day:  { color: '#f2b800', dark: '#9a7500', pt: 'DIA' },
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAYS_PT = {
  Sunday: 'domingo', Monday: 'segunda-feira', Tuesday: 'terça-feira', Wednesday: 'quarta-feira',
  Thursday: 'quinta-feira', Friday: 'sexta-feira', Saturday: 'sábado',
};

// Lugares do oceano (compromissos do Finn). Posições no plano XZ do mundo 3D.
export const PLACES = {
  home:     { model: 'place_home',     pos: [0, 20],    r: 3.6, en: "FINN'S HOUSE", pt: 'casa do Finn', icon: '🏠', scale: 1.0 },
  calendar: { model: 'place_calendar', pos: [0, -14],   r: 3.0, en: 'CALENDAR',     pt: 'calendário',   icon: '📅', scale: 1.1 },
  school:   { model: 'place_school',   pos: [-36, -30], r: 6.0, en: 'SCHOOL',       pt: 'escola',       icon: '📚', scale: 1.15 },
  football: { model: 'place_football', pos: [38, -30],  r: 0,   en: 'FOOTBALL FIELD', pt: 'campo de futebol', icon: '⚽', scale: 1.0 },
  arcade:   { model: 'place_arcade',   pos: [-44, 20],  r: 4.5, en: 'ARCADE',       pt: 'fliperama',    icon: '🎮', scale: 1.1 },
  music:    { model: 'place_music',    pos: [44, 20],   r: 5.0, en: 'MUSIC SHELL',  pt: 'concha da música', icon: '🎵', scale: 1.1 },
  tv:       { model: 'place_tv',       pos: [0, 50],    r: 4.0, en: 'VIDEO TV',     pt: 'TV de vídeos', icon: '📺', scale: 1.1 },
};

// A agenda semanal do Finn (aparece a partir da fase 3).
export const AGENDA = {
  Monday:    { place: 'school',   act: ['study', 'English'],      pt: 'estudar inglês' },
  Tuesday:   { place: 'football', act: ['play', 'football'],     pt: 'jogar futebol' },
  Wednesday: { place: 'tv',       act: ['watch', 'videos'],      pt: 'assistir vídeos' },
  Thursday:  { place: 'football', act: ['play', 'football'],     pt: 'jogar futebol' },
  Friday:    { place: 'school',   act: ['study', 'English'],      pt: 'estudar inglês' },
  Saturday:  { place: 'arcade',   act: ['play', 'video games'],  pt: 'jogar videogame' },
  Sunday:    { place: 'music',    act: ['listen to', 'music'],   pt: 'escutar música' },
};

const ACT_PT = {
  'study English': 'estudo inglês', 'play football': 'jogo futebol', 'watch videos': 'assisto vídeos',
  'play video games': 'jogo videogame', 'listen to music': 'escuto música',
};
const NA = { Sunday: 'no domingo', Saturday: 'no sábado' };
const naDia = (d) => NA[d] || `na ${DAYS_PT[d]}`;

const day = (t) => ({ t, c: 'day' });

function todayRound(d, distract) {
  return {
    ask: 'What day is it today?',
    pt: `Hoje é ${DAYS_PT[d]}.`,
    chunks: [{ t: 'Today', c: 'who' }, { t: 'is', c: 'verb' }, day(d)],
    distract: distract.map((x) => (x.startsWith('on ') ? { t: x, c: 'when' } : day(x))),
    dest: 'calendar',
  };
}

function agendaRound(d, distract, ask = false) {
  const a = AGENDA[d];
  return {
    ask: ask ? `What do you do on ${d}?` : null,
    pt: `Eu ${ACT_PT[a.act.join(' ')]} ${naDia(d)}.`,
    chunks: [{ t: 'I', c: 'who' }, { t: a.act[0], c: 'verb' }, { t: a.act[1], c: 'comp' }, { t: `on ${d}`, c: 'when' }],
    distract,
    dest: a.place,
    day: d,
    hidePt: ask, // na fase final o aluno usa a agenda, não a tradução
  };
}

const D = (t, c) => ({ t, c });

export const PHASES = [
  {
    id: 1,
    title: 'Os 7 Dias',
    en: 'Sunday, Monday, Tuesday…',
    goal: 'Nade até as bolhas dos dias na ordem certa.',
    tip: 'Em inglês, os dias começam com letra maiúscula e todos terminam em <b>day</b> (dia).',
    jellies: 0,
    drift: 0,
    rounds: [
      { type: 'days', order: [...DAYS], ask: 'Start with Monday!', pt: 'Organize a semana começando por Monday (segunda).' },
      { type: 'days', order: ['Sunday', ...DAYS.slice(0, 6)], ask: 'Can you sing it with me?', pt: 'Agora na ordem da música: comece por Sunday (domingo)!' },
    ],
  },
  {
    id: 2,
    title: 'What day is it today?',
    en: 'Today is…',
    goal: 'Monte a frase <b>Today is …</b> e leve até o calendário.',
    tip: 'Não use <b>on</b> em <i>Today is Monday</i>: essa frase identifica o dia de hoje. Atenção a <b>Tuesday</b> × <b>Thursday</b>!',
    jellies: 0,
    drift: 0.2,
    rounds: [
      todayRound('Friday', ['Monday', 'on Friday']),
      todayRound('Tuesday', ['Thursday', 'Wednesday']),
      todayRound('Thursday', ['Tuesday', 'on Thursday', 'Saturday']),
    ],
  },
  {
    id: 3,
    title: 'Dia de Escola',
    en: 'I study English on…',
    goal: 'Monte a frase e leve o Finn até a <b>SCHOOL</b>.',
    tip: 'Use <b>on</b> antes de um dia da semana: on Monday, on Friday. Quem → Ação → Complemento → Quando.',
    jellies: 2,
    drift: 0.3,
    showAgenda: true,
    rounds: [
      agendaRound('Monday', [D('play', 'verb'), D('on Friday', 'when')]),
      agendaRound('Friday', [D('watch', 'verb'), D('music', 'comp'), D('on Monday', 'when')]),
    ],
  },
  {
    id: 4,
    title: 'Hora de Jogar',
    en: 'I play … on …',
    goal: 'Vá ao <b>ARCADE</b> e ao <b>FOOTBALL FIELD</b> nos dias certos.',
    tip: '<b>play video games</b> = jogar videogame • <b>play football</b> = jogar futebol.',
    jellies: 4,
    drift: 0.45,
    showAgenda: true,
    rounds: [
      agendaRound('Saturday', [D('study', 'verb'), D('football', 'comp'), D('on Sunday', 'when')]),
      agendaRound('Tuesday', [D('video games', 'comp'), D('watch', 'verb'), D('on Thursday', 'when')]),
    ],
  },
  {
    id: 5,
    title: 'Música e Vídeos',
    en: 'I listen to music…',
    goal: 'Leve o Finn à <b>MUSIC SHELL</b> e à <b>VIDEO TV</b>.',
    tip: 'Mantenha <b>listen to</b> como um bloco só! <b>watch videos</b> = assistir vídeos.',
    jellies: 5,
    drift: 0.6,
    showAgenda: true,
    rounds: [
      agendaRound('Sunday', [D('listen', 'verb'), D('videos', 'comp'), D('on Saturday', 'when')]),
      agendaRound('Wednesday', [D('listen to', 'verb'), D('music', 'comp'), D('Today', 'who'), D('on Sunday', 'when')]),
    ],
  },
  {
    id: 6,
    title: 'A Agenda do Finn',
    en: 'What do you do on…?',
    goal: 'Responda às perguntas olhando a <b>agenda</b> e vá a cada compromisso!',
    tip: 'A: <b>What do you do on Saturday?</b> B: <b>I play video games on Saturday.</b>',
    jellies: 8,
    drift: 0.8,
    showAgenda: true,
    rounds: [
      agendaRound('Saturday', [D('study', 'verb'), D('music', 'comp'), D('on Sunday', 'when'), D('Today', 'who')], true),
      agendaRound('Monday', [D('play', 'verb'), D('videos', 'comp'), D('on Tuesday', 'when'), D('is', 'verb')], true),
      agendaRound('Thursday', [D('watch', 'verb'), D('English', 'comp'), D('on Tuesday', 'when'), D('listen to', 'verb')], true),
      agendaRound('Sunday', [D('play', 'verb'), D('video games', 'comp'), D('on Saturday', 'when'), D('watch', 'verb')], true),
    ],
  },
];

export const CHEERS = ['SWEET!', 'AWESOME!', 'FINTASTIC!', 'JAWSOME!', 'SUPER!', 'AMAZING!', 'PERFECT!', 'INCREDIBLE!', 'DIVINE!', 'WONDERFUL!'];
