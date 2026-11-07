(function () {
  'use strict';

  var STAGES = (window.N5_STAGES || []).slice();
  var ALL = [];
  STAGES.forEach(function (s) { ALL = ALL.concat(s.qs); });
  STAGES.push({ id: 'final', title: 'Desafio final', sub: 'まとめ・10 questões misturadas', icon: '🏯', final: true, qs: [] });

  var MAX_HEARTS = 3;
  var SAVE_KEY = 'tryn5-quest-v1';
  var app = document.getElementById('app');

  // ---------- progresso salvo ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { stars: {}, xp: 0 }; }
    catch (e) { return { stars: {}, xp: 0 }; }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (e) {} }
  var progress = load();

  // ---------- utilitários ----------
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) el.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function starsText(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
  function unlocked(i) { return i === 0 || (progress.stars[STAGES[i - 1].id] || 0) > 0; }
  var keyHandler = null;
  function onKey(fn) { keyHandler = fn; }
  document.addEventListener('keydown', function (e) { if (keyHandler) keyHandler(e); });
  function mount(screen) { app.innerHTML = ''; app.appendChild(screen); onKey(null); var f = screen.querySelector('[autofocus]'); if (f) f.focus(); }

  // ---------- telas ----------
  function titleScreen() {
    var total = Object.keys(progress.stars).reduce(function (s, k) { return s + progress.stars[k]; }, 0);
    mount(h('div', { class: 'screen center' }, [
      h('p', { class: 'title-jp', lang: 'ja', text: '文法クエスト' }),
      h('h1', { class: 'title', text: 'Try! N5 Grammar Quest' }),
      h('p', { class: 'muted', text: 'Complete as fases de gramática do JLPT N5. Errou 3 vezes, recomeça a fase!' }),
      total ? h('p', { class: 'muted', text: '★ ' + total + ' estrelas · ' + progress.xp + ' XP' }) : null,
      h('div', { class: 'row' }, [
        h('button', { class: 'btn', autofocus: '', text: total ? 'Continuar' : 'Começar', onclick: mapScreen }),
      ]),
    ]));
  }

  function mapScreen() {
    var list = h('div', { class: 'stages' });
    STAGES.forEach(function (s, i) {
      var open = s.final ? STAGES.slice(0, -1).every(function (x) { return progress.stars[x.id] > 0; }) : unlocked(i);
      var st = progress.stars[s.id] || 0;
      list.appendChild(h('button', {
        class: 'stage', disabled: open ? false : '', onclick: function () { startStage(s); },
        'aria-label': s.title + (open ? '' : ' (bloqueada)'),
      }, [
        h('span', { class: 'ic', text: open ? s.icon : '🔒' }),
        h('span', {}, [h('div', { class: 'nm', text: (i + 1) + '. ' + s.title }), h('div', { class: 'sb', lang: 'ja', text: s.sub })]),
        h('span', { class: 'st', text: st ? starsText(st) : '' }),
      ]));
    });
    mount(h('div', { class: 'screen' }, [
      h('div', { class: 'top' }, [
        h('button', { class: 'btn ghost', text: '← Início', onclick: titleScreen }),
        h('span', { class: 'pill', text: '⭐ ' + progress.xp + ' XP' }),
      ]),
      h('h2', { class: 'title', text: 'Mapa da jornada' }),
      list,
    ]));
  }

  function startStage(stage) {
    var qs = stage.final ? shuffle(ALL).slice(0, 10) : shuffle(stage.qs);
    var st = { stage: stage, qs: qs, i: 0, hearts: MAX_HEARTS, mistakes: 0, streak: 0, xp: 0 };
    question(st);
  }

  function question(st) {
    var item = st.qs[st.i];
    var opts = shuffle(item.o.map(function (t, idx) { return { t: t, ok: idx === 0 }; }));
    var answered = false;
    var optsBox = h('div', { class: 'opts' });
    var fbBox = h('div');
    var card = h('div', { class: 'qcard' }, [h('p', { class: 'q', lang: 'ja', text: item.q })]);

    function choose(o, btn) {
      if (answered) return;
      answered = true;
      Array.prototype.forEach.call(optsBox.children, function (b, k) {
        b.disabled = true;
        if (opts[k].ok) b.classList.add('ok');
      });
      if (o.ok) {
        st.streak++;
        var gain = 10 + Math.min(st.streak - 1, 5) * 2;
        st.xp += gain;
      } else {
        btn.classList.add('bad');
        card.classList.add('shake');
        st.hearts--; st.mistakes++; st.streak = 0;
      }
      hearts.textContent = heartText();
      var correct = item.o[0];
      var last = st.hearts <= 0 || st.i === st.qs.length - 1;
      var next = h('button', { class: 'btn', autofocus: '', text: last ? 'Ver resultado' : 'Próxima →', onclick: advance });
      fbBox.appendChild(h('div', { class: 'fb ' + (o.ok ? 'ok' : 'bad'), role: 'status' }, [
        h('h3', { text: o.ok ? (st.streak > 1 ? 'せいかい！ ' + st.streak + ' seguidas 🔥' : 'せいかい！ Correto!') : 'ざんねん… Resposta: ' + correct }),
        h('p', { lang: 'ja', text: item.q.replace('（　）', correct) }),
        h('p', { class: 'muted', text: '🇧🇷 ' + item.pt }),
        h('p', { text: '💡 ' + item.why }),
      ]));
      fbBox.appendChild(h('div', { class: 'row', style: 'margin-top:12px' }, [next]));
      next.focus();
      onKey(function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); } });
    }
    function advance() {
      if (st.hearts <= 0) return result(st, false);
      st.i++;
      if (st.i >= st.qs.length) return result(st, true);
      question(st);
    }
    function heartText() { return '❤️'.repeat(Math.max(st.hearts, 0)) + '🖤'.repeat(MAX_HEARTS - Math.max(st.hearts, 0)); }

    opts.forEach(function (o, k) {
      var b = h('button', { class: 'opt', lang: 'ja', onclick: function () { choose(o, b); } }, [h('span', { class: 'k', text: String(k + 1) }), o.t]);
      optsBox.appendChild(b);
    });
    var hearts = h('span', { class: 'pill', 'aria-label': 'vidas', text: heartText() });

    mount(h('div', { class: 'screen' }, [
      h('div', { class: 'top' }, [
        h('button', { class: 'btn ghost', text: '✕', 'aria-label': 'Sair da fase', onclick: mapScreen }),
        h('span', { class: 'pill', text: st.stage.icon + ' ' + st.stage.title }),
        hearts,
      ]),
      h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': st.qs.length, 'aria-valuenow': st.i }, [
        h('i', { style: 'width:' + (st.i / st.qs.length * 100) + '%' }),
      ]),
      h('p', { class: 'muted', style: 'margin:0', text: 'Questão ' + (st.i + 1) + ' de ' + st.qs.length + ' · escolha a opção que completa a frase' }),
      card, optsBox, fbBox,
    ]));
    onKey(function (e) {
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= opts.length) choose(opts[n - 1], optsBox.children[n - 1]);
    });
  }

  function result(st, cleared) {
    var stars = cleared ? Math.max(1, 3 - st.mistakes) : 0;
    var id = st.stage.id;
    var best = progress.stars[id] || 0;
    if (cleared) {
      progress.xp += st.xp;
      if (stars > best) progress.stars[id] = stars;
      save();
    }
    var idx = STAGES.indexOf(st.stage);
    var nextStage = STAGES[idx + 1];
    var canNext = cleared && nextStage && (!nextStage.final || STAGES.slice(0, -1).every(function (x) { return progress.stars[x.id] > 0; }));
    mount(h('div', { class: 'screen center' }, [
      h('p', { class: 'title-jp', lang: 'ja', text: cleared ? (stars === 3 ? 'かんぺき！' : 'クリア！') : 'ゲームオーバー' }),
      cleared ? h('div', { class: 'big-stars', 'aria-label': stars + ' de 3 estrelas', text: starsText(stars) }) : null,
      h('p', { text: cleared
        ? st.stage.title + ' concluída com ' + st.mistakes + ' erro(s). +' + st.xp + ' XP'
        : 'Os corações acabaram. Revise as explicações e tente de novo — がんばって！' }),
      h('div', { class: 'row' }, [
        canNext ? h('button', { class: 'btn', autofocus: '', text: 'Próxima fase →', onclick: function () { startStage(nextStage); } }) : null,
        h('button', { class: canNext ? 'btn ghost' : 'btn', autofocus: canNext ? false : '', text: 'Jogar de novo', onclick: function () { startStage(st.stage); } }),
        h('button', { class: 'btn ghost', text: 'Mapa', onclick: mapScreen }),
      ]),
    ]));
  }

  if (!STAGES.length || !ALL.length) throw new Error('dados das fases não carregaram (src/data.js)');
  titleScreen();
})();
