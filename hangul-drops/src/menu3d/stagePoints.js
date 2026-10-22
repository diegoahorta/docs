// Pontos clicáveis das fases sobre a ilha: pedestal + orbe brilhante + rótulo.

import * as THREE from 'three';
import { criarTexturaRotulo, desenharRotulo } from './textTexture.js';

const RAIO_DO_ARCO = 4.8;
const ABERTURA_DO_ARCO = 0.62; // radianos entre um ponto e outro
const COR_BLOQUEADA = '#5b6380';

/** Posição de cada fase em um arco na frente da ilha, da esquerda (fase 1) para a direita. */
function posicaoDaFase(indice, total) {
  const angulo = Math.PI / 2 + ((total - 1) / 2 - indice) * ABERTURA_DO_ARCO;
  return { x: Math.cos(angulo) * RAIO_DO_ARCO, z: Math.sin(angulo) * RAIO_DO_ARCO };
}

function textoDeStatus(fase) {
  if (!fase.liberada) {
    return `🔒 ${fase.xpNecessario} XP`;
  }
  return fase.disponivel ? 'Jogar' : 'Em breve';
}

function dadosDoRotulo(fase, indice) {
  return {
    numero: indice + 1,
    nome: fase.nome,
    nomeNativo: fase.nomeNativo,
    status: textoDeStatus(fase),
    cor: fase.liberada ? fase.cor : COR_BLOQUEADA,
  };
}

function aplicarCorDoOrbe(orbe, fase) {
  const cor = fase.liberada ? fase.cor : COR_BLOQUEADA;
  orbe.material.color.set(cor);
  orbe.material.emissive.set(cor);
  orbe.material.emissiveIntensity = fase.liberada ? 0.7 : 0.08;
}

/**
 * Cria os pontos. `fases` = [{ id, nome, nomeNativo, cor, liberada, disponivel, xpNecessario }].
 * Devolve { grupo, alvos, atualizar, destacar, atualizarFases }.
 */
export function criarPontosDeFase(fases) {
  const grupo = new THREE.Group();
  const geometriaPedestal = new THREE.CylinderGeometry(0.6, 0.75, 0.4, 16);
  const materialPedestal = new THREE.MeshStandardMaterial({ color: '#c9c3d6', flatShading: true });
  const geometriaOrbe = new THREE.SphereGeometry(0.45, 24, 16);

  const pontos = fases.map((fase, indice) => {
    const raiz = new THREE.Group();
    const { x, z } = posicaoDaFase(indice, fases.length);
    raiz.position.set(x, 0.6, z);

    const pedestal = new THREE.Mesh(geometriaPedestal, materialPedestal);
    const orbe = new THREE.Mesh(
      geometriaOrbe,
      new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.1 }),
    );
    aplicarCorDoOrbe(orbe, fase);
    orbe.position.y = 0.8;

    const { canvas, textura } = criarTexturaRotulo(dadosDoRotulo(fase, indice));
    const rotulo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: textura, transparent: true, depthWrite: false }),
    );
    rotulo.scale.set(3.2, 0.8, 1);
    rotulo.position.y = 2.1;

    // O id da fase vai no userData para o raycaster descobrir o que foi clicado.
    pedestal.userData.faseId = fase.id;
    orbe.userData.faseId = fase.id;
    rotulo.userData.faseId = fase.id;
    raiz.add(pedestal, orbe, rotulo);
    grupo.add(raiz);
    return { id: fase.id, indice, raiz, orbe, canvas, textura };
  });

  let destacado = null;

  function destacar(id) {
    destacado = id;
  }

  /** Flutuação dos orbes e efeito de destaque (hover / foco). */
  function atualizar(tempo, reduzido) {
    for (const ponto of pontos) {
      const alvo = ponto.id === destacado ? 1.35 : 1;
      const escala = THREE.MathUtils.lerp(ponto.raiz.scale.x, alvo, reduzido ? 1 : 0.15);
      ponto.raiz.scale.setScalar(escala);
      ponto.orbe.position.y = reduzido ? 0.8 : 0.8 + Math.sin(tempo * 2 + ponto.indice) * 0.12;
    }
  }

  /** Redesenha cores e rótulos quando o estado das fases muda. */
  function atualizarFases(novasFases) {
    novasFases.forEach((fase, indice) => {
      const ponto = pontos[indice];
      aplicarCorDoOrbe(ponto.orbe, fase);
      desenharRotulo(ponto.canvas, dadosDoRotulo(fase, indice));
      ponto.textura.needsUpdate = true;
    });
  }

  const alvos = [];
  grupo.traverse((objeto) => {
    if (objeto.userData.faseId) {
      alvos.push(objeto);
    }
  });

  return { grupo, alvos, atualizar, destacar, atualizarFases };
}
