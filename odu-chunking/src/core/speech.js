import { langByCode } from '../config.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
let voices = [];

function refresh() {
  voices = synth?.getVoices() ?? [];
}
refresh();
synth?.addEventListener?.('voiceschanged', refresh);

export const canSpeak = () => Boolean(synth);

function voiceFor(tag) {
  const base = tag.slice(0, 2);
  return voices.find((v) => v.lang === tag) ?? voices.find((v) => v.lang?.startsWith(base));
}

/** Lê um texto com a voz do idioma (Web Speech API). Ritmo levemente lento para estudo. */
export function speak(text, lang, { rate = 0.9 } = {}) {
  if (!synth) return Promise.resolve();
  const tag = langByCode[lang]?.voice ?? 'pt-BR';
  return new Promise((resolve) => {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = tag;
    u.rate = rate;
    const v = voiceFor(tag);
    if (v) u.voice = v;
    u.onend = resolve;
    u.onerror = resolve;
    synth.speak(u);
  });
}

export function stopSpeech() {
  synth?.cancel();
}
