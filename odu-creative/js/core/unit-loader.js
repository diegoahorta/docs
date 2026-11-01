/**
 * Carregamento de unidades.
 * Ordem de prioridade: edição do professor (localStorage) → arquivo units/<id>/unit.json.
 * Unidades criadas no painel ficam só no localStorage (exportáveis em JSON).
 */
import { getUnitOverride, getCustomUnitIds } from './store.js';
import { getMedia } from './idb.js';
import { SyncPlayer, TtsSyncPlayer } from './audio-sync.js';

export const REGISTRY_URL = 'units/index.json';

/**
 * Versão em arquivo único (dist/odu-creative.html): unidades e mídias vêm embutidas em
 * window.__ODU_EMBED__ = { index, units: {id: unit}, assets: {caminho: dataURL} }.
 */
const EMBED = globalThis.__ODU_EMBED__ || null;
export const isEmbedded = () => !!EMBED;

/** Resolve o caminho de um arquivo da unidade (áudio, docx) para URL utilizável. */
export function assetUrl(path) {
  return EMBED?.assets?.[path] || path;
}

export async function listUnits() {
  let builtIn = [];
  try { builtIn = EMBED ? EMBED.index : await (await fetch(REGISTRY_URL)).json(); } catch { builtIn = []; }
  const custom = getCustomUnitIds().map((id) => {
    const u = getUnitOverride(id);
    return u ? { id, title: u.title, language: u.language?.name, level: u.level, custom: true } : null;
  }).filter(Boolean);
  return [...builtIn, ...custom.filter((c) => !builtIn.some((b) => b.id === c.id))];
}

export async function fetchOriginalUnit(id) {
  if (EMBED) {
    if (!EMBED.units[id]) throw new Error(`Unidade "${id}" não encontrada.`);
    return JSON.parse(JSON.stringify(EMBED.units[id]));
  }
  const res = await fetch(`units/${id}/unit.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Unidade "${id}" não encontrada.`);
  return res.json();
}

export async function loadUnit(id) {
  const override = getUnitOverride(id);
  let unit;
  if (override) unit = override;
  else unit = await fetchOriginalUnit(id);
  unit._base = override?._baseFrom ? `units/${override._baseFrom}/` : `units/${id}/`;
  unit._edited = !!override;
  return unit;
}

/** Junta questões do banco por id. */
export function questionById(unit, id) {
  return unit.questions.find((q) => q.id === id) || unit.reviewItems?.find((q) => q.id === id);
}

export function allSkills(unit) {
  const s = new Set();
  for (const q of [...unit.questions, ...(unit.reviewItems || [])]) (q.skills || []).forEach((k) => s.add(k));
  return [...s];
}

export const SKILL_NAMES = {
  'g-would-like': "I'd like + item",
  'g-can-i-have': 'Can I have...?',
  'g-a-an': 'Artigos a / an',
  'g-how-much': 'Preços: How much...?',
  'vocab-cafe': 'Vocabulário da cafeteria',
  'listening-gist': 'Escuta: ideia geral',
  'listening-detail': 'Escuta: detalhes',
  'listening-numbers': 'Escuta: números e preços',
  'reading-menu': 'Leitura de cardápio',
};
export function skillName(unit, id) {
  return unit.grammar.find((g) => g.id === id)?.name || unit.skillNames?.[id] || SKILL_NAMES[id] || id;
}

/**
 * Cria o player da faixa: áudio importado pelo professor (IndexedDB) → arquivo da unidade →
 * síntese de voz do navegador. Retorna {player, source}.
 */
export async function createTrackPlayer(unit, track, { forceTts = false } = {}) {
  if (!forceTts) {
    const blob = await getMedia(`${unit.id}/${track.id}`);
    const src = blob ? URL.createObjectURL(blob) : track.audio ? assetUrl(unit._base + track.audio) : null;
    if (src) {
      const ok = await canLoad(src);
      if (ok) return { player: new SyncPlayer({ src, segments: track.segments }), source: blob ? 'imported' : 'file' };
    }
  }
  if (TtsSyncPlayer.available()) return { player: new TtsSyncPlayer({ segments: track.segments, lang: unit.language.bcp47, voices: unit.voices }), source: 'tts' };
  return { player: null, source: 'none' };
}

function canLoad(src) {
  return new Promise((resolve) => {
    const a = new Audio();
    let settled = false;
    const done = (v) => { if (settled) return; settled = true; a.removeAttribute('src'); resolve(v); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => done(true);
    a.onerror = () => done(false);
    setTimeout(() => done(false), 6000);
    a.src = src;
  });
}
