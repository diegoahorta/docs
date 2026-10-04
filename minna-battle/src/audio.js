/* ==========================================================================
   Áudio — tudo sintetizado com Web Audio (sem arquivos externos):
   • música lo-fi "for study" gerada ao vivo (Rhodes, bateria com swing, vinil)
   • explosões e efeitos de acerto/erro
   ========================================================================== */
const Sound = (() => {
  let ctx = null, master, musicBus, musicOut, sfxOut, noiseBuf, crackleSrc = null;
  let musicOn = true, musicVol = 0.5, sfxVol = 0.8, playing = false;
  let nextTime = 0, step = 0, timer = null, wowLfo = null, wowGain = null;
  const BPM = 72, S16 = 60 / BPM / 4;               // duração de uma semicolcheia
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // Fmaj7 → Em7 → Dm9 → Cmaj7 (IV–iii–ii–I), clássico do lo-fi
  const CHORDS = [
    { bass: 41, notes: [53, 57, 60, 64] },
    { bass: 40, notes: [52, 55, 59, 62] },
    { bass: 38, notes: [50, 53, 57, 60, 64] },
    { bass: 36, notes: [55, 59, 60, 64] }
  ];
  const PENTA = [72, 74, 76, 79, 81, 84, 86, 88];

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
    // cadeia da música: filtro passa-baixa "abafado" típico de lo-fi
    musicOut = ctx.createGain(); musicOut.gain.value = musicOn ? musicVol : 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2300; lp.Q.value = 0.6;
    musicBus = ctx.createGain(); musicBus.connect(lp); lp.connect(musicOut); musicOut.connect(master);
    sfxOut = ctx.createGain(); sfxOut.gain.value = sfxVol; sfxOut.connect(master);
    // ruído branco reutilizável
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // "wow & flutter" de fita: LFO lento no detune das notas
    wowLfo = ctx.createOscillator(); wowLfo.frequency.value = 0.45;
    wowGain = ctx.createGain(); wowGain.gain.value = 7;
    wowLfo.connect(wowGain); wowLfo.start();
  }

  /* ---------------- música ---------------- */
  function startMusic() {
    if (!ctx || playing) return;
    playing = true; nextTime = ctx.currentTime + 0.1; step = 0;
    startCrackle();
    timer = setInterval(schedule, 25);
  }
  function stopMusic() {
    playing = false; clearInterval(timer); timer = null;
    if (crackleSrc) { try { crackleSrc.stop(); } catch (e) {} crackleSrc = null; }
  }
  function startCrackle() {
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.012;                       // chiado
      if (Math.random() < 0.0009) d[i] += (Math.random() * 2 - 1) * 0.6; // estalos do vinil
    }
    crackleSrc = ctx.createBufferSource(); crackleSrc.buffer = buf; crackleSrc.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
    const g = ctx.createGain(); g.gain.value = 0.35;
    crackleSrc.connect(hp); hp.connect(g); g.connect(musicOut); crackleSrc.start();
  }
  function schedule() {
    while (nextTime < ctx.currentTime + 0.15) {
      playStep(step, nextTime);
      const swing = (step % 2 === 0) ? 1.16 : 0.84;                  // swing nas semicolcheias
      nextTime += S16 * swing; step = (step + 1) % 64;
    }
  }
  function playStep(s, t) {
    const bar = Math.floor(s / 16), b = s % 16, ch = CHORDS[bar % 4];
    if (b === 0) { ch.notes.forEach((n, i) => ep(t + i * 0.012, n, 0.55, S16 * 13)); bass(t, ch.bass, S16 * 7); }
    if (b === 10) { ch.notes.slice(1).forEach((n, i) => ep(t + i * 0.01, n, 0.28, S16 * 5)); bass(t, ch.bass + 12, S16 * 4); }
    if (b === 0 || b === 7 || (b === 10 && bar % 2)) kick(t, b === 0 ? 0.9 : 0.6);
    if (b === 4 || b === 12) snare(t);
    if (b % 2 === 0) hat(t, b % 4 === 0 ? 0.05 : 0.03);
    if (b % 2 === 1 && Math.random() < 0.25) hat(t, 0.015);
    if (b % 2 === 0 && bar % 2 === 1 && Math.random() < 0.3) {
      ep(t, PENTA[Math.floor(Math.random() * PENTA.length)], 0.22, S16 * 3, true);
    }
  }
  function ep(t, midi, vel, dur, lead) {              // piano elétrico (Rhodes)
    const f = mtof(midi), out = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
    const g2 = ctx.createGain(), g3 = ctx.createGain();
    o1.type = "triangle"; o1.frequency.value = f;
    o2.type = "sine"; o2.frequency.value = f * 2; g2.gain.value = 0.25;
    o3.type = "sine"; o3.frequency.value = f * 4.01; g3.gain.setValueAtTime(0.12, t); g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    [o1, o2, o3].forEach(o => wowGain.connect(o.detune));
    o1.connect(out); o2.connect(g2); g2.connect(out); o3.connect(g3); g3.connect(out);
    const peak = vel * (lead ? 0.12 : 0.085);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(peak, t + 0.015);
    out.gain.exponentialRampToValueAtTime(peak * 0.35, t + 1.2);
    out.gain.setValueAtTime(peak * 0.35, t + dur);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7);
    if (pan) { pan.pan.value = (Math.random() - 0.5) * 0.5; out.connect(pan); pan.connect(musicBus); } else out.connect(musicBus);
    if (lead) {                                        // eco na melodia
      const dl = ctx.createDelay(); dl.delayTime.value = S16 * 3; const fb = ctx.createGain(); fb.gain.value = 0.35;
      out.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(musicBus);
      setTimeout(() => { try { fb.disconnect(); } catch (e) {} }, (dur + 3) * 1000);
    }
    [o1, o2, o3].forEach(o => { o.start(t); o.stop(t + dur + 0.8); });
  }
  function bass(t, midi, dur) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = mtof(midi);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.12, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.3);
  }
  function kick(t, v) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(125, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(v * 0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.4);
  }
  function noise(t, dur, type, freq, q, vol, dest) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    return { f, g };
  }
  function snare(t) {
    noise(t, 0.2, "bandpass", 1700, 0.8, 0.22, musicBus);
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 185;
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.1);
  }
  function hat(t, v) { noise(t, 0.05, "highpass", 7500, 0.7, v, musicBus); }

  /* ---------------- efeitos ---------------- */
  function tone(t, f, dur, type, vol, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxOut); o.start(t); o.stop(t + dur + 0.05);
  }
  function boom(t, size) {                              // explosão: ruído com varredura + grave
    const n = noise(t, 0.5 + size * 0.7, "lowpass", 7000, 0.5, 0.55 + size * 0.35, sfxOut);
    n.f.frequency.setValueAtTime(7000, t); n.f.frequency.exponentialRampToValueAtTime(140, t + 0.4 + size * 0.6);
    tone(t, 95, 0.45 + size * 0.5, "sine", 0.9, 28);
    tone(t + 0.01, 60, 0.6 + size * 0.5, "triangle", 0.45, 22);
  }
  function taiko(t, v) { tone(t, 110, 0.35, "sine", v, 55); noise(t, 0.08, "lowpass", 900, 0.5, v * 0.5, sfxOut); }
  function gong(t) {
    [110, 164.8, 220.6, 291, 349].forEach((f, i) => tone(t, f, 2.2 - i * 0.25, "sine", 0.12 - i * 0.015));
  }
  const PITCH = { S: 72, D: 74, V: 76, O: 79, A: 81 };
  const api = {
    init, startMusic, stopMusic,
    get musicOn() { return musicOn; },
    setMusic(on) { musicOn = on; if (musicOut) musicOut.gain.setTargetAtTime(on ? musicVol : 0, ctx.currentTime, 0.2); },
    setMusicVol(v) { musicVol = v; if (musicOut && musicOn) musicOut.gain.setTargetAtTime(v, ctx.currentTime, 0.1); },
    setSfxVol(v) { sfxVol = v; if (sfxOut) sfxOut.gain.setTargetAtTime(v, ctx.currentTime, 0.05); },
    click() { if (!ctx) return; tone(ctx.currentTime, 880, 0.05, "square", 0.04); },
    place(type) {                                       // cada cor de chunk tem uma nota (koto)
      if (!ctx) return; const t = ctx.currentTime, f = mtof(PITCH[type] || 76);
      tone(t, f, 0.35, "triangle", 0.22); tone(t, f * 2, 0.12, "sine", 0.06);
    },
    unplace() { if (!ctx) return; tone(ctx.currentTime, 330, 0.08, "triangle", 0.12, 220); },
    success(combo) {                                    // explosão sonora do acerto
      if (!ctx) return; const t = ctx.currentTime;
      boom(t, 0.6 + Math.min(combo, 5) * 0.08);
      const w = noise(t, 0.5, "bandpass", 400, 2, 0.3, sfxOut);
      w.f.frequency.setValueAtTime(300, t); w.f.frequency.exponentialRampToValueAtTime(5000, t + 0.45);
      const base = 72 + Math.min(combo, 6) * 2;
      [0, 2, 4, 7, 9, 12, 14, 16, 19].forEach((iv, i) => {
        tone(t + 0.08 + i * 0.045, mtof(base + iv), 0.4, "triangle", 0.16);
        tone(t + 0.08 + i * 0.045, mtof(base + iv + 12), 0.25, "sine", 0.05);
      });
      taiko(t, 0.6); taiko(t + 0.14, 0.45);
      if (combo >= 3) gong(t + 0.05);
    },
    error() {
      if (!ctx) return; const t = ctx.currentTime;
      tone(t, 220, 0.25, "square", 0.08, 180); tone(t + 0.22, 160, 0.45, "square", 0.08, 110);
      tone(t, 70, 0.3, "sine", 0.5, 40);
    },
    hint() { if (!ctx) return; const t = ctx.currentTime; [88, 91, 96].forEach((m, i) => tone(t + i * 0.06, mtof(m), 0.3, "sine", 0.08)); },
    spawn() { if (!ctx) return; const t = ctx.currentTime; taiko(t, 0.5); taiko(t + 0.12, 0.35); },
    oni() {
      if (!ctx) return; const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = "sawtooth"; o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(60, t + 0.7);
      f.type = "lowpass"; f.frequency.value = 500;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o.connect(f); f.connect(g); g.connect(sfxOut); o.start(t); o.stop(t + 0.85);
      taiko(t, 0.7); taiko(t + 0.25, 0.7);
    },
    hit() { if (!ctx) return; boom(ctx.currentTime, 0.35); },
    shoot() { if (!ctx) return; const t = ctx.currentTime; tone(t, 1400, 0.08, "sine", 0.025, 500); },
    destroy() { if (!ctx) return; const t = ctx.currentTime; boom(t, 1.2); boom(t + 0.25, 0.8); gong(t + 0.1); for (let i = 0; i < 6; i++) taiko(t + 0.3 + i * 0.09, 0.5); },
    tick() { if (!ctx) return; tone(ctx.currentTime, 1200, 0.05, "sine", 0.06); },
    victory() {
      if (!ctx) return; const t = ctx.currentTime;
      [60, 64, 67, 72, 67, 72, 76, 79].forEach((m, i) => { tone(t + i * 0.13, mtof(m), 0.5, "triangle", 0.18); tone(t + i * 0.13, mtof(m + 12), 0.3, "sine", 0.06); });
      [72, 76, 79, 84].forEach(m => tone(t + 1.1, mtof(m), 1.6, "triangle", 0.1));
      gong(t + 1.1);
    },
    defeat() { if (!ctx) return; const t = ctx.currentTime; [67, 63, 60, 55].forEach((m, i) => tone(t + i * 0.28, mtof(m), 0.6, "triangle", 0.15)); }
  };
  return api;
})();
