// Kana flutuando em órbita ao redor da ilha (sprites com textura de canvas).

import * as THREE from 'three';
import { criarTexturaKana } from './textTexture.js';

const CORES = ['#ffffff', '#ffd166', '#ff8fb1', '#8fd3ff'];

/**
 * Cria `quantidade` kana flutuantes usando os caracteres informados.
 * Devolve { grupo, atualizar(tempo, dt, reduzido) }.
 */
export function criarKanaFlutuantes(caracteres, quantidade = 28) {
  const grupo = new THREE.Group();
  const texturas = new Map(); // uma textura por caractere + cor, reaproveitada
  const itens = [];

  for (let i = 0; i < quantidade; i += 1) {
    const kana = caracteres[i % caracteres.length];
    const cor = CORES[i % CORES.length];
    const chave = `${kana}${cor}`;
    if (!texturas.has(chave)) {
      texturas.set(chave, criarTexturaKana(kana, cor));
    }
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texturas.get(chave),
        transparent: true,
        depthWrite: false,
        opacity: 0.85,
      }),
    );
    sprite.scale.setScalar(1 + Math.random() * 0.9);
    const item = {
      sprite,
      angulo: Math.random() * Math.PI * 2,
      raio: 8.5 + Math.random() * 7,
      altura: 2.5 + Math.random() * 7,
      velocidade: (0.04 + Math.random() * 0.08) * (Math.random() < 0.5 ? -1 : 1),
      fase: Math.random() * Math.PI * 2,
    };
    posicionar(item, 0);
    itens.push(item);
    grupo.add(sprite);
  }

  /** Move cada kana na órbita; com animações reduzidas ficam parados. */
  function atualizar(tempo, dt, reduzido) {
    if (reduzido) {
      return;
    }
    for (const item of itens) {
      item.angulo += item.velocidade * dt;
      posicionar(item, tempo);
    }
  }

  return { grupo, atualizar };
}

function posicionar(item, tempo) {
  item.sprite.position.set(
    Math.cos(item.angulo) * item.raio,
    item.altura + Math.sin(tempo * 0.8 + item.fase) * 0.4,
    Math.sin(item.angulo) * item.raio,
  );
}
