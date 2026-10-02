// Motor de áudio 100% procedural (Web Audio API): trilha lo-fi sci-fi,
// efeitos sonoros e a "poluição sonora" de comemoração.

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12)

// Progressão lo-fi espacial: E♭maj9 → Dm9 → Cm9 → A♭maj7(♯11)
const ACORDES = [
  {
    baixo: 39,
    notas: [51, 55, 58, 62, 65],
    escala: [63, 65, 67, 70, 72, 74, 75, 79]
  },
  {
    baixo: 38,
    notas: [50, 53, 57, 60, 64],
    escala: [62, 65, 67, 69, 72, 74, 77]
  },
  {
    baixo: 36,
    notas: [48, 51, 55, 58, 62],
    escala: [60, 63, 65, 67, 70, 72, 75]
  },
  {
    baixo: 32,
    notas: [44, 51, 55, 60, 62],
    escala: [60, 62, 63, 67, 68, 70, 72, 74]
  }
]

// Escala pentatônica usada para dar a cada hiragana uma nota própria
const PENTA = [0, 2, 4, 7, 9]

export class Audio {
  constructor() {
    this.ctx = null
    this.volMusica = 0.6
    this.volEfeitos = 0.8
    this.tocandoMusica = false
    this.intensidade = 0 // 0 = menu (calmo), 1 = jogo
  }

  /** Precisa ser chamado dentro de um gesto do usuário (clique/tecla). */
  iniciar() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return true
    }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    try {
      this.ctx = new AC()
    } catch {
      return false
    }
    const ctx = this.ctx

    // Limitador no final protege os ouvidos mesmo na comemoração
    this.limitador = ctx.createDynamicsCompressor()
    this.limitador.threshold.value = -10
    this.limitador.knee.value = 6
    this.limitador.ratio.value = 12
    this.limitador.attack.value = 0.003
    this.limitador.release.value = 0.25
    this.mestre = ctx.createGain()
    this.mestre.gain.value = 0.9
    this.mestre.connect(this.limitador).connect(ctx.destination)

    this.reverb = ctx.createConvolver()
    this.reverb.buffer = this._impulso(3.2, 2.6)
    this.reverbVolta = ctx.createGain()
    this.reverbVolta.gain.value = 0.55
    this.reverb.connect(this.reverbVolta).connect(this.mestre)

    // Barramento de música com filtro "fita velha"
    this.musica = ctx.createGain()
    this.musica.gain.value = this.volMusica * 0.55
    this.musicaDuck = ctx.createGain()
    this.filtroFita = ctx.createBiquadFilter()
    this.filtroFita.type = 'lowpass'
    this.filtroFita.frequency.value = 2400
    this.filtroFita.Q.value = 0.4
    this.musica
      .connect(this.musicaDuck)
      .connect(this.filtroFita)
      .connect(this.mestre)
    this.envioReverbMusica = ctx.createGain()
    this.envioReverbMusica.gain.value = 0.35
    this.filtroFita.connect(this.envioReverbMusica).connect(this.reverb)

    // Delay para a melodia
    this.delay = ctx.createDelay(2)
    this.delay.delayTime.value = (60 / 74) * 0.75
    const realimentacao = ctx.createGain()
    realimentacao.gain.value = 0.38
    const filtroDelay = ctx.createBiquadFilter()
    filtroDelay.type = 'lowpass'
    filtroDelay.frequency.value = 1800
    this.delay
      .connect(filtroDelay)
      .connect(realimentacao)
      .connect(this.delay)
    filtroDelay.connect(this.musica)

    // Barramento de efeitos
    this.efeitos = ctx.createGain()
    this.efeitos.gain.value = this.volEfeitos
    this.efeitos.connect(this.mestre)
    this.envioReverbEfeitos = ctx.createGain()
    this.envioReverbEfeitos.gain.value = 0.25
    this.efeitos.connect(this.envioReverbEfeitos).connect(this.reverb)

    // Oscilação lenta de afinação (wow & flutter)
    this.wow = ctx.createOscillator()
    this.wow.frequency.value = 0.35
    this.wowProf = ctx.createGain()
    this.wowProf.gain.value = 7
    this.wow.connect(this.wowProf)
    this.wow.start()

    this.ruidoBuf = this._ruidoBranco(2)
    this._chiado()
    return true
  }

  setVolumes(musica, efeitos) {
    this.volMusica = musica
    this.volEfeitos = efeitos
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.musica.gain.setTargetAtTime(musica * 0.55, t, 0.05)
    this.efeitos.gain.setTargetAtTime(efeitos, t, 0.05)
    this.chiadoGanho?.gain.setTargetAtTime(musica * 0.05, t, 0.05)
  }

  suspender(sim) {
    if (!this.ctx) return
    if (sim) this.ctx.suspend()
    else this.ctx.resume()
  }

  // ------------------------------------------------------------ utilitários

  _ruidoBranco(seg) {
    const ctx = this.ctx
    const buf = ctx.createBuffer(1, ctx.sampleRate * seg, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    return buf
  }

  _impulso(seg, decaimento) {
    const ctx = this.ctx
    const n = ctx.sampleRate * seg
    const buf = ctx.createBuffer(2, n, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < n; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decaimento)
    }
    return buf
  }

  _wow(o) {
    // Conecta a oscilação de fita e desconecta quando a nota termina (evita vazamento)
    this.wowProf.connect(o.detune)
    o.addEventListener('ended', () => {
      try {
        this.wowProf.disconnect(o.detune)
      } catch {
        /* já desconectado */
      }
    })
  }

  _env(g, t, ataque, pico, duracao, fim = 0.0001) {
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(Math.max(pico, 0.0002), t + ataque)
    g.gain.exponentialRampToValueAtTime(fim, t + ataque + duracao)
  }

  _osc(tipo, freq, t, dur, destino, pico = 0.2, ataque = 0.005) {
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = tipo
    o.frequency.setValueAtTime(freq, t)
    this._env(g, t, ataque, pico, dur)
    o.connect(g).connect(destino)
    o.start(t)
    o.stop(t + ataque + dur + 0.05)
    return o
  }

  _ruido(
    t,
    dur,
    destino,
    {
      tipo = 'lowpass',
      freq = 1000,
      q = 1,
      pico = 0.3,
      ataque = 0.003,
      freqFim
    } = {}
  ) {
    const src = this.ctx.createBufferSource()
    src.buffer = this.ruidoBuf
    src.loop = true
    const f = this.ctx.createBiquadFilter()
    f.type = tipo
    f.frequency.setValueAtTime(freq, t)
    if (freqFim) f.frequency.exponentialRampToValueAtTime(freqFim, t + dur)
    f.Q.value = q
    const g = this.ctx.createGain()
    this._env(g, t, ataque, pico, dur)
    src.connect(f).connect(g).connect(destino)
    src.start(t, Math.random() * 1.5)
    src.stop(t + ataque + dur + 0.05)
    return { src, f, g }
  }

  _pan(destino, valor) {
    if (!this.ctx.createStereoPanner) return destino
    const p = this.ctx.createStereoPanner()
    p.pan.value = valor
    p.connect(destino)
    return p
  }

  // ------------------------------------------------------------ trilha lo-fi

  _chiado() {
    // Chiado de vinil: estalos esparsos + hiss filtrado, em loop
    const ctx = this.ctx
    const seg = 4
    const buf = ctx.createBuffer(1, ctx.sampleRate * seg, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.04
      if (Math.random() < 0.00018) {
        const amp = 0.3 + Math.random() * 0.7
        for (let k = 0; k < 40 && i + k < d.length; k++)
          d[i + k] += amp * Math.exp(-k / 6) * (Math.random() * 2 - 1)
      }
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const hp = ctx.createBiquadFilter()
    hp.type = 'bandpass'
    hp.frequency.value = 3000
    hp.Q.value = 0.3
    this.chiadoGanho = ctx.createGain()
    this.chiadoGanho.gain.value = 0
    src.connect(hp).connect(this.chiadoGanho).connect(this.mestre)
    src.start()
  }

  tocarMusica() {
    if (!this.ctx || this.tocandoMusica) return
    this.tocandoMusica = true
    this.bpm = 74
    this.passo = 0
    this.proximo = this.ctx.currentTime + 0.1
    this.chiadoGanho.gain.setTargetAtTime(
      this.volMusica * 0.05,
      this.ctx.currentTime,
      1
    )
    this._timer = setInterval(() => this._agendar(), 25)
  }

  pararMusica() {
    this.tocandoMusica = false
    clearInterval(this._timer)
    if (this.chiadoGanho)
      this.chiadoGanho.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3)
  }

  _agendar() {
    const ctx = this.ctx
    if (ctx.state !== 'running') {
      this.proximo = ctx.currentTime + 0.1
      return
    }
    const semicolcheia = 60 / this.bpm / 4
    while (this.proximo < ctx.currentTime + 0.15) {
      // swing nas semicolcheias pares
      const swing = this.passo % 2 === 1 ? semicolcheia * 0.16 : 0
      this._passoMusica(this.passo, this.proximo + swing)
      this.proximo += semicolcheia
      this.passo++
    }
  }

  _passoMusica(passo, t) {
    const s = passo % 16
    const compasso = Math.floor(passo / 16)
    const acorde = ACORDES[Math.floor(compasso / 2) % ACORDES.length]
    const humano = () => (Math.random() - 0.5) * 0.012
    const bateria = this.intensidade > 0 || compasso % 8 >= 2

    if (s === 0 && compasso % 2 === 0)
      this._pad(acorde, t, (60 / this.bpm) * 8)
    if (s === 0 || s === 7 || (s === 10 && compasso % 2 === 1))
      this._piano(acorde, t + humano(), s === 0 ? 0.11 : 0.07)
    if (s === 0 || s === 10)
      this._baixo(acorde.baixo, t, s === 0 ? 0.9 : 0.4)

    if (bateria) {
      if (s === 0 || s === 9 || (s === 11 && compasso % 4 === 3))
        this._bumbo(t + humano())
      if (s === 4 || s === 12) this._caixa(t + humano() + 0.01)
      if (s % 2 === 0)
        this._chimbal(t + humano(), s % 4 === 2 ? 0.05 : 0.03)
      else if (this.intensidade > 0 && Math.random() < 0.3)
        this._chimbal(t, 0.015)
    }

    // Melodia esparsa com delay
    if (
      s % 2 === 0 &&
      Math.random() < (this.intensidade > 0 ? 0.32 : 0.22)
    ) {
      const nota =
        acorde.escala[Math.floor(Math.random() * acorde.escala.length)] +
        12
      this._melodia(nota, t + humano())
    }
    // "Bips" de sonda espacial
    if (s === 14 && compasso % 4 === 1 && Math.random() < 0.7)
      this._sonda(t)
  }

  _pad(acorde, t, dur) {
    const ctx = this.ctx
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(500, t)
    f.frequency.linearRampToValueAtTime(1100, t + dur * 0.5)
    f.frequency.linearRampToValueAtTime(600, t + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.05, t + 1.2)
    g.gain.setValueAtTime(0.05, t + dur - 0.6)
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6)
    f.connect(g).connect(this.musica)
    for (const n of acorde.notas.slice(0, 4)) {
      for (const det of [-9, 8]) {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = mtof(n)
        o.detune.value = det
        this._wow(o)
        o.connect(f)
        o.start(t)
        o.stop(t + dur + 0.7)
      }
    }
  }

  _piano(acorde, t, vel) {
    // Piano elétrico via FM simples (estilo Rhodes)
    const ctx = this.ctx
    acorde.notas.forEach((n, i) => {
      const tt = t + i * 0.012
      const car = ctx.createOscillator()
      const mod = ctx.createOscillator()
      const modG = ctx.createGain()
      const g = ctx.createGain()
      car.frequency.value = mtof(n + 12)
      mod.frequency.value = mtof(n + 12)
      modG.gain.setValueAtTime(mtof(n + 12) * 1.2, tt)
      modG.gain.exponentialRampToValueAtTime(1, tt + 0.8)
      mod.connect(modG).connect(car.frequency)
      this._wow(car)
      this._env(g, tt, 0.006, vel * 0.5, 1.6)
      car.connect(g).connect(this.musica)
      car.start(tt)
      mod.start(tt)
      car.stop(tt + 1.8)
      mod.stop(tt + 1.8)
    })
  }

  _baixo(n, t, dur) {
    const o = this._osc(
      'triangle',
      mtof(n),
      t,
      dur,
      this.musica,
      0.22,
      0.01
    )
    this._wow(o)
  }

  _bumbo(t) {
    const ctx = this.ctx
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.setValueAtTime(120, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12)
    this._env(g, t, 0.002, 0.55, 0.28)
    o.connect(g).connect(this.musica)
    o.start(t)
    o.stop(t + 0.35)
  }

  _caixa(t) {
    this._ruido(t, 0.16, this.musica, {
      tipo: 'bandpass',
      freq: 1700,
      q: 0.8,
      pico: 0.16
    })
    this._osc('triangle', 190, t, 0.08, this.musica, 0.08)
  }

  _chimbal(t, v) {
    this._ruido(t, 0.035, this.musica, {
      tipo: 'highpass',
      freq: 7500,
      pico: v * 2
    })
  }

  _melodia(n, t) {
    const ctx = this.ctx
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = mtof(n)
    this._wow(o)
    this._env(g, t, 0.02, 0.07, 0.9)
    o.connect(g)
    g.connect(this.musica)
    g.connect(this.delay)
    o.start(t)
    o.stop(t + 1)
  }

  _sonda(t) {
    const base = 1600 + Math.random() * 900
    for (let i = 0; i < 3; i++) {
      const o = this._osc(
        'sine',
        base * (1 + i * 0.25),
        t + i * 0.09,
        0.08,
        this.delay,
        0.025
      )
      o.frequency.exponentialRampToValueAtTime(
        base * 1.6,
        t + i * 0.09 + 0.08
      )
    }
  }

  /** Abaixa a música temporariamente (comemoração). */
  abaixarMusica(seg) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const g = this.musicaDuck.gain
    g.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t)
    g.linearRampToValueAtTime(0.18, t + 0.05)
    g.setValueAtTime(0.18, t + seg)
    g.linearRampToValueAtTime(1, t + seg + 1.2)
  }

  // ------------------------------------------------------------ efeitos

  _ok() {
    return this.ctx && this.ctx.state === 'running'
  }

  notaDoKana(indice) {
    const oitava = Math.floor(indice / 5)
    return 72 + PENTA[indice % 5] + oitava * 2
  }

  tiro(indiceKana = 0) {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    const f = mtof(this.notaDoKana(indiceKana) + 12)
    const o = this._osc(
      'square',
      f,
      t,
      0.1,
      this._pan(this.efeitos, (Math.random() - 0.5) * 0.4),
      0.05
    )
    o.frequency.exponentialRampToValueAtTime(f * 0.35, t + 0.1)
    this._ruido(t, 0.05, this.efeitos, {
      tipo: 'highpass',
      freq: 3000,
      pico: 0.03
    })
  }

  acerto(indiceKana = 0) {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    const n = this.notaDoKana(indiceKana)
    this._osc('triangle', mtof(n), t, 0.35, this.efeitos, 0.16)
    this._osc('sine', mtof(n + 7), t + 0.06, 0.4, this.efeitos, 0.12)
    this._ruido(t, 0.45, this.efeitos, {
      freq: 2500,
      freqFim: 120,
      pico: 0.35
    })
    this._osc(
      'sine',
      110,
      t,
      0.25,
      this.efeitos,
      0.3
    ).frequency.exponentialRampToValueAtTime(40, t + 0.25)
  }

  erro() {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    const o = this._osc('square', 160, t, 0.28, this.efeitos, 0.09)
    o.frequency.linearRampToValueAtTime(110, t + 0.28)
    this._osc('square', 163, t, 0.28, this.efeitos, 0.06)
  }

  dano() {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    this._ruido(t, 0.6, this.efeitos, {
      freq: 1200,
      freqFim: 80,
      pico: 0.6,
      q: 2
    })
    this._osc(
      'sawtooth',
      200,
      t,
      0.4,
      this.efeitos,
      0.12
    ).frequency.exponentialRampToValueAtTime(50, t + 0.4)
  }

  memoriaPerdida() {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    ;[76, 72, 67, 63].forEach((n, i) =>
      this._osc('sine', mtof(n), t + i * 0.11, 0.35, this.delay, 0.07)
    )
  }

  selecionar(indiceKana = 0) {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    this._osc(
      'sine',
      mtof(this.notaDoKana(indiceKana)),
      t,
      0.09,
      this.efeitos,
      0.08
    )
  }

  rolagem() {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    this._ruido(t, 0.5, this.efeitos, {
      tipo: 'bandpass',
      freq: 400,
      freqFim: 3500,
      q: 3,
      pico: 0.25,
      ataque: 0.1
    })
  }

  defletir() {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    this._osc(
      'triangle',
      2400,
      t,
      0.12,
      this.efeitos,
      0.1
    ).frequency.exponentialRampToValueAtTime(3600, t + 0.1)
  }

  portal() {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    ;[63, 67, 70, 75, 79, 82].forEach((n, i) =>
      this._osc('triangle', mtof(n), t + i * 0.06, 0.4, this.delay, 0.09)
    )
  }

  letraDaPalavra(i) {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    const n = 75 + [0, 4, 7, 12, 16][Math.min(i, 4)]
    this._osc('sine', mtof(n), t, 0.3, this.efeitos, 0.12)
    this._osc('sine', mtof(n + 12), t + 0.05, 0.3, this.delay, 0.05)
  }

  clique() {
    if (!this._ok()) return
    this._osc('sine', 880, this.ctx.currentTime, 0.05, this.efeitos, 0.05)
  }

  setorConcluido() {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    const seq = [63, 67, 70, 75, 70, 75, 79]
    seq.forEach((n, i) =>
      this._metal(
        mtof(n),
        t + i * 0.12,
        i === seq.length - 1 ? 1.2 : 0.18,
        0.08
      )
    )
  }

  gameOver() {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    ;[67, 63, 60, 55].forEach((n, i) =>
      this._metal(mtof(n), t + i * 0.32, 0.5, 0.07)
    )
  }

  _metal(freq, t, dur, pico) {
    // "Metais" sintéticos: serras desafinadas com filtro abrindo
    const ctx = this.ctx
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(600, t)
    f.frequency.exponentialRampToValueAtTime(4200, t + 0.08)
    f.frequency.exponentialRampToValueAtTime(1500, t + dur)
    const g = ctx.createGain()
    this._env(g, t, 0.02, pico, dur)
    f.connect(g).connect(this.efeitos)
    for (const det of [-12, 0, 11]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = freq
      o.detune.value = det
      const vib = ctx.createOscillator()
      const vibG = ctx.createGain()
      vib.frequency.value = 5.5
      vibG.gain.value = 6
      vib.connect(vibG).connect(o.detune)
      o.connect(f)
      o.start(t)
      vib.start(t)
      o.stop(t + dur + 0.1)
      vib.stop(t + dur + 0.1)
    }
  }

  /**
   * Comemoração ao completar uma sequência: explosão, fanfarra, buzinas,
   * apitos, torcida e estouros por todo o estéreo. O limitador no mestre
   * mantém o volume final seguro.
   */
  comemoracao() {
    if (!this._ok()) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const fx = this.efeitos
    this.abaixarMusica(3)

    // 1. Explosão: ruído com filtro fechando + sub grave
    this._ruido(t, 1.8, fx, { freq: 4000, freqFim: 60, pico: 0.9, q: 0.7 })
    const sub = this._osc('sine', 95, t, 1.4, fx, 0.7)
    sub.frequency.exponentialRampToValueAtTime(28, t + 1.4)
    // Prato de ataque
    this._ruido(t + 0.02, 2.6, fx, {
      tipo: 'highpass',
      freq: 6000,
      pico: 0.22
    })

    // 2. Fanfarra: arpejo subindo + acorde IV–V–I
    ;[63, 67, 70, 75].forEach((n, i) =>
      this._metal(mtof(n), t + 0.12 + i * 0.09, 0.16, 0.09)
    )
    const acordes = [
      [[68, 72, 75], 0.5, 0.2],
      [[70, 74, 77], 0.72, 0.2],
      [[75, 79, 82, 87], 0.95, 1.6]
    ]
    for (const [notas, ini, dur] of acordes)
      for (const n of notas) this._metal(mtof(n), t + ini, dur, 0.06)

    // 3. Buzinas de estádio
    for (const [ini, pan] of [
      [0.25, -0.7],
      [0.6, 0.7],
      [1.0, 0],
      [1.35, -0.4]
    ]) {
      const dest = this._pan(fx, pan)
      const f = ctx.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = 1100
      f.Q.value = 0.8
      const g = ctx.createGain()
      this._env(g, t + ini, 0.015, 0.16, 0.28)
      f.connect(g).connect(dest)
      for (const freq of [466, 469.5, 233]) {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = freq
        o.connect(f)
        o.start(t + ini)
        o.stop(t + ini + 0.4)
      }
    }

    // 4. Apitos (slide whistle)
    for (const [ini, pan, sobe] of [
      [0.3, 0.6, true],
      [0.9, -0.6, false],
      [1.5, 0.2, true]
    ]) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(sobe ? 700 : 2600, t + ini)
      o.frequency.exponentialRampToValueAtTime(
        sobe ? 2600 : 600,
        t + ini + 0.45
      )
      this._env(g, t + ini, 0.03, 0.09, 0.45)
      o.connect(g).connect(this._pan(fx, pan))
      o.start(t + ini)
      o.stop(t + ini + 0.55)
    }

    // 5. Torcida: ruído em três bandas com tremolo irregular
    for (const [freq, pan] of [
      [520, -0.5],
      [1300, 0.5],
      [2600, 0]
    ]) {
      const { g } = this._ruido(t + 0.15, 2.8, this._pan(fx, pan), {
        tipo: 'bandpass',
        freq,
        q: 1.4,
        pico: 0.22,
        ataque: 0.35
      })
      const lfo = ctx.createOscillator()
      const lfoG = ctx.createGain()
      lfo.type = 'triangle'
      lfo.frequency.value = 6 + Math.random() * 5
      lfoG.gain.value = 0.06
      lfo.connect(lfoG).connect(g.gain)
      lfo.start(t + 0.15)
      lfo.stop(t + 3.2)
    }

    // 6. Estouros de confete espalhados
    for (let i = 0; i < 28; i++) {
      const ti = t + 0.2 + Math.random() * 2.4
      this._ruido(
        ti,
        0.04 + Math.random() * 0.05,
        this._pan(fx, Math.random() * 2 - 1),
        {
          tipo: 'bandpass',
          freq: 1500 + Math.random() * 4000,
          q: 2,
          pico: 0.25
        }
      )
    }
    // 7. Brilhos subindo
    for (let i = 0; i < 10; i++) {
      this._osc(
        'triangle',
        mtof(84 + PENTA[i % 5] + 12 * Math.floor(i / 5)),
        t + 1.2 + i * 0.07,
        0.25,
        this.delay,
        0.05
      )
    }
  }

  /** Mini comemoração (marcos de combo). */
  fogos() {
    if (!this._ok()) return
    const t = this.ctx.currentTime
    for (let i = 0; i < 4; i++) {
      const ti = t + i * 0.18
      const o = this._osc('sine', 600, ti, 0.25, this.efeitos, 0.05)
      o.frequency.exponentialRampToValueAtTime(2200, ti + 0.25)
      this._ruido(
        ti + 0.25,
        0.3,
        this._pan(this.efeitos, Math.random() * 2 - 1),
        { freq: 3000, freqFim: 300, pico: 0.2 }
      )
    }
  }
}
