import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AGENDA, CATS, CHEERS, DAYS, PHASES, PLACES } from './levels.js';
import * as A from './audio.js';
import { celebrate, isCelebrating, miniBurst, screenShake } from './fx.js';

const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ======================================================================= render
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;

const scene = new THREE.Scene();
const WATER = 0x1572b0;
scene.background = new THREE.Color(WATER);
scene.fog = new THREE.FogExp2(WATER, 0.0165);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
camera.position.set(0, 30, 30);

scene.add(new THREE.HemisphereLight(0xb8ecff, 0x1f4a6a, 1.15));
const sun = new THREE.DirectionalLight(0xfff6e0, 1.35);
sun.position.set(12, 40, 8);
scene.add(sun);

const U = { uTime: { value: 0 } };
const SWIM_Y = 4.6;
const BOUND = 68;

function groundY(x, z) {
  // mesma fórmula do terreno gerado no Blender (y_blender = -z)
  const y = -z;
  const r = Math.hypot(x, y);
  return Math.sin(x * 0.07) * Math.cos(y * 0.06) * 0.9 + Math.sin(x * 0.21 + y * 0.13) * 0.25 +
    Math.sin(x * 0.5 + 1.3) * Math.sin(y * 0.45) * 0.08 + Math.pow(Math.max(0, r - 75), 1.35) * 0.12;
}

// --- cáusticas de luz (padrões de luz do sol na água) + algas balançando
const CAUSTIC_GLSL = `
uniform float uTime; varying vec3 vCWorld;
float causticF(vec2 uv, float t){
  vec2 p = mod(uv*6.28318, 6.28318) - 250.0;
  vec2 i = p; float c = 1.0; float inten = .005;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - (3.5 / float(n+1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0/length(vec2(p.x / (sin(i.x+tt)/inten), p.y / (cos(i.y+tt)/inten)));
  }
  c /= 4.0; c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.5);
}`;
function patchMaterial(mat, { caustic = 0.5, sway = 0 } = {}) {
  if (mat.userData.patched) return mat;
  mat.userData.patched = true;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vCWorld;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        ${sway ? `{ float ph = 0.0;
          #ifdef USE_INSTANCING
            ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
          #endif
          float k = pow(max(position.y, 0.0) / 5.0, 1.6) * ${sway.toFixed(2)};
          transformed.x += sin(uTime * 1.5 + ph) * k;
          transformed.z += cos(uTime * 1.1 + ph * 1.3) * k * 0.6; }` : ''}`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 cw = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            cw = instanceMatrix * cw;
          #endif
          vCWorld = (modelMatrix * cw).xyz; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + CAUSTIC_GLSL)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(0.55, 0.85, 1.0) * causticF(vCWorld.xz * 0.045, uTime * 0.55) * ${caustic.toFixed(2)};`);
  };
  mat.customProgramCacheKey = () => `p${caustic}_${sway}`;
  return mat;
}

// ======================================================================= modelos
const MODEL_NAMES = ['shark', 'fish', 'jellyfish', 'crab', 'seabed', 'rock', 'coral_branch', 'coral_brain', 'coral_tube',
  'seaweed', 'starfish', 'shell', 'chest', ...Object.values(PLACES).map((p) => p.model)];
const models = {};

function collectMeshes(node, out, stop) {
  for (const c of node.children) {
    if (stop.has(c)) continue;
    if (c.isMesh) out.push(c);
    collectMeshes(c, out, stop);
  }
}
function mergeMeshes(meshes, inv) {
  const byMat = new Map();
  const m4 = new THREE.Matrix4();
  for (const o of meshes) {
    let g = o.geometry.clone();
    g.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (g.index) g = g.toNonIndexed();
    const key = o.material.name || o.material.uuid;
    if (!byMat.has(key)) byMat.set(key, { m: o.material, gs: [] });
    byMat.get(key).gs.push(g);
  }
  return [...byMat.values()].map(({ m, gs }) => {
    const mesh = new THREE.Mesh(mergeGeometries(gs, false), m);
    mesh.name = m.name;
    return mesh;
  });
}
/** Junta as malhas por material (menos draw calls); mantém separadas as partes animadas. */
function bake(src, keep = []) {
  src.updateMatrixWorld(true);
  const keepNodes = keep.map((n) => src.getObjectByName(n)).filter(Boolean);
  const out = new THREE.Group();
  const inv = src.matrixWorld.clone().invert();
  const ms = [];
  collectMeshes(src, ms, new Set(keepNodes));
  out.add(...mergeMeshes(ms, inv));
  for (const k of keepNodes) {
    const g = new THREE.Group();
    g.name = k.name;
    inv.clone().multiply(k.matrixWorld).decompose(g.position, g.quaternion, g.scale);
    const km = [];
    collectMeshes(k, km, new Set());
    g.add(...mergeMeshes(km, k.matrixWorld.clone().invert()));
    out.add(g);
  }
  return out;
}

function instanced(baked, mats, opts = {}) {
  const grp = new THREE.Group();
  for (const mesh of baked.children) {
    if (!mesh.isMesh) continue;
    const mat = mesh.material.clone();
    patchMaterial(mat, opts);
    const im = new THREE.InstancedMesh(mesh.geometry, mat, mats.length);
    mats.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    grp.add(im);
  }
  scene.add(grp);
  return grp;
}

// ======================================================================= textos 3D (sprites)
function roundRectPath(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function labelSprite(text, { bg = '#2f7de1', dark = '#1a4f99', sub = '', height = 1.6, fg = '#fff' } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const fs = 76;
  g.font = `800 ${fs}px "Baloo 2", "Fredoka", system-ui, sans-serif`;
  const tw = g.measureText(text).width;
  g.font = `700 34px "Baloo 2", system-ui, sans-serif`;
  const sw = sub ? g.measureText(sub).width : 0;
  const w = Math.ceil(Math.max(tw, sw) + 70);
  const h = sub ? 150 : 112;
  c.width = w;
  c.height = h + 10;
  g.fillStyle = dark;
  roundRectPath(g, 4, 10, w - 8, h - 4, 34);
  g.fill();
  g.fillStyle = bg;
  roundRectPath(g, 4, 2, w - 8, h - 6, 34);
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = 'rgba(255,255,255,.95)';
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,.25)';
  roundRectPath(g, 18, 10, w - 36, (h - 6) * 0.35, 20);
  g.fill();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `800 ${fs}px "Baloo 2", "Fredoka", system-ui, sans-serif`;
  g.lineWidth = 10;
  g.strokeStyle = dark;
  g.lineJoin = 'round';
  const ty = sub ? 58 : h / 2 + 2;
  g.strokeText(text, w / 2, ty);
  g.fillStyle = fg;
  g.fillText(text, w / 2, ty);
  if (sub) {
    g.font = `700 34px "Baloo 2", system-ui, sans-serif`;
    g.fillStyle = 'rgba(255,255,255,.92)';
    g.fillText(sub, w / 2, 112);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sm = new THREE.SpriteMaterial({ map: tex, depthTest: false, fog: false, toneMapped: false });
  const s = new THREE.Sprite(sm);
  s.scale.set((height * c.width) / c.height, height, 1);
  s.renderOrder = 20;
  return s;
}

function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128, ring = false) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (ring) {
    g.strokeStyle = 'rgba(220,250,255,.95)';
    g.lineWidth = size * 0.06;
    g.beginPath();
    g.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.beginPath();
    g.arc(size * 0.36, size * 0.34, size * 0.08, 0, Math.PI * 2);
    g.fill();
  } else {
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, inner);
    gr.addColorStop(1, outer);
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
const bubbleTex = radialTexture(null, null, 64, true);

function starRingTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.translate(128, 128);
  for (let i = 0; i < 8; i++) {
    g.save();
    g.rotate((i / 8) * Math.PI * 2);
    g.translate(0, -100);
    g.fillStyle = '#ffe14d';
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const r = k % 2 ? 9 : 22;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const starRingTex = starRingTexture();

// ======================================================================= mundo
const world = { places: {}, obstacles: [], fishes: [], crabs: [], pearls: [], jellies: [] };
let shark, sharkModel, sharkTail, sharkShadow;

function buildWorld() {
  const rng = mulberry32(2024);
  const r = (a, b) => a + rng() * (b - a);

  // fundo do mar (terreno feito no Blender)
  const sea = models.seabed;
  sea.traverse((o) => {
    if (o.isMesh) {
      patchMaterial(o.material, { caustic: 0.4 });
      o.material.color.setRGB(0.78, 0.72, 0.64);
      o.material.roughness = 1;
    }
  });
  scene.add(sea);

  // lugares / compromissos
  for (const [key, p] of Object.entries(PLACES)) {
    const g = bake(models[p.model]);
    g.children.forEach((m) => m.isMesh && patchMaterial(m.material, { caustic: 0.35 }));
    const [x, z] = p.pos;
    g.position.set(x, groundY(x, z) + (key === 'football' ? 0.35 : -0.15), z);
    g.rotation.y = Math.atan2(-x, -z);
    g.scale.setScalar(p.scale);
    scene.add(g);
    const box = new THREE.Box3().setFromObject(g);
    const sign = labelSprite(p.en, { bg: '#ffffff', dark: '#0d5ea8', fg: '#0d5ea8', sub: `${p.icon} ${p.pt}`, height: 2.2 });
    sign.material.depthTest = true;
    sign.renderOrder = 5;
    // recolore a placa (texto azul em fundo branco)
    sign.position.set(x, Math.max(box.max.y + 1.8, SWIM_Y + 4.5), z);
    scene.add(sign);
    const dir = new THREE.Vector2(-x, -z).normalize();
    const trig = key === 'football' ? new THREE.Vector3(x, SWIM_Y, z)
      : new THREE.Vector3(x + dir.x * (p.r + 4), SWIM_Y, z + dir.y * (p.r + 4));
    world.places[key] = { ...p, key, group: g, sign, trigger: trig };
    if (p.r > 0) world.obstacles.push({ x, z, r: p.r });
  }

  const free = (x, z, pad) => {
    if (Math.hypot(x, z) > 74) return false;
    for (const pl of Object.values(world.places)) {
      const rr = (pl.key === 'football' ? 9 : pl.r) + pad;
      if (Math.hypot(x - pl.pos[0], z - pl.pos[1]) < rr) return false;
      if (Math.hypot(x - pl.trigger.x, z - pl.trigger.z) < 3 + pad * 0.3) return false;
    }
    return true;
  };
  const scatter = (n, pad, scaleRange, extra = () => {}) => {
    const mats = [];
    let tries = 0;
    while (mats.length < n && tries++ < n * 40) {
      const x = r(-80, 80), z = r(-80, 80);
      if (!free(x, z, pad)) continue;
      const s = r(...scaleRange);
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(x, groundY(x, z) - 0.1, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r(0, Math.PI * 2), 0)),
        new THREE.Vector3(s, s, s),
      );
      extra(m, x, z, s);
      mats.push(m);
    }
    return mats;
  };
  instanced(bake(models.rock), scatter(34, 3, [0.8, 2.0]), { caustic: 0.6 });
  instanced(bake(models.coral_branch), scatter(34, 2, [0.9, 1.3]), { caustic: 0.4 });
  instanced(bake(models.coral_brain), scatter(24, 2, [0.6, 1.3]), { caustic: 0.4 });
  instanced(bake(models.coral_tube), scatter(22, 2, [0.6, 1.1]), { caustic: 0.4 });
  instanced(bake(models.starfish), scatter(30, 1, [0.6, 1.1]), { caustic: 0.4 });
  instanced(bake(models.shell), scatter(30, 1, [0.6, 1.0]), { caustic: 0.4 });
  instanced(bake(models.chest), scatter(3, 4, [1.0, 1.2]), { caustic: 0.3 });
  // tufos de algas
  const weedMats = [];
  for (let c = 0; c < 40; c++) {
    const cx = r(-75, 75), cz = r(-75, 75);
    if (!free(cx, cz, 2)) continue;
    const n = 3 + Math.floor(rng() * 5);
    for (let k = 0; k < n; k++) {
      const x = cx + r(-2, 2), z = cz + r(-2, 2);
      const s = r(0.6, 1.25);
      weedMats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, groundY(x, z) - 0.2, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r(0, 6.28), 0)), new THREE.Vector3(s, s * r(0.7, 1.3), s)));
    }
  }
  const weed = instanced(bake(models.seaweed), weedMats, { caustic: 0.2, sway: 0.9 });
  weed.children.forEach((m) => (m.material.side = THREE.DoubleSide));

  // raios de sol atravessando a água
  const rayTex = (() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 256);
    const gx = g.createLinearGradient(0, 0, 64, 0);
    gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = gx;
    g.fillRect(0, 0, 64, 256);
    return new THREE.CanvasTexture(c);
  })();
  world.rays = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r(3, 7), 60), new THREE.MeshBasicMaterial({
      map: rayTex, transparent: true, opacity: r(0.08, 0.18), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: 0xbff4ff,
    }));
    m.position.set(r(-60, 60), 26, r(-60, 60));
    m.rotation.z = r(-0.35, -0.15);
    m.userData.base = m.material.opacity;
    m.userData.ph = r(0, 6);
    scene.add(m);
    world.rays.push(m);
  }

  // bolhas e "neve marinha"
  const mkPoints = (n, size, opacity, tex, color = 0xffffff) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = r(-45, 45); pos[i * 3 + 1] = r(0, 30); pos[i * 3 + 2] = r(-45, 45);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size, map: tex, transparent: true, opacity, depthWrite: false, color, sizeAttenuation: true,
    }));
    pts.frustumCulled = false;
    scene.add(pts);
    return pts;
  };
  world.bubbles = mkPoints(180, 0.55, 0.8, bubbleTex);
  world.snow = mkPoints(500, 0.18, 0.55, glowTex, 0xe8fbff);

  // peixes (cardumes)
  const fishBase = bake(models.fish, ['Tail']);
  const fishColors = [0xffc43d, 0xff6f91, 0x5ee6c8, 0xb388ff, 0x6fc3ff];
  for (let s = 0; s < 5; s++) {
    const color = fishColors[s];
    const school = { radius: r(22, 55), speed: r(0.06, 0.12) * (s % 2 ? 1 : -1), phase: r(0, 6.28), y: s % 2 ? r(7.5, 9.5) : r(2.2, 2.8), fish: [] };
    for (let k = 0; k < 6; k++) {
      const f = fishBase.clone(true);
      f.traverse((o) => {
        if (o.isMesh && o.material.name === 'Body') {
          o.material = o.material.clone();
          o.material.color.setHex(color);
        }
      });
      f.scale.setScalar(r(0.55, 0.85));
      f.userData = { off: new THREE.Vector3(r(-3, 3), r(-0.8, 0.8), r(-3, 3)), ph: r(0, 6), tail: f.getObjectByName('Tail') };
      scene.add(f);
      school.fish.push(f);
    }
    world.fishes.push(school);
  }

  // caranguejos passeando
  const crabBase = bake(models.crab);
  for (let i = 0; i < 6; i++) {
    const c = crabBase.clone(true);
    const keys = Object.keys(PLACES);
    const pl = PLACES[keys[i % keys.length]];
    const x0 = pl.pos[0] + r(-9, 9), z0 = pl.pos[1] + r(5, 10) * (pl.pos[1] > 0 ? -1 : 1);
    c.userData = { x0, z0, ph: r(0, 6), amp: r(3, 6), ang: r(0, 6.28) };
    c.scale.setScalar(r(0.8, 1.2));
    scene.add(c);
    world.crabs.push(c);
  }

  // tubarão Finn
  shark = new THREE.Group();
  sharkModel = bake(models.shark, ['Tail']);
  sharkModel.children.forEach((m) => m.isMesh && patchMaterial(m.material, { caustic: 0.25 }));
  sharkTail = sharkModel.getObjectByName('Tail');
  shark.add(sharkModel);
  scene.add(shark);
  sharkShadow = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({
    color: 0x002040, transparent: true, opacity: 0.35, depthWrite: false, map: glowTex,
  }));
  sharkShadow.rotation.x = -Math.PI / 2;
  sharkShadow.scale.set(1, 1.8, 1);
  scene.add(sharkShadow);

  // seta que aponta para o compromisso
  const arrow = new THREE.Group();
  const am = new THREE.MeshStandardMaterial({ color: 0xffcf1f, emissive: 0xff8a1f, emissiveIntensity: 0.6, roughness: 0.4 });
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.4, 20), am);
  head.rotation.x = Math.PI / 2;
  head.position.z = 1.6;
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 12), am);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = 0.3;
  arrow.add(head, tail);
  arrow.visible = false;
  scene.add(arrow);
  world.arrow = arrow;

  // farol de luz no compromisso
  const beacon = new THREE.Group();
  const bm = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.6, 46, 32, 1, true), new THREE.MeshBasicMaterial({
    color: 0xffe14d, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
  }));
  bm.position.y = 20;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.25, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffe14d, fog: false }));
  ring.rotation.x = Math.PI / 2;
  beacon.add(bm, ring);
  beacon.userData.ring = ring;
  beacon.visible = false;
  scene.add(beacon);
  world.beacon = beacon;

  // pérolas bônus
  const pearlGeo = new THREE.SphereGeometry(0.38, 16, 12);
  const pearlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfe8ff, emissiveIntensity: 0.5, roughness: 0.15, metalness: 0.3 });
  for (let i = 0; i < 26; i++) {
    const p = new THREE.Mesh(pearlGeo, pearlMat);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xbff4ff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(2);
    p.add(glow);
    placePearl(p);
    scene.add(p);
    world.pearls.push(p);
  }

  // partículas 3D da comemoração (doces coloridos saindo do Finn)
  const cg = new THREE.IcosahedronGeometry(0.28, 0);
  const cmat = new THREE.MeshStandardMaterial({ roughness: 0.3, emissive: 0x222222 });
  const im = new THREE.InstancedMesh(cg, cmat, 220);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const cols = [0xff3d7f, 0xffcf1f, 0x2fd3ff, 0x7cff4f, 0xb06bff, 0xff8a1f, 0xffffff];
  const tmpC = new THREE.Color();
  for (let i = 0; i < 220; i++) im.setColorAt(i, tmpC.setHex(cols[i % cols.length]));
  im.frustumCulled = false;
  scene.add(im);
  world.candy = { im, p: Array.from({ length: 220 }, () => ({ life: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Euler() })) };
}

function placePearl(p) {
  for (let t = 0; t < 30; t++) {
    const x = rand(-62, 62), z = rand(-62, 62);
    if (world.obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + 2)) continue;
    p.position.set(x, SWIM_Y - 0.4, z);
    break;
  }
  p.visible = true;
  p.userData.respawn = 0;
}

// ======================================================================= estado do jogo
const save = (() => {
  let s = { unlocked: 1, stars: {}, best: 0 };
  try {
    const v = JSON.parse(localStorage.getItem('finnweek_v1'));
    if (v) s = { ...s, ...v };
  } catch (e) { /* sem armazenamento */ }
  return s;
})();
function persist() {
  try { localStorage.setItem('finnweek_v1', JSON.stringify(save)); } catch (e) { /* ok */ }
}

const G = {
  state: 'menu', // menu | play | paused | celebrate
  phaseIdx: 0,
  roundIdx: 0,
  score: 0,
  phaseStartScore: 0,
  combo: 0,
  errors: 0,
  roundErrors: 0,
  roundTime: 0,
  stage: 'collect', // collect | deliver
  chunks: [],
  expected: [],
  got: 0,
  vel: new THREE.Vector2(),
  heading: 0,
  turbo: 0,
  turboCd: 0,
  stun: 0,
  invuln: 0,
  hint: 0,
  doneDays: new Set(),
};

// ======================================================================= blocos de palavras (chunks)
const orbGeo = new THREE.SphereGeometry(0.9, 24, 16);
class Chunk {
  constructor(text, cat, pos) {
    this.text = text;
    this.cat = cat;
    const c = CATS[cat];
    this.group = new THREE.Group();
    this.orb = new THREE.Mesh(orbGeo, new THREE.MeshStandardMaterial({
      color: c.color, emissive: c.color, emissiveIntensity: 0.55, roughness: 0.2, transparent: true, opacity: 0.92,
    }));
    this.shell = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthWrite: false, opacity: 0.9 }));
    this.shell.scale.setScalar(2.6);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c.color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glow.scale.setScalar(4.2);
    this.label = labelSprite(text, { bg: c.color, dark: c.dark, height: 1.5 });
    this.label.position.y = 2.1;
    this.stars = new THREE.Sprite(new THREE.SpriteMaterial({ map: starRingTex, transparent: true, depthTest: false }));
    this.stars.scale.setScalar(5.5);
    this.stars.visible = false;
    this.stars.renderOrder = 19;
    this.group.add(this.glow, this.orb, this.shell, this.label, this.stars);
    this.group.position.copy(pos);
    this.vel = new THREE.Vector3();
    this.wander = rand(0, 6.28);
    this.ph = rand(0, 6.28);
    this.cool = 0;
    this.dead = false;
    this.fly = 0;
    scene.add(this.group);
  }
  dispose() {
    scene.remove(this.group);
    this.label.material.map.dispose();
    this.label.material.dispose();
    this.orb.material.dispose();
  }
}

function clearChunks() {
  G.chunks.forEach((c) => c.dispose());
  G.chunks = [];
}

function spawnSpot(taken) {
  // nasce na área visível da câmera (que fica atrás/acima do tubarão, em +z)
  const p = shark.position;
  const wx = 17 * Math.min(1, Math.max(0.55, window.innerWidth / window.innerHeight / 1.5));
  for (let t = 0; t < 200; t++) {
    const grow = 1 + t / 100;
    const x = p.x + rand(-wx, wx) * grow, z = p.z + rand(-15, 4) * grow;
    if (Math.hypot(x - p.x, z - p.z) < 6) continue;
    if (Math.hypot(x, z) > BOUND - 3) continue;
    if (world.obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + 2.5)) continue;
    if (taken.some((q) => Math.hypot(x - q.x, z - q.z) < 5.5)) continue;
    return new THREE.Vector3(x, SWIM_Y, z);
  }
  return new THREE.Vector3(p.x + rand(-20, 20), SWIM_Y, p.z + rand(-20, 20));
}

// ======================================================================= água-viva
const jellyBase = () => bake(models.jellyfish);
let jellyProto = null;
function spawnJellies(n) {
  world.jellies.forEach((j) => scene.remove(j));
  world.jellies = [];
  if (!jellyProto) {
    jellyProto = jellyBase();
    jellyProto.traverse((o) => {
      if (o.isMesh && /Jelly/.test(o.material.name)) {
        o.material.transparent = true;
        o.material.opacity = 0.75;
        o.material.depthWrite = false;
      }
    });
  }
  for (let i = 0; i < n; i++) {
    const j = jellyProto.clone(true);
    const a = rand(0, 6.28), d = rand(18, 34);
    j.position.set(shark.position.x + Math.cos(a) * d, SWIM_Y + 0.6, shark.position.z + Math.sin(a) * d);
    j.userData = { target: j.position.clone(), retarget: 0, ph: rand(0, 6), speed: rand(2.2, 3.4) };
    j.scale.setScalar(1.25);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff7ad9, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(4);
    j.add(glow);
    scene.add(j);
    world.jellies.push(j);
  }
}

// ======================================================================= HUD
const hud = {
  score: $('score'), combo: $('combo'), phaseName: $('phaseName'), roundInfo: $('roundInfo'),
  ask: $('ask'), pt: $('pt'), slots: $('slots'), goto: $('goto'), toast: $('toast'), agenda: $('agenda'),
};
$('legend').innerHTML = Object.values(CATS).map((c) => `<span style="background:${c.color}">${c.pt}</span>`).join('');

let shownScore = 0;
function setScore(v) {
  G.score = Math.max(0, Math.round(v));
}
let toastTimer = 0;
function toast(msg, ms = 1600) {
  hud.toast.innerHTML = msg;
  hud.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => hud.toast.classList.remove('show'), ms);
}

function renderSlots() {
  const phase = PHASES[G.phaseIdx];
  hud.slots.innerHTML = G.expected.map((e, i) => {
    const c = CATS[e.c];
    const filled = i < G.got;
    const label = phase.rounds[G.roundIdx].type === 'days' ? `${i + 1}º` : c.pt;
    return `<div class="slot ${filled ? 'filled' : ''} ${i === G.got && G.stage === 'collect' ? 'next' : ''}" style="--c:${c.color}">
      <small>${label}</small>${filled ? e.t : '?'}</div>`;
  }).join('');
}

function renderAgenda() {
  const phase = PHASES[G.phaseIdx];
  hud.agenda.classList.toggle('hidden', !phase.showAgenda);
  if (!phase.showAgenda) return;
  const cur = phase.rounds[G.roundIdx]?.day;
  hud.agenda.innerHTML = `<h4>📒 Agenda do Finn</h4>` + DAYS.map((d) => {
    const a = AGENDA[d];
    const pl = PLACES[a.place];
    return `<div class="row ${d === cur ? 'now' : ''} ${G.doneDays.has(d) ? 'done' : ''}"><span>${d}</span><span>${pl.icon}<span class="pn"> ${pl.en.split(' ')[0]}</span></span></div>`;
  }).join('');
}

function updateHudTop() {
  const phase = PHASES[G.phaseIdx];
  hud.phaseName.textContent = `Fase ${phase.id}: ${phase.title}`;
  hud.roundInfo.textContent = `Frase ${G.roundIdx + 1} de ${phase.rounds.length}`;
}

// ======================================================================= fluxo
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
}

function buildLevelScreen() {
  $('bestScore').textContent = save.best.toLocaleString('pt-BR');
  $('levels').innerHTML = PHASES.map((p, i) => {
    const st = save.stars[p.id] || 0;
    const locked = i + 1 > save.unlocked;
    return `<button class="lvl" data-i="${i}" ${locked ? 'disabled' : ''}>
      <b>${locked ? '🔒' : p.id}</b><span>${p.title}</span><em>${p.en}</em>
      <div class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div></button>`;
  }).join('');
  for (const b of $('levels').querySelectorAll('.lvl')) {
    b.onclick = () => {
      A.sfxClick();
      openIntro(+b.dataset.i);
    };
  }
}

function openIntro(i) {
  G.phaseIdx = i;
  const p = PHASES[i];
  $('introNum').textContent = `FASE ${p.id} DE ${PHASES.length}`;
  $('introTitle').textContent = p.title;
  $('introEn').textContent = p.en;
  $('introGoal').innerHTML = p.goal;
  $('introTip').innerHTML = '💡 ' + p.tip;
  $('introLegend').innerHTML = Object.values(CATS).map((c) => `<span style="background:${c.color}">${c.pt}</span>`).join('');
  showScreen('introScreen');
  A.duckMusic(0.6, 2500, 0.3);
}

function startPhase(i) {
  G.phaseIdx = i;
  G.roundIdx = 0;
  G.errors = 0;
  G.combo = 0;
  G.phaseStartScore = G.score;
  G.doneDays = new Set();
  shark.position.set(0, SWIM_Y, 8);
  G.vel.set(0, 0);
  G.heading = Math.PI;
  spawnJellies(PHASES[i].jellies);
  showScreen(null);
  $('hud').classList.remove('hidden');
  A.unduckMusic();
  G.state = 'play';
  startRound();
}

function startRound() {
  const phase = PHASES[G.phaseIdx];
  const round = phase.rounds[G.roundIdx];
  clearChunks();
  G.stage = 'collect';
  G.got = 0;
  G.roundErrors = 0;
  G.roundTime = 0;
  G.hint = 0;
  G.expected = round.type === 'days' ? round.order.map((t) => ({ t, c: 'day' })) : round.chunks;
  const all = [...G.expected, ...(round.distract || [])];
  const taken = [];
  for (const e of all) {
    const pos = spawnSpot(taken);
    taken.push(pos);
    G.chunks.push(new Chunk(e.t, e.c, pos));
  }
  hud.ask.textContent = round.ask || '';
  hud.pt.textContent = round.hidePt ? '👉 Olhe a agenda do Finn e responda!' : round.pt;
  hud.goto.classList.add('hidden');
  world.beacon.visible = false;
  world.arrow.visible = false;
  renderSlots();
  renderAgenda();
  updateHudTop();
  if (round.ask) setTimeout(() => A.speak(round.ask, { rate: 0.85 }), 400);
}

function collect(ch) {
  const exp = G.expected[G.got];
  if (ch.text === exp.t) {
    G.got++;
    G.combo++;
    const mult = Math.min(G.combo, 5);
    setScore(G.score + 100 * mult);
    ch.dead = true;
    ch.fly = 0.001;
    A.sfxCollect(G.combo);
    A.speak(ch.text, { interrupt: true, rate: 0.9 });
    const s = toScreen(ch.group.position);
    miniBurst(s.x, s.y, CATS[ch.cat].color);
    burst3D(ch.group.position, 30);
    if (mult > 1) {
      hud.combo.textContent = `COMBO x${mult}`;
      hud.combo.classList.remove('hidden', 'bump');
      void hud.combo.offsetWidth;
      hud.combo.classList.add('bump');
    }
    G.chunks.forEach((c) => (c.stars.visible = false));
    G.hint = 0;
    renderSlots();
    if (G.got === G.expected.length) sentenceBuilt();
  } else {
    G.errors++;
    G.roundErrors++;
    G.combo = 0;
    hud.combo.classList.add('hidden');
    setScore(G.score - 50);
    A.sfxWrong();
    screenShake(0.35);
    const away = ch.group.position.clone().sub(shark.position).setY(0).normalize();
    ch.vel.addScaledVector(away, 16);
    G.vel.addScaledVector(new THREE.Vector2(-away.x, -away.z), 10);
    ch.cool = 1.2;
    const need = CATS[exp.c];
    toast(`Ops! <b>${ch.text}</b> não vem agora.<br><span style="font-size:20px">Procure um bloco <span style="color:${need.color};text-shadow:0 2px 0 #fff">${need.pt}</span></span>`, 2200);
  }
}

function sentenceBuilt() {
  const round = PHASES[G.phaseIdx].rounds[G.roundIdx];
  if (round.dest) {
    G.stage = 'deliver';
    const pl = world.places[round.dest];
    hud.goto.innerHTML = `Frase pronta! Agora leve o Finn até: ${pl.icon} <b>${pl.en}</b>`;
    hud.goto.classList.remove('hidden');
    world.beacon.position.set(pl.trigger.x, groundY(pl.trigger.x, pl.trigger.z), pl.trigger.z);
    world.beacon.visible = true;
    world.arrow.visible = true;
    A.sfxSparkle(6, 0, 0.4);
    toast(`Muito bem! 🎉<br>Vá até ${pl.icon} ${pl.en}`, 1800);
    renderSlots();
  } else finishRound();
}

function finishRound() {
  const phase = PHASES[G.phaseIdx];
  const round = phase.rounds[G.roundIdx];
  const last = G.roundIdx === phase.rounds.length - 1;
  const timeBonus = Math.max(0, Math.round(1000 - G.roundTime * 12));
  const perfect = G.roundErrors === 0 ? 500 : 0;
  const pts = 1000 + timeBonus + perfect;
  setScore(G.score + pts);
  G.state = 'celebrate';
  world.beacon.visible = false;
  world.arrow.visible = false;
  hud.goto.classList.add('hidden');
  if (round.day) G.doneDays.add(round.day);
  renderAgenda();
  const sentence = round.type === 'days' ? G.expected.map((e) => e.t).join(', ') : G.expected.map((e) => e.t).join(' ') + '.';
  burst3D(shark.position, 220);
  const word = last ? (G.phaseIdx === PHASES.length - 1 ? 'SHARK-TASTIC!' : pick(['FINTASTIC!', 'JAWSOME!', 'DIVINE!'])) : pick(CHEERS);
  const dur = celebrate({
    word,
    chunks: G.expected,
    points: pts,
    sub: `⏱ bônus ${timeBonus}${perfect ? ' • ✨ sem erros +500' : ''}`,
    big: last,
    sentence,
  });
  setTimeout(() => {
    if (G.state !== 'celebrate') return;
    if (last) phaseComplete();
    else {
      G.roundIdx++;
      G.state = 'play';
      startRound();
    }
  }, dur * 1000 + 150);
}

function phaseComplete() {
  const phase = PHASES[G.phaseIdx];
  clearChunks();
  G.state = 'menu';
  const stars = G.errors === 0 ? 3 : G.errors <= 3 ? 2 : 1;
  save.stars[phase.id] = Math.max(save.stars[phase.id] || 0, stars);
  save.unlocked = Math.max(save.unlocked, Math.min(PHASES.length, G.phaseIdx + 2));
  save.best = Math.max(save.best, G.score);
  persist();
  $('hud').classList.add('hidden');
  if (G.phaseIdx === PHASES.length - 1) {
    const total = PHASES.reduce((a, p) => a + (save.stars[p.id] || 0), 0);
    $('finalStars').innerHTML = `<i>⭐</i> × ${total}`;
    $('finalScore').textContent = `Pontuação: ${G.score.toLocaleString('pt-BR')}`;
    showScreen('finalScreen');
    celebrate({ word: 'HURRAY!', chunks: DAYS.map((t) => ({ t, c: 'day' })), points: G.score, sub: 'Great job, everyone!', big: true, sentence: 'Hurray! Great job, everyone!' });
    return;
  }
  $('compTitle').textContent = `Fase ${phase.id} completa!`;
  $('compStars').innerHTML = [0, 1, 2].map((k) => `<i style="animation-delay:${0.2 + k * 0.25}s">${k < stars ? '⭐' : '☆'}</i>`).join('');
  [0, 1, 2].forEach((k) => k < stars && setTimeout(() => { A.sfxPop(0, 1 + k * 0.3); A.sfxSparkle(5, 0, 0.3); }, 200 + k * 250));
  $('compScore').textContent = `Pontos: ${G.score.toLocaleString('pt-BR')} (+${(G.score - G.phaseStartScore).toLocaleString('pt-BR')})`;
  $('compInfo').textContent = G.errors === 0 ? 'Nenhum erro! Perfeito!' : `Erros: ${G.errors}`;
  const lastRound = phase.rounds[phase.rounds.length - 1];
  $('compPhrase').innerHTML = `🗣️ <b>${lastRound.type === 'days' ? lastRound.order.join(', ') : lastRound.chunks.map((c) => c.t).join(' ') + '.'}</b>`;
  showScreen('completeScreen');
}

// ======================================================================= efeitos 3D
const v3 = new THREE.Vector3();
function toScreen(p) {
  v3.copy(p).project(camera);
  return { x: (v3.x * 0.5 + 0.5) * window.innerWidth, y: (-v3.y * 0.5 + 0.5) * window.innerHeight };
}
let candyCursor = 0;
function burst3D(pos, n) {
  const P = world.candy.p;
  for (let i = 0; i < n; i++) {
    const p = P[candyCursor++ % P.length];
    p.life = rand(1.2, 2.2);
    p.pos.copy(pos);
    const a = rand(0, Math.PI * 2), e = rand(-0.2, 1.2), s = rand(6, 16) * (n > 100 ? 1.3 : 0.8);
    p.vel.set(Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 4, Math.sin(a) * Math.cos(e) * s);
  }
}
const m4 = new THREE.Matrix4();
const q4 = new THREE.Quaternion();
const sc4 = new THREE.Vector3();
function updateCandy(dt) {
  const { im, p } = world.candy;
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c.life > 0) {
      c.life -= dt;
      c.vel.y -= 9 * dt;
      c.vel.multiplyScalar(Math.exp(-1.2 * dt));
      c.pos.addScaledVector(c.vel, dt);
      c.rot.x += dt * 5; c.rot.y += dt * 4;
      q4.setFromEuler(c.rot);
      sc4.setScalar(Math.min(1, c.life * 1.5) * 1.3);
    } else sc4.setScalar(0);
    m4.compose(c.pos, q4, sc4);
    im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
}

// ======================================================================= entrada
const keys = new Set();
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (k === ' ' && G.state === 'play') { e.preventDefault(); turbo(); }
  if ((k === 'p' || k === 'escape') && (G.state === 'play' || G.state === 'paused')) togglePause();
  if (k === 'm') toggleMusic();
  if (k === 'h' && G.state === 'play') useHint();
  if (k.startsWith('arrow')) e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

const pointer = { active: false, target: new THREE.Vector3(), id: null, lastTap: 0 };
const ray = new THREE.Raycaster();
const swimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SWIM_Y);
function pointerToWorld(e) {
  const ndc = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  ray.ray.intersectPlane(swimPlane, pointer.target);
}
canvas.addEventListener('pointerdown', (e) => {
  A.initAudio();
  pointer.active = true;
  pointer.id = e.pointerId;
  pointerToWorld(e);
  const now = performance.now();
  if (now - pointer.lastTap < 300) turbo();
  pointer.lastTap = now;
});
canvas.addEventListener('pointermove', (e) => { if (pointer.active && e.pointerId === pointer.id) pointerToWorld(e); });
const endPointer = (e) => { if (e.pointerId === pointer.id) pointer.active = false; };
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

function turbo() {
  if (G.turboCd > 0 || G.state !== 'play') return;
  G.turbo = 0.7;
  G.turboCd = 1.6;
  A.sfxWhoosh(0, 0.25);
}

function useHint() {
  if (G.stage !== 'collect' || G.hint > 0) return;
  const exp = G.expected[G.got];
  const c = G.chunks.find((x) => !x.dead && x.text === exp.t);
  if (!c) return;
  setScore(G.score - 100);
  G.hint = 5;
  c.stars.visible = true;
  A.sfxSparkle(6, 0, 0.3);
  toast('💡 Siga as estrelas! (-100)', 1400);
}

function togglePause() {
  if (G.state === 'play') {
    G.state = 'paused';
    showScreen('pauseScreen');
    A.duckMusic(0.5, 600);
  } else if (G.state === 'paused') {
    G.state = 'play';
    showScreen(null);
    A.unduckMusic();
  }
}
function toggleMusic() {
  A.initAudio();
  A.setMusic(!A.isMusicOn());
  $('musicBtn').textContent = A.isMusicOn() ? '🎵' : '🔇';
}

// botões
$('musicBtn').onclick = toggleMusic;
$('pauseBtn').onclick = () => { A.sfxClick(); togglePause(); };
$('hintBtn').onclick = () => G.state === 'play' && useHint();
$('howBtn').onclick = () => { A.initAudio(); A.sfxClick(); showScreen('howScreen'); };
$('howBack').onclick = () => { A.sfxClick(); showScreen('titleScreen'); };
$('playBtn').onclick = () => {
  A.initAudio();
  A.startMusic();
  A.sfxClick();
  A.speak("Let's go!", { rate: 0.9 });
  buildLevelScreen();
  showScreen('levelScreen');
};
$('levelBack').onclick = () => { A.sfxClick(); showScreen('titleScreen'); };
$('unlockAll').onclick = () => { save.unlocked = PHASES.length; persist(); buildLevelScreen(); };
$('introGo').onclick = () => { A.sfxClick(); startPhase(G.phaseIdx); };
$('resumeBtn').onclick = () => { A.sfxClick(); togglePause(); };
$('restartBtn').onclick = () => { A.sfxClick(); setScore(G.phaseStartScore); startPhase(G.phaseIdx); };
const toMenu = () => {
  A.sfxClick();
  clearChunks();
  G.state = 'menu';
  world.beacon.visible = false;
  world.arrow.visible = false;
  $('hud').classList.add('hidden');
  buildLevelScreen();
  showScreen('levelScreen');
};
$('menuBtn').onclick = toMenu;
$('compMenu').onclick = toMenu;
$('finalMenu').onclick = toMenu;
$('nextBtn').onclick = () => { A.sfxClick(); openIntro(Math.min(PHASES.length - 1, G.phaseIdx + 1)); };
$('finalAgain').onclick = () => { A.sfxClick(); setScore(0); openIntro(0); };

// ======================================================================= loop
const clock = new THREE.Clock();
const camTarget = new THREE.Vector3();
const lookAt = new THREE.Vector3();
let time = 0;

function updateShark(dt) {
  const input = new THREE.Vector2();
  const canMove = G.state === 'play' && G.stun <= 0;
  if (canMove) {
    if (keys.has('arrowleft') || keys.has('a')) input.x -= 1;
    if (keys.has('arrowright') || keys.has('d')) input.x += 1;
    if (keys.has('arrowup') || keys.has('w')) input.y -= 1;
    if (keys.has('arrowdown') || keys.has('s')) input.y += 1;
    if (pointer.active) {
      const dx = pointer.target.x - shark.position.x, dz = pointer.target.z - shark.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 1.2) input.set(dx / d, dz / d);
    }
    if (input.lengthSq() > 1) input.normalize();
  }
  const maxSpeed = G.turbo > 0 ? 21 : 11;
  G.vel.addScaledVector(input, 42 * dt);
  G.vel.multiplyScalar(Math.exp(-(input.lengthSq() > 0 ? 2.6 : 3.4) * dt));
  if (G.vel.length() > maxSpeed) G.vel.setLength(maxSpeed);
  if (G.turbo > 0 && input.lengthSq() > 0) G.vel.addScaledVector(input, 30 * dt);
  G.turbo -= dt;
  G.turboCd -= dt;
  G.stun -= dt;
  G.invuln -= dt;

  const p = shark.position;
  p.x += G.vel.x * dt;
  p.z += G.vel.y * dt;
  // colisões com os lugares e borda do mapa
  for (const o of world.obstacles) {
    const dx = p.x - o.x, dz = p.z - o.z;
    const d = Math.hypot(dx, dz);
    const min = o.r + 1.3;
    if (d < min && d > 0.001) {
      p.x = o.x + (dx / d) * min;
      p.z = o.z + (dz / d) * min;
    }
  }
  const rr = Math.hypot(p.x, p.z);
  if (rr > BOUND) {
    p.x *= BOUND / rr;
    p.z *= BOUND / rr;
    if (G.state === 'play' && Math.random() < 0.02) toast('Muito longe! Volte para perto dos amigos 🐠', 1200);
  }
  const speed = G.vel.length();
  p.y = SWIM_Y + Math.sin(time * 2.2) * 0.18;

  // direção e inclinação
  if (speed > 0.6) {
    const target = Math.atan2(G.vel.x, G.vel.y);
    let diff = target - G.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    G.heading += diff * Math.min(1, dt * 8);
    sharkModel.rotation.z = THREE.MathUtils.lerp(sharkModel.rotation.z, -diff * 0.7, dt * 5);
  } else sharkModel.rotation.z *= 1 - dt * 3;
  shark.rotation.y = G.heading + (G.stun > 0 ? time * 14 : 0);
  sharkModel.rotation.x = Math.sin(time * 2.2 + 1) * 0.06;
  if (sharkTail) sharkTail.rotation.y = Math.sin(time * (6 + speed * 1.1)) * (0.25 + speed * 0.03);
  sharkModel.visible = !(G.invuln > 0 && Math.floor(time * 12) % 2 === 0);
  sharkShadow.position.set(p.x, groundY(p.x, p.z) + 0.08, p.z);
  sharkShadow.rotation.z = -G.heading;
}

function updateChunks(dt) {
  const phase = PHASES[G.phaseIdx];
  for (const c of G.chunks) {
    const gp = c.group.position;
    if (c.dead) {
      c.fly += dt * 3;
      gp.lerp(shark.position, Math.min(1, dt * 10));
      c.group.scale.setScalar(Math.max(0.001, 1 - c.fly));
      continue;
    }
    c.ph += dt;
    c.cool -= dt;
    if (phase.drift > 0) {
      c.wander += rand(-1, 1) * dt;
      c.vel.x += Math.cos(c.wander) * phase.drift * 2.5 * dt;
      c.vel.z += Math.sin(c.wander) * phase.drift * 2.5 * dt;
    }
    c.vel.multiplyScalar(Math.exp(-1.8 * dt));
    gp.addScaledVector(c.vel, dt);
    const rr = Math.hypot(gp.x, gp.z);
    if (rr > BOUND - 3) { gp.x *= (BOUND - 3) / rr; gp.z *= (BOUND - 3) / rr; c.wander += Math.PI; }
    for (const o of world.obstacles) {
      const dx = gp.x - o.x, dz = gp.z - o.z, d = Math.hypot(dx, dz);
      if (d < o.r + 2 && d > 0.01) { gp.x = o.x + (dx / d) * (o.r + 2); gp.z = o.z + (dz / d) * (o.r + 2); }
    }
    gp.y = SWIM_Y + Math.sin(c.ph * 2) * 0.35;
    c.orb.scale.setScalar(1 + Math.sin(c.ph * 4) * 0.06);
    c.glow.material.opacity = 0.55 + Math.sin(c.ph * 3) * 0.2;
    if (c.stars.visible) {
      c.stars.material.rotation += dt * 2;
      c.stars.scale.setScalar(5 + Math.sin(c.ph * 8) * 0.6);
    }
    if (G.state === 'play' && G.stage === 'collect' && c.cool <= 0) {
      const d = Math.hypot(gp.x - shark.position.x, gp.z - shark.position.z);
      if (d < 2.5) collect(c);
    }
  }
  for (let i = G.chunks.length - 1; i >= 0; i--) {
    if (G.chunks[i].dead && G.chunks[i].fly >= 1) {
      G.chunks[i].dispose();
      G.chunks.splice(i, 1);
    }
  }
  if (G.hint > 0) {
    G.hint -= dt;
    if (G.hint <= 0) G.chunks.forEach((c) => (c.stars.visible = false));
  }
  // ao terminar de montar a frase, os blocos que sobraram somem
  if (G.stage === 'deliver') {
    for (const c of G.chunks) if (!c.dead) { c.dead = true; c.fly = 0.001; }
  }
}

function updateDeliver(dt) {
  if (G.stage !== 'deliver' || G.state !== 'play') return;
  const pl = world.places[PHASES[G.phaseIdx].rounds[G.roundIdx].dest];
  const t = pl.trigger;
  const d = Math.hypot(t.x - shark.position.x, t.z - shark.position.z);
  world.arrow.position.set(shark.position.x, shark.position.y + 3.2 + Math.sin(time * 4) * 0.2, shark.position.z);
  world.arrow.lookAt(t.x, world.arrow.position.y, t.z);
  world.arrow.scale.setScalar(d < 8 ? 0.6 : 1);
  world.beacon.userData.ring.scale.setScalar(1 + Math.sin(time * 5) * 0.12);
  world.beacon.rotation.y += dt;
  if (d < 4.5) finishRound();
}

function updateJellies(dt) {
  for (const j of world.jellies) {
    const u = j.userData;
    u.retarget -= dt;
    if (u.retarget <= 0) {
      u.retarget = rand(3, 6);
      u.target.set(shark.position.x + rand(-18, 18), SWIM_Y + 0.6, shark.position.z + rand(-18, 18));
    }
    const dir = u.target.clone().sub(j.position).setY(0);
    if (dir.length() > 0.5) j.position.addScaledVector(dir.normalize(), u.speed * dt * (0.6 + 0.4 * Math.max(0, Math.sin(time * 3 + u.ph))));
    for (const o of world.obstacles) {
      const dx = j.position.x - o.x, dz = j.position.z - o.z, d = Math.hypot(dx, dz);
      if (d < o.r + 1.5) { j.position.x = o.x + (dx / d) * (o.r + 1.5); j.position.z = o.z + (dz / d) * (o.r + 1.5); }
    }
    const pulse = 1 + Math.sin(time * 3 + u.ph) * 0.12;
    j.scale.set(1.25 * pulse, 1.25 / pulse, 1.25 * pulse);
    j.position.y = SWIM_Y + 0.6 + Math.sin(time * 1.5 + u.ph) * 0.4;
    j.rotation.y += dt * 0.3;
    if (G.state === 'play' && G.invuln <= 0) {
      const d = Math.hypot(j.position.x - shark.position.x, j.position.z - shark.position.z);
      if (d < 2.1) {
        G.invuln = 2.2;
        G.stun = 0.8;
        G.combo = 0;
        hud.combo.classList.add('hidden');
        setScore(G.score - 100);
        const away = new THREE.Vector2(shark.position.x - j.position.x, shark.position.z - j.position.z).normalize();
        G.vel.copy(away.multiplyScalar(18));
        A.sfxSting();
        screenShake(0.5);
        toast('⚡ Ai! Água-viva! -100', 1400);
      }
    }
  }
}

function updatePearls(dt) {
  for (const p of world.pearls) {
    if (!p.visible) {
      p.userData.respawn -= dt;
      if (p.userData.respawn <= 0) placePearl(p);
      continue;
    }
    p.position.y = SWIM_Y - 0.4 + Math.sin(time * 2 + p.position.x) * 0.25;
    if (G.state === 'play' && Math.hypot(p.position.x - shark.position.x, p.position.z - shark.position.z) < 2) {
      p.visible = false;
      p.userData.respawn = 12;
      setScore(G.score + 10);
      A.sfxPearl();
      const s = toScreen(p.position);
      miniBurst(s.x, s.y, '#bff4ff');
    }
  }
}

function updateLife(dt) {
  for (const school of world.fishes) {
    school.phase += school.speed * dt;
    const cx = Math.cos(school.phase) * school.radius;
    const cz = Math.sin(school.phase) * school.radius;
    for (const f of school.fish) {
      const u = f.userData;
      const x = cx + u.off.x + Math.sin(time * 0.7 + u.ph) * 1.5;
      const z = cz + u.off.z + Math.cos(time * 0.6 + u.ph) * 1.5;
      const nx = x - f.position.x, nz = z - f.position.z;
      if (nx * nx + nz * nz > 1e-5) f.rotation.y = Math.atan2(nx, nz);
      f.position.set(x, school.y + u.off.y + Math.sin(time * 2 + u.ph) * 0.2, z);
      if (u.tail) u.tail.rotation.y = Math.sin(time * 10 + u.ph) * 0.5;
      // celebração: peixes dão piruetas
      f.rotation.z = G.state === 'celebrate' ? time * 8 : 0;
    }
  }
  for (const c of world.crabs) {
    const u = c.userData;
    const k = Math.sin(time * 0.5 + u.ph) * u.amp;
    const x = u.x0 + Math.cos(u.ang) * k, z = u.z0 + Math.sin(u.ang) * k;
    c.position.set(x, groundY(x, z) + Math.abs(Math.sin(time * 8 + u.ph)) * 0.08, z);
    c.rotation.y = u.ang + Math.PI / 2;
    c.rotation.z = Math.sin(time * 8 + u.ph) * 0.06;
    if (G.state === 'celebrate') c.position.y += Math.abs(Math.sin(time * 10 + u.ph)) * 0.8;
  }
  // placas dos lugares somem quando ficam coladas na câmera
  for (const pl of Object.values(world.places)) {
    const d = camera.position.distanceTo(pl.sign.position);
    pl.sign.material.opacity = THREE.MathUtils.clamp((d - 12) / 10, 0, 1);
    pl.sign.visible = pl.sign.material.opacity > 0.02;
  }
  for (const r of world.rays) {
    r.material.opacity = r.userData.base * (0.6 + 0.4 * Math.sin(time * 0.5 + r.userData.ph));
    r.lookAt(camera.position.x, r.position.y, camera.position.z);
    r.rotateZ(-0.25);
  }
  // bolhas sobem, neve marinha desce (envolvendo o tubarão)
  const wrap = (pts, vy, sway) => {
    const a = pts.geometry.attributes.position;
    const arr = a.array;
    const sx = shark.position.x, sz = shark.position.z;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += vy * dt * (0.6 + ((i * 7) % 10) / 10);
      arr[i] += Math.sin(time + i) * sway * dt;
      if (arr[i + 1] > 30) arr[i + 1] = 0;
      if (arr[i + 1] < 0) arr[i + 1] = 30;
      if (arr[i] - sx > 45) arr[i] -= 90;
      if (arr[i] - sx < -45) arr[i] += 90;
      if (arr[i + 2] - sz > 45) arr[i + 2] -= 90;
      if (arr[i + 2] - sz < -45) arr[i + 2] += 90;
    }
    a.needsUpdate = true;
  };
  wrap(world.bubbles, 2.2, 0.6);
  wrap(world.snow, -0.4, 0.3);
}

function updateCamera(dt) {
  const aspect = window.innerWidth / window.innerHeight;
  const k = aspect < 1 ? 1.55 : aspect < 1.4 ? 1.15 : 1;
  const inMenu = G.state === 'menu';
  if (inMenu) {
    // câmera passeando pelo oceano nas telas de menu
    const a = time * 0.06;
    camTarget.set(Math.cos(a) * 30, 16, Math.sin(a) * 30 + 10);
    lookAt.lerp(new THREE.Vector3(0, 4, 0), 1 - Math.exp(-2 * dt));
  } else {
    camTarget.set(shark.position.x, shark.position.y + 14 * k, shark.position.z + 14 * k);
    lookAt.lerp(new THREE.Vector3(shark.position.x, shark.position.y, shark.position.z - 2), 1 - Math.exp(-6 * dt));
  }
  camera.position.lerp(camTarget, 1 - Math.exp(-(inMenu ? 1 : 4) * dt));
  camera.lookAt(lookAt);
}

function updateScore(dt) {
  if (shownScore !== G.score) {
    const d = G.score - shownScore;
    shownScore += Math.sign(d) * Math.max(1, Math.ceil(Math.abs(d) * Math.min(1, dt * 8)));
    if (Math.abs(G.score - shownScore) < 2) shownScore = G.score;
    hud.score.textContent = shownScore.toLocaleString('pt-BR');
  }
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1 ? 62 : 50;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  if (G.state !== 'paused') {
    time += dt;
    U.uTime.value = time;
    if (G.state === 'play') G.roundTime += dt;
    if (shark) {
      updateShark(dt);
      updateChunks(dt);
      updateDeliver(dt);
      updateJellies(dt);
      updatePearls(dt);
      updateLife(dt);
      updateCandy(dt);
      updateCamera(dt);
    }
    updateScore(dt);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// ======================================================================= carregamento
async function load() {
  const loader = new GLTFLoader();
  let done = 0;
  const bar = document.querySelector('#loadbar i');
  await Promise.all(MODEL_NAMES.map((n) => new Promise((res, rej) => {
    loader.load(`models/${n}.glb`, (g) => {
      models[n] = g.scene;
      done++;
      bar.style.width = `${(done / MODEL_NAMES.length) * 100}%`;
      res();
    }, undefined, rej);
  })));
  if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  buildWorld();
  shark.position.set(0, SWIM_Y, 8);
  $('loadtxt').textContent = 'Pronto! Clique em JOGAR (o som vai ligar 🔊)';
  $('playBtn').disabled = false;
  window.__ready = true;
}
load().catch((e) => {
  console.error(e);
  $('loadtxt').textContent = 'Erro ao carregar os modelos 3D. Abra o jogo por um servidor web (veja o README).';
});
loop();

// gancho para testes automatizados
window.__game = { G, world, startPhase, collect, finishRound, shark: () => shark, openIntro, PHASES };
