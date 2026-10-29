// Pronúncia com a Web Speech API (quando houver voz japonesa disponível).
import { setting } from './store.js'
import { kana } from '../lang/ruby.js'

let voice = null
function pickVoice() {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  voice =
    voices.find((v) => v.lang === 'ja-JP') ??
    voices.find((v) => v.lang?.startsWith('ja')) ??
    null
  return voice
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice()
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

export const ttsAvailable = () => 'speechSynthesis' in window && !!(voice ?? pickVoice())

/** Fala um texto com marcação de ruby (usa a leitura em kana). */
export function speak(text, { force = false } = {}) {
  if (!force && !setting('voice')) return false
  if (!ttsAvailable()) return false
  try {
    const u = new SpeechSynthesisUtterance(kana(text))
    u.lang = 'ja-JP'
    u.voice = voice
    u.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
    return true
  } catch {
    return false
  }
}
