// Trilha sonora drum and bass sintetizada em tempo real com a Web Audio API,
// mais os efeitos sonoros. Também toca as faixas MP3 de assets/audio como alternativa.
import { ASSETS, recurso } from './config.js';

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Progressão em Fá menor: Fm – Db – Ab – Eb (dois compassos por acorde).
const ACORDES = {
  menor: [
    { baixo: 41, notas: [53, 56, 60, 65] },
    { baixo: 37, notas: [49, 53, 56, 61] },
    { baixo: 44, notas: [48, 51, 56, 60] },
    { baixo: 39, notas: [51, 55, 58, 63] },
  ],
  chefe: [
    { baixo: 41, notas: [53, 56, 60, 65] },
    { baixo: 40, notas: [52, 55, 59, 64] },
    { baixo: 37, notas: [49, 53, 56, 61] },
    { baixo: 36, notas: [48, 52, 55, 60] },
  ],
  vitoria: [
    { baixo: 44, notas: [56, 60, 63, 68] },
    { baixo: 41, notas: [53, 56, 60, 65] },
    { baixo: 37, notas: [49, 53, 56, 61] },
    { baixo: 39, notas: [51, 55, 58, 63] },
  ],
};

// Batidas (16 semicolcheias por compasso). v = volume.
const BATIDAS = {
  // two-step clássico
  dois: { bumbo: [0, 10], caixa: [4, 12], fantasma: [7, 9, 15], chimbal: [0, 2, 4, 6, 8, 10, 12, 14], aberto: [14] },
  // quebrada no estilo "amen"
  amen: { bumbo: [0, 2, 10, 11], caixa: [4, 7, 12, 15], fantasma: [1, 9, 14], chimbal: [0, 2, 4, 6, 8, 10, 12, 14], aberto: [6] },
  // mais pesada para o chefe
  pesada: { bumbo: [0, 3, 8, 10, 11], caixa: [4, 12], fantasma: [6, 7, 9, 14, 15], chimbal: [...Array(16).keys()], aberto: [2, 10] },
  // liquid: leve e espaçada
  liquid: { bumbo: [0, 10], caixa: [4, 12], fantasma: [11], chimbal: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14], aberto: [] },
};

const MUSICAS = {
  menu: { bpm: 172, acordes: 'menor', batidas: ['liquid', 'liquid', 'liquid', 'dois'], baixo: 'sub', pad: 0.5, arpejo: 0.22, intro: 4 },
  grajau: { bpm: 172, acordes: 'menor', batidas: ['dois', 'amen', 'dois', 'liquid'], baixo: 'reese', pad: 0.32, arpejo: 0.16, stab: true, intro: 2 },
  fase1: { bpm: 174, acordes: 'menor', batidas: ['dois', 'dois', 'amen', 'dois'], baixo: 'reese', pad: 0.28, arpejo: 0.1, stab: true, intro: 2 },
  fase2: { bpm: 174, acordes: 'menor', batidas: ['amen', 'dois', 'amen', 'amen'], baixo: 'reese', pad: 0.24, arpejo: 0.14, stab: true, intro: 2 },
  fase3: { bpm: 175, acordes: 'menor', batidas: ['amen', 'amen', 'dois', 'amen'], baixo: 'reese', pad: 0.2, arpejo: 0.18, stab: true, intro: 2 },
  chefe: { bpm: 178, acordes: 'chefe', batidas: ['pesada', 'amen', 'pesada', 'pesada'], baixo: 'neuro', pad: 0.18, sirene: true, stab: true, intro: 1 },
  vitoria: { bpm: 170, acordes: 'vitoria', batidas: ['liquid', 'dois', 'liquid', 'dois'], baixo: 'sub', pad: 0.55, arpejo: 0.28, intro: 2 },
};

// Faixa MP3 do repositório usada no modo alternativo, por música.
const FAIXAS_MP3 = { menu: 5, grajau: 4, fase1: 1, fase2: 2, fase3: 3, chefe: 4, vitoria: 5 };

// Linha de baixo por compasso: [passo, semitom relativo à fundamental, duração em passos]
const LINHAS_BAIXO = [
  [[0, 0, 6], [6, 0, 2], [10, 12, 3], [14, 7, 2]],
  [[0, 0, 3], [3, 0, 3], [8, -2, 4], [12, 3, 4]],
];

export class Audio {
  constructor() {
    this.ctx = null;
    this.modo = lerPreferencia('musica', 'dnb'); // 'dnb' | 'mp3' | 'mudo'
    this.musica = null;
    this.mp3 = null;
  }

  iniciar() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());

    this.mestre = ctx.createGain();
    this.mestre.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.15;
    this.mestre.connect(comp).connect(ctx.destination);

    this.musicaGanho = ctx.createGain();
    this.musicaGanho.gain.value = this.modo === 'dnb' ? 0.7 : 0;
    this.musicaGanho.connect(this.mestre);
    this.sfxGanho = ctx.createGain();
    this.sfxGanho.gain.value = 0.9;
    this.sfxGanho.connect(this.mestre);

    this.bateria = ctx.createGain();
    this.bateria.gain.value = 0.9;
    this.bateria.connect(this.musicaGanho);
    this.grave = ctx.createGain(); // baixo, com "sidechain" pelo bumbo
    this.grave.connect(this.musicaGanho);
    this.harmonia = ctx.createGain();
    this.harmonia.connect(this.musicaGanho);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.respostaImpulso(2.6);
    const retorno = ctx.createGain();
    retorno.gain.value = 0.35;
    this.reverb.connect(retorno).connect(this.musicaGanho);
    this.envioReverb = ctx.createGain();
    this.envioReverb.connect(this.reverb);

    this.ruido = this.bufferRuido(2);

    this.passo = 0;
    this.compasso = 0;
    this.proximo = 0;
    setInterval(() => this.agendar(), 25);
    if (this.musica) this.tocar(this.musica, true);
  }

  // ---------- Controle ----------
  tocar(nome, forcar = false) {
    if (this.musica === nome && !forcar) return;
    this.musica = nome;
    if (!this.ctx) return;
    this.compasso = 0;
    this.passo = 0;
    this.proximo = this.ctx.currentTime + 0.05;
    this.atualizarMp3();
  }

  alternarModo() {
    const ordem = ['dnb', 'mp3', 'mudo'];
    this.modo = ordem[(ordem.indexOf(this.modo) + 1) % ordem.length];
    salvarPreferencia('musica', this.modo);
    if (this.ctx) {
      this.musicaGanho.gain.setTargetAtTime(this.modo === 'dnb' ? 0.7 : 0, this.ctx.currentTime, 0.05);
    }
    this.atualizarMp3();
    return this.modo;
  }

  descricaoModo() {
    return { dnb: 'DRUM AND BASS', mp3: 'TRILHA MP3', mudo: 'SEM MUSICA' }[this.modo];
  }

  atualizarMp3() {
    if (this.modo !== 'mp3' || !this.musica) {
      if (this.mp3) this.mp3.pause();
      return;
    }
    const src = `${ASSETS}audio/musica/bgm_action_${FAIXAS_MP3[this.musica] || 1}.mp3`;
    if (!this.mp3) {
      this.mp3 = new window.Audio();
      this.mp3.loop = true;
      this.mp3.volume = 0.55;
    }
    if (this.mp3Faixa !== src) {
      this.mp3Faixa = src;
      this.mp3.src = recurso(src);
    }
    this.mp3.play().catch(() => {});
  }

  // ---------- Sequenciador ----------
  agendar() {
    if (!this.musica || this.modo !== 'dnb' || this.ctx.state !== 'running') {
      if (this.ctx) this.proximo = Math.max(this.proximo, this.ctx.currentTime + 0.05);
      return;
    }
    const m = MUSICAS[this.musica];
    const dur = 60 / m.bpm / 4;
    while (this.proximo < this.ctx.currentTime + 0.12) {
      this.tocarPasso(m, this.passo, this.proximo, dur);
      this.proximo += dur;
      this.passo++;
      if (this.passo === 16) {
        this.passo = 0;
        this.compasso++;
      }
    }
  }

  tocarPasso(m, passo, t, dur) {
    const c = this.compasso;
    const ciclo = c % 32;
    const intro = c < m.intro;
    const pausa = ciclo >= 28; // breakdown: só pads e baixo
    const virada = c % 8 === 7 && passo >= 12 && !intro;
    const acorde = ACORDES[m.acordes][Math.floor(c / 2) % 4];
    const bat = BATIDAS[m.batidas[c % m.batidas.length]];

    // Bateria
    if (!intro && !pausa) {
      if (virada) {
        this.caixa(t, 0.35 + (passo - 12) * 0.15);
        if (passo % 2) this.caixa(t + dur / 2, 0.3 + (passo - 12) * 0.12);
      } else {
        if (bat.bumbo.includes(passo)) this.bumbo(t);
        if (bat.caixa.includes(passo)) this.caixa(t, 1);
        if (bat.fantasma.includes(passo)) this.caixa(t, 0.22);
      }
    }
    if (!pausa || ciclo % 2) {
      if (bat.chimbal.includes(passo)) this.chimbal(t, passo % 4 === 2 ? 0.5 : 0.28, false, intro);
      if (bat.aberto.includes(passo) && !intro) this.chimbal(t, 0.35, true);
    }

    // Baixo
    if (!intro || m.baixo === 'sub') {
      const linha = LINHAS_BAIXO[c % 2];
      for (const [p, semi, passos] of linha) {
        if (p !== passo) continue;
        if (pausa && p !== 0) continue;
        const f = midi(acorde.baixo + semi);
        if (m.baixo === 'sub') this.baixoSub(t, f, passos * dur);
        else this.baixoReese(t, f, passos * dur, m.baixo === 'neuro');
      }
    }

    // Harmonia
    if (passo === 0 && c % 2 === 0) this.pad(t, acorde.notas, dur * 32, m.pad);
    if (m.arpejo && !pausa && [0, 3, 6, 8, 11, 14].includes(passo) && ciclo >= 4) {
      const i = [0, 3, 6, 8, 11, 14].indexOf(passo);
      this.pluck(t, midi(acorde.notas[(i + c) % 4] + 12), m.arpejo);
    }
    if (m.stab && !intro && !pausa && c % 4 === 3 && (passo === 6 || passo === 9)) {
      this.stab(t, acorde.notas, 0.18);
    }
    if (m.sirene && !intro && c % 4 === 0 && passo === 0) this.sirene(t, dur * 16);
  }

  // ---------- Instrumentos ----------
  env(g, t, ataque, pico, queda) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + queda);
  }

  bumbo(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    this.env(g, t, 0.002, 1.1, 0.32);
    o.connect(g).connect(this.bateria);
    o.start(t);
    o.stop(t + 0.4);
    // "sidechain": abaixa o baixo e os pads a cada bumbo
    for (const bus of [this.grave, this.harmonia]) {
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(0.35, t);
      bus.gain.linearRampToValueAtTime(1, t + 0.16);
    }
  }

  caixa(t, v) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource();
    n.buffer = this.ruido;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3200;
    bp.Q.value = 0.5;
    const g = ctx.createGain();
    this.env(g, t, 0.001, 0.7 * v, 0.16);
    n.connect(bp).connect(g).connect(this.bateria);
    n.start(t, Math.random());
    n.stop(t + 0.2);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    const g2 = ctx.createGain();
    this.env(g2, t, 0.001, 0.5 * v, 0.09);
    o.connect(g2).connect(this.bateria);
    o.start(t);
    o.stop(t + 0.12);
    if (v > 0.5) {
      const s = ctx.createGain();
      s.gain.value = 0.25 * v;
      g.connect(s).connect(this.envioReverb);
    }
  }

  chimbal(t, v, aberto, abafado) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource();
    n.buffer = this.ruido;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = abafado ? 5000 : 7500;
    const g = ctx.createGain();
    this.env(g, t, 0.001, 0.55 * v, aberto ? 0.14 : 0.035);
    n.connect(hp).connect(g).connect(this.bateria);
    n.start(t, Math.random());
    n.stop(t + 0.2);
  }

  baixoSub(t, f, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f / 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.75, t + 0.02);
    g.gain.setValueAtTime(0.75, t + dur * 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.grave);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  baixoReese(t, f, dur, neuro) {
    const ctx = this.ctx;
    const saida = ctx.createGain();
    saida.gain.setValueAtTime(0.0001, t);
    saida.gain.exponentialRampToValueAtTime(0.42, t + 0.015);
    saida.gain.setValueAtTime(0.42, t + dur * 0.8);
    saida.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.Q.value = neuro ? 9 : 5;
    // varredura do filtro (o "movimento" do reese)
    filtro.frequency.setValueAtTime(220, t);
    filtro.frequency.exponentialRampToValueAtTime(neuro ? 2400 : 1100, t + dur * 0.45);
    filtro.frequency.exponentialRampToValueAtTime(260, t + dur);
    let destino = filtro;
    if (neuro) {
      const dist = ctx.createWaveShaper();
      dist.curve = curvaDistorcao(28);
      filtro.connect(dist);
      destino = dist;
    }
    destino.connect(saida).connect(this.grave);
    for (const desafina of [-0.012, 0.012, 0.004]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f * (1 + desafina);
      o.connect(filtro);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    const sub = ctx.createOscillator();
    sub.frequency.value = f / 2;
    const gs = ctx.createGain();
    gs.gain.value = 0.7;
    sub.connect(gs).connect(saida);
    sub.start(t);
    sub.stop(t + dur + 0.02);
  }

  pad(t, notas, dur, v) {
    if (!v) return;
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06 * v, t + 0.6);
    g.gain.setValueAtTime(0.06 * v, t + dur - 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1500;
    lp.connect(g);
    g.connect(this.harmonia);
    g.connect(this.envioReverb);
    for (const n of notas) {
      for (const d of [-0.006, 0.006]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midi(n) * (1 + d);
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.7);
      }
    }
  }

  pluck(t, f, v) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = ctx.createGain();
    this.env(g, t, 0.003, v * 0.35, 0.28);
    o.connect(g);
    g.connect(this.harmonia);
    g.connect(this.envioReverb);
    o.start(t);
    o.stop(t + 0.35);
  }

  stab(t, notas, v) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    this.env(g, t, 0.003, v, 0.18);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 1.2;
    bp.connect(g);
    g.connect(this.harmonia);
    g.connect(this.envioReverb);
    for (const n of notas) {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = midi(n + 12);
      o.connect(bp);
      o.start(t);
      o.stop(t + 0.25);
    }
  }

  sirene(t, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 3;
    const prof = ctx.createGain();
    prof.gain.value = 60;
    lfo.connect(prof).connect(o.frequency);
    o.frequency.setValueAtTime(midi(77), t);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(g);
    g.connect(this.harmonia);
    g.connect(this.envioReverb);
    o.start(t);
    lfo.start(t);
    o.stop(t + dur);
    lfo.stop(t + dur);
  }

  // ---------- Efeitos sonoros ----------
  sfx(nome) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const tom = (tipo, f0, f1, dur, v) => {
      const o = ctx.createOscillator();
      o.type = tipo;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      this.env(g, t, 0.003, v, dur);
      o.connect(g).connect(this.sfxGanho);
      o.start(t);
      o.stop(t + dur + 0.05);
    };
    const ruido = (freq, tipo, dur, v, q = 1) => {
      const n = ctx.createBufferSource();
      n.buffer = this.ruido;
      const f = ctx.createBiquadFilter();
      f.type = tipo;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      this.env(g, t, 0.002, v, dur);
      n.connect(f).connect(g).connect(this.sfxGanho);
      n.start(t, Math.random());
      n.stop(t + dur + 0.05);
    };
    switch (nome) {
      case 'soco':
        ruido(900, 'lowpass', 0.09, 0.6);
        tom('sine', 180, 60, 0.12, 0.7);
        break;
      case 'golpeForte':
        ruido(1200, 'lowpass', 0.16, 0.8);
        tom('sine', 140, 40, 0.2, 0.9);
        break;
      case 'vento':
        ruido(1800, 'bandpass', 0.12, 0.25, 0.8);
        break;
      case 'pulo':
        tom('square', 220, 520, 0.12, 0.12);
        break;
      case 'aterrissar':
        ruido(300, 'lowpass', 0.08, 0.35);
        break;
      case 'pegar':
        tom('square', 520, 1040, 0.08, 0.1);
        break;
      case 'comer':
        tom('triangle', 660, 990, 0.1, 0.3);
        setTimeout(() => this.sfx('pegar'), 90);
        break;
      case 'arremesso':
        ruido(2400, 'bandpass', 0.18, 0.3, 1.5);
        break;
      case 'vidro':
        ruido(6000, 'highpass', 0.25, 0.5);
        tom('square', 2400, 1800, 0.05, 0.08);
        break;
      case 'pedra':
        ruido(500, 'lowpass', 0.12, 0.6);
        break;
      case 'guincho': {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(1800 + Math.random() * 500, t);
        o.frequency.linearRampToValueAtTime(2600 + Math.random() * 500, t + 0.06);
        o.frequency.linearRampToValueAtTime(1500, t + 0.16);
        const g = ctx.createGain();
        this.env(g, t, 0.005, 0.12, 0.16);
        o.connect(g).connect(this.sfxGanho);
        o.start(t);
        o.stop(t + 0.2);
        break;
      }
      case 'dano':
        tom('sawtooth', 300, 90, 0.25, 0.25);
        break;
      case 'especial':
        tom('sawtooth', 80, 900, 0.5, 0.25);
        ruido(400, 'lowpass', 0.8, 0.8);
        break;
      case 'tremor':
        tom('sine', 90, 30, 0.5, 1);
        ruido(250, 'lowpass', 0.5, 0.7);
        break;
      case 'confirmar':
        tom('square', 660, 1320, 0.09, 0.12);
        break;
      case 'cursor':
        tom('square', 440, 440, 0.04, 0.08);
        break;
      case 'texto':
        tom('square', 900 + Math.random() * 200, 900, 0.02, 0.03);
        break;
      default:
        break;
    }
  }

  // ---------- Utilidades ----------
  bufferRuido(seg) {
    const ctx = this.ctx;
    const b = ctx.createBuffer(1, ctx.sampleRate * seg, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  respostaImpulso(seg) {
    const ctx = this.ctx;
    const b = ctx.createBuffer(2, ctx.sampleRate * seg, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    }
    return b;
  }
}

function curvaDistorcao(k) {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    c[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return c;
}

export function lerPreferencia(chave, padrao) {
  try {
    return localStorage.getItem('boulos.' + chave) ?? padrao;
  } catch {
    return padrao;
  }
}

export function salvarPreferencia(chave, valor) {
  try {
    localStorage.setItem('boulos.' + chave, valor);
  } catch {
    /* sem armazenamento local: ignora */
  }
}
