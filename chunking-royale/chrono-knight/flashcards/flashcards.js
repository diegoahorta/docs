// THREE vem do script global ../assets/three.min.js (funciona também em file://).
(() => {

/* ---------- Identidade visual ---------- */
const COL = {
  navy: '#0B1440', navy2: '#22307A', gold: '#E0A92E', cyan: '#4FE3FF', magenta: '#E85A9B',
  ADV: '#C8476B', S: '#1E2A5E', AUX: '#D4A83A', V: '#2E8B8B', O: '#E8735A',
  ok: '#2FBF71', red: '#E5484D'
};
const CATS = {
  teoria: { label: 'Teoria', color: COL.magenta },
  monte: { label: 'Monte a frase', color: COL.ADV },
  lacuna: { label: 'Complete', color: COL.V },
  corrija: { label: 'Corrija', color: COL.red },
  extra: { label: 'Extra', color: COL.AUX }
};

/* ---------- Conteúdo (de build/content.json, embutido para funcionar offline) ---------- */
const CONTENT = {
  monte: [
    { pt: 'Semana que vem, a esta hora, estarei deitado numa praia na Bahia.',
      blocks: [['ADV', 'this time next week'], ['S', 'I'], ['AUX', 'will be'], ['V', 'lying'], ['ADV', 'on a beach in Bahia']],
      answer: 'This time next week I will be lying on a beach in Bahia.',
      trap: '"will have" (AUX)',
      why: 'Ação em andamento num ponto do futuro → will be + -ing. Truque ODU: AT / THIS TIME → continuous (fotografia).' },
    { pt: 'Até o fim do ano, ela já terá economizado dinheiro suficiente para a viagem.',
      blocks: [['ADV', 'by the end of the year'], ['S', 'she'], ['AUX', 'will have'], ['V', 'saved'], ['O', 'enough money for the trip']],
      answer: 'By the end of the year she will have saved enough money for the trip.',
      trap: '"will be" (AUX)',
      why: 'Ação concluída antes de um momento futuro → will have + particípio. BY = prazo final.' },
    { pt: 'Você vai estar usando o seu notebook hoje à tarde? (pergunta educada)',
      blocks: [['AUX', 'will'], ['S', 'you'], ['AUX', 'be'], ['V', 'using'], ['O', 'your laptop'], ['ADV', 'this afternoon']],
      answer: 'Will you be using your laptop this afternoon?',
      trap: '"have" (AUX)',
      why: '"Will you be using...?" pergunta sobre planos de forma educada, sem soar como pedido direto.' },
    { pt: 'Ele não terá chegado quando a festa começar.',
      blocks: [['S', 'he'], ['AUX', "won't have"], ['V', 'arrived'], ['ADV', 'by the time the party starts']],
      answer: "He won't have arrived by the time the party starts.",
      trap: '"won\'t be" (AUX)',
      why: 'Negativa do Future Perfect: won\'t have + particípio. "By the time" pede o perfect.' }
  ],
  lacuna: [
    { q: 'By the time you arrive, the film ______ (start).', opts: ['will be starting', 'will start', 'has been starting', 'will have started'], ok: 3,
      why: 'BY THE TIME → prazo final → Future Perfect: a ação já estará concluída.' },
    { q: "Don't call me at 8 — we ______ dinner then.", opts: ['had had', 'are going to have had', 'will be having', 'will have had'], ok: 2,
      why: 'No momento exato (at 8) a ação estará EM ANDAMENTO → Future Continuous.' },
    { q: 'At 10 p.m. the guests ______, but by 11 they ______ the whole cake.', opts: ['are dancing / have eaten', 'will be dancing / will have eaten', 'will have danced / will be eating', 'will dance / will eat'], ok: 1,
      why: 'AT 10 → fotografia (continuous). BY 11 → já concluído (perfect).' },
    { q: 'By midnight we ______ everything, so the house will be spotless.', opts: ['will have cleaned', 'will be cleaning', 'will clean', 'are cleaning'], ok: 0,
      why: 'Com BY + ideia de conclusão, use o Future Perfect.' }
  ],
  corrija: [
    { wrong: 'At 9 tomorrow I will working.', fix: 'At 9 tomorrow I will be working.', why: 'O BE não pode sumir: will + be + -ing.' },
    { wrong: 'By June we will have finish the course.', fix: 'By June we will have finished the course.', why: 'Future Perfect = will have + PARTICÍPIO (finished).' },
    { wrong: 'By 2030 they will be built the new bridge.', fix: 'By 2030 they will have built the new bridge.', why: 'BY 2030 = conclusão → will have + built.' },
    { wrong: 'Will you have be working tomorrow?', fix: 'Will you be working tomorrow?', why: 'Não misture os dois tempos: escolha be + -ing OU have + particípio.' }
  ],
  extra: [
    { q: 'This time tomorrow I ______ (fly) to Lisbon.', ok: 'will be flying', full: 'This time tomorrow I will be flying to Lisbon.', why: 'THIS TIME tomorrow → fotografia → continuous.' },
    { q: 'By Friday she ______ (finish) the report.', ok: 'will have finished', full: 'By Friday she will have finished the report.', why: 'BY Friday → prazo → perfect.' },
    { q: "Don't worry, I ______ (not / sleep) when you get home.", ok: "won't be sleeping", full: "Don't worry, I won't be sleeping when you get home.", why: "Negativa do continuous: won't be + -ing." },
    { q: '______ they ______ (arrive) by 6?', ok: 'Will … have arrived', full: 'Will they have arrived by 6?', why: 'Pergunta do perfect: Will + S + have + particípio.' },
    { q: 'In ten years, robots ______ (do) most of our housework.', ok: 'will be doing', full: 'In ten years, robots will be doing most of our housework.', why: 'Situação em andamento num período futuro.' },
    { q: 'By the time you read this, I ______ (leave).', ok: 'will have left', full: 'By the time you read this, I will have left.', why: 'By the time → perfect. leave → left.' },
    { q: 'At noon we ______ (have) lunch with the director.', ok: 'will be having', full: 'At noon we will be having lunch with the director.', why: 'AT noon → ação em andamento.' },
    { q: 'By next month, he ______ (work) here for ten years.', ok: 'will have worked', full: 'By next month, he will have worked here for ten years.', why: 'Duração até um ponto do futuro → perfect (for ten years).' }
  ]
};

/* ---------- Monta o baralho ---------- */
const TEORIA = [
  { front: 'Future Continuous\nQual é a fórmula?', answer: 'will + be + verbo-ING',
    blocks: [['S', 'I'], ['AUX', 'will be'], ['V', 'working']], speak: 'I will be working.',
    why: 'Ação EM ANDAMENTO num momento do futuro. Pense numa fotografia: "naquele instante, estarei fazendo..."' },
  { front: 'Future Perfect\nQual é a fórmula?', answer: 'will + have + PARTICÍPIO',
    blocks: [['S', 'I'], ['AUX', 'will have'], ['V', 'finished']], speak: 'I will have finished.',
    why: 'Ação CONCLUÍDA antes de um momento do futuro. Pense num prazo: "até lá, já terei feito..."' },
  { front: 'Palavras-sinal\nAT 10 · THIS TIME tomorrow · AT noon\n→ qual tempo?', answer: 'Future Continuous',
    blocks: [['ADV', 'at 10'], ['S', 'we'], ['AUX', 'will be'], ['V', 'dancing']], speak: 'At 10 we will be dancing.',
    why: 'AT / THIS TIME marcam um ponto exato no futuro → a ação estará acontecendo (fotografia).' },
  { front: 'Palavras-sinal\nBY Friday · BY THE TIME · BY 2030\n→ qual tempo?', answer: 'Future Perfect',
    blocks: [['ADV', 'by Friday'], ['S', 'she'], ['AUX', 'will have'], ['V', 'finished']], speak: 'By Friday she will have finished.',
    why: 'BY = prazo final. A ação já estará terminada antes ou até esse momento.' },
  { front: 'Negativa\nComo negar os dois tempos?', answer: "won't be + -ING  ·  won't have + particípio",
    blocks: [['S', 'he'], ['AUX', "won't have"], ['V', 'arrived']], speak: "He won't be sleeping. He won't have arrived.",
    why: "won't = will not. O resto da estrutura não muda: be + -ing ou have + particípio." },
  { front: 'Pergunta\nComo perguntar nos dois tempos?', answer: 'Will + S + be + -ING?  ·  Will + S + have + particípio?',
    blocks: [['AUX', 'will'], ['S', 'they'], ['AUX', 'have'], ['V', 'arrived']], speak: 'Will you be working? Will they have arrived?',
    why: 'O WILL vai para a frente do sujeito; be/have ficam depois dele.' },
  { front: 'Pedido educado\n"Você vai usar o carro hoje à noite?"', answer: 'Will you be using the car tonight?',
    blocks: [['AUX', 'will'], ['S', 'you'], ['AUX', 'be'], ['V', 'using'], ['O', 'the car']], speak: 'Will you be using the car tonight?',
    why: 'O Future Continuous pergunta sobre planos sem soar como pedido direto — mais educado que "Will you use...?"' },
  { front: 'Armadilha!\nPosso juntar "will have be + -ing"?', answer: 'Não! Escolha UM tempo.',
    blocks: [['AUX', 'will be'], ['V', 'working']], speak: 'Will you be working tomorrow?',
    why: 'Andamento → be + -ing. Conclusão → have + particípio. Misturar os dois gera erro.' }
];

function buildDeck() {
  const d = [];
  TEORIA.forEach(t => d.push({ cat: 'teoria', kicker: 'TEORIA', front: t.front, answer: t.answer, blocks: t.blocks, why: t.why, speak: t.speak }));
  CONTENT.monte.forEach(m => d.push({ cat: 'monte', kicker: 'MONTE A FRASE', front: '"' + m.pt + '"', hintFront: 'Diga em inglês, bloco por bloco.',
    answer: m.answer, blocks: m.blocks, why: m.why, trap: m.trap, speak: m.answer }));
  CONTENT.lacuna.forEach(l => d.push({ cat: 'lacuna', kicker: 'COMPLETE A LACUNA', front: l.q,
    options: l.opts.map((o, i) => String.fromCharCode(65 + i) + ') ' + o),
    answer: String.fromCharCode(65 + l.ok) + ') ' + l.opts[l.ok], why: l.why, full: fillBlanks(l.q, l.opts[l.ok]),
    speak: fillBlanks(l.q, l.opts[l.ok]) }));
  CONTENT.corrija.forEach(c => d.push({ cat: 'corrija', kicker: 'CORRIJA O ERRO', front: c.wrong, hintFront: 'Encontre e corrija o erro.',
    wrongStyle: true, answer: c.fix, why: c.why, speak: c.fix }));
  CONTENT.extra.forEach(e => d.push({ cat: 'extra', kicker: 'DESAFIO EXTRA', front: e.q, hintFront: 'Conjugue o verbo entre parênteses.',
    answer: e.ok, full: e.full, why: e.why, speak: e.full }));
  d.forEach((c, i) => { c.id = i; });
  return d;
}
function fillBlanks(q, ans) {
  const parts = ans.split(' / ');
  let k = 0;
  return q.replace(/_{3,}/g, () => parts[k++] || parts[0]).replace(/\s*\([^)]*\)/g, '');
}

const DECK = buildDeck();

/* ---------- Estado (localStorage protegido) ---------- */
const KEY = 'chronoKnightFlashcards.v1';
let state = { filter: 'all', order: DECK.map(c => c.id), idx: 0, ok: 0, bad: 0, elixir: 5, results: {} };
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved && Array.isArray(saved.order) && saved.order.length === DECK.length) state = Object.assign(state, saved);
} catch (e) { /* armazenamento indisponível */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

function visible() {
  return state.order.filter(id => state.filter === 'all' || DECK[id].cat === state.filter);
}

/* ---------- Desenho das faces (CanvasTexture) ---------- */
const TW = 1024, TH = 1408;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function wrap(ctx, text, maxW) {
  const out = [];
  String(text).split('\n').forEach(par => {
    const words = par.split(' ');
    let line = '';
    words.forEach(w => {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    });
    out.push(line);
  });
  return out;
}
// Escreve um bloco de texto; retorna o y final
function textBlock(ctx, text, x, y, maxW, font, size, color, lh = 1.25, align = 'left') {
  ctx.font = `${font} ${size}px "Segoe UI", Roboto, Arial, sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
  const lines = wrap(ctx, text, maxW);
  lines.forEach((l, i) => ctx.fillText(l, align === 'center' ? x + maxW / 2 : x, y + i * size * lh));
  return y + lines.length * size * lh;
}
// Escolhe tamanho de fonte para caber na altura disponível
function fitSize(ctx, text, maxW, maxH, font, start, min, lh = 1.25) {
  for (let s = start; s >= min; s -= 2) {
    ctx.font = `${font} ${s}px "Segoe UI", Roboto, Arial, sans-serif`;
    if (wrap(ctx, text, maxW).length * s * lh <= maxH) return s;
  }
  return min;
}

function frame(ctx, card, side) {
  const cat = CATS[card.cat];
  const g = ctx.createLinearGradient(0, 0, 0, TH);
  if (side === 'front') { g.addColorStop(0, '#16235E'); g.addColorStop(1, '#0B1440'); }
  else { g.addColorStop(0, '#FBFCFF'); g.addColorStop(1, '#E7ECFA'); }
  ctx.fillStyle = COL.gold; ctx.fillRect(0, 0, TW, TH);
  ctx.fillStyle = g; roundRect(ctx, 18, 18, TW - 36, TH - 36, 56); ctx.fill();
  ctx.strokeStyle = side === 'front' ? 'rgba(79,227,255,.55)' : 'rgba(30,42,94,.18)';
  ctx.lineWidth = 6; roundRect(ctx, 40, 40, TW - 80, TH - 80, 44); ctx.stroke();

  // selo da categoria
  ctx.font = 'bold 34px "Segoe UI", Roboto, Arial, sans-serif';
  const label = card.kicker;
  const lw = ctx.measureText(label).width + 56;
  ctx.fillStyle = cat.color; roundRect(ctx, 80, 80, lw, 64, 32); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, 108, 113);

  // gota de elixir (custo)
  ctx.fillStyle = '#9B3FE0';
  ctx.beginPath(); ctx.moveTo(TW - 120, 72); ctx.bezierCurveTo(TW - 80, 120, TW - 72, 140, TW - 72, 156);
  ctx.arc(TW - 120, 156, 48, 0, Math.PI, false); ctx.bezierCurveTo(TW - 168, 140, TW - 160, 120, TW - 120, 72); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('3', TW - 120, 160);

  // rodapé
  ctx.font = '600 26px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = side === 'front' ? 'rgba(174,184,230,.8)' : 'rgba(30,42,94,.55)';
  ctx.fillText('CHUNKING ROYALE · CHRONO KNIGHT · ODU', TW / 2, TH - 76);
}

function drawGear(ctx, cx, cy, r, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.translate(cx, cy);
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.fillRect(-r * 0.14, -r * 1.2, r * 0.28, r * 0.35); }
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFront(card) {
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const ctx = c.getContext('2d');
  frame(ctx, card, 'front');
  drawGear(ctx, TW - 160, TH - 300, 120, COL.gold, 0.12);
  drawGear(ctx, 170, 380, 70, COL.cyan, 0.10);

  const x = 100, w = TW - 200;
  let y = 230;
  textBlock(ctx, card.cat === 'monte' ? 'Frase em português:' : card.cat === 'corrija' ? 'Frase com erro:' : card.cat === 'teoria' ? 'Pergunta:' : 'Frase:',
    x, y, w, '600', 36, COL.cyan);
  y += 70;

  const availH = card.options ? 430 : 720;
  const size = fitSize(ctx, card.front, w, availH, 'bold', card.cat === 'teoria' ? 72 : 68, 38, 1.22);
  y = textBlock(ctx, card.front, x, y, w, 'bold', size, card.wrongStyle ? '#FF8A8F' : '#FFFFFF', 1.22);

  if (card.options) {
    y += 40;
    card.options.forEach(o => {
      ctx.fillStyle = 'rgba(255,255,255,.08)'; roundRect(ctx, x, y, w, 84, 22); ctx.fill();
      textBlock(ctx, o, x + 28, y + 22, w - 56, '600', 38, '#E6EBFF');
      y += 100;
    });
  }
  if (card.hintFront) textBlock(ctx, card.hintFront, x, TH - 250, w, 'italic', 34, '#AEB8E6', 1.2, 'center');
  textBlock(ctx, 'toque para virar ↻', x, TH - 180, w, '600', 30, COL.gold, 1.2, 'center');
  return c;
}

function drawBlocks(ctx, blocks, x, y, w) {
  // layout em linhas com quebra
  const pad = 22, gap = 14, h = 104;
  let cx = x, cy = y;
  blocks.forEach(([tag, txt]) => {
    ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
    const bw = Math.max(ctx.measureText(txt).width + pad * 2, 110);
    if (cx + bw > x + w) { cx = x; cy += h + gap; }
    ctx.fillStyle = COL[tag] || COL.S; roundRect(ctx, cx, cy, bw, h, 16); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; roundRect(ctx, cx, cy + h - 10, bw, 10, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(tag, cx + bw / 2, cy + 12);
    ctx.fillStyle = tag === 'AUX' ? '#1a1300' : '#fff'; ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
    ctx.fillText(txt, cx + bw / 2, cy + 46);
    cx += bw + gap;
  });
  return cy + h;
}

function drawBack(card) {
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const ctx = c.getContext('2d');
  frame(ctx, card, 'back');
  const x = 100, w = TW - 200;
  let y = 220;

  // caixa de resposta (estilo ODU)
  ctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
  const ansSize = fitSize(ctx, card.answer, w - 70, 300, 'bold', 62, 36, 1.2);
  ctx.font = `bold ${ansSize}px "Segoe UI", Arial, sans-serif`;
  const ansLines = wrap(ctx, card.answer, w - 70).length;
  const boxH = 90 + ansLines * ansSize * 1.2 + 30;
  ctx.fillStyle = '#E3F6E8'; roundRect(ctx, x, y, w, boxH, 22); ctx.fill();
  ctx.fillStyle = '#2E8B3E'; roundRect(ctx, x, y, 12, boxH, 6); ctx.fill();
  textBlock(ctx, '✓ Resposta', x + 40, y + 24, w - 70, 'bold', 34, '#2E8B3E');
  textBlock(ctx, card.answer, x + 40, y + 80, w - 70, 'bold', ansSize, '#14532D', 1.2);
  y += boxH + 36;

  if (card.full) { y = textBlock(ctx, card.full, x, y, w, 'italic 600', 36, '#1E2A5E', 1.25) + 26; }

  if (card.blocks) {
    textBlock(ctx, 'Blocos:', x, y, w, 'bold', 32, '#1E2A5E');
    y = drawBlocks(ctx, card.blocks, x, y + 48, w) + 36;
  }
  if (card.trap) {
    y = textBlock(ctx, 'Bloco-armadilha: ' + card.trap, x, y, w, 'bold', 34, '#C62828', 1.25) + 22;
  }
  textBlock(ctx, 'Por quê?', x, y, w, 'bold', 36, '#1E2A5E');
  const whySize = fitSize(ctx, card.why, w, TH - 150 - (y + 54), '500', 38, 26, 1.3);
  textBlock(ctx, card.why, x, y + 54, w, '500', whySize, '#2A3566', 1.3);
  return c;
}

/* ---------- Cena Three.js ---------- */
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0B1440, 8, 22);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 0, 8);

scene.add(new THREE.AmbientLight(0xffffff, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 4, 6); scene.add(key);
const rim = new THREE.PointLight(0x4FE3FF, 30, 20); rim.position.set(-4, -2, 3); scene.add(rim);
const rim2 = new THREE.PointLight(0xE85A9B, 25, 20); rim2.position.set(4, 3, 2); scene.add(rim2);

// Carta
const CW = 3.2, CH = CW * TH / TW, CD = 0.06;
const edgeMat = new THREE.MeshStandardMaterial({ color: 0xE0A92E, metalness: 0.6, roughness: 0.35 });
const frontMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 });
const backMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 });
const card = new THREE.Mesh(new THREE.BoxGeometry(CW, CH, CD), [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat]);
const pivot = new THREE.Group(); pivot.add(card); scene.add(pivot);

// Halo atrás da carta
const haloTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(79,227,255,.55)'); r.addColorStop(1, 'rgba(79,227,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, depthWrite: false, transparent: true }));
halo.scale.set(7, 7, 1); halo.position.z = -1.2; scene.add(halo);

// Engrenagens
function gearShape(r, teeth) {
  const s = new THREE.Shape();
  const inner = r * 0.82, outer = r;
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2, a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? inner : outer;
    if (i === 0) s.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
    s.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr); s.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr);
  }
  const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.4, 0, Math.PI * 2, true); s.holes.push(hole);
  return s;
}
const gears = [];
[[-4.6, 2.2, -4, 1.3, 12, 0xE0A92E], [4.8, -2.0, -5, 1.6, 14, 0xE0A92E], [-3.8, -2.6, -6, 1.0, 10, 0x4FE3FF],
 [4.2, 2.8, -7, 0.9, 10, 0xE85A9B], [0, 4.2, -9, 1.8, 16, 0x4FE3FF]].forEach(([x, y, z, r, t, col], i) => {
  const geo = new THREE.ExtrudeGeometry(gearShape(r, t), { depth: 0.18, bevelEnabled: false });
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.55 }));
  m.position.set(x, y, z); m.userData.speed = (i % 2 ? -1 : 1) * (0.15 + Math.random() * 0.2);
  scene.add(m); gears.push(m);
});

// Relógio ao fundo
const clock = new THREE.Group();
const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.08, 12, 80), new THREE.MeshStandardMaterial({ color: 0xE0A92E, metalness: 0.8, roughness: 0.25 }));
clock.add(ring);
for (let i = 0; i < 12; i++) {
  const tick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.04), new THREE.MeshBasicMaterial({ color: 0x4FE3FF }));
  const a = i / 12 * Math.PI * 2; tick.position.set(Math.sin(a) * 2.1, Math.cos(a) * 2.1, 0); tick.rotation.z = -a; clock.add(tick);
}
const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.04), new THREE.MeshBasicMaterial({ color: 0xFFD25A }));
hourHand.geometry.translate(0, 0.6, 0); clock.add(hourHand);
const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.8, 0.04), new THREE.MeshBasicMaterial({ color: 0x4FE3FF }));
minHand.geometry.translate(0, 0.9, 0); clock.add(minHand);
clock.position.set(0, 0, -6); clock.scale.setScalar(1.6); scene.add(clock);

// Partículas (poeira do tempo)
const PCOUNT = 260;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PCOUNT * 3), pCol = new Float32Array(PCOUNT * 3);
const palette = [new THREE.Color(0x4FE3FF), new THREE.Color(0xE0A92E), new THREE.Color(0xE85A9B), new THREE.Color(0xC46BFF)];
for (let i = 0; i < PCOUNT; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 18; pPos[i * 3 + 1] = (Math.random() - 0.5) * 12; pPos[i * 3 + 2] = -Math.random() * 10 + 1;
  const c = palette[i % palette.length]; pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const dotTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.12, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(particles);

/* ---------- Lógica da carta ---------- */
let flipped = false, targetRot = 0, slide = 0; // slide: animação de troca
const texCache = new Map();
function texFor(id, side) {
  const k = id + side;
  if (!texCache.has(k)) {
    const cv = side === 'f' ? drawFront(DECK[id]) : drawBack(DECK[id]);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texCache.set(k, t);
  }
  return texCache.get(k);
}
function currentId() { const v = visible(); if (!v.length) return null; state.idx = Math.max(0, Math.min(state.idx, v.length - 1)); return v[state.idx]; }

function showCard(dir = 0) {
  const id = currentId(); if (id === null) return;
  frontMat.map = texFor(id, 'f'); backMat.map = texFor(id, 'b');
  frontMat.needsUpdate = backMat.needsUpdate = true;
  flipped = false; targetRot = 0;
  if (dir) { slide = dir; }
  updateHud();
  // pré-carrega a próxima
  const v = visible(); const nx = v[(state.idx + 1) % v.length]; if (nx !== undefined) { texFor(nx, 'f'); }
}
function flip() { flipped = !flipped; targetRot = flipped ? Math.PI : 0; }
function go(d) {
  const v = visible(); if (!v.length) return;
  state.idx = (state.idx + d + v.length) % v.length; save(); showCard(d);
}

/* ---------- HUD ---------- */
const $ = id => document.getElementById(id);
const bar = $('bar');
for (let i = 0; i < 10; i++) bar.appendChild(document.createElement('i'));
function updateHud() {
  const v = visible();
  $('pos').textContent = (v.length ? state.idx + 1 : 0) + '/' + v.length;
  $('okc').textContent = state.ok; $('badc').textContent = state.bad;
  [...bar.children].forEach((el, i) => el.classList.toggle('full', i < state.elixir));
  const done = v.filter(id => state.results[id]).length;
  $('prog').style.width = (v.length ? (done / v.length) * 100 : 0) + '%';
}
function mark(ok) {
  const id = currentId(); if (id === null) return;
  if (ok) { state.ok++; state.elixir = Math.min(10, state.elixir + 1); burst(0x2FBF71); }
  else { state.bad++; state.elixir = Math.max(0, state.elixir - 1); burst(0xE5484D); }
  state.results[id] = ok ? 'ok' : 'bad';
  save(); updateHud();
  setTimeout(() => go(1), 350);
}

// Explosão de faíscas ao responder
const sparks = [];
function burst(color) {
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color, transparent: true }));
    m.position.set((Math.random() - 0.5) * CW, (Math.random() - 0.5) * CH, 0.3);
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.15, Math.random() * 0.15, Math.random() * 0.1);
    m.userData.life = 1; scene.add(m); sparks.push(m);
  }
}

/* ---------- Filtros ---------- */
const filters = $('filters');
[['all', 'Todas']].concat(Object.entries(CATS).map(([k, v]) => [k, v.label])).forEach(([k, label]) => {
  const b = document.createElement('button'); b.textContent = label; b.dataset.f = k;
  b.onclick = () => { state.filter = k; state.idx = 0; save(); syncFilters(); showCard(); };
  filters.appendChild(b);
});
function syncFilters() { [...filters.children].forEach(b => b.classList.toggle('on', b.dataset.f === state.filter)); }

/* ---------- Controles ---------- */
$('flip').onclick = flip;
$('prev').onclick = () => go(-1);
$('next').onclick = () => go(1);
$('ok').onclick = () => mark(true);
$('bad').onclick = () => mark(false);
$('shuffle').onclick = () => {
  const a = state.order.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  state.order = a; state.idx = 0; save(); showCard(1);
};
$('reset').onclick = () => {
  state.ok = 0; state.bad = 0; state.elixir = 5; state.results = {}; state.idx = 0; save(); showCard();
};
$('speak').onclick = () => {
  const id = currentId(); if (id === null || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(DECK[id].speak || DECK[id].answer);
  u.lang = 'en-US'; u.rate = 0.92; speechSynthesis.cancel(); speechSynthesis.speak(u);
};
window.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
  else if (e.key === 'ArrowRight') go(1);
  else if (e.key === 'ArrowLeft') go(-1);
});

// clique na carta (raycast) ou em qualquer ponto do palco
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let pointer = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointermove', e => {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
});
let downX = 0;
renderer.domElement.addEventListener('pointerdown', e => { downX = e.clientX; });
renderer.domElement.addEventListener('pointerup', e => {
  const dx = e.clientX - downX;
  if (Math.abs(dx) > 60) { go(dx < 0 ? 1 : -1); return; } // swipe
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  if (ray.intersectObject(card).length) flip();
});

/* ---------- Resize ---------- */
function resize() {
  const w = stage.clientWidth, h = Math.max(stage.clientHeight, 320);
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
  camera.aspect = w / h;
  // garante que a carta caiba (altura e largura)
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distH = (CH * 1.12) / 2 / Math.tan(fov / 2);
  const distW = (CW * 1.15) / 2 / Math.tan(fov / 2) / camera.aspect;
  camera.position.z = Math.max(distH, distW);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(stage);

/* ---------- Loop ---------- */
const clk = new THREE.Clock();
let rotY = 0;
function tick() {
  const dt = Math.min(clk.getDelta(), 0.05), t = clk.elapsedTime;
  rotY += (targetRot - rotY) * Math.min(1, dt * 9);
  // troca de carta: desliza e volta
  if (slide) { slide *= Math.pow(0.0001, dt); if (Math.abs(slide) < 0.002) slide = 0; }
  pivot.position.x = slide * 3;
  pivot.rotation.y = rotY + pointer.x * 0.12 + slide * -0.6;
  pivot.rotation.x = -pointer.y * 0.08 + Math.sin(t * 1.1) * 0.03;
  pivot.position.y = Math.sin(t * 1.4) * 0.06;
  halo.material.opacity = 0.75 + Math.sin(t * 2) * 0.2;
  gears.forEach(g => { g.rotation.z += g.userData.speed * dt; });
  minHand.rotation.z = -t * 0.6; hourHand.rotation.z = -t * 0.05;
  particles.rotation.y = t * 0.02;
  const p = pGeo.attributes.position.array;
  for (let i = 0; i < PCOUNT; i++) { p[i * 3 + 1] += dt * 0.25; if (p[i * 3 + 1] > 6) p[i * 3 + 1] = -6; }
  pGeo.attributes.position.needsUpdate = true;
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]; s.position.add(s.userData.v); s.userData.v.y -= 0.004; s.userData.life -= dt * 1.4;
    s.material.opacity = Math.max(0, s.userData.life);
    if (s.userData.life <= 0) { scene.remove(s); s.geometry.dispose(); s.material.dispose(); sparks.splice(i, 1); }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

syncFilters();
resize();
showCard();
tick();

// exposto para testes
window.__flash = { deck: DECK, state: () => state, flipped: () => flipped };
})();
