// Comemoração "supernova": flash, estrelas em hiperespaço, anéis hexagonais, raios, faíscas,
// texto gigante com aberração cromática, frase motivacional digitada e pontos subindo.
import { sfxCelebrate, speak, duck, unduck } from './audio.js';

const cv = document.getElementById('fx');
const g = cv.getContext('2d');
let W = 0, H = 0;
function resize() {
  const d = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * d; cv.height = H * d;
  g.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener('resize', resize);
resize();

const COLS = ['#4de8e0', '#ffd84d', '#ff5fa2', '#7c8cff', '#ffffff', '#ff9a3d', '#9dff6b'];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const parts = [];
const rings = [];
const bolts = [];
let streaks = [];
let show = null;
let flash = 0;
let shake = 0;
const stage = document.getElementById('stage');

function burst(x, y, n, p = 1) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(3, 15) * p;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: rnd(0, 6), vr: rnd(-0.3, 0.3), size: rnd(6, 20),
      kind: pick(['star', 'star', 'hex', 'spark', 'spark', 'ring', 'glitch']), c: pick(COLS), life: rnd(1.2, 2.4), t: 0 });
  }
  rings.push({ x, y, max: 320 * p, t: 0, c: pick(COLS), hex: true });
  rings.push({ x, y, max: 200 * p, t: -0.1, c: '#ffffff' });
}
function bolt(x1, y1, x2, y2) {
  const pts = [[x1, y1]];
  const n = 10;
  for (let i = 1; i < n; i++) {
    const k = i / n;
    pts.push([x1 + (x2 - x1) * k + rnd(-30, 30), y1 + (y2 - y1) * k + rnd(-30, 30)]);
  }
  pts.push([x2, y2]);
  bolts.push({ pts, t: 0, c: pick(['#bff7ff', '#ffe98a', '#e5b3ff']) });
}
function poly(r, n) {
  g.beginPath();
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.closePath();
}
function star(r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? r * 0.42 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath();
}
const elastic = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1);

function drawBack(t, fade) {
  const cx = W / 2, cy = H * 0.4;
  // estrelas em hiperespaço saindo do centro
  g.save();
  g.globalAlpha = 0.9 * fade;
  for (const s of streaks) {
    s.d += s.v * (1 + t * 2);
    const x1 = cx + Math.cos(s.a) * s.d, y1 = cy + Math.sin(s.a) * s.d;
    const x2 = cx + Math.cos(s.a) * (s.d + s.v * 6), y2 = cy + Math.sin(s.a) * (s.d + s.v * 6);
    g.strokeStyle = s.c; g.lineWidth = s.w;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    if (s.d > Math.max(W, H)) s.d = rnd(10, 60);
  }
  g.restore();
  // brilho central
  const R = Math.min(W, H) * 0.55;
  const rg = g.createRadialGradient(cx, cy, 0, cx, cy, R);
  rg.addColorStop(0, `rgba(160,240,255,${0.55 * fade})`);
  rg.addColorStop(0.5, `rgba(120,80,255,${0.25 * fade})`);
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, W, H);
  // anéis concêntricos girando (painel de controle)
  g.save();
  g.translate(cx, cy);
  for (let k = 0; k < 3; k++) {
    g.save();
    g.rotate(t * (k % 2 ? -0.8 : 0.6));
    g.globalAlpha = 0.35 * fade;
    g.strokeStyle = k === 1 ? '#ffd84d' : '#4de8e0';
    g.lineWidth = 3;
    g.setLineDash([18, 12]);
    g.beginPath(); g.arc(0, 0, 120 + k * 70 + Math.sin(t * 3 + k) * 8, 0, Math.PI * 2); g.stroke();
    g.restore();
  }
  g.restore();
}

function chroma(text, x, y, fs, t) {
  g.font = `900 ${fs}px "Orbitron", "Exo 2", system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const o = 4 + Math.sin(t * 20) * 3;
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = 'rgba(255,40,90,.85)'; g.fillText(text, x - o, y);
  g.fillStyle = 'rgba(40,220,255,.85)'; g.fillText(text, x + o, y);
  g.globalCompositeOperation = 'source-over';
  g.lineWidth = fs * 0.08;
  g.strokeStyle = '#0a0630';
  g.strokeText(text, x, y);
  const lg = g.createLinearGradient(0, y - fs / 2, 0, y + fs / 2);
  lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.5, '#ffe98a'); lg.addColorStop(1, '#ff9a3d');
  g.fillStyle = lg;
  g.fillText(text, x, y);
}

function wrapLines(text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const tryL = cur ? cur + ' ' + w : w;
    if (g.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryL;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawFront(t, fade) {
  const cx = W / 2, cy = H * 0.34;
  // palavra gigante
  const sc = elastic(Math.min(1, t / 0.8));
  const fs = Math.min(W / (show.word.length * 0.78), show.big ? 120 : 100);
  g.save();
  g.globalAlpha = fade;
  g.translate(cx, cy);
  g.scale(sc, sc);
  g.rotate(Math.sin(t * 2.5) * 0.03);
  // glitch: às vezes desloca uma faixa
  chroma(show.word, 0, 0, fs, t);
  g.restore();
  // frase motivacional digitada
  const typed = Math.max(0, Math.floor((t - 0.5) * 40));
  const msg = show.msg.slice(0, typed);
  const mfs = Math.max(18, Math.min(34, W / 26));
  g.save();
  g.globalAlpha = fade;
  g.font = `700 ${mfs}px "Exo 2", system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = wrapLines(msg, W - 40);
  let y = cy + fs * 0.75 + 10;
  for (const ln of lines) {
    g.lineWidth = 6; g.strokeStyle = '#0a0630'; g.strokeText(ln, cx, y);
    g.fillStyle = '#bff7ff'; g.fillText(ln, cx, y);
    y += mfs * 1.25;
  }
  if (typed >= show.msg.length && show.pt) {
    g.font = `600 ${mfs * 0.6}px "Exo 2", system-ui, sans-serif`;
    g.fillStyle = 'rgba(255,255,255,.8)';
    g.fillText(show.pt, cx, y);
    y += mfs;
  }
  // frase do aluno
  if (show.sentence && t > 0.9) {
    g.font = `800 ${mfs * 0.8}px "Exo 2", system-ui, sans-serif`;
    g.fillStyle = '#ffd84d';
    g.lineWidth = 5; g.strokeStyle = '#0a0630';
    const s = '“' + show.sentence + '”';
    for (const ln of wrapLines(s, W - 40)) { g.strokeText(ln, cx, y + 8); g.fillText(ln, cx, y + 8); y += mfs; }
  }
  // pontos
  if (show.points && t > 1.0) {
    const k = Math.min(1, (t - 1.0) / 0.9);
    const v = Math.round(show.points * (1 - Math.pow(1 - k, 3)));
    const pfs = Math.min(64, W / 11);
    g.font = `900 ${pfs}px "Orbitron", system-ui, sans-serif`;
    g.lineWidth = 8; g.strokeStyle = '#0a0630';
    g.strokeText(`+${v}`, cx, y + pfs * 0.8);
    g.fillStyle = '#9dff6b';
    g.fillText(`+${v}`, cx, y + pfs * 0.8);
    if (show.sub) {
      g.font = `700 ${pfs * 0.32}px "Exo 2", system-ui, sans-serif`;
      g.fillStyle = '#ffffff';
      g.fillText(show.sub, cx, y + pfs * 1.5);
    }
  }
  g.restore();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  g.clearRect(0, 0, W, H);
  const t = show ? (now - show.start) / 1000 : 0;
  const fade = show ? (t > show.dur - 0.5 ? Math.max(0, (show.dur - t) / 0.5) : 1) : 0;
  if (show) drawBack(t, fade);
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.t += dt;
    if (r.t < 0) continue;
    const k = r.t / 0.8;
    g.save();
    g.globalAlpha = Math.max(0, 1 - k);
    g.strokeStyle = r.c;
    g.lineWidth = 14 * (1 - k) + 2;
    g.translate(r.x, r.y);
    g.rotate(r.t);
    if (r.hex) poly(r.max * (1 - Math.pow(1 - Math.min(1, k), 3)), 6); else { g.beginPath(); g.arc(0, 0, r.max * Math.min(1, k * 1.3), 0, Math.PI * 2); }
    g.stroke();
    g.restore();
    if (k >= 1) rings.splice(i, 1);
  }
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i];
    b.t += dt;
    g.save();
    g.globalAlpha = Math.max(0, 1 - b.t / 0.35);
    g.strokeStyle = b.c; g.lineWidth = 3; g.shadowColor = b.c; g.shadowBlur = 16;
    g.beginPath(); b.pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.restore();
    if (b.t > 0.35) bolts.splice(i, 1);
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += dt; p.vx *= 0.985; p.vy = p.vy * 0.985 + 6 * dt; p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.rot += p.vr;
    g.save();
    g.translate(p.x, p.y); g.rotate(p.rot);
    g.globalAlpha = Math.max(0, Math.min(1, (p.life - p.t) * 2));
    g.fillStyle = p.c; g.strokeStyle = p.c;
    if (p.kind === 'star') { star(p.size * 0.6); g.fill(); }
    else if (p.kind === 'hex') { poly(p.size * 0.5, 6); g.lineWidth = 2; g.stroke(); }
    else if (p.kind === 'ring') { g.beginPath(); g.arc(0, 0, p.size * 0.4, 0, Math.PI * 2); g.lineWidth = 2; g.stroke(); }
    else if (p.kind === 'glitch') { g.fillRect(-p.size, -2, p.size * 2, 4); }
    else { g.shadowColor = p.c; g.shadowBlur = 10; g.fillRect(-p.size * 0.5, -1.5, p.size, 3); }
    g.restore();
    if (p.t > p.life) parts.splice(i, 1);
  }
  if (show) {
    drawFront(t, fade);
    // faixas de "glitch" ocasionais
    if (Math.random() < 0.08 && t < show.dur - 0.5) {
      const y = rnd(0, H), h = rnd(4, 30);
      try { g.drawImage(cv, 0, y * (cv.width / W), cv.width, h * (cv.width / W), rnd(-30, 30), y, W, h); } catch (e) { /* ok */ }
    }
    if (t >= show.dur) { show = null; streaks = []; unduck(); }
  }
  if (flash > 0) { g.fillStyle = `rgba(220,250,255,${flash})`; g.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 2.5); }
  if (shake > 0) {
    shake = Math.max(0, shake - dt * 1.5);
    const m = shake * 20;
    stage.style.transform = `translate(${rnd(-m, m)}px,${rnd(-m, m)}px)`;
  } else if (stage.style.transform) stage.style.transform = '';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

export const isCelebrating = () => !!show;

export function celebrate({ word, msg, pt, sentence, points, sub, big = false }) {
  const dur = big ? 5 : 4;
  show = { word, msg, pt, sentence, points, sub, big, start: performance.now(), dur };
  streaks = Array.from({ length: 160 }, () => ({ a: rnd(0, Math.PI * 2), d: rnd(10, 400), v: rnd(4, 14), w: rnd(1, 3), c: pick(COLS) }));
  flash = 1;
  shake = big ? 1.3 : 0.9;
  duck(0.15, 700);
  sfxCelebrate(big);
  const cx = W / 2, cy = H * 0.34;
  burst(cx, cy, big ? 240 : 170, big ? 1.5 : 1.2);
  const n = big ? 12 : 7;
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const x = rnd(W * 0.1, W * 0.9), y = rnd(H * 0.1, H * 0.7);
      burst(x, y, 70, 0.9);
      bolt(cx, cy, x, y);
      shake = Math.max(shake, 0.4);
    }, 200 + i * 260);
  }
  setTimeout(() => speak(`${word.replace('!', '')}! ${msg}`, { rate: 0.95 }), 300);
  if (sentence) setTimeout(() => speak(sentence, { rate: 0.88, interrupt: false }), 400);
  return dur;
}

export function spark(x, y, color) {
  for (let i = 0; i < 24; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(2, 7);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: 0, vr: 0.2, size: rnd(6, 12), kind: pick(['spark', 'star']), c: color, life: rnd(0.4, 0.8), t: 0 });
  }
}
export function jolt(a = 0.4) { shake = Math.max(shake, a); }
