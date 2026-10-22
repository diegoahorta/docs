import { isNative, native } from './native.js';

/**
 * Progresso do aluno. No navegador fica no localStorage; no APK é gravado
 * também nas SharedPreferences do Android, que sobrevivem a limpezas de
 * cache do WebView. Toda leitura/escrita é protegida: sem armazenamento o
 * app continua funcionando, só não persiste.
 */
const KEY = 'odu-blocos:v1';
const VERSION = 1;

const empty = () => ({ v: VERSION, updatedAt: 0, srs: {}, mastery: {}, visited: {}, game: { best: 0, played: 0 } });

const merge = (data) => ({ ...empty(), ...data, game: { ...empty().game, ...(data?.game ?? {}) } });

function readLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? merge(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

let state = readLocal() ?? empty();
const listeners = new Set();

function readNative() {
  try {
    const value = native.getItem(KEY);
    return value ? merge(JSON.parse(value)) : null;
  } catch {
    return null;
  }
}

function save() {
  state.updatedAt = Date.now();
  const raw = JSON.stringify(state);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    /* armazenamento indisponível */
  }
  if (isNative()) {
    try {
      native.setItem(KEY, raw);
    } catch {
      /* ponte indisponível */
    }
  }
  listeners.forEach((fn) => fn(state));
}

export const store = {
  /** No APK, carrega a cópia nativa se ela for mais recente que a do WebView. */
  async init() {
    if (!isNative()) return;
    const saved = readNative();
    if (saved && saved.updatedAt >= state.updatedAt) state = saved;
    else if (state.updatedAt) save();
  },
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
  /** Substitui o progresso por um backup importado. Lança erro se o arquivo não for um backup. */
  restore(data) {
    if (!data || typeof data !== 'object' || typeof data.srs !== 'object' || typeof data.mastery !== 'object') {
      throw new Error('Arquivo não é um backup do ODU Blocos.');
    }
    state = merge(data);
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
