// Feedback imediato: animação positiva no acerto e, no erro,
// um cartão com a resposta certa e a dica mnemônica.

import { criarElemento } from '../core/utils.js';
import { animacoesReduzidas } from '../core/settings.js';
import { tocarAcerto, tocarErro } from '../core/audio.js';
import { gsap, entrar, sair } from './motion.js';
import { criarBotaoFala } from './speakButton.js';

const PETALAS = ['🌸', '✨', '⭐'];
const TEMPO_CARTAO_ERRO_MS = 4000;

function camada() {
  return document.getElementById('camada-feedback') ?? document.body;
}

/** Coluna no topo da tela onde avisos e conquistas se empilham sem se sobrepor. */
export function pilhaDeAvisos() {
  let pilha = document.getElementById('pilha-avisos');
  if (!pilha) {
    pilha = criarElemento('div', { id: 'pilha-avisos', class: 'pilha-avisos' });
    camada().append(pilha);
  }
  return pilha;
}

/** Algumas pétalas que se espalham a partir de um ponto (só com animações completas). */
function soltarPetalas(x, y) {
  for (let i = 0; i < 6; i += 1) {
    const petala = criarElemento(
      'span',
      { class: 'petala', 'aria-hidden': 'true' },
      PETALAS[i % 3],
    );
    petala.style.left = `${x}px`;
    petala.style.top = `${y}px`;
    camada().append(petala);
    gsap.set(petala, { xPercent: -50, yPercent: -50 });
    const angulo = (Math.PI * 2 * i) / 6;
    gsap.to(petala, {
      x: Math.cos(angulo) * 70,
      y: Math.sin(angulo) * 70 - 20,
      opacity: 0,
      rotation: 180,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => petala.remove(),
    });
  }
}

/**
 * Mostra "+10" subindo a partir de um ponto da tela (coordenadas do viewport).
 * Sem ponto, aparece no centro.
 */
export function mostrarAcerto({ texto = '+10', x, y } = {}) {
  tocarAcerto();
  const posX = x ?? window.innerWidth / 2;
  const posY = y ?? window.innerHeight / 2;
  const selo = criarElemento('div', { class: 'selo-acerto', 'aria-hidden': 'true' }, texto);
  selo.style.left = `${posX}px`;
  selo.style.top = `${posY}px`;
  camada().append(selo);
  gsap.set(selo, { xPercent: -50, yPercent: -50 });

  if (animacoesReduzidas()) {
    gsap.to(selo, { opacity: 0, delay: 0.5, duration: 0.2, onComplete: () => selo.remove() });
    return;
  }
  soltarPetalas(posX, posY);
  gsap.fromTo(
    selo,
    { y: 0, scale: 0.6, opacity: 1 },
    {
      y: -70,
      scale: 1.2,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      onComplete: () => selo.remove(),
    },
  );
}

/**
 * Mostra o cartão de erro com a resposta certa e a dica.
 * `item` precisa de { kana, romaji, mnemonico } e pode ter { pt }.
 * Devolve uma Promise que resolve quando o cartão fecha.
 */
export function mostrarErro(item, { tempoMs = TEMPO_CARTAO_ERRO_MS } = {}) {
  tocarErro();
  document.querySelector('.cartao-erro')?.remove();

  const botaoOk = criarElemento('button', { type: 'button', class: 'botao', text: 'Entendi' });
  const cartao = criarElemento('div', { class: 'cartao-erro', role: 'status' }, [
    criarElemento('p', { class: 'cartao-erro-titulo', text: 'Quase! A resposta certa é:' }),
    criarElemento('div', { class: 'cartao-erro-resposta' }, [
      criarElemento('span', { class: 'kana kana-grande', lang: 'ja', text: item.kana }),
      criarElemento('span', { class: 'cartao-erro-romaji', text: item.romaji }),
      criarBotaoFala(item.kana),
    ]),
    item.pt ? criarElemento('p', { class: 'cartao-erro-pt', text: item.pt }) : null,
    item.mnemonico
      ? criarElemento('p', { class: 'cartao-erro-dica', text: `💡 ${item.mnemonico}` })
      : null,
    botaoOk,
  ]);
  camada().append(cartao);
  entrar(cartao, { y: 40 });

  return new Promise((resolver) => {
    let fechado = false;
    const fechar = async () => {
      if (fechado) {
        return;
      }
      fechado = true;
      clearTimeout(temporizador);
      await sair(cartao, { y: 30 });
      cartao.remove();
      resolver();
    };
    const temporizador = setTimeout(fechar, tempoMs);
    botaoOk.addEventListener('click', fechar);
  });
}

/** Mensagem curta no topo da tela (ex.: "Fase bloqueada"). */
export function mostrarMensagem(texto, { tempoMs = 2200 } = {}) {
  const aviso = criarElemento('div', { class: 'aviso', role: 'status', text: texto });
  pilhaDeAvisos().append(aviso);
  entrar(aviso, { y: -20 });
  setTimeout(async () => {
    await sair(aviso);
    aviso.remove();
  }, tempoMs);
}
