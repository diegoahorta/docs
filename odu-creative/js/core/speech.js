/**
 * Fala: reprodução de frases isoladas, síntese de voz, reconhecimento de fala e gravação.
 *
 * - playLine(): toca o MP3 pré-gerado da frase (unit.lines); se não existir, usa a síntese do navegador.
 * - Reconhecimento de fala (Web Speech API) só existe em alguns navegadores (Chrome/Edge/Safari).
 *   Ele é tratado como AUXÍLIO: a transcrição pode errar, especialmente com sotaque — e tudo bem.
 * - Recorder usa MediaRecorder + Web Audio API (AnalyserNode) para o medidor de volume.
 *   A gravação fica só na memória do navegador; nada é enviado a servidores.
 */
import { normalize } from './evaluate.js';
import { assetUrl } from './unit-loader.js';

let currentAudio = null;

export function stopAll() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  try { speechSynthesis.cancel(); } catch {}
}

export function ttsAvailable() {
  return 'speechSynthesis' in globalThis && 'SpeechSynthesisUtterance' in globalThis;
}

export function speak(text, { lang = 'en-US', rate = 1 } = {}) {
  return new Promise((resolve, reject) => {
    if (!ttsAvailable()) return reject(new Error('Síntese de voz indisponível neste navegador.'));
    const u = new SpeechSynthesisUtterance(text.replace(/Café/g, 'Cafe'));
    u.lang = lang;
    u.rate = rate;
    const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith(lang.slice(0, 2)));
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = (e) => (e.error === 'interrupted' || e.error === 'canceled' ? resolve() : reject(e));
    speechSynthesis.speak(u);
  });
}

/** Encontra o arquivo pré-gerado para um texto (unit.lines é gerado por tools/build-audio.mjs). */
export function findLine(unit, text) {
  const n = normalize(text);
  return Object.values(unit.lines || {}).find((l) => normalize(l.text) === n) || null;
}

/** Toca uma frase: arquivo pré-gerado → síntese do navegador. Retorna Promise. */
export function playLine(unit, text, { rate = 1 } = {}) {
  stopAll();
  const line = findLine(unit, text);
  if (line && unit._base !== undefined) {
    return new Promise((resolve) => {
      const a = new Audio(assetUrl(unit._base + line.src));
      a.playbackRate = rate;
      currentAudio = a;
      a.onended = () => resolve();
      a.onerror = () => speak(text, { lang: unit.language.bcp47, rate }).then(resolve, resolve);
      a.play().catch(() => speak(text, { lang: unit.language.bcp47, rate }).then(resolve, resolve));
    });
  }
  return speak(text, { lang: unit.language.bcp47, rate }).catch(() => {});
}

/* ---------------- Reconhecimento de fala ---------------- */
const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
export const asrAvailable = () => !!SR;

/** Escuta uma vez. Resolve com {transcript, alternatives[]}; rejeita com mensagem amigável. */
export function listenOnce({ lang = 'en-US', timeoutMs = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!SR) return reject(new Error('Reconhecimento de fala não é suportado neste navegador.'));
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    let done = false;
    const timer = setTimeout(() => { try { rec.stop(); } catch {} }, timeoutMs);
    rec.onresult = (e) => {
      done = true;
      const alts = [...e.results[0]].map((r) => r.transcript);
      resolve({ transcript: alts[0] || '', alternatives: alts });
    };
    rec.onerror = (e) => {
      done = true;
      const msg = { 'not-allowed': 'Permissão de microfone negada.', 'no-speech': 'Não ouvimos nada. Tente de novo, mais perto do microfone.', network: 'O reconhecimento deste navegador precisa de internet.' }[e.error] || `Erro no reconhecimento (${e.error}).`;
      reject(new Error(msg));
    };
    rec.onend = () => { clearTimeout(timer); if (!done) reject(new Error('Não ouvimos nada. Tente de novo.')); };
    rec.start();
  });
}

/* ---------------- Gravação ---------------- */
export const recorderAvailable = () => !!(navigator.mediaDevices?.getUserMedia && globalThis.MediaRecorder);

export class Recorder {
  constructor({ onLevel } = {}) { this.onLevel = onLevel; this.url = null; }
  async start() {
    if (!recorderAvailable()) throw new Error('Gravação não suportada neste navegador.');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.rec = new MediaRecorder(this.stream);
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start();
    // medidor de volume com Web Audio API
    try {
      const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
      this.ctx = new Ctx();
      const src = this.ctx.createMediaStreamSource(this.stream);
      const an = this.ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const buf = new Uint8Array(an.fftSize);
      const loop = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += ((v - 128) / 128) ** 2;
        this.onLevel?.(Math.min(1, Math.sqrt(sum / buf.length) * 4));
        this.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch { /* medidor é opcional */ }
  }
  stop() {
    return new Promise((resolve) => {
      if (!this.rec) return resolve(null);
      this.rec.onstop = () => {
        cancelAnimationFrame(this.raf);
        this.onLevel?.(0);
        this.ctx?.close();
        this.stream.getTracks().forEach((t) => t.stop());
        if (this.url) URL.revokeObjectURL(this.url);
        const blob = new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' });
        this.url = URL.createObjectURL(blob);
        resolve(this.url);
      };
      this.rec.stop();
    });
  }
  get recording() { return this.rec?.state === 'recording'; }
}
