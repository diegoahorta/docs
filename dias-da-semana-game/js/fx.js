// Explosão de comemoração estilo "jogo de doces": doces, estrelas, confete, raios de luz,
// ondas de choque, texto gigante elástico, tremor de tela e placar subindo.
import { CATS } from './levels.js';
import {
  announce, sfxBoom, sfxCheer, sfxFanfare, sfxPop, sfxSparkle, sfxWhoosh, speak, duckMusic, unduckMusic,
} from './audio.js';

const cv = document.getElementById('fx');
const g = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  cv.width = W * DPR;
  cv.height = H * DPR;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const CANDY = ['#ff3d7f', '#ffcf1f', '#2fd3ff', '#7cff4f', '#b06bff', '#ff8a1f', '#ffffff', '#ff5ad1'];
const parts = [];
const rings = [];
let show = null; // estado do texto grande
let flash = 0;
let shake = 0;
let raysA = 0;
const shakeEl = document.getElementById('stage');

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function burst(x, y, n = 120, power = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rnd(4, 17) * power;
    parts.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - rnd(2, 6),
      rot: rnd(0, 6.28),
      vr: rnd(-0.3, 0.3),
      size: rnd(10, 26) * (power > 1.2 ? 1.2 : 1),
      kind: pick(['wrap', 'wrap', 'lolly', 'star', 'star', 'bean', 'conf', 'conf', 'conf', 'bubble', 'heart']),
      c: pick(CANDY),
      c2: pick(CANDY),
      life: rnd(1.6, 2.8),
      t: 0,
    });
  }
  rings.push({ x, y, r: 10, max: 260 * power, t: 0, c: pick(CANDY) });
  rings.push({ x, y, r: 4, max: 180 * power, t: -0.08, c: '#ffffff' });
}

function rocket(delay) {
  setTimeout(() => {
    const x = rnd(W * 0.15, W * 0.85);
    const y = rnd(H * 0.15, H * 0.5);
    burst(x, y, 90, 1.1);
    sfxPop(0, rnd(0.6, 1.6));
    sfxBoom(0, 0.35);
    sfxSparkle(4, 0.05, 0.4);
  }, delay);
}

function drawStar(r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
}

function drawPart(p) {
  const s = p.size;
  g.save();
  g.translate(p.x, p.y);
  g.rotate(p.rot);
  g.globalAlpha = Math.max(0, Math.min(1, (p.life - p.t) * 2));
  switch (p.kind) {
    case 'wrap': {
      g.fillStyle = p.c;
      g.beginPath();
      g.moveTo(-s * 0.5, 0); g.lineTo(-s * 0.95, -s * 0.35); g.lineTo(-s * 0.95, s * 0.35); g.closePath();
      g.moveTo(s * 0.5, 0); g.lineTo(s * 0.95, -s * 0.35); g.lineTo(s * 0.95, s * 0.35); g.closePath();
      g.fill();
      g.beginPath(); g.ellipse(0, 0, s * 0.55, s * 0.38, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = p.c2; g.lineWidth = s * 0.12;
      g.beginPath(); g.moveTo(-s * 0.2, -s * 0.35); g.lineTo(s * 0.05, s * 0.35); g.stroke();
      g.beginPath(); g.moveTo(s * 0.15, -s * 0.35); g.lineTo(s * 0.38, s * 0.3); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.6)';
      g.beginPath(); g.ellipse(-s * 0.15, -s * 0.15, s * 0.15, s * 0.08, -0.4, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'lolly': {
      g.fillStyle = p.c; g.beginPath(); g.arc(0, 0, s * 0.55, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = s * 0.1; g.beginPath();
      for (let a = 0; a < 12; a += 0.3) g.lineTo(Math.cos(a) * a * s * 0.045, Math.sin(a) * a * s * 0.045);
      g.stroke();
      break;
    }
    case 'star': {
      g.fillStyle = p.c === '#ffffff' ? '#ffe14d' : p.c; drawStar(s * 0.6); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.stroke();
      break;
    }
    case 'bean': {
      g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, s * 0.5, s * 0.28, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-s * 0.15, -s * 0.1, s * 0.18, s * 0.07, 0, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'heart': {
      g.fillStyle = p.c; g.beginPath();
      g.moveTo(0, s * 0.35);
      g.bezierCurveTo(-s * 0.7, -s * 0.15, -s * 0.3, -s * 0.6, 0, -s * 0.25);
      g.bezierCurveTo(s * 0.3, -s * 0.6, s * 0.7, -s * 0.15, 0, s * 0.35);
      g.fill();
      break;
    }
    case 'bubble': {
      g.strokeStyle = 'rgba(200,245,255,.9)'; g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, s * 0.45, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(-s * 0.15, -s * 0.15, s * 0.1, 0, Math.PI * 2); g.fill();
      break;
    }
    default: {
      g.fillStyle = p.c; g.fillRect(-s * 0.35, -s * 0.15, s * 0.7, s * 0.3);
    }
  }
  g.restore();
}

function roundRect(x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const elastic = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);

function drawShow(dt) {
  if (!show) return;
  show.t = (performance.now() - show.start) / 1000; // relógio real: dura o mesmo em qualquer FPS
  const t = show.t;
  const end = show.dur;
  const fade = t > end - 0.5 ? Math.max(0, (end - t) / 0.5) : 1;
  const cx = W / 2;
  const cy = H * 0.38;
  // raios de luz girando
  raysA += dt * 0.8;
  g.save();
  g.globalAlpha = 0.45 * fade * Math.min(1, t * 3);
  g.translate(cx, cy);
  g.rotate(raysA);
  const R = Math.max(W, H);
  for (let i = 0; i < 16; i++) {
    g.fillStyle = i % 2 ? 'rgba(255,240,150,.9)' : 'rgba(255,120,200,.7)';
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, R, (i / 16) * Math.PI * 2, ((i + 0.5) / 16) * Math.PI * 2);
    g.closePath();
    g.fill();
  }
  g.restore();
  // brilho central
  const rg = g.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.45);
  rg.addColorStop(0, `rgba(255,255,220,${0.75 * fade})`);
  rg.addColorStop(1, 'rgba(255,255,220,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, W, H);
}

function drawShowFront() {
  if (!show) return;
  const t = show.t;
  const end = show.dur;
  const fade = t > end - 0.5 ? Math.max(0, (end - t) / 0.5) : 1;
  const cx = W / 2;
  const cy = H * 0.38;
  // palavra gigante
  const sc = elastic(Math.min(1, t / 0.9)) * (1 + Math.sin(t * 6) * 0.03);
  const fs = Math.min(W / (show.word.length * 0.62), show.big ? 150 : 120);
  g.save();
  g.translate(cx, cy);
  g.rotate(Math.sin(t * 3) * 0.05);
  g.scale(sc, sc);
  g.globalAlpha = fade;
  g.font = `900 ${fs}px "Baloo 2", "Fredoka", "Arial Rounded MT Bold", system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.shadowColor = 'rgba(60,0,90,.6)';
  g.shadowOffsetY = 10;
  g.shadowBlur = 0;
  g.lineWidth = fs * 0.22;
  g.strokeStyle = '#5b1e8f';
  g.strokeText(show.word, 0, 0);
  g.shadowColor = 'transparent';
  g.lineWidth = fs * 0.1;
  g.strokeStyle = '#ffffff';
  g.strokeText(show.word, 0, 0);
  const lg = g.createLinearGradient(0, -fs / 2, 0, fs / 2);
  lg.addColorStop(0, '#fff7a8');
  lg.addColorStop(0.45, '#ffcf1f');
  lg.addColorStop(1, '#ff6a00');
  g.fillStyle = lg;
  g.fillText(show.word, 0, 0);
  g.restore();

  // frase em blocos coloridos, entrando um por um
  if (show.chunks && show.chunks.length) {
    const cfs = Math.max(16, Math.min(34, W / 28));
    g.font = `800 ${cfs}px "Baloo 2", "Fredoka", system-ui, sans-serif`;
    const pad = cfs * 0.55;
    const ws = show.chunks.map((c) => g.measureText(c.t).width + pad * 2);
    const gap = 8;
    let total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
    let scale = total > W - 24 ? (W - 24) / total : 1;
    let x = cx - (total * scale) / 2;
    const y = cy + fs * 0.75 + 20;
    show.chunks.forEach((c, i) => {
      const ct = t - 0.5 - i * 0.18;
      if (ct < 0) return;
      const s2 = elastic(Math.min(1, ct / 0.6)) * scale;
      const w = ws[i];
      g.save();
      g.globalAlpha = fade;
      g.translate(x + (w * scale) / 2, y);
      g.scale(s2, s2);
      const cat = CATS[c.c] || CATS.day;
      g.fillStyle = cat.dark;
      roundRect(-w / 2, -cfs * 0.75 + 5, w, cfs * 1.5, cfs * 0.5);
      g.fill();
      g.fillStyle = cat.color;
      roundRect(-w / 2, -cfs * 0.75, w, cfs * 1.5, cfs * 0.5);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,.9)';
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = '#fff';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(c.t, 0, 1);
      g.restore();
      x += (w + gap) * scale;
    });
  }
  // pontos subindo
  if (show.points) {
    const pt = Math.max(0, Math.min(1, (t - 0.9) / 1.0));
    const val = Math.round(show.points * (1 - Math.pow(1 - pt, 3)));
    if (t > 0.9) {
      const pfs = Math.min(64, W / 12);
      g.save();
      g.globalAlpha = fade;
      g.font = `900 ${pfs}px "Baloo 2", system-ui, sans-serif`;
      g.textAlign = 'center';
      g.lineWidth = 10;
      g.strokeStyle = '#0b3b66';
      const yy = cy + fs * 0.75 + 20 + Math.max(40, Math.min(70, W / 14)) + pfs * 0.4;
      g.strokeText(`+${val.toLocaleString('pt-BR')}`, cx, yy);
      g.fillStyle = '#7cff4f';
      g.fillText(`+${val.toLocaleString('pt-BR')}`, cx, yy);
      if (show.sub) {
        g.font = `800 ${pfs * 0.42}px "Baloo 2", system-ui, sans-serif`;
        g.lineWidth = 6;
        g.strokeText(show.sub, cx, yy + pfs * 0.75);
        g.fillStyle = '#fff';
        g.fillText(show.sub, cx, yy + pfs * 0.75);
      }
      g.restore();
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  g.clearRect(0, 0, W, H);
  const active = show || parts.length || rings.length || flash > 0;
  if (active) {
    drawShow(dt);
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt;
      if (r.t < 0) continue;
      const k = r.t / 0.7;
      r.r = r.max * (1 - Math.pow(1 - Math.min(1, k), 3));
      g.save();
      g.globalAlpha = Math.max(0, 1 - k);
      g.strokeStyle = r.c;
      g.lineWidth = 18 * (1 - k) + 2;
      g.beginPath();
      g.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      g.stroke();
      g.restore();
      if (k >= 1) rings.splice(i, 1);
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      p.vy += 22 * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.rot += p.vr;
      drawPart(p);
      if (p.t > p.life || p.y > H + 60) parts.splice(i, 1);
    }
    drawShowFront();
    if (show && show.t >= show.dur) {
      show = null;
      unduckMusic();
    }
    if (flash > 0) {
      g.fillStyle = `rgba(255,255,255,${flash})`;
      g.fillRect(0, 0, W, H);
      flash = Math.max(0, flash - dt * 2.5);
    }
  }
  if (shake > 0) {
    shake = Math.max(0, shake - dt * 1.6);
    const m = shake * 22;
    shakeEl.style.transform = `translate(${rnd(-m, m)}px, ${rnd(-m, m)}px) rotate(${rnd(-m, m) * 0.05}deg)`;
  } else if (shakeEl.style.transform) shakeEl.style.transform = '';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

export const isCelebrating = () => !!show;

/** Comemoração de frase concluída. */
export function celebrate({ word, chunks, points, sub, big = false, sentence = null }) {
  const dur = big ? 4.6 : 3.4;
  show = { word, chunks, points, sub, big, t: 0, dur, start: performance.now() };
  flash = 0.9;
  shake = big ? 1.2 : 0.8;
  duckMusic(0.2, 700);
  // explosões em cascata
  const cx = W / 2, cy = H * 0.38;
  burst(cx, cy, big ? 260 : 180, big ? 1.6 : 1.3);
  sfxBoom(0, 1);
  sfxWhoosh(0, 0.5);
  sfxFanfare(0.05, big);
  sfxCheer(0.25, big ? 3.2 : 2.3, big ? 0.5 : 0.38);
  sfxSparkle(big ? 30 : 18, 0.1, dur * 0.7);
  const n = big ? 12 : 6;
  for (let i = 0; i < n; i++) rocket(250 + i * (big ? 260 : 220));
  for (let i = 0; i < (big ? 24 : 12); i++) sfxPop(0.15 + i * 0.09, rnd(0.6, 2));
  announce(word);
  if (sentence) setTimeout(() => speak(sentence, { rate: 0.85 }), 1300);
  return dur;
}

/** Explosãozinha (acerto de bloco) numa posição da tela. */
export function miniBurst(x, y, color) {
  for (let i = 0; i < 28; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rnd(2, 8);
    parts.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, rot: rnd(0, 6), vr: rnd(-0.3, 0.3),
      size: rnd(8, 16), kind: pick(['star', 'conf', 'bubble', 'bean']), c: color || pick(CANDY), c2: '#fff', life: rnd(0.6, 1.1), t: 0,
    });
  }
  rings.push({ x, y, r: 4, max: 70, t: 0, c: color || '#fff' });
}

export function screenShake(a = 0.4) {
  shake = Math.max(shake, a);
}
