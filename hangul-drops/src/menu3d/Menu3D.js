// Cena Three.js do menu principal: ilha flutuante com portão de palácio, hangul em órbita
// e um ponto clicável por minijogo. Tudo é liberado em destroy().

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { animacoesReduzidas } from '../core/settings.js';
import { gsap } from '../ui/motion.js';
import { construirIlha, criarEstrelas } from './buildIsland.js';
import { criarHangulFlutuante } from './floatingHangul.js';
import { criarPontosDeFase } from './stagePoints.js';
import { liberarObjeto } from './dispose.js';

const COR_DO_CEU = '#0f1630';
const POSICAO_CAMERA = new THREE.Vector3(0, 8.5, 17);
const ALVO_CAMERA = new THREE.Vector3(0, 1.2, 0);
const LIMITE_DE_ARRASTE_PX = 6; // abaixo disso, consideramos um clique

export class Menu3D {
  /**
   * @param {HTMLElement} conteiner elemento que vai receber o canvas
   * @param {object} opcoes { fases, caracteres, aoEscolher(id), aoDestacar(id|null) }
   */
  constructor(conteiner, { fases, caracteres, aoEscolher, aoDestacar }) {
    this.conteiner = conteiner;
    this.aoEscolher = aoEscolher;
    this.aoDestacar = aoDestacar;
    this.relogio = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.ponteiro = new THREE.Vector2();
    this.inicioDoToque = null;
    this.destacado = null;

    this.criarRenderer();
    this.criarCena(fases, caracteres);
    this.criarControles();
    this.registrarEventos();
    this.redimensionar();
    this.animarEntrada();
    this.renderer.setAnimationLoop(() => this.quadro());
  }

  criarRenderer() {
    // Lança erro se não houver WebGL; quem chama mostra o menu em HTML no lugar.
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.classList.add('menu-canvas');
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.conteiner.append(this.renderer.domElement);
  }

  criarCena(fases, caracteres) {
    this.cena = new THREE.Scene();
    this.cena.background = new THREE.Color(COR_DO_CEU);
    this.cena.fog = new THREE.Fog(COR_DO_CEU, 30, 75);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    this.camera.position.copy(POSICAO_CAMERA);

    this.cena.add(
      new THREE.HemisphereLight('#bcd4ff', '#3b2a4a', 1.6),
      this.criarLuzDoSol(),
      criarEstrelas(),
    );

    const ilha = construirIlha();
    this.agua = ilha.agua;
    this.cena.add(ilha.grupo);

    this.hangulFlutuante = criarHangulFlutuante(caracteres);
    this.cena.add(this.hangulFlutuante.grupo);

    this.pontos = criarPontosDeFase(fases);
    this.cena.add(this.pontos.grupo);
  }

  criarLuzDoSol() {
    const sol = new THREE.DirectionalLight('#ffe2c4', 2.2);
    sol.position.set(8, 14, 6);
    return sol;
  }

  criarControles() {
    this.controles = new OrbitControls(this.camera, this.renderer.domElement);
    this.controles.target.copy(ALVO_CAMERA);
    this.controles.enablePan = false;
    this.controles.enableDamping = true;
    this.controles.minDistance = 11;
    this.controles.maxDistance = 30;
    this.controles.minPolarAngle = Math.PI * 0.18;
    this.controles.maxPolarAngle = Math.PI * 0.46;
    this.controles.autoRotateSpeed = 0.5;
    this.controles.update();
  }

  registrarEventos() {
    const canvas = this.renderer.domElement;
    this.ouvintes = [
      [canvas, 'pointermove', (evento) => this.aoMoverPonteiro(evento)],
      [canvas, 'pointerdown', (evento) => this.aoPressionar(evento)],
      [canvas, 'pointerup', (evento) => this.aoSoltar(evento)],
      [canvas, 'pointerleave', () => this.definirDestaque(null)],
    ];
    this.ouvintes.forEach(([alvo, tipo, funcao]) => alvo.addEventListener(tipo, funcao));
    this.observador = new ResizeObserver(() => this.redimensionar());
    this.observador.observe(this.conteiner);
  }

  /** Ajusta canvas e câmera ao tamanho do contêiner (retrato usa FOV maior). */
  redimensionar() {
    const largura = this.conteiner.clientWidth || 1;
    const altura = this.conteiner.clientHeight || 1;
    this.renderer.setSize(largura, altura, false);
    this.camera.aspect = largura / altura;
    this.camera.fov = this.camera.aspect < 0.8 ? 68 : 45;
    this.camera.updateProjectionMatrix();
  }

  /** Câmera desce do céu até a ilha (só com animações completas). */
  animarEntrada() {
    if (animacoesReduzidas()) {
      return;
    }
    gsap.from(this.camera.position, {
      x: 0,
      y: 24,
      z: 34,
      duration: 1.8,
      ease: 'power3.out',
      onUpdate: () => this.camera.lookAt(this.controles.target),
    });
  }

  /** Descobre qual fase está sob o ponteiro (ou null). */
  faseSobPonteiro(evento) {
    const retangulo = this.renderer.domElement.getBoundingClientRect();
    this.ponteiro.set(
      ((evento.clientX - retangulo.left) / retangulo.width) * 2 - 1,
      -((evento.clientY - retangulo.top) / retangulo.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.ponteiro, this.camera);
    const [acerto] = this.raycaster.intersectObjects(this.pontos.alvos, false);
    return acerto?.object.userData.faseId ?? null;
  }

  aoMoverPonteiro(evento) {
    if (evento.pointerType === 'mouse') {
      this.definirDestaque(this.faseSobPonteiro(evento));
    }
  }

  aoPressionar(evento) {
    this.inicioDoToque = { x: evento.clientX, y: evento.clientY };
  }

  /** Só conta como clique se o ponteiro quase não se moveu (senão foi rotação). */
  aoSoltar(evento) {
    if (!this.inicioDoToque) {
      return;
    }
    const distancia = Math.hypot(
      evento.clientX - this.inicioDoToque.x,
      evento.clientY - this.inicioDoToque.y,
    );
    this.inicioDoToque = null;
    if (distancia > LIMITE_DE_ARRASTE_PX) {
      return;
    }
    const faseId = this.faseSobPonteiro(evento);
    if (faseId) {
      this.aoEscolher?.(faseId);
    }
  }

  /** Destaca uma fase (vindo do mouse no 3D ou do foco nos botões HTML). */
  definirDestaque(faseId, avisar = true) {
    if (faseId === this.destacado) {
      return;
    }
    this.destacado = faseId;
    this.pontos.destacar(faseId);
    this.renderer.domElement.style.cursor = faseId ? 'pointer' : '';
    if (avisar) {
      this.aoDestacar?.(faseId);
    }
  }

  /** Atualiza cores e rótulos depois de mudanças de XP ou configuração. */
  atualizarFases(fases) {
    this.pontos.atualizarFases(fases);
  }

  /** Um quadro da animação (chamado ~60 vezes por segundo). */
  quadro() {
    const dt = Math.min(this.relogio.getDelta(), 0.1);
    const tempo = this.relogio.elapsedTime;
    const reduzido = animacoesReduzidas();
    this.controles.autoRotate = !reduzido;
    this.controles.update(dt);
    this.hangulFlutuante.atualizar(tempo, dt, reduzido);
    this.pontos.atualizar(tempo, reduzido);
    if (!reduzido) {
      this.agua.position.y = -1.6 + Math.sin(tempo * 0.8) * 0.08;
    }
    this.renderer.render(this.cena, this.camera);
  }

  /** Para a animação e libera tudo da memória (CPU e GPU). */
  destroy() {
    this.renderer.setAnimationLoop(null);
    gsap.killTweensOf(this.camera.position);
    this.observador.disconnect();
    this.ouvintes.forEach(([alvo, tipo, funcao]) => alvo.removeEventListener(tipo, funcao));
    this.controles.dispose();
    liberarObjeto(this.cena);
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
