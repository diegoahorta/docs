// Pronúncia com a Web Speech API (speechSynthesis), sempre em ja-JP.
// No app Android, a WebView não tem speechSynthesis: o app oferece uma ponte
// (window.FalaNativa) para o TextToSpeech do próprio Android.

import { obterConfig } from './settings.js';

let vozJaponesa = null;
const ponteNativa = typeof window !== 'undefined' ? window.FalaNativa : undefined;

/** O navegador tem a síntese de voz da web? */
function sinteseDaWeb() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Há alguma forma de falar (ponte do app Android ou síntese da web)? */
export function falaDisponivel() {
  return Boolean(ponteNativa) || sinteseDaWeb();
}

/** Procura uma voz japonesa instalada no sistema. */
function escolherVoz() {
  if (!sinteseDaWeb()) {
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
  if (ponteNativa) {
    return ponteNativa.temVoz();
  }
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
    if (ponteNativa) {
      ponteNativa.falar(texto, obterConfig().velocidadeFala);
      return true;
    }
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
if (sinteseDaWeb()) {
  escolherVoz();
  window.speechSynthesis.addEventListener?.('voiceschanged', escolherVoz);
}
