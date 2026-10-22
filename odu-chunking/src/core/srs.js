import { SRS_DAYS } from '../config.js';
import { ALL_SENTENCES } from './blocks.js';
import { store } from './store.js';

const DAY = 86_400_000;

/** Caixas de Leitner: 0 (nova) a 5. Intervalos 0 · 1 · 3 · 7 · 21 · 60 dias. */
export function grade(id, rating, now = Date.now()) {
  store.update((s) => {
    const card = (s.srs[id] ??= { box: 0, due: now, reviews: 0 });
    if (rating === 'again') card.box = 0;
    else if (rating === 'hard') card.box = Math.max(1, card.box);
    else if (rating === 'good') card.box = Math.min(5, card.box + 1);
    else if (rating === 'easy') card.box = Math.min(5, card.box + 2);
    card.reviews += 1;
    card.due = rating === 'again' ? now + 60_000 : now + SRS_DAYS[card.box] * DAY;
  });
}

/** Fila do dia: vencidas primeiro, depois novas (até `newLimit`). */
export function dueQueue({ lesson = 'all', newLimit = 10, now = Date.now() } = {}) {
  const { srs } = store.get();
  const pool = ALL_SENTENCES.filter((s) => lesson === 'all' || s.licao === lesson);
  const due = pool.filter((s) => srs[s.id] && srs[s.id].due <= now).sort((a, b) => srs[a.id].due - srs[b.id].due);
  const fresh = pool.filter((s) => !srs[s.id]).slice(0, newLimit);
  return [...due, ...fresh];
}

export function srsSummary(now = Date.now()) {
  const { srs } = store.get();
  const cards = Object.values(srs);
  return {
    vistas: cards.length,
    vencidas: cards.filter((c) => c.due <= now).length,
    dominadas: cards.filter((c) => c.box >= 4).length,
    total: ALL_SENTENCES.length,
  };
}

/** Rótulo do próximo intervalo de cada botão, para mostrar antes da escolha. */
export function previewInterval(id, rating) {
  const box = store.get().srs[id]?.box ?? 0;
  if (rating === 'again') return '1 min';
  const next = { hard: Math.max(1, box), good: Math.min(5, box + 1), easy: Math.min(5, box + 2) }[rating];
  const d = SRS_DAYS[next];
  return d === 1 ? '1 dia' : `${d} dias`;
}
