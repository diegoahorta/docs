/* ==========================================================================
   Minna no Nihongo — Batalha dos Reinos · lógica do jogo
   ========================================================================== */
(() => {
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const TYPE_LABEL = { S: "S", V: "V", O: "O", A: "AUX", D: "ADV" };
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const CROWN_SVG = '<svg viewBox="0 0 24 20" class="crown"><path d="M2 17h20l1-12-6 5-5-8-5 8-6-5z" fill="#f4b833" stroke="#7a5200" stroke-width="1.5" stroke-linejoin="round"/></svg>';
const MUSIC_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 18.5a3 3 0 1 1-2-2.83V5l12-2v12.5a3 3 0 1 1-2-2.83V7.3L9 8.6z"/></svg>';

/* ---------------- progresso salvo ---------------- */
const SAVE_KEY = "minna-batalha-v1";
const save = Object.assign({ unlocked: 1, best: {}, teacher: false, music: 0.5, sfx: 0.85, fx: true, musicOn: true }, (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } })());
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };

/* ---------------- dados: frases em chunks ---------------- */
const PART = new Set(["は", "が", "を", "に", "で", "へ", "の", "も", "と", "な", "か", "？", "より", "から", "まで", "こと"]);
function guessType(text, chunks) {
  const m = text.match(/^(.*):([SVOAD])$/); if (m) return [m[1], m[2]];
  if (PART.has(text)) return [text, "A"];
  if (text === "だ") return [text, "V"];
  let best = null, score = 0;
  chunks.forEach(c => {
    let p = 0; while (p < c.t.length && p < text.length && c.t[p] === text[p]) p++;
    let s = 0; while (s < c.t.length && s < text.length && c.t[c.t.length - 1 - s] === text[text.length - 1 - s]) s++;
    if (p + s > score) { score = p + s; best = c; }
  });
  if (best) return [text, best.y];
  return [text, /(ます|ません|です|でした|た|て)$/.test(text) ? "V" : "O"];
}
const ALL = [];
LESSONS.forEach(L => L.pts.forEach(P => P.s.forEach((raw, i) => {
  const [c, tr, dec] = raw.split("|").map(x => x.trim());
  const chunks = c.split(/\s+/).map(tok => { const k = tok.lastIndexOf(":"); return { t: tok.slice(0, k), y: tok.slice(k + 1) }; });
  const decs = (dec ? dec.split(",") : []).concat(P.dec || []).map(x => x.trim()).filter(Boolean)
    .map(d => guessType(d, chunks)).filter(([t]) => !chunks.some(ch => ch.t === t))
    .filter((d, j, arr) => arr.findIndex(e => e[0] === d[0]) === j);
  ALL.push({ id: `${L.n}${P.k}${i}`, lesson: L.n, point: P, chunks, pt: tr, decoys: decs.map(([t, y]) => ({ t, y })) });
})));
const sentencesOf = n => ALL.filter(s => s.lesson === n);

/* Aceita a ordem canônica ou, quando todos os blocos-frase anteriores ao predicado
   são sintagmas com partícula de caso (ou expressões de tempo), qualquer permutação deles
   — a ordem das frases nominais em japonês é livre, desde que o predicado fique no fim. */
const CASEP = new Set(["は", "が", "を", "に", "へ", "で", "も", "から", "まで", "より"]);
const FIXED = new Set(["もう", "まだ", "とても", "あまり", "ぜんぜん", "すこし", "ちょっと", "いちばん", "どうぞ", "はい、", "いいえ、", "また", "まっすぐ", "ゆっくり", "はやく", "いっしょに", "だんだん", "ふたり"]);
function groups(chunks) { const g = []; chunks.forEach(c => { if (c.y === "A" && g.length) g.at(-1).push(c); else g.push([c]); }); return g; }
function movable(g) {
  const h = g[0]; if (h.y === "V" || h.y === "A") return false;
  if (g.length === 1) return h.y === "D" && !FIXED.has(h.t) && !h.t.endsWith("、") && !/^[0-9０-９]/.test(h.t);
  return CASEP.has(g.at(-1).t) && g.length === 2;
}
const gstr = g => g.map(c => c.t).join("·");
function isCorrect(answer, sentence) {
  const a = answer.map(c => c.t).join("|"), b = sentence.chunks.map(c => c.t).join("|");
  if (a === b) return true;
  const ga = groups(answer), gb = groups(sentence.chunks);
  if (ga.length !== gb.length || gstr(ga.at(-1)) !== gstr(gb.at(-1))) return false;
  const pre = gb.slice(0, -1);
  if (!pre.every(movable)) return false;
  return ga.slice(0, -1).map(gstr).sort().join("|") === pre.map(gstr).sort().join("|");
}

/* ---------------- estado ---------------- */
const BATTLE_TIME = 210, TURN_TIME = 35;
let mode = "solo";
let G = null;          // batalha atual
let currentLesson = 1;

/* ---------------- telas ---------------- */
function show(id) { ["title", "map", "brief", "game"].forEach(s => $("#" + s).hidden = s !== id); }
function openOv(id) { $("#" + id).hidden = false; }
function closeOv(id) { $("#" + id).hidden = true; }

/* ---------------- mapa ---------------- */
function renderMap() {
  const grid = $("#lessonGrid"); grid.innerHTML = "";
  let tot = 0, stars = 0, wins = 0;
  LESSONS.forEach(L => {
    const b = save.best[L.n] || { score: 0, stars: 0 }, open = save.teacher || L.n <= save.unlocked;
    tot += b.score || 0; stars += b.stars || 0; if (b.stars) wins++;
    const node = el("button", "node" + (open ? "" : " locked") + (L.n === save.unlocked && !b.stars && open ? " next" : ""));
    node.innerHTML = `<span class="num">第${L.n}課 · Lição ${L.n}</span><span class="jp">${esc(L.t)}</span>
      <span class="meta"><span class="stars">${[1, 2, 3].map(i => `<span class="${i <= (b.stars || 0) ? "on" : ""}">★</span>`).join("")}</span><span>${b.score ? b.score.toLocaleString("pt-BR") + " pts" : open ? "Nova" : "Bloqueada"}</span></span>`;
    node.disabled = !open;
    node.setAttribute("aria-label", `Lição ${L.n}: ${L.t}${open ? "" : " (bloqueada)"}`);
    node.onclick = () => { Sound.click(); openBrief(L.n); };
    grid.appendChild(node);
  });
  $("#totScore").textContent = tot.toLocaleString("pt-BR"); $("#totStars").textContent = stars; $("#totWins").textContent = wins;
  $("#modeSolo").setAttribute("aria-pressed", mode === "solo"); $("#modeDuel").setAttribute("aria-pressed", mode === "duel");
  $("#modeNote").innerHTML = mode === "solo"
    ? "<b>Solo vs. Oni:</b> você comanda o Time Sakura contra o computador. Vença para desbloquear a próxima lição."
    : "<b>2 Times:</b> dois times da turma se revezam no mesmo aparelho. Cada time monta uma frase por vez; acertar envia tropas contra o castelo rival. Destruir um castelo conclui a missão e desbloqueia a próxima lição.";
}

/* ---------------- briefing ---------------- */
function openBrief(n) {
  currentLesson = n; const L = LESSONS[n - 1];
  $("#briefEyebrow").textContent = `第${n}課 · Lição ${n} · ${mode === "solo" ? "Solo vs. Oni" : "Duelo de 2 times"}`;
  $("#briefTitle").textContent = L.t;
  $("#briefMission").innerHTML = mode === "solo"
    ? `<strong>Missão:</strong> destrua o 天守閣 (castelo do rei) do Time Oni em ${Math.floor(BATTLE_TIME / 60)}:${String(BATTLE_TIME % 60).padStart(2, "0")}. Monte a frase em japonês com os blocos coloridos: cada acerto envia samurais pela ponte, cada erro libera um ataque Oni. O castelo só fica vulnerável depois que uma das torres 櫓 cair.`
    : `<strong>Missão:</strong> o primeiro time a destruir o 天守閣 do rival vence. Os times jogam em turnos de ${TURN_TIME}s; acerto = tropas no ataque, erro = a vez passa. Combos aumentam o dano.`;
  $("#teamNames").hidden = mode !== "duel";
  $("#briefObjs").innerHTML = L.obj.map(o => `<li>${esc(o)}</li>`).join("");
  $("#briefPoints").innerHTML = L.pts.map(p => `<div class="point"><span class="pk">ポイント ${p.k} — ${esc(p.name)}</span><span class="pf">${esc(p.f)}</span></div>`).join("");
  show("brief");
}

/* ---------------- batalha ---------------- */
function newBattle(n) {
  const L = LESSONS[n - 1];
  const queue = shuffle(sentencesOf(n).slice());
  if (n >= 3) {                                        // revisão espaçada de lições anteriores
    const prev = shuffle(ALL.filter(s => s.lesson < n)).slice(0, 4);
    prev.forEach((s, i) => queue.splice(3 + i * 3, 0, Object.assign({ review: true }, s)));
  }
  G = {
    n, L, queue, qi: 0, mode,
    time: BATTLE_TIME, over: false, paused: false, lock: false,
    turn: "P",
    wave: waveLen(n), waveT: waveLen(n),
    teams: {
      P: { name: mode === "duel" ? ($("#nameP").value.trim() || "Time Sakura") : "Time Sakura 桜", score: 0, combo: 0, maxCombo: 0, right: 0, wrong: 0, hints: 0, crowns: 0, towerBonus: 0 },
      E: { name: mode === "duel" ? ($("#nameE").value.trim() || "Time Oni") : "Time Oni 鬼", score: 0, combo: 0, maxCombo: 0, right: 0, wrong: 0, hints: 0, crowns: 0, towerBonus: 0 }
    },
    misses: [], cur: null, answer: [], deck: [], hintUsed: false, qStart: 0
  };
  World.placeTowers(onTowerHit, onTowerDown);
  buildHpBars();
  $("#hudNameP").textContent = G.teams.P.name; $("#hudNameE").textContent = G.teams.E.name;
  $("#lessonTag").textContent = `第${n}課 · ${mode === "solo" ? "Solo" : "2 Times"}`;
  $("#crownsP").innerHTML = CROWN_SVG.repeat(3); $("#crownsE").innerHTML = CROWN_SVG.repeat(3);
  $("#scoreE").textContent = mode === "duel" ? "0" : "";
  $("#turnBanner").hidden = mode !== "duel";
  show("game"); World.fit();
  updateHud();
  arenaMsg(mode === "solo" ? "はじめ！ Batalha!" : `${G.teams.P.name} começa!`, 1600);
  nextQuestion();
  lastTick = performance.now();
}
const waveLen = n => Math.max(13, 30 - n * 0.7);
function dmgFor(combo) { return 340 * (1 + Math.min(combo - 1, 4) * 0.25); }
function oniDamage(n) { return 210 + n * 6; }

function nextQuestion() {
  if (G.over) return;
  if (G.qi >= G.queue.length) { G.queue = shuffle(G.queue.filter(s => !s.review)); G.qi = 0; }
  const s = G.queue[G.qi++];
  G.cur = s; G.answer = []; G.hintUsed = false; G.qStart = G.time;
  const nDec = G.n <= 4 ? 1 : G.n <= 12 ? 2 : 3;
  const decs = shuffle(s.decoys.slice()).slice(0, nDec);
  let deck;
  do { deck = shuffle(s.chunks.map((c, i) => ({ ...c, key: "c" + i })).concat(decs.map((d, i) => ({ ...d, key: "d" + i })))); }
  while (deck.length > 1 && deck.filter(d => d.key[0] === "c").map(d => d.t).join() === s.chunks.map(c => c.t).join());
  G.deck = deck.map(d => ({ ...d, used: false }));
  $("#ptText").textContent = s.pt;
  $("#pForm").textContent = `L${s.lesson} ${s.point.k} · ${s.point.f}`;
  $("#reviewTag").hidden = !s.review;
  if (G.mode === "duel") {
    const tb = $("#turnBanner"); tb.textContent = "Vez: " + G.teams[G.turn].name; tb.className = "turn-banner " + (G.turn === "P" ? "p" : "e");
    G.waveT = TURN_TIME;
  }
  renderBuilder();
}

function renderBuilder() {
  const slots = $("#slots"), deck = $("#deck");
  slots.innerHTML = ""; deck.innerHTML = "";
  slots.classList.remove("win", "shake");
  G.cur.chunks.forEach((_, i) => {
    const a = G.answer[i];
    if (a) {
      const b = chunkBtn(a); b.classList.add("pop");
      b.onclick = () => { if (G.lock) return; unplace(i); };
      b.setAttribute("aria-label", `Remover ${a.t}`);
      slots.appendChild(b);
    } else slots.appendChild(el("span", "slot", String(i + 1)));
  });
  G.deck.forEach((d, i) => {
    const b = chunkBtn(d); if (d.used) b.classList.add("used");
    b.onclick = () => { if (G.lock || d.used) return; place(i); };
    b.dataset.i = i;
    deck.appendChild(b);
  });
  $("#btnAttack").disabled = G.answer.length !== G.cur.chunks.length || G.lock;
}
function chunkBtn(c) {
  const b = el("button", "chunk t-" + c.y);
  b.innerHTML = `${esc(c.t)}<span class="tg">${TYPE_LABEL[c.y]}</span>`;
  return b;
}
function place(i) {
  if (G.answer.length >= G.cur.chunks.length) return;
  const d = G.deck[i]; d.used = true; G.answer.push(d);
  Sound.place(d.y); renderBuilder();
}
function unplace(slotIdx) {
  const a = G.answer.splice(slotIdx, 1)[0]; if (!a) return;
  const d = G.deck.find(x => x.key === a.key); if (d) d.used = false;
  Sound.unplace(); renderBuilder();
}
function clearAnswer() { G.answer = []; G.deck.forEach(d => d.used = false); Sound.unplace(); renderBuilder(); }
function hint() {
  if (G.lock) return;
  // primeiro bloco que diverge da ordem canônica
  let k = 0; while (k < G.answer.length && G.answer[k].t === G.cur.chunks[k].t) k++;
  while (G.answer.length > k) { const a = G.answer.pop(); const d = G.deck.find(x => x.key === a.key); if (d) d.used = false; }
  const target = G.cur.chunks[k]; if (!target) return;
  G.hintUsed = true; G.teams[G.turn].hints++;
  renderBuilder(); Sound.hint();
  const idx = G.deck.findIndex(d => !d.used && d.t === target.t);
  const btn = $(`#deck .chunk[data-i="${idx}"]`); if (btn) btn.classList.add("hint");
}

function submit() {
  if (G.lock || G.over || G.answer.length !== G.cur.chunks.length) return;
  const side = G.mode === "duel" ? G.turn : "P", T = G.teams[side];
  if (isCorrect(G.answer, G.cur)) {
    T.right++; T.combo++; T.maxCombo = Math.max(T.maxCombo, T.combo);
    const speed = Math.max(0, Math.min(1, G.waveT / (G.mode === "duel" ? TURN_TIME : G.wave)));
    const mult = 1 + Math.min(T.combo - 1, 4) * 0.5;
    let pts = Math.round((100 + speed * 100) * mult); if (G.hintUsed) pts = Math.round(pts / 2);
    T.score += pts;
    const troops = 1 + (T.combo >= 3 ? 1 : 0) + (T.combo >= 5 ? 1 : 0);
    G.lock = true;
    celebrate(pts, T.combo, side);
    setTimeout(() => {
      World.spawnUnits(side, troops, dmgFor(T.combo), side === "P" ? "samurai" : "oni");
      Sound.spawn();
    }, 650);
    setTimeout(() => {
      G.lock = false;
      if (G.mode === "duel") G.turn = G.turn === "P" ? "E" : "P"; else G.waveT = G.wave;
      nextQuestion();
    }, 1250);
  } else {
    T.wrong++; T.combo = 0;
    G.misses.push({ s: G.cur, a: G.answer.slice(), side });
    G.lock = true;
    Sound.error();
    conf = [];
    $("#slots").classList.add("shake");
    flashVignette();
    if (G.mode === "solo") setTimeout(() => oniAttack(true), 400);
    setTimeout(() => showWrong(G.answer.slice(), G.cur), 550);
  }
  updateHud();
}
function showWrong(ans, s) {
  G.paused = true;
  const right = s.chunks.map(c => c.t);
  $("#wrongYours").innerHTML = ""; $("#wrongRight").innerHTML = "";
  ans.forEach((c, i) => { const b = chunkBtn(c); if (c.t !== right[i]) b.classList.add("wrong"); b.disabled = true; $("#wrongYours").appendChild(b); });
  s.chunks.forEach(c => { const b = chunkBtn(c); b.disabled = true; $("#wrongRight").appendChild(b); });
  const e = s.point.err;
  $("#wrongTip").innerHTML = `<b>Erro comum (ポイント ${s.point.k} — ${esc(s.point.name)}):</b> ${esc(e[2])}<span class="ex"><span class="x">✗ ${esc(e[0])}</span><br><span class="o">✓ ${esc(e[1])}</span></span>`;
  openOv("ovWrong");
  setTimeout(() => $("#btnWrongOk").focus(), 50);
}
function afterWrong() {
  closeOv("ovWrong"); G.paused = false; G.lock = false; lastTick = performance.now();
  if (G.mode === "duel") G.turn = G.turn === "P" ? "E" : "P";
  nextQuestion();
}
function oniAttack(fromError) {
  if (G.over) return;
  World.spawnUnits("E", fromError ? 1 : 2, oniDamage(G.n) * (fromError ? 1 : 0.8), "oni");
  Sound.oni();
  G.waveT = G.wave;
  if (!fromError) arenaMsg("鬼が来た！ Ataque Oni!", 1200, "var(--team-e-l)");
}

/* ---------------- torres ---------------- */
let hpEls = [];
function buildHpBars() {
  const arena = $("#arena"); arena.querySelectorAll(".hp,.dmg,.arena-msg").forEach(e => e.remove());
  hpEls = World.towers().map(t => {
    const d = el("div", `hp ${t.side.toLowerCase()} ${t.kind === "tenshu" ? "king" : ""}`, `<div class="val">${t.hp}</div><div class="bar"><div class="fill"></div></div>`);
    arena.appendChild(d); return { t, d, fill: d.querySelector(".fill"), val: d.querySelector(".val") };
  });
}
function updateHpBars() {
  hpEls.forEach(h => {
    const p = World.project(World.V3(h.t.pos.x, h.t.top + 0.5, h.t.pos.z));
    h.d.style.left = p.x + "px"; h.d.style.top = p.y + "px";
    h.fill.style.width = (h.t.hp / h.t.max * 100) + "%"; h.val.textContent = h.t.hp;
    h.d.classList.toggle("dead", !h.t.alive);
  });
}
function onTowerHit(t, dmg) {
  Sound.hit();
  const p = World.project(World.V3(t.pos.x, t.top * 0.6, t.pos.z));
  const d = el("div", "dmg", "-" + dmg); d.style.left = p.x + "px"; d.style.top = p.y + "px";
  $("#arena").appendChild(d); setTimeout(() => d.remove(), 1000);
}
function onTowerDown(t, bySide) {
  Sound.destroy();
  if (!G || G.over) return;
  const att = G.teams[bySide];
  att.crowns++; const bonus = t.kind === "tenshu" ? 600 : 300; att.score += bonus; att.towerBonus += bonus;
  if (save.fx) { $("#app").classList.remove("shake"); void $("#app").offsetWidth; $("#app").classList.add("shake"); }
  if (t.kind === "tenshu") {
    att.crowns = 3; G.lock = true; G.paused = true;
    updateHud();
    setTimeout(() => endBattle(bySide === "P" ? "P" : "E", "king"), 1400);
  } else {
    arenaMsg(bySide === "P" ? "櫓を こわした！ Torre destruída!" : `${G.teams[bySide].name} derrubou uma torre!`, 1500, bySide === "P" ? "var(--gold)" : "var(--team-e-l)");
    updateHud();
  }
}

/* ---------------- HUD / relógio ---------------- */
function updateHud() {
  const P = G.teams.P, E = G.teams.E;
  $("#scoreP").textContent = P.score.toLocaleString("pt-BR");
  if (G.mode === "duel") $("#scoreE").textContent = E.score.toLocaleString("pt-BR");
  $("#subP").textContent = `${P.right} acertos`;
  $("#subE").textContent = G.mode === "duel" ? `${E.right} acertos` : "CPU";
  [["#crownsP", P.crowns], ["#crownsE", E.crowns]].forEach(([s, c]) => $(s).querySelectorAll(".crown").forEach((cr, i) => cr.classList.toggle("on", i < c)));
  const T = G.teams[G.mode === "duel" ? G.turn : "P"], cb = $("#combo");
  cb.textContent = T.combo >= 2 ? `COMBO ×${T.combo}` : "";
  cb.classList.toggle("hot", T.combo >= 3);
}
let lastTick = 0, lastSec = -1;
function tick(now) {
  requestAnimationFrame(tick);
  if (!G || $("#game").hidden) return;
  updateHpBars();
  const dt = Math.min((now - lastTick) / 1000, 0.1); lastTick = now;
  if (G.over || G.paused) return;
  G.time -= dt;
  if (!G.lock) G.waveT -= dt;
  const sec = Math.max(0, Math.ceil(G.time));
  $("#clock").textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  $("#clock").classList.toggle("low", sec <= 30);
  if (sec <= 10 && sec !== lastSec && sec > 0) Sound.tick();
  lastSec = sec;
  const total = G.mode === "duel" ? TURN_TIME : G.wave, w = Math.max(0, G.waveT);
  $("#waveFill").style.transform = `scaleX(${w / total})`;
  const wave = $("#wave");
  if (G.mode === "duel") { wave.classList.toggle("turn-p", G.turn === "P"); $("#waveLabel").textContent = `Vez de ${G.teams[G.turn].name} · ${Math.ceil(w)}s`; }
  else { wave.classList.remove("turn-p"); $("#waveLabel").textContent = `鬼 Ataque Oni em ${Math.ceil(w)}s`; }
  if (G.waveT <= 0 && !G.lock) {
    if (G.mode === "solo") oniAttack(false);
    else {                                             // tempo do turno esgotado: passa a vez
      const T = G.teams[G.turn]; T.combo = 0;
      arenaMsg(`Tempo! Vez de ${G.teams[G.turn === "P" ? "E" : "P"].name}`, 1300);
      G.turn = G.turn === "P" ? "E" : "P"; nextQuestion(); updateHud();
    }
  }
  if (G.time <= 0) endBattle(null, "time");
}

function arenaMsg(text, ms, color) {
  const m = el("div", "arena-msg", esc(text)); if (color) m.style.color = color;
  $("#arena").appendChild(m);
  m.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(.4)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1.1)", offset: 0.2 }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)", offset: 0.8 }, { opacity: 0, transform: "translate(-50%,-70%) scale(1)" }], { duration: ms, easing: "ease-out" });
  setTimeout(() => m.remove(), ms);
}

/* ---------------- fim da batalha ---------------- */
function endBattle(winner, why) {
  if (G.over) return; G.over = true; G.lock = true;
  closeOv("ovWrong");
  const solo = G.mode === "solo";
  let won, title, sub;
  if (solo) {
    won = winner === "P";
    title = won ? "勝利！ Vitória!" : "敗北… Derrota";
    sub = won ? "O castelo do Time Oni caiu. Missão concluída!" : why === "time" ? "O tempo acabou e o castelo inimigo ainda está de pé. Missão incompleta." : "O Time Oni destruiu o seu castelo.";
  } else {
    if (!winner) { const P = G.teams.P, E = G.teams.E; winner = P.crowns > E.crowns ? "P" : E.crowns > P.crowns ? "E" : P.score >= E.score ? "P" : "E"; }
    won = why === "king";
    title = `${G.teams[winner].name} vence!`;
    sub = won ? "Um castelo caiu. Missão concluída!" : "Tempo esgotado: venceu quem tinha mais coroas. Nenhum castelo caiu, então a missão não foi concluída.";
  }
  const P = G.teams.P;
  const acc = P.right + P.wrong ? P.right / (P.right + P.wrong) : 0;
  const lostTowers = World.towers().filter(t => t.side === "P" && !t.alive).length;
  let stars = 0, timeBonus = 0, hpBonus = 0, total = P.score;
  if (solo && won) {
    stars = 1 + (acc >= 0.75 ? 1 : 0) + (acc >= 0.9 && lostTowers === 0 ? 1 : 0);
    timeBonus = Math.round(Math.max(0, G.time) * 5);
    hpBonus = Math.round(World.towers().filter(t => t.side === "P").reduce((s, t) => s + t.hp, 0) / 10);
    total += timeBonus + hpBonus;
  }
  if (!solo && won) stars = 0;
  // progressão: só avança se a missão foi concluída
  let record = false, unlockedNew = false;
  if (won) {
    if (G.n >= save.unlocked && G.n < 25) { save.unlocked = G.n + 1; unlockedNew = true; }
    if (solo) {
      const b = save.best[G.n] || { score: 0, stars: 0 };
      if (total > b.score) record = true;
      save.best[G.n] = { score: Math.max(b.score, total), stars: Math.max(b.stars, stars) };
    }
    persist();
  }
  setTimeout(() => {
    won ? Sound.victory() : Sound.defeat();
    if (won) { World.celebrate(solo ? "P" : winner); confetti(window.innerWidth / 2, window.innerHeight * 0.3, 260); }
    const rs = $("#resultSheet");
    const rows = solo
      ? `<span>Acertos</span><span>${P.right} de ${P.right + P.wrong}</span>
         <span>Precisão</span><span>${Math.round(acc * 100)}%</span>
         <span>Maior combo</span><span>×${P.maxCombo}</span>
         <span>Pontos das frases</span><span>${(P.score - P.towerBonus).toLocaleString("pt-BR")}</span>
         <span>Torres destruídas</span><span>+${P.towerBonus.toLocaleString("pt-BR")}</span>
         ${won ? `<span>Bônus de tempo</span><span>+${timeBonus.toLocaleString("pt-BR")}</span><span>Bônus de defesa</span><span>+${hpBonus.toLocaleString("pt-BR")}</span>` : ""}
         <span class="tot">Total</span><span class="tot">${total.toLocaleString("pt-BR")}</span>`
      : ["P", "E"].map(s => { const T = G.teams[s]; return `<span><b>${esc(T.name)}</b> · ${T.right}/${T.right + T.wrong} acertos · combo ×${T.maxCombo}</span><span>${T.score.toLocaleString("pt-BR")}</span>`; }).join("");
    const misses = G.misses.slice(-6).map(m => `<div class="item"><span>${esc(m.s.pt)}</span><div class="mini">${m.s.chunks.map(c => chunkBtn(c).outerHTML).join("")}</div></div>`).join("");
    const next = won && G.n < 25;
    rs.innerHTML = `
      <div class="result-title ${won ? "win" : "lose"}">${esc(title)}</div>
      <p style="text-align:center;margin:0;color:var(--muted)">${esc(sub)}</p>
      ${solo && won ? `<div class="big-stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? "on" : ""}" style="animation-delay:${i * 0.25}s">★</span>`).join("")}</div>` : ""}
      ${record ? `<span class="record">Novo recorde!</span>` : ""}
      ${unlockedNew ? `<span class="record">Lição ${G.n + 1} desbloqueada!</span>` : ""}
      <div class="breakdown">${rows}</div>
      ${solo && won ? `<p class="small" style="margin:0">★ vitória · ★★ precisão ≥ 75% · ★★★ precisão ≥ 90% sem perder torres</p>` : ""}
      ${misses ? `<div><div class="eyebrow" style="margin-bottom:6px;color:var(--gold);font-weight:800;font-size:12px;letter-spacing:.1em">FRASES PARA REVISAR</div><div class="review-list">${misses}</div></div>` : ""}
      <div class="row-btns">
        <button class="btn ghost" id="rMap">Mapa</button>
        <button class="btn" id="rAgain">Jogar de novo</button>
        ${next ? `<button class="btn gold" id="rNext">Próxima batalha →</button>` : ""}
      </div>`;
    rs.querySelectorAll(".mini .chunk").forEach(b => b.disabled = true);
    openOv("ovResult");
    $("#rMap").onclick = () => { closeOv("ovResult"); World.clearUnits(); renderMap(); show("map"); };
    $("#rAgain").onclick = () => { closeOv("ovResult"); newBattle(G.n); };
    if (next) $("#rNext").onclick = () => { closeOv("ovResult"); World.clearUnits(); openBrief(G.n + 1); };
  }, 900);
}

/* ---------------- poluição visual do acerto ---------------- */
const WORDS = ["すごい！", "かんぺき！", "やった！", "じょうず！", "さいこう！", "いいね！", "せいかい！"];
function celebrate(pts, combo, side) {
  const strong = save.fx && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  Sound.success(combo);
  $("#slots").classList.add("win");
  const sp = $("#splash");
  sp.innerHTML = `<div class="w">${WORDS[Math.floor(Math.random() * WORDS.length)]}</div><div class="s">+${pts} pts${combo >= 2 ? ` · COMBO ×${combo}` : ""}</div>`;
  sp.querySelectorAll("div").forEach(d => { d.style.animation = "none"; void d.offsetWidth; d.style.animation = ""; });
  if (strong) {
    const fl = $("#flash");
    fl.style.background = combo >= 3 ? "radial-gradient(circle, #fff 0%, #ffd64d 40%, #ff5f6d 100%)" : "radial-gradient(circle, #fff, #ffe7a0)";
    fl.classList.remove("go"); void fl.offsetWidth; fl.classList.add("go");
    const bu = $("#burst"); bu.classList.remove("go"); void bu.offsetWidth; bu.classList.add("go");
    const app = $("#app"); app.classList.remove("shake"); void app.offsetWidth; app.classList.add("shake");
  }
  const r = $("#slots").getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2, strong ? 160 + combo * 40 : 50);
  if (strong) {
    setTimeout(() => confetti(window.innerWidth * 0.15, window.innerHeight * 0.35, 70), 120);
    setTimeout(() => confetti(window.innerWidth * 0.85, window.innerHeight * 0.35, 70), 220);
  }
  flyChunks(side);
}
function flyChunks(side) {                            // os blocos voam para o reino inimigo e explodem
  const arena = $("#arena").getBoundingClientRect();
  const target = World.project(World.V3(0, 2, side === "P" ? -8 : 8));
  $("#slots").querySelectorAll(".chunk").forEach((c, i) => {
    const r = c.getBoundingClientRect(), f = c.cloneNode(true);
    f.classList.add("fly"); f.classList.remove("pop");
    Object.assign(f.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", margin: 0 });
    document.body.appendChild(f);
    const dx = arena.left + target.x - r.left - r.width / 2 + (Math.random() - 0.5) * 80, dy = arena.top + target.y - r.top - r.height / 2;
    const a = f.animate([{ transform: "translate(0,0) scale(1) rotate(0)", opacity: 1 }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 90}px) scale(1.25) rotate(${(Math.random() - 0.5) * 60}deg)`, opacity: 1, offset: 0.5 }, { transform: `translate(${dx}px,${dy}px) scale(.3) rotate(${(Math.random() - 0.5) * 360}deg)`, opacity: 0.2 }], { duration: 650, delay: i * 45, easing: "cubic-bezier(.5,0,.7,1)", fill: "forwards" });
    a.onfinish = () => { f.remove(); confetti(arena.left + target.x, arena.top + target.y, 18); };
  });
}
function flashVignette() { const v = $("#vignette"); v.classList.remove("go"); void v.offsetWidth; v.classList.add("go"); }

/* confete 2D: retângulos, pétalas e estrelas */
const fx = $("#fx"), fctx = fx.getContext("2d"); let conf = [], fxRun = false;
function sizeFx() { const d = Math.min(window.devicePixelRatio || 1, 2); fx.width = innerWidth * d; fx.height = innerHeight * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
addEventListener("resize", sizeFx); sizeFx();
const CCOL = ["#8fd67f", "#ffd64d", "#c49df2", "#ffa092", "#80b6f2", "#ffffff", "#ff5f6d", "#f4b833"];
function confetti(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 11;
    conf.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: CCOL[i % CCOL.length], k: Math.random() < 0.15 ? 2 : Math.random() < 0.3 ? 1 : 0, sz: 5 + Math.random() * 7, life: 1 });
  }
  if (!fxRun) { fxRun = true; requestAnimationFrame(drawFx); }
}
function drawFx() {
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  conf = conf.filter(p => p.life > 0 && p.y < innerHeight + 40);
  conf.forEach(p => {
    p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.008;
    fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.globalAlpha = Math.min(1, p.life * 2); fctx.fillStyle = p.c;
    if (p.k === 0) fctx.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2);
    else if (p.k === 1) { fctx.fillStyle = "#ffc4da"; fctx.beginPath(); fctx.ellipse(0, 0, p.sz * 0.7, p.sz * 0.4, 0, 0, Math.PI * 2); fctx.fill(); }
    else { fctx.beginPath(); for (let j = 0; j < 10; j++) { const rr = j % 2 ? p.sz * 0.45 : p.sz; fctx.lineTo(Math.cos(j * Math.PI / 5) * rr, Math.sin(j * Math.PI / 5) * rr); } fctx.fill(); }
    fctx.restore();
  });
  if (conf.length) requestAnimationFrame(drawFx); else { fxRun = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
}

/* fundo animado da tela de título: chunks coloridos flutuando */
function titleBg() {
  const c = $("#titleBg"), g = c.getContext("2d"), words = ALL.slice(0, 80).flatMap(s => s.chunks).filter((v, i, a) => a.findIndex(x => x.t === v.t) === i).slice(0, 40);
  const col = { S: "#8fd67f", V: "#ffd64d", O: "#c49df2", A: "#ffa092", D: "#80b6f2" };
  const items = words.map(w => ({ w, x: Math.random(), y: Math.random(), v: 0.0004 + Math.random() * 0.0008, s: 0.6 + Math.random() * 0.6 }));
  function draw() {
    if ($("#title").hidden) { requestAnimationFrame(draw); return; }
    const d = Math.min(devicePixelRatio || 1, 2); if (c.width !== c.clientWidth * d) { c.width = c.clientWidth * d; c.height = c.clientHeight * d; }
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, c.clientWidth, c.clientHeight);
    items.forEach(it => {
      it.y -= it.v; if (it.y < -0.1) { it.y = 1.1; it.x = Math.random(); }
      const fs = 18 * it.s; g.font = `800 ${fs}px "M PLUS Rounded 1c", sans-serif`;
      const w = g.measureText(it.w.t).width + 18, x = it.x * c.clientWidth, y = it.y * c.clientHeight;
      g.globalAlpha = 0.18; g.fillStyle = col[it.w.y]; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, fs * 1.7, 8) : g.rect(x, y, w, fs * 1.7); g.fill();
      g.globalAlpha = 0.32; g.fillStyle = "#1c1730"; g.fillText(it.w.t, x + 9, y + fs * 1.2);
    });
    g.globalAlpha = 1; requestAnimationFrame(draw);
  }
  draw();
}

/* ---------------- controles ---------------- */
function syncMusicBtns() { ["#btnMusic", "#btnMusic2"].forEach(s => { const b = $(s); b.innerHTML = MUSIC_SVG; b.classList.toggle("off", !save.musicOn); }); }
function toggleMusic() { save.musicOn = !save.musicOn; Sound.setMusic(save.musicOn); syncMusicBtns(); persist(); }
function pause() { if (!G || G.over || G.paused || !$("#ovWrong").hidden) return; G.paused = true; openOv("ovPause"); }
function resume() { closeOv("ovPause"); if (G) { G.paused = false; lastTick = performance.now(); } }
function openSettings() {
  $("#volMusic").value = save.music; $("#volSfx").value = save.sfx; $("#optFx").checked = save.fx; $("#optTeacher").checked = save.teacher;
  $("#btnReset").textContent = "Zerar progresso"; $("#btnReset").dataset.armed = "";
  openOv("ovSettings");
}

function bind() {
  $("#btnStart").onclick = () => { Sound.init(); Sound.setMusicVol(save.music); Sound.setSfxVol(save.sfx); Sound.setMusic(save.musicOn); Sound.startMusic(); Sound.click(); renderMap(); show("map"); };
  $("#btnSettings1").onclick = $("#btnSettings2").onclick = () => { Sound.init(); openSettings(); };
  $("#modeSolo").onclick = () => { mode = "solo"; Sound.click(); renderMap(); };
  $("#modeDuel").onclick = () => { mode = "duel"; Sound.click(); renderMap(); };
  $("#btnBriefBack").onclick = () => { renderMap(); show("map"); };
  $("#btnFight").onclick = () => { Sound.init(); Sound.startMusic(); newBattle(currentLesson); };
  $("#btnClear").onclick = () => !G.lock && clearAnswer();
  $("#btnHint").onclick = hint;
  $("#btnAttack").onclick = submit;
  $("#btnWrongOk").onclick = afterWrong;
  $("#btnPause").onclick = pause;
  $("#btnResume").onclick = resume;
  $("#btnRestart").onclick = () => { closeOv("ovPause"); World.clearUnits(); newBattle(G.n); };
  $("#btnQuit").onclick = () => { closeOv("ovPause"); G.over = true; World.clearUnits(); renderMap(); show("map"); };
  $("#btnMusic").onclick = $("#btnMusic2").onclick = () => { Sound.init(); Sound.startMusic(); toggleMusic(); };
  $("#volMusic").oninput = e => { save.music = +e.target.value; Sound.setMusicVol(save.music); persist(); };
  $("#volSfx").oninput = e => { save.sfx = +e.target.value; Sound.setSfxVol(save.sfx); persist(); Sound.click(); };
  $("#optFx").onchange = e => { save.fx = e.target.checked; persist(); };
  $("#optTeacher").onchange = e => { save.teacher = e.target.checked; persist(); renderMap(); };
  $("#btnReset").onclick = e => {
    const b = e.currentTarget;
    if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Clique de novo para confirmar"; return; }
    Object.assign(save, { unlocked: 1, best: {} }); persist(); renderMap(); b.dataset.armed = ""; b.textContent = "Progresso zerado";
  };
  $("#btnSettingsOk").onclick = () => closeOv("ovSettings");
  addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT") return;
    if (e.key.toLowerCase() === "m") { Sound.init(); toggleMusic(); }
    if ($("#game").hidden || !G) return;
    if (e.key === "Escape") { $("#ovPause").hidden ? pause() : resume(); }
    if (G.paused || G.over) { if (e.key === "Enter" && !$("#ovWrong").hidden) { e.preventDefault(); afterWrong(); } return; }
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    if (e.key === "Backspace" && G.answer.length && !G.lock) { e.preventDefault(); unplace(G.answer.length - 1); }
    const k = parseInt(e.key, 10);                     // teclas 1–9: escolhe o bloco
    if (k >= 1 && k <= 9 && !G.lock) { const free = G.deck.map((d, i) => [d, i]); const it = free[k - 1]; if (it && !it[0].used) place(it[1]); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
}

/* ---------------- início ---------------- */
async function boot() {
  bind(); syncMusicBtns(); titleBg();
  try { await World.init($("#three"), $("#arena")); } catch (e) { console.error(e); }
  requestAnimationFrame(tick);
}
boot();
window.__minna = { ALL, isCorrect, groups };   // para testes
})();
