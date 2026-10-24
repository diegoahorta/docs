// Estado global (configurações, progresso e aprendizagem).
const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const DEFAULT_SETTINGS = {
  furigana: true,
  translation: true,
  analysis: false,
  volume: 0.7,
  music: 0.35,
  voice: false,
  reducedMotion: !!prefersReduced,
  textSpeed: 'normal', // slow | normal | fast | instant
  timer: false, // false = jogar sem limite de tempo
  minimap: true,
  touch: 'auto' // auto | on | off
}

export function newProgress() {
  return {
    started: false,
    finished: false,
    phase: 1,
    step: 0,
    unlocked: 1,
    completed: [],
    inventory: [],
    restored: [],
    foundCats: [],
    huntDone: [],
    seqIndex: 0,
    collected: [],
    flags: {},
    playTime: 0
  }
}

export function newLearning() {
  return {
    seen: {}, // vocabId → timestamp da primeira exposição (INPUT)
    vocab: {}, // vocabId → { correct, wrong, streak }
    skills: {}, // skill → { correct, wrong }
    errors: {}, // tag → contagem (dificuldades recorrentes)
    review: [], // vocabIds que precisam de revisão
    challenges: [], // ids de desafios concluídos
    attempts: 0,
    correct: 0,
    wrong: 0
  }
}

export const state = {
  settings: { ...DEFAULT_SETTINGS },
  progress: newProgress(),
  learning: newLearning()
}

export function resetState() {
  state.settings = { ...DEFAULT_SETTINGS, ...state.settings }
  state.progress = newProgress()
  state.learning = newLearning()
}
