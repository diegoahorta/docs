// Pongo vai à China — lógica do jogo: telas, missões, desafios, pontuação e progresso.
import {
  LEVELS, TONES, TONE_SYLLABLES, MINIMAL_PAIRS, TONE_PAIRS, PINYIN_SOUNDS, SOUND_QUESTIONS, SANDHI,
  VOCAB, CHUNKS, BLOCK_TYPES, ESTEIRA, DIALOGO_FINAL,
} from './data.js';
import * as A from './audio.js';
import * as FX from './fx.js';
import { createWorld } from './world.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sample = (arr, n) => shuffle(arr).slice(0, n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------------------------------------------ progresso salvo
const SAVE_KEY = 'pongo-mandarim-v1';
const blank = () => ({ unlocked: 1, done: {}, stars: {}, score: 0, settings: { music: true, sfx: true, festa: 'max' } });
let save = blank();
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) save = { ...blank(), ...JSON.parse(raw) };
} catch { /* armazenamento indisponível: o jogo segue sem salvar */ }
function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch { /* ignore */ }
}
if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && !save.settings.festaEscolhida) save.settings.festa = 'calmo';

// ------------------------------------------------------------------ pinyin
const MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
export function markSyllable(base, tone) {
  if (!tone) return base;
  let idx = base.indexOf('a');
  if (idx < 0) idx = base.indexOf('e');
  if (idx < 0 && base.includes('ou')) idx = base.indexOf('o');
  if (idx < 0) {
    for (let i = base.length - 1; i >= 0; i--) if ('iouü'.includes(base[i])) { idx = i; break; }
  }
  if (idx < 0) return base;
  return base.slice(0, idx) + MARKS[base[idx]][tone - 1] + base.slice(idx + 1);
}
function stripTones(p) {
  return p.normalize('NFD').replace(/[̀-̂̄̌]/g, '').normalize('NFC');
}

// Desenho do contorno de tom (escala de Chao 1–5)
function contourSvg(tones, { w = 64, h = 40, sandhi = false } = {}) {
  const seg = w / tones.length;
  const y = (L) => h - 4 - ((L - 1) / 4) * (h - 8);
  let lines = '';
  for (let L = 1; L <= 5; L++) lines += `<line x1="0" x2="${w}" y1="${y(L)}" y2="${y(L)}" class="cg"/>`;
  let paths = '';
  tones.forEach((tn, i) => {
    let t = tn;
    if (sandhi && tn === 3 && tones[i + 1] === 3) t = 2;
    const pts = TONES.find((x) => x.n === t).chao;
    const x0 = i * seg + 6;
    const x1 = (i + 1) * seg - 6;
    const xs = pts.map((_, k) => x0 + ((x1 - x0) * k) / Math.max(1, pts.length - 1));
    if (pts.length === 1) {
      paths += `<circle cx="${(x0 + x1) / 2}" cy="${y(pts[0])}" r="4" class="cd"/>`;
    } else {
      paths += `<polyline points="${pts.map((L, k) => `${xs[k]},${y(L)}`).join(' ')}" class="cl"/>`;
      paths += `<circle cx="${xs[xs.length - 1]}" cy="${y(pts[pts.length - 1])}" r="3.5" class="cd"/>`;
    }
  });
  return `<svg class="contour" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${lines}${paths}</svg>`;
}

function blockHtml(b, { small = false, tag = 'div', attrs = '' } = {}) {
  const T = BLOCK_TYPES[b.t];
  return `<${tag} class="blk${small ? ' blk-sm' : ''}" style="--bc:${T.cor};--bl:${T.claro}" ${attrs}>
    <span class="blk-type">${T.nome}</span><span class="blk-h">${esc(b.h)}</span><span class="blk-p">${esc(b.p)}</span><span class="blk-g">${esc(b.g)}</span></${tag}>`;
}
const phraseText = (ph) => ph.b.map((b) => b.h).join('');
const phrasePinyin = (ph) => ph.b.map((b) => b.p).join(' ');

// ------------------------------------------------------------------ geração dos desafios
function toneChallenges() {
  return sample(TONE_SYLLABLES, 8).map(([h, p, base, tn, g]) => ({
    kind: 'choice',
    audio: { tones: [tn], say: h },
    prompt: `<div class="q-label">Ouça e descubra o tom</div><div class="q-hanzi">${h}</div><div class="q-sub">${base} · <em>${g}</em></div>`,
    options: [1, 2, 3, 4, 0].map((t) => ({
      html: `${contourSvg([t])}<b>${markSyllable(base, t)}</b><small>${TONES.find((x) => x.n === t).nome}</small>`,
      ok: t === tn,
    })),
    cols: 5,
    explain: `<b>${h} ${p}</b> — ${TONES.find((x) => x.n === tn).nome}: ${TONES.find((x) => x.n === tn).dica}.`,
    speakOnOk: h,
  }));
}

function minimalPairChallenges() {
  const out = [];
  for (const mp of shuffle(MINIMAL_PAIRS)) {
    const target = Math.random() < 0.5 ? mp.a : mp.b;
    const base = stripTones(target[1]);
    const opts = [1, 2, 3, 4].map((t) => markSyllable(base, t));
    out.push({
      kind: 'choice',
      audio: { tones: [toneOf(target[1])], say: target[0] },
      prompt: `<div class="q-label">Qual é o pinyin certo?</div><div class="q-hanzi">${target[0]}</div><div class="q-sub"><em>${target[2]}</em></div>`,
      options: opts.map((o) => ({ html: `<b class="big-py">${o}</b>`, ok: o === target[1] })),
      cols: 4,
      explain: `${mp.a[0]} <b>${mp.a[1]}</b> = ${mp.a[2]} · ${mp.b[0]} <b>${mp.b[1]}</b> = ${mp.b[2]}. ${mp.frase}`,
      speakOnOk: target[0],
    });
  }
  return out;
}

function toneOf(py) {
  const d = py.normalize('NFD');
  if (d.includes('̄')) return 1;
  if (d.includes('́')) return 2;
  if (d.includes('̌')) return 3;
  if (d.includes('̀')) return 4;
  return 0;
}

function tonePairChallenges() {
  const all = TONE_PAIRS.filter((x) => !(x[3][0] === 3 && x[3][1] === 3));
  return sample(all, 8).map(([h, p, g, pair]) => {
    const others = sample(TONE_PAIRS.map((x) => x[3]).filter((t) => t.join() !== pair.join()), 3);
    const opts = shuffle([pair, ...others]);
    return {
      kind: 'choice',
      audio: { tones: pair, say: h },
      prompt: `<div class="q-label">Que par de tons é este?</div><div class="q-hanzi">${h}</div><div class="q-sub">${stripTones(p)} · <em>${g}</em></div>`,
      options: opts.map((t) => ({ html: `${contourSvg(t, { w: 88 })}<b>${t.map((x) => (x ? x + 'º' : 'neutro')).join(' + ')}</b>`, ok: t.join() === pair.join() })),
      cols: 2,
      explain: `<b>${h} ${p}</b> (${g}): ${pair.map((x) => (x ? x + 'º tom' : 'tom neutro')).join(' + ')}.`,
      speakOnOk: h,
    };
  });
}

function soundChallenges() {
  return sample(SOUND_QUESTIONS, 8).map((q) => ({
    kind: 'choice',
    audio: { say: q.h, tones: [toneOf(q.p)] },
    prompt: `<div class="q-label">Qual pinyin representa este som?</div><div class="q-hanzi">${q.h}</div><div class="q-sub"><em>${q.g}</em></div>`,
    options: shuffle(q.opts).map((o) => ({ html: `<b class="big-py">${o}</b>`, ok: o === q.p })),
    cols: 4,
    explain: `<b>${q.h} ${q.p}</b> — ${q.dica}`,
    speakOnOk: q.h,
  }));
}

function sandhiChallenges() {
  return sample(SANDHI, 7).map((s) => ({
    kind: 'choice',
    audio: { say: s.h },
    prompt: `<div class="q-label">Escrito <b>${s.escrito}</b>. Como se fala de verdade?</div><div class="q-hanzi">${s.h}</div>`,
    options: shuffle([s.falado, ...s.erradas]).map((o) => ({ html: `<b class="big-py">${o}</b>`, ok: o === s.falado })),
    cols: 2,
    explain: `<b>${s.h}</b> soa <b>${s.falado}</b>. ${s.regra}`,
    speakOnOk: s.h,
  }));
}

function vocabChallenges(groups) {
  const pool = groups.flatMap((g) => VOCAB[g]);
  const extra = Object.values(VOCAB).flat();
  const words = sample(pool, Math.min(8, pool.length));
  const distract = (w, field, n = 3) => {
    const seen = new Set([w[field]]);
    const out = [];
    for (const c of [...shuffle(pool), ...shuffle(extra)]) {
      if (out.length >= n) break;
      if (!seen.has(c[field])) {
        seen.add(c[field]);
        out.push(c);
      }
    }
    return out;
  };
  const kinds = ['h2pt', 'pt2h', 'h2py', 'ouvir'];
  const ch = words.map((w, i) => {
    const k = kinds[i % kinds.length];
    const opts = shuffle([w, ...distract(w, k === 'h2pt' ? 2 : k === 'h2py' ? 1 : 0)]);
    const explain = `<b>${w[0]}</b> ${w[1]} = ${w[2]}`;
    if (k === 'h2pt') return { kind: 'choice', audio: { say: w[0] }, prompt: `<div class="q-label">O que significa?</div><div class="q-hanzi">${w[0]}</div><div class="q-sub">${w[1]}</div>`, options: opts.map((o) => ({ html: `<b>${o[2]}</b>`, ok: o === w })), cols: 2, explain, speakOnOk: w[0] };
    if (k === 'pt2h') return { kind: 'choice', prompt: `<div class="q-label">Como se escreve em hanzi?</div><div class="q-word">${w[2]}</div>`, options: opts.map((o) => ({ html: `<span class="opt-hanzi">${o[0]}</span>`, ok: o === w })), cols: 4, explain, speakOnOk: w[0] };
    if (k === 'h2py') return { kind: 'choice', prompt: `<div class="q-label">Qual é o pinyin?</div><div class="q-hanzi">${w[0]}</div><div class="q-sub"><em>${w[2]}</em></div>`, options: opts.map((o) => ({ html: `<b class="big-py">${o[1]}</b>`, ok: o === w })), cols: 2, explain, speakOnOk: w[0] };
    return { kind: 'choice', audio: { say: w[0] }, autoPlay: true, prompt: `<div class="q-label">Ouça (ou leia o pinyin) e ache o hanzi</div><div class="q-word">${w[1]}</div>`, options: opts.map((o) => ({ html: `<span class="opt-hanzi">${o[0]}</span>`, ok: o === w })), cols: 4, explain, speakOnOk: w[0] };
  });
  ch.push({ kind: 'match', pairs: sample(pool, 5).filter((w, i, a) => a.findIndex((x) => x[2] === w[2]) === i).map((w) => [w[0], w[2], w[1]]) });
  return ch;
}

function blockChallenges(mods) {
  const phrases = mods.flatMap((m) => CHUNKS[m]);
  const chosen = sample(phrases, Math.min(5, phrases.length));
  const ch = [];
  // 1) que tipo de bloco é este?
  const blocks = phrases.flatMap((p) => p.b);
  const bk = sample(blocks.filter((b) => b.t !== 'A'), 1)[0];
  const typeOpts = shuffle([bk.t, ...sample(Object.keys(BLOCK_TYPES).filter((t) => t !== bk.t), 3)]);
  ch.push({
    kind: 'choice',
    prompt: `<div class="q-label">Que bloco é este? Lembre: a cor é a sintaxe.</div><div class="q-block">${blockHtml({ ...bk, t: 'A' }).replace(/--bc:[^;]+;--bl:[^"]+/, '--bc:#8a8f99;--bl:#f2f4f8').replace(/<span class="blk-type">[^<]*<\/span>/, '<span class="blk-type">?</span>')}</div>`,
    options: typeOpts.map((t) => ({ html: `<span class="type-chip" style="--bc:${BLOCK_TYPES[t].cor}">${BLOCK_TYPES[t].nome}</span>`, ok: t === bk.t })),
    cols: 2,
    explain: `${esc(bk.h)} (${esc(bk.g)}) é um bloco <b style="color:${BLOCK_TYPES[bk.t].cor}">${BLOCK_TYPES[bk.t].nome}</b>.`,
    speakOnOk: bk.h,
  });
  // 2) montar frases
  chosen.slice(0, 4).forEach((ph) => ch.push({ kind: 'build', phrase: ph }));
  // 3) completar o bloco que falta
  const ph = chosen[4] || chosen[0];
  const miss = Math.floor(Math.random() * ph.b.length);
  const others = sample(blocks.filter((b) => b.h !== ph.b[miss].h), 3);
  ch.push({ kind: 'fill', phrase: ph, miss, options: shuffle([ph.b[miss], ...others]) });
  return ch;
}

function dialogChallenges() {
  return DIALOGO_FINAL.map((d) => ({ kind: 'dialog', d }));
}

function buildMission(m) {
  switch (m.tipo) {
    case 'tons': return toneChallenges();
    case 'paresMinimos': return minimalPairChallenges();
    case 'paresTons': return tonePairChallenges();
    case 'sons': return soundChallenges();
    case 'sandhi': return sandhiChallenges();
    case 'vocab': return vocabChallenges(m.grupos);
    case 'blocos': return blockChallenges(m.modulos);
    case 'dialogo': return dialogChallenges();
    default: return [];
  }
}

// ------------------------------------------------------------------ lições (antes dos desafios)
function lessonHtml(m) {
  const play = (say, tones = '') => `<button class="mini-play" data-say="${esc(say)}" data-tones="${tones}" aria-label="Ouvir ${esc(say)}">▶</button>`;
  switch (m.tipo) {
    case 'tons':
      return `<p class="lead">O tom é parte da palavra. Mesma sílaba, quatro melodias, quatro sentidos.</p>
      <div class="tone-cards">${TONES.map((t) => `<div class="tone-card">${contourSvg([t.n], { w: 72, h: 46 })}<b class="big-py">${t.marca}</b><span class="tc-name">${t.nome} <small>${t.chao.join('')}</small></span><span class="tc-tip">${t.dica}</span><span class="tc-anchor">${t.ancora} ${play(t.ancora.split(' ')[1], t.n)}</span></div>`).join('')}</div>`;
    case 'paresMinimos':
      return `<p class="lead">Pares mínimos: só o tom muda, e o sentido vira outro.</p>
      <div class="pair-list">${MINIMAL_PAIRS.map((p) => `<div class="pair-row"><span>${p.a[0]} <b>${p.a[1]}</b> ${p.a[2]} ${play(p.a[0], toneOf(p.a[1]))}</span><span class="vs">×</span><span>${p.b[0]} <b>${p.b[1]}</b> ${p.b[2]} ${play(p.b[0], toneOf(p.b[1]))}</span></div>`).join('')}</div>`;
    case 'paresTons':
      return `<p class="lead">Ninguém fala sílabas soltas: treine os tons em <b>pares</b>, como as palavras aparecem de verdade. A linha é o tom do 1º caractere; a coluna, o do 2º.</p>
      <div class="tp-scroll"><table class="tp-grid"><thead><tr><th></th>${['1º', '2º', '3º', '4º', 'neutro'].map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>
      ${[1, 2, 3, 4].map((r) => `<tr><th>${r}º</th>${[1, 2, 3, 4, 0].map((c) => {
        const w = TONE_PAIRS.find((x) => x[3][0] === r && x[3][1] === c);
        return `<td><span class="tp-h">${w[0]}</span><span class="tp-p">${w[1]}</span>${play(w[0], w[3].join(','))}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="note">3º + 3º (水果) muda para 2º + 3º: veja na próxima floresta, no sandhi.</p>`;
    case 'sons':
      return `<p class="lead">Quatro grupos de sons pedem treino deliberado.</p>
      ${PINYIN_SOUNDS.map((g) => `<div class="snd-group"><h4>${g.grupo}</h4><p>${g.som}</p><div class="chips">${g.itens.map((i) => `<span class="chip">${i[0]} <b>${i[1]}</b> ${play(i[0], toneOf(i[1]))}</span>`).join('')}</div></div>`).join('')}`;
    case 'sandhi':
      return `<p class="lead">Sandhi: quando os blocos se encostam, alguns tons mudam.</p>
      <div class="rule"><b>3º + 3º</b> → o primeiro vira 2º: 你好 ní hǎo · 很好 hén hǎo ${play('你好', '3,3')}</div>
      <div class="rule"><b>不 + 4º tom</b> → bú: 不是 bú shì · 不去 bú qù ${play('不是')}</div>
      <div class="rule"><b>一</b> → yí antes de 4º (一个 yí ge), yì antes dos demais (一杯 yì bēi) ${play('一个')}</div>
      <p class="note">O pinyin dos dicionários mostra o tom original; a boca faz a mudança.</p>`;
    case 'vocab': {
      const words = m.grupos.flatMap((g) => VOCAB[g]);
      return `<p class="lead">Toque nos cartões para ouvir. Leia hanzi → pinyin → sentido.</p>
      <div class="flash-grid">${words.map((w) => `<button class="flash" data-say="${esc(w[0])}"><span class="fl-h">${w[0]}</span><span class="fl-p">${w[1]}</span><span class="fl-g">${w[2]}</span></button>`).join('')}</div>`;
    }
    case 'blocos': {
      const phrases = m.modulos.flatMap((md) => CHUNKS[md]);
      return `<p class="lead">Método ODU Chunking: a frase é montada em blocos. Cada cor é uma função, e a ordem quase nunca muda.</p>
      <div class="esteira">${['S', 'T', 'L', 'M', 'V', 'O', 'P'].map((t) => `<span class="type-chip" style="--bc:${BLOCK_TYPES[t].cor}">${BLOCK_TYPES[t].pergunta}</span>`).join('<i>→</i>')}</div>
      <p class="note">Tempo e lugar entram ANTES do verbo. Negação e advérbios grudam antes do verbo. Partículas fecham a frase.</p>
      ${phrases.slice(0, 4).map((ph) => `<div class="model"><div class="blk-row">${ph.b.map((b) => blockHtml(b, { small: true })).join('')}</div><div class="model-pt">→ ${esc(ph.pt)} ${play(phraseText(ph))}</div><div class="lupa"><b>Lupa</b> ${esc(ph.lupa)}</div></div>`).join('')}`;
    }
    case 'dialogo':
      return `<p class="lead">A Lili, a panda, convidou o Pongo para um chá. Ela vai puxar conversa: escolha a resposta com os blocos na ordem certa.</p>
      <div class="esteira">${ESTEIRA.map((t) => `<span class="type-chip" style="--bc:${BLOCK_TYPES[t].cor}">${BLOCK_TYPES[t].pergunta}</span>`).join('<i>→</i>')}</div>`;
    default:
      return '';
  }
}

// ------------------------------------------------------------------ estado da partida
const state = {
  level: null,
  mission: -1,
  list: [],
  idx: 0,
  attempts: 0,
  firstTry: 0,
  combo: 0,
  missionScore: 0,
  shownScore: save.score,
};

let world = null;
const app = () => $('#app');

function show(id) {
  $$('.screen').forEach((s) => (s.hidden = s.id !== id));
  world?.pause(id !== 'play');
}

function festaScale() {
  return save.settings.festa === 'calmo' ? 0.25 : 1;
}

// ------------------------------------------------------------------ HUD
function updateHud() {
  $('#hud-score').textContent = save.score.toLocaleString('pt-BR');
  const c = $('#hud-combo');
  const mult = comboMult();
  c.hidden = mult < 2;
  c.textContent = `连击 COMBO ×${mult}`;
}
function comboMult() {
  return Math.min(5, 1 + Math.floor(state.combo / 2));
}
function addScore(pts, x, y) {
  save.score += pts;
  state.missionScore += pts;
  persist();
  updateHud();
  const s = $('#hud-score');
  s.classList.remove('bump');
  void s.offsetWidth;
  s.classList.add('bump');
  if (x != null) FX.floatText(x, y, `+${pts}`, '#1E8449');
}

// ------------------------------------------------------------------ mapa
function renderMap() {
  const wrap = $('#map-stops');
  wrap.innerHTML = LEVELS.map((L) => {
    const locked = L.id > save.unlocked;
    const done = (save.done[L.id] || []).filter(Boolean).length;
    const stars = [0, 1, 2].reduce((a, i) => a + (save.stars[`${L.id}-${i}`] || 0), 0);
    return `<button class="stop${locked ? ' locked' : ''}${done === 3 ? ' complete' : ''}" data-level="${L.id}" ${locked ? 'disabled' : ''}>
      <span class="stop-medal"><span class="stop-zh">${L.zh}</span></span>
      <span class="stop-info"><span class="stop-tag">Fase ${L.id} · ${L.nivel}</span><span class="stop-name">${L.nome}</span>
      <span class="stop-meta">${locked ? '🔒 Conclua a fase anterior' : `${done}/3 portais · ${'★'.repeat(stars)}${'☆'.repeat(9 - stars)}`}</span></span>
    </button>`;
  }).join('');
  $('#map-score').textContent = save.score.toLocaleString('pt-BR');
  $$('.stop', wrap).forEach((b) => b.addEventListener('click', () => startLevel(+b.dataset.level)));
}

// ------------------------------------------------------------------ fase
async function startLevel(id) {
  A.sfxClick();
  const L = LEVELS.find((l) => l.id === id);
  state.level = L;
  show('play');
  $('#loading').hidden = false;
  $('#hud-level').innerHTML = `<span class="hud-zh">${L.zh}</span><span><small>Fase ${L.id} · ${L.nivel}</small>${L.nome}</span>`;
  renderPathMarkers();
  updateHud();
  closePanel();
  try {
    await world.loadLevel(L);
  } catch (e) {
    console.error(e);
    $('#loading').innerHTML = `<p>Não foi possível carregar o cenário 3D (${esc(e.message)}).<br>Abra o jogo por um servidor web (veja o README).</p>`;
    return;
  }
  $('#loading').hidden = true;
  let doneCount = 0;
  const d = save.done[L.id] || [];
  while (doneCount < 3 && d[doneCount]) doneCount++;
  if (doneCount === 3) doneCount = 0; // fase concluída: joga de novo desde o início
  world.skipTo(doneCount);
  renderPathMarkers();
  story(L.historia, doneCount ? 'Continue de onde parou!' : 'Toque em 走 Andar para o Pongo caminhar.');
  updateWalkBtn();
}

function renderPathMarkers() {
  const L = state.level;
  if (!L) return;
  const d = save.done[L.id] || [];
  $('#path-gates').innerHTML = [0, 1, 2].map((i) => `<span class="pg${d[i] ? ' ok' : ''}" style="left:${((4 - [-16, -32, -48][i] - 2.6) / 62) * 100}%">${d[i] ? '✓' : i + 1}</span>`).join('');
}

function story(text, tip) {
  const el = $('#story');
  el.innerHTML = `<div class="bubble"><b>Pongo:</b> ${esc(text)}<small>${esc(tip)}</small></div>`;
  el.hidden = false;
  clearTimeout(story.t);
  story.t = setTimeout(() => (el.hidden = true), 7000);
}

function updateWalkBtn() {
  const b = $('#walk');
  b.hidden = world.isBusy() || !$('#panel').hidden;
  b.classList.toggle('on', world.isAuto());
  $('#walk-label').textContent = world.isAuto() ? 'Parar' : 'Andar';
}

// ------------------------------------------------------------------ missão
function onGate(i) {
  state.mission = i;
  const m = state.level.missoes[i];
  state.list = buildMission(m);
  state.idx = -1;
  state.firstTry = 0;
  state.missionScore = 0;
  openPanel();
  $('#panel-title').innerHTML = `<span class="pt-zh">${m.zh}</span><span><small>Portal ${i + 1} de 3 · Missão</small>${m.titulo}</span>`;
  renderLesson(m);
  updateWalkBtn();
}

function openPanel() {
  $('#panel').hidden = false;
  app().classList.add('with-panel');
  world.resize();
}
function closePanel() {
  $('#panel').hidden = true;
  app().classList.remove('with-panel');
  world?.resize();
}

function renderLesson(m) {
  setProgress(0);
  const body = $('#panel-body');
  body.innerHTML = `<div class="lesson"><div class="lesson-tag">Lição · ${esc(m.desc)}</div>${lessonHtml(m)}</div>`;
  setFooter(`<button class="btn btn-primary" id="go">Começar os desafios</button>`);
  $('#go').addEventListener('click', () => {
    A.sfxClick();
    nextChallenge();
  });
  wirePlayButtons(body);
}

function wirePlayButtons(root) {
  $$('[data-say]', root).forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const tones = b.dataset.tones;
    if (tones !== undefined && tones !== '') A.playToneContour(tones.split(',').map(Number));
    setTimeout(() => A.speak(b.dataset.say), tones ? 900 : 0);
    b.classList.remove('ping');
    void b.offsetWidth;
    b.classList.add('ping');
  }));
}

function setProgress(f) {
  $('#panel-progress').style.setProperty('--p', `${Math.round(f * 100)}%`);
}
function setFooter(html) {
  $('#panel-foot').innerHTML = html;
}

function nextChallenge() {
  state.idx++;
  state.attempts = 0;
  setProgress(state.idx / state.list.length);
  if (state.idx >= state.list.length) return missionComplete();
  const c = state.list[state.idx];
  const body = $('#panel-body');
  body.scrollTop = 0;
  const counter = `<div class="q-count">${state.idx + 1} / ${state.list.length}</div>`;
  if (c.kind === 'choice') renderChoice(c, body, counter);
  else if (c.kind === 'match') renderMatch(c, body, counter);
  else if (c.kind === 'build') renderBuild(c, body, counter);
  else if (c.kind === 'fill') renderFill(c, body, counter);
  else if (c.kind === 'dialog') renderDialog(c, body, counter);
}

function audioButton(c) {
  if (!c.audio) return '';
  return `<button class="listen" id="listen" aria-label="Ouvir"><span>🔊</span> Ouvir</button>`;
}
function playAudio(c) {
  if (!c.audio) return;
  const { tones, say } = c.audio;
  if (tones) A.playToneContour(tones);
  if (say) setTimeout(() => A.speak(say), tones ? 300 + tones.length * 520 : 0);
}

function correct(el, extraSay) {
  state.combo++;
  const base = state.attempts === 0 ? 100 : state.attempts === 1 ? 50 : 25;
  if (state.attempts === 0) state.firstTry++;
  const pts = base * comboMult();
  const r = el?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : innerWidth / 2;
  const y = r ? r.top + r.height / 2 : innerHeight / 2;
  addScore(pts, x, y - 20);
  A.sfxCorrect(state.combo);
  FX.celebrate(1, x, y);
  world.celebrate();
  if (state.combo >= 3 && state.combo % 3 === 0) {
    FX.bigText(`连击 ×${comboMult()}`, `${state.combo} acertos seguidos!`, '#6D28D9');
    A.sfxCelebrate(1);
    FX.emojiRain(18);
  }
  if (extraSay) setTimeout(() => A.speak(extraSay), 450);
}
function wrong(el) {
  state.attempts++;
  state.combo = 0;
  updateHud();
  A.sfxWrong();
  world.sad();
  if (el) FX.shake(el);
}

function feedback(ok, html, onNext) {
  setFooter(`<div class="fb ${ok ? 'fb-ok' : 'fb-no'}"><div class="fb-text">${ok ? '<b>对了！duì le!</b> ' : ''}${html}</div><button class="btn btn-primary" id="next">Continuar →</button></div>`);
  const n = $('#next');
  n.focus({ preventScroll: true });
  n.addEventListener('click', () => {
    A.sfxClick();
    onNext ? onNext() : nextChallenge();
  });
}

// ---- múltipla escolha
function renderChoice(c, body, counter) {
  body.innerHTML = `${counter}<div class="q">${c.prompt}${audioButton(c)}</div>
    <div class="opts cols-${c.cols || 2}">${c.options.map((o, i) => `<button class="opt" data-i="${i}"><kbd>${i + 1}</kbd>${o.html}</button>`).join('')}</div>`;
  setFooter('<p class="hint">Escolha uma resposta. Errou? Tente de novo: vale menos pontos, mas vale!</p>');
  $('#listen')?.addEventListener('click', () => playAudio(c));
  if (c.audio && (c.autoPlay || c.audio.tones)) setTimeout(() => playAudio(c), 350);
  $$('.opt', body).forEach((b) => b.addEventListener('click', () => {
    const o = c.options[+b.dataset.i];
    if (b.disabled) return;
    if (o.ok) {
      $$('.opt', body).forEach((x) => (x.disabled = true));
      b.classList.add('right');
      correct(b, c.speakOnOk);
      feedback(true, c.explain);
    } else {
      b.classList.add('nope');
      b.disabled = true;
      wrong(b);
      if (state.attempts >= 2) {
        const r = $$('.opt', body).find((x) => c.options[+x.dataset.i].ok);
        r.classList.add('hint-right');
      }
    }
  }));
}

// ---- jogo da memória (pares)
function renderMatch(c, body, counter) {
  const left = shuffle(c.pairs.map((p, i) => ({ i, html: `<span class="opt-hanzi">${p[0]}</span>` })));
  const right = shuffle(c.pairs.map((p, i) => ({ i, html: `<b>${esc(p[1])}</b>` })));
  body.innerHTML = `${counter}<div class="q"><div class="q-label">Ligue cada hanzi ao seu significado</div></div>
    <div class="match"><div class="mcol">${left.map((x) => `<button class="mc" data-side="L" data-i="${x.i}">${x.html}</button>`).join('')}</div>
    <div class="mcol">${right.map((x) => `<button class="mc" data-side="R" data-i="${x.i}">${x.html}</button>`).join('')}</div></div>`;
  setFooter('<p class="hint">Toque em um hanzi e depois no significado.</p>');
  let sel = null;
  let left2 = c.pairs.length;
  let errors = 0;
  $$('.mc', body).forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    if (b.dataset.side === 'L') A.speak(c.pairs[+b.dataset.i][0]);
    if (!sel || sel.dataset.side === b.dataset.side) {
      sel?.classList.remove('sel');
      sel = b;
      b.classList.add('sel');
      A.sfxPick(+b.dataset.i);
      return;
    }
    if (sel.dataset.i === b.dataset.i) {
      [sel, b].forEach((x) => {
        x.classList.remove('sel');
        x.classList.add('paired');
        x.disabled = true;
      });
      A.sfxCorrect(1);
      const r = b.getBoundingClientRect();
      FX.confettiAt(r.left + r.width / 2, r.top, 30);
      sel = null;
      left2--;
      if (left2 === 0) {
        state.attempts = Math.min(errors, 2);
        correct(b);
        feedback(true, c.pairs.map((p) => `${p[0]} <b>${p[2]}</b> ${esc(p[1])}`).join(' · '));
      }
    } else {
      errors++;
      A.sfxWrong();
      FX.shake(b);
      state.combo = 0;
      updateHud();
      sel.classList.remove('sel');
      sel = null;
    }
  }));
}

// ---- montar a frase com blocos coloridos (Método ODU Chunking)
function renderBuild(c, body, counter) {
  const ph = c.phrase;
  const pool = shuffle(ph.b.map((b, i) => ({ ...b, id: i })));
  // garante que não comece já na ordem certa
  if (pool.map((b) => b.h).join() === ph.b.map((b) => b.h).join() && pool.length > 1) pool.reverse();
  const placed = [];
  body.innerHTML = `${counter}<div class="q"><div class="q-label">Monte em mandarim, bloco a bloco</div><div class="q-word">${esc(ph.pt)}</div>
    <button class="legend-link" id="leg2">Legenda das cores</button></div>
    <div class="track" id="track" aria-label="Sua frase"></div>
    <div class="pool" id="pool"></div>`;
  $('#leg2').addEventListener('click', openLegend);
  const track = $('#track');
  const poolEl = $('#pool');
  const hint = () => state.attempts >= 1;
  function draw() {
    track.innerHTML = ph.b.map((target, i) => {
      const b = placed[i];
      if (b) return blockHtml(b, { tag: 'button', attrs: `data-slot="${i}"` });
      const T = BLOCK_TYPES[target.t];
      return `<span class="slot${hint() ? ' slot-hint' : ''}" style="--bc:${T.cor};--bl:${T.claro}">${hint() ? T.nome : ''}</span>`;
    }).join('');
    poolEl.innerHTML = pool.map((b) => (placed.includes(b) ? `<span class="blk-ghost"></span>` : blockHtml(b, { tag: 'button', attrs: `data-id="${b.id}"` }))).join('');
    const chk = $('#check');
    if (chk) chk.disabled = placed.filter(Boolean).length !== ph.b.length;
    $$('[data-id]', poolEl).forEach((el) => el.addEventListener('click', () => {
      const b = pool.find((x) => x.id === +el.dataset.id);
      const free = ph.b.findIndex((_, i) => !placed[i]);
      if (free < 0) return;
      placed[free] = b;
      A.sfxPick(free);
      A.speak(b.h, 'zh-CN', 0.9);
      draw();
    }));
    $$('[data-slot]', track).forEach((el) => el.addEventListener('click', () => {
      placed[+el.dataset.slot] = undefined;
      A.sfxClick();
      draw();
    }));
  }
  function footer(msg = '') {
    setFooter(`${msg ? `<p class="hint">${msg}</p>` : ''}<button class="btn btn-ghost" id="clear">Limpar</button><button class="btn btn-primary" id="check" disabled>Verificar</button>`);
    $('#clear').addEventListener('click', () => {
      placed.length = 0;
      A.sfxClick();
      draw();
    });
    $('#check').addEventListener('click', check);
    draw();
  }
  function check() {
    const ok = placed.map((b) => b?.h).join('|') === ph.b.map((b) => b.h).join('|');
    if (ok) {
      track.classList.add('track-ok');
      $$('.blk', track).forEach((el, i) => setTimeout(() => el.classList.add('pop'), i * 90));
      correct(track, phraseText(ph));
      feedback(true, `<span class="zh-line">${phraseText(ph)}</span> <i>${esc(phrasePinyin(ph))}</i><br><b>Lupa gramatical:</b> ${esc(ph.lupa)}`);
      return;
    }
    wrong(track);
    // os blocos fora do lugar voltam ao monte; os espaços passam a mostrar a cor esperada
    placed.forEach((b, i) => {
      if (b && b.h !== ph.b[i].h) placed[i] = undefined;
    });
    footer('Os blocos fora do lugar voltaram ao monte. Agora cada espaço mostra a cor do bloco que ele espera: siga a esteira QUEM → QUANDO → ONDE → FAZ → O QUÊ.');
  }
  footer();
}

// ---- completar o bloco que falta
function renderFill(c, body, counter) {
  const ph = c.phrase;
  body.innerHTML = `${counter}<div class="q"><div class="q-label">Complete o bloco que falta</div><div class="q-word">${esc(ph.pt)}</div></div>
    <div class="track">${ph.b.map((b, i) => (i === c.miss ? `<span class="slot slot-hint slot-q" style="--bc:${BLOCK_TYPES[b.t].cor};--bl:${BLOCK_TYPES[b.t].claro}">?</span>` : blockHtml(b))).join('')}</div>
    <div class="pool">${c.options.map((b, i) => blockHtml(b, { tag: 'button', attrs: `data-i="${i}"` })).join('')}</div>`;
  setFooter('<p class="hint">Dica: a cor do espaço vazio diz o tipo de bloco.</p>');
  $$('[data-i]', body).forEach((el) => el.addEventListener('click', () => {
    const b = c.options[+el.dataset.i];
    if (b.h === ph.b[c.miss].h) {
      $$('[data-i]', body).forEach((x) => (x.disabled = true));
      const slot = $('.slot-q', body);
      slot.outerHTML = blockHtml(b);
      correct(el, phraseText(ph));
      feedback(true, `<span class="zh-line">${phraseText(ph)}</span> <i>${esc(phrasePinyin(ph))}</i><br><b>Lupa:</b> ${esc(ph.lupa)}`);
    } else {
      el.disabled = true;
      el.classList.add('nope');
      wrong(el);
    }
  }));
}

// ---- diálogo com a Lili
function renderDialog(c, body, counter) {
  const d = c.d;
  const opts = shuffle([{ v: d.certa, ok: true }, ...d.erradas.map((v) => ({ v, ok: false }))]);
  body.innerHTML = `${counter}<div class="dlg">
      <div class="dlg-who">🐼 Lili</div>
      <div class="dlg-bubble"><span class="zh-line">${d.lili[0]}</span><i>${esc(d.lili[1])}</i><small>${esc(d.lili[2])}</small><button class="listen" id="listen">🔊 Ouvir</button></div>
      <div class="dlg-who me">🐶 Pongo responde:</div>
    </div>
    <div class="opts cols-1">${opts.map((o, i) => `<button class="opt opt-dlg" data-i="${i}"><kbd>${i + 1}</kbd><span class="zh-line">${o.v[0]}</span><i>${esc(o.v[1])}</i></button>`).join('')}</div>`;
  setFooter('<p class="hint">Leia os blocos: QUEM → QUANDO → ONDE → FAZ → O QUÊ.</p>');
  const say = () => A.speak(d.lili[0]);
  $('#listen').addEventListener('click', say);
  setTimeout(say, 400);
  $$('.opt', body).forEach((b) => b.addEventListener('click', () => {
    const o = opts[+b.dataset.i];
    if (b.disabled) return;
    if (o.ok) {
      $$('.opt', body).forEach((x) => (x.disabled = true));
      b.classList.add('right');
      correct(b, o.v[0]);
      world.pandaWave();
      feedback(true, `${esc(d.certa[2])}`);
    } else {
      b.classList.add('nope');
      b.disabled = true;
      b.insertAdjacentHTML('beforeend', `<small class="why">${esc(o.v[2])}</small>`);
      wrong(b);
    }
  }));
}

// ---- missão concluída
function missionComplete() {
  const L = state.level;
  const i = state.mission;
  const ratio = state.firstTry / state.list.length;
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.65 ? 2 : 1;
  const bonus = 200 + stars * 100;
  save.done[L.id] = save.done[L.id] || [false, false, false];
  save.done[L.id][i] = true;
  save.stars[`${L.id}-${i}`] = Math.max(save.stars[`${L.id}-${i}`] || 0, stars);
  addScore(bonus);
  persist();
  renderPathMarkers();
  // A EXPLOSÃO: confete, emojis, fogos, flashes, tremor, bombinhas, gongo, fanfarra
  A.sfxCelebrate(2);
  FX.celebrate(2, null, null, app());
  FX.bigText('太棒了！', 'tài bàng le! · Missão cumprida', '#D0384E');
  setTimeout(() => A.speak('太棒了！'), 900);
  world.celebrate();
  setProgress(1);
  $('#panel-body').innerHTML = `<div class="done">
    <div class="done-stars">${[1, 2, 3].map((s) => `<span class="${s <= stars ? 'on' : ''}" style="--d:${s * 0.15}s">★</span>`).join('')}</div>
    <h3>Missão cumprida!</h3>
    <p>${state.firstTry} de ${state.list.length} na primeira tentativa.</p>
    <div class="done-score"><span>Pontos da missão</span><b>${state.missionScore.toLocaleString('pt-BR')}</b><small>inclui bônus de ${bonus}</small></div>
    <p class="note">${i < 2 ? 'O portal vai se abrir. Siga em frente!' : 'Último portal! O fim da trilha está logo ali.'}</p></div>`;
  setFooter(`<button class="btn btn-ghost" id="redo">Refazer</button><button class="btn btn-primary btn-big" id="opengate">Abrir o portal 开门</button>`);
  $('#redo').addEventListener('click', () => onGate(i));
  $('#opengate').addEventListener('click', () => {
    closePanel();
    A.sfxGate();
    world.openGate(i);
    setTimeout(() => {
      world.toggleAuto();
      updateWalkBtn();
    }, 900);
    updateWalkBtn();
  });
}

// ---- fase concluída
function levelComplete() {
  const L = state.level;
  const next = LEVELS.find((l) => l.id === L.id + 1);
  if (next && save.unlocked < next.id) save.unlocked = next.id;
  addScore(1000);
  persist();
  A.sfxCelebrate(3);
  FX.celebrate(3, null, null, app());
  FX.bigText('成功！', `chénggōng! · ${L.nome} concluída`, '#1E8449');
  setTimeout(() => A.speak(L.amiga ? '欢迎你来北京！' : '成功了！'), 1100);
  world.celebrate();
  const stars = [0, 1, 2].reduce((a, i) => a + (save.stars[`${L.id}-${i}`] || 0), 0);
  setTimeout(() => {
    openPanel();
    $('#panel-title').innerHTML = `<span class="pt-zh">${L.zh}</span><span><small>Fase ${L.id} concluída</small>${L.nome}</span>`;
    setProgress(1);
    $('#panel-body').innerHTML = `<div class="done">
      <div class="done-stars">${'★'.repeat(stars)}<span class="dim">${'★'.repeat(9 - stars)}</span></div>
      <h3>${L.amiga ? 'Pongo chegou! 欢迎你来北京！' : 'Fase concluída!'}</h3>
      <p>${L.amiga ? 'A Lili serviu chá, e o Pongo conversou em mandarim do começo ao fim. Você concluiu a trilha Pré-HSK 1 → HSK 1!' : `Próxima parada: <b>${next.nome} ${next.zh}</b>.`}</p>
      <div class="done-score"><span>Pontuação total</span><b>${save.score.toLocaleString('pt-BR')}</b><small>+1000 de bônus de fase</small></div></div>`;
    setFooter(`<button class="btn btn-ghost" id="tomap">Mapa</button>${next ? `<button class="btn btn-primary btn-big" id="nextlvl">Próxima fase →</button>` : `<button class="btn btn-primary btn-big" id="again">Jogar de novo</button>`}`);
    $('#tomap').addEventListener('click', goMap);
    $('#nextlvl')?.addEventListener('click', () => startLevel(next.id));
    $('#again')?.addEventListener('click', () => startLevel(1));
  }, 1800);
}

function goMap() {
  A.sfxClick();
  closePanel();
  renderMap();
  show('map');
}

// ------------------------------------------------------------------ legenda e ajustes
function openLegend() {
  $('#legend-body').innerHTML = `<div class="legend-grid">${Object.entries(BLOCK_TYPES).map(([k, T]) => `<div class="leg"><span class="type-chip" style="--bc:${T.cor}">${T.nome}</span><small>${T.pergunta}</small></div>`).join('')}</div>
    <p class="note"><b>A esteira da frase:</b> QUEM → QUANDO → ONDE → (MODAL) → FAZ O QUÊ → PARTÍCULA.<br>我 → 今天 → 在家 → 想 → 吃饭 → 吧</p>`;
  $('#legend').hidden = false;
}

function syncSettings() {
  $('#set-music').checked = save.settings.music;
  $('#set-sfx').checked = save.settings.sfx;
  $('#set-festa').value = save.settings.festa;
  $('#btn-music').classList.toggle('off', !save.settings.music);
  FX.setFxIntensity(festaScale());
}

// ------------------------------------------------------------------ inicialização
function boot() {
  FX.initFx($('#fx'));
  world = createWorld($('#gl'), {
    onGate: (i) => onGate(i),
    onEnd: () => levelComplete(),
    onStep: () => A.sfxStep(),
    onProgress: (f) => $('#path-dog').style.setProperty('--x', `${Math.max(0, Math.min(1, f)) * 100}%`),
  });
  syncSettings();

  const startAudio = () => {
    A.initAudio();
    A.setMusic(save.settings.music);
    A.setSfx(save.settings.sfx);
  };

  $('#play-btn').addEventListener('click', () => {
    startAudio();
    A.sfxCelebrate(1);
    FX.confettiStorm(1);
    show('intro');
  });
  $('#intro-go').addEventListener('click', () => {
    A.sfxClick();
    renderMap();
    show('map');
  });
  $('#btn-map').addEventListener('click', goMap);
  $('#btn-legend').addEventListener('click', openLegend);
  $('#legend-close').addEventListener('click', () => ($('#legend').hidden = true));
  $('#btn-music').addEventListener('click', () => {
    startAudio();
    save.settings.music = !save.settings.music;
    A.setMusic(save.settings.music);
    persist();
    syncSettings();
  });
  $$('.btn-settings').forEach((b) => b.addEventListener('click', () => {
    syncSettings();
    $('#settings').hidden = false;
  }));
  $('#settings-close').addEventListener('click', () => ($('#settings').hidden = true));
  $('#set-music').addEventListener('change', (e) => {
    startAudio();
    save.settings.music = e.target.checked;
    A.setMusic(save.settings.music);
    persist();
    syncSettings();
  });
  $('#set-sfx').addEventListener('change', (e) => {
    save.settings.sfx = e.target.checked;
    A.setSfx(save.settings.sfx);
    persist();
  });
  $('#set-festa').addEventListener('change', (e) => {
    save.settings.festa = e.target.value;
    save.settings.festaEscolhida = true;
    persist();
    syncSettings();
    if (e.target.value === 'max') {
      A.sfxCelebrate(2);
      FX.celebrate(2, null, null, app());
    }
  });
  $('#reset-progress').addEventListener('click', () => {
    const b = $('#reset-progress');
    if (b.dataset.armed !== '1') {
      b.dataset.armed = '1';
      b.textContent = 'Toque de novo para apagar tudo';
      return;
    }
    const settings = save.settings;
    save = blank();
    save.settings = settings;
    persist();
    b.dataset.armed = '0';
    b.textContent = 'Progresso apagado';
    renderMap();
  });

  // andar: botão (liga/desliga), segurar seta/W/espaço, ou tocar no cenário
  $('#walk').addEventListener('click', () => {
    startAudio();
    world.toggleAuto();
    $('#story').hidden = true;
    updateWalkBtn();
  });
  $('#gl').addEventListener('click', () => {
    if ($('#panel').hidden && !world.isBusy() && !world.isAuto()) {
      world.toggleAuto();
      $('#story').hidden = true;
      updateWalkBtn();
    }
  });
  window.addEventListener('keydown', (e) => {
    if ($('#play').hidden) return;
    if (!$('#panel').hidden) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        const opts = $$('#panel-body .opt');
        if (opts[n - 1] && !opts[n - 1].disabled) opts[n - 1].click();
      }
      return;
    }
    if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) {
      e.preventDefault();
      world.setWalking(true);
      $('#story').hidden = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) world.setWalking(false);
  });
  setInterval(() => {
    if (!$('#play').hidden) updateWalkBtn();
  }, 300);

  $('#title-score').textContent = save.score ? `Seus pontos: ${save.score.toLocaleString('pt-BR')}` : '';
  show('title');
}

boot();
