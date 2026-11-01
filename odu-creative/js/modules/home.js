/** Página inicial: identificação da unidade, objetivos e o caminho INPUT → REVIEW. */
import { h, progressBar } from '../core/dom.js';
import { dueSkills } from '../core/srs.js';

const FLOW = [
  { stage: 'INPUT', path: 'quest', icon: '☕', title: 'Café Quest', text: 'Jogo: vá até a cafeteria, leia o cardápio e faça seu pedido em inglês.', module: 'quest' },
  { stage: 'INPUT', path: 'listening', icon: '🎧', title: 'Listening', text: '4 escutas guiadas com transcrição sincronizada e shadowing.', module: 'listening' },
  { stage: 'INTAKE', path: 'discover', icon: '🔎', title: 'Discover the Pattern', text: 'Observe frases, formule sua hipótese e descubra a regra.', module: 'discover' },
  { stage: 'INTAKE', path: 'grammar', icon: '🧪', title: 'Grammar Lab', text: 'Explicações, tabelas, erros comuns e pronúncia.', module: 'grammar' },
  { stage: 'OUTPUT', path: 'practice', icon: '🧩', title: 'Practice Zone', text: 'Reconhecer → compreender → manipular → produzir + avaliação.', module: 'practice' },
  { stage: 'OUTPUT', path: 'speaking', icon: '🎤', title: 'Speaking Studio', text: 'Listen, Repeat, Shadow, Substitute, Respond, Create.', module: 'speaking' },
  { stage: 'FEEDBACK', path: 'progress', icon: '🏅', title: 'Progresso', text: 'Pontos, medalhas e domínio por competência.' },
  { stage: 'REVIEW', path: 'review', icon: '🔁', title: 'Revisão espaçada', text: 'Desafios em novos contextos no momento certo.', module: 'review' },
];

export function render(ctx) {
  const { unit, progress } = ctx;
  const due = dueSkills(progress.srs).length;
  const modDone = FLOW.filter((f) => f.module).reduce((a, f) => a + (progress.modules[f.module] || 0), 0) / FLOW.filter((f) => f.module).length;
  const cover = unit.coverImage ? h('img', { src: unit.coverImage, alt: '', style: { maxHeight: '140px', borderRadius: '16px', float: 'right', marginLeft: '12px' } }) : null;

  return h('div', {},
    h('section', { class: 'hero', 'aria-labelledby': 'unit-title' },
      cover,
      h('div', { class: 'eyebrow', style: { color: '#ffe3a3' } }, `${unit.brand} · Unidade ${unit.unitNumber || 1}`),
      h('h1', { id: 'unit-title' }, unit.title),
      h('p', {}, unit.subtitle),
      h('div', { class: 'meta' }, h('span', {}, unit.language.name), h('span', {}, `Nível ${unit.level}`), h('span', {}, `${unit.age} anos`), h('span', {}, unit.skills.join(' · '))),
      h('div', { class: 'row' },
        h('a', { class: 'btn', href: progress.modules.listening ? '#/quest' : '#/listening' }, progress.modules.listening ? '☕ Jogar Café Quest' : '▶ Começar pela escuta'),
        due ? h('a', { class: 'btn ghost', href: '#/review', style: { color: '#fff', borderColor: '#fff' } }, `🔁 ${due} revisões pendentes`) : null)),
    h('section', { class: 'card', 'aria-labelledby': 'obj-title' },
      h('div', { class: 'row between' }, h('h2', { id: 'obj-title' }, 'Objetivos da unidade'), h('span', { class: 'badge-tag mint' }, `${Math.round(modDone * 100)}% concluído`)),
      progressBar(modDone, 'Progresso geral da unidade'),
      h('p', { class: 'muted small', style: { marginTop: '8px' } }, unit.communicativeGoal),
      h('ul', {}, unit.objectives.map((o) => h('li', {}, o)))),
    h('h2', {}, 'Seu caminho'),
    h('p', { class: 'muted' }, 'INPUT → INTAKE → OUTPUT → FEEDBACK → REVIEW. Siga a ordem sugerida ou escolha um módulo.'),
    h('div', { class: 'flow-cards' }, FLOW.map((f) =>
      h('a', { class: 'card flow-card', href: `#/${f.path}` },
        h('span', { class: 'eyebrow' }, f.stage),
        h('span', { class: 'ico', 'aria-hidden': 'true' }, f.icon),
        h('strong', {}, f.title),
        h('span', { class: 'small muted' }, f.text),
        f.module ? progressBar(progress.modules[f.module] || 0, `Progresso em ${f.title}`) : null))),
    h('section', { class: 'card soft', style: { marginTop: '16px' } },
      h('h3', {}, 'Para professores'),
      h('p', { class: 'small' }, 'Gere a apostila do aluno e do professor em DOCX, edite conteúdos, importe áudios e consulte resultados.'),
      h('div', { class: 'row' }, h('a', { class: 'btn small', href: '#/docs' }, '📄 Apostila'), h('a', { class: 'btn small', href: '#/teacher' }, '👩‍🏫 Painel do professor'))),
  );
}
