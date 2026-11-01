/**
 * Motor 3D da ODU CREATIVE (Three.js) para o jogo de flashcards.
 *
 * - Carrega o GLB gerado no Blender (tools/blender/build_cafe_models.py): carta, itens, cliente e cenário.
 * - Cria cartas com texturas de canvas na frente e no verso (UVs 0..1 vindas do Blender).
 * - Seleção por clique/toque com Raycaster, animações com GSAP (ou instantâneas com movimento reduzido).
 * - dispose() libera GPU, eventos e loop de renderização ao sair da tela.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

const gltfCache = new Map();
function loadGLB(url) {
  if (!gltfCache.has(url)) gltfCache.set(url, new GLTFLoader().loadAsync(url).catch((e) => { gltfCache.delete(url); throw e; }));
  return gltfCache.get(url);
}

export async function createCafe3D(container, { glbUrl, reducedMotion = false } = {}) {
  const gltf = await loadGLB(glbUrl);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-hidden', 'true'); // o equivalente acessível fica em HTML ao lado
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ffe9c7');
  scene.fog = new THREE.Fog('#ffe9c7', 7, 16);
  scene.add(new THREE.HemisphereLight('#fff8ee', '#c8b6ff', 1.5));
  const sun = new THREE.DirectionalLight('#ffffff', 2.0);
  sun.position.set(2.5, 5, 4);
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#ffd7c2', 0.6);
  fill.position.set(-3, 2, 2);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 40);
  const lookTarget = new THREE.Vector3(0, 1.4, 0);

  // Separa modelos-molde (itens e carta) do cenário
  const root = gltf.scene.clone(true);
  const templates = new Map();
  for (const child of [...root.children]) {
    if (child.name.startsWith('item-') || child.name === 'Card') {
      templates.set(child.name, child);
      root.remove(child);
    }
  }
  const customer = root.getObjectByName('Customer');
  if (customer) customer.visible = false;
  scene.add(root);

  /* ---------- tamanho e câmera ---------- */
  let width = 1, height = 1;
  function resize() {
    width = container.clientWidth || 1;
    const portrait = width < 600;
    height = Math.round(portrait ? Math.min(width * 1.2, window.innerHeight * 0.62) : Math.min(Math.max(width * 0.62, 300), window.innerHeight * 0.66));
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fitState && fitCamera(fitState);
  }
  let fitState = null;
  /** Posiciona a câmera para enquadrar uma área (w×h) centrada em `center`, vista de frente. */
  function fitCamera({ w, h, center, elevation = 0.12, margin = 1.12 }) {
    fitState = { w, h, center, elevation, margin };
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const distH = (h * margin) / 2 / Math.tan(vFov / 2);
    const distW = (w * margin) / 2 / (Math.tan(vFov / 2) * camera.aspect);
    const d = Math.max(distH, distW);
    camera.position.set(center.x, center.y + d * elevation, center.z + d);
    lookTarget.copy(center);
    camera.lookAt(lookTarget);
  }
  function setView(position, target) {
    fitState = null;
    camera.position.copy(position);
    lookTarget.copy(target);
    camera.lookAt(lookTarget);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* ---------- cartas ---------- */
  const disposables = new Set();
  function textureFrom(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false; // UVs do glTF já vêm com V invertido
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    disposables.add(t);
    return t;
  }
  /**
   * Cria uma carta. front/back: <canvas> com a arte. model: nome do item (opcional) exibido na frente.
   * A carta é um Group; userData guarda dados do jogo.
   */
  function makeCard({ front, back, model, modelScale = 0.36, modelY = 0.17 }) {
    const group = new THREE.Group();
    const body = templates.get('Card').clone(true);
    body.position.set(0, 0, 0);
    body.traverse((o) => {
      if (!o.isMesh) return;
      const name = o.material?.name;
      const m = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0 });
      if (name === 'CardFront') m.map = textureFrom(front);
      else if (name === 'CardBack') m.map = textureFrom(back);
      else m.color.set('#ece8ff');
      disposables.add(m);
      o.material = m;
    });
    group.add(body);
    if (model && templates.has(model)) {
      const holder = new THREE.Group();
      const item = templates.get(model).clone(true);
      item.position.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(item);
      const size = box.getSize(new THREE.Vector3());
      const s = modelScale / Math.max(size.x, size.y, size.z);
      item.scale.multiplyScalar(s);
      item.position.y = -size.y * s / 2; // centraliza verticalmente
      holder.add(item);
      holder.position.set(0, modelY, 0.16);
      holder.rotation.x = 0.25;
      holder.userData.spin = true;
      group.add(holder);
      group.userData.modelHolder = holder;
    }
    group.userData.body = body;
    return group;
  }

  /** Clona um item do Blender (para o modo Café Rush). */
  function makeItem(name, height = 0.42) {
    const item = templates.get(name).clone(true);
    item.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(item);
    const size = box.getSize(new THREE.Vector3());
    item.scale.multiplyScalar(height / Math.max(size.x, size.y, size.z));
    const g = new THREE.Group();
    g.add(item);
    return g;
  }

  /** Tinge (ou restaura) todos os materiais de um objeto — feedback visual de acerto/erro. */
  function highlight(obj, color = null) {
    obj.traverse((o) => {
      if (!o.isMesh) return;
      if (!o.userData.ownMaterial) {
        o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => disposables.add(m));
        o.userData.ownMaterial = true;
      }
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m.emissive) continue;
        m.emissive.set(color || '#000000');
        m.emissiveIntensity = color ? 0.45 : 0;
      }
    });
  }

  /* ---------- animação ---------- */
  const gsap = globalThis.gsap;
  /** Anima propriedades de um objeto Three.js. Com movimento reduzido, aplica na hora. */
  function tween(target, vars, duration = 0.5, ease = 'power2.out') {
    if (reducedMotion || !gsap) {
      Object.assign(target, vars);
      return Promise.resolve();
    }
    return new Promise((resolve) => gsap.to(target, { ...vars, duration, ease, onComplete: resolve }));
  }

  /**
   * Vira a carta em duas metades: na metade (carta de perfil) o modelo 3D é escondido ou mostrado,
   * para que ele nunca apareça atravessando o verso.
   */
  async function flipCard(card, faceUp, duration = 0.6) {
    const holder = card.userData.modelHolder;
    const target = faceUp ? 0 : Math.PI;
    if (reducedMotion || !gsap) {
      card.rotation.y = target;
      if (holder) holder.visible = faceUp;
      return;
    }
    await tween(card.rotation, { y: Math.PI / 2 }, duration / 2, 'power2.in');
    if (holder) holder.visible = faceUp;
    await tween(card.rotation, { y: target }, duration / 2, 'power2.out');
  }
  function setFace(card, faceUp) {
    card.rotation.y = faceUp ? 0 : Math.PI;
    if (card.userData.modelHolder) card.userData.modelHolder.visible = faceUp;
  }

  /* ---------- seleção ---------- */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pickables = new Set();
  let onPick = null;
  function pickAt(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...pickables], true);
    for (const hit of hits) {
      let o = hit.object;
      while (o && !pickables.has(o)) o = o.parent;
      if (o) return o;
    }
    return null;
  }
  let down = null;
  const onDown = (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; };
  const onUp = (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    const moved = Math.hypot(dx, dy);
    const startedOn = pickAt(down.x, down.y);
    down = null;
    if (moved > 40 && Math.abs(dx) > Math.abs(dy)) return onSwipe?.(dx > 0 ? 'right' : 'left', startedOn);
    if (moved < 12) { const hit = pickAt(e.clientX, e.clientY); if (hit) onPick?.(hit); }
  };
  let hoverObj = null;
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    hoverObj = pickAt(e.clientX, e.clientY);
    renderer.domElement.style.cursor = hoverObj ? 'pointer' : 'default';
  };
  let onSwipe = null;
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.style.touchAction = 'pan-y';

  /* ---------- loop ---------- */
  const frameFns = new Set();
  const clock = new THREE.Clock();
  let running = true;
  function loop() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    for (const fn of frameFns) fn(dt, t);
    if (!reducedMotion) {
      scene.traverse((o) => { if (o.userData.spin) o.rotation.y += dt * 0.7; });
    }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();

  function clearGroup(group) {
    for (const c of [...group.children]) { group.remove(c); pickables.delete(c); }
  }

  function dispose() {
    running = false;
    ro.disconnect();
    renderer.domElement.removeEventListener('pointerdown', onDown);
    renderer.domElement.removeEventListener('pointerup', onUp);
    renderer.domElement.removeEventListener('pointermove', onMove);
    for (const d of disposables) d.dispose?.();
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer.domElement.remove();
  }

  return {
    THREE, scene, camera, renderer, templates, customer,
    makeCard, makeItem, highlight, tween, flipCard, setFace, fitCamera, setView, clearGroup,
    addPickable: (o) => pickables.add(o), removePickable: (o) => pickables.delete(o), clearPickables: () => pickables.clear(),
    onPick: (fn) => (onPick = fn), onSwipe: (fn) => (onSwipe = fn),
    onFrame: (fn) => { frameFns.add(fn); return () => frameFns.delete(fn); },
    project(obj) { // posição na tela (px) — usada para balões HTML sobre a cena
      const v = new THREE.Vector3();
      obj.getWorldPosition(v).project(camera);
      return { x: (v.x + 1) / 2 * width, y: (1 - v.y) / 2 * height };
    },
    dispose,
  };
}
