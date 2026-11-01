/**
 * Armazenamento local (localStorage) de configurações e progresso.
 * Todos os acessos são protegidos: em modo privado ou com armazenamento bloqueado,
 * o app continua funcionando (apenas sem lembrar o progresso).
 *
 * Privacidade (LGPD): nada sai do dispositivo. Não coletamos nome, e-mail ou voz.
 * O aluno pode exportar o próprio progresso (arquivo JSON) para entregar ao professor.
 */
import { updateSkill } from './srs.js';

const PREFIX = 'odu:';
let memory = {}; // fallback quando localStorage não está disponível
export let storageAvailable = true;

function rawGet(key) {
  try { return localStorage.getItem(PREFIX + key); } catch { storageAvailable = false; return memory[key] ?? null; }
}
function rawSet(key, val) {
  try { localStorage.setItem(PREFIX + key, val); } catch { storageAvailable = false; memory[key] = val; }
}
export function getJSON(key, fallback) {
  try { const v = rawGet(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
export function setJSON(key, value) { rawSet(key, JSON.stringify(value)); }
export function remove(key) { try { localStorage.removeItem(PREFIX + key); } catch { delete memory[key]; } }

/* ---------- Settings ---------- */
export const defaultSettings = { theme: 'auto', contrast: false, reducedMotion: false, captions: true, furigana: true, romaji: false, textSize: '1', noMic: false, responseTime: null, srsFactor: 1 };
export function getSettings() { return { ...defaultSettings, ...getJSON('settings', {}) }; }
export function saveSettings(s) { setJSON('settings', s); }

/* ---------- Progress ---------- */
export function emptyProgress(unitId) {
  return {
    unitId, xp: 0, modules: {}, attempts: [], badges: [], srs: {}, streak: { last: null, days: 0 },
    listening: {}, hypothesis: '', quest: {}, speaking: {}, reviewSessions: 0, createdAt: Date.now(),
  };
}
export function getProgress(unitId) {
  return { ...emptyProgress(unitId), ...getJSON(`progress:${unitId}`, {}) };
}
export function saveProgress(p) { setJSON(`progress:${p.unitId}`, p); }
export function resetProgress(unitId) { remove(`progress:${unitId}`); }

/**
 * Registra uma tentativa e atualiza a revisão espaçada de cada skill envolvida.
 * Retorna a tentativa registrada.
 */
export function logAttempt(p, { qid, skills = [], correct, firstTry = true, module = '', now = Date.now() }, { intervals } = {}) {
  const a = { qid, skills, correct: !!correct, firstTry, module, ts: now };
  p.attempts.push(a);
  if (p.attempts.length > 2000) p.attempts = p.attempts.slice(-2000);
  for (const s of skills) p.srs[s] = updateSkill(p.srs[s], correct, { now, intervals });
  return a;
}

/** Marca o módulo como concluído (ou atualiza a fração concluída 0..1). */
export function setModuleProgress(p, key, ratio) {
  p.modules[key] = Math.max(p.modules[key] || 0, Math.min(1, ratio));
}

/* ---------- Custom units / overrides (Painel do Professor) ---------- */
export function getUnitOverride(id) { return getJSON(`unit:${id}`, null); }
export function saveUnitOverride(unit) { setJSON(`unit:${unit.id}`, unit); }
export function removeUnitOverride(id) { remove(`unit:${id}`); }
export function getCustomUnitIds() { return getJSON('customUnits', []); }
export function setCustomUnitIds(ids) { setJSON('customUnits', [...new Set(ids)]); }
export function getActiveUnitId(fallback) { return getJSON('activeUnit', fallback); }
export function setActiveUnitId(id) { setJSON('activeUnit', id); }

/* ---------- Resultados importados pelo professor ---------- */
export function getImportedResults() { return getJSON('teacher:results', []); }
export function saveImportedResults(list) { setJSON('teacher:results', list); }
