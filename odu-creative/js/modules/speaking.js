/**
 * MÓDULO 5 — SPEAKING STUDIO.
 * Listen → Repeat → Shadow → Substitute → Respond → Create.
 *
 * Princípios:
 * - Nenhuma "nota de pronúncia": não há critério verificável no navegador para isso.
 * - A transcrição automática (quando existe) é um AUXÍLIO para o aluno se ouvir, não uma avaliação.
 * - Modo sem microfone: autoavaliação + resposta digitada.
 */
import { h, clear, tabs, announce } from '../core/dom.js';
import { createPlayerUI } from '../components/player.js';
import { playLine, Recorder, recorderAvailable, asrAvailable, listenOnce, stopAll } from '../core/speech.js';
import { wordDiff, matchUtterance, expectedArticle } from '../core/evaluate.js';
import { award, addXP, XP } from '../core/gamify.js';
import { success, gentleShake } from '../core/motion.js';
import { tl, plainText, jaControls } from '../core/text.js';

const STEPS = [
  ['listen', '1. Listen'], ['repeat', '2. Repeat'], ['shadow', '3. Shadow'],
  ['substitute', '4. Substitute'], ['respond', '5. Respond'], ['create', '6. Create'],
];

export function render(ctx) {
  const { unit, progress } = ctx;
  const sp = (progress.speaking.steps ||= {});
  const lang = unit.language.bcp47;
  const T = (text, o) => tl(unit, text, { noRomaji: true, ...o });
  const track = unit.tracks.find((t) => t.id === unit.speaking.shadowTrack) || unit.tracks[0];
  const seg = (id) => unit.tracks.flatMap((t) => t.segments.map((s, i) => ({ ...s, track: t, index: i }))).find((s) => s.id === id);

  const markStep = (k) => {
    if (!sp[k]) { sp[k] = true; addXP(progress, XP.speaking); }
    ctx.setModule('speaking', Object.keys(sp).length / STEPS.length);
    if (STEPS.every(([key]) => sp[key])) award(progress, 'brave-voice');
    ctx.save();
  };
  const noMic = () => !!ctx.settings.noMic || !recorderAvailable();

  async function playSeg(s, rate = 1) {
    const { player } = await ctx.trackPlayer(s.track.id);
    if (!player) return playLine(unit, s.text, { rate });
    player.setRate(rate);
    await player.playRange(s.index);
    player.setRate(1);
  }

  /* ---------- Widget de gravação / prática ---------- */
  function practiceWidget(target, { onDone, autoPlay } = {}) {
    const box = h('div', { class: 'stack', style: { marginTop: '8px' } });
    const out = h('div', { 'aria-live': 'polite' });
    if (noMic()) {
      const inp = h('input', { type: 'text', placeholder: 'Opcional: digite o que você falou', lang, 'aria-label': 'Digite o que você falou' });
      box.append(h('div', { class: 'row' },
        h('button', { class: 'btn', onClick: () => { clear(out).append(h('p', { class: 'feedback' }, '✓ Ótimo! Falar em voz alta já é prática.')); onDone?.(); } }, '✓ Falei em voz alta'),
        inp, h('button', { class: 'btn small', onClick: () => showDiff(inp.value) }, 'Comparar texto')), out);
      return box;
    }
    const meter = h('div', { class: 'level-meter', 'aria-hidden': 'true' }, h('span', {}));
    const rec = new Recorder({ onLevel: (v) => (meter.firstChild.style.width = `${Math.round(v * 100)}%`) });
    const audio = h('audio', { controls: true, hidden: true, 'aria-label': 'Sua gravação' });
    const recBtn = h('button', { class: 'btn accent', onClick: async () => {
      if (rec.recording) {
        const url = await rec.stop();
        audio.src = url; audio.hidden = false;
        recBtn.textContent = '🎙 Gravar de novo';
        clear(out).append(h('p', { class: 'small' }, 'Ouça sua gravação e compare com o modelo. Percebeu alguma diferença de ritmo ou som?'));
        onDone?.();
      } else {
        try {
          stopAll();
          if (autoPlay) await autoPlay();
          await rec.start();
          recBtn.textContent = '■ Parar gravação';
        } catch (e) { clear(out).append(h('p', { class: 'notice warn' }, `Microfone indisponível: ${e.message}. Ative “Praticar sem microfone” no topo.`)); }
      }
    } }, '🎙 Gravar');
    const asrBtn = asrAvailable() ? h('button', { class: 'btn small', onClick: async () => {
      asrBtn.disabled = true; asrBtn.textContent = '👂 Ouvindo…';
      try { const { transcript } = await listenOnce({ lang }); showDiff(transcript, true); onDone?.(); }
      catch (e) { clear(out).append(h('p', { class: 'notice warn' }, e.message)); }
      asrBtn.disabled = false; asrBtn.textContent = '📝 Transcrever minha fala (auxílio)';
    } }, '📝 Transcrever minha fala (auxílio)') : null;
    box.append(h('div', { class: 'row' }, recBtn, asrBtn), meter, audio, out);
    return box;

    function showDiff(text, asr = false) {
      if (!target || !text.trim()) return;
      const diff = wordDiff(target, text);
      const hits = diff.filter((d) => d.hit).length;
      clear(out).append(h('div', { class: 'card soft' },
        asr ? h('p', { class: 'small' }, `Transcrição automática: “${text}”`) : null,
        h('p', { class: 'word-diff', lang }, diff.map((d) => h('span', { class: d.hit ? 'hit' : 'miss' }, d.word))),
        h('p', { class: 'small muted' }, `${hits} de ${diff.length} palavras reconhecidas. ${asr ? 'O reconhecimento automático erra com frequência (ruído, sotaque, palavras curtas). Use como pista, não como nota.' : ''}`)));
    }
  }

  /* ---------- Etapas ---------- */
  const views = {
    async listen() {
      const el = h('div', {}, h('p', {}, 'Ouça o diálogo-modelo inteiro. Preste atenção ao ritmo, às pausas e à entonação das perguntas.'));
      ctx.disposePlayers();
      const ui = await createPlayerUI(ctx, track, { transcript: 'visible', translation: false, onEnded: () => markStep('listen') });
      el.append(ui.el, h('button', { class: 'btn small ghost', onClick: () => markStep('listen') }, 'Marcar como ouvido'));
      return el;
    },
    repeat() {
      const lines = unit.speaking.repeatSegments.map(seg).filter(Boolean);
      const done = new Set();
      return h('div', {}, h('p', {}, 'Ouça cada frase curta, depois grave a sua versão. Repita quantas vezes quiser.'),
        lines.map((s) => h('div', { class: 'card' },
          h('div', { class: 'row between' }, tl(unit, s.text, { tag: 'strong' }), h('span', { class: 'small muted' }, s.pt)),
          h('div', { class: 'row' }, h('button', { class: 'btn small', onClick: () => playSeg(s) }, '▶ Modelo'), h('button', { class: 'btn small', onClick: () => playSeg(s, 0.75) }, '🐢 Devagar')),
          practiceWidget(s.text, { onDone: () => { done.add(s.id); if (done.size >= Math.min(3, lines.length)) markStep('repeat'); } }))));
    },
    shadow() {
      const lines = unit.speaking.repeatSegments.map(seg).filter(Boolean);
      return h('div', {}, h('p', {}, 'Shadowing: fale AO MESMO TEMPO que o áudio, como uma sombra. Ao gravar, o modelo toca junto (use fones de ouvido para não gravar o modelo).'),
        lines.map((s) => h('div', { class: 'card' }, tl(unit, s.text, { tag: 'strong' }),
          practiceWidget(s.text, { autoPlay: async () => { playSeg(s, 0.9); }, onDone: () => markStep('shadow') }))));
    },
    substitute() {
      // Substituição genérica: frase-modelo com {item} e {choice} (inglês usa {article} com a/an).
      const sub = unit.speaking.substitution;
      const choices = sub.choices || ['a', 'an'];
      const keyOf = (it) => it.choice ?? it.article;
      let item = null; let choice = null;
      const sentence = h('div', { style: { fontSize: '1.3rem', fontWeight: 700 }, 'aria-live': 'polite' });
      const fb = h('div', { 'aria-live': 'polite' });
      const widget = h('div', {});
      const fill = (c, it) => sub.frame.replace(/\{(choice|article)\}/, c).replace('{item}', it.item);
      const draw = () => {
        const parts = sub.frame.split(/(\{choice\}|\{article\}|\{item\})/);
        clear(sentence).append(...parts.map((p) => (/^\{(choice|article)\}$/.test(p)
          ? h('span', { class: 'chunk', style: { background: 'var(--accent-soft)' } }, choice ? T(choice) : '___')
          : p === '{item}' ? h('span', { class: 'chunk', style: { background: 'var(--mint-soft)' } }, item ? T(item.item) : '______') : T(p))));
        if (item?.cue) sentence.append(h('div', { class: 'small muted', style: { fontWeight: 500 } }, `🎯 ${item.cue}`));
      };
      const pick = (c) => {
        choice = c;
        draw();
        if (!item) return;
        if (c === keyOf(item)) {
          const text = fill(c, item);
          clear(fb).append(h('div', { class: 'feedback' }, '✓ Isso! Agora ouça e diga a frase.', h('button', { class: 'btn small', style: { marginLeft: '8px' }, onClick: () => playLine(unit, text) }, '▶ Modelo')));
          clear(widget).append(practiceWidget(text, { onDone: () => markStep('substitute') }));
          success(fb);
        } else {
          const why = item.hint || (unit.language.code === 'en'
            ? `Ouça o início de “${item.item}”: começa com som de ${expectedArticle(item.item) === 'an' ? 'vogal → an' : 'consoante → a'}.`
            : 'Releia a situação e tente a outra forma.');
          clear(fb).append(h('div', { class: 'feedback wrong' }, T(why)));
          clear(widget);
          gentleShake(fb);
        }
      };
      draw();
      return h('div', {}, h('p', {}, sub.intro || 'Troque o item dentro do chunk. Escolha um item e o artigo correto, depois diga a frase.'),
        h('div', { class: 'card' }, sentence,
          h('p', { class: 'small muted' }, '1) Escolha o item:'),
          h('div', { class: 'vocab-chips' }, sub.items.map((it) => h('button', { class: 'chip', onClick: () => { item = it; choice = null; clear(fb); clear(widget); draw(); } }, T(it.item), it.cue ? h('small', {}, it.cueShort || '') : null))),
          h('p', { class: 'small muted' }, `2) ${sub.choiceLabel || 'Escolha o artigo'}:`),
          h('div', { class: 'row' }, choices.map((c) => h('button', { class: 'btn', onClick: () => pick(c) }, T(c)))),
          fb, widget));
    },
    respond() {
      let seconds = ctx.settings.responseTime ?? unit.config?.responseTimeSeconds ?? 10;
      const el = h('div', {});
      const timerSel = h('select', { 'aria-label': 'Tempo para responder', style: { width: 'auto' }, onChange: (e) => { seconds = Number(e.target.value); ctx.setSettings({ responseTime: seconds }); } },
        [[0, 'Sem limite'], [5, '5 s'], [10, '10 s'], [15, '15 s'], [20, '20 s']].map(([v, l]) => h('option', { value: v, selected: v === seconds }, l)));
      el.append(h('p', {}, 'Mia faz uma pergunta. Responda com suas palavras. O cronômetro é só um desafio — ele não tira pontos.'),
        h('label', { class: 'row small' }, '⏱ Tempo para responder: ', timerSel));
      const answered = new Set();
      unit.speaking.respond.forEach((r) => {
        const s = seg(r.segment);
        const count = h('span', { class: 'countdown', 'aria-live': 'off' });
        const fb = h('div', { 'aria-live': 'polite' });
        let timer = null;
        const startTimer = () => {
          clearInterval(timer);
          if (!seconds) return (count.textContent = '');
          let left = seconds;
          count.textContent = left;
          timer = setInterval(() => { left--; count.textContent = left > 0 ? left : '⏰'; if (left <= 0) { clearInterval(timer); announce('Tempo esgotado. Você pode responder mesmo assim.'); } }, 1000);
        };
        const evaluate = (text, viaAsr) => {
          clearInterval(timer);
          const ok = matchUtterance(text, r.match);
          if (ok) { answered.add(r.id); if (answered.size === unit.speaking.respond.length) markStep('respond'); }
          clear(fb).append(h('div', { class: `feedback ${ok ? '' : 'wrong'}` },
            ok ? '✓ Resposta adequada à pergunta!' : `Sua resposta não parece responder à pergunta${viaAsr ? ' (ou a transcrição automática errou)' : ''}. Dica: ${r.hint}`,
            h('p', { class: 'small' }, 'Exemplo: ', tl(unit, r.model), ' ', h('button', { class: 'btn small ghost', onClick: () => playLine(unit, r.model) }, '🔊'))));
        };
        const inp = h('input', { type: 'text', lang, placeholder: 'Digite sua resposta (ou fale)', 'aria-label': `Resposta para: ${plainText(unit, s.text)}` });
        inp.addEventListener('keydown', (e) => e.key === 'Enter' && evaluate(inp.value));
        el.append(h('div', { class: 'card' },
          h('div', { class: 'row between' }, h('div', {}, h('strong', {}, `${s.speaker}: `), tl(unit, s.text)), count),
          h('div', { class: 'row' },
            h('button', { class: 'btn primary small', onClick: async () => { await playSeg(s); startTimer(); inp.focus(); } }, '▶ Ouvir a pergunta'),
            h('span', { class: 'small muted' }, r.hint)),
          h('div', { class: 'row', style: { marginTop: '8px' } }, inp,
            h('button', { class: 'btn', onClick: () => evaluate(inp.value) }, 'Responder'),
            !noMic() && asrAvailable() ? h('button', { class: 'btn accent', onClick: async (e) => {
              const b = e.currentTarget;
              b.disabled = true;
              try { const { transcript } = await listenOnce({ lang }); inp.value = transcript; evaluate(transcript, true); } catch (err) { clear(fb).append(h('p', { class: 'notice warn' }, err.message)); }
              b.disabled = false;
            } }, '🎤 Falar') : null),
          fb));
      });
      el.append(rolePlay());
      return el;
    },
    create() {
      const c = unit.speaking.create;
      const checks = c.checklist.map((label) => h('label', { class: 'switch' }, h('input', { type: 'checkbox', onChange: () => {
        if (checks.every((x) => x.querySelector('input').checked)) markStep('create');
      } }), label));
      return h('div', {}, h('div', { class: 'card' }, h('h3', {}, '🎬 Sua vez'), h('p', {}, c.prompt),
        menuMini(),
        practiceWidget(null, {}),
        h('h4', { style: { marginTop: '12px' } }, 'Autoavaliação'),
        h('p', { class: 'small muted' }, 'Ouça sua gravação e marque o que você conseguiu fazer. Seja honesto: isto é para você acompanhar sua evolução.'),
        ...checks));
    },
  };

  function menuMini() {
    const items = unit.menu.sections.flatMap((s) => s.items.map((i) => i.name));
    return h('p', { class: 'small', lang }, h('strong', {}, 'Menu: '), items.map((x) => plainText(unit, x)).join(' · '));
  }

  /* ---------- Role-play com papéis alternados ---------- */
  function rolePlay() {
    const card = h('section', { class: 'card' }, h('h3', {}, '🎭 Role-play: diálogo completo'),
      h('p', { class: 'small' }, 'Escolha seu papel. O app fala as falas do outro personagem; nas suas, leia (ou tente de memória) em voz alta.'));
    const speakers = [...new Set(track.segments.map((s) => s.speaker))];
    const area = h('div', {});
    let hide = false;
    const hideBtn = h('button', { class: 'btn small', 'aria-pressed': 'false', onClick: () => { hide = !hide; hideBtn.setAttribute('aria-pressed', String(hide)); } }, '🙈 Esconder minhas falas (desafio)');
    card.append(h('div', { class: 'row' }, speakers.map((sp) => h('button', { class: 'btn', onClick: () => run(sp) }, `Eu sou ${sp}`)), hideBtn), area);
    let token = 0;
    async function run(me) {
      const my = ++token;
      stopAll();
      clear(area);
      const els = track.segments.map((s) => {
        const mine = s.speaker === me;
        const e = h('div', { class: `role-line ${mine ? 'mine' : ''}` }, h('strong', {}, `${s.speaker}: `), h('span', { lang, class: 'rp-text', style: { filter: mine && hide ? 'blur(6px)' : 'none' } }, tl(unit, s.text)));
        area.append(e);
        return e;
      });
      const stopBtn = h('button', { class: 'btn small ghost', onClick: () => { token++; stopAll(); } }, '■ Parar');
      area.prepend(stopBtn);
      const seconds = ctx.settings.responseTime ?? unit.config?.responseTimeSeconds ?? 10;
      for (let i = 0; i < track.segments.length; i++) {
        if (my !== token) return;
        const s = track.segments[i];
        els.forEach((e, j) => e.classList.toggle('current', i === j));
        els[i].scrollIntoView?.({ block: 'nearest' });
        if (s.speaker === me) {
          const wait = seconds ? Math.max(seconds * 1000, 2500) : Math.max(3000, (s.end - s.start) * 2000);
          const next = h('button', { class: 'btn small primary', style: { marginLeft: '8px' } }, 'Próxima ▶');
          els[i].append(next);
          await new Promise((res) => { const t = setTimeout(res, wait); next.onclick = () => { clearTimeout(t); res(); }; });
          next.remove();
          els[i].querySelector('.rp-text').style.filter = 'none';
        } else await playSeg({ ...s, track, index: i });
      }
      if (my === token) { els.forEach((e) => e.classList.remove('current')); area.append(h('p', { class: 'feedback' }, '✓ Diálogo completo! Troque de papel e tente de novo.')); }
    }
    return card;
  }

  const t = tabs(STEPS.map(([k, label]) => ({ id: `sp-${k}`, label: label + (sp[k] ? ' ✓' : ''), render: () => {
    const holder = h('div', {});
    Promise.resolve(views[k]()).then((v) => holder.append(v));
    return holder;
  } })), { label: 'Etapas do Speaking Studio', onChange: () => stopAll() });

  const noMicToggle = h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: noMic(), disabled: !recorderAvailable(), onChange: (e) => { ctx.setSettings({ noMic: e.target.checked }); location.reload(); } }),
    'Praticar sem microfone', !recorderAvailable() ? h('span', { class: 'small muted' }, ' (gravação indisponível neste navegador)') : null);

  return h('div', {},
    h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Módulo 5 · Output'), h('h1', {}, 'Speaking Studio'),
      h('p', {}, 'Ganhe confiança passo a passo. Sotaque não é erro: o objetivo é ser entendido na cafeteria.'),
      jaControls(ctx),
      h('div', { class: 'notice' }, 'Suas gravações ficam apenas na memória deste navegador e somem ao sair da página. Pedimos permissão do microfone só quando você clica em Gravar.'),
      noMicToggle),
    t.el);
}
