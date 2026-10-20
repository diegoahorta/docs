// Ponto de entrada: carrega os recursos e abre o título.
import { carregarTudo } from './recursos.js';
import { Audio } from './audio.js';
import { Entrada } from './entrada.js';
import { Hud, Telas, preCarregarUi } from './hud.js';
import { Jogo } from './jogo.js';

const carregando = document.querySelector('#carregando');

async function iniciar() {
  preCarregarUi();
  const entrada = new Entrada();
  const audio = new Audio();
  // Navegadores só liberam o áudio depois de uma interação do jogador.
  entrada.aoInteragir = () => audio.iniciar();

  const toque = document.querySelector('#toque');
  const telaDeToque = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  entrada.ligarToque(toque);

  await carregarTudo((p) => {
    carregando.textContent = `CARREGANDO... ${Math.round(p * 100)}%`;
  });
  carregando.hidden = true;

  const jogo = new Jogo({
    container: document.querySelector('#tela-jogo'),
    entrada,
    audio,
    hud: new Hud(),
    telas: new Telas(entrada, audio),
  });
  // Os botões de toque só aparecem durante a partida (nos menus, toca-se nos próprios botões).
  jogo.aoQuadro = () => {
    const mostrar = telaDeToque && jogo.estado === 'jogando' && !jogo.telas.aberta;
    if (toque.hidden === mostrar) toque.hidden = !mostrar;
  };
  window.jogo = jogo; // útil para depurar no console
  jogo.menuPrincipal();
}

iniciar().catch((e) => {
  console.error(e);
  carregando.classList.add('erro');
  carregando.textContent = 'Erro ao iniciar o jogo: ' + e.message +
    (location.protocol === 'file:' ? ' (abra por um servidor local, ex.: python3 -m http.server)' : '');
});
