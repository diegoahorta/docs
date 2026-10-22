// Constrói a ilha do menu com geometria procedural (sem modelos externos):
// ilha flutuante, água, portão de palácio coreano, cerejeiras e pedras.

import * as THREE from 'three';

const CORES = {
  grama: '#4fb37f',
  rocha: '#6b5b7b',
  agua: '#1d3b6b',
  pilarVermelho: '#b8392f',
  vigaVerde: '#2e8b6e',
  vigaAzul: '#3d6fb6',
  telhado: '#2b2f3a',
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

/**
 * Portão de palácio coreano: pilares vermelhos, vigas pintadas em verde e azul
 * (o estilo dancheong) e um telhado de telhas escuras com as pontas para cima.
 */
function criarPortao() {
  const portao = new THREE.Group();
  const vermelho = material(CORES.pilarVermelho);
  const verde = material(CORES.vigaVerde);
  const azul = material(CORES.vigaAzul);
  const telhas = material(CORES.telhado);
  const pilar = new THREE.CylinderGeometry(0.24, 0.28, 3.6, 10);
  portao.add(
    malha(pilar, vermelho, { x: -1.7, y: 1.8 }),
    malha(pilar, vermelho, { x: 1.7, y: 1.8 }),
    malha(new THREE.BoxGeometry(4.2, 0.35, 0.5), verde, { y: 3.55 }),
    malha(new THREE.BoxGeometry(4, 0.2, 0.45), azul, { y: 3.25 }),
    malha(new THREE.BoxGeometry(4.6, 0.3, 1.3), verde, { y: 3.85 }),
  );
  // Telhado: uma "prancha" larga e duas pontas inclinadas para cima nas laterais.
  const corpoDoTelhado = malha(new THREE.BoxGeometry(4.4, 0.45, 1.8), telhas, { y: 4.2 });
  const cumeeira = malha(new THREE.BoxGeometry(3.4, 0.3, 0.5), telhas, { y: 4.55 });
  const pontaEsquerda = malha(new THREE.BoxGeometry(1.3, 0.35, 1.8), telhas, { x: -2.55, y: 4.38 });
  const pontaDireita = malha(new THREE.BoxGeometry(1.3, 0.35, 1.8), telhas, { x: 2.55, y: 4.38 });
  pontaEsquerda.rotation.z = -0.35;
  pontaDireita.rotation.z = 0.35;
  portao.add(corpoDoTelhado, cumeeira, pontaEsquerda, pontaDireita);
  return portao;
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

  const portao = criarPortao();
  portao.position.set(0, 0.4, -3.2);
  grupo.add(portao);

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
