/* HSK Estudos — app offline. Dados: data.js (planilha) + extra.js (diagnóstico). */
(function () {
  "use strict";
  const D = window.HSK_DATA, X = window.HSK_EXTRA;
  const A = window.Android || null; // ponte Java (MainActivity.Bridge)
  const DAY = 86400000;

  // ---------- Armazenamento (SharedPreferences no Android, localStorage no navegador) ----------
  const store = {
    get(k, def) {
      try {
        const v = A ? A.getItem(k) : localStorage.getItem(k);
        return v ? JSON.parse(v) : def;
      } catch (e) { return def; }
    },
    set(k, v) {
      const s = JSON.stringify(v);
      try { A ? A.setItem(k, s) : localStorage.setItem(k, s); } catch (e) {}
    }
  };

  // ---------- Cartões: vocabulário + "revisar primeiro" ----------
  const cards = [];
  D.revisar.forEach((r, i) => cards.push({ key: "r" + i, h: r.h, y: r.y, pt: r.pt, fix: r.fix, p: 0, t: "Revisar (caderno)", rev: true }));
  D.vocab.forEach(v => cards.push({ key: "v" + v.id, h: v.h, y: v.y, pt: v.pt, p: v.p, t: v.t, n: v.n, o: v.o, l: v.l, c: v.c }));
  const byKey = Object.fromEntries(cards.map(c => [c.key, c]));
  const TEMAS = [...new Set(D.vocab.map(v => v.t))];

  let S = store.get("state", null) || {};
  S.srs = S.srs || {};              // key -> {i: intervalo(d), e: facilidade, due: ts, n: acertos seguidos, lapses}
  S.cfg = Object.assign({ novos: 15, reverso: false, rate: 0.8 }, S.cfg || {});
  S.days = S.days || {};            // "AAAA-MM-DD" -> {novos, revs, ok, min}
  S.hist = S.hist || [];            // resultados de treinos [{d, modo, ok, tot}]
  S.gram = S.gram || {};            // G01 -> {ok, tot}
  const save = () => store.set("state", S);

  const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const dayRec = () => (S.days[today()] = S.days[today()] || { novos: 0, revs: 0, ok: 0 });
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

  function streak() {
    let n = 0; const d = new Date();
    if (!S.days[today()]) d.setDate(d.getDate() - 1);
    for (;;) {
      const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const r = S.days[k]; if (!r || (r.novos + r.revs + (r.treino || 0)) === 0) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }

  // Ordem dos novos: revisar primeiro, depois prioridade 1→3 na ordem da planilha (temas diários primeiro).
  function newQueue(filter) {
    return cards.filter(c => !S.srs[c.key] && matches(c, filter));
  }
  function dueList(filter) {
    const end = startOfToday() + DAY;
    return cards.filter(c => S.srs[c.key] && S.srs[c.key].due < end && matches(c, filter))
      .sort((a, b) => S.srs[a.key].due - S.srs[b.key].due);
  }
  function matches(c, f) {
    if (!f) return true;
    if (f.p && c.p !== f.p && !(f.rev && c.rev)) return false;
    if (f.temas && !c.rev && f.temas.indexOf(c.t) < 0) return false;
    if (f.tema && c.t !== f.tema) return false;
    return true;
  }
  const status = c => { const s = S.srs[c.key]; return !s ? 0 : (s.i >= 21 ? 2 : 1); }; // 0 novo, 1 aprendendo, 2 dominado

  // SM-2 simplificado. q: 1 errei, 2 difícil, 3 bom, 4 fácil
  function grade(c, q) {
    const now = Date.now();
    let s = S.srs[c.key];
    const isNew = !s;
    if (!s) s = { i: 0, e: 2.5, n: 0, lapses: 0 };
    if (q === 1) {
      s.n = 0; s.lapses++; s.e = Math.max(1.3, s.e - 0.2); s.i = 0;
      s.due = now + 60 * 1000; // volta na mesma sessão
    } else {
      s.e = Math.max(1.3, s.e + (q === 2 ? -0.15 : q === 4 ? 0.15 : 0));
      if (s.n === 0) s.i = q === 4 ? 3 : 1;
      else if (s.n === 1) s.i = q === 2 ? 3 : q === 4 ? 8 : 6;
      else s.i = Math.round(s.i * (q === 2 ? 1.2 : q === 4 ? s.e * 1.3 : s.e));
      s.n++;
      s.due = startOfToday() + s.i * DAY + 4 * 3600 * 1000;
    }
    S.srs[c.key] = s;
    const r = dayRec(); if (isNew) r.novos++; else r.revs++; if (q > 1) r.ok++;
    save();
  }
  const ivlLabel = (c, q) => {
    const s = S.srs[c.key] || { i: 0, e: 2.5, n: 0 };
    if (q === 1) return "agora";
    let i;
    if (s.n === 0) i = q === 4 ? 3 : 1; else if (s.n === 1) i = q === 2 ? 3 : q === 4 ? 8 : 6;
    else i = Math.round(s.i * (q === 2 ? 1.2 : q === 4 ? s.e * 1.3 : s.e));
    return i < 30 ? i + "d" : Math.round(i / 30) + "m";
  };

  // ---------- Pinyin ----------
  const TONES = { a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", "ü": "ǖǘǚǜ" };
  const MARK2 = {}; Object.keys(TONES).forEach(b => [...TONES[b]].forEach((ch, i) => MARK2[ch] = [b, i + 1]));
  function stripTones(s) { return [...s].map(ch => MARK2[ch] ? MARK2[ch][0] : ch).join(""); }
  function markSyllable(syl, tone) {
    syl = syl.replace(/v/g, "ü").replace(/u:/g, "ü");
    if (!tone || tone === 5 || tone === 0) return syl;
    const low = syl.toLowerCase();
    let idx = low.indexOf("a"); if (idx < 0) idx = low.indexOf("e");
    if (idx < 0 && low.indexOf("ou") >= 0) idx = low.indexOf("o");
    if (idx < 0) { for (let k = low.length - 1; k >= 0; k--) if ("aeiouü".indexOf(low[k]) >= 0) { idx = k; break; } }
    if (idx < 0) return syl;
    const base = low[idx]; let m = TONES[base][tone - 1];
    if (syl[idx] !== low[idx]) m = m.toUpperCase();
    return syl.slice(0, idx) + m + syl.slice(idx + 1);
  }
  // "ni3 hao3" / "ni3hao3" / "nǐhǎo" -> "nǐhǎo"
  function numToMarks(s) { return s.replace(/([a-zA-ZüÜv:]+)([0-5])/g, (_, syl, t) => markSyllable(syl, +t)); }
  function normPy(s) {
    return numToMarks(String(s).toLowerCase().trim()).replace(/v/g, "ü").normalize("NFC").replace(/[\s'’·\-.,;!?？。，]/g, "");
  }
  function pyAlternatives(y) { // "qì; qí" -> várias respostas aceitas
    return String(y).split(/[;/]|\s+ou\s+/).map(normPy).filter(Boolean);
  }
  function colorPy(y) { // pinyin colorido por tom
    return esc(y).replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈŌÓǑÒ]/g, ch => {
      const m = MARK2[ch.toLowerCase()]; return m ? `<span class="t${m[1]}">${ch}</span>` : ch;
    });
  }
  function toneVariants(y, n) { // distratores trocando os tons
    const chars = [...y]; const pos = [];
    chars.forEach((ch, i) => { if (MARK2[ch.toLowerCase()]) pos.push(i); });
    if (!pos.length) return [];
    const out = new Set([y]); let guard = 0;
    while (out.size < n + 1 && guard++ < 200) {
      const c2 = chars.slice();
      pos.forEach(i => {
        if (Math.random() < 0.6 || pos.length === 1) {
          const lower = c2[i].toLowerCase(); const [b] = MARK2[lower];
          let t = 1 + Math.floor(Math.random() * 4);
          let m = TONES[b][t - 1]; if (c2[i] !== lower) m = m.toUpperCase(); c2[i] = m;
        }
      });
      out.add(c2.join(""));
    }
    out.delete(y); return [...out].slice(0, n);
  }

  // ---------- Áudio (TTS) ----------
  function speak(t) {
    if (!t) return;
    t = String(t).replace(/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ…\/]+/g, " ");
    if (A && A.speak) { A.speak(t, S.cfg.rate); return; }
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(t); u.lang = "zh-CN"; u.rate = S.cfg.rate;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  }

  // ---------- Utilidades de UI ----------
  const $ = s => document.querySelector(s);
  const view = $("#view");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const sample = (a, n) => shuffle(a).slice(0, n);
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 2200); }
  function h(html) { view.innerHTML = html; view.scrollTop = 0; }
  const fmtDate = iso => { const [y, m, d] = iso.split("-"); return d + "/" + m; };
  const speakBtn = t => `<button class="speak" data-say="${esc(t)}" aria-label="Ouvir">🔊</button>`;
  view.addEventListener("click", e => { const b = e.target.closest("[data-say]"); if (b) { e.stopPropagation(); speak(b.dataset.say); } });

  // Navegação com pilha (botão voltar do Android)
  let stack = [];
  function go(fn, title, push = true) {
    if (push && current) stack.push(current);
    current = { fn, title };
    $("#title").textContent = title || "HSK Estudos";
    $("#back").hidden = stack.length === 0;
    $("#streak").textContent = streak() ? "🔥 " + streak() + (streak() === 1 ? " dia" : " dias") : "";
    fn();
  }
  let current = null;
  function back() { if (!stack.length) return false; const p = stack.pop(); go(p.fn, p.title, false); return true; }
  window.onAndroidBack = back;
  $("#back").onclick = back;
  function tab(name) {
    document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
    stack = []; current = null;
    ({ hoje: () => go(viewHoje, "HSK Estudos"), cartoes: () => go(viewCartoes, "Cartões"), treinar: () => go(viewTreinar, "Treinar"),
       gramatica: () => go(viewGramatica, "Gramática"), mais: () => go(viewMais, "Mais") })[name]();
  }
  document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => tab(b.dataset.tab));

  function currentWeek() {
    const t = today();
    const k = X.semanas.findIndex(w => t <= w.fim); // semana atual ou a próxima
    return k;
  }

  // ---------- HOJE ----------
  function viewHoje() {
    const rec = S.days[today()] || { novos: 0, revs: 0, ok: 0 };
    const due = dueList().length;
    const novosRest = Math.max(0, S.cfg.novos - rec.novos);
    const counts = [1, 2, 3].map(p => {
      const all = cards.filter(c => c.p === p);
      return { p, tot: all.length, vist: all.filter(c => S.srs[c.key]).length, dom: all.filter(c => status(c) === 2).length };
    });
    const revAll = cards.filter(c => c.rev), revSeen = revAll.filter(c => S.srs[c.key]).length;
    const wi = currentWeek(); const w = X.semanas[wi];
    const prova = X.provas[0]; const dias = Math.ceil((new Date(prova.data + "T09:00:00") - Date.now()) / DAY);
    const totalVist = cards.filter(c => S.srs[c.key]).length;
    h(`
      <div class="card">
        <div class="row"><div class="grow"><b>Estudo de hoje</b><div class="small muted">${due} revisões · ${novosRest} novos disponíveis</div></div>
        <button class="btn primary" id="go-study">${due + novosRest ? "Estudar" : "Concluído ✓"}</button></div>
        <div class="grid2 mt">
          <div class="stat"><b>${rec.revs}</b><small>revisados hoje</small></div>
          <div class="stat"><b>${rec.novos}</b><small>novos hoje</small></div>
        </div>
      </div>
      ${w ? `<h2>Semana ${wi + 1} do plano (${fmtDate(w.ini)}–${fmtDate(w.fim)})${today() < w.ini ? " · começa em breve" : ""}</h2>
      <div class="card week now"><dl><dt>Vocabulário</dt><dd>${esc(w.vocab)}</dd><dt>Gramática</dt><dd>${esc(w.gram)}</dd><dt>Critério</dt><dd>${esc(w.crit)}</dd></dl>
      <div class="btns mt"><button class="btn" id="w-cards">Cartões da semana</button><button class="btn" id="w-gram">G${String(w.g[0]).padStart(2,"0")}–G${String(w.g[1]).padStart(2,"0")}</button></div></div>` : ""}
      <h2>Progresso (${totalVist} de ${cards.length} palavras vistas)</h2>
      <div class="card">
        <div class="small"><b>Revisar primeiro</b> (erros do caderno) · ${revSeen}/${revAll.length}</div>
        <div class="bar" style="margin:6px 0 12px"><i style="width:${(100 * revSeen / revAll.length).toFixed(1)}%"></i></div>
        ${counts.map(c => `<div class="small"><b>Prioridade ${c.p}</b> (nível ${c.p}) · ${c.vist}/${c.tot} vistas · ${c.dom} dominadas</div>
          <div class="bar" style="margin:6px 0 12px"><i style="width:${(100 * c.vist / c.tot).toFixed(1)}%"></i></div>`).join("")}
        <div class="small muted">Dominada = intervalo de revisão ≥ 21 dias.</div>
      </div>
      <div class="grid2">
        <div class="card stat"><b>${dias > 0 ? dias : "—"}</b><small>dias até o ${esc(prova.nome)}<br>${prova.data.split("-").reverse().join("/")}</small></div>
        <div class="card stat"><b>${Math.ceil((cards.length - totalVist) / S.cfg.novos)}</b><small>dias para ver todas as palavras (${S.cfg.novos}/dia)</small></div>
      </div>
      <h2>Rotina diária</h2>
      <div class="card small">${X.dicas.map(d => "• " + esc(d)).join("<br>")}</div>
      <div class="menu">
        <button class="item" id="q-dit"><span class="ico">听</span><span><b>Ditado de 10 palavras com tom</b><small>Ouça e escreva o pinyin</small></span></button>
        <button class="item" id="q-esc"><span class="ico">写</span><span><b>5 caracteres à mão</b><small>Prioridade 1, com quadro 米字格</small></span></button>
      </div>`);
    $("#go-study").onclick = () => go(() => study(null), "Cartões de hoje");
    if (w) {
      $("#w-cards").onclick = () => go(() => study(w.filtro), "Cartões · semana " + (wi + 1));
      $("#w-gram").onclick = () => go(() => viewGramatica(w.g), "Gramática · semana " + (wi + 1));
    }
    $("#q-dit").onclick = () => go(() => ditado(pool({ p: 1 }, true), 10), "Ditado");
    $("#q-esc").onclick = () => go(() => escrita(pool({ p: 1 }, true), 5), "Escrita");
  }

  // ---------- CARTÕES (SRS) ----------
  function viewCartoes() {
    const due = dueList().length, novos = newQueue().length;
    h(`<div class="card"><div class="row"><div class="grow"><b>Todos os cartões</b><div class="small muted">${due} para revisar · ${novos} novos na fila</div></div>
       <button class="btn primary" id="all">Estudar</button></div></div>
       <h2>Por grupo</h2><div class="menu">
       <button class="item" data-f='{"rev":true,"p":-1}'><span class="ico">错</span><span><b>Revisar primeiro</b><small>20 palavras do caderno com erro</small></span></button>
       ${[1, 2, 3].map(p => `<button class="item" data-f='{"p":${p}}'><span class="ico">${["", "一", "二", "三"][p]}</span><span><b>Prioridade ${p}</b><small>${cards.filter(c => c.p === p).length} palavras · nível ${p}</small></span></button>`).join("")}
       </div>
       <h2>Por tema</h2>
       <div class="filters"><select id="pp"><option value="0">Todas as prioridades</option><option value="1">Prioridade 1</option><option value="2">Prioridade 2</option><option value="3">Prioridade 3</option></select></div>
       <div class="menu" id="temas"></div>
       <h2>Opções</h2>
       <div class="card">
         <label class="toggle"><span class="grow">Novos por dia</span><select id="novos" style="width:90px">${[5, 10, 15, 20, 25, 30].map(n => `<option ${n === S.cfg.novos ? "selected" : ""}>${n}</option>`).join("")}</select></label>
         <label class="toggle"><span class="grow">Também treinar Português → 汉字</span><input type="checkbox" id="rev" ${S.cfg.reverso ? "checked" : ""}></label>
       </div>`);
    $("#all").onclick = () => go(() => study(null), "Cartões");
    view.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { const f = JSON.parse(b.dataset.f); go(() => study(f), b.querySelector("b").textContent); });
    const drawTemas = () => {
      const p = +$("#pp").value;
      $("#temas").innerHTML = TEMAS.map(t => {
        const cs = cards.filter(c => c.t === t && (!p || c.p === p)); if (!cs.length) return "";
        const v = cs.filter(c => S.srs[c.key]).length;
        return `<button class="item" data-t="${esc(t)}"><span class="grow"><b>${esc(t)}</b><small>${v}/${cs.length} vistas</small><div class="bar" style="margin-top:6px"><i style="width:${100 * v / cs.length}%"></i></div></span></button>`;
      }).join("");
      $("#temas").querySelectorAll("[data-t]").forEach(b => b.onclick = () => go(() => study({ tema: b.dataset.t, p: p || undefined }), b.dataset.t));
    };
    $("#pp").onchange = drawTemas; drawTemas();
    $("#novos").onchange = e => { S.cfg.novos = +e.target.value; save(); };
    $("#rev").onchange = e => { S.cfg.reverso = e.target.checked; save(); };
  }

  function study(filter) {
    if (filter && filter.p === -1) filter = { rev: true, temas: [] , p: 99 };
    const rec = dayRec();
    let novos = newQueue(filter).slice(0, Math.max(0, S.cfg.novos - rec.novos));
    let queue = dueList(filter).concat(novos);
    let done = 0;
    const next = () => {
      // reinsere cartões errados que já venceram (1 min)
      const late = dueList(filter).filter(c => queue.indexOf(c) < 0 && S.srs[c.key].due <= Date.now());
      queue = queue.concat(late);
      if (!queue.length) {
        h(`<div class="card center"><div class="big-hz">好!</div><p><b>Sessão concluída.</b><br><span class="muted">${done} cartões estudados. Volte amanhã para as revisões.</span></p>
           <div class="btns"><button class="btn" id="more">+${S.cfg.novos} novos mesmo assim</button></div></div>`);
        $("#more").onclick = () => { rec.novos -= S.cfg.novos; save(); study(filter); };
        return;
      }
      const c = queue.shift();
      const reverse = S.cfg.reverso && S.srs[c.key] && Math.random() < 0.5;
      const front = reverse
        ? `<div class="pt" style="font-size:24px">${esc(c.pt)}</div><div class="center small muted mt">Como se diz em chinês?</div>`
        : `<div class="big-hz">${esc(c.h)}</div>`;
      h(`<div class="card flash"><div class="meta"><span>${esc(c.rev ? "Revisar" : "P" + c.p + " · " + c.t)}</span><span>${queue.length + 1} restantes</span></div>
          ${front}<div id="ans"></div></div>
          <button class="btn primary block" id="show">Mostrar resposta</button><div id="gr"></div>`);
      if (!reverse) speak(c.h);
      $("#show").onclick = () => {
        $("#show").remove();
        $("#ans").innerHTML = `<div class="answer">
          ${reverse ? `<div class="big-hz">${esc(c.h)}</div>` : ""}
          <div class="row" style="justify-content:center"><div class="py">${colorPy(c.y)}</div>${speakBtn(c.h)}</div>
          ${reverse ? "" : `<div class="pt">${esc(c.pt)}</div>`}
          ${c.fix ? `<div class="fix"><b>Corrigir:</b> ${esc(c.fix)}</div>` : ""}
          ${c.c ? `<div class="small muted center mt">${esc(c.c)} ${c.n ? "· novo HSK " + c.n : ""}${c.o ? " · HSK 2.0 nível " + c.o : ""}</div>` : ""}</div>`;
        if (reverse) speak(c.h);
        $("#gr").innerHTML = `<div class="grade">${[[1, "Errei"], [2, "Difícil"], [3, "Bom"], [4, "Fácil"]].map(([q, l]) =>
          `<button class="btn g${q}" data-q="${q}">${l}<small>${ivlLabel(c, q)}</small></button>`).join("")}</div>`;
        $("#gr").querySelectorAll("[data-q]").forEach(b => b.onclick = () => { grade(c, +b.dataset.q); done++; next(); });
      };
    };
    next();
  }

  // ---------- TREINAR ----------
  // Pool: palavras já vistas nos cartões; se poucas, usa o filtro inteiro.
  function pool(f, preferSeen) {
    const all = cards.filter(c => matches(c, f));
    const seen = all.filter(c => S.srs[c.key]);
    return preferSeen && seen.length >= 10 ? seen : all;
  }
  let trainFilter = { src: "vistas", p: 0 };
  function trainPool() {
    const f = trainFilter.p ? { p: +trainFilter.p } : null;
    if (trainFilter.src === "vistas") { const s = cards.filter(c => S.srs[c.key] && matches(c, f)); if (s.length >= 8) return s; }
    if (trainFilter.src === "erradas") { const s = cards.filter(c => S.srs[c.key] && S.srs[c.key].lapses > 0 && matches(c, f)); if (s.length >= 4) return s; }
    if (trainFilter.src === "revisar") return cards.filter(c => c.rev);
    return cards.filter(c => matches(c, f));
  }
  function viewTreinar() {
    h(`<div class="card"><div class="small muted">Palavras usadas</div>
        <div class="filters mt"><select id="src">
          <option value="vistas">Já vistas nos cartões</option><option value="erradas">Que já errei</option>
          <option value="revisar">Revisar primeiro (caderno)</option><option value="todas">Todas</option></select>
        <select id="tp"><option value="0">Todas</option><option value="1">Prioridade 1</option><option value="2">Prioridade 2</option><option value="3">Prioridade 3</option></select></div>
        <div class="small muted" id="cnt"></div></div>
      <div class="menu">
        <button class="item" data-m="quiz-pt"><span class="ico">义</span><span><b>汉字 → Português</b><small>Múltipla escolha</small></span></button>
        <button class="item" data-m="quiz-hz"><span class="ico">字</span><span><b>Português → 汉字</b><small>Múltipla escolha</small></span></button>
        <button class="item" data-m="tons"><span class="ico">声</span><span><b>Tons</b><small>Escolha o pinyin com o tom certo</small></span></button>
        <button class="item" data-m="ouvir"><span class="ico">耳</span><span><b>Ouvir e reconhecer</b><small>Ouça e escolha o caractere</small></span></button>
        <button class="item" data-m="ditado"><span class="ico">听</span><span><b>Ditado com tom</b><small>Ouça e digite o pinyin (ni3hao3 ou nǐhǎo)</small></span></button>
        <button class="item" data-m="escrita"><span class="ico">写</span><span><b>Escrita à mão</b><small>Desenhe no quadro 米字格</small></span></button>
        <button class="item" data-m="simulado"><span class="ico">考</span><span><b>Simulado misto (20 questões)</b><small>Critério do plano: ≥ 70%</small></span></button>
      </div>
      ${S.hist.length ? `<h2>Últimos resultados</h2><div class="card small">${S.hist.slice(-8).reverse().map(r => `${fmtDate(r.d)} · ${esc(r.modo)}: <b>${r.ok}/${r.tot}</b> (${Math.round(100 * r.ok / r.tot)}%)`).join("<br>")}</div>` : ""}`);
    $("#src").value = trainFilter.src; $("#tp").value = trainFilter.p;
    const upd = () => { trainFilter.src = $("#src").value; trainFilter.p = $("#tp").value; $("#cnt").textContent = trainPool().length + " palavras no conjunto"; };
    $("#src").onchange = upd; $("#tp").onchange = upd; upd();
    view.querySelectorAll("[data-m]").forEach(b => b.onclick = () => {
      const p = trainPool(), m = b.dataset.m, t = b.querySelector("b").textContent;
      const fns = { "quiz-pt": () => quiz(p, "pt", 15), "quiz-hz": () => quiz(p, "hz", 15), tons: () => tons(p, 15), ouvir: () => quiz(p, "ouvir", 15),
        ditado: () => ditado(p, 20), escrita: () => escrita(p, 8), simulado: () => simulado(p) };
      go(fns[m], t);
    });
  }

  function finish(modo, ok, tot, again) {
    S.hist.push({ d: today(), modo, ok, tot }); if (S.hist.length > 200) S.hist.shift();
    const r = dayRec(); r.treino = (r.treino || 0) + 1; save();
    const pct = Math.round(100 * ok / tot);
    h(`<div class="card center"><div class="big-hz">${pct >= 90 ? "太好了!" : pct >= 70 ? "不错!" : "加油!"}</div>
       <p><b>${ok} de ${tot}</b> (${pct}%)</p><p class="muted small">${pct >= 70 ? "Acima do critério de 70%." : "Abaixo de 70%: revise as palavras erradas nos cartões."}</p>
       <div class="btns"><button class="btn primary" id="again">Repetir</button><button class="btn" id="out">Voltar</button></div></div>`);
    $("#again").onclick = again; $("#out").onclick = back;
  }
  function markWrong(c) { // erro em treino antecipa a revisão do cartão
    const s = S.srs[c.key]; if (s) { s.due = Math.min(s.due, startOfToday() + DAY); s.lapses = (s.lapses || 0) + 1; save(); }
  }

  function quiz(p, mode, n, onDone) {
    const items = sample(p, Math.min(n, p.length)); let i = 0, ok = 0;
    const step = () => {
      if (i >= items.length) return onDone ? onDone(ok, items.length) : finish({ pt: "汉字→PT", hz: "PT→汉字", ouvir: "Ouvir" }[mode], ok, items.length, () => quiz(p, mode, n));
      const c = items[i];
      const others = sample(cards.filter(x => x.h !== c.h && x.pt !== c.pt && (mode !== "pt" || x.p === c.p || c.rev)), 3);
      const opts = shuffle([c].concat(others));
      const q = mode === "pt" ? `<div class="big-hz">${esc(c.h)}</div>`
        : mode === "hz" ? `<div class="pt" style="font-size:22px;margin:24px 0">${esc(c.pt)}</div>`
        : `<div class="center" style="margin:24px 0"><button class="speak" style="width:88px;height:88px;font-size:40px" data-say="${esc(c.h)}">🔊</button></div>`;
      h(`<div class="small muted">${i + 1} / ${items.length} · acertos ${ok}</div><div class="card">${q}
        <div class="opts">${opts.map((o, k) => `<button class="opt ${mode === "pt" ? "" : "hzopt"}" data-k="${k}">${esc(mode === "pt" ? o.pt : o.h)}</button>`).join("")}</div>
        <div id="fb"></div></div>`);
      if (mode === "ouvir") speak(c.h);
      view.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        if (view.querySelector(".opt.ok")) return;
        const o = opts[+b.dataset.k]; const right = o === c;
        view.querySelectorAll(".opt").forEach(x => { if (opts[+x.dataset.k] === c) x.classList.add("ok"); });
        if (!right) { b.classList.add("no"); markWrong(c); } else ok++;
        $("#fb").innerHTML = `<div class="answer"><div class="row"><div class="grow"><span class="mid-hz">${esc(c.h)}</span> ${colorPy(c.y)}<div class="small">${esc(c.pt)}</div></div>${speakBtn(c.h)}</div>
          <button class="btn primary block mt" id="nx">Próxima</button></div>`;
        if (mode !== "ouvir") speak(c.h);
        $("#nx").onclick = () => { i++; step(); };
      });
    };
    step();
  }

  function tons(p, n, onDone) {
    const cand = p.filter(c => toneVariants(c.y, 3).length >= 2);
    const items = sample(cand.length ? cand : cards.filter(c => toneVariants(c.y, 3).length >= 2), n); let i = 0, ok = 0;
    const step = () => {
      if (i >= items.length) return onDone ? onDone(ok, items.length) : finish("Tons", ok, items.length, () => tons(p, n));
      const c = items[i]; const opts = shuffle([c.y].concat(toneVariants(c.y, 3)));
      h(`<div class="small muted">${i + 1} / ${items.length} · acertos ${ok}</div><div class="card">
        <div class="row" style="justify-content:center"><div class="big-hz">${esc(c.h)}</div>${speakBtn(c.h)}</div><div class="pt small">${esc(c.pt)}</div>
        <div class="opts">${opts.map((o, k) => `<button class="opt" style="text-align:center;font-size:22px" data-k="${k}">${esc(o)}</button>`).join("")}</div><div id="fb"></div></div>`);
      view.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        if (view.querySelector(".opt.ok")) return;
        const right = opts[+b.dataset.k] === c.y;
        view.querySelectorAll(".opt").forEach(x => { if (opts[+x.dataset.k] === c.y) { x.classList.add("ok"); x.innerHTML = colorPy(c.y); } });
        if (!right) { b.classList.add("no"); markWrong(c); } else ok++;
        speak(c.h);
        $("#fb").innerHTML = `<button class="btn primary block mt" id="nx">Próxima</button>`;
        $("#nx").onclick = () => { i++; step(); };
      });
    };
    step();
  }

  function ditado(p, n, onDone) {
    const items = sample(p, Math.min(n, p.length)); let i = 0, ok = 0; const erros = [];
    const step = () => {
      if (i >= items.length) {
        if (onDone) return onDone(ok, items.length);
        finish("Ditado", ok, items.length, () => ditado(p, n));
        if (erros.length) view.insertAdjacentHTML("beforeend", `<h2>Para rever</h2><div class="card">${erros.map(([c, a]) =>
          `<div class="row" style="padding:6px 0"><span class="mid-hz">${esc(c.h)}</span><span class="grow">${colorPy(c.y)}<br><span class="small muted">você: ${esc(a || "—")}</span></span>${speakBtn(c.h)}</div>`).join("")}</div>`);
        return;
      }
      const c = items[i];
      h(`<div class="small muted">${i + 1} / ${items.length} · acertos ${ok}</div><div class="card center">
        <button class="speak" style="width:88px;height:88px;font-size:40px;margin:12px auto" data-say="${esc(c.h)}">🔊</button>
        <div class="pt">${esc(c.pt)}</div>
        <div class="mt"><input type="text" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="pinyin com tom: ni3 hao3"></div>
        <div class="small muted mt" id="prev"></div>
        <div class="btns mt"><button class="btn" id="skip">Não sei</button><button class="btn primary" id="chk">Conferir</button></div><div id="fb"></div></div>`);
      speak(c.h);
      const inp = $("#in"); inp.focus();
      inp.oninput = () => $("#prev").textContent = inp.value ? "→ " + numToMarks(inp.value) : "";
      const check = give => {
        if ($("#nx")) return;
        const a = inp.value; const right = !give && pyAlternatives(c.y).indexOf(normPy(a)) >= 0;
        if (right) ok++; else { erros.push([c, a]); markWrong(c); }
        $("#fb").innerHTML = `<div class="feedback ${right ? "ok" : "no"}">${right ? "Certo!" : "Resposta:"} <span class="mid-hz">${esc(c.h)}</span> ${colorPy(c.y)}</div>
          <button class="btn primary block mt" id="nx">Próxima</button>`;
        $("#nx").onclick = () => { i++; step(); };
      };
      $("#chk").onclick = () => check(false); $("#skip").onclick = () => check(true);
      inp.onkeydown = e => { if (e.key === "Enter") { $("#nx") ? $("#nx").click() : check(false); } };
    };
    step();
  }

  // Escrita: quadro 米字格 com desenho livre e modelo opcional
  function escrita(p, n) {
    const chars = []; const seen = new Set();
    shuffle(p).forEach(c => [...c.h].forEach(ch => { if (/\p{Script=Han}/u.test(ch) && !seen.has(ch) && chars.length < n) { seen.add(ch); chars.push({ ch, c }); } }));
    let i = 0, ok = 0, ghost = true;
    const step = () => {
      if (i >= chars.length) return finish("Escrita", ok, chars.length, () => escrita(p, n));
      const { ch, c } = chars[i];
      h(`<div class="small muted">${i + 1} / ${chars.length}</div><div class="card">
        <div class="row"><div class="grow"><b class="mid-hz">${esc(c.h)}</b> ${colorPy(c.y)}<div class="small">${esc(c.pt)}</div></div>${speakBtn(c.h)}</div>
        <div class="canvas-wrap" id="cw">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" stroke="currentColor" style="color:var(--line)" stroke-width=".6" stroke-dasharray="2 2">
            <line x1="0" y1="50" x2="100" y2="50"/><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/></svg>
          <div class="ghost" id="gh">${esc(ch)}</div><canvas id="cv"></canvas></div>
        <label class="toggle"><input type="checkbox" id="gt" ${ghost ? "checked" : ""}><span>Mostrar modelo para cobrir (desligue para escrever de memória)</span></label>
        <div class="btns"><button class="btn" id="clr">Apagar</button><button class="btn" id="bad">Errei</button><button class="btn primary" id="good">Acertei</button></div></div>`);
      const cw = $("#cw"), cv = $("#cv"), gh = $("#gh");
      const r = cw.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
      cv.width = r.width * dpr; cv.height = r.height * dpr; gh.style.fontSize = (r.width * 0.82) + "px";
      gh.style.visibility = ghost ? "visible" : "hidden";
      const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr); ctx.lineCap = ctx.lineJoin = "round"; ctx.lineWidth = Math.max(6, r.width / 28);
      ctx.strokeStyle = getComputedStyle(document.body).color;
      let drawing = false, last = null;
      const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      cv.onpointerdown = e => { drawing = true; last = pt(e); cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.arc(last[0], last[1], ctx.lineWidth / 2, 0, 7); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); };
      cv.onpointermove = e => { if (!drawing) return; const q = pt(e); ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); last = q; };
      cv.onpointerup = cv.onpointercancel = () => drawing = false;
      $("#gt").onchange = e => { ghost = e.target.checked; gh.style.visibility = ghost ? "visible" : "hidden"; };
      $("#clr").onclick = () => ctx.clearRect(0, 0, cv.width, cv.height);
      $("#good").onclick = () => { ok++; i++; step(); };
      $("#bad").onclick = () => { markWrong(c); gh.style.visibility = "visible"; $("#bad").disabled = true; $("#good").textContent = "Próxima"; $("#good").onclick = () => { i++; step(); }; };
    };
    step();
  }

  function simulado(p) {
    // 5 汉字→PT, 5 PT→汉字, 5 tons, 5 ditado
    let total = 0, acc = 0;
    const part = (k, ok, tot) => { acc += ok; total += tot; parts[k] && parts[k](); };
    const parts = [
      () => quiz(p, "pt", 5, (o, t) => part(1, o, t)),
      () => quiz(p, "hz", 5, (o, t) => part(2, o, t)),
      () => tons(p, 5, (o, t) => part(3, o, t)),
      () => ditado(p, 5, (o, t) => part(4, o, t)),
      () => finish("Simulado", acc, total, () => simulado(p))
    ];
    parts[0]();
  }

  // ---------- GRAMÁTICA ----------
  const DICT = new Set(cards.map(c => c.h).concat(X.basicas));
  function segment(s) {
    const out = []; const chs = [...s]; let i = 0;
    while (i < chs.length) {
      const ch = chs[i];
      if (/[，。？！、：；,.?!]/.test(ch)) { if (out.length) out[out.length - 1] += ch; i++; continue; }
      if (!/\p{Script=Han}/u.test(ch)) { // letras/números juntos (ex.: HSK)
        let j = i; while (j < chs.length && !/\p{Script=Han}|[，。？！、：；,.?!\s]/u.test(chs[j])) j++;
        if (j === i) { i++; continue; } out.push(chs.slice(i, j).join("")); i = j; continue;
      }
      let L = Math.min(4, chs.length - i);
      for (; L > 1; L--) if (DICT.has(chs.slice(i, i + L).join(""))) break;
      out.push(chs.slice(i, i + L).join("")); i += L;
    }
    return out;
  }
  function gramNum(g) { return parseInt(g.id.slice(1), 10); }
  function viewGramatica(range) {
    const list = D.gramatica.filter(g => !range || (gramNum(g) >= range[0] && gramNum(g) <= range[1]));
    const grp = [1, 2, 3].map(p => ({ p, gs: list.filter(g => g.p === p) })).filter(x => x.gs.length);
    h(`${range ? "" : `<div class="card small muted">50 pontos do diagnóstico (G01–G50). Toque num ponto para ver o exemplo e treinar montando a frase.</div>`}
      <button class="btn primary block" id="allq">Montar frases (${list.length} pontos, ordem aleatória)</button>
      ${grp.map(x => `<h2>Prioridade ${x.p}: ${["", "HSK 1", "HSK 2", "HSK 3"][x.p]}</h2><div class="menu">${x.gs.map(g => {
        const st = S.gram[g.id];
        return `<button class="item" data-g="${g.id}"><span class="ico" style="font-family:inherit;font-size:13px;font-weight:700">${g.id}</span><span class="grow"><b>${esc(g.ponto)}</b><small>${esc(g.padrao)}${st ? ` · ${st.ok}/${st.tot} ✓` : ""}</small></span></button>`;
      }).join("")}</div>`).join("")}`);
    $("#allq").onclick = () => go(() => montar(shuffle(list), 0, 0), "Montar frases");
    view.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { const g = D.gramatica.find(x => x.id === b.dataset.g); go(() => gramDetail(g), g.id); });
  }
  function gramDetail(g) {
    const words = segment(g.ex).map(w => w.replace(/[，。？！、：；,.?!]/g, "")).filter(w => byKey && cards.find(c => c.h === w));
    const uniq = [...new Set(words)].map(w => cards.find(c => c.h === w));
    h(`<div class="card"><b>${esc(g.ponto)}</b><div class="fix mt"><b>Padrão:</b> ${esc(g.padrao)}</div>
       <div class="row mt"><div class="grow"><div class="mid-hz">${esc(g.ex)}</div><div>${colorPy(g.y)}</div><div class="muted">${esc(g.pt)}</div></div>${speakBtn(g.ex)}</div>
       <div class="small muted mt">Curso mandarim-hsk: ${esc(g.curso || "—")}</div></div>
       ${uniq.length ? `<h2>Palavras da lista neste exemplo</h2><div class="card list">${uniq.map(c => `<div class="w"><span class="hz">${esc(c.h)}</span><span class="grow">${colorPy(c.y)}<br><span class="small">${esc(c.pt)}</span></span>${speakBtn(c.h)}</div>`).join("")}</div>` : ""}
       <button class="btn primary block" id="tr">Montar esta frase</button>
       <h2>我的句子</h2><div class="card"><div class="small muted">Escreva 5 frases suas com este ponto (fica salvo no aparelho).</div>
       <textarea id="mine" style="font-family:var(--hz);font-size:18px" placeholder="我…">${esc((S.mine || {})[g.id] || "")}</textarea></div>`);
    $("#tr").onclick = () => go(() => montar([g], 0, 0), "Montar frase");
    $("#mine").oninput = e => { S.mine = S.mine || {}; S.mine[g.id] = e.target.value; save(); };
  }
  function montar(gs, i, ok) {
    if (i >= gs.length) return finish("Montar frases", ok, gs.length, () => montar(shuffle(gs), 0, 0));
    const g = gs[i];
    const sentence = g.ex.split(/(?<=[。？！])/)[0];
    let toks = segment(sentence);
    if (toks.length < 3) toks = [...sentence].reduce((a, ch) => (/[，。？！、]/.test(ch) && a.length ? a[a.length - 1] += ch : a.push(ch), a), []);
    let order = shuffle(toks.map((t, k) => k)); if (toks.length > 1 && order.every((v, k) => v === k)) order.reverse();
    const picked = [];
    const draw = () => {
      h(`<div class="small muted">${i + 1} / ${gs.length} · ${g.id}</div><div class="card">
        <div class="pt">${esc(sentence === g.ex ? g.pt : g.pt.split(/(?<=[.?!])\s/)[0])}</div>
        <div class="small muted center">${esc(g.padrao)}</div>
        <div class="tokens" id="ans">${picked.map((k, j) => `<button class="tok" data-j="${j}">${esc(toks[k])}</button>`).join("")}</div>
        <div class="tokens" style="border-style:solid">${order.map(k => `<button class="tok ${picked.indexOf(k) >= 0 ? "used" : ""}" data-k="${k}">${esc(toks[k])}</button>`).join("")}</div>
        <div class="btns"><button class="btn" id="skip">Ver resposta</button><button class="btn primary" id="chk" ${picked.length === toks.length ? "" : "disabled"}>Conferir</button></div><div id="fb"></div></div>`);
      view.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { if (!b.classList.contains("used")) { picked.push(+b.dataset.k); draw(); } });
      view.querySelectorAll("[data-j]").forEach(b => b.onclick = () => { picked.splice(+b.dataset.j, 1); draw(); });
      const check = give => {
        const right = !give && picked.map(k => toks[k]).join("") === toks.join("");
        const st = S.gram[g.id] = S.gram[g.id] || { ok: 0, tot: 0 }; st.tot++; if (right) { st.ok++; ok++; } save();
        $("#fb").innerHTML = `<div class="feedback ${right ? "ok" : "no"}">${right ? "Certo!" : "Ordem correta:"}<div class="mid-hz">${esc(sentence)}</div><div style="font-weight:400">${colorPy(g.y)}</div></div>
          <button class="btn primary block mt" id="nx">Próxima</button>`;
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
      <button class="item" id="m-lista"><span class="ico">表</span><span><b>Lista de vocabulário</b><small>932 palavras + 20 para revisar · busca e filtros</small></span></button>
      <button class="item" id="m-erros"><span class="ico">错</span><span><b>Erros recorrentes</b><small>Gramática, traços, tons (diagnóstico do caderno)</small></span></button>
      <button class="item" id="m-plano"><span class="ico">划</span><span><b>Plano de 4 semanas</b><small>26/11 a 23/12 + encaixe no curso</small></span></button>
      <button class="item" id="m-backup"><span class="ico">存</span><span><b>Backup do progresso</b><small>Exportar e importar</small></span></button>
      <button class="item" id="m-cfg"><span class="ico">设</span><span><b>Áudio e configurações</b><small>Voz chinesa, velocidade, zerar progresso</small></span></button>
    </div>`);
    $("#m-lista").onclick = () => go(viewLista, "Vocabulário");
    $("#m-erros").onclick = () => go(viewErros, "Erros recorrentes");
    $("#m-plano").onclick = () => go(viewPlano, "Plano");
    $("#m-backup").onclick = () => go(viewBackup, "Backup");
    $("#m-cfg").onclick = () => go(viewCfg, "Configurações");
  }
  let listState = { q: "", p: "0", t: "", s: "" };
  function viewLista() {
    h(`<input type="search" id="q" placeholder="Buscar 汉字, pinyin (sem tom) ou português" value="${esc(listState.q)}">
      <div class="filters mt"><select id="lp"><option value="0">Prioridade</option><option value="r">Revisar</option><option value="1">P1</option><option value="2">P2</option><option value="3">P3</option></select>
      <select id="lt"><option value="">Tema</option>${TEMAS.map(t => `<option>${esc(t)}</option>`).join("")}</select>
      <select id="ls"><option value="">Status</option><option value="0">Novas</option><option value="1">Aprendendo</option><option value="2">Dominadas</option></select></div>
      <div class="small muted" id="lc"></div><div class="list" id="ll"></div>`);
    $("#lp").value = listState.p; $("#lt").value = listState.t; $("#ls").value = listState.s;
    const draw = () => {
      listState = { q: $("#q").value, p: $("#lp").value, t: $("#lt").value, s: $("#ls").value };
      const q = stripTones(listState.q.toLowerCase().trim()).replace(/\s/g, "");
      const res = cards.filter(c => (listState.p === "0" || (listState.p === "r" ? c.rev : c.p === +listState.p)) && (!listState.t || c.t === listState.t)
        && (listState.s === "" || status(c) === +listState.s)
        && (!q || c.h.indexOf(listState.q.trim()) >= 0 || stripTones(c.y.toLowerCase()).replace(/\s/g, "").indexOf(q) >= 0 || stripTones(c.pt.toLowerCase()).indexOf(q) >= 0));
      $("#lc").textContent = res.length + " palavras";
      $("#ll").innerHTML = res.slice(0, 300).map(c => `<div class="w"><span class="hz">${esc(c.h)}</span><span class="grow">${colorPy(c.y)}<br><span class="small">${esc(c.pt)}</span>${c.fix ? `<br><span class="small muted">${esc(c.fix)}</span>` : ""}</span>
        <span class="lvl"><span class="dot s${status(c)}"></span>${c.rev ? "rev" : "P" + c.p}<br>${c.c ? esc(c.c.replace("aula ", "a")) : c.l === "só novo HSK" ? "◆" : ""}</span>${speakBtn(c.h)}</div>`).join("")
        + (res.length > 300 ? `<div class="small muted center mt">Mostrando 300. Refine a busca.</div>` : "");
    };
    $("#q").oninput = draw; $("#lp").onchange = draw; $("#lt").onchange = draw; $("#ls").onchange = draw; draw();
  }
  function viewErros() {
    h(Object.keys(X.erros).map(sec => `<h2>${esc(sec)}</h2>` + X.erros[sec].map(([p, w, r, why]) =>
      `<div class="card err"><div class="small muted">p. ${esc(p)}</div><div class="wrong">${esc(w)}</div><div class="right">${esc(r)}</div><div class="small">${esc(why)}</div></div>`).join("")).join("")
      + `<button class="btn primary block mt" id="rv">Treinar as 20 palavras do caderno</button>`);
    $("#rv").onclick = () => go(() => study({ rev: true, temas: [], p: 99 }), "Revisar primeiro");
  }
  function viewPlano() {
    const wi = currentWeek();
    h(X.semanas.map((w, k) => `<div class="card week ${k === wi ? "now" : ""}"><b>Semana ${k + 1}</b> <span class="small muted">${fmtDate(w.ini)} – ${fmtDate(w.fim)}${k === wi ? (today() < w.ini ? " · próxima" : " · atual") : ""}</span>
      <dl><dt>Vocabulário</dt><dd>${esc(w.vocab)}</dd><dt>Gramática</dt><dd>${esc(w.gram)}</dd><dt>Critério</dt><dd>${esc(w.crit)}</dd></dl>
      <div class="btns mt"><button class="btn" data-w="${k}">Cartões</button><button class="btn" data-g="${k}">Gramática</button><button class="btn" data-d="${k}">Ditado 20</button></div></div>`).join("")
      + `<h2>Como encaixar no curso</h2><div class="card small">
      1. <b>Medir antes de avançar</b>: fazer o simulado HSK 1 (meta ≥ 70%).<br>
      2. <b>Trilha de reforço</b> 3×/semana com as aulas 09–21 (HSK 1) + “我的句子” e “错题本”.<br>
      3. <b>Tons e escrita todo dia</b>: ditado de 10 palavras + 5 caracteres à mão.<br>
      4. <b>Migrar para o novo HSK</b>: 418 palavras ◆ só existem no novo programa.<br>
      5. <b>15 cartões novos por dia</b> na ordem da prioridade (~2 meses no total).<br>
      6. <b>Uma fonte principal</b>; as outras só como revisão.</div>`);
    view.querySelectorAll("[data-w]").forEach(b => b.onclick = () => { const w = X.semanas[+b.dataset.w]; go(() => study(w.filtro), "Cartões · semana " + (+b.dataset.w + 1)); });
    view.querySelectorAll("[data-g]").forEach(b => b.onclick = () => go(() => viewGramatica(X.semanas[+b.dataset.g].g), "Gramática"));
    view.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { const w = X.semanas[+b.dataset.d]; go(() => ditado(pool(w.filtro, false), 20), "Ditado"); });
  }
  function viewBackup() {
    const data = JSON.stringify(S);
    h(`<div class="card"><b>Exportar</b><div class="small muted">Guarde este texto (e-mail, Drive, notas). Ele contém todo o seu progresso.</div>
       <div class="btns mt">${A && A.share ? `<button class="btn primary" id="share">Compartilhar</button>` : ""}<button class="btn" id="copy">Copiar</button></div>
       <textarea id="out" readonly class="mt">${esc(data)}</textarea></div>
       <div class="card"><b>Importar</b><div class="small muted">Cole um backup e toque em Restaurar. Substitui o progresso atual.</div>
       <textarea id="inp" class="mt" placeholder='{"srs":{...}}'></textarea><button class="btn block mt" id="rest">Restaurar</button></div>`);
    if ($("#share")) $("#share").onclick = () => A.share("HSK Estudos backup " + today(), data);
    $("#copy").onclick = () => { if (A && A.copy) A.copy(data); else { $("#out").select(); document.execCommand("copy"); } toast("Copiado"); };
    $("#rest").onclick = () => {
      try { const n = JSON.parse($("#inp").value); if (!n.srs) throw 0; S = n; S.cfg = Object.assign({ novos: 15, reverso: false, rate: 0.8 }, S.cfg || {}); S.days = S.days || {}; S.hist = S.hist || []; S.gram = S.gram || {}; save(); toast("Progresso restaurado"); }
      catch (e) { toast("Texto inválido"); }
    };
  }
  function viewCfg() {
    const ttsOk = A && A.ttsAvailable ? A.ttsAvailable() : !!window.speechSynthesis;
    h(`<div class="card"><b>Áudio</b><div class="small ${ttsOk ? "muted" : ""}" style="${ttsOk ? "" : "color:var(--bad)"}">${ttsOk ? "Voz chinesa disponível." : "Voz chinesa não encontrada. Instale “Chinês (China)” no mecanismo de voz do Google (funciona sem internet depois de baixado)."}</div>
       <label class="toggle"><span class="grow">Velocidade</span><select id="rate" style="width:110px">${[0.5, 0.6, 0.7, 0.8, 0.9, 1].map(r => `<option value="${r}" ${r === S.cfg.rate ? "selected" : ""}>${r}×</option>`).join("")}</select></label>
       <div class="btns"><button class="btn" id="test">Testar 你好</button>${A && A.openTtsSettings ? `<button class="btn" id="tts">Configurar voz</button>` : ""}</div></div>
       <div class="card"><b>Zerar progresso</b><div class="small muted">Apaga cartões, histórico e frases. Faça backup antes.</div><button class="btn block mt" id="reset" style="color:var(--bad)">Zerar tudo</button></div>
       <div class="small muted center">HSK Estudos · ${cards.length} palavras · ${D.gramatica.length} pontos de gramática · 100% offline</div>`);
    $("#rate").onchange = e => { S.cfg.rate = +e.target.value; save(); };
    $("#test").onclick = () => speak("你好，我是学汉语的学生。");
    if ($("#tts")) $("#tts").onclick = () => A.openTtsSettings();
    let armed = false;
    $("#reset").onclick = e => {
      if (!armed) { armed = true; e.target.textContent = "Toque de novo para confirmar"; return; }
      S = { srs: {}, cfg: S.cfg, days: {}, hist: [], gram: {} }; save(); toast("Progresso zerado"); tab("hoje");
    };
  }

  tab("hoje");
})();
