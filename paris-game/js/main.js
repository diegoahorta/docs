import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CATS, CHEERS, PLACES, frase } from './content.js';
import * as A from './audio.js';
import { celebrate, jolt, sparkle } from './fx.js';

const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const riverZ = (x) => 4 - 6 * Math.sin(x * 0.08); // mesmo traçado do Sena feito no Blender

// ================================================================== render
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf7dbe6, 90, 220);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
camera.position.set(0, 60, 80);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 20;
controls.maxDistance = 120;
controls.maxPolarAngle = Math.PI * 0.44;
controls.enablePan = false;
scene.add(new THREE.HemisphereLight(0xfff0f6, 0x8a7a70, 1.3));
const sun = new THREE.DirectionalLight(0xffe2c4, 2.2);
sun.position.set(-50, 70, 40);
scene.add(sun);
const U = { t: { value: 0 } };

// céu pastel de fim de tarde
const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `varying vec3 vP;
    void main(){ float h = clamp(vP.y, -0.2, 1.0);
      vec3 low = vec3(1.0, 0.82, 0.86), mid = vec3(1.0, 0.9, 0.82), top = vec3(0.62, 0.76, 1.0);
      vec3 c = mix(low, mid, smoothstep(-0.05, 0.12, h)); c = mix(c, top, smoothstep(0.12, 0.7, h));
      gl_FragColor = vec4(c, 1.0); }`,
}));
scene.add(sky);

// ================================================================== modelos
const MODELS = ['lua', 'ground', 'seine', 'eiffel', 'arc', 'louvre', 'notredame', 'cafe', 'haussmann', 'gare', 'airport', 'tree', 'lamp', 'bridge'];
const models = {};
function collect(node, out, stop) { for (const c of node.children) { if (stop.has(c)) continue; if (c.isMesh) out.push(c); collect(c, out, stop); } }
function merge(meshes, inv) {
  const by = new Map(); const m4 = new THREE.Matrix4();
  for (const o of meshes) {
    let g = o.geometry.clone().applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
    if (g.index) g = g.toNonIndexed();
    const key = o.material.name;
    if (!by.has(key)) by.set(key, { m: o.material, gs: [] });
    by.get(key).gs.push(g);
  }
  return [...by.values()].map(({ m, gs }) => { const me = new THREE.Mesh(mergeGeometries(gs, false), m); me.name = m.name; return me; });
}
function bake(src, keep = []) {
  src.updateMatrixWorld(true);
  const kn = keep.map((n) => src.getObjectByName(n)).filter(Boolean);
  const inv = src.matrixWorld.clone().invert();
  const out = new THREE.Group();
  const ms = []; collect(src, ms, new Set(kn)); out.add(...merge(ms, inv));
  for (const k of kn) {
    const g = new THREE.Group(); g.name = k.name;
    inv.clone().multiply(k.matrixWorld).decompose(g.position, g.quaternion, g.scale);
    const km = []; collect(k, km, new Set()); g.add(...merge(km, k.matrixWorld.clone().invert()));
    out.add(g);
  }
  return out;
}
function instance(baked, mats) {
  const grp = new THREE.Group();
  for (const m of baked.children) {
    if (!m.isMesh) continue;
    const im = new THREE.InstancedMesh(m.geometry, m.material, mats.length);
    mats.forEach((x, i) => im.setMatrixAt(i, x));
    im.computeBoundingSphere();
    grp.add(im);
  }
  scene.add(grp);
  return grp;
}
function pin(lines, accent = '#d93a7a', h = 3) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const f1 = '700 50px "Quicksand", system-ui, sans-serif', f2 = 'italic 600 36px "Playfair Display", Georgia, serif';
  g.font = f1; const w1 = g.measureText(lines[0]).width;
  g.font = f2; const w2 = g.measureText(lines[1] || '').width;
  const w = Math.max(w1, w2) + 60;
  c.width = w; c.height = 150;
  g.fillStyle = 'rgba(255,250,246,.95)';
  g.strokeStyle = accent; g.lineWidth = 5;
  g.beginPath(); g.roundRect(3, 3, w - 6, 120, 26); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(w / 2 - 14, 122); g.lineTo(w / 2, 146); g.lineTo(w / 2 + 14, 122); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = f1; g.fillStyle = '#3a2230'; g.fillText(lines[0], w / 2, 46);
  g.font = f2; g.fillStyle = accent; g.fillText(lines[1] || '', w / 2, 94);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, toneMapped: false, fog: false }));
  s.scale.set((h * c.width) / c.height, h, 1);
  s.center.set(0.5, 0);
  s.renderOrder = 10;
  return s;
}

// ================================================================== mundo
const LAND = {
  airport: { model: 'airport', scale: 0.7, r: 7 }, cafe: { model: 'cafe', scale: 0.85, r: 5 },
  montmartre: { model: 'haussmann', scale: 1.0, r: 4.5 }, gare: { model: 'gare', scale: 0.6, r: 6 },
  eiffel: { model: 'eiffel', scale: 1.0, r: 5.5 }, louvre: { model: 'louvre', scale: 0.55, r: 7 },
  notredame: { model: 'notredame', scale: 0.8, r: 6 }, arc: { model: 'arc', scale: 0.9, r: 4.5 },
};
const W = { places: [], hits: [] };
let lua, legL, legR, armL, armR, ring;

function buildWorld() {
  // chão e rio
  const ground = models.ground;
  ground.traverse((o) => { if (o.isMesh && o.material.name === 'GroundMat') { o.material.vertexColors = true; o.material.color.setRGB(1.08, 1.0, 0.9); } });
  scene.add(ground);
  const seine = models.seine;
  seine.traverse((o) => {
    if (!o.isMesh) return;
    o.material = new THREE.ShaderMaterial({
      uniforms: { t: U.t }, transparent: true, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float t;
        void main(){
          float w = sin(vUv.x * 40.0 - t * 2.0 + sin(vUv.y * 6.0) * 2.0) * 0.5 + 0.5;
          float s = pow(sin(vUv.x * 90.0 + t * 1.3 + vUv.y * 9.0) * 0.5 + 0.5, 18.0);
          vec3 c = mix(vec3(0.33, 0.6, 0.78), vec3(0.45, 0.72, 0.86), w) + s * 0.25;
          float edge = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
          gl_FragColor = vec4(c, 0.92 * edge + 0.05); }`,
    });
  });
  scene.add(seine);

  // monumentos (missões)
  PLACES.forEach((p, i) => {
    const L = LAND[p.key];
    const g = bake(models[L.model]);
    const [x, z] = p.pos;
    g.position.set(x, 0, z);
    g.rotation.y = Math.atan2(-x, -z);
    g.scale.setScalar(L.scale);
    scene.add(g);
    const d = new THREE.Vector2(-x, -z).normalize();
    const spot = new THREE.Vector3(x + d.x * (L.r + 2.5), 0, z + d.y * (L.r + 2.5));
    const box = new THREE.Box3().setFromObject(g);
    const label = pin([`${p.icon} ${p.id} · ${p.pt}`, p.topic]);
    label.position.set(x, box.max.y + 1.2, z);
    scene.add(label);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(L.r + 1.5, L.r + 1.5, Math.max(6, box.max.y), 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(x, box.max.y / 2, z);
    hit.userData.idx = i;
    scene.add(hit);
    W.hits.push(hit);
    const cam = spot.clone().add(new THREE.Vector3(d.x * 11, 0, d.y * 11));
    W.places.push({ g, spot, cam, dir: d, label, top: box.max.y, x, z, r: L.r });
  });

  // cidade: prédios haussmannianos, árvores, postes e pontes
  const avoid = (x, z, pad) => {
    if (Math.hypot(x, z) > 56) return true;
    if (Math.abs(z - riverZ(x)) < 6 + pad * 0.3) return true;
    return W.places.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + pad + 3 || Math.hypot(x - p.spot.x, z - p.spot.z) < 4 + pad || Math.hypot(x - p.cam.x, z - p.cam.z) < 5 + pad);
  };
  const bMats = [];
  for (let gx = -54; gx <= 54; gx += 9) {
    for (let gz = -54; gz <= 54; gz += 9) {
      const x = gx + rand(-0.6, 0.6), z = gz + rand(-0.6, 0.6);
      if (avoid(x, z, 4) || Math.random() < 0.25) continue;
      const s = rand(0.75, 1.0);
      bMats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.floor(rand(0, 4)) * Math.PI / 2, 0)), new THREE.Vector3(s, s * rand(0.85, 1.15), s)));
    }
  }
  instance(bake(models.haussmann), bMats);
  const tMats = [], lMats = [];
  for (let x = -58; x <= 58; x += 3.2) {
    for (const side of [-1, 1]) {
      const z = riverZ(x) + side * 4.4;
      if (Math.hypot(x, z) > 58) continue;
      if (W.places.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + 2 || Math.hypot(x - p.spot.x, z - p.spot.z) < 7 || Math.hypot(x - p.cam.x, z - p.cam.z) < 7)) continue;
      if (Math.round(x / 3.2) % 3 === 0) lMats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z + side * 0.6), new THREE.Quaternion(), new THREE.Vector3(0.9, 0.9, 0.9)));
      else { const s = rand(0.8, 1.15); tMats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand(0, 6), 0)), new THREE.Vector3(s, s, s))); }
    }
  }
  for (const [px, pz, pr] of [[-36, 16, 8], [2, -10, 5], [-10, 24, 6], [30, -30, 6]]) {
    for (let k = 0; k < 14; k++) {
      const a = rand(0, Math.PI * 2), r = rand(0, pr), x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
      if (W.places.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + 1.5 || Math.hypot(x - p.spot.x, z - p.spot.z) < 7 || Math.hypot(x - p.cam.x, z - p.cam.z) < 7) || Math.abs(z - riverZ(x)) < 5) continue;
      const s = rand(0.7, 1.1);
      tMats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s)));
    }
  }
  instance(bake(models.tree), tMats);
  instance(bake(models.lamp), lMats);
  for (const bx of [-22, 0, 14, 40]) {
    const b = bake(models.bridge);
    const slope = -6 * 0.08 * Math.cos(bx * 0.08);
    b.position.set(bx, -0.3, riverZ(bx));
    b.rotation.y = Math.atan(slope);
    b.scale.set(0.9, 0.7, 1.0);
    scene.add(b);
  }

  // anel de seleção
  ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 8, 64), new THREE.MeshBasicMaterial({ color: 0xff5f9e, toneMapped: false }));
  ring.rotation.x = Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  // Lua
  lua = bake(models.lua, ['LegL', 'LegR', 'ArmL', 'ArmR']);
  legL = lua.getObjectByName('LegL'); legR = lua.getObjectByName('LegR');
  armL = lua.getObjectByName('ArmL'); armR = lua.getObjectByName('ArmR');
  lua.scale.setScalar(1.7);
  scene.add(lua);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: 0x5a3a48, transparent: true, opacity: 0.25, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02;
  lua.add(sh);
}

// ================================================================== estado salvo
const save = (() => {
  let s = { unlocked: 1, stars: {}, best: {}, at: 0 };
  try { const v = JSON.parse(localStorage.getItem('lua_paris_v1')); if (v) s = { ...s, ...v }; } catch (e) { /* ok */ }
  return s;
})();
const persist = () => { try { localStorage.setItem('lua_paris_v1', JSON.stringify(save)); } catch (e) { /* ok */ } };
const totalLikes = () => Object.values(save.best).reduce((a, b) => a + b, 0);
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const followers = () => Math.floor(totalLikes() / 6) + totalStars() * 25;

const G = { mode: 'title', sel: -1, place: 0, k: 0, likes: 0, combo: 0, mistakes: 0, tries: 0, start: 0, placed: [], tray: [], walk: null, anim: 0 };

function show(id) { for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id; }
function refreshMapHud() {
  document.querySelectorAll('.likesTotal').forEach((e) => (e.textContent = totalLikes().toLocaleString('pt-BR')));
  document.querySelectorAll('.followers').forEach((e) => (e.textContent = followers().toLocaleString('pt-BR')));
  W.places.forEach((p, i) => (p.label.material.opacity = i < save.unlocked ? 1 : 0.5));
}
let toastT = 0;
function toast(html, ms = 1800) {
  const t = $('toast'); t.innerHTML = html; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}

// ================================================================== mapa
function enterMap() {
  G.mode = 'map';
  show(null);
  $('missionHud').hidden = true;
  $('mapHud').hidden = false;
  controls.enabled = true;
  const P = W.places[save.at];
  lua.position.copy(P.spot);
  lua.rotation.y = Math.atan2(P.dir.x, P.dir.y);
  controls.target.set(P.spot.x * 0.5, 0, P.spot.z * 0.5);
  camera.position.set(P.spot.x * 0.5 + 10, 55, P.spot.z * 0.5 + 62);
  refreshMapHud();
  selectPlace(Math.min(save.unlocked - 1, PLACES.length - 1));
}
function selectPlace(i) {
  G.sel = i;
  const p = PLACES[i], P = W.places[i];
  ring.position.set(P.x, 0.15, P.z);
  ring.scale.setScalar(P.r + 2);
  const locked = i >= save.unlocked;
  const st = save.stars[p.id] || 0;
  const panel = $('placePanel');
  panel.hidden = false;
  panel.innerHTML = `<div class="num">MISSÃO ${p.id} DE ${PLACES.length} • ${p.icon}</div><h2>${esc(p.fr)}</h2><div class="topic">${esc(p.topic)}</div>
    <div class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div>
    <p>${locked ? '🔒 Complete a missão anterior para liberar este lugar.' : p.story}</p>
    ${locked ? '' : `<button class="btn go" id="goBtn" style="width:100%">Y aller ▶ <small style="opacity:.8">(ir)</small></button>`}
    ${save.best[p.id] ? `<p style="margin:10px 0 0;font-size:13px">Recorde: ❤ ${save.best[p.id]}</p>` : ''}`;
  if (!locked) $('goBtn').onclick = () => { A.sfxClick(); walkTo(i); };
  A.sfxPlace(i);
}

// Lua caminha até o lugar
function walkTo(i) {
  $('placePanel').hidden = true;
  $('mapHud').hidden = true;
  controls.enabled = false;
  const from = lua.position.clone();
  const to = W.places[i].spot.clone();
  const dist = from.distanceTo(to);
  G.walk = { from, to, t: 0, dur: Math.min(4, Math.max(1.2, dist / 14)), i };
  G.mode = 'walk';
  if (dist < 0.5) G.walk.dur = 0.01;
}
function updateWalk(dt) {
  const w = G.walk;
  w.t += dt;
  const k = Math.min(1, w.t / w.dur);
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  lua.position.lerpVectors(w.from, w.to, e);
  lua.position.y = Math.abs(Math.sin(w.t * 9)) * 0.25;
  const d = w.to.clone().sub(w.from);
  if (d.lengthSq() > 0.01) lua.rotation.y = Math.atan2(d.x, d.z);
  const sw = Math.sin(w.t * 9) * 0.7;
  legL.rotation.x = sw; legR.rotation.x = -sw; armL.rotation.x = -sw * 0.8; armR.rotation.x = sw * 0.8;
  if (Math.sin(w.t * 9) * Math.sin((w.t - dt) * 9) < 0) A.sfxStep();
  const cam = new THREE.Vector3(lua.position.x - d.x * 0.0, 26, lua.position.z + 30);
  camera.position.lerp(cam, 1 - Math.exp(-2.5 * dt));
  camera.lookAt(lua.position.x, 2, lua.position.z);
  if (k >= 1) {
    legL.rotation.x = legR.rotation.x = armL.rotation.x = armR.rotation.x = 0;
    lua.position.y = 0;
    openBriefing(w.i);
  }
}

// ================================================================== missão
function openBriefing(i) {
  G.place = i;
  save.at = i;
  persist();
  G.mode = 'brief';
  const P = W.places[i];
  lua.position.copy(P.spot);
  lua.rotation.y = Math.atan2(P.dir.x, P.dir.y);
  placeMissionCamera(true);
  const p = PLACES[i];
  $('bNum').textContent = `MISSÃO ${p.id} DE ${PLACES.length} • ${p.icon} ${p.pt.toUpperCase()}`;
  $('bTitle').textContent = p.fr;
  $('bTopic').textContent = p.topic;
  $('bStory').innerHTML = p.story;
  $('bRule').innerHTML = p.rule;
  $('bEx').innerHTML = p.examples.map((e) => `<div class="ex">« ${esc(e)} »</div>`).join('');
  show('briefScreen');
  A.sfxBell();
  A.duck(0.6, 3000);
}
function missionCamTarget() {
  const P = W.places[G.place];
  const wide = innerWidth / innerHeight;
  const back = wide < 1 ? 15 : 10;
  const side = new THREE.Vector3(-P.dir.y, 0, P.dir.x);
  const pos = P.spot.clone().add(new THREE.Vector3(P.dir.x * back, 4.2, P.dir.y * back)).addScaledVector(side, wide < 1 ? 0 : 3);
  const look = P.spot.clone().add(new THREE.Vector3(-P.dir.x * 3, wide < 1 ? 1.6 : 2.6, -P.dir.y * 3)).addScaledVector(side, wide < 1 ? 0 : 1.5);
  return { pos, look };
}
function placeMissionCamera(snap) {
  const { pos, look } = missionCamTarget();
  if (snap) camera.position.copy(pos);
  camera.lookAt(look);
}
function startMission() {
  show(null);
  A.unduck();
  $('missionHud').hidden = false;
  G.mode = 'mission';
  G.k = 0; G.likes = 0; G.combo = 0; G.mistakes = 0;
  $('mPlace').textContent = `${PLACES[G.place].icon} ${PLACES[G.place].fr}`;
  $('console').classList.toggle('hideCats', PLACES[G.place].id === 8);
  startSentence();
}
function startSentence() {
  const p = PLACES[G.place];
  const s = p.sentences[G.k];
  G.placed = []; G.tries = 0; G.hinted = false; G.hintId = -1;
  G.start = performance.now();
  G.tray = shuffle([...s.chunks, ...s.distract].map((x, id) => ({ ...x, id })));
  $('ctxEmo').textContent = s.ctx;
  $('ptLine').textContent = s.pt;
  $('tipLine').hidden = true;
  $('dots').innerHTML = p.sentences.map((_, j) => `<i class="${j < G.k ? 'on' : j === G.k ? 'cur' : ''}"></i>`).join('');
  renderConsole();
  updateHud();
}
const hideCats = () => PLACES[G.place].id === 8;
function blockHtml(b, extra = '', attr = '') {
  return `<button class="block ${extra}" ${attr} data-k="${b.c}" style="--c:${CATS[b.c].color}">${esc(b.t)}</button>`;
}
function renderConsole() {
  const s = PLACES[G.place].sentences[G.k];
  $('slots').innerHTML = s.chunks.map((c, j) => {
    const id = G.placed[j];
    if (id !== undefined) { const b = G.tray.find((x) => x.id === id); return blockHtml(b, `pop ${G.hintId === id ? 'hinted' : ''}`, `data-slot="${j}"`); }
    const cat = hideCats() ? null : CATS[c.c];
    return `<div class="slot" style="${cat ? `--c:${cat.color}` : ''}">${cat ? `${c.c} • ${cat.pt}` : j + 1}</div>`;
  }).join('');
  $('tray').innerHTML = G.tray.map((b) => blockHtml(b, G.placed.includes(b.id) ? 'used' : '', `data-id="${b.id}"`)).join('');
  if (hideCats()) document.querySelectorAll('#console .block').forEach((el) => el.style.setProperty('--c', '#b0305f'));
  $('slots').querySelectorAll('.block').forEach((el) => (el.onclick = () => {
    if (G.mode !== 'mission') return;
    G.placed.splice(+el.dataset.slot, 1);
    A.sfxRemove();
    renderConsole();
  }));
  $('tray').querySelectorAll('.block').forEach((el) => (el.onclick = () => {
    if (G.mode !== 'mission') return;
    const id = +el.dataset.id;
    if (G.placed.includes(id) || G.placed.length >= s.chunks.length) return;
    G.placed.push(id);
    A.sfxPlace(G.placed.length);
    const r = el.getBoundingClientRect();
    const b = G.tray.find((x) => x.id === id);
    sparkle(r.left + r.width / 2, r.top + r.height / 2, CATS[b.c].color);
    A.speak(b.t.replace('’', 'e').replace(/,$/, ''), { rate: 0.9 });
    renderConsole();
  }));
  $('checkBtn').disabled = G.placed.length !== s.chunks.length;
}
function updateHud() {
  $('mLikes').textContent = G.likes.toLocaleString('pt-BR');
  $('combo').textContent = G.combo > 0 ? `• combo ×${1 + 0.25 * Math.min(G.combo, 8)}` : '';
}
function check() {
  if (G.mode !== 'mission') return;
  const s = PLACES[G.place].sentences[G.k];
  const got = G.placed.map((id) => G.tray.find((x) => x.id === id).t);
  const wrong = s.chunks.map((c, j) => got[j] !== c.t);
  if (!wrong.some(Boolean)) return success();
  G.tries++; G.mistakes++; G.combo = 0;
  G.likes = Math.max(0, G.likes - 25);
  A.sfxWrong();
  jolt(0.45);
  G.anim = -1; // Lua faz "não" com a cabeça
  document.querySelectorAll('#slots .block').forEach((el) => { if (wrong[+el.dataset.slot]) el.classList.add('bad'); });
  const first = wrong.indexOf(true);
  toast(`Oh non ! −25 ❤<br><span style="font-size:14px;color:var(--muted)">${hideCats() ? 'Confira a ordem e as terminações.' : `Confira o bloco ${first + 1} (${s.chunks[first].c} • ${CATS[s.chunks[first].c].pt}).`}</span>`);
  if (G.tries >= 2) { $('tipLine').hidden = false; $('tipLine').textContent = '💡 ' + s.tip; }
  updateHud();
}
function hint() {
  if (G.mode !== 'mission') return;
  const s = PLACES[G.place].sentences[G.k];
  let j = 0;
  while (j < G.placed.length && G.tray.find((x) => x.id === G.placed[j]).t === s.chunks[j].t) j++;
  if (j >= s.chunks.length) return;
  G.placed = G.placed.slice(0, j);
  const b = G.tray.find((x) => x.t === s.chunks[j].t && !G.placed.includes(x.id));
  G.placed.push(b.id);
  G.hintId = b.id; G.hinted = true;
  G.likes = Math.max(0, G.likes - 30);
  A.sfxHint();
  renderConsole(); updateHud();
}
function success() {
  const p = PLACES[G.place];
  const s = p.sentences[G.k];
  const secs = (performance.now() - G.start) / 1000;
  const first = G.tries === 0 && !G.hinted;
  G.combo = first ? G.combo + 1 : 0;
  const mult = 1 + 0.25 * Math.min(G.combo, 8);
  const tb = Math.max(0, Math.round(60 - secs));
  const pts = Math.round((100 + (first ? 50 : 0) + tb) * mult);
  G.likes += pts;
  updateHud();
  G.mode = 'celebrate';
  G.anim = 1;
  const last = G.k === p.sentences.length - 1;
  const [word, msg, pt] = CHEERS[Math.floor(Math.random() * CHEERS.length)];
  const dur = celebrate({ word: last ? 'MISSION ACCOMPLIE !' : word, msg, pt, sentence: frase(s), points: pts,
    sub: `${first ? 'de primeira +50 • ' : ''}rapidez +${tb}${mult > 1 ? ` • combo ×${mult}` : ''}`, big: last });
  setTimeout(() => {
    if (G.mode !== 'celebrate') return;
    G.anim = 0;
    if (last) finishPlace(); else { G.k++; G.mode = 'mission'; startSentence(); }
  }, dur * 1000 + 100);
}
function finishPlace() {
  const p = PLACES[G.place];
  const stars = G.mistakes === 0 ? 3 : G.mistakes <= 3 ? 2 : 1;
  const before = followers();
  save.stars[p.id] = Math.max(save.stars[p.id] || 0, stars);
  save.best[p.id] = Math.max(save.best[p.id] || 0, G.likes);
  save.unlocked = Math.max(save.unlocked, Math.min(PLACES.length, G.place + 2));
  persist();
  $('missionHud').hidden = true;
  G.mode = 'done';
  if (G.place === PLACES.length - 1) {
    $('fStars').textContent = `★ ${totalStars()} / ${PLACES.length * 3}`;
    $('fScore').innerHTML = `<b>❤ ${totalLikes().toLocaleString('pt-BR')} curtidas • ${followers().toLocaleString('pt-BR')} seguidores</b>`;
    show('finalScreen');
    G.anim = 1;
    celebrate({ word: 'FÉLICITATIONS !', msg: 'Tu es arrivée sans parler français, et maintenant tu te présentes en français !', pt: 'Você chegou sem falar francês e agora se apresenta em francês!', points: totalLikes(), big: true });
    return;
  }
  $('dPh').textContent = p.icon;
  $('dPlace').textContent = p.fr;
  $('dCap').innerHTML = p.sentences.map((s) => esc(frase(s))).join(' ') + ' <span style="color:var(--rose-d)">#paris #français</span>';
  $('dLikes').textContent = G.likes.toLocaleString('pt-BR');
  $('dFol').textContent = Math.max(0, followers() - before).toLocaleString('pt-BR');
  $('dStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('dInfo').innerHTML = G.mistakes ? `Erros: ${G.mistakes}. Repita para ganhar 3 estrelas!` : '<b>Parfait ! Nenhum erro.</b>';
  show('doneScreen');
}

// animação da Lua parada / comemorando / errando
function animateLua(t, dt) {
  if (G.mode === 'walk') return;
  if (G.anim === 1) {
    lua.position.y = Math.abs(Math.sin(t * 7)) * 0.9;
    lua.rotation.y += dt * 6;
    armL.rotation.z = 2.6 - Math.sin(t * 14) * 0.3; armR.rotation.z = -2.6 + Math.sin(t * 14) * 0.3;
    legL.rotation.x = Math.sin(t * 14) * 0.3; legR.rotation.x = -Math.sin(t * 14) * 0.3;
    return;
  }
  const P = W.places[G.place];
  const face = P ? Math.atan2(P.dir.x, P.dir.y) : 0;
  lua.position.y = 0;
  legL.rotation.x = legR.rotation.x = 0;
  if (G.anim === -1) {
    lua.rotation.y = face + Math.sin(t * 20) * 0.35;
    G.animT = (G.animT || 0) + dt;
    if (G.animT > 0.8) { G.anim = 0; G.animT = 0; }
  } else if (G.mode !== 'map') lua.rotation.y = face;
  // aceno com o braço direito + respiração
  armR.rotation.z = G.mode === 'mission' || G.mode === 'brief' ? -2.4 - Math.sin(t * 6) * 0.35 : -0.12;
  armL.rotation.z = 0.12;
  lua.scale.y = 1.7 * (1 + Math.sin(t * 2.4) * 0.012);
}

// ================================================================== entrada
const ray = new THREE.Raycaster();
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; A.initAudio(); });
canvas.addEventListener('pointerup', (e) => {
  if (G.mode !== 'map' || !downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(W.hits)[0];
  if (hit) selectPlace(hit.object.userData.idx);
});
canvas.addEventListener('pointermove', (e) => {
  if (G.mode !== 'map') return;
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  canvas.style.cursor = ray.intersectObjects(W.hits).length ? 'pointer' : 'grab';
});
addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') toggleMusic();
  if (G.mode === 'mission' && e.key === 'Enter' && !$('checkBtn').disabled) check();
  if (G.mode === 'mission' && e.key === 'Backspace') { G.placed.pop(); A.sfxRemove(); renderConsole(); }
});
function toggleMusic() {
  A.initAudio();
  A.setMusic(!A.isMusicOn());
  document.querySelectorAll('.musicBtn').forEach((b) => (b.textContent = A.isMusicOn() ? '♫' : '🔇'));
}
document.querySelectorAll('.musicBtn').forEach((b) => (b.onclick = toggleMusic));
$('playBtn').onclick = () => { A.initAudio(); A.startMusic(); A.sfxBell(); A.speak('Bonjour Paris !'); enterMap(); };
$('howBtn').onclick = () => { A.initAudio(); show('howScreen'); };
$('howOk').onclick = () => show(G.mode === 'title' ? 'titleScreen' : null);
$('bGo').onclick = () => { A.sfxClick(); startMission(); };
$('checkBtn').onclick = check;
$('clearBtn').onclick = () => { if (G.mode === 'mission') { G.placed = []; A.sfxRemove(); renderConsole(); } };
$('hintBtn').onclick = hint;
$('sayBtn').onclick = () => {
  const txt = G.placed.map((id) => G.tray.find((x) => x.id === id).t).join(' ').replace(/’ /g, '’');
  if (txt) A.speak(txt, { rate: 0.85 });
};
$('ruleBtn').onclick = () => toast(`<div style="color:var(--ink);font-weight:600;font-size:15px;text-align:left">${PLACES[G.place].rule}</div>`, 6000);
$('mapBtn').onclick = () => { if (G.mode === 'mission') { A.sfxClick(); enterMap(); } };
$('dMap').onclick = () => { A.sfxClick(); enterMap(); };
$('dRetry').onclick = () => { A.sfxClick(); openBriefing(G.place); };
$('fMap').onclick = () => { A.sfxClick(); G.anim = 0; enterMap(); };

// ================================================================== loop
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? 66 : 50;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
const clock = new THREE.Clock();
let time = 0;
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  time += dt;
  U.t.value = time;
  if (lua) {
    ring.visible = G.mode === 'map';
    ring.rotation.z += dt * 0.6;
    W.places.forEach((p, i) => { p.label.visible = G.mode === 'map' || G.mode === 'title' || G.mode === 'walk'; p.label.position.y = p.top + 1.2 + Math.sin(time * 2 + i) * 0.2; });
    if (G.mode === 'title') {
      const a = time * 0.05;
      camera.position.set(Math.cos(a) * 70, 38, Math.sin(a) * 70);
      camera.lookAt(0, 0, 0);
    } else if (G.mode === 'map') controls.update();
    else if (G.mode === 'walk') updateWalk(dt);
    else if (G.mode !== 'done' || G.place < PLACES.length) {
      const { pos, look } = missionCamTarget();
      camera.position.lerp(pos, 1 - Math.exp(-3 * dt));
      camera.lookAt(look);
    }
    animateLua(time, dt);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

async function load() {
  const L = new GLTFLoader();
  let n = 0;
  await Promise.all(MODELS.map((m) => new Promise((res, rej) => L.load(window.MODEL_DATA?.[m] || `models/${m}.${window.MODEL_EXT || 'glb'}`, (g) => {
    models[m] = g.scene;
    $('loadbar').firstElementChild.style.width = `${(++n / MODELS.length) * 100}%`;
    res();
  }, undefined, rej))));
  if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  buildWorld();
  const P = W.places[save.at];
  lua.position.copy(P.spot);
  refreshMapHud();
  $('loadTxt').textContent = 'Paris está pronta! O som liga ao começar 🔊';
  $('playBtn').disabled = false;
  window.__ready = true;
}
load().catch((e) => { console.error(e); $('loadTxt').textContent = 'Erro ao carregar os modelos 3D. Abra pelo arquivo único lua-a-paris.html.'; });
loop();
window.__lp = { G, save, PLACES, W, walkTo, openBriefing, startMission, check, enterMap, selectPlace };
