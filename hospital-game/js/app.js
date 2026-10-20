// Lógica do app: navegação, história, flashcards e mini-jogos.
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const C = window.CONTENT;
  const VOCAB = window.VOCAB || [];
  const CH = window.Characters;
  const S3 = window.Scene3D || { setMood() {}, showHospital() {}, celebrate() {} };

  // ---------- Estado salvo no navegador ----------
  const KEY = 'mika-hospital-v1';
  const defaults = { stars: 0, sound: true, story: { scene: 0, step: 0, done: [] }, boxes: {}, best: {}, played: 0 };
  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch (e) { /* armazenamento indisponível */ }
    return JSON.parse(JSON.stringify(defaults));
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignora */ } }

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Som e voz ----------
  let actx = null;
  function tone(freqs, dur = 0.12) {
    if (!state.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t = actx.currentTime + i * dur;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.6);
        o.connect(g).connect(actx.destination);
        o.start(t); o.stop(t + dur * 1.8);
      });
    } catch (e) { /* sem áudio */ }
  }
  const sfx = { ok: () => tone([660, 880, 1175]), no: () => tone([330, 262], 0.16), flip: () => tone([520], 0.06), win: () => tone([523, 659, 784, 1047], 0.14) };

  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|jenny|aria|google us/i.test(v.name)) || vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!state.sound || !('speechSynthesis' in window) || !text || text === '...') return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/—/g, ','));
      u.lang = 'en-US'; u.rate = 0.88; u.pitch = 1.1;
      if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch (e) { /* sem voz */ }
  }

  const soundBtn = $('#soundBtn');
  function syncSound() { soundBtn.setAttribute('aria-pressed', String(state.sound)); soundBtn.title = state.sound ? 'Som ligado' : 'Som desligado'; }
  soundBtn.addEventListener('click', () => { state.sound = !state.sound; if (!state.sound && 'speechSynthesis' in window) speechSynthesis.cancel(); syncSound(); save(); toast(state.sound ? 'Som e voz ligados' : 'Som e voz desligados'); });
  syncSound();

  // ---------- Estrelas e avisos ----------
  const starEl = $('#starCount');
  function addStars(n = 1) {
    state.stars += n; starEl.textContent = state.stars; save();
    const box = starEl.parentElement; box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
  }
  starEl.textContent = state.stars;
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- Navegação ----------
  const VIEWS = ['home', 'story', 'cards', 'games'];
  let current = 'home';
  function go(view) {
    if (!VIEWS.includes(view)) view = 'home';
    current = view;
    VIEWS.forEach((v) => { $('#view-' + v).hidden = v !== view; });
    $$('.tabs button').forEach((b) => { if (b.dataset.go === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    S3.showHospital(view === 'home');
    S3.setMood(0xffffff);
    if (view === 'home') renderHome();
    if (view === 'story') startStory();
    if (view === 'cards') renderCard();
    if (view === 'games') showHub();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) go(b.dataset.go);
  });

  // ---------- Início ----------
  $('#heroCast').innerHTML = CH.svg('hana', 'smile') + CH.svg('mika', 'happy') + CH.svg('sato', 'smile') +
    '<span class="bubble">How are you feeling?</span>';
  function renderHome() {
    const total = C.story.length;
    const done = state.story.done.length;
    const words = VOCAB.reduce((n, c) => n + c.words.length, 0);
    const mastered = Object.values(state.boxes).filter((b) => b >= 3).length;
    const bestSum = Object.values(state.best).length;
    $('#homeProgress').innerHTML = [
      ['story', 'História', `${done} de ${total} lugares visitados`, done / total],
      ['cards', 'Flashcards', `${mastered} de ${words} palavras dominadas`, mastered / words],
      ['games', 'Mini-jogos', `${bestSum} de ${GAMES.length} jogos concluídos`, bestSum / GAMES.length],
    ].map(([go, t, s, p]) => `<button class="prog" data-go="${go}"><b>${t}</b><span>${s}</span><span class="bar"><i style="width:${Math.round(p * 100)}%"></i></span></button>`).join('');
  }

  // ---------- História ----------
  const ptBtn = $('#ptBtn');
  let ptOn = false;
  ptBtn.addEventListener('click', () => { ptOn = !ptOn; ptBtn.setAttribute('aria-pressed', String(ptOn)); $('#linePt').hidden = !ptOn || !$('#linePt').textContent; });

  let sIdx = 0, stIdx = 0, quizSolved = false, firstTry = true, runScore = 0, runTotal = 0;
  const cast = { left: null, right: null };
  const ROLE_NAME = { narr: 'Narração', mika: 'Mika', ren: 'Ren · recepção', hana: 'Hana · enfermeira', sato: 'Dr. Sato · médico', kai: 'Kai · farmácia' };

  function startStory() {
    sIdx = Math.min(state.story.scene || 0, C.story.length - 1);
    stIdx = state.story.step || 0;
    if (state.story.done.length === C.story.length && sIdx === C.story.length - 1 && stIdx >= C.story[sIdx].steps.length) { sIdx = 0; stIdx = 0; }
    enterScene(sIdx, stIdx);
  }
  function renderJourney() {
    $('#journey').innerHTML = C.story.map((sc, i) => {
      const cls = i === sIdx ? 'current' : state.story.done.includes(sc.id) ? 'done' : '';
      const can = i <= sIdx || state.story.done.includes(sc.id) || (i > 0 && state.story.done.includes(C.story[i - 1].id));
      return `<li class="${cls}"><button data-scene="${i}" ${can ? '' : 'disabled'} ${i === sIdx ? 'aria-current="step"' : ''}><span class="n">${i + 1}</span>${esc(sc.place)}</button></li>`;
    }).join('');
  }
  $('#journey').addEventListener('click', (e) => {
    const b = e.target.closest('[data-scene]');
    if (b && !b.disabled) enterScene(+b.dataset.scene, 0);
  });
  function setActor(side, role, emo, enter) {
    const el = side === 'left' ? $('#actorLeft') : $('#actorRight');
    if (!role) { el.innerHTML = ''; cast[side] = null; return; }
    cast[side] = { role, emo };
    el.innerHTML = CH.svg(role, emo, { label: `${CH.ROLES[role].name}` });
    if (enter) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
  }
  function enterScene(i, step = 0) {
    sIdx = i; stIdx = step;
    if (i === 0 && step === 0) { runScore = 0; runTotal = 0; }
    const sc = C.story[i];
    $('#stageBg').innerHTML = window.Backgrounds[sc.bg] || '';
    $('#placeTag').innerHTML = `${esc(sc.place)} <small>${esc(sc.placeEn)} · ${esc(sc.time)}</small>`;
    const [lr, le] = sc.cast.left || [], [rr, re] = sc.cast.right || [];
    setActor('left', lr, le, true);
    setActor('right', rr, re, true);
    S3.setMood(sc.mood);
    renderJourney();
    renderStep();
  }
  function renderStep() {
    const sc = C.story[sIdx];
    const st = sc.steps[stIdx];
    state.story.scene = sIdx; state.story.step = stIdx; save();
    const speaker = $('#speaker'), en = $('#lineEn'), pt = $('#linePt'), ch = $('#choices'), ex = $('#explain'), next = $('#nextBtn');
    ch.innerHTML = ''; ex.hidden = true; ex.className = 'explain';
    $('#stepCount').textContent = `${stIdx + 1} / ${sc.steps.length}`;
    if (!st) return endScene();
    if (st.quiz) {
      quizSolved = false; firstTry = true;
      speaker.textContent = 'Desafio'; speaker.dataset.who = 'quiz';
      en.textContent = st.q; en.classList.add('quiz-q');
      pt.textContent = ''; pt.hidden = true;
      $('#sayBtn').hidden = true;
      const order = shuffle(st.opts.map((o, k) => k));
      ch.innerHTML = order.map((k) => `<button class="choice" data-k="${k}">${esc(st.opts[k])}</button>`).join('');
      next.disabled = true;
      ['left', 'right'].forEach((s) => { const el = s === 'left' ? $('#actorLeft') : $('#actorRight'); el.classList.remove('talking', 'quiet'); });
      return;
    }
    en.classList.remove('quiz-q');
    $('#sayBtn').hidden = st.en === '...';
    next.disabled = false;
    speaker.textContent = ROLE_NAME[st.who] || st.who; speaker.dataset.who = st.who;
    en.textContent = st.en === '...' ? '(...)' : st.en;
    pt.textContent = st.pt; pt.hidden = !ptOn;
    ['left', 'right'].forEach((side) => {
      const a = cast[side];
      const el = side === 'left' ? $('#actorLeft') : $('#actorRight');
      if (!a) return;
      const talking = a.role === st.who;
      if (talking && st.emo && st.emo !== a.emo) setActor(side, a.role, st.emo);
      el.classList.toggle('talking', talking);
      el.classList.toggle('quiet', st.who !== 'narr' && !talking);
    });
    speak(st.en);
  }
  $('#choices').addEventListener('click', (e) => {
    const b = e.target.closest('.choice');
    if (!b || quizSolved) return;
    const st = C.story[sIdx].steps[stIdx];
    const ex = $('#explain');
    if (+b.dataset.k === st.a) {
      quizSolved = true;
      b.classList.add('right');
      $$('.choice', $('#choices')).forEach((c) => { c.disabled = true; });
      ex.hidden = false; ex.className = 'explain ok';
      ex.textContent = (firstTry ? 'Isso mesmo! +1 estrela. ' : 'Agora sim! ') + st.why;
      runTotal++;
      if (firstTry) { runScore++; addStars(1); S3.celebrate(); }
      sfx.ok();
      if (/^[A-Z]/.test(st.opts[st.a]) && /[.?!]$/.test(st.opts[st.a])) speak(st.opts[st.a]);
      $('#nextBtn').disabled = false;
      $('#nextBtn').focus();
    } else {
      firstTry = false;
      b.classList.add('wrong'); b.disabled = true;
      ex.hidden = false; ex.className = 'explain no';
      ex.textContent = 'Quase! Tente de novo. Dica: ' + st.why.split('.')[0] + '.';
      sfx.no();
    }
  });
  $('#sayBtn').addEventListener('click', () => {
    const st = C.story[sIdx].steps[stIdx];
    if (st && st.en) { const s = state.sound; state.sound = true; speak(st.en); state.sound = s; }
  });
  $('#nextBtn').addEventListener('click', () => {
    const sc = C.story[sIdx];
    if (stIdx < sc.steps.length) { stIdx++; renderStep(); }
    else if (sIdx < C.story.length - 1) enterScene(sIdx + 1, 0);
    else { state.story = { scene: 0, step: 0, done: state.story.done }; save(); enterScene(0, 0); }
  });
  function endScene() {
    const sc = C.story[sIdx];
    if (!state.story.done.includes(sc.id)) state.story.done.push(sc.id);
    save();
    renderJourney();
    const last = sIdx === C.story.length - 1;
    const speaker = $('#speaker');
    speaker.textContent = last ? 'Fim da história' : 'Próxima parada'; speaker.dataset.who = 'quiz';
    $('#sayBtn').hidden = true;
    $('#linePt').hidden = true;
    if (last) {
      const total = C.story.reduce((n, s) => n + s.steps.filter((x) => x.quiz).length, 0);
      const score = runTotal ? runScore : null;
      const pct = score == null ? 1 : score / total;
      const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
      $('#lineEn').innerHTML = `<span class="end-card"><span class="end-stars" aria-label="${stars} de 3 estrelas">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>` +
        `Parabéns! A Mika está saudável de novo.${score != null ? ` Você acertou ${score} de ${total} desafios de primeira.` : ''}</span>`;
      $('#nextBtn').textContent = 'Jogar de novo';
      setActor('left', 'mika', 'happy');
      S3.celebrate(); sfx.win();
      state.best.story = Math.max(state.best.story || 0, score || 0); save();
      $('#choices').innerHTML = '<button class="btn" data-go="cards">Revisar com flashcards</button><button class="btn" data-go="games">Ir para os jogos</button>';
    } else {
      const nx = C.story[sIdx + 1];
      $('#lineEn').textContent = `Muito bem! Agora a Mika vai para: ${nx.place} (${nx.placeEn}).`;
      $('#nextBtn').textContent = 'Continuar';
    }
    $('#nextBtn').onclick = null;
    $('#nextBtn').addEventListener('click', resetNextLabel, { once: true });
  }
  function resetNextLabel() { $('#nextBtn').textContent = 'Continuar'; }

  // ---------- Flashcards ----------
  const CAT_COLOR = { feelings: 'var(--pink)', health: 'var(--mint)', symptoms: 'var(--peach)', body: 'var(--sky)', hospital: 'var(--lavender)', phrases: 'var(--butter)', all: 'var(--pink)' };
  let cat = 'all', deck = [], cIdx = 0, ptFirst = false;
  const cardKey = (w) => w.en;
  function buildDeck(shuffled) {
    const pool = cat === 'all' ? VOCAB.flatMap((c) => c.words.map((w) => ({ ...w, cat: c.id, catPt: c.pt }))) : (VOCAB.find((c) => c.id === cat) || { words: [] }).words.map((w) => ({ ...w, cat, catPt: VOCAB.find((c) => c.id === cat).pt }));
    const base = shuffled ? shuffle(pool) : pool;
    deck = base.map((w, i) => ({ w, i })).sort((a, b) => (state.boxes[cardKey(a.w)] || 0) - (state.boxes[cardKey(b.w)] || 0) || a.i - b.i).map((x) => x.w);
    cIdx = 0;
  }
  function renderChips() {
    const all = VOCAB.reduce((n, c) => n + c.words.length, 0);
    $('#catChips').innerHTML = [['all', 'Todas', all], ...VOCAB.map((c) => [c.id, c.pt, c.words.length])]
      .map(([id, n, k]) => `<button class="cat-chip" role="tab" data-cat="${id}" aria-selected="${id === cat}">${esc(n)} <small>${k}</small></button>`).join('');
  }
  $('#catChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat; renderChips(); buildDeck(false); renderCard();
  });
  function art(w) {
    const emo = C.emotionOf[w.en];
    if (emo && CH.FACES[emo]) return `<div class="fc-art">${CH.svg('mika', emo, { label: w.en })}</div>`;
    return `<div class="fc-art" aria-hidden="true">${C.icons[w.en] || '🌸'}</div>`;
  }
  const sayBtn = (txt) => `<button class="chip-btn fc-say" data-say="${esc(txt)}">Ouvir</button>`;
  function renderCard() {
    if (!deck.length) buildDeck(false);
    const w = deck[cIdx];
    const fc = $('#flashcard');
    fc.classList.remove('flipped');
    if (!w) return;
    fc.style.setProperty('--cat', CAT_COLOR[w.cat] || 'var(--pink)');
    const box = state.boxes[cardKey(w)] || 0;
    const boxLabel = box >= 3 ? 'dominada' : box > 0 ? 'aprendendo' : 'nova';
    const pill = `<span class="fc-pill">${esc(w.catPt)} · ${boxLabel}</span>`;
    const enSide = `${sayBtn(w.en)}${art(w)}<div class="fc-word">${esc(w.en)}</div>${pill}`;
    const ptSide = `${art(w)}<div class="fc-word">${esc(w.pt)}</div>${pill}`;
    const backEn = `${sayBtn(w.en + '. ' + w.ex)}<p class="fc-sub">em português</p><div class="fc-word">${esc(w.pt)}</div><p class="fc-ex">“${esc(w.ex)}”</p>`;
    const backPt = `${sayBtn(w.en + '. ' + w.ex)}<p class="fc-sub">em inglês</p><div class="fc-word">${esc(w.en)}</div><p class="fc-ex">“${esc(w.ex)}”</p>`;
    $('#fcFront').innerHTML = ptFirst ? ptSide : enSide;
    $('#fcBack').innerHTML = ptFirst ? backPt : backEn;
    renderFcStats();
  }
  function renderFcStats() {
    const keys = deck.map(cardKey);
    const n0 = keys.filter((k) => !(state.boxes[k] > 0)).length;
    const n3 = keys.filter((k) => state.boxes[k] >= 3).length;
    $('#fcStats').innerHTML = `<span class="box-pill">Cartão <b>${cIdx + 1}</b> de ${deck.length}</span>` +
      `<span class="box-pill">Novas <b>${n0}</b></span><span class="box-pill">Aprendendo <b>${keys.length - n0 - n3}</b></span><span class="box-pill">Dominadas <b>${n3}</b></span>`;
  }
  function flip() { $('#flashcard').classList.toggle('flipped'); sfx.flip(); }
  $('#flashcard').addEventListener('click', (e) => {
    const s = e.target.closest('[data-say]');
    if (s) { e.stopPropagation(); const v = state.sound; state.sound = true; speak(s.dataset.say); state.sound = v; return; }
    flip();
  });
  function move(d) { cIdx = (cIdx + d + deck.length) % deck.length; renderCard(); }
  $('#prevCard').addEventListener('click', () => move(-1));
  $('#nextCard').addEventListener('click', () => move(1));
  $('#knowBtn').addEventListener('click', () => {
    const k = cardKey(deck[cIdx]);
    const before = state.boxes[k] || 0;
    state.boxes[k] = Math.min(3, before + 1);
    if (before < 3 && state.boxes[k] === 3) { addStars(1); toast('Palavra dominada! +1 estrela'); S3.celebrate(); sfx.win(); } else sfx.ok();
    save(); move(1);
  });
  $('#againBtn').addEventListener('click', () => {
    const k = cardKey(deck[cIdx]); state.boxes[k] = 0; save();
    // volta para o fim da pilha para aparecer de novo logo
    const [w] = deck.splice(cIdx, 1); deck.splice(Math.min(cIdx + 3, deck.length), 0, w);
    if (cIdx >= deck.length) cIdx = 0;
    renderCard();
  });
  $('#dirBtn').addEventListener('click', (e) => {
    ptFirst = !ptFirst; e.currentTarget.setAttribute('aria-pressed', String(ptFirst));
    e.currentTarget.textContent = ptFirst ? 'Português → Inglês' : 'Inglês → Português';
    renderCard();
  });
  $('#shuffleBtn').addEventListener('click', () => { buildDeck(true); renderCard(); toast('Cartões embaralhados'); });
  document.addEventListener('keydown', (e) => {
    if (current !== 'cards') return;
    if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest('button')) { e.preventDefault(); flip(); }
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowLeft') move(-1);
  });
  renderChips();

  // ---------- Mini-jogos ----------
  const GAMES = [
    { id: 'fill', title: 'Feel, Have ou Hurts?', desc: 'Complete a frase com o verbo certo.', art: () => `<div class="gc-art word" style="background:var(--pink)">feel<br>have<br>hurts</div>`, run: gameFill },
    { id: 'body', title: 'Onde dói?', desc: 'Ouça "My ___ hurts" e toque na parte do corpo.', art: () => `<div class="gc-art" style="background:var(--sky)">${CH.svg('mika', 'pain')}</div>`, run: gameBody },
    { id: 'feel', title: 'Como a Mika se sente?', desc: 'Olhe o rosto e escolha o sentimento.', art: () => `<div class="gc-art" style="background:var(--mint)">${CH.svg('mika', 'nervous')}</div>`, run: gameFeel },
    { id: 'memory', title: 'Memória do hospital', desc: 'Encontre os pares inglês e português.', art: () => `<div class="gc-art word" style="background:var(--lavender)">EN<br>↔<br>PT</div>`, run: gameMemory },
    { id: 'chunks', title: 'Monte a frase', desc: 'Junte os blocos coloridos na ordem certa.', art: () => `<div class="gc-art word" style="background:var(--butter)">S · V · O</div>`, run: gameChunks },
  ];
  function showHub() {
    $('#gamePanel').hidden = true;
    $('#gamesHub').hidden = false;
    $('#gamesHub').innerHTML = GAMES.map((g) => `<button class="game-card" data-game="${g.id}">${g.art()}<div><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p>${state.best[g.id] != null ? `<span class="best">Melhor: ${state.best[g.id]} acertos de primeira</span>` : ''}</div></button>`).join('');
  }
  $('#gamesHub').addEventListener('click', (e) => { const b = e.target.closest('[data-game]'); if (b) openGame(b.dataset.game); });
  $('#backToHub').addEventListener('click', showHub);

  let G = null; // jogo atual
  function openGame(id) {
    const g = GAMES.find((x) => x.id === id);
    $('#gamesHub').hidden = true; $('#gamePanel').hidden = false;
    $('#gameTitle').textContent = g.title;
    G = { id, score: 0, round: 0, total: 0, first: true };
    g.run($('#gameBody'));
  }
  function meta() {
    $('#gameRound').textContent = G.total ? `Rodada ${Math.min(G.round + 1, G.total)} / ${G.total}` : '';
    $('#gameHearts').textContent = `✓ ${G.score}`;
  }
  function hit(ok) {
    if (ok) { if (G.first) { G.score++; addStars(1); } sfx.ok(); S3.celebrate(); } else { G.first = false; sfx.no(); }
    meta();
  }
  function finish(body, line) {
    const pct = G.total ? G.score / G.total : 1;
    const emo = pct >= 0.8 ? 'happy' : pct >= 0.5 ? 'relieved' : 'calm';
    state.best[G.id] = Math.max(state.best[G.id] || 0, G.score); state.played++; save();
    sfx.win(); S3.celebrate();
    const msg = pct >= 0.8 ? 'Incrível! You feel great!' : pct >= 0.5 ? 'Muito bem! Continue praticando.' : 'Bom começo! Tente de novo com calma.';
    body.innerHTML = `<div class="result">${CH.svg('mika', emo)}<h3>${msg}</h3><p>${line || `Você acertou <b>${G.score}</b> de ${G.total} de primeira.`}</p>` +
      `<div class="opt-row" style="justify-content:center"><button class="btn btn-primary" id="again">Jogar de novo</button><button class="btn" id="hub">Outros jogos</button></div></div>`;
    $('#again', body).addEventListener('click', () => openGame(G.id));
    $('#hub', body).addEventListener('click', showHub);
    $('#gameRound').textContent = 'Fim de jogo';
  }
  const next = (fn, ms = 1100) => setTimeout(fn, ms);

  function ruleHint(ans) {
    if (/^feels?$/.test(ans)) return 'Adjetivo (sentimento ou estado) → FEEL.';
    if (/^ha(ve|s)$/.test(ans)) return 'Sintoma é substantivo (a headache, a fever) → HAVE / HAS.';
    return 'Parte do corpo que dói → HURTS / ACHES. Singular leva -s, plural não.';
  }
  function gameFill(body) {
    const items = shuffle(C.fillBank).slice(0, 10);
    G.total = items.length;
    const round = () => {
      if (G.round >= items.length) return finish(body);
      const it = items[G.round]; G.first = true; meta();
      const [a, b] = it.s.split('___');
      body.innerHTML = `<p class="prompt">${esc(a)}<span class="blank">?</span>${esc(b)}</p>` +
        `<div class="opt-row">${shuffle(it.o).map((o) => `<button class="choice" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p>`;
      body.querySelector('.opt-row').addEventListener('click', (e) => {
        const btn = e.target.closest('.choice'); if (!btn || btn.disabled) return;
        const fb = $('.feedback', body);
        if (btn.dataset.o === it.a) {
          btn.classList.add('right'); $$('.choice', body).forEach((c) => { c.disabled = true; });
          $('.blank', body).textContent = it.a;
          fb.className = 'feedback ok'; fb.textContent = G.first ? 'Isso! +1 estrela' : 'Agora sim!';
          hit(true); speak(it.s.replace('___', it.a)); G.round++; next(round, 1500);
        } else {
          btn.classList.add('wrong'); btn.disabled = true;
          fb.className = 'feedback no'; fb.textContent = 'Quase! ' + ruleHint(it.a); hit(false);
        }
      });
    };
    round();
  }

  function gameBody(body) {
    const items = shuffle(C.bodyParts).slice(0, 8);
    G.total = items.length;
    body.innerHTML = `<div class="body-game"><div class="body-fig">${CH.svg('mika', 'pain', { full: true, hit: true, label: 'Mika, corpo inteiro' })}</div>` +
      `<div class="body-side"><p class="prompt-pt">Mika diz:</p><p class="prompt" id="bodyPrompt"></p><div class="opt-row"><button class="chip-btn" id="bodySay">Ouvir de novo</button><button class="chip-btn" id="bodyHint">Mostrar tradução</button></div><p class="prompt-pt" id="bodyPt" hidden></p><p class="feedback" aria-live="polite"></p></div></div>`;
    const fig = $('.body-fig svg', body);
    const fb = $('.feedback', body);
    let it, locked = false;
    const say = () => { const v = state.sound; state.sound = true; speak(it.say || `My ${it.en} hurts.`); state.sound = v; };
    const round = () => {
      if (G.round >= items.length) return finish(body);
      it = items[G.round]; G.first = true; locked = false; meta();
      $('#bodyPrompt').textContent = it.say || `My ${it.en} hurts.`;
      $('#bodyPt').textContent = `${it.en} = ${it.pt}`; $('#bodyPt').hidden = true;
      fb.textContent = ''; fb.className = 'feedback';
      speak(it.say || `My ${it.en} hurts.`);
    };
    $('#bodySay').addEventListener('click', say);
    $('#bodyHint').addEventListener('click', () => { $('#bodyPt').hidden = false; G.first = false; });
    fig.addEventListener('click', (e) => {
      const z = e.target.closest('.hit'); if (!z || locked) return;
      const ok = z.dataset.part === it.part;
      $$(`.hit[data-part="${z.dataset.part}"]`, fig).forEach((h) => { h.classList.add(ok ? 'flash-ok' : 'flash-no'); setTimeout(() => h.classList.remove('flash-ok', 'flash-no'), 900); });
      if (ok) {
        locked = true; fb.className = 'feedback ok'; fb.textContent = `Isso! ${it.en} = ${it.pt}`; hit(true); G.round++; next(round, 1400);
      } else {
        const p = C.bodyParts.find((b) => b.part === z.dataset.part);
        fb.className = 'feedback no'; fb.textContent = `Aí é ${p ? `"${p.en}" (${p.pt})` : 'outra parte'}. Tente de novo!`; hit(false);
      }
    });
    round();
  }

  function gameFeel(body) {
    const all = VOCAB.filter((c) => c.id === 'feelings' || c.id === 'health').flatMap((c) => c.words);
    const byEn = Object.fromEntries(all.map((w) => [w.en, w]));
    const items = shuffle(C.feelingRound.filter((k) => byEn[k])).slice(0, 8);
    G.total = items.length;
    const label = (en) => en.replace(' / ill', '');
    const round = () => {
      if (G.round >= items.length) return finish(body);
      const k = items[G.round]; G.first = true; meta();
      const wrong = shuffle(C.feelingRound.filter((x) => x !== k && byEn[x] && C.emotionOf[x] !== C.emotionOf[k])).slice(0, 3);
      body.innerHTML = `<div class="feel-game"><div class="feel-face">${CH.svg('mika', C.emotionOf[k], { label: 'Rosto da Mika' })}</div>` +
        `<div class="game-body"><p class="prompt">How does Mika feel?</p><p class="prompt-pt">Como a Mika se sente?</p>` +
        `<div class="opt-row">${shuffle([k, ...wrong]).map((o) => `<button class="choice" data-o="${esc(o)}">${esc(label(o))}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p></div></div>`;
      $('.opt-row', body).addEventListener('click', (e) => {
        const btn = e.target.closest('.choice'); if (!btn || btn.disabled) return;
        const fb = $('.feedback', body);
        if (btn.dataset.o === k) {
          btn.classList.add('right'); $$('.choice', body).forEach((c) => { c.disabled = true; });
          const w = byEn[k];
          fb.className = 'feedback ok'; fb.textContent = `She feels ${label(k)}. (${w.pt})`;
          hit(true); speak(`She feels ${label(k)}.`); G.round++; next(round, 1600);
        } else {
          btn.classList.add('wrong'); btn.disabled = true;
          const w = byEn[btn.dataset.o];
          fb.className = 'feedback no'; fb.textContent = `${label(btn.dataset.o)} = ${w.pt}. Olhe bem os olhos e a boca!`; hit(false);
        }
      });
    };
    round();
  }

  function gameMemory(body) {
    const pool = VOCAB.filter((c) => ['hospital', 'symptoms'].includes(c.id)).flatMap((c) => c.words);
    const pairs = shuffle(pool).slice(0, 6);
    G.total = 0;
    const cards = shuffle(pairs.flatMap((w, i) => [{ i, t: w.en, lang: 'en' }, { i, t: w.pt, lang: 'pt' }]));
    let open = [], found = 0, moves = 0, busy = false;
    meta();
    $('#gameRound').textContent = `Pares: 0 / ${pairs.length}`;
    body.innerHTML = `<p class="prompt-pt">Vire dois cartões: uma palavra em inglês e sua tradução.</p><div class="memory">${cards.map((c, k) => `<button class="mem ${c.lang}" data-k="${k}" aria-label="Cartão ${k + 1}"><span class="mem-txt">${esc(c.t)}</span></button>`).join('')}</div>`;
    $('.memory', body).addEventListener('click', (e) => {
      const b = e.target.closest('.mem'); if (!b || busy || b.classList.contains('open') || b.classList.contains('done')) return;
      const c = cards[+b.dataset.k];
      b.classList.add('open'); b.setAttribute('aria-label', c.t); sfx.flip();
      if (c.lang === 'en') speak(c.t);
      open.push(b);
      if (open.length < 2) return;
      moves++;
      const [x, y] = open.map((el) => cards[+el.dataset.k]);
      if (x.i === y.i && x.lang !== y.lang) {
        open.forEach((el) => el.classList.add('done')); open = []; found++;
        G.score = found; addStars(1); sfx.ok(); S3.celebrate();
        $('#gameRound').textContent = `Pares: ${found} / ${pairs.length}`; $('#gameHearts').textContent = `✓ ${found}`;
        if (found === pairs.length) next(() => {
          // memória perfeita = 6 jogadas; cada 2 jogadas extras tiram um ponto
          G.total = pairs.length;
          G.score = Math.max(1, pairs.length - Math.floor(Math.max(0, moves - pairs.length - 2) / 2));
          finish(body, `Você encontrou os ${pairs.length} pares em <b>${moves}</b> jogadas.`);
        }, 900);
      } else {
        busy = true;
        setTimeout(() => { open.forEach((el) => { el.classList.remove('open'); el.setAttribute('aria-label', 'Cartão'); }); open = []; busy = false; }, 1000);
      }
    });
  }

  function gameChunks(body) {
    const items = shuffle(C.chunks).slice(0, 6);
    G.total = items.length;
    const round = () => {
      if (G.round >= items.length) return finish(body);
      const it = items[G.round]; G.first = true; meta();
      let pos = 0;
      const order = shuffle(it.c.map((c, k) => k));
      if (order.every((k, i) => k === i) && order.length > 1) order.reverse();
      body.innerHTML = `<p class="prompt-pt">Monte em inglês:</p><p class="prompt">${esc(it.pt)}</p><div class="chunk-target"></div>` +
        `<div class="chunk-pool">${order.map((k) => `<button class="chunk ck-${it.c[k][1]}" data-k="${k}"><small>${it.c[k][1]}</small>${esc(it.c[k][0])}</button>`).join('')}</div>` +
        `<div class="legend">${Object.entries(C.chunkLegend).map(([k, v]) => `<span class="ck ck-${k}">${k} · ${v}</span>`).join('')}</div><p class="feedback" aria-live="polite"></p>`;
      const target = $('.chunk-target', body), fb = $('.feedback', body);
      $('.chunk-pool', body).addEventListener('click', (e) => {
        const b = e.target.closest('.chunk'); if (!b || b.classList.contains('used')) return;
        const k = +b.dataset.k;
        if (it.c[k][0] === it.c[pos][0]) {
          b.classList.add('used');
          target.insertAdjacentHTML('beforeend', `<span class="chunk ck-${it.c[k][1]}"><small>${it.c[k][1]}</small>${esc(it.c[k][0])}</span>`);
          pos++; sfx.flip();
          if (pos === it.c.length) {
            const sentence = it.c.map((c) => c[0]).join(' ');
            fb.className = 'feedback ok'; fb.textContent = G.first ? 'Perfeito! +1 estrela' : 'Frase completa!';
            hit(true); speak(sentence); G.round++; next(round, 1800);
          }
        } else {
          b.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 300 });
          const need = it.c[pos][1];
          fb.className = 'feedback no'; fb.textContent = `Ainda não. O próximo bloco é ${C.chunkLegend[need].toLowerCase()} (${need}).`; hit(false);
        }
      });
    };
    round();
  }

  // ---------- Início do app ----------
  const start = location.hash.replace('#', '');
  go(VIEWS.includes(start) ? start : 'home');
})();
