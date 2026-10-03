// Áudio sintetizado: valsa "musette" de café parisiense (acordeão, violão, contrabaixo),
// ambiente de café, efeitos e a fanfarra de comemoração. Tudo original, gerado no navegador.
let ctx = null;
let master, musicBus, sfxBus, musicLP, verb, noiseBuf;
let musicOn = true;
let timer = null, nextBar = 0, barTime = 0;
const plucks = new Map();

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const n2m = (s) => { const m = s.match(/^([A-G]#?)(\d)$/); return 12 * (+m[2] + 1) + NOTE[m[1]]; };

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.85;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  master.connect(comp).connect(ctx.destination);
  musicLP = ctx.createBiquadFilter();
  musicLP.type = 'lowpass';
  musicLP.frequency.value = 14000;
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.4;
  musicBus.connect(musicLP).connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(master);
  // "sala" simples: eco curto e filtrado
  verb = ctx.createDelay(1);
  verb.delayTime.value = 0.13;
  const fb = ctx.createGain(); fb.gain.value = 0.3;
  const lp = ctx.createBiquadFilter(); lp.frequency.value = 2200;
  verb.connect(lp).connect(fb).connect(verb);
  lp.connect(musicBus);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

function env(g, t, a, peak, dur, rel = 0.06) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}
function tone(type, f, t, dur, vol, dest, { f2 = null, a = 0.01, det = 0 } = {}) {
  const o = ctx.createOscillator();
  o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det;
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain(); env(g, t, a, vol, dur);
  o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
  return g;
}
function noise(t, dur, vol, dest, type = 'highpass', freq = 6000, q = 1) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.02);
}

// acordeão: duas palhetas levemente desafinadas (o "tremolo musette") + filtro
function accordion(m, t, dur, vol = 0.07, dest = musicBus) {
  const f = mtof(m);
  const g = ctx.createGain(); env(g, t, 0.05, vol, dur, 0.08);
  const bp = ctx.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 2600; bp.Q.value = 1;
  for (const det of [-14, 0, 15]) {
    const o = ctx.createOscillator(); o.type = det === 0 ? 'square' : 'sawtooth';
    o.frequency.value = f; o.detune.value = det;
    const og = ctx.createGain(); og.gain.value = det === 0 ? 0.5 : 0.35;
    o.connect(og).connect(bp); o.start(t); o.stop(t + dur + 0.1);
  }
  bp.connect(g).connect(dest);
  g.connect(verb);
}
function pluckBuf(m) {
  if (plucks.has(m)) return plucks.get(m);
  const sr = ctx.sampleRate, len = Math.floor(sr * 1.2), b = ctx.createBuffer(1, len, sr), out = b.getChannelData(0);
  const p = Math.max(2, Math.round(sr / mtof(m))), ring = new Float32Array(p);
  for (let i = 0; i < p; i++) ring[i] = Math.random() * 2 - 1;
  let k = 0;
  for (let i = 0; i < len; i++) { const n = (k + 1) % p; out[i] = ring[k]; ring[k] = 0.497 * (ring[k] + ring[n]); k = n; }
  plucks.set(m, b);
  return b;
}
function pluck(m, t, vol = 0.18) {
  const s = ctx.createBufferSource(); s.buffer = pluckBuf(m);
  const g = ctx.createGain(); g.gain.value = vol;
  s.connect(g).connect(musicBus); s.start(t); s.stop(t + 1.2);
}

// ------------------------------------------------------------ valsa original em Lá menor (3/4)
const BPM = 168;
const B = 60 / BPM;
const CH = ['Am', 'Am', 'E7', 'Am', 'Dm', 'Am', 'E7', 'Am', 'C', 'G7', 'C', 'Am', 'Dm', 'Am', 'E7', 'Am'];
const CN = { Am: ['A3', 'C4', 'E4'], E7: ['G#3', 'B3', 'D4'], Dm: ['A3', 'D4', 'F4'], C: ['G3', 'C4', 'E4'], G7: ['G3', 'B3', 'F4'] };
const BASS = { Am: ['A2', 'E2'], E7: ['E2', 'B1'], Dm: ['D2', 'A1'], C: ['C2', 'G2'], G7: ['G2', 'D2'] };
// melodia (nota:tempos) por compasso de 3 tempos
const MEL = [
  'E5:1 D5:1 C5:1', 'B4:1 C5:1 A4:1', 'G#4:2 B4:1', 'A4:3',
  'F5:1 E5:1 D5:1', 'C5:1 B4:1 A4:1', 'B4:1 D5:1 G#4:1', 'A4:2 E4:1',
  'G4:1 C5:1 E5:1', 'D5:2 B4:1', 'C5:1 E5:1 G5:1', 'E5:2 C5:1',
  'D5:1 F5:1 A5:1', 'A5:1 G5:1 E5:1', 'D5:1 B4:1 G#4:1', 'A4:3',
];
function bar(i, t0) {
  const ch = CH[i % 16];
  // baixo no 1º tempo, acordes ("pompe") no 2º e 3º
  const b = BASS[ch][Math.floor(i / 16) % 2 ? 1 : 0];
  pluck(n2m(b), t0, 0.32);
  for (const k of [1, 2]) CN[ch].forEach((n, j) => pluck(n2m(n), t0 + k * B + j * 0.008, 0.07));
  noise(t0 + B, 0.05, 0.03, musicBus, 'highpass', 5000); // escovinha
  noise(t0 + 2 * B, 0.05, 0.03, musicBus, 'highpass', 5000);
  // melodia no acordeão (na 1ª passada só os acordes longos, para entrar suave)
  if (i < 4) { CN[ch].forEach((n) => accordion(n2m(n), t0, 3 * B * 0.95, 0.025)); return; }
  let beat = 0;
  for (const tok of MEL[i % 16].split(' ')) {
    const [n, d] = tok.split(':');
    accordion(n2m(n), t0 + beat * B, +d * B * 0.92, 0.075);
    beat += +d;
  }
  if (i % 16 >= 8) CN[ch].forEach((n) => accordion(n2m(n), t0, 3 * B * 0.9, 0.015));
  // ambiente de café: xícaras tilintando de vez em quando
  if (Math.random() < 0.18) tone('sine', 2600 + Math.random() * 900, t0 + Math.random() * 3 * B, 0.25, 0.02, musicBus);
}
function sched() {
  if (!ctx || !musicOn) return;
  while (barTime < ctx.currentTime + 0.5) { bar(nextBar++, barTime); barTime += 3 * B; }
}
let murmur = null;
function startMurmur() {
  // burburinho baixinho de café
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 0.8;
  const g = ctx.createGain(); g.gain.value = 0.025;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.3;
  const lg = ctx.createGain(); lg.gain.value = 0.012;
  lfo.connect(lg).connect(g.gain);
  s.connect(f).connect(g).connect(musicBus);
  s.start(); lfo.start();
  murmur = s;
}
export function startMusic() {
  if (!ctx || timer) return;
  barTime = ctx.currentTime + 0.1; nextBar = 0;
  timer = setInterval(sched, 100);
  sched();
  if (!murmur) startMurmur();
}
export function setMusic(on) {
  musicOn = on;
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(on ? 0.4 : 0, ctx.currentTime, 0.1);
  if (on) { barTime = Math.max(barTime, ctx.currentTime + 0.05); if (!timer) startMusic(); }
}
export const isMusicOn = () => musicOn;
export function duck(a = 0.25, cut = 900) { if (ctx) { musicBus.gain.setTargetAtTime(musicOn ? 0.4 * a : 0, ctx.currentTime, 0.1); musicLP.frequency.setTargetAtTime(cut, ctx.currentTime, 0.1); } }
export function unduck() { if (ctx) { musicBus.gain.setTargetAtTime(musicOn ? 0.4 : 0, ctx.currentTime, 0.4); musicLP.frequency.setTargetAtTime(14000, ctx.currentTime, 0.4); } }

// ------------------------------------------------------------ efeitos
const ok = () => !!ctx;
export function sfxClick() { if (ok()) tone('sine', 1100, ctx.currentTime, 0.06, 0.08, sfxBus, { f2: 700 }); }
export function sfxPlace(i = 0) { if (ok()) { const t = ctx.currentTime; tone('triangle', mtof(69 + [0, 3, 7, 12, 15, 19, 24, 27][i % 8]), t, 0.18, 0.16, sfxBus); } }
export function sfxRemove() { if (ok()) tone('triangle', 520, ctx.currentTime, 0.12, 0.1, sfxBus, { f2: 300 }); }
export function sfxWrong() {
  if (!ok()) return;
  const t = ctx.currentTime;
  // "oh non" no acordeão: duas notas descendo, desafinadas
  accordion(n2m('E4'), t, 0.25, 0.09, sfxBus);
  accordion(n2m('D#4'), t + 0.22, 0.45, 0.09, sfxBus);
  tone('sine', 200, t, 0.3, 0.1, sfxBus, { f2: 120 });
}
export function sfxHint() { if (ok()) [0, 4, 7, 12].forEach((s, k) => tone('sine', mtof(81 + s), ctx.currentTime + k * 0.06, 0.3, 0.07, sfxBus)); }
export function sfxStep() { if (ok()) noise(ctx.currentTime, 0.05, 0.08, sfxBus, 'bandpass', 900, 2); }
export function sfxBell() {
  if (!ok()) return;
  const t = ctx.currentTime;
  [0, 7, 12].forEach((s, k) => tone('sine', mtof(76 + s), t + k * 0.12, 1.2, 0.07, sfxBus));
}

function pop(t, p = 1) { tone('sine', 500 * p, t, 0.07, 0.25, sfxBus, { f2: 1600 * p }); noise(t, 0.04, 0.12, sfxBus, 'highpass', 3000); }
function boom(t, v = 0.8) { tone('sine', 140, t, 0.8, v, sfxBus, { f2: 40, a: 0.004 }); noise(t, 0.6, v * 0.4, sfxBus, 'lowpass', 1200); }

// fanfarra de comemoração: acordeão em arpejo + acorde final, pandeiro, palmas, "pops" e brilhos
export function sfxCelebrate(big = false) {
  if (!ok()) return;
  const t = ctx.currentTime;
  boom(t, 0.9);
  noise(t, 1.2, 0.2, sfxBus, 'highpass', 6000);
  const arp = ['A4', 'C5', 'E5', 'A5', 'C6', 'E6'];
  arp.forEach((n, k) => accordion(n2m(n), t + k * 0.08, 0.18, 0.08, sfxBus));
  const ct = t + arp.length * 0.08;
  ['A3', 'C#4', 'E4', 'A4', 'C#5', 'E5'].forEach((n) => accordion(n2m(n), ct, big ? 2.2 : 1.6, 0.05, sfxBus));
  // pandeiro e palmas
  for (let k = 0; k < (big ? 16 : 10); k++) {
    noise(t + 0.3 + k * 0.12, 0.08, 0.12, sfxBus, 'highpass', 7000);
    if (k % 2) noise(t + 0.3 + k * 0.12, 0.06, 0.2, sfxBus, 'bandpass', 1500, 1.5);
  }
  for (let k = 0; k < (big ? 26 : 16); k++) pop(t + 0.2 + Math.random() * 2.2, 0.6 + Math.random() * 1.4);
  for (let k = 0; k < (big ? 30 : 18); k++) {
    const m = 88 + [0, 2, 4, 7, 9, 12][Math.floor(Math.random() * 6)];
    tone('sine', mtof(m), t + 0.3 + Math.random() * 2.4, 0.4, 0.04, sfxBus);
  }
  for (let k = 0; k < 3; k++) boom(t + 0.7 + k * 0.5, 0.3);
}

// ------------------------------------------------------------ voz em francês
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => /^fr[-_]FR/i.test(v.lang) && /female|Amélie|Audrey|Google/i.test(v.name)) || vs.find((v) => /^fr/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function speak(text, { rate = 0.9, pitch = 1.05, interrupt = true } = {}) {
  if (!('speechSynthesis' in window)) return;
  try {
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; if (voice) u.voice = voice;
    u.rate = rate; u.pitch = pitch;
    speechSynthesis.speak(u);
  } catch (e) { /* sem voz */ }
}
