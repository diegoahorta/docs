// Áudio do jogo, 100% sintetizado com Web Audio (nenhum arquivo de som):
//  * trilha lofi chinesa generativa: guzheng dedilhado na escala pentatônica,
//    piano elétrico abafado, batida boom-bap com swing, bloco de madeira e chiado de vinil;
//  * efeitos: acerto, erro, portal, e a "explosão sonora" de comemoração
//    (estouro, bombinhas 鞭炮, gongo, fanfarra, buzina e torcida);
//  * melodia dos tons (contornos de Chao) e voz zh-CN via speechSynthesis.

let ctx = null;
let master, musicBus, sfxBus, comp;
let musicOn = true;
let sfxOn = true;
let noiseBuf = null;

export function audioCtx() {
  return ctx;
}

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master = ctx.createGain();
  master.gain.value = 0.9;
  comp.connect(master).connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = musicOn ? 0.55 : 0;
  sfxBus = ctx.createGain();
  sfxBus.gain.value = sfxOn ? 1 : 0;
  musicBus.connect(comp);
  sfxBus.connect(comp);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

export function setMusic(on) {
  musicOn = on;
  if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.3);
  if (on) startMusic();
}
export function setSfx(on) {
  sfxOn = on;
  if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.05);
}

// ---------------------------------------------------------------- primitivas

function noise(dest, t, dur, { type = 'lowpass', freq = 2000, q = 1, gain = 0.5, attack = 0.002, sweepTo = null } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random());
  src.stop(t + dur + 0.05);
}

function tone(dest, t, freq, dur, { type = 'sine', gain = 0.3, attack = 0.005, release = null, bendFrom = null, bendTime = 0.05, detune = 0 } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.detune.value = detune;
  if (bendFrom) {
    o.frequency.setValueAtTime(bendFrom, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + bendTime);
  } else o.frequency.setValueAtTime(freq, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (release ?? dur));
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + (release ?? dur) + 0.05);
  return o;
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

/**
 * Flauta suave (estilo dizi 笛子): senoide com harmônicos leves, vibrato lento,
 * sopro de ar filtrado e ataque macio. `setFreq(param, mul)` agenda a altura
 * (permite seguir o contorno do tom); ou passe um número fixo em Hz.
 */
function flute(dest, t, dur, freq, { gain = 0.28, vibrato = 0.006, breath = 0.05 } = {}) {
  const base = typeof freq === 'number' ? freq : freq.base;
  const setFreq = typeof freq === 'number' ? (p, m) => p.setValueAtTime(freq * m, t) : freq.set;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.08, dur * 0.3));
  env.gain.setValueAtTime(gain, t + Math.max(0.09, dur - 0.1));
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3400;
  env.connect(lp).connect(dest);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.2;
  const stop = t + dur + 0.2;
  for (const [mul, g] of [[1, 1], [2, 0.16], [3, 0.05]]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    setFreq(o.frequency, mul);
    const vg = ctx.createGain();
    vg.gain.value = base * mul * vibrato;
    lfo.connect(vg).connect(o.frequency);
    const og = ctx.createGain();
    og.gain.value = g;
    o.connect(og).connect(env);
    o.start(t);
    o.stop(stop);
  }
  lfo.start(t);
  lfo.stop(stop);
  // sopro: um "chiff" de ar no ataque e um fio de ar contínuo
  if (breath) {
    noise(dest, t, 0.09, { type: 'bandpass', freq: base * 2.5, q: 1.5, gain: breath * 1.6, attack: 0.01 });
    noise(dest, t, dur, { type: 'bandpass', freq: base * 2, q: 2.5, gain: breath * 0.5, attack: 0.08 });
  }
}

/** Sino suave (parciais de sino de vento). */
function bell(dest, t, f, dur = 1.6, gain = 0.12) {
  [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(([r, g]) =>
    tone(dest, t, f * r, dur / (r > 1 ? r * 0.7 : 1), { type: 'sine', gain: gain * g, attack: 0.004 }));
}

// ---------------------------------------------------------------- trilha lofi

// Ré pentatônica (D E F# A B) — o "sabor chinês" vem da escala de 5 notas (宫商角徵羽)
const PENTA = [62, 64, 66, 69, 71];
const CHORDS = [
  [55, 59, 62, 66, 69], // Gmaj9
  [54, 57, 61, 64], // F#m7
  [52, 55, 59, 62, 66], // Em9
  [47, 54, 57, 62], // Bm7(add11)
];
const BPM = 74;
let musicTimer = null;
let step = 0;
let nextTime = 0;
let melodyPos = 2;
let lofiFilter, crackleTimer;

function pentaNote(idx) {
  const oct = Math.floor(idx / 5);
  return PENTA[((idx % 5) + 5) % 5] + 12 * oct;
}

function guzheng(t, n, vel = 0.22) {
  const f = midi(n);
  // ataque com pequena "puxada" de baixo para cima (técnica 按音 do guzheng)
  const bend = Math.random() < 0.3 ? f * 0.94 : f * 0.995;
  const g = ctx.createGain();
  g.gain.value = vel;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(5200, t);
  lp.frequency.exponentialRampToValueAtTime(900, t + 1.2);
  g.connect(lp).connect(lofiFilter);
  tone(g, t, f, 1.8, { type: 'triangle', gain: 0.6, attack: 0.003, bendFrom: bend, bendTime: 0.09 });
  tone(g, t, f * 2, 0.7, { type: 'sine', gain: 0.25, attack: 0.002 });
  tone(g, t, f * 3.01, 0.35, { type: 'sine', gain: 0.12, attack: 0.002 });
  noise(g, t, 0.03, { type: 'highpass', freq: 3000, gain: 0.15 });
}

function rhodes(t, notes, dur) {
  const g = ctx.createGain();
  g.gain.value = 0.07;
  g.connect(lofiFilter);
  for (const n of notes) {
    const f = midi(n);
    tone(g, t, f, dur, { type: 'sine', gain: 0.5, attack: 0.02, release: dur * 1.1, detune: -6 });
    tone(g, t, f, dur, { type: 'triangle', gain: 0.25, attack: 0.03, release: dur, detune: 7 });
  }
}

function kick(t) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.55, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  o.connect(g).connect(lofiFilter);
  o.start(t);
  o.stop(t + 0.45);
}
const snare = (t) => {
  noise(lofiFilter, t, 0.22, { type: 'bandpass', freq: 1800, q: 0.8, gain: 0.22 });
  tone(lofiFilter, t, 190, 0.12, { type: 'triangle', gain: 0.1 });
};
const hat = (t, v = 0.05) => noise(lofiFilter, t, 0.05, { type: 'highpass', freq: 7000, gain: v });
const woodblock = (t) => {
  tone(lofiFilter, t, 1250, 0.08, { type: 'sine', gain: 0.12, attack: 0.001 });
  tone(lofiFilter, t, 820, 0.06, { type: 'sine', gain: 0.06, attack: 0.001 });
};

function crackle() {
  if (!ctx || !musicOn) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 6; i++) {
    if (Math.random() < 0.6) noise(musicBus, t + Math.random() * 0.25, 0.004 + Math.random() * 0.01, { type: 'highpass', freq: 2500 + Math.random() * 4000, gain: 0.02 + Math.random() * 0.05 });
  }
}

function scheduleStep(s, t) {
  const sixteenth = 60 / BPM / 4;
  const bar = Math.floor(s / 16) % 4;
  const pos = s % 16;
  // acordes no começo de cada compasso
  if (pos === 0) rhodes(t, CHORDS[bar], sixteenth * 16);
  if (pos === 8 && Math.random() < 0.5) rhodes(t, CHORDS[bar].slice(-2).map((n) => n + 12), sixteenth * 6);
  // batida boom-bap
  if (pos === 0 || pos === 10 || (pos === 7 && Math.random() < 0.3)) kick(t);
  if (pos === 4 || pos === 12) snare(t);
  if (pos % 2 === 0) hat(t, pos % 4 === 0 ? 0.045 : 0.03);
  if (pos === 14 && Math.random() < 0.4) woodblock(t);
  // melodia de guzheng: passeio aleatório na pentatônica, com respiros
  const phraseRest = Math.floor(s / 32) % 3 === 2;
  if (!phraseRest && pos % 2 === 0 && Math.random() < 0.42) {
    melodyPos += [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
    melodyPos = Math.max(-2, Math.min(9, melodyPos));
    guzheng(t, pentaNote(melodyPos) + 12, 0.2);
  }
  // glissando 刮奏 a cada 8 compassos
  if (s % 128 === 120) {
    for (let i = 0; i < 10; i++) guzheng(t + i * 0.045, pentaNote(i) + 12, 0.12);
  }
}

export function startMusic() {
  if (!ctx || musicTimer || !musicOn) return;
  if (!lofiFilter) {
    lofiFilter = ctx.createBiquadFilter();
    lofiFilter.type = 'lowpass';
    lofiFilter.frequency.value = 3200;
    lofiFilter.Q.value = 0.4;
    // leve "wow" de fita
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.25;
    const lg = ctx.createGain();
    lg.gain.value = 300;
    lfo.connect(lg).connect(lofiFilter.frequency);
    lfo.start();
    lofiFilter.connect(musicBus);
  }
  nextTime = ctx.currentTime + 0.1;
  const sixteenth = 60 / BPM / 4;
  musicTimer = setInterval(() => {
    while (nextTime < ctx.currentTime + 0.25) {
      const swing = step % 2 === 1 ? sixteenth * 0.18 : 0;
      scheduleStep(step, nextTime + swing);
      nextTime += sixteenth;
      step++;
    }
  }, 60);
  crackleTimer = setInterval(crackle, 250);
}

// abaixa a trilha durante a fala e as comemorações
function duck(amount = 0.15, dur = 2) {
  if (!ctx || !musicOn) return;
  const t = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(t);
  musicBus.gain.setTargetAtTime(amount, t, 0.05);
  musicBus.gain.setTargetAtTime(0.55, t + dur, 0.6);
}

// ---------------------------------------------------------------- efeitos

export function sfxClick() {
  if (!ctx) return;
  tone(sfxBus, ctx.currentTime, 880, 0.06, { type: 'triangle', gain: 0.12 });
}

export function sfxPick(i = 0) {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(sfxBus, t, midi(PENTA[i % 5] + 12), 0.15, { type: 'triangle', gain: 0.18 });
  woodblockSfx(t);
}
function woodblockSfx(t) {
  tone(sfxBus, t, 1100, 0.06, { type: 'sine', gain: 0.12, attack: 0.001 });
}

export function sfxCorrect(combo = 1) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const base = 74 + Math.min(combo, 6) * 2;
  [0, 4, 7, 12].forEach((iv, i) => tone(sfxBus, t + i * 0.06, midi(base + iv), 0.35, { type: 'triangle', gain: 0.22 }));
  tone(sfxBus, t + 0.22, midi(base + 24), 0.5, { type: 'sine', gain: 0.12 });
  // sininho
  bell(sfxBus, t + 0.05, midi(base + 12), 1.2, 0.1);
}

export function sfxWrong() {
  if (!ctx) return;
  const t = ctx.currentTime;
  flute(sfxBus, t, 0.22, midi(66), { gain: 0.18, breath: 0.03 });
  flute(sfxBus, t + 0.24, 0.42, midi(62), { gain: 0.16, breath: 0.03 });
}

export function sfxGong(t0 = null, vol = 0.5) {
  if (!ctx) return;
  const t = t0 ?? ctx.currentTime;
  [1, 1.48, 1.92, 2.6, 3.3, 4.1].forEach((r, i) =>
    tone(sfxBus, t, 92 * r, 4 - i * 0.4, { type: 'sine', gain: vol / (i + 1.3), attack: 0.01 }));
  noise(sfxBus, t, 1.2, { type: 'bandpass', freq: 600, q: 0.6, gain: vol * 0.25 });
}

export function sfxGate() {
  if (!ctx) return;
  const t = ctx.currentTime;
  sfxGong(t, 0.45);
  // porta de madeira se abrindo e sinos de vento
  tone(sfxBus, t + 0.1, 95, 0.25, { type: 'sine', gain: 0.18, attack: 0.005 });
  [74, 78, 81, 83, 86].forEach((n, i) => bell(sfxBus, t + 0.3 + i * 0.11, midi(n + 12), 1.4, 0.06));
}

export function sfxStep() {
  if (!ctx) return;
  noise(sfxBus, ctx.currentTime, 0.05, { type: 'lowpass', freq: 600, gain: 0.05 });
}

/** A EXPLOSÃO SONORA. intensity 1 = acerto grande, 2 = missão, 3 = fase completa. */
export function sfxCelebrate(intensity = 2) {
  if (!ctx) return;
  const t = ctx.currentTime;
  duck(0.08, 1.5 + intensity);
  // estouro: boom subgrave + ruído varrendo
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(28, t + 0.8);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  o.connect(g).connect(sfxBus);
  o.start(t);
  o.stop(t + 1.2);
  noise(sfxBus, t, 1.4, { type: 'lowpass', freq: 9000, sweepTo: 150, gain: 0.8, attack: 0.001 });
  // bombinhas 鞭炮
  const n = 40 * intensity;
  for (let i = 0; i < n; i++) {
    const tt = t + 0.15 + Math.random() * (0.9 + intensity * 0.8);
    noise(sfxBus, tt, 0.03 + Math.random() * 0.04, { type: 'bandpass', freq: 1500 + Math.random() * 4500, q: 1.2, gain: 0.25 + Math.random() * 0.35, attack: 0.001 });
  }
  // melodia pentatônica de flauta, fechando num acorde de sinos
  const fan = [74, 76, 78, 81, 83, 86];
  fan.forEach((n2, i) => flute(sfxBus, t + 0.1 + i * 0.1, 0.16, midi(n2), { gain: 0.16, breath: 0.03 }));
  const end = t + 0.1 + fan.length * 0.1;
  flute(sfxBus, end, 0.9, midi(86), { gain: 0.18, vibrato: 0.01 });
  [74, 78, 81, 86].forEach((n2, i) => bell(sfxBus, end + i * 0.04, midi(n2), 2.2, 0.08));
  if (intensity >= 2) {
    sfxGong(t + 0.05, 0.6);
    // sinos de vento
    for (let k = 0; k < 10; k++) bell(sfxBus, t + 0.9 + Math.random() * 1.4, midi(pentaNote(5 + Math.floor(Math.random() * 6)) + 12), 1.5, 0.05);
    // trinado de flauta
    for (let k = 0; k < 6; k++) flute(sfxBus, t + 1.0 + k * 0.08, 0.07, midi(k % 2 ? 88 : 86), { gain: 0.1, breath: 0.015 });
    // torcida
    noise(sfxBus, t + 0.2, 2.6, { type: 'bandpass', freq: 1100, q: 0.5, gain: 0.18, attack: 0.4 });
  }
  if (intensity >= 3) {
    // segunda onda de fogos
    for (let k = 0; k < 6; k++) {
      const tt = t + 1.6 + k * 0.35;
      noise(sfxBus, tt, 0.6, { type: 'lowpass', freq: 3000, sweepTo: 200, gain: 0.3, attack: 0.001 });
      for (let j = 0; j < 3; j++) bell(sfxBus, tt + 0.05 + j * 0.07, midi(pentaNote(8 + Math.floor(Math.random() * 5)) + 12), 1.0, 0.04);
    }
  }
}

// ---------------------------------------------------------------- tons

/** Toca a melodia (contorno de Chao) de uma ou mais sílabas: tones = [1,3] etc. */
export function playToneContour(tones, { sandhi = true } = {}) {
  if (!ctx) return;
  duck(0.2, 1.2 + tones.length * 0.5);
  // altura da flauta: nível 1 de Chao ≈ mi4 (330 Hz), nível 5 ≈ ré5
  const lv = (L) => 330 * Math.pow(2, (L - 1) / 4.5);
  let t = ctx.currentTime + 0.05;
  const seq = tones.map((tn, i) => {
    let tt = tn;
    if (sandhi && tn === 3 && tones[i + 1] === 3) tt = 2; // 3+3 → 2+3
    const last = i === tones.length - 1;
    return { tn: tt, half: tt === 3 && !last }; // 3º tom no meio da frase = "meio terceiro" (21)
  });
  for (const { tn, half } of seq) {
    const dur = tn === 0 ? 0.2 : tn === 4 ? 0.36 : tn === 3 && !half ? 0.6 : 0.46;
    const pts = tn === 1 ? [5, 5] : tn === 2 ? [3, 5] : tn === 3 ? (half ? [2, 1] : [2, 1, 4]) : tn === 4 ? [5, 1] : [3, 2.6];
    const t0 = t;
    flute(sfxBus, t0, dur, {
      base: lv(pts[0]),
      set: (param, mul) => pts.forEach((L, k) => {
        const tk = t0 + (dur * k) / (pts.length - 1 || 1);
        if (k === 0) param.setValueAtTime(lv(L) * mul, tk);
        else param.linearRampToValueAtTime(lv(L) * mul, tk);
      }),
    }, { gain: tn === 0 ? 0.2 : 0.32, vibrato: 0.004, breath: 0.04 });
    t += dur + 0.14;
  }
}

// ---------------------------------------------------------------- voz zh-CN

let zhVoice = null;
let ptVoice = null;
function pickVoices() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  zhVoice = vs.find((v) => /zh[-_]CN/i.test(v.lang)) || vs.find((v) => /^zh/i.test(v.lang)) || null;
  ptVoice = vs.find((v) => /pt[-_]BR/i.test(v.lang)) || vs.find((v) => /^pt/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) {
  pickVoices();
  speechSynthesis.onvoiceschanged = pickVoices;
}

export function hasChineseVoice() {
  return !!zhVoice;
}

export function speak(text, lang = 'zh-CN', rate = 0.78) {
  if (!('speechSynthesis' in window)) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const v = lang.startsWith('zh') ? zhVoice : ptVoice;
    if (v) u.voice = v;
    duck(0.15, 1.5 + text.length * 0.25);
    speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}
