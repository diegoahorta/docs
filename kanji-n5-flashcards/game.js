/* 漢字カード N5 — lógica do jogo: estudo com flashcards, quiz com pontos e combos,
   revisão espaçada (D+1, D+3, D+7, D+14, D+30, como no método dos cards) e jogo de pares. */
(function () {
  'use strict';
  const K = window.KANJI || [];
  const byN = new Map(K.map((k) => [k.n, k]));
  const SERIES = ['', '第一回', '第二回', '第三回', '第四回', '第五回', '第六回', '第七回', '第八回'];
  const DAY = 86400000;
  const INTERVAL = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
  const BOX_LABEL = ['novo', 'D+1', 'D+3', 'D+7', 'D+14', 'D+30 ★'];
  const LEVELS = [
    ['ひよこ', 'Pintinho'], ['こねこ', 'Gatinho'], ['さくら', 'Sakura'], ['だんご', 'Dango'],
    ['にんじゃ', 'Ninja'], ['さむらい', 'Samurai'], ['せんせい', 'Sensei'], ['漢字マスター', 'Mestre']
  ];
  const QUIZ_LEN = 10, QUIZ_TIME = 20;

  /* ---------------------------------------------------------------- estado salvo */
  const STORE = 'kanji-n5-odu-v1';
  const blank = () => ({ points: 0, best: { quiz: 0, pairs: 0 }, srs: {}, series: 0, music: true, sfx: true, furi: true, games: 0 });
  let S = blank();
  try { const raw = localStorage.getItem(STORE); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* sem armazenamento */ }
  const hot = window.claude && window.claude.hot;
  if (hot && hot.data && hot.data.save) S = Object.assign(blank(), hot.data.save);
  if (hot && hot.snapshot) hot.snapshot(() => ({ save: S }));
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* ok */ } }

  const srs = (n) => S.srs[n] || { box: 0, due: 0, right: 0, wrong: 0 };
  function grade(n, result) { // result: 'again' | 'good' | 'easy'
    const r = Object.assign({}, srs(n));
    if (result === 'again') { r.box = 1; r.due = Date.now(); r.wrong++; }
    else {
      r.box = Math.min(5, Math.max(1, r.box + (result === 'easy' ? 2 : 1)));
      r.due = Date.now() + INTERVAL[r.box] * DAY;
      r.right++;
    }
    S.srs[n] = r; save();
  }
  const isDue = (n) => { const r = srs(n); return r.box > 0 && r.due <= Date.now(); };
  const deck = () => (S.series ? K.filter((k) => k.s === S.series) : K.slice());
  const dueList = () => deck().filter((k) => isDue(k.n));

  function addPoints(p) {
    S.points += p; save(); renderTop();
  }
  function levelInfo() {
    const lv = Math.min(LEVELS.length - 1, Math.floor(Math.sqrt(S.points / 600)));
    const start = 600 * lv * lv, end = 600 * (lv + 1) * (lv + 1);
    return { lv, name: LEVELS[lv], pct: lv === LEVELS.length - 1 ? 100 : Math.round((S.points - start) / (end - start) * 100) };
  }

  /* ---------------------------------------------------------------- utilidades */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const uniq = (a) => Array.from(new Set(a));
  const splitR = (s) => uniq(String(s).split('・').map((x) => x.trim()).filter((x) => x && x !== '—'));
  const shortM = (m) => m.split(';')[0].trim();
  const view = $('#view');
  const isKana = (ch) => /[぀-ヿ～ー]/.test(ch);

  // Furigana só sobre os kanji: 男の子 + おとこのこ → 男(おとこ)の子(こ)
  function ruby(w, r) {
    const parts = w.match(/[぀-ヿ～ー]+|[^぀-ヿ～ー]+/g) || [w];
    if (parts.length > 1) {
      const re = new RegExp('^' + parts.map((p) => (isKana(p[0]) ? p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '(.+?)')).join('') + '$');
      const m = r.match(re);
      if (m) {
        let gi = 1;
        return parts.map((p) => (isKana(p[0]) ? esc(p) : '<ruby>' + esc(p) + '<rt>' + esc(m[gi++]) + '</rt></ruby>')).join('');
      }
    }
    return '<ruby>' + esc(w) + '<rt>' + esc(r) + '</rt></ruby>';
  }

  function speak(text) {
    try {
      if (!('speechSynthesis' in window)) return toast('Seu navegador não tem leitura em voz alta.');
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/～/g, ''));
      u.lang = 'ja-JP'; u.rate = 0.85;
      const v = speechSynthesis.getVoices().find((x) => /ja/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* ignora */ }
  }

  let toastTimer;
  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 2200);
  }
  function floater(text, x, y) {
    const f = document.createElement('div');
    f.className = 'floater'; f.textContent = text;
    f.style.left = x + 'px'; f.style.top = y + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }
  function yay(text) {
    const f = document.createElement('div');
    f.className = 'yay'; f.textContent = text;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }
  function centerOf(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  const sfx = (n) => window.Music && Music.sfx(n);

  const ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    say: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path stroke-width="1.6" stroke-linejoin="round" d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>'
  };

  /* ---------------------------------------------------------------- mascote */
  function mascot(cls) {
    return '<svg class="mascot ' + (cls || '') + '" data-mood="idle" viewBox="0 0 120 120" aria-hidden="true">' +
      '<ellipse cx="60" cy="112" rx="34" ry="5" fill="rgba(74,55,99,.12)"/>' +
      '<path d="M60 10c9 0 15 7 21 17l26 46c8 15 0 31-17 31H30c-17 0-25-16-17-31l26-46c6-10 12-17 21-17z" fill="#fff" stroke="#4A3763" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<path d="M40 80h40v24H40z" fill="#4A3763"/><path d="M44 84h32" stroke="#6E5A8C" stroke-width="2"/>' +
      '<g transform="translate(80 26)"><circle r="5" fill="#FF8FB8"/><circle cx="-6" cy="-3" r="4" fill="#FFB3CF"/><circle cx="6" cy="-3" r="4" fill="#FFB3CF"/><circle cx="-4" cy="5" r="4" fill="#FFB3CF"/><circle cx="4" cy="5" r="4" fill="#FFB3CF"/><circle r="2.2" fill="#FFE07A"/></g>' +
      '<ellipse cx="38" cy="66" rx="7" ry="4.5" fill="#FFB3CF"/><ellipse cx="82" cy="66" rx="7" ry="4.5" fill="#FFB3CF"/>' +
      '<g class="m-face" fill="#4A3763" stroke="#4A3763" stroke-linecap="round" stroke-width="3">' +
      '<g class="f-idle"><circle cx="46" cy="56" r="4.5" stroke="none"/><circle cx="74" cy="56" r="4.5" stroke="none"/><circle cx="47.5" cy="54.5" r="1.4" fill="#fff" stroke="none"/><circle cx="75.5" cy="54.5" r="1.4" fill="#fff" stroke="none"/><path d="M55 64q5 5 10 0" fill="none"/></g>' +
      '<g class="f-happy"><path d="M40 58q6-8 12 0M68 58q6-8 12 0" fill="none"/><path d="M53 63q7 11 14 0z" fill="#E5577F" stroke="#4A3763" stroke-width="2.5"/></g>' +
      '<g class="f-sad"><path d="M41 53l10 4M79 53l-10 4" fill="none"/><circle cx="46" cy="60" r="3.5" stroke="none"/><circle cx="74" cy="60" r="3.5" stroke="none"/><path d="M55 70q5-5 10 0" fill="none"/><path d="M84 60q3 6 0 9q-3-3 0-9z" fill="#9FD2FF" stroke="none"/></g>' +
      '<g class="f-wow"><path d="M46 50l2 5 5 1-5 2-2 5-2-5-5-2 5-1zM74 50l2 5 5 1-5 2-2 5-2-5-5-2 5-1z" stroke="none" fill="#FFB400"/><ellipse cx="60" cy="67" rx="5" ry="6" fill="#E5577F" stroke-width="2.5"/></g>' +
      '</g></svg>';
  }
  let moodTimer;
  function mood(m, back) {
    $$('.mascot').forEach((el) => { el.setAttribute('data-mood', 'idle'); void el.getBoundingClientRect(); el.setAttribute('data-mood', m); });
    clearTimeout(moodTimer);
    if (back !== false) moodTimer = setTimeout(() => $$('.mascot').forEach((el) => el.setAttribute('data-mood', 'idle')), 1600);
  }
  const LINES = {
    home: [
      'Vamos estudar kanji hoje? <span class="jp">がんばって！</span>',
      'Uma série por semana. <span class="jp">いっしょに！</span>',
      'Revise em D+1, D+3, D+7… <span class="jp">ふくしゅう！</span>',
      'Leia o vocabulário em voz alta! <span class="jp">こえにだして！</span>'
    ],
    right: ['すごい！', 'やった！', 'いいね！', 'かんぺき！', 'じょうず！', 'さすが！'],
    wrong: ['どんまい！', 'もういっかい！', 'だいじょうぶ！']
  };

  /* ---------------------------------------------------------------- topo */
  function renderTop() {
    $('#pts').textContent = S.points.toLocaleString('pt-BR');
    const L = levelInfo();
    $('#lvl-name').innerHTML = 'Lv ' + (L.lv + 1) + ' <span class="jp">' + L.name[0] + '</span>';
    $('#lvl-name').parentElement.title = 'Nível ' + (L.lv + 1) + ': ' + L.name[1];
    $('#lvl-bar').style.width = L.pct + '%';
    $('#btn-music').setAttribute('aria-pressed', String(!!(window.Music && Music.playing)));
    $('#btn-sfx').setAttribute('aria-pressed', String(S.sfx));
  }
  $('#go-home').addEventListener('click', () => { sfx('click'); home(); });
  $('#btn-music').addEventListener('click', () => {
    if (!window.Music) return;
    if (Music.playing) { Music.stop(); S.music = false; }
    else { Music.start(); S.music = true; toast('♪ Neon Sakura Drive — trilha original City Pop'); }
    save(); renderTop();
  });
  $('#btn-sfx').addEventListener('click', () => {
    S.sfx = !S.sfx; if (window.Music) Music.setSfx(S.sfx); save(); renderTop(); sfx('click');
  });
  if (window.Music) Music.setSfx(S.sfx);
  // o navegador só libera áudio depois de um toque: a trilha começa no primeiro clique
  const firstTouch = () => {
    window.removeEventListener('pointerdown', firstTouch, true);
    window.removeEventListener('keydown', firstTouch, true);
    if (!window.Music) return;
    Music.unlock();
    if (S.music && !Music.playing) { Music.start(); renderTop(); }
  };
  window.addEventListener('pointerdown', firstTouch, true);
  window.addEventListener('keydown', firstTouch, true);

  let keyHandler = null;
  document.addEventListener('keydown', (e) => { if (keyHandler && !e.metaKey && !e.ctrlKey && !e.altKey) keyHandler(e); });
  let quizTimer = null;
  function leave() { keyHandler = null; clearInterval(quizTimer); quizTimer = null; window.scrollTo({ top: 0 }); }

  /* ================================================================= HOME */
  function home() {
    leave();
    const total = K.length;
    const mastered = K.filter((k) => srs(k.n).box >= 4).length;
    const seen = K.filter((k) => srs(k.n).box > 0).length;
    const due = dueList().length;
    const allDue = K.filter((k) => isDue(k.n)).length;
    const chips = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
      const list = s ? K.filter((k) => k.s === s) : K;
      const pct = Math.round(list.reduce((a, k) => a + srs(k.n).box, 0) / (list.length * 5) * 100);
      const label = s ? SERIES[s] : 'すべて';
      const sub = s ? 'Nº ' + list[0].n + '–' + list[list.length - 1].n : 'todas · 79';
      return '<button class="chip" type="button" data-series="' + s + '" aria-pressed="' + (S.series === s) + '">' +
        '<span class="jp">' + label + '</span><small>' + sub + '</small><span class="mini"><i style="width:' + pct + '%"></i></span></button>';
    }).join('');
    const tiles = K.map((k) => {
      const r = srs(k.n);
      return '<button class="ktile" type="button" data-n="' + k.n + '" data-box="' + r.box + '" data-due="' + (isDue(k.n) ? 1 : 0) + '" title="Nº ' + k.n + ' · ' + esc(k.m) + ' · ' + BOX_LABEL[r.box] + '">' + k.k + '</button>';
    }).join('');
    const ds = S.series ? SERIES[S.series] + ' (10 kanji)' : 'todas as séries';

    view.innerHTML =
      '<section class="screen">' +
      '<div class="hero panel"><div>' +
      '<p class="eyebrow">Cards de Kanji · Método Doshisha</p>' +
      '<h1>漢字<span>カード</span></h1>' +
      '<p>Os 79 kanji do JLPT N5 em 8 séries. Estude os cards, ganhe pontos no quiz e revise no ritmo D+1, D+3, D+7, D+14 e D+30.</p>' +
      '<div class="stats">' +
      '<div class="stat"><strong>' + S.points.toLocaleString('pt-BR') + '</strong><span>pontos</span></div>' +
      '<div class="stat"><strong>' + seen + '<small style="font-size:14px">/' + total + '</small></strong><span>kanji vistos</span></div>' +
      '<div class="stat"><strong>' + mastered + '</strong><span>dominados (D+14+)</span></div>' +
      '<div class="stat"><strong>' + allDue + '</strong><span>para revisar hoje</span></div>' +
      '</div></div>' +
      '<div class="hero-side">' + mascot() + '<div class="bubble">' + pick(LINES.home) + '</div></div>' +
      '</div>' +

      '<div class="section panel">' +
      '<div class="section-head"><h2>Escolha a série</h2><span class="eyebrow">Jogando: ' + ds + '</span></div>' +
      '<div class="series">' + chips + '</div>' +
      '<div class="modes">' +
      '<button class="mode m-study" type="button" data-mode="study"><span class="glyph">読</span><h3>Estudar</h3><p>Flashcards com leituras, ordem dos traços e vocabulário.</p></button>' +
      '<button class="mode m-quiz" type="button" data-mode="quiz"><span class="glyph">試</span><h3>Quiz</h3><p>10 perguntas, tempo e combos. Acertou, ganhou confete!</p></button>' +
      '<button class="mode m-review" type="button" data-mode="review"><span class="glyph">復</span><h3>Revisão</h3><p>Só os kanji que venceram no seu ciclo de revisão.</p>' + (due ? '<span class="badge">' + due + '</span>' : '') + '</button>' +
      '<button class="mode m-pairs" type="button" data-mode="pairs"><span class="glyph">合</span><h3>Pares</h3><p>Jogo da memória: encontre o kanji e o significado.</p></button>' +
      '</div></div>' +

      '<div class="section panel">' +
      '<div class="section-head"><h2>Meu maço de cards</h2><span class="eyebrow">toque num kanji para abrir o card</span></div>' +
      '<div class="kmap">' + tiles + '</div>' +
      '<div class="legend">' +
      '<span><i style="background:var(--box0)"></i>novo</span><span><i style="background:var(--box1)"></i>D+1</span>' +
      '<span><i style="background:var(--box2)"></i>D+3</span><span><i style="background:var(--box3)"></i>D+7</span>' +
      '<span><i style="background:var(--box4)"></i>D+14</span><span><i style="background:var(--box5)"></i>D+30</span>' +
      '<span><i style="background:var(--bad);border-radius:50%;width:8px;height:8px"></i>revisar hoje</span>' +
      '</div></div>' +

      '<footer class="footer panel"><p>Conteúdo dos <span class="jp">漢字カード</span> JLPT N5 · Prof. Diego Horta · ODU Creative. ' +
      'Dados: listas JLPT, KANJIDIC2/JMdict (EDRDG, CC BY-SA) e KanjiVG (Ulrich Apel, CC BY-SA 3.0). ' +
      'Trilha “Neon Sakura Drive”: composição original no estilo City Pop, sintetizada no navegador. ' +
      'Seu progresso fica salvo só neste navegador.</p></footer>' +
      '</section>';

    $$('.chip', view).forEach((b) => b.addEventListener('click', () => { S.series = +b.dataset.series; save(); sfx('click'); home(); }));
    $$('.mode', view).forEach((b) => b.addEventListener('click', () => {
      sfx('click');
      const m = b.dataset.mode;
      if (m === 'study') study(deck(), 0, 'Estudar');
      else if (m === 'quiz') quiz(deck(), 'Quiz');
      else if (m === 'review') review();
      else pairs();
    }));
    $$('.ktile', view).forEach((b) => b.addEventListener('click', () => {
      sfx('flip');
      const n = +b.dataset.n;
      const list = K.filter((k) => k.s === byN.get(n).s);
      study(list, list.findIndex((k) => k.n === n), 'Card');
    }));
  }

  /* ================================================================= ESTUDAR */
  function study(list, start, label) {
    leave();
    let i = Math.max(0, start || 0), flipped = false, busy = false;
    const sLabel = (k) => SERIES[k.s] + ' · Série ' + k.s;

    view.innerHTML =
      '<section class="screen">' +
      '<div class="gamebar panel">' +
      '<button class="back-btn" type="button" id="b-back" aria-label="Voltar">' + ICON.back + '</button>' +
      '<div class="title"><span id="s-title"></span><small id="s-sub"></small></div>' +
      '<span class="spacer"></span>' +
      '<button class="icon-btn" type="button" id="b-furi" aria-pressed="' + S.furi + '" title="Mostrar ou esconder o furigana">ふりがな</button>' +
      '<button class="icon-btn" type="button" id="b-shuf" title="Embaralhar">Embaralhar</button>' +
      '</div>' +
      '<div class="stage"><div class="flashcard" id="card" tabindex="0" role="button" aria-label="Card: toque para virar"></div></div>' +
      '<div class="controls" id="nav">' +
      '<button class="btn" type="button" id="b-prev">← Anterior</button>' +
      '<button class="btn primary" type="button" id="b-flip">Virar card</button>' +
      '<button class="btn" type="button" id="b-next">Próximo →</button>' +
      '</div>' +
      '<div class="rate" id="rate" hidden>' +
      '<button class="btn again" type="button" data-r="again">De novo<small>volta p/ frente · 1</small></button>' +
      '<button class="btn good" type="button" data-r="good">Lembrei<small>+10 pts · 2</small></button>' +
      '<button class="btn easy" type="button" data-r="easy">Fácil!<small>+15 pts · 3</small></button>' +
      '</div>' +
      '<p class="kbd">Teclado: espaço vira · ← → navega · 1 2 3 avalia · deslize o card no celular</p>' +
      '</section>';
    document.body.classList.toggle('hide-furi', !S.furi);
    const card = $('#card');

    function render() {
      const k = list[i], r = srs(k.n);
      $('#s-title').textContent = label + ' · ' + (i + 1) + ' / ' + list.length;
      $('#s-sub').textContent = sLabel(k);
      const on = splitR(k.on), kun = splitR(k.kun);
      card.classList.remove('flipped'); flipped = false;
      $('#rate').hidden = true;
      card.innerHTML =
        '<div class="face front">' +
        '<div class="holes" aria-hidden="true"><i></i><i></i></div>' +
        '<span class="card-no">Nº ' + String(k.n).padStart(3, '0') + '</span>' +
        '<span class="card-series">' + SERIES[k.s] + '</span>' +
        '<div class="big-kanji" lang="ja">' + k.k + '</div>' +
        '<div class="tap-hint">Qual é a leitura e o significado? Toque para virar ↻</div>' +
        '<span class="box-tag" style="background:var(--box' + r.box + ')">' + BOX_LABEL[r.box] + '</span>' +
        '</div>' +
        '<div class="face back">' +
        '<div class="back-head"><div class="k" lang="ja">' + k.k + '</div><div>' +
        '<div class="meaning">' + esc(k.m) + '</div>' +
        '<div class="meta">画数 ' + k.strokes + ' traços · ' + esc(k.grade) + ' · Nº ' + String(k.n).padStart(3, '0') + '</div>' +
        '</div></div>' +
        '<div class="readings">' +
        '<div class="reading"><div class="lbl"><span class="jp">音読み</span>ON · katakana</div><div class="vals" lang="ja">' + (on.length ? on.map((x) => '<span>' + esc(x) + '</span>').join('') : '<span>—</span>') + '</div></div>' +
        '<div class="reading kun"><div class="lbl"><span class="jp">訓読み</span>KUN · hiragana</div><div class="vals" lang="ja">' + (kun.length ? kun.map((x) => '<span>' + esc(x) + '</span>').join('') : '<span>—</span>') + '</div></div>' +
        '</div>' +
        '<div class="sub"><span class="jp">書き順</span> ORDEM DOS TRAÇOS</div>' +
        '<div class="strokes-img"><img src="strokes/' + String(k.n).padStart(3, '0') + '.png" alt="Ordem dos traços de ' + k.k + '" loading="lazy" onerror="this.parentNode.hidden=true"></div>' +
        '<div class="sub"><span class="jp">語彙</span> VOCABULÁRIO</div>' +
        '<div class="vocab">' + k.v.map((v, vi) =>
          '<div class="vrow"><span class="w" lang="ja">' + ruby(v.w, v.r) + '</span><span class="pt">' + esc(v.pt) + '</span>' +
          '<button class="say" type="button" data-say="' + vi + '" aria-label="Ouvir ' + esc(v.r) + '">' + ICON.say + '</button></div>').join('') +
        '</div></div>';
      card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
      $$('.say', card).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); speak(k.v[+b.dataset.say].r); }));
      $('.face.back', card).addEventListener('click', (e) => e.stopPropagation());
    }
    function flip() {
      flipped = !flipped;
      card.classList.toggle('flipped', flipped);
      $('#rate').hidden = !flipped;
      sfx('flip');
      if (flipped) setTimeout(() => { const b = $('.face.back', card); if (b) b.scrollTop = 0; }, 50);
    }
    function go(d) {
      if (busy) return;
      const ni = i + d;
      if (ni < 0) return toast('Este é o primeiro card.');
      if (ni >= list.length) return finishStudy();
      busy = true;
      card.classList.add(d > 0 ? 'out-left' : 'out-right');
      sfx('flip');
      setTimeout(() => { card.classList.remove('out-left', 'out-right'); i = ni; render(); busy = false; }, 260);
    }
    function rate(r) {
      const k = list[i];
      grade(k.n, r);
      if (r === 'again') { mood('sad'); toast('Tudo bem! ' + k.k + ' volta para a frente do maço.'); }
      else {
        const p = r === 'easy' ? 15 : 10;
        addPoints(p);
        const btn = $('[data-r="' + r + '"]');
        const [x, y] = centerOf(btn);
        floater('+' + p, x, y - 20);
        window.FX.burst(x, y, 0.6);
        sfx('correct');
      }
      go(1);
    }
    function finishStudy() {
      sfx('win'); window.FX.celebrate(); yay('おつかれ！');
      addPoints(30);
      toast('Série concluída! +30 pts de bônus');
      setTimeout(home, 1300);
    }

    card.addEventListener('click', flip);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); flip(); } });
    // inclinação 3D seguindo o ponteiro
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || flipped) return;
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'rotateY(' + dx * 12 + 'deg) rotateX(' + -dy * 12 + 'deg)';
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    card.addEventListener('pointerdown', () => { card.style.transform = ''; });
    // deslizar no celular
    let sx = null, sy = null;
    card.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    card.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) { e.preventDefault(); go(dx < 0 ? 1 : -1); }
    });
    $('#b-back').addEventListener('click', () => { sfx('click'); home(); });
    $('#b-prev').addEventListener('click', () => go(-1));
    $('#b-next').addEventListener('click', () => go(1));
    $('#b-flip').addEventListener('click', flip);
    $('#b-furi').addEventListener('click', (e) => {
      S.furi = !S.furi; save();
      e.currentTarget.setAttribute('aria-pressed', String(S.furi));
      document.body.classList.toggle('hide-furi', !S.furi);
      toast(S.furi ? 'Furigana visível' : 'Furigana escondido: tente ler sozinho!');
    });
    $('#b-shuf').addEventListener('click', () => { list = shuffle(list); i = 0; render(); sfx('flip'); toast('Cards embaralhados'); });
    $$('#rate .btn').forEach((b) => b.addEventListener('click', () => rate(b.dataset.r)));
    keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); flip(); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (flipped && ['1', '2', '3'].includes(e.key)) rate(['again', 'good', 'easy'][+e.key - 1]);
    };
    render();
  }

  /* ================================================================= QUIZ */
  function optionsFrom(correct, pool, n) {
    const out = [correct];
    for (const p of shuffle(pool)) { if (out.length >= n) break; if (p && !out.includes(p)) out.push(p); }
    return shuffle(out);
  }
  function makeQuestion(k, typeHint) {
    const others = K.filter((x) => x.n !== k.n);
    const types = ['meaning', 'kanji', 'on', 'kun', 'vread', 'vmean'];
    let t = typeHint || pick(types);
    const kun = splitR(k.kun), on = splitR(k.on);
    if (t === 'kun' && !kun.length) t = 'on';
    if (t === 'on' && !on.length) t = 'meaning';
    if ((t === 'vread' || t === 'vmean') && !k.v.length) t = 'meaning';
    const q = { k, t };
    if (t === 'meaning') {
      q.label = '意味 · Qual é o significado?'; q.show = k.k; q.cls = '';
      q.answer = k.m; q.opts = optionsFrom(k.m, others.map((x) => x.m), 4); q.optCls = '';
    } else if (t === 'kanji') {
      q.label = '漢字 · Qual kanji significa…'; q.show = esc(k.m); q.cls = 'text';
      q.answer = k.k; q.opts = optionsFrom(k.k, others.map((x) => x.k), 4); q.optCls = 'k';
    } else if (t === 'on') {
      q.label = '音読み · Qual é a leitura ON?'; q.show = k.k; q.cls = '';
      q.answer = on.join('・'); q.opts = optionsFrom(q.answer, others.map((x) => splitR(x.on).join('・')), 4); q.optCls = 'kana';
    } else if (t === 'kun') {
      q.label = '訓読み · Qual é a leitura KUN?'; q.show = k.k; q.cls = '';
      q.answer = kun.join('・'); q.opts = optionsFrom(q.answer, others.map((x) => splitR(x.kun).join('・')), 4); q.optCls = 'kana';
    } else if (t === 'vread') {
      const v = pick(k.v); q.v = v;
      q.label = '読み方 · Como se lê esta palavra?'; q.show = esc(v.w); q.cls = 'word';
      q.hint = v.pt;
      const pool = K.flatMap((x) => x.v).filter((x) => x.w !== v.w).map((x) => x.r);
      const near = pool.filter((r) => Math.abs(r.length - v.r.length) <= 1);
      q.answer = v.r; q.opts = optionsFrom(v.r, near.length > 6 ? near : pool, 4); q.optCls = 'kana';
    } else {
      const v = pick(k.v); q.v = v;
      q.label = '語彙 · O que significa esta palavra?'; q.show = ruby(v.w, v.r); q.cls = 'word';
      q.answer = v.pt; q.opts = optionsFrom(v.pt, K.flatMap((x) => x.v).filter((x) => x.pt !== v.pt).map((x) => x.pt), 4); q.optCls = '';
    }
    return q;
  }

  function quiz(list, label, opts) {
    leave();
    opts = opts || {};
    const base = shuffle(list);
    const qs = [];
    for (let j = 0; j < QUIZ_LEN; j++) {
      const k = base[j % base.length];
      // as três primeiras são mais tranquilas para aquecer
      qs.push(makeQuestion(k, j < 3 ? (j % 2 ? 'kanji' : 'meaning') : null));
    }
    const st = { i: 0, score: 0, right: 0, streak: 0, maxStreak: 0, marks: [], missed: [], answered: false, timeLeft: QUIZ_TIME };

    view.innerHTML =
      '<section class="screen">' +
      '<div class="gamebar panel">' +
      '<button class="back-btn" type="button" id="b-back" aria-label="Voltar">' + ICON.back + '</button>' +
      '<div class="title"><span>' + esc(label) + '</span><small id="q-count"></small></div>' +
      '<span class="spacer"></span>' +
      '<div class="hud"><span class="dots" id="dots"></span><span class="combo" id="combo"></span><span class="pill">✦ <b id="q-score">0</b></span></div>' +
      '</div>' +
      '<div class="timer" aria-hidden="true"><i id="timer"></i></div>' +
      '<div class="qcard panel">' + mascot('sm') +
      '<span class="qtype" id="q-type"></span>' +
      '<div class="qshow" id="q-show" lang="ja"></div>' +
      '<div class="qhint" id="q-hint"></div>' +
      '</div>' +
      '<div class="options" id="opts"></div>' +
      '<div class="feedback panel" id="fb" hidden></div>' +
      '</section>';

    function dots() {
      $('#dots').innerHTML = qs.map((_, j) => '<i class="' + (st.marks[j] || (j === st.i ? 'now' : '')) + '"></i>').join('');
      $('#q-count').textContent = 'Pergunta ' + Math.min(st.i + 1, qs.length) + ' de ' + qs.length;
      $('#q-score').textContent = st.score.toLocaleString('pt-BR');
      const c = $('#combo');
      c.textContent = st.streak >= 2 ? 'コンボ ×' + st.streak : '';
    }
    function mult() { return st.streak >= 8 ? 3 : st.streak >= 5 ? 2 : st.streak >= 3 ? 1.5 : 1; }

    function show() {
      const q = qs[st.i];
      st.answered = false; st.timeLeft = QUIZ_TIME;
      dots();
      $('#q-type').innerHTML = q.label.replace(/^(\S+)/, '<span class="jp">$1</span>');
      const sh = $('#q-show');
      sh.className = 'qshow ' + q.cls;
      sh.innerHTML = q.show;
      $('#q-hint').textContent = q.hint ? 'Dica: ' + q.hint : (q.t === 'kanji' ? 'Escolha o kanji certo' : '');
      $('#fb').hidden = true;
      $('#opts').innerHTML = q.opts.map((o, j) =>
        '<button class="opt" type="button" data-j="' + j + '"><span class="n">' + (j + 1) + '</span><span class="t ' + q.optCls + '" lang="' + (q.optCls ? 'ja' : 'pt') + '">' + esc(o) + '</span></button>').join('');
      $$('#opts .opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.j)));
      const bar = $('#timer');
      bar.style.transition = 'none'; bar.style.transform = 'scaleX(1)';
      clearInterval(quizTimer);
      quizTimer = setInterval(() => {
        st.timeLeft -= 0.1;
        bar.style.transform = 'scaleX(' + Math.max(0, st.timeLeft / QUIZ_TIME) + ')';
        if (st.timeLeft <= 0) answer(-1);
      }, 100);
    }

    function answer(j) {
      if (st.answered) return;
      st.answered = true;
      clearInterval(quizTimer);
      const q = qs[st.i];
      const btns = $$('#opts .opt');
      const ok = j >= 0 && q.opts[j] === q.answer;
      btns.forEach((b, bi) => { b.disabled = true; if (q.opts[bi] === q.answer) b.classList.add('correct'); });
      if (ok) {
        st.streak++; st.maxStreak = Math.max(st.maxStreak, st.streak); st.right++;
        const bonus = Math.round(50 * Math.max(0, st.timeLeft) / QUIZ_TIME);
        const pts = Math.round((100 + bonus) * mult());
        st.score += pts; st.marks[st.i] = 'ok';
        grade(q.k.n, 'good');
        const [x, y] = centerOf(btns[j]);
        floater('+' + pts + (mult() > 1 ? ' ×' + mult() : ''), x, y - 30);
        window.FX.burst(x, y, 1 + Math.min(st.streak, 8) * 0.25);
        if ([3, 5, 8].includes(st.streak) || (st.streak > 8 && st.streak % 5 === 0)) {
          sfx('combo'); yay('コンボ ×' + st.streak + '!'); mood('wow');
          $('#combo').classList.remove('hot'); void $('#combo').offsetWidth; $('#combo').classList.add('hot');
        } else { sfx('correct'); mood('happy'); }
      } else {
        st.streak = 0; st.marks[st.i] = 'ng';
        if (j >= 0) btns[j].classList.add('wrong');
        if (!st.missed.includes(q.k)) st.missed.push(q.k);
        grade(q.k.n, 'again');
        sfx('wrong'); mood('sad');
      }
      dots();
      const k = q.k;
      const fb = $('#fb');
      fb.hidden = false;
      fb.innerHTML =
        '<span class="fb-k" lang="ja">' + k.k + '</span>' +
        '<div class="fb-text"><strong>' + (ok ? pick(LINES.right) : (j < 0 ? 'Tempo esgotado! ' : '') + pick(LINES.wrong)) + '</strong>' +
        esc(k.m) + ' · <span lang="ja">音 ' + esc(splitR(k.on).join('・') || '—') + ' · 訓 ' + esc(splitR(k.kun).join('・') || '—') + '</span>' +
        (q.v ? '<br><span lang="ja">' + esc(q.v.w) + ' (' + esc(q.v.r) + ')</span> = ' + esc(q.v.pt) : '') + '</div>' +
        (q.v ? '<button class="say" type="button" id="fb-say" aria-label="Ouvir">' + ICON.say + '</button>' : '') +
        '<button class="btn primary" type="button" id="b-cont">' + (st.i + 1 < qs.length ? 'Continuar →' : 'Ver resultado') + '</button>';
      if (q.v) $('#fb-say').addEventListener('click', () => speak(q.v.r));
      $('#b-cont').addEventListener('click', next);
      if (ok) setTimeout(() => { if (qs[st.i] === q) next(); }, 1500);
      else $('#b-cont').focus({ preventScroll: true });
    }
    function next() {
      if (!st.answered) return;
      st.i++;
      if (st.i >= qs.length) return finish();
      show();
    }
    function finish() {
      clearInterval(quizTimer);
      const acc = st.right / qs.length;
      const perfect = st.right === qs.length;
      const bonus = perfect ? 500 : 0;
      st.score += bonus;
      const key = opts.review ? 'review' : 'quiz';
      const record = st.score > (S.best[key] || 0);
      if (record) S.best[key] = st.score;
      S.games++;
      addPoints(st.score);
      results({
        title: perfect ? 'かんぺき！ Perfeito!' : acc >= 0.8 ? 'すごい！ Muito bem!' : acc >= 0.5 ? 'いいね！ Bom trabalho!' : 'がんばって！ Continue!',
        score: st.score, stars: perfect ? 3 : acc >= 0.8 ? 2 : acc >= 0.5 ? 1 : 0, record,
        stats: [[st.right + '/' + qs.length, 'acertos'], ['×' + st.maxStreak, 'maior combo'], [bonus ? '+' + bonus : '—', 'bônus perfeito']],
        missed: st.missed, again: () => quiz(list, label, opts)
      });
    }
    $('#b-back').addEventListener('click', () => { sfx('click'); home(); });
    keyHandler = (e) => {
      if (['1', '2', '3', '4'].includes(e.key) && !st.answered) answer(+e.key - 1);
      else if (e.key === 'Enter' && st.answered) { e.preventDefault(); next(); }
    };
    show();
  }

  function review() {
    const due = dueList();
    if (due.length) return quiz(due, 'Revisão · ' + due.length + ' kanji', { review: true });
    const seen = deck().filter((k) => srs(k.n).box > 0);
    if (!seen.length) {
      toast('Nada para revisar ainda. Comece estudando os cards!');
      return study(deck(), 0, 'Estudar');
    }
    toast('Nenhum kanji venceu hoje. Treinando os mais fracos!');
    const weak = seen.sort((a, b) => srs(a.n).box - srs(b.n).box || srs(b.n).wrong - srs(a.n).wrong).slice(0, 10);
    quiz(weak, 'Revisão extra', { review: true });
  }

  /* ================================================================= RESULTADO */
  function results(r) {
    leave();
    const stars = [0, 1, 2].map((j) => '<span class="' + (j < r.stars ? 'on' : 'off') + '">' + ICON.star + '</span>').join('');
    view.innerHTML =
      '<section class="screen"><div class="result panel">' + mascot() +
      '<h2>' + esc(r.title) + '</h2>' +
      '<div class="stars">' + stars + '</div>' +
      '<div class="big">+' + r.score.toLocaleString('pt-BR') + '</div>' +
      (r.record ? '<span class="record">✦ Novo recorde! ✦</span>' : '') +
      '<div class="stats">' + r.stats.map((s) => '<div class="stat"><strong>' + esc(s[0]) + '</strong><span>' + esc(s[1]) + '</span></div>').join('') + '</div>' +
      (r.missed && r.missed.length ? '<p class="eyebrow">Para revisar · toque para abrir o card</p><div class="missed">' +
        r.missed.map((k) => '<button type="button" data-n="' + k.n + '"><span class="jp" lang="ja">' + k.k + '</span><small>' + esc(shortM(k.m)) + '</small></button>').join('') + '</div>' : '') +
      '<div class="controls">' +
      '<button class="btn primary" type="button" id="r-again">Jogar de novo</button>' +
      (r.missed && r.missed.length ? '<button class="btn" type="button" id="r-study">Estudar os erros</button>' : '') +
      '<button class="btn" type="button" id="r-home">Início</button>' +
      '</div></div></section>';
    setTimeout(() => {
      if (r.stars >= 2) { window.FX.celebrate(); sfx('win'); mood('wow', false); }
      else if (r.stars === 1) { window.FX.burst(window.innerWidth / 2, window.innerHeight / 3, 1.5); sfx('correct'); mood('happy', false); }
      else mood('sad', false);
    }, 200);
    $('#r-again').addEventListener('click', () => { sfx('click'); r.again(); });
    $('#r-home').addEventListener('click', () => { sfx('click'); home(); });
    if ($('#r-study')) $('#r-study').addEventListener('click', () => { sfx('click'); study(r.missed, 0, 'Erros'); });
    $$('.missed button').forEach((b) => b.addEventListener('click', () => {
      const n = +b.dataset.n; study(r.missed, r.missed.findIndex((k) => k.n === n), 'Erros');
    }));
  }

  /* ================================================================= PARES */
  function pairs() {
    leave();
    const chosen = shuffle(deck()).slice(0, 6);
    const tiles = shuffle(chosen.flatMap((k) => [{ n: k.n, kind: 'k', text: k.k }, { n: k.n, kind: 'm', text: shortM(k.m) }]));
    let open = [], found = 0, moves = 0, streak = 0, score = 0, lock = false;
    const t0 = Date.now();
    view.innerHTML =
      '<section class="screen">' +
      '<div class="gamebar panel">' +
      '<button class="back-btn" type="button" id="b-back" aria-label="Voltar">' + ICON.back + '</button>' +
      '<div class="title"><span>Pares <span class="jp">合わせ</span></span><small>Encontre o kanji e o seu significado</small></div>' +
      '<span class="spacer"></span>' +
      '<div class="hud"><span class="pill">⏱ <b id="p-time">0s</b></span><span class="pill">Jogadas <b id="p-moves">0</b></span><span class="pill">✦ <b id="p-score">0</b></span></div>' +
      '</div>' +
      '<div class="pairs" id="grid">' + tiles.map((t, j) =>
        '<button class="ptile" type="button" data-j="' + j + '" aria-label="Carta virada"><span class="pf cover"></span><span class="pf face2 ' + (t.kind === 'k' ? 'k' : '') + '" lang="' + (t.kind === 'k' ? 'ja' : 'pt') + '">' + esc(t.text) + '</span></button>').join('') +
      '</div></section>';
    quizTimer = setInterval(() => { const el = $('#p-time'); if (el) el.textContent = Math.round((Date.now() - t0) / 1000) + 's'; }, 500);
    const btns = $$('#grid .ptile');
    btns.forEach((b) => b.addEventListener('click', () => {
      const j = +b.dataset.j;
      if (lock || b.classList.contains('open') || b.classList.contains('done')) return;
      b.classList.add('open'); b.setAttribute('aria-label', tiles[j].text); sfx('flip');
      open.push(j);
      if (open.length < 2) return;
      moves++; $('#p-moves').textContent = moves;
      const [a, c] = open; open = [];
      if (tiles[a].n === tiles[c].n && tiles[a].kind !== tiles[c].kind) {
        streak++; found++;
        const pts = 80 * Math.min(streak, 3);
        score += pts; $('#p-score').textContent = score;
        [a, c].forEach((x) => { btns[x].classList.remove('open'); btns[x].classList.add('done'); });
        const [x, y] = centerOf(btns[c]);
        floater('+' + pts, x, y - 20);
        window.FX.burst(x, y, 0.9);
        sfx('match'); grade(tiles[a].n, 'good');
        if (found === chosen.length) setTimeout(done, 700);
      } else {
        streak = 0; lock = true;
        [a, c].forEach((x) => btns[x].classList.add('miss'));
        setTimeout(() => {
          [a, c].forEach((x) => { btns[x].classList.remove('open', 'miss'); btns[x].setAttribute('aria-label', 'Carta virada'); });
          lock = false;
        }, 850);
      }
    }));
    function done() {
      clearInterval(quizTimer);
      const secs = Math.round((Date.now() - t0) / 1000);
      const bonus = Math.max(0, 400 - secs * 4 - Math.max(0, moves - 6) * 15);
      score += bonus;
      const record = score > (S.best.pairs || 0);
      if (record) S.best.pairs = score;
      S.games++;
      addPoints(score);
      const stars = moves <= 8 ? 3 : moves <= 12 ? 2 : 1;
      results({
        title: stars === 3 ? 'すごい記憶力！ Memória incrível!' : 'できた！ Completo!', score, stars, record,
        stats: [[secs + 's', 'tempo'], [String(moves), 'jogadas'], ['+' + bonus, 'bônus de rapidez']],
        missed: [], again: pairs
      });
    }
    $('#b-back').addEventListener('click', () => { sfx('click'); home(); });
  }

  renderTop();
  home();
})();
