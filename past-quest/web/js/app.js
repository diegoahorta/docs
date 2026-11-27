/* App — telas, exercícios interativos, áudio e efeitos. Depende de PQ (engine.js), PQ3D (scene3d.js) e PQ_DATA. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const S = () => PQ.S;

  /* ---------- ícones (SVG inline) ---------- */
  const P = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    flame: '<svg viewBox="0 0 24 24"><path fill="#FF8A1F" d="M12 2c1 3.5 5 5.6 5 10.5A5 5 0 0 1 12 18a5 5 0 0 1-5-5.2c0-2.3 1.2-3.6 2.3-4.8.3 1.6 1 2.6 2 3C11 8.6 11 5 12 2Z"/><path fill="#FFC23D" d="M12 11c.8 1.6 2.6 2.4 2.6 4.4A2.6 2.6 0 0 1 12 18a2.6 2.6 0 0 1-2.6-2.6c0-1.6 1.6-2.4 2.6-4.4Z"/><path fill="#FF8A1F" d="M7 19h10v2H7z" opacity=".25"/></svg>',
    gem: '<svg viewBox="0 0 24 24"><path fill="#2B8CF0" d="M6 3h12l4 6-10 12L2 9z"/><path fill="#7CC0FF" d="M6 3l3 6h6l3-6zM2 9h7l3 12z"/><path fill="#1B6BC0" d="M15 9h7L12 21z"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path fill="#EE3F66" d="M12 21s-8-5.2-8-11.2A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8C20 15.8 12 21 12 21Z"/><path fill="#fff" opacity=".45" d="M7.5 8.5a2 2 0 0 1 2-1.3c-.9.8-1.4 1.6-1.5 2.8-.5-.3-.6-.9-.5-1.5Z"/></svg>',
    map: '<svg viewBox="0 0 24 24" ' + P + '><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>',
    cards: '<svg viewBox="0 0 24 24" ' + P + '><rect x="3" y="7" width="13" height="14" rx="2.5"/><path d="M8 3h10.5A2.5 2.5 0 0 1 21 5.5V16"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" ' + P + '><path d="M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3M8 21h8M9 17h6v4H9z"/></svg>',
    user: '<svg viewBox="0 0 24 24" ' + P + '><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    close: '<svg viewBox="0 0 24 24" ' + P + '><path d="M6 6l12 12M18 6 6 18"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    target: '<svg viewBox="0 0 24 24" ' + P + '><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    crown: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 7.5 7.5 11 12 4l4.5 7L21 7.5 19 18H5zM5 19.5h14V21H5z"/></svg>',
    ear: '<svg viewBox="0 0 24 24" ' + P + '><path d="M6 9a6 6 0 0 1 12 0c0 3-2 4-3 5.5S14 19 11.5 20 8 18 8 18"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-1.5 3"/></svg>',
    mic: '<svg viewBox="0 0 24 24" ' + P + '><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    paw: '<svg viewBox="0 0 24 24"><g fill="currentColor"><ellipse cx="12" cy="16" rx="4.6" ry="3.8"/><circle cx="6" cy="10.5" r="2"/><circle cx="9.5" cy="6.5" r="2"/><circle cx="14.5" cy="6.5" r="2"/><circle cx="18" cy="10.5" r="2"/></g></svg>',
    medal: '<svg viewBox="0 0 24 24" ' + P + '><path d="M8 3h8l-2 6h-4zM12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"/><path d="m12 12.5 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9h3.5L13 4.5v15L7.5 15H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" ' + P + '><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
    book: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="#2B8CF0" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5"/></svg>',
    potion: '<svg viewBox="0 0 24 24"><path fill="#7C5CE0" d="M9 2h6v2h-1v4.2l4.6 7.4A3.5 3.5 0 0 1 15.6 21H8.4a3.5 3.5 0 0 1-3-5.4L10 8.2V4H9z"/><path fill="#FFC23D" d="M7 15h10l.9 1.5A1.7 1.7 0 0 1 16.4 19H7.6a1.7 1.7 0 0 1-1.5-2.5z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" ' + P + '><circle cx="12" cy="12" r="9"/><path d="M12 7v5l-3 2"/></svg>',
    level: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 20h4v-6H4zM10 20h4V9h-4zM16 20h4V4h-4z"/></svg>',
  };
  function ico(name) { return '<span class="ico">' + (ICONS[name] || '') + '</span>'; }
  function fillIcons(root) { $$('[data-ico]', root).forEach((el) => { if (!el.firstChild) el.innerHTML = ICONS[el.dataset.ico] || ''; }); }

  function h(tag, attrs, kids) {
    const el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach((k) => {
      const v = attrs[k];
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach((c) => c != null && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return el;
  }

  /* ---------- som ---------- */
  let actx = null;
  function sfx(kind) {
    if (!S().sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const seq = {
        good: [[660, 0, 0.09], [990, 0.09, 0.16]], bad: [[220, 0, 0.18], [180, 0.12, 0.22]], tap: [[520, 0, 0.04]],
        combo: [[700, 0, 0.07], [880, 0.07, 0.07], [1180, 0.14, 0.14]], done: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1046, 0.36, 0.3]],
      }[kind] || [];
      seq.forEach(([f, at, dur]) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + at;
        o.type = kind === 'bad' ? 'sawtooth' : 'triangle'; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === 'bad' ? 0.07 : 0.16, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
      });
    } catch (e) { /* sem áudio */ }
  }

  /* ---------- voz (Text-to-Speech) ---------- */
  const TTS = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let voice = null;
  function pickVoice() {
    if (!TTS) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en[-_]GB/i.test(v.lang) && /female|UK English Female|Libby|Sonia|Serena|Kate/i.test(v.name))
      || vs.find((v) => /en[-_]GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if (TTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text, slow) {
    if (!TTS) { toast('Áudio indisponível neste navegador.', 'ear'); return false; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/___/g, 'blank'));
      u.lang = voice ? voice.lang : 'en-GB'; if (voice) u.voice = voice;
      u.rate = slow ? 0.62 : Number(S().rate) || 0.9;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  /* ---------- toasts e folhas ---------- */
  function toast(msg, icon) {
    const t = h('div', { class: 'toast', html: (icon ? ico(icon) : '') + '<span></span>' });
    t.querySelector('span').textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  let sheetClose = null;
  function sheet(title, body, actions, onClose) {
    $('#sheet-title').textContent = title;
    const b = $('#sheet-body'); b.innerHTML = '';
    if (typeof body === 'string') b.appendChild(h('p', { text: body })); else if (body) b.appendChild(body);
    const a = $('#sheet-actions'); a.innerHTML = '';
    (actions || [{ label: 'Ok', kind: 'primary' }]).forEach((x) => {
      a.appendChild(h('button', { class: 'btn btn-' + (x.kind || 'ghost') + ' btn-wide', text: x.label, disabled: x.disabled, onclick: () => { closeSheet(); x.run && x.run(); } }));
    });
    sheetClose = onClose || null;
    $('#scrim').hidden = false;
    const first = a.querySelector('button:not([disabled])'); if (first) first.focus();
  }
  function closeSheet() { $('#scrim').hidden = true; const f = sheetClose; sheetClose = null; if (f) f(); }
  $('#scrim').addEventListener('click', (e) => { if (e.target.id === 'scrim') closeSheet(); });

  /* ---------- telas ---------- */
  function show(id) {
    ['home', 'lesson', 'result'].forEach((s) => { $('#screen-' + s).hidden = s !== id; });
    window.scrollTo(0, 0);
    if (id === 'home') PQ3D.mount($('#stage-home'));
    if (id === 'lesson') PQ3D.mount($('#stage-lesson'));
    if (id === 'result') PQ3D.mount($('#stage-result'));
  }
  let tab = 'learn';
  function setTab(t) {
    tab = t;
    $$('.tab').forEach((b) => b.classList.toggle('is-on', b.dataset.tab === t));
    ['learn', 'review', 'league', 'profile'].forEach((p) => { $('#pane-' + p).hidden = p !== t; });
    renderTab();
    if (t === 'learn') PQ3D.mount($('#stage-home'));
    window.scrollTo(0, 0);
  }
  $$('.tab').forEach((b) => b.addEventListener('click', () => { sfx('tap'); setTab(b.dataset.tab); }));

  function fmtTime(ms) { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function activeToday() { return S().lastDay === PQ.dayStr(); }

  function renderStats() {
    PQ.tickHearts();
    const s = S();
    $('#v-streak').textContent = s.streak;
    $('#stat-streak').classList.toggle('is-dim', !activeToday());
    $('#v-gems').textContent = s.gems;
    $('#v-hearts').textContent = s.hearts;
    $('#v-lhearts').textContent = s.hearts;
    const due = PQ.srsBoxes().due;
    $('#due-dot').hidden = due === 0;
  }

  function renderHome() {
    renderStats();
    const s = S();
    const today = PQ.todayXp();
    $('#v-today').textContent = today; $('#v-goal').textContent = s.goal;
    $('#goal-ring').style.strokeDashoffset = String(113.1 * (1 - Math.min(1, today / s.goal)));
    const L = PQ.levelInfo();
    $('#v-level').textContent = L.n; $('#v-level-name').textContent = L.name; $('#v-lvlbar').style.width = Math.round(L.pct * 100) + '%';
    const tips = PQ.D.meta.tips;
    let msg = 'Dica do Pongo: ' + tips[(new Date().getDate() + (s.stats.lessons || 0)) % tips.length];
    if (s.freezeUsed === PQ.dayStr()) msg = 'Seu protetor de sequência salvou os seus ' + s.streak + ' dias. Bora manter!';
    else if (s.league.note && !s.league.noteSeen) msg = s.league.note;
    else if (!s.stats.lessons) msg = 'Oi! Eu sou o Pongo. Vamos viajar para o passado? Toque na primeira parada.';
    else if (today >= s.goal) msg = 'Meta do dia batida! Que tal uma revisão rápida para fixar?';
    $('#pongo-bubble').textContent = msg;

    const path = $('#path'); path.innerHTML = '';
    const cur = PQ.currentIndex();
    PQ.units.forEach((u, i) => {
      const unlocked = PQ.isUnlocked(i), c = s.crowns[u.id] || 0;
      const li = h('li', { class: 'stop' + (unlocked ? '' : ' is-locked') + (i === cur ? ' is-current' : '') });
      const coinIco = !unlocked ? 'lock' : u.checkpoint ? 'trophy' : c >= 3 ? 'crown' : null;
      const coin = h('span', { class: 'coin', html: coinIco ? ico(coinIco) : String(i + 1) });
      if (unlocked) coin.style.setProperty('--c', u.color);
      const crowns = h('span', { class: 'crowns', 'aria-label': c + ' de 3 coroas' });
      for (let k = 0; k < 3; k++) crowns.appendChild(h('span', { class: 'ico' + (k < c ? ' on' : ''), html: ICONS.crown }));
      const btn = h('button', { class: 'stop-btn', 'aria-label': u.title + (unlocked ? '' : ' (bloqueada)'), onclick: () => { sfx('tap'); unitSheet(u, i); } }, [
        i === cur ? h('span', { class: 'go-tag', text: c ? 'Continuar' : 'Começar' }) : null,
        coin, crowns,
        h('span', { class: 'stop-label', text: u.title }),
        h('span', { class: 'stop-sub', text: (u.block.length <= 2 ? 'Bloco ' + u.block : u.block) + ' · ' + u.subtitle }),
      ]);
      li.appendChild(btn); path.appendChild(li);
    });
  }

  function guideNode(u) {
    const g = h('div', { class: 'guide' });
    u.guide.forEach((x) => { const d = h('div', { class: 'g' }, [h('b', { text: x.h }), h('span', { text: x.p })]); d.style.setProperty('--c', u.color); g.appendChild(d); });
    (u.examples || []).forEach((ex) => {
      g.appendChild(h('div', { class: 'ex-line' }, [
        h('button', { 'aria-label': 'Ouvir', html: ico('play'), onclick: () => speak(ex[0]) }),
        h('div', {}, [ex[0], h('small', { text: ex[1] })]),
      ]));
    });
    return g;
  }

  function unitSheet(u, i) {
    const unlocked = PQ.isUnlocked(i), c = S().crowns[u.id] || 0;
    if (!unlocked) { sheet(u.title, 'Ganhe pelo menos 1 coroa em “' + PQ.units[i - 1].title + '” para abrir esta parada.', [{ label: 'Entendi', kind: 'primary' }]); return; }
    const body = h('div', { class: 'guide' }, [
      h('p', { text: u.subtitle + ' · ' + (u.checkpoint ? 'Simulado: acerte 80% para passar.' : c >= 3 ? 'Coroa de ouro! Pratique quando quiser.' : 'Nível ' + (c + 1) + ' de 3') }),
      guideNode(u),
    ]);
    sheet(u.title, body, [
      { label: u.checkpoint ? 'Fazer o simulado' : c >= 3 ? 'Praticar' : 'Começar lição', kind: 'primary', run: () => start('learn', u.id) },
      { label: 'Fechar' },
    ]);
  }

  /* ---------- abas ---------- */
  function renderTab() {
    renderStats();
    if (tab === 'learn') renderHome();
    if (tab === 'review') renderReview();
    if (tab === 'league') renderLeague();
    if (tab === 'profile') renderProfile();
  }

  let verbFilter = 'all';
  function renderReview() {
    const { boxes, due } = PQ.srsBoxes();
    const labels = ['hoje', '1 dia', '2 dias', '4 dias', '8 dias', '16 dias'];
    const wrap = $('#srs-boxes'); wrap.innerHTML = '';
    boxes.forEach((n, i) => wrap.appendChild(h('div', { class: 'box' + (i === 0 && due ? ' due' : '') }, [h('b', { text: String(n) }), h('span', { text: labels[i] })])));
    $('#btn-review').textContent = due ? 'Revisar agora · ' + due + (due === 1 ? ' cartão' : ' cartões') : 'Treino extra';
    const vw = $('#verbs'); vw.innerHTML = '';
    PQ.D.verbs.filter((v) => verbFilter === 'all' || v.kind === verbFilter).forEach((v) => {
      vw.appendChild(h('button', { class: 'verb', onclick: () => speak(v.base + '. ' + v.past.replace(' / ', ', ')) }, [
        h('span', { class: 'ico', html: ICONS.play }),
        h('span', { class: 'vb' }, [
          h('span', { class: 'b', text: v.base }), ' → ', h('span', { class: 'p', text: v.past }), v.sound ? h('span', { class: 's', text: ' ' + v.sound }) : null,
          h('span', { class: 'tr', text: v.pt }),
        ]),
      ]));
    });
  }
  $$('[data-vf]').forEach((b) => b.addEventListener('click', () => { verbFilter = b.dataset.vf; $$('[data-vf]').forEach((x) => x.classList.toggle('is-on', x === b)); renderReview(); }));
  $('#btn-review').addEventListener('click', () => start('review'));

  async function renderLeague() {
    const s = S();
    $('#v-league-name').textContent = PQ.TIERS[s.league.tier];
    const left = Math.max(0, 7 - Math.floor(PQ.weekFrac() * 7));
    $('#league-lead').textContent = (s.league.note ? s.league.note + ' ' : '') + 'Os 3 primeiros sobem de liga. ' + (left <= 1 ? 'Último dia da semana!' : 'Faltam ' + left + ' dias.');
    s.league.noteSeen = true; PQ.save();
    const list = PQ.standings();
    const ol = $('#league'); ol.innerHTML = '';
    list.forEach((p, i) => {
      if (i === 0) ol.appendChild(h('span', { class: 'sep', text: 'Zona de promoção' }));
      if (i === 3) ol.appendChild(h('span', { class: 'sep', style: 'color:var(--muted);background:var(--surface-2)', text: 'Seguro' }));
      if (i === 8 && s.league.tier > 0) ol.appendChild(h('span', { class: 'sep down', text: 'Zona de rebaixamento' }));
      const av = h('span', { class: 'av', text: p.name.charAt(0).toUpperCase() });
      av.style.background = p.me ? 'var(--accent)' : 'hsl(' + p.hue + ' 55% 52%)';
      ol.appendChild(h('li', { class: (i < 3 ? 'promo ' : i >= 8 && s.league.tier > 0 ? 'demo ' : '') + (p.me ? 'me' : '') }, [
        h('span', { class: 'rk', text: String(i + 1) }), av, h('span', { class: 'nm', text: p.me && p.name !== 'Você' ? p.name + ' (você)' : p.name }), h('span', { class: 'xp', text: p.xp + ' XP' }),
      ]));
    });
    const r = await PQ.board();
    const cb = $('#class-board');
    if (r && r.week && r.week.length) {
      cb.hidden = false; const ul = $('#class-league'); ul.innerHTML = '';
      r.week.forEach((p, i) => {
        const av = h('span', { class: 'av', text: (p.name || '?').charAt(0).toUpperCase() }); av.style.background = 'var(--gem)';
        ul.appendChild(h('li', { class: p.id === s.id ? 'me' : '' }, [h('span', { class: 'rk', text: String(i + 1) }), av, h('span', { class: 'nm', text: p.name }), h('span', { class: 'xp', text: p.week_xp + ' XP' })]));
      });
    } else cb.hidden = true;
  }

  function renderProfile() {
    const s = S();
    $('#avatar').textContent = (s.name || 'V').charAt(0).toUpperCase();
    $('#v-name').textContent = s.name || 'Você';
    $('#v-since').textContent = 'Estudando desde ' + new Date(s.created).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const L = PQ.levelInfo();
    const tot = s.stats.correct + s.stats.wrong;
    const crowns = Object.values(s.crowns).reduce((a, b) => a + b, 0);
    const kp = [
      ['bolt', s.xp, 'XP total'], ['flame', s.streak + ' / ' + s.best, 'Sequência / recorde'], ['level', L.n + ' · ' + L.name, 'Nível'],
      ['target', tot ? Math.round((s.stats.correct / tot) * 100) + '%' : '—', 'Precisão'], ['crown', crowns + ' / ' + PQ.units.length * 3, 'Coroas'],
      ['cards', PQ.mastered(), 'Cartões dominados'], ['book', s.stats.lessons, 'Lições'], ['gem', s.gems, 'Gemas'],
    ];
    const k = $('#kpis'); k.innerHTML = '';
    kp.forEach(([i, v, l]) => k.appendChild(h('div', { class: 'kpi', html: ico(i) }, [h('div', {}, [h('b', { text: String(v) }), h('span', { text: l })])])));
    const m = $('#medals'); m.innerHTML = '';
    PQ.MEDALS.forEach((x) => m.appendChild(h('div', { class: 'medal' + (s.ach[x.id] ? ' on' : ''), title: x.desc }, [h('div', { class: 'disc', html: ico(x.ico) }), h('b', { text: x.name }), h('span', { text: x.desc })])));
    renderShop();
    $('#set-name').value = s.name; $('#set-goal').value = String(s.goal); $('#set-rate').value = String(s.rate);
    $('#set-sound').checked = !!s.sound; $('#set-motion').checked = !!s.motion;
  }

  function renderShop() {
    const s = S();
    const items = [
      { ico: 'heart', name: 'Recarregar vidas', desc: 'Volta para ' + PQ.MAX_HEARTS + ' vidas agora.', price: 30, ok: s.hearts < PQ.MAX_HEARTS, run: () => { s.hearts = PQ.MAX_HEARTS; s.heartsTs = Date.now(); } },
      { ico: 'snow', name: 'Protetor de sequência', desc: 'Salva sua sequência se você faltar um dia. Você tem ' + s.freeze + ' de 2.', price: 50, ok: s.freeze < 2, run: () => { s.freeze++; } },
      { ico: 'potion', name: 'XP em dobro', desc: PQ.boostOn() ? 'Ativo por mais ' + fmtTime(s.boostUntil - Date.now()) + '.' : 'Todo XP vale dobrado por 15 minutos.', price: 40, ok: !PQ.boostOn(), run: () => { s.boostUntil = Date.now() + 15 * 60000; } },
    ];
    const w = $('#shop'); w.innerHTML = '';
    items.forEach((it) => {
      const can = it.ok && s.gems >= it.price;
      w.appendChild(h('div', { class: 'shop-item', html: ico(it.ico) }, [
        h('div', { class: 'info' }, [h('b', { text: it.name }), h('span', { text: it.desc })]),
        h('button', { class: 'btn btn-sun', disabled: !can, 'aria-label': 'Comprar por ' + it.price + ' gemas', html: ico('gem') + '<span>' + it.price + '</span>', onclick: () => { s.gems -= it.price; it.run(); PQ.save(); sfx('combo'); toast(it.name + ': pronto!', it.ico); renderTab(); } }),
      ]));
    });
  }

  $('#settings').addEventListener('submit', (e) => e.preventDefault());
  $('#set-name').addEventListener('change', (e) => { S().name = e.target.value.trim().slice(0, 24) || 'Você'; PQ.save(); renderProfile(); PQ.pushScore(); });
  $('#set-goal').addEventListener('change', (e) => { S().goal = Number(e.target.value); PQ.save(); });
  $('#set-rate').addEventListener('change', (e) => { S().rate = Number(e.target.value); PQ.save(); speak('How was your weekend?'); });
  $('#set-sound').addEventListener('change', (e) => { S().sound = e.target.checked; PQ.save(); sfx('tap'); });
  $('#set-motion').addEventListener('change', (e) => { S().motion = e.target.checked; PQ.save(); PQ3D.setEnabled(S().motion); });
  $('#btn-reset').addEventListener('click', () => sheet('Apagar todo o progresso?', 'XP, coroas, medalhas e cartões de revisão voltam ao zero. Isso não pode ser desfeito.', [
    { label: 'Apagar tudo', kind: 'bad', run: () => { PQ.reset(); toast('Progresso apagado.', 'close'); setTab('learn'); } }, { label: 'Cancelar' },
  ]));

  $('#stat-gems').addEventListener('click', () => setTab('profile'));
  $('#stat-hearts').addEventListener('click', () => heartsSheet(false));
  $('#stat-streak').addEventListener('click', () => {
    const s = S(); const ws = PQ.weekStart(); const days = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
    const row = h('div', { class: 'boxes' });
    row.style.gridTemplateColumns = 'repeat(7, minmax(0, 1fr))';
    days.forEach((d, i) => { const dt = new Date(ws); dt.setDate(ws.getDate() + i); const xp = s.days[PQ.dayStr(dt)] || 0; row.appendChild(h('div', { class: 'box' + (xp >= s.goal ? ' due' : '') }, [h('b', { text: String(xp) }), h('span', { text: d })])); });
    sheet(s.streak + (s.streak === 1 ? ' dia seguido' : ' dias seguidos'), h('div', { class: 'guide' }, [
      h('p', { text: activeToday() ? 'Você já estudou hoje. Volte amanhã para manter a chama acesa.' : 'Faça uma lição hoje para manter a sequência.' }),
      h('div', { class: 'eyebrow', text: 'Meu registro da semana (XP por dia)' }), row,
      h('p', { text: 'Recorde: ' + s.best + ' dias · Protetores: ' + s.freeze + ' de 2' }),
    ]), [{ label: 'Ok', kind: 'primary' }]);
  });

  function heartsSheet(blocking) {
    const s = S(); const left = PQ.tickHearts();
    const full = s.hearts >= PQ.MAX_HEARTS;
    sheet(full ? 'Vidas cheias' : s.hearts ? s.hearts + ' de ' + PQ.MAX_HEARTS + ' vidas' : 'Sem vidas!',
      full ? 'Cada erro numa lição custa 1 vida. Revisar nunca custa vida.' : 'Próxima vida em ' + fmtTime(left) + '. Revise para ganhar 1 vida agora, ou use gemas.',
      [
        { label: 'Recarregar · 30 gemas', kind: 'sun', disabled: full || s.gems < 30, run: () => { s.gems -= 30; s.hearts = PQ.MAX_HEARTS; s.heartsTs = Date.now(); PQ.save(); renderTab(); toast('Vidas recarregadas!', 'heart'); } },
        { label: 'Revisar e ganhar 1 vida', kind: blocking ? 'primary' : 'ghost', disabled: full, run: () => start('review') },
        { label: blocking ? 'Voltar' : 'Fechar' },
      ]);
  }

  /* ---------- sessão de lição ---------- */
  let ses = null;
  const KIND = {
    choice: ['Escolha', 'Complete a frase'], chat: ['Conversa', 'Complete o diálogo'], type: ['Escreva', 'Escreva o verbo no passado'],
    build: ['Monte a frase', 'Traduza para o inglês'], match: ['Pares', 'Toque nos pares'], listen: ['Listening', 'O que você ouviu?'],
    dict: ['Ditado', 'Escreva o que você ouvir'], sound: ['Phonics', 'Como soa o -ed?'], fix: ['Corrija', 'Toque na palavra errada'],
    shadow: ['Shadowing', 'Ouça e repita em voz alta'],
  };

  function start(mode, unitId) {
    PQ.tickHearts();
    if (mode !== 'review' && S().hearts <= 0) { heartsSheet(true); return; }
    const L = mode === 'review' ? PQ.buildReview() : PQ.buildLesson(unitId);
    ses = {
      mode: L.mode, unit: L.unit, queue: L.items.slice(), idx: 0, cleared: 0,
      seen: {}, firstOk: 0, mistakes: 0, combo: 0, best: 0, xp: 0, t0: Date.now(), requeued: {}, dictPerfect: 0, shadow: 0, cards: 0, irregular: 0,
      startHearts: S().hearts, levelBefore: PQ.levelInfo().n,
    };
    $('#lesson-hearts').hidden = ses.mode === 'review';
    $('#combo').hidden = true;
    show('lesson');
    renderStats();
    next();
  }

  let cur = null, resp = null, phase = 'answer', plays = 0;
  function setResp(v) { resp = v; $('#btn-check').disabled = v == null || v === '' || (Array.isArray(v) && !v.length); }

  function next() {
    if (ses.idx >= ses.queue.length) { finish(); return; }
    cur = ses.queue[ses.idx]; resp = null; phase = 'answer'; plays = 0;
    progress();
    const k = KIND[cur.t] || ['', ''];
    let title = k[1];
    if (cur.t === 'choice' && cur.q.indexOf('___') < 0) title = /→ \?$/.test(cur.q) ? 'Qual é o passado?' : ses.unit && ses.unit.id === 'u8' ? 'Sobre o diálogo' : 'Escolha a resposta certa';
    if (cur.t === 'type' && (!/^[a-z]+$/.test(cur.hint) || cur.hint === 'auxiliar' || cur.a.indexOf(cur.hint) >= 0)) title = 'Complete a frase';
    $('#ex-kind').textContent = (ses.requeued[cur.id] === 2 ? 'Erro anterior · ' : '') + k[0];
    $('#ex-title').textContent = title;
    const cb = $('#checkbar'); cb.classList.remove('is-good', 'is-bad'); $('#feedback').hidden = true;
    const bc = $('#btn-check'); bc.className = 'btn btn-primary'; bc.textContent = cur.t === 'shadow' ? 'Repeti em voz alta' : 'Verificar'; bc.disabled = true;
    const audioItem = ['listen', 'dict', 'sound', 'shadow'].indexOf(cur.t) >= 0;
    const skip = $('#btn-skip'); skip.hidden = cur.t === 'match'; skip.textContent = audioItem ? 'Não posso ouvir agora' : 'Pular';
    const ex = $('#ex'); ex.innerHTML = '';
    RENDER[cur.t](cur, ex);
    fillIcons(ex);
  }

  function promptNode(text, hint) {
    const p = h('div', { class: 'prompt' });
    const parts = text.split('___');
    parts.forEach((part, i) => {
      p.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) p.appendChild(h('span', { class: 'blank', text: ' ' }));
    });
    if (hint) p.appendChild(h('span', { class: 'hint', text: ' (' + hint + ')' }));
    return p;
  }
  function fillBlank(text) { const parts = String(text).split(' / '); $$('#ex .blank').forEach((b, i) => { b.textContent = parts[Math.min(i, parts.length - 1)]; }); }
  function progress() {
    if (!ses) return;
    const left = ses.queue.length - ses.idx - (phase === 'answer' ? 0 : 1);
    $('#lesson-progress').style.width = Math.round((ses.cleared / Math.max(1, ses.cleared + left)) * 100) + '%';
  }
  function optionsNode(opts, cls, onPick) {
    const wrap = h('div', { class: 'options' + (cls ? ' ' + cls : ''), role: 'listbox' });
    opts.forEach((o, i) => {
      wrap.appendChild(h('button', { class: 'opt', 'data-v': o, role: 'option', onclick: (e) => {
        if (phase !== 'answer') return;
        $$('.opt', wrap).forEach((x) => x.classList.toggle('is-sel', x === e.currentTarget));
        sfx('tap'); setResp(o); onPick && onPick(o);
      } }, [h('span', { class: 'k', text: String(i + 1) }), h('span', { text: o })]));
    });
    return wrap;
  }
  function playRow(text, auto) {
    const row = h('div', { class: 'play-row' }, [
      h('button', { class: 'play', 'aria-label': 'Ouvir', html: ico('play'), onclick: () => { plays++; speak(text); if (cur.t === 'shadow') setResp('ok'); } }),
      h('button', { class: 'play slow', 'aria-label': 'Ouvir devagar', text: '0.6×', onclick: () => { plays++; speak(text, true); if (cur.t === 'shadow') setResp('ok'); } }),
    ]);
    if (auto) setTimeout(() => { if (cur && phase === 'answer') { plays++; speak(text); } }, 250);
    return row;
  }
  function noAudioReveal(text, into) {
    if (TTS) return;
    into.appendChild(h('button', { class: 'chip', text: 'Sem áudio aqui: mostrar o texto', onclick: (e) => { e.currentTarget.replaceWith(h('div', { class: 'pt', text: text })); } }));
  }

  const RENDER = {
    choice(it, ex) {
      ex.appendChild(promptNode(it.q));
      if (it.q.indexOf('___') >= 0) ex.appendChild(h('div', {}, [h('button', { class: 'chip', html: ico('play') + ' ouvir a frase', onclick: () => speak(it.q) })]));
      ex.appendChild(optionsNode(PQ.shuffle(it.o), '', (o) => fillBlank(o)));
    },
    chat(it, ex) {
      const chat = h('div', { class: 'chat' });
      const who = []; const col = { Anna: '#FF5F3D', Leo: '#2B8CF0', Mei: '#7C5CE0' };
      it.lines.forEach((ln, i) => {
        if (who.indexOf(ln[0]) < 0) who.push(ln[0]);
        const right = who.indexOf(ln[0]) % 2 === 1;
        const av = h('span', { class: 'av', text: ln[0].charAt(0) }); av.style.background = col[ln[0]] || '#18A0B8';
        const txt = h('div', { class: 'txt' }, [h('span', { class: 'who', text: ln[0] })]);
        const parts = ln[1].split('___');
        parts.forEach((p, k) => { txt.appendChild(document.createTextNode(p)); if (k < parts.length - 1) txt.appendChild(h('span', { class: 'blank', text: '   ' })); });
        if (parts.length === 1) txt.appendChild(h('button', { class: 'say', 'aria-label': 'Ouvir', html: ico('play'), onclick: () => speak(ln[1]) }));
        chat.appendChild(h('div', { class: 'msg' + (right ? ' right' : '') }, [av, txt]));
      });
      ex.appendChild(chat);
      const first = it.lines.find((l) => l[1].indexOf('___') < 0); if (first) setTimeout(() => phase === 'answer' && cur === it && speak(first[1]), 300);
      ex.appendChild(optionsNode(PQ.shuffle(it.o), '', (o) => fillBlank(o)));
    },
    type(it, ex) {
      ex.appendChild(promptNode(it.q, it.hint));
      const inp = h('input', { class: 'answer-input', id: 'answer', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Digite aqui', 'aria-label': 'Sua resposta' });
      inp.addEventListener('input', () => { setResp(inp.value.trim()); fillBlank(inp.value || ' '); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('#btn-check').disabled) { e.preventDefault(); onCheck(); } });
      ex.appendChild(inp); setTimeout(() => inp.focus(), 50);
    },
    build(it, ex) {
      ex.appendChild(h('div', { class: 'prompt', text: it.pt }));
      const tray = h('div', { class: 'tray', 'aria-label': 'Sua frase' });
      const bank = h('div', { class: 'bank' });
      const words = it.a.replace(/[?.!]/g, '').split(' ').concat(it.x || []);
      const chosen = [];
      PQ.shuffle(words).forEach((w) => {
        const t = h('button', { class: 'tile', text: w });
        t.addEventListener('click', () => {
          if (phase !== 'answer' || t.classList.contains('is-used')) return;
          sfx('tap'); t.classList.add('is-used');
          const placed = h('button', { class: 'tile', text: w });
          placed.addEventListener('click', () => { if (phase !== 'answer') return; placed.remove(); t.classList.remove('is-used'); chosen.splice(chosen.indexOf(placed), 1); setResp(chosen.map((c) => c.textContent).join(' ')); });
          chosen.push(placed); tray.appendChild(placed);
          setResp(chosen.map((c) => c.textContent).join(' '));
        });
        bank.appendChild(t);
      });
      ex.appendChild(tray); ex.appendChild(bank);
    },
    match(it, ex) {
      const pairs = it.pairs;
      const left = PQ.shuffle(pairs.map((p, i) => ({ v: p[0], i })));
      const right = PQ.shuffle(pairs.map((p, i) => ({ v: p[1], i })));
      let sel = null, done = 0, misses = 0;
      const grid = h('div', { class: 'match' });
      const mk = (arr, side) => {
        const col = h('div', { class: 'col' });
        arr.forEach((x) => {
          const b = h('button', { class: 'tile', text: x.v, 'data-i': x.i, 'data-side': side });
          b.addEventListener('click', () => {
            if (b.classList.contains('is-done') || phase !== 'answer') return;
            sfx('tap');
            if (!sel || sel.dataset.side === side) { if (sel) sel.classList.remove('is-sel'); sel = b; b.classList.add('is-sel'); return; }
            if (sel.dataset.i === b.dataset.i) {
              [sel, b].forEach((t) => { t.classList.remove('is-sel'); t.classList.add('is-done'); t.disabled = true; });
              const en = pairs[Number(b.dataset.i)][1]; if (en.charAt(0) !== '/') speak(en);
              done++; sel = null;
              if (done === pairs.length) { setResp({ misses }); setTimeout(onCheck, 350); }
            } else {
              misses++; sfx('bad');
              [sel, b].forEach((t) => { t.classList.remove('is-sel'); t.classList.add('is-wrong'); setTimeout(() => t.classList.remove('is-wrong'), 400); });
              sel = null;
            }
          });
          col.appendChild(b);
        });
        return col;
      };
      grid.appendChild(mk(left, 'L')); grid.appendChild(mk(right, 'R'));
      ex.appendChild(grid);
    },
    listen(it, ex) {
      ex.appendChild(playRow(it.say, true));
      noAudioReveal(it.say, ex);
      ex.appendChild(optionsNode(PQ.shuffle(it.o)));
    },
    dict(it, ex) {
      ex.appendChild(playRow(it.say, true));
      noAudioReveal(it.say, ex);
      ex.appendChild(h('button', { class: 'chip', text: 'Dica em português', onclick: (e) => e.currentTarget.replaceWith(h('div', { class: 'pt', text: it.pt })) }));
      const ta = h('textarea', { class: 'answer-input', id: 'answer', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', placeholder: 'Escreva a frase em inglês', 'aria-label': 'Sua resposta' });
      ta.addEventListener('input', () => setResp(ta.value.trim()));
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !$('#btn-check').disabled) { e.preventDefault(); onCheck(); } });
      ex.appendChild(ta);
    },
    sound(it, ex) {
      ex.appendChild(h('div', { class: 'play-row' }, [
        h('button', { class: 'play', 'aria-label': 'Ouvir', html: ico('play'), onclick: () => speak(it.w) }),
        h('span', { class: 'big-word', text: it.w }),
      ]));
      setTimeout(() => cur === it && speak(it.w), 250);
      ex.appendChild(optionsNode(['/t/', '/d/', '/ɪd/'], 'ipa'));
    },
    fix(it, ex) {
      ex.appendChild(h('p', { class: 'pt', text: 'Uma palavra está errada. Qual?' }));
      const line = h('div', { class: 'fixline' });
      it.s.split(' ').forEach((w, i) => {
        line.appendChild(h('button', { class: 'tile', text: w, 'data-i': i, onclick: (e) => {
          if (phase !== 'answer') return;
          $$('.tile', line).forEach((x) => x.classList.toggle('is-sel', x === e.currentTarget)); sfx('tap'); setResp(i);
        } }));
      });
      ex.appendChild(line);
      ex.appendChild(h('div', {}, [h('button', { class: 'chip', html: ico('play') + ' ouvir', onclick: () => speak(it.s) })]));
    },
    shadow(it, ex) {
      ex.appendChild(h('div', { class: 'shadow-card' }, [
        h('div', { class: 'en', text: it.say }), h('div', { class: 'pt', text: it.pt }), playRow(it.say, true),
        h('ol', { class: 'steps' }, [h('li', { text: 'Ouça a frase.' }), h('li', { text: 'Repita junto, imitando o ritmo.' }), h('li', { text: 'Repita sozinho, sem o áudio.' })]),
      ]));
      if (!TTS) setResp('ok');
    },
  };

  function feedback(ok, title, ans, why) {
    const cb = $('#checkbar'); cb.classList.add(ok ? 'is-good' : 'is-bad');
    $('#fb-icon').innerHTML = ico(ok ? 'check' : 'x');
    $('#fb-title').textContent = title;
    const body = $('#fb-body'); body.innerHTML = '';
    if (ans) body.appendChild(h('div', { class: 'ans' }, [ok ? '' : 'Resposta certa: ', h('b', { style: 'font:inherit;font-weight:900;color:inherit', text: ans })]));
    if (why) body.appendChild(h('div', { class: 'why', text: why }));
    $('#feedback').hidden = false;
    const bc = $('#btn-check'); bc.className = 'btn ' + (ok ? 'btn-good' : 'btn-bad'); bc.textContent = 'Continuar'; bc.disabled = false;
    $('#btn-skip').hidden = true;
    bc.focus();
  }

  const PRAISE = ['Muito bem!', 'Mandou bem!', 'Perfeito!', 'Isso aí!', 'Excelente!', 'Arrasou!'];
  function onCheck() {
    if (phase === 'feedback') { ses.idx++; next(); return; }
    if (resp == null) return;
    phase = 'feedback';
    const it = cur, res = PQ.check(it, resp);
    const firstTime = !ses.seen[it.id]; ses.seen[it.id] = true;
    const s = S();
    // marca opções
    $$('#ex .opt').forEach((o) => {
      o.disabled = true;
      const right = it.t === 'listen' ? it.o[0] : it.a;
      if (o.dataset.v === right) o.classList.add('is-right'); else if (o.classList.contains('is-sel')) o.classList.add('is-wrong');
    });
    $$('#ex .tile, #ex .answer-input').forEach((t) => { t.disabled = true; });
    if (it.t === 'fix') $$('#ex .fixline .tile').forEach((t, i) => { if (i === it.bad) { t.classList.remove('is-sel'); t.classList.add('is-wrong'); } });

    let ok = res.ok;
    if (it.t === 'match' && resp.misses > 0) ok = true;
    if (ok) {
      ses.cleared++; ses.combo++; ses.best = Math.max(ses.best, ses.combo);
      let gain;
      if (ses.mode === 'review') { gain = PQ.XP.review_card; ses.cards++; }
      else if (it.t === 'shadow') { gain = PQ.XP.shadowing; ses.shadow++; }
      else gain = firstTime ? PQ.XP.first_try : PQ.XP.after_error;
      if (it.t === 'dict' && res.perfect && firstTime) { gain += PQ.XP.perfect_dictation; ses.dictPerfect++; }
      if (it.t === 'match' && resp.misses) gain = Math.max(PQ.XP.after_error, gain - resp.misses * 2);
      if (firstTime && !(it.t === 'match' && resp.misses)) ses.firstOk++;
      if (ses.combo === 5) { gain += PQ.XP.combo5; comboBadge('Combo ×5  +' + PQ.XP.combo5 + ' XP'); }
      else if (ses.combo > 0 && ses.combo % 10 === 0) { gain += PQ.XP.combo10; comboBadge('Combo ×' + ses.combo + '  +' + PQ.XP.combo10 + ' XP'); }
      else if (ses.combo >= 3) comboBadge(ses.combo + ' seguidos!');
      ses.xp += gain;
      s.stats.correct++; if (!s.stats.firstRight) s.stats.firstRight = 1;
      if (ses.unit && (PQ.unitOf[it.id] === 'u5' || PQ.unitOf[it.id] === 'u6')) ses.irregular++;
      if (firstTime) PQ.grade(it.id, true);
      sfx(ses.combo >= 5 && ses.combo % 5 === 0 ? 'combo' : 'good');
      PQ3D.react('happy');
      let title = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      let ans = null, why = null;
      if (res.near) { title = 'Quase perfeito!'; ans = it.say; why = 'Atenção a um pequeno erro de digitação.'; }
      else if (it.t === 'match') { title = resp.misses ? 'Pares completos!' : 'Todos de primeira!'; }
      else if (it.t === 'fix') { ans = it.fixed; why = it.tip; }
      else if (it.t === 'dict' || it.t === 'listen') { ans = PQ.answerText(it); }
      else if (it.tip && Math.random() < 0.5) why = it.tip;
      feedback(true, title + '  +' + gain + ' XP', ans, why);
      if (['listen', 'dict', 'fix', 'build', 'type', 'chat'].indexOf(it.t) >= 0 || (it.t === 'choice' && it.q.indexOf('___') >= 0)) speak(PQ.answerText(it));
    } else {
      ses.mistakes++; ses.combo = 0; $('#combo').hidden = true;
      s.stats.wrong++;
      PQ.grade(it.id, false);
      if (ses.mode !== 'review') { PQ.loseHeart(); renderStats(); }
      sfx('bad'); PQ3D.react('sad');
      if (!ses.requeued[it.id]) { ses.requeued[it.id] = 2; ses.queue.push(it); }
      const ans = PQ.answerText(it);
      feedback(false, ses.mode === 'review' ? 'Vamos fixar esta' : 'Ops! Não foi dessa vez', ans, it.tip || (it.t === 'sound' ? soundWhy(it) : null));
      speak(ans);
    }
    // a barra só anda nos acertos (como no Duolingo)
    progress();
    if (!ok && ses.mode !== 'review' && S().hearts <= 0) {
      $('#btn-check').textContent = 'Continuar';
      phase = 'dead';
    }
  }
  function soundWhy(it) {
    const w = it.w;
    if (it.a === '/ɪd/') return w + ': depois de t/d o -ed ganha sílaba.';
    if (it.a === '/t/') return w + ': som surdo antes do -ed → /t/.';
    return w + ': som sonoro antes do -ed → /d/.';
  }
  function comboBadge(text) { const c = $('#combo'); c.textContent = text; c.hidden = false; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; }

  $('#btn-check').addEventListener('click', () => {
    if (phase === 'dead') { outOfHearts(); return; }
    onCheck();
  });
  $('#btn-skip').addEventListener('click', () => {
    if (phase !== 'answer') return;
    const audio = ['listen', 'dict', 'sound', 'shadow'].indexOf(cur.t) >= 0;
    if (audio) { if (TTS) speechSynthesis.cancel(); ses.queue.splice(ses.idx, 1); next(); return; }
    resp = '\u0000skip'; onCheck();
  });
  function outOfHearts() {
    sheet('Acabaram as vidas', 'Você perdeu as 5 vidas nesta lição. O XP dela não conta, mas os cartões que você errou já foram para a revisão.', [
      { label: 'Recarregar · 30 gemas e continuar', kind: 'sun', disabled: S().gems < 30, run: () => { const s = S(); s.gems -= 30; s.hearts = PQ.MAX_HEARTS; s.heartsTs = Date.now(); PQ.save(); renderStats(); phase = 'feedback'; onCheck(); } },
      { label: 'Revisar e ganhar 1 vida', kind: 'primary', run: () => { PQ.save(); start('review'); } },
      { label: 'Sair da lição', run: () => { PQ.save(); ses = null; show('home'); setTab('learn'); } },
    ]);
  }
  $('#btn-quit').addEventListener('click', () => sheet('Sair da lição?', 'Se sair agora, você perde o XP desta lição.', [
    { label: 'Continuar estudando', kind: 'primary' },
    { label: 'Sair', run: () => { if (TTS) speechSynthesis.cancel(); PQ.save(); ses = null; show('home'); setTab(tab); } },
  ]));

  document.addEventListener('keydown', (e) => {
    if ($('#screen-lesson').hidden || !$('#scrim').hidden) return;
    const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    if (e.key === 'Enter' && !typing && !$('#btn-check').disabled) { e.preventDefault(); $('#btn-check').click(); }
    if (!typing && /^[1-9]$/.test(e.key) && phase === 'answer') { const o = $$('#ex .opt')[Number(e.key) - 1]; if (o) o.click(); }
  });

  /* ---------- fim da lição ---------- */
  function finish() {
    const s = S(), sesRef = ses;
    const unique = Object.keys(sesRef.seen).length || 1;
    const acc = Math.round((sesRef.firstOk / unique) * 100);
    const perfect = sesRef.mistakes === 0;
    const rows = [];
    let title = 'Lição completa!', sub = '';
    let bonus = PQ.XP.lesson_done;
    if (sesRef.mode === 'review') {
      title = 'Revisão feita!'; sub = 'Os cartões voltam no dia certo: 1, 2, 4, 8 e 16 dias.';
      s.stats.reviews++; if (s.hearts < PQ.MAX_HEARTS) { PQ.gainHeart(1); rows.push(['heart', '+1 vida recuperada']); }
      bonus = 0;
    } else if (sesRef.mode === 'checkpoint') {
      const u = sesRef.unit;
      if (acc >= 80) {
        title = 'Simulado aprovado!'; sub = acc + '% de acertos. Você está pronto para as questões de passado do A2 Key.';
        s.crowns[u.id] = Math.min(3, (s.crowns[u.id] || 0) + 1); s.stats.mocks++; rows.push(['crown', 'Coroa do Checkpoint']);
      } else { title = 'Quase lá!'; sub = acc + '% de acertos. Para passar, acerte 80%. Revise os erros e tente de novo.'; }
    } else {
      const u = sesRef.unit; const before = s.crowns[u.id] || 0;
      s.crowns[u.id] = Math.min(3, before + 1);
      if (s.crowns[u.id] > before) rows.push(['crown', u.title + ': nível ' + s.crowns[u.id] + ' de 3']);
      if (before === 0) { const i = PQ.units.indexOf(u); if (PQ.units[i + 1]) rows.push(['map', 'Nova parada aberta: ' + PQ.units[i + 1].title]); }
      sub = perfect ? 'Nenhum erro. O Pongo está orgulhoso!' : 'Os itens que você errou foram para a revisão espaçada.';
    }
    if (perfect && sesRef.mode !== 'review') { bonus += PQ.XP.perfect_lesson; s.stats.perfect++; rows.push(['check', 'Lição perfeita +' + PQ.XP.perfect_lesson + ' XP']); }
    const goalBefore = PQ.todayXp() >= s.goal;
    const gained = PQ.addXp(sesRef.xp + bonus);
    const gems = sesRef.mode === 'review' ? 2 : perfect ? 10 : 5; s.gems += gems;
    rows.push(['gem', '+' + gems + ' gemas']);
    s.stats.lessons += sesRef.mode === 'review' ? 0 : 1;
    s.stats.bestCombo = Math.max(s.stats.bestCombo, sesRef.best);
    s.stats.cards += sesRef.cards; s.stats.dictPerfect += sesRef.dictPerfect; s.stats.shadow += sesRef.shadow; s.stats.irregular += sesRef.irregular;
    if (PQ.markActivity()) rows.push(['flame', s.streak === 1 ? 'Sequência iniciada: 1 dia' : 'Sequência: ' + s.streak + ' dias!']);
    if (!goalBefore && PQ.todayXp() >= s.goal) rows.push(['target', 'Meta do dia batida!']);
    const L = PQ.levelInfo(); if (L.n > sesRef.levelBefore) rows.push(['level', 'Subiu para o nível ' + L.n + ' · ' + L.name]);
    PQ.checkMedals().forEach((m) => rows.unshift(['medal', 'Medalha: ' + m.name + ' (+10 gemas)']));
    PQ.save(); PQ.pushScore();

    $('#res-title').textContent = title; $('#res-sub').textContent = sub;
    $('#res-xp').textContent = '+' + gained; $('#res-acc').textContent = acc + '%'; $('#res-time').textContent = fmtTime(Date.now() - sesRef.t0);
    const rn = $('#res-new'); rn.innerHTML = '';
    rows.forEach(([i, t]) => rn.appendChild(h('div', { class: 'row', html: ico(i) }, [t])));
    if (PQ.boostOn()) rn.appendChild(h('div', { class: 'row', html: ico('potion') }, ['XP em dobro ativo']));
    ses = null;
    show('result');
    PQ3D.setResult(true); PQ3D.react('celebrate');
    sfx('done');
  }
  $('#btn-continue').addEventListener('click', () => { PQ3D.setResult(false); show('home'); setTab('learn'); });

  /* ---------- relógio das vidas ---------- */
  setInterval(() => { if (!$('#screen-home').hidden) { const before = S().hearts; PQ.tickHearts(); if (S().hearts !== before) { PQ.save(); renderStats(); } } }, 15000);

  /* ---------- início ---------- */
  // gancho somente-leitura para testes automatizados
  window.PQApp = { get current() { return cur; }, get phase() { return phase; } };

  function boot() {
    PQ.load();
    fillIcons(document);
    PQ3D.setEnabled(S().motion);
    show('home'); setTab('learn');
    PQ.save();
    PQ.ping().then(async (on) => {
      if (!on) return;
      if (await PQ.cloudPull()) { toast('Progresso sincronizado com o servidor.', 'check'); renderTab(); }
      PQ.pushScore();
    });
    // dá as boas-vindas na primeira interação (o áudio só toca depois de um toque)
    document.addEventListener('pointerdown', () => { if (actx && actx.state === 'suspended') actx.resume(); }, { once: true });
  }
  boot();
})();
