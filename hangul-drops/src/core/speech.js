// Pronúncia com a Web Speech API (speechSynthesis), sempre em ko-KR.

import { obterConfig } from './settings.js';

let vozCoreana = null;

/** O navegador tem síntese de voz? */
export function falaDisponivel() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Procura uma voz coreana instalada no sistema. */
function escolherVoz() {
  if (!falaDisponivel()) {
    return;
  }
  const vozes = window.speechSynthesis.getVoices();
  vozCoreana =
    vozes.find((voz) => voz.lang === 'ko-KR') ??
    vozes.find((voz) => voz.lang?.toLowerCase().startsWith('ko')) ??
    null;
}

/** Existe uma voz coreana? (Algumas máquinas precisam instalar o pacote de voz.) */
export function temVozCoreana() {
  if (!vozCoreana) {
    escolherVoz();
  }
  return vozCoreana !== null;
}

/** Fala um texto em coreano. Devolve false se não foi possível. */
export function falar(texto) {
  if (!falaDisponivel() || !texto) {
    return false;
  }
  try {
    const sintese = window.speechSynthesis;
    sintese.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'ko-KR';
    if (temVozCoreana()) {
      fala.voice = vozCoreana;
    }
    fala.rate = obterConfig().velocidadeFala;
    sintese.speak(fala);
    return true;
  } catch (erro) {
    console.warn('Não foi possível usar a síntese de voz.', erro);
    return false;
  }
}

// As vozes costumam carregar de forma assíncrona.
if (falaDisponivel()) {
  escolherVoz();
  window.speechSynthesis.addEventListener?.('voiceschanged', escolherVoz);
}
