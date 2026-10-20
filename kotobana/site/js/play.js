// Jogar: menu dos jogos em three.js.
import { S, $, deck, deckPicker } from "./core.js";
import { lanternGame } from "./game-lanterns.js";
import { karutaGame } from "./game-karuta.js";

export function playView(el) {
  let stop = null;
  function menu() {
    stop?.(); stop = null;
    el.innerHTML = `
      <div class="page-head"><h1>Jogar</h1>
        <p class="muted">Os jogos usam as palavras selecionadas abaixo. Acertos e erros também contam para a revisão.</p></div>
      <div class="study-layout">
        <aside class="side"><div id="picker"></div></aside>
        <div class="games">
          <button class="game-card" data-game="lanternas">
            <span class="gc-art lantern-art" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="gc-t">灯籠 Lanternas</span>
            <span class="gc-d">A palavra aparece no alto. Toque a lanterna com o significado certo antes que ela suba pelo céu. Três vidas, velocidade crescente.</span>
            <span class="muted small">Recorde: ${S.best.lanternas || 0} pontos</span>
          </button>
          <button class="game-card" data-game="karuta">
            <span class="gc-art karuta-art" aria-hidden="true"><i>花</i><i>はな</i><i>flor</i></span>
            <span class="gc-t">かるた Karuta</span>
            <span class="gc-d">Doze cartas viradas sobre o tatame. Encontre os pares palavra ↔ significado com o menor número de jogadas.</span>
            <span class="muted small">Recorde: ${S.best.karuta ? `${S.best.karuta.moves} jogadas` : "—"}</span>
          </button>
        </div>
      </div>`;
    deckPicker($("#picker", el));
  }
  function start(name) {
    const words = deck();
    el.innerHTML = `<div class="game-wrap"><div class="game-bar"><button class="btn" id="back">← Jogos</button><span class="muted small">${words.length} palavras na seleção</span></div><div class="stage" id="stage"></div></div>`;
    if (typeof THREE === "undefined") {
      $("#stage", el).innerHTML = `<div class="stage-msg">Não foi possível carregar o three.js. Verifique a conexão e recarregue a página.</div>`;
      return;
    }
    stop = (name === "lanternas" ? lanternGame : karutaGame)($("#stage", el), words);
  }
  el.addEventListener("click", e => {
    const g = e.target.closest("[data-game]"); if (g) return start(g.dataset.game);
    if (e.target.closest("#back")) menu();
  });
  menu();
  return () => stop?.();
}
