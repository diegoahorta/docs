/**
 * CAFÉ QUEST — jogo de missões (Input + Output contextualizado).
 * O aluno entra na cafeteria, lê o cardápio, ouve a atendente e responde escolhendo, escrevendo ou falando.
 * Erros geram feedback pragmático/gramatical e nova tentativa — nunca "game over".
 */
import { h, clear, shuffle, announce } from '../core/dom.js';
import { matchUtterance, articleErrors } from '../core/evaluate.js';
import { tl, plainText, money } from '../core/text.js';
import { playLine, asrAvailable, listenOnce, stopAll } from '../core/speech.js';
import { moveTo, success, gentleShake, celebrate } from '../core/motion.js';
import { award, addXP, XP } from '../core/gamify.js';

export function render(ctx) {
  const { unit, progress } = ctx;
  const game = unit.game;
  const root = h('div', {});
  const qstate = progress.quest;
  const en = unit.language.code === 'en';
  const T = (text, o) => tl(unit, text, { noRomaji: true, ...o });
  const $ = (v) => money(unit, v);

  function missionList() {
    clear(root).append(
      h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Módulo 1 · Input + Output'), h('h1', {}, `☕ ${game.title}`), h('p', {}, game.intro),
        !progress.modules.listening ? h('p', { class: 'notice' }, 'Dica: faça antes a escuta do diálogo no módulo Listening — as falas da atendente vão soar familiares.') : null),
      h('div', { class: 'mission-list' }, game.missions.map((m, i) => {
        const st = qstate[m.id] || {};
        const locked = i > 0 && !qstate[game.missions[i - 1].id]?.done;
        return h('section', { class: 'card' },
          h('div', { class: 'row between' }, h('h2', { style: { margin: 0 } }, m.title), h('span', { class: 'stars', 'aria-label': `${st.stars || 0} de 3 estrelas` }, '★'.repeat(st.stars || 0) + '☆'.repeat(3 - (st.stars || 0)))),
          h('p', {}, T(m.brief)),
          h('button', { class: 'btn primary', disabled: locked, onClick: () => play(m) }, locked ? '🔒 Conclua a missão anterior' : st.done ? '↺ Jogar de novo' : '▶ Jogar'));
      })));
  }

  function play(m) {
    let stepIdx = 0;
    let mistakes = 0;
    let wallet = m.budget;
    let mode = ctx.settings.questMode || 'choose';
    const ticketDone = new Set();

    const scene = sceneSVG(unit);
    const avatar = scene.querySelector('#avatar');
    const hud = h('div', { class: 'quest-hud' });
    const dialog = h('section', { class: 'card', 'aria-live': 'polite', 'aria-label': 'Conversa' });
    const side = h('aside', { class: 'stack' });
    clear(root).append(
      h('div', { class: 'row between' }, h('button', { class: 'btn small ghost', onClick: () => { stopAll(); missionList(); } }, '← Missões'), h('strong', {}, m.title)),
      h('div', { class: 'quest-stage' }, scene), hud,
      h('div', { class: 'grid two' }, dialog, side));
    drawHud(); drawSide();

    dialog.append(h('p', {}, h('strong', {}, 'Missão: '), T(m.brief)),
      h('button', { class: 'btn primary', onClick: async (e) => {
        e.currentTarget.disabled = true;
        scene.querySelector('#door').setAttribute('fill', '#7cc5a4');
        await moveTo(avatar, { x: 330 }, 1.6);
        nextStep();
      } }, '🚶 Entrar na cafeteria'));

    function drawHud() {
      clear(hud).append(
        h('span', { class: 'pill' }, `💵 Carteira: ${$(wallet)}`),
        h('span', { class: 'pill' }, `Fala ${Math.min(stepIdx + 1, m.steps.length)}/${m.steps.length}`),
        h('span', { class: 'pill' }, `Tentativas extras: ${mistakes}`));
    }
    function drawSide() {
      clear(side).append(...[
        m.memo ? h('div', { class: 'ticket memo', 'aria-label': 'Bilhete da missão' }, h('strong', {}, '📝 MEMO'), tl(unit, m.memo, { tag: 'div' })) : null,
        menuBoard(unit),
        h('div', { class: 'ticket', 'aria-label': 'Pedido da missão' }, h('strong', {}, 'ORDER TICKET'),
          h('ul', {}, m.ticket.map((t, i) => h('li', { class: ticketDone.has(i) ? 'done' : '' }, ticketDone.has(i) ? '☑ ' : '☐ ', T(t)))))].filter(Boolean));
    }

    async function nextStep() {
      const step = m.steps[stepIdx];
      drawHud();
      clear(dialog);
      const ptLine = h('div', { class: 'small muted', hidden: true, lang: 'pt-BR' }, step.npcPt);
      dialog.append(h('div', { class: 'bubble' },
        h('div', { class: 'speaker' }, game.npcLabel || 'MIA — BARISTA'),
        tl(unit, step.npc, { tag: 'div', cls: 'line' }), ptLine,
        h('div', { class: 'row', style: { marginTop: '6px' } },
          h('button', { class: 'btn small', onClick: () => playLine(unit, step.npc) }, '🔊 Ouvir de novo'),
          h('button', { class: 'btn small', onClick: () => playLine(unit, step.npc, { rate: 0.75 }) }, '🐢 Devagar'),
          h('button', { class: 'btn small ghost', onClick: () => (ptLine.hidden = !ptLine.hidden) }, 'Ajuda (PT)'))));
      if (step.prompt) dialog.append(h('p', { class: 'notice' }, '🎯 ', T(step.prompt)));
      const area = h('div', {});
      dialog.append(area);
      playLine(unit, step.npc);
      if (step.pay) return payArea(area, step);
      responseArea(area, step);
    }

    function responseArea(area, step) {
      const modes = [['choose', '👆 Escolher'], ['write', '⌨ Escrever'], ['speak', '🎤 Falar']];
      const tabsRow = h('div', { class: 'row', role: 'group', 'aria-label': 'Modo de resposta' }, modes.map(([k, label]) =>
        h('button', { class: 'btn small', 'aria-pressed': String(mode === k), onClick: () => { mode = k; ctx.setSettings({ questMode: k }); responseArea(clear(area), step); } }, label)));
      const fb = h('div', { 'aria-live': 'polite' });
      const body = h('div', { style: { marginTop: '10px' } });
      area.append(tabsRow, body, fb);
      const correctText = plainText(unit, step.choices.find((c) => c.ok)?.text);

      if (mode === 'choose') {
        body.append(h('div', { class: 'options' }, shuffle(step.choices).map((c) => h('button', { class: 'btn opt', onClick: (e) => {
          if (c.ok) accept(c.text, c.fb, step, fb);
          else reject(c.fb, fb, e.currentTarget);
        } }, tl(unit, c.text)))));
      } else if (mode === 'write') {
        const inp = h('input', { type: 'text', 'aria-label': `Escreva sua fala em ${unit.language.name.toLowerCase()}`, autocomplete: 'off', spellcheck: 'false', placeholder: game.writePlaceholder || 'Type your answer…', lang: unit.language.bcp47 });
        let tries = 0;
        const send = () => {
          const text = inp.value.trim();
          if (!text) return;
          const ok = matchUtterance(text, step.match);
          const art = en ? articleErrors(text) : []; // a/an só existe no inglês
          if (ok && !art.length) accept(text, 'Ótimo! Você escreveu sua própria fala.', step, fb);
          else {
            tries++;
            const why = art.length ? `Confira o artigo: “${art[0].found} ${art[0].word}” → “${art[0].expected} ${art[0].word}”.`
              : `${game.npcName || 'Mia'} não entendeu bem. Responda o que ela perguntou e use as palavras da missão.`;
            reject(tries >= 2 ? `${why} Exemplo possível: “${correctText}”` : why, fb, inp);
          }
        };
        inp.addEventListener('keydown', (e) => e.key === 'Enter' && send());
        body.append(h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', onClick: send }, 'Enviar')));
        inp.focus();
      } else {
        if (!asrAvailable()) {
          body.append(h('p', { class: 'notice warn' }, 'Este navegador não oferece reconhecimento de fala (funciona no Chrome, Edge e Safari). Fale em voz alta mesmo assim e depois use “Escolher” ou “Escrever”.'));
          return;
        }
        const out = h('p', { class: 'small' });
        const btn = h('button', { class: 'btn accent', onClick: async () => {
          btn.disabled = true; btn.textContent = '🎙 Ouvindo…';
          try {
            const { transcript, alternatives } = await listenOnce({ lang: unit.language.bcp47 });
            out.textContent = `Entendemos: “${transcript}”`;
            // Na fala não cobramos a/an: o reconhecimento automático confunde artigos curtos.
            if (alternatives.some((t) => matchUtterance(t, step.match))) accept(transcript, `${game.npcName || 'Mia'} entendeu você! 🎉`, step, fb);
            else reject(`A transcrição automática pode errar — isso não é uma nota da sua pronúncia. Tente de novo falando devagar, ou use “Escolher”. Exemplo: “${correctText}”`, fb, btn);
          } catch (err) { out.textContent = err.message; }
          btn.disabled = false; btn.textContent = '🎤 Falar';
        } }, '🎤 Falar');
        body.append(btn, out, h('p', { class: 'small muted' }, 'O áudio é processado pelo serviço de reconhecimento do navegador; nada é gravado pela ODU CREATIVE.'));
      }
    }

    function payArea(area, step) {
      const fb = h('div', { 'aria-live': 'polite' });
      area.append(h('p', {}, 'Ouça o preço e toque na quantia certa:'),
        h('div', { class: 'row' }, shuffle(step.pay.options).map((v) => h('button', { class: 'money', onClick: (e) => {
          if (Math.abs(v - step.pay.amount) < 0.001) {
            if (v > wallet + 0.001) return reject('Você não tem dinheiro suficiente.', fb, e.currentTarget);
            wallet -= v;
            accept(game.payLine || 'Here you are.', en ? `Isso! ${$(v)} = ${step.npc.replace(/^(That's|It's) /, '').replace(/\.$/, '')}.` : `Isso! ${$(v)}.`, step, fb);
          } else if (step.pay.hint) reject(step.pay.hint, fb, e.currentTarget);
          else if (en) reject(v >= 10 ? 'Ouça de novo: o preço tem um só dígito antes do ponto? Compare four (4) × fourteen (14) × forty (40), seven (7) × seventeen (17).' : 'Ouça de novo com atenção aos centavos: fifty (50) × fifteen (15).', fb, e.currentTarget);
          else reject('Ouça o preço de novo com atenção.', fb, e.currentTarget);
        } }, $(v)))), fb);
    }

    function accept(text, msg, step, fb) {
      if (step.ticketDone !== undefined) ticketDone.add(step.ticketDone);
      drawSide();
      clear(fb).append(h('div', { class: 'bubble player' }, h('div', { class: 'speaker' }, game.playerLabel || 'YOU'), tl(unit, text, { tag: 'div', cls: 'line' })),
        h('div', { class: 'feedback' }, '✓ ', msg));
      success(fb);
      announce('Certo! ' + msg);
      fb.parentElement?.querySelectorAll('button').forEach((b) => (b.disabled = true));
      playLine(unit, text).then(() => {
        stepIdx++;
        if (step.end || stepIdx >= m.steps.length) finish();
        else setTimeout(nextStep, 400);
      });
    }

    function reject(msg, fb, el) {
      mistakes++;
      drawHud();
      clear(fb).append(h('div', { class: 'feedback wrong' }, h('strong', {}, `${game.npcSorry || 'Mia: “Sorry?”'} `), msg));
      gentleShake(el);
      if (el?.classList?.contains('opt')) el.classList.add('wrong');
      announce('Ainda não. ' + msg);
    }

    async function finish() {
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      const prev = qstate[m.id] || {};
      qstate[m.id] = { done: true, stars: Math.max(stars, prev.stars || 0), plays: (prev.plays || 0) + 1 };
      addXP(progress, XP.mission + stars * 5);
      if (m.id === game.missions[0].id) award(progress, 'first-order');
      if (game.missions.every((x) => qstate[x.id]?.done)) award(progress, 'all-missions');
      ctx.setModule('quest', game.missions.filter((x) => qstate[x.id]?.done).length / game.missions.length);
      await moveTo(avatar, { x: 0 }, 1.2);
      const nextM = game.missions[game.missions.indexOf(m) + 1];
      const card = h('section', { class: 'card', style: { textAlign: 'center' } },
        h('h2', {}, '🎉 Missão cumprida!'),
        h('div', { class: 'stars', 'aria-label': `${stars} de 3 estrelas` }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
        h('p', {}, mistakes === 0 ? 'Perfeito: tudo certo de primeira!' : `Você precisou de ${mistakes} tentativa(s) extra(s) — e conseguiu. É assim que se aprende!`),
        h('p', { class: 'small muted' }, `Troco na carteira: ${$(wallet)}`),
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn', onClick: () => play(m) }, '↺ Jogar de novo'),
          nextM ? h('button', { class: 'btn primary', onClick: () => play(nextM) }, 'Próxima missão →') : h('a', { class: 'btn primary', href: '#/discover' }, 'Descobrir o padrão →'),
          h('button', { class: 'btn ghost', onClick: missionList }, 'Missões')));
      clear(dialog).append(card);
      celebrate(card);
    }
  }

  missionList();
  return root;
}

export function menuBoard(unit) {
  return h('div', { class: 'menu-board', lang: unit.language.bcp47, 'aria-label': `Cardápio: ${unit.menu.name}` },
    h('h3', {}, unit.menu.name.toUpperCase()),
    unit.menu.sections.map((s) => h('div', {}, h('strong', {}, s.title), h('ul', {}, s.items.map((it) =>
      h('li', {}, tl(unit, it.name, { noRomaji: true }), h('span', {}, it.sizes ? Object.entries(it.sizes).map(([k, v]) => `${k[0].toUpperCase()} ${money(unit, v)}`).join(' · ') : money(unit, it.price))))))));
}

/** Cena SVG simples e leve (sem imagens externas). */
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Três primeiros itens do cardápio desenhados no quadro da cena. */
function boardLines(unit) {
  const items = unit.menu.sections.flatMap((s) => s.items).slice(0, 3);
  return items.map((it, i) => {
    const price = it.sizes ? `${money(unit, Math.min(...Object.values(it.sizes)))}+` : money(unit, it.price);
    return `<text x="540" y="${98 + i * 22}">${esc(plainText(unit, it.name))}</text><text x="740" y="${98 + i * 22}" text-anchor="end">${esc(price)}</text>`;
  }).join('');
}

function sceneSVG(unit) {
  const ns = 'http://www.w3.org/2000/svg';
  const wrap = document.createElementNS(ns, 'svg');
  wrap.setAttribute('viewBox', '0 0 800 450');
  wrap.setAttribute('class', 'scene');
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', 'Cafeteria Sunny Corner: balcão com a atendente Mia; você entra pela porta à esquerda.');
  wrap.innerHTML = `
    <rect width="800" height="450" fill="#ffe9c7"/>
    <rect y="330" width="800" height="120" fill="#e0b98a"/>
    <g opacity=".35">${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 80}" y="330" width="40" height="120" fill="#c99a68"/>`).join('')}</g>
    <rect x="20" y="150" width="110" height="180" rx="8" fill="#8a5a3c"/>
    <rect id="door" x="32" y="162" width="86" height="168" rx="6" fill="#b9e3f0"/>
    <circle cx="105" cy="250" r="5" fill="#5a3a24"/>
    <text x="75" y="140" font-size="16" text-anchor="middle" fill="#5a3a24" font-family="sans-serif" font-weight="700">${esc(unit.game.doorSign || 'OPEN')}</text>
    <rect x="520" y="40" width="240" height="130" rx="10" fill="#2d2a26"/>
    <text x="640" y="72" font-size="18" text-anchor="middle" fill="#ffc93c" font-family="sans-serif" font-weight="800">MENU</text>
    <g fill="#f8f1e0" font-family="sans-serif" font-size="13">
      ${boardLines(unit)}
    </g>
    <g id="barista" transform="translate(600 170)">
      <rect x="-34" y="70" width="68" height="90" rx="20" fill="#5b3df5"/>
      <rect x="-24" y="80" width="48" height="70" rx="10" fill="#fff" opacity=".9"/>
      <circle cx="0" cy="40" r="34" fill="#c98b62"/>
      <path d="M-34 36 Q0 -10 34 36 L34 20 Q0 -18 -34 20 Z" fill="#2b1a12"/>
      <circle cx="-12" cy="42" r="4" fill="#1d1a2b"/><circle cx="12" cy="42" r="4" fill="#1d1a2b"/>
      <path d="M-10 56 Q0 64 10 56" stroke="#1d1a2b" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
    <rect x="430" y="290" width="350" height="60" rx="10" fill="#ff6b4a"/>
    <rect x="430" y="280" width="350" height="18" rx="8" fill="#ffb199"/>
    <g transform="translate(470 252)"><rect width="26" height="30" rx="4" fill="#fff"/><path d="M26 8 q10 0 10 9 q0 9 -10 9" stroke="#fff" stroke-width="4" fill="none"/></g>
    <g id="avatar" transform="translate(0 0)">
      <g transform="translate(170 205)">
        <rect x="-26" y="62" width="52" height="80" rx="18" fill="#12a586"/>
        <rect x="-22" y="138" width="16" height="44" rx="6" fill="#1d1a2b"/><rect x="6" y="138" width="16" height="44" rx="6" fill="#1d1a2b"/>
        <circle cx="0" cy="34" r="30" fill="#8d5a3b"/>
        <path d="M-30 30 Q-26 -4 0 2 Q28 -4 30 30 Q18 12 0 14 Q-18 12 -30 30Z" fill="#1d1a2b"/>
        <circle cx="-10" cy="38" r="4" fill="#1d1a2b"/><circle cx="10" cy="38" r="4" fill="#1d1a2b"/>
        <path d="M-8 50 Q0 56 8 50" stroke="#1d1a2b" stroke-width="3" fill="none" stroke-linecap="round"/>
        <rect x="-30" y="66" width="12" height="40" rx="6" fill="#ffc93c"/>
      </g>
    </g>`;
  return wrap;
}
