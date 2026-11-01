/**
 * Gamificação: pontos (XP), medalhas, sequência de dias.
 * Princípio: recompensar domínio e constância; erros nunca tiram pontos.
 */
import { toast } from './dom.js';
import { celebrate } from './motion.js';
import { classify } from './srs.js';

export const XP = { firstTry: 10, retry: 4, mission: 30, stage: 15, review: 20, speaking: 8 };

export const BADGES = [
  { id: 'first-order', icon: '☕', name: 'Primeiro pedido', desc: 'Concluiu a Missão 1 do Café Quest.' },
  { id: 'all-missions', icon: '🏆', name: 'Cliente da casa', desc: 'Concluiu todas as missões do Café Quest.' },
  { id: 'good-ears', icon: '🎧', name: 'Ouvido atento', desc: 'Completou as 4 etapas de escuta de uma faixa.' },
  { id: 'detective', icon: '🔎', name: 'Detetive de padrões', desc: 'Formulou uma hipótese e revelou a regra.' },
  { id: 'grammar-lab', icon: '🧪', name: 'Cientista da gramática', desc: 'Acertou todas as verificações do Grammar Lab.' },
  { id: 'practice-a-d', icon: '🧩', name: 'Prática completa', desc: 'Concluiu as etapas A, B, C e D.' },
  { id: 'exam-ready', icon: '📝', name: 'Pronto para a prova', desc: 'Atingiu a meta na avaliação de referência.' },
  { id: 'brave-voice', icon: '🎤', name: 'Voz confiante', desc: 'Passou pelas 6 etapas do Speaking Studio.' },
  { id: 'reviewer', icon: '🔁', name: 'Revisão em dia', desc: 'Concluiu um desafio de revisão.' },
  { id: 'streak-3', icon: '🔥', name: '3 dias seguidos', desc: 'Estudou em 3 dias consecutivos.' },
  { id: 'consolidated', icon: '💎', name: 'Conteúdo consolidado', desc: 'Todas as competências da unidade consolidadas.' },
];

export function addXP(p, amount) {
  p.xp = (p.xp || 0) + amount;
  updateXPPill(p.xp);
}

export function updateXPPill(xp) {
  const pill = document.getElementById('xp-pill');
  if (pill) pill.textContent = `${xp} XP`;
}

export function award(p, badgeId) {
  if (p.badges.includes(badgeId)) return false;
  const b = BADGES.find((x) => x.id === badgeId);
  if (!b) return false;
  p.badges.push(badgeId);
  toast(`${b.icon} Medalha: ${b.name}!`, { kind: 'medal-toast', timeout: 4500 });
  const region = document.getElementById('toasts');
  celebrate(region?.lastElementChild);
  return true;
}

/** Atualiza a sequência de dias de estudo (chamado ao abrir o app e ao responder). */
export function touchStreak(p, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const last = p.streak?.last;
  if (last === today) return;
  const y = new Date(now); y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  p.streak = { last: today, days: last === yesterday ? (p.streak.days || 0) + 1 : 1 };
  if (p.streak.days >= 3) award(p, 'streak-3');
}

export function checkConsolidated(p, skills, cfg) {
  if (skills.length && skills.every((s) => classify(p.srs[s], cfg) === 2)) award(p, 'consolidated');
}
