/* TOPIK Estudos — app offline. Dados: data.js (planilha) + extra.js (listas de revisão). */
(function () {
  "use strict";
  const D = window.TOPIK_DATA, X = window.TOPIK_EXTRA;
  const A = window.Android || null;
  const DAY = 86400000;
  const CAT = X.categorias;

  const store = {
    get(k, def) { try { const v = A ? A.getItem(k) : localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { const s = JSON.stringify(v); try { A ? A.setItem(k, s) : localStorage.setItem(k, s); } catch (e) {} }
  };

  // ---------- Cartões: vocabulário (v) + gramática (g) ----------
  const cards = [];
  D.vocab.forEach(v => cards.push(Object.assign({ key: "v" + v.id, tipo: "v" }, v)));
  D.gramatica.forEach(g => cards.push({ key: "g" + g.id, tipo: "g", cat: g.cat, p: g.p, ko: g.pad, pt: g.sig, ex: g.ex, expt: g.expt,
    wrong: g.erro, nota: g.nota, niv: g.niv, pag: g.pag, aula: g.aula, tema: "gramática", g }));
  const ordIdx = c => { const i = X.ordem.findIndex(([cat, p]) => cat === c.cat && (!p || p === c.p)); return i < 0 ? 99 : i; };
  cards.sort((a, b) => ordIdx(a) - ordIdx(b) || (a.tipo === b.tipo ? 0 : a.tipo === "v" ? -1 : 1) || (a.id || 0) - (b.id || 0));
  const TEMAS = [...new Set(D.vocab.map(v => v.tema))].sort();

  let S = store.get("state", null) || {};
  const fresh = () => { S.srs = S.srs || {}; S.cfg = Object.assign({ novos: 15, reverso: false, rate: 0.9 }, S.cfg || {}); S.days = S.days || {}; S.hist = S.hist || []; S.gram = S.gram || {}; S.mine = S.mine || {}; };
  fresh();
  const save = () => store.set("state", S);
  const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = () => ymd(new Date());
  const dayRec = () => (S.days[today()] = S.days[today()] || { novos: 0, revs: 0, ok: 0 });
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function streak() {
    let n = 0; const d = new Date(); if (!S.days[today()]) d.setDate(d.getDate() - 1);
    for (;;) { const r = S.days[ymd(d)]; if (!r || (r.novos + r.revs + (r.treino || 0)) === 0) break; n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // Filtro: {cat, p, tipo, tema, all}. Sem filtro: tudo menos gramática P3 (lista de referência).
  function matches(c, f) {
    if (!f) return c.p !== "P3";
    if (f.cat && c.cat !== f.cat) return false;
    if (f.p && c.p !== f.p) return false;
    if (f.tipo && c.tipo !== f.tipo) return false;
    if (f.tema && c.tema !== f.tema) return false;
    if (!f.all && !f.p && c.p === "P3") return false;
    return true;
  }
  const newQueue = f => cards.filter(c => !S.srs[c.key] && matches(c, f));
  function dueList(f) {
    const end = startOfToday() + DAY;
    return cards.filter(c => S.srs[c.key] && S.srs[c.key].due < end && matches(c, f)).sort((a, b) => S.srs[a.key].due - S.srs[b.key].due);
  }
  const status = c => { const s = S.srs[c.key]; return !s ? 0 : (s.i >= 21 ? 2 : 1); };

  function nextIvl(s, q) {
    if (s.n === 0) return q === 4 ? 3 : 1;
    if (s.n === 1) return q === 2 ? 3 : q === 4 ? 8 : 6;
    return Math.round(s.i * (q === 2 ? 1.2 : q === 4 ? s.e * 1.3 : s.e));
  }
  function grade(c, q) {
    const now = Date.now(); let s = S.srs[c.key]; const isNew = !s;
    if (!s) s = { i: 0, e: 2.5, n: 0, lapses: 0 };
    if (q === 1) { s.n = 0; s.lapses++; s.e = Math.max(1.3, s.e - 0.2); s.i = 0; s.due = now + 60000; }
    else { s.i = nextIvl(s, q); s.e = Math.max(1.3, s.e + (q === 2 ? -0.15 : q === 4 ? 0.15 : 0)); s.n++; s.due = startOfToday() + s.i * DAY + 4 * 3600000; }
    S.srs[c.key] = s;
    const r = dayRec(); if (isNew) r.novos++; else r.revs++; if (q > 1) r.ok++;
    save();
  }
  const ivlLabel = (c, q) => { if (q === 1) return "agora"; const i = nextIvl(S.srs[c.key] || { i: 0, e: 2.5, n: 0 }, q); return i < 30 ? i + "d" : Math.round(i / 30) + "m"; };

  // ---------- Hangul ----------
  const isSyl = ch => ch >= "가" && ch <= "힣";
  const dec = ch => { const n = ch.charCodeAt(0) - 0xAC00; return [Math.floor(n / 588), Math.floor((n % 588) / 28), n % 28]; };
  const com = (l, v, t) => String.fromCharCode(0xAC00 + l * 588 + v * 28 + t);
  const SW_V = { 4: [6], 6: [4], 1: [5], 5: [1], 8: [13], 13: [8, 18], 18: [13], 11: [10, 15], 10: [11, 15], 15: [10, 11], 2: [6], 7: [3] };
  const SW_L = { 0: [1, 15], 1: [0], 3: [4, 16], 4: [3], 7: [8, 17], 8: [7], 9: [10], 10: [9], 12: [13, 14], 13: [12], 14: [12], 11: [18] };
  const SW_T = { 4: [21, 0], 21: [4, 0], 1: [2, 0], 8: [0, 16], 16: [17, 8], 17: [16], 19: [7, 20], 7: [19], 0: [4, 21, 8] };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function mutate(w) {
    const chars = [...w]; const idx = chars.map((c, i) => isSyl(c) ? i : -1).filter(i => i >= 0);
    if (!idx.length) return w;
    const i = pick(idx); let [l, v, t] = dec(chars[i]); const r = Math.random();
    if (r < 0.3 && SW_V[v]) v = pick(SW_V[v]);
    else if (r < 0.55 && SW_T[t]) t = pick(SW_T[t]);
    else if (r < 0.75 && SW_L[l]) l = pick(SW_L[l]);
    else if (r < 0.88 && idx.indexOf(i - 1) >= 0 && l === 11) l = dec(chars[i - 1])[0]; // copiar consoante vizinha (강아지 → 강가지)
    else if (idx.length >= 2) { chars.splice(i, 0, com(dec(chars[pick(idx)])[0], v, 0)); return chars.join(""); } // sílaba inserida
    else if (SW_V[v]) v = pick(SW_V[v]);
    chars[i] = com(l, v, t); return chars.join("");
  }
  const cleanKo = s => String(s || "").replace(/\(.*?\)/g, "").replace(/['“”"]/g, "").trim();
  const isPureKo = s => /^[가-힣 ]+$/.test(s);
  const firstForm = c => cleanKo(String(c.ko).split(/\s*[\/·→×]\s*/)[0]);
  function spellOpts(c) {
    const right = firstForm(c); if (!isPureKo(right)) return null;
    const out = new Set();
    if (c.wrong) String(c.wrong).split(/\s*[\/·]\s*/).map(x => cleanKo(x.split("=")[0])).forEach(x => { if (isPureKo(x) && x !== right && x.replace(/ /g, "").length === right.replace(/ /g, "").length + (x.length - right.length)) out.add(x); });
    let guard = 0; while (out.size < 3 && guard++ < 100) { const m = mutate(right); if (m !== right) out.add(m); }
    return out.size >= 2 ? { right, wrong: [...out].slice(0, 3) } : null;
  }
  const normKo = s => cleanKo(s).replace(/[\s.,!?~·]/g, "");
  function koAlternatives(c) { return String(c.ko).split(/\s*[\/·→×]\s*/).map(normKo).filter(Boolean); }

  // ---------- Áudio ----------
  function speak(t) {
    if (!t) return;
    t = String(t).replace(/[㐀-鿿]+/g, " ").replace(/[A-Za-zÀ-ú=…\/()]+/g, " ").replace(/^\s*-/, "");
    if (A && A.speak) { A.speak(t, S.cfg.rate); return; }
    if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(t); u.lang = "ko-KR"; u.rate = S.cfg.rate; speechSynthesis.cancel(); speechSynthesis.speak(u); }
  }
  const sayText = c => c.tipo === "g" ? (c.ex || "") : firstForm(c) || c.ko;

  // ---------- UI ----------
  const $ = s => document.querySelector(s);
  const view = $("#view");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const sample = (a, n) => shuffle(a).slice(0, n);
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 2200); }
  function h(html) { view.innerHTML = html; view.scrollTop = 0; }
  const fmtDate = iso => iso.split("-").reverse().join("/");
  const speakBtn = t => t ? `<button class="speak" data-say="${esc(t)}" aria-label="Ouvir">🔊</button>` : "";
  const koSize = s => { const n = [...String(s)].length; return n <= 4 ? 52 : n <= 8 ? 40 : n <= 14 ? 30 : 24; };
  const bigKo = s => `<div class="big-hz" style="font-size:${koSize(s)}px">${esc(s)}</div>`;
  const catTag = c => `<span class="tag" style="color:${CAT[c.cat].cor}">${CAT[c.cat].nome}${c.p ? " " + c.p : ""}</span>`;
  view.addEventListener("click", e => { const b = e.target.closest("[data-say]"); if (b) { e.stopPropagation(); speak(b.dataset.say); } });

  let stack = [], current = null;
  function go(fn, title, push = true) {
    if (push && current) stack.push(current);
    current = { fn, title };
    $("#title").textContent = title || "TOPIK Estudos";
    $("#back").hidden = stack.length === 0;
    const st = streak(); $("#streak").textContent = st ? "🔥 " + st + (st === 1 ? " dia" : " dias") : "";
    fn();
  }
  function back() { if (!stack.length) return false; const p = stack.pop(); go(p.fn, p.title, false); return true; }
  window.onAndroidBack = back; $("#back").onclick = back;
  function tab(name) {
    document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
    stack = []; current = null;
    ({ hoje: () => go(viewHoje, "TOPIK Estudos"), cartoes: () => go(viewCartoes, "Cartões"), treinar: () => go(viewTreinar, "Treinar"),
       gramatica: () => go(viewGramatica, "Gramática"), mais: () => go(viewMais, "Mais") })[name]();
  }
  document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => tab(b.dataset.tab));

  function groups() { // grupos na ordem do plano
    return X.ordem.map(([cat, p]) => ({ cat, p, nome: CAT[cat].nome + (p ? " " + p : ""), f: p ? { cat, p } : { cat } }))
      .concat([{ cat: "avancar", p: "P3", nome: "Avançar P3 (gramática de referência)", f: { cat: "avancar", p: "P3" } }]);
  }

  // ---------- HOJE ----------
  function viewHoje() {
    const rec = S.days[today()] || { novos: 0, revs: 0, ok: 0 };
    const due = dueList().length, novosRest = Math.max(0, S.cfg.novos - rec.novos);
    const def = cards.filter(c => matches(c, null)), vist = def.filter(c => S.srs[c.key]).length;
    const p1End = cards.filter(c => ordIdx(c) <= 2), p1Seen = p1End.filter(c => S.srs[c.key]).length;
    h(`<div class="card"><div class="row"><div class="grow"><b>Estudo de hoje</b><div class="small muted">${due} revisões · ${novosRest} novos disponíveis</div></div>
        <button class="btn primary" id="go-study">${due + novosRest ? "Estudar" : "Concluído ✓"}</button></div>
        <div class="grid2 mt"><div class="stat"><b>${rec.revs}</b><small>revisados hoje</small></div><div class="stat"><b>${rec.novos}</b><small>novos hoje</small></div></div></div>
      <div class="card"><div class="small"><b>Meta 1: até o fim do Avançar P1</b> · ${p1Seen}/${p1End.length} cartões (Melhorar + Fixar + P1)</div>
        <div class="bar" style="margin:6px 0 4px"><i style="width:${(100 * p1Seen / p1End.length).toFixed(1)}%"></i></div>
        <div class="small muted">Faltam ~${Math.ceil((p1End.length - p1Seen) / S.cfg.novos)} dias com ${S.cfg.novos} novos/dia.</div></div>
      <div class="grid2">${X.datas.map(d => { const n = Math.ceil((new Date(d.data + "T09:00:00") - Date.now()) / DAY);
        return `<div class="card stat"><b>${n > 0 ? n : "—"}</b><small>dias até ${esc(d.nome)}<br>${fmtDate(d.data)} ${d.obs ? "· " + esc(d.obs) : ""}</small></div>`; }).join("")}</div>
      <h2>Progresso (${vist} de ${def.length} cartões vistos)</h2>
      <div class="card">${groups().slice(0, 5).map(g => {
        const cs = cards.filter(c => matches(c, g.f)), v = cs.filter(c => S.srs[c.key]).length, dm = cs.filter(c => status(c) === 2).length;
        return `<div class="small"><b style="color:${CAT[g.cat].cor}">${g.nome}</b> · ${v}/${cs.length} vistos · ${dm} dominados</div><div class="bar" style="margin:6px 0 12px"><i style="width:${(100 * v / cs.length).toFixed(1)}%;background:${CAT[g.cat].cor}"></i></div>`;
      }).join("")}<div class="small muted">Dominado = intervalo de revisão ≥ 21 dias.</div></div>
      <h2>Rotina diária</h2><div class="card small">${X.dicas.map(d => "• " + esc(d)).join("<br>")}</div>
      <div class="menu">
        <button class="item" id="q-graf"><span class="ico">맞</span><span><b>Grafia: 10 palavras</b><small>ㅓ×ㅕ, ㄴ×ㅇ, sílaba copiada</small></span></button>
        <button class="item" id="q-dit"><span class="ico">듣</span><span><b>Ditado: 10 palavras</b><small>Ouça e escreva em 한글</small></span></button>
        <button class="item" id="q-mont"><span class="ico">문</span><span><b>Montar 5 frases</b><small>Gramática com exemplo</small></span></button>
      </div>`);
    $("#go-study").onclick = () => go(() => study(null), "Cartões de hoje");
    $("#q-graf").onclick = () => go(() => grafia(trainBase(), 10), "Grafia");
    $("#q-dit").onclick = () => go(() => ditado(trainBase(), 10), "Ditado");
    $("#q-mont").onclick = () => go(() => montar(sample(gramWithEx(), 5), 0, 0), "Montar frases");
  }
  const trainBase = () => { const s = cards.filter(c => c.tipo === "v" && S.srs[c.key]); return s.length >= 10 ? s : cards.filter(c => c.tipo === "v" && ordIdx(c) <= 2); };

  // ---------- CARTÕES ----------
  function viewCartoes() {
    h(`<div class="card"><div class="row"><div class="grow"><b>Fila do plano</b><div class="small muted">${dueList().length} para revisar · ${newQueue().length} novos · Melhorar → Fixar → Avançar P1 → Rever → Avançar P2</div></div>
       <button class="btn primary" id="all">Estudar</button></div></div>
       <div class="seg"><button data-t="" class="on">Tudo</button><button data-t="v">Vocabulário</button><button data-t="g">Gramática</button></div>
       <div class="menu" id="grp"></div>
       <h2>Vocabulário por tema</h2><div class="menu" id="temas"></div>
       <h2>Opções</h2><div class="card">
         <label class="toggle"><span class="grow">Novos por dia</span><select id="novos" style="width:90px">${[5, 10, 15, 20, 25, 30].map(n => `<option ${n === S.cfg.novos ? "selected" : ""}>${n}</option>`).join("")}</select></label>
         <label class="toggle"><span class="grow">Também treinar Português → 한국어</span><input type="checkbox" id="rev" ${S.cfg.reverso ? "checked" : ""}></label></div>`);
    let tipo = "";
    const draw = () => {
      $("#grp").innerHTML = groups().map((g, k) => {
        const f = Object.assign({}, g.f, tipo ? { tipo } : {}); const cs = cards.filter(c => matches(c, f)); if (!cs.length) return "";
        const v = cs.filter(c => S.srs[c.key]).length;
        return `<button class="item" data-k="${k}"><span class="ico" style="color:${CAT[g.cat].cor}">${CAT[g.cat].ico}</span><span class="grow"><b>${esc(g.nome)}</b><small>${v}/${cs.length} vistos · ${esc(CAT[g.cat].desc)}</small></span></button>`;
      }).join("");
      $("#grp").querySelectorAll("[data-k]").forEach(b => b.onclick = () => { const g = groups()[+b.dataset.k]; const f = Object.assign({}, g.f, tipo ? { tipo } : {}); go(() => study(f), g.nome); });
    };
    view.querySelectorAll(".seg button").forEach(b => b.onclick = () => { tipo = b.dataset.t; view.querySelectorAll(".seg button").forEach(x => x.classList.toggle("on", x === b)); draw(); });
    draw();
    $("#temas").innerHTML = TEMAS.map(t => { const cs = cards.filter(c => c.tema === t); const v = cs.filter(c => S.srs[c.key]).length;
      return `<button class="item" data-tema="${esc(t)}"><span class="grow"><b>${esc(t)}</b><small>${v}/${cs.length} vistos</small><div class="bar" style="margin-top:6px"><i style="width:${100 * v / cs.length}%"></i></div></span></button>`; }).join("");
    $("#temas").querySelectorAll("[data-tema]").forEach(b => b.onclick = () => go(() => study({ tema: b.dataset.tema, all: true }), b.dataset.tema));
    $("#all").onclick = () => go(() => study(null), "Cartões");
    $("#novos").onchange = e => { S.cfg.novos = +e.target.value; save(); };
    $("#rev").onchange = e => { S.cfg.reverso = e.target.checked; save(); };
  }

  function backHtml(c) {
    if (c.tipo === "g") return `<div class="pt">${esc(c.pt)}</div>
      ${c.ex ? `<div class="row mt"><div class="grow"><div class="mid-hz" style="font-size:20px">${esc(c.ex)}</div><div class="small muted">${esc(c.expt)}</div></div>${speakBtn(c.ex)}</div>` : ""}
      ${c.wrong ? `<div class="fix"><b>✗ caderno:</b> ${esc(c.wrong)}</div>` : ""}${c.nota ? `<div class="small muted mt">${esc(c.nota)}</div>` : ""}
      <div class="small muted center mt">${[c.niv, c.aula ? "aula " + c.aula : "", c.pag && c.pag !== "—" ? "p." + c.pag : ""].filter(Boolean).map(esc).join(" · ")}</div>`;
    return `<div class="row" style="justify-content:center"><div class="pt">${esc(c.pt)}</div>${speakBtn(sayText(c))}</div>
      ${c.hj ? `<div class="center" style="font-size:22px;margin-top:4px">${esc(c.hj)}</div>` : ""}
      ${c.ex ? `<div class="row mt"><div class="grow small" style="font-size:16px">${esc(c.ex)}</div>${speakBtn(c.ex)}</div>` : ""}
      ${c.wrong ? `<div class="fix"><b>✗ caderno:</b> <span class="wrong">${esc(c.wrong)}</span>${c.nota ? "<br>" + esc(c.nota) : ""}</div>` : ""}
      <div class="small muted center mt">${[esc(c.tema), c.niv, c.pag ? "p." + c.pag : "", c.freq ? "freq. #" + c.freq : ""].filter(Boolean).join(" · ")}</div>`;
  }

  function study(filter) {
    const rec = dayRec();
    let queue = dueList(filter).concat(newQueue(filter).slice(0, Math.max(0, S.cfg.novos - rec.novos)));
    let done = 0;
    const next = () => {
      queue = queue.concat(dueList(filter).filter(c => queue.indexOf(c) < 0 && S.srs[c.key].due <= Date.now()));
      if (!queue.length) {
        h(`<div class="card center"><div class="big-hz">잘했어요!</div><p><b>Sessão concluída.</b><br><span class="muted">${done} cartões estudados.</span></p>
           <div class="btns"><button class="btn" id="more">+${S.cfg.novos} novos mesmo assim</button></div></div>`);
        $("#more").onclick = () => { rec.novos -= S.cfg.novos; save(); study(filter); }; return;
      }
      const c = queue.shift();
      const reverse = S.cfg.reverso && c.tipo === "v" && S.srs[c.key] && Math.random() < 0.5;
      const front = reverse ? `<div class="pt" style="font-size:24px">${esc(c.pt)}</div><div class="center small muted mt">Como se diz em coreano?</div>`
        : c.tipo === "g" ? `<div class="center small muted">Gramática</div><div class="mid-hz center" style="font-size:${koSize(c.ko) - 6}px">${esc(c.ko)}</div><div class="center small muted mt">O que significa? Faça uma frase.</div>`
        : bigKo(c.ko);
      h(`<div class="card flash"><div class="meta">${catTag(c)}<span>${queue.length + 1} restantes</span></div>${front}<div id="ans"></div></div>
         <button class="btn primary block" id="show">Mostrar resposta</button><div id="gr"></div>`);
      if (!reverse && c.tipo === "v") speak(sayText(c));
      $("#show").onclick = () => {
        $("#show").remove();
        $("#ans").innerHTML = `<div class="answer">${reverse ? bigKo(c.ko) : ""}${backHtml(c)}</div>`;
        if (reverse) speak(sayText(c));
        $("#gr").innerHTML = `<div class="grade">${[[1, "Errei"], [2, "Difícil"], [3, "Bom"], [4, "Fácil"]].map(([q, l]) => `<button class="btn g${q}" data-q="${q}">${l}<small>${ivlLabel(c, q)}</small></button>`).join("")}</div>`;
        $("#gr").querySelectorAll("[data-q]").forEach(b => b.onclick = () => { grade(c, +b.dataset.q); done++; next(); });
      };
    };
    next();
  }

  // ---------- TREINAR ----------
  let TF = { src: "vistas" };
  function trainPool() {
    const v = cards.filter(c => c.tipo === "v");
    if (TF.src === "vistas") { const s = v.filter(c => S.srs[c.key]); if (s.length >= 8) return s; return v.filter(c => ordIdx(c) <= 2); }
    if (TF.src === "erradas") { const s = v.filter(c => S.srs[c.key] && S.srs[c.key].lapses > 0); if (s.length >= 4) return s; return v.filter(c => c.cat === "melhorar"); }
    if (TF.src === "todas") return v;
    const [cat, p] = TF.src.split(":"); return v.filter(c => c.cat === cat && (!p || c.p === p));
  }
  const gramWithEx = () => D.gramatica.filter(g => g.ex && g.ex.split(" ").length >= 3);
  function viewTreinar() {
    h(`<div class="card"><div class="small muted">Vocabulário usado</div><div class="filters mt"><select id="src">
        <option value="vistas">Já vistas nos cartões</option><option value="erradas">Que já errei</option>
        <option value="melhorar">Melhorar</option><option value="fixar">Fixar</option><option value="avancar:P1">Avançar P1</option>
        <option value="rever">Rever</option><option value="avancar:P2">Avançar P2</option><option value="todas">Todas</option></select></div>
        <div class="small muted" id="cnt"></div></div>
      <div class="menu">
        <button class="item" data-m="ko"><span class="ico">뜻</span><span><b>한국어 → Português</b><small>Múltipla escolha</small></span></button>
        <button class="item" data-m="pt"><span class="ico">말</span><span><b>Português → 한국어</b><small>Múltipla escolha</small></span></button>
        <button class="item" data-m="ouvir"><span class="ico">귀</span><span><b>Ouvir e reconhecer</b><small>Ouça e escolha a palavra</small></span></button>
        <button class="item" data-m="grafia"><span class="ico">맞</span><span><b>Grafia</b><small>Escolha a forma escrita certa (inclui os erros do caderno)</small></span></button>
        <button class="item" data-m="ditado"><span class="ico">듣</span><span><b>Ditado</b><small>Ouça e digite em 한글 (teclado coreano)</small></span></button>
        <button class="item" data-m="escrita"><span class="ico">쓰</span><span><b>Escrita à mão</b><small>Escreva de memória e compare</small></span></button>
      </div>
      <h2>Gramática</h2><div class="menu">
        <button class="item" data-m="gsig"><span class="ico">법</span><span><b>Padrão → significado</b><small>Forma × função (Melhorar, Fixar, Rever, P1)</small></span></button>
        <button class="item" data-m="montar"><span class="ico">문</span><span><b>Montar frases</b><small>${gramWithEx().length} exemplos</small></span></button>
        <button class="item" data-m="simulado"><span class="ico">시</span><span><b>Simulado misto (20 questões)</b><small>Vocabulário, grafia, gramática e ditado</small></span></button>
      </div>
      ${S.hist.length ? `<h2>Últimos resultados</h2><div class="card small">${S.hist.slice(-8).reverse().map(r => `${fmtDate(r.d).slice(0, 5)} · ${esc(r.modo)}: <b>${r.ok}/${r.tot}</b> (${Math.round(100 * r.ok / r.tot)}%)`).join("<br>")}</div>` : ""}`);
    $("#src").value = TF.src;
    const upd = () => { TF.src = $("#src").value; $("#cnt").textContent = trainPool().length + " palavras no conjunto"; };
    $("#src").onchange = upd; upd();
    view.querySelectorAll("[data-m]").forEach(b => b.onclick = () => {
      const p = trainPool(), t = b.querySelector("b").textContent;
      const gp = D.gramatica.filter(g => g.p !== "P3" && g.sig);
      const fns = { ko: () => quiz(p, "ko", 15), pt: () => quiz(p, "pt", 15), ouvir: () => quiz(p, "ouvir", 15), grafia: () => grafia(p, 15), ditado: () => ditado(p, 15),
        escrita: () => escrita(p, 8), gsig: () => gsig(gp, 15), montar: () => montar(shuffle(gramWithEx()).slice(0, 10), 0, 0), simulado: () => simulado(p) };
      go(fns[b.dataset.m], t);
    });
  }
  function finish(modo, ok, tot, again) {
    S.hist.push({ d: today(), modo, ok, tot }); if (S.hist.length > 200) S.hist.shift();
    const r = dayRec(); r.treino = (r.treino || 0) + 1; save();
    const pct = Math.round(100 * ok / Math.max(1, tot));
    h(`<div class="card center"><div class="big-hz">${pct >= 90 ? "최고예요!" : pct >= 70 ? "좋아요!" : "화이팅!"}</div>
       <p><b>${ok} de ${tot}</b> (${pct}%)</p><p class="muted small">${pct >= 70 ? "Bom resultado." : "Revise as palavras erradas nos cartões."}</p>
       <div class="btns"><button class="btn primary" id="again">Repetir</button><button class="btn" id="out">Voltar</button></div></div>`);
    $("#again").onclick = again; $("#out").onclick = back;
  }
  function markWrong(c) { const s = S.srs[c.key]; if (s) { s.due = Math.min(s.due, startOfToday() + DAY); s.lapses = (s.lapses || 0) + 1; save(); } }
  function mcStep({ i, n, ok, q, opts, right, label, cls, after }) {
    h(`<div class="small muted">${i + 1} / ${n} · acertos ${ok}</div><div class="card">${q}
      <div class="opts">${opts.map((o, k) => `<button class="opt ${cls || ""}" data-k="${k}">${esc(label(o))}</button>`).join("")}</div><div id="fb"></div></div>`);
    view.querySelectorAll(".opt").forEach(b => b.onclick = () => {
      if (view.querySelector(".opt.ok")) return;
      const good = opts[+b.dataset.k] === right;
      view.querySelectorAll(".opt").forEach(x => { if (opts[+x.dataset.k] === right) x.classList.add("ok"); });
      if (!good) b.classList.add("no");
      after(good);
    });
  }
  function quiz(p, mode, n, onDone) {
    const items = sample(p, Math.min(n, p.length)); let i = 0, ok = 0;
    const step = () => {
      if (i >= items.length) return onDone ? onDone(ok, items.length) : finish({ ko: "한국어→PT", pt: "PT→한국어", ouvir: "Ouvir" }[mode], ok, items.length, () => quiz(p, mode, n));
      const c = items[i];
      const others = sample(cards.filter(x => x.tipo === "v" && x.ko !== c.ko && x.pt !== c.pt && (mode !== "ko" || x.tema === c.tema || Math.random() < 0.3)), 3);
      const q = mode === "ko" ? bigKo(c.ko) : mode === "pt" ? `<div class="pt" style="font-size:22px;margin:24px 0">${esc(c.pt)}</div>`
        : `<div class="center" style="margin:24px 0"><button class="speak" style="width:88px;height:88px;font-size:40px" data-say="${esc(sayText(c))}">🔊</button></div>`;
      if (mode === "ouvir") speak(sayText(c));
      mcStep({ i, n: items.length, ok, q, opts: shuffle([c].concat(others)), right: c, cls: mode === "ko" ? "" : "hzopt", label: o => mode === "ko" ? o.pt : o.ko,
        after: good => {
          if (good) ok++; else markWrong(c);
          if (mode !== "ouvir") speak(sayText(c));
          $("#fb").innerHTML = `<div class="answer"><div class="center mid-hz" style="font-size:26px">${esc(c.ko)}</div>${backHtml(c)}<button class="btn primary block mt" id="nx">Próxima</button></div>`;
          $("#nx").onclick = () => { i++; step(); };
        } });
    };
    step();
  }
  function grafia(p, n, onDone) {
    let cand = p.map(c => ({ c, o: spellOpts(c) })).filter(x => x.o);
    if (cand.length < 5) cand = cards.filter(c => c.tipo === "v").map(c => ({ c, o: spellOpts(c) })).filter(x => x.o);
    // erros do caderno primeiro
    const mel = shuffle(cand.filter(x => x.c.cat === "melhorar")).slice(0, Math.ceil(n / 3));
    const items = shuffle(mel.concat(sample(cand.filter(x => mel.indexOf(x) < 0), n - mel.length))); let i = 0, ok = 0;
    const step = () => {
      if (i >= items.length) return onDone ? onDone(ok, items.length) : finish("Grafia", ok, items.length, () => grafia(p, n));
      const { c, o } = items[i];
      mcStep({ i, n: items.length, ok, q: `<div class="row" style="justify-content:center"><div class="pt" style="font-size:22px;margin:16px 0">${esc(c.pt)}</div>${speakBtn(o.right)}</div><div class="small muted center">Qual é a grafia correta?</div>`,
        opts: shuffle([o.right].concat(o.wrong)), right: o.right, cls: "hzopt", label: x => x,
        after: good => { if (good) ok++; else markWrong(c); speak(o.right);
          $("#fb").innerHTML = `${c.wrong ? `<div class="fix"><b>✗ caderno:</b> ${esc(c.wrong)}${c.nota ? "<br>" + esc(c.nota) : ""}</div>` : ""}<button class="btn primary block mt" id="nx">Próxima</button>`;
          $("#nx").onclick = () => { i++; step(); }; } });
    };
    step();
  }
  function ditado(p, n, onDone) {
    let cand = p.filter(c => isPureKo(cleanKo(c.ko)) && !/[\/·→×]/.test(c.ko));
    if (cand.length < 5) cand = cards.filter(c => c.tipo === "v" && isPureKo(cleanKo(c.ko)) && !/[\/·→×]/.test(c.ko));
    const items = sample(cand, Math.min(n, cand.length)); let i = 0, ok = 0; const erros = [];
    const step = () => {
      if (i >= items.length) {
        if (onDone) return onDone(ok, items.length);
        finish("Ditado", ok, items.length, () => ditado(p, n));
        if (erros.length) view.insertAdjacentHTML("beforeend", `<h2>Para rever</h2><div class="card">${erros.map(([c, a]) =>
          `<div class="row" style="padding:6px 0"><span class="grow"><b style="font-size:20px">${esc(c.ko)}</b> <span class="small">${esc(c.pt)}</span><br><span class="small muted">você: ${esc(a || "—")}</span></span>${speakBtn(c.ko)}</div>`).join("")}</div>`);
        return;
      }
      const c = items[i];
      h(`<div class="small muted">${i + 1} / ${items.length} · acertos ${ok}</div><div class="card center">
        <button class="speak" style="width:88px;height:88px;font-size:40px;margin:12px auto" data-say="${esc(c.ko)}">🔊</button>
        <div class="pt">${esc(c.pt)}</div>
        <div class="mt"><input type="text" id="in" lang="ko" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="escreva em 한글"></div>
        <div class="btns mt"><button class="btn" id="skip">Não sei</button><button class="btn primary" id="chk">Conferir</button></div><div id="fb"></div></div>`);
      speak(c.ko);
      const inp = $("#in"); inp.focus();
      const check = give => {
        if ($("#nx")) return;
        const a = inp.value, right = !give && koAlternatives(c).indexOf(normKo(a)) >= 0;
        const spacing = right && a.trim().replace(/\s+/g, " ") !== cleanKo(c.ko);
        if (right) ok++; else { erros.push([c, a]); markWrong(c); }
        $("#fb").innerHTML = `<div class="feedback ${right ? "ok" : "no"}">${right ? "Certo!" : "Resposta:"} <span style="font-size:22px">${esc(c.ko)}</span>
          ${spacing ? `<div class="small" style="font-weight:400">Atenção ao 띄어쓰기: <b>${esc(cleanKo(c.ko))}</b></div>` : ""}</div>
          ${c.wrong ? `<div class="fix"><b>✗ caderno:</b> ${esc(c.wrong)}</div>` : ""}<button class="btn primary block mt" id="nx">Próxima</button>`;
        $("#nx").onclick = () => { i++; step(); };
      };
      $("#chk").onclick = () => check(false); $("#skip").onclick = () => check(true);
      inp.onkeydown = e => { if (e.key === "Enter") { $("#nx") ? $("#nx").click() : check(false); } };
    };
    step();
  }
  function escrita(p, n) {
    const items = sample(p.filter(c => [...firstForm(c)].length <= 6 && isPureKo(firstForm(c))), n); let i = 0, ok = 0, ghost = false;
    const step = () => {
      if (i >= items.length) return finish("Escrita", ok, items.length, () => escrita(p, n));
      const c = items[i], w = firstForm(c);
      h(`<div class="small muted">${i + 1} / ${items.length}</div><div class="card">
        <div class="row"><div class="grow"><b>${esc(c.pt)}</b><div class="small muted">Escreva em 한글 de memória. Depois mostre a resposta.</div></div>${speakBtn(w)}</div>
        <div class="canvas-wrap" id="cw" style="aspect-ratio:${Math.max(1, Math.min(3, [...w].length / 1.6))}"><div class="ghost" id="gh">${esc(w)}</div><canvas id="cv"></canvas></div>
        <label class="toggle"><input type="checkbox" id="gt" ${ghost ? "checked" : ""}><span>Mostrar modelo</span></label>
        ${c.wrong ? `<div class="fix" id="wr" hidden><b>✗ caderno:</b> ${esc(c.wrong)}</div>` : ""}
        <div class="btns"><button class="btn" id="clr">Apagar</button><button class="btn" id="bad">Errei</button><button class="btn primary" id="good">Acertei</button></div></div>`);
      const cw = $("#cw"), cv = $("#cv"), gh = $("#gh"), r = cw.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      gh.style.fontSize = Math.min(r.height * 0.8, r.width * 0.9 / [...w].length) + "px"; gh.style.visibility = ghost ? "visible" : "hidden";
      const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr); ctx.lineCap = ctx.lineJoin = "round"; ctx.lineWidth = Math.max(4, r.height / 30); ctx.strokeStyle = getComputedStyle(document.body).color;
      let drawing = false, last = null; const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      cv.onpointerdown = e => { drawing = true; last = pt(e); cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.arc(last[0], last[1], ctx.lineWidth / 2, 0, 7); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); };
      cv.onpointermove = e => { if (!drawing) return; const q = pt(e); ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); last = q; };
      cv.onpointerup = cv.onpointercancel = () => drawing = false;
      $("#gt").onchange = e => { ghost = e.target.checked; gh.style.visibility = ghost ? "visible" : "hidden"; if ($("#wr")) $("#wr").hidden = !ghost; };
      $("#clr").onclick = () => ctx.clearRect(0, 0, cv.width, cv.height);
      $("#good").onclick = () => { ok++; i++; step(); };
      $("#bad").onclick = () => { markWrong(c); gh.style.visibility = "visible"; if ($("#wr")) $("#wr").hidden = false; $("#bad").disabled = true; $("#good").textContent = "Próxima"; $("#good").onclick = () => { i++; step(); }; };
    };
    step();
  }
  function gsig(gp, n, onDone) {
    const items = sample(gp, Math.min(n, gp.length)); let i = 0, ok = 0;
    const step = () => {
      if (i >= items.length) return onDone ? onDone(ok, items.length) : finish("Gramática: significado", ok, items.length, () => gsig(gp, n));
      const g = items[i], c = cards.find(x => x.key === "g" + g.id);
      const others = sample(D.gramatica.filter(x => x.sig && x.sig !== g.sig), 3);
      mcStep({ i, n: items.length, ok, q: `<div class="mid-hz center" style="font-size:${koSize(g.pad) - 4}px;margin:16px 0">${esc(g.pad)}</div>`,
        opts: shuffle([g].concat(others)), right: g, label: o => o.sig,
        after: good => { if (good) ok++; else markWrong(c);
          if (g.ex) speak(g.ex);
          $("#fb").innerHTML = `<div class="answer">${backHtml(c)}<button class="btn primary block mt" id="nx">Próxima</button></div>`;
          $("#nx").onclick = () => { i++; step(); }; } });
    };
    step();
  }
  function simulado(p) {
    let total = 0, acc = 0; const gp = D.gramatica.filter(g => g.p !== "P3" && g.sig);
    const part = (k, o, t) => { acc += o; total += t; parts[k](); };
    const parts = [() => quiz(p, "ko", 5, (o, t) => part(1, o, t)), () => grafia(p, 5, (o, t) => part(2, o, t)),
      () => gsig(gp, 5, (o, t) => part(3, o, t)), () => ditado(p, 5, (o, t) => part(4, o, t)), () => finish("Simulado", acc, total, () => simulado(p))];
    parts[0]();
  }

  // ---------- GRAMÁTICA ----------
  function viewGramatica() {
    const gs = groups();
    h(`<div class="card small muted">${D.gramatica.length} pontos: os do caderno (Melhorar, Fixar, Rever) e o que falta para o TOPIK II (Avançar P1, P2 e P3).</div>
      <div class="btns"><button class="btn primary" id="gm">Montar frases</button><button class="btn" id="gs">Padrão → significado</button></div>
      ${gs.map(g => { const list = D.gramatica.filter(x => x.cat === g.cat && (!g.p || x.p === g.p)); if (!list.length) return "";
        return `<h2 style="color:${CAT[g.cat].cor}">${esc(g.nome)} (${list.length})</h2><div class="menu">${list.map(x => { const st = S.gram[x.id];
          return `<button class="item" data-g="${x.id}"><span class="grow"><b>${esc(x.pad)}</b><small>${esc(x.sig)}${x.niv ? " · " + esc(x.niv) : ""}${st ? ` · ${st.ok}/${st.tot} ✓` : ""}</small></span></button>`; }).join("")}</div>`; }).join("")}`);
    $("#gm").onclick = () => go(() => montar(shuffle(gramWithEx()).slice(0, 10), 0, 0), "Montar frases");
    $("#gs").onclick = () => go(() => gsig(D.gramatica.filter(g => g.p !== "P3" && g.sig), 15), "Padrão → significado");
    view.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { const g = D.gramatica[+b.dataset.g]; go(() => gramDetail(g), CAT[g.cat].nome); });
  }
  function gramDetail(g) {
    const c = cards.find(x => x.key === "g" + g.id);
    h(`<div class="card"><div class="row"><div class="grow">${catTag(c)}<div class="mid-hz" style="font-size:24px;margin-top:6px">${esc(g.pad)}</div></div></div>
      <div class="fix mt">${esc(g.sig)}</div>
      ${g.ex ? `<div class="row mt"><div class="grow"><div style="font-size:20px">${esc(g.ex)}</div><div class="muted">${esc(g.expt)}</div></div>${speakBtn(g.ex)}</div>` : `<div class="small muted mt">Sem exemplo na lista (P3: ver 한국어교수학습샘터).</div>`}
      ${g.erro ? `<div class="fix" style="border-left:4px solid var(--bad)"><b>✗ caderno:</b> ${esc(g.erro)}</div>` : ""}
      ${g.nota ? `<div class="small mt">${esc(g.nota)}</div>` : ""}
      <div class="small muted mt">${[g.niv, g.aula && g.aula !== "—" ? "Aula: " + g.aula : "", g.pag && g.pag !== "—" ? "Caderno p." + g.pag : ""].filter(Boolean).map(esc).join(" · ")}</div></div>
      ${g.ex && g.ex.split(" ").length >= 3 ? `<button class="btn primary block" id="tr">Montar esta frase</button>` : ""}
      <h2>내 문장 (minhas frases)</h2><div class="card"><div class="small muted">Produza: escreva 3 frases suas com este ponto. Fica salvo no aparelho.</div>
      <textarea id="mine" style="font-family:inherit;font-size:18px" placeholder="저는…">${esc(S.mine[g.id] || "")}</textarea></div>`);
    if ($("#tr")) $("#tr").onclick = () => go(() => montar([g], 0, 0), "Montar frase");
    $("#mine").oninput = e => { S.mine[g.id] = e.target.value; save(); };
  }
  function montar(gs, i, ok) {
    if (i >= gs.length) return finish("Montar frases", ok, gs.length, () => montar(shuffle(gs), 0, 0));
    const g = gs[i];
    const parts = g.ex.split(/\s*\/\s*|(?<=[.?!])\s+/).filter(s => s.split(" ").length >= 3);
    const sentence = (parts[0] || g.ex).trim();
    const toks = sentence.split(/\s+/);
    let order = shuffle(toks.map((t, k) => k)); if (order.every((v, k) => v === k)) order.reverse();
    const picked = [];
    const draw = () => {
      h(`<div class="small muted">${i + 1} / ${gs.length}</div><div class="card">
        <div class="pt">${esc(parts.length > 1 || sentence !== g.ex ? (g.expt.split(/\s*\/\s*/)[0] || g.expt) : g.expt)}</div>
        <div class="small muted center">${esc(g.pad)}</div>
        <div class="tokens" id="ans">${picked.map((k, j) => `<button class="tok" style="font-family:inherit" data-j="${j}">${esc(toks[k])}</button>`).join("")}</div>
        <div class="tokens" style="border-style:solid">${order.map(k => `<button class="tok ${picked.indexOf(k) >= 0 ? "used" : ""}" style="font-family:inherit" data-k="${k}">${esc(toks[k])}</button>`).join("")}</div>
        <div class="btns"><button class="btn" id="skip">Ver resposta</button><button class="btn primary" id="chk" ${picked.length === toks.length ? "" : "disabled"}>Conferir</button></div><div id="fb"></div></div>`);
      view.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { if (!b.classList.contains("used")) { picked.push(+b.dataset.k); draw(); } });
      view.querySelectorAll("[data-j]").forEach(b => b.onclick = () => { picked.splice(+b.dataset.j, 1); draw(); });
      const check = give => {
        const right = !give && picked.map(k => toks[k]).join(" ") === toks.join(" ");
        const st = S.gram[g.id] = S.gram[g.id] || { ok: 0, tot: 0 }; st.tot++; if (right) { st.ok++; ok++; } save();
        $("#fb").innerHTML = `<div class="feedback ${right ? "ok" : "no"}">${right ? "Certo!" : "Ordem correta:"}<div style="font-size:20px">${esc(sentence)}</div></div>
          ${g.sig ? `<div class="small mt">${esc(g.sig)}</div>` : ""}<button class="btn primary block mt" id="nx">Próxima</button>`;
        speak(sentence);
        view.querySelectorAll(".tok").forEach(b => b.onclick = null); $("#chk").disabled = true; $("#skip").disabled = true;
        $("#nx").onclick = () => montar(gs, i + 1, ok);
      };
      $("#chk").onclick = () => check(false); $("#skip").onclick = () => check(true);
    };
    draw();
  }

  // ---------- MAIS ----------
  function viewMais() {
    h(`<div class="menu">
      <button class="item" id="m-lista"><span class="ico">목</span><span><b>Lista completa</b><small>${D.vocab.length} palavras + ${D.gramatica.length} gramáticas · busca e filtros</small></span></button>
      <button class="item" id="m-erros"><span class="ico">고</span><span><b>Erros do caderno (Melhorar)</b><small>No caderno → correto, com a explicação</small></span></button>
      <button class="item" id="m-ach"><span class="ico">결</span><span><b>Principais achados</b><small>O que as listas mostram</small></span></button>
      <button class="item" id="m-prop"><span class="ico">계</span><span><b>Proposta e plano 2027</b><small>Encaixe no coreano-topik</small></span></button>
      <button class="item" id="m-ileg"><span class="ico">?</span><span><b>Ilegível ou incerto</b><small>${D.ilegivel.length} trechos do caderno</small></span></button>
      <button class="item" id="m-backup"><span class="ico">저</span><span><b>Backup do progresso</b><small>Exportar e importar</small></span></button>
      <button class="item" id="m-cfg"><span class="ico">설</span><span><b>Áudio e configurações</b><small>Voz coreana, velocidade, zerar progresso</small></span></button></div>`);
    const m = { "m-lista": [viewLista, "Lista"], "m-erros": [viewErros, "Erros do caderno"], "m-ach": [viewAchados, "Principais achados"], "m-prop": [viewProposta, "Proposta"],
      "m-ileg": [viewIleg, "Ilegível ou incerto"], "m-backup": [viewBackup, "Backup"], "m-cfg": [viewCfg, "Configurações"] };
    Object.keys(m).forEach(id => $("#" + id).onclick = () => go(m[id][0], m[id][1]));
  }
  let LS = { q: "", c: "", t: "", s: "" };
  function viewLista() {
    h(`<input type="search" id="q" placeholder="Buscar 한국어, hanja ou português" value="${esc(LS.q)}">
      <div class="filters mt"><select id="lc"><option value="">Categoria</option>${groups().map((g, k) => `<option value="${k}">${esc(g.nome)}</option>`).join("")}</select>
      <select id="lt"><option value="">Tipo/tema</option><option value="g">Gramática</option>${TEMAS.map(t => `<option>${esc(t)}</option>`).join("")}</select>
      <select id="ls"><option value="">Status</option><option value="0">Novos</option><option value="1">Aprendendo</option><option value="2">Dominados</option></select></div>
      <div class="small muted" id="cnt"></div><div class="list" id="ll"></div>`);
    $("#lc").value = LS.c; $("#lt").value = LS.t; $("#ls").value = LS.s;
    const draw = () => {
      LS = { q: $("#q").value, c: $("#lc").value, t: $("#lt").value, s: $("#ls").value };
      const q = LS.q.trim().toLowerCase(); const g = LS.c !== "" ? groups()[+LS.c] : null;
      const res = cards.filter(c => (!g || matches(c, Object.assign({ all: true }, g.f))) && (!LS.t || (LS.t === "g" ? c.tipo === "g" : c.tema === LS.t))
        && (LS.s === "" || status(c) === +LS.s) && (!q || [c.ko, c.pt, c.hj, c.ex, c.wrong].join(" ").toLowerCase().indexOf(q) >= 0));
      $("#cnt").textContent = res.length + " itens";
      $("#ll").innerHTML = res.slice(0, 300).map(c => `<div class="w"><span class="grow"><b style="font-size:${c.tipo === "g" ? 16 : 20}px">${esc(c.ko)}</b> ${c.hj ? `<span class="muted">${esc(c.hj)}</span>` : ""}<br><span class="small">${esc(c.pt)}</span>
        ${c.wrong ? `<br><span class="small" style="color:var(--bad)">✗ ${esc(c.wrong)}</span>` : ""}</span>
        <span class="lvl"><span class="dot s${status(c)}"></span>${CAT[c.cat].nome}${c.p ? " " + c.p : ""}<br>${esc(c.niv || "")}</span>${speakBtn(sayText(c))}</div>`).join("")
        + (res.length > 300 ? `<div class="small muted center mt">Mostrando 300. Refine a busca.</div>` : "");
    };
    $("#q").oninput = draw; $("#lc").onchange = draw; $("#lt").onchange = draw; $("#ls").onchange = draw; draw();
  }
  function viewErros() {
    const v = D.vocab.filter(c => c.cat === "melhorar"), g = D.gramatica.filter(x => x.cat === "melhorar");
    const card = (w, r, pt, why, pag, say) => `<div class="card err"><div class="row"><div class="grow"><div class="small muted">p. ${esc(pag || "—")}</div><div class="wrong" style="font-family:inherit">${esc(w)}</div>
      <div class="right" style="font-family:inherit">${esc(r)}</div><div class="small"><b>${esc(pt)}</b></div><div class="small muted">${esc(why)}</div></div>${speakBtn(say)}</div></div>`;
    h(`<h2>Vocabulário (${v.length})</h2>${v.map(c => card(c.wrong, c.ko, c.pt, c.nota, c.pag, c.ex || firstForm(c))).join("")}
      <h2>Gramática (${g.length})</h2>${g.map(x => card(x.erro, x.pad, x.sig, x.nota, x.pag, x.ex) + (x.ex ? `<div class="small" style="margin:-6px 0 12px 8px">${esc(x.ex)} — <span class="muted">${esc(x.expt)}</span></div>` : "")).join("")}
      <button class="btn primary block mt" id="rv">Estudar os cartões Melhorar</button><button class="btn block mt" id="gf">Treinar grafia</button>`);
    $("#rv").onclick = () => go(() => study({ cat: "melhorar" }), "Melhorar");
    $("#gf").onclick = () => go(() => grafia(cards.filter(c => c.tipo === "v" && c.cat === "melhorar").concat(trainBase()), 12), "Grafia");
  }
  function viewAchados() {
    h(X.achados.map(([t, d], k) => `<div class="card"><b>${k + 1}. ${esc(t)}</b><div class="small mt">${esc(d)}</div></div>`).join("")
      + `<h2>As quatro categorias</h2>` + Object.keys(CAT).map(k => `<div class="card"><b style="color:${CAT[k].cor}">${CAT[k].nome}</b><div class="small">${esc(CAT[k].desc)}</div></div>`).join(""));
  }
  function viewProposta() {
    h(X.proposta.map(([t, d], k) => `<div class="card week"><b>${k + 1}. ${esc(t)}</b><div class="small mt">${esc(d)}</div></div>`).join("")
      + `<div class="card small muted">Datas: ${X.datas.map(d => `${esc(d.nome)} ${fmtDate(d.data)}${d.obs ? " (" + esc(d.obs) + ")" : ""}`).join(" · ")}</div>`);
  }
  function viewIleg() {
    h(`<div class="card list">${D.ilegivel.map(x => `<div class="w"><span class="lvl" style="min-width:40px;text-align:left">${esc(x.pag)}</span><span class="grow">${esc(x.trecho)}<br><span class="small muted">${esc(x.sit)}</span></span></div>`).join("")}</div>`);
  }
  function viewBackup() {
    const data = JSON.stringify(S);
    h(`<div class="card"><b>Exportar</b><div class="small muted">Guarde este texto (e-mail, Drive, notas). Ele contém todo o seu progresso.</div>
       <div class="btns mt">${A && A.share ? `<button class="btn primary" id="share">Compartilhar</button>` : ""}<button class="btn" id="copy">Copiar</button></div>
       <textarea id="out" readonly class="mt">${esc(data)}</textarea></div>
       <div class="card"><b>Importar</b><div class="small muted">Cole um backup e toque em Restaurar. Substitui o progresso atual.</div>
       <textarea id="inp" class="mt" placeholder='{"srs":{...}}'></textarea><button class="btn block mt" id="rest">Restaurar</button></div>`);
    if ($("#share")) $("#share").onclick = () => A.share("TOPIK Estudos backup " + today(), data);
    $("#copy").onclick = () => { if (A && A.copy) A.copy(data); else { $("#out").select(); document.execCommand("copy"); } toast("Copiado"); };
    $("#rest").onclick = () => { try { const n = JSON.parse($("#inp").value); if (!n.srs) throw 0; S = n; fresh(); save(); toast("Progresso restaurado"); } catch (e) { toast("Texto inválido"); } };
  }
  function viewCfg() {
    const ttsOk = A && A.ttsAvailable ? A.ttsAvailable() : !!window.speechSynthesis;
    h(`<div class="card"><b>Áudio</b><div class="small" style="${ttsOk ? "color:var(--muted)" : "color:var(--bad)"}">${ttsOk ? "Voz coreana disponível." : "Voz coreana não encontrada. Instale “Coreano” no mecanismo de voz do Google (funciona sem internet depois de baixado)."}</div>
       <label class="toggle"><span class="grow">Velocidade</span><select id="rate" style="width:110px">${[0.6, 0.7, 0.8, 0.9, 1].map(r => `<option value="${r}" ${r === S.cfg.rate ? "selected" : ""}>${r}×</option>`).join("")}</select></label>
       <div class="btns"><button class="btn" id="test">Testar 안녕하세요</button>${A && A.openTtsSettings ? `<button class="btn" id="tts">Configurar voz</button>` : ""}</div></div>
       <div class="card"><b>Teclado</b><div class="small muted">Para o ditado, ative o teclado coreano (Gboard → Idiomas → Coreano).</div></div>
       <div class="card"><b>Zerar progresso</b><div class="small muted">Apaga cartões, histórico e frases. Faça backup antes.</div><button class="btn block mt" id="reset" style="color:var(--bad)">Zerar tudo</button></div>
       <div class="small muted center">TOPIK Estudos · ${D.vocab.length} palavras · ${D.gramatica.length} gramáticas · 100% offline</div>`);
    $("#rate").onchange = e => { S.cfg.rate = +e.target.value; save(); };
    $("#test").onclick = () => speak("안녕하세요. 저는 한국어를 공부해요.");
    if ($("#tts")) $("#tts").onclick = () => A.openTtsSettings();
    let armed = false;
    $("#reset").onclick = e => { if (!armed) { armed = true; e.target.textContent = "Toque de novo para confirmar"; return; } S = { cfg: S.cfg }; fresh(); save(); toast("Progresso zerado"); tab("hoje"); };
  }

  tab("hoje");
})();
