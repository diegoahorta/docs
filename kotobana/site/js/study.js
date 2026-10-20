// Estudar: flashcards com repetição espaçada.
import { S, CLS, $, esc, deck, pitchHTML, speak, hasTTS, SPEAKER, grade, previewInterval, gain, status, STATUS_LABEL, deckPicker, dueCount } from "./core.js";

export function studyView(el) {
  let current = null, shown = false, done = 0, right = 0;
  el.innerHTML = `
    <div class="page-head"><h1>Estudar</h1>
      <p class="muted">Primeiro vêm as revisões vencidas, depois palavras novas (★★★ primeiro). Seja honesto na nota: é ela que decide quando a palavra volta.</p></div>
    <div class="study-layout">
      <aside class="side"><div id="picker"></div>
        <div class="prow"><span class="plbl">Direção</span>
          <label class="chip"><input type="radio" name="dir" value="jp" ${S.prefs.dir !== "pt" ? "checked" : ""}>日本語 → PT</label>
          <label class="chip"><input type="radio" name="dir" value="pt" ${S.prefs.dir === "pt" ? "checked" : ""}>PT → 日本語</label></div>
        <div class="session muted" id="session"></div>
      </aside>
      <div id="card"></div>
    </div>`;
  deckPicker($("#picker", el), () => { current = null; render(); });
  el.addEventListener("change", e => { if (e.target.name === "dir") { S.prefs.dir = e.target.value; render(); } });

  function next(d) {
    const now = Date.now();
    const due = d.filter(v => S.srs[v.id] && S.srs[v.id].due <= now).sort((a, b) => S.srs[a.id].due - S.srs[b.id].due);
    if (due.length) return due[0];
    return d.filter(v => !S.srs[v.id]).sort((a, b) => (b.imp || 0) - (a.imp || 0) || a.licao - b.licao || a.no - b.no)[0] || null;
  }

  function render() {
    const d = deck();
    if (!current || !d.includes(current)) { current = next(d); shown = false; }
    $("#session", el).innerHTML = `Nesta sessão: <b>${done}</b> respondidas · <b>${done ? Math.round(right / done * 100) : 0}%</b> de acerto<br>${dueCount(d)} revisões pendentes`;
    const box = $("#card", el);
    if (!current) {
      box.innerHTML = `<div class="card empty">${d.length ? "Tudo em dia. Volte mais tarde, aprenda uma lição nova ou jogue um pouco." : "Nenhuma palavra com esse filtro. Marque ao menos um livro e uma importância."}
        <div class="row center"><a class="btn" href="#aprender">Aprender</a><a class="btn" href="#jogar">Jogar</a></div></div>`;
      return;
    }
    const v = current, jp = S.prefs.dir !== "pt", st = status(v.id);
    box.innerHTML = `<div class="card flash ${shown ? "shown" : ""}">
      <div class="meta"><span class="code">${esc(v.id)}</span><span>Livro ${v.livro} · Lição ${v.licao}</span>
        <span class="stars">${"★".repeat(v.imp || 0)}</span><span class="pill ${st}">${STATUS_LABEL[st]}</span></div>
      <div class="front">${jp ? `<div class="big-jp">${esc(v.palavra)}</div>` : `<div class="big-pt">${esc(v.pt)}</div><div class="muted">${esc(CLS[v.cls])}</div>`}</div>
      ${shown ? `<div class="answer">
        ${jp ? `<div class="ans-pt">${esc(v.pt)}</div>` : `<div class="big-jp">${esc(v.palavra)}</div>`}
        ${pitchHTML(v)}
        <div class="muted">${esc(v.romaji)} · ${esc(CLS[v.cls])}</div>
        ${v.nota ? `<div class="note">${esc(v.nota)}</div>` : ""}
        ${hasTTS ? `<button class="btn ghost" id="say">${SPEAKER} Ouvir</button>` : ""}
      </div>
      <div class="grades">${["Errei", "Difícil", "Bom", "Fácil"].map((t, q) =>
        `<button class="btn g${q}" data-q="${q}">${t}<small>${previewInterval(v.id, q)}</small></button>`).join("")}</div>
      <div class="muted small center">Teclas 1 · 2 · 3 · 4</div>`
      : `<button class="btn primary wide" id="show">Mostrar resposta</button><div class="muted small center">Espaço</div>`}
    </div>`;
    if (shown && jp) speak(v);
  }
  function reveal() { if (current && !shown) { shown = true; render(); } }
  function answer(q) {
    grade(current.id, q); done++; if (q > 0) right++;
    gain(q === 0 ? 1 : 2); current = null; render();
  }
  el.addEventListener("click", e => {
    if (e.target.closest("#show")) reveal();
    else if (e.target.closest("#say")) speak(current);
    else { const b = e.target.closest("[data-q]"); if (b) answer(+b.dataset.q); }
  });
  const onKey = e => {
    if (e.target.matches("input,select,textarea")) return;
    if (!shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); reveal(); }
    else if (shown && current && ["1", "2", "3", "4"].includes(e.key)) answer(+e.key - 1);
  };
  document.addEventListener("keydown", onKey);
  render();
  return () => document.removeEventListener("keydown", onKey);
}
