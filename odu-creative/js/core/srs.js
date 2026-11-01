/**
 * Revisão espaçada por competência (sistema de caixas de Leitner adaptado).
 * Funções puras — testadas em tests/srs.test.mjs.
 *
 * Cada competência (skill) guarda: { box, due, correct, wrong, history: [bool...] }
 *  - acerto  → sobe uma caixa; próxima revisão em intervals[box] dias
 *  - erro    → volta para a caixa 0; revisão no mesmo dia
 * Status pedagógico:
 *  0 "Ainda não dominado" | 1 "Em desenvolvimento" | 2 "Consolidado"
 */
export const DAY = 24 * 60 * 60 * 1000;
export const STATUS_LABELS = ['Ainda não dominado', 'Em desenvolvimento', 'Consolidado'];

export function emptySkill() {
  return { box: 0, due: 0, correct: 0, wrong: 0, history: [] };
}

export function updateSkill(state, correct, { now = Date.now(), intervals = [1, 2, 4, 7, 14] } = {}) {
  const s = { ...emptySkill(), ...state, history: [...(state?.history || []), !!correct].slice(-10) };
  if (correct) {
    s.correct += 1;
    s.box = Math.min(s.box + 1, intervals.length);
    s.due = now + intervals[s.box - 1] * DAY;
  } else {
    s.wrong += 1;
    s.box = 0;
    s.due = now;
  }
  s.last = now;
  return s;
}

/** Classifica a competência. consolidateAfter = caixa mínima para "Consolidado". */
export function classify(state, { consolidateAfter = 3 } = {}) {
  if (!state || !state.history?.length) return 0;
  const recent = state.history.slice(-5);
  const acc = recent.filter(Boolean).length / recent.length;
  if (state.box >= consolidateAfter && acc >= 0.8) return 2;
  if (state.box >= 1 && acc >= 0.5) return 1;
  return 0;
}

export function isDue(state, now = Date.now()) {
  return !state || state.due <= now;
}

/** Lista de skills vencidas, das mais frágeis para as mais fortes. */
export function dueSkills(srs, now = Date.now()) {
  return Object.entries(srs || {})
    .filter(([, s]) => isDue(s, now))
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([k]) => k);
}

/**
 * Seleciona itens para um desafio de revisão.
 * Prioriza itens de reviewItems (contextos NOVOS) ligados às skills vencidas e
 * evita itens vistos recentemente (recentIds). Completa com questões do banco se faltar.
 */
export function pickReviewItems({ reviewItems = [], questions = [], srs = {}, recentIds = [], now = Date.now(), size = 5, rnd = Math.random }) {
  let due = dueSkills(srs, now);
  if (!due.length) due = Object.keys(srs);
  const recent = new Set(recentIds);
  const score = (it) => {
    const idx = Math.min(...(it.skills || []).map((s) => (due.includes(s) ? due.indexOf(s) : 99)));
    return idx + (recent.has(it.id) ? 50 : 0) + rnd() * 0.9;
  };
  const pool = [
    ...reviewItems.map((it) => ({ ...it, _src: 'review' })),
    ...questions.filter((q) => q.stage !== 'listening').map((q) => ({ ...q, _src: 'bank' })),
  ].filter((it) => (it.skills || []).some((s) => due.includes(s)));
  const ranked = pool.map((it) => [score(it) + (it._src === 'bank' ? 3 : 0), it]).sort((a, b) => a[0] - b[0]);
  return ranked.slice(0, size).map(([, it]) => it);
}

/** Ajusta intervalos por um fator (ex.: 0.5 = revisões mais frequentes). */
export function scaleIntervals(intervals, factor) {
  return intervals.map((d) => Math.max(1, Math.round(d * factor)));
}
