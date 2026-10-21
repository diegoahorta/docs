// Pronúncia com a Web Speech API (speechSynthesis), sempre em ja-JP.

import { obterConfig } from './settings.js';

let vozJaponesa = null;

/** O navegador tem síntese de voz? */
export function falaDisponivel() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Procura uma voz japonesa instalada no sistema. */
function escolherVoz() {
  if (!falaDisponivel()) {
    return;
  }
  const vozes = window.speechSynthesis.getVoices();
  vozJaponesa =
    vozes.find((voz) => voz.lang === 'ja-JP') ??
    vozes.find((voz) => voz.lang?.toLowerCase().startsWith('ja')) ??
    null;
}

/** Existe uma voz japonesa? (Algumas máquinas precisam instalar o pacote de voz.) */
export function temVozJaponesa() {
  if (!vozJaponesa) {
    escolherVoz();
  }
  return vozJaponesa !== null;
}

/** Fala um texto em japonês. Devolve false se não foi possível. */
export function falar(texto) {
  if (!falaDisponivel() || !texto) {
    return false;
  }
  try {
    const sintese = window.speechSynthesis;
    sintese.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'ja-JP';
    if (temVozJaponesa()) {
      fala.voice = vozJaponesa;
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
