import * as THREE from 'three';
import { LANGS } from '../config.js';
import { LESSONS } from '../core/blocks.js';
import { masteryOf } from '../core/store.js';
import { tokens, reducedMotion, onThemeChange } from '../core/theme.js';

/** Rótulo de idioma como sprite de canvas. */
function labelSprite(text, color) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.font = '800 84px "Bricolage Grotesque", "Segoe UI", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(2.4, 1.2, 1);
  return sprite;
}

export const STATE_LABELS = ['Nova', 'Em progresso', 'Dominada'];

function stateOf(v) {
  if (v >= 0.75) return 2;
  if (v > 0) return 1;
  return 0;
}

/**
 * Constelação de domínio: cada idioma é um aglomerado; cada frase aparece uma
 * vez em cada idioma, ligada às suas traduções por linhas finas.
 */
export function createConstellation(canvas, { onHover, onPick } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 4, 26);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 2));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2);
  dl.position.set(5, 10, 8);
  scene.add(dl);

  const world = new THREE.Group();
  scene.add(world);

  let t = tokens();
  const stateColors = () => [t.line, t.blocks[2], t.blocks[3]];

  // Centros dos 4 idiomas nos vértices de um tetraedro.
  const R = 7.5;
  const centers = [
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(-1, -1, 1),
    new THREE.Vector3(-1, 1, -1),
    new THREE.Vector3(1, -1, -1),
  ].map((v) => v.normalize().multiplyScalar(R));

  const sentences = LESSONS.flatMap((l, li) => l.frases.map((f, fi) => ({ f, li, fi, n: l.frases.length })));
  const geo = new THREE.SphereGeometry(0.28, 20, 14);
  const nodes = [];
  const labels = [];

  LANGS.forEach((lang, k) => {
    const c = centers[k];
    const label = labelSprite(lang.label, t.ink);
    label.position.copy(c).multiplyScalar(1.5);
    world.add(label);
    labels.push(label);

    sentences.forEach(({ f, li, fi, n }) => {
      // Aula = anel; frase = ângulo no anel. Espiral fibonacci evita sobreposição.
      const i = li * 6 + fi;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / (LESSONS.length * 6));
      const theta = Math.PI * (1 + Math.sqrt(5)) * i + k;
      const r = 1.6 + li * 0.32 + (fi / n) * 0.2;
      const pos = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta))
        .multiplyScalar(r)
        .add(c);
      const v = masteryOf(f.id, lang.code);
      const st = stateOf(v);
      const mat = new THREE.MeshStandardMaterial({ color: stateColors()[st], roughness: 0.4, emissive: 0x000000 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(0.8 + v * 0.9);
      mesh.userData = { sentence: f, lang: lang.code, mastery: v, state: st };
      world.add(mesh);
      nodes.push(mesh);
    });
  });

  // Linhas entre as 4 versões de cada frase.
  const linePts = [];
  sentences.forEach((_, si) => {
    const group = LANGS.map((_l, k) => nodes[k * sentences.length + si].position);
    for (let a = 0; a < 4; a += 1) for (let b = a + 1; b < 4; b += 1) linePts.push(group[a], group[b]);
  });
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
  const lineMat = new THREE.LineBasicMaterial({ color: t.muted, transparent: true, opacity: 0.07 });
  world.add(new THREE.LineSegments(lineGeo, lineMat));

  const hiGeo = new THREE.BufferGeometry();
  const hiMat = new THREE.LineBasicMaterial({ color: t.ink, transparent: true, opacity: 0.85 });
  const hiLines = new THREE.LineSegments(hiGeo, hiMat);
  world.add(hiLines);

  /* ---------- Interação: arrastar gira, roda/pinça aproxima ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null;
  let hovered = null;
  let idle = 0;
  const pointers = new Map();
  let pinch = 0;

  function pick(e) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(nodes)[0]?.object ?? null;
  }

  function highlight(mesh) {
    if (hovered === mesh) return;
    if (hovered) hovered.material.emissive.setHex(0x000000);
    hovered = mesh;
    if (mesh) {
      mesh.material.emissive.set(t.blocks[1]).multiplyScalar(0.5);
      const si = sentences.findIndex((s) => s.f.id === mesh.userData.sentence.id);
      const pts = LANGS.map((_l, k) => nodes[k * sentences.length + si].position);
      const seg = [];
      for (let a = 0; a < 4; a += 1) for (let b = a + 1; b < 4; b += 1) seg.push(pts[a], pts[b]);
      hiGeo.setFromPoints(seg);
    } else {
      hiGeo.setFromPoints([]);
    }
  }

  const onDown = (e) => {
    pointers.set(e.pointerId, e);
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, moved: false };
    idle = 0;
  };
  const onMove = (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinch) zoom((pinch - d) * 0.05);
      pinch = d;
      return;
    }
    if (drag && pointers.size === 1) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      world.rotation.y += dx * 0.006;
      world.rotation.x = THREE.MathUtils.clamp(world.rotation.x + dy * 0.006, -1.2, 1.2);
      drag.x = e.clientX;
      drag.y = e.clientY;
      return;
    }
    const m = pick(e);
    highlight(m);
    canvas.style.cursor = m ? 'pointer' : 'grab';
    onHover?.(m?.userData ?? null, e);
  };
  const onUp = (e) => {
    pointers.delete(e.pointerId);
    pinch = 0;
    if (drag && !drag.moved) {
      const m = pick(e);
      if (m) onPick?.(m.userData);
    }
    drag = null;
  };
  function zoom(delta) {
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + delta, 12, 48);
  }
  const onWheel = (e) => {
    e.preventDefault();
    zoom(e.deltaY * 0.02);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', () => {
    highlight(null);
    onHover?.(null);
  });
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = Math.max(camera.position.z, w < 520 ? 34 : 24);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    idle += dt;
    if (!reducedMotion() && !drag && idle > 1.5) world.rotation.y += dt * 0.08;
    labels.forEach((l) => l.quaternion.copy(camera.quaternion));
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });

  const offTheme = onThemeChange(() => {
    t = tokens();
    nodes.forEach((n) => n.material.color.set(stateColors()[n.userData.state]));
    lineMat.color.set(t.muted);
    hiMat.color.set(t.ink);
    labels.forEach((l, k) => {
      const fresh = labelSprite(LANGS[k].label, t.ink);
      l.material.map.dispose();
      l.material.map = fresh.material.map;
      l.material.needsUpdate = true;
    });
  });

  const counts = [0, 0, 0];
  nodes.forEach((n) => (counts[n.userData.state] += 1));

  return {
    counts,
    dispose() {
      ro.disconnect();
      offTheme();
      renderer.setAnimationLoop(null);
      nodes.forEach((n) => n.material.dispose());
      labels.forEach((l) => {
        l.material.map.dispose();
        l.material.dispose();
      });
      geo.dispose();
      lineGeo.dispose();
      hiGeo.dispose();
      renderer.dispose();
    },
  };
}
