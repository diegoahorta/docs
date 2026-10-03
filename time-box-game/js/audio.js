// Áudio sintetizado (Web Audio): trilha sci-fi original, efeitos e fanfarra de comemoração.
let ctx = null;
let master, musicBus, sfxBus, musicLP, delay, noiseBuf;
let musicOn = true;
let timer = null;
let nextBar = 0;
let barTime = 0;

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
  comp.threshold.value = -12;
  master.connect(comp).connect(ctx.destination);
  musicLP = ctx.createBiquadFilter();
  musicLP.type = 'lowpass';
  musicLP.frequency.value = 16000;
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.38;
  musicBus.connect(musicLP).connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(master);
  // eco espacial
  delay = ctx.createDelay(1);
  delay.delayTime.value = 0.32;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  const dlp = ctx.createBiquadFilter();
  dlp.frequency.value = 2500;
  delay.connect(dlp).connect(fb).connect(delay);
  dlp.connect(musicBus);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

function env(g, t, a, peak, dur, rel = 0.05) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}
function osc(type, f, t, dur, vol, dest, { f2 = null, a = 0.01, detune = 0, filter = null, echo = false } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  o.detune.value = detune;
  const g = ctx.createGain();
  env(g, t, a, vol, dur);
  let node = o;
  if (filter) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filter; fl.Q.value = 4; node.connect(fl); node = fl; }
  node.connect(g).connect(dest);
  if (echo) g.connect(delay);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}
function noise(t, dur, vol, dest, type = 'highpass', freq = 7000, q = 1) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(dest);
  s.start(t, Math.random());
  s.stop(t + dur + 0.02);
}
function kick(t, vol = 0.9, dest = musicBus) { osc('sine', 150, t, 0.35, vol, dest, { f2: 40, a: 0.003 }); }
function snare(t, vol = 0.25, dest = musicBus) { noise(t, 0.18, vol, dest, 'bandpass', 1800, 0.8); osc('triangle', 220, t, 0.1, vol * 0.6, dest, { f2: 140 }); }

// ------------------------------------------------------------ trilha: baixo "galopante" + theremin
const BPM = 132;
const B = 60 / BPM;
const PROG = ['E', 'E', 'C', 'D', 'E', 'E', 'A', 'B'];
const ROOT = { E: 'E2', C: 'C2', D: 'D2', A: 'A1', B: 'B1' };
const PAD = { E: ['E3', 'G3', 'B3'], C: ['C3', 'E3', 'G3'], D: ['D3', 'F#3', 'A3'], A: ['A2', 'C3', 'E3'], B: ['B2', 'D#3', 'F#3'] };
const LEAD = ['B4:4', 'G4:2 A4:2', 'E5:3 D5:1', 'F#4:4', 'E4:2 B4:2', 'D5:2 C5:1 B4:1', 'A4:2 C5:2', 'B4:2 D#5:2'];
let lastLead = null;

function bar(i, t0) {
  const ch = PROG[i % 8];
  const root = n2m(ROOT[ch]);
  const section = Math.floor(i / 8) % 4; // 0 intro leve, depois completo
  // baixo galopante: colcheia + 2 semicolcheias em cada tempo
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * B;
    [0, 0.5, 0.75].forEach((o, k) => {
      const m = root + (k === 0 && b === 2 ? 7 : 0) + (k === 0 && b === 3 ? 12 : 0);
      osc('sawtooth', mtof(m), tb + o * B, B * (k ? 0.22 : 0.45), 0.2, musicBus, { filter: 700 + (k ? 0 : 500), a: 0.004 });
    });
  }
  // pad
  PAD[ch].forEach((n) => [-9, 9].forEach((det) => osc('sawtooth', mtof(n2m(n)), t0, B * 4, 0.025, musicBus, { detune: det, a: 0.6, filter: 1400 })));
  // bateria
  if (section > 0) {
    for (let b = 0; b < 4; b++) {
      kick(t0 + b * B, b % 2 ? 0.45 : 0.85);
      if (b % 2) snare(t0 + b * B);
      for (let h = 0; h < 2; h++) noise(t0 + (b + h / 2) * B, 0.04, h ? 0.05 : 0.025, musicBus);
    }
  } else kick(t0, 0.6);
  // arpejo cintilante
  if (section >= 2) {
    const ns = PAD[ch].map((n) => n2m(n) + 24);
    for (let k = 0; k < 8; k++) osc('square', mtof(ns[k % 3] + (k > 3 ? 12 : 0)), t0 + k * B / 2, 0.12, 0.025, musicBus, { filter: 3000, echo: true });
  }
  // melodia "theremin": seno com vibrato e glissando
  if (section !== 0 || i % 8 >= 4) {
    let beat = 0;
    for (const tok of LEAD[i % 8].split(' ')) {
      const [n, d] = tok.split(':');
      const m = n2m(n) + (section === 3 ? 12 : 0);
      theremin(m, t0 + beat * B, +d * B * 0.95, lastLead);
      lastLead = m;
      beat += +d;
    }
  }
}
function theremin(m, t, dur, from) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  const f = mtof(m);
  o.frequency.setValueAtTime(from ? mtof(from) : f * 0.97, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
  const vib = ctx.createOscillator();
  vib.frequency.value = 6;
  const vg = ctx.createGain();
  vg.gain.setValueAtTime(0, t);
  vg.gain.linearRampToValueAtTime(f * 0.018, t + 0.3);
  vib.connect(vg).connect(o.frequency);
  const o2 = ctx.createOscillator();
  o2.type = 'triangle';
  o2.frequency.value = f * 2;
  const g2 = ctx.createGain();
  g2.gain.value = 0.15;
  o2.connect(g2);
  const g = ctx.createGain();
  env(g, t, 0.08, 0.12, dur, 0.2);
  o.connect(g);
  g2.connect(g);
  g.connect(musicBus);
  g.connect(delay);
  [o, vib, o2].forEach((x) => { x.start(t); x.stop(t + dur + 0.1); });
}
function sched() {
  if (!ctx || !musicOn) return;
  while (barTime < ctx.currentTime + 0.5) { bar(nextBar++, barTime); barTime += 4 * B; }
}
export function startMusic() {
  if (!ctx || timer) return;
  barTime = ctx.currentTime + 0.1;
  nextBar = 0;
  timer = setInterval(sched, 100);
  sched();
}
export function setMusic(on) {
  musicOn = on;
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(on ? 0.38 : 0, ctx.currentTime, 0.1);
  if (on) { barTime = Math.max(barTime, ctx.currentTime + 0.05); if (!timer) startMusic(); }
}
export const isMusicOn = () => musicOn;
export function duck(amount = 0.25, cutoff = 900) {
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(musicOn ? 0.38 * amount : 0, ctx.currentTime, 0.1);
  musicLP.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.1);
}
export function unduck() {
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(musicOn ? 0.38 : 0, ctx.currentTime, 0.4);
  musicLP.frequency.setTargetAtTime(16000, ctx.currentTime, 0.4);
}

// ------------------------------------------------------------ efeitos
const ok = () => !!ctx;
export function sfxTap(p = 1) { if (ok()) osc('square', 880 * p, ctx.currentTime, 0.06, 0.06, sfxBus, { f2: 1320 * p, filter: 4000 }); }
export function sfxPlace(i = 0) { if (ok()) { const t = ctx.currentTime; osc('triangle', mtof(72 + i * 2), t, 0.12, 0.18, sfxBus); osc('sine', mtof(84 + i * 2), t + 0.04, 0.15, 0.08, sfxBus); } }
export function sfxRemove() { if (ok()) osc('triangle', 600, ctx.currentTime, 0.1, 0.12, sfxBus, { f2: 300 }); }
export function sfxWrong() {
  if (!ok()) return;
  const t = ctx.currentTime;
  for (let k = 0; k < 5; k++) osc('square', 140 + Math.random() * 60, t + k * 0.05, 0.08, 0.1, sfxBus, { filter: 900 });
  osc('sawtooth', 120, t, 0.45, 0.14, sfxBus, { f2: 60, filter: 600 });
}
export function sfxHint() { if (ok()) [0, 5, 9].forEach((s, k) => osc('sine', mtof(84 + s), ctx.currentTime + k * 0.06, 0.25, 0.08, sfxBus)); }
export function sfxClick() { if (ok()) osc('sine', 1200, ctx.currentTime, 0.05, 0.08, sfxBus, { f2: 700 }); }

// som de "materialização" da nave: chiado pulsante
export function sfxMaterialize(dur = 3.2, vol = 0.35) {
  if (!ok()) return;
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.3);
  g.gain.setValueAtTime(vol, t + dur - 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const pump = ctx.createOscillator();
  pump.frequency.value = 1.3;
  const pg = ctx.createGain();
  pg.gain.value = vol * 0.8;
  pump.connect(pg).connect(g.gain);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 6;
  bp.frequency.setValueAtTime(300, t);
  const sweep = ctx.createOscillator();
  sweep.frequency.value = 1.3;
  const sg = ctx.createGain();
  sg.gain.value = 500;
  sweep.connect(sg).connect(bp.frequency);
  const srcs = [];
  for (const det of [0, 7, -5]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 70 * Math.pow(2, det / 12);
    o.connect(bp);
    srcs.push(o);
  }
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf; s.loop = true;
  const ng = ctx.createGain(); ng.gain.value = 0.4;
  s.connect(ng).connect(bp);
  srcs.push(s);
  bp.connect(g).connect(sfxBus);
  g.connect(delay);
  [...srcs, pump, sweep].forEach((x) => { x.start(t); x.stop(t + dur + 0.1); });
}
export function sfxWarp(t0 = 0) {
  if (!ok()) return;
  const t = ctx.currentTime + t0;
  osc('sawtooth', 60, t, 1.4, 0.18, sfxBus, { f2: 900, filter: 2000, a: 0.2 });
  noise(t, 1.4, 0.25, sfxBus, 'bandpass', 1200, 0.7);
}

function laser(t, f = 2000) { osc('square', f, t, 0.18, 0.06, sfxBus, { f2: f / 8, filter: 5000 }); }
function boom(t, vol = 1) { osc('sine', 120, t, 1.0, vol, sfxBus, { f2: 30, a: 0.005 }); noise(t, 0.9, vol * 0.5, sfxBus, 'lowpass', 900); }

// fanfarra sci-fi de comemoração (~3,5 s): arpejo subindo, acorde gigante, coro, tambores, lasers e brilhos
export function sfxCelebrate(big = false) {
  if (!ok()) return;
  const t = ctx.currentTime;
  boom(t, 1);
  noise(t, 1.6, 0.3, sfxBus, 'highpass', 5000); // prato
  const arp = [52, 59, 64, 67, 71, 76, 79, 83, 88];
  arp.forEach((m, k) => osc('sawtooth', mtof(m), t + k * 0.055, 0.2, 0.09, sfxBus, { filter: 3500, echo: true }));
  const ct = t + arp.length * 0.055;
  const chord = big ? [40, 52, 59, 64, 67, 71, 76, 83] : [52, 59, 64, 67, 71, 76];
  chord.forEach((m) => [-12, 12].forEach((det) => osc('sawtooth', mtof(m), ct, big ? 2.8 : 2.0, 0.035, sfxBus, { detune: det, filter: 2600, a: 0.04 })));
  chord.slice(2).forEach((m) => {
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = 900; f1.Q.value = 3;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m);
    const g = ctx.createGain(); env(g, ct, 0.3, 0.05, big ? 3 : 2.2, 0.6);
    o.connect(f1).connect(g).connect(sfxBus); g.connect(delay);
    o.start(ct); o.stop(ct + 3.2);
  });
  for (let k = 0; k < 8; k++) snare(t + 0.4 + k * 0.06, 0.18, sfxBus);
  kick(ct, 1, sfxBus);
  for (let k = 0; k < (big ? 14 : 8); k++) laser(t + 0.2 + Math.random() * 2.2, 1200 + Math.random() * 2500);
  for (let k = 0; k < (big ? 30 : 18); k++) {
    const m = 84 + [0, 3, 7, 10, 12, 15][Math.floor(Math.random() * 6)];
    osc('sine', mtof(m), t + 0.3 + Math.random() * 2.5, 0.3, 0.05, sfxBus, { echo: true });
  }
  for (let k = 0; k < 4; k++) boom(t + 0.6 + k * 0.45, 0.35);
}

// ------------------------------------------------------------ voz
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => /^en[-_]GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function speak(text, { rate = 0.92, pitch = 1, interrupt = true } = {}) {
  if (!('speechSynthesis' in window)) return;
  try {
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : 'en-GB';
    if (voice) u.voice = voice;
    u.rate = rate; u.pitch = pitch;
    speechSynthesis.speak(u);
  } catch (e) { /* sem voz */ }
}
