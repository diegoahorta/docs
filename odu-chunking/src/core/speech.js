import { langByCode } from '../config.js';
import { AUDIO_FILES } from '../data/audio-manifest.js';
import { audioKey } from './audio-key.js';
import { isNative, native, nativeSpeak } from './native.js';

/**
 * Voz do app, em ordem de preferência:
 * 1. gravação de falante nativo empacotada em audio/<idioma>/ (funciona offline);
 * 2. voz do Android (TextToSpeech nativo, offline com as vozes instaladas);
 * 3. Web Speech API do navegador.
 */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
let voices = [];
let player = null;

function refresh() {
  voices = synth?.getVoices() ?? [];
}
refresh();
synth?.addEventListener?.('voiceschanged', refresh);

export const canSpeak = () => isNative() || Boolean(synth) || Object.keys(AUDIO_FILES).length > 0;

export const recordedFile = (text, lang) => AUDIO_FILES[`${lang}/${audioKey(text)}`];

// fetch + blob funciona igual no navegador e no WebView do APK.
async function playFile(src, rate) {
  let url = src;
  try {
    url = URL.createObjectURL(await (await fetch(src)).blob());
  } catch {
    /* toca direto pela URL */
  }
  return new Promise((resolve) => {
    player = new Audio(url);
    player.playbackRate = rate < 0.8 ? 0.75 : 1;
    player.onended = resolve;
    player.onerror = resolve;
    player.play().catch(resolve);
  });
}

function webSpeak(text, tag, rate) {
  if (!synth) return Promise.resolve();
  return new Promise((resolve) => {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = tag;
    u.rate = rate;
    const base = tag.slice(0, 2);
    const v = voices.find((x) => x.lang === tag) ?? voices.find((x) => x.lang?.startsWith(base));
    if (v) u.voice = v;
    u.onend = resolve;
    u.onerror = resolve;
    synth.speak(u);
  });
}

/** Lê um texto no idioma. Ritmo levemente lento para estudo. */
export async function speak(text, lang, { rate = 0.9 } = {}) {
  stopSpeech();
  const tag = langByCode[lang]?.voice ?? 'pt-BR';
  const file = recordedFile(text, lang);
  if (file) return playFile(file, rate);
  if (isNative() && (await nativeSpeak(text, tag, rate))) return undefined;
  return webSpeak(text, tag, rate);
}

export function stopSpeech() {
  player?.pause();
  player = null;
  synth?.cancel();
  if (isNative()) native.stopSpeech();
}

/** Quais idiomas têm voz disponível neste aparelho (para o painel de áudio). */
export async function voiceStatus() {
  const out = {};
  for (const code of Object.keys(langByCode)) {
    const tag = langByCode[code].voice;
    if (isNative()) {
      // O motor de voz do Android leva alguns instantes para iniciar.
      for (let i = 0; i < 20 && !native.isReady(); i += 1) await new Promise((r) => setTimeout(r, 150));
      out[code] = native.hasVoice(tag);
    } else {
      out[code] = voices.some((v) => v.lang?.startsWith(code));
    }
  }
  return out;
}

/** Abre a instalação de vozes do Android (dados de TTS offline). */
export function openVoiceInstall() {
  if (isNative()) native.openVoiceInstall();
}
