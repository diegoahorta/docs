/**
 * ODU CREATIVE — Universal Language Learning Engine
 * Ponto de entrada: configurações, carregamento da unidade, contexto compartilhado e roteamento.
 *
 * Fluxo pedagógico: INPUT → INTAKE → OUTPUT → FEEDBACK → REVIEW
 */
import { h, $, clear, announce } from './core/dom.js';
import * as store from './core/store.js';
import { loadUnit, createTrackPlayer } from './core/unit-loader.js';
import { addXP, XP, touchStreak, updateXPPill, checkConsolidated } from './core/gamify.js';
import { enter } from './core/motion.js';
import { stopAll } from './core/speech.js';
import { scaleIntervals } from './core/srs.js';
import { allSkills } from './core/unit-loader.js';

export const ROUTES = [
  { path: 'home', stage: null, icon: '🏠', label: 'Início', load: () => import('./modules/home.js') },
  { path: 'quest', stage: 'INPUT', icon: '☕', label: 'Café Quest', load: () => import('./modules/quest.js'), module: 'quest' },
  { path: 'listening', stage: 'INPUT', icon: '🎧', label: 'Listening', load: () => import('./modules/listening.js'), module: 'listening' },
  { path: 'discover', stage: 'INTAKE', icon: '🔎', label: 'Discover the Pattern', load: () => import('./modules/discover.js'), module: 'discover' },
  { path: 'grammar', stage: 'INTAKE', icon: '🧪', label: 'Grammar Lab', load: () => import('./modules/grammar.js'), module: 'grammar' },
  { path: 'practice', stage: 'OUTPUT', icon: '🧩', label: 'Practice Zone', load: () => import('./modules/practice.js'), module: 'practice' },
  { path: 'speaking', stage: 'OUTPUT', icon: '🎤', label: 'Speaking Studio', load: () => import('./modules/speaking.js'), module: 'speaking' },
  { path: 'progress', stage: 'FEEDBACK', icon: '🏅', label: 'Progresso e medalhas', load: () => import('./modules/progress.js') },
  { path: 'review', stage: 'REVIEW', icon: '🔁', label: 'Revisão espaçada', load: () => import('./modules/review.js'), module: 'review' },
  { path: 'docs', stage: 'MATERIAIS', icon: '📄', label: 'Apostila (DOCX)', load: () => import('./modules/docs.js') },
  { path: 'teacher', stage: 'MATERIAIS', icon: '👩‍🏫', label: 'Painel do professor', load: () => import('./modules/teacher.js') },
];
const BOTTOM = ['home', 'quest', 'listening', 'practice', 'review'];

/* ---------------- Settings ---------------- */
let settings = store.getSettings();
export function applySettings(s = settings) {
  const root = document.documentElement;
  const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = s.theme === 'auto' && s.contrast ? (sysDark ? 'dark' : 'light') : s.theme;
  root.dataset.theme = theme;
  root.dataset.contrast = s.contrast ? 'high' : 'normal';
  root.dataset.motion = s.reducedMotion ? 'reduced' : 'full';
  root.style.setProperty('--text-scale', s.textSize || '1');
}

function setupSettingsDialog() {
  const dlg = $('#settings-dialog');
  const form = $('#settings-form');
  $('#btn-settings').addEventListener('click', () => {
    form.theme.value = settings.theme;
    form.contrast.checked = settings.contrast;
    form.reducedMotion.checked = settings.reducedMotion;
    form.captions.checked = settings.captions;
    form.textSize.value = settings.textSize;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
  form.addEventListener('change', () => {
    settings = { ...settings, theme: form.theme.value, contrast: form.contrast.checked, reducedMotion: form.reducedMotion.checked, captions: form.captions.checked, textSize: form.textSize.value };
    store.saveSettings(settings);
    applySettings();
  });
}

/* ---------------- Context ---------------- */
const ctx = {
  unit: null,
  progress: null,
  get settings() { return settings; },
  setSettings(patch) { settings = { ...settings, ...patch }; store.saveSettings(settings); applySettings(); },
  players: new Map(),
  save() { store.saveProgress(ctx.progress); updateXPPill(ctx.progress.xp); renderNav(); },
  intervals() { return scaleIntervals(ctx.unit.config?.srsIntervalsDays || [1, 2, 4, 7, 14], settings.srsFactor || 1); },
  /** Registra tentativa: XP só por acerto (mais no 1º acerto); SRS só na 1ª tentativa. */
  record(q, correct, attemptNo = 1, module = '') {
    const p = ctx.progress;
    if (attemptNo === 1) store.logAttempt(p, { qid: q.id, skills: q.skills || [], correct, firstTry: true, module }, { intervals: ctx.intervals() });
    else p.attempts.push({ qid: q.id, skills: q.skills || [], correct, firstTry: false, module, ts: Date.now() });
    if (correct) addXP(p, attemptNo === 1 ? XP.firstTry : XP.retry);
    touchStreak(p);
    checkConsolidated(p, allSkills(ctx.unit), { consolidateAfter: ctx.unit.config?.consolidateAfter });
    ctx.save();
  },
  setModule(key, ratio) { store.setModuleProgress(ctx.progress, key, ratio); ctx.save(); },
  async trackPlayer(trackId, opts = {}) {
    const key = trackId + (opts.forceTts ? ':tts' : '');
    if (!ctx.players.has(key)) {
      const track = ctx.unit.tracks.find((t) => t.id === trackId);
      ctx.players.set(key, createTrackPlayer(ctx.unit, track, opts));
    }
    return ctx.players.get(key);
  },
  disposePlayers() {
    for (const p of ctx.players.values()) p.then((r) => r.player?.destroy());
    ctx.players.clear();
    stopAll();
  },
  go(hash) { location.hash = hash; },
  async reloadUnit(id) {
    ctx.disposePlayers();
    ctx.unit = await loadUnit(id);
    store.setActiveUnitId(id);
    ctx.progress = store.getProgress(id);
    $('#header-unit').textContent = `${ctx.unit.language.name} · ${ctx.unit.level} · ${ctx.unit.title}`;
    updateXPPill(ctx.progress.xp);
    renderNav();
  },
};
globalThis.oduCtx = ctx; // útil para depuração no console

/* ---------------- Navigation ---------------- */
function currentPath() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  return { path: path || 'home', params: new URLSearchParams(query || '') };
}

function renderNav() {
  const { path } = currentPath();
  const list = $('#flow-list');
  clear(list);
  let stage = undefined;
  for (const r of ROUTES) {
    if (r.stage !== stage) { stage = r.stage; if (stage) list.append(h('li', { class: 'flow-stage', 'aria-hidden': 'true' }, stage)); }
    const pct = r.module && ctx.progress ? Math.round((ctx.progress.modules[r.module] || 0) * 100) : null;
    list.append(h('li', {}, h('a', { href: `#/${r.path}`, 'aria-current': r.path === path ? 'page' : null },
      h('span', { 'aria-hidden': 'true' }, r.icon), r.label,
      pct !== null ? h('span', { class: 'mini-bar small muted', title: `${pct}% concluído` }, `${pct}%`) : null)));
  }
  const bottom = $('#bottom-nav');
  clear(bottom);
  for (const p of BOTTOM) {
    const r = ROUTES.find((x) => x.path === p);
    bottom.append(h('a', { href: `#/${r.path}`, 'aria-current': r.path === path ? 'page' : null }, h('span', { 'aria-hidden': 'true' }, r.icon), r.label.split(' ')[0]));
  }
}

let renderToken = 0;
async function route() {
  const token = ++renderToken;
  const { path, params } = currentPath();
  const r = ROUTES.find((x) => x.path === path) || ROUTES[0];
  ctx.disposePlayers();
  const main = $('#main');
  try {
    const mod = await r.load();
    if (token !== renderToken) return;
    const view = await mod.render(ctx, params);
    if (token !== renderToken) return;
    clear(main).append(view);
    document.title = `${r.label} — ODU CREATIVE`;
    renderNav();
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    enter(view);
    announce(`${r.label} carregado`);
  } catch (err) {
    console.error(err);
    clear(main).append(h('div', { class: 'card' }, h('h2', {}, 'Algo deu errado'), h('p', {}, String(err.message || err))));
  }
}

/* ---------------- Boot ---------------- */
async function boot() {
  applySettings();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applySettings());
  setupSettingsDialog();
  const params = new URLSearchParams(location.search);
  const unitId = params.get('unit') || store.getActiveUnitId('en-a1-cafe');
  try {
    await ctx.reloadUnit(unitId);
  } catch (e) {
    console.warn(e);
    await ctx.reloadUnit('en-a1-cafe');
  }
  touchStreak(ctx.progress);
  ctx.save();
  if (!store.storageAvailable) announce('Armazenamento local indisponível: o progresso não será salvo.');
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !globalThis.__ODU_EMBED__) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.info('SW não registrado:', e.message));
  }
}

boot();
