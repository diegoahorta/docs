/* Pongo - procedural audio (Web Audio API).
 * Everything is synthesized live, so there are no audio files and no
 * licensing issues: a looping jungle groove (congas, shaker, marimba,
 * breakbeat drums, bass, birds), the celebration fanfare and the SFX. */
(function () {
  'use strict';

  const A = {
    ctx: null,
    master: null,
    musicBus: null,
    sfxBus: null,
    musicOn: true,
    sfxOn: true,
    playing: false,
    _timer: null,
    _step: 0,
    _nextTime: 0,
    _bar: 0,
    _noise: null,
  };

  const BPM = 128;
  const STEP = 60 / BPM / 4; // 16th note

  function init() {
    if (A.ctx) {
      if (A.ctx.state === 'suspended') A.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    A.ctx = new Ctx();
    A.master = A.ctx.createGain();
    A.master.gain.value = 0.9;
    const comp = A.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    A.master.connect(comp).connect(A.ctx.destination);
    A.musicBus = A.ctx.createGain();
    A.musicBus.gain.value = A.musicOn ? 0.42 : 0;
    A.musicBus.connect(A.master);
    A.sfxBus = A.ctx.createGain();
    A.sfxBus.gain.value = A.sfxOn ? 0.9 : 0;
    A.sfxBus.connect(A.master);
    // shared white noise buffer
    const len = A.ctx.sampleRate * 1.5;
    A._noise = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const d = A._noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  // ------------------------------------------------------------ instruments
  function env(g, t, a, peak, dec, sustain = 0.0001) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(sustain, t + a + dec);
  }

  function osc(type, freq, t, dur, vol, bus, opts = {}) {
    const c = A.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t + (opts.slideTime || dur));
    if (opts.detune) o.detune.value = opts.detune;
    env(g, t, opts.attack || 0.005, vol, dur);
    let node = o.connect(g);
    if (opts.filter) {
      const f = c.createBiquadFilter();
      f.type = opts.filter.type || 'lowpass';
      f.frequency.value = opts.filter.freq;
      f.Q.value = opts.filter.q || 1;
      node = g.connect(f);
      f.connect(bus);
    } else {
      g.connect(bus);
    }
    o.start(t);
    o.stop(t + (opts.attack || 0.005) + dur + 0.05);
    return o;
  }

  function noise(t, dur, vol, bus, type = 'highpass', freq = 6000, q = 0.8) {
    const c = A.ctx;
    const s = c.createBufferSource();
    s.buffer = A._noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    env(g, t, 0.002, vol, dur);
    s.connect(f).connect(g).connect(bus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }

  const kick = (t, v = 0.9) => osc('sine', 150, t, 0.28, v, A.musicBus, { slideTo: 42, slideTime: 0.16 });
  const snare = (t, v = 0.5) => {
    noise(t, 0.16, v, A.musicBus, 'bandpass', 2200, 0.7);
    osc('triangle', 210, t, 0.09, v * 0.6, A.musicBus, { slideTo: 150 });
  };
  const hat = (t, v = 0.12) => noise(t, 0.04, v, A.musicBus, 'highpass', 8000);
  const shaker = (t, v = 0.1) => noise(t, 0.07, v, A.musicBus, 'bandpass', 5500, 1.5);
  const conga = (t, f, v = 0.4) => osc('sine', f * 1.35, t, 0.22, v, A.musicBus, { slideTo: f, slideTime: 0.05 });
  const marimba = (t, f, v = 0.22) => {
    osc('sine', f, t, 0.35, v, A.musicBus);
    osc('sine', f * 4, t, 0.08, v * 0.35, A.musicBus);
  };
  const bass = (t, f, dur, v = 0.32) =>
    osc('sawtooth', f, t, dur, v, A.musicBus, { filter: { freq: 420, q: 6 }, attack: 0.01 });
  const pad = (t, freqs, dur, v = 0.04) =>
    freqs.forEach((f, i) => osc('triangle', f, t, dur, v, A.musicBus, { attack: 0.25, detune: i * 4 - 4 }));
  function bird(t) {
    const base = 1800 + Math.random() * 1400;
    for (let i = 0; i < 3; i++) {
      osc('sine', base, t + i * 0.09, 0.07, 0.05, A.musicBus, { slideTo: base * 1.5, slideTime: 0.06 });
    }
  }

  // ------------------------------------------------------------ the groove
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12); // midi -> Hz
  // I - vi - IV - V in C major
  const CHORDS = [
    { root: 36, notes: [60, 64, 67] },
    { root: 33, notes: [57, 60, 64] },
    { root: 29, notes: [53, 57, 60] },
    { root: 31, notes: [55, 59, 62] },
  ];
  // marimba hooks, 16 steps per bar (null = rest), C major pentatonic
  const HOOKS = [
    [72, null, 76, null, 79, null, 76, 79, null, 81, null, 79, 76, null, 74, null],
    [72, null, 72, 74, 76, null, 79, null, 81, null, 79, null, 76, 74, 72, null],
    [79, null, 76, null, 74, 76, null, 72, null, 74, null, 76, 79, null, 81, 84],
    [84, null, 81, 79, null, 76, null, 79, 76, null, 74, null, 72, null, null, null],
  ];
  // amen-flavoured breakbeat: k = kick, s = snare, g = ghost snare
  const BREAK = 'k.k.s..gk.ks.g.s';
  const CONGA = [1, 0, 0, 2, 0, 1, 2, 0, 1, 0, 0, 2, 0, 2, 1, 2];

  function scheduleStep(step, t) {
    const s = step % 16;
    const bar = Math.floor(step / 16);
    const chord = CHORDS[bar % 4];
    const section = Math.floor(bar / 4) % 4; // 0 intro-ish, 1-3 full

    // drums
    const b = BREAK[s];
    if (b === 'k') kick(t);
    if (b === 's') snare(t, 0.42);
    if (b === 'g' && section > 0) snare(t, 0.12);
    if (s % 2 === 0) hat(t, s % 4 === 0 ? 0.1 : 0.06);
    shaker(t, s % 2 ? 0.09 : 0.05);
    // congas & bongos
    if (CONGA[s] === 1) conga(t, 196, 0.35);
    if (CONGA[s] === 2) conga(t, 294, 0.28);

    // bass: root on 1, octave on the "and", syncopated pickup
    if (s === 0) bass(t, N(chord.root), STEP * 3);
    if (s === 6) bass(t, N(chord.root + 12), STEP * 1.5);
    if (s === 10) bass(t, N(chord.root), STEP * 2);
    if (s === 14) bass(t, N(chord.root + 7), STEP * 1.5);

    // pad
    if (s === 0) pad(t, chord.notes.map(N), STEP * 15);

    // marimba hook (sections 1..3), counter-melody chords in section 0
    if (section > 0) {
      const note = HOOKS[(bar + section) % 4][s];
      if (note) marimba(t, N(note));
    } else if (s % 4 === 2) {
      marimba(t, N(chord.notes[((s / 4) | 0) % 3] + 12), 0.14);
    }
    // jungle birds now and then
    if (s === 9 && bar % 2 === 1 && Math.random() < 0.7) bird(t);
  }

  function scheduler() {
    while (A._nextTime < A.ctx.currentTime + 0.12) {
      scheduleStep(A._step, A._nextTime);
      A._nextTime += STEP * (A._step % 2 ? 0.92 : 1.08); // a little swing
      A._step++;
    }
  }

  A.startMusic = function () {
    init();
    if (!A.ctx || A.playing) return;
    A.playing = true;
    A._step = 0;
    A._nextTime = A.ctx.currentTime + 0.1;
    A._timer = setInterval(scheduler, 25);
  };

  A.stopMusic = function () {
    A.playing = false;
    clearInterval(A._timer);
  };

  function duck(amount, time) {
    if (!A.ctx || !A.musicOn) return;
    const g = A.musicBus.gain;
    const t = A.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0.42 * amount, t + 0.05);
    g.linearRampToValueAtTime(0.42 * amount, t + time);
    g.linearRampToValueAtTime(0.42, t + time + 0.6);
  }

  A.setMusic = function (on) {
    A.musicOn = on;
    if (A.musicBus) A.musicBus.gain.setTargetAtTime(on ? 0.42 : 0, A.ctx.currentTime, 0.05);
  };
  A.setSfx = function (on) {
    A.sfxOn = on;
    if (A.sfxBus) A.sfxBus.gain.setTargetAtTime(on ? 0.9 : 0, A.ctx.currentTime, 0.05);
  };

  // ------------------------------------------------------------ sound effects
  function sfx(fn) {
    init();
    if (!A.ctx) return;
    fn(A.ctx.currentTime + 0.01, A.sfxBus);
  }

  A.tap = () => sfx((t, bus) => osc('sine', 660, t, 0.06, 0.25, bus, { slideTo: 880, slideTime: 0.04 }));
  A.untap = () => sfx((t, bus) => osc('sine', 700, t, 0.06, 0.2, bus, { slideTo: 480, slideTime: 0.05 }));

  A.correct = () =>
    sfx((t, bus) => {
      osc('sine', N(76), t, 0.18, 0.35, bus);
      osc('sine', N(84), t + 0.1, 0.35, 0.35, bus);
      osc('triangle', N(88), t + 0.1, 0.3, 0.12, bus);
    });

  A.wrong = () =>
    sfx((t, bus) => {
      osc('sawtooth', 196, t, 0.22, 0.18, bus, { filter: { freq: 900 } });
      osc('sawtooth', 155, t + 0.16, 0.3, 0.18, bus, { filter: { freq: 700 } });
    });

  A.woof = () =>
    sfx((t, bus) => {
      [0, 0.22].forEach((d) => {
        osc('sawtooth', 520, t + d, 0.13, 0.35, bus, {
          slideTo: 190, slideTime: 0.12, filter: { type: 'bandpass', freq: 900, q: 1.8 },
        });
        noise(t + d, 0.08, 0.12, bus, 'bandpass', 1200, 1.2);
      });
    });

  A.whoosh = () => sfx((t, bus) => noise(t, 0.35, 0.25, bus, 'bandpass', 900, 0.6));

  // big celebration: drum roll + brass fanfare + cymbal crash + sparkles
  A.fanfare = () =>
    sfx((t, bus) => {
      duck(0.25, 2.6);
      for (let i = 0; i < 10; i++) noise(t + i * 0.035, 0.05, 0.18 + i * 0.02, bus, 'bandpass', 2400, 0.8);
      const t0 = t + 0.36;
      const brass = (m, at, dur, v = 0.16) => {
        [0, 7, -5].forEach((det) =>
          osc('sawtooth', N(m), at, dur, v, bus, { detune: det, attack: 0.02, filter: { freq: 2600, q: 1 } }));
      };
      brass(67, t0, 0.14);
      brass(72, t0 + 0.14, 0.14);
      brass(76, t0 + 0.28, 0.14);
      brass(79, t0 + 0.42, 0.22);
      brass(76, t0 + 0.66, 0.12);
      [72, 76, 79, 84].forEach((m) => brass(m, t0 + 0.8, 1.1, 0.1));
      osc('sine', N(48), t0 + 0.8, 0.9, 0.5, bus);
      kick(t0 + 0.8);
      noise(t0 + 0.8, 1.4, 0.35, bus, 'highpass', 5000);
      for (let i = 0; i < 12; i++) {
        osc('sine', N(84 + [0, 4, 7, 12][i % 4]), t0 + 0.9 + i * 0.07, 0.12, 0.08, bus);
      }
    });

  A.lessonComplete = () =>
    sfx((t, bus) => {
      duck(0.2, 3);
      const seq = [60, 64, 67, 72, 67, 72, 76, 79, 84];
      seq.forEach((m, i) => {
        osc('square', N(m), t + i * 0.11, 0.16, 0.08, bus, { filter: { freq: 3000 } });
        marimba(t + i * 0.11, N(m + 12), 0.12);
      });
      [72, 76, 79].forEach((m) => osc('triangle', N(m), t + 1.0, 1.2, 0.12, bus, { attack: 0.03 }));
    });

  A.heartLost = () =>
    sfx((t, bus) => osc('triangle', 440, t, 0.4, 0.25, bus, { slideTo: 110, slideTime: 0.35 }));

  // ------------------------------------------------------------ speech (TTS)
  // The language comes from the content pack (en-US for English, ko-KR for Korean).
  let voice = null;
  const lang = () => (window.PongoPack && window.PongoPack.lang) || 'en-US';
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    const full = lang();
    const base = full.split('-')[0];
    const exact = new RegExp('^' + full.replace('-', '[-_]'), 'i');
    voice =
      vs.find((v) => exact.test(v.lang) && /Google|Samantha|Aria|Jenny|Natural|Yuna|SunHi|Heami/i.test(v.name)) ||
      vs.find((v) => exact.test(v.lang)) ||
      vs.find((v) => new RegExp('^' + base, 'i').test(v.lang)) ||
      null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  A.canSpeak = () => 'speechSynthesis' in window;
  /** true when the device has a voice for the pack's language */
  A.hasVoice = () => {
    if (!A.canSpeak()) return false;
    if (!voice) pickVoice();
    return !!voice;
  };
  A.speak = function (text, slow) {
    if (!A.canSpeak()) return;
    try {
      if (!voice) pickVoice();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang();
      if (voice) u.voice = voice;
      u.rate = slow ? 0.6 : 0.92;
      u.pitch = 1.1;
      duck(0.35, 1.5 + text.length * 0.06);
      speechSynthesis.speak(u);
    } catch (e) {
      /* speech not available */
    }
  };

  A.init = init;
  window.PongoAudio = A;
})();
