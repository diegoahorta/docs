// Aprender: navegar lição por lição, ver cada palavra em detalhe e marcar como vista.
import { S, VOCAB, BOOKS, CLS, $, $$, esc, pitchHTML, speak, hasTTS, SPEAKER, save, gain, status, STATUS_LABEL } from "./core.js";

export function learnView(el) {
  let book = S.prefs.books[0] || 1;
  let lesson = Math.max(BOOKS[book][0], Math.min(S.prefs.from, BOOKS[book][1]));
  let idx = -1; // palavra aberta no modo apresentação

  const words = () => VOCAB.filter(v => v.livro === book && v.licao === lesson)
    .sort((a, b) => (b.imp || 0) - (a.imp || 0) || a.leitura.localeCompare(b.leitura, "ja"));

  function markSeen(v) {
    if (S.seen[v.id]) return;
    S.seen[v.id] = 1; gain(1);
  }

  function render() {
    const w = words(), seen = w.filter(v => S.seen[v.id]).length;
    const [a, z] = BOOKS[book];
    el.innerHTML = `
      <div class="page-head">
        <h1>Aprender</h1>
        <p class="muted">Escolha uma lição, ouça cada palavra e observe o acento: a linha marca o tom alto e o degrau, a queda.</p>
      </div>
      <div class="learn-nav">
        <div class="seg" role="tablist" aria-label="Livro">${Object.keys(BOOKS).map(b =>
          `<button data-book="${b}" aria-selected="${+b === book}">Livro ${b}</button>`).join("")}</div>
        <div class="lessons-strip">${Array.from({ length: z - a + 1 }, (_, i) => a + i).map(l => {
          const lw = VOCAB.filter(v => v.livro === book && v.licao === l);
          if (!lw.length) return "";
          const pct = lw.filter(v => S.seen[v.id]).length / lw.length;
          return `<button class="ls ${l === lesson ? "on" : ""} ${pct === 1 ? "done" : ""}" data-lesson="${l}" title="${lw.length} palavras">
            <b>${l}</b><i style="width:${pct * 100}%"></i></button>`;
        }).join("")}</div>
      </div>
      <div class="lesson-head">
        <h2>Lição ${lesson} <span class="muted">· ${w.length} palavras · ${seen} vistas</span></h2>
        <div class="row">
          <button class="btn" id="present">Apresentar uma a uma</button>
          <button class="btn" id="markall">Marcar todas como vistas</button>
          <a class="btn primary" href="#memorizar" id="test">Testar esta lição</a>
        </div>
      </div>
      <div class="wgrid">${w.map((v, i) => `
        <article class="wcard ${S.seen[v.id] ? "seen" : ""}" data-i="${i}" tabindex="0">
          <div class="wc-top"><span class="stars">${"★".repeat(v.imp || 0)}</span><span class="pill ${status(v.id)}">${STATUS_LABEL[status(v.id)]}</span></div>
          <div class="wc-word">${esc(v.palavra)}</div>
          ${pitchHTML(v)}
          <div class="wc-pt">${esc(v.pt)}</div>
          <div class="wc-meta muted">${esc(v.romaji)} · ${esc(CLS[v.cls])}</div>
          ${hasTTS ? `<button class="icon-btn" data-say="${i}" aria-label="Ouvir ${esc(v.leitura)}">${SPEAKER}</button>` : ""}
        </article>`).join("")}</div>
      <div id="present-layer"></div>`;
  }

  function renderPresent() {
    const w = words(), layer = $("#present-layer", el);
    if (idx < 0) { layer.innerHTML = ""; return; }
    const v = w[idx];
    markSeen(v);
    layer.innerHTML = `
      <div class="overlay" role="dialog" aria-label="Apresentação da lição">
        <div class="present">
          <div class="pr-top"><span class="muted">${idx + 1} / ${w.length}</span><span class="code">${esc(v.id)}</span>
            <button class="icon-btn" id="pr-close" aria-label="Fechar">✕</button></div>
          <div class="pr-word">${esc(v.palavra)}</div>
          ${pitchHTML(v)}
          <div class="pr-pt">${esc(v.pt)}</div>
          <div class="muted">${esc(v.romaji)} · ${esc(CLS[v.cls])} · ${"★".repeat(v.imp || 0)}</div>
          ${v.nota ? `<div class="note">${esc(v.nota)}</div>` : ""}
          <div class="pr-nav">
            <button class="btn" id="pr-prev" ${idx === 0 ? "disabled" : ""}>Anterior</button>
            ${hasTTS ? `<button class="btn" id="pr-say">${SPEAKER} Ouvir</button>` : ""}
            <button class="btn primary" id="pr-next">${idx === w.length - 1 ? "Concluir" : "Próxima"}</button>
          </div>
          <div class="muted small">Setas ← → para navegar · Esc para fechar</div>
        </div>
      </div>`;
    speak(v);
  }

  el.addEventListener("click", e => {
    const t = e.target.closest("button, article, a");
    if (!t) return;
    if (t.dataset.book) { book = +t.dataset.book; lesson = BOOKS[book][0]; idx = -1; render(); return; }
    if (t.dataset.lesson) { lesson = +t.dataset.lesson; idx = -1; render(); return; }
    if (t.dataset.say) { const v = words()[+t.dataset.say]; speak(v); markSeen(v); e.stopPropagation(); refreshCard(+t.dataset.say); return; }
    if (t.matches("article.wcard")) { idx = +t.dataset.i; renderPresent(); return; }
    if (t.id === "present") { idx = 0; renderPresent(); }
    if (t.id === "markall") { const w = words().filter(v => !S.seen[v.id]); w.forEach(v => (S.seen[v.id] = 1)); if (w.length) gain(w.length); else save(); render(); }
    if (t.id === "test") { S.prefs.books = [book]; S.prefs.from = S.prefs.to = lesson; save(); }
    if (t.id === "pr-close") { idx = -1; render(); }
    if (t.id === "pr-prev") { idx--; renderPresent(); }
    if (t.id === "pr-say") speak(words()[idx]);
    if (t.id === "pr-next") { if (idx < words().length - 1) { idx++; renderPresent(); } else { idx = -1; render(); } }
  });
  el.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("article.wcard")) e.target.click(); });
  function refreshCard(i) { const c = $(`article[data-i="${i}"]`, el); if (c) { c.classList.add("seen"); const p = $(".pill", c); p.className = "pill seen"; p.textContent = "vista"; } }

  const onKey = e => {
    if (idx < 0) return;
    if (e.key === "Escape") { idx = -1; render(); }
    if (e.key === "ArrowRight" && idx < words().length - 1) { idx++; renderPresent(); }
    if (e.key === "ArrowLeft" && idx > 0) { idx--; renderPresent(); }
  };
  document.addEventListener("keydown", onKey);
  render();
  return () => document.removeEventListener("keydown", onKey);
}
