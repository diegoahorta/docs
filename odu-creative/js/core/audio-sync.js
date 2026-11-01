/**
 * Reprodução de áudio sincronizada com a transcrição.
 *
 * Fonte principal: arquivo de áudio + trilha de temporização (start/end por segmento).
 * O destaque é calculado a partir de audio.currentTime (requestAnimationFrame), o que é
 * estável em todos os navegadores — não dependemos de eventos "boundary" da síntese de voz.
 *
 * Alternativa: TtsSyncPlayer lê segmento por segmento com a Speech Synthesis API.
 * O destaque troca nos eventos start/end de CADA fala (um utterance por segmento),
 * que são confiáveis; a qualidade da voz depende do navegador/sistema.
 */

/** Busca binária: retorna o índice do segmento ativo no tempo t (ou -1 nos silêncios). */
export function segmentAt(segments, t) {
  let lo = 0, hi = segments.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = segments[mid];
    if (t < s.start) hi = mid - 1;
    else if (t >= s.end) lo = mid + 1;
    else return mid;
  }
  return -1;
}

/** Índice do último segmento já iniciado (útil para manter a legenda nos silêncios). */
export function lastStartedAt(segments, t) {
  let idx = -1;
  for (let i = 0; i < segments.length; i++) if (segments[i].start <= t) idx = i; else break;
  return idx;
}

/** Valida e ordena uma trilha: start < end, sem sobreposição. Retorna lista de problemas. */
export function validateTimings(segments) {
  const problems = [];
  segments.forEach((s, i) => {
    if (!(typeof s.start === 'number' && typeof s.end === 'number')) problems.push(`Segmento ${i + 1}: sem start/end numéricos.`);
    else if (s.end <= s.start) problems.push(`Segmento ${i + 1}: end deve ser maior que start.`);
    if (i > 0 && s.start < segments[i - 1].end) problems.push(`Segmento ${i + 1}: sobrepõe o anterior.`);
  });
  return problems;
}

/** Converte WebVTT (ou SRT) em [{start, end, text}]. */
export function parseVTT(text) {
  const toSec = (ts) => {
    const p = ts.trim().replace(',', '.').split(':').map(Number);
    return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
  };
  const cues = [];
  const blocks = String(text).replace(/\r/g, '').split(/\n\n+/);
  for (const b of blocks) {
    const lines = b.split('\n').filter(Boolean);
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, z] = lines[i].split('-->');
    cues.push({ start: +toSec(a).toFixed(3), end: +toSec(z.split(' ').filter(Boolean)[0]).toFixed(3), text: lines.slice(i + 1).join(' ').trim() });
  }
  return cues;
}

export function toVTT(segments) {
  const ts = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = (s % 60).toFixed(3).padStart(6, '0');
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec}`;
  };
  return 'WEBVTT\n\n' + segments.map((s, i) => `${i + 1}\n${ts(s.start)} --> ${ts(s.end)}\n${s.speaker ? `<v ${s.speaker}>` : ''}${s.text}`).join('\n\n') + '\n';
}

/* ------------------------------------------------------------------ */

class Emitter {
  constructor() { this.handlers = {}; }
  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); return () => this.off(ev, fn); }
  off(ev, fn) { this.handlers[ev] = (this.handlers[ev] || []).filter((f) => f !== fn); }
  emit(ev, ...a) { (this.handlers[ev] || []).forEach((f) => f(...a)); }
}

/**
 * Player baseado em arquivo de áudio.
 * Eventos: 'segment' (index), 'time' (t, duration), 'state' ('playing'|'paused'|'ended'), 'error'
 */
export class SyncPlayer extends Emitter {
  constructor({ src, segments }) {
    super();
    this.kind = 'file';
    this.segments = segments;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.preservesPitch = true;
    this.audio.src = src;
    this.current = -1;
    this.stopAt = null;
    this.raf = 0;
    this.audio.addEventListener('play', () => { this.emit('state', 'playing'); this.loop(); });
    this.audio.addEventListener('pause', () => { cancelAnimationFrame(this.raf); this.tick(); this.emit('state', 'paused'); });
    this.audio.addEventListener('ended', () => { this.stopAt = null; this.emit('state', 'ended'); });
    this.audio.addEventListener('loadedmetadata', () => this.emit('time', 0, this.audio.duration));
    this.audio.addEventListener('error', () => this.emit('error', this.audio.error));
    this.audio.addEventListener('seeked', () => this.tick());
  }
  get duration() { return this.audio.duration || 0; }
  get time() { return this.audio.currentTime; }
  get playing() { return !this.audio.paused; }
  loop() {
    this.tick();
    if (!this.audio.paused) this.raf = requestAnimationFrame(() => this.loop());
  }
  tick() {
    const t = this.audio.currentTime;
    if (this.stopAt !== null && t >= this.stopAt) {
      const done = this.onSegmentDone;
      this.stopAt = null; this.onSegmentDone = null;
      this.audio.pause();
      done?.();
    }
    const idx = segmentAt(this.segments, t);
    if (idx !== this.current) { this.current = idx; this.emit('segment', idx); }
    this.emit('time', t, this.duration);
  }
  play() { this.stopAt = null; this.onSegmentDone = null; return this.audio.play().catch((e) => this.emit('error', e)); }
  pause() { this.audio.pause(); }
  toggle() { return this.playing ? this.pause() : this.play(); }
  seek(t) { this.audio.currentTime = Math.max(0, Math.min(t, this.duration || t)); }
  setRate(r) { this.audio.playbackRate = r; }
  /** Toca de start até end de um ou mais segmentos consecutivos. Resolve quando termina. */
  playRange(fromIdx, toIdx = fromIdx) {
    const a = this.segments[fromIdx], z = this.segments[toIdx];
    if (!a || !z) return Promise.resolve();
    return new Promise((resolve) => {
      this.audio.pause();
      this.audio.currentTime = Math.max(0, a.start - 0.05);
      this.stopAt = z.end + 0.08;
      this.onSegmentDone = resolve;
      this.audio.play().catch((e) => { this.emit('error', e); resolve(); });
    });
  }
  destroy() { cancelAnimationFrame(this.raf); this.audio.pause(); this.audio.src = ''; this.handlers = {}; }
}

/**
 * Player alternativo com síntese de voz do navegador (sem arquivo de áudio).
 * Mesmo contrato de eventos do SyncPlayer. O "tempo" é o índice do segmento.
 */
export class TtsSyncPlayer extends Emitter {
  constructor({ segments, lang = 'en-US', voices = {} }) {
    super();
    this.kind = 'tts';
    this.segments = segments;
    this.lang = lang;
    this.voiceHints = voices;
    this.rate = 1;
    this.current = -1;
    this.playing = false;
    this.token = 0;
  }
  static available() { return 'speechSynthesis' in globalThis && 'SpeechSynthesisUtterance' in globalThis; }
  get duration() { return this.segments.length; }
  get time() { return Math.max(0, this.current); }
  pickVoice(speaker) {
    const all = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith(this.lang.slice(0, 2).toLowerCase()));
    if (!all.length) return null;
    const hint = this.voiceHints[speaker]?.browserHint;
    const female = /female|samantha|zira|aria|jenny|karen|victoria|susan|google us english/i;
    const male = /male|daniel|david|alex|fred|guy|mark/i;
    const pref = all.filter((v) => (hint === 'female' ? female : male).test(v.name));
    return (pref[0] || all[0]);
  }
  speakOne(i, token) {
    return new Promise((resolve) => {
      const s = this.segments[i];
      const u = new SpeechSynthesisUtterance(s.text.replace(/\{([^|{}]+)\|[^|{}]+\}/g, '$1').replace(/Café/g, 'Cafe'));
      u.lang = this.lang;
      u.rate = this.rate;
      const v = this.pickVoice(s.speaker);
      if (v) u.voice = v;
      u.onstart = () => { if (token === this.token) { this.current = i; this.emit('segment', i); this.emit('time', i, this.duration); } };
      u.onend = u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }
  async run(from, to) {
    const token = ++this.token;
    speechSynthesis.cancel();
    this.playing = true;
    this.emit('state', 'playing');
    for (let i = from; i <= to; i++) {
      if (token !== this.token) return;
      await this.speakOne(i, token);
      if (token !== this.token) return;
      await new Promise((r) => setTimeout(r, 350));
    }
    if (token !== this.token) return;
    this.playing = false;
    this.current = -1;
    this.emit('segment', -1);
    this.emit('state', to === this.segments.length - 1 ? 'ended' : 'paused');
  }
  play() { return this.run(Math.max(0, this.current), this.segments.length - 1); }
  pause() { this.token++; speechSynthesis.cancel(); this.playing = false; this.emit('state', 'paused'); }
  toggle() { return this.playing ? this.pause() : this.play(); }
  seek(i) { this.current = Math.max(0, Math.min(Math.round(i), this.segments.length - 1)); this.emit('segment', this.current); }
  setRate(r) { this.rate = r; }
  playRange(fromIdx, toIdx = fromIdx) { return this.run(fromIdx, toIdx); }
  destroy() { this.token++; try { speechSynthesis.cancel(); } catch {} this.handlers = {}; }
}
