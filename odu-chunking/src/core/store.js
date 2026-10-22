/**
 * Progresso salvo no navegador. Toda leitura/escrita é protegida: em janela
 * anônima ou com armazenamento bloqueado o app funciona sem persistir.
 */
const KEY = 'odu-blocos:v1';

const empty = () => ({ srs: {}, mastery: {}, visited: {}, game: { best: 0, played: 0 } });

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* armazenamento indisponível */
  }
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get: () => state,
  update(fn) {
    fn(state);
    save();
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset() {
    state = empty();
    save();
  },
};

/** Acertos por frase e idioma no jogo de construção. */
export function addMastery(id, lang, ok) {
  store.update((s) => {
    const m = (s.mastery[id] ??= { en: 0, fr: 0, de: 0, es: 0 });
    m[lang] = Math.max(0, Math.min(5, m[lang] + (ok ? 1 : -1)));
  });
}

/** 0–1: domínio combinado de uma frase em um idioma (jogo + revisão). */
export function masteryOf(id, lang) {
  const s = state;
  const game = (s.mastery[id]?.[lang] ?? 0) / 5;
  const box = (s.srs[id]?.box ?? 0) / 5;
  return Math.min(1, game * 0.6 + box * 0.4);
}
