// Áudio 100% sintetizado com Web Audio API:
// - música de fundo do mar (guitarra havaiana com slide, ukulele, baixo "oom-pah", percussão de coco)
// - efeitos sonoros e a "explosão sonora" das comemorações.

let ctx = null;
let master, musicGain, sfxGain, musicFilter;
let musicOn = true;
let sfxOn = true;
const plucks = new Map();
let noiseBuf = null;

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function n2m(s) {
  const m = s.match(/^([A-G]#?)(\d)$/);
  return 12 * (+m[2] + 1) + NOTE[m[1]];
}

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  musicFilter = ctx.createBiquadFilter();
  musicFilter.type = 'lowpass';
  musicFilter.frequency.value = 18000;
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.42;
  musicGain.connect(musicFilter).connect(master);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.85;
  sfxGain.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

// ------------------------------------------------------------ instrumentos
function pluckBuffer(midi) {
  if (plucks.has(midi)) return plucks.get(midi);
  // Karplus-Strong (corda dedilhada) pré-calculado
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * 1.4);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const period = Math.max(2, Math.round(sr / mtof(midi)));
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const nx = (idx + 1) % period;
    const v = 0.4985 * (ring[idx] + ring[nx]);
    out[i] = ring[idx];
    ring[idx] = v;
    idx = nx;
  }
  plucks.set(midi, buf);
  return buf;
}

function pluck(midi, t, vol = 0.3, dest = musicGain, pan = 0) {
  const src = ctx.createBufferSource();
  src.buffer = pluckBuffer(midi);
  const g = ctx.createGain();
  g.gain.value = vol;
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (p) {
    p.pan.value = pan;
    src.connect(g).connect(p).connect(dest);
  } else src.connect(g).connect(dest);
  src.start(t);
  src.stop(t + 1.4);
}

// guitarra havaiana (lap steel): slide até a nota + vibrato
function steel(midi, t, dur, fromMidi = null, vol = 0.16) {
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  o1.type = 'sawtooth';
  o2.type = 'triangle';
  const f = mtof(midi);
  const f0 = fromMidi != null ? mtof(fromMidi) : f * 0.94;
  const slide = fromMidi != null ? 0.12 : 0.06;
  for (const o of [o1, o2]) {
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f, t + slide);
  }
  o2.detune.value = 6;
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.5;
  const vibG = ctx.createGain();
  vibG.gain.setValueAtTime(0, t);
  vibG.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.35, dur));
  vib.connect(vibG);
  vibG.connect(o1.frequency);
  vibG.connect(o2.frequency);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2600, t);
  lp.frequency.exponentialRampToValueAtTime(1100, t + dur);
  lp.Q.value = 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
  g.gain.exponentialRampToValueAtTime(vol * 0.55, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
  o1.connect(lp);
  o2.connect(lp);
  lp.connect(g).connect(musicGain);
  // eco simples (água)
  const dl = ctx.createDelay();
  dl.delayTime.value = 0.27;
  const fb = ctx.createGain();
  fb.gain.value = 0.25;
  g.connect(dl).connect(fb).connect(musicGain);
  for (const o of [o1, o2, vib]) {
    o.start(t);
    o.stop(t + dur + 0.2);
  }
}

function bass(midi, t, dur = 0.3, vol = 0.32) {
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = mtof(midi);
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = mtof(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  o2.connect(g);
  g.connect(musicGain);
  o.start(t);
  o2.start(t);
  o.stop(t + dur + 0.05);
  o2.stop(t + dur + 0.05);
}

function noiseHit(t, { freq = 6000, q = 1, dur = 0.05, vol = 0.1, type = 'highpass', dest = musicGain } = {}) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(dest);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.02);
}

function woodblock(t, hi = true, vol = 0.18) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(hi ? 1250 : 880, t);
  o.frequency.exponentialRampToValueAtTime(hi ? 900 : 640, t + 0.05);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  o.connect(g).connect(musicGain);
  o.start(t);
  o.stop(t + 0.1);
}

function bubbleBlip(t, dest = musicGain, vol = 0.12) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  const f = 300 + Math.random() * 500;
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 2.6, t + 0.09);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + 0.12);
}

// ------------------------------------------------------------ composição original
// 16 compassos em Dó maior, clima havaiano/fundo do mar, 112 bpm com swing.
const CHORDS = ['C', 'C', 'F', 'C', 'G7', 'G7', 'C', 'C', 'F', 'F', 'C', 'A7', 'D7', 'G7', 'C', 'G7'];
const CHORD_NOTES = {
  C: ['G4', 'C4', 'E4', 'A4'],
  F: ['A4', 'C4', 'F4', 'A4'],
  G7: ['G4', 'D4', 'F4', 'B4'],
  A7: ['G4', 'C#4', 'E4', 'A4'],
  D7: ['A4', 'D4', 'F#4', 'C5'],
};
const ROOT = { C: 'C2', F: 'F2', G7: 'G2', A7: 'A2', D7: 'D2' };
const FIFTH = { C: 'G2', F: 'C3', G7: 'D3', A7: 'E3', D7: 'A2' };
// melodia (nota:duração em tempos), "r" = pausa
const MELODY = [
  'E4:2 G4:1 A4:1', 'G4:3 r:1', 'A4:1 C5:1 A4:1 F4:1', 'G4:3 r:1',
  'F4:1 G4:1 B4:1 D5:1', 'C5:2 B4:1 G4:1', 'E4:1 G4:1 C5:2', 'C5:3 r:1',
  'A4:2 C5:1 D5:1', 'C5:2 A4:2', 'G4:1 E4:1 G4:1 C5:1', 'C#5:3 r:1',
  'D5:1 C5:1 A4:1 F#4:1', 'G4:2 B4:1 D5:1', 'E5:2 D5:1 C5:1', 'C5:2 G4:1 B4:1',
];
const BPM = 112;
const BEAT = 60 / BPM;
let nextBar = 0;
let barTime = 0;
let schedTimer = null;
let lastMelodyMidi = null;

function scheduleBar(bar, t0) {
  const chord = CHORDS[bar % 16];
  const sw = BEAT * 0.17; // swing nas colcheias
  const eighth = (i) => t0 + Math.floor(i / 2) * BEAT + (i % 2 ? BEAT / 2 + sw : 0);
  // ukulele: batida "D  DU  UDU"
  const pattern = [0, 2, 3, 5, 6, 7];
  for (const e of pattern) {
    const up = e % 2 === 1;
    const notes = CHORD_NOTES[chord].map(n2m);
    const order = up ? [...notes].reverse() : notes;
    order.forEach((m, k) => pluck(m, eighth(e) + k * 0.012, (e === 0 ? 0.2 : 0.13) * (1 - k * 0.08), musicGain, 0.25));
  }
  // baixo oom-pah
  bass(n2m(ROOT[chord]), eighth(0), 0.4);
  bass(n2m(FIFTH[chord]), eighth(4), 0.4);
  if (bar % 4 === 3) bass(n2m(ROOT[chord]) + 2, eighth(6), 0.25, 0.22);
  // percussão: shaker + coco (woodblock)
  for (let e = 0; e < 8; e++) noiseHit(eighth(e), { vol: e % 2 ? 0.05 : 0.025, dur: 0.045 });
  woodblock(eighth(2), true);
  woodblock(eighth(6), false);
  // melodia na guitarra havaiana
  let beat = 0;
  for (const tok of MELODY[bar % 16].split(' ')) {
    const [n, d] = tok.split(':');
    const dur = +d * BEAT;
    if (n !== 'r') {
      const m = n2m(n);
      const t = t0 + beat * BEAT + (beat % 1 ? sw : 0);
      const from = lastMelodyMidi != null && Math.abs(lastMelodyMidi - m) <= 5 && Math.random() < 0.6 ? lastMelodyMidi : null;
      steel(m, t, dur * 0.95, from);
      lastMelodyMidi = m;
    }
    beat += +d;
  }
  // bolhinhas
  if (Math.random() < 0.6) bubbleBlip(t0 + Math.random() * BEAT * 4);
}

function scheduler() {
  if (!ctx || !musicOn) return;
  while (barTime < ctx.currentTime + 0.6) {
    scheduleBar(nextBar, barTime);
    nextBar++;
    barTime += BEAT * 4;
  }
}

export function startMusic() {
  if (!ctx) return;
  if (schedTimer) return;
  barTime = ctx.currentTime + 0.1;
  nextBar = 0;
  schedTimer = setInterval(scheduler, 100);
  scheduler();
}

export function setMusic(on) {
  musicOn = on;
  if (!ctx) return;
  musicGain.gain.setTargetAtTime(on ? 0.42 : 0, ctx.currentTime, 0.1);
  if (on && !schedTimer) startMusic();
  if (on) barTime = Math.max(barTime, ctx.currentTime + 0.05);
}
export const isMusicOn = () => musicOn;
export function setSfx(on) {
  sfxOn = on;
}
export const isSfxOn = () => sfxOn;

// abafa a música (som "debaixo d'água") durante a comemoração / pausa
export function duckMusic(amount = 0.25, filter = 900, time = 0.15) {
  if (!ctx) return;
  musicGain.gain.setTargetAtTime(musicOn ? 0.42 * amount : 0, ctx.currentTime, time);
  musicFilter.frequency.setTargetAtTime(filter, ctx.currentTime, time);
}
export function unduckMusic() {
  if (!ctx) return;
  musicGain.gain.setTargetAtTime(musicOn ? 0.42 : 0, ctx.currentTime, 0.4);
  musicFilter.frequency.setTargetAtTime(18000, ctx.currentTime, 0.4);
}

// ------------------------------------------------------------ efeitos
const ok = () => ctx && sfxOn;

function tone(type, f1, f2, t, dur, vol, dest = sfxGain) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function sfxClick() {
  if (!ok()) return;
  tone('sine', 900, 600, ctx.currentTime, 0.08, 0.2);
}

export function sfxCollect(combo = 1) {
  if (!ok()) return;
  const t = ctx.currentTime;
  const base = 72 + Math.min(combo - 1, 8) * 2; // sobe a cada acerto seguido
  [0, 4, 7, 12].forEach((iv, i) => tone('triangle', mtof(base + iv), mtof(base + iv), t + i * 0.05, 0.22, 0.22));
  tone('sine', mtof(base + 24), mtof(base + 24), t + 0.2, 0.4, 0.1);
  bubbleBlip(t, sfxGain, 0.25);
  bubbleBlip(t + 0.06, sfxGain, 0.2);
}

export function sfxWrong() {
  if (!ok()) return;
  const t = ctx.currentTime;
  tone('square', 220, 150, t, 0.25, 0.12);
  tone('square', 160, 100, t + 0.15, 0.3, 0.12);
  noiseHit(t, { type: 'lowpass', freq: 400, dur: 0.2, vol: 0.3, dest: sfxGain });
}

export function sfxPearl() {
  if (!ok()) return;
  const t = ctx.currentTime;
  tone('sine', 1800, 2600, t, 0.12, 0.1);
  tone('sine', 2600, 3200, t + 0.06, 0.15, 0.07);
}

export function sfxSting() {
  if (!ok()) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 6; i++) tone('sawtooth', 600 + Math.random() * 900, 200, t + i * 0.03, 0.12, 0.08);
  tone('sine', 400, 80, t, 0.5, 0.25);
}

export function sfxWhoosh(t0 = 0, vol = 0.4) {
  if (!ok()) return;
  const t = ctx.currentTime + t0;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 3;
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(5000, t + 0.45);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  s.connect(f).connect(g).connect(sfxGain);
  s.start(t);
  s.stop(t + 0.65);
}

export function sfxBoom(t0 = 0, vol = 0.9) {
  if (!ok()) return;
  const t = ctx.currentTime + t0;
  tone('sine', 150, 35, t, 0.9, vol);
  tone('triangle', 90, 30, t, 0.6, vol * 0.6);
  noiseHit(t, { type: 'lowpass', freq: 1200, dur: 0.7, vol: vol * 0.6, dest: sfxGain });
}

export function sfxPop(t0 = 0, pitch = 1) {
  if (!ok()) return;
  const t = ctx.currentTime + t0;
  tone('sine', 500 * pitch, 1500 * pitch, t, 0.07, 0.35);
  noiseHit(t, { freq: 3000, dur: 0.04, vol: 0.2, dest: sfxGain });
}

export function sfxSparkle(n = 10, t0 = 0, spread = 1.2) {
  if (!ok()) return;
  const scale = [84, 86, 88, 91, 93, 96, 98, 100];
  for (let i = 0; i < n; i++) {
    const t = ctx.currentTime + t0 + Math.random() * spread;
    const m = scale[Math.floor(Math.random() * scale.length)];
    tone('sine', mtof(m), mtof(m), t, 0.35, 0.09);
    tone('sine', mtof(m + 12), mtof(m + 12), t, 0.2, 0.04);
  }
}

// fanfarra de metais (acorde ascendente) + coral "aaah"
export function sfxFanfare(t0 = 0, big = false) {
  if (!ok()) return;
  const t = ctx.currentTime + t0;
  const seq = big ? [60, 64, 67, 72, 76, 79, 84] : [60, 64, 67, 72];
  seq.forEach((m, i) => brass(m, t + i * 0.09, 0.25, 0.13));
  const chordT = t + seq.length * 0.09;
  [60, 64, 67, 72, 76].forEach((m) => brass(m, chordT, big ? 1.8 : 1.1, 0.1));
  choir([48, 55, 64, 67, 72], chordT - 0.1, big ? 2.4 : 1.5, big ? 0.07 : 0.05);
}

function brass(m, t, dur, vol) {
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = mtof(m);
  const o2 = ctx.createOscillator();
  o2.type = 'square';
  o2.frequency.value = mtof(m) * 1.003;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(600, t);
  f.frequency.exponentialRampToValueAtTime(4000, t + 0.08);
  f.frequency.exponentialRampToValueAtTime(1800, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  g.gain.setValueAtTime(vol, t + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f);
  o2.connect(f);
  f.connect(g).connect(sfxGain);
  o.start(t);
  o2.start(t);
  o.stop(t + dur + 0.05);
  o2.stop(t + dur + 0.05);
}

function choir(notes, t, dur, vol) {
  for (const m of notes) {
    for (const det of [-8, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(m);
      o.detune.value = det;
      // formante "aah"
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = 800;
      f1.Q.value = 4;
      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.value = 1200;
      f2.Q.value = 5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.25);
      g.gain.setValueAtTime(vol, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f1).connect(g);
      o.connect(f2).connect(g);
      g.connect(sfxGain);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }
}

// torcida "HURRAY!" (ruído filtrado com modulação + assobios)
export function sfxCheer(t0 = 0, dur = 2.2, vol = 0.35) {
  if (!ok()) return;
  const t = ctx.currentTime + t0;
  for (let i = 0; i < 5; i++) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 500 + i * 350;
    f.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol / 3, t + 0.3);
    g.gain.setValueAtTime(vol / 3, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 3 + Math.random() * 6;
    const lg = ctx.createGain();
    lg.gain.value = vol / 8;
    lfo.connect(lg).connect(g.gain);
    s.connect(f).connect(g).connect(sfxGain);
    s.start(t, Math.random());
    s.stop(t + dur + 0.1);
    lfo.start(t);
    lfo.stop(t + dur + 0.1);
  }
  for (let i = 0; i < 3; i++) {
    const tt = t + 0.2 + Math.random() * dur * 0.6;
    tone('sine', 1800 + Math.random() * 600, 2800 + Math.random() * 600, tt, 0.35, 0.06);
  }
}

// ------------------------------------------------------------ voz (pronúncia)
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => /en[-_]US/i.test(v.lang) && /Google|Samantha|Microsoft/i.test(v.name)) ||
    vs.find((v) => /^en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  return voice;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export function speak(text, { rate = 0.9, pitch = 1.05, volume = 1, interrupt = false } = {}) {
  if (!sfxOn || !('speechSynthesis' in window)) return;
  try {
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    if (voice || pickVoice()) u.voice = voice;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    speechSynthesis.speak(u);
  } catch (e) {
    /* sem voz disponível */
  }
}

// voz grave de "locutor" para a palavra de comemoração
export function announce(word) {
  speak(word.replace('!', ''), { rate: 0.75, pitch: 0.35, interrupt: true });
}
