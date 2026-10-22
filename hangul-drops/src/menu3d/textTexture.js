// Gera texturas a partir de texto desenhado em <canvas> (hangul e rótulos).

import * as THREE from 'three';

const FONTE = '"Noto Sans KR", system-ui, sans-serif';

/** Textura quadrada com um único caractere brilhante (hangul flutuante). */
export function criarTexturaCaractere(caractere, cor = '#ffffff') {
  const tamanho = 128;
  const canvas = document.createElement('canvas');
  canvas.width = tamanho;
  canvas.height = tamanho;
  const ctx = canvas.getContext('2d');
  ctx.font = `900 92px ${FONTE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = cor;
  ctx.shadowBlur = 18;
  ctx.fillStyle = cor;
  ctx.fillText(caractere, tamanho / 2, tamanho / 2 + 4);
  return finalizar(canvas);
}

/** Desenha (ou redesenha) o rótulo de uma fase num canvas existente. */
export function desenharRotulo(canvas, { numero, nome, nomeNativo, status, cor }) {
  const ctx = canvas.getContext('2d');
  const { width: largura, height: altura } = canvas;
  ctx.clearRect(0, 0, largura, altura);

  ctx.fillStyle = 'rgba(15, 22, 48, 0.88)';
  ctx.strokeStyle = cor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(6, 6, largura - 12, altura - 12, 36);
  ctx.fill();
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.fillStyle = cor;
  ctx.font = `900 64px ${FONTE}`;
  ctx.fillText(String(numero), 34, altura / 2);

  ctx.fillStyle = '#f4f6ff';
  ctx.font = `700 46px ${FONTE}`;
  ctx.fillText(nome, 100, altura / 2 - 26);
  ctx.fillStyle = '#b9c2e6';
  ctx.font = `400 32px ${FONTE}`;
  ctx.fillText(`${nomeNativo} · ${status}`, 100, altura / 2 + 30);
}

/** Cria o canvas + textura de um rótulo de fase. */
export function criarTexturaRotulo(dados) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 160;
  desenharRotulo(canvas, dados);
  return { canvas, textura: finalizar(canvas) };
}

function finalizar(canvas) {
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}
