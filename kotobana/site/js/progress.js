// Progresso: nível, sequência, livros, mapa das lições, conquistas e busca no glossário.
import { S, VOCAB, BOOKS, CLS, $, esc, level, levelRange, status, STATUS_LABEL, BADGES, reset, dueCount, pitchHTML } from "./core.js";

export function progressView(el) {
  function render() {
    const l = level(), [a, z] = levelRange(l);
    const counts = { new: 0, seen: 0, learn: 0, known: 0 };
    VOCAB.forEach(v => counts[status(v.id)]++);
    const days = Array.from({ length: 28 }, (_, i) => new Date(Date.now() - (27 - i) * 86400000).toLocaleDateString("sv"));
    const maxDay = Math.max(1, ...days.map(d => S.days[d] || 0));
    el.innerHTML = `
      <div class="page-head"><h1>Progresso</h1>
        <p class="muted">“Memorizada” significa que a próxima revisão está a 21 dias ou mais. Tudo fica salvo neste navegador${location.protocol.startsWith("http") ? " (e no servidor, se estiver usando o servidor Python)" : ""}.</p></div>

      <section class="pgrid">
        <div class="pcard">
          <h3>Nível ${l}</h3>
          <div class="bar big"><i style="width:${((S.xp - a) / (z - a) * 100).toFixed(1)}%"></i></div>
          <p class="muted small">${S.xp} XP · faltam ${z - S.xp} para o nível ${l + 1}</p>
          <p class="muted small">${S.streak.count || 0} dias seguidos · ${S.stats.answers} respostas em quizzes e jogos${S.stats.answers ? ` · ${Math.round(S.stats.correct / S.stats.answers * 100)}% de acerto` : ""}</p>
        </div>
        <div class="pcard">
          <h3>Últimos 28 dias</h3>
          <div class="days">${days.map(d => `<i title="${d}: ${S.days[d] || 0} XP" style="--k:${(S.days[d] || 0) / maxDay}"></i>`).join("")}</div>
          <p class="muted small">Cada quadrado é um dia; mais escuro = mais XP.</p>
        </div>
        <div class="pcard">
          <h3>Todas as palavras</h3>
          <div class="bar stacked big"><i class="k" style="width:${counts.known / VOCAB.length * 100}%"></i><i class="l" style="width:${counts.learn / VOCAB.length * 100}%"></i><i class="s" style="width:${counts.seen / VOCAB.length * 100}%"></i></div>
          <p class="legend"><span class="lg k"></span>${counts.known} memorizadas <span class="lg l"></span>${counts.learn} aprendendo <span class="lg s"></span>${counts.seen} vistas · ${counts.new} novas</p>
          <p class="muted small">${dueCount(VOCAB)} revisões pendentes</p>
        </div>
      </section>

      <h2>Mapa das lições</h2>
      <div class="lmap">${Object.entries(BOOKS).map(([b, [a, z]]) => `
        <div class="lmap-row"><span class="lmap-b">Livro ${b}</span><div class="lmap-cells">${Array.from({ length: z - a + 1 }, (_, i) => a + i).map(ls => {
          const w = VOCAB.filter(v => v.livro === +b && v.licao === ls); if (!w.length) return "";
          const score = w.reduce((s, v) => s + { new: 0, seen: 0.25, learn: 0.6, known: 1 }[status(v.id)], 0) / w.length;
          return `<a href="#aprender" class="lc" data-b="${b}" data-l="${ls}" style="--k:${score}" title="Lição ${ls}: ${w.length} palavras, ${Math.round(score * 100)}%">${ls}</a>`;
        }).join("")}</div></div>`).join("")}</div>

      <h2>Conquistas</h2>
      <div class="badges">${BADGES.map(b => `<div class="badge ${S.badges.includes(b.id) ? "on" : ""}"><b>${esc(b.nome)}</b><span>${esc(b.desc)}</span></div>`).join("")}</div>

      <h2>Glossário</h2>
      <input type="search" id="q" class="search" placeholder="Buscar: かな, kanji, romaji, português ou código (KB3-L27…)">
      <div class="tablewrap"><table><thead><tr><th>Código</th><th>Palavra</th><th>Acento</th><th>Português</th><th>Classe</th><th>Estado</th></tr></thead><tbody id="tb"></tbody></table></div>
      <p class="muted small" id="tinfo"></p>

      <div class="danger"><button class="linkbtn" id="reset">Apagar todo o progresso</button>
        <span id="confirm" hidden>Tem certeza? <button class="linkbtn" id="yes">Sim, apagar</button> · <button class="linkbtn" id="no">Cancelar</button></span></div>`;
    table();
  }
  const norm = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  function table() {
    const q = norm($("#q", el).value.trim());
    const rows = q ? VOCAB.filter(v => [v.palavra, v.leitura, v.romaji, v.pt, v.id].some(f => norm(f).includes(q))) : VOCAB.filter(v => S.seen[v.id]);
    $("#tb", el).innerHTML = rows.slice(0, 200).map(v => `<tr><td class="code">${esc(v.id)}</td><td class="jp">${esc(v.palavra)}</td><td>${pitchHTML(v)}</td><td>${esc(v.pt)}</td><td>${esc(CLS[v.cls])}</td><td><span class="pill ${status(v.id)}">${STATUS_LABEL[status(v.id)]}</span></td></tr>`).join("");
    $("#tinfo", el).textContent = q ? `${rows.length} resultados${rows.length > 200 ? " · mostrando 200" : ""}` : rows.length ? `${rows.length} palavras estudadas${rows.length > 200 ? " · mostrando 200" : ""}. Digite para buscar no glossário inteiro.` : "Digite para buscar nas 2.094 palavras.";
  }
  el.addEventListener("input", e => { if (e.target.id === "q") table(); });
  el.addEventListener("click", e => {
    const c = e.target.closest(".lc");
    if (c) { S.prefs.books = [+c.dataset.b]; S.prefs.from = S.prefs.to = +c.dataset.l; return; }
    if (e.target.id === "reset") $("#confirm", el).hidden = false;
    if (e.target.id === "no") $("#confirm", el).hidden = true;
    if (e.target.id === "yes") { reset(); location.reload(); }
  });
  render();
}
