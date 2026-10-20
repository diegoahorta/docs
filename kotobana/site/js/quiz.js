// Memorizar: quiz de 10 perguntas com tipos variados; erros voltam para revisão.
import { S, CLS, $, $$, esc, deck, shuffle, distractors, pitchHTML, speak, hasTTS, SPEAKER, practiced, gain, save, deckPicker } from "./core.js";

const TYPES = {
  significado: "Qual é o significado?",
  palavra: "Qual é a palavra em japonês?",
  leitura: "Como se lê?",
  romaji: "Escreva em romaji",
  ouvir: "Que palavra você ouviu?",
};

// Normaliza romaji para comparar Hepburn, Kunrei e vogais longas escritas de jeitos diferentes.
function normRomaji(s) {
  return s.toLowerCase().normalize("NFD")
    .replace(/ō/g, "oo").replace(/ū/g, "uu").replace(/[̀-ͯ]/g, "")
    .replace(/[\s\-'’.…~～]/g, "")
    .replace(/ou/g, "oo").replace(/shi/g, "si").replace(/chi/g, "ti").replace(/tsu/g, "tu").replace(/fu/g, "hu").replace(/ji/g, "zi")
    .replace(/sh/g, "sy").replace(/ch/g, "ty").replace(/j/g, "zy").replace(/n(?=[bmp])/g, "m");
}
function romajiAnswers(v) {
  let r = String(v.romaji).trim();
  if (!r.startsWith("(")) r = r.replace(/\s*\([^)]*\)\s*$/, "");          // remove origem: "aisu (ice)"
  const m = r.match(/^\(([^)]*)\)\s*(.*)$/);                              // prefixo opcional: "(o) sushi"
  const forms = m ? [m[2], m[1].replace(/[…]/g, "") + " " + m[2]] : [r];
  return forms.map(normRomaji);
}
const romajiOk = v => v.romaji && !/[/]/.test(v.romaji) && v.romaji.length <= 22 && !/\[/.test(v.romaji);

export function quizView(el) {
  let qs = [], i = 0, score = 0, missed = [], answered = false;
  const enabled = new Set(S.prefs.quizTypes || ["significado", "palavra", "leitura", "romaji"].concat(hasTTS ? ["ouvir"] : []));

  function setup() {
    el.innerHTML = `
      <div class="page-head"><h1>Memorizar</h1>
        <p class="muted">Rodadas de 10 perguntas. As palavras que você está revisando aparecem mais. Cada erro volta para a fila de revisão do modo Estudar.</p></div>
      <div class="study-layout">
        <aside class="side"><div id="picker"></div>
          <div class="prow"><span class="plbl">Tipos</span>${Object.entries(TYPES).filter(([k]) => k !== "ouvir" || hasTTS).map(([k, t]) =>
            `<label class="chip"><input type="checkbox" name="qt" value="${k}" ${enabled.has(k) ? "checked" : ""}>${t.replace("?", "")}</label>`).join("")}</div>
        </aside>
        <div class="card quiz-start">
          <div class="big-jp">試験</div>
          <p>10 perguntas sobre as palavras selecionadas.</p>
          <button class="btn primary wide" id="go">Começar rodada</button>
          <p class="muted small" id="best"></p>
        </div>
      </div>`;
    deckPicker($("#picker", el));
    $("#best", el).textContent = S.stats.answers ? `Acerto geral: ${Math.round(S.stats.correct / S.stats.answers * 100)}% em ${S.stats.answers} respostas` : "";
  }

  function build() {
    const d = deck();
    if (d.length < 4) return null;
    const now = Date.now();
    const weight = v => { const s = S.srs[v.id]; if (s && s.due <= now) return 6; if (s && s.iv < 21) return 4; if (S.seen[v.id]) return 3; return 1 + (v.imp || 1) / 3; };
    const pool = shuffle(d).map(v => ({ v, k: Math.random() ** (1 / weight(v)) })).sort((a, b) => b.k - a.k).slice(0, 10).map(x => x.v);
    return pool.map(v => {
      const types = [...enabled].filter(t => (t !== "leitura" || v.palavra !== v.leitura) && (t !== "romaji" || romajiOk(v)));
      const type = types.length ? types[Math.random() * types.length | 0] : "significado";
      const field = type === "significado" ? "pt" : type === "leitura" ? "leitura" : "palavra";
      const opts = type === "romaji" ? null : shuffle([v, ...distractors(v, 3, field)]).map(x => x[field]);
      return { v, type, field, opts };
    });
  }

  function render() {
    const q = qs[i], v = q.v;
    const prompt = {
      significado: `<div class="big-jp">${esc(v.palavra)}</div>`,
      palavra: `<div class="big-pt">${esc(v.pt)}</div><div class="muted">${esc(CLS[v.cls])}</div>`,
      leitura: `<div class="big-jp">${esc(v.palavra)}</div>`,
      romaji: `<div class="big-pt">${esc(v.pt)}</div><div class="muted">${esc(CLS[v.cls])}</div>`,
      ouvir: `<button class="btn listen" id="replay">${SPEAKER} Ouvir de novo</button>`,
    }[q.type];
    el.innerHTML = `
      <div class="quiz">
        <div class="qbar"><span>Pergunta ${i + 1} de ${qs.length}</span><span class="dots">${qs.map((_, k) =>
          `<i class="${k < i ? (missed.includes(qs[k]) ? "bad" : "good") : k === i ? "cur" : ""}"></i>`).join("")}</span><span>${score} acertos</span></div>
        <div class="card">
          <div class="qtype">${TYPES[q.type]}</div>
          <div class="front">${prompt}</div>
          ${q.opts ? `<div class="opts ${q.field === "pt" ? "" : "jp"}">${q.opts.map((o, k) =>
            `<button class="opt" data-o="${esc(o)}"><span class="k">${k + 1}</span>${esc(o)}</button>`).join("")}</div>`
          : `<form class="typein" id="typein"><input id="romaji-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ex.: taberu, shoogatsu" aria-label="Resposta em romaji">
              <button class="btn primary">Responder</button></form>`}
          <div id="feedback"></div>
        </div>
      </div>`;
    answered = false;
    if (q.type === "ouvir") speak(v);
    $("#romaji-in", el)?.focus();
  }

  function answer(ok, given) {
    if (answered) return;
    answered = true;
    const q = qs[i], v = q.v;
    practiced(v.id, ok);
    if (ok) { score++; gain(5); } else { missed.push(q); gain(1); }
    if (q.opts) $$(".opt", el).forEach(b => {
      b.disabled = true;
      if (b.dataset.o === v[q.field]) b.classList.add("right");
      else if (b.dataset.o === given) b.classList.add("wrong");
    });
    $("#feedback", el).innerHTML = `<div class="fb ${ok ? "ok" : "no"}">
      <b>${ok ? "Certo!" : "Não foi dessa vez."}</b>
      <div class="fb-word"><span class="jp">${esc(v.palavra)}</span> ${pitchHTML(v)} <span>${esc(v.pt)}</span></div>
      <div class="muted small">${esc(v.romaji)} · Livro ${v.livro}, lição ${v.licao}</div>
      <button class="btn primary" id="next">${i === qs.length - 1 ? "Ver resultado" : "Próxima"}</button></div>`;
    $("#next", el).focus();
    if (q.type !== "ouvir") speak(v);
  }

  function results() {
    S.stats.games++; save();
    const pct = Math.round(score / qs.length * 100);
    el.innerHTML = `
      <div class="card result">
        <div class="big-jp">${pct >= 90 ? "すごい！" : pct >= 60 ? "いいね！" : "がんばって！"}</div>
        <p class="score-line"><b>${score}</b> de ${qs.length} · ${pct}%</p>
        ${missed.length ? `<h3>Para revisar</h3><ul class="missed">${missed.map(q =>
          `<li><span class="jp">${esc(q.v.palavra)}</span><span class="muted">${esc(q.v.leitura)}</span><span>${esc(q.v.pt)}</span></li>`).join("")}</ul>
          <p class="muted small">Essas palavras já estão na fila de revisão do modo Estudar.</p>` : "<p>Nenhum erro. Ótimo trabalho.</p>"}
        <div class="row center"><button class="btn primary" id="again">Nova rodada</button><a class="btn" href="#estudar">Estudar</a><button class="btn" id="cfg">Mudar seleção</button></div>
      </div>`;
  }

  el.addEventListener("change", e => {
    if (e.target.name !== "qt") return;
    enabled.clear(); $$("[name=qt]:checked", el).forEach(c => enabled.add(c.value));
    S.prefs.quizTypes = [...enabled]; save();
  });
  el.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.id === "go" || t.id === "again") {
      if (!enabled.size) { enabled.add("significado"); }
      const b = build();
      if (!b) { $("#best", el) && ($("#best", el).textContent = "Selecione pelo menos 4 palavras."); return; }
      qs = b; i = 0; score = 0; missed = []; render();
    } else if (t.id === "cfg") setup();
    else if (t.id === "replay") speak(qs[i].v);
    else if (t.id === "next") { if (++i < qs.length) render(); else results(); }
    else if (t.dataset.o !== undefined && !answered) answer(t.dataset.o === qs[i].v[qs[i].field], t.dataset.o);
  });
  el.addEventListener("submit", e => {
    e.preventDefault();
    const val = $("#romaji-in", el).value.trim(); if (!val || answered) return;
    answer(romajiAnswers(qs[i].v).includes(normRomaji(val)), val);
    $("#romaji-in", el).disabled = true;
  });
  const onKey = e => {
    if (!qs.length || e.target.matches("input")) return;
    if (!answered && /^[1-4]$/.test(e.key)) { const b = $$(".opt", el)[+e.key - 1]; b?.click(); }
  };
  document.addEventListener("keydown", onKey);
  setup();
  return () => document.removeEventListener("keydown", onKey);
}
