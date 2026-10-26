// Efeitos sonoros sintetizados com a Web Audio API (sem arquivos de áudio).

import { obterConfig } from './settings.js';

let contexto = null;

/** Cria o AudioContext na primeira vez (precisa de um gesto do usuário). */
function obterContexto() {
  if (!contexto) {
    const ClasseAudio = window.AudioContext ?? window.webkitAudioContext;
    if (!ClasseAudio) {
      return null;
    }
    contexto = new ClasseAudio();
  }
  if (contexto.state === 'suspended') {
    contexto.resume().catch(() => {});
  }
  return contexto;
}

/** Toca uma sequência de notas curtas com envelope suave. */
function tocarNotas(frequencias, { tipo = 'sine', duracao = 0.12, intensidade = 0.25 } = {}) {
  const volume = obterConfig().volumeEfeitos;
  if (volume <= 0) {
    return;
  }
  const ctx = obterContexto();
  if (!ctx) {
    return;
  }
  frequencias.forEach((frequencia, indice) => {
    const inicio = ctx.currentTime + indice * duracao;
    const oscilador = ctx.createOscillator();
    const ganho = ctx.createGain();
    oscilador.type = tipo;
    oscilador.frequency.value = frequencia;
    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(intensidade * volume, inicio + 0.01);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
    oscilador.connect(ganho).connect(ctx.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + duracao + 0.02);
  });
}

export function tocarAcerto() {
  tocarNotas([880, 1320], { tipo: 'triangle', duracao: 0.09 });
}

export function tocarErro() {
  tocarNotas([233, 175], { tipo: 'square', duracao: 0.14, intensidade: 0.12 });
}

export function tocarClique() {
  tocarNotas([660], { tipo: 'sine', duracao: 0.05, intensidade: 0.15 });
}

export function tocarAbertura() {
  tocarNotas([523, 659, 784, 1047], { tipo: 'triangle', duracao: 0.11 });
}

/** Tique do cronômetro nos últimos segundos. */
export function tocarTique() {
  tocarNotas([1200], { tipo: 'square', duracao: 0.04, intensidade: 0.06 });
}

/** Sobe um tom a cada degrau do combo (x2, x3, x4...). */
export function tocarCombo(multiplicador) {
  const base = 523 * 2 ** ((multiplicador - 2) / 4);
  tocarNotas([base, base * 1.25, base * 1.5, base * 2], { tipo: 'triangle', duracao: 0.07 });
}

/** Tempo esgotado. */
export function tocarTempoEsgotado() {
  tocarNotas([392, 330, 262], { tipo: 'sawtooth', duracao: 0.13, intensidade: 0.1 });
}

/** Fanfarra do fim da rodada. */
export function tocarFanfarra() {
  tocarNotas([523, 523, 659, 784, 659, 784, 1047], { tipo: 'triangle', duracao: 0.12 });
}
