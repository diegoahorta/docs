// Comemoração "parisiense": flash, chuva de corações, macarons, croissants, torres Eiffel, estrelas
// e confete azul-branco-vermelho, explosões em cascata, texto gigante e a frase motivacional em francês.
import { sfxCelebrate, speak, duck, unduck } from './audio.js';

const cv = document.getElementById('fx');
const g = cv.getContext('2d');
let W = 0, H = 0;
function resize() {
  const d = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * d; cv.height = H * d;
  g.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener('resize', resize);
resize();

const COLS = ['#ff5f9e', '#ffd1e3', '#e8454f', '#3d7bea', '#ffffff', '#ffd84d', '#9de0c8', '#c9a0ff'];
const FLAG = ['#2b4fd8', '#ffffff', '#e8454f'];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const parts = [];
const rings = [];
let show = null, flash = 0, shake = 0;
const stage = document.getElementById('stage');

function burst(x, y, n, p = 1) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(3, 15) * p;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - rnd(1, 5), rot: rnd(0, 6), vr: rnd(-0.25, 0.25), size: rnd(12, 28),
      kind: pick(['heart', 'heart', 'macaron', 'macaron', 'croissant', 'tower', 'star', 'conf', 'conf', 'conf']),
      c: pick(COLS), f: pick(FLAG), life: rnd(1.6, 2.8), t: 0 });
  }
  rings.push({ x, y, max: 280 * p, t: 0, c: pick(COLS) });
  rings.push({ x, y, max: 180 * p, t: -0.08, c: '#ffffff' });
}

function heart(s) {
  g.beginPath();
  g.moveTo(0, s * 0.35);
  g.bezierCurveTo(-s * 0.75, -s * 0.15, -s * 0.3, -s * 0.65, 0, -s * 0.25);
  g.bezierCurveTo(s * 0.3, -s * 0.65, s * 0.75, -s * 0.15, 0, s * 0.35);
  g.fill();
}
function drawPart(p) {
  const s = p.size;
  g.save();
  g.translate(p.x, p.y); g.rotate(p.rot);
  g.globalAlpha = Math.max(0, Math.min(1, (p.life - p.t) * 2));
  if (p.kind === 'heart') { g.fillStyle = p.c === '#ffffff' ? '#ff5f9e' : p.c; heart(s); }
  else if (p.kind === 'macaron') {
    g.fillStyle = p.c; g.beginPath(); g.ellipse(0, -s * 0.17, s * 0.42, s * 0.16, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(0, s * 0.17, s * 0.42, s * 0.16, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff6ea'; g.fillRect(-s * 0.38, -s * 0.06, s * 0.76, s * 0.12);
  } else if (p.kind === 'croissant') {
    g.strokeStyle = '#d99a3e'; g.lineWidth = s * 0.28; g.lineCap = 'round';
    g.beginPath(); g.arc(0, s * 0.2, s * 0.38, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.strokeStyle = '#a8681d'; g.lineWidth = 2;
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * s * 0.15, -s * 0.28); g.lineTo(k * s * 0.18, -s * 0.05); g.stroke(); }
  } else if (p.kind === 'tower') {
    g.fillStyle = '#8a6a52';
    g.beginPath(); g.moveTo(0, -s * 0.6); g.lineTo(s * 0.32, s * 0.5); g.lineTo(s * 0.14, s * 0.5); g.lineTo(0, s * 0.15); g.lineTo(-s * 0.14, s * 0.5); g.lineTo(-s * 0.32, s * 0.5); g.closePath(); g.fill();
    g.fillRect(-s * 0.2, -s * 0.05, s * 0.4, s * 0.06);
  } else if (p.kind === 'star') {
    g.fillStyle = '#ffd84d'; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? s * 0.22 : s * 0.5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.fill();
  } else { g.fillStyle = p.f; g.fillRect(-s * 0.3, -s * 0.12, s * 0.6, s * 0.24); }
  g.restore();
}

const elastic = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1);
function wrap(text, maxW) {
  const out = []; let cur = '';
  for (const w of text.split(' ')) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur);
  return out;
}

function drawShow(t, fade) {
  const cx = W / 2, cy = H * 0.33;
  // fundo: raios rosa e dourado girando + brilho
  g.save();
  g.globalAlpha = 0.4 * fade;
  g.translate(cx, cy); g.rotate(t * 0.4);
  const R = Math.max(W, H);
  for (let i = 0; i < 18; i++) {
    g.fillStyle = i % 2 ? '#ffd1e3' : '#fff2c4';
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, (i / 18) * Math.PI * 2, ((i + 0.5) / 18) * Math.PI * 2); g.closePath(); g.fill();
  }
  g.restore();
  const rg = g.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.5);
  rg.addColorStop(0, `rgba(255,255,255,${0.75 * fade})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
}
function drawText(t, fade) {
  const cx = W / 2, cy = H * 0.33;
  const sc = elastic(Math.min(1, t / 0.85)) * (1 + Math.sin(t * 5) * 0.025);
  const fs = Math.min(W / (show.word.length * 0.6), show.big ? 130 : 110);
  g.save();
  g.globalAlpha = fade;
  g.translate(cx, cy); g.rotate(Math.sin(t * 2.5) * 0.04); g.scale(sc, sc);
  g.font = `italic 700 ${fs}px "Playfair Display", Georgia, serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = fs * 0.2; g.strokeStyle = '#7a1e46'; g.strokeText(show.word, 0, 4);
  g.lineWidth = fs * 0.09; g.strokeStyle = '#ffffff'; g.strokeText(show.word, 0, 0);
  const lg = g.createLinearGradient(0, -fs / 2, 0, fs / 2);
  lg.addColorStop(0, '#ff9cc4'); lg.addColorStop(0.5, '#ff4f8b'); lg.addColorStop(1, '#e8454f');
  g.fillStyle = lg; g.fillText(show.word, 0, 0);
  g.restore();
  // frase motivacional em francês (escrita aos poucos) + tradução
  const typed = Math.max(0, Math.floor((t - 0.5) * 38));
  const mfs = Math.max(18, Math.min(34, W / 24));
  g.save();
  g.globalAlpha = fade;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `italic 600 ${mfs}px "Playfair Display", Georgia, serif`;
  let y = cy + fs * 0.75 + 6;
  for (const ln of wrap(show.msg.slice(0, typed), W - 40)) {
    g.lineWidth = 6; g.strokeStyle = '#ffffff'; g.strokeText(ln, cx, y);
    g.fillStyle = '#7a1e46'; g.fillText(ln, cx, y);
    y += mfs * 1.25;
  }
  if (typed >= show.msg.length) {
    g.font = `600 ${mfs * 0.58}px "Quicksand", system-ui, sans-serif`;
    g.lineWidth = 4; g.strokeStyle = '#ffffff'; g.strokeText(show.pt, cx, y);
    g.fillStyle = '#b0305f'; g.fillText(show.pt, cx, y);
    y += mfs;
  }
  if (show.sentence && t > 0.9) {
    g.font = `700 ${mfs * 0.82}px "Quicksand", system-ui, sans-serif`;
    for (const ln of wrap('« ' + show.sentence + ' »', W - 40)) {
      g.lineWidth = 6; g.strokeStyle = '#ffffff'; g.strokeText(ln, cx, y + 6);
      g.fillStyle = '#2b4fd8'; g.fillText(ln, cx, y + 6);
      y += mfs;
    }
  }
  if (show.points && t > 1.0) {
    const k = Math.min(1, (t - 1.0) / 0.9);
    const v = Math.round(show.points * (1 - Math.pow(1 - k, 3)));
    const pfs = Math.min(60, W / 11);
    g.font = `800 ${pfs}px "Quicksand", system-ui, sans-serif`;
    g.lineWidth = 8; g.strokeStyle = '#ffffff';
    const txt = `+${v.toLocaleString('pt-BR')} ❤`;
    g.strokeText(txt, cx, y + pfs * 0.8);
    g.fillStyle = '#ff3d7f'; g.fillText(txt, cx, y + pfs * 0.8);
    if (show.sub) {
      g.font = `700 ${pfs * 0.32}px "Quicksand", system-ui, sans-serif`;
      g.lineWidth = 4; g.strokeText(show.sub, cx, y + pfs * 1.45);
      g.fillStyle = '#7a1e46'; g.fillText(show.sub, cx, y + pfs * 1.45);
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
  if (show) drawShow(t, fade);
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.t += dt; if (r.t < 0) continue;
    const k = r.t / 0.75;
    g.save(); g.globalAlpha = Math.max(0, 1 - k); g.strokeStyle = r.c; g.lineWidth = 16 * (1 - k) + 2;
    g.beginPath(); g.arc(r.x, r.y, r.max * (1 - Math.pow(1 - Math.min(1, k), 3)), 0, Math.PI * 2); g.stroke(); g.restore();
    if (k >= 1) rings.splice(i, 1);
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += dt; p.vy += 16 * dt; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.rot += p.vr;
    drawPart(p);
    if (p.t > p.life || p.y > H + 60) parts.splice(i, 1);
  }
  if (show) {
    drawText(t, fade);
    if (t >= show.dur) { show = null; unduck(); }
  }
  if (flash > 0) { g.fillStyle = `rgba(255,240,246,${flash})`; g.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 2.4); }
  if (shake > 0) { shake = Math.max(0, shake - dt * 1.5); const m = shake * 18; stage.style.transform = `translate(${rnd(-m, m)}px,${rnd(-m, m)}px)`; }
  else if (stage.style.transform) stage.style.transform = '';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

export function celebrate({ word, msg, pt, sentence, points, sub, big = false }) {
  const dur = big ? 5 : 4;
  show = { word, msg, pt, sentence, points, sub, big, start: performance.now(), dur };
  flash = 0.95;
  shake = big ? 1.2 : 0.8;
  duck(0.18, 800);
  sfxCelebrate(big);
  burst(W / 2, H * 0.33, big ? 240 : 170, big ? 1.5 : 1.2);
  for (let i = 0; i < (big ? 12 : 7); i++) {
    setTimeout(() => { burst(rnd(W * 0.1, W * 0.9), rnd(H * 0.1, H * 0.6), 70, 0.9); shake = Math.max(shake, 0.35); }, 220 + i * 260);
  }
  setTimeout(() => speak(`${word.replace(' !', '')} ! ${msg}`, { rate: 0.95 }), 300);
  if (sentence) setTimeout(() => speak(sentence, { rate: 0.85, interrupt: false }), 400);
  return dur;
}
export function sparkle(x, y, color) {
  for (let i = 0; i < 22; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(2, 7);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, rot: 0, vr: 0.2, size: rnd(8, 14), kind: pick(['heart', 'star', 'conf']), c: color, f: color, life: rnd(0.5, 0.9), t: 0 });
  }
}
export function jolt(a = 0.4) { shake = Math.max(shake, a); }
