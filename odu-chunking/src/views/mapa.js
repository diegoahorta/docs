import { langByCode } from '../config.js';
import { lessonById, sentenceText } from '../core/blocks.js';
import { h } from '../core/ui.js';

export async function mount(root) {
  const canvas = h('canvas', { 'aria-label': 'Mapa 3D das frases nos quatro idiomas' });
  const tip = h('div.map-tip', { hidden: true });
  const frame = h('div.map-frame', {}, canvas, tip);
  const legendEl = h('div.map-legend');

  root.append(
    h(
      'div.section-head',
      {},
      h('div', {}, h('span.eyebrow', {}, 'Progresso'), h('h2', {}, 'Mapa 3D')),
      h(
        'p.muted.prose',
        {},
        'Cada ponto é uma frase em um idioma. As linhas ligam a mesma frase em EN, FR, DE e ES. Arraste para girar, use a roda ou dois dedos para aproximar e toque em um ponto para abrir a aula.',
      ),
    ),
    frame,
    legendEl,
  );

  const { createConstellation, STATE_LABELS } = await import('../three/constellation.js');
  const map = createConstellation(canvas, {
    onHover(data, e) {
      if (!data) {
        tip.hidden = true;
        return;
      }
      const { sentence, lang, mastery } = data;
      tip.replaceChildren(
        h('span.eyebrow', {}, `${langByCode[lang].name} · ${lessonById[sentence.licao].titulo}`),
        h('strong', { lang }, sentenceText(lang, sentence.blocks[lang], sentence.p)),
        h('span.muted', {}, `${sentence.pt} · domínio ${Math.round(mastery * 100)}%`),
      );
      tip.hidden = false;
      const rect = frame.getBoundingClientRect();
      const x = Math.min(e.clientX - rect.left + 14, rect.width - tip.offsetWidth - 8);
      const y = Math.min(e.clientY - rect.top + 14, rect.height - tip.offsetHeight - 8);
      tip.style.left = `${Math.max(8, x)}px`;
      tip.style.top = `${Math.max(8, y)}px`;
    },
    onPick({ sentence }) {
      location.hash = `aula-${sentence.licao}`;
    },
  });

  const colors = ['var(--line)', 'var(--b2)', 'var(--b3)'];
  legendEl.append(
    ...STATE_LABELS.map((label, i) =>
      h('span', {}, h('span.dot', { style: { background: colors[i] } }), `${label}: ${map.counts[i]}`),
    ),
    h('span', {}, 'O tamanho do ponto cresce com o domínio (jogo + revisão).'),
  );
  return () => map.dispose();
}
