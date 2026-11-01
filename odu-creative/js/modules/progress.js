/** FEEDBACK — pontos, medalhas, sequência, progresso por módulo e exportação do progresso do aluno. */
import { h, progressBar, download, toast } from '../core/dom.js';
import { BADGES } from '../core/gamify.js';
import { resetProgress } from '../core/store.js';
import { ROUTES } from '../main.js';

export function render(ctx) {
  const { unit, progress } = ctx;
  const modules = ROUTES.filter((r) => r.module);
  const total = progress.attempts.length;
  const firstTry = progress.attempts.filter((a) => a.firstTry);
  const acc = firstTry.length ? firstTry.filter((a) => a.correct).length / firstTry.length : 0;
  const nick = h('input', { type: 'text', id: 'nick', maxlength: 30, placeholder: 'Ex.: Turma 8B — nº 12', autocomplete: 'off' });

  return h('div', {},
    h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Feedback'), h('h1', {}, 'Progresso e medalhas')),
    h('div', { class: 'grid three' },
      stat('⭐', `${progress.xp} XP`, 'Pontos'),
      stat('🔥', `${progress.streak?.days || 0} dia(s)`, 'Sequência de estudo'),
      stat('🎯', total ? `${Math.round(acc * 100)}%` : '—', 'Acertos na 1ª tentativa')),
    h('section', { class: 'card' }, h('h2', {}, 'Módulos'),
      modules.map((m) => h('div', { style: { marginBottom: '10px' } },
        h('div', { class: 'row between' }, h('a', { href: `#/${m.path}` }, `${m.icon} ${m.label}`), h('span', { class: 'small muted' }, `${Math.round((progress.modules[m.module] || 0) * 100)}%`)),
        progressBar(progress.modules[m.module] || 0, m.label)))),
    h('section', { class: 'card' }, h('h2', {}, 'Medalhas'),
      h('div', { class: 'medals' }, BADGES.map((b) => {
        const got = progress.badges.includes(b.id);
        return h('div', { class: `medal ${got ? '' : 'locked'}`, 'aria-label': `${b.name}: ${got ? 'conquistada' : 'ainda não conquistada'}` },
          h('span', { class: 'ico', 'aria-hidden': 'true' }, b.icon), h('strong', {}, b.name), h('div', { class: 'small muted' }, b.desc));
      }))),
    h('section', { class: 'card' }, h('h2', {}, 'Entregar meu progresso ao professor'),
      h('p', { class: 'small' }, 'Seu progresso fica apenas neste dispositivo. Para entregar, gere um arquivo e envie ao professor pelo canal da escola. Não escreva seu nome completo: use um apelido ou o número da chamada.'),
      h('label', { class: 'field', for: 'nick' }, 'Identificação (opcional)'), nick,
      h('div', { class: 'row', style: { marginTop: '10px' } },
        h('button', { class: 'btn primary', onClick: () => {
          const data = { format: 'odu-progress', version: 1, unitId: unit.id, unitTitle: unit.title, student: nick.value.trim() || 'anônimo', exportedAt: new Date().toISOString(),
            xp: progress.xp, modules: progress.modules, badges: progress.badges, srs: progress.srs, attempts: progress.attempts, writing: progress.writing || null };
          download(`progresso-${unit.id}-${(nick.value.trim() || 'aluno').replace(/[^\w-]+/g, '_')}.json`, JSON.stringify(data, null, 2), 'application/json');
        } }, '⬇ Exportar progresso (JSON)'),
        h('button', { class: 'btn ghost', onClick: () => {
          if (confirm('Apagar todo o progresso desta unidade neste dispositivo?')) { resetProgress(unit.id); ctx.reloadUnit(unit.id).then(() => { toast('Progresso apagado.'); location.hash = '#/'; }); }
        } }, 'Apagar meu progresso'))));
}

function stat(icon, value, label) {
  return h('div', { class: 'card', style: { textAlign: 'center' } }, h('div', { style: { fontSize: '1.8rem' }, 'aria-hidden': 'true' }, icon), h('div', { style: { fontSize: '1.5rem', fontWeight: 800 } }, value), h('div', { class: 'small muted' }, label));
}
