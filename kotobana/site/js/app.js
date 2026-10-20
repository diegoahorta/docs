import { S, VOCAB, BOOKS, $, $$, esc, level, levelRange, onChange, toast, syncFromServer, dueCount, deck, status } from "./core.js";
import { learnView } from "./learn.js";
import { studyView } from "./study.js";
import { quizView } from "./quiz.js";
import { playView } from "./play.js";
import { progressView } from "./progress.js";

const VIEWS = { inicio: homeView, aprender: learnView, estudar: studyView, memorizar: quizView, jogar: playView, progresso: progressView };
let cleanup = null;

function homeView(el) {
  const seen = Object.keys(S.seen).length;
  const known = Object.values(S.srs).filter(s => s.iv >= 21).length;
  const due = dueCount(VOCAB);
  const next = VOCAB.find(v => status(v.id) === "new" && v.imp === 3);
  el.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">Kotobana 1–6 · ${VOCAB.length.toLocaleString("pt-BR")} palavras · 60 lições</p>
        <h1>Aprenda, pratique e brinque com o vocabulário do Kotobana.</h1>
        <p class="lead">Veja cada palavra com leitura, acento e áudio. Revise no momento certo com repetição espaçada. Teste a memória com quizzes e jogos em 3D.</p>
        <div class="hero-cta">
          <a class="btn primary" href="#${due ? "estudar" : "aprender"}">${due ? `Revisar ${due} palavras` : "Começar a aprender"}</a>
          <a class="btn" href="#jogar">Jogar</a>
        </div>
      </div>
      <div class="hero-word" aria-hidden="true">
        <div class="hw-k">${esc(next ? next.palavra : "ことば")}</div>
        <div class="hw-r">${esc(next ? next.leitura : "")}</div>
        <div class="hw-p">${esc(next ? next.pt : "palavra")}</div>
      </div>
    </section>

    <section class="stats" aria-label="Resumo">
      <div><b>${seen}</b><span>palavras estudadas</span></div>
      <div><b>${known}</b><span>memorizadas</span></div>
      <div><b>${due}</b><span>para revisar hoje</span></div>
      <div><b>${S.streak.count || 0}</b><span>dias seguidos</span></div>
    </section>

    <section class="modes">
      ${[
        ["aprender", "学", "Aprender", "Lição por lição: palavra, leitura, acento tonal, áudio e exemplos. Marque o que já viu."],
        ["estudar", "復", "Estudar", "Flashcards com repetição espaçada. Cada palavra volta no dia em que você está prestes a esquecer."],
        ["memorizar", "試", "Memorizar", "Quiz de 10 perguntas: significado, leitura, escrita em romaji e audição."],
        ["jogar", "遊", "Jogar", "Lanternas (acerte o significado antes que voem) e Karuta (encontre os pares) em 3D."],
      ].map(([k, kj, t, d]) => `<a class="mode" href="#${k}"><span class="mk">${kj}</span><span class="mt">${t}</span><span class="md">${d}</span></a>`).join("")}
    </section>

    <section class="books-mini">
      <h2>Livros</h2>
      <div class="bm-grid">${Object.entries(BOOKS).map(([b, [a, z]]) => {
        const w = VOCAB.filter(v => v.livro === +b), s = w.filter(v => S.seen[v.id]).length;
        return `<button class="bm" data-book="${b}"><span class="bm-t">Livro ${b}</span><span class="muted">Lições ${a}–${z} · ${w.length} palavras</span>
          <span class="bar"><i style="width:${(s / w.length * 100).toFixed(1)}%"></i></span><span class="muted small">${s} estudadas</span></button>`;
      }).join("")}</div>
    </section>`;
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-book]"); if (!b) return;
    const n = +b.dataset.book; S.prefs.books = [n]; [S.prefs.from, S.prefs.to] = BOOKS[n];
    location.hash = "aprender";
  });
}

function renderHeader() {
  const l = level(), [a, z] = levelRange(l);
  $("#lvl").textContent = l;
  $("#xpfill").style.width = ((S.xp - a) / (z - a) * 100).toFixed(1) + "%";
  $(".xpbox").title = `Nível ${l} · ${S.xp} XP (próximo nível em ${z} XP)`;
  $("#streak").textContent = S.streak.count ? `${S.streak.count} 日` : "";
}

onChange((xp, badges) => {
  const before = level(S.xp - xp);
  renderHeader();
  if (level() > before) toast(`<b>Nível ${level()}!</b> Continue assim.`);
  badges.forEach(b => toast(`<b>Conquista:</b> ${esc(b.nome)}`));
});

function route() {
  const name = location.hash.slice(1);
  const view = VIEWS[name] ? name : "inicio";
  cleanup?.(); cleanup = null;
  $$(".nav a").forEach(a => a.classList.toggle("on", a.dataset.view === view));
  const el = $("#app");
  const fresh = el.cloneNode(false); el.replaceWith(fresh);   // remove listeners da tela anterior
  cleanup = VIEWS[view](fresh) || null;
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
renderHeader();
route();
syncFromServer().then(ok => { if (ok) { renderHeader(); toast("Progresso sincronizado com o servidor."); } });
