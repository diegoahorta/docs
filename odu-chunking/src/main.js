import { gsap } from 'gsap';
import { reducedMotion } from './core/theme.js';
import { stopSpeech } from './core/speech.js';
import { store } from './core/store.js';

// Cada tela é carregada sob demanda: Phaser e Three.js só baixam quando usados.
const ROUTES = {
  inicio: () => import('./views/inicio.js'),
  aulas: () => import('./views/aula.js'),
  aula: () => import('./views/aula.js'),
  memorizar: () => import('./views/memorizar.js'),
  construir: () => import('./views/construir.js'),
  mapa: () => import('./views/mapa.js'),
  lexico: () => import('./views/lexico.js'),
};

const view = document.getElementById('view');
let cleanup = null;
let token = 0;

/** Hash simples: #aula-l02 → { name: 'aula', arg: 'l02' } */
function parseHash() {
  const raw = location.hash.replace(/^#/, '') || 'inicio';
  const [name, arg] = raw.split(/-(.+)/);
  return ROUTES[name] ? { name, arg } : { name: 'inicio' };
}

async function render() {
  const { name, arg } = parseHash();
  const mine = ++token;
  stopSpeech();
  cleanup?.();
  cleanup = null;

  document.querySelectorAll('.nav a').forEach((a) => {
    const target = a.getAttribute('href').slice(1);
    const active = target === name || (name === 'aula' && target === 'aulas');
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  const mod = await ROUTES[name]();
  if (mine !== token) return;
  view.replaceChildren();
  const root = document.createElement('div');
  root.className = 'view';
  view.append(root);
  cleanup = (await mod.mount(root, arg)) ?? null;
  window.scrollTo({ top: 0 });
  if (!reducedMotion()) gsap.from(root, { y: 12, opacity: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' });
}

window.addEventListener('hashchange', render);
store.init().finally(render);

// Alternância de tema: sistema → claro → escuro.
const THEMES = ['sistema', 'claro', 'escuro'];
const themeBtn = document.getElementById('theme-toggle');
// "sistema" devolve o atributo original (quando a página é aberta dentro de outro app).
const hostTheme = document.documentElement.getAttribute('data-theme');
function applyTheme(t) {
  const attr = { claro: 'light', escuro: 'dark' }[t] ?? hostTheme;
  if (attr) document.documentElement.setAttribute('data-theme', attr);
  else document.documentElement.removeAttribute('data-theme');
  themeBtn.textContent = `Tema: ${t}`;
}
let theme = 'sistema';
try {
  theme = localStorage.getItem('odu-blocos:tema') ?? 'sistema';
} catch {
  /* sem armazenamento */
}
applyTheme(theme);
themeBtn.addEventListener('click', () => {
  theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  applyTheme(theme);
  try {
    localStorage.setItem('odu-blocos:tema', theme);
  } catch {
    /* sem armazenamento */
  }
});
