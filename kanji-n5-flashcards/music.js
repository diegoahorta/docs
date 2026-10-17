/* Trilha sonora original estilo City Pop, sintetizada em tempo real (Web Audio API).
   "Neon Sakura Drive" — 108 BPM, em Fá maior: piano elétrico, baixo funky, bateria eletrônica,
   pad de cordas e um lead tipo synth-sax. Composição original (não usa gravações de terceiros). */
(function () {
  'use strict';
  let ctx = null, master, musicBus, sfxBus, epBus, reverb, revSend, delay, delaySend;
  let playing = false, timer = null, nextTime = 0, step = 0, noiseBuf = null;
  let musicVol = 0.55, sfxVol = 0.8;

  const BPM = 108, S16 = 60 / BPM / 4;
  const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // Cada compasso: um ou dois acordes [baixo, [voicing do piano]]
  const PROG = [
    [[41, [57, 60, 64, 67]]],                          // Fmaj9
    [[40, [55, 59, 62, 64]], [45, [55, 61, 64, 65]]],  // Em7  | A7(b13)
    [[38, [53, 57, 60, 64]]],                          // Dm9
    [[36, [51, 55, 58, 62]], [41, [51, 57, 60, 67]]],  // Cm7  | F7(9)
    [[34, [57, 60, 62, 65]]],                          // B♭maj9
    [[45, [55, 57, 60, 64]], [38, [54, 57, 60, 64]]],  // Am7  | D7(9)
    [[43, [58, 62, 65, 69]]],                          // Gm9
    [[36, [58, 62, 65, 67]], [36, [58, 64, 67, 69]]]   // C9sus4 | C13
  ];
  // Melodia original: [compasso, passo(16avos), nota MIDI, duração em 16avos]
  const LEAD = [
    [0, 0, 81, 2], [0, 2, 84, 2], [0, 4, 88, 5], [0, 10, 86, 2], [0, 12, 84, 4],
    [1, 0, 83, 2], [1, 2, 81, 2], [1, 4, 79, 3], [1, 8, 76, 2], [1, 10, 79, 2], [1, 12, 81, 4],
    [2, 0, 77, 3], [2, 3, 76, 1], [2, 4, 77, 2], [2, 6, 81, 2], [2, 8, 84, 6],
    [3, 0, 82, 2], [3, 2, 79, 2], [3, 4, 75, 4], [3, 8, 81, 2], [3, 10, 84, 2], [3, 12, 87, 4],
    [4, 0, 86, 6], [4, 6, 84, 2], [4, 8, 81, 4], [4, 12, 77, 4],
    [5, 0, 79, 2], [5, 2, 76, 2], [5, 4, 72, 4], [5, 8, 78, 2], [5, 10, 81, 2], [5, 12, 84, 4],
    [6, 0, 82, 4], [6, 4, 81, 2], [6, 6, 77, 2], [6, 8, 74, 8],
    [7, 0, 79, 2], [7, 2, 81, 2], [7, 4, 82, 4], [7, 8, 76, 2], [7, 10, 79, 2], [7, 12, 82, 4]
  ];
  const BASS = [[0, 0, 3], [3, 0, 1], [4, 12, 1], [6, 7, 2], [8, 0, 2], [10, 12, 1], [11, 7, 1], [14, 0, 2]];
  const COMP = [[0, 4], [6, 2], [10, 3], [14, 2]];

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -14; master.ratio.value = 3;
    master.connect(ctx.destination);

    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxVol; sfxBus.connect(master);

    // reverb sintético
    reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    reverb.buffer = ir;
    revSend = ctx.createGain(); revSend.gain.value = 0.32;
    revSend.connect(reverb); reverb.connect(musicBus);

    // delay em colcheia pontuada
    delay = ctx.createDelay(1); delay.delayTime.value = S16 * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
    delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(musicBus);
    delaySend = ctx.createGain(); delaySend.gain.value = 0.22; delaySend.connect(delay);

    // barramento do piano elétrico com trêmolo
    epBus = ctx.createGain(); epBus.gain.value = 0.8;
    const trem = ctx.createOscillator(), tremAmt = ctx.createGain();
    trem.frequency.value = 4.6; tremAmt.gain.value = 0.18;
    trem.connect(tremAmt); tremAmt.connect(epBus.gain); trem.start();
    epBus.connect(musicBus); epBus.connect(revSend);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  function env(g, t, a, peak, d, sus, rel, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
    g.gain.setValueAtTime(Math.max(0.0001, peak * sus), end);
    g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
  }

  /* ---------------------------------------------------------------- instrumentos */
  function rhodes(note, t, dur, vel) {
    const f = mtof(note);
    const car = ctx.createOscillator(), mod = ctx.createOscillator();
    const modGain = ctx.createGain(), out = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    car.type = 'sine'; mod.type = 'sine';
    car.frequency.value = f; mod.frequency.value = f;
    modGain.gain.setValueAtTime(f * 1.4, t);
    modGain.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.5);
    mod.connect(modGain); modGain.connect(car.frequency);
    env(out, t, 0.006, 0.09 * vel, 0.9, 0.35, 0.35, t + dur);
    car.connect(out);
    if (pan) { pan.pan.value = (Math.random() - 0.5) * 0.6; out.connect(pan); pan.connect(epBus); } else out.connect(epBus);
    car.start(t); mod.start(t);
    car.stop(t + dur + 0.5); mod.stop(t + dur + 0.5);
  }

  function bass(note, t, dur) {
    const f = mtof(note);
    const o = ctx.createOscillator(), sub = ctx.createOscillator();
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; sub.type = 'sine';
    o.frequency.value = f; sub.frequency.value = f;
    lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(2200, t);
    lp.frequency.exponentialRampToValueAtTime(380, t + 0.18);
    env(g, t, 0.004, 0.32, 0.25, 0.55, 0.06, t + dur);
    o.connect(lp); sub.connect(lp); lp.connect(g); g.connect(musicBus);
    o.start(t); sub.start(t); o.stop(t + dur + 0.1); sub.stop(t + dur + 0.1);
  }

  function pad(notes, t, dur) {
    notes.forEach((n) => {
      [-7, 7].forEach((det) => {
        const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = mtof(n + 12); o.detune.value = det;
        lp.type = 'lowpass'; lp.frequency.value = 1400;
        env(g, t, 0.45, 0.012, 0.6, 0.8, 0.5, t + dur - 0.2);
        o.connect(lp); lp.connect(g); g.connect(musicBus); g.connect(revSend);
        o.start(t); o.stop(t + dur + 0.6);
      });
    });
  }

  function lead(note, t, dur) {
    const f = mtof(note);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    const vib = ctx.createOscillator(), vibAmt = ctx.createGain();
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o1.type = 'sawtooth'; o2.type = 'square';
    o1.frequency.value = f; o2.frequency.value = f; o2.detune.value = 6;
    vib.frequency.value = 5.2; vibAmt.gain.setValueAtTime(0, t);
    vibAmt.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(dur, 0.35));
    vib.connect(vibAmt); vibAmt.connect(o1.frequency); vibAmt.connect(o2.frequency);
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.linearRampToValueAtTime(2600, t + 0.08);
    lp.frequency.exponentialRampToValueAtTime(1500, t + dur);
    env(g, t, 0.03, 0.05, 0.2, 0.75, 0.12, t + dur);
    o1.connect(lp); o2.connect(lp); lp.connect(g);
    g.connect(musicBus); g.connect(delaySend); g.connect(revSend);
    [o1, o2, vib].forEach((o) => { o.start(t); o.stop(t + dur + 0.2); });
  }

  function noise(t, dur, type, freq, gain, dest) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || musicBus);
    s.start(t); s.stop(t + dur + 0.02);
    return g;
  }

  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(0.75, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.4);
  }
  function snare(t, v) {
    const n = noise(t, 0.2, 'bandpass', 1900, 0.32 * v);
    n.connect(revSend);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 196;
    g.gain.setValueAtTime(0.18 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.12);
  }
  const hat = (t, open, v) => noise(t, open ? 0.28 : 0.045, 'highpass', 8200, (open ? 0.07 : 0.06) * v);

  /* ---------------------------------------------------------------- sequenciador */
  function schedule(i, t) {
    const pos = i % 128, bar = Math.floor(pos / 16), s = pos % 16, pass = Math.floor(i / 128);
    const chords = PROG[bar];
    const chord = chords.length > 1 && s >= 8 ? chords[1] : chords[0];
    const intro = pass === 0 && bar < 2;

    // bateria
    if (!intro) {
      if (s === 0 || s === 8 || s === 10 || (bar % 2 === 1 && s === 14)) kick(t);
      if (s === 4 || s === 12) snare(t, 1);
      if (s === 15 && bar % 4 === 3) snare(t, 0.35);
      if (s % 2 === 0) hat(t, s === 14 && bar % 2 === 0, s % 4 === 2 ? 1 : 0.6);
      else if (bar % 2 === 1) hat(t, false, 0.35);
    }
    // baixo
    if (!intro) {
      BASS.forEach(([st, iv, len]) => {
        if (st !== s) return;
        const c = chords.length > 1 && st >= 8 ? chords[1] : chords[0];
        bass(c[0] + iv, t, len * S16 * 0.9);
      });
    }
    // piano elétrico
    COMP.forEach(([st, len]) => {
      if (st !== s) return;
      const c = chords.length > 1 && st >= 8 ? chords[1] : chords[0];
      c[1].forEach((n, k) => rhodes(n, t + k * 0.008, len * S16, st === 0 ? 1 : 0.75));
    });
    // pad
    if (s === 0 || (chords.length > 1 && s === 8)) pad(chord[1], t, (chords.length > 1 ? 8 : 16) * S16);
    // melodia nas voltas ímpares
    if (pass % 2 === 1) {
      LEAD.forEach(([b, st, n, len]) => { if (b === bar && st === s) lead(n, t, len * S16 * 0.95); });
    }
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.15) {
      schedule(step, nextTime);
      // leve swing nas semicolcheias pares
      nextTime += S16 * (step % 2 === 0 ? 1.08 : 0.92);
      step++;
    }
  }

  const Music = {
    get playing() { return playing; },
    unlock() { if (init() && ctx.state === 'suspended') ctx.resume(); },
    start() {
      if (!init()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      if (playing) return true;
      playing = true;
      step = 0; nextTime = ctx.currentTime + 0.1;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
      musicBus.gain.linearRampToValueAtTime(musicVol, ctx.currentTime + 1.2);
      timer = setInterval(tick, 25);
      tick();
      return true;
    },
    stop() {
      if (!playing) return;
      playing = false;
      clearInterval(timer);
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
      musicBus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    },
    setSfx(on) { sfxVol = on ? 0.8 : 0; if (sfxBus) sfxBus.gain.value = sfxVol; },
    sfx(name) {
      if (!sfxVol || !init()) return;
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime + 0.01;
      const tone = (n, at, d, type, v) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || 'triangle'; o.frequency.value = mtof(n);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(v || 0.22, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, at + d);
        o.connect(g); g.connect(sfxBus); o.start(at); o.stop(at + d + 0.05);
      };
      if (name === 'correct') [84, 88, 91, 96].forEach((n, i) => tone(n, t + i * 0.06, 0.35));
      else if (name === 'combo') [84, 88, 91, 96, 100, 103].forEach((n, i) => tone(n, t + i * 0.05, 0.4, 'sine', 0.25));
      else if (name === 'wrong') { tone(64, t, 0.22, 'square', 0.07); tone(59, t + 0.16, 0.35, 'square', 0.07); }
      else if (name === 'flip') noise(t, 0.12, 'bandpass', 2400, 0.12, sfxBus);
      else if (name === 'click') tone(91, t, 0.08, 'sine', 0.12);
      else if (name === 'match') { tone(79, t, 0.2, 'sine', 0.2); tone(86, t + 0.07, 0.3, 'sine', 0.2); }
      else if (name === 'win') [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => tone(n, t + i * 0.11, 0.45, 'triangle', 0.2));
    }
  };
  window.Music = Music;
})();
