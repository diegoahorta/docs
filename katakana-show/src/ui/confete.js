// Confete em canvas: explosão no acerto e chuva no fim da rodada.
// O laço de animação só roda enquanto houver confete na tela e para sozinho.
// Com "reduzir animações", nada é desenhado.

import { animacoesReduzidas } from '../core/settings.js';

const CORES = ['#ff3d8b', '#ffd23f', '#2ec4ff', '#3ddc84', '#ff8c32', '#b388ff'];
const GRAVIDADE = 0.25;
const MAXIMO = 400; // limite para manter os 60 fps em celulares simples

let canvas = null;
let contexto = null;
let particulas = [];
let quadro = 0;

function prepararCanvas() {
  canvas ??= document.getElementById('confete');
  if (!canvas) {
    return false;
  }
  contexto ??= canvas.getContext('2d');
  const escala = Math.min(window.devicePixelRatio || 1, 2);
  const largura = Math.round(window.innerWidth * escala);
  const altura = Math.round(window.innerHeight * escala);
  if (canvas.width !== largura || canvas.height !== altura) {
    canvas.width = largura;
    canvas.height = altura;
  }
  contexto.setTransform(escala, 0, 0, escala, 0, 0);
  return true;
}

function criarParticula(x, y, velocidade, angulo) {
  return {
    x,
    y,
    vx: Math.cos(angulo) * velocidade,
    vy: Math.sin(angulo) * velocidade,
    giro: Math.random() * Math.PI,
    velocidadeGiro: (Math.random() - 0.5) * 0.4,
    largura: 6 + Math.random() * 6,
    altura: 8 + Math.random() * 8,
    cor: CORES[Math.floor(Math.random() * CORES.length)],
    vida: 1,
  };
}

function desenhar() {
  const largura = window.innerWidth;
  const altura = window.innerHeight;
  contexto.clearRect(0, 0, largura, altura);
  particulas = particulas.filter((p) => p.y < altura + 30 && p.vida > 0);
  for (const p of particulas) {
    p.vy += GRAVIDADE;
    p.vx *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.giro += p.velocidadeGiro;
    p.vida -= 0.004;
    contexto.save();
    contexto.globalAlpha = Math.max(0, Math.min(1, p.vida * 1.5));
    contexto.translate(p.x, p.y);
    contexto.rotate(p.giro);
    contexto.fillStyle = p.cor;
    contexto.fillRect(-p.largura / 2, -p.altura / 2, p.largura, p.altura * Math.cos(p.giro));
    contexto.restore();
  }
  quadro = particulas.length > 0 ? requestAnimationFrame(desenhar) : 0;
  if (!quadro) {
    contexto.clearRect(0, 0, largura, altura);
  }
}

function adicionar(novas) {
  if (animacoesReduzidas() || !prepararCanvas()) {
    return;
  }
  particulas = [...particulas, ...novas].slice(-MAXIMO);
  if (!quadro) {
    quadro = requestAnimationFrame(desenhar);
  }
}

/** Explosão de confete a partir de um ponto (ex.: o centro do botão certo). */
export function explodirConfete(x, y, quantidade = 60) {
  adicionar(
    Array.from({ length: quantidade }, () =>
      criarParticula(x, y, 6 + Math.random() * 9, -Math.PI / 2 + (Math.random() - 0.5) * 2.4),
    ),
  );
}

/** Chuva de confete caindo do topo da tela (fim da rodada). */
export function chuvaDeConfete(quantidade = 160) {
  adicionar(
    Array.from({ length: quantidade }, () => {
      const particula = criarParticula(
        Math.random() * window.innerWidth,
        -20 - Math.random() * window.innerHeight * 0.6,
        2 + Math.random() * 3,
        Math.PI / 2 + (Math.random() - 0.5),
      );
      particula.vida = 1.6;
      return particula;
    }),
  );
}

/** Some com todo o confete (ao trocar de tela). */
export function limparConfete() {
  particulas = [];
  if (quadro) {
    cancelAnimationFrame(quadro);
    quadro = 0;
  }
  if (contexto) {
    contexto.clearRect(0, 0, canvas.width, canvas.height);
  }
}
