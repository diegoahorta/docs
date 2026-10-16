// Renderiza a trilha do trailer com o motor drum and bass do jogo (OfflineAudioContext).
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [linhaArq, saida] = process.argv.slice(2);
const L = JSON.parse(fs.readFileSync(linhaArq, 'utf8'));
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (e) => console.log('pageerror:', e.message));
p.on('console', (m) => console.log('console:', m.text()));
await p.goto('http://localhost:8765/jogo/index.html#trilha');
const b64 = await p.evaluate(async (L) => {
  const { Audio, MUSICAS } = await import('/jogo/js/audio.js');
  const sr = 48000;
  const ctx = new OfflineAudioContext(2, Math.ceil(sr * L.fim), sr);
  window.AudioContext = function () { return ctx; };
  const a = new Audio();
  a.modo = 'dnb';
  a.iniciar();
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // ---------- efeitos de trailer ----------
  const ruido = (t, dur, tipo, f0, f1, v, q = 0.8, destino = a.mestre) => {
    const n = ctx.createBufferSource(); n.buffer = a.ruido; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = tipo; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    return { n, f, g, ligar() { n.connect(f).connect(g).connect(destino); n.start(t); n.stop(t + dur + 0.05); return g; } };
  };
  const trovao = (t) => {
    const r = ruido(t, 3.2, 'lowpass', 900, 120, 1); const g = r.ligar();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    const s = ctx.createGain(); s.gain.value = 0.5; g.connect(s).connect(a.envioReverb);
  };
  const boom = (t, forca = 1) => {
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.6);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.2 * forca, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.connect(g).connect(a.mestre); o.start(t); o.stop(t + 2.3);
    const r = ruido(t, 1.4, 'lowpass', 4000, 200, 1); const gn = r.ligar();
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.7 * forca, t + 0.005); gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    const s = ctx.createGain(); s.gain.value = 0.6; gn.connect(s).connect(a.envioReverb);
    a.caixa(t, 1.2 * forca);
  };
  const subida = (t0, t1) => {
    const r = ruido(t0, t1 - t0, 'bandpass', 300, 9000, 1, 2.5); const g = r.ligar();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.55, t1 - 0.02); g.gain.linearRampToValueAtTime(0.0001, t1);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(880, t1);
    const lp = ctx.createBiquadFilter(); lp.frequency.value = 2500;
    const go = ctx.createGain(); go.gain.setValueAtTime(0.0001, t0); go.gain.exponentialRampToValueAtTime(0.12, t1 - 0.02); go.gain.linearRampToValueAtTime(0.0001, t1);
    o.connect(lp).connect(go).connect(a.mestre); o.start(t0); o.stop(t1);
  };
  const vento = (t, v = 0.35) => {
    const r = ruido(t, 0.35, 'bandpass', 600, 5000, 1, 1.2); const g = r.ligar();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  };
  const drone = (t, dur, nota, v) => {
    for (const d of [-0.01, 0.01]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(nota) * (1 + d);
      const lp = ctx.createBiquadFilter(); lp.frequency.setValueAtTime(140, t); lp.frequency.linearRampToValueAtTime(700, t + dur * 0.8); lp.Q.value = 4;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.3); g.gain.setValueAtTime(v, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp).connect(g).connect(a.mestre); o.start(t); o.stop(t + dur);
    }
    const s = ctx.createOscillator(); s.frequency.value = midi(nota) / 2;
    const gs = ctx.createGain(); gs.gain.setValueAtTime(0.0001, t); gs.gain.exponentialRampToValueAtTime(v * 1.6, t + 1.5); gs.gain.setValueAtTime(v * 1.6, t + dur - 0.5); gs.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(gs).connect(a.mestre); s.start(t); s.stop(t + dur);
  };

  // ---------- abertura (0 até o início da música) ----------
  drone(0, L.inicio_musica + 0.4, 41, 0.035);
  a.pad(0.2, [53, 56, 60, 65], 6.5, 0.4);
  a.pad(6.0, [52, 55, 59, 64], 4.5, 0.45);
  a.pad(10.0, [49, 53, 56, 61], 4.6, 0.55);
  for (const t of L.trovoes) trovao(t);
  boom(L.impactos[0], 0.8);
  a.sirene(6.2, 3.5);
  boom(8.0, 0.9);
  boom(L.impactos[1], 1);
  for (let i = 0; i < 8; i++) a.chimbal(12.65 + i * L.bar / 4, 0.4 + i * 0.05, false, true);
  subida(12.6, L.drop);

  // ---------- música do chefe, do compasso 0 até a virada para o título ----------
  const m = MUSICAS.chefe;
  const dur = 60 / m.bpm / 4;
  a.compasso = 0; a.passo = 0;
  for (let t = L.inicio_musica; t < L.titulo - 0.001; t += dur) {
    a.tocarPasso(m, a.passo, t, dur);
    if (++a.passo === 16) { a.passo = 0; a.compasso++; }
  }
  boom(L.drop, 1.1);
  // ventos nos cortes da montagem (a cada 2 compassos)
  for (let t = L.drop + 2 * L.bar; t < L.titulo - 1; t += 2 * L.bar) vento(t - 0.12, 0.25);
  // subida antes do título
  subida(L.titulo - L.bar, L.titulo);

  // ---------- título e final ----------
  boom(L.titulo, 1.3);
  drone(L.titulo, L.fim - L.titulo, 41, 0.05);
  a.pad(L.titulo, [53, 56, 60, 65], 3.2, 1);
  a.pad(L.titulo + 3.1, [56, 60, 63, 68], 4.2, 1);
  a.sirene(L.titulo + 0.3, 3);
  boom(L.fim - 3.4, 0.7);

  const buf = await ctx.startRendering();
  // normaliza e codifica WAV 16 bits
  const ch = [buf.getChannelData(0), buf.getChannelData(1)];
  let pico = 0; for (const c of ch) for (const v of c) pico = Math.max(pico, Math.abs(v));
  const ganho = 0.89 / pico;
  const n = buf.length, dados = new DataView(new ArrayBuffer(44 + n * 4));
  const esc = (o, s) => [...s].forEach((c, i) => dados.setUint8(o + i, c.charCodeAt(0)));
  esc(0, 'RIFF'); dados.setUint32(4, 36 + n * 4, true); esc(8, 'WAVEfmt '); dados.setUint32(16, 16, true);
  dados.setUint16(20, 1, true); dados.setUint16(22, 2, true); dados.setUint32(24, sr, true); dados.setUint32(28, sr * 4, true);
  dados.setUint16(32, 4, true); dados.setUint16(34, 16, true); esc(36, 'data'); dados.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) dados.setInt16(44 + i * 4 + c * 2, Math.max(-1, Math.min(1, ch[c][i] * ganho)) * 32767, true);
  let bin = ''; const u8 = new Uint8Array(dados.buffer);
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(bin);
}, L);
fs.writeFileSync(saida, Buffer.from(b64, 'base64'));
await b.close();
