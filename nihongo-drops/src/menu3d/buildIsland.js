// Constrói a ilha do menu com geometria procedural (sem modelos externos):
// ilha flutuante, água, torii, cerejeiras e pedras.

import * as THREE from 'three';

const CORES = {
  grama: '#4fb37f',
  rocha: '#6b5b7b',
  agua: '#1d3b6b',
  toriiVermelho: '#d64545',
  toriiPreto: '#26222e',
  tronco: '#6d4c41',
  sakura: '#f4a7c0',
  pedra: '#9aa3b8',
};

function material(cor, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color: cor,
    flatShading: true,
    roughness: 0.85,
    ...extras,
  });
}

function malha(geometria, mat, { x = 0, y = 0, z = 0 } = {}) {
  const objeto = new THREE.Mesh(geometria, mat);
  objeto.position.set(x, y, z);
  return objeto;
}

/** Torii: dois pilares, a viga de cima (kasagi + shimaki) e a viga de baixo (nuki). */
function criarTorii() {
  const torii = new THREE.Group();
  const vermelho = material(CORES.toriiVermelho);
  const preto = material(CORES.toriiPreto);
  const pilar = new THREE.CylinderGeometry(0.22, 0.28, 4, 10);
  torii.add(
    malha(pilar, vermelho, { x: -1.6, y: 2 }),
    malha(pilar, vermelho, { x: 1.6, y: 2 }),
    malha(new THREE.BoxGeometry(5.2, 0.35, 0.6), preto, { y: 4.25 }),
    malha(new THREE.BoxGeometry(4.6, 0.3, 0.5), vermelho, { y: 3.95 }),
    malha(new THREE.BoxGeometry(4, 0.25, 0.35), vermelho, { y: 3.2 }),
    malha(new THREE.BoxGeometry(0.3, 0.75, 0.3), vermelho, { y: 3.6 }),
  );
  return torii;
}

/** Cerejeira simples: tronco + copa em icosaedro. */
function criarCerejeira(geometrias, materiais, x, z, escala = 1) {
  const arvore = new THREE.Group();
  arvore.add(
    malha(geometrias.tronco, materiais.tronco, { y: 0.9 }),
    malha(geometrias.copa, materiais.copa, { y: 2.2 }),
    malha(geometrias.copa, materiais.copa, { x: 0.6, y: 1.9, z: 0.3 }),
  );
  arvore.position.set(x, 0.4, z);
  arvore.scale.setScalar(escala);
  return arvore;
}

/** Monta a ilha inteira e devolve { grupo, agua }. */
export function construirIlha() {
  const grupo = new THREE.Group();

  const topo = malha(new THREE.CylinderGeometry(7, 7.4, 0.8, 14), material(CORES.grama));
  const rocha = malha(new THREE.ConeGeometry(7.4, 6, 14), material(CORES.rocha), { y: -3.4 });
  rocha.rotation.x = Math.PI;
  grupo.add(topo, rocha);

  const agua = malha(
    new THREE.CircleGeometry(60, 48),
    new THREE.MeshStandardMaterial({ color: CORES.agua, roughness: 0.4, metalness: 0.1 }),
    { y: -1.6 },
  );
  agua.rotation.x = -Math.PI / 2;
  grupo.add(agua);

  const torii = criarTorii();
  torii.position.set(0, 0.4, -3.2);
  grupo.add(torii);

  const geometriasArvore = {
    tronco: new THREE.CylinderGeometry(0.15, 0.22, 1.8, 6),
    copa: new THREE.IcosahedronGeometry(1, 0),
  };
  const materiaisArvore = { tronco: material(CORES.tronco), copa: material(CORES.sakura) };
  grupo.add(
    criarCerejeira(geometriasArvore, materiaisArvore, -4.6, -2.4, 1.1),
    criarCerejeira(geometriasArvore, materiaisArvore, 4.4, -2.8, 0.9),
    criarCerejeira(geometriasArvore, materiaisArvore, 2.4, -5.4, 0.7),
  );

  const geometriaPedra = new THREE.DodecahedronGeometry(0.35, 0);
  const materialPedra = material(CORES.pedra);
  [
    [-2.4, -4.6],
    [2.6, -4.4],
    [-6, -1.4],
    [-1.2, 5.6],
  ].forEach(([x, z]) => grupo.add(malha(geometriaPedra, materialPedra, { x, y: 0.5, z })));

  return { grupo, agua };
}

/** Céu estrelado com pontos. */
export function criarEstrelas(quantidade = 400) {
  const posicoes = new Float32Array(quantidade * 3);
  for (let i = 0; i < quantidade; i += 1) {
    const raio = 60 + Math.random() * 30;
    const teta = Math.random() * Math.PI * 2;
    const fi = Math.random() * Math.PI * 0.45;
    posicoes[i * 3] = raio * Math.sin(fi) * Math.cos(teta);
    posicoes[i * 3 + 1] = raio * Math.cos(fi);
    posicoes[i * 3 + 2] = raio * Math.sin(fi) * Math.sin(teta);
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.BufferAttribute(posicoes, 3));
  const materialPontos = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.35,
    transparent: true,
    opacity: 0.8,
    fog: false,
  });
  return new THREE.Points(geometria, materialPontos);
}
