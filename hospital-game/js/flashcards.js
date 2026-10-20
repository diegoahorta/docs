// Página só de flashcards: Mika no Hospital.
// Usa o mesmo progresso salvo do jogo (mesma chave no navegador).
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const C = window.CONTENT;
  const VOCAB = window.VOCAB || [];
  const CH = window.Characters;
  const S3 = window.Scene3D || { setMood() {}, showHospital() {}, celebrate() {} };
  const current = 'cards';

  const KEY = 'mika-hospital-v1';
  let state = { stars: 0, sound: true, boxes: {} };
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...state, ...JSON.parse(raw) }; } catch (e) { /* armazenamento indisponível */ }
  function save() {
    try {
      const raw = localStorage.getItem(KEY);
      localStorage.setItem(KEY, JSON.stringify({ ...(raw ? JSON.parse(raw) : {}), stars: state.stars, sound: state.sound, boxes: state.boxes }));
    } catch (e) { /* ignora */ }
  }

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
  const sfx = { ok: () => tone([660, 880, 1175]), flip: () => tone([520], 0.06), win: () => tone([523, 659, 784, 1047], 0.14) };

  let voice = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!state.sound || !('speechSynthesis' in window) || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = 0.88; u.pitch = 1.1;
      if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch (e) { /* sem voz */ }
  }
  const soundBtn = $('#soundBtn');
  const syncSound = () => soundBtn.setAttribute('aria-pressed', String(state.sound));
  soundBtn.addEventListener('click', () => { state.sound = !state.sound; syncSound(); save(); toast(state.sound ? 'Som e voz ligados' : 'Som e voz desligados'); });
  syncSound();

  const starEl = $('#starCount');
  starEl.textContent = state.stars;
  function addStars(n = 1) {
    state.stars += n; starEl.textContent = state.stars; save();
    const box = starEl.parentElement; box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
  }
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }

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

  // Lista de todas as palavras da categoria (para estudar ou revisar com a turma)
  const listBtn = $('#listBtn');
  let listOn = false;
  function renderList() {
    const rows = deck.map((w) => {
      const box = state.boxes[cardKey(w)] || 0;
      const tag = box >= 3 ? 'dominada' : box > 0 ? 'aprendendo' : 'nova';
      return `<tr><td><button class="chip-btn" data-say="${esc(w.en + '. ' + w.ex)}" aria-label="Ouvir ${esc(w.en)}">Ouvir</button></td>` +
        `<td><b>${esc(w.en)}</b></td><td>${esc(w.pt)}</td><td>${esc(w.ex)}</td><td><span class="fc-pill">${tag}</span></td></tr>`;
    }).join('');
    $('#wordList').innerHTML = `<table><thead><tr><th></th><th>English</th><th>Português</th><th>Exemplo</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function syncList() {
    listBtn.setAttribute('aria-pressed', String(listOn));
    listBtn.textContent = listOn ? 'Ver cartões' : 'Ver lista';
    $('#cardMode').hidden = listOn;
    $('#wordList').hidden = !listOn;
    if (listOn) renderList();
  }
  listBtn.addEventListener('click', () => { listOn = !listOn; syncList(); });
  $('#wordList').addEventListener('click', (e) => {
    const s = e.target.closest('[data-say]');
    if (s) { const v = state.sound; state.sound = true; speak(s.dataset.say); state.sound = v; }
  });
  $('#catChips').addEventListener('click', () => { if (listOn) renderList(); });

  S3.showHospital(false);
  buildDeck(false);
  renderCard();
})();
