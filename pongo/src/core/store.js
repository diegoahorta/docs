// Progresso e configurações salvos em localStorage (com tolerância a falhas:
// navegação privada, armazenamento bloqueado etc.).
import { bus } from './events.js'

const KEY = 'odu-pongo-save-v1'

export const DEFAULT_SETTINGS = {
  furigana: true,
  translation: true,
  romaji: false,
  sfx: true,
  music: true,
  voice: true,
  reducedMotion: false
}

function fresh() {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    score: 0,
    levels: {},
    verbs: {},
    forms: {},
    errors: {},
    sentences: 0,
    activities: {},
    achievements: [],
    inventory: [],
    flags: {}
  }
}

let state = fresh()

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data && data.version === 1 ? data : null
  } catch {
    return null
  }
}

export function load() {
  const data = read()
  const base = fresh()
  state = data
    ? { ...base, ...data, settings: { ...base.settings, ...data.settings } }
    : base
  if (typeof matchMedia === 'function' && !data) {
    try {
      state.settings.reducedMotion = matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
    } catch {
      /* ignora */
    }
  }
  return state
}

let timer = null
export function save() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* armazenamento indisponível: o jogo continua sem salvar */
    }
  }, 150)
}

function changed(kind, detail) {
  save()
  bus.emit('progress', { kind, ...detail })
}

export const get = () => state

export function resetProgress() {
  const settings = state.settings
  state = fresh()
  state.settings = settings
  changed('reset')
}

// ---------- configurações ----------
export const setting = (k) => state.settings[k]
export function setSetting(k, v) {
  state.settings[k] = v
  save()
  bus.emit('settings', { key: k, value: v, settings: state.settings })
}

// ---------- verbos: INPUT → INTAKE → OUTPUT ----------
function verbRec(id) {
  return (state.verbs[id] ??= { seen: 0, recognized: 0, produced: 0, errors: 0, last: 0 })
}

/** INPUT: o aluno viu o verbo associado a uma ação. Retorna true se for novo. */
export function markSeen(id) {
  const r = verbRec(id)
  const isNew = r.seen === 0
  r.seen++
  r.last = Date.now()
  changed('seen', { id, isNew })
  return isNew
}
/** INTAKE: reconheceu o verbo (múltipla escolha, runner…). */
export function markRecognized(id) {
  verbRec(id).recognized++
  changed('recognized', { id })
}
/** OUTPUT: produziu o verbo (frase, conjugação). */
export function markProduced(id) {
  verbRec(id).produced++
  changed('produced', { id })
}
export function recordError(tag, verbId) {
  state.errors[tag] = (state.errors[tag] ?? 0) + 1
  if (verbId) verbRec(verbId).errors++
  changed('error', { tag, verbId })
}
export function recordForm(form, ok) {
  const f = (state.forms[form] ??= { correct: 0, wrong: 0 })
  ok ? f.correct++ : f.wrong++
  changed('form', { form, ok })
}
export function addSentence() {
  state.sentences++
  changed('sentence')
}
export function verbStage(id) {
  const r = state.verbs[id]
  if (!r || !r.seen) return 0
  if (r.produced) return 3
  if (r.recognized) return 2
  return 1
}
export const discoveredVerbs = () =>
  Object.keys(state.verbs).filter((id) => state.verbs[id].seen > 0)

/** Verbos que precisam de revisão: vistos mas não produzidos, ou com muitos erros. */
export function pendingReviews() {
  return Object.entries(state.verbs)
    .filter(
      ([, r]) =>
        r.seen && (!r.recognized || !r.produced || r.errors > r.recognized + r.produced)
    )
    .map(([id]) => id)
}

// ---------- pontuação, fases, atividades ----------
export function addScore(n) {
  state.score += n
  changed('score', { delta: n })
}
export function level(id) {
  return (state.levels[id] ??= {
    missions: [],
    completed: false,
    stars: 0,
    bridge: false
  })
}
export function completeMission(levelId, missionId) {
  const l = level(levelId)
  if (l.missions.includes(missionId)) return false
  l.missions.push(missionId)
  changed('mission', { levelId, missionId })
  return true
}
export function resetLevelRun(levelId) {
  const l = level(levelId)
  l.missions = []
  l.bridge = false
  save()
}
export function completeLevel(levelId, stars) {
  const l = level(levelId)
  l.completed = true
  l.stars = Math.max(l.stars, stars)
  changed('level', { levelId })
}
export function markActivity(id, result) {
  const prev = state.activities[id]
  state.activities[id] = {
    done: true,
    best: Math.max(prev?.best ?? 0, result?.score ?? 0)
  }
  changed('activity', { id })
}
export const activityDone = (id) => !!state.activities[id]?.done

export function addItem(id) {
  if (state.inventory.includes(id)) return false
  state.inventory.push(id)
  changed('item', { id })
  return true
}
export const hasFlag = (k) => !!state.flags[k]
export function setFlag(k, v = true) {
  state.flags[k] = v
  changed('flag', { k })
}
export function unlockAchievement(id) {
  if (state.achievements.includes(id)) return false
  state.achievements.push(id)
  changed('achievement', { id })
  return true
}
