/**
 * FLASHCARDS 3D — jogo de vocabulário (Three.js + modelos do Blender).
 *
 * Três modos, pensados para pré-adolescentes (11–13 anos):
 *  1. Estudar   — cartas 3D que viram; o aluno decide "Já sei" / "Ainda não" (caixas de Leitner por carta).
 *  2. Memória   — jogo da memória 3D: palavra (com a/an e áudio) ↔ objeto 3D.
 *  3. Café Rush — o cliente faz um pedido em áudio; o aluno serve o item certo e completa a/an.
 *
 * Acessibilidade: toda ação feita na cena 3D tem botão HTML equivalente e atalho de teclado;
 * com "Reduzir movimento", as animações viram transições instantâneas.
 * Sem WebGL, o modo Estudar funciona em 2D e os outros modos avisam que precisam de 3D.
 */
import { h, clear, shuffle, announce } from '../core/dom.js';
import { playLine, stopAll } from '../core/speech.js';
import { assetUrl } from '../core/unit-loader.js';
import { addXP, award } from '../core/gamify.js';
import * as art from '../three/card-art.js';
import { plainText, isJa, tl } from '../core/text.js';
import { plain, reading, romaji } from '../core/jp.js';

const BOX_LABELS = ['Nova', '1', '2', '3', 'Dominada'];

export async function render(ctx) {
  const { unit, progress } = ctx;
  const fc = unit.flashcards;
  if (!fc) return h('div', { class: 'card' }, h('p', {}, 'Esta unidade não tem flashcards configurados.'));
  const lang = unit.language.bcp47;
  const st = (progress.flashcards ||= { boxes: {}, best: {}, dir: 'en-pt', autoAudio: true });
  const reduced = () => document.documentElement.dataset.motion === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CARDS = fc.cards.map((c) => {
    const v = unit.vocabulary.find((x) => x.id === c.vocab);
    return { ...c, v, id: c.vocab, word: v.term, article: v.article || '', category: v.category };
  });
  const ja = isJa(unit);
  const langName = unit.language.name.toLowerCase();
  /** Texto exibido da carta (com artigo no inglês; sem marcação no japonês). */
  const articled = (c) => plainText(unit, c.article ? `${c.article} ${c.word}` : c.word);
  const sayWord = (c) => playLine(unit, c.v.audioText || (c.article ? `${c.article} ${c.word}` : c.word.replace(/ \/ /g, ', ').replace(/[?.]$/, '')));
  /** Japonês: leitura em kana (só quando há kanji) e romaji para a arte da carta. */
  const kanaOf = (t) => (ja && plain(t) !== reading(t) ? reading(t) : '');
  const subOf = (c) => (ja ? romaji(c.word) : c.v.pron);
  const box = (c) => st.boxes[c.id] || 0;

  /* ---------------- estrutura da página ---------------- */
  const root = h('div', { class: 'fc-page' });
  const menu = h('div', {});
  const play = h('section', { class: 'card fc-play', hidden: true });
  const hud = h('div', { class: 'fc-hud' });
  const canvasBox = h('div', { class: 'fc-canvas' });
  const overlay = h('div', { class: 'fc-overlay', 'aria-live': 'polite' });
  const controls = h('div', { class: 'fc-controls' });
  canvasBox.append(overlay);
  play.append(hud, canvasBox, controls);
  root.append(
    h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Jogo · Vocabulário em 3D'), h('h1', {}, `🃏 ${fc.title}`),
      h('p', {}, 'Cartas 3D com os objetos da cafeteria. Estude, jogue a memória e atenda clientes no Café Rush!')),
    menu, play);

  /* ---------------- ciclo de vida ---------------- */
  let engine = null;
  let modeGroup = null;
  let unsubs = [];
  let keyHandler = null;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const onKey = (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.altKey || e.ctrlKey || e.metaKey) return;
    keyHandler?.(e);
  };
  document.addEventListener('keydown', onKey);
  ctx.onLeave?.(() => {
    document.removeEventListener('keydown', onKey);
    timers.forEach(clearTimeout);
    stopAll();
    engine?.dispose();
    engine = null;
  });

  let webgl = null;
  async function ensureEngine() {
    if (engine) return engine;
    const mod = await import('../three/cafe3d.js');
    if (webgl === null) webgl = mod.webglAvailable();
    if (!webgl) return null;
    const loading = h('p', { class: 'fc-loading' }, 'Carregando a cafeteria 3D…');
    canvasBox.append(loading);
    engine = await mod.createCafe3D(canvasBox, { glbUrl: assetUrl(fc.model.startsWith('assets/') ? fc.model : unit._base + fc.model), reducedMotion: reduced() });
    loading.remove();
    canvasBox.append(overlay); // mantém o overlay acima do canvas
    modeGroup = new engine.THREE.Group();
    engine.scene.add(modeGroup);
    return engine;
  }

  function resetMode() {
    unsubs.forEach((u) => u());
    unsubs = [];
    timers.forEach(clearTimeout);
    timers.clear();
    keyHandler = null;
    stopAll();
    clear(overlay); clear(controls); clear(hud);
    if (engine) {
      engine.clearGroup(modeGroup);
      engine.clearPickables();
      engine.onPick(null);
      engine.onSwipe(null);
      if (engine.customer) engine.customer.visible = false;
    }
  }

  function backToMenu() {
    resetMode();
    play.hidden = true;
    drawMenu();
    menu.hidden = false;
    menu.querySelector('button')?.focus();
  }

  function startMode(fn) {
    menu.hidden = true;
    play.hidden = false;
    resetMode();
    return fn();
  }

  function hudRow(title, ...pills) {
    clear(hud).append(h('div', { class: 'row between' },
      h('div', { class: 'row' }, h('button', { class: 'btn small ghost', onClick: backToMenu }, '← Modos'), h('strong', {}, title)),
      h('div', { class: 'row' }, pills.map((p) => h('span', { class: 'fc-pill' }, p)))));
  }

  /* ---------------- menu ---------------- */
  function drawMenu() {
    const counts = [0, 0, 0, 0, 0];
    CARDS.forEach((c) => counts[box(c)]++);
    const mastered = CARDS.filter((c) => box(c) >= 2).length;
    ctx.setModule('flashcards', Math.min(1, (mastered / CARDS.length) * 0.6 + (st.best.memory ? 0.2 : 0) + (st.best.rush ? 0.2 : 0)));
    clear(menu).append(
      h('div', { class: 'flow-cards' },
        modeCard('📇', 'Estudar', `Rodadas de ${fc.studyRound} cartas. Vire, ouça e diga se já sabe.`, `${mastered}/${CARDS.length} cartas firmes`, () => startMode(startStudy)),
        modeCard('🧠', 'Memória 3D', ja ? 'Encontre os pares: palavra (com leitura) ↔ objeto 3D.' : 'Encontre os pares: palavra (com a/an) ↔ objeto 3D.', st.best.memory ? `Recorde: ${st.best.memory} jogadas` : 'Ainda sem recorde', () => startMode(startMemory)),
        modeCard('⚡', 'Café Rush', `${fc.rushOrders} clientes. Ouça o pedido, sirva o item ${ja ? 'e responda ao bônus de escuta' : 'e complete a/an'}.`, st.best.rush ? `Recorde: ${st.best.rush} pontos` : 'Ainda sem recorde', () => startMode(startRush))),
      h('section', { class: 'card soft', style: { marginTop: '16px' } },
        h('h3', {}, 'Suas caixas de estudo'),
        h('p', { class: 'small muted' }, 'Cada vez que você diz “Já sei”, a carta sobe uma caixa. “Ainda não” volta para a primeira — sem problema, ela aparece de novo mais cedo.'),
        h('div', { class: 'fc-boxes' }, counts.map((n, i) => h('div', { class: 'fc-box' },
          h('div', { class: 'fc-box-bar', style: { height: `${8 + (n / CARDS.length) * 80}px` } }), h('strong', {}, n), h('span', { class: 'small muted' }, BOX_LABELS[i]))))),
      h('p', { class: 'small muted' }, 'Modelos 3D criados no Blender (', h('code', {}, fc.modelSource || 'tools/blender'), ') e exibidos com Three.js.'));
  }
  function modeCard(icon, title, text, meta, onClick) {
    return h('button', { class: 'card flow-card fc-mode', onClick },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, icon), h('strong', {}, title), h('span', { class: 'small muted' }, text), h('span', { class: 'badge-tag' }, meta));
  }

  /* ================================================================
   * MODO 1 — ESTUDAR
   * ================================================================ */
  async function startStudy() {
    const eng = await ensureEngine();
    if (!eng) return startStudy2D();
    const T = eng.THREE;
    const center = new T.Vector3(0, 1.5, 1.3);
    eng.fitCamera({ w: 0.9, h: 1.15, center, elevation: 0.08 });

    const queue = shuffle(CARDS).sort((a, b) => box(a) - box(b)).slice(0, fc.studyRound);
    const total = queue.length;
    let done = 0, firstTry = 0;
    const missed = new Set();
    let current = null, flipped = false, busy = false;

    const counter = h('span', {});
    const flipBtn = h('button', { class: 'btn primary', onClick: () => flip() }, '🔄 Virar');
    const audioBtn = h('button', { class: 'btn', onClick: () => current && sayWord(current.card) }, '🔊 Ouvir');
    const againBtn = h('button', { class: 'btn fc-again', disabled: true, onClick: () => answer(false) }, '😅 Ainda não');
    const knowBtn = h('button', { class: 'btn fc-know', disabled: true, onClick: () => answer(true) }, '😎 Já sei');
    const dirBtn = h('button', { class: 'btn small', 'aria-pressed': String(st.dir === 'pt-en'), onClick: () => {
      st.dir = st.dir === 'pt-en' ? 'en-pt' : 'pt-en'; ctx.save(); startMode(startStudy);
    } }, st.dir === 'pt-en' ? `Direção: Português → ${unit.language.name}` : `Direção: ${unit.language.name} → Português`);
    const autoBtn = h('label', { class: 'switch small' }, h('input', { type: 'checkbox', checked: st.autoAudio, onChange: (e) => { st.autoAudio = e.target.checked; ctx.save(); } }), 'Falar a palavra automaticamente');
    const sr = h('p', { class: 'sr-only', 'aria-live': 'polite' });
    controls.append(
      h('div', { class: 'row fc-main-actions' }, flipBtn, audioBtn, againBtn, knowBtn),
      h('p', { class: 'small muted' }, 'Toque na carta para virar. Depois arraste para a direita (já sei) ou para a esquerda (ainda não). Teclado: ', h('kbd', {}, 'Espaço'), ' vira · ', h('kbd', {}, '←'), ' ainda não · ', h('kbd', {}, '→'), ' já sei · ', h('kbd', {}, 'P'), ' ouvir.'),
      h('div', { class: 'row' }, dirBtn, autoBtn), sr);
    const drawHud = () => { counter.textContent = `${Math.min(done + 1, total)}/${total}`; hudRow('📇 Estudar', counter, `⭐ ${firstTry}`); };
    drawHud();

    function artFor(c) {
      const v = c.v;
      return st.dir === 'pt-en'
        ? { front: art.frontWithModel({ word: v.pt, sub: `Como se diz em ${langName}?`, category: c.category }), back: art.backAnswer({ kicker: fc.kickerTarget || 'IN ENGLISH', title: articled(c), pron: ja ? [kanaOf(c.word), romaji(c.word)].filter(Boolean).join(' · ') : v.pron, example: plainText(unit, v.example), category: c.category }) }
        : { front: art.frontWithModel({ word: plainText(unit, c.word), article: ja ? kanaOf(c.word) : c.article, sub: subOf(c), category: c.category }), back: art.backAnswer({ kicker: 'EM PORTUGUÊS', title: v.pt, example: plainText(unit, v.example), category: c.category }) };
    }

    async function next() {
      if (!queue.length) return finish();
      const card = queue.shift();
      const { front, back } = artFor(card);
      const g = eng.makeCard({ front, back, model: card.model });
      g.position.copy(center).add(new T.Vector3(0, -1.2, 0));
      g.rotation.set(-0.6, 0, 0);
      modeGroup.add(g);
      eng.addPickable(g);
      current = { card, g };
      flipped = false;
      againBtn.disabled = knowBtn.disabled = true;
      flipBtn.textContent = '🔄 Virar';
      drawHud();
      sr.textContent = st.dir === 'pt-en' ? `Carta: ${card.v.pt}. Como se diz em ${langName}?` : `Carta: ${articled(card)}.`;
      busy = true;
      await Promise.all([eng.tween(g.position, { x: center.x, y: center.y, z: center.z }, 0.55, 'back.out(1.4)'), eng.tween(g.rotation, { x: 0 }, 0.55)]);
      busy = false;
      if (st.autoAudio && st.dir !== 'pt-en') sayWord(card);
    }

    async function flip() {
      if (!current || busy) return;
      busy = true;
      flipped = !flipped;
      await eng.flipCard(current.g, !flipped, 0.6);
      busy = false;
      flipBtn.textContent = flipped ? '🔄 Ver a frente' : '🔄 Virar';
      againBtn.disabled = knowBtn.disabled = !flipped;
      const c = current.card;
      sr.textContent = flipped ? (st.dir === 'pt-en' ? `Resposta: ${articled(c)}. Exemplo: ${plainText(unit, c.v.example)}` : `Tradução: ${c.v.pt}. Exemplo: ${plainText(unit, c.v.example)}`) : '';
      if (flipped && st.dir === 'pt-en' && st.autoAudio) sayWord(c);
    }

    async function answer(known) {
      if (!current || busy) return;
      if (!flipped) { await flip(); return; }
      busy = true;
      const { card, g } = current;
      st.boxes[card.id] = known ? Math.min(box(card) + 1, 4) : 0;
      if (known) { if (!missed.has(card.id)) firstTry++; done++; }
      else { missed.add(card.id); queue.splice(Math.min(2, queue.length), 0, card); }
      ctx.save();
      eng.removePickable(g);
      await Promise.all([eng.tween(g.position, { x: known ? 2.6 : -2.6, y: center.y + 0.3 }, 0.45, 'power2.in'), eng.tween(g.rotation, { z: known ? -0.5 : 0.5 }, 0.45)]);
      modeGroup.remove(g);
      busy = false;
      current = null;
      next();
    }

    function finish() {
      addXP(progress, 15 + firstTry * 2);
      if (CARDS.every((c) => box(c) >= 1)) award(progress, 'flash-study');
      ctx.save();
      clear(controls).append(h('div', { class: 'fc-result' },
        h('h2', {}, '🎉 Rodada concluída!'),
        h('p', {}, `${total} cartas estudadas · ${firstTry} de primeira.`),
        missed.size ? h('p', { class: 'small' }, 'Para rever: ', [...missed].map((id) => articled(CARDS.find((c) => c.id === id)).replace(/[.?!]$/, '')).join(', '), '.') : h('p', { class: 'small' }, 'Você sabia todas de primeira! 👏'),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onClick: () => startMode(startStudy) }, 'Nova rodada'), h('button', { class: 'btn', onClick: backToMenu }, 'Escolher outro modo'))));
      announce('Rodada concluída.');
    }

    eng.onPick(() => flip());
    eng.onSwipe((dir) => { if (flipped) answer(dir === 'right'); else flip(); });
    keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { if (e.target.tagName !== 'BUTTON') { e.preventDefault(); flip(); } }
      else if (e.key === 'ArrowRight') answer(true);
      else if (e.key === 'ArrowLeft') answer(false);
      else if (e.key.toLowerCase() === 'p') current && sayWord(current.card);
    };
    unsubs.push(eng.onFrame((dt, t) => {
      if (current && !busy && !reduced()) current.g.position.y = center.y + Math.sin(t * 1.6) * 0.015;
    }));
    next();
  }

  /** Estudar sem WebGL: cartas 2D com o mesmo fluxo e as mesmas caixas. */
  function startStudy2D() {
    hudRow('📇 Estudar (2D)');
    overlay.append(h('p', { class: 'notice warn' }, 'Seu navegador não liberou gráficos 3D (WebGL). As cartas aparecem em 2D; Memória 3D e Café Rush precisam de WebGL.'));
    const queue = shuffle(CARDS).sort((a, b) => box(a) - box(b)).slice(0, fc.studyRound);
    const cardEl = h('button', { class: 'fc-card2d', 'aria-live': 'polite' });
    let current = null, flipped = false;
    const show = () => {
      current = queue.shift();
      if (!current) { clear(controls).append(h('p', {}, '🎉 Rodada concluída!'), h('button', { class: 'btn', onClick: backToMenu }, 'Voltar')); return; }
      flipped = false; draw();
    };
    const draw = () => { cardEl.textContent = flipped ? `${current.v.pt} — ${plainText(unit, current.v.example)}` : articled(current); };
    cardEl.addEventListener('click', () => { flipped = !flipped; draw(); });
    const ans = (k) => { st.boxes[current.id] = k ? Math.min(box(current) + 1, 4) : 0; if (!k) queue.push(current); ctx.save(); show(); };
    controls.append(cardEl, h('div', { class: 'row' }, h('button', { class: 'btn', onClick: () => sayWord(current) }, '🔊 Ouvir'),
      h('button', { class: 'btn fc-again', onClick: () => ans(false) }, '😅 Ainda não'), h('button', { class: 'btn fc-know', onClick: () => ans(true) }, '😎 Já sei')));
    show();
  }

  /* ================================================================
   * MODO 2 — MEMÓRIA 3D
   * ================================================================ */
  async function startMemory() {
    const eng = await ensureEngine();
    if (!eng) return needWebGL('🧠 Memória 3D');
    const T = eng.THREE;
    const chosen = shuffle(CARDS).slice(0, 6);
    const entries = shuffle(chosen.flatMap((c) => [{ c, kind: 'word' }, { c, kind: 'pic' }]));
    const portrait = canvasBox.clientWidth < 600;
    const cols = portrait ? 3 : 4;
    const rows = Math.ceil(entries.length / cols);
    const S = 0.8, dx = 0.62, dy = 0.82;
    const center = new T.Vector3(0, 1.45, 0.9);
    eng.fitCamera({ w: cols * dx, h: rows * dy, center, elevation: 0.05, margin: 1.05 });
    const back = art.brandBack();
    let open = [], moves = 0, found = 0, locked = false;
    const t0 = performance.now();
    const listEl = h('div', { class: 'fc-mem-list', role: 'group', 'aria-label': 'Cartas do jogo da memória' });

    entries.forEach((e, i) => {
      const front = e.kind === 'word' ? art.wordCard({ word: plainText(unit, e.c.word), article: ja ? '' : e.c.article, sub: ja ? kanaOf(e.c.word) : '', category: e.c.category }) : art.pictureCard({ category: e.c.category });
      const g = eng.makeCard({ front, back, model: e.kind === 'pic' ? e.c.model : null, modelScale: 0.46, modelY: 0.02 });
      g.scale.setScalar(S);
      const col = i % cols, row = Math.floor(i / cols);
      g.position.set(center.x + (col - (cols - 1) / 2) * dx, center.y + ((rows - 1) / 2 - row) * dy, center.z);
      eng.setFace(g, false); // virada para baixo (modelo escondido)
      g.userData.entry = e;
      e.g = g;
      e.btn = h('button', { class: 'btn small fc-mem-btn', onClick: () => reveal(e) }, `Carta ${i + 1}`);
      listEl.append(e.btn);
      modeGroup.add(g);
      eng.addPickable(g);
    });

    const movesEl = h('span', {}), pairsEl = h('span', {});
    const drawHud = () => { movesEl.textContent = `Jogadas: ${moves}`; pairsEl.textContent = `Pares: ${found}/6`; hudRow('🧠 Memória 3D', movesEl, pairsEl); };
    drawHud();
    controls.append(h('p', { class: 'small muted' }, 'Vire duas cartas: uma PALAVRA e o OBJETO que ela nomeia. As palavras são faladas ao virar. Também dá para jogar pelos botões abaixo (teclado e leitor de tela).'), listEl);

    const label = (e) => (e.kind === 'word' ? `Palavra: ${articled(e.c)}` : `Imagem: ${e.c.v.pt}`);

    async function reveal(e) {
      if (locked || e.matched || open.includes(e)) return;
      open.push(e);
      e.btn.textContent = label(e);
      e.btn.setAttribute('aria-pressed', 'true');
      if (e.kind === 'word') sayWord(e.c);
      await eng.flipCard(e.g, true, 0.45);
      if (open.length < 2) return;
      locked = true;
      moves++;
      const [a, b] = open;
      const sameItem = a.c.id === b.c.id;
      if (a.kind !== b.kind) {
        const wordE = a.kind === 'word' ? a : b;
        ctx.record({ id: `fc-mem-${wordE.c.id}`, skills: ['vocab-cafe'] }, sameItem, 1, 'flashcards');
      }
      if (sameItem) {
        found++;
        [a, b].forEach((x) => { x.matched = true; x.btn.disabled = true; x.btn.textContent = `✓ ${label(x)}`; eng.highlight(x.g, '#12a586'); eng.removePickable(x.g); });
        announce(`Par encontrado: ${articled(a.c)}.`);
        await Promise.all([a, b].map((x) => eng.tween(x.g.position, { z: center.z + 0.15 }, 0.25)));
        await Promise.all([a, b].map((x) => eng.tween(x.g.position, { z: center.z }, 0.25)));
        open = [];
        locked = false;
        drawHud();
        if (found === 6) finish();
      } else {
        announce('Não é um par. As cartas vão virar de novo.');
        drawHud();
        later(async () => {
          await Promise.all([a, b].map((x) => eng.flipCard(x.g, false, 0.4)));
          [a, b].forEach((x) => { x.btn.textContent = `Carta ${entries.indexOf(x) + 1}`; x.btn.setAttribute('aria-pressed', 'false'); });
          open = [];
          locked = false;
        }, reduced() ? 1400 : 1000);
      }
    }

    function finish() {
      const secs = Math.round((performance.now() - t0) / 1000);
      const stars = moves <= 8 ? 3 : moves <= 12 ? 2 : 1;
      const record = !st.best.memory || moves < st.best.memory;
      if (record) st.best.memory = moves;
      addXP(progress, 20 + stars * 5);
      award(progress, 'flash-memory');
      ctx.save();
      clear(controls).append(h('div', { class: 'fc-result' },
        h('h2', {}, '🎉 Todos os pares!'),
        h('div', { class: 'stars', 'aria-label': `${stars} de 3 estrelas` }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
        h('p', {}, `${moves} jogadas em ${secs} s.${record ? ' Novo recorde! 🏆' : ''}`),
        h('p', { class: 'small' }, 'Pares: ', chosen.map(articled).join(' · ')),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onClick: () => startMode(startMemory) }, 'Jogar de novo'), h('button', { class: 'btn', onClick: backToMenu }, 'Escolher outro modo'))));
    }

    eng.onPick((g) => reveal(g.userData.entry));
  }

  /* ================================================================
   * MODO 3 — CAFÉ RUSH
   * ================================================================ */
  async function startRush() {
    const eng = await ensureEngine();
    if (!eng) return needWebGL('⚡ Café Rush');
    const T = eng.THREE;
    const ordered = CARDS.filter((c) => c.order);
    const orders = shuffle(ordered).slice(0, fc.rushOrders);
    eng.setView(new T.Vector3(0, 2.05, 3.0), new T.Vector3(0, 1.3, -0.6));
    const cust = eng.customer;
    cust.visible = true;
    const custBase = cust.position.clone();
    unsubs.push(eng.onFrame((dt, t) => { if (!reduced()) cust.position.y = custBase.y + Math.abs(Math.sin(t * 2.2)) * 0.03; }));

    let idx = 0, score = 0, combo = 0, correct = 0, aanRight = 0;
    let items = [], locked = true, helpUsed = false, tStart = 0, current = null;
    const scoreEl = h('span', {}), comboEl = h('span', {}), progEl = h('span', {});
    const drawHud = () => {
      scoreEl.textContent = `🏆 ${score}`;
      comboEl.textContent = combo > 1 ? `🔥 combo ×${(1 + Math.min(combo - 1, 4) * 0.25).toFixed(2)}` : '🔥 combo —';
      progEl.textContent = `Cliente ${Math.min(idx + 1, orders.length)}/${orders.length}`;
      hudRow('⚡ Café Rush', progEl, scoreEl, comboEl);
    };
    const bubble = h('div', { class: 'fc-bubble' });
    const panel = h('div', {});
    controls.append(panel, h('p', { class: 'small muted' }, 'Teclado: ', h('kbd', {}, '1'), ' ', h('kbd', {}, '2'), ' ', h('kbd', {}, '3'), ' servem o item (da esquerda para a direita) · ', h('kbd', {}, 'R'), ' repete o pedido.'));
    overlay.append(bubble);
    const slots = [-0.78, 0, 0.78];

    const headMark = new T.Object3D(); // ponto acima da cabeça do cliente, para ancorar o balão HTML
    headMark.position.set(custBase.x, 2.3, custBase.z);
    modeGroup.add(headMark);
    function placeBubble() {
      const p = eng.project(headMark);
      bubble.style.left = `${Math.min(Math.max(p.x, 130), canvasBox.clientWidth - 130)}px`;
      bubble.style.top = `${Math.max(p.y, 70)}px`;
    }
    const ro = new ResizeObserver(placeBubble);
    ro.observe(canvasBox);
    unsubs.push(() => ro.disconnect());

    function showOrder() {
      current = orders[idx];
      helpUsed = false;
      locked = false;
      drawHud();
      const options = shuffle([current, ...shuffle(ordered.filter((c) => c.id !== current.id)).slice(0, 2)]);
      items = options.map((c, i) => {
        const g = eng.makeItem(c.model, 0.44);
        g.position.set(slots[i], 1.075, 0.2);
        g.scale.setScalar(0.001);
        g.userData = { card: c, spin: true, slot: i };
        modeGroup.add(g);
        eng.addPickable(g);
        eng.tween(g.scale, { x: 1, y: 1, z: 1 }, 0.4, 'back.out(2)');
        return g;
      });
      clear(bubble).append(h('strong', {}, '🗣 Customer:'), h('span', { class: 'fc-bubble-text' }, ' 🔊 …'));
      placeBubble();
      clear(panel).append(
        h('div', { class: 'row' },
          h('button', { class: 'btn small', onClick: () => playLine(unit, current.order) }, '🔊 Ouvir de novo'),
          h('button', { class: 'btn small', onClick: () => playLine(unit, current.order, { rate: 0.75 }) }, '🐢 Devagar'),
          h('button', { class: 'btn small ghost', onClick: (e) => { helpUsed = true; bubble.querySelector('.fc-bubble-text').replaceChildren(' “', tl(unit, current.order), '”'); e.currentTarget.disabled = true; } }, '💬 Mostrar a frase (vale metade)')),
        h('div', { class: 'row fc-serve' }, items.map((g, i) => h('button', { class: 'btn', 'aria-label': `Servir item ${i + 1}: ${g.userData.card.v.pt}`, onClick: () => serve(g) }, `${i + 1} · servir`))));
      tStart = performance.now();
      playLine(unit, current.order);
    }

    async function serve(g) {
      if (locked) return;
      locked = true;
      const ok = g.userData.card.id === current.id;
      const secs = (performance.now() - tStart) / 1000;
      ctx.record({ id: `fc-rush-${current.id}`, skills: ['listening-detail', 'vocab-cafe'] }, ok, 1, 'flashcards');
      panel.querySelectorAll('.fc-serve button').forEach((b) => (b.disabled = true));
      if (ok) {
        combo++;
        correct++;
        const mult = 1 + Math.min(combo - 1, 4) * 0.25;
        const pts = Math.round((100 + Math.max(0, 50 - secs * 5)) * mult * (helpUsed ? 0.5 : 1));
        score += pts;
        eng.highlight(g, '#12a586');
        bubble.querySelector('.fc-bubble-text').replaceChildren(' “', tl(unit, current.order), '” 😋');
        drawHud();
        announce(`Certo! Mais ${pts} pontos.`);
        g.userData.spin = false;
        await eng.tween(g.position, { x: custBase.x + 0.35, y: 1.12, z: custBase.z + 0.7 }, 0.6, 'power2.inOut');
        if (current.bonus) bonusQuestion(current.bonus);
        else if (unit.language.code === 'en') aanBonus();
        else later(nextOrder, 1400);
      } else {
        combo = 0;
        drawHud();
        eng.highlight(g, '#c93a2b');
        const right = items.find((x) => x.userData.card.id === current.id);
        eng.highlight(right, '#12a586');
        eng.tween(right.position, { y: 1.25 }, 0.3, 'power2.out').then(() => eng.tween(right.position, { y: 1.075 }, 0.3, 'bounce.out'));
        bubble.querySelector('.fc-bubble-text').replaceChildren(' “', tl(unit, current.order), '”');
        clear(panel).append(h('div', { class: 'feedback wrong' },
          h('p', {}, h('strong', {}, 'Quase! '), `O cliente pediu ${articled(current)} (${current.v.pt}). O item certo está brilhando em verde.`),
          h('button', { class: 'btn small primary', onClick: nextOrder }, 'Próximo cliente →')));
        announce(`Não era esse. O cliente pediu ${articled(current)}.`);
        later(nextOrder, 4500);
      }
    }

    /** Bônus configurável na carta (ex.: japonês — "a cliente quer açúcar? 入れて × 入れないで"). */
    function bonusQuestion(b) {
      const choose = (i) => {
        const ok = i === b.answer;
        ctx.record({ id: `fc-bonus-${current.id}`, skills: b.skills || ['listening-detail'] }, ok, 1, 'flashcards');
        if (ok) { score += 50; aanRight++; drawHud(); }
        clear(panel).append(h('div', { class: `feedback ${ok ? '' : 'wrong'}` },
          h('p', {}, ok ? '✓ +50 bônus! ' : 'Quase. ', tl(unit, b.explain, { noRomaji: true })),
          h('button', { class: 'btn small primary', onClick: nextOrder }, 'Próximo cliente →')));
        later(nextOrder, 3200);
      };
      clear(panel).append(h('div', { class: 'fc-aan' },
        h('p', {}, h('strong', {}, 'Bônus: '), tl(unit, b.prompt, { noRomaji: true })),
        h('div', { class: 'row' }, b.options.map((o, i) => h('button', { class: 'btn primary', 'data-aan': String(i), onClick: () => choose(i) }, tl(unit, o))))));
      panel.querySelector('[data-aan]')?.focus();
    }

    function aanBonus() {
      const art2 = current.article.startsWith('a ') || current.article === 'a' ? 'a' : 'an';
      const noun = current.article.startsWith('a ') ? `${current.article.slice(2)} ${current.word}` : current.word;
      const choose = (pick) => {
        const ok = pick === art2;
        ctx.record({ id: `fc-aan-${current.id}`, skills: ['g-a-an'] }, ok, 1, 'flashcards');
        if (ok) { score += 50; aanRight++; drawHud(); }
        clear(panel).append(h('div', { class: `feedback ${ok ? '' : 'wrong'}` },
          h('p', {}, ok ? '✓ +50 bônus! ' : 'Quase. ', `“${art2} ${noun}” — ${art2 === 'an' ? 'som de vogal no começo → an' : 'som de consoante no começo → a'}.`),
          h('button', { class: 'btn small primary', onClick: nextOrder }, 'Próximo cliente →')));
        later(nextOrder, 2600);
      };
      clear(panel).append(h('div', { class: 'fc-aan' },
        h('p', {}, h('strong', {}, 'Bônus a / an: '), 'I\'d like ', h('span', { class: 'fc-gap' }, '___'), ` ${noun}.`),
        h('div', { class: 'row' }, ['a', 'an'].map((x) => h('button', { class: 'btn primary', 'data-aan': x, onClick: () => choose(x) }, x)))));
      panel.querySelector('[data-aan]')?.focus();
    }

    let advancing = false;
    async function nextOrder() {
      if (advancing) return;
      advancing = true;
      timers.forEach(clearTimeout); timers.clear();
      stopAll();
      await Promise.all(items.map((g) => eng.tween(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0.25)));
      items.forEach((g) => { modeGroup.remove(g); eng.removePickable(g); });
      items = [];
      idx++;
      advancing = false;
      if (idx >= orders.length) finish(); else showOrder();
    }

    function finish() {
      const stars = correct >= 9 ? 3 : correct >= 6 ? 2 : 1;
      const record = !st.best.rush || score > st.best.rush;
      if (record) st.best.rush = score;
      addXP(progress, 20 + stars * 5);
      if (correct >= 8) award(progress, 'flash-rush');
      ctx.save();
      clear(bubble).append(h('strong', {}, 'Thanks! Bye! 👋'));
      clear(panel).append(h('div', { class: 'fc-result' },
        h('h2', {}, '☕ Fim do turno!'),
        h('div', { class: 'stars', 'aria-label': `${stars} de 3 estrelas` }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
        h('p', {}, `${correct}/${orders.length} pedidos certos · ${aanRight} bônus · ${score} pontos.${record ? ' Novo recorde! 🏆' : ''}`),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onClick: () => startMode(startRush) }, 'Novo turno'), h('button', { class: 'btn', onClick: backToMenu }, 'Escolher outro modo'))));
    }

    eng.onPick((g) => serve(g));
    keyHandler = (e) => {
      if (['1', '2', '3'].includes(e.key) && items[Number(e.key) - 1]) serve(items[Number(e.key) - 1]);
      else if (e.key.toLowerCase() === 'r' && current) playLine(unit, current.order);
    };
    clear(panel).append(h('div', { class: 'fc-result' },
      h('h2', {}, '⚡ Pronto para o turno?'),
      h('p', {}, `Você é o barista! ${orders.length} clientes vão pedir em ${langName}. Ouça e toque no item certo no balcão. Quanto mais rápido, mais pontos — e acertos seguidos fazem combo.`),
      h('button', { class: 'btn primary', onClick: () => showOrder() }, '▶ Abrir a cafeteria')));
    drawHud();
    placeBubble();
    clear(bubble).append(h('strong', {}, 'Hi! 👋'));
  }

  function needWebGL(title) {
    hudRow(title);
    controls.append(h('p', { class: 'notice warn' }, 'Este modo precisa de gráficos 3D (WebGL), que não estão disponíveis neste navegador ou dispositivo. Tente o modo Estudar, que funciona em 2D.'));
  }

  drawMenu();
  return root;
}
