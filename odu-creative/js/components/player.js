/**
 * Interface do player sincronizado (reutilizada em Listening e Speaking).
 * - Play/pause, voltar 5 s, velocidade, barra de posição
 * - Transcrição com destaque do segmento ativo, clique para ouvir um trecho
 * - Ocultar/revelar texto, tradução opcional, legenda ao vivo
 */
import { h, clear, fmtTime, announce } from '../core/dom.js';

const SOURCE_LABEL = {
  file: 'Áudio da unidade com trilha de tempo.',
  imported: 'Áudio importado pelo professor.',
  tts: 'Sem arquivo de áudio disponível: usando a voz do navegador (o destaque acompanha cada frase).',
  none: 'Áudio indisponível: este navegador não reproduz o arquivo e não possui síntese de voz.',
};

export async function createPlayerUI(ctx, track, { transcript = 'visible', translation = false, allowToggle = true, onEnded, onSegment } = {}) {
  const { player, source } = await ctx.trackPlayer(track.id);
  const root = h('section', { class: 'card player', 'aria-label': `Player: ${track.title}` });
  if (!player) {
    root.append(h('p', { class: 'notice warn' }, SOURCE_LABEL.none));
    return { el: root, player: null };
  }

  const synthetic = track.audioSource?.startsWith('synthetic') && source === 'file';
  const playBtn = h('button', { class: 'btn primary play-btn', 'aria-label': 'Reproduzir', onClick: () => player.toggle() }, '▶');
  const back = h('button', { class: 'btn small', 'aria-label': 'Voltar 5 segundos', onClick: () => player.seek(player.kind === 'tts' ? player.time - 1 : player.time - 5) }, '⟲ 5s');
  const speed = h('select', { 'aria-label': 'Velocidade', class: 'small', style: { width: 'auto' }, onChange: (e) => player.setRate(Number(e.target.value)) },
    ['0.75', '0.9', '1', '1.25'].map((v) => h('option', { value: v, selected: v === '1' }, `${v}×`)));
  const time = h('span', { class: 'time', 'aria-live': 'off' }, '0:00 / 0:00');
  const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Posição do áudio',
    onInput: (e) => player.seek((Number(e.target.value) / 1000) * player.duration) });

  const caption = h('div', { class: 'caption-box', 'aria-live': 'polite', 'aria-label': 'Legenda' }, h('span', { class: 'muted small' }, 'A legenda aparece aqui durante a reprodução.'));
  const list = h('div', { class: 'transcript', role: 'list' });
  const segEls = track.segments.map((s, i) => {
    const el = h('div', { class: 'seg', role: 'listitem', dataset: { i } },
      h('span', { class: `who ${s.speaker}` }, s.speaker),
      h('span', {}, h('span', { class: 'txt', lang: ctx.unit.language.bcp47 }, s.text), h('span', { class: 'pt', lang: 'pt-BR', hidden: !translation }, s.pt)),
      h('button', { class: 'btn small ghost', 'aria-label': `Ouvir a fala ${i + 1}: ${s.text}`, onClick: () => player.playRange(i) }, '▶'));
    list.append(el);
    return el;
  });

  let mode = transcript; // 'visible' | 'hidden' | 'none'
  const toggleText = h('button', { class: 'btn small', 'aria-pressed': 'false', onClick: () => setTranscript(mode === 'visible' ? 'hidden' : 'visible') });
  const toggleTr = h('button', { class: 'btn small', 'aria-pressed': String(translation), onClick: () => setTranslation(toggleTr.getAttribute('aria-pressed') !== 'true') }, 'Tradução PT');
  const toggleCap = h('button', { class: 'btn small', 'aria-pressed': String(!!ctx.settings.captions), onClick: () => { const on = toggleCap.getAttribute('aria-pressed') !== 'true'; toggleCap.setAttribute('aria-pressed', String(on)); caption.hidden = !on; } }, 'Legenda');
  caption.hidden = !ctx.settings.captions;

  function setTranscript(m) {
    mode = m;
    list.hidden = m === 'none';
    list.classList.toggle('hidden-text', m === 'hidden');
    toggleText.textContent = m === 'hidden' ? '👁 Revelar texto' : '🙈 Ocultar texto';
    toggleText.setAttribute('aria-pressed', String(m === 'hidden'));
    segEls.forEach((el) => el.querySelector('.txt').setAttribute('aria-hidden', String(m === 'hidden')));
  }
  function setTranslation(on) {
    toggleTr.setAttribute('aria-pressed', String(on));
    segEls.forEach((el) => (el.querySelector('.pt').hidden = !on));
  }
  setTranscript(mode);

  player.on('segment', (i) => {
    segEls.forEach((el, j) => el.classList.toggle('active', i === j));
    if (i >= 0) {
      const s = track.segments[i];
      clear(caption).append(h('strong', {}, `${s.speaker}: `), mode === 'hidden' ? '…' : s.text);
      if (mode === 'visible') segEls[i].scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
    onSegment?.(i);
  });
  player.on('time', (t, d) => {
    if (player.kind === 'tts') { time.textContent = `fala ${Math.max(1, Math.round(t) + 1)} / ${d}`; range.value = d ? (t / d) * 1000 : 0; return; }
    time.textContent = `${fmtTime(t)} / ${fmtTime(d)}`;
    if (d) range.value = (t / d) * 1000;
  });
  player.on('state', (s) => {
    playBtn.textContent = s === 'playing' ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', s === 'playing' ? 'Pausar' : 'Reproduzir');
    if (s === 'ended') { onEnded?.(); announce('Fim do áudio.'); }
  });
  player.on('error', () => root.prepend(h('p', { class: 'notice warn' }, 'Não foi possível reproduzir o áudio. Toque em ▶ novamente ou verifique o volume.')));

  root.append(
    h('div', { class: 'row between' }, h('h3', { style: { margin: 0 } }, `🎧 ${track.title}`),
      h('span', { class: 'small muted' }, SOURCE_LABEL[source], synthetic ? ' Voz sintética (espeak-ng + MBROLA).' : '')),
    h('div', { class: 'controls' }, playBtn, back, speed, time),
    range,
    caption,
    allowToggle ? h('div', { class: 'row' }, toggleText, toggleTr, toggleCap) : null,
    list,
    h('p', { class: 'small muted' }, 'Atalho: com o foco no player, tecle ', h('kbd', {}, 'Espaço'), ' para tocar/pausar.'),
  );
  root.tabIndex = -1;
  root.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); player.toggle(); }
  });

  return { el: root, player, source, setTranscript, setTranslation, segEls };
}
