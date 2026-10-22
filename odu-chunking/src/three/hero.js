import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';
import { tileText } from '../core/blocks.js';
import { tokens, reducedMotion, onThemeChange } from '../core/theme.js';

const UNIT = 0.32; // largura por caractere
const PAD = 0.7;
const GAP = 0.22;
const HEIGHT = 1.05;

function measure(text) {
  return Math.max(1.3, text.length * UNIT + PAD);
}

/** Textura da face frontal: cor do bloco + texto, com resolução proporcional à largura. */
function faceTexture(text, color, ink, width) {
  const scale = 128;
  const c = document.createElement('canvas');
  c.width = Math.round(width * scale);
  c.height = Math.round(HEIGHT * scale);
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = ink;
  g.font = `700 ${Math.round(scale * 0.46)}px "Atkinson Hyperlegible", "Segoe UI", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Blocos 3D que se reorganizam entre os idiomas: a mesma cor (função) muda de
 * posição conforme a sintaxe de cada língua.
 * `frases` = { en: [{b,t}], fr: [...], ... } com uma ocorrência de cada categoria.
 */
export function createHero(canvas, frases, order, onLang) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.1, 100);
  camera.position.set(0, 1.2, 15);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 8);
  scene.add(key);

  const group = new THREE.Group();
  scene.add(group);

  let t = tokens();
  const geometry = new RoundedBoxGeometry(1, HEIGHT, 0.7, 4, 0.12);
  const cats = frases[order[0]].map((x) => x.b);
  const meshes = new Map();
  for (const b of cats) {
    const side = new THREE.MeshStandardMaterial({ color: t.blocks[b], roughness: 0.55 });
    const front = new THREE.MeshStandardMaterial({ roughness: 0.5 });
    // RoundedBoxGeometry: grupo 4 = +z (frente)
    const mats = [side, side, side, side, front, side];
    const mesh = new THREE.Mesh(geometry, mats);
    meshes.set(b, { mesh, side, front });
    group.add(mesh);
  }

  function layout(lang) {
    const items = frases[lang].map((x) => ({ ...x, text: tileText(x.t), w: measure(tileText(x.t)) }));
    const total = items.reduce((s, x) => s + x.w, 0) + GAP * (items.length - 1);
    let x = -total / 2;
    for (const it of items) {
      it.x = x + it.w / 2;
      x += it.w + GAP;
    }
    return { items, total };
  }

  function paint(lang, entry, item) {
    entry.front.map?.dispose();
    entry.front.map = faceTexture(item.text, t.blocks[item.b], t.onBlock, item.w);
    entry.front.needsUpdate = true;
    entry.mesh.scale.x = item.w;
  }

  function fit(total) {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    camera.aspect = w / h;
    // Afasta a câmera até a frase caber com folga na largura.
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const needed = (total / 2 + 1) / (Math.tan(halfFov) * camera.aspect);
    camera.position.z = Math.max(9, needed);
    camera.updateProjectionMatrix();
  }

  let index = 0;
  let current = layout(order[0]);
  current.items.forEach((it) => {
    const e = meshes.get(it.b);
    paint(order[0], e, it);
    e.mesh.position.x = it.x;
  });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    fit(current.total);
  }
  resize();
  onLang?.(order[0]);

  function go(next) {
    index = next;
    const lang = order[index];
    const target = layout(lang);
    const motion = !reducedMotion();
    target.items.forEach((it, i) => {
      const e = meshes.get(it.b);
      if (!motion) {
        paint(lang, e, it);
        e.mesh.position.x = it.x;
        return;
      }
      const tl = gsap.timeline({ delay: i * 0.06 });
      tl.to(e.mesh.rotation, { x: Math.PI / 2, duration: 0.28, ease: 'power2.in' })
        .add(() => paint(lang, e, it))
        .to(e.mesh.rotation, { x: 0, duration: 0.42, ease: 'back.out(1.8)' });
      gsap.to(e.mesh.position, { x: it.x, duration: 0.9, ease: 'power3.inOut', delay: i * 0.04 });
      gsap.fromTo(
        e.mesh.position,
        { y: 0 },
        { y: 0.55, duration: 0.45, yoyo: true, repeat: 1, ease: 'sine.inOut', delay: i * 0.04 },
      );
    });
    current = target;
    fit(current.total);
    onLang?.(lang);
  }

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);

  let timer = reducedMotion()
    ? null
    : setInterval(() => visible && !document.hidden && go((index + 1) % order.length), 3400);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const s = clock.getElapsedTime();
    if (!reducedMotion()) {
      group.rotation.y = Math.sin(s * 0.35) * 0.18;
      group.rotation.x = -0.08 + Math.sin(s * 0.5) * 0.04;
    }
    renderer.render(scene, camera);
  });

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const offTheme = onThemeChange(() => {
    t = tokens();
    current.items.forEach((it) => {
      const e = meshes.get(it.b);
      e.side.color.set(t.blocks[it.b]);
      paint(order[index], e, it);
    });
  });

  return {
    go: (lang) => {
      clearInterval(timer);
      timer = null;
      go(order.indexOf(lang));
    },
    dispose() {
      clearInterval(timer);
      io.disconnect();
      ro.disconnect();
      offTheme();
      renderer.setAnimationLoop(null);
      meshes.forEach((e) => {
        e.front.map?.dispose();
        e.front.dispose();
        e.side.dispose();
      });
      geometry.dispose();
      renderer.dispose();
    },
  };
}
