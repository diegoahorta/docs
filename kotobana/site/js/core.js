// Núcleo compartilhado: dados, progresso, repetição espaçada, XP, acento tonal e voz.
const COLS = ["id", "no", "palavra", "leitura", "romaji", "pt", "imp", "cls", "livro", "licao", "acento", "acento_fonte", "nota"];

export const CLS = {
  SUB: "substantivo", V1: "verbo grupo 1", V2: "verbo grupo 2", V3: "verbo grupo 3",
  "ADJ-I": "adjetivo-i", "ADJ-NA": "adjetivo-na", ADV: "advérbio", CONJ: "conjunção",
  EXP: "expressão", AFX: "afixo (～)", NC: "não classificado",
};
export const BOOKS = { 1: [1, 15], 2: [16, 24], 3: [25, 33], 4: [34, 42], 5: [43, 51], 6: [52, 60] };
export const VOCAB = (window.KOTOBANA_DATA || []).map(r => Object.fromEntries(COLS.map((c, i) => [c, r[i]])));
export const BYID = Object.fromEntries(VOCAB.map(v => [v.id, v]));
const DAY = 86400000;

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const sample = (a, n) => shuffle(a).slice(0, n);

// ---------- estado persistente ----------
const KEY = "ktb2:state";
const blank = () => ({
  srs: {}, seen: {}, xp: 0, streak: { last: null, count: 0 }, days: {},
  best: { lanternas: 0, karuta: null }, stats: { answers: 0, correct: 0, games: 0 }, badges: [],
  prefs: { books: [1], from: 1, to: 15, imp: [1, 2, 3], dir: "jp" },
});
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return { ...blank(), ...s, prefs: { ...blank().prefs, ...s.prefs } }; } catch {}
  return blank();
}
export const S = load();
let server = false, saveTimer = null;
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
  if (server) { clearTimeout(saveTimer); saveTimer = setTimeout(() => fetch("api/progresso", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(S) }).catch(() => {}), 600); }
}
// Com o servidor Python (tools/servidor.py) o progresso também fica salvo em arquivo.
export async function syncFromServer() {
  if (!location.protocol.startsWith("http")) return false;   // arquivo aberto direto do disco
  try {
    const r = await fetch("api/progresso", { cache: "no-store" });
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return false;
    const remote = await r.json();
    server = true;
    if (remote && remote.xp > S.xp) Object.assign(S, blank(), remote);
    save();
    return true;
  } catch { return false; }
}
export function reset() { const p = S.prefs; Object.assign(S, blank(), { prefs: p }); save(); }

// ---------- baralho filtrado ----------
export function deck(p = S.prefs) {
  const lo = Math.min(p.from, p.to), hi = Math.max(p.from, p.to);
  return VOCAB.filter(v => p.books.includes(v.livro) && v.licao >= lo && v.licao <= hi && p.imp.includes(v.imp || 1));
}
export function status(id) {
  const s = S.srs[id];
  if (!s) return S.seen[id] ? "seen" : "new";
  return s.iv >= 21 ? "known" : "learn";
}
export const STATUS_LABEL = { new: "nova", seen: "vista", learn: "aprendendo", known: "memorizada" };

// ---------- repetição espaçada (SM-2 simplificado) ----------
function nextInterval(s, q) {
  const ef = Math.max(1.3, s.ef + [0, -0.15, 0, 0.15][q]);
  const iv = s.reps === 0 ? [0, 1, 1, 3][q] : s.reps === 1 ? [0, 3, 4, 7][q] : Math.max(1, Math.round(s.iv * ef * [0, 0.8, 1, 1.3][q]));
  return { ef, iv };
}
export function grade(id, q) { // 0 errei · 1 difícil · 2 bom · 3 fácil
  const s = S.srs[id] || { iv: 0, ef: 2.5, reps: 0, lapses: 0 };
  if (q === 0) { s.reps = 0; s.lapses++; s.iv = 0; s.ef = Math.max(1.3, s.ef - 0.2); s.due = Date.now() + 60000; }
  else { const n = nextInterval(s, q); s.ef = n.ef; s.iv = n.iv; s.reps++; s.due = Date.now() + s.iv * DAY; }
  S.srs[id] = s;
  S.seen[id] = 1;
}
export function previewInterval(id, q) {
  if (q === 0) return "1 min";
  const { iv } = nextInterval(S.srs[id] || { iv: 0, ef: 2.5, reps: 0 }, q);
  return iv >= 30 ? Math.round(iv / 30) + (iv >= 60 ? " meses" : " mês") : iv + (iv === 1 ? " dia" : " dias");
}
// Resultado de quiz/jogo alimenta o SRS sem rebaixar quem já está bem.
export function practiced(id, correct) {
  S.stats.answers++; if (correct) S.stats.correct++;
  if (!correct) grade(id, 0);
  else if (!S.srs[id]) grade(id, 2);
  else S.seen[id] = 1;
}
export function dueCount(d = deck()) { const now = Date.now(); return d.filter(v => S.srs[v.id] && S.srs[v.id].due <= now).length; }

// ---------- XP, nível, sequência de dias, conquistas ----------
const today = () => new Date().toLocaleDateString("sv");
export function level(xp = S.xp) { return Math.floor(Math.sqrt(xp / 40)) + 1; }
export function levelRange(l) { return [40 * (l - 1) ** 2, 40 * l ** 2]; }
const listeners = new Set();
export const onChange = fn => listeners.add(fn);
export function gain(xp) {
  const d = today();
  if (S.streak.last !== d) {
    const y = new Date(Date.now() - DAY).toLocaleDateString("sv");
    S.streak.count = S.streak.last === y ? S.streak.count + 1 : 1;
    S.streak.last = d;
  }
  S.days[d] = (S.days[d] || 0) + xp;
  S.xp += xp;
  const fresh = checkBadges();
  save();
  listeners.forEach(fn => fn(xp, fresh));
}
export const BADGES = [
  { id: "primeira", nome: "Primeiro passo", desc: "Ganhe seus primeiros pontos", ok: () => S.xp > 0 },
  { id: "cem", nome: "100 palavras", desc: "Estude 100 palavras diferentes", ok: () => Object.keys(S.seen).length >= 100 },
  { id: "quinhentas", nome: "500 palavras", desc: "Estude 500 palavras diferentes", ok: () => Object.keys(S.seen).length >= 500 },
  { id: "livro1", nome: "Livro 1 visto", desc: "Veja todas as palavras do livro 1", ok: () => VOCAB.filter(v => v.livro === 1).every(v => S.seen[v.id]) },
  { id: "memoria50", nome: "Memória firme", desc: "50 palavras memorizadas (revisão ≥ 21 dias)", ok: () => Object.values(S.srs).filter(s => s.iv >= 21).length >= 50 },
  { id: "sequencia3", nome: "Três dias seguidos", desc: "Estude 3 dias seguidos", ok: () => S.streak.count >= 3 },
  { id: "sequencia7", nome: "Uma semana", desc: "Estude 7 dias seguidos", ok: () => S.streak.count >= 7 },
  { id: "lanterna30", nome: "Mestre das lanternas", desc: "Faça 30 pontos em Lanternas", ok: () => S.best.lanternas >= 30 },
  { id: "karuta", nome: "Karuta", desc: "Complete uma partida de Karuta", ok: () => S.best.karuta != null },
  { id: "nivel5", nome: "Nível 5", desc: "Chegue ao nível 5", ok: () => level() >= 5 },
];
function checkBadges() {
  const fresh = BADGES.filter(b => !S.badges.includes(b.id) && b.ok());
  fresh.forEach(b => S.badges.push(b.id));
  return fresh;
}

// ---------- acento tonal ----------
const SMALL = new Set("ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ");
export function morae(s) {
  const out = [];
  for (const ch of s) { if (SMALL.has(ch) && out.length) out[out.length - 1] += ch; else out.push(ch); }
  return out;
}
function pitchWord(tok) {
  const clean = tok.replace(/[（）()～…。、]/g, "");
  if (!clean) return `<span class="w">${esc(tok)}</span>`;
  const flat = clean.includes("→"), dropAt = clean.includes("↓") ? morae(clean.split("↓")[0]).length : null;
  const m = morae(clean.replace(/[↓→]/g, ""));
  if (!flat && dropAt === null) return `<span class="w">${m.map(x => `<span class="m">${esc(x)}</span>`).join("")}</span>`;
  const n = flat ? 0 : dropAt;
  return `<span class="w">${m.map((x, i) => {
    const k = i + 1, high = n === 0 ? k > 1 : n === 1 ? k === 1 : k > 1 && k <= n;
    const c = ["m"]; if (high) c.push("h"); if (n > 0 && k === n) c.push("drop"); if (high && k === 2) c.push("rise");
    return `<span class="${c.join(" ")}">${esc(x)}</span>`;
  }).join("")}</span>`;
}
export function pitchHTML(v) {
  if (!v.acento_fonte) return `<div class="pitch">${esc(v.leitura)}</div>`;
  const vars = String(v.acento_fonte).split(/\s*[/／]\s*/).map(x =>
    `<span class="variant">${x.split(/[ 　]+/).filter(Boolean).map(pitchWord).join("")}</span>`);
  return `<div class="pitch" title="Linha = tom alto · degrau = queda">${vars.join('<span class="sep">ou</span>')}</div>`;
}

// ---------- voz (síntese do navegador) ----------
let jaVoice = null;
export const hasTTS = "speechSynthesis" in window;
function pickVoice() { try { jaVoice = speechSynthesis.getVoices().find(v => /^ja/i.test(v.lang)) || null; } catch {} }
if (hasTTS) { pickVoice(); try { speechSynthesis.addEventListener("voiceschanged", pickVoice); } catch {} }
export function speak(v) {
  if (!hasTTS) return;
  const text = String(v.leitura || v.palavra).split(/\s*[/／]\s*/)[0].replace(/[（）()]/g, "").replace(/[～…]/g, "");
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = 0.85; if (jaVoice) u.voice = jaVoice;
    speechSynthesis.speak(u);
  } catch {}
}
export const SPEAKER = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>`;

// ---------- distratores para múltipla escolha ----------
export function distractors(v, n, field = "pt") {
  const pool = VOCAB.filter(x => x.id !== v.id && x[field] && x[field] !== v[field]);
  const same = pool.filter(x => x.cls === v.cls && Math.abs((x.licao || 0) - (v.licao || 0)) <= 12);
  const picked = [], used = new Set([v[field]]);
  for (const x of [...shuffle(same), ...shuffle(pool)]) {
    if (picked.length >= n) break;
    if (!used.has(x[field])) { used.add(x[field]); picked.push(x); }
  }
  return picked;
}

// ---------- seletor de conteúdo (livros, lições, importância) ----------
export function deckPicker(el, onUpdate) {
  const p = S.prefs;
  const opts = Array.from({ length: 60 }, (_, i) => `<option value="${i + 1}">Lição ${i + 1}</option>`).join("");
  el.innerHTML = `
    <div class="picker">
      <div class="prow"><span class="plbl">Livros</span>${Object.keys(BOOKS).map(b =>
        `<label class="chip"><input type="checkbox" name="pk-book" value="${b}" ${p.books.includes(+b) ? "checked" : ""}>${b}</label>`).join("")}</div>
      <div class="prow"><span class="plbl">Lições</span><select name="pk-from" aria-label="Da lição">${opts}</select><span class="muted">até</span><select name="pk-to" aria-label="Até a lição">${opts}</select></div>
      <div class="prow"><span class="plbl">Importância</span>${[[3, "★★★"], [2, "★★"], [1, "★"]].map(([i, t]) =>
        `<label class="chip"><input type="checkbox" name="pk-imp" value="${i}" ${p.imp.includes(i) ? "checked" : ""}>${t}</label>`).join("")}</div>
      <div class="pinfo muted"></div>
    </div>`;
  const from = $("[name=pk-from]", el), to = $("[name=pk-to]", el);
  from.value = p.from; to.value = p.to;
  const info = () => { const d = deck(); $(".pinfo", el).textContent = `${d.length} palavras selecionadas · ${dueCount(d)} para revisar`; };
  el.addEventListener("change", e => {
    const vals = n => $$(`[name=${n}]:checked`, el).map(i => +i.value);
    p.books = vals("pk-book"); p.imp = vals("pk-imp");
    if (e.target.name === "pk-book" && p.books.length) {
      p.from = Math.min(...p.books.map(b => BOOKS[b][0])); p.to = Math.max(...p.books.map(b => BOOKS[b][1]));
      from.value = p.from; to.value = p.to;
    } else { p.from = +from.value; p.to = +to.value; }
    save(); info(); onUpdate?.();
  });
  info();
  return { refresh: info };
}

export function toast(html) {
  const t = document.createElement("div");
  t.className = "toast"; t.innerHTML = html;
  $("#toasts").append(t);
  setTimeout(() => t.classList.add("out"), 2600);
  setTimeout(() => t.remove(), 3100);
}
